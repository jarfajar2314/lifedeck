import { Pool } from "pg"

let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: (process.env.DATABASE_URL || "").replace(/\?sslmode=\w+/, "").replace(/&sslmode=\w+/, ""),
      max: 10,
      family: 4,
      ssl: { rejectUnauthorized: false },
    } as any)
  }
  return pool
}

export async function query(sql: string, params: unknown[] = []): Promise<Record<string, unknown>[]> {
  const r = await getPool().query(sql, params)
  return r.rows as Record<string, unknown>[]
}
