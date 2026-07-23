import { query } from "@/lib/pool"
import { requireAuth, requireSpaceAccess, toCamel, coerceNumeric, errorResponse, successResponse, toSnake } from "@/lib/api-utils"
import { sseManager } from "@/lib/sse-manager"

const TABLE = "categories"

export async function GET(request: Request) {
  try {
    const userId = await requireAuth(request)
    const spaceId = new URL(request.url).searchParams.get("spaceId")
    if (!spaceId) return Response.json({ error: "spaceId required" }, { status: 400 })
    await requireSpaceAccess(userId, spaceId)

    const rows = await query(`SELECT * FROM public.categories WHERE space_id = $1`, [spaceId])
    const mapped = rows.map((r) => coerceNumeric(toCamel(TABLE, r)))
    return successResponse(mapped)
  } catch (err) { return errorResponse(err) }
}

export async function POST(request: Request) {
  try {
    const userId = await requireAuth(request)
    let body: Record<string, unknown>
    try { body = await request.json() } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }) }

    const spaceId = body.spaceId as string
    if (!spaceId) return Response.json({ error: "spaceId required" }, { status: 400 })
    await requireSpaceAccess(userId, spaceId)

    const recordId = body.id as string
    if (!recordId) return Response.json({ error: "data.id required" }, { status: 400 })

    const snake = toSnake(TABLE, body)
    const cols = Object.keys(snake)
    const vals = Object.values(snake)
    const ph = vals.map((_, i) => `$${i + 1}`)
    const updates = cols.map((c) => `${c} = EXCLUDED.${c}`).join(", ")

    await query(`INSERT INTO public.categories (${cols.join(", ")}) VALUES (${ph.join(", ")}) ON CONFLICT (id) DO UPDATE SET ${updates}`, vals)
    sseManager.broadcast("sync", { tables: ["categories"] })
    return Response.json({ ok: true, id: recordId })
  } catch (err) { return errorResponse(err) }
}
