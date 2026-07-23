"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import type { Session, User } from "better-auth"

type AuthContextValue = {
  user: User | null
  session: Session | null
  isPending: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isPending, setIsPending] = useState(true)

  useEffect(() => {
    authClient.getSession().then((res) => {
      if (res.data) {
        setUser(res.data.user)
        setSession(res.data.session)
      }
      setIsPending(false)
    })
  }, [])

  const signOut = async () => {
    await authClient.signOut()
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, isPending, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
