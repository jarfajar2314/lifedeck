"use client"

import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Check, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { haptics } from "@/lib/haptics"
import type { Task } from "@/lib/db"

const SWIPE_THRESHOLD = 88

type TaskRowProps = {
  task: Task
  onToggle: () => void
  onDelete: () => void
  onOpen: () => void
}


export function TaskRow({ task, onToggle, onDelete, onOpen }: TaskRowProps) {
  const x = useMotionValue(0)
  const completeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1])
  const deleteOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0])

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD) {
      haptics.success()
      onToggle()
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      haptics.delete()
      onDelete()
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-4" aria-hidden="true">
        <motion.span
          style={{ opacity: completeOpacity }}
          className="flex items-center gap-1.5 rounded-lg bg-success px-2 py-1 text-xs font-medium text-white"
        >
          <Check className="h-3.5 w-3.5" /> {task.isCompleted ? "Undo" : "Complete"}
        </motion.span>
        <motion.span
          style={{ opacity: deleteOpacity }}
          className="flex items-center gap-1.5 rounded-lg bg-destructive px-2 py-1 text-xs font-medium text-white"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </motion.span>
      </div>

      <motion.div
        drag="x"
        style={{ x }}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        onContextMenu={(e) => { e.preventDefault(); onOpen() }}
        className="relative flex items-center gap-3 rounded-xl bg-background px-3 py-3 transition-colors hover:bg-secondary/50"
      >
        <Checkbox
          checked={task.isCompleted}
          onCheckedChange={() => { haptics.tap(); onToggle() }}
          className="h-5 w-5"
          aria-label={`Mark "${task.title}" as ${task.isCompleted ? "incomplete" : "complete"}`}
        />
        <button
          onClick={onOpen}
          className={cn(
            "flex-1 text-left text-sm",
            task.isCompleted && "text-muted-foreground line-through"
          )}
        >
          {task.title}
        </button>
        <Badge className="rounded-4xl px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border-0 bg-secondary text-secondary-foreground"
          aria-label={`Priority: ${task.priority}`}
        >
          {task.priority}
        </Badge>
        <button
          onClick={onDelete}
          className="text-muted-foreground/50 hover:text-destructive"
          aria-label={`Delete "${task.title}"`}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </motion.div>
    </div>
  )
}
