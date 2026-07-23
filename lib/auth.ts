import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"
import { PostgresDialect } from "kysely"
import { Pool } from "pg"

const trustedOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

function baseConfig(database: unknown) {
  return {
    database,
    emailAndPassword: { enabled: true } as const,
    trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000", ...trustedOrigins],
  }
}

async function initAuth() {
  if (!process.env.DATABASE_URL) {
    return betterAuth(baseConfig(memoryAdapter({ user: [], session: [], account: [], verification: [] })))
  }

  const raw = process.env.DATABASE_URL
  if (!raw.startsWith("postgresql://") && !raw.startsWith("postgres://")) {
    console.warn(
      "[LifeDeck] Invalid DATABASE_URL format. Expected: postgresql://user:pass@host:5432/db?sslmode=require\n" +
      "Falling back to memory adapter (data lost on restart)."
    )
    return betterAuth(baseConfig(memoryAdapter({ user: [], session: [], account: [], verification: [] })))
  }

  const ssl = raw.includes("sslmode=require") || raw.includes("sslmode=required")

  return betterAuth(baseConfig(new PostgresDialect({
    pool: new Pool({
      connectionString: raw,
      max: 10,
      ssl: ssl ? { rejectUnauthorized: false } : false,
    }),
  })))
}

export const auth = await initAuth()
