"use client"

import { useState, useEffect, useCallback } from "react"
import type { Transaction, Task, Note, Category, Account, Profile, SpaceMember } from "@/lib/db"
import { uid } from "@/lib/uid"

const API = "/api/data"

async function list<T>(table: string, spaceId?: string): Promise<T[]> {
  const params = new URLSearchParams({ table })
  if (spaceId) params.set("spaceId", spaceId)
  const res = await fetch(`${API}?${params}`, { credentials: "include" })
  if (!res.ok) throw new Error(`${table} list failed: ${res.status}`)
  const json = await res.json()
  return json.data as T[]
}

async function mutate(table: string, op: string, data?: Record<string, unknown>, id?: string): Promise<void> {
  const res = await fetch(API, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table, op, data, id }),
  })
  if (!res.ok) throw new Error(`${table} ${op} failed: ${res.status}`)
}

function useList<T>(table: string, spaceId: string | undefined) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await list<T>(table, spaceId)
      setItems(data)
    } catch (err) {
      console.error(`[${table}] list error:`, err)
    } finally {
      setLoading(false)
    }
  }, [table, spaceId])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    const handler = () => {
      list<T>(table, spaceId).then(setItems).catch(() => {})
    }
    window.addEventListener("data-refresh", handler)
    return () => window.removeEventListener("data-refresh", handler)
  }, [table, spaceId])

  return { items, loading, refresh }
}

export function useTransactions(spaceId: string) {
  const { items, loading, refresh } = useList<Transaction>("transactions", spaceId)

  const add = async (tx: Omit<Transaction, "id" | "createdAt">) => {
    const id = uid()
    await mutate("transactions", "add", { ...tx, id, createdAt: new Date().toISOString() } as unknown as Record<string, unknown>)
    await refresh()
    return id
  }

  const update = async (id: string, updates: Partial<Omit<Transaction, "id" | "spaceId" | "createdAt">>) => {
    const existing = items.find((i) => i.id === id)
    if (!existing) return
    await mutate("transactions", "update", { ...existing, ...updates } as unknown as Record<string, unknown>)
    await refresh()
  }

  const remove = async (id: string) => {
    await mutate("transactions", "delete", undefined, id)
    await refresh()
  }

  const sorted = [...items].sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
  return { items: sorted, loading, add, update, remove }
}

export function useTasks(spaceId: string) {
  const { items, loading, refresh } = useList<Task>("tasks", spaceId)

  const add = async (task: Omit<Task, "id" | "createdAt">) => {
    const id = uid()
    await mutate("tasks", "add", { ...task, id, createdAt: new Date().toISOString() } as unknown as Record<string, unknown>)
    await refresh()
    return id
  }

  const toggle = async (id: string) => {
    const task = items.find((i) => i.id === id)
    if (!task) return
    const updates = { isCompleted: !task.isCompleted, completedAt: !task.isCompleted ? new Date().toISOString() : undefined }
    await mutate("tasks", "update", { ...task, ...updates } as unknown as Record<string, unknown>)
    await refresh()
  }

  const remove = async (id: string) => {
    await mutate("tasks", "delete", undefined, id)
    await refresh()
  }

  const update = async (id: string, updates: Partial<Omit<Task, "id" | "spaceId" | "createdAt">>) => {
    const existing = items.find((i) => i.id === id)
    if (!existing) return
    await mutate("tasks", "update", { ...existing, ...updates } as unknown as Record<string, unknown>)
    await refresh()
  }

  const sorted = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return { items: sorted, loading, add, toggle, remove, update }
}

export function useNotes(spaceId: string) {
  const { items, loading, refresh } = useList<Note>("notes", spaceId)

  const add = async (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
    const id = uid()
    const now = new Date().toISOString()
    await mutate("notes", "add", { ...note, id, createdAt: now, updatedAt: now } as unknown as Record<string, unknown>)
    await refresh()
    return id
  }

  const togglePin = async (id: string) => {
    const note = items.find((i) => i.id === id)
    if (!note) return
    await mutate("notes", "update", { ...note, isPinned: !note.isPinned, updatedAt: new Date().toISOString() } as unknown as Record<string, unknown>)
    await refresh()
  }

  const remove = async (id: string) => {
    await mutate("notes", "delete", undefined, id)
    await refresh()
  }

  const update = async (id: string, updates: Partial<Omit<Note, "id" | "spaceId" | "createdAt">>) => {
    const existing = items.find((i) => i.id === id)
    if (!existing) return
    await mutate("notes", "update", { ...existing, ...updates, updatedAt: new Date().toISOString() } as unknown as Record<string, unknown>)
    await refresh()
  }

  const sorted = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return { items: sorted, loading, add, togglePin, remove, update }
}

export function useCategories(spaceId: string) {
  const [items, setItems] = useState<Category[]>([])
  useEffect(() => {
    list<Category>("categories", spaceId).then(setItems).catch(() => {})
  }, [spaceId])
  return items
}

export function useAccounts(spaceId: string) {
  const [items, setItems] = useState<Account[]>([])
  useEffect(() => {
    list<Account>("accounts", spaceId).then(setItems).catch(() => {})
  }, [spaceId])
  return items
}

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<Profile | undefined>()
  useEffect(() => {
    if (!userId) { setProfile(undefined); return }
    list<Profile>("profiles").then((arr) => setProfile(arr[0])).catch(() => {})
  }, [userId])
  return profile
}

export async function updateProfile(id: string, updates: Partial<Omit<Profile, "id" | "createdAt">>) {
  await mutate("profiles", "update", { id, ...updates, updatedAt: new Date().toISOString() } as unknown as Record<string, unknown>)
}

export async function updateSpaceMember(spaceId: string, userId: string, updates: Partial<Omit<SpaceMember, "id" | "spaceId" | "userId" | "joinedAt">>) {
  const members = await list<SpaceMember>("spaceMembers")
  const member = members.find((m) => m.spaceId === spaceId && m.userId === userId)
  if (!member) return
  await mutate("spaceMembers", "update", { ...member, ...updates } as unknown as Record<string, unknown>)
}

export function personalSpaceId(userId: string): string {
  return `personal-${userId}`
}

export function useSpace(defaultSpaceId: string) {
  return defaultSpaceId
}
