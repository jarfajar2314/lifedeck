"use client"

import { useEffect, useState, useCallback } from "react"
import db, { type Space, type SpaceMember } from "@/lib/db"
import { uid } from "@/lib/uid"
import { enqueue, enqueueMany } from "@/lib/sync"

const PERSONAL_SPACE_ID = "00000000-0000-0000-0000-000000000001"

export type SpaceWithRole = Space & { role: "owner" | "member" }

export function useSpaces(userId?: string) {
  const [spaces, setSpaces] = useState<SpaceWithRole[]>([])
  const [currentId, setCurrentIdState] = useState<string>(PERSONAL_SPACE_ID)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const allSpaces = await db.spaces.toArray()
    const members = await db.spaceMembers.toArray()

    const enriched: SpaceWithRole[] = allSpaces.map((s) => ({
      ...s,
      role: (members.find((m) => m.spaceId === s.id)?.role ?? "member") as "owner" | "member",
    }))

    setSpaces(enriched)
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const ensurePersonalSpace = useCallback(async () => {
    const ops: { table: string; op: "upsert" | "delete"; data?: Record<string, unknown>; recordId?: string }[] = []
    const existing = await db.spaces.get(PERSONAL_SPACE_ID)
    if (!existing) {
      const data = { id: PERSONAL_SPACE_ID, name: "Personal", inviteCode: "", createdAt: new Date() }
      await db.spaces.put(data)
      ops.push({ table: "spaces", op: "upsert", data: data as unknown as Record<string, unknown>, recordId: PERSONAL_SPACE_ID })
    }
    if (userId) {
      const isMember = await db.spaceMembers.where({ spaceId: PERSONAL_SPACE_ID, userId }).first()
      if (!isMember) {
        const data = { id: uid(), spaceId: PERSONAL_SPACE_ID, userId, role: "owner" as const, joinedAt: new Date() }
        await db.spaceMembers.put(data)
        ops.push({ table: "spaceMembers", op: "upsert", data: data as unknown as Record<string, unknown>, recordId: data.id })
      }
    }
    if (ops.length > 0) enqueueMany(ops)
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
    const spaceData = { id, name, inviteCode, createdAt: new Date() }
    await db.spaces.add(spaceData)
    const ops: { table: string; op: "upsert"; data: Record<string, unknown>; recordId: string }[] = [
      { table: "spaces", op: "upsert", data: spaceData as unknown as Record<string, unknown>, recordId: id },
    ]
    if (userId) {
      const memberData = { id: uid(), spaceId: id, userId, role: "owner" as const, joinedAt: new Date() }
      await db.spaceMembers.add(memberData)
      ops.push({ table: "spaceMembers", op: "upsert", data: memberData as unknown as Record<string, unknown>, recordId: memberData.id })
    }
    enqueueMany(ops)
    await refresh()
    setCurrentId(id)
    return { id, inviteCode }
  }

  const joinSpace = async (inviteCode: string) => {
    const space = await db.spaces.where("inviteCode").equals(inviteCode.toUpperCase()).first()
    if (!space) return null
    if (userId) {
      const existing = await db.spaceMembers
        .where({ spaceId: space.id, userId })
        .first()
      if (!existing) {
        const data = { id: uid(), spaceId: space.id, userId, role: "member" as const, joinedAt: new Date() }
        await db.spaceMembers.add(data)
        enqueue({ table: "spaceMembers", op: "upsert", data: data as unknown as Record<string, unknown>, recordId: data.id })
      }
    }
    await refresh()
    setCurrentId(space.id)
    return space
  }

  const regenerateInviteCode = async (spaceId: string) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    await db.spaces.update(spaceId, { inviteCode: code })
    const space = await db.spaces.get(spaceId)
    if (space) enqueue({ table: "spaces", op: "upsert", data: space as unknown as Record<string, unknown>, recordId: spaceId })
    await refresh()
    return code
  }

  return { spaces, currentId, setCurrentId, loading, createSpace, joinSpace, regenerateInviteCode }
}
