"use client"

import { useEffect, useRef } from "react"
import { invalidate } from "@/lib/data-store"

const ALL_TABLES = ["transactions", "tasks", "notes", "spaces", "spaceMembers", "accounts", "categories", "profiles"]

export function useRealtime() {
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    const eventSource = new EventSource("/api/sse")

    eventSource.addEventListener("sync", (event) => {
      if (!mountedRef.current) return
      let tables = ALL_TABLES
      try {
        const payload = JSON.parse((event as MessageEvent).data) as { tables?: string[] }
        if (payload.tables?.length) tables = payload.tables
      } catch {}
      invalidate(tables)
    })

    eventSource.onerror = () => {
      eventSource.close()
      if (mountedRef.current) {
        setTimeout(() => {
          if (mountedRef.current) invalidate(ALL_TABLES)
        }, 15_000)
      }
    }

    return () => {
      eventSource.close()
    }
  }, [])
}
