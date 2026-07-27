"use client"

import * as Phosphor from "@phosphor-icons/react"
import type { Account } from "@/lib/db"

type AccountBadgeProps = {
  account: Account
  size?: "sm" | "md"
}

function toPascalCase(str: string): string {
  return str
    .replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    .replace(/^[a-z]/, (c) => c.toUpperCase())
}

export function AccountBadge({ account, size = "sm" }: AccountBadgeProps) {
  const color = account.color || "#6B7280"
  const iconName = account.icon || "wallet"
  const IconComponent = (Phosphor as any)[toPascalCase(iconName)]
  const iconEl = IconComponent ? <IconComponent weight="duotone" className={size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5"} /> : null

  if (size === "sm") {
    return (
      <span className="inline-flex items-center justify-center rounded-full text-foreground" style={{ width: 20, height: 20, backgroundColor: color }} aria-hidden="true">
        {iconEl}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-foreground" style={{ backgroundColor: `${color}20` }}>
      {iconEl}
      {account.name}
    </span>
  )
}
