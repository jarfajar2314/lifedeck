"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useTransactions, useAccounts, useCategories } from "@/hooks/use-db"
import { useSpaces } from "@/hooks/use-spaces"
import { OfflineIndicator } from "@/components/offline-indicator"
import { ArrowLeft, Loader2 } from "lucide-react"
import { SpaceSelector } from "@/components/space-selector"
import { LifeDeckLogo } from "@/components/lifedeck-logo"
import { PeriodToggle } from "@/components/reports/period-toggle"
import { SummaryCards } from "@/components/reports/summary-cards"
import { SpendingBarChart } from "@/components/reports/spending-bar-chart"
import { CategoryBreakdown } from "@/components/reports/category-breakdown"
import { AccountSummary } from "@/components/reports/account-summary"
import {
  groupByMonth,
  groupByWeek,
  groupByCategory,
  groupByAccount,
  computeSummary,
} from "@/lib/report-utils"

export default function ReportsPage() {
  const router = useRouter()
  const { user, isPending } = useAuth()
  const { spaces, currentId, setCurrentId, createSpace, joinSpace, regenerateInviteCode } =
    useSpaces(user?.id)

  const [period, setPeriod] = useState<"month" | "week">("month")

  const { items: transactions, loading: txLoading } = useTransactions(currentId)
  const { items: accounts } = useAccounts(currentId)
  const { items: categories } = useCategories(currentId)

  // Computation
  const barData = useMemo(() => {
    return period === "month"
      ? groupByMonth(transactions, 6)
      : groupByWeek(transactions, 8)
  }, [transactions, period])

  const catData = useMemo(() => {
    return groupByCategory(transactions, categories)
  }, [transactions, categories])

  const accountData = useMemo(() => {
    return groupByAccount(transactions, accounts)
  }, [transactions, accounts])

  const summary = useMemo(() => {
    return computeSummary(transactions, categories)
  }, [transactions, categories])

  if (isPending || txLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <p className="text-muted-foreground">Sign in to view reports.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <OfflineIndicator />

      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-secondary/50"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <LifeDeckLogo />
            <SpaceSelector
              spaces={spaces}
              currentId={currentId}
              onSwitch={setCurrentId}
              onCreateSpace={createSpace}
              onJoinSpace={joinSpace}
              onRegenerateCode={regenerateInviteCode}
            />
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Reports & Analytics</h1>
          <PeriodToggle value={period} onValueChange={setPeriod} />
        </div>

        <SummaryCards summary={summary} />

        <SpendingBarChart
          data={barData}
          title={period === "month" ? "Monthly Trends" : "Weekly Trends"}
        />

        <CategoryBreakdown data={catData} />

        <AccountSummary data={accountData} accounts={accounts} />
      </main>
    </div>
  )
}
