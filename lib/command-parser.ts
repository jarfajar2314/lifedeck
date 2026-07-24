export type ParsedCommand =
  | { type: "expense"; amount: number; note?: string; account?: string }
  | { type: "income"; amount: number; note?: string; account?: string }
  | { type: "transfer"; amount: number; fromAccount: string; toAccount: string; note?: string }
  | { type: "task"; title: string; dueDate?: string }
  | { type: "note"; content: string }

function parseAmount(raw: string): number {
  const multiplier = raw.toLowerCase().endsWith("k") ? 1000
    : raw.toLowerCase().endsWith("m") ? 1000000
    : raw.toLowerCase().endsWith("b") ? 1000000000
    : 1
  const numStr = raw.replace(/[kmb]/i, "")
  return parseFloat(numStr.replace(/,/g, "")) * multiplier
}

function extractAccount(rest: string): { note?: string; account?: string } {
  const note = rest.replace(/@(\w+)/g, "").trim()
  const account = rest.match(/@(\w+)/)?.[1]
  return { note: note || undefined, account }
}

export function parseCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const todoMatch = trimmed.match(/^(todo|task)\s+(.+)/i)
  if (todoMatch) {
    const title = todoMatch[2]
    const dueMatch = title.match(/\s+(tomorrow|today|next\s+\w+)$/i)
    const dueDate = dueMatch ? dueMatch[1] : undefined
    return { type: "task", title: dueMatch ? title.slice(0, -dueMatch[0].length).trim() : title, dueDate }
  }

  const noteMatch = trimmed.match(/^note\s+(.+)/i)
  if (noteMatch) {
    return { type: "note", content: noteMatch[1] }
  }

  const transferMatch = trimmed.match(/^transfer\s+(\d[\d.,kKmMbB]*)\s+@(\w+)\s+@(\w+)\s*(.*)?$/i)
  if (transferMatch) {
    const amount = parseAmount(transferMatch[1])
    const note = transferMatch[4]?.trim() || undefined
    return { type: "transfer", amount, fromAccount: transferMatch[2], toAccount: transferMatch[3], note }
  }

  const incomeMatch = trimmed.match(/^\+(\d[\d.,kKmMbB]*)\s*(.*)?$/)
  if (incomeMatch) {
    const amount = parseAmount(incomeMatch[1])
    const rest = incomeMatch[2]?.trim()
    if (rest) {
      const { note, account } = extractAccount(rest)
      return { type: "income", amount, note, account }
    }
    return { type: "income", amount }
  }

  const amountMatch = trimmed.match(/^(\d[\d.,kKmMbB]*)\s*(.+)?$/)
  if (amountMatch) {
    const amount = parseAmount(amountMatch[1])
    const rest = amountMatch[2]?.trim()
    if (rest) {
      const { note, account } = extractAccount(rest)
      return { type: "expense", amount, note, account }
    }
    return { type: "expense", amount }
  }

  if (trimmed.length > 3) {
    return { type: "note", content: trimmed }
  }

  return null
}
