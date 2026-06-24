// Type inference for the simply typed lambda calculus (Algorithm W style).
//
// Given an untyped Term, infer its principal simple type and record the full
// typing derivation (a proof tree of the typing rules). Because the system has
// only type variables and arrows, unification fails *only* via the occurs check
// — so "type error" always means "not simply typable" (it would need an
// infinite type), which is exactly the case for self-application.

import type { Term } from './ast'
import { mkVar } from './ast'
import { freeVars } from './freeVars'
import { toLatex } from './pretty'
import type { NameMap, Subst, Type } from './types'
import { applySubst, normalizeNames, tArrow, tVar, typeToLatex } from './types'
import { unify } from './unify'

type Ctx = Map<string, Type>

export type Rule = 'var' | 'absI' | 'appE'

export interface Judgment {
  ctx: Ctx
  term: Term
  type: Type
}

export interface Derivation {
  judgment: Judgment
  rule: Rule
  premises: Derivation[]
}

export type InferResult =
  | { ok: true; type: Type; derivation: Derivation; names: NameMap }
  | { ok: false; error: string }

type Step =
  | { ok: true; type: Type; subst: Subst; derivation: Derivation }
  | { ok: false; error: string }

const NOT_TYPABLE =
  'This term is not simply typable — it would require an infinite type (e.g. self-application x x).'

// Infer the type of a term. Free variables are each given a fresh type variable
// (shared across their occurrences), matching "the type of the term as written".
export function infer(term: Term): InferResult {
  let counter = 0
  const fresh = (): Type => tVar(counter++)

  // Seed the context with one fresh variable per free variable.
  const ctx: Ctx = new Map()
  for (const name of freeVars(term)) ctx.set(name, fresh())

  const go = (t: Term, c: Ctx, subst: Subst): Step => {
    switch (t.kind) {
      case 'var': {
        const ty = c.get(t.name) ?? fresh()
        return { ok: true, type: ty, subst, derivation: node(c, t, ty, 'var', []) }
      }
      case 'abs': {
        const argTy = fresh()
        const c2: Ctx = new Map(c)
        c2.set(t.param, argTy)
        const body = go(t.body, c2, subst)
        if (!body.ok) return body
        const fnTy = tArrow(argTy, body.type)
        return {
          ok: true,
          type: fnTy,
          subst: body.subst,
          derivation: node(c, t, fnTy, 'absI', [body.derivation]),
        }
      }
      case 'app': {
        const fn = go(t.func, c, subst)
        if (!fn.ok) return fn
        const arg = go(t.arg, c, fn.subst)
        if (!arg.ok) return arg
        const resultTy = fresh()
        const u = unify(fn.type, tArrow(arg.type, resultTy), arg.subst)
        if (!u.ok) return { ok: false, error: NOT_TYPABLE }
        return {
          ok: true,
          type: resultTy,
          subst: u.subst,
          derivation: node(c, t, resultTy, 'appE', [fn.derivation, arg.derivation]),
        }
      }
    }
  }

  const result = go(term, ctx, new Map())
  if (!result.ok) return { ok: false, error: result.error }

  // Apply the final substitution everywhere so displayed types are principal,
  // then build one consistent name map (a, b, c, …) for the whole tree.
  const resolved = resolveDerivation(result.derivation, result.subst)
  const names: NameMap = new Map()
  collectNames(resolved, names)
  return { ok: true, type: applySubst(result.type, result.subst), derivation: resolved, names }
}

const node = (ctx: Ctx, term: Term, type: Type, rule: Rule, premises: Derivation[]): Derivation => ({
  judgment: { ctx, term, type },
  rule,
  premises,
})

// Rebuild a derivation with the substitution applied to every type and context.
function resolveDerivation(d: Derivation, subst: Subst): Derivation {
  const ctx: Ctx = new Map()
  for (const [name, ty] of d.judgment.ctx) ctx.set(name, applySubst(ty, subst))
  return {
    judgment: { ctx, term: d.judgment.term, type: applySubst(d.judgment.type, subst) },
    rule: d.rule,
    premises: d.premises.map((p) => resolveDerivation(p, subst)),
  }
}

// Walk the tree assigning display names in order of first appearance.
function collectNames(d: Derivation, names: NameMap): void {
  for (const ty of d.judgment.ctx.values()) normalizeNames(ty, names)
  normalizeNames(d.judgment.type, names)
  for (const p of d.premises) collectNames(p, names)
}

// --- LaTeX rendering of the derivation tree --------------------------------

const RULE_LABEL: Record<Rule, string> = {
  var: '\\mathsf{var}',
  absI: '{\\to}\\mathsf{I}',
  appE: '{\\to}\\mathsf{E}',
}

function ctxToLatex(ctx: Ctx, names: NameMap): string {
  const parts: string[] = []
  for (const [name, ty] of ctx) {
    parts.push(`${toLatex(mkVar(name))} {:}\\, ${typeToLatex(ty, names)}`)
  }
  return parts.join(',\\, ')
}

function judgmentToLatex(j: Judgment, names: NameMap): string {
  const gamma = ctxToLatex(j.ctx, names)
  const turnstile = gamma ? `${gamma} \\vdash` : '\\vdash'
  return `${turnstile} ${toLatex(j.term)} : ${typeToLatex(j.type, names)}`
}

// Render the derivation as nested \dfrac fractions: premises stacked over the
// conclusion, with the rule name to the right. Axioms (var) have an empty
// numerator, drawing the usual inference-rule bar.
export function derivationToLatex(d: Derivation, names: NameMap): string {
  const concl = judgmentToLatex(d.judgment, names)
  const label = `\\;(${RULE_LABEL[d.rule]})`
  if (d.premises.length === 0) {
    // Axiom: a rule bar over the conclusion with an empty (thin-space) numerator.
    // (KaTeX has no \strut, so use \; for a little vertical breathing room.)
    return `\\dfrac{\\;}{${concl}}${label}`
  }
  const top = d.premises.map((p) => derivationToLatex(p, names)).join('\\qquad ')
  return `\\dfrac{${top}}{${concl}}${label}`
}
