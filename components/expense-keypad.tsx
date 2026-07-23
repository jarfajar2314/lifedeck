"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import type { Account } from "@/lib/db"

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "⌫"],
]

type ExpenseKeypadProps = {
  onAmount: (amount: number, accountId?: string) => void
  onClose: () => void
  accounts: Account[]
}

export function ExpenseKeypad({ onAmount, onClose, accounts }: ExpenseKeypadProps) {
  const [display, setDisplay] = useState("")
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(
    accounts.find((a) => a.isDefault)?.id
  )

  const handleKey = useCallback((key: string) => {
    if (key === "⌫") {
      setDisplay((prev) => prev.slice(0, -1))
      return
    }
    if (key === "." && display.includes(".")) return
    if (display.length >= 12) return
    setDisplay((prev) => prev + key)
  }, [display])

  const handleSubmit = useCallback(() => {
    const num = parseFloat(display)
    if (!isNaN(num) && num > 0) {
      onAmount(num, selectedAccountId)
      setDisplay("")
    }
  }, [display, onAmount, selectedAccountId])

  return (
    <div className="flex flex-col items-center gap-4 p-4" role="group" aria-label="Numeric keypad">
      <div className="flex h-16 w-full items-center justify-center" aria-live="polite" aria-atomic="true">
        <span className="text-4xl font-semibold tabular-nums">
          {display ? (
            <>
              <span className="text-lg align-top">Rp</span>
              {parseFloat(display).toLocaleString("id-ID")}
            </>
          ) : (
            <span className="text-muted-foreground text-lg">Amount</span>
          )}
        </span>
      </div>

      {accounts.length > 0 && (
        <div className="flex w-full max-w-xs gap-1.5 overflow-x-auto" role="radiogroup" aria-label="Payment source">
          {accounts.map((account) => (
            <button
              key={account.id}
              onClick={() => setSelectedAccountId(account.id)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                selectedAccountId === account.id
                  ? "bg-accent-color text-white"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
              role="radio"
              aria-checked={selectedAccountId === account.id}
            >
              {account.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2" role="grid" aria-label="Keypad">
        {KEYS.map((row) => (
          <div key={row.join("")} className="flex justify-center gap-2" role="row">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => handleKey(key)}
                className={cn(
                  "flex h-16 w-20 items-center justify-center rounded-xl text-xl font-medium transition-colors",
                  "bg-secondary text-secondary-foreground active:bg-muted-foreground/20",
                  key === "⌫" && "text-muted-foreground"
                )}
                aria-label={key === "⌫" ? "Delete" : key === "." ? "Decimal point" : key}
                role="gridcell"
              >
                {key === "⌫" ? "⌫" : key}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="flex w-full max-w-xs gap-3">
        <button
          onClick={onClose}
          className="flex-1 rounded-xl bg-secondary py-3 text-sm font-medium text-muted-foreground"
          aria-label="Cancel and close keypad"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!display || isNaN(parseFloat(display))}
          className="flex-1 rounded-xl bg-accent-color py-3 text-sm font-medium text-white disabled:opacity-40"
          aria-label={display ? `Save expense of Rp${parseFloat(display).toLocaleString("id-ID")}` : "Save expense"}
        >
          Save
        </button>
      </div>
    </div>
  )
}
