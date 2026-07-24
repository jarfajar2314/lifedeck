export function matchCategory(note: string | undefined, keywordMap: Map<string, string>): string | undefined {
  if (!note) return undefined
  const lower = note.toLowerCase()
  for (const [keyword, categoryId] of keywordMap) {
    if (lower.includes(keyword)) return categoryId
  }
  return undefined
}
