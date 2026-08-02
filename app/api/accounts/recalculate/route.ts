import { getPool } from "@/lib/pool"
import { requireAuth, requireSpaceAccess, errorResponse } from "@/lib/api-utils"
import { getTransactionSign } from "@/lib/transaction-math"

export async function POST(request: Request) {
  try {
    const userId = await requireAuth(request)
    const body: Record<string, unknown> = await request.json()
    const spaceId = body.spaceId as string
    if (!spaceId) return Response.json({ error: "spaceId required" }, { status: 400 })
    await requireSpaceAccess(userId, spaceId)

    const pool = getPool()

    await pool.query("BEGIN")

    await pool.query(`UPDATE public.accounts SET balance = 0 WHERE space_id = $1`, [spaceId])

    const { rows: txs } = await pool.query(
      `SELECT account_id, amount, type, transfer_direction FROM public.transactions WHERE space_id = $1 AND account_id IS NOT NULL`,
      [spaceId]
    )

    for (const tx of txs) {
      const sign = getTransactionSign(tx.type, tx.transfer_direction)
      if (sign !== 0 && tx.account_id) {
        await pool.query(
          `UPDATE public.accounts SET balance = balance + ($1::numeric * $2::numeric) WHERE id = $3`,
          [tx.amount, sign, tx.account_id]
        )
      }
    }

    await pool.query("COMMIT")

    return Response.json({ ok: true, recalculated: txs.length })
  } catch (err) {
    const pool = getPool()
    await pool.query("ROLLBACK").catch(() => {})
    return errorResponse(err)
  }
}
