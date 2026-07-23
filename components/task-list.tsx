"use client"

import { useState } from "react"
import { useTasks } from "@/hooks/use-db"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type TaskListProps = {
  spaceId: string
  limit?: number
}

const priorityOrder = { high: 0, medium: 1, low: 2 }

export function TaskList({ spaceId, limit }: TaskListProps) {
  const { items, loading, add, toggle, remove } = useTasks(spaceId)
  const [newTitle, setNewTitle] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")

  const sorted = [...items].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  const displayed = limit ? sorted.slice(0, limit) : sorted

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    await add({
      spaceId,
      title: newTitle.trim(),
      isCompleted: false,
      priority,
    })
    toast("Task added")
    setNewTitle("")
  }

  const handleToggle = async (id: string) => {
    await toggle(id)
    toast("Task updated")
  }

  const handleRemove = async (id: string) => {
    await remove(id)
    toast("Task deleted")
  }

  if (loading) return <div className="p-4 text-sm text-muted-foreground">Loading tasks...</div>

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a task..."
          className="h-10"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button size="icon" onClick={handleAdd} className="h-10 w-10 shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-1 pb-2">
        {(["high", "medium", "low"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPriority(p)}
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

      {displayed.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">No tasks yet</p>
      )}

      {displayed.map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-secondary/50"
        >
          <Checkbox
            checked={task.isCompleted}
            onCheckedChange={() => handleToggle(task.id)}
            className="h-5 w-5"
          />
          <span
            className={cn(
              "flex-1 text-sm",
              task.isCompleted && "text-muted-foreground line-through"
            )}
          >
            {task.title}
          </span>
          <span
            className={cn(
              "text-[10px] font-medium uppercase tracking-wider",
              task.priority === "high" && "text-destructive",
              task.priority === "medium" && "text-accent-color",
              task.priority === "low" && "text-muted-foreground"
            )}
          >
            {task.priority}
          </span>
          <button
            onClick={() => handleRemove(task.id)}
            className="text-muted-foreground/50 hover:text-destructive"
            aria-label="Delete task"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
