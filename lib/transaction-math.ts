import type { Transaction } from "@/lib/db"

/**
 * +1 if a transaction increases its account's balance, -1 if it decreases it.
 * Transfers with no direction recorded (legacy rows) default to "out", which
 * matches how they were always treated before transfer_direction existed.
 */
export function getTransactionSign(type: Transaction["type"] | string, direction?: "in" | "out" | string | null): number {
  if (type === "expense") return -1
  if (type === "income") return 1
  if (type === "transfer") return direction === "in" ? 1 : -1
  return 0
}

export function isInflow(type: Transaction["type"] | string, direction?: "in" | "out" | string | null): boolean {
  return getTransactionSign(type, direction) > 0
}
