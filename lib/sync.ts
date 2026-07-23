import db from "@/lib/db"

export type SyncOp = "upsert" | "delete"

export interface SyncOperation {
  id?: number
  table: string
  op: SyncOp
  data?: Record<string, unknown>
  recordId?: string
  createdAt: string
  retries: number
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
  transactions: { spaceId: "space_id", createdBy: "created_by", accountId: "account_id", categoryId: "category_id", loggedAt: "logged_at", createdAt: "created_at" },
  tasks: { spaceId: "space_id", createdBy: "created_by", assignedTo: "assigned_to", isCompleted: "is_completed", dueDate: "due_date", completedAt: "completed_at", createdAt: "created_at" },
  notes: { spaceId: "space_id", createdBy: "created_by", isPinned: "is_pinned", createdAt: "created_at", updatedAt: "updated_at" },
  spaces: { inviteCode: "invite_code", createdAt: "created_at" },
  spaceMembers: { spaceId: "space_id", userId: "user_id", joinedAt: "joined_at", createdAt: "created_at" },
  accounts: { spaceId: "space_id", isDefault: "is_default", createdAt: "created_at" },
  categories: { spaceId: "space_id", createdAt: "created_at" },
  profiles: { displayName: "display_name", avatarUrl: "avatar_url", monthlyBudget: "monthly_budget", themePreference: "theme_preference", accentColor: "accent_color", createdAt: "created_at", updatedAt: "updated_at" },
}

const REVERSE_COLUMN_MAP: Record<string, Record<string, string>> = {}
for (const [table, map] of Object.entries(COLUMN_MAP)) {
  REVERSE_COLUMN_MAP[table] = {}
  for (const [camel, snake] of Object.entries(map)) {
    REVERSE_COLUMN_MAP[table][snake] = camel
  }
}

function sqlTable(dexieTable: string): string {
  return TABLE_MAP[dexieTable] || dexieTable
}

function toSnake(dexieTable: string, data: Record<string, unknown>): Record<string, unknown> {
  const map = COLUMN_MAP[dexieTable] || {}
  const out: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(data)) {
    out[map[key] || key] = val instanceof Date ? val.toISOString() : val
  }
  return out
}

const NUMERIC_FIELDS = new Set(["amount", "monthlyBudget", "monthly_budget"])

function toCamel(dexieTable: string, row: Record<string, unknown>): Record<string, unknown> {
  const map = REVERSE_COLUMN_MAP[dexieTable] || {}
  const out: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(row)) {
    const mapped = map[key] || key
    out[mapped] = NUMERIC_FIELDS.has(mapped) && typeof val === "string" ? parseFloat(val) : val
  }
  return out
}

export function getApiUrl(): string {
  const base = typeof window !== "undefined" ? window.location.origin : ""
  return `${base}/api/sync`
}

export async function pushOperations(ops: SyncOperation[]): Promise<void> {
  if (ops.length === 0) return
  try {
    const res = await fetch(getApiUrl(), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operations: ops.map((op) => {
          const body: Record<string, unknown> = { table: op.table, op: op.op }
          if (op.op === "upsert" && op.data) {
            body.data = toSnake(op.table, op.data)
          }
          if (op.op === "delete" || op.recordId) {
            body.id = op.recordId
          }
          return body
        }),
      }),
    })
    if (res.status === 401) {
      console.warn("[sync] session expired, discarding", ops.length, "pending ops")
      return
    }
    if (!res.ok) throw new Error(`Sync push failed: ${res.status}`)
    await res.json()
  } catch (err) {
    console.warn("[sync] push failed, will retry:", err)
    throw err
  }
}

export async function pullTable(table: string): Promise<Record<string, unknown>[]> {
  const url = `${getApiUrl()}?table=${table}&_=${Date.now()}`
  const res = await fetch(url, { credentials: "include" })
  if (!res.ok) {
    if (res.status === 401) return []
    throw new Error(`Sync pull failed: ${res.status}`)
  }
  const json = await res.json()
  return (json.data || []).map((r: Record<string, unknown>) => toCamel(table, r))
}

export async function pullAll(): Promise<void> {
  const tables = ["transactions", "tasks", "notes", "spaces", "spaceMembers", "accounts", "categories", "profiles"]
  await Promise.all(
    tables.map(async (table) => {
      try {
        const rows = await pullTable(table)
        const t = (db as any)[table]
        const localIds = new Set(await t.toCollection().primaryKeys())
        const serverIds = new Set<string>()
        for (const row of rows) {
          serverIds.add(row.id as string)
          await t.put(row)
        }
        for (const id of localIds) {
          if (!serverIds.has(id as string)) {
            await t.delete(id)
          }
        }
      } catch (err) {
        console.warn(`[sync] pull ${table} failed:`, err)
      }
    })
  )
}

let isProcessing = false
const QUEUE: SyncOperation[] = []

export async function flushNow(): Promise<void> {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null }
  await flush()
}

export function enqueue(op: Omit<SyncOperation, "id" | "createdAt" | "retries">): void {
  QUEUE.push({ ...op, createdAt: new Date().toISOString(), retries: 0 })
  scheduleFlush()
}

export function enqueueMany(ops: Omit<SyncOperation, "id" | "createdAt" | "retries">[]): void {
  for (const op of ops) {
    QUEUE.push({ ...op, createdAt: new Date().toISOString(), retries: 0 })
  }
  scheduleFlush()
}

let flushTimer: ReturnType<typeof setTimeout> | null = null

function scheduleFlush(): void {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    flush()
  }, 2000)
}

async function flush(): Promise<void> {
  if (isProcessing || QUEUE.length === 0) return
  if (typeof navigator !== "undefined" && !navigator.onLine) return

  isProcessing = true
  const batch = QUEUE.splice(0)
  try {
    await pushOperations(batch)
  } catch {
    QUEUE.unshift(...batch)
  } finally {
    isProcessing = false
    if (QUEUE.length > 0) scheduleFlush()
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => { if (QUEUE.length > 0) scheduleFlush() })
}
