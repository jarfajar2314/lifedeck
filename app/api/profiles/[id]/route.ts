import { query } from "@/lib/pool"
import { requireAuth, errorResponse, toSnake } from "@/lib/api-utils"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth(request)
    const { id } = await params
    if (id !== userId) return Response.json({ error: "Forbidden" }, { status: 403 })

    const body: Record<string, unknown> = await request.json()
    body.updatedAt = new Date().toISOString()
    const snake = toSnake("profiles", body)
    const cols = Object.keys(snake)
    const vals = Object.values(snake)
    const setClauses = cols.map((c, i) => `${c} = $${i + 2}`).join(", ")

    await query(`UPDATE public.profiles SET ${setClauses} WHERE id = $1`, [userId, ...vals])
    return Response.json({ ok: true })
  } catch (err) { return errorResponse(err) }
}
