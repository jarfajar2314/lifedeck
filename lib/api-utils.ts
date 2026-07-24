import { getAuth } from "@/lib/auth"
import { getPool } from "@/lib/pool"

const COL_MAP: Record<string, Record<string, string>> = {
  transactions: { spaceId: "space_id", createdBy: "created_by", accountId: "account_id", categoryId: "category_id", loggedAt: "logged_at", createdAt: "created_at", creatorName: "creator_name" },
  tasks: { spaceId: "space_id", createdBy: "created_by", assignedTo: "assigned_to", isCompleted: "is_completed", dueDate: "due_date", completedAt: "completed_at", createdAt: "created_at" },
  notes: { spaceId: "space_id", createdBy: "created_by", isPinned: "is_pinned", createdAt: "created_at", updatedAt: "updated_at" },
  spaces: { inviteCode: "invite_code", createdAt: "created_at" },
  spaceMembers: { spaceId: "space_id", userId: "user_id", defaultAccountId: "default_account_id", joinedAt: "joined_at", createdAt: "created_at", displayName: "display_name" },
  accounts: { spaceId: "space_id", isDefault: "is_default", createdAt: "created_at" },
  categories: { spaceId: "space_id", createdAt: "created_at" },
  categoryKeywords: { spaceId: "space_id", categoryId: "category_id", createdAt: "created_at" },
  profiles: { displayName: "display_name", avatarUrl: "avatar_url", monthlyBudget: "monthly_budget", themePreference: "theme_preference", accentColor: "accent_color", createdAt: "created_at", updatedAt: "updated_at" },
}

const REV_COL_MAP: Record<string, Record<string, string>> = {}
for (const [t, m] of Object.entries(COL_MAP)) {
  REV_COL_MAP[t] = {}
  for (const [c, s] of Object.entries(m)) REV_COL_MAP[t][s] = c
}

const NUMERIC = new Set(["amount", "monthlyBudget", "balance"])

export function toSnake(table: string, data: Record<string, unknown>): Record<string, unknown> {
  const map = COL_MAP[table] || {}
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) out[map[k] || k] = v instanceof Date ? v.toISOString() : v
  return out
}

export function toCamel(table: string, row: Record<string, unknown>): Record<string, unknown> {
  const map = REV_COL_MAP[table] || {}
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) out[map[k] || k] = v
  return out
}

export function coerceNumeric(row: Record<string, unknown>): Record<string, unknown> {
  for (const k of Object.keys(row)) {
    if (NUMERIC.has(k) && typeof row[k] === "string") row[k] = parseFloat(row[k] as string)
  }
  return row
}

export async function requireAuth(request: Request): Promise<string> {
  const session = await (await getAuth()).api.getSession({ headers: request.headers })
  if (!session) throw new ApiError(401, "Unauthorized")
  return session.user.id
}

export async function requireSpaceAccess(userId: string, spaceId: string): Promise<void> {
  const pool = getPool()
  const r = await pool.query(
    `SELECT 1 FROM public.space_members WHERE space_id = $1 AND user_id = $2 LIMIT 1`,
    [spaceId, userId]
  )
  if (r.rows.length === 0) throw new ApiError(403, "Forbidden")
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = "ApiError"
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status })
  }
  console.error("[api] error:", error)
  return Response.json({ error: String(error) }, { status: 500 })
}

export function successResponse(data: unknown, status = 200): Response {
  return Response.json({ data }, { status })
}

export function okResponse(): Response {
  return Response.json({ ok: true })
}
