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

      const personalSpace = spaces.find((s) => s.personal)
      if (personalSpace) {
        setCurrentIdState(personalSpace.id)
        localStorage.setItem("lifedeck-current-space", personalSpace.id)
        setInitializing(false)
        return
      }

      const psId = uid()
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      try {
        await store.persist("spaces", "add", { id: psId, name: "Personal", personal: true, inviteCode, createdAt: new Date().toISOString() })
        await store.persist("spaceMembers", "add", { id: uid(), spaceId: psId, userId, role: "owner", joinedAt: new Date().toISOString() })
      } catch {}
      store.invalidate(["spaces", "spaceMembers"])
      const allSpaces = await store.list<Space>("spaces")
      const fallbackSpace = allSpaces.find((s) => s.personal)
      if (fallbackSpace) {
        setCurrentIdState(fallbackSpace.id)
        localStorage.setItem("lifedeck-current-space", fallbackSpace.id)
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
    const space = { id, name, inviteCode, personal: false, createdAt: new Date().toISOString() } as unknown as Space
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
    loading: initializing || spacesLoading,
    createSpace,
    joinSpace,
    regenerateInviteCode,
  }
}
