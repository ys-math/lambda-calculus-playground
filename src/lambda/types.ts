// Types for the simply typed lambda calculus.
//
// A simple type is either a type variable (an unknown, written a, b, c, … once
// displayed) or a function type `from → to`. Inference works with numeric type
// variable ids; the UI/tests assign readable letters via `normalizeNames`.
//
// Pure data + helpers, no React/DOM — unit-testable in isolation.

export interface TVar {
  readonly kind: 'tvar'
  readonly id: number
}

export interface TArrow {
  readonly kind: 'tarrow'
  readonly from: Type
  readonly to: Type
}

export type Type = TVar | TArrow

export const tVar = (id: number): TVar => ({ kind: 'tvar', id })
export const tArrow = (from: Type, to: Type): TArrow => ({ kind: 'tarrow', from, to })

// A substitution maps type-variable ids to types.
export type Subst = Map<number, Type>

// Apply a substitution to a type, following chains of variable bindings.
export function applySubst(type: Type, subst: Subst): Type {
  switch (type.kind) {
    case 'tvar': {
      const bound = subst.get(type.id)
      // Keep resolving until we hit something not further substituted.
      return bound !== undefined ? applySubst(bound, subst) : type
    }
    case 'tarrow':
      return tArrow(applySubst(type.from, subst), applySubst(type.to, subst))
  }
}

// The set of type-variable ids occurring in a type (used by the occurs check).
export function freeTypeVars(type: Type, out: Set<number> = new Set()): Set<number> {
  switch (type.kind) {
    case 'tvar':
      out.add(type.id)
      return out
    case 'tarrow':
      freeTypeVars(type.from, out)
      freeTypeVars(type.to, out)
      return out
  }
}

// Map from a type-variable id to its display letter (a, b, c, … then a1, b1, …).
export type NameMap = Map<number, string>

function letterFor(index: number): string {
  const letter = String.fromCharCode(97 + (index % 26))
  const suffix = Math.floor(index / 26)
  return suffix === 0 ? letter : `${letter}${suffix}`
}

// Assign readable names to every type variable appearing in `type`, in order of
// first appearance, extending an existing map so a whole derivation can share
// one consistent naming.
export function normalizeNames(type: Type, names: NameMap = new Map()): NameMap {
  switch (type.kind) {
    case 'tvar':
      if (!names.has(type.id)) names.set(type.id, letterFor(names.size))
      return names
    case 'tarrow':
      normalizeNames(type.from, names)
      normalizeNames(type.to, names)
      return names
  }
}

const nameOf = (id: number, names: NameMap): string => names.get(id) ?? `t${id}`

// --- Rendering -------------------------------------------------------------

// ASCII form, e.g. (a -> b) -> a -> b. Arrow is right-associative, so only the
// left operand of an arrow is parenthesised when it is itself an arrow.
export function typeToAscii(type: Type, names: NameMap): string {
  switch (type.kind) {
    case 'tvar':
      return nameOf(type.id, names)
    case 'tarrow': {
      const left =
        type.from.kind === 'tarrow'
          ? `(${typeToAscii(type.from, names)})`
          : typeToAscii(type.from, names)
      return `${left} -> ${typeToAscii(type.to, names)}`
    }
  }
}

// LaTeX form for KaTeX, using \to and the same right-associative parenthesising.
export function typeToLatex(type: Type, names: NameMap): string {
  switch (type.kind) {
    case 'tvar':
      return nameOf(type.id, names)
    case 'tarrow': {
      const left =
        type.from.kind === 'tarrow'
          ? `(${typeToLatex(type.from, names)})`
          : typeToLatex(type.from, names)
      return `${left} \\to ${typeToLatex(type.to, names)}`
    }
  }
}
