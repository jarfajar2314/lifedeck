"use client"

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart as PieChartIcon } from "lucide-react"
import type { CategoryData } from "@/lib/report-utils"

interface CategoryBreakdownProps {
  data: CategoryData[]
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null
  const item: CategoryData = payload[0].payload

  return (
    <div className="rounded-lg border border-border bg-popover p-2.5 shadow-md text-xs">
      <div className="flex items-center gap-2 mb-1">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: item.color }}
        />
        <span className="font-semibold text-popover-foreground">{item.name}</span>
      </div>
      <div className="flex justify-between gap-4 tabular-nums text-muted-foreground">
        <span>Amount:</span>
        <span className="font-medium text-popover-foreground">
          Rp{item.amount.toLocaleString("id-ID")}
        </span>
      </div>
      <div className="flex justify-between gap-4 tabular-nums text-muted-foreground">
        <span>Share:</span>
        <span className="font-medium text-popover-foreground">
          {item.pct.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const hasData = data.length > 0 && data.some((d) => d.amount > 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <PieChartIcon className="h-4 w-4" /> Category Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-44 items-center justify-center text-xs text-muted-foreground">
            No expense categories recorded
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    animationDuration={800}
                  >
                    {data.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-col gap-1.5 border-t border-border pt-3">
              {data.map((cat, idx) => (
                <div
                  key={cat.categoryId ?? `cat-${idx}`}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate font-medium">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-3 tabular-nums shrink-0">
                    <span className="text-muted-foreground">{cat.pct.toFixed(1)}%</span>
                    <span className="font-semibold">
                      Rp{cat.amount.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
