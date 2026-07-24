import { query } from "@/lib/pool"
import { requireAuth, requireSpaceAccess, errorResponse } from "@/lib/api-utils"
import { sseManager } from "@/lib/sse-manager"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth(request)
    const { id } = await params

    const existing = await query(`SELECT personal FROM public.spaces WHERE id = $1`, [id])
    if (existing.length === 0) return Response.json({ error: "Not found" }, { status: 404 })
    if (existing[0].personal) return Response.json({ error: "Cannot delete personal space" }, { status: 403 })

    await requireSpaceAccess(userId, id)

    await query(`DELETE FROM public.transactions WHERE space_id = $1`, [id])
    await query(`DELETE FROM public.tasks WHERE space_id = $1`, [id])
    await query(`DELETE FROM public.notes WHERE space_id = $1`, [id])
    await query(`DELETE FROM public.accounts WHERE space_id = $1`, [id])
    await query(`DELETE FROM public.categories WHERE space_id = $1`, [id])
    await query(`DELETE FROM public.category_keywords WHERE space_id = $1`, [id])
    await query(`DELETE FROM public.space_members WHERE space_id = $1`, [id])
    await query(`DELETE FROM public.spaces WHERE id = $1`, [id])

    sseManager.broadcast("sync", { tables: ["spaces", "spaceMembers", "transactions", "tasks", "notes", "accounts", "categories", "categoryKeywords"] })
    return Response.json({ ok: true })
  } catch (err) { return errorResponse(err) }
}
