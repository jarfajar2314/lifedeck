"use client"

import { useCallback } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import db, { type Transaction, type Task, type Note, type Category, type Account } from "@/lib/db"
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

  return { items: items ?? [], loading: items === undefined, add }
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

  return { items: items ?? [], loading: items === undefined, add, toggle, remove }
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

  return { items: items ?? [], loading: items === undefined, add, togglePin, remove }
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

const PERSONAL_SPACE_ID = "00000000-0000-0000-0000-000000000001"

export function useSpace(defaultSpaceId = PERSONAL_SPACE_ID) {
  return defaultSpaceId
}
