"use client"

import { useState } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"
import { useTheme } from "@/components/theme-provider"
import { useSpaces } from "@/hooks/use-spaces"
import { useAccounts, useProfile, useSpaceMembers, updateProfile, updateSpaceMember } from "@/hooks/use-db"
import { toast } from "sonner"
import { Copy, Check, LogOut, RotateCcw, Palette, Moon, Sun, DollarSign, CreditCard, Users, User, Wallet, Trash2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { uid } from "@/lib/uid"
import * as store from "@/lib/data-store"

function formatBalance(balance: number): string {
  const abs = Math.abs(balance)
  const formatted = "Rp" + abs.toLocaleString("id-ID")
  return balance < 0 ? `-${formatted}` : formatted
}

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
  const { spaces, regenerateInviteCode } = useSpaces(user?.id)
  const accounts = useAccounts(currentSpaceId)
  const profile = useProfile(user?.id)
  const members = useSpaceMembers()
  const [copied, setCopied] = useState(false)
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [newAccountName, setNewAccountName] = useState("")

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
    const body = {} as Record<string, unknown>
    body.defaultAccountId = accountId ?? null
    await updateSpaceMember(currentSpaceId, user.id, body as any)
    toast(accountId ? "Default payment updated" : "Default payment cleared")
  }

  async function handleAddAccount() {
    if (!newAccountName.trim() || !user?.id) return
    const newId = uid()
    await store.persist("accounts", "add", { id: newId, spaceId: currentSpaceId, name: newAccountName.trim(), createdAt: new Date().toISOString() })
    store.invalidate(["accounts"])
    setNewAccountName("")
    setShowAddAccount(false)
    toast(`Account "${newAccountName.trim()}" created`)
  }

  async function handleDeleteAccount(accountId: string, accountName: string) {
    await store.persist("accounts", "delete", undefined, accountId)
    store.invalidate(["accounts"])
    toast(`Account "${accountName}" deleted`)
  }

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

          {/* Account Management */}
          <section aria-label="Accounts" className="py-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" />
              <span>Accounts</span>
            </div>
            <div className="flex flex-col gap-1">
              {accounts.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 min-h-10">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{a.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{formatBalance(a.balance)}</span>
                  </div>
                  <button
                    onClick={() => {
                      toast(`Delete "${a.name}"?`, {
                        action: {
                          label: "Delete",
                          onClick: () => handleDeleteAccount(a.id, a.name),
                        },
                      })
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label={`Delete account ${a.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            {showAddAccount ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="Account name"
                  className="flex-1 h-10 text-sm"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddAccount() }}
                  autoFocus
                />
                <Button size="sm" onClick={handleAddAccount} disabled={!newAccountName.trim()}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowAddAccount(false); setNewAccountName("") }}>
                  Cancel
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddAccount(true)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Account
              </button>
            )}
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
                        "rounded-lg px-3 py-2 text-xs font-medium transition-colors min-h-10 flex items-center gap-1.5",
                        currentMember?.defaultAccountId === a.id
                          ? "bg-accent-color text-white shadow-sm"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      )}
                    >
                      {a.name}
                      <span className="opacity-70 tabular-nums">{formatBalance(a.balance)}</span>
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
                      {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
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
