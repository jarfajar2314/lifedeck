"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

type TableName = "transactions" | "tasks" | "notes" | "space_members"

export function useRealtimeSubscription(
  spaceId: string,
  table: TableName,
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

export function useMultiSync(spaceId: string, refreshAll: () => void) {
  const tables: TableName[] = ["transactions", "tasks", "notes"]

  useEffect(() => {
    if (!supabase) return

    const channels = tables.map((table) =>
      supabase
        .channel(`sync-${spaceId}-${table}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table, filter: `space_id=eq.${spaceId}` },
          () => {
            refreshAll()
            toast(`Sync: ${table} updated`)
          }
        )
        .subscribe()
    )

    return () => { channels.forEach((ch) => supabase.removeChannel(ch)) }
  }, [spaceId])
}
