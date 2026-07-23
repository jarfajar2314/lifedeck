import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"
import { PostgresDialect } from "kysely"
import pg from "pg"

const trustedOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

const database = process.env.DATABASE_URL
  ? new PostgresDialect({ pool: new pg.Pool({ connectionString: process.env.DATABASE_URL }) })
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
