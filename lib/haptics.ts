// Thin wrapper around the Web Vibration API. No-ops where unsupported (iOS Safari).
export function vibrate(pattern: number | number[]): void {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return
  try {
    navigator.vibrate(pattern)
  } catch {}
}

export const haptics = {
  tap: () => vibrate(8),
  success: () => vibrate([10, 40, 10]),
  delete: () => vibrate(15),
}
