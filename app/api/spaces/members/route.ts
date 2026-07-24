import { query } from "@/lib/pool"
import { requireAuth, toCamel, coerceNumeric, errorResponse, successResponse, toSnake } from "@/lib/api-utils"
import { sseManager } from "@/lib/sse-manager"

const TABLE = "spaceMembers"

export async function GET(request: Request) {
  try {
    const userId = await requireAuth(request)
    const rows = await query(
      `SELECT m.*, COALESCE(p.display_name, u.name) AS display_name FROM public.space_members m
       INNER JOIN public.spaces s ON s.id = m.space_id
       LEFT JOIN public.profiles p ON p.id = m.user_id
       LEFT JOIN public.user u ON u.id = m.user_id
       WHERE m.space_id IN (SELECT space_id FROM public.space_members WHERE user_id = $1)`,
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

    const spaceId = body.spaceId as string
    if (!spaceId) return Response.json({ error: "spaceId required" }, { status: 400 })

    const snake = toSnake(TABLE, body)
    const cols = Object.keys(snake)
    const vals = Object.values(snake)
    const ph = vals.map((_, i) => `$${i + 1}`)
    const updates = cols.map((c) => `${c} = EXCLUDED.${c}`).join(", ")

    await query(`INSERT INTO public.space_members (${cols.join(", ")}) VALUES (${ph.join(", ")}) ON CONFLICT (id) DO UPDATE SET ${updates}`, vals)
    sseManager.broadcast("sync", { tables: ["spaceMembers"] })
    return Response.json({ ok: true, id: recordId })
  } catch (err) { return errorResponse(err) }
}
