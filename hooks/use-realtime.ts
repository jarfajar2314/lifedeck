"use client"

import { useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import db from "@/lib/db"

type SupabaseTable = "transactions" | "tasks" | "notes" | "space_members"

const DEXIE_TABLE: Record<SupabaseTable, string> = {
  transactions: "transactions",
  tasks: "tasks",
  notes: "notes",
  space_members: "spaceMembers",
}

const COLUMN_MAP: Record<string, Record<string, string>> = {
  transactions: { space_id: "spaceId", created_by: "createdBy", account_id: "accountId", category_id: "categoryId", logged_at: "loggedAt", created_at: "createdAt" },
  tasks: { space_id: "spaceId", created_by: "createdBy", assigned_to: "assignedTo", is_completed: "isCompleted", due_date: "dueDate", completed_at: "completedAt", created_at: "createdAt" },
  notes: { space_id: "spaceId", created_by: "createdBy", is_pinned: "isPinned", created_at: "createdAt", updated_at: "updatedAt" },
  space_members: { space_id: "spaceId", user_id: "userId", joined_at: "joinedAt" },
}

function toCamel(table: SupabaseTable, row: Record<string, unknown>): Record<string, unknown> {
  const map = COLUMN_MAP[table] || {}
  const out: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(row)) {
    out[map[key] || key] = val
  }
  return out
}

export function useRealtimeSubscription(
  spaceId: string,
  table: SupabaseTable,
  onPayload: (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void
) {
  useEffect(() => {
    if (!supabase) return

    const channel = supabase
      .channel(`space-${spaceId}-${table}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `space_id=eq.${spaceId}`,
        },
        (payload) => {
          onPayload({
            eventType: payload.eventType,
            new: payload.new as Record<string, unknown>,
            old: payload.old as Record<string, unknown>,
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [spaceId, table])
}

export function useMultiSync(spaceId: string) {
  const handleChange = useCallback(async (table: SupabaseTable, payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
    const dexieTable = DEXIE_TABLE[table]
    if (!dexieTable) return
    const t = db[dexieTable as keyof typeof db] as any
    if (!t) return

    try {
      if (payload.eventType === "DELETE") {
        const oldCamel = toCamel(table, payload.old)
        if (oldCamel.id) await t.delete(oldCamel.id)
      } else {
        const newCamel = toCamel(table, payload.new)
        if (newCamel.id) await t.put(newCamel)
      }
    } catch (err) {
      console.warn(`[realtime] error applying ${table} change:`, err)
    }
  }, [])

  useEffect(() => {
    if (!supabase || !spaceId) return

    const tables: SupabaseTable[] = ["transactions", "tasks", "notes"]

    const channels = tables.map((table) =>
      supabase
        .channel(`sync-${spaceId}-${table}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table, filter: `space_id=eq.${spaceId}` },
          (payload) => {
            handleChange(table, {
              eventType: payload.eventType,
              new: payload.new as Record<string, unknown>,
              old: payload.old as Record<string, unknown>,
            })
          }
        )
        .subscribe()
    )

    return () => { channels.forEach((ch) => supabase.removeChannel(ch)) }
  }, [spaceId, handleChange])
}
