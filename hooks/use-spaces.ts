"use client"

import { useEffect, useState, useCallback, useMemo, useSyncExternalStore } from "react"
import type { Space, SpaceMember } from "@/lib/db"
import { uid } from "@/lib/uid"
import * as store from "@/lib/data-store"

export type SpaceWithRole = Space & { role: "owner" | "member" }

function useTable<T>(table: string) {
  const subscribeFn = useCallback((cb: () => void) => store.subscribe(table, undefined, cb), [table])
  return useSyncExternalStore(
    subscribeFn,
    () => store.getSnapshot<T>(table, undefined),
    () => store.getServerSnapshot<T>()
  )
}

export function useSpaces(userId?: string) {
  useEffect(() => {
    store.ensureLoaded<Space>("spaces", undefined)
    store.ensureLoaded<SpaceMember>("spaceMembers", undefined)
  }, [])

  const { items: allSpaces, loading: spacesLoading } = useTable<Space>("spaces")
  const { items: members } = useTable<SpaceMember>("spaceMembers")

  const spaces: SpaceWithRole[] = useMemo(
    () => allSpaces.map((s) => ({
      ...s,
      role: (members.find((m) => m.spaceId === s.id)?.role ?? "member") as "owner" | "member",
    })),
    [allSpaces, members]
  )

  const [currentId, setCurrentIdState] = useState<string>("")
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    if (!userId || spacesLoading) return

    const initCurrent = async () => {
      const saved = localStorage.getItem("lifedeck-current-space")
      if (saved && spaces.find((s) => s.id === saved)) {
        setCurrentIdState(saved)
        setInitializing(false)
        return
      }

      const first = spaces[0]
      if (first) {
        setCurrentIdState(first.id)
        localStorage.setItem("lifedeck-current-space", first.id)
        setInitializing(false)
        return
      }

      const psId = uid()
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      try {
        await store.persist("spaces", "add", { id: psId, name: "Personal", inviteCode, createdAt: new Date().toISOString() })
        await store.persist("spaceMembers", "add", { id: uid(), spaceId: psId, userId, role: "owner", joinedAt: new Date().toISOString() })
      } catch {}
      store.invalidate(["spaces", "spaceMembers"])
      const allSpaces = await store.list<Space>("spaces")
      if (allSpaces[0]) {
        setCurrentIdState(allSpaces[0].id)
        localStorage.setItem("lifedeck-current-space", allSpaces[0].id)
      }
      setInitializing(false)
    }

    initCurrent()
  }, [userId, spaces, spacesLoading])

  const setCurrentId = useCallback((id: string) => {
    setCurrentIdState(id)
    localStorage.setItem("lifedeck-current-space", id)
  }, [])

  const createSpace = useCallback(async (name: string) => {
    const id = uid()
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const space = { id, name, inviteCode, createdAt: new Date().toISOString() } as unknown as Space
    await store.mutateOptimistic<Space>("spaces", undefined, "add", (items) => ({
      items: [...items, space],
      record: space as unknown as Record<string, unknown>,
    }))
    setCurrentId(id)
    const defaultCategories = [
      { name: "Food & Dining", icon: "utensils", color: "#10B981" },
      { name: "Transport", icon: "car", color: "#3B82F6" },
      { name: "Shopping", icon: "shopping-bag", color: "#8B5CF6" },
      { name: "Bills & Utilities", icon: "zap", color: "#F59E0B" },
      { name: "Entertainment", icon: "film", color: "#EF4444" },
      { name: "Health", icon: "heart", color: "#EC4899" },
      { name: "Education", icon: "book", color: "#6366F1" },
      { name: "Salary", icon: "briefcase", color: "#10B981" },
      { name: "Freelance", icon: "laptop", color: "#14B8A6" },
      { name: "Investment", icon: "trending-up", color: "#06B6D4" },
      { name: "Gift", icon: "gift", color: "#F97316" },
      { name: "Other", icon: "more-horizontal", color: "#6B7280" },
    ]
    for (const cat of defaultCategories) {
      await store.persist("categories", "add", { id: uid(), spaceId: id, ...cat, createdAt: new Date().toISOString() })
    }
    return { id, inviteCode }
  }, [setCurrentId])

  const joinSpace = useCallback(async (inviteCode: string): Promise<Space | null> => {
    const res = await fetch("/api/spaces/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: inviteCode.toUpperCase() }),
    })
    if (!res.ok) return null
    const data = await res.json()
    store.invalidate(["spaces", "spaceMembers"])
    setCurrentId(data.id)
    return { id: data.id, name: data.name, inviteCode: "", createdAt: new Date() } as Space
  }, [setCurrentId])

  const regenerateInviteCode = useCallback(async (spaceId: string) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    await store.mutateOptimistic<Space>("spaces", undefined, "update", (items) => {
      const existing = items.find((s) => s.id === spaceId)
      if (!existing) return { items }
      const merged = { ...existing, inviteCode: code }
      return { items: items.map((s) => (s.id === spaceId ? merged : s)), record: merged as unknown as Record<string, unknown> }
    })
    return code
  }, [])

  return {
    spaces,
    currentId,
    setCurrentId,
    loading: initializing || spacesLoading,
    createSpace,
    joinSpace,
    regenerateInviteCode,
    members,
  }
}
