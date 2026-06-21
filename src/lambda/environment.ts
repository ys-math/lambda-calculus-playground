// Named definitions ("macros"). Learners can bind names like TRUE, SUCC or Y to
// terms and reuse them. Before reduction we expand those names into their
// definitions.
//
// A name is treated as a macro only when it is a *free* variable of the term and
// is present in the environment — so a locally bound `x` never gets expanded.

import type { Term } from './ast'
import { mkAbs, mkApp, mkVar } from './ast'
import { parse } from './parser'

export type Environment = Map<string, Term>

export interface Definition {
  name: string
  source: string // the original text the user typed, for display/editing
  term: Term
}

// Expand every free occurrence of a defined name into its term. Repeats until no
// further expansion happens (so definitions may reference other definitions),
// with a guard against cyclic definitions.
export function expand(term: Term, env: Environment, maxRounds = 100): Term {
  let current = term
  for (let round = 0; round < maxRounds; round++) {
    const { result, changed } = expandOnce(current, env, new Set())
    if (!changed) return result
    current = result
  }
  return current
}

function expandOnce(
  term: Term,
  env: Environment,
  bound: Set<string>,
): { result: Term; changed: boolean } {
  switch (term.kind) {
    case 'var': {
      if (!bound.has(term.name) && env.has(term.name)) {
        return { result: env.get(term.name)!, changed: true }
      }
      return { result: term, changed: false }
    }
    case 'abs': {
      const inner = new Set(bound)
      inner.add(term.param)
      const { result, changed } = expandOnce(term.body, env, inner)
      return { result: changed ? mkAbs(term.param, result) : term, changed }
    }
    case 'app': {
      const f = expandOnce(term.func, env, bound)
      const a = expandOnce(term.arg, env, bound)
      const changed = f.changed || a.changed
      return {
        result: changed ? mkApp(f.result, a.result) : term,
        changed,
      }
    }
  }
}

// Parse a `NAME = expression` definition. Returns an error message on failure.
export function parseDefinition(
  input: string,
): { ok: true; name: string; source: string; term: Term } | { ok: false; error: string } {
  const eq = input.indexOf('=')
  if (eq === -1) {
    return { ok: false, error: 'A definition needs the form NAME = expression' }
  }
  const name = input.slice(0, eq).trim()
  const source = input.slice(eq + 1).trim()
  if (!/^[A-Za-z_][A-Za-z0-9_'?!]*$/.test(name)) {
    return { ok: false, error: `"${name}" is not a valid name` }
  }
  const parsed = parse(source)
  if (!parsed.ok) {
    return { ok: false, error: parsed.error.message }
  }
  return { ok: true, name, source, term: parsed.term }
}

// Helper used by builtins.ts to construct an environment from source strings.
export function defsFromSources(entries: [string, string][]): Definition[] {
  return entries.map(([name, source]) => {
    const parsed = parse(source)
    if (!parsed.ok) {
      throw new Error(`builtin "${name}" failed to parse: ${parsed.error.message}`)
    }
    return { name, source, term: parsed.term }
  })
}

// Re-exported so other modules don't need to import ast directly for these.
export { mkVar, mkAbs, mkApp }
