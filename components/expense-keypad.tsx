"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "⌫"],
]

type ExpenseKeypadProps = {
  onAmount: (amount: number) => void
  onClose: () => void
}

export function ExpenseKeypad({ onAmount, onClose }: ExpenseKeypadProps) {
  const [display, setDisplay] = useState("")

  const handleKey = (key: string) => {
    if (key === "⌫") {
      setDisplay((prev) => prev.slice(0, -1))
      return
    }
    if (key === "." && display.includes(".")) return
    if (display.length >= 12) return
    setDisplay((prev) => prev + key)
  }

  const handleSubmit = () => {
    const num = parseFloat(display)
    if (!isNaN(num) && num > 0) {
      onAmount(num)
      setDisplay("")
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex h-16 w-full items-center justify-center">
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

      <div className="flex flex-col gap-2">
        {KEYS.map((row) => (
          <div key={row.join("")} className="flex justify-center gap-2">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => handleKey(key)}
                className={cn(
                  "flex h-16 w-20 items-center justify-center rounded-xl text-xl font-medium transition-colors",
                  "bg-secondary text-secondary-foreground active:bg-muted-foreground/20",
                  key === "⌫" && "text-muted-foreground"
                )}
                aria-label={key === "⌫" ? "Delete" : key}
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
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!display || isNaN(parseFloat(display))}
          className="flex-1 rounded-xl bg-accent-color py-3 text-sm font-medium text-white disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </div>
  )
}
