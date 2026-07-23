"use client"

import { useState, useRef } from "react"
import { parseCommand } from "@/lib/command-parser"
import { Input } from "@/components/ui/input"
import { SendHorizonal } from "lucide-react"
import { cn } from "@/lib/utils"

type CommandBarProps = {
  onExpense?: (amount: number, note?: string, account?: string) => void
  onTask?: (title: string) => void
  onNote?: (content: string) => void
}

export function CommandBar({ onExpense, onTask, onNote }: CommandBarProps) {
  const [value, setValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const result = value ? parseCommand(value) : null
  const hint = result?.type ?? null

  const handleSubmit = () => {
    if (!result) return

    switch (result.type) {
      case "expense":
        onExpense?.(result.amount, result.note, result.account)
        break
      case "task":
        onTask?.(result.title)
        break
      case "note":
        onNote?.(result.content)
        break
    }
    setValue("")
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit()
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      role="search"
      aria-label="Universal command bar"
    >
      <div className="mx-auto flex max-w-2xl items-center gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="25k lunch @gopay · todo Buy milk · note Idea..."
            className="h-12 pr-10 text-base"
            aria-label="Type a command: expense, task, or note"
            aria-describedby="command-hint"
            autoComplete="off"
          />
          {hint && (
            <span
              id="command-hint"
              role="status"
              aria-live="polite"
              className={cn(
                "pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 text-xs font-medium uppercase tracking-wider",
                hint === "expense" && "text-emerald-500",
                hint === "task" && "text-violet-500",
                hint === "note" && "text-cyan-500"
              )}
            >
              {hint}
            </span>
          )}
        </div>
        <button
          onClick={handleSubmit}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-color text-white transition-opacity hover:opacity-90"
          aria-label="Submit command"
        >
          <SendHorizonal className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
