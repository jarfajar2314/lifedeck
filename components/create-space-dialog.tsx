"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type CreateSpaceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string) => Promise<void>
}

export function CreateSpaceDialog({ open, onOpenChange, onCreate }: CreateSpaceDialogProps) {
  const [name, setName] = useState("")
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true)
    await onCreate(name.trim())
    setCreating(false)
    setName("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New Space</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Home & Family"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <Button onClick={handleCreate} disabled={!name.trim() || creating}>
            {creating ? "Creating..." : "Create Space"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
