// Render a Term back to text — both ASCII (for the input box / sharing) and
// LaTeX (for pretty math display via KaTeX).
//
// A `Path` identifies a sub-term by the sequence of branches taken from the
// root. The LaTeX renderer can wrap the sub-term at a given path in a highlight
// so the active redex stands out while stepping.

import type { Term } from './ast'

export type Branch = 'func' | 'arg' | 'body'
export type Path = Branch[]

// --- ASCII -----------------------------------------------------------------

export function toAscii(term: Term): string {
  switch (term.kind) {
    case 'var':
      return term.name
    case 'abs': {
      // Collapse nested abstractions: \x. \y. M  =>  \x y. M
      const params = [term.param]
      let body: Term = term.body
      while (body.kind === 'abs') {
        params.push(body.param)
        body = body.body
      }
      return `\\${params.join(' ')}. ${toAscii(body)}`
    }
    case 'app': {
      const fn = term.func.kind === 'abs' ? `(${toAscii(term.func)})` : toAscii(term.func)
      const arg =
        term.arg.kind === 'var' ? toAscii(term.arg) : `(${toAscii(term.arg)})`
      return `${fn} ${arg}`
    }
  }
}

// --- LaTeX -----------------------------------------------------------------

const LAMBDA = '\\lambda '

function pathEq(a: Path, b: Path): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i])
}

// Render `term` to a LaTeX string. If `highlight` is given, the sub-term at that
// path is wrapped in \htmlClass{redex}{...} so CSS can highlight it.
export function toLatex(term: Term, highlight?: Path): string {
  const go = (t: Term, path: Path): string => {
    let out: string
    switch (t.kind) {
      case 'var':
        out = escapeIdent(t.name)
        break
      case 'abs': {
        // Collapse nested abstractions for compact display.
        const params = [escapeIdent(t.param)]
        let body: Term = t.body
        let bodyPath: Path = [...path, 'body']
        while (body.kind === 'abs') {
          params.push(escapeIdent(body.param))
          body = body.body
          bodyPath = [...bodyPath, 'body']
        }
        out = `${LAMBDA}${params.join('\\,')}.\\; ${go(body, bodyPath)}`
        break
      }
      case 'app': {
        const fnPath: Path = [...path, 'func']
        const argPath: Path = [...path, 'arg']
        const fn =
          t.func.kind === 'abs'
            ? paren(go(t.func, fnPath))
            : go(t.func, fnPath)
        const arg =
          t.arg.kind === 'var'
            ? go(t.arg, argPath)
            : paren(go(t.arg, argPath))
        out = `${fn}\\; ${arg}`
        break
      }
    }
    if (highlight && pathEq(path, highlight)) {
      return `\\htmlClass{redex}{${out}}`
    }
    return out
  }
  return go(term, [])
}

function paren(inner: string): string {
  return `(${inner})`
}

// Identifiers may contain ' ? ! and digits. Render primes as LaTeX primes and
// subscript trailing digits for readability (x1 -> x_{1}).
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
