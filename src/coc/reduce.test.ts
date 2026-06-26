import { describe, it, expect } from 'vitest'
import { parse } from './parser'
import { reduceMany, stepOnce } from './reduce'
import { buildEnv } from './environment'
import { normalize, ReductionLimitError, type Defs } from './normalize'
import { alphaEquiv, cVar, type CTerm } from './ast'
import { STD_DEFS } from './stdlib'

function p(src: string): CTerm {
  const r = parse(src)
  if (!r.ok) throw new Error(`parse failed: ${src} — ${r.error.message}`)
  return r.term
}

describe('CoC reduction steps', () => {
  it('β-reduces an application to normal form', () => {
    const { bodies } = buildEnv(STD_DEFS, [])
    const r = reduceMany(p('(fun (A : Prop) (x : A) => x) Bool'), bodies)
    expect(r.status).toBe('normal')
    expect(r.steps.map((s) => s.kind)).toEqual(['beta'])
    expect(alphaEquiv(r.terms[r.terms.length - 1], p('fun (x : Bool) => x'))).toBe(true)
  })

  it('unfolds a definition (δ) before reducing (β)', () => {
    const { bodies } = buildEnv(STD_DEFS, ['id = fun (A : Prop) (x : A) => x'])
    const r = reduceMany(p('id Bool'), bodies)
    expect(r.status).toBe('normal')
    expect(r.steps.map((s) => s.kind)).toEqual(['delta', 'beta'])
    expect(r.steps[0].note).toBe('unfold id')
    expect(alphaEquiv(r.terms[r.terms.length - 1], p('fun (x : Bool) => x'))).toBe(true)
  })

  it('computes not true = false with Church booleans', () => {
    const { bodies } = buildEnv(STD_DEFS, [
      'B = forall (A : Prop), A -> A -> A',
      'tt = fun (A : Prop) (t f : A) => t',
      'ff = fun (A : Prop) (t f : A) => f',
      'neg = fun (b : B) (A : Prop) (t f : A) => b A f t',
    ])
    const r = reduceMany(p('neg tt'), bodies)
    expect(r.status).toBe('normal')
    expect(r.steps.some((s) => s.kind === 'delta')).toBe(true)
    expect(r.steps.some((s) => s.kind === 'beta')).toBe(true)
    expect(alphaEquiv(r.terms[r.terms.length - 1], normalize(p('ff'), bodies))).toBe(true)
  })

  it('stepOnce returns null at a normal form', () => {
    const { bodies } = buildEnv(STD_DEFS, [])
    expect(stepOnce(p('fun (x : Bool) => x'), bodies)).toBeNull()
  })

  it('caps a cyclic δ-environment instead of looping forever', () => {
    // A pathological (untypable) environment: a unfolds to b and b to a.
    const cyclic: Defs = new Map([
      ['a', cVar('b')],
      ['b', cVar('a')],
    ])
    const r = reduceMany(cVar('a'), cyclic, 50)
    expect(r.status).toBe('capped')
    expect(() => normalize(cVar('a'), cyclic)).toThrow(ReductionLimitError)
  })
})
