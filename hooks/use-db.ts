"use client"

import { useEffect, useState, useCallback } from "react"
import db, { type Transaction, type Task, type Note, type Category, type Account } from "@/lib/db"
import { uid } from "@/lib/uid"
import { enqueue } from "@/lib/sync"

export function useTransactions(spaceId: string) {
  const [items, setItems] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const data = await db.transactions
      .where("spaceId")
      .equals(spaceId)
      .reverse()
      .sortBy("loggedAt")
    setItems(data)
    setLoading(false)
  }, [spaceId])

  useEffect(() => { refresh() }, [refresh])

  const add = async (tx: Omit<Transaction, "id" | "createdAt">) => {
    const id = uid()
    const data = { ...tx, id, createdAt: new Date() }
    await db.transactions.add(data)
    enqueue({ table: "transactions", op: "upsert", data: data as unknown as Record<string, unknown>, recordId: id })
    await refresh()
    return id
  }

  return { items, loading, add }
}

export function useTasks(spaceId: string) {
  const [items, setItems] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const data = await db.tasks
      .where("spaceId")
      .equals(spaceId)
      .reverse()
      .sortBy("createdAt")
    setItems(data)
    setLoading(false)
  }, [spaceId])

  useEffect(() => { refresh() }, [refresh])

  const add = async (task: Omit<Task, "id" | "createdAt">) => {
    const id = uid()
    const data = { ...task, id, createdAt: new Date() }
    await db.tasks.add(data)
    enqueue({ table: "tasks", op: "upsert", data: data as unknown as Record<string, unknown>, recordId: id })
    await refresh()
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
    await refresh()
  }

  const remove = async (id: string) => {
    await db.tasks.delete(id)
    enqueue({ table: "tasks", op: "delete", recordId: id })
    await refresh()
  }

  return { items, loading, add, toggle, remove }
}

export function useNotes(spaceId: string) {
  const [items, setItems] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const data = await db.notes
      .where("spaceId")
      .equals(spaceId)
      .reverse()
      .sortBy("createdAt")
    setItems(data)
    setLoading(false)
  }, [spaceId])

  useEffect(() => { refresh() }, [refresh])

  const add = async (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
    const id = uid()
    const now = new Date()
    const data = { ...note, id, createdAt: now, updatedAt: now }
    await db.notes.add(data)
    enqueue({ table: "notes", op: "upsert", data: data as unknown as Record<string, unknown>, recordId: id })
    await refresh()
    return id
  }

  const togglePin = async (id: string) => {
    const note = await db.notes.get(id)
    if (!note) return
    const updates = { isPinned: !note.isPinned, updatedAt: new Date() }
    await db.notes.update(id, updates)
    enqueue({ table: "notes", op: "upsert", data: { ...note, ...updates } as unknown as Record<string, unknown>, recordId: id })
    await refresh()
  }

  const remove = async (id: string) => {
    await db.notes.delete(id)
    enqueue({ table: "notes", op: "delete", recordId: id })
    await refresh()
  }

  return { items, loading, add, togglePin, remove }
}

export function useCategories(spaceId: string) {
  const [items, setItems] = useState<Category[]>([])

  useEffect(() => {
    db.categories.where("spaceId").equals(spaceId).toArray().then(setItems)
  }, [spaceId])

  return items
}

export function useAccounts(spaceId: string) {
  const [items, setItems] = useState<Account[]>([])

  useEffect(() => {
    db.accounts.where("spaceId").equals(spaceId).toArray().then(setItems)
  }, [spaceId])

  return items
}

export function useSpace(defaultSpaceId = "personal") {
  const [spaceId] = useState(defaultSpaceId)
  return spaceId
}
