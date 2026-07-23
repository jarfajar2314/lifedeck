"use client"

import { useEffect, useState, useCallback } from "react"
import db, { type Space, type SpaceMember } from "@/lib/db"
import { uid } from "@/lib/uid"

export type SpaceWithRole = Space & { role: "owner" | "member" }

export function useSpaces(userId?: string) {
  const [spaces, setSpaces] = useState<SpaceWithRole[]>([])
  const [currentId, setCurrentIdState] = useState<string>("personal")
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
    const existing = await db.spaces.get("personal")
    if (!existing) {
      await db.spaces.put({ id: "personal", name: "Personal", inviteCode: "", createdAt: new Date() })
    }
    if (userId) {
      const isMember = await db.spaceMembers.where({ spaceId: "personal", userId }).first()
      if (!isMember) {
        await db.spaceMembers.put({
          id: uid(), spaceId: "personal", userId, role: "owner", joinedAt: new Date(),
        })
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
    await db.spaces.add({ id, name, inviteCode, createdAt: new Date() })
    if (userId) {
      await db.spaceMembers.add({
        id: uid(),
        spaceId: id,
        userId,
        role: "owner",
        joinedAt: new Date(),
      })
    }
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
        await db.spaceMembers.add({
          id: uid(),
          spaceId: space.id,
          userId,
          role: "member",
          joinedAt: new Date(),
        })
      }
    }
    await refresh()
    setCurrentId(space.id)
    return space
  }

  const regenerateInviteCode = async (spaceId: string) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    await db.spaces.update(spaceId, { inviteCode: code })
    await refresh()
    return code
  }

  return { spaces, currentId, setCurrentId, loading, createSpace, joinSpace, regenerateInviteCode }
}
