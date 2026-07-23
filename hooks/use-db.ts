"use client"

import { useCallback, useEffect, useSyncExternalStore } from "react"
import { toast } from "sonner"
import type { Transaction, Task, Note, Category, Account, Profile, SpaceMember } from "@/lib/db"
import { uid } from "@/lib/uid"
import * as store from "@/lib/data-store"

function useTable<T>(table: string, spaceId?: string) {
  useEffect(() => {
    if (!spaceId) return
    store.ensureLoaded<T>(table, spaceId)
  }, [table, spaceId])

  const subscribeFn = useCallback(
    (cb: () => void) => store.subscribe(table, spaceId, cb),
    [table, spaceId]
  )

  return useSyncExternalStore(
    subscribeFn,
    () => store.getSnapshot<T>(table, spaceId),
    () => store.getServerSnapshot<T>()
  )
}

const GENERIC_SAVE_ERROR = "Couldn't save. Please try again."
const GENERIC_DELETE_ERROR = "Couldn't delete. Please try again."

export function useTransactions(spaceId: string) {
  const { items, loading, error } = useTable<Transaction>("transactions", spaceId)

  const add = useCallback(async (tx: Omit<Transaction, "id" | "createdAt">) => {
    const id = uid()
    const record = { ...tx, id, createdAt: new Date().toISOString() } as unknown as Transaction
    try {
      await store.mutateOptimistic<Transaction>("transactions", spaceId, "add", (items) => ({
        items: [...items, record],
        record: record as unknown as Record<string, unknown>,
      }))
    } catch {
      toast.error(GENERIC_SAVE_ERROR)
      throw new Error("add failed")
    }
    return id
  }, [spaceId])

  const update = useCallback(async (id: string, updates: Partial<Omit<Transaction, "id" | "spaceId" | "createdAt">>) => {
    try {
      await store.mutateOptimistic<Transaction>("transactions", spaceId, "update", (items) => {
        const existing = items.find((i) => i.id === id)
        if (!existing) return { items }
        const merged = { ...existing, ...updates }
        return { items: items.map((i) => (i.id === id ? merged : i)), record: merged as unknown as Record<string, unknown> }
      })
    } catch {
      toast.error(GENERIC_SAVE_ERROR)
    }
  }, [spaceId])

  const remove = useCallback(async (id: string) => {
    try {
      await store.mutateOptimistic<Transaction>("transactions", spaceId, "delete", (items) => ({
        items: items.filter((i) => i.id !== id),
        id,
      }))
    } catch {
      toast.error(GENERIC_DELETE_ERROR)
    }
  }, [spaceId])

  const sorted = [...items].sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
  return { items: sorted, loading, error, add, update, remove }
}

export function useTasks(spaceId: string) {
  const { items, loading, error } = useTable<Task>("tasks", spaceId)

  const add = useCallback(async (task: Omit<Task, "id" | "createdAt">) => {
    const id = uid()
    const record = { ...task, id, createdAt: new Date().toISOString() } as unknown as Task
    try {
      await store.mutateOptimistic<Task>("tasks", spaceId, "add", (items) => ({
        items: [...items, record],
        record: record as unknown as Record<string, unknown>,
      }))
    } catch {
      toast.error(GENERIC_SAVE_ERROR)
      throw new Error("add failed")
    }
    return id
  }, [spaceId])

  const toggle = useCallback(async (id: string) => {
    try {
      await store.mutateOptimistic<Task>("tasks", spaceId, "update", (items) => {
        const existing = items.find((i) => i.id === id)
        if (!existing) return { items }
        const merged = {
          ...existing,
          isCompleted: !existing.isCompleted,
          completedAt: !existing.isCompleted ? new Date().toISOString() : undefined,
        } as unknown as Task
        return { items: items.map((i) => (i.id === id ? merged : i)), record: merged as unknown as Record<string, unknown> }
      })
    } catch {
      toast.error(GENERIC_SAVE_ERROR)
    }
  }, [spaceId])

  const remove = useCallback(async (id: string) => {
    try {
      await store.mutateOptimistic<Task>("tasks", spaceId, "delete", (items) => ({
        items: items.filter((i) => i.id !== id),
        id,
      }))
    } catch {
      toast.error(GENERIC_DELETE_ERROR)
    }
  }, [spaceId])

  const update = useCallback(async (id: string, updates: Partial<Omit<Task, "id" | "spaceId" | "createdAt">>) => {
    try {
      await store.mutateOptimistic<Task>("tasks", spaceId, "update", (items) => {
        const existing = items.find((i) => i.id === id)
        if (!existing) return { items }
        const merged = { ...existing, ...updates }
        return { items: items.map((i) => (i.id === id ? merged : i)), record: merged as unknown as Record<string, unknown> }
      })
    } catch {
      toast.error(GENERIC_SAVE_ERROR)
    }
  }, [spaceId])

  const sorted = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return { items: sorted, loading, error, add, toggle, remove, update }
}

export function useNotes(spaceId: string) {
  const { items, loading, error } = useTable<Note>("notes", spaceId)

  const add = useCallback(async (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
    const id = uid()
    const now = new Date().toISOString()
    const record = { ...note, id, createdAt: now, updatedAt: now } as unknown as Note
    try {
      await store.mutateOptimistic<Note>("notes", spaceId, "add", (items) => ({
        items: [...items, record],
        record: record as unknown as Record<string, unknown>,
      }))
    } catch {
      toast.error(GENERIC_SAVE_ERROR)
      throw new Error("add failed")
    }
    return id
  }, [spaceId])

  const togglePin = useCallback(async (id: string) => {
    try {
      await store.mutateOptimistic<Note>("notes", spaceId, "update", (items) => {
        const existing = items.find((i) => i.id === id)
        if (!existing) return { items }
        const merged = { ...existing, isPinned: !existing.isPinned, updatedAt: new Date().toISOString() } as unknown as Note
        return { items: items.map((i) => (i.id === id ? merged : i)), record: merged as unknown as Record<string, unknown> }
      })
    } catch {
      toast.error(GENERIC_SAVE_ERROR)
    }
  }, [spaceId])

  const remove = useCallback(async (id: string) => {
    try {
      await store.mutateOptimistic<Note>("notes", spaceId, "delete", (items) => ({
        items: items.filter((i) => i.id !== id),
        id,
      }))
    } catch {
      toast.error(GENERIC_DELETE_ERROR)
    }
  }, [spaceId])

  const update = useCallback(async (id: string, updates: Partial<Omit<Note, "id" | "spaceId" | "createdAt">>) => {
    try {
      await store.mutateOptimistic<Note>("notes", spaceId, "update", (items) => {
        const existing = items.find((i) => i.id === id)
        if (!existing) return { items }
        const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() } as unknown as Note
        return { items: items.map((i) => (i.id === id ? merged : i)), record: merged as unknown as Record<string, unknown> }
      })
    } catch {
      toast.error(GENERIC_SAVE_ERROR)
    }
  }, [spaceId])

  const sorted = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return { items: sorted, loading, error, add, togglePin, remove, update }
}

export function useCategories(spaceId: string) {
  return useTable<Category>("categories", spaceId).items
}

export function useAccounts(spaceId: string) {
  return useTable<Account>("accounts", spaceId).items
}

export function useProfile(userId?: string) {
  const { items } = useTable<Profile>("profiles", undefined)
  return userId ? items.find((p) => p.id === userId) : undefined
}

export function useSpaceMembers() {
  return useTable<SpaceMember>("spaceMembers", undefined).items
}

export async function updateProfile(id: string, updates: Partial<Omit<Profile, "id" | "createdAt">>): Promise<void> {
  await store.mutateOptimistic<Profile>("profiles", undefined, "update", (items) => {
    const existing = items.find((i) => i.id === id)
    const merged = { ...(existing ?? { id, createdAt: new Date().toISOString() }), ...updates, updatedAt: new Date().toISOString() } as unknown as Profile
    const next = existing ? items.map((i) => (i.id === id ? merged : i)) : [...items, merged]
    return { items: next, record: merged as unknown as Record<string, unknown> }
  })
}

export async function updateSpaceMember(spaceId: string, userId: string, updates: Partial<Omit<SpaceMember, "id" | "spaceId" | "userId" | "joinedAt">>): Promise<void> {
  await store.mutateOptimistic<SpaceMember>("spaceMembers", undefined, "update", (items) => {
    const existing = items.find((m) => m.spaceId === spaceId && m.userId === userId)
    if (!existing) return { items }
    const merged = { ...existing, ...updates }
    return { items: items.map((i) => (i.id === existing.id ? merged : i)), record: merged as unknown as Record<string, unknown> }
  })
}

export function personalSpaceId(userId: string): string {
  return `personal-${userId}`
}

export function useSpace(defaultSpaceId: string) {
  return defaultSpaceId
}
