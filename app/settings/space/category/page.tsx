"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { useCategories, useCategoryKeywords } from "@/hooks/use-db"
import { useSpaces } from "@/hooks/use-spaces"
import { OfflineIndicator } from "@/components/offline-indicator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, Palette } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SpaceSelector } from "@/components/space-selector"
import { UserMenu } from "@/components/user-menu"
import { toast } from "sonner"
import { uid } from "@/lib/uid"
import * as store from "@/lib/data-store"
import type { Category } from "@/lib/db"

const COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899", "#6366F1", "#14B8A6", "#06B6D4", "#F97316", "#6B7280", "#84CC16"]

export default function CategoryPage() {
  const { user, isPending } = useAuth()
  const { spaces, currentId, setCurrentId, createSpace, joinSpace, regenerateInviteCode } = useSpaces(user?.id)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const categories = useCategories(currentId)
  const categoryKeywords = useCategoryKeywords(currentId)

  const [editing, setEditing] = useState<Category | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")
  const [editIcon, setEditIcon] = useState("")
  const [newKeywords, setNewKeywords] = useState("")
  const [keywordList, setKeywordList] = useState<string[]>([])

  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState("")
  const [addColor, setAddColor] = useState(COLORS[0])
  const [addIcon, setAddIcon] = useState("")
  const [addKeywords, setAddKeywords] = useState("")

  const keywordMap = new Map<string, string[]>()
  for (const kw of categoryKeywords) {
    const list = keywordMap.get(kw.categoryId) || []
    list.push(kw.keyword)
    keywordMap.set(kw.categoryId, list)
  }

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
        <p className="text-muted-foreground">Sign in to manage categories.</p>
      </div>
    )
  }

  async function handleAdd() {
    if (!addName.trim()) return
    const id = uid()
    await store.persist("categories", "add", { id, spaceId: currentId, name: addName.trim(), color: addColor, icon: addIcon || undefined, createdAt: new Date().toISOString() })
    for (const kw of addKeywords.split(",").map((s) => s.trim()).filter(Boolean)) {
      await store.persist("categoryKeywords", "add", { id: uid(), spaceId: currentId, categoryId: id, keyword: kw.toLowerCase(), createdAt: new Date().toISOString() })
    }
    store.invalidate(["categories", "categoryKeywords"])
    setAddName("")
    setAddColor(COLORS[0])
    setAddIcon("")
    setAddKeywords("")
    setShowAdd(false)
    toast(`Category "${addName.trim()}" created`)
  }

  function startEdit(cat: Category) {
    setEditing(cat)
    setEditName(cat.name)
    setEditColor(cat.color || COLORS[0])
    setEditIcon(cat.icon || "")
    setKeywordList(keywordMap.get(cat.id) || [])
    setNewKeywords("")
  }

  async function handleSaveEdit() {
    if (!editing || !editName.trim()) return
    await store.persist("categories", "update", { name: editName.trim(), color: editColor, icon: editIcon || undefined }, editing.id)
    for (const kw of keywordList) {
      const exists = categoryKeywords.find((k) => k.categoryId === editing.id && k.keyword === kw)
      if (!exists) {
        await store.persist("categoryKeywords", "add", { id: uid(), spaceId: currentId, categoryId: editing.id, keyword: kw.toLowerCase(), createdAt: new Date().toISOString() })
      }
    }
    store.invalidate(["categories", "categoryKeywords"])
    setEditing(null)
    toast("Category updated")
  }

  function addKeywordToEdit() {
    const kws = newKeywords.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    const existing = new Set(keywordList.map((k) => k.toLowerCase()))
    for (const kw of kws) {
      if (!existing.has(kw)) {
        keywordList.push(kw)
        existing.add(kw)
      }
    }
    setKeywordList([...keywordList])
    setNewKeywords("")
  }

  function removeKeyword(kw: string) {
    const existing = categoryKeywords.find((k) => k.categoryId === editing!.id && k.keyword === kw)
    if (existing) {
      store.persist("categoryKeywords", "delete", undefined, existing.id)
    }
    setKeywordList(keywordList.filter((k) => k !== kw))
  }

  async function handleDelete(cat: Category) {
    await store.persist("categories", "delete", undefined, cat.id)
    for (const kw of categoryKeywords.filter((k) => k.categoryId === cat.id)) {
      await store.persist("categoryKeywords", "delete", undefined, kw.id)
    }
    store.invalidate(["categories", "transactions", "categoryKeywords"])
    toast(`Category "${cat.name}" deleted`)
  }

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <OfflineIndicator />

      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/settings/space"
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-secondary/50"
              aria-label="Back to space settings"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Image src="/lifedeck.svg" alt="LifeDeck" width={24} height={24} className="shrink-0 text-foreground" priority />
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
              <Palette className="h-4 w-4" aria-hidden="true" /> Categories
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
                <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Category name" className="h-9 text-sm" autoFocus />
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
                <Input value={addIcon} onChange={(e) => setAddIcon(e.target.value)} placeholder="Icon name (optional)" className="h-9 text-sm" />
                <Input value={addKeywords} onChange={(e) => setAddKeywords(e.target.value)} placeholder="Keywords (comma separated)" className="h-9 text-sm" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAdd} disabled={!addName.trim()}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowAdd(false); setAddName(""); setAddColor(COLORS[0]); setAddIcon(""); setAddKeywords("") }}>Cancel</Button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1">
              {categories.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">No categories yet</p>
              )}
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: cat.color || "#6B7280" }} />
                    <div>
                      <span className="text-sm font-medium">{cat.name}</span>
                      {(keywordMap.get(cat.id)?.length ?? 0) > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">({keywordMap.get(cat.id)!.length} keywords)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(cat)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setEditing(null)} />
          <div className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-background border border-border p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Edit Category</h3>
              <button onClick={() => setEditing(null)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Category name" className="h-9 text-sm" />
              <div className="flex flex-wrap gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setEditColor(c)}
                    className="h-7 w-7 rounded-full border-2 transition-transform"
                    style={{ backgroundColor: c, borderColor: editColor === c ? "var(--foreground)" : "transparent" }}
                  />
                ))}
              </div>
              <Input value={editIcon} onChange={(e) => setEditIcon(e.target.value)} placeholder="Icon name (optional)" className="h-9 text-sm" />
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-muted-foreground">Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {keywordList.map((kw) => (
                    <span key={kw} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs">
                      {kw}
                      <button onClick={() => removeKeyword(kw)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newKeywords} onChange={(e) => setNewKeywords(e.target.value)} placeholder="Add keywords" className="h-8 text-sm flex-1" onKeyDown={(e) => { if (e.key === "Enter") addKeywordToEdit() }} />
                  <Button size="sm" variant="outline" onClick={addKeywordToEdit}><Plus className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditing(null)}>Cancel</Button>
                <Button size="sm" className="flex-1" onClick={handleSaveEdit}><Check className="h-3.5 w-3.5" /> Save</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <UserMenu open={userMenuOpen} onOpenChange={setUserMenuOpen} currentSpaceId={currentId} />
    </div>
  )
}
