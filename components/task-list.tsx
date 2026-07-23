"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useTasks } from "@/hooks/use-db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { TaskDetail } from "@/components/task-detail"
import { TaskRow } from "@/components/task-row"
import { Plus, ListChecks } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { haptics } from "@/lib/haptics"
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
    haptics.tap()
    toast("Task added")
    setNewTitle("")
  }

  const handleToggle = (task: Task) => {
    toggle(task.id)
    toast(task.isCompleted ? "Task reopened" : "Task completed")
  }

  const handleDelete = (task: Task) => {
    remove(task.id)
    toast("Task deleted")
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-1" role="status" aria-live="polite" aria-label="Loading tasks">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-3">
            <Skeleton className="h-5 w-5 shrink-0 rounded-[4px]" />
            <Skeleton className="h-3.5 flex-1" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    )
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
          <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground" aria-label="No tasks yet">
            <ListChecks className="h-5 w-5 opacity-50" aria-hidden="true" />
            <p>No tasks yet</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5" aria-label="Task list">
            <AnimatePresence initial={false}>
              {displayed.map((task, i) => (
                <motion.li
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.18, delay: i * 0.02 }}
                >
                  <TaskRow
                    task={task}
                    onToggle={() => handleToggle(task)}
                    onDelete={() => handleDelete(task)}
                    onOpen={() => setEditing(task)}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
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
