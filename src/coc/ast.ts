// Abstract syntax tree for the Calculus of Constructions (CoC).
//
// CoC extends the typed lambda calculus with dependent types: types may depend
// on terms, and the same syntax describes terms, types, and kinds. A CTerm is
// one of five forms:
//   - Var  : a variable reference, e.g. `x`
//   - Sort : one of the two universes, Prop (`*`) or Type (`□`), with Prop : Type
//   - Pi   : a dependent function type ∀(x : A), B   (B may mention x)
//   - Lam  : a typed abstraction        λ(x : A). M
//   - App  : an application             f a
//
// A non-dependent arrow `A -> B` is just `Pi` whose bound variable does not
// occur in B; we store such binders under the reserved name `_`.
//
// Like the untyped `ast.ts`, this module is pure data + tiny helpers with no DOM
// or React dependency, so it can be unit-tested and reused freely.

export type Sort = 'prop' | 'type'

export interface CVar {
  readonly kind: 'var'
  readonly name: string
}

export interface CSort {
  readonly kind: 'sort'
  readonly sort: Sort
}

export interface CPi {
  readonly kind: 'pi'
  readonly param: string
  readonly domain: CTerm
  readonly codomain: CTerm
}

export interface CLam {
  readonly kind: 'lam'
  readonly param: string
  readonly domain: CTerm
  readonly body: CTerm
}

export interface CApp {
  readonly kind: 'app'
  readonly func: CTerm
  readonly arg: CTerm
}

export type CTerm = CVar | CSort | CPi | CLam | CApp

// Reserved binder name for non-dependent arrows (`A -> B`).
export const ARROW_PARAM = '_'

// Convenience constructors -------------------------------------------------

export const cVar = (name: string): CVar => ({ kind: 'var', name })
export const cSort = (sort: Sort): CSort => ({ kind: 'sort', sort })
export const cPi = (param: string, domain: CTerm, codomain: CTerm): CPi => ({
  kind: 'pi',
  param,
  domain,
  codomain,
})
export const cLam = (param: string, domain: CTerm, body: CTerm): CLam => ({
  kind: 'lam',
  param,
  domain,
  body,
})
export const cApp = (func: CTerm, arg: CTerm): CApp => ({ kind: 'app', func, arg })

export const cArrow = (domain: CTerm, codomain: CTerm): CPi =>
  cPi(ARROW_PARAM, domain, codomain)

// Free variables of a term — names not bound by any enclosing Pi or Lam.
export function freeVars(term: CTerm): Set<string> {
  const out = new Set<string>()
  const go = (t: CTerm, bound: Set<string>): void => {
    switch (t.kind) {
      case 'var':
        if (!bound.has(t.name)) out.add(t.name)
        return
      case 'sort':
        return
      case 'app':
        go(t.func, bound)
        go(t.arg, bound)
        return
      case 'pi':
      case 'lam': {
        const inner = t.kind === 'pi' ? t.codomain : t.body
        go(t.domain, bound)
        const b2 = new Set(bound)
        b2.add(t.param)
        go(inner, b2)
        return
      }
    }
  }
  go(term, new Set())
  return out
}

// Generate a variable name not present in `avoid` (x → x' → x'' → …).
export function freshName(base: string, avoid: Set<string>): string {
  let candidate = base === ARROW_PARAM ? 'x' : base
  while (avoid.has(candidate)) candidate += "'"
  return candidate
}

// Alpha-equivalence: equal up to consistent renaming of bound variables. Domains
// of binders must match too (they are part of the type).
export function alphaEquiv(a: CTerm, b: CTerm): boolean {
  const go = (
    x: CTerm,
    y: CTerm,
    aToB: Map<string, string>,
    bToA: Map<string, string>,
  ): boolean => {
    if (x.kind !== y.kind) return false
    switch (x.kind) {
      case 'var': {
        const yv = y as CVar
        const mapped = aToB.get(x.name)
        const mappedBack = bToA.get(yv.name)
        if (mapped === undefined && mappedBack === undefined) return x.name === yv.name
        return mapped === yv.name && mappedBack === x.name
      }
      case 'sort':
        return x.sort === (y as CSort).sort
      case 'app': {
        const ya = y as CApp
        return go(x.func, ya.func, aToB, bToA) && go(x.arg, ya.arg, aToB, bToA)
      }
      case 'pi':
      case 'lam': {
        const xDom = x.domain
        const xInner = x.kind === 'pi' ? x.codomain : (x as CLam).body
        const yb = y as CPi | CLam
        const yDom = yb.domain
        const yInner = yb.kind === 'pi' ? yb.codomain : yb.body
        if (!go(xDom, yDom, aToB, bToA)) return false
        const aToB2 = new Map(aToB)
        const bToA2 = new Map(bToA)
        aToB2.set(x.param, yb.param)
        bToA2.set(yb.param, x.param)
        return go(xInner, yInner, aToB2, bToA2)
      }
    }
  }
  return go(a, b, new Map(), new Map())
}
