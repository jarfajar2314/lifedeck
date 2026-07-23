import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"

export const auth = betterAuth({
  database: memoryAdapter({}),
  emailAndPassword: {
    enabled: true,
  },
})
