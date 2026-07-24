"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useTransactions } from "@/hooks/use-db"
import { cn } from "@/lib/utils"
import { TransactionDetail } from "@/components/transaction-detail"
import { Skeleton } from "@/components/ui/skeleton"
import { WalletMinimal } from "lucide-react"
import { type Transaction, type Account } from "@/lib/db"

type TransactionListProps = {
  spaceId: string
  limit?: number
  accounts: Account[]
}

export function TransactionList({ spaceId, limit, accounts }: TransactionListProps) {
  const { items, loading, update, remove } = useTransactions(spaceId)
  const [selected, setSelected] = useState<Transaction | null>(null)

  const accountMap = new Map(accounts.map((a) => [a.id, a]))

  const displayed = limit ? items.slice(0, limit) : items

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
        <ul className="flex flex-col gap-0.5" aria-label="Transaction list">
          <AnimatePresence initial={false}>
            {displayed.map((tx, i) => (
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
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                      tx.type === "expense" ? "bg-destructive/10 text-destructive"
                        : tx.type === "income" ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    )} aria-hidden="true">
                      {tx.type === "expense" ? "↓" : tx.type === "income" ? "↑" : "↔"}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{tx.note || "Untitled"}</p>
                      <div className="flex items-center gap-1.5">
                        <time className="text-[10px] text-muted-foreground" dateTime={new Date(tx.loggedAt).toISOString()}>
                          {new Date(tx.loggedAt).toLocaleDateString()}
                        </time>
                        {tx.accountId && accountMap.has(tx.accountId) && (
                          <span className="text-[10px] text-muted-foreground/60">@{accountMap.get(tx.accountId)!.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={cn(
                    "text-sm font-semibold tabular-nums",
                    tx.type === "expense" && "text-destructive",
                    tx.type === "income" && "text-success"
                  )}>
                    {tx.type === "expense" ? "-" : "+"}Rp{tx.amount.toLocaleString("id-ID")}
                  </span>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
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
