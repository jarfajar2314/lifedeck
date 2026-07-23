export type ParsedCommand =
  | { type: "expense"; amount: number; note?: string; account?: string }
  | { type: "task"; title: string; dueDate?: string }
  | { type: "note"; content: string }

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

  const amountMatch = trimmed.match(/^(\d[\d.,kKmMbB]*)\s*(.+)?$/)
  if (amountMatch) {
    const raw = amountMatch[1]
    const multiplier = raw.toLowerCase().endsWith("k") ? 1000
      : raw.toLowerCase().endsWith("m") ? 1000000
      : raw.toLowerCase().endsWith("b") ? 1000000000
      : 1
    const numStr = raw.replace(/[kmb]/i, "")
    const amount = parseFloat(numStr.replace(/,/g, "")) * multiplier
    const rest = amountMatch[2]?.trim()
    const note = rest?.replace(/@(\w+)/g, "").trim()
    const account = rest?.match(/@(\w+)/)?.[1]
    return { type: "expense", amount, note, account }
  }

  if (trimmed.length > 3) {
    return { type: "note", content: trimmed }
  }

  return null
}
