"use client"

import * as Phosphor from "@phosphor-icons/react"
import type { Category } from "@/lib/db"

type CategoryBadgeProps = {
  category: Category
  size?: "sm" | "md"
}

const DUOTONE_WEIGHT = "duotone" as const

function toPascalCase(str: string): string {
  return str
    .replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    .replace(/^[a-z]/, (c) => c.toUpperCase())
}

export function CategoryBadge({ category, size = "sm" }: CategoryBadgeProps) {
  const iconName = category.icon || "tag"
  const IconComponent = (Phosphor as any)[toPascalCase(iconName)]
  const iconEl = IconComponent ? <IconComponent weight={DUOTONE_WEIGHT} className={size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5"} /> : null

  if (size === "sm") {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full text-foreground"
        style={{ backgroundColor: category.color || "#6B7280", width: 20, height: 20 }}
        aria-hidden="true"
      >
        {iconEl}
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-foreground"
      style={{ backgroundColor: `${category.color || "#6B7280"}20` }}
    >
      {iconEl}
      {category.name}
    </span>
  )
}
