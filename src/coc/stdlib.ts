// A small standard library for the CoC playground: a handful of postulated
// constants (axioms) so beginners can write meaningful terms — `succ (succ zero)`
// — without having to encode the data types first. Each is a `postulate`
// CoCDef; user definitions are layered on top of these via `buildEnv`.

import type { CoCDef } from './environment'
import type { Context } from './check'
import { parse } from './parser'

interface Decl {
  name: string
  type: string // parsed with the CoC parser at load time
  note: string
}

// Order matters: each type may only mention names declared earlier.
const DECLS: Decl[] = [
  { name: 'Nat', type: 'Prop', note: 'the type of natural numbers' },
  { name: 'zero', type: 'Nat', note: '0' },
  { name: 'succ', type: 'Nat -> Nat', note: 'successor: n ↦ n + 1' },
  { name: 'Bool', type: 'Prop', note: 'the type of booleans' },
  { name: 'true', type: 'Bool', note: 'boolean true' },
  { name: 'false', type: 'Bool', note: 'boolean false' },
]

export interface StdConstant {
  name: string
  type: string
  note: string
}

// The constants, as display strings, for showing the available library in the UI.
export const STD_CONSTANTS: StdConstant[] = DECLS.map((d) => ({
  name: d.name,
  type: d.type,
  note: d.note,
}))

// The standard library as postulate definitions. Parsing is total for these
// literals; a bad declaration is surfaced loudly at module load.
export const STD_DEFS: CoCDef[] = DECLS.map((d) => {
  const parsed = parse(d.type)
  if (!parsed.ok) {
    throw new Error(`Bad stdlib declaration ${d.name} : ${d.type} — ${parsed.error.message}`)
  }
  return { name: d.name, source: d.type, kind: 'postulate', type: parsed.term }
})

// The standard library as a plain typing context (used by tests).
export const STD_CONTEXT: Context = STD_DEFS.map((d) => ({ name: d.name, type: d.type }))
