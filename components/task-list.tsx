"use client"

import { useState } from "react"
import { useTasks } from "@/hooks/use-db"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TaskDetail } from "@/components/task-detail"
import { Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Task } from "@/lib/db"

type TaskListProps = {
  spaceId: string
  limit?: number
}

const priorityOrder = { high: 0, medium: 1, low: 2 }

export function TaskList({ spaceId, limit }: TaskListProps) {
  const { items, loading, add, toggle, remove, update } = useTasks(spaceId)
  const [editing, setEditing] = useState<Task | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")

  const sorted = [...items].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  const displayed = limit ? sorted.slice(0, limit) : sorted

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    await add({ spaceId, title: newTitle.trim(), isCompleted: false, priority })
    toast("Task added")
    setNewTitle("")
  }

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground" role="status" aria-live="polite">Loading tasks...</div>
  }

  return (
    <>
      <div className="flex flex-col gap-1" role="region" aria-label="Tasks">
        <div className="flex items-center gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a task..."
            className="h-10"
            aria-label="New task title"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button size="icon" onClick={handleAdd} className="h-10 w-10 shrink-0" aria-label="Add task">
            <Plus className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex gap-1 pb-2" role="radiogroup" aria-label="Task priority">
          {(["high", "medium", "low"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              role="radio"
              aria-checked={priority === p}
              className={cn(
                "rounded-full px-3 py-0.5 text-[11px] font-medium uppercase tracking-wider transition-colors",
                priority === p
                  ? p === "high" ? "bg-destructive text-destructive-foreground"
                    : p === "medium" ? "bg-accent-color/20 text-accent-color"
                    : "bg-muted text-muted-foreground"
                  : "bg-secondary text-muted-foreground/60"
              )}
            >
              {p}
            </button>
          ))}
        </div>

        {displayed.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground" aria-label="No tasks yet">No tasks yet</p>
        ) : (
          <ul className="flex flex-col gap-0.5" aria-label="Task list">
            {displayed.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-secondary/50"
                onContextMenu={(e) => { e.preventDefault(); setEditing(task) }}
              >
                <Checkbox
                  checked={task.isCompleted}
                  onCheckedChange={() => { toggle(task.id); toast("Task updated") }}
                  className="h-5 w-5"
                  aria-label={`Mark "${task.title}" as ${task.isCompleted ? "incomplete" : "complete"}`}
                />
                <button
                  onClick={() => setEditing(task)}
                  className={cn(
                    "flex-1 text-left text-sm",
                    task.isCompleted && "text-muted-foreground line-through"
                  )}
                >
                  {task.title}
                </button>
                <span
                  className={cn(
                    "text-[10px] font-medium uppercase tracking-wider",
                    task.priority === "high" && "text-destructive",
                    task.priority === "medium" && "text-accent-color",
                    task.priority === "low" && "text-muted-foreground"
                  )}
                  aria-label={`Priority: ${task.priority}`}
                >
                  {task.priority}
                </span>
                <button
                  onClick={() => { remove(task.id); toast("Task deleted") }}
                  className="text-muted-foreground/50 hover:text-destructive"
                  aria-label={`Delete "${task.title}"`}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <TaskDetail
        task={editing}
        open={editing !== null}
        onOpenChange={(v) => { if (!v) setEditing(null) }}
        onUpdate={update}
        onDelete={remove}
      />
    </>
  )
}
