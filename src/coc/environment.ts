// User definitions for the CoC playground.
//
// A definition is one of two forms (parsed from one line of text):
//   Name = term      an abbreviation — `Name` may be used in later terms and is
//                    δ-unfolded to its body during computation. Its type is
//                    inferred. (`:=` is accepted as a Coq-flavoured alias for `=`.)
//   Name : type      a postulate (axiom) — `Name` is an abstract constant of the
//                    given type, with no body, so it never reduces. The standard
//                    library (Nat, Bool, …) is exactly a list of postulates.
//
// `buildEnv` folds a list of source lines over a base library, type-checking each
// in turn, and returns the typing context + δ-bodies that the checker and the
// stepper consume, plus any per-line errors to surface in the UI.

import type { CTerm } from './ast'
import { parse } from './parser'
import { check } from './check'
import type { Context } from './check'
import type { Defs } from './normalize'
import { whnf } from './normalize'

export type DefKind = 'def' | 'postulate'

export interface CoCDef {
  name: string
  source: string // the right-hand side text, for display
  kind: DefKind
  type: CTerm
  body?: CTerm // present for `def`, absent for `postulate`
}

export interface ParsedDef {
  name: string
  kind: DefKind
  source: string // the right-hand side text
  rhs: CTerm
}

const NAME_OP = /^\s*([A-Za-z_][A-Za-z0-9_'?!]*)\s*(:=|=|:)([\s\S]*)$/

// Parse one `Name = term` / `Name : type` line into its pieces (without checking).
export function parseCoCDefinition(
  input: string,
): { ok: true; def: ParsedDef } | { ok: false; error: string } {
  const m = NAME_OP.exec(input)
  if (!m) {
    return { ok: false, error: 'Use the form  Name = term  or  Name : type' }
  }
  const [, name, op, rest] = m
  const source = rest.trim()
  if (!source) return { ok: false, error: 'The right-hand side is empty' }
  const parsed = parse(source)
  if (!parsed.ok) return { ok: false, error: parsed.error.message }
  const kind: DefKind = op === ':' ? 'postulate' : 'def'
  return { ok: true, def: { name, kind, source, rhs: parsed.term } }
}

// The outcome of one user source line: either a checked definition or an error.
export interface UserEntry {
  source: string
  def?: CoCDef
  error?: string
}

export interface BuiltEnv {
  defs: CoCDef[]
  context: Context
  bodies: Defs
  // One entry per user source line, in input order (for display).
  userEntries: UserEntry[]
  // The subset of userEntries that failed.
  errors: { source: string; message: string }[]
}

// Build the environment by folding `userSources` over `base`, type-checking each
// line against everything declared before it. Later definitions may reference
// earlier ones; a failing line is reported and skipped.
export function buildEnv(base: CoCDef[], userSources: string[]): BuiltEnv {
  const defs: CoCDef[] = [...base]
  const context: Context = base.map((d) => ({ name: d.name, type: d.type }))
  const bodies: Defs = new Map()
  for (const d of base) if (d.body) bodies.set(d.name, d.body)
  const userEntries: UserEntry[] = []
  const errors: { source: string; message: string }[] = []

  const fail = (raw: string, message: string) => {
    userEntries.push({ source: raw, error: message })
    errors.push({ source: raw, message })
  }

  for (const raw of userSources) {
    const parsed = parseCoCDefinition(raw)
    if (!parsed.ok) {
      fail(raw, parsed.error)
      continue
    }
    const { name, kind, source, rhs } = parsed.def
    const res = check(rhs, context, bodies)
    if (!res.ok) {
      fail(raw, res.error)
      continue
    }

    if (kind === 'def') {
      const def: CoCDef = { name, source, kind, type: res.type, body: rhs }
      defs.push(def)
      context.push({ name, type: res.type })
      bodies.set(name, rhs)
      userEntries.push({ source: raw, def })
    } else {
      // Postulate: the declared type must itself be a well-formed type, i.e. its
      // own type is a sort (Prop or Type).
      if (whnf(res.type, bodies).kind !== 'sort') {
        fail(raw, `“${source}” is not a type, so it cannot be the type of a postulate.`)
        continue
      }
      const def: CoCDef = { name, source, kind, type: rhs }
      defs.push(def)
      context.push({ name, type: rhs })
      userEntries.push({ source: raw, def })
    }
  }

  return { defs, context, bodies, userEntries, errors }
}
