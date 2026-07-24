"use client"

import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { Dashboard } from "@/components/dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function Home() {
  const { user, isPending } = useAuth()

  if (isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle className="text-2xl">
              <Image src="/icon-32.png" alt="LifeDeck" width={32} height={32} className="mx-auto" priority />
            </CardTitle>
            <CardDescription>Personal & Household Command Center</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/sign-in" className="inline-flex w-full items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-9 px-4 hover:bg-primary/80">Sign In</Link>
            <Link href="/sign-up" className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-background text-sm font-medium h-9 px-4 hover:bg-muted">Create Account</Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <Dashboard />
}
