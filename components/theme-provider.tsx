"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

type AccentColor = "emerald" | "violet" | "cyan"
type ThemeMode = "dark" | "light" | "oled"

type ThemeContextValue = {
  mode: ThemeMode
  accent: AccentColor
  setMode: (mode: ThemeMode) => void
  setAccent: (accent: AccentColor) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const ACCENT_MAP: Record<AccentColor, string> = {
  emerald: "oklch(0.72 0.18 160)",
  violet: "oklch(0.68 0.22 290)",
  cyan: "oklch(0.72 0.18 195)",
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("dark")
  const [accent, setAccentState] = useState<AccentColor>("emerald")

  useEffect(() => {
    const savedMode = localStorage.getItem("lifedeck-theme-mode") as ThemeMode | null
    const savedAccent = localStorage.getItem("lifedeck-theme-accent") as AccentColor | null
    if (savedMode) setModeState(savedMode)
    if (savedAccent) setAccentState(savedAccent)
  }, [])

  useEffect(() => {
    const root = document.documentElement

    if (mode === "oled") {
      root.classList.add("dark", "oled")
    } else {
      root.classList.toggle("dark", mode === "dark")
      root.classList.remove("oled")
    }

    root.style.setProperty("--accent-color", ACCENT_MAP[accent])
    root.setAttribute("data-accent", accent)
  }, [mode, accent])

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m)
    localStorage.setItem("lifedeck-theme-mode", m)
  }, [])

  const setAccent = useCallback((a: AccentColor) => {
    setAccentState(a)
    localStorage.setItem("lifedeck-theme-accent", a)
  }, [])

  return (
    <ThemeContext.Provider value={{ mode, accent, setMode, setAccent }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
