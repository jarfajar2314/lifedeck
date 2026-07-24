"use client"

import { useState } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useTransactions } from "@/hooks/use-db"
import { toast } from "sonner"
import { Pencil, Check, X, Plus, ArrowRightFromLine, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import * as store from "@/lib/data-store"
import type { Account } from "@/lib/db"

type AccountDetailProps = {
  account: Account | null
  open: boolean
  onOpenChange: (v: boolean) => void
  accounts: Account[]
  spaceId: string
}

export function AccountDetail({ account, open, onOpenChange, accounts, spaceId }: AccountDetailProps) {
  const { add: addTransaction, items: allTxs } = useTransactions(spaceId)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [incomeOpen, setIncomeOpen] = useState(false)
  const [incomeAmount, setIncomeAmount] = useState("")
  const [incomeNote, setIncomeNote] = useState("")
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferAmount, setTransferAmount] = useState("")
  const [transferTargetId, setTransferTargetId] = useState("")
  const [transferNote, setTransferNote] = useState("")

  const liveAccount = accounts.find((a) => a.id === account?.id) || account
  if (!liveAccount) return null

  const acc = liveAccount

  const otherAccounts = accounts.filter((a) => a.id !== acc.id)
  const accountTxs = allTxs
    .filter((t) => t.accountId === acc.id)
    .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
    .slice(0, 10)

  async function handleSaveName() {
    if (!editName.trim()) return
    await store.persist("accounts", "update", { name: editName.trim() }, acc.id)
    store.invalidate(["accounts"])
    setEditing(false)
    toast(`Account renamed to "${editName.trim()}"`)
  }

  function startEditing() {
    setEditName(acc.name)
    setEditing(true)
  }

  async function handleAddIncome() {
    const amount = parseFloat(incomeAmount.replace(/,/g, ""))
    if (isNaN(amount) || amount <= 0) return
    await addTransaction({ spaceId, amount, type: "income", accountId: acc.id, note: incomeNote || undefined, loggedAt: new Date() })
    store.invalidate(["accounts"])
    setIncomeAmount("")
    setIncomeNote("")
    setIncomeOpen(false)
    toast(`Income: +Rp${amount.toLocaleString("id-ID")} @${acc.name}`)
  }

  async function handleTransfer() {
    const amount = parseFloat(transferAmount.replace(/,/g, ""))
    if (isNaN(amount) || amount <= 0 || !transferTargetId) return
    const target = accounts.find((a) => a.id === transferTargetId)
    if (!target) return
    const now = new Date()
    await addTransaction({ spaceId, amount, type: "expense", accountId: acc.id, note: transferNote || `Transfer to ${target.name}`, loggedAt: now })
    await addTransaction({ spaceId, amount, type: "income", accountId: target.id, note: transferNote || `Transfer from ${acc.name}`, loggedAt: now })
    store.invalidate(["accounts"])
    setTransferAmount("")
    setTransferTargetId("")
    setTransferNote("")
    setTransferOpen(false)
    toast(`Transfer: Rp${amount.toLocaleString("id-ID")} @${acc.name} → @${target.name}`)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent aria-label="Account detail">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            {editing ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 text-sm flex-1"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveName() }}
                />
                <button onClick={handleSaveName} className="flex h-8 w-8 items-center justify-center rounded-lg text-success hover:bg-secondary">
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={() => setEditing(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <span>{acc.name}</span>
                <button onClick={startEditing} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </DrawerTitle>
          <p className="text-2xl font-bold tabular-nums">
            {formatBalance(acc.balance)}
          </p>
        </DrawerHeader>

        <div className="flex flex-col gap-0 overflow-y-auto px-4 pb-6">
          <section aria-label="Actions" className="flex flex-col gap-2 py-4">
            {incomeOpen ? (
              <div className="flex flex-col gap-2 rounded-xl bg-secondary/50 p-3">
                <Input
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  placeholder="Amount"
                  type="text"
                  inputMode="decimal"
                  className="h-10 text-sm"
                  autoFocus
                />
                <Input
                  value={incomeNote}
                  onChange={(e) => setIncomeNote(e.target.value)}
                  placeholder="Note (optional)"
                  className="h-10 text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddIncome} disabled={!incomeAmount || isNaN(parseFloat(incomeAmount))} className="flex-1">
                    Save Income
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setIncomeOpen(false); setIncomeAmount(""); setIncomeNote("") }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIncomeOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success transition-colors hover:bg-success/20"
              >
                <Plus className="h-4 w-4" />
                Add Income
              </button>
            )}

            {transferOpen ? (
              <div className="flex flex-col gap-2 rounded-xl bg-secondary/50 p-3">
                <Input
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Amount"
                  type="text"
                  inputMode="decimal"
                  className="h-10 text-sm"
                  autoFocus
                />
                <select
                  value={transferTargetId}
                  onChange={(e) => setTransferTargetId(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select target account</option>
                  {otherAccounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({formatBalance(a.balance)})</option>
                  ))}
                </select>
                <Input
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="Note (optional)"
                  className="h-10 text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleTransfer} disabled={!transferAmount || isNaN(parseFloat(transferAmount)) || !transferTargetId} className="flex-1">
                    Transfer
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setTransferOpen(false); setTransferAmount(""); setTransferTargetId(""); setTransferNote("") }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setTransferOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-600 dark:text-amber-400 transition-colors hover:bg-amber-500/20"
              >
                <ArrowRightFromLine className="h-4 w-4" />
                Transfer to another account
              </button>
            )}
          </section>

          <Separator />

          <section aria-label="Recent transactions" className="py-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Transactions</p>
            {accountTxs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No transactions yet</p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {accountTxs.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs font-bold",
                        tx.type === "expense" ? "text-destructive" : tx.type === "income" ? "text-success" : "text-muted-foreground"
                      )}>
                        {tx.type === "expense" ? "↓" : tx.type === "income" ? "↑" : "↔"}
                      </span>
                      <span className="text-sm">{tx.note || "Untitled"}</span>
                    </div>
                    <span className={cn(
                      "text-sm font-semibold tabular-nums",
                      tx.type === "expense" ? "text-destructive" : tx.type === "income" ? "text-success" : ""
                    )}>
                      {tx.type === "expense" ? "-" : "+"}Rp{tx.amount.toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function formatBalance(balance: number): string {
  const abs = Math.abs(balance)
  const formatted = "Rp" + abs.toLocaleString("id-ID")
  return balance < 0 ? `-${formatted}` : formatted
}
