import { auth } from "@/lib/auth"
import { Pool } from "pg"

interface SyncOp {
  table: string
  op: string
  id?: string
  data?: Record<string, unknown>
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

const COLUMN_MAP: Record<string, Record<string, string>> = {
  transactions: { space_id: "spaceId", created_by: "createdBy", account_id: "accountId", category_id: "categoryId", logged_at: "loggedAt", created_at: "createdAt" },
  tasks: { space_id: "spaceId", created_by: "createdBy", assigned_to: "assignedTo", is_completed: "isCompleted", due_date: "dueDate", completed_at: "completedAt", created_at: "createdAt" },
  notes: { space_id: "spaceId", created_by: "createdBy", is_pinned: "isPinned", created_at: "createdAt", updated_at: "updatedAt" },
  spaces: { invite_code: "inviteCode", created_at: "createdAt" },
  space_members: { space_id: "spaceId", user_id: "userId", joined_at: "joinedAt", created_at: "createdAt" },
  accounts: { space_id: "spaceId", is_default: "isDefault", created_at: "createdAt" },
  categories: { space_id: "spaceId", created_at: "createdAt" },
  profiles: { display_name: "displayName", avatar_url: "avatarUrl", monthly_budget: "monthlyBudget", theme_preference: "themePreference", accent_color: "accentColor", created_at: "createdAt", updated_at: "updatedAt" },
}

function getPool(): Pool | null {
  const raw = process.env.DATABASE_URL
  if (!raw) return null
  const connStr = raw.replace(/\?sslmode=\w+/, "").replace(/&sslmode=\w+/, "")
  return new Pool({ connectionString: connStr, max: 5, ssl: { rejectUnauthorized: false } })
}

function buildConflictUpdate(cols: string[]): string {
  return cols.map((c) => `${c} = EXCLUDED.${c}`).join(", ")
}

async function query(pool: Pool, sql: string, params: unknown[] = []): Promise<Record<string, unknown>[]> {
  const r = await pool.query(sql, params)
  return r.rows as Record<string, unknown>[]
}

export async function GET(request: Request): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(request.url)
  const table = url.searchParams.get("table")
  if (!table) return Response.json({ error: "table required" }, { status: 400 })

  const pool = getPool()
  if (!pool) return Response.json({ error: "No database configured" }, { status: 500 })

  try {
    const sqlTable = TABLE_MAP[table]
    if (!sqlTable) return Response.json({ error: `Unknown table: ${table}` }, { status: 400 })

    const colMap = COLUMN_MAP[sqlTable] || {}
    const rows = await query(pool, `SELECT * FROM "${sqlTable}"`)

    const mapped = rows.map((r) => {
      const out: Record<string, unknown> = {}
      for (const [key, val] of Object.entries(r)) {
        out[colMap[key] || key] = val
      }
      return out
    })

    return Response.json({ data: mapped })
  } catch (err) {
    console.error("[sync] GET error:", err)
    return Response.json({ error: String(err) }, { status: 500 })
  } finally {
    await pool.end()
  }
}

export async function POST(request: Request): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  let body: { operations?: SyncOp[] }
  try { body = await request.json() } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }) }

  const operations = body.operations
  if (!Array.isArray(operations) || operations.length === 0) {
    return Response.json({ error: "operations array required" }, { status: 400 })
  }

  const pool = getPool()
  if (!pool) return Response.json({ error: "No database configured" }, { status: 500 })

  const results: { table: string; op: string; id?: string; ok: boolean; error?: string }[] = []

  try {
    for (const raw of operations) {
      const op = raw as SyncOp
      const table = op.table
      const sqlTable = TABLE_MAP[table]

      if (!sqlTable) {
        results.push({ table, op: op.op, id: op.id, ok: false, error: `Unknown table: ${table}` })
        continue
      }

      try {
        if (op.op === "delete") {
          await query(pool, `DELETE FROM "${sqlTable}" WHERE id = $1`, [op.id])
          results.push({ table, op: "delete", id: op.id, ok: true })
        } else if (op.op === "upsert") {
          const data = op.data
          if (!data || !data.id) {
            results.push({ table, op: "upsert", ok: false, error: "data.id required" })
            continue
          }
          const cols = Object.keys(data)
          const vals = Object.values(data)
          const placeholders = vals.map((_, i) => `$${i + 1}`)
          const updates = buildConflictUpdate(cols)

          await query(
            pool,
            `INSERT INTO "${sqlTable}" (${cols.join(", ")}) VALUES (${placeholders.join(", ")}) ON CONFLICT (id) DO UPDATE SET ${updates}`,
            vals
          )
          results.push({ table, op: "upsert", id: data.id as string, ok: true })
        } else {
          results.push({ table, op: op.op, ok: false, error: `Unknown op: ${op.op}` })
        }
      } catch (err) {
        results.push({ table, op: op.op, id: op.id, ok: false, error: String(err) })
      }
    }

    return Response.json({ results })
  } catch (err) {
    console.error("[sync] POST error:", err)
    return Response.json({ error: String(err) }, { status: 500 })
  } finally {
    await pool.end()
  }
}

export const runtime = "nodejs"
