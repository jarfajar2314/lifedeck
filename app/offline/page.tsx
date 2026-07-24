import Image from "next/image"

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4 text-center">
      <Image
        src="/icon-108.png"
        alt="LifeDeck"
        width={108}
        height={108}
        className="rounded-2xl opacity-80"
        priority
      />
      <h1 className="text-xl font-bold">You&apos;re Offline</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        LifeDeck is in offline mode. Any changes you make will sync automatically when you&apos;re back online.
      </p>
    </div>
  )
}
