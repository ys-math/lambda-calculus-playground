// Reduction engine: β-reduction, η-reduction, and explicit α-conversion steps.
//
// A *β-redex* is an application of an abstraction: `(λx. body) arg`, contracting
// to `[x := arg] body`.
//
// An *η-redex* is an abstraction `λx. (M x)` where `x` does not occur free in M;
// it contracts to `M` (η-reduction expresses that such a wrapper is redundant).
// η-reduction is optional — enable it via ReduceOptions.eta.
//
// *α-conversion* renames a bound variable. It is not a simplification, but it is
// required before a β-reduction that would otherwise capture a free variable.
// When ReduceOptions.showAlpha is on, the engine surfaces that renaming as its
// own labelled step *before* the β-step, so learners can see capture avoidance
// happen explicitly instead of silently inside substitution.
//
// Two strategies decide which redex is reduced next:
//   - 'normal'      : leftmost-OUTERMOST  (normalises whenever possible)
//   - 'applicative' : leftmost-INNERMOST  (call-by-value; may diverge)

import type { Term } from './ast'
import { mkAbs, mkApp, mkVar } from './ast'
import { substitute } from './substitute'
import { freeVars, freshName } from './freeVars'
import type { Path } from './pretty'

export type Strategy = 'normal' | 'applicative'
export type ConversionKind = 'beta' | 'eta' | 'alpha'

export interface ReduceOptions {
  // Include η-reduction (λx. M x  →  M) when M does not use x.
  eta?: boolean
  // Surface capture-avoiding α-renames as their own steps before the β-step.
  showAlpha?: boolean
}

const isBetaRedex = (t: Term): boolean => t.kind === 'app' && t.func.kind === 'abs'

// If `t` is an η-redex (λx. M x with x ∉ FV(M)), return M; otherwise null.
function etaContractee(t: Term): Term | null {
  if (
    t.kind === 'abs' &&
    t.body.kind === 'app' &&
    t.body.arg.kind === 'var' &&
    t.body.arg.name === t.param &&
    !freeVars(t.body.func).has(t.param)
  ) {
    return t.body.func
  }
  return null
}

// The reducible kind of a single node (not its sub-terms), or null.
function nodeKind(t: Term, eta: boolean): 'beta' | 'eta' | null {
  if (isBetaRedex(t)) return 'beta'
  if (eta && etaContractee(t) !== null) return 'eta'
  return null
}

export interface RedexInfo {
  path: Path
  kind: 'beta' | 'eta'
}

// Locate the next redex per strategy, or null if in normal form.
export function findRedex(term: Term, strategy: Strategy, eta = false): RedexInfo | null {
  return strategy === 'normal'
    ? findNormalOrder(term, [], eta)
    : findApplicativeOrder(term, [], eta)
}

// Leftmost-outermost: check the node itself before descending.
function findNormalOrder(t: Term, path: Path, eta: boolean): RedexInfo | null {
  const k = nodeKind(t, eta)
  if (k) return { path, kind: k }
  switch (t.kind) {
    case 'var':
      return null
    case 'abs':
      return findNormalOrder(t.body, [...path, 'body'], eta)
    case 'app': {
      const inFunc = findNormalOrder(t.func, [...path, 'func'], eta)
      if (inFunc) return inFunc
      return findNormalOrder(t.arg, [...path, 'arg'], eta)
    }
  }
}

// Leftmost-innermost: descend first, reduce a node once its sub-terms are done.
function findApplicativeOrder(t: Term, path: Path, eta: boolean): RedexInfo | null {
  switch (t.kind) {
    case 'var':
      return null
    case 'abs': {
      const inBody = findApplicativeOrder(t.body, [...path, 'body'], eta)
      if (inBody) return inBody
      const k = nodeKind(t, eta)
      return k ? { path, kind: k } : null
    }
    case 'app': {
      const inFunc = findApplicativeOrder(t.func, [...path, 'func'], eta)
      if (inFunc) return inFunc
      const inArg = findApplicativeOrder(t.arg, [...path, 'arg'], eta)
      if (inArg) return inArg
      const k = nodeKind(t, eta)
      return k ? { path, kind: k } : null
    }
  }
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

// Mirror the renaming that capture-avoiding substitution performs, but applied
// to `body` alone (without yet substituting `value`). Returns the α-converted
// body plus the list of [old, new] binder renames. This lets us show the rename
// as an explicit step before the β-reduction that needs it. Because the renamed
// binders become fresh names, the subsequent substitution does no further
// renaming — so the two-step (α then β) result equals a direct substitution.
function renameCaptures(
  body: Term,
  name: string,
  valueFree: Set<string>,
): { term: Term; renames: [string, string][] } {
  const renames: [string, string][] = []
  const go = (t: Term): Term => {
    switch (t.kind) {
      case 'var':
        return t
      case 'app':
        return mkApp(go(t.func), go(t.arg))
      case 'abs': {
        if (t.param === name) return t // shadowed: substitution stops descending
        if (valueFree.has(t.param)) {
          const avoid = new Set<string>([...valueFree, ...freeVars(t.body), name])
          const fresh = freshName(t.param, avoid)
          renames.push([t.param, fresh])
          const renamedBody = substitute(t.body, t.param, mkVar(fresh))
          return mkAbs(fresh, go(renamedBody))
        }
        return mkAbs(t.param, go(t.body))
      }
    }
  }
  return { term: go(body), renames }
}

export interface StepResult {
  next: Term
  redexPath: Path
  kind: ConversionKind
  // For α-conversion: a human-readable description of the renames, e.g. "y → y'".
  note?: string
}

// Perform a single calculation step. Returns the next term, the path of the
// rewritten sub-term, and which conversion was applied — or null at normal form.
export function stepOnce(
  term: Term,
  strategy: Strategy,
  options: ReduceOptions = {},
): StepResult | null {
  const eta = options.eta ?? false
  const found = findRedex(term, strategy, eta)
  if (!found) return null

  const { path, kind } = found
  const node = subtermAt(term, path)

  if (kind === 'eta') {
    const m = etaContractee(node)!
    return { next: replaceAt(term, path, m), redexPath: path, kind: 'eta' }
  }

  // β-redex. Optionally surface the capture-avoiding α-conversion first.
  if (node.kind === 'app' && node.func.kind === 'abs') {
    if (options.showAlpha) {
      const valueFree = freeVars(node.arg)
      const { term: renamedBody, renames } = renameCaptures(
        node.func.body,
        node.func.param,
        valueFree,
      )
      if (renames.length > 0) {
        const converted = mkApp(mkAbs(node.func.param, renamedBody), node.arg)
        const note = renames.map(([a, b]) => `${a} → ${b}`).join(', ')
        return { next: replaceAt(term, path, converted), redexPath: path, kind: 'alpha', note }
      }
    }
    const contracted = substitute(node.func.body, node.func.param, node.arg)
    return { next: replaceAt(term, path, contracted), redexPath: path, kind: 'beta' }
  }

  throw new Error('inconsistent redex')
}

export interface StepInfo {
  redexPath: Path
  kind: ConversionKind
  note?: string
}

export interface ReductionResult {
  // terms[0] is the original; each later term is the result of one step.
  terms: Term[]
  // steps[i] describes the conversion from terms[i] to terms[i+1].
  steps: StepInfo[]
  // 'normal' : reached a normal form. 'capped' : hit maxSteps (possible loop).
  status: 'normal' | 'capped'
}

// Drive reduction to normal form (or until maxSteps), recording every step.
export function reduceMany(
  term: Term,
  strategy: Strategy,
  maxSteps = 1000,
  options: ReduceOptions = {},
): ReductionResult {
  const terms: Term[] = [term]
  const steps: StepInfo[] = []
  let current = term
  for (let i = 0; i < maxSteps; i++) {
    const stepped = stepOnce(current, strategy, options)
    if (!stepped) {
      return { terms, steps, status: 'normal' }
    }
    steps.push({ redexPath: stepped.redexPath, kind: stepped.kind, note: stepped.note })
    terms.push(stepped.next)
    current = stepped.next
  }
  return { terms, steps, status: 'capped' }
}
