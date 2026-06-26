// A small standard context for the CoC playground: a handful of declared
// constants (axioms) so beginners can write meaningful terms — `succ (succ zero)`
// — without having to encode the data types first. Each declaration's type is
// checked against the ones before it, so the context is itself well-formed.

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

// The constants, as display strings, for showing the available context in the UI.
export const STD_CONSTANTS: StdConstant[] = DECLS.map((d) => ({
  name: d.name,
  type: d.type,
  note: d.note,
}))

// Build the typing context once. Parsing is total for these literals; if a
// declaration ever fails to parse we surface it loudly at module load.
export const STD_CONTEXT: Context = DECLS.map((d) => {
  const parsed = parse(d.type)
  if (!parsed.ok) {
    throw new Error(`Bad stdlib declaration ${d.name} : ${d.type} — ${parsed.error.message}`)
  }
  return { name: d.name, type: parsed.term }
})
