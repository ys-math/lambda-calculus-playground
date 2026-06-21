// Abstract syntax tree for the untyped lambda calculus.
//
// A Term is one of three forms:
//   - Var: a variable reference, e.g. `x`
//   - Abs: a lambda abstraction, e.g. `λx. body`
//   - App: an application of one term to another, e.g. `f a`
//
// This module is pure data + tiny helpers; it has no dependency on React or the
// DOM so it can be unit-tested and reused freely.

export interface Var {
  readonly kind: 'var'
  readonly name: string
}

export interface Abs {
  readonly kind: 'abs'
  readonly param: string
  readonly body: Term
}

export interface App {
  readonly kind: 'app'
  readonly func: Term
  readonly arg: Term
}

export type Term = Var | Abs | App

// Convenience constructors -------------------------------------------------

export const mkVar = (name: string): Var => ({ kind: 'var', name })
export const mkAbs = (param: string, body: Term): Abs => ({ kind: 'abs', param, body })
export const mkApp = (func: Term, arg: Term): App => ({ kind: 'app', func, arg })

// Structural equality (ignores variable names? no — this is *exact* equality).
// For "are these the same up to renaming" use alphaEquiv below.
export function equals(a: Term, b: Term): boolean {
  if (a.kind !== b.kind) return false
  switch (a.kind) {
    case 'var':
      return a.name === (b as Var).name
    case 'abs':
      return a.param === (b as Abs).param && equals(a.body, (b as Abs).body)
    case 'app':
      return equals(a.func, (b as App).func) && equals(a.arg, (b as App).arg)
  }
}

// Alpha-equivalence: are two terms equal up to consistent renaming of bound
// variables? Used by tests to compare reduction results without caring about
// the exact fresh names chosen.
export function alphaEquiv(a: Term, b: Term): boolean {
  // Maps each bound name in `a` to the corresponding bound name in `b`.
  const go = (
    x: Term,
    y: Term,
    aToB: Map<string, string>,
    bToA: Map<string, string>,
  ): boolean => {
    if (x.kind !== y.kind) return false
    switch (x.kind) {
      case 'var': {
        const yv = y as Var
        const mapped = aToB.get(x.name)
        const mappedBack = bToA.get(yv.name)
        if (mapped === undefined && mappedBack === undefined) {
          // Both free: must be the same name.
          return x.name === yv.name
        }
        // Both bound: must point at each other.
        return mapped === yv.name && mappedBack === x.name
      }
      case 'abs': {
        const ya = y as Abs
        const aToB2 = new Map(aToB)
        const bToA2 = new Map(bToA)
        aToB2.set(x.param, ya.param)
        bToA2.set(ya.param, x.param)
        return go(x.body, ya.body, aToB2, bToA2)
      }
      case 'app': {
        const ya = y as App
        return go(x.func, ya.func, aToB, bToA) && go(x.arg, ya.arg, aToB, bToA)
      }
    }
  }
  return go(a, b, new Map(), new Map())
}
