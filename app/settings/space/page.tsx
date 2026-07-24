"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { useAccounts, useSpaceMembers, updateSpaceMember } from "@/hooks/use-db"
import { useSpaces } from "@/hooks/use-spaces"
import { OfflineIndicator } from "@/components/offline-indicator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Copy, Check, RotateCcw, Users, Wallet, CreditCard, Palette, Trash2, Pencil, X, Plus } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SpaceSelector } from "@/components/space-selector"
import { UserMenu } from "@/components/user-menu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { uid } from "@/lib/uid"
import * as store from "@/lib/data-store"

function formatBalance(balance: number): string {
  const abs = Math.abs(balance)
  const formatted = "Rp" + abs.toLocaleString("id-ID")
  return balance < 0 ? `-${formatted}` : formatted
}

const CURRENCIES = ["IDR", "USD", "EUR", "SGD", "MYR", "THB", "JPY", "KRW"]

export default function SpaceSettingsPage() {
  const { user, isPending } = useAuth()
  const { spaces, currentId, members, setCurrentId, createSpace, joinSpace, regenerateInviteCode } = useSpaces(user?.id)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const { items: accounts } = useAccounts(currentId)
  const allMembers = useSpaceMembers(currentId)

  const currentSpace = spaces.find((s) => s.id === currentId)
  const currentMember = allMembers.find((m) => m.spaceId === currentId && m.userId === user?.id)
  const spaceMembers = allMembers.filter((m) => m.spaceId === currentId)

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState("")
  const [copied, setCopied] = useState(false)
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [newAccountName, setNewAccountName] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteInput, setDeleteInput] = useState("")

  if (isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <p className="text-muted-foreground">Sign in to manage space settings.</p>
      </div>
    )
  }

  async function handleRename() {
    if (!nameInput.trim()) return
    await store.persist("spaces", "update", { name: nameInput.trim() }, currentId)
    store.invalidate(["spaces"])
    setEditingName(false)
    toast("Space renamed")
  }

  async function handleCopyCode() {
    if (!currentSpace?.inviteCode) return
    await navigator.clipboard.writeText(currentSpace.inviteCode)
    setCopied(true)
    toast("Invite code copied")
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRegenerate() {
    await regenerateInviteCode(currentId)
    toast("Invite code regenerated")
  }

  async function handleSetDefaultAccount(accountId: string | undefined) {
    if (!user?.id) return
    await updateSpaceMember(currentId, user.id, { defaultAccountId: accountId ?? undefined } as any)
    toast(accountId ? "Default payment updated" : "Default payment cleared")
  }

  async function handleAddAccount() {
    if (!newAccountName.trim()) return
    const newId = uid()
    await store.persist("accounts", "add", { id: newId, spaceId: currentId, name: newAccountName.trim(), balance: 0, createdAt: new Date().toISOString() })
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

  async function handleDeleteSpace() {
    if (deleteInput !== currentSpace?.name) return
    await fetch(`/api/spaces/${currentId}`, { method: "DELETE", credentials: "include" })
    store.invalidate(["spaces", "spaceMembers"])
    const remaining = spaces.filter((s) => s.id !== currentId)
    if (remaining[0]) setCurrentId(remaining[0].id)
    toast("Space deleted")
  }

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <OfflineIndicator />

      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-secondary/50"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <img src="/lifedeck.svg" alt="LifeDeck" width={24} height={24} className="shrink-0 text-foreground" />
            <SpaceSelector
              spaces={spaces}
              currentId={currentId}
              onSwitch={setCurrentId}
              onCreateSpace={createSpace}
              onJoinSpace={joinSpace}
              onRegenerateCode={regenerateInviteCode}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUserMenuOpen(true)}
              className="flex items-center justify-center rounded-full transition-colors hover:bg-secondary/50"
              aria-label="Open settings"
              style={{ width: 44, height: 44 }}
            >
              <Avatar size="sm">
                <AvatarFallback className="text-foreground font-bold text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" aria-hidden="true" /> Space Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <section aria-label="Space name">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Space Name</p>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="h-9 text-sm flex-1" autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleRename() }} />
                  <button onClick={handleRename} className="flex h-8 w-8 items-center justify-center rounded-lg text-success hover:bg-secondary"><Check className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setEditingName(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"><X className="h-3.5 w-3.5" /></button>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2">
                  <span className="text-sm font-medium">{currentSpace?.name}</span>
                  <button onClick={() => { setNameInput(currentSpace?.name || ""); setEditingName(true) }} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </section>

            <Separator />

            <section aria-label="Invite code">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Invite Code</p>
              {currentSpace?.inviteCode && (
                <div className="flex items-center gap-2 rounded-xl bg-secondary/50 p-3">
                  <code className="flex-1 text-sm font-mono font-medium truncate">{currentSpace.inviteCode}</code>
                  <button onClick={handleCopyCode} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary transition-colors shrink-0" aria-label={copied ? "Copied" : "Copy invite code"}>
                    {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button onClick={handleRegenerate} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary transition-colors shrink-0" aria-label="Regenerate invite code">
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              )}
            </section>

            <Separator />

            <section aria-label="Accounts">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Accounts</p>
                <Link
                  href="/settings/space/accounts"
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Manage
                </Link>
              </div>
              <div className="flex flex-col gap-1">
                {accounts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">{a.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{formatBalance(a.balance)}</span>
                    </div>
                    <button
                      onClick={() => { toast(`Delete "${a.name}"?`, { action: { label: "Delete", onClick: () => handleDeleteAccount(a.id, a.name) } }) }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              {showAddAccount ? (
                <div className="flex items-center gap-2 mt-2">
                  <Input value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} placeholder="Account name" className="h-8 text-sm flex-1" onKeyDown={(e) => { if (e.key === "Enter") handleAddAccount() }} autoFocus />
                  <Button size="sm" onClick={handleAddAccount} disabled={!newAccountName.trim()}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowAddAccount(false); setNewAccountName("") }}>Cancel</Button>
                </div>
              ) : (
                <button onClick={() => setShowAddAccount(true)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary transition-colors mt-1">
                  <Plus className="h-4 w-4" /> Add Account
                </button>
              )}
            </section>

            <Separator />

            <section aria-label="Default payment">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Default Payment</p>
              <p className="text-xs text-muted-foreground -mt-1 mb-2">Used when you don&apos;t specify an @account in the command bar.</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleSetDefaultAccount(undefined)}
                  className={cn("rounded-lg px-3 py-2 text-xs font-medium transition-colors", !currentMember?.defaultAccountId ? "bg-accent-color text-white shadow-sm" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}
                >
                  None
                </button>
                {accounts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handleSetDefaultAccount(a.id)}
                    className={cn("rounded-lg px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5", currentMember?.defaultAccountId === a.id ? "bg-accent-color text-white shadow-sm" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}
                  >
                    {a.name}
                    <span className="opacity-70 tabular-nums">{formatBalance(a.balance)}</span>
                  </button>
                ))}
              </div>
            </section>

            <Separator />

            <section aria-label="Categories">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categories</p>
                <Link
                  href="/settings/space/category"
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Manage
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">Edit categories, colors, icons, and auto-categorization keywords.</p>
            </section>

            <Separator />

            <section aria-label="Members">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Members</p>
              <div className="flex flex-col gap-1">
                {spaceMembers.map((m) => {
                  const isYou = m.userId === user?.id
                  const memberName = m.displayName || (isYou ? user?.name : null) || "Unknown"
                  const initial = memberName.charAt(0).toUpperCase()
                  return (
                    <div key={m.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          <AvatarFallback className="text-[10px]">{initial}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{memberName}</span>
                        {isYou && <span className="text-[10px] text-muted-foreground">(you)</span>}
                      </div>
                      <span className="text-xs text-muted-foreground">{m.role === "owner" ? "Owner" : "Member"}</span>
                    </div>
                  )
                })}
                {spaceMembers.length === 0 && <p className="text-sm text-muted-foreground py-2">No members</p>}
              </div>
            </section>

            {currentSpace?.name !== "Personal" && (
              <>
                <Separator />
                <section aria-label="Danger zone">
                  <p className="text-xs font-semibold uppercase tracking-wider text-destructive mb-2">Danger Zone</p>
                  {confirmDelete ? (
                    <div className="flex flex-col gap-2 rounded-xl border border-destructive/30 p-3">
                      <p className="text-sm text-muted-foreground">Type <strong>{currentSpace?.name}</strong> to confirm deletion:</p>
                      <Input value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)} placeholder={currentSpace?.name} className="h-9 text-sm" />
                      <div className="flex gap-2">
                        <Button variant="destructive" size="sm" onClick={handleDeleteSpace} disabled={deleteInput !== currentSpace?.name}>Delete Space</Button>
                        <Button variant="ghost" size="sm" onClick={() => { setConfirmDelete(false); setDeleteInput("") }}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="destructive" onClick={() => setConfirmDelete(true)} className="w-full">
                      <Trash2 className="h-4 w-4" /> Delete Space
                    </Button>
                  )}
                </section>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      <UserMenu open={userMenuOpen} onOpenChange={setUserMenuOpen} currentSpaceId={currentId} />
    </div>
  )
}
