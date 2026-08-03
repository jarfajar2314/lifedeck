"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { Note } from "@/lib/db"
import { Trash2Icon, PinIcon, PinOffIcon } from "lucide-react"

type NoteDetailProps = {
  note: Note | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (id: string, updates: Partial<Omit<Note, "id" | "spaceId" | "createdAt">>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onTogglePin: (id: string) => Promise<void>
}

export function NoteDetail({ note, open, onOpenChange, onUpdate, onDelete, onTogglePin }: NoteDetailProps) {
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)
  // Keep rendering the last-selected note while the sheet plays its close
  // animation — clearing this to null the instant `note` does would unmount
  // the Sheet mid-transition and cut the animation short.
  const [n, setN] = useState<Note | null>(null)

  useEffect(() => {
    if (!note) return
    setContent(note.content)
    setSaving(false)
    setN(note)
  }, [note?.id, note?.content])

  async function handleSave() {
    if (!n) return
    if (!content.trim()) {
      toast("Content is required")
      return
    }
    setSaving(true)
    await onUpdate(n.id, { content: content.trim() })
    toast("Note updated")
    setSaving(false)
    onOpenChange(false)
  }

  async function handleDelete() {
    if (!n) return
    await onDelete(n.id)
    toast("Note deleted")
    onOpenChange(false)
  }

  async function handleTogglePin() {
    if (!n) return
    await onTogglePin(n.id)
    toast(n.isPinned ? "Note unpinned" : "Note pinned")
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" aria-label="Note detail">
        {n && (
        <>
        <SheetHeader>
          <SheetTitle>Edit Note</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-4 pt-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[160px] resize-none rounded-xl border border-border bg-transparent p-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            placeholder="Write something..."
            aria-label="Note content"
          />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <time dateTime={new Date(n.createdAt).toISOString()}>
              Created: {new Date(n.createdAt).toLocaleDateString()}
            </time>
            {n.updatedAt > n.createdAt && (
              <time dateTime={new Date(n.updatedAt).toISOString()}>
                Edited: {new Date(n.updatedAt).toLocaleDateString()}
              </time>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleTogglePin} aria-label={n.isPinned ? "Unpin" : "Pin"}>
              {n.isPinned ? <PinOffIcon /> : <PinIcon />}
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleDelete}>
              <Trash2Icon /> Delete
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
        </>
        )}
      </SheetContent>
    </Sheet>
  )
}
