"use client"

import { useCallback } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import db, { type Transaction, type Task, type Note, type Category, type Account, type Profile, type SpaceMember } from "@/lib/db"
import { uid } from "@/lib/uid"
import { enqueue } from "@/lib/sync"

export function useTransactions(spaceId: string) {
  const items = useLiveQuery(
    () => db.transactions
      .where("spaceId")
      .equals(spaceId)
      .toArray()
      .then((arr) => arr.sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()))
  )

  const add = async (tx: Omit<Transaction, "id" | "createdAt">) => {
    const id = uid()
    const data = { ...tx, id, createdAt: new Date() }
    await db.transactions.add(data)
    enqueue({ table: "transactions", op: "upsert", data: data as unknown as Record<string, unknown>, recordId: id })
    return id
  }

  const update = async (id: string, updates: Partial<Omit<Transaction, "id" | "spaceId" | "createdAt">>) => {
    const existing = await db.transactions.get(id)
    if (!existing) return
    const merged = { ...existing, ...updates }
    await db.transactions.put(merged)
    enqueue({ table: "transactions", op: "upsert", data: merged as unknown as Record<string, unknown>, recordId: id })
  }

  const remove = async (id: string) => {
    await db.transactions.delete(id)
    enqueue({ table: "transactions", op: "delete", recordId: id })
  }

  return { items: items ?? [], loading: items === undefined, add, update, remove }
}

export function useTasks(spaceId: string) {
  const items = useLiveQuery(
    () => db.tasks
      .where("spaceId")
      .equals(spaceId)
      .toArray()
      .then((arr) => arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
  )

  const add = async (task: Omit<Task, "id" | "createdAt">) => {
    const id = uid()
    const data = { ...task, id, createdAt: new Date() }
    await db.tasks.add(data)
    enqueue({ table: "tasks", op: "upsert", data: data as unknown as Record<string, unknown>, recordId: id })
    return id
  }

  const toggle = async (id: string) => {
    const task = await db.tasks.get(id)
    if (!task) return
    const updates = {
      isCompleted: !task.isCompleted,
      completedAt: !task.isCompleted ? new Date() : undefined,
    }
    await db.tasks.update(id, updates)
    enqueue({ table: "tasks", op: "upsert", data: { ...task, ...updates } as unknown as Record<string, unknown>, recordId: id })
  }

  const remove = async (id: string) => {
    await db.tasks.delete(id)
    enqueue({ table: "tasks", op: "delete", recordId: id })
  }

  const update = async (id: string, updates: Partial<Omit<Task, "id" | "spaceId" | "createdAt">>) => {
    const existing = await db.tasks.get(id)
    if (!existing) return
    const merged = { ...existing, ...updates }
    await db.tasks.put(merged)
    enqueue({ table: "tasks", op: "upsert", data: merged as unknown as Record<string, unknown>, recordId: id })
  }

  return { items: items ?? [], loading: items === undefined, add, toggle, remove, update }
}

export function useNotes(spaceId: string) {
  const items = useLiveQuery(
    () => db.notes
      .where("spaceId")
      .equals(spaceId)
      .toArray()
      .then((arr) => arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
  )

  const add = async (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
    const id = uid()
    const now = new Date()
    const data = { ...note, id, createdAt: now, updatedAt: now }
    await db.notes.add(data)
    enqueue({ table: "notes", op: "upsert", data: data as unknown as Record<string, unknown>, recordId: id })
    return id
  }

  const togglePin = async (id: string) => {
    const note = await db.notes.get(id)
    if (!note) return
    const updates = { isPinned: !note.isPinned, updatedAt: new Date() }
    await db.notes.update(id, updates)
    enqueue({ table: "notes", op: "upsert", data: { ...note, ...updates } as unknown as Record<string, unknown>, recordId: id })
  }

  const remove = async (id: string) => {
    await db.notes.delete(id)
    enqueue({ table: "notes", op: "delete", recordId: id })
  }

  const update = async (id: string, updates: Partial<Omit<Note, "id" | "spaceId" | "createdAt">>) => {
    const existing = await db.notes.get(id)
    if (!existing) return
    const merged = { ...existing, ...updates, updatedAt: new Date() }
    await db.notes.put(merged)
    enqueue({ table: "notes", op: "upsert", data: merged as unknown as Record<string, unknown>, recordId: id })
  }

  return { items: items ?? [], loading: items === undefined, add, togglePin, remove, update }
}

export function useCategories(spaceId: string) {
  return useLiveQuery(
    () => db.categories.where("spaceId").equals(spaceId).toArray(),
    [spaceId]
  ) ?? []
}

export function useAccounts(spaceId: string) {
  return useLiveQuery(
    () => db.accounts.where("spaceId").equals(spaceId).toArray(),
    [spaceId]
  ) ?? []
}

export function useProfile(userId?: string) {
  return useLiveQuery(
    () => userId ? db.profiles.get(userId) : undefined,
    [userId]
  )
}

export async function updateProfile(id: string, updates: Partial<Omit<Profile, "id" | "createdAt">>) {
  const existing = await db.profiles.get(id)
  if (!existing) return
  const merged = { ...existing, ...updates, updatedAt: new Date() }
  await db.profiles.put(merged)
  enqueue({ table: "profiles", op: "upsert", data: merged as unknown as Record<string, unknown>, recordId: id })
}

export async function updateSpaceMember(spaceId: string, userId: string, updates: Partial<Omit<SpaceMember, "id" | "spaceId" | "userId" | "joinedAt">>) {
  const member = await db.spaceMembers.where({ spaceId, userId }).first()
  if (!member) return
  const merged = { ...member, ...updates }
  await db.spaceMembers.put(merged)
  enqueue({ table: "spaceMembers", op: "upsert", data: merged as unknown as Record<string, unknown>, recordId: member.id })
}

const PERSONAL_SPACE_ID = "00000000-0000-0000-0000-000000000001"

export function useSpace(defaultSpaceId = PERSONAL_SPACE_ID) {
  return defaultSpaceId
}
