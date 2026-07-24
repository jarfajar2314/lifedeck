"use client"

import { useCallback, useState, useMemo } from "react"
import Link from "next/link"
import { SpaceSelector } from "@/components/space-selector"
import { TransactionList } from "@/components/transaction-list"
import { TaskList } from "@/components/task-list"
import { NoteList } from "@/components/note-list"
import { CommandBar } from "@/components/command-bar"
import { ExpenseKeypad } from "@/components/expense-keypad"
import { UserMenu } from "@/components/user-menu"
import { AccountDetail } from "@/components/account-detail"
import { OfflineIndicator } from "@/components/offline-indicator"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { useTransactions, useTasks, useNotes, useAccounts, useCategories, useCategoryKeywords } from "@/hooks/use-db"
import { useSpaces } from "@/hooks/use-spaces"
import { useRealtime } from "@/hooks/use-realtime"
import { haptics } from "@/lib/haptics"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Wallet, CreditCard, ListChecks, StickyNote, Plus, ArrowUpRight, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { uid } from "@/lib/uid"
import * as store from "@/lib/data-store"
import { matchCategory } from "@/lib/categories"
import type { Account } from "@/lib/db"

export function Dashboard() {
  const { user } = useAuth()
  const { spaces, currentId, setCurrentId, createSpace, joinSpace, regenerateInviteCode, members } = useSpaces(user?.id)
  const [keypadOpen, setKeypadOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)

  useRealtime()

  const { items: accounts, loading: accountsLoading } = useAccounts(currentId)
  const categories = useCategories(currentId)
  const categoryKeywords = useCategoryKeywords(currentId)
  const keywordMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const kw of categoryKeywords) m.set(kw.keyword.toLowerCase(), kw.categoryId)
    return m
  }, [categoryKeywords])
  const { add: addTransaction } = useTransactions(currentId)
  const { add: addTask } = useTasks(currentId)
  const { add: addNote } = useNotes(currentId)

  const resolveAccount = useCallback((name: string) => {
    return accounts.find((a) => a.name.toLowerCase() === name.toLowerCase())
  }, [accounts])

  const resolveCategory = useCallback((name: string) => {
    return categories.find((c) => c.name.toLowerCase() === name.toLowerCase())
  }, [categories])

  const handleExpense = useCallback(async (amount: number, note?: string, account?: string, category?: string) => {
    const currentMember = members.find((m) => m.spaceId === currentId && m.userId === user?.id)
    const categoryId = category ? resolveCategory(category)?.id : (note ? matchCategory(note, keywordMap) : undefined)
    if (account) {
      const match = resolveAccount(account)
      if (match) {
        addTransaction({ spaceId: currentId, amount, type: "expense", note, categoryId, accountId: match.id, loggedAt: new Date(), createdBy: user?.id })
        haptics.success()
        toast(`Expense: -Rp${amount.toLocaleString("id-ID")} @${match.name}`)
        return
      }
      toast(`Account "${account}" not found`, {
        action: {
          label: "Create & Retry",
          onClick: async () => {
            const newId = uid()
            await store.persist("accounts", "add", { id: newId, spaceId: currentId, name: account, createdAt: new Date().toISOString() })
            store.invalidate(["accounts"])
            addTransaction({ spaceId: currentId, amount, type: "expense", note, categoryId, accountId: newId, loggedAt: new Date(), createdBy: user?.id })
            haptics.success()
            toast(`Expense: -Rp${amount.toLocaleString("id-ID")} @${account}`)
          },
        },
      })
      return
    }
    const targetId = currentMember?.defaultAccountId
    if (targetId) {
      addTransaction({ spaceId: currentId, amount, type: "expense", note, categoryId, accountId: targetId, loggedAt: new Date(), createdBy: user?.id })
    } else {
      addTransaction({ spaceId: currentId, amount, type: "expense", note, categoryId, loggedAt: new Date(), createdBy: user?.id })
    }
    haptics.success()
    toast(`Expense: -Rp${amount.toLocaleString("id-ID")}${targetId ? ` @${accounts.find(a => a.id === targetId)?.name ?? ""}` : ""}`)
  }, [currentId, user?.id, resolveAccount, resolveCategory, addTransaction, members, accounts, keywordMap])

  const handleIncome = useCallback(async (amount: number, note?: string, account?: string, category?: string) => {
    const currentMember = members.find((m) => m.spaceId === currentId && m.userId === user?.id)
    const categoryId = category ? resolveCategory(category)?.id : (note ? matchCategory(note, keywordMap) : undefined)
    if (account) {
      const match = resolveAccount(account)
      if (match) {
        addTransaction({ spaceId: currentId, amount, type: "income", note, categoryId, accountId: match.id, loggedAt: new Date(), createdBy: user?.id })
        haptics.success()
        toast(`Income: +Rp${amount.toLocaleString("id-ID")} @${match.name}`)
        return
      }
      toast(`Account "${account}" not found`, {
        action: {
          label: "Create & Retry",
          onClick: async () => {
            const newId = uid()
            await store.persist("accounts", "add", { id: newId, spaceId: currentId, name: account, createdAt: new Date().toISOString() })
            store.invalidate(["accounts"])
            addTransaction({ spaceId: currentId, amount, type: "income", note, categoryId, accountId: newId, loggedAt: new Date(), createdBy: user?.id })
            haptics.success()
            toast(`Income: +Rp${amount.toLocaleString("id-ID")} @${account}`)
          },
        },
      })
      return
    }
    const targetId = currentMember?.defaultAccountId
    if (targetId) {
      addTransaction({ spaceId: currentId, amount, type: "income", note, categoryId, accountId: targetId, loggedAt: new Date(), createdBy: user?.id })
    } else {
      addTransaction({ spaceId: currentId, amount, type: "income", note, categoryId, loggedAt: new Date(), createdBy: user?.id })
    }
    haptics.success()
    toast(`Income: +Rp${amount.toLocaleString("id-ID")}${targetId ? ` @${accounts.find(a => a.id === targetId)?.name ?? ""}` : ""}`)
  }, [currentId, user?.id, resolveAccount, resolveCategory, addTransaction, members, accounts, keywordMap])

  const handleTransfer = useCallback(async (amount: number, fromAccount: string, toAccount: string, note?: string) => {
    const from = resolveAccount(fromAccount)
    const to = resolveAccount(toAccount)
    if (!from) {
      toast(`Source account "${fromAccount}" not found`)
      return
    }
    if (!to) {
      toast(`Target account "${toAccount}" not found`)
      return
    }
    const now = new Date()
    await addTransaction({ spaceId: currentId, amount, type: "transfer", accountId: from.id, note: note || `Transfer to ${to.name}`, loggedAt: now, createdBy: user?.id })
    await addTransaction({ spaceId: currentId, amount, type: "income", accountId: to.id, note: note || `Transfer from ${from.name}`, loggedAt: now, createdBy: user?.id })
    haptics.success()
    toast(`Transfer: Rp${amount.toLocaleString("id-ID")} @${from.name} → @${to.name}`)
  }, [currentId, user?.id, resolveAccount, addTransaction])

  const handleTask = useCallback((title: string) => {
    addTask({ spaceId: currentId, title, isCompleted: false, priority: "medium" })
    haptics.success()
    toast("Task added")
  }, [currentId, addTask])

  const handleNote = useCallback((content: string) => {
    addNote({ spaceId: currentId, content, tags: [], isPinned: false })
    haptics.success()
    toast("Note saved")
  }, [currentId, addNote])

  const handleKeypadExpense = useCallback((amount: number, accountId?: string, categoryId?: string, note?: string, txType?: "expense" | "income") => {
    const resolvedCategoryId = categoryId || (note ? matchCategory(note, keywordMap) : undefined)
    const t = txType || "expense"
    addTransaction({ spaceId: currentId, amount, type: t, accountId, categoryId: resolvedCategoryId, note, loggedAt: new Date(), createdBy: user?.id })
    toast(`${t === "expense" ? "Expense" : "Income"}: ${t === "expense" ? "-" : "+"}Rp${amount.toLocaleString("id-ID")}`)
    setKeypadOpen(false)
  }, [currentId, user?.id, addTransaction, keywordMap])

  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status">
        <p className="text-muted-foreground animate-pulse">Signing out...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:shadow-lg">
        Skip to main content
      </a>

      <OfflineIndicator />

      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="/lifedeck.svg" alt="LifeDeck" width={24} height={24} className="shrink-0 text-foreground" />
            <SpaceSelector
              spaces={spaces}
              currentId={currentId}
              onSwitch={setCurrentId}
              onCreateSpace={createSpace}
              onJoinSpace={joinSpace}
              onRegenerateCode={regenerateInviteCode}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUserMenuOpen(true)}
              className="flex items-center justify-center rounded-full transition-colors hover:bg-secondary/50"
              aria-label="Open settings"
              title="Settings"
              style={{ width: 44, height: 44 }}
            >
              <Avatar size="sm">
                <AvatarFallback className="text-foreground font-bold text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-4">
        <section aria-labelledby="money-heading">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle id="money-heading" className="flex items-center gap-2 text-base">
                <Wallet className="h-4 w-4" aria-hidden="true" /> Money
              </CardTitle>
              <div className="flex items-center gap-1">
                <Link
                  href="/transactions"
                  className="flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/50"
                >
                  See All <ArrowUpRight className="h-3 w-3" />
                </Link>
                <button
                  onClick={() => setKeypadOpen(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-color/10 text-accent-color hover:bg-accent-color/20"
                  aria-label="Add expense"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <TransactionList spaceId={currentId} limit={5} accounts={accounts} categories={categories} />
            </CardContent>
          </Card>
        </section>

        {accounts.length > 0 || accountsLoading ? (
          <section aria-labelledby="accounts-heading">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle id="accounts-heading" className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4" aria-hidden="true" /> Accounts
                </CardTitle>
                <Link
                  href="/settings/space/accounts"
                  className="flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/50"
                >
                  See All <ExternalLink className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent>
                {accountsLoading ? (
                  <div className="flex flex-col gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2.5">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                ) : (
                <div className="flex flex-col gap-1">
                  {accounts.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAccount(a)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary/50 active:scale-[0.98]"
                    >
                      <span className="text-sm font-medium">{a.name}</span>
                      <span className="text-sm tabular-nums text-muted-foreground">{formatBalance(a.balance)}</span>
                    </button>
                  ))}
                </div>
                )}
              </CardContent>
            </Card>
          </section>
        ) : null}

        <section aria-labelledby="tasks-heading">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle id="tasks-heading" className="flex items-center gap-2 text-base">
                <ListChecks className="h-4 w-4" aria-hidden="true" /> Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaskList spaceId={currentId} limit={8} />
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="notes-heading">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle id="notes-heading" className="flex items-center gap-2 text-base">
                <StickyNote className="h-4 w-4" aria-hidden="true" /> Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NoteList spaceId={currentId} limit={5} />
            </CardContent>
          </Card>
        </section>
      </main>

      <CommandBar
        onExpense={(amount, note, account, category) => handleExpense(amount, note, account, category)}
        onIncome={(amount, note, account, category) => handleIncome(amount, note, account, category)}
        onTransfer={(amount, fromAccount, toAccount, note) => handleTransfer(amount, fromAccount, toAccount, note)}
        onTask={(title) => handleTask(title)}
        onNote={(content) => handleNote(content)}
        accounts={accounts}
        spaceId={currentId}
      />

      <Drawer open={keypadOpen} onOpenChange={setKeypadOpen}>
        <DrawerContent aria-label="Expense keypad">
          <ExpenseKeypad onAmount={handleKeypadExpense} onClose={() => setKeypadOpen(false)} accounts={accounts} categories={categories} keywordMap={keywordMap} />
        </DrawerContent>
      </Drawer>

      <AccountDetail
        account={selectedAccount}
        open={selectedAccount !== null}
        onOpenChange={(v) => { if (!v) setSelectedAccount(null) }}
        accounts={accounts}
        spaceId={currentId}
      />

      <UserMenu open={userMenuOpen} onOpenChange={setUserMenuOpen} currentSpaceId={currentId} />
    </div>
  )
}

function formatBalance(balance: number): string {
  const abs = Math.abs(balance)
  const formatted = "Rp" + abs.toLocaleString("id-ID")
  return balance < 0 ? `-${formatted}` : formatted
}
