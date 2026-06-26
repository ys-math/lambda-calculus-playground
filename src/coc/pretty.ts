// Render a CoC term back to text — ASCII (for the input box / sharing) and LaTeX
// (for KaTeX display). The grammar mirrors the Coq/Lean-flavoured parser:
//   λ shows as `fun (x : A) => M` in ASCII and `\lambda (x{:}A).\,M` in LaTeX,
//   ∀ shows as `forall (x : A), B`, and a non-dependent binder prints as `A -> B`.

import type { CTerm } from './ast'
import { ARROW_PARAM, freeVars } from './ast'

// A binder is "arrow-like" when its variable is never used in the body.
function isArrow(param: string, codomain: CTerm): boolean {
  return param === ARROW_PARAM || !freeVars(codomain).has(param)
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
          // Right-associative arrow; left side needs parens if it is an arrow too.
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
        const f = go(t.func, 2)
        const a = go(t.arg, 3)
        const s = `${f} ${a}`
        return prec > 2 ? `(${s})` : s
      }
    }
  }
  return go(term, 0)
}

// --- LaTeX -----------------------------------------------------------------

export function toLatex(term: CTerm): string {
  const go = (t: CTerm, prec: number): string => {
    switch (t.kind) {
      case 'var':
        return escapeIdent(t.name)
      case 'sort':
        return t.sort === 'prop' ? '\\mathsf{Prop}' : '\\mathsf{Type}'
      case 'pi': {
        if (isArrow(t.param, t.codomain)) {
          const s = `${go(t.domain, 1)} \\to ${go(t.codomain, 0)}`
          return prec > 0 ? paren(s) : s
        }
        const s = `\\forall\\,(${escapeIdent(t.param)} {:}\\, ${go(t.domain, 0)}),\\; ${go(t.codomain, 0)}`
        return prec > 0 ? paren(s) : s
      }
      case 'lam': {
        const s = `\\lambda\\,(${escapeIdent(t.param)} {:}\\, ${go(t.domain, 0)}).\\; ${go(t.body, 0)}`
        return prec > 0 ? paren(s) : s
      }
      case 'app': {
        const f = go(t.func, 2)
        const a = go(t.arg, 3)
        const s = `${f}\\; ${a}`
        return prec > 2 ? paren(s) : s
      }
    }
  }
  return go(term, 0)
}

function paren(inner: string): string {
  return `(${inner})`
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
