"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

type BaseMode = "dark" | "light" | "oled"
type AccentColor = "emerald" | "violet" | "cyan" | "pink"
type PredefinedTheme = "pink-power" | "royal-purple"

type ThemeContextValue = {
  themeKey: string
  isPredefined: boolean
  accent: AccentColor | null
  setTheme: (key: string) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const ACCENT_MAP: Record<AccentColor, string> = {
  emerald: "oklch(0.72 0.18 160)",
  violet: "oklch(0.68 0.22 290)",
  cyan: "oklch(0.72 0.18 195)",
  pink: "oklch(0.68 0.22 350)",
}

const ALL_VARS = [
  "--background", "--foreground", "--card", "--card-foreground",
  "--popover", "--popover-foreground",
  "--primary", "--primary-foreground",
  "--secondary", "--secondary-foreground",
  "--muted", "--muted-foreground",
  "--accent", "--accent-foreground",
  "--success", "--success-foreground",
  "--destructive",
  "--border", "--input", "--ring",
  "--radius",
  "--sidebar", "--sidebar-foreground",
  "--sidebar-primary", "--sidebar-primary-foreground",
  "--sidebar-accent", "--sidebar-accent-foreground",
  "--sidebar-border", "--sidebar-ring",
  "--accent-color",
]

const BASE_THEME_VARS: Record<BaseMode, Record<string, string>> = {
  light: {
    "--background": "oklch(1 0 0)",
    "--foreground": "oklch(0.145 0 0)",
    "--card": "oklch(1 0 0)",
    "--card-foreground": "oklch(0.145 0 0)",
    "--popover": "oklch(1 0 0)",
    "--popover-foreground": "oklch(0.145 0 0)",
    "--primary": "oklch(0.205 0 0)",
    "--primary-foreground": "oklch(0.985 0 0)",
    "--secondary": "oklch(0.97 0 0)",
    "--secondary-foreground": "oklch(0.205 0 0)",
    "--muted": "oklch(0.97 0 0)",
    "--muted-foreground": "oklch(0.556 0 0)",
    "--accent": "oklch(0.97 0 0)",
    "--accent-foreground": "oklch(0.205 0 0)",
    "--success": "oklch(0.55 0.18 142)",
    "--success-foreground": "oklch(1 0 0)",
    "--destructive": "oklch(0.577 0.245 27.325)",
    "--border": "oklch(0.922 0 0)",
    "--input": "oklch(0.922 0 0)",
    "--ring": "oklch(0.708 0 0)",
    "--radius": "0.625rem",
    "--sidebar": "oklch(0.985 0 0)",
    "--sidebar-foreground": "oklch(0.145 0 0)",
    "--sidebar-primary": "oklch(0.205 0 0)",
    "--sidebar-primary-foreground": "oklch(0.985 0 0)",
    "--sidebar-accent": "oklch(0.97 0 0)",
    "--sidebar-accent-foreground": "oklch(0.205 0 0)",
    "--sidebar-border": "oklch(0.922 0 0)",
    "--sidebar-ring": "oklch(0.708 0 0)",
  },
  dark: {
    "--background": "oklch(0.145 0 0)",
    "--foreground": "oklch(0.985 0 0)",
    "--card": "oklch(0.205 0 0)",
    "--card-foreground": "oklch(0.985 0 0)",
    "--popover": "oklch(0.205 0 0)",
    "--popover-foreground": "oklch(0.985 0 0)",
    "--primary": "oklch(0.922 0 0)",
    "--primary-foreground": "oklch(0.205 0 0)",
    "--secondary": "oklch(0.269 0 0)",
    "--secondary-foreground": "oklch(0.985 0 0)",
    "--muted": "oklch(0.269 0 0)",
    "--muted-foreground": "oklch(0.708 0 0)",
    "--accent": "oklch(0.269 0 0)",
    "--accent-foreground": "oklch(0.985 0 0)",
    "--success": "oklch(0.55 0.18 142)",
    "--success-foreground": "oklch(1 0 0)",
    "--destructive": "oklch(0.704 0.191 22.216)",
    "--border": "oklch(1 0 0 / 10%)",
    "--input": "oklch(1 0 0 / 15%)",
    "--ring": "oklch(0.556 0 0)",
    "--radius": "0.625rem",
    "--sidebar": "oklch(0.205 0 0)",
    "--sidebar-foreground": "oklch(0.985 0 0)",
    "--sidebar-primary": "oklch(0.488 0.243 264.376)",
    "--sidebar-primary-foreground": "oklch(0.985 0 0)",
    "--sidebar-accent": "oklch(0.269 0 0)",
    "--sidebar-accent-foreground": "oklch(0.985 0 0)",
    "--sidebar-border": "oklch(1 0 0 / 10%)",
    "--sidebar-ring": "oklch(0.556 0 0)",
  },
  oled: {
    "--background": "#000000",
    "--foreground": "oklch(0.985 0 0)",
    "--card": "#000000",
    "--card-foreground": "oklch(0.985 0 0)",
    "--popover": "#000000",
    "--popover-foreground": "oklch(0.985 0 0)",
    "--primary": "oklch(0.922 0 0)",
    "--primary-foreground": "#000000",
    "--secondary": "oklch(0.18 0 0)",
    "--secondary-foreground": "oklch(0.985 0 0)",
    "--muted": "oklch(0.18 0 0)",
    "--muted-foreground": "oklch(0.556 0 0)",
    "--accent": "oklch(0.18 0 0)",
    "--accent-foreground": "oklch(0.985 0 0)",
    "--success": "oklch(0.55 0.18 142)",
    "--success-foreground": "oklch(1 0 0)",
    "--destructive": "oklch(0.704 0.191 22.216)",
    "--border": "oklch(1 0 0 / 8%)",
    "--input": "oklch(1 0 0 / 12%)",
    "--ring": "oklch(0.556 0 0)",
    "--radius": "0.625rem",
    "--sidebar": "#000000",
    "--sidebar-foreground": "oklch(0.985 0 0)",
    "--sidebar-primary": "oklch(0.488 0.243 264.376)",
    "--sidebar-primary-foreground": "#000000",
    "--sidebar-accent": "#000000",
    "--sidebar-accent-foreground": "oklch(0.985 0 0)",
    "--sidebar-border": "oklch(1 0 0 / 8%)",
    "--sidebar-ring": "oklch(0.556 0 0)",
  },
}

const PREDEFINED_VARS: Record<PredefinedTheme, Record<string, string>> = {
  "pink-power": {
    "--background": "oklch(0.93 0.04 330)",
    "--foreground": "oklch(0.12 0.05 330)",
    "--card": "oklch(0.955 0.025 330)",
    "--card-foreground": "oklch(0.12 0.05 330)",
    "--popover": "oklch(0.955 0.025 330)",
    "--popover-foreground": "oklch(0.12 0.05 330)",
    "--primary": "oklch(0.68 0.24 330)",
    "--primary-foreground": "oklch(1 0 0)",
    "--secondary": "oklch(0.6 0.2 190)",
    "--secondary-foreground": "oklch(1 0 0)",
    "--muted": "oklch(0.90 0.035 330)",
    "--muted-foreground": "oklch(0.4 0.08 330)",
    "--accent": "oklch(0.90 0.04 330)",
    "--accent-foreground": "oklch(0.68 0.24 330)",
    "--success": "oklch(0.55 0.18 142)",
    "--success-foreground": "oklch(1 0 0)",
    "--destructive": "oklch(0.6 0.24 27)",
    "--border": "oklch(0.85 0.03 330 / 0.5)",
    "--input": "oklch(0.85 0.03 330 / 0.5)",
    "--ring": "oklch(0.68 0.24 330 / 0.3)",
    "--radius": "0.625rem",
    "--sidebar": "oklch(0.94 0.03 330)",
    "--sidebar-foreground": "oklch(0.12 0.05 330)",
    "--sidebar-primary": "oklch(0.68 0.24 330)",
    "--sidebar-primary-foreground": "oklch(1 0 0)",
    "--sidebar-accent": "oklch(0.90 0.04 330)",
    "--sidebar-accent-foreground": "oklch(0.68 0.24 330)",
    "--sidebar-border": "oklch(0.85 0.03 330 / 0.3)",
    "--sidebar-ring": "oklch(0.68 0.24 330 / 0.3)",
    "--accent-color": "oklch(0.68 0.24 330)",
  },
  "royal-purple": {
    "--background": "oklch(0.92 0.04 270)",
    "--foreground": "oklch(0.12 0.06 270)",
    "--card": "oklch(0.945 0.025 270)",
    "--card-foreground": "oklch(0.12 0.06 270)",
    "--popover": "oklch(0.945 0.025 270)",
    "--popover-foreground": "oklch(0.12 0.06 270)",
    "--primary": "oklch(0.55 0.22 270)",
    "--primary-foreground": "oklch(1 0 0)",
    "--secondary": "oklch(0.72 0.2 80)",
    "--secondary-foreground": "oklch(0.12 0.06 270)",
    "--muted": "oklch(0.89 0.035 270)",
    "--muted-foreground": "oklch(0.4 0.08 270)",
    "--accent": "oklch(0.89 0.04 80)",
    "--accent-foreground": "oklch(0.55 0.22 270)",
    "--success": "oklch(0.55 0.18 142)",
    "--success-foreground": "oklch(1 0 0)",
    "--destructive": "oklch(0.6 0.24 27)",
    "--border": "oklch(0.84 0.03 270 / 0.5)",
    "--input": "oklch(0.84 0.03 270 / 0.5)",
    "--ring": "oklch(0.55 0.22 270 / 0.3)",
    "--radius": "0.625rem",
    "--sidebar": "oklch(0.93 0.03 270)",
    "--sidebar-foreground": "oklch(0.12 0.06 270)",
    "--sidebar-primary": "oklch(0.55 0.22 270)",
    "--sidebar-primary-foreground": "oklch(1 0 0)",
    "--sidebar-accent": "oklch(0.89 0.04 80)",
    "--sidebar-accent-foreground": "oklch(0.55 0.22 270)",
    "--sidebar-border": "oklch(0.84 0.03 270 / 0.3)",
    "--sidebar-ring": "oklch(0.55 0.22 270 / 0.3)",
    "--accent-color": "oklch(0.55 0.22 270)",
  },
}

function parseThemeKey(key: string): { baseMode?: BaseMode; accent?: AccentColor; predefined?: PredefinedTheme } {
  if (key === "pink-power") return { predefined: "pink-power" }
  if (key === "royal-purple") return { predefined: "royal-purple" }
  const parts = key.split("+")
  const mode = parts[0] as BaseMode
  const accent = parts[1] as AccentColor | undefined
  if (["dark", "light", "oled"].includes(mode)) {
    return { baseMode: mode, accent: accent || "emerald" }
  }
  return { baseMode: "dark", accent: "emerald" }
}

function applyVars(vars: Record<string, string>) {
  const root = document.documentElement
  for (const name of ALL_VARS) {
    if (name in vars) {
      root.style.setProperty(name, vars[name])
    } else {
      root.style.removeProperty(name)
    }
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeKey, setThemeKeyState] = useState<string>("dark+emerald")

  useEffect(() => {
    const saved = localStorage.getItem("lifedeck-theme-key")
    if (saved) {
      setThemeKeyState(saved)
    } else {
      // migrate from old separate mode/accent storage
      const oldMode = localStorage.getItem("lifedeck-theme-mode")
      const oldAccent = localStorage.getItem("lifedeck-theme-accent")
      if (oldMode) {
        const migrated = oldAccent ? `${oldMode}+${oldAccent}` : `${oldMode}+emerald`
        setThemeKeyState(migrated)
        localStorage.setItem("lifedeck-theme-key", migrated)
        localStorage.removeItem("lifedeck-theme-mode")
        localStorage.removeItem("lifedeck-theme-accent")
      }
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const parsed = parseThemeKey(themeKey)

    root.classList.remove("dark", "oled")

    if (parsed.predefined) {
      applyVars(PREDEFINED_VARS[parsed.predefined])
    } else if (parsed.baseMode) {
      const vars = { ...BASE_THEME_VARS[parsed.baseMode] }
      if (parsed.accent) {
        vars["--accent-color"] = ACCENT_MAP[parsed.accent]
      }
      applyVars(vars)
    }
  }, [themeKey])

  const setTheme = useCallback((key: string) => {
    setThemeKeyState(key)
    localStorage.setItem("lifedeck-theme-key", key)
  }, [])

  const parsed = parseThemeKey(themeKey)
  const isPredefined = !!parsed.predefined
  const accent = parsed.accent ?? null

  return (
    <ThemeContext.Provider value={{ themeKey, isPredefined, accent, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
