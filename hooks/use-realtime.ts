"use client"

import { useEffect, useRef } from "react"

export function useRealtime() {
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    const eventSource = new EventSource("/api/sse")

    eventSource.addEventListener("sync", () => {
      if (!mountedRef.current) return
      window.dispatchEvent(new CustomEvent("data-refresh"))
    })

    eventSource.onerror = () => {
      eventSource.close()
      if (mountedRef.current) {
        setTimeout(() => {
          if (mountedRef.current) {
            window.dispatchEvent(new CustomEvent("data-refresh"))
          }
        }, 15_000)
      }
    }

    return () => {
      eventSource.close()
    }
  }, [])
}
