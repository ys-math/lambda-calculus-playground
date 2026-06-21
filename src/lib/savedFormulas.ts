// Pure helpers for the user's saved-formula list. Kept free of React/DOM so the
// dedupe/ordering rules can be unit-tested in isolation.
//
// A saved list is an array of expression strings, most-recent first. Saving an
// expression that already exists moves it to the front rather than duplicating.

const MAX_SAVED = 100

// Add (or re-surface) a formula at the front of the list. Empty/whitespace-only
// input is ignored. Comparison is on the trimmed string.
export function addFormula(list: string[], expr: string): string[] {
  const trimmed = expr.trim()
  if (trimmed === '') return list
  const without = list.filter((e) => e !== trimmed)
  return [trimmed, ...without].slice(0, MAX_SAVED)
}

// Remove a formula (exact match) from the list.
export function removeFormula(list: string[], expr: string): string[] {
  return list.filter((e) => e !== expr)
}

// Whether the (trimmed) expression is already saved.
export function isSaved(list: string[], expr: string): boolean {
  return list.includes(expr.trim())
}
