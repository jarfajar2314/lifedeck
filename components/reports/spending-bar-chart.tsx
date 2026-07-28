"use client"

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"
import type { PeriodData } from "@/lib/report-utils"

interface SpendingBarChartProps {
  data: PeriodData[]
  title: string
}

function formatCompactRp(val: number): string {
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`
  return `${val}`
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="rounded-lg border border-border bg-popover p-2.5 shadow-md text-xs">
      <p className="font-semibold text-popover-foreground mb-1.5">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 tabular-nums">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground capitalize">{entry.name}:</span>
          <span className="font-medium text-popover-foreground">
            Rp{entry.value.toLocaleString("id-ID")}
          </span>
        </div>
      ))}
    </div>
  )
}

export function SpendingBarChart({ data, title }: SpendingBarChartProps) {
  const hasData = data.some((d) => d.income > 0 || d.expenses > 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
            No transactions found for this period
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="label"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatCompactRp}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: "12px", fontSize: "12px" }}
                  formatter={(val) => (
                    <span className="capitalize text-muted-foreground text-xs font-medium">
                      {val}
                    </span>
                  )}
                />
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="var(--success, #10B981)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                  animationDuration={800}
                />
                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="var(--destructive, #EF4444)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
