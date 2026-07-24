import { getPool, query } from "@/lib/pool"
import { requireAuth, requireSpaceAccess, errorResponse, toSnake } from "@/lib/api-utils"
import { sseManager } from "@/lib/sse-manager"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth(request)
    const { id } = await params
    const body: Record<string, unknown> = await request.json()

    const existing = await query(`SELECT space_id FROM public.accounts WHERE id = $1`, [id])
    if (existing.length === 0) return Response.json({ error: "Not found" }, { status: 404 })
    await requireSpaceAccess(userId, existing[0].space_id as string)

    const snake = toSnake("accounts", body)
    const cols = Object.keys(snake)
    const vals = Object.values(snake)
    const setClauses = cols.map((c, i) => `${c} = $${i + 2}`).join(", ")

    await query(`UPDATE public.accounts SET ${setClauses} WHERE id = $1`, [id, ...vals])
    sseManager.broadcast("sync", { tables: ["accounts"] })
    return Response.json({ ok: true })
  } catch (err) { return errorResponse(err) }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth(request)
    const { id } = await params

    const existing = await query(`SELECT space_id FROM public.accounts WHERE id = $1`, [id])
    if (existing.length === 0) return Response.json({ error: "Not found" }, { status: 404 })
    await requireSpaceAccess(userId, existing[0].space_id as string)

    await query(`DELETE FROM public.accounts WHERE id = $1`, [id])
    sseManager.broadcast("sync", { tables: ["accounts"] })
    return Response.json({ ok: true })
  } catch (err) { return errorResponse(err) }
}
