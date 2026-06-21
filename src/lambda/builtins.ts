// Standard library of named definitions, available in the playground by default.
//
// Definitions may reference each other (e.g. ONE is defined via SUCC ZERO);
// `expand` in environment.ts resolves references iteratively, so ordering here
// does not matter.

import type { Definition, Environment } from './environment'
import { defsFromSources } from './environment'

const SOURCES: [string, string][] = [
  // --- Booleans ---
  ['TRUE', '\\x y. x'],
  ['FALSE', '\\x y. y'],
  ['NOT', '\\p. p FALSE TRUE'],
  ['AND', '\\p q. p q p'],
  ['OR', '\\p q. p p q'],
  ['IF', '\\p a b. p a b'],

  // --- Church numerals ---
  ['ZERO', '\\f x. x'],
  ['ONE', '\\f x. f x'],
  ['TWO', '\\f x. f (f x)'],
  ['THREE', '\\f x. f (f (f x))'],
  ['SUCC', '\\n f x. f (n f x)'],
  ['PLUS', '\\m n f x. m f (n f x)'],
  ['MULT', '\\m n f. m (n f)'],
  ['POW', '\\b e. e b'],
  ['ISZERO', '\\n. n (\\x. FALSE) TRUE'],

  // --- Pairs ---
  ['PAIR', '\\x y f. f x y'],
  ['FST', '\\p. p TRUE'],
  ['SND', '\\p. p FALSE'],

  // --- Combinators ---
  ['I', '\\x. x'],
  ['K', '\\x y. x'],
  ['S', '\\f g x. f x (g x)'],
  ['B', '\\f g x. f (g x)'],
  ['C', '\\f x y. f y x'],
  ['W', '\\f x. f x x'],
  ['OMEGA', '(\\x. x x) (\\x. x x)'],

  // --- Fixed-point combinators ---
  ['Y', '\\f. (\\x. f (x x)) (\\x. f (x x))'],
  ['Z', '\\f. (\\x. f (\\v. x x v)) (\\x. f (\\v. x x v))'],
]

export const BUILTIN_DEFINITIONS: Definition[] = defsFromSources(SOURCES)

export function builtinEnvironment(): Environment {
  const env: Environment = new Map()
  for (const def of BUILTIN_DEFINITIONS) {
    env.set(def.name, def.term)
  }
  return env
}
