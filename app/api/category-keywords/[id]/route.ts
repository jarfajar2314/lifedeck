import { query } from "@/lib/pool"
import { requireAuth, errorResponse, toSnake } from "@/lib/api-utils"
import { sseManager } from "@/lib/sse-manager"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth(request)
    const { id } = await params

    const existing = await query(`SELECT space_id FROM public.category_keywords WHERE id = $1`, [id])
    if (existing.length === 0) return Response.json({ error: "Not found" }, { status: 404 })

    await query(`DELETE FROM public.category_keywords WHERE id = $1`, [id])
    sseManager.broadcast("sync", { tables: ["categoryKeywords"] })
    return Response.json({ ok: true })
  } catch (err) { return errorResponse(err) }
}
