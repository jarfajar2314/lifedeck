"use client"

import { useState } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"
import { useTheme } from "@/components/theme-provider"
import { useSpaces } from "@/hooks/use-spaces"
import { useAccounts, useProfile, useSpaceMembers, updateProfile, updateSpaceMember } from "@/hooks/use-db"
import { toast } from "sonner"
import { Copy, Check, LogOut, RotateCcw, Palette, Moon, Sun, DollarSign, CreditCard, Users, User } from "lucide-react"
import { cn } from "@/lib/utils"

type UserMenuProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentSpaceId: string
}

const MODES = ["dark", "light", "oled"] as const
const ACCENTS = ["emerald", "violet", "cyan"] as const
const CURRENCIES = ["IDR", "USD", "EUR", "SGD", "MYR", "THB", "JPY", "KRW"]

const modeIcons: Record<string, React.ReactNode> = {
  dark: <Moon className="h-3.5 w-3.5" />,
  light: <Sun className="h-3.5 w-3.5" />,
  oled: <Palette className="h-3.5 w-3.5" />,
}

export function UserMenu({ open, onOpenChange, currentSpaceId }: UserMenuProps) {
  const { user, signOut } = useAuth()
  const { mode, accent, setMode, setAccent } = useTheme()
  const { spaces, regenerateInviteCode } = useSpaces(user?.id)
  const accounts = useAccounts(currentSpaceId)
  const profile = useProfile(user?.id)
  const members = useSpaceMembers()
  const [copied, setCopied] = useState(false)

  const currentSpace = spaces.find((s) => s.id === currentSpaceId)
  const currentMember = members.find((m) => m.spaceId === currentSpaceId && m.userId === user?.id)

  async function handleCopyCode() {
    if (!currentSpace?.inviteCode) return
    await navigator.clipboard.writeText(currentSpace.inviteCode)
    setCopied(true)
    toast("Invite code copied")
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRegenerate() {
    await regenerateInviteCode(currentSpaceId)
    toast("Invite code regenerated")
  }

  async function handleSetDefaultAccount(accountId: string | undefined) {
    if (!user?.id) return
    await updateSpaceMember(currentSpaceId, user.id, { defaultAccountId: accountId })
    toast(accountId ? "Default payment updated" : "Default payment cleared")
  }

  async function handleCurrencyChange(newCurrency: string | null) {
    if (!newCurrency || !user?.id) return
    await updateProfile(user.id, { currency: newCurrency })
    toast(`Currency set to ${newCurrency}`)
  }

  async function handleThemeModeChange(newMode: (typeof MODES)[number]) {
    setMode(newMode)
    if (user?.id) await updateProfile(user.id, { themePreference: newMode })
  }

  async function handleAccentChange(newAccent: (typeof ACCENTS)[number]) {
    setAccent(newAccent)
    if (user?.id) await updateProfile(user.id, { accentColor: newAccent })
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
          {/* Account Section */}
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

          {/* Appearance */}
          <section aria-label="Appearance" className="py-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Palette className="h-3.5 w-3.5" />
              <span>Appearance</span>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Theme</p>
              <div className="flex gap-1.5">
                {MODES.map((m) => (
                  <button
                    key={m}
                    onClick={() => handleThemeModeChange(m)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                      "min-h-10",
                      mode === m
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
              <p className="text-xs text-muted-foreground mb-2">Accent Color</p>
              <div className="flex gap-1.5">
                {ACCENTS.map((a) => (
                  <button
                    key={a}
                    onClick={() => handleAccentChange(a)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                      "min-h-10",
                      accent === a
                        ? "bg-accent-color text-white shadow-sm"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    {a.charAt(0).toUpperCase() + a.slice(1)}
                  </button>
                ))}
              </div>
            </div>
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

          {/* Default Payment */}
          {accounts.length > 0 && (
            <>
              <section aria-label="Default payment" className="py-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Default Payment</span>
                </div>
                <p className="text-xs text-muted-foreground -mt-1">
                  Used when you don&apos;t specify an @account in the command bar.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleSetDefaultAccount(undefined)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-xs font-medium transition-colors min-h-10",
                      !currentMember?.defaultAccountId
                        ? "bg-accent-color text-white shadow-sm"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    None
                  </button>
                  {accounts.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => handleSetDefaultAccount(a.id)}
                      className={cn(
                        "rounded-lg px-3 py-2 text-xs font-medium transition-colors min-h-10",
                        currentMember?.defaultAccountId === a.id
                          ? "bg-accent-color text-white shadow-sm"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      )}
                    >
                      {a.name}
                    </button>
                  ))}
                </div>
              </section>
              <Separator />
            </>
          )}

          {/* Space Settings */}
          {currentSpace && (
            <>
              <section aria-label="Space" className="py-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>{currentSpace.name} Space</span>
                </div>
                {currentSpace.inviteCode && (
                  <div className="flex items-center gap-2 rounded-xl bg-secondary/50 p-3">
                    <code className="flex-1 text-sm font-mono font-medium truncate">{currentSpace.inviteCode}</code>
                    <button
                      onClick={handleCopyCode}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary transition-colors shrink-0"
                      aria-label={copied ? "Copied" : "Copy invite code"}
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={handleRegenerate}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary transition-colors shrink-0"
                      aria-label="Regenerate invite code"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {currentSpace.name !== "Personal" && (
                  <p className="text-xs text-muted-foreground">
                    Role: {currentMember?.role === "owner" ? "Owner" : "Member"}
                  </p>
                )}
              </section>
              <Separator />
            </>
          )}

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
