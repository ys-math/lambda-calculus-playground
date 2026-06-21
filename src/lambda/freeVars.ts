import type { Term } from './ast'

// Compute the set of free variables of a term — variables that are not bound by
// any enclosing lambda. Used by capture-avoiding substitution to decide when an
// alpha-rename is required.
export function freeVars(term: Term): Set<string> {
  const out = new Set<string>()
  const go = (t: Term, bound: Set<string>): void => {
    switch (t.kind) {
      case 'var':
        if (!bound.has(t.name)) out.add(t.name)
        return
      case 'abs': {
        const inner = new Set(bound)
        inner.add(t.param)
        go(t.body, inner)
        return
      }
      case 'app':
        go(t.func, bound)
        go(t.arg, bound)
        return
    }
  }
  go(term, new Set())
  return out
}

// Generate a variable name not present in `avoid`. Tries `base`, then `base'`,
// `base''`, ... so renames stay readable (x → x' → x'').
export function freshName(base: string, avoid: Set<string>): string {
  let candidate = base
  while (avoid.has(candidate)) {
    candidate += "'"
  }
  return candidate
}
