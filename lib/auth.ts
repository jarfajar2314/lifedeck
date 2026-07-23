import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"
import { PostgresDialect } from "kysely"
import { Pool } from "pg"
import dns from "dns/promises"

const trustedOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

async function initAuth() {
  if (!process.env.DATABASE_URL) {
    return betterAuth({
      database: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
      emailAndPassword: { enabled: true },
      trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000", ...trustedOrigins],
    })
  }

  const raw = process.env.DATABASE_URL
  if (!raw.startsWith("postgresql://") && !raw.startsWith("postgres://")) {
    throw new Error(
      "DATABASE_URL must start with postgresql:// or postgres://\n" +
      "Expected: postgresql://user:password@host:5432/database?sslmode=require"
    )
  }

  const url = new URL(raw)
  const ssl = url.searchParams.get("sslmode") !== "disable"

  let host = url.hostname
  const ips = await dns.resolve4(host).catch(() => [])
  if (ips.length > 0) host = ips[0]

  return betterAuth({
    database: new PostgresDialect({
      pool: new Pool({
        host,
        port: Number(url.port) || 5432,
        database: url.pathname.replace(/^\//, ""),
        user: url.username,
        password: url.password,
        max: 10,
        ssl: ssl ? { rejectUnauthorized: false } : false,
      }),
    }),
    emailAndPassword: { enabled: true },
    trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000", ...trustedOrigins],
  })
}

export const auth = await initAuth()
