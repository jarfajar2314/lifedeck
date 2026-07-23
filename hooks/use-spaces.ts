"use client"

import { useEffect, useState, useCallback } from "react"
import type { Space, SpaceMember } from "@/lib/db"
import { uid } from "@/lib/uid"

const API = "/api/data"

const PERSONAL_SPACE_ID = "00000000-0000-0000-0000-000000000001"

export type SpaceWithRole = Space & { role: "owner" | "member" }

async function list<T>(table: string): Promise<T[]> {
  const res = await fetch(`${API}?table=${table}`, { credentials: "include" })
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

export function useSpaces(userId?: string) {
  const [spaces, setSpaces] = useState<SpaceWithRole[]>([])
  const [currentId, setCurrentIdState] = useState<string>(PERSONAL_SPACE_ID)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const [allSpaces, members] = await Promise.all([list<Space>("spaces"), list<SpaceMember>("spaceMembers")])
      const enriched: SpaceWithRole[] = allSpaces.map((s) => ({
        ...s,
        role: (members.find((m) => m.spaceId === s.id)?.role ?? "member") as "owner" | "member",
      }))
      setSpaces(enriched)
    } catch (err) {
      console.error("[spaces] refresh error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const ensurePersonalSpace = useCallback(async () => {
    const allSpaces = await list<Space>("spaces")
    const existing = allSpaces.find((s) => s.id === PERSONAL_SPACE_ID)
    if (!existing) {
      await mutate("spaces", "add", { id: PERSONAL_SPACE_ID, name: "Personal", inviteCode: "", createdAt: new Date().toISOString() } as unknown as Record<string, unknown>)
    }
    if (userId) {
      const members = await list<SpaceMember>("spaceMembers")
      const isMember = members.find((m) => m.spaceId === PERSONAL_SPACE_ID && m.userId === userId)
      if (!isMember) {
        await mutate("spaceMembers", "add", { id: uid(), spaceId: PERSONAL_SPACE_ID, userId, role: "owner", joinedAt: new Date().toISOString() } as unknown as Record<string, unknown>)
      }
    }
    await refresh()
  }, [userId, refresh])

  useEffect(() => { ensurePersonalSpace() }, [ensurePersonalSpace])

  const setCurrentId = (id: string) => {
    setCurrentIdState(id)
    localStorage.setItem("lifedeck-current-space", id)
  }

  useEffect(() => {
    const saved = localStorage.getItem("lifedeck-current-space")
    if (saved) setCurrentIdState(saved)
  }, [])

  const createSpace = async (name: string) => {
    const id = uid()
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    await mutate("spaces", "add", { id, name, inviteCode, createdAt: new Date().toISOString() } as unknown as Record<string, unknown>)
    if (userId) {
      await mutate("spaceMembers", "add", { id: uid(), spaceId: id, userId, role: "owner", joinedAt: new Date().toISOString() } as unknown as Record<string, unknown>)
    }
    await refresh()
    setCurrentId(id)
    return { id, inviteCode }
  }

  const joinSpace = async (inviteCode: string) => {
    const allSpaces = await list<Space>("spaces")
    const space = allSpaces.find((s) => s.inviteCode === inviteCode.toUpperCase())
    if (!space) return null
    if (userId) {
      const members = await list<SpaceMember>("spaceMembers")
      const existing = members.find((m) => m.spaceId === space.id && m.userId === userId)
      if (!existing) {
        await mutate("spaceMembers", "add", { id: uid(), spaceId: space.id, userId, role: "member", joinedAt: new Date().toISOString() } as unknown as Record<string, unknown>)
      }
    }
    await refresh()
    setCurrentId(space.id)
    return space
  }

  const regenerateInviteCode = async (spaceId: string) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    await mutate("spaces", "update", { id: spaceId, inviteCode: code } as unknown as Record<string, unknown>)
    await refresh()
    return code
  }

  return { spaces, currentId, setCurrentId, loading, createSpace, joinSpace, regenerateInviteCode }
}
