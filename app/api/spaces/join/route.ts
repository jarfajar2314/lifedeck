import { query } from "@/lib/pool"
import { requireAuth, errorResponse } from "@/lib/api-utils"
import { sseManager } from "@/lib/sse-manager"

export async function POST(request: Request) {
  try {
    const userId = await requireAuth(request)
    let body: { inviteCode?: string }
    try { body = await request.json() } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }) }

    const code = (body.inviteCode || "").toUpperCase()
    if (!code) return Response.json({ error: "inviteCode required" }, { status: 400 })

    const spaces = await query(`SELECT id, name FROM public.spaces WHERE invite_code = $1`, [code])
    if (spaces.length === 0) return Response.json({ error: "Invalid invite code" }, { status: 404 })

    const space = spaces[0]
    const existing = await query(
      `SELECT id FROM public.space_members WHERE space_id = $1 AND user_id = $2`,
      [space.id, userId]
    )
    if (existing.length === 0) {
      await query(
        `INSERT INTO public.space_members (id, space_id, user_id, role, joined_at, created_at) VALUES ($1, $2, $3, 'member', NOW(), NOW())`,
        [crypto.randomUUID(), space.id, userId]
      )
    }
    sseManager.broadcast("sync", { tables: ["spaces", "spaceMembers"] })
    return Response.json({ ok: true, id: space.id, name: space.name })
  } catch (err) { return errorResponse(err) }
}
