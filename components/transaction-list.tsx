"use client"

import { useState, useMemo } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useTransactions } from "@/hooks/use-db"
import { cn } from "@/lib/utils"
import { TransactionDetail } from "@/components/transaction-detail"
import { Skeleton } from "@/components/ui/skeleton"
import { WalletMinimal } from "lucide-react"
import { type Transaction, type Account, type Category } from "@/lib/db"

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
}

type RowItem = Transaction | MergedTransfer

type TransactionListProps = {
  spaceId: string
  limit?: number
  accounts: Account[]
  categories: Category[]
}

export function TransactionList({ spaceId, limit, accounts, categories }: TransactionListProps) {
  const { items, loading, update, remove } = useTransactions(spaceId)
  const [selected, setSelected] = useState<Transaction | null>(null)

  const accountMap = new Map(accounts.map((a) => [a.id, a]))
  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  const { displayed } = useMemo(() => {
    const paired = new Set<string>()
    const merged: RowItem[] = []

    for (const tx of items) {
      if (paired.has(tx.id)) continue
      if (tx.type === "transfer") {
        const match = items.find(
          (t) => t.id !== tx.id
            && !paired.has(t.id)
            && t.type === "income"
            && t.amount === tx.amount
            && Math.abs(new Date(t.loggedAt).getTime() - new Date(tx.loggedAt).getTime()) < 2000
        )
        if (match) {
          paired.add(tx.id)
          paired.add(match.id)
          merged.push({
            isMerged: true,
            id: tx.id,
            sourceId: tx.accountId ?? "",
            targetId: match.accountId ?? "",
            amount: tx.amount,
            fromName: accountMap.get(tx.accountId ?? "")?.name ?? "?",
            toName: accountMap.get(match.accountId ?? "")?.name ?? "?",
            note: tx.note?.replace(/^Transfer to /, "") || "Transfer",
            loggedAt: tx.loggedAt,
          })
          continue
        }
      }
      merged.push(tx)
    }

    const sliced = limit ? merged.slice(0, limit) : merged
    return { displayed: sliced, hasMore: limit ? merged.length > limit : false }
  }, [items, accountMap, limit])

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

  if (displayed.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
        <WalletMinimal className="h-5 w-5 opacity-50" aria-hidden="true" />
        <p>No transactions yet</p>
      </div>
    )
  }

  const total = items
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <>
      <div className="flex flex-col gap-1" role="region" aria-label="Transactions">
        <div className="flex items-center justify-between px-1 pb-2">
          <span className="text-xs text-muted-foreground">Recent</span>
          <span className="text-sm font-semibold text-destructive tabular-nums" aria-label={`Total expenses: Rp${total.toLocaleString("id-ID")}`}>
            -Rp{total.toLocaleString("id-ID")}
          </span>
        </div>
        {displayed.length > 0 && (
        <ul className="flex flex-col gap-0.5" aria-label="Transaction list">
          <AnimatePresence initial={false}>
            {displayed.map((row, i) => (
              <motion.li
                key={"isMerged" in row ? row.id : (row as Transaction).id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -24, transition: { duration: 0.15 } }}
                transition={{ duration: 0.18, delay: i * 0.02 }}
              >
              {row && "isMerged" in row ? (
                  <div className="flex w-full items-center justify-between rounded-xl px-3 py-2.5">
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
                          <span className="text-[10px] text-muted-foreground/60">@{row.fromName} → @{row.toName}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      Rp{row.amount.toLocaleString("id-ID")}
                    </span>
                  </div>
                ) : (
                <button
                  onClick={() => setSelected(row as Transaction)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary/50 active:scale-[0.98]"
                >
                    <div className="flex items-center gap-3">
                      {(row as Transaction).categoryId && categoryMap.has((row as Transaction).categoryId!) && (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: categoryMap.get((row as Transaction).categoryId!)!.color || "#6B7280" }}
                          aria-hidden="true"
                        />
                      )}
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                        (row as Transaction).type === "expense" ? "bg-destructive/10 text-destructive"
                          : (row as Transaction).type === "income" ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      )} aria-hidden="true">
                        {(row as Transaction).type === "expense" ? "↓" : (row as Transaction).type === "income" ? "↑" : "↔"}
                      </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{(row as Transaction).note || "Untitled"}</p>
                      <div className="flex items-center gap-1.5">
                        <time className="text-[10px] text-muted-foreground" dateTime={new Date((row as Transaction).loggedAt).toISOString()}>
                          {new Date((row as Transaction).loggedAt).toLocaleDateString()}
                        </time>
                        {(row as Transaction).accountId && accountMap.has((row as Transaction).accountId!) && (
                          <span className="text-[10px] text-muted-foreground/60">@{accountMap.get((row as Transaction).accountId!)!.name}</span>
                        )}
                        {(row as Transaction).categoryId && categoryMap.has((row as Transaction).categoryId!) && (
                          <span className="text-[10px] text-muted-foreground/40">{categoryMap.get((row as Transaction).categoryId!)!.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={cn(
                    "text-sm font-semibold tabular-nums",
                    (row as Transaction).type === "expense" && "text-destructive",
                    (row as Transaction).type === "income" && "text-success"
                  )}>
                    {(row as Transaction).type === "expense" ? "-" : "+"}Rp{(row as Transaction).amount.toLocaleString("id-ID")}
                  </span>
                </button>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      </div>

      <TransactionDetail
        transaction={selected}
        open={selected !== null}
        onOpenChange={(v) => { if (!v) setSelected(null) }}
        onUpdate={update}
        onDelete={remove}
      />
    </>
  )
}
