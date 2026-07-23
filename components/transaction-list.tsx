"use client"

import { useTransactions } from "@/hooks/use-db"
import { cn } from "@/lib/utils"

type TransactionListProps = {
  spaceId: string
  limit?: number
}

export function TransactionList({ spaceId, limit }: TransactionListProps) {
  const { items, loading } = useTransactions(spaceId)

  const displayed = limit ? items.slice(0, limit) : items

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground" role="status" aria-live="polite">Loading...</div>
  }

  if (displayed.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">No transactions</p>
  }

  const total = items
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="flex flex-col gap-1" role="region" aria-label="Transactions">
      <div className="flex items-center justify-between px-1 pb-2">
        <span className="text-xs text-muted-foreground">Recent</span>
        <span className="text-sm font-semibold text-destructive" aria-label={`Total expenses: Rp${total.toLocaleString("id-ID")}`}>
          -Rp{total.toLocaleString("id-ID")}
        </span>
      </div>
      <ul className="flex flex-col gap-0.5" aria-label="Transaction list">
        {displayed.map((tx) => (
          <li
            key={tx.id}
            className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                tx.type === "expense" ? "bg-destructive/10 text-destructive"
                  : tx.type === "income" ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-muted text-muted-foreground"
              )} aria-hidden="true">
                {tx.type === "expense" ? "↓" : tx.type === "income" ? "↑" : "↔"}
              </div>
              <div>
                <p className="text-sm font-medium">{tx.note || "Untitled"}</p>
                <time className="text-[10px] text-muted-foreground" dateTime={new Date(tx.loggedAt).toISOString()}>
                  {new Date(tx.loggedAt).toLocaleDateString()}
                </time>
              </div>
            </div>
            <span className={cn(
              "text-sm font-semibold tabular-nums",
              tx.type === "expense" && "text-destructive",
              tx.type === "income" && "text-emerald-500"
            )}>
              {tx.type === "expense" ? "-" : "+"}Rp{tx.amount.toLocaleString("id-ID")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
