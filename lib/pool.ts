import { Pool } from "pg"

let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: (process.env.DATABASE_URL || "").replace(/\?sslmode=\w+/, "").replace(/&sslmode=\w+/, ""),
      max: 10,
      ssl: { rejectUnauthorized: false },
    })
  }
  return pool
}

export async function query(sql: string, params: unknown[] = []): Promise<Record<string, unknown>[]> {
  const r = await getPool().query(sql, params)
  return r.rows as Record<string, unknown>[]
}
