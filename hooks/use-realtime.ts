"use client"

import { useEffect, useRef } from "react"
import { pullAll } from "@/lib/sync"

export function useMultiSync(spaceId: string) {
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!spaceId) return

    function poll() {
      if (document.hidden || !mountedRef.current) return
      pullAll()
    }

    poll()
    const id = setInterval(poll, 10_000)

    return () => { clearInterval(id) }
  }, [spaceId])
}
