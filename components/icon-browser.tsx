"use client"

import { useState } from "react"
import { ICON_CATEGORIES } from "@/lib/phosphor-icons"
import { Input } from "@/components/ui/input"
import * as Phosphor from "@phosphor-icons/react"

type IconBrowserProps = {
  value: string
  onChange: (icon: string) => void
  onClose: () => void
}

const DUOTONE_WEIGHT = "duotone" as const

export function IconBrowser({ value, onChange, onClose }: IconBrowserProps) {
  const [search, setSearch] = useState("")
  const [selectedCat, setSelectedCat] = useState<string | null>(null)

  const categories = Object.entries(ICON_CATEGORIES)

  let filtered = selectedCat
    ? ICON_CATEGORIES[selectedCat] || []
    : Object.values(ICON_CATEGORIES).flat()

  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter((i) => i.name.toLowerCase().includes(q) || i.icon.toLowerCase().includes(q))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-background border border-border p-4 shadow-lg max-h-[80dvh] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Choose Icon</h3>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground">
            <Phosphor.X weight="bold" className="h-4 w-4" />
          </button>
        </div>

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search icons..."
          className="h-9 text-sm mb-3"
          autoFocus
        />

        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCat(null)}
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${!selectedCat ? "bg-foreground text-background" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
          >
            All
          </button>
          {categories.map(([cat]) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${selectedCat === cat ? "bg-foreground text-background" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-6 sm:grid-cols-8 gap-1">
          {filtered.map((item) => {
            const Icon = (Phosphor as any)[item.icon.charAt(0).toUpperCase() + item.icon.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase())]
            if (!Icon) return null
            return (
              <button
                key={item.icon}
                onClick={() => { onChange(item.icon); onClose() }}
                className={`flex flex-col items-center gap-0.5 rounded-lg p-2 transition-colors hover:bg-secondary ${value === item.icon ? "bg-accent-color/10 ring-1 ring-accent-color" : ""}`}
                title={item.name}
              >
                <Icon weight={DUOTONE_WEIGHT} className="h-5 w-5 text-foreground" />
                <span className="text-[8px] text-muted-foreground truncate w-full text-center leading-tight">{item.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
