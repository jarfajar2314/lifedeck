import { getAuth } from "@/lib/auth"
import { Pool } from "pg"
import { sseManager } from "@/lib/sse-manager"

let pool: Pool | null = null
function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: (process.env.DATABASE_URL || "").replace(/\?sslmode=\w+/, "").replace(/&sslmode=\w+/, ""),
      max: 5,
      ssl: { rejectUnauthorized: false },
    })
  }
  return pool
}

const TABLE_MAP: Record<string, string> = {
  transactions: "transactions",
  tasks: "tasks",
  notes: "notes",
  spaces: "spaces",
  spaceMembers: "space_members",
  accounts: "accounts",
  categories: "categories",
  profiles: "profiles",
}

const COL_MAP: Record<string, Record<string, string>> = {
  transactions: { spaceId: "space_id", createdBy: "created_by", accountId: "account_id", categoryId: "category_id", loggedAt: "logged_at", createdAt: "created_at" },
  tasks: { spaceId: "space_id", createdBy: "created_by", assignedTo: "assigned_to", isCompleted: "is_completed", dueDate: "due_date", completedAt: "completed_at", createdAt: "created_at" },
  notes: { spaceId: "space_id", createdBy: "created_by", isPinned: "is_pinned", createdAt: "created_at", updatedAt: "updated_at" },
  spaces: { inviteCode: "invite_code", createdAt: "created_at" },
  spaceMembers: { spaceId: "space_id", userId: "user_id", defaultAccountId: "default_account_id", joinedAt: "joined_at", createdAt: "created_at" },
  accounts: { spaceId: "space_id", isDefault: "is_default", createdAt: "created_at" },
  categories: { spaceId: "space_id", createdAt: "created_at" },
  profiles: { displayName: "display_name", avatarUrl: "avatar_url", monthlyBudget: "monthly_budget", themePreference: "theme_preference", accentColor: "accent_color", createdAt: "created_at", updatedAt: "updated_at" },
}

const REV_COL_MAP: Record<string, Record<string, string>> = {}
for (const [t, m] of Object.entries(COL_MAP)) {
  REV_COL_MAP[t] = {}
  for (const [c, s] of Object.entries(m)) REV_COL_MAP[t][s] = c
}

function toSnake(table: string, data: Record<string, unknown>): Record<string, unknown> {
  const map = COL_MAP[table] || {}
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) out[map[k] || k] = v instanceof Date ? v.toISOString() : v
  return out
}

function toCamel(table: string, row: Record<string, unknown>): Record<string, unknown> {
  const map = REV_COL_MAP[table] || {}
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) out[map[k] || k] = v
  return out
}

const NUMERIC = new Set(["amount", "monthlyBudget"])

function coerceNumeric(row: Record<string, unknown>): Record<string, unknown> {
  for (const k of Object.keys(row)) {
    if (NUMERIC.has(k) && typeof row[k] === "string") row[k] = parseFloat(row[k] as string)
  }
  return row
}

async function query(sql: string, params: unknown[] = []): Promise<Record<string, unknown>[]> {
  const r = await getPool().query(sql, params)
  return r.rows as Record<string, unknown>[]
}

export async function GET(request: Request): Promise<Response> {
  const session = await (await getAuth()).api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(request.url)
  const table = url.searchParams.get("table")
  const spaceId = url.searchParams.get("spaceId")
  if (!table) return Response.json({ error: "table required" }, { status: 400 })

  const sqlTable = TABLE_MAP[table]
  if (!sqlTable) return Response.json({ error: `Unknown table: ${table}` }, { status: 400 })

  try {
    const userId = session.user.id
    let where = ""
    const params: unknown[] = []
    if (sqlTable === "profiles") {
      where = "WHERE id = $1"
      params.push(userId)
    } else if (sqlTable === "space_members") {
      where = "WHERE user_id = $1"
      params.push(userId)
    } else if (sqlTable === "spaces") {
      where = "WHERE id IN (SELECT space_id FROM space_members WHERE user_id = $1)"
      params.push(userId)
    } else {
      where = "WHERE space_id IN (SELECT space_id FROM space_members WHERE user_id = $1)"
      params.push(userId)
      if (spaceId) {
        where += " AND space_id = $2"
        params.push(spaceId)
      }
    }

    const rows = await query(`SELECT * FROM "${sqlTable}" ${where}`, params)
    const mapped = rows.map((r) => coerceNumeric(toCamel(table, r)))
    return Response.json({ data: mapped }, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    console.error("[data] GET error:", err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<Response> {
  const session = await (await getAuth()).api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  let body: { table?: string; op?: string; data?: Record<string, unknown>; id?: string }
  try { body = await request.json() } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }) }

  const { table, op, data, id } = body
  if (!table || !op) return Response.json({ error: "table and op required" }, { status: 400 })

  const sqlTable = TABLE_MAP[table]
  if (!sqlTable) return Response.json({ error: `Unknown table: ${table}` }, { status: 400 })

  try {
    if (op === "delete") {
      if (!id) return Response.json({ error: "id required for delete" }, { status: 400 })
      await query(`DELETE FROM "${sqlTable}" WHERE id = $1`, [id])
      sseManager.broadcast("sync", { tables: [table] })
      return Response.json({ ok: true })
    }

    if (op === "add" || op === "update") {
      if (!data) return Response.json({ error: "data required" }, { status: 400 })
      const recordId = data.id as string
      if (!recordId) return Response.json({ error: "data.id required" }, { status: 400 })

      const snake = toSnake(table, data)
      const cols = Object.keys(snake)
      const vals = Object.values(snake)
      const placeholders = vals.map((_, i) => `$${i + 1}`)
      const updates = cols.map((c) => `${c} = EXCLUDED.${c}`).join(", ")

      await query(
        `INSERT INTO "${sqlTable}" (${cols.join(", ")}) VALUES (${placeholders.join(", ")}) ON CONFLICT (id) DO UPDATE SET ${updates}`,
        vals
      )
      sseManager.broadcast("sync", { tables: [table] })
      return Response.json({ ok: true, id: recordId })
    }

    return Response.json({ error: `Unknown op: ${op}` }, { status: 400 })
  } catch (err) {
    console.error("[data] POST error:", err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

export const runtime = "nodejs"
