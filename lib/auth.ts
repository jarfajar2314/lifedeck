import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"
import { PostgresDialect } from "kysely"
import { Pool } from "pg"
import dns from "dns/promises"

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

  const url = new URL(raw)
  const ssl = url.searchParams.get("sslmode") !== "disable"

  const ips = await dns.resolve4(url.hostname).catch(() => [])
  if (ips.length === 0) {
    console.warn(
      `[LifeDeck] No IPv4 address found for ${url.hostname}. ` +
      "Supabase direct connections are IPv6-only by default.\n" +
      "Enable the IPv4 add-on in Supabase dashboard or use the session pooler (port 6543).\n" +
      "Falling back to memory adapter (data lost on restart)."
    )
    return betterAuth(baseConfig(memoryAdapter({ user: [], session: [], account: [], verification: [] })))
  }

  return betterAuth(baseConfig(new PostgresDialect({
    pool: new Pool({
      host: ips[0],
      port: Number(url.port) || 5432,
      database: url.pathname.replace(/^\//, ""),
      user: url.username,
      password: url.password,
      max: 10,
      ssl: ssl ? { rejectUnauthorized: false } : false,
    }),
  })))
}

export const auth = await initAuth()
