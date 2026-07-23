"use client"

import { useEffect, useRef } from "react"
import { pullAll, pullTable } from "@/lib/sync"
import db from "@/lib/db"

const DEXIE_TABLE: Record<string, string> = {
  transactions: "transactions",
  tasks: "tasks",
  notes: "notes",
  spaceMembers: "spaceMembers",
}

export function useMultiSync(spaceId: string) {
  const mountedRef = useRef(true)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!spaceId) return

    function syncTables(tables: string[]) {
      for (const table of tables) {
        const dexieTable = DEXIE_TABLE[table]
        if (!dexieTable) continue
        pullTable(table).then((rows) => {
          if (!mountedRef.current) return
          const t = (db as any)[dexieTable]
          for (const row of rows) {
            t.put(row)
          }
        }).catch((err) => console.warn(`[sse] pull ${table} failed:`, err))
      }
    }

    const eventSource = new EventSource("/api/sse")
    eventSourceRef.current = eventSource

    eventSource.addEventListener("sync", (event) => {
      if (!mountedRef.current) return
      try {
        const { tables } = JSON.parse(event.data)
        if (tables?.length) syncTables(tables)
      } catch { /* ignore malformed payload */ }
    })

    eventSource.onerror = () => {
      eventSource.close()
      if (mountedRef.current) {
        const retry = setTimeout(() => {
          if (mountedRef.current) pullAll()
        }, 15_000)
      }
    }

    const fallbackInterval = setInterval(() => {
      if (document.hidden || !mountedRef.current) return
      pullAll()
    }, 60_000)

    return () => {
      eventSource.close()
      eventSourceRef.current = null
      clearInterval(fallbackInterval)
    }
  }, [spaceId])
}
