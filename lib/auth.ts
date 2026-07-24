import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"
import { PostgresDialect } from "kysely"
import { getPool } from "@/lib/pool"

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

  const pool = getPool()

  return betterAuth({
    ...baseConfig(new PostgresDialect({ pool })),
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            try {
              const spaceId = crypto.randomUUID()
              const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()

              const displayName = (user as any).name || null
              await pool.query(
                `INSERT INTO public.profiles (id, display_name, currency, monthly_budget, theme_preference, accent_color, created_at, updated_at) VALUES ($1, $2, 'IDR', 0, 'dark', 'emerald', NOW(), NOW()) ON CONFLICT DO NOTHING`,
                [user.id, displayName]
              )

              await pool.query(
                `INSERT INTO public.spaces (id, name, invite_code, created_at) VALUES ($1, 'Personal', $2, NOW()) ON CONFLICT DO NOTHING`,
                [spaceId, inviteCode]
              )

              await pool.query(
                `INSERT INTO public.space_members (id, space_id, user_id, role, joined_at, created_at) VALUES ($1, $2, $3, 'owner', NOW(), NOW()) ON CONFLICT DO NOTHING`,
                [crypto.randomUUID(), spaceId, user.id]
              )
            } catch (err) {
              console.error("[auth] failed to create personal space:", err)
            }
          },
        },
      },
    },
  })
}

let _auth: Awaited<ReturnType<typeof initAuth>> | null = null

export async function getAuth() {
  if (!_auth) {
    _auth = await initAuth()
  }
  return _auth!
}
