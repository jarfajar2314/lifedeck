import { query } from "@/lib/pool"
import { requireAuth, toCamel, coerceNumeric, errorResponse, successResponse, toSnake } from "@/lib/api-utils"
import { sseManager } from "@/lib/sse-manager"

const TABLE = "spaces"

export async function GET(request: Request) {
  try {
    const userId = await requireAuth(request)
    const rows = await query(
      `SELECT s.* FROM public.spaces s INNER JOIN public.space_members m ON m.space_id = s.id WHERE m.user_id = $1`,
      [userId]
    )
    const mapped = rows.map((r) => coerceNumeric(toCamel(TABLE, r)))
    return successResponse(mapped)
  } catch (err) { return errorResponse(err) }
}

export async function POST(request: Request) {
  try {
    const userId = await requireAuth(request)
    let body: Record<string, unknown>
    try { body = await request.json() } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }) }

    const recordId = body.id as string
    if (!recordId) return Response.json({ error: "data.id required" }, { status: 400 })

    const isPersonal = body.personal === true
    if (isPersonal) {
      const existing = await query(
        `SELECT s.id FROM public.spaces s INNER JOIN public.space_members m ON m.space_id = s.id WHERE m.user_id = $1 AND s.personal = TRUE LIMIT 1`,
        [userId]
      )
      if (existing.length > 0 && existing[0].id !== recordId) {
        return Response.json({ error: "Personal space already exists" }, { status: 409 })
      }
    }

    const snake = toSnake(TABLE, body)
    const cols = Object.keys(snake)
    const vals = Object.values(snake)
    const ph = vals.map((_, i) => `$${i + 1}`)
    const updates = cols.map((c) => `${c} = EXCLUDED.${c}`).join(", ")

    await query(`INSERT INTO public.spaces (${cols.join(", ")}) VALUES (${ph.join(", ")}) ON CONFLICT (id) DO UPDATE SET ${updates}`, vals)

    const isMember = await query(
      `SELECT id FROM public.space_members WHERE space_id = $1 AND user_id = $2`,
      [recordId, userId]
    )
    if (isMember.length === 0) {
      const now = new Date().toISOString()
      await query(
        `INSERT INTO public.space_members (id, space_id, user_id, role, joined_at, created_at) VALUES ($1, $2, $3, 'owner', $4, $4)`,
        [crypto.randomUUID(), recordId, userId, now]
      )
    }

    sseManager.broadcast("sync", { tables: ["spaces", "spaceMembers"] })
    return Response.json({ ok: true, id: recordId })
  } catch (err) { return errorResponse(err) }
}
