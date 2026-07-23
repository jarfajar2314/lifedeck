"use client"

// Shared client-side cache for /api/data. Any number of components reading the
// same table+space share one in-flight fetch and one cache entry instead of each
// issuing its own network request. Mutations apply to the cache immediately
// (optimistic) and roll back if the server call fails.

type Row = { id: string }
type Listener = () => void

interface Snapshot<T> {
  items: T[]
  loading: boolean
  error: string | null
}

interface Entry<T = unknown> {
  table: string
  spaceId?: string
  snapshot: Snapshot<T>
  promise: Promise<void> | null
}

const store = new Map<string, Entry>()
const listeners = new Map<string, Set<Listener>>()

const EMPTY_SNAPSHOT: Snapshot<never> = { items: [], loading: true, error: null }

const API_PATHS: Record<string, string> = {
  transactions: "/api/transactions",
  tasks: "/api/tasks",
  notes: "/api/notes",
  spaces: "/api/spaces",
  spaceMembers: "/api/spaces/members",
  accounts: "/api/accounts",
  categories: "/api/categories",
  profiles: "/api/profiles",
}

function keyOf(table: string, spaceId?: string): string {
  return spaceId ? `${table}:${spaceId}` : table
}

function emit(k: string): void {
  listeners.get(k)?.forEach((fn) => fn())
}

function entryFor<T>(table: string, spaceId?: string): Entry<T> {
  const k = keyOf(table, spaceId)
  let e = store.get(k) as Entry<T> | undefined
  if (!e) {
    e = { table, spaceId, snapshot: { items: [], loading: true, error: null }, promise: null }
    store.set(k, e)
  }
  return e
}

function setSnapshot<T>(e: Entry<T>, snapshot: Snapshot<T>): void {
  e.snapshot = snapshot
  emit(keyOf(e.table, e.spaceId))
}

function apiPath(table: string): string {
  const path = API_PATHS[table]
  if (!path) throw new Error(`Unknown table: ${table}`)
  return path
}

export async function list<T>(table: string, spaceId?: string): Promise<T[]> {
  const path = apiPath(table)
  const params = new URLSearchParams()
  if (spaceId) params.set("spaceId", spaceId)
  const qs = params.toString()
  const res = await fetch(qs ? `${path}?${qs}` : path, { credentials: "include" })
  if (!res.ok) throw new Error(`${table} list failed: ${res.status}`)
  const json = await res.json()
  return json.data as T[]
}

export async function persist(table: string, op: "add" | "update" | "delete", data?: Record<string, unknown>, id?: string): Promise<void> {
  const path = apiPath(table)
  let res: Response
  if (op === "delete") {
    res = await fetch(`${path}/${id}`, { method: "DELETE", credentials: "include" })
  } else if (op === "add") {
    res = await fetch(path, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  } else {
    res = await fetch(`${path}/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  }
  if (!res.ok) throw new Error(`${table} ${op} failed: ${res.status}`)
}

function load<T>(table: string, spaceId: string | undefined, silent: boolean): Promise<void> {
  const e = entryFor<T>(table, spaceId)
  if (e.promise) return e.promise
  if (!silent) setSnapshot(e, { ...e.snapshot, loading: true, error: null })
  e.promise = list<T>(table, spaceId)
    .then((items) => setSnapshot(e, { items, loading: false, error: null }))
    .catch((err) => setSnapshot(e, { ...e.snapshot, loading: false, error: err instanceof Error ? err.message : String(err) }))
    .finally(() => { e.promise = null })
  return e.promise
}

// Call from an effect on mount. Serves cached data instantly (if present) while
// silently revalidating in the background; shows a loading state only on first load.
export function ensureLoaded<T>(table: string, spaceId: string | undefined): void {
  const e = entryFor<T>(table, spaceId)
  void load<T>(table, spaceId, e.snapshot.items.length > 0)
}

export function subscribe(table: string, spaceId: string | undefined, cb: Listener): () => void {
  const k = keyOf(table, spaceId)
  let set = listeners.get(k)
  if (!set) { set = new Set(); listeners.set(k, set) }
  set.add(cb)
  return () => { set!.delete(cb) }
}

export function getSnapshot<T>(table: string, spaceId: string | undefined): Snapshot<T> {
  return (store.get(keyOf(table, spaceId)) as Entry<T> | undefined)?.snapshot ?? EMPTY_SNAPSHOT
}

export function getServerSnapshot<T>(): Snapshot<T> {
  return EMPTY_SNAPSHOT
}

// Applies `updater` to the cached array synchronously, persists in the background,
// and rolls back to the previous snapshot if the server call fails.
export async function mutateOptimistic<T extends Row>(
  table: string,
  spaceId: string | undefined,
  op: "add" | "update" | "delete",
  updater: (items: T[]) => { items: T[]; record?: Record<string, unknown>; id?: string },
): Promise<void> {
  const e = entryFor<T>(table, spaceId)
  const prev = e.snapshot
  const { items, record, id } = updater(prev.items)
  setSnapshot(e, { items, loading: false, error: null })
  try {
    await persist(table, op, record, id)
  } catch (err) {
    setSnapshot(e, prev)
    throw err
  }
}

// Silently refetches every cached entry for the given tables (any space), used by
// realtime sync so unaffected components don't flash a loading state.
export function invalidate(tables: string[]): void {
  for (const e of store.values()) {
    if (tables.includes(e.table)) void load(e.table, e.spaceId, true)
  }
}

export function clearAll(): void {
  store.clear()
}
