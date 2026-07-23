"use client"

import { useState } from "react"
import { Home, User, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

type Space = { id: string; name: string; icon: "personal" | "home" }

const SPACES: Space[] = [
  { id: "personal", name: "Personal", icon: "personal" },
  { id: "home", name: "Home & Family", icon: "home" },
]

type SpaceSelectorProps = {
  currentId: string
  onSwitch: (id: string) => void
}

export function SpaceSelector({ currentId, onSwitch }: SpaceSelectorProps) {
  const [open, setOpen] = useState(false)
  const current = SPACES.find((s) => s.id === currentId) ?? SPACES[0]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary"
      >
        {current.icon === "personal" ? (
          <User className="h-4 w-4" />
        ) : (
          <Home className="h-4 w-4" />
        )}
        {current.name}
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg">
            {SPACES.map((space) => (
              <button
                key={space.id}
                onClick={() => { onSwitch(space.id); setOpen(false) }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  space.id === currentId
                    ? "bg-accent-color/10 text-accent-color font-medium"
                    : "text-popover-foreground hover:bg-secondary"
                )}
              >
                {space.icon === "personal" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Home className="h-4 w-4" />
                )}
                {space.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
