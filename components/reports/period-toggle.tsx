"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PeriodToggleProps {
  value: "month" | "week"
  onValueChange: (value: "month" | "week") => void
}

export function PeriodToggle({ value, onValueChange }: PeriodToggleProps) {
  return (
    <Tabs value={value} onValueChange={(val) => onValueChange(val as "month" | "week")}>
      <TabsList className="w-full grid grid-cols-2">
        <TabsTrigger value="month" className="min-h-[36px]">
          Monthly
        </TabsTrigger>
        <TabsTrigger value="week" className="min-h-[36px]">
          Weekly
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
