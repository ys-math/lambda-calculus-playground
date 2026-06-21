// Beta-reduction engine.
//
// A *redex* (reducible expression) is an application of an abstraction to an
// argument: `(λx. body) arg`. Reducing it yields `[x := arg] body`.
//
// Two strategies decide which redex to reduce next when several exist:
//   - 'normal'      : leftmost-OUTERMOST. Reduces the outermost redex first.
//                     Guarantees a normal form if one exists (normalisation).
//   - 'applicative' : leftmost-INNERMOST. Reduces arguments fully before the
//                     outer application — like call-by-value. May diverge on
//                     terms that normal order would normalise.

import type { Term } from './ast'
import { mkAbs, mkApp } from './ast'
import { substitute } from './substitute'
import type { Path } from './pretty'

export type Strategy = 'normal' | 'applicative'

const isRedex = (t: Term): boolean => t.kind === 'app' && t.func.kind === 'abs'

// Locate the path to the next redex per strategy, or null if in normal form.
export function findRedex(term: Term, strategy: Strategy): Path | null {
  return strategy === 'normal'
    ? findNormalOrder(term, [])
    : findApplicativeOrder(term, [])
}

// Leftmost-outermost: check the node itself before descending.
function findNormalOrder(t: Term, path: Path): Path | null {
  if (isRedex(t)) return path
  switch (t.kind) {
    case 'var':
      return null
    case 'abs':
      return findNormalOrder(t.body, [...path, 'body'])
    case 'app': {
      const inFunc = findNormalOrder(t.func, [...path, 'func'])
      if (inFunc) return inFunc
      return findNormalOrder(t.arg, [...path, 'arg'])
    }
  }
}

// Leftmost-innermost: descend first, reduce the node itself only once its
// sub-terms are fully reduced.
function findApplicativeOrder(t: Term, path: Path): Path | null {
  switch (t.kind) {
    case 'var':
      return null
    case 'abs':
      return findApplicativeOrder(t.body, [...path, 'body'])
    case 'app': {
      const inFunc = findApplicativeOrder(t.func, [...path, 'func'])
      if (inFunc) return inFunc
      const inArg = findApplicativeOrder(t.arg, [...path, 'arg'])
      if (inArg) return inArg
      // Sub-terms reduced; reduce this redex if it is one.
      return isRedex(t) ? path : null
    }
  }
}

// Contract the redex at the root: (λx. body) arg  ->  [x := arg] body.
function contract(t: Term): Term {
  if (t.kind !== 'app' || t.func.kind !== 'abs') {
    throw new Error('contract called on a non-redex')
  }
  return substitute(t.func.body, t.func.param, t.arg)
}

// Rebuild a term with the sub-term at `path` replaced by `replacement`.
function replaceAt(t: Term, path: Path, replacement: Term): Term {
  if (path.length === 0) return replacement
  const [head, ...rest] = path
  switch (t.kind) {
    case 'abs':
      if (head !== 'body') throw new Error('bad path into abstraction')
      return mkAbs(t.param, replaceAt(t.body, rest, replacement))
    case 'app':
      if (head === 'func') return mkApp(replaceAt(t.func, rest, replacement), t.arg)
      if (head === 'arg') return mkApp(t.func, replaceAt(t.arg, rest, replacement))
      throw new Error('bad path into application')
    case 'var':
      throw new Error('path descends into a variable')
  }
}

export interface Step {
  // Term *before* the reduction, with `redexPath` pointing at the redex that is
  // about to be contracted.
  term: Term
  redexPath: Path
}

// Perform a single reduction step. Returns the next term and the path of the
// redex that was contracted, or null if `term` is already in normal form.
export function stepOnce(
  term: Term,
  strategy: Strategy,
): { next: Term; redexPath: Path } | null {
  const path = findRedex(term, strategy)
  if (!path) return null
  const redex = subtermAt(term, path)
  const contracted = contract(redex)
  return { next: replaceAt(term, path, contracted), redexPath: path }
}

function subtermAt(t: Term, path: Path): Term {
  let cur = t
  for (const branch of path) {
    if (branch === 'body' && cur.kind === 'abs') cur = cur.body
    else if (branch === 'func' && cur.kind === 'app') cur = cur.func
    else if (branch === 'arg' && cur.kind === 'app') cur = cur.arg
    else throw new Error('bad path in subtermAt')
  }
  return cur
}

export interface ReductionResult {
  // Each entry is a term in the sequence; `steps[0]` is the original term and
  // each later term is the result of contracting one redex.
  terms: Term[]
  // redexPaths[i] is the redex contracted to get from terms[i] to terms[i+1].
  redexPaths: Path[]
  // 'normal'  : reached a normal form.
  // 'capped'  : hit maxSteps before normalising (possible non-termination).
  status: 'normal' | 'capped'
}

// Drive reduction to normal form (or until maxSteps), collecting every
// intermediate term so the UI can step back and forth.
export function reduceMany(
  term: Term,
  strategy: Strategy,
  maxSteps = 1000,
): ReductionResult {
  const terms: Term[] = [term]
  const redexPaths: Path[] = []
  let current = term
  for (let i = 0; i < maxSteps; i++) {
    const stepped = stepOnce(current, strategy)
    if (!stepped) {
      return { terms, redexPaths, status: 'normal' }
    }
    redexPaths.push(stepped.redexPath)
    terms.push(stepped.next)
    current = stepped.next
  }
  return { terms, redexPaths, status: 'capped' }
}
