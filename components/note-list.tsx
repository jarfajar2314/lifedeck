"use client"

import { useState } from "react"
import { useNotes } from "@/hooks/use-db"
import { Button } from "@/components/ui/button"
import { NoteDetail } from "@/components/note-detail"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Note } from "@/lib/db"

type NoteListProps = {
  spaceId: string
  limit?: number
}

export function NoteList({ spaceId, limit }: NoteListProps) {
  const { items, loading, add, togglePin, remove, update } = useNotes(spaceId)
  const [selected, setSelected] = useState<Note | null>(null)
  const [showInput, setShowInput] = useState(false)
  const [content, setContent] = useState("")

  const sorted = [...items].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const displayed = limit ? sorted.slice(0, limit) : sorted

  const handleAdd = async () => {
    if (!content.trim()) return
    await add({ spaceId, content: content.trim(), tags: [], isPinned: false })
    toast("Note saved")
    setContent("")
    setShowInput(false)
  }

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground" role="status" aria-live="polite">Loading notes...</div>
  }

  return (
    <>
      <div className="flex flex-col gap-2" role="region" aria-label="Notes">
        {showInput && (
          <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a note..."
              className="min-h-[80px] resize-none bg-transparent text-sm outline-none"
              rows={3}
              aria-label="Note content"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} className="flex-1">Save</Button>
              <Button size="sm" variant="outline" onClick={() => { setShowInput(false); setContent("") }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <Button variant="outline" size="sm" onClick={() => setShowInput(true)} className="gap-2" aria-label="Create quick note">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Quick Note
        </Button>

        {!showInput && displayed.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">No notes yet</p>
        )}

        {displayed.map((note) => (
          <button
            key={note.id}
            onClick={() => setSelected(note)}
            className={cn(
              "w-full rounded-xl border border-border p-3 text-left transition-colors hover:bg-secondary/50",
              note.isPinned && "border-accent-color/30 bg-accent-color/5"
            )}
            aria-label={note.isPinned ? "Pinned note" : "Note"}
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{note.content}</p>
            <time className="mt-1 block text-[10px] text-muted-foreground" dateTime={new Date(note.createdAt).toISOString()}>
              {new Date(note.createdAt).toLocaleDateString()}
            </time>
          </button>
        ))}
      </div>

      <NoteDetail
        note={selected}
        open={selected !== null}
        onOpenChange={(v) => { if (!v) setSelected(null) }}
        onUpdate={update}
        onDelete={remove}
        onTogglePin={togglePin}
      />
    </>
  )
}
