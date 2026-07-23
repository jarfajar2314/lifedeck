"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import db from "@/lib/db"
import type { Session, User } from "better-auth"

type AuthContextValue = {
  user: User | null
  session: Session | null
  isPending: boolean
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isPending, setIsPending] = useState(true)

  const fetchSession = async () => {
    const res = await authClient.getSession()
    if (res.data) {
      setUser(res.data.user)
      setSession(res.data.session)
    } else {
      setUser(null)
      setSession(null)
    }
    setIsPending(false)
  }

  useEffect(() => { fetchSession() }, [])

  const signOut = async () => {
    try { await Promise.all(db.tables.map((t) => t.clear())) } catch {}
    await authClient.signOut()
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, isPending, signOut, refresh: fetchSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
