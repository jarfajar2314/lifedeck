import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"
import { PostgresDialect } from "kysely"
import { Pool } from "pg"

const trustedOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

function createPostgresDialect() {
  const raw = process.env.DATABASE_URL!
  if (!raw.startsWith("postgresql://") && !raw.startsWith("postgres://")) {
    throw new Error(
      "DATABASE_URL must start with postgresql:// or postgres://\n" +
      "Expected format: postgresql://user:password@host:5432/database\n" +
      "Get it from Supabase: Project Settings → Database → Connection string (URI)"
    )
  }
  const url = new URL(raw)
  return new PostgresDialect({
    pool: new Pool({
      host: url.hostname,
      port: Number(url.port) || 5432,
      database: url.pathname.replace(/^\//, ""),
      user: url.username,
      password: url.password,
      max: 10,
    }),
  })
}

const database = process.env.DATABASE_URL
  ? createPostgresDialect()
  : memoryAdapter({ user: [], session: [], account: [], verification: [] })

export const auth = betterAuth({
  database,
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    ...trustedOrigins,
  ],
})
