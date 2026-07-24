"use client"

import { useState, useRef, useMemo, useCallback } from "react"
import { parseCommand } from "@/lib/command-parser"
import { Input } from "@/components/ui/input"
import { SendHorizonal, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Account } from "@/lib/db"
import { uid } from "@/lib/uid"
import * as store from "@/lib/data-store"

type CommandBarProps = {
  onExpense?: (amount: number, note?: string, account?: string, category?: string) => void
  onIncome?: (amount: number, note?: string, account?: string, category?: string) => void
  onTransfer?: (amount: number, fromAccount: string, toAccount: string, note?: string) => void
  onTask?: (title: string) => void
  onNote?: (content: string) => void
  accounts: Account[]
  spaceId: string
}

export function CommandBar({ onExpense, onIncome, onTransfer, onTask, onNote, accounts, spaceId }: CommandBarProps) {
  const [value, setValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const result = value ? parseCommand(value) : null
  const hint = result?.type ?? null

  const atMatch = useMemo(() => {
    const m = value.match(/@(\w*)$/)
    return m ? { full: m[0], partial: m[1] } : null
  }, [value])

  const suggestions = useMemo(() => {
    if (!atMatch) return []
    const partial = atMatch.partial.toLowerCase()
    return accounts.filter((a) => a.name.toLowerCase().includes(partial))
  }, [atMatch, accounts])

  const showPopover = atMatch !== null

  const handleSuggestionClick = useCallback((accountName: string) => {
    if (!atMatch) return
    const before = value.slice(0, value.lastIndexOf(atMatch.full))
    setValue(before + "@" + accountName)
    inputRef.current?.focus()
  }, [value, atMatch])

  const handleCreateAccount = useCallback(async () => {
    if (!atMatch) return
    const name = atMatch.partial
    const newId = uid()
    await store.persist("accounts", "add", { id: newId, spaceId, name, createdAt: new Date().toISOString() })
    store.invalidate(["accounts"])
    handleSuggestionClick(name)
  }, [atMatch, handleSuggestionClick, spaceId])

  const handleSubmit = () => {
    if (!result) return

    switch (result.type) {
      case "expense":
        onExpense?.(result.amount, result.note, result.account, result.category)
        break
      case "income":
        onIncome?.(result.amount, result.note, result.account, result.category)
        break
      case "transfer":
        onTransfer?.(result.amount, result.fromAccount, result.toAccount, result.note)
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
    if (e.key === "Enter") {
      if (showPopover && atMatch && suggestions.length === 0 && atMatch.partial.length > 0) {
        handleCreateAccount()
        return
      }
      handleSubmit()
    }
  }

  const hintColor = hint === "expense" ? "text-success"
    : hint === "income" ? "text-blue-500"
    : hint === "transfer" ? "text-amber-500"
    : hint === "task" ? "text-violet-500"
    : hint === "note" ? "text-cyan-500"
    : ""

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      role="search"
      aria-label="Universal command bar"
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-1">
        {showPopover && (
          <div className="overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
            {suggestions.length > 0 ? (
              <ul className="py-1" role="listbox" aria-label="Account suggestions">
                {suggestions.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => handleSuggestionClick(a.name)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
                      role="option"
                      aria-selected={false}
                    >
                      <span className="font-medium">@{a.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatBalance(a.balance)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : atMatch.partial.length > 0 ? (
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm text-muted-foreground">
                  No accounts match &apos;@{atMatch.partial}&apos;
                </span>
                <button
                  type="button"
                  onClick={handleCreateAccount}
                  className="flex items-center gap-1 rounded-lg bg-accent-color px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                >
                  <Plus className="h-3 w-3" />
                  Create &apos;{atMatch.partial}&apos;
                </button>
              </div>
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Type an account name...
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="25k lunch @gopay · +2M salary @gopay · transfer 50k @gopay @bca"
              className="h-12 pr-10 text-base"
              aria-label="Type a command: expense, income, transfer, task, or note"
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
                  hintColor
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
    </div>
  )
}

function formatBalance(balance: number): string {
  const abs = Math.abs(balance)
  const formatted = abs.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 })
  return balance < 0 ? `-${formatted}` : formatted
}
