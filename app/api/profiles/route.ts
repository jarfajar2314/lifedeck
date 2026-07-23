import { query } from "@/lib/pool"
import { requireAuth, toCamel, coerceNumeric, errorResponse, successResponse, toSnake } from "@/lib/api-utils"

const TABLE = "profiles"

export async function GET(request: Request) {
  try {
    const userId = await requireAuth(request)
    const rows = await query(`SELECT * FROM public.profiles WHERE id = $1`, [userId])
    const mapped = rows.map((r) => coerceNumeric(toCamel(TABLE, r)))
    return successResponse(mapped)
  } catch (err) { return errorResponse(err) }
}

export async function PUT(request: Request) {
  try {
    const userId = await requireAuth(request)
    let body: Record<string, unknown>
    try { body = await request.json() } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }) }

    body.updatedAt = new Date().toISOString()
    const snake = toSnake(TABLE, body)
    const cols = Object.keys(snake)
    const vals = Object.values(snake)
    const setClauses = cols.map((c, i) => `${c} = $${i + 1}`).join(", ")

    await query(`UPDATE public.profiles SET ${setClauses} WHERE id = $1`, [userId, ...vals])
    return Response.json({ ok: true })
  } catch (err) { return errorResponse(err) }
}
