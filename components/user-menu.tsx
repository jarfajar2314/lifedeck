"use client"

import { useState } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"
import { useTheme } from "@/components/theme-provider"
import { useProfile, updateProfile } from "@/hooks/use-db"
import { toast } from "sonner"
import { LogOut, Palette, Moon, Sun, DollarSign, User, Settings, ExternalLink, BarChart2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

type UserMenuProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentSpaceId: string
}

const MODES = ["dark", "light", "oled"] as const
const ACCENTS = ["emerald", "violet", "cyan", "pink"] as const
const PREDEFINED = ["pink-power", "royal-purple"] as const
const CURRENCIES = ["IDR", "USD", "EUR", "SGD", "MYR", "THB", "JPY", "KRW"]

const modeIcons: Record<string, React.ReactNode> = {
  dark: <Moon className="h-3.5 w-3.5" />,
  light: <Sun className="h-3.5 w-3.5" />,
  oled: <Palette className="h-3.5 w-3.5" />,
}

const predefinedLabels: Record<string, string> = {
  "pink-power": "Pink Power",
  "royal-purple": "Royal Purple",
}

export function UserMenu({ open, onOpenChange, currentSpaceId }: UserMenuProps) {
  const { user, signOut } = useAuth()
  const { themeKey, isPredefined, setTheme } = useTheme()
  const profile = useProfile(user?.id)

  async function handleCurrencyChange(newCurrency: string | null) {
    if (!newCurrency || !user?.id) return
    await updateProfile(user.id, { currency: newCurrency })
    toast(`Currency set to ${newCurrency}`)
  }

  async function handleThemeChange(key: string) {
    setTheme(key)
    if (user?.id) await updateProfile(user.id, { themePreference: key })
  }

  const handleSignOut = async () => {
    onOpenChange(false)
    await signOut()
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent aria-label="User settings">
        <DrawerHeader>
          <DrawerTitle>Settings</DrawerTitle>
          <DrawerDescription>Manage your preferences and account.</DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-0 overflow-y-auto px-4 pb-6">
          <section aria-label="Account" className="py-4">
            <div className="flex items-center gap-3">
              <Avatar size="lg">
                <AvatarFallback className="bg-accent-color/10 text-accent-color font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Shortcuts */}
          <section aria-label="Shortcuts" className="py-4 space-y-1">
            <Link
              href="/reports"
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-secondary/50"
            >
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
              Reports & Analytics
              <ExternalLink className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
            </Link>
            <Link
              href="/settings/user"
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-secondary/50"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              User Settings
              <ExternalLink className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
            </Link>
            <Link
              href="/settings/space"
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-secondary/50"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              Space Settings
              <ExternalLink className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
            </Link>
          </section>

          <Separator />

          {/* Appearance */}
          <section aria-label="Appearance" className="py-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Palette className="h-3.5 w-3.5" />
              <span>Appearance</span>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Theme</p>
              <div className="flex gap-1.5 flex-wrap">
                {MODES.map((m) => (
                  <button
                    key={m}
                    onClick={() => handleThemeChange(`${m}+emerald`)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                      "min-h-10",
                      !isPredefined && themeKey.startsWith(m)
                        ? "bg-accent-color text-white shadow-sm"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    {modeIcons[m]}
                    {m === "dark" ? "Dark" : m === "light" ? "Light" : "OLED"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Predefined</p>
              <div className="flex gap-1.5 flex-wrap">
                {PREDEFINED.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleThemeChange(p)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-xs font-medium transition-colors min-h-10",
                      isPredefined && themeKey === p
                        ? "bg-accent-color text-white shadow-sm"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    {predefinedLabels[p]}
                  </button>
                ))}
              </div>
            </div>

            {!isPredefined && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Accent Color</p>
                <div className="flex gap-1.5">
                  {ACCENTS.map((a) => {
                    const key = themeKey.split("+")[0] + "+" + a
                    return (
                      <button
                        key={a}
                        onClick={() => handleThemeChange(key)}
                        className={cn(
                          "rounded-lg px-3 py-2 text-xs font-medium transition-colors min-h-10",
                          themeKey === key
                            ? "bg-accent-color text-white shadow-sm"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        )}
                      >
                        {a.charAt(0).toUpperCase() + a.slice(1)}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </section>

          <Separator />

          {/* Preferences */}
          <section aria-label="Preferences" className="py-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              <span>Preferences</span>
            </div>

            <div className="flex items-center justify-between min-h-11">
              <p className="text-sm">Currency</p>
              <Select
                value={profile?.currency || "IDR"}
                onValueChange={handleCurrencyChange}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <Separator />

          {/* Sign Out */}
          <div className="pt-4 pb-2">
            <Button variant="destructive" className="w-full min-h-11" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
