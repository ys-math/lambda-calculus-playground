// Unification for simple types — the heart of type inference.
//
// `unify(a, b)` finds the most general substitution that makes `a` and `b`
// equal, or fails. The *occurs check* (a variable cannot be bound to a type
// containing itself) is what rejects self-application like `\x. x x`: it would
// require a = a → b, which has no finite solution.

import type { Subst, Type } from './types'
import { applySubst, freeTypeVars, tArrow } from './types'

export type UnifyResult =
  | { ok: true; subst: Subst }
  | { ok: false; error: string }

// Extend `subst` so that `a` and `b` become equal under it.
export function unify(a: Type, b: Type, subst: Subst = new Map()): UnifyResult {
  const ta = applySubst(a, subst)
  const tb = applySubst(b, subst)

  if (ta.kind === 'tvar' && tb.kind === 'tvar' && ta.id === tb.id) {
    return { ok: true, subst }
  }
  if (ta.kind === 'tvar') return bindVar(ta.id, tb, subst)
  if (tb.kind === 'tvar') return bindVar(tb.id, ta, subst)

  // Both are arrows: unify components.
  const left = unify(ta.from, tb.from, subst)
  if (!left.ok) return left
  return unify(ta.to, tb.to, left.subst)
}

function bindVar(id: number, type: Type, subst: Subst): UnifyResult {
  // Binding a variable to itself is a no-op.
  if (type.kind === 'tvar' && type.id === id) return { ok: true, subst }
  // Occurs check: the variable must not appear inside the type.
  if (freeTypeVars(type).has(id)) {
    return { ok: false, error: 'occurs check failed — the type would be infinite' }
  }
  const next: Subst = new Map(subst)
  next.set(id, type)
  return { ok: true, subst: next }
}

// Helper for building arrow types during inference (re-exported for callers).
export { tArrow }
