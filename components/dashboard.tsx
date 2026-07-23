"use client"

import { useState } from "react"
import { SpaceSelector } from "@/components/space-selector"
import { TransactionList } from "@/components/transaction-list"
import { TaskList } from "@/components/task-list"
import { NoteList } from "@/components/note-list"
import { CommandBar } from "@/components/command-bar"
import { ExpenseKeypad } from "@/components/expense-keypad"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { useTransactions, useTasks, useNotes } from "@/hooks/use-db"
import { LogOut, Wallet, ListChecks, StickyNote, Plus } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { toast } from "sonner"

export function Dashboard() {
  const { user, signOut } = useAuth()
  const { mode, accent, setMode, setAccent } = useTheme()
  const [spaceId, setSpaceId] = useState("personal")
  const [keypadOpen, setKeypadOpen] = useState(false)

  const { add: addTransaction } = useTransactions(spaceId)
  const { add: addTask } = useTasks(spaceId)
  const { add: addNote } = useNotes(spaceId)

  const handleExpense = (amount: number, note?: string) => {
    addTransaction({
      spaceId,
      amount,
      type: "expense",
      note,
      loggedAt: new Date(),
      createdBy: user?.id,
    })
    toast(`${note || "Expense"}: -Rp${amount.toLocaleString("id-ID")}`)
  }

  const handleTask = (title: string) => {
    addTask({ spaceId, title, isCompleted: false, priority: "medium" })
    toast("Task added")
  }

  const handleNote = (content: string) => {
    addNote({ spaceId, content, tags: [], isPinned: false })
    toast("Note saved")
  }

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight">LifeDeck</h1>
            <SpaceSelector currentId={spaceId} onSwitch={setSpaceId} />
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
            <TransactionList spaceId={spaceId} limit={5} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="h-4 w-4" /> Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList spaceId={spaceId} limit={8} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <StickyNote className="h-4 w-4" /> Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NoteList spaceId={spaceId} limit={5} />
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
          <ExpenseKeypad
            onAmount={(amount) => {
              addTransaction({
                spaceId,
                amount,
                type: "expense",
                loggedAt: new Date(),
                createdBy: user?.id,
              })
              toast(`Expense: -Rp${amount.toLocaleString("id-ID")}`)
              setKeypadOpen(false)
            }}
            onClose={() => setKeypadOpen(false)}
          />
        </DrawerContent>
      </Drawer>
    </div>
  )
}
