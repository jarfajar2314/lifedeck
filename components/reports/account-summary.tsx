"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet } from "lucide-react"
import { AccountBadge } from "@/components/account-badge"
import type { AccountData } from "@/lib/report-utils"
import type { Account } from "@/lib/db"

interface AccountSummaryProps {
  data: AccountData[]
  accounts: Account[]
}

export function AccountSummary({ data, accounts }: AccountSummaryProps) {
  const accMap = new Map(accounts.map((a) => [a.id, a]))
  const hasData = data.length > 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-4 w-4" /> Account Summaries
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
            No account activity found
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {data.map((item) => {
              const accountObj = accMap.get(item.accountId)
              return (
                <div
                  key={item.accountId}
                  className="flex items-center justify-between rounded-xl bg-secondary/30 p-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {accountObj ? (
                      <AccountBadge account={accountObj} size="md" />
                    ) : (
                      <span className="text-sm font-medium truncate">{item.name}</span>
                    )}
                  </div>

                  <div className="flex flex-col items-end tabular-nums text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-success font-medium">
                        +Rp{item.income.toLocaleString("id-ID")}
                      </span>
                      <span className="text-destructive font-medium">
                        -Rp{item.expenses.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <span
                      className={`font-semibold ${
                        item.net >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      Net: {item.net >= 0 ? "+" : "-"}Rp
                      {Math.abs(item.net).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
