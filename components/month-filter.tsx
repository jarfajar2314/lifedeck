"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  type DateRange,
  type RangePreset,
  getPresetRange,
  matchingPreset,
  isSingleMonth,
  shiftMonth,
  formatRangeLabel,
  rangeForMonth,
} from "@/lib/date-filter"

const QUICK_PRESETS: { preset: RangePreset; label: string }[] = [
  { preset: "this-month", label: "This Month" },
  { preset: "last-month", label: "Last Month" },
  { preset: "last-3-months", label: "Last 3 Months" },
  { preset: "this-year", label: "This Year" },
  { preset: "all-time", label: "All Time" },
]

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

type MonthFilterProps = {
  range: DateRange
  onChange: (range: DateRange) => void
}

export function MonthFilter({ range, onChange }: MonthFilterProps) {
  const [open, setOpen] = useState(false)
  const [gridYear, setGridYear] = useState(() => (range?.from ?? new Date()).getFullYear())

  const activePreset = matchingPreset(range)
  const canStep = isSingleMonth(range)
  const currentMonth = range?.from.getMonth()
  const currentMonthYear = range?.from.getFullYear()

  function selectPreset(preset: RangePreset) {
    onChange(getPresetRange(preset))
    setOpen(false)
  }

  function selectMonth(monthIndex: number) {
    onChange(rangeForMonth(gridYear, monthIndex))
    setOpen(false)
  }

  return (
    <div className="flex h-11 shrink-0 items-center gap-0.5 rounded-lg border border-input bg-background pr-1">
      <button
        type="button"
        onClick={() => onChange(shiftMonth(range, -1))}
        disabled={!canStep}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-l-lg text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        aria-label="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <Popover
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (v) setGridYear((range?.from ?? new Date()).getFullYear())
        }}
      >
        <PopoverTrigger
          className="flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/50"
          aria-label="Choose time range"
        >
          <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate">{formatRangeLabel(range)}</span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64">
          <div className="flex flex-col gap-1">
            {QUICK_PRESETS.map(({ preset, label }) => (
              <button
                key={preset}
                type="button"
                onClick={() => selectPreset(preset)}
                className={cn(
                  "flex h-9 items-center rounded-md px-2.5 text-left text-sm transition-colors hover:bg-secondary",
                  activePreset === preset ? "bg-secondary font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="my-1 h-px bg-border" />

          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => setGridYear((y) => y - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              aria-label="Previous year"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs font-semibold tabular-nums">{gridYear}</span>
            <button
              type="button"
              onClick={() => setGridYear((y) => y + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              aria-label="Next year"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1 px-1 pb-1">
            {MONTH_ABBR.map((label, i) => {
              const isActive = currentMonthYear === gridYear && currentMonth === i
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => selectMonth(i)}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-md text-xs transition-colors hover:bg-secondary",
                    isActive ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-foreground"
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>

      <button
        type="button"
        onClick={() => onChange(shiftMonth(range, 1))}
        disabled={!canStep}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
