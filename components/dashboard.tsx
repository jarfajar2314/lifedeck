"use client"

import { useCallback } from "react"
import { SpaceSelector } from "@/components/space-selector"
import { TransactionList } from "@/components/transaction-list"
import { TaskList } from "@/components/task-list"
import { NoteList } from "@/components/note-list"
import { CommandBar } from "@/components/command-bar"
import { ExpenseKeypad } from "@/components/expense-keypad"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { useTransactions, useTasks, useNotes } from "@/hooks/use-db"
import { useSpaces } from "@/hooks/use-spaces"
import { LogOut, Wallet, ListChecks, StickyNote, Plus } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { toast } from "sonner"
import { useState } from "react"

export function Dashboard() {
  const { user, signOut } = useAuth()
  const { mode, accent, setMode, setAccent } = useTheme()
  const { spaces, currentId, setCurrentId, createSpace, joinSpace, regenerateInviteCode } = useSpaces(user?.id)
  const [keypadOpen, setKeypadOpen] = useState(false)

  const { add: addTransaction } = useTransactions(currentId)
  const { add: addTask } = useTasks(currentId)
  const { add: addNote } = useNotes(currentId)

  const handleExpense = useCallback((amount: number, note?: string) => {
    addTransaction({ spaceId: currentId, amount, type: "expense", note, loggedAt: new Date(), createdBy: user?.id })
    toast(`Expense: -Rp${amount.toLocaleString("id-ID")}`)
  }, [currentId, user?.id, addTransaction])

  const handleTask = useCallback((title: string) => {
    addTask({ spaceId: currentId, title, isCompleted: false, priority: "medium" })
    toast("Task added")
  }, [currentId, addTask])

  const handleNote = useCallback((content: string) => {
    addNote({ spaceId: currentId, content, tags: [], isPinned: false })
    toast("Note saved")
  }, [currentId, addNote])

  const handleKeypadExpense = useCallback((amount: number) => {
    addTransaction({ spaceId: currentId, amount, type: "expense", loggedAt: new Date(), createdBy: user?.id })
    toast(`Expense: -Rp${amount.toLocaleString("id-ID")}`)
    setKeypadOpen(false)
  }, [currentId, user?.id, addTransaction])

  return (
    <div className="flex min-h-dvh flex-col pb-24">
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
              onClick={() => setMode(mode === "dark" ? "light" : mode === "light" ? "oled" : "dark")}
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs text-muted-foreground hover:bg-secondary"
              aria-label="Toggle theme"
            >
              {mode === "oled" ? "◆" : mode === "dark" ? "◐" : "☀"}
            </button>
            <button
              onClick={() => setAccent(accent === "emerald" ? "violet" : accent === "violet" ? "cyan" : "emerald")}
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs text-muted-foreground hover:bg-secondary"
              aria-label="Switch accent"
              style={{ color: `var(--accent-color)` }}
            >
              ●
            </button>
            {user && (
              <button onClick={signOut} className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-destructive" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4" /> Money
            </CardTitle>
            <button
              onClick={() => setKeypadOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-color/10 text-accent-color hover:bg-accent-color/20"
              aria-label="Add expense"
            >
              <Plus className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent>
            <TransactionList spaceId={currentId} limit={5} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="h-4 w-4" /> Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList spaceId={currentId} limit={8} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <StickyNote className="h-4 w-4" /> Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NoteList spaceId={currentId} limit={5} />
          </CardContent>
        </Card>
      </main>

      <CommandBar
        onExpense={(amount, note) => handleExpense(amount, note)}
        onTask={(title) => handleTask(title)}
        onNote={(content) => handleNote(content)}
      />

      <Drawer open={keypadOpen} onOpenChange={setKeypadOpen}>
        <DrawerContent>
          <ExpenseKeypad onAmount={handleKeypadExpense} onClose={() => setKeypadOpen(false)} />
        </DrawerContent>
      </Drawer>
    </div>
  )
}
