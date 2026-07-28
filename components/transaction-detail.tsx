"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { toast } from "sonner"
import { type Transaction, type Account, type Category } from "@/lib/db"
import { CheckIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react"
import { CategoryBadge } from "@/components/category-badge"
import { AccountBadge } from "@/components/account-badge"
import * as Phosphor from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

type TransactionDetailProps = {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (id: string, updates: Partial<Omit<Transaction, "id" | "spaceId" | "createdAt">>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  categories?: Category[]
  accounts?: Account[]
}

export function TransactionDetail({ transaction, open, onOpenChange, onUpdate, onDelete, categories, accounts }: TransactionDetailProps) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [type, setType] = useState<"expense" | "income" | "transfer">("expense")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [categoryId, setCategoryId] = useState<string>("")

  if (!transaction) return null
  const tx = transaction

  const typeLabel = tx.type === "expense" ? "Expense" : tx.type === "income" ? "Income" : "Transfer"

  function startEdit() {
    setType(tx.type)
    setAmount(tx.amount.toString())
    setNote(tx.note ?? "")
    setCategoryId(tx.categoryId ?? "")
    setEditing(true)
    setConfirmDelete(false)
  }

  async function handleSave() {
    const parsed = Number.parseFloat(amount)
    if (Number.isNaN(parsed) || parsed <= 0) {
      toast("Amount must be a positive number")
      return
    }
    setSaving(true)
    await onUpdate(tx.id, { type, amount: parsed, note: note || undefined, categoryId: categoryId || undefined })
    toast("Transaction updated")
    setSaving(false)
    setEditing(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await onDelete(tx.id)
    toast("Transaction deleted")
    setDeleting(false)
    onOpenChange(false)
  }

  const cat = tx.categoryId ? categories?.find((c) => c.id === tx.categoryId) : undefined
  const catColor = cat?.color
  const indicatorClass = !catColor ? (
    tx.type === "expense" ? "bg-destructive/10 text-destructive"
      : tx.type === "income" ? "bg-success/10 text-success"
      : "bg-muted text-muted-foreground"
  ) : ""
  const indicatorIcon = (() => {
    if (cat) {
      const iconName = cat.icon || ""
      if (iconName) {
        const Icon = (Phosphor as any)[iconName.charAt(0).toUpperCase() + iconName.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase())]
        if (Icon) return <Icon weight="duotone" className="h-5 w-5" />
      }
    }
    return tx.type === "expense" ? "↓" : tx.type === "income" ? "↑" : "↔"
  })()

  const loggedDate = new Date(tx.loggedAt)
  const formattedDate = loggedDate.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  const formattedTime = loggedDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setEditing(false); setConfirmDelete(false) } }}>
      <SheetContent side="bottom" aria-label="Transaction detail">
        <SheetHeader>
          <SheetTitle>{editing ? "Edit Transaction" : typeLabel}</SheetTitle>
          {!editing && <SheetDescription>View transaction details.</SheetDescription>}
        </SheetHeader>

        {editing ? (
          <div className="flex flex-col gap-4 p-4 pt-0">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Type</label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Amount (Rp)</label>
              <Input
                type="number"
                min="0"
                step="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Category</label>
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" label="None">None</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} label={cat.name}>
                      <span className="flex items-center gap-2">
                        {cat.color && <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: cat.color }} />}
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Note</label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What was this for?"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditing(false)} disabled={saving}>
                <XIcon /> Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                <CheckIcon /> {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        ) : confirmDelete ? (
          <div className="flex flex-col gap-4 p-4 pt-0">
            <p className="text-sm">
              Delete this <strong>{typeLabel.toLowerCase()}</strong> of <strong>Rp{tx.amount.toLocaleString("id-ID")}</strong>?
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={deleting}>
                <Trash2Icon /> {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-4 pt-0">
            <div className="flex flex-col items-center gap-2 py-4">
              <div
                className={cn("flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold", indicatorClass)}
                style={catColor ? { backgroundColor: `${catColor}20`, color: catColor } : undefined}
                aria-hidden="true"
              >
                {indicatorIcon}
              </div>
              <span className={cn("text-2xl font-bold tabular-nums", tx.type === "expense" && "text-destructive", tx.type === "income" && "text-success")}>
                {tx.type === "expense" ? "-" : "+"}Rp{tx.amount.toLocaleString("id-ID")}
              </span>
            </div>
            {tx.note && (
              <div className="text-center text-sm text-muted-foreground">{tx.note}</div>
            )}
            <div className="flex items-center justify-center gap-2">
              {tx.accountId && accounts?.find((a) => a.id === tx.accountId) && (
                <AccountBadge account={accounts.find((a) => a.id === tx.accountId)!} size="md" />
              )}
              {tx.categoryId && categories?.find((c) => c.id === tx.categoryId) && (
                <CategoryBadge category={categories.find((c) => c.id === tx.categoryId)!} size="md" />
              )}
            </div>
            <div className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground">
              <time dateTime={new Date(tx.loggedAt).toISOString()}>
                {formattedDate}
              </time>
              <span className="text-muted-foreground/60">{formattedTime}</span>
              {tx.createdBy && (
                <span className="text-muted-foreground/40">Created by {tx.creatorName || tx.createdBy}</span>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="destructive" className="flex-1" onClick={() => setConfirmDelete(true)}>
                <Trash2Icon /> Delete
              </Button>
              <Button variant="default" className="flex-1" onClick={startEdit}>
                <PencilIcon /> Edit
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
