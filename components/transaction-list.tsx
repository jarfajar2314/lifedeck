"use client"

import { useState, useMemo } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useTransactions } from "@/hooks/use-db"
import { cn } from "@/lib/utils"
import { TransactionDetail } from "@/components/transaction-detail"
import { Skeleton } from "@/components/ui/skeleton"
import { WalletMinimal, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { CategoryBadge } from "@/components/category-badge"
import { AccountBadge } from "@/components/account-badge"
import * as Phosphor from "@phosphor-icons/react"
import { type Transaction, type Account, type Category } from "@/lib/db"
import { isInflow } from "@/lib/transaction-math"
import { type DateRange, dayBucketLabel, formatRangeLabel } from "@/lib/date-filter"
import { toast } from "sonner"

type MergedTransfer = {
  isMerged: true
  id: string
  sourceId: string
  targetId: string
  amount: number
  fromName: string
  toName: string
  note?: string
  loggedAt: Date
  sourceTxId: string
  targetTxId: string
}

type DateHeader = {
  isHeader: true
  id: string
  label: string
}

type RowItem = Transaction | MergedTransfer | DateHeader

type TransactionListProps = {
  spaceId: string
  limit?: number
  accounts: Account[]
  categories: Category[]
  accountFilter?: string
  categoryFilter?: string
  dateRange?: DateRange
  groupByDate?: boolean
}

export function TransactionList({ spaceId, limit, accounts, categories, accountFilter, categoryFilter, dateRange, groupByDate }: TransactionListProps) {
  const { items, loading, update, remove } = useTransactions(spaceId)
  const [selected, setSelected] = useState<Transaction | null>(null)
  const [selectedTransfer, setSelectedTransfer] = useState<MergedTransfer | null>(null)
  const [confirmDeleteTransfer, setConfirmDeleteTransfer] = useState(false)
  const [deletingTransfer, setDeletingTransfer] = useState(false)

  async function handleDeleteTransfer() {
    if (!selectedTransfer) return
    setDeletingTransfer(true)
    await Promise.all([remove(selectedTransfer.sourceTxId), remove(selectedTransfer.targetTxId)])
    toast("Transfer deleted")
    setDeletingTransfer(false)
    setConfirmDeleteTransfer(false)
    setSelectedTransfer(null)
  }

  const accountMap = new Map(accounts.map((a) => [a.id, a]))
  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  const { displayed, totalExpenses, totalIncome } = useMemo(() => {
    let filtered = items

    if (accountFilter) {
      filtered = filtered.filter((t) => t.accountId === accountFilter)
    }

    if (categoryFilter) {
      filtered = filtered.filter((t) => t.categoryId === categoryFilter)
    }

    if (dateRange) {
      const from = dateRange.from.getTime()
      const to = dateRange.to.getTime()
      filtered = filtered.filter((t) => {
        const ts = new Date(t.loggedAt).getTime()
        return ts >= from && ts <= to
      })
    }

    const paired = new Set<string>()
    const merged: Array<Transaction | MergedTransfer> = []

    for (const tx of filtered) {
      if (paired.has(tx.id)) continue
      if (tx.type === "transfer" && tx.transferPairId) {
        const match = filtered.find(
          (t) => t.id !== tx.id && !paired.has(t.id) && t.transferPairId === tx.transferPairId
        )
        if (match) {
          paired.add(tx.id)
          paired.add(match.id)
          const outLeg = tx.transferDirection === "out" ? tx : match
          const inLeg = tx.transferDirection === "out" ? match : tx
          merged.push({
            isMerged: true,
            id: outLeg.id,
            sourceId: outLeg.accountId ?? "",
            targetId: inLeg.accountId ?? "",
            amount: outLeg.amount,
            fromName: accountMap.get(outLeg.accountId ?? "")?.name ?? "?",
            toName: accountMap.get(inLeg.accountId ?? "")?.name ?? "?",
            note: outLeg.note?.replace(/^Transfer to /, "") || "Transfer",
            loggedAt: outLeg.loggedAt,
            sourceTxId: outLeg.id,
            targetTxId: inLeg.id,
          })
          continue
        }
      }
      merged.push(tx)
    }

    const expenses = filtered
      .filter((t) => t.type === "expense" || (accountFilter && t.type === "transfer" && !isInflow(t.type, t.transferDirection)))
      .reduce((sum, t) => sum + t.amount, 0)

    const income = filtered
      .filter((t) => t.type === "income" || (accountFilter && t.type === "transfer" && isInflow(t.type, t.transferDirection)))
      .reduce((sum, t) => sum + t.amount, 0)

    const sliced = limit ? merged.slice(0, limit) : merged

    let withHeaders: RowItem[] = sliced
    if (groupByDate) {
      withHeaders = []
      let lastLabel: string | null = null
      for (const row of sliced) {
        const label = dayBucketLabel(new Date(row.loggedAt))
        if (label !== lastLabel) {
          withHeaders.push({ isHeader: true, id: `header-${label}-${row.id}`, label })
          lastLabel = label
        }
        withHeaders.push(row)
      }
    }

    return {
      displayed: withHeaders,
      hasMore: limit ? merged.length > limit : false,
      totalExpenses: expenses,
      totalIncome: income,
    }
  }, [items, accountMap, limit, accountFilter, categoryFilter, dateRange, groupByDate])

  if (loading) {
    return (
      <div className="flex flex-col gap-1" role="status" aria-live="polite" aria-label="Loading transactions">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="flex-1 flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-2.5 w-16" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    )
  }

  const hasFilters = Boolean(accountFilter || categoryFilter || dateRange !== undefined)

  if (displayed.length === 0) {
    const filterParts = [
      dateRange !== undefined && formatRangeLabel(dateRange),
      accountFilter && accountMap.get(accountFilter)?.name,
      categoryFilter && categoryMap.get(categoryFilter)?.name,
    ].filter((p): p is string => Boolean(p))
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
        <WalletMinimal className="h-5 w-5 opacity-50" aria-hidden="true" />
        <p>{filterParts.length > 0 ? `No transactions for ${filterParts.join(", ")}` : "No transactions yet"}</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-1" role="region" aria-label="Transactions">
        <div className="flex items-center justify-between px-1 pb-2">
          <span className="text-xs text-muted-foreground">
            {hasFilters ? "Total (Filtered)" : "Recent"}
          </span>
          <div className="flex items-center gap-2 text-sm font-semibold tabular-nums">
            {hasFilters ? (
              <>
                {totalIncome > 0 && (
                  <span className="text-success" aria-label={`Total income: Rp${totalIncome.toLocaleString("id-ID")}`}>
                    +Rp{totalIncome.toLocaleString("id-ID")}
                  </span>
                )}
                {totalExpenses > 0 && (
                  <span className="text-destructive" aria-label={`Total expenses: Rp${totalExpenses.toLocaleString("id-ID")}`}>
                    -Rp{totalExpenses.toLocaleString("id-ID")}
                  </span>
                )}
                {totalIncome === 0 && totalExpenses === 0 && (
                  <span className="text-muted-foreground">Rp0</span>
                )}
              </>
            ) : (
              <span className="text-destructive" aria-label={`Total expenses: Rp${totalExpenses.toLocaleString("id-ID")}`}>
                -Rp{totalExpenses.toLocaleString("id-ID")}
              </span>
            )}
          </div>
        </div>
        <ul className="flex flex-col gap-0.5" aria-label="Transaction list">
          <AnimatePresence initial={false}>
            {displayed.map((row, i) => {
              if ("isHeader" in row) {
                return (
                  <motion.li
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-2 pt-3 pb-1 text-xs font-semibold text-muted-foreground first:pt-1"
                  >
                    {row.label}
                  </motion.li>
                )
              }
              if ("isMerged" in row) {
                return (
                  <motion.li
                    key={row.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -24, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.18, delay: i * 0.02 }}
                  >
                    <button
                      onClick={() => setSelectedTransfer(row)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary/50 active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground" aria-hidden="true">
                          ↔
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium">{row.note || "Transfer"}</p>
                          <div className="flex items-center gap-1.5">
                            <time className="text-[10px] text-muted-foreground" dateTime={new Date(row.loggedAt).toISOString()}>
                              {new Date(row.loggedAt).toLocaleDateString()}
                            </time>
                            <span className="text-[10px] text-muted-foreground/60">{row.fromName} → {row.toName}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-sm tabular-nums text-muted-foreground">
                        Rp{row.amount.toLocaleString("id-ID")}
                      </span>
                    </button>
                  </motion.li>
                )
              }
              const tx = row as Transaction
              const cat = tx.categoryId ? categoryMap.get(tx.categoryId) : undefined
              const catColor = cat?.color
              const inflow = tx.type === "income" || (tx.type === "transfer" && isInflow(tx.type, tx.transferDirection))

              return (
                <motion.li
                  key={tx.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -24, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.18, delay: i * 0.02 }}
                >
                  <button
                    onClick={() => setSelected(tx)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary/50 active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full",
                          !catColor && (
                            tx.type === "transfer" ? "bg-muted text-muted-foreground"
                              : inflow ? "bg-success/10 text-success"
                              : "bg-destructive/10 text-destructive"
                          )
                        )}
                        style={catColor ? { backgroundColor: `${catColor}20`, color: catColor } : undefined}
                        aria-hidden="true"
                      >
                        {(() => {
                          if (cat) {
                            const iconName = cat.icon || ""
                            if (iconName) {
                              const Icon = (Phosphor as any)[iconName.charAt(0).toUpperCase() + iconName.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase())]
                              if (Icon) return <Icon weight="duotone" className="h-4 w-4" />
                            }
                          }
                          return tx.type === "transfer" ? "↔" : inflow ? "↑" : "↓"
                        })()}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">{tx.note || "Untitled"}</p>
                        <div className="flex items-center gap-1.5">
                          <time className="text-[10px] text-muted-foreground" dateTime={new Date(tx.loggedAt).toISOString()}>
                            {new Date(tx.loggedAt).toLocaleDateString()}
                          </time>
                          {tx.accountId && accountMap.has(tx.accountId) && (
                            <AccountBadge account={accountMap.get(tx.accountId)!} size="md" />
                          )}

                        </div>
                      </div>
                    </div>
                    <span className={cn(
                      "text-sm font-semibold tabular-nums",
                      inflow ? "text-success" : "text-destructive"
                    )}>
                      {inflow ? "+" : "-"}Rp{tx.amount.toLocaleString("id-ID")}
                    </span>
                  </button>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      </div>

      <TransactionDetail
        transaction={selected}
        open={selected !== null}
        onOpenChange={(v) => { if (!v) setSelected(null) }}
        onUpdate={update}
        onDelete={remove}
        categories={categories}
        accounts={accounts}
      />

      <Sheet open={selectedTransfer !== null} onOpenChange={(v) => { if (!v) { setSelectedTransfer(null); setConfirmDeleteTransfer(false) } }}>
        <SheetContent side="bottom" aria-label="Transfer detail">
          <SheetHeader>
            <SheetTitle>Transfer</SheetTitle>
            <SheetDescription>Transfer between accounts.</SheetDescription>
          </SheetHeader>
          {selectedTransfer && (
            confirmDeleteTransfer ? (
              <div className="flex flex-col gap-4 p-4 pt-0">
                <p className="text-sm">
                  Delete this transfer of <strong>Rp{selectedTransfer.amount.toLocaleString("id-ID")}</strong> between <strong>{selectedTransfer.fromName}</strong> and <strong>{selectedTransfer.toName}</strong>?
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setConfirmDeleteTransfer(false)} disabled={deletingTransfer}>
                    Cancel
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={handleDeleteTransfer} disabled={deletingTransfer}>
                    <Trash2Icon /> {deletingTransfer ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-bold text-muted-foreground">↔</div>
                <span className="text-2xl font-bold tabular-nums">Rp{selectedTransfer.amount.toLocaleString("id-ID")}</span>
                <div className="text-center text-sm font-medium">{selectedTransfer.note}</div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span>@{selectedTransfer.fromName}</span>
                  <span>→</span>
                  <span>@{selectedTransfer.toName}</span>
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  <time dateTime={new Date(selectedTransfer.loggedAt).toISOString()}>
                    {new Date(selectedTransfer.loggedAt).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </time>
                </div>
                <Button variant="destructive" size="sm" className="mt-2 w-full" onClick={() => setConfirmDeleteTransfer(true)}>
                  <Trash2Icon /> Delete Transfer
                </Button>
              </div>
            )
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
