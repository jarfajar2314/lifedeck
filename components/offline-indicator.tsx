"use client"

import { useState, useEffect } from "react"
import { getQueuedCount, subscribeQueue, flushQueue } from "@/lib/data-store"
import { WifiOff, RefreshCw } from "lucide-react"

export function OfflineIndicator() {
  const [online, setOnline] = useState(true)
  const [queued, setQueued] = useState(getQueuedCount())

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)
    setOnline(navigator.onLine)
    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
    }
  }, [])

  useEffect(() => {
    const unsub = subscribeQueue(() => setQueued(getQueuedCount()))
    return unsub
  }, [])

  useEffect(() => {
    if (online && queued > 0) {
      flushQueue()
    }
  }, [online, queued])

  if (online && queued === 0) return null

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400">
      {!online ? (
        <>
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          <span>You&apos;re offline — changes will sync when connected</span>
        </>
      ) : (
        <>
          <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin" />
          <span>Syncing {queued} pending change{queued !== 1 ? "s" : ""}...</span>
        </>
      )}
    </div>
  )
}
