"use client"

import { useState } from "react"
import { ICON_CATEGORIES, ALL_ICONS } from "@/lib/phosphor-icons"
import { Input } from "@/components/ui/input"
import * as Phosphor from "@phosphor-icons/react"

type IconBrowserProps = {
  value: string
  onChange: (icon: string) => void
  onClose: () => void
}

const DUOTONE_WEIGHT = "duotone" as const

function toPascalCase(str: string): string {
  return str
    .replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    .replace(/^[a-z]/, (c) => c.toUpperCase())
}

export function IconBrowser({ value, onChange, onClose }: IconBrowserProps) {
  const [search, setSearch] = useState("")
  const [selectedCat, setSelectedCat] = useState<string | null>(null)

  const categories = Object.entries(ICON_CATEGORIES)

  let filtered = selectedCat
    ? ALL_ICONS.filter((i) => i.category === selectedCat)
    : ALL_ICONS

  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter((i) => i.name.toLowerCase().includes(q) || i.icon.toLowerCase().includes(q))
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground">
          <Phosphor.ArrowLeft weight="bold" className="h-5 w-5" />
        </button>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search icons..."
          className="h-9 text-sm flex-1"
          autoFocus
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto px-4 py-2 scrollbar-hide border-b border-border">
        <button
          onClick={() => setSelectedCat(null)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${!selectedCat ? "bg-foreground text-background" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
        >
          All
        </button>
        {categories.map(([cat]) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${selectedCat === cat ? "bg-foreground text-background" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1">
          {filtered.map((item) => {
            const Icon = (Phosphor as any)[toPascalCase(item.icon)]
            if (!Icon) return null
            return (
              <button
                key={`${item.category}-${item.icon}`}
                onClick={() => { onChange(item.icon); onClose() }}
                className={`flex flex-col items-center gap-0.5 rounded-lg p-2 transition-colors hover:bg-secondary ${value === item.icon ? "bg-accent-color/10 ring-1 ring-accent-color" : ""}`}
                title={item.name}
              >
                <Icon weight={DUOTONE_WEIGHT} className="h-6 w-6 text-foreground" />
                <span className="text-[9px] text-muted-foreground truncate w-full text-center leading-tight">{item.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
