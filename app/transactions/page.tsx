"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useAccounts, useCategories } from "@/hooks/use-db"
import { useSpaces } from "@/hooks/use-spaces"
import { TransactionList } from "@/components/transaction-list"
import { OfflineIndicator } from "@/components/offline-indicator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Receipt, Filter, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SpaceSelector } from "@/components/space-selector"
import { UserMenu } from "@/components/user-menu"

export default function TransactionsPage() {
  const router = useRouter()
  const { user, isPending } = useAuth()
  const { spaces, currentId, setCurrentId, createSpace, joinSpace, regenerateInviteCode } = useSpaces(user?.id)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [accountFilter, setAccountFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const now = new Date()
  const [monthFilter, setMonthFilter] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)

  const { items: accounts } = useAccounts(currentId)
  const categories = useCategories(currentId)

  const currentMonth = monthFilter

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
            <img src="/lifedeck.svg" alt="LifeDeck" width={24} height={24} className="shrink-0 text-foreground" />
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
              style={{ width: 44, height: 44 }}
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

      <main id="main-content" className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4" aria-hidden="true" /> All Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <select
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
                aria-label="Filter by account"
              >
                <option value="">All accounts</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
                aria-label="Filter by category"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
                aria-label="Filter by month"
              />
              {(accountFilter || categoryFilter || monthFilter) && (
                <button
                  onClick={() => { setAccountFilter(""); setCategoryFilter(""); setMonthFilter("") }}
                  className="h-8 rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <TransactionList
              spaceId={currentId}
              accounts={accounts}
              categories={categories}
              accountFilter={accountFilter || undefined}
              categoryFilter={categoryFilter || undefined}
              monthFilter={monthFilter || undefined}
            />
          </CardContent>
        </Card>
      </main>

      <UserMenu open={userMenuOpen} onOpenChange={setUserMenuOpen} currentSpaceId={currentId} />
    </div>
  )
}
