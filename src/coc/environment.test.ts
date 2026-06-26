import { describe, it, expect } from 'vitest'
import { parseCoCDefinition, buildEnv } from './environment'
import { defEqual } from './normalize'
import { toAscii } from './pretty'
import { parse } from './parser'
import { STD_DEFS } from './stdlib'
import type { CTerm } from './ast'

function p(src: string): CTerm {
  const r = parse(src)
  if (!r.ok) throw new Error(`parse failed: ${src}`)
  return r.term
}

describe('parseCoCDefinition', () => {
  it('parses an abbreviation (=)', () => {
    const r = parseCoCDefinition('Bool = forall (A : Prop), A -> A')
    expect(r.ok && r.def.kind).toBe('def')
    expect(r.ok && r.def.name).toBe('Bool')
  })

  it('accepts := as an alias for =', () => {
    const r = parseCoCDefinition('Bool := forall (A : Prop), A -> A')
    expect(r.ok && r.def.kind).toBe('def')
  })

  it('parses a postulate (:)', () => {
    const r = parseCoCDefinition('Color : Prop')
    expect(r.ok && r.def.kind).toBe('postulate')
    expect(r.ok && r.def.name).toBe('Color')
  })

  it('does not confuse the body arrow => with =', () => {
    const r = parseCoCDefinition('id = fun (A : Prop) (x : A) => x')
    expect(r.ok && r.def.kind).toBe('def')
    expect(r.ok && toAscii(r.def.rhs)).toBe('fun (A : Prop) => fun (x : A) => x')
  })

  it('rejects a line with no operator', () => {
    expect(parseCoCDefinition('just some words').ok).toBe(false)
  })
})

describe('buildEnv', () => {
  it('infers the type of an abbreviation', () => {
    const env = buildEnv(STD_DEFS, ['id = fun (A : Prop) (x : A) => x'])
    expect(env.errors).toHaveLength(0)
    const id = env.defs.find((d) => d.name === 'id')!
    expect(id.kind).toBe('def')
    expect(toAscii(id.type)).toBe('forall (A : Prop), A -> A')
    expect(env.bodies.has('id')).toBe(true)
  })

  it('adds a postulate and lets later defs use it', () => {
    const env = buildEnv(STD_DEFS, ['Color : Prop', 'red : Color'])
    expect(env.errors).toHaveLength(0)
    expect(env.context.some((b) => b.name === 'red')).toBe(true)
  })

  it('rejects a postulate whose declared type is not a type', () => {
    // `zero : Nat` is a value, not a type, so it cannot be a type annotation.
    const env = buildEnv(STD_DEFS, ['bad : zero'])
    expect(env.errors).toHaveLength(1)
    expect(env.defs.some((d) => d.name === 'bad')).toBe(false)
  })

  it('reports a type error in an abbreviation and keeps going', () => {
    const env = buildEnv(STD_DEFS, ['oops = succ Bool', 'ok = zero'])
    expect(env.errors).toHaveLength(1)
    expect(env.defs.some((d) => d.name === 'ok')).toBe(true)
  })

  it('lets δ-unfolding decide definitional equality (not true = false)', () => {
    const env = buildEnv(STD_DEFS, [
      'B = forall (A : Prop), A -> A -> A',
      'tt = fun (A : Prop) (t f : A) => t',
      'ff = fun (A : Prop) (t f : A) => f',
      'neg = fun (b : B) (A : Prop) (t f : A) => b A f t',
    ])
    expect(env.errors).toHaveLength(0)
    expect(defEqual(p('neg tt'), p('ff'), env.bodies)).toBe(true)
    expect(defEqual(p('neg tt'), p('tt'), env.bodies)).toBe(false)
  })
})
