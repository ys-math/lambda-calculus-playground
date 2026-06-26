// Step-by-step reduction for the Calculus of Constructions, used by the stepper
// UI. Each step is a single contraction the learner can watch:
//   - β (beta)  : apply a lambda, (λ(x:A). M) N  →  [x := N] M
//   - δ (delta) : unfold a definition, replacing a defined name by its body
//
// Strategy: prefer β. We fire the leftmost-outermost β-redex anywhere in the
// term; only when no β-redex remains do we unfold the leftmost-outermost
// definition (δ). This yields readable traces like
//   not true  →[δ unfold not]  (λ(b:Bool). …) true  →[β]  …  →  false
// Postulated constants (no body in `defs`) are never unfolded.

import type { CTerm } from './ast'
import { cApp, cLam, cPi } from './ast'
import type { CBranch, CPath } from './pretty'
import type { Defs } from './normalize'
import { subst } from './normalize'

export type CoCStepKind = 'beta' | 'delta'

export interface CoCRedex {
  path: CPath
  kind: CoCStepKind
  // For δ: the name being unfolded (for the step label).
  name?: string
}

const isBetaRedex = (t: CTerm): boolean => t.kind === 'app' && t.func.kind === 'lam'

// Find the leftmost-outermost β-redex, or null. Descends into every sub-term so
// reduction reaches full normal form (including under binders).
function findBeta(t: CTerm, path: CPath): CoCRedex | null {
  if (isBetaRedex(t)) return { path, kind: 'beta' }
  switch (t.kind) {
    case 'var':
    case 'sort':
      return null
    case 'app':
      return (
        findBeta(t.func, [...path, 'func']) ?? findBeta(t.arg, [...path, 'arg'])
      )
    case 'lam':
      return (
        findBeta(t.domain, [...path, 'domain']) ?? findBeta(t.body, [...path, 'body'])
      )
    case 'pi':
      return (
        findBeta(t.domain, [...path, 'domain']) ??
        findBeta(t.codomain, [...path, 'codomain'])
      )
  }
}

// Find the leftmost-outermost defined-variable occurrence (a δ-redex), or null.
function findDelta(t: CTerm, path: CPath, defs: Defs): CoCRedex | null {
  switch (t.kind) {
    case 'var':
      return defs.has(t.name) ? { path, kind: 'delta', name: t.name } : null
    case 'sort':
      return null
    case 'app':
      return (
        findDelta(t.func, [...path, 'func'], defs) ??
        findDelta(t.arg, [...path, 'arg'], defs)
      )
    case 'lam':
      return (
        findDelta(t.domain, [...path, 'domain'], defs) ??
        findDelta(t.body, [...path, 'body'], defs)
      )
    case 'pi':
      return (
        findDelta(t.domain, [...path, 'domain'], defs) ??
        findDelta(t.codomain, [...path, 'codomain'], defs)
      )
  }
}

// The next redex to contract: β first, then δ.
export function findRedex(term: CTerm, defs: Defs): CoCRedex | null {
  return findBeta(term, []) ?? findDelta(term, [], defs)
}

function subtermAt(t: CTerm, path: CPath): CTerm {
  let cur = t
  for (const b of path) cur = childAt(cur, b)
  return cur
}

function childAt(t: CTerm, b: CBranch): CTerm {
  if (t.kind === 'app' && b === 'func') return t.func
  if (t.kind === 'app' && b === 'arg') return t.arg
  if (t.kind === 'lam' && b === 'domain') return t.domain
  if (t.kind === 'lam' && b === 'body') return t.body
  if (t.kind === 'pi' && b === 'domain') return t.domain
  if (t.kind === 'pi' && b === 'codomain') return t.codomain
  throw new Error(`bad path branch ${b} into ${t.kind}`)
}

// Rebuild `t` with the sub-term at `path` replaced by `replacement`.
function replaceAt(t: CTerm, path: CPath, replacement: CTerm): CTerm {
  if (path.length === 0) return replacement
  const [head, ...rest] = path
  switch (t.kind) {
    case 'app':
      if (head === 'func') return cApp(replaceAt(t.func, rest, replacement), t.arg)
      if (head === 'arg') return cApp(t.func, replaceAt(t.arg, rest, replacement))
      break
    case 'lam':
      if (head === 'domain') return cLam(t.param, replaceAt(t.domain, rest, replacement), t.body)
      if (head === 'body') return cLam(t.param, t.domain, replaceAt(t.body, rest, replacement))
      break
    case 'pi':
      if (head === 'domain') return cPi(t.param, replaceAt(t.domain, rest, replacement), t.codomain)
      if (head === 'codomain') return cPi(t.param, t.domain, replaceAt(t.codomain, rest, replacement))
      break
  }
  throw new Error(`bad path branch ${head} into ${t.kind}`)
}

export interface CoCStep {
  redexPath: CPath
  kind: CoCStepKind
  note?: string
}

export interface CoCStepResult {
  next: CTerm
  redexPath: CPath
  kind: CoCStepKind
  note?: string
}

// Perform a single contraction, or null at normal form.
export function stepOnce(term: CTerm, defs: Defs): CoCStepResult | null {
  const found = findRedex(term, defs)
  if (!found) return null
  const node = subtermAt(term, found.path)

  if (found.kind === 'beta') {
    if (node.kind !== 'app' || node.func.kind !== 'lam') throw new Error('inconsistent β-redex')
    const contracted = subst(node.func.body, node.func.param, node.arg)
    return { next: replaceAt(term, found.path, contracted), redexPath: found.path, kind: 'beta' }
  }

  // δ: unfold the definition body in place.
  const body = defs.get(found.name!)!
  return {
    next: replaceAt(term, found.path, body),
    redexPath: found.path,
    kind: 'delta',
    note: `unfold ${found.name}`,
  }
}

export interface CoCReduction {
  // terms[0] is the original; each later term is the result of one step.
  terms: CTerm[]
  // steps[i] describes the contraction from terms[i] to terms[i+1].
  steps: CoCStep[]
  // 'normal' : reached a normal form. 'capped' : hit maxSteps (possible loop).
  status: 'normal' | 'capped'
}

// Drive reduction to normal form (or until maxSteps), recording every step.
export function reduceMany(term: CTerm, defs: Defs, maxSteps = 200): CoCReduction {
  const terms: CTerm[] = [term]
  const steps: CoCStep[] = []
  let current = term
  for (let i = 0; i < maxSteps; i++) {
    const stepped = stepOnce(current, defs)
    if (!stepped) return { terms, steps, status: 'normal' }
    steps.push({ redexPath: stepped.redexPath, kind: stepped.kind, note: stepped.note })
    terms.push(stepped.next)
    current = stepped.next
  }
  return { terms, steps, status: 'capped' }
}
