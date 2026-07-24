"use client"

import { useEffect } from "react"
import { useTheme } from "@/components/theme-provider"

export function ThemeMeta() {
  const { themeKey } = useTheme()

  useEffect(() => {
    const root = document.documentElement
    const bg = getComputedStyle(root).getPropertyValue("--background").trim()
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute("content", bg || "#09090b")
    } else {
      const m = document.createElement("meta")
      m.name = "theme-color"
      m.content = bg || "#09090b"
      document.head.appendChild(m)
    }
  }, [themeKey])

  return null
}
