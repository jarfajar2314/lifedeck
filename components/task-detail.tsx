"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import type { Task } from "@/lib/db"
import { cn } from "@/lib/utils"

type TaskDetailProps = {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (id: string, updates: Partial<Omit<Task, "id" | "spaceId" | "createdAt">>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function TaskDetail({ task, open, onOpenChange, onUpdate, onDelete }: TaskDetailProps) {
  const [title, setTitle] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [saving, setSaving] = useState(false)

  if (!task) return null
  const t = task

  function startEdit() {
    setTitle(t.title)
    setPriority(t.priority)
  }

  async function handleSave() {
    if (!title.trim()) {
      toast("Title is required")
      return
    }
    setSaving(true)
    await onUpdate(t.id, { title: title.trim(), priority })
    toast("Task updated")
    setSaving(false)
    onOpenChange(false)
  }

  async function handleDelete() {
    await onDelete(t.id)
    toast("Task deleted")
    onOpenChange(false)
  }

  const priorityColors: Record<string, string> = {
    high: "bg-destructive text-destructive-foreground",
    medium: "bg-accent-color/20 text-accent-color",
    low: "bg-muted text-muted-foreground",
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (v) startEdit() }}>
      <SheetContent side="bottom" aria-label="Edit task">
        <SheetHeader>
          <SheetTitle>Edit Task</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-4 pt-0">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Priority</label>
            <div className="flex gap-1.5">
              {(["high", "medium", "low"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors",
                    priority === p ? priorityColors[p] : "bg-secondary text-muted-foreground/60"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="destructive" className="flex-1" onClick={handleDelete}>
              Delete
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
