import { query, getPool } from "@/lib/pool"
import { requireAuth, requireSpaceAccess, toCamel, coerceNumeric, errorResponse, successResponse, toSnake } from "@/lib/api-utils"
import { sseManager } from "@/lib/sse-manager"
import { getTransactionSign } from "@/lib/transaction-math"

const TABLE = "transactions"

export async function GET(request: Request) {
  try {
    const userId = await requireAuth(request)
    const spaceId = new URL(request.url).searchParams.get("spaceId")
    if (!spaceId) return Response.json({ error: "spaceId required" }, { status: 400 })
    await requireSpaceAccess(userId, spaceId)

    const rows = await query(
      `SELECT t.*, COALESCE(p.display_name, u.name) AS creator_name FROM public.transactions t
       LEFT JOIN public.profiles p ON p.id = t.created_by
       LEFT JOIN public.user u ON u.id = t.created_by
       WHERE t.space_id = $1`,
      [spaceId]
    )
    const mapped = rows.map((r) => coerceNumeric(toCamel(TABLE, r)))
    return successResponse(mapped)
  } catch (err) { return errorResponse(err) }
}

export async function POST(request: Request) {
  const pool = getPool()
  const client = await pool.connect()
  try {
    const userId = await requireAuth(request)
    let body: Record<string, unknown>
    try { body = await request.json() } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }) }

    const spaceId = body.spaceId as string
    if (!spaceId) return Response.json({ error: "spaceId required" }, { status: 400 })
    await requireSpaceAccess(userId, spaceId)

    const recordId = body.id as string
    if (!recordId) return Response.json({ error: "data.id required" }, { status: 400 })

    const txType = body.type as string
    const txAmount = Number(body.amount) || 0
    const accountId = body.accountId as string | undefined
    const txDirection = body.transferDirection as string | undefined

    await client.query("BEGIN")

    const snake = toSnake(TABLE, body)
    const cols = Object.keys(snake)
    const vals = Object.values(snake)
    const ph = vals.map((_, i) => `$${i + 1}`)
    const updates = cols.map((c) => `${c} = EXCLUDED.${c}`).join(", ")

    await client.query(`INSERT INTO "${TABLE}" (${cols.join(", ")}) VALUES (${ph.join(", ")}) ON CONFLICT (id) DO UPDATE SET ${updates}`, vals)

    if (accountId && txAmount > 0) {
      const sign = getTransactionSign(txType, txDirection)
      if (sign !== 0) {
        await client.query(
          `UPDATE public.accounts SET balance = balance + ($1::numeric * $2::numeric) WHERE id = $3`,
          [txAmount, sign, accountId]
        )
      }
    }

    await client.query("COMMIT")
    sseManager.broadcast("sync", { tables: ["transactions", "accounts"] })
    return Response.json({ ok: true, id: recordId })
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {})
    return errorResponse(err)
  } finally {
    client.release()
  }
}
