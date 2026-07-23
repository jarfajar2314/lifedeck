"use client"

import { useCallback, useState } from "react"
import { SpaceSelector } from "@/components/space-selector"
import { TransactionList } from "@/components/transaction-list"
import { TaskList } from "@/components/task-list"
import { NoteList } from "@/components/note-list"
import { CommandBar } from "@/components/command-bar"
import { ExpenseKeypad } from "@/components/expense-keypad"
import { UserMenu } from "@/components/user-menu"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { useTransactions, useTasks, useNotes, useAccounts } from "@/hooks/use-db"
import { useSpaces } from "@/hooks/use-spaces"
import { useRealtime } from "@/hooks/use-realtime"
import { haptics } from "@/lib/haptics"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Wallet, ListChecks, StickyNote, Plus } from "lucide-react"
import { toast } from "sonner"

export function Dashboard() {
  const { user } = useAuth()
  const { spaces, currentId, setCurrentId, createSpace, joinSpace, regenerateInviteCode } = useSpaces(user?.id)
  const [keypadOpen, setKeypadOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useRealtime()

  const accounts = useAccounts(currentId)
  const { add: addTransaction } = useTransactions(currentId)
  const { add: addTask } = useTasks(currentId)
  const { add: addNote } = useNotes(currentId)

  const resolveAccountId = useCallback(async (accountName: string): Promise<string | undefined> => {
    return accounts.find((a) => a.name === accountName)?.id
  }, [accounts])

  const handleExpense = useCallback(async (amount: number, note?: string, account?: string) => {
    const accountId = account ? await resolveAccountId(account) : undefined
    addTransaction({ spaceId: currentId, amount, type: "expense", note, accountId, loggedAt: new Date(), createdBy: user?.id })
    haptics.success()
    toast(`Expense: -Rp${amount.toLocaleString("id-ID")}`)
  }, [currentId, user?.id, addTransaction, resolveAccountId])

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

  const handleKeypadExpense = useCallback((amount: number, accountId?: string) => {
    addTransaction({ spaceId: currentId, amount, type: "expense", accountId, loggedAt: new Date(), createdBy: user?.id })
    toast(`Expense: -Rp${amount.toLocaleString("id-ID")}`)
    setKeypadOpen(false)
  }, [currentId, user?.id, addTransaction])

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

      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight">LifeDeck</h1>
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
              className="flex items-center justify-center rounded-full bg-accent-color/10 hover:bg-accent-color/20 transition-colors"
              aria-label="Open settings"
              title="Settings"
              style={{ width: 44, height: 44 }}
            >
              <Avatar size="sm">
                <AvatarFallback className="bg-transparent text-accent-color font-bold text-sm">
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
              <button
                onClick={() => setKeypadOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-color/10 text-accent-color hover:bg-accent-color/20"
                aria-label="Add expense"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </CardHeader>
            <CardContent>
              <TransactionList spaceId={currentId} limit={5} />
            </CardContent>
          </Card>
        </section>

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
        onExpense={(amount, note, account) => handleExpense(amount, note, account)}
        onTask={(title) => handleTask(title)}
        onNote={(content) => handleNote(content)}
      />

      <Drawer open={keypadOpen} onOpenChange={setKeypadOpen}>
        <DrawerContent aria-label="Expense keypad">
          <ExpenseKeypad onAmount={handleKeypadExpense} onClose={() => setKeypadOpen(false)} accounts={accounts} />
        </DrawerContent>
      </Drawer>

      <UserMenu open={userMenuOpen} onOpenChange={setUserMenuOpen} currentSpaceId={currentId} />
    </div>
  )
}
