import { describe, it, expect } from 'vitest'
import { parse } from './parser'
import { check } from './check'
import { toAscii } from './pretty'
import { normalize } from './normalize'
import { alphaEquiv } from './ast'
import { STD_CONTEXT } from './stdlib'
import type { CTerm } from './ast'
import { LESSONS } from '../data/lessons'
import { COC_EXAMPLE_GROUPS } from '../data/cocExamples'

function p(src: string): CTerm {
  const r = parse(src)
  if (!r.ok) throw new Error(`parse failed: ${src} — ${r.error.message}`)
  return r.term
}

function typeOf(src: string, withStd = false): string {
  const r = check(p(src), withStd ? STD_CONTEXT : [])
  if (!r.ok) throw new Error(`type error: ${src} — ${r.error}`)
  return toAscii(r.type)
}

describe('CoC parser', () => {
  it('round-trips fun / forall / arrow', () => {
    expect(toAscii(p('fun (A : Prop) (x : A) => x'))).toBe('fun (A : Prop) => fun (x : A) => x')
    expect(toAscii(p('forall (A : Prop), A -> A'))).toBe('forall (A : Prop), A -> A')
    expect(toAscii(p('A -> B -> C'))).toBe('A -> B -> C')
    expect(toAscii(p('(A -> B) -> C'))).toBe('(A -> B) -> C')
  })

  it('accepts the \\ and λ and ∀ aliases', () => {
    expect(alphaEquiv(p('\\x : A. x'), p('fun (x : A) => x'))).toBe(true)
    expect(alphaEquiv(p('∀ (A : Prop), A'), p('forall (A : Prop), A'))).toBe(true)
  })
})

describe('CoC type checker', () => {
  it('types the polymorphic identity', () => {
    expect(typeOf('fun (A : Prop) (x : A) => x')).toBe('forall (A : Prop), A -> A')
  })

  it('types K (const)', () => {
    expect(typeOf('fun (A B : Prop) (x : A) (y : B) => x')).toBe(
      'forall (A : Prop), forall (B : Prop), A -> B -> A',
    )
  })

  it('instantiates a polymorphic function (dependent application)', () => {
    expect(typeOf('(fun (A : Prop) (x : A) => x) Bool', true)).toBe('Bool -> Bool')
  })

  it('Prop has type Type', () => {
    expect(typeOf('Prop')).toBe('Type')
  })

  it('uses the standard context', () => {
    expect(typeOf('succ (succ zero)', true)).toBe('Nat')
  })

  it('types Church numerals and booleans', () => {
    expect(typeOf('fun (A : Prop) (f : A -> A) (x : A) => f (f x)')).toBe(
      'forall (A : Prop), (A -> A) -> A -> A',
    )
    expect(typeOf('fun (A : Prop) (t : A) (f : A) => t')).toBe('forall (A : Prop), A -> A -> A')
  })

  it('rejects an unbound variable', () => {
    const r = check(p('fun (x : A) => x'))
    expect(r.ok).toBe(false)
  })

  it('rejects applying a non-function', () => {
    const r = check(p('fun (A : Prop) (x : A) => x x'))
    expect(r.ok).toBe(false)
  })

  it('rejects a type mismatch in application', () => {
    const r = check(p('(fun (x : Bool) => x) zero'), STD_CONTEXT)
    expect(r.ok).toBe(false)
  })

  it('Type itself has no type', () => {
    const r = check(p('Type'))
    expect(r.ok).toBe(false)
  })
})

describe('CoC normalisation', () => {
  it('beta-reduces an application', () => {
    expect(toAscii(normalize(p('(fun (A : Prop) (x : A) => x) Bool')))).toBe(
      'fun (x : Bool) => x',
    )
  })

  it('normalises under binders', () => {
    expect(
      alphaEquiv(
        normalize(p('fun (A : Prop) => (fun (x : A) => x)')),
        p('fun (A : Prop) (x : A) => x'),
      ),
    ).toBe(true)
  })
})

describe('CoC content type-checks', () => {
  const exprs: string[] = []
  for (const g of COC_EXAMPLE_GROUPS) for (const e of g.examples) exprs.push(e.expr)
  for (const l of LESSONS) {
    if (l.section !== 'coc') continue
    for (const b of l.blocks) if (b.kind === 'try') exprs.push(b.expr)
  }

  it.each(exprs)('type-checks: %s', (expr) => {
    const parsed = parse(expr)
    expect(parsed.ok, `parse failed: ${expr}`).toBe(true)
    if (!parsed.ok) return
    const r = check(parsed.term, STD_CONTEXT)
    expect(r.ok, `type error: ${expr} — ${r.ok ? '' : r.error}`).toBe(true)
  })
})
