import { query, getPool } from "@/lib/pool"
import { requireAuth, requireSpaceAccess, toCamel, coerceNumeric, errorResponse, successResponse, toSnake } from "@/lib/api-utils"
import { sseManager } from "@/lib/sse-manager"
import { getTransactionSign } from "@/lib/transaction-math"

const TABLE = "transactions"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const pool = getPool()
  const client = await pool.connect()
  try {
    const userId = await requireAuth(request)
    const { id } = await params
    const body: Record<string, unknown> = await request.json()

    const existing = await query(`SELECT space_id, account_id, amount, type, transfer_direction FROM "${TABLE}" WHERE id = $1`, [id])
    if (existing.length === 0) return Response.json({ error: "Not found" }, { status: 404 })
    await requireSpaceAccess(userId, existing[0].space_id as string)

    const oldRow = existing[0]

    await client.query("BEGIN")

    const snake = toSnake(TABLE, body)
    delete snake.creator_name
    const cols = Object.keys(snake)
    const vals = Object.values(snake)
    if (cols.length === 0) return Response.json({ ok: true })
    const setClauses = cols.map((c, i) => `${c} = $${i + 2}`).join(", ")

    await client.query(`UPDATE "${TABLE}" SET ${setClauses} WHERE id = $1`, [id, ...vals])

    // Reverse old balance effect
    const oldAccountId = oldRow.account_id as string | undefined
    const oldAmount = Number(oldRow.amount) || 0
    const oldType = oldRow.type as string
    const oldDirection = oldRow.transfer_direction as string | undefined
    if (oldAccountId && oldAmount > 0) {
      const oldSign = -getTransactionSign(oldType, oldDirection)
      if (oldSign !== 0) {
        await client.query(
          `UPDATE public.accounts SET balance = balance + ($1::numeric * $2::numeric) WHERE id = $3`,
          [oldAmount, oldSign, oldAccountId]
        )
      }
    }

    // Apply new balance effect
    const newAccountId = body.accountId as string | undefined
    const newAmount = Number(body.amount) || 0
    const newType = body.type as string
    const newDirection = body.transferDirection as string | undefined
    if (newAccountId && newAmount > 0) {
      const newSign = getTransactionSign(newType, newDirection)
      if (newSign !== 0) {
        await client.query(
          `UPDATE public.accounts SET balance = balance + ($1::numeric * $2::numeric) WHERE id = $3`,
          [newAmount, newSign, newAccountId]
        )
      }
    }

    await client.query("COMMIT")
    sseManager.broadcast("sync", { tables: ["transactions", "accounts"] })
    return Response.json({ ok: true })
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {})
    return errorResponse(err)
  } finally {
    client.release()
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const pool = getPool()
  const client = await pool.connect()
  try {
    const userId = await requireAuth(request)
    const { id } = await params

    const existing = await query(`SELECT space_id, account_id, amount, type, transfer_direction FROM "${TABLE}" WHERE id = $1`, [id])
    if (existing.length === 0) return Response.json({ error: "Not found" }, { status: 404 })
    await requireSpaceAccess(userId, existing[0].space_id as string)

    const oldRow = existing[0]

    await client.query("BEGIN")

    await client.query(`DELETE FROM "${TABLE}" WHERE id = $1`, [id])

    // Reverse old balance effect
    const oldAccountId = oldRow.account_id as string | undefined
    const oldAmount = Number(oldRow.amount) || 0
    const oldType = oldRow.type as string
    const oldDirection = oldRow.transfer_direction as string | undefined
    if (oldAccountId && oldAmount > 0) {
      const oldSign = -getTransactionSign(oldType, oldDirection)
      if (oldSign !== 0) {
        await client.query(
          `UPDATE public.accounts SET balance = balance + ($1::numeric * $2::numeric) WHERE id = $3`,
          [oldAmount, oldSign, oldAccountId]
        )
      }
    }

    await client.query("COMMIT")
    sseManager.broadcast("sync", { tables: ["transactions", "accounts"] })
    return Response.json({ ok: true })
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {})
    return errorResponse(err)
  } finally {
    client.release()
  }
}
