"use client"

import { useEffect, useState, useCallback, useMemo, useSyncExternalStore } from "react"
import type { Space, SpaceMember } from "@/lib/db"
import { uid } from "@/lib/uid"
import * as store from "@/lib/data-store"

function personalSpaceKey(userId: string): string {
  return `lifedeck-personal-space-${userId}`
}

function getCachedPersonalSpaceId(userId: string): string | null {
  return localStorage.getItem(personalSpaceKey(userId))
}

function setCachedPersonalSpaceId(userId: string, spaceId: string): void {
  localStorage.setItem(personalSpaceKey(userId), spaceId)
}

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
  const [bootstrapping, setBootstrapping] = useState(true)

  const ensurePersonalSpace = useCallback(async () => {
    if (!userId) return
    try {
      await store.persist("profiles", "add", {
        id: userId, currency: "IDR", monthlyBudget: 0, themePreference: "dark", accentColor: "emerald",
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      })
    } catch {}

    let psId = getCachedPersonalSpaceId(userId)
    if (!psId) {
      psId = uid()
      setCachedPersonalSpaceId(userId, psId)
    }

    const existingSpaces = await store.list<Space>("spaces")
    const existing = existingSpaces.find((s) => s.id === psId)
    if (!existing) {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      try {
        await store.persist("spaces", "add", { id: psId, name: "Personal", inviteCode, createdAt: new Date().toISOString() })
      } catch {}
    }
    const existingMembers = await store.list<SpaceMember>("spaceMembers")
    const isMember = existingMembers.find((m) => m.spaceId === psId && m.userId === userId)
    if (!isMember) {
      try {
        await store.persist("spaceMembers", "add", { id: uid(), spaceId: psId, userId, role: "owner", joinedAt: new Date().toISOString() })
      } catch {}
    }

    store.invalidate(["spaces", "spaceMembers", "profiles"])
    localStorage.removeItem("lifedeck-current-space")
    setCurrentIdState(psId)
    setBootstrapping(false)
  }, [userId])

  useEffect(() => { ensurePersonalSpace() }, [ensurePersonalSpace])

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
    if (userId) {
      const member = { id: uid(), spaceId: id, userId, role: "owner" as const, joinedAt: new Date().toISOString() } as unknown as SpaceMember
      await store.mutateOptimistic<SpaceMember>("spaceMembers", undefined, "add", (items) => ({
        items: [...items, member],
        record: member as unknown as Record<string, unknown>,
      }))
    }
    setCurrentId(id)
    return { id, inviteCode }
  }, [userId, setCurrentId])

  const joinSpace = useCallback(async (inviteCode: string) => {
    const allSpacesList = await store.list<Space>("spaces")
    const space = allSpacesList.find((s) => s.inviteCode === inviteCode.toUpperCase())
    if (!space) return null
    if (userId) {
      const existingMembers = await store.list<SpaceMember>("spaceMembers")
      const existing = existingMembers.find((m) => m.spaceId === space.id && m.userId === userId)
      if (!existing) {
        const member = { id: uid(), spaceId: space.id, userId, role: "member" as const, joinedAt: new Date().toISOString() } as unknown as SpaceMember
        await store.mutateOptimistic<SpaceMember>("spaceMembers", undefined, "add", (items) => ({
          items: [...items, member],
          record: member as unknown as Record<string, unknown>,
        }))
      }
    }
    store.invalidate(["spaces"])
    setCurrentId(space.id)
    return space
  }, [userId, setCurrentId])

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
    loading: bootstrapping || spacesLoading,
    createSpace,
    joinSpace,
    regenerateInviteCode,
  }
}
