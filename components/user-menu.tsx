"use client"

import { useState, useEffect } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { useTheme } from "@/components/theme-provider"
import { useSpaces } from "@/hooks/use-spaces"
import { useAccounts, useProfile, updateProfile, updateSpaceMember } from "@/hooks/use-db"
import { toast } from "sonner"
import { Copy, Check, LogOut, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

type UserMenuProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentSpaceId: string
}

const MODES = ["dark", "light", "oled"] as const
const ACCENTS = ["emerald", "violet", "cyan"] as const
const CURRENCIES = ["IDR", "USD", "EUR", "SGD", "MYR", "THB", "JPY", "KRW"]

export function UserMenu({ open, onOpenChange, currentSpaceId }: UserMenuProps) {
  const { user, signOut } = useAuth()
  const { mode, accent, setMode, setAccent } = useTheme()
  const { spaces, regenerateInviteCode } = useSpaces(user?.id)
  const accounts = useAccounts(currentSpaceId)
  const profile = useProfile(user?.id)
  const [defaultAccountId, setDefaultAccountId] = useState<string | undefined>()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    fetch("/api/data?table=spaceMembers", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        const members = json.data as { id: string; spaceId: string; userId: string; defaultAccountId?: string }[]
        const m = members.find((x) => x.spaceId === currentSpaceId && x.userId === user.id)
        setDefaultAccountId(m?.defaultAccountId)
      })
      .catch(() => {})
  }, [currentSpaceId, user?.id, open])

  const currentSpace = spaces.find((s) => s.id === currentSpaceId)
  const currentMember = currentSpace?.role

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

  async function handleCurrencyChange(newCurrency: string) {
    if (!user?.id) return
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

        <div className="flex flex-col gap-6 overflow-y-auto p-4 pt-0">
          {/* Profile */}
          <section aria-label="Profile">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profile</h3>
            <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-color/10 text-sm font-bold text-accent-color">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
              </div>
            </div>
          </section>

          {/* Theme */}
          <section aria-label="Theme">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Theme</h3>
            <div className="flex flex-wrap gap-1.5">
              {MODES.map((m) => (
                <button
                  key={m}
                  onClick={() => handleThemeModeChange(m)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    mode === m ? "bg-accent-color text-white" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {m === "dark" ? "Dark" : m === "light" ? "Light" : "OLED"}
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ACCENTS.map((a) => (
                <button
                  key={a}
                  onClick={() => handleAccentChange(a)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    accent === a ? "bg-accent-color text-white" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </button>
              ))}
            </div>
          </section>

          {/* Currency */}
          <section aria-label="Currency">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Currency</h3>
            <div className="flex flex-wrap gap-1.5">
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  onClick={() => handleCurrencyChange(c)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    (profile?.currency || "IDR") === c
                      ? "bg-accent-color text-white"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </section>

          {/* Default Payment */}
          {accounts.length > 0 && (
            <section aria-label="Default payment">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Default Payment</h3>
              <p className="mb-1.5 text-xs text-muted-foreground">
                Used when you don&apos;t specify an @account in the command bar.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleSetDefaultAccount(undefined)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    !defaultAccountId
                      ? "bg-accent-color text-white"
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
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                      defaultAccountId === a.id
                        ? "bg-accent-color text-white"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    {a.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Space Settings */}
          {currentSpace && (
            <section aria-label="Space settings">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {currentSpace.name} Space
              </h3>
              {currentSpace.inviteCode && (
                <div className="flex items-center gap-2 rounded-xl bg-secondary/50 p-3">
                  <code className="flex-1 text-sm font-mono font-medium">{currentSpace.inviteCode}</code>
                  <button
                    onClick={handleCopyCode}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
                    aria-label={copied ? "Copied" : "Copy invite code"}
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={handleRegenerate}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
                    aria-label="Regenerate invite code"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              )}
              {currentSpace.name !== "Personal" && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Role: {currentMember === "owner" ? "Owner" : "Member"}
                </p>
              )}
            </section>
          )}

          {/* Sign Out */}
          <div className="pt-2">
            <Button variant="destructive" className="w-full" onClick={handleSignOut}>
              <LogOut /> Sign Out
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
