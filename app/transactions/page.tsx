"use client"

import { Suspense, useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useAccounts, useCategories } from "@/hooks/use-db"
import { useSpaces } from "@/hooks/use-spaces"
import { TransactionList } from "@/components/transaction-list"
import { MonthFilter } from "@/components/month-filter"
import { OfflineIndicator } from "@/components/offline-indicator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Receipt, Filter, Loader2, BarChart2, X } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SpaceSelector } from "@/components/space-selector"
import { UserMenu } from "@/components/user-menu"
import { LifeDeckLogo } from "@/components/lifedeck-logo"
import { AccountBadge } from "@/components/account-badge"
import { CategoryBadge } from "@/components/category-badge"
import { type DateRange, getPresetRange, matchingPreset, encodeRange, decodeRange, formatRangeLabel } from "@/lib/date-filter"

function parseRangeFromParams(sp: URLSearchParams): DateRange {
  if (sp.get("range") === "all") return null
  const from = sp.get("from")
  const to = sp.get("to")
  if (from && to) {
    const decoded = decodeRange(from, to)
    if (decoded) return decoded
  }
  return getPresetRange("this-month")
}

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center" role="status">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <TransactionsPageContent />
    </Suspense>
  )
}

function TransactionsPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, isPending } = useAuth()
  const { spaces, currentId, setCurrentId, createSpace, joinSpace, regenerateInviteCode } = useSpaces(user?.id)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const { items: accounts } = useAccounts(currentId)
  const { items: categories } = useCategories(currentId)

  const accountFilter = searchParams.get("account") ?? ""
  const categoryFilter = searchParams.get("category") ?? ""
  const dateRange = parseRangeFromParams(searchParams)

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, { scroll: false })
  }

  function updateRange(range: DateRange) {
    if (range === null) {
      updateParams({ range: "all", from: null, to: null })
    } else {
      const enc = encodeRange(range)
      updateParams({ range: null, from: enc.from ?? null, to: enc.to ?? null })
    }
  }

  const isDefaultRange = matchingPreset(dateRange) === "this-month" && !searchParams.get("range") && !searchParams.get("from")
  const selectedAccount = accounts.find((a) => a.id === accountFilter)
  const selectedCategory = categories.find((c) => c.id === categoryFilter)
  const activeChips = [
    !isDefaultRange && { key: "date", label: formatRangeLabel(dateRange), onRemove: () => updateParams({ range: null, from: null, to: null }) },
    selectedAccount && { key: "account", label: selectedAccount.name, onRemove: () => updateParams({ account: null }) },
    selectedCategory && { key: "category", label: selectedCategory.name, onRemove: () => updateParams({ category: null }) },
  ].filter((c): c is { key: string; label: string; onRemove: () => void } => Boolean(c))

  if (isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <p className="text-muted-foreground">Sign in to view transactions.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <OfflineIndicator />

      <div className="sticky top-0 z-30">
        <header className="border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="flex h-12 w-12 items-center justify-center rounded-full transition-colors hover:bg-secondary/50"
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUserMenuOpen(true)}
                className="flex items-center justify-center rounded-full transition-colors hover:bg-secondary/50"
                aria-label="Open settings"
                style={{ width: 48, height: 48 }}
              >
                <Avatar size="sm">
                  <AvatarFallback className="text-foreground font-bold text-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>
          </div>
        </header>

        <div className="border-b border-border bg-background/80 px-4 py-2.5 backdrop-blur-xl">
          <div className="mx-auto flex max-w-2xl flex-col gap-2">
            <div className="flex items-center gap-2 overflow-x-auto">
              <Filter className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />

              <Select value={accountFilter} onValueChange={(v) => updateParams({ account: (v as string) || null })}>
                <SelectTrigger className="h-9 shrink-0">
                  <SelectValue placeholder="All accounts">
                    {selectedAccount ? (
                      <span className="flex items-center gap-1.5">
                        <AccountBadge account={selectedAccount} size="sm" />
                        {selectedAccount.name}
                      </span>
                    ) : (
                      "All accounts"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" label="All accounts">All accounts</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id} label={a.name}>
                      <span className="flex items-center gap-1.5">
                        <AccountBadge account={a} size="sm" />
                        {a.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={(v) => updateParams({ category: (v as string) || null })}>
                <SelectTrigger className="h-9 shrink-0">
                  <SelectValue placeholder="All categories">
                    {selectedCategory ? (
                      <span className="flex items-center gap-1.5">
                        <CategoryBadge category={selectedCategory} size="sm" />
                        {selectedCategory.name}
                      </span>
                    ) : (
                      "All categories"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" label="All categories">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id} label={c.name}>
                      <span className="flex items-center gap-1.5">
                        <CategoryBadge category={c} size="sm" />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <MonthFilter range={dateRange} onChange={updateRange} />
            </div>

            {activeChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {activeChips.map((chip) => (
                  <Badge key={chip.key} variant="secondary" className="h-6 gap-1 pr-1 text-[11px]">
                    {chip.label}
                    <button
                      type="button"
                      onClick={chip.onRemove}
                      className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-foreground/10"
                      aria-label={`Remove ${chip.label} filter`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {activeChips.length > 1 && (
                  <button
                    onClick={() => router.replace(pathname, { scroll: false })}
                    className="h-6 rounded-full px-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <main id="main-content" className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4" aria-hidden="true" /> All Transactions
            </CardTitle>
            <Link
              href="/reports"
              className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <BarChart2 className="h-3.5 w-3.5" />
              Reports
            </Link>
          </CardHeader>
          <CardContent>
            <TransactionList
              spaceId={currentId}
              accounts={accounts}
              categories={categories}
              accountFilter={accountFilter || undefined}
              categoryFilter={categoryFilter || undefined}
              dateRange={dateRange}
              groupByDate
            />
          </CardContent>
        </Card>
      </main>

      <UserMenu open={userMenuOpen} onOpenChange={setUserMenuOpen} currentSpaceId={currentId} />
    </div>
  )
}
