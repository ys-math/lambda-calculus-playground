// Render a CoC term back to text — ASCII (for the input box / sharing) and LaTeX
// (for KaTeX display). The grammar mirrors the Coq/Lean-flavoured parser:
//   λ shows as `fun (x : A) => M` in ASCII and `\lambda (x{:}A).\,M` in LaTeX,
//   ∀ shows as `forall (x : A), B`, and a non-dependent binder prints as `A -> B`.
//
// A `CPath` identifies a sub-term by the branches taken from the root. The LaTeX
// renderer can wrap the sub-term at a given path in a highlight so the active
// redex stands out while stepping (same approach as the untyped pretty printer).

import type { CTerm } from './ast'
import { ARROW_PARAM, freeVars } from './ast'

export type CBranch = 'func' | 'arg' | 'domain' | 'body' | 'codomain'
export type CPath = CBranch[]

// A binder is "arrow-like" when its variable is never used in the body.
function isArrow(param: string, codomain: CTerm): boolean {
  return param === ARROW_PARAM || !freeVars(codomain).has(param)
}

function pathEq(a: CPath, b: CPath): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i])
}

// --- ASCII -----------------------------------------------------------------

export function toAscii(term: CTerm): string {
  const go = (t: CTerm, prec: number): string => {
    switch (t.kind) {
      case 'var':
        return t.name
      case 'sort':
        return t.sort === 'prop' ? 'Prop' : 'Type'
      case 'pi': {
        if (isArrow(t.param, t.codomain)) {
          const s = `${go(t.domain, 1)} -> ${go(t.codomain, 0)}`
          return prec > 0 ? `(${s})` : s
        }
        const s = `forall (${t.param} : ${go(t.domain, 0)}), ${go(t.codomain, 0)}`
        return prec > 0 ? `(${s})` : s
      }
      case 'lam': {
        const s = `fun (${t.param} : ${go(t.domain, 0)}) => ${go(t.body, 0)}`
        return prec > 0 ? `(${s})` : s
      }
      case 'app': {
        const s = `${go(t.func, 2)} ${go(t.arg, 3)}`
        return prec > 2 ? `(${s})` : s
      }
    }
  }
  return go(term, 0)
}

// --- LaTeX -----------------------------------------------------------------

// Render `term` to LaTeX. If `highlight` is given, the sub-term at that path is
// wrapped in \htmlClass{redex}{…} so CSS can highlight it.
export function toLatex(term: CTerm, highlight?: CPath): string {
  const go = (t: CTerm, prec: number, path: CPath): string => {
    let core: string
    let needParen = false
    switch (t.kind) {
      case 'var':
        core = escapeIdent(t.name)
        break
      case 'sort':
        core = t.sort === 'prop' ? '\\mathsf{Prop}' : '\\mathsf{Type}'
        break
      case 'pi': {
        const dom = [...path, 'domain'] as CPath
        const cod = [...path, 'codomain'] as CPath
        if (isArrow(t.param, t.codomain)) {
          core = `${go(t.domain, 1, dom)} \\to ${go(t.codomain, 0, cod)}`
          needParen = prec > 0
        } else {
          core = `\\forall\\,(${escapeIdent(t.param)} {:}\\, ${go(t.domain, 0, dom)}),\\; ${go(t.codomain, 0, cod)}`
          needParen = prec > 0
        }
        break
      }
      case 'lam': {
        const dom = [...path, 'domain'] as CPath
        const bod = [...path, 'body'] as CPath
        core = `\\lambda\\,(${escapeIdent(t.param)} {:}\\, ${go(t.domain, 0, dom)}).\\; ${go(t.body, 0, bod)}`
        needParen = prec > 0
        break
      }
      case 'app': {
        const fn = [...path, 'func'] as CPath
        const ar = [...path, 'arg'] as CPath
        core = `${go(t.func, 2, fn)}\\; ${go(t.arg, 3, ar)}`
        needParen = prec > 2
        break
      }
    }
    const wrapped = highlight && pathEq(path, highlight) ? `\\htmlClass{redex}{${core}}` : core
    return needParen ? `(${wrapped})` : wrapped
  }
  return go(term, 0, [])
}

// Identifiers may contain ' ? ! and digits — render primes/subscripts nicely.
function escapeIdent(name: string): string {
  const m = /^([A-Za-z_]+)(\d*)('*)([?!]*)$/.exec(name)
  if (!m) return `\\text{${name}}`
  const [, base, digits, primes, marks] = m
  let out = base.length > 1 ? `\\mathit{${base}}` : base
  if (digits) out += `_{${digits}}`
  if (primes) out += primes
  if (marks) out += `\\text{${marks}}`
  return out
}
