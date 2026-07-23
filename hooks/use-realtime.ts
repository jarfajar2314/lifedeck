"use client"

import { useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { pullTable } from "@/lib/sync"
import db from "@/lib/db"

const DEXIE_TABLE: Record<string, string> = {
  transactions: "transactions",
  tasks: "tasks",
  notes: "notes",
  spaceMembers: "spaceMembers",
}

function getDexieTable(table: string): string | null {
  return DEXIE_TABLE[table] || null
}

export function useMultiSync(spaceId: string) {
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!supabase || !spaceId) return

    const channel = supabase.channel("cross-device-sync")

    channel.on("broadcast", { event: "sync" }, async (payload) => {
      if (!mountedRef.current) return
      const tables: string[] = payload.payload?.tables ?? []
      for (const table of tables) {
        const dexieTable = getDexieTable(table)
        if (!dexieTable) continue
        try {
          const rows = await pullTable(table)
          if (rows.length === 0) continue
          const t = (db as any)[dexieTable]
          for (const row of rows) {
            await t.put(row)
          }
        } catch (err) {
          console.warn(`[realtime] pull ${table} failed:`, err)
        }
      }
    })

    channel.subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [spaceId])
}
