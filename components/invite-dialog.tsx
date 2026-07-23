"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, RefreshCw, LogIn } from "lucide-react"
import { toast } from "sonner"

type InviteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  inviteCode: string
  currentSpaceName: string
  onRegenerate: () => Promise<string | undefined>
  onJoin: (code: string) => Promise<boolean>
}

export function InviteDialog({ open, onOpenChange, inviteCode, currentSpaceName, onRegenerate, onJoin }: InviteDialogProps) {
  const [tab, setTab] = useState<"share" | "join">("share")
  const [joinCode, setJoinCode] = useState("")
  const [regenerating, setRegenerating] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode)
    toast("Invite code copied")
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    await onRegenerate()
    setRegenerating(false)
    toast("New code generated")
  }

  const handleJoin = async () => {
    if (!joinCode.trim()) return
    const result = await onJoin(joinCode.trim().toUpperCase())
    if (result) {
      toast("Joined space!")
      onOpenChange(false)
    } else {
      toast("Invalid invite code")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Spaces</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 rounded-lg bg-secondary p-1">
          <button
            onClick={() => setTab("share")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "share" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Share
          </button>
          <button
            onClick={() => setTab("join")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "join" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Join
          </button>
        </div>

        {tab === "share" ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Share code for <strong>{currentSpaceName}</strong>:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-center text-lg font-bold tracking-widest">
                {inviteCode || "—"}
              </code>
              <Button size="icon" variant="outline" onClick={handleCopy} aria-label="Copy code">
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={handleRegenerate} disabled={regenerating} aria-label="Regenerate code">
                <RefreshCw className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">Enter invite code to join a shared space:</p>
            <div className="flex items-center gap-2">
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. HOME-8X92"
                className="flex-1 text-center font-bold tracking-widest uppercase"
                maxLength={8}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
              <Button size="icon" onClick={handleJoin} aria-label="Join space">
                <LogIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
