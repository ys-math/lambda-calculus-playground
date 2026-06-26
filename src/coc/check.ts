// Type checker for the Calculus of Constructions.
//
// CoC is the top corner of Barendregt's lambda cube: a Pure Type System with two
// sorts — Prop (`*`) and Type (`□`) — the axiom Prop : Type, and every product
// rule (s₁, s₂) allowed, so types can depend on terms (dependent types), on
// types (polymorphism), and types can be computed from types. We infer the type
// of a term by structural recursion, using `defEqual` (compare beta-normal forms)
// whenever two types must agree.

import type { CTerm, Sort } from './ast'
import { cPi, freeVars } from './ast'
import { toAscii } from './pretty'
import { defEqual, normalize, ReductionLimitError, subst, whnf } from './normalize'

// A typing context: a stack of (variable : type) bindings; later entries shadow.
export interface Binding {
  name: string
  type: CTerm
}
export type Context = Binding[]

export type CheckResult =
  | { ok: true; type: CTerm; normal: CTerm }
  | { ok: false; error: string }

type Infer = { ok: true; type: CTerm } | { ok: false; error: string }

const err = (error: string): { ok: false; error: string } => ({ ok: false, error })

function lookup(ctx: Context, name: string): CTerm | undefined {
  for (let i = ctx.length - 1; i >= 0; i--) {
    if (ctx[i].name === name) return ctx[i].type
  }
  return undefined
}

// Infer the type of `term` in `ctx`, then return both its type and its normal
// form. Type errors are reported as friendly messages.
export function check(term: CTerm, ctx: Context = []): CheckResult {
  try {
    const t = infer(term, ctx)
    if (!t.ok) return t
    return { ok: true, type: normalize(t.type), normal: normalize(term) }
  } catch (e) {
    if (e instanceof ReductionLimitError) return err(e.message)
    throw e
  }
}

function infer(term: CTerm, ctx: Context): Infer {
  switch (term.kind) {
    case 'var': {
      const ty = lookup(ctx, term.name)
      if (!ty) return err(`Unbound variable “${term.name}”. Declare it or bind it with fun/forall.`)
      return { ok: true, type: ty }
    }

    case 'sort': {
      // Prop : Type. Type itself has no type (it is the largest universe).
      if (term.sort === 'prop') return { ok: true, type: { kind: 'sort', sort: 'type' } }
      return err('Type is the largest universe — it has no type of its own.')
    }

    case 'pi': {
      // Domain must be a type (its type is a sort); the codomain, in the extended
      // context, must also live in a sort. The product itself lives in that sort.
      const s1 = inferSort(term.domain, ctx, 'The domain of a function type')
      if (!s1.ok) return s1
      const ctx2 = ctx.concat({ name: term.param, type: term.domain })
      const s2 = inferSort(term.codomain, ctx2, 'The result of a function type')
      if (!s2.ok) return s2
      return { ok: true, type: { kind: 'sort', sort: s2.sort } }
    }

    case 'lam': {
      // The annotation must be a type; infer the body in the extended context.
      const s = inferSort(term.domain, ctx, 'A function parameter’s type')
      if (!s.ok) return s
      const ctx2 = ctx.concat({ name: term.param, type: term.domain })
      const bodyTy = infer(term.body, ctx2)
      if (!bodyTy.ok) return bodyTy
      const piTy = cPi(term.param, term.domain, bodyTy.type)
      // The resulting Pi type must itself be well-formed.
      const piSort = inferSort(piTy, ctx, 'The inferred function type')
      if (!piSort.ok) return piSort
      return { ok: true, type: piTy }
    }

    case 'app': {
      const fnTy = infer(term.func, ctx)
      if (!fnTy.ok) return fnTy
      const head = whnf(fnTy.type)
      if (head.kind !== 'pi') {
        return err(
          `“${toAscii(term.func)}” is applied to an argument but is not a function ` +
            `(its type is ${toAscii(normalize(fnTy.type))}).`,
        )
      }
      const argTy = infer(term.arg, ctx)
      if (!argTy.ok) return argTy
      if (!defEqual(argTy.type, head.domain)) {
        return err(
          `Type mismatch: the function expects an argument of type ` +
            `${toAscii(normalize(head.domain))}, but “${toAscii(term.arg)}” has type ` +
            `${toAscii(normalize(argTy.type))}.`,
        )
      }
      // Dependent result: substitute the actual argument into the codomain.
      return { ok: true, type: subst(head.codomain, head.param, term.arg) }
    }
  }
}

type SortResult = { ok: true; sort: Sort } | { ok: false; error: string }

// Infer the type of `t`, then require it to be a sort (Prop or Type) — i.e. that
// `t` is itself a type/kind. `role` is used in the error message.
function inferSort(t: CTerm, ctx: Context, role: string): SortResult {
  const ty = infer(t, ctx)
  if (!ty.ok) return ty
  const w = whnf(ty.type)
  if (w.kind !== 'sort') {
    return err(`${role} must be a type, but “${toAscii(t)}” has type ${toAscii(normalize(ty.type))}.`)
  }
  return { ok: true, sort: w.sort }
}

// Re-export for callers that want to mention free variables in UI hints.
export { freeVars }
