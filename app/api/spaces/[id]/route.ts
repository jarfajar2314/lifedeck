import { query } from "@/lib/pool"
import { requireAuth, requireSpaceAccess, errorResponse, toSnake } from "@/lib/api-utils"
import { sseManager } from "@/lib/sse-manager"

const TABLE = "spaces"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth(request)
    const { id } = await params
    const body: Record<string, unknown> = await request.json()

    await requireSpaceAccess(userId, id)

    const snake = toSnake(TABLE, body)
    const cols = Object.keys(snake)
    const vals = Object.values(snake)
    const setClauses = cols.map((c, i) => `${c} = $${i + 2}`).join(", ")

    await query(`UPDATE public.spaces SET ${setClauses} WHERE id = $1`, [id, ...vals])
    sseManager.broadcast("sync", { tables: ["spaces"] })
    return Response.json({ ok: true })
  } catch (err) { return errorResponse(err) }
}
