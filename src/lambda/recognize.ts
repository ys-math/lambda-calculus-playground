// Result recognition ("folding"): the opposite of macro expansion.
//
// After a term is reduced, it is often a raw lambda term like `λf x. f (f x)`.
// This module recognises when that term *is* a known definition (TWO) or a
// Church numeral, so the UI can label the result with a familiar name instead of
// leaving the learner to decode the lambda form by hand.

import type { Term } from './ast'
import { alphaEquiv } from './ast'
import { reduceMany } from './reduce'
import { expand } from './environment'
import type { Definition, Environment } from './environment'

export interface Recognition {
  // Names of definitions whose normal form is α-equivalent to the term.
  names: string[]
  // If the term is a Church numeral, its value; otherwise null.
  churchNumeral: number | null
}

// Detect a Church numeral: λf x. f (f (… (x))) with n applications of f.
// Returns n (≥ 0), independent of the bound-variable names, or null.
export function churchNumeral(t: Term): number | null {
  if (t.kind !== 'abs') return null
  const f = t.param
  const inner = t.body
  if (inner.kind !== 'abs') return null
  const x = inner.param
  if (f === x) return null // a real numeral binds two distinct variables

  let body = inner.body
  let n = 0
  while (body.kind === 'app') {
    if (body.func.kind !== 'var' || body.func.name !== f) return null
    n++
    body = body.arg
  }
  return body.kind === 'var' && body.name === x ? n : null
}

export interface Recognizer {
  recognize(term: Term): Recognition
}

interface NormalDef {
  name: string
  normal: Term
}

// Definitions are normalised with a small step budget; ones that don't reach a
// normal form (e.g. OMEGA, Y) can never match a finite result and are skipped.
// Real recognition targets (numerals, combinators, booleans) normalise in well
// under this many steps, so a tight cap keeps building the recognizer cheap.
const RECOGNIZE_MAX_STEPS = 100

// Precompute the β-normal form of each definition once, then match by
// α-equivalence. Definitions are expanded against `env` first so that macros
// referencing other macros (e.g. a user `SIX = MULT TWO THREE`) resolve.
export function buildRecognizer(defs: Definition[], env: Environment): Recognizer {
  const normalized: NormalDef[] = []
  for (const d of defs) {
    const expanded = expand(d.term, env)
    const r = reduceMany(expanded, 'normal', RECOGNIZE_MAX_STEPS)
    if (r.status === 'normal') {
      normalized.push({ name: d.name, normal: r.terms[r.terms.length - 1] })
    }
  }

  return {
    recognize(term: Term): Recognition {
      const names = normalized
        .filter((d) => alphaEquiv(d.normal, term))
        .map((d) => d.name)
      return { names, churchNumeral: churchNumeral(term) }
    },
  }
}
