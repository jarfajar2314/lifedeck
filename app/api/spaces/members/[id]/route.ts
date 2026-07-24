import { query } from "@/lib/pool"
import { requireAuth, requireSpaceAccess, errorResponse, toSnake } from "@/lib/api-utils"
import { sseManager } from "@/lib/sse-manager"

const TABLE = "spaceMembers"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth(request)
    const { id } = await params
    const body: Record<string, unknown> = await request.json()

    const existing = await query(`SELECT space_id FROM public.space_members WHERE id = $1`, [id])
    if (existing.length === 0) return Response.json({ error: "Not found" }, { status: 404 })
    await requireSpaceAccess(userId, existing[0].space_id as string)

    const snake = toSnake(TABLE, body)
    const cols = Object.keys(snake)
    const vals = Object.values(snake)
    const setClauses = cols.map((c, i) => `${c} = $${i + 2}`).join(", ")

    await query(`UPDATE public.space_members SET ${setClauses} WHERE id = $1`, [id, ...vals])
    sseManager.broadcast("sync", { tables: ["spaceMembers"] })
    return Response.json({ ok: true })
  } catch (err) { return errorResponse(err) }
}
