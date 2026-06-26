// Substitution and beta/delta-normalisation for the Calculus of Constructions.
//
// Type-checking a dependently typed term needs to *compute*: to compare two
// types we reduce both to normal form and check them up to renaming. Reduction
// here is beta (apply a lambda) plus delta (unfold a definition body); postulated
// constants have no body and stay opaque. Because well-typed CoC terms are
// strongly normalising, normalisation terminates — but the checker also
// normalises some sub-terms before they are fully verified, so a fuel counter
// guards against runaway reduction on ill-typed or self-referential input.

import type { CTerm } from './ast'
import { alphaEquiv, cApp, cLam, cPi, cVar, freeVars, freshName } from './ast'

// A delta environment: maps a defined name to the term it abbreviates. Names
// absent from the map (postulates, locally bound variables) are left alone.
export type Defs = Map<string, CTerm>

const NO_DEFS: Defs = new Map()

// Capture-avoiding substitution: replace free occurrences of `name` with `value`.
export function subst(term: CTerm, name: string, value: CTerm): CTerm {
  const go = (t: CTerm): CTerm => {
    switch (t.kind) {
      case 'var':
        return t.name === name ? value : t
      case 'sort':
        return t
      case 'app':
        return cApp(go(t.func), go(t.arg))
      case 'pi':
      case 'lam': {
        const domain = go(t.domain)
        // The binder shadows `name` inside its body/codomain — leave that alone.
        if (t.param === name) {
          return t.kind === 'pi'
            ? cPi(t.param, domain, t.codomain)
            : cLam(t.param, domain, t.body)
        }
        const inner = t.kind === 'pi' ? t.codomain : t.body
        // If `value` mentions the bound name we would capture it — rename first.
        if (freeVars(value).has(t.param)) {
          const avoid = new Set<string>([...freeVars(value), ...freeVars(inner), name])
          const fresh = freshName(t.param, avoid)
          const renamed = subst(inner, t.param, cVar(fresh))
          const innerSub = subst(renamed, name, value)
          return t.kind === 'pi'
            ? cPi(fresh, domain, innerSub)
            : cLam(fresh, domain, innerSub)
        }
        const innerSub = subst(inner, name, value)
        return t.kind === 'pi'
          ? cPi(t.param, domain, innerSub)
          : cLam(t.param, domain, innerSub)
      }
    }
  }
  return go(term)
}

// Reduction fuel: well-typed terms always terminate, but the checker reduces
// some terms before they are fully validated, so we cap total reduction steps.
const MAX_STEPS = 10_000

class Fuel {
  private steps = 0
  burn(): void {
    if (++this.steps > MAX_STEPS) {
      throw new ReductionLimitError()
    }
  }
}

export class ReductionLimitError extends Error {
  constructor() {
    super('Reduction did not terminate within the step limit.')
    this.name = 'ReductionLimitError'
  }
}

// Weak head normal form: reduce just enough to expose the outermost constructor
// (used to see whether a type is a Pi, a Sort, etc.). Unfolds head definitions.
export function whnf(term: CTerm, defs: Defs = NO_DEFS): CTerm {
  return whnfWith(term, defs, new Fuel())
}

function whnfWith(term: CTerm, defs: Defs, fuel: Fuel): CTerm {
  let t = term
  for (;;) {
    if (t.kind === 'var') {
      const body = defs.get(t.name)
      if (body) {
        fuel.burn()
        t = body
        continue
      }
      return t
    }
    if (t.kind === 'app') {
      const f = whnfWith(t.func, defs, fuel)
      if (f.kind === 'lam') {
        fuel.burn()
        t = subst(f.body, f.param, t.arg)
        continue
      }
      return cApp(f, t.arg)
    }
    return t
  }
}

// Full beta/delta-normal form: reduce everywhere, including under binders.
export function normalize(term: CTerm, defs: Defs = NO_DEFS): CTerm {
  return normWith(term, defs, new Fuel())
}

function normWith(term: CTerm, defs: Defs, fuel: Fuel): CTerm {
  const t = whnfWith(term, defs, fuel)
  switch (t.kind) {
    case 'var':
    case 'sort':
      return t
    case 'app':
      return cApp(normWith(t.func, defs, fuel), normWith(t.arg, defs, fuel))
    case 'lam':
      return cLam(t.param, normWith(t.domain, defs, fuel), normWith(t.body, defs, fuel))
    case 'pi':
      return cPi(t.param, normWith(t.domain, defs, fuel), normWith(t.codomain, defs, fuel))
  }
}

// Definitional equality: two terms are equal when their normal forms (modulo
// beta and delta) are alpha-equivalent.
export function defEqual(a: CTerm, b: CTerm, defs: Defs = NO_DEFS): boolean {
  return alphaEquiv(normalize(a, defs), normalize(b, defs))
}
