"use client"

import { useState } from "react"
import { type SpaceWithRole } from "@/hooks/use-spaces"
import { InviteDialog } from "@/components/invite-dialog"
import { CreateSpaceDialog } from "@/components/create-space-dialog"
import { Home, User, Plus, ChevronDown, Users, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

type SpaceSelectorProps = {
  spaces: SpaceWithRole[]
  currentId: string
  onSwitch: (id: string) => void
  onCreateSpace: (name: string) => Promise<{ id: string; inviteCode: string }>
  onJoinSpace: (code: string) => Promise<import("@/lib/db").Space | null>
  onRegenerateCode: (id: string) => Promise<string | undefined>
}

export function SpaceSelector({
  spaces,
  currentId,
  onSwitch,
  onCreateSpace,
  onJoinSpace,
  onRegenerateCode,
}: SpaceSelectorProps) {
  const [open, setOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const current = spaces.find((s) => s.id === currentId)

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary"
        >
          {current?.name === "Personal" ? (
            <User className="h-4 w-4" />
          ) : (
            <Home className="h-4 w-4" />
          )}
          {current?.name || "Personal"}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg">
              {spaces.map((space) => (
                <button
                  key={space.id}
                  onClick={() => { onSwitch(space.id); setOpen(false) }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    space.id === currentId
                      ? "bg-accent-color/10 text-accent-color font-medium"
                      : "text-popover-foreground hover:bg-secondary"
                  )}
                >
                  {space.name === "Personal" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Home className="h-4 w-4" />
                  )}
                  <span className="flex-1">{space.name}</span>
                  {space.role === "owner" && (
                    <span className="text-[10px] text-muted-foreground">owner</span>
                  )}
                </button>
              ))}
              <div className="my-1 border-t border-border" />
              <button
                onClick={() => { setOpen(false); setCreateOpen(true) }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary"
              >
                <Plus className="h-4 w-4" /> New Space
              </button>
              {current && (
                <button
                  onClick={() => { setOpen(false); setInviteOpen(true) }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary"
                >
                  <Users className="h-4 w-4" /> Invite / Join
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        inviteCode={current?.inviteCode ?? ""}
        currentSpaceName={current?.name ?? ""}
        onRegenerate={() => onRegenerateCode(currentId)}
        onJoin={async (code) => {
          const result = await onJoinSpace(code)
          return !!result
        }}
      />

      <CreateSpaceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={async (name) => { await onCreateSpace(name) }}
      />
    </>
  )
}
