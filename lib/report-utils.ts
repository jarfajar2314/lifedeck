import type { Transaction, Account, Category } from "@/lib/db"

export interface PeriodData {
  label: string
  income: number
  expenses: number
}

export interface CategoryData {
  categoryId: string | null
  name: string
  color: string
  amount: number
  pct: number
}

export interface AccountData {
  accountId: string
  name: string
  color: string
  income: number
  expenses: number
  net: number
}

export interface ReportSummary {
  totalIncome: number
  totalExpenses: number
  net: number
  avgDailyExpense: number
  topCategoryName: string | null
  topCategoryColor: string | null
}

function incomeExpenses(txs: Transaction[]): { income: number; expenses: number } {
  let income = 0
  let expenses = 0
  for (const t of txs) {
    if (t.type === "expense") expenses += t.amount
    else if (t.type === "income") income += t.amount
  }
  return { income, expenses }
}

/** Last n months (default 6). Excludes transfers. */
export function groupByMonth(txs: Transaction[], n = 6): PeriodData[] {
  const now = new Date()
  const months: PeriodData[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth()
    const label = d.toLocaleString("en-US", { month: "short", year: "numeric" })
    const bucket = txs.filter((t) => {
      if (t.type === "transfer") return false
      const td = new Date(t.loggedAt)
      return td.getFullYear() === year && td.getMonth() === month
    })
    months.push({ label, ...incomeExpenses(bucket) })
  }
  return months
}

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

/** Last n weeks (default 8). Excludes transfers. */
export function groupByWeek(txs: Transaction[], n = 8): PeriodData[] {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayOfWeek = (todayStart.getDay() + 6) % 7
  const currentWeekStart = new Date(todayStart)
  currentWeekStart.setDate(todayStart.getDate() - dayOfWeek)
  const weeks: PeriodData[] = []
  for (let i = n - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart)
    weekStart.setDate(currentWeekStart.getDate() - i * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)
    const weekNum = getWeekNumber(weekStart)
    const label = `W${weekNum}`
    const bucket = txs.filter((t) => {
      if (t.type === "transfer") return false
      const td = new Date(t.loggedAt).getTime()
      return td >= weekStart.getTime() && td < weekEnd.getTime()
    })
    weeks.push({ label, ...incomeExpenses(bucket) })
  }
  return weeks
}

/** Expense breakdown per category. Excludes income + transfers. */
export function groupByCategory(txs: Transaction[], categories: Category[]): CategoryData[] {
  const catMap = new Map(categories.map((c) => [c.id, c]))
  const totals = new Map<string | null, number>()
  for (const t of txs) {
    if (t.type !== "expense") continue
    const key = t.categoryId ?? null
    totals.set(key, (totals.get(key) ?? 0) + t.amount)
  }
  const grandTotal = Array.from(totals.values()).reduce((s, v) => s + v, 0)
  const result: CategoryData[] = []
  for (const [catId, amount] of totals.entries()) {
    const cat = catId ? catMap.get(catId) : undefined
    result.push({
      categoryId: catId,
      name: cat?.name ?? "Uncategorized",
      color: cat?.color ?? "#6B7280",
      amount,
      pct: grandTotal > 0 ? (amount / grandTotal) * 100 : 0,
    })
  }
  return result.sort((a, b) => b.amount - a.amount)
}

/**
 * Per-account income/expense/net.
 * Includes transfers: transfer-out = expense, transfer-in (type="income" paired) = income.
 */
export function groupByAccount(txs: Transaction[], accounts: Account[]): AccountData[] {
  const result: AccountData[] = []
  for (const acc of accounts) {
    let income = 0
    let expenses = 0
    for (const t of txs) {
      if (t.accountId !== acc.id) continue
      if (t.type === "expense") expenses += t.amount
      else if (t.type === "income") income += t.amount
      else if (t.type === "transfer") expenses += t.amount
    }
    result.push({
      accountId: acc.id,
      name: acc.name,
      color: acc.color ?? "#6B7280",
      income,
      expenses,
      net: income - expenses,
    })
  }
  return result.sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
}

/** Overall summary. Excludes transfers. */
export function computeSummary(txs: Transaction[], categories: Category[]): ReportSummary {
  const filtered = txs.filter((t) => t.type !== "transfer")
  let totalIncome = 0
  let totalExpenses = 0
  const catTotals = new Map<string, number>()
  for (const t of filtered) {
    if (t.type === "expense") {
      totalExpenses += t.amount
      if (t.categoryId) catTotals.set(t.categoryId, (catTotals.get(t.categoryId) ?? 0) + t.amount)
    } else if (t.type === "income") {
      totalIncome += t.amount
    }
  }
  let avgDailyExpense = 0
  if (filtered.length > 0) {
    const timestamps = filtered.map((t) => new Date(t.loggedAt).getTime())
    const minTs = Math.min(...timestamps)
    const maxTs = Math.max(...timestamps)
    const days = Math.max(1, Math.ceil((maxTs - minTs) / 86400000) + 1)
    avgDailyExpense = totalExpenses / days
  }
  let topCategoryName: string | null = null
  let topCategoryColor: string | null = null
  if (catTotals.size > 0) {
    const topId = Array.from(catTotals.entries()).sort((a, b) => b[1] - a[1])[0][0]
    const cat = categories.find((c) => c.id === topId)
    topCategoryName = cat?.name ?? null
    topCategoryColor = cat?.color ?? null
  }
  return { totalIncome, totalExpenses, net: totalIncome - totalExpenses, avgDailyExpense, topCategoryName, topCategoryColor }
}
