export type DateRange = { from: Date; to: Date } | null

export type RangePreset = "this-month" | "last-month" | "last-3-months" | "this-year" | "all-time"

const MONTH_LABEL = { month: "short", year: "numeric" } as const

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1, 0, 0, 0, 0)
}

function endOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0, 23, 59, 59, 999)
}

export function getPresetRange(preset: RangePreset, ref = new Date()): DateRange {
  const y = ref.getFullYear()
  const m = ref.getMonth()
  switch (preset) {
    case "this-month":
      return { from: startOfMonth(y, m), to: endOfMonth(y, m) }
    case "last-month":
      return { from: startOfMonth(y, m - 1), to: endOfMonth(y, m - 1) }
    case "last-3-months":
      return { from: startOfMonth(y, m - 2), to: endOfMonth(y, m) }
    case "this-year":
      return { from: startOfMonth(y, 0), to: endOfMonth(y, 11) }
    case "all-time":
      return null
  }
}

export function rangeForMonth(year: number, month: number): DateRange {
  return { from: startOfMonth(year, month), to: endOfMonth(year, month) }
}

function sameInstant(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime()
}

export function rangesEqual(a: DateRange, b: DateRange): boolean {
  if (a === null || b === null) return a === b
  return sameInstant(a.from, b.from) && sameInstant(a.to, b.to)
}

/** Which quick preset (if any) the current range matches, for highlighting active chips. */
export function matchingPreset(range: DateRange, ref = new Date()): RangePreset | null {
  const presets: RangePreset[] = ["this-month", "last-month", "last-3-months", "this-year", "all-time"]
  for (const p of presets) {
    if (rangesEqual(range, getPresetRange(p, ref))) return p
  }
  return null
}

/** True if range is exactly one calendar month (drives prev/next month stepping). */
export function isSingleMonth(range: DateRange): boolean {
  if (range === null) return false
  return (
    range.from.getDate() === 1 &&
    range.from.getHours() === 0 &&
    sameInstant(range.to, endOfMonth(range.from.getFullYear(), range.from.getMonth()))
  )
}

export function shiftMonth(range: DateRange, delta: number): DateRange {
  if (range === null || !isSingleMonth(range)) return range
  const y = range.from.getFullYear()
  const m = range.from.getMonth() + delta
  return rangeForMonth(new Date(y, m, 1).getFullYear(), new Date(y, m, 1).getMonth())
}

export function formatRangeLabel(range: DateRange): string {
  if (range === null) return "All Time"
  if (isSingleMonth(range)) return range.from.toLocaleDateString("en-US", MONTH_LABEL)
  const preset = matchingPreset(range)
  if (preset === "this-year") return String(range.from.getFullYear())
  const fromLabel = range.from.toLocaleDateString("en-US", MONTH_LABEL)
  const toLabel = range.to.toLocaleDateString("en-US", MONTH_LABEL)
  return fromLabel === toLabel ? fromLabel : `${fromLabel} - ${toLabel}`
}

/** URL-safe YYYY-MM-DD, local calendar date (not UTC, avoids off-by-one near midnight). */
export function toDateParam(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function fromDateParam(s: string, endOfDay: boolean): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  const [, y, mo, d] = m
  const date = new Date(Number(y), Number(mo) - 1, Number(d))
  if (Number.isNaN(date.getTime())) return null
  if (endOfDay) date.setHours(23, 59, 59, 999)
  return date
}

export function encodeRange(range: DateRange): { from?: string; to?: string } {
  if (range === null) return {}
  return { from: toDateParam(range.from), to: toDateParam(range.to) }
}

export function decodeRange(from: string | null, to: string | null): DateRange {
  if (!from || !to) return null
  const fromDate = fromDateParam(from, false)
  const toDate = fromDateParam(to, true)
  if (!fromDate || !toDate) return null
  return { from: fromDate, to: toDate }
}

const DAY_MS = 86400000

/** Today / Yesterday / weekday+date bucket label for grouping a transaction list by day. */
export function dayBucketLabel(date: Date, now = new Date()): string {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / DAY_MS)
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  const sameYear = date.getFullYear() === now.getFullYear()
  return date.toLocaleDateString("en-US", sameYear ? { weekday: "short", month: "short", day: "numeric" } : { weekday: "short", month: "short", day: "numeric", year: "numeric" })
}
