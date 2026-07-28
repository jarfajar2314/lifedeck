"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Scale, Tag } from "lucide-react"
import type { ReportSummary } from "@/lib/report-utils"

interface SummaryCardsProps {
  summary: ReportSummary
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const { totalIncome, totalExpenses, net, topCategoryName, topCategoryColor } = summary

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="p-3">
        <CardContent className="p-0 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Income</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/10 text-success">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-base font-bold tabular-nums text-success">
              +Rp{totalIncome.toLocaleString("id-ID")}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="p-3">
        <CardContent className="p-0 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Expenses</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <TrendingDown className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-base font-bold tabular-nums text-destructive">
              -Rp{totalExpenses.toLocaleString("id-ID")}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="p-3">
        <CardContent className="p-0 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Net Balance</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-color/10 text-accent-color">
              <Scale className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span
              className={`text-base font-bold tabular-nums ${
                net >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {net >= 0 ? "+" : "-"}Rp{Math.abs(net).toLocaleString("id-ID")}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="p-3">
        <CardContent className="p-0 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Top Spend</span>
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{
                backgroundColor: topCategoryColor ? `${topCategoryColor}20` : "var(--muted)",
                color: topCategoryColor || "var(--muted-foreground)",
              }}
            >
              <Tag className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm font-semibold truncate block">
              {topCategoryName || "N/A"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
