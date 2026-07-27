"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useProfile } from "@/hooks/use-db"
import { OfflineIndicator } from "@/components/offline-indicator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, User, Lock, Camera, LogOut, Check, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { updateProfile } from "@/hooks/use-db"

export default function UserSettingsPage() {
  const router = useRouter()
  const { user, isPending, signOut } = useAuth()
  const profile = useProfile(user?.id)

  const [displayName, setDisplayName] = useState(user?.name ?? "")
  const [savingName, setSavingName] = useState(false)
  const [nameDirty, setNameDirty] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

  if (isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <p className="text-muted-foreground">Sign in to manage your settings.</p>
      </div>
    )
  }

  const currentUserId = user.id

  async function handleSaveName() {
    if (!displayName.trim()) return
    setSavingName(true)
    await updateProfile(currentUserId, { displayName: displayName.trim() })
    setSavingName(false)
    setNameDirty(false)
    toast("Display name updated")
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    setChangingPassword(true)
    const { error } = await authClient.changePassword({ currentPassword, newPassword })
    setChangingPassword(false)
    if (error) {
      toast.error(error.message || "Failed to change password")
      return
    }
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    toast("Password changed successfully")
  }

  async function handleSignOut() {
    await signOut()
  }

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <OfflineIndicator />

      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-secondary/50"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <img src="/lifedeck.svg" alt="LifeDeck" width={24} height={24} className="shrink-0 text-foreground" />
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" aria-hidden="true" /> User Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <section aria-label="Profile" className="flex flex-col items-center gap-3 py-4">
              <Avatar size="lg">
                <AvatarFallback className="bg-accent-color/10 text-accent-color text-2xl font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </section>

            <Separator />

            <section aria-label="Display name">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Display Name</p>
              <div className="flex items-center gap-2">
                <Input
                  value={displayName}
                  onChange={(e) => { setDisplayName(e.target.value); setNameDirty(true) }}
                  className="h-9 text-sm flex-1"
                  placeholder="Your display name"
                />
                {nameDirty && (
                  <>
                    <button onClick={handleSaveName} disabled={savingName} className="flex h-8 w-8 items-center justify-center rounded-lg text-success hover:bg-secondary">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { setDisplayName(user?.name || ""); setNameDirty(false) }} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </section>

            <Separator />

            <section aria-label="Profile picture">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Profile Picture</p>
              <div className="flex items-center gap-3 rounded-xl bg-secondary/50 px-4 py-3">
                <Camera className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground flex-1">Profile picture coming soon</span>
              </div>
            </section>

            <Separator />

            <section aria-label="Change password">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Change Password</p>
              </div>
              <div className="flex flex-col gap-3">
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="h-9 text-sm"
                />
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="h-9 text-sm"
                />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="h-9 text-sm"
                />
                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                  size="sm"
                  className="self-start"
                >
                  {changingPassword ? "Changing..." : "Change Password"}
                </Button>
              </div>
            </section>

            <Separator />

            <section aria-label="Sign out">
              <Button variant="destructive" className="w-full" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
