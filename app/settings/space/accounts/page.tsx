"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useAccounts } from "@/hooks/use-db"
import { useSpaces } from "@/hooks/use-spaces"
import { OfflineIndicator } from "@/components/offline-indicator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, Wallet, Loader2 } from "lucide-react"
import { capitalize } from "@/lib/utils"
import { AccountBadge } from "@/components/account-badge"
import { IconBrowser } from "@/components/icon-browser"
import * as Phosphor from "@phosphor-icons/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SpaceSelector } from "@/components/space-selector"
import { UserMenu } from "@/components/user-menu"
import { toast } from "sonner"
import { uid } from "@/lib/uid"
import * as store from "@/lib/data-store"
import type { Account } from "@/lib/db"

const COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899", "#6366F1", "#14B8A6", "#06B6D4", "#F97316", "#6B7280", "#84CC16"]

function formatBalance(balance: number): string {
  const abs = Math.abs(balance)
  const formatted = "Rp" + abs.toLocaleString("id-ID")
  return balance < 0 ? `-${formatted}` : formatted
}

export default function AccountsPage() {
  const router = useRouter()
  const { user, isPending } = useAuth()
  const { spaces, currentId, setCurrentId, createSpace, joinSpace, regenerateInviteCode } = useSpaces(user?.id)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const { items: accounts } = useAccounts(currentId)

  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState("")
  const [addIcon, setAddIcon] = useState("")
  const [addColor, setAddColor] = useState(COLORS[0])
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editIcon, setEditIcon] = useState("")
  const [editColor, setEditColor] = useState("")
  const [deleting, setDeleting] = useState<string | null>(null)
  const [iconBrowserFor, setIconBrowserFor] = useState<"add" | "edit" | null>(null)

  if (isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <p className="text-muted-foreground">Sign in to manage accounts.</p>
      </div>
    )
  }

  async function handleAdd() {
    if (!addName.trim()) return
    const id = uid()
    await store.persist("accounts", "add", { id, spaceId: currentId, name: addName.trim(), balance: 0, icon: addIcon || undefined, color: addColor, createdAt: new Date().toISOString() })
    store.invalidate(["accounts"])
    setAddName("")
    setAddIcon("")
    setShowAdd(false)
    toast(`Account "${addName.trim()}" created`)
  }

  function startEdit(acc: Account) {
    setEditing(acc.id)
    setEditName(acc.name)
    setEditIcon(acc.icon || "")
    setEditColor(acc.color || COLORS[0])
  }

  async function handleSaveEdit(id: string) {
    if (!editName.trim()) return
    await store.persist("accounts", "update", { name: editName.trim(), icon: editIcon || undefined, color: editColor || undefined }, id)
    store.invalidate(["accounts"])
    setEditing(null)
    toast("Account updated")
  }

  async function handleDelete(id: string, cascade: "delete" | "unlink") {
    const res = await fetch(`/api/accounts/${id}?cascade=${cascade}`, { method: "DELETE", credentials: "include" })
    if (!res.ok) { toast.error("Failed to delete account"); return }
    store.invalidate(["accounts", "transactions"])
    setDeleting(null)
    toast(`Account deleted${cascade === "delete" ? " with transactions" : ""}`)
  }

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <OfflineIndicator />

      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-secondary/50"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
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
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4" aria-hidden="true" /> Accounts
            </CardTitle>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/50"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </CardHeader>
          <CardContent>
            {showAdd && (
              <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border p-4">
                <div className="flex items-center gap-2">
                  <Input value={addName} onChange={(e) => setAddName(capitalize(e.target.value))} placeholder="Account name" className="h-9 text-sm flex-1" autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleAdd() }} />
                  <Button size="sm" onClick={handleAdd} disabled={!addName.trim()}><Check className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowAdd(false); setAddName(""); setAddIcon(""); setAddColor(COLORS[0]) }}><X className="h-3.5 w-3.5" /></Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setAddColor(c)}
                      className="h-7 w-7 rounded-full border-2 transition-transform"
                      style={{ backgroundColor: c, borderColor: addColor === c ? "var(--foreground)" : "transparent" }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setIconBrowserFor("add")}
                  className="flex h-8 items-center gap-2 rounded-lg border border-input bg-background px-3 text-xs text-muted-foreground hover:text-foreground transition-colors self-start"
                >
                  {addIcon ? (
                    <>
                      {(() => {
                        const Icon = (Phosphor as any)[addIcon.charAt(0).toUpperCase() + addIcon.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase())]
                        return Icon ? <Icon weight="duotone" className="h-4 w-4 text-foreground" /> : null
                      })()}
                      <span>{addIcon}</span>
                    </>
                  ) : (
                    <span>Choose icon...</span>
                  )}
                </button>
              </div>
            )}
            <div className="flex flex-col gap-1">
              {accounts.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">No accounts yet</p>
              )}
              {accounts.map((acc) => (
                <div key={acc.id} className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary/50">
                  {editing === acc.id ? (
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Input value={editName} onChange={(e) => setEditName(capitalize(e.target.value))} className="h-8 text-sm flex-1" autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(acc.id) }} />
                        <button onClick={() => handleSaveEdit(acc.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-success hover:bg-secondary"><Check className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setEditing(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"><X className="h-3.5 w-3.5" /></button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {COLORS.map((c) => (
                          <button
                            key={c}
                            onClick={() => setEditColor(c)}
                            className="h-6 w-6 rounded-full border-2 transition-transform"
                            style={{ backgroundColor: c, borderColor: editColor === c ? "var(--foreground)" : "transparent" }}
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIconBrowserFor("edit")}
                        className="flex h-7 items-center gap-1.5 rounded-lg border border-input bg-background px-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors self-start"
                      >
                        {editIcon ? (
                          <>
                            {(() => {
                              const Icon = (Phosphor as any)[editIcon.charAt(0).toUpperCase() + editIcon.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase())]
                              return Icon ? <Icon weight="duotone" className="h-3.5 w-3.5 text-foreground" /> : null
                            })()}
                            <span>{editIcon}</span>
                          </>
                        ) : (
                          <span>Change icon...</span>
                        )}
                      </button>
                    </div>
                  ) : deleting === acc.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm text-muted-foreground">Delete &quot;{acc.name}&quot;?</span>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(acc.id, "delete")}>Delete with transactions</Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(acc.id, "unlink")}>Unlink transactions</Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
                    </div>
                    ) : (
                    <div className="w-full rounded-xl border border-border overflow-hidden" style={{ borderColor: `${acc.color || "#6B7280"}40` }}>
                      <div className="flex items-center justify-between px-4 pt-3 pb-2">
                        <div className="flex items-center gap-3">
                          <AccountBadge account={acc} size="md" />
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEdit(acc)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeleting(acc.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="px-4 pb-3">
                        <p className="text-2xl font-bold tabular-nums">{formatBalance(acc.balance)}</p>
                      </div>
                      <div className="h-1" style={{ backgroundColor: acc.color || "#6B7280" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {iconBrowserFor === "add" && (
        <IconBrowser value={addIcon} onChange={setAddIcon} onClose={() => setIconBrowserFor(null)} />
      )}
      {iconBrowserFor === "edit" && (
        <IconBrowser value={editIcon} onChange={setEditIcon} onClose={() => setIconBrowserFor(null)} />
      )}

      <UserMenu open={userMenuOpen} onOpenChange={setUserMenuOpen} currentSpaceId={currentId} />
    </div>
  )
}
