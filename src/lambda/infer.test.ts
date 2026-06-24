import { describe, it, expect } from 'vitest'
import katex from 'katex'
import { parse } from './parser'
import { infer, derivationToLatex } from './infer'
import { typeToAscii, tVar, tArrow } from './types'
import { unify } from './unify'

// Infer and render the principal type as ASCII (names normalised a, b, c, …).
function typeOf(src: string): string {
  const p = parse(src)
  if (!p.ok) throw new Error(`parse failed: ${p.error.message}`)
  const r = infer(p.term)
  if (!r.ok) throw new Error(`expected typable but got: ${r.error}`)
  return typeToAscii(r.type, r.names)
}

function typable(src: string): boolean {
  const p = parse(src)
  if (!p.ok) throw new Error(`parse failed: ${p.error.message}`)
  return infer(p.term).ok
}

describe('type inference', () => {
  it('types the identity', () => {
    expect(typeOf('\\x. x')).toBe('a -> a')
  })

  it('types application abstraction', () => {
    expect(typeOf('\\f x. f x')).toBe('(a -> b) -> a -> b')
  })

  it('types the K and KI combinators', () => {
    expect(typeOf('\\x y. x')).toBe('a -> b -> a')
    expect(typeOf('\\x y. y')).toBe('a -> b -> b')
  })

  it('types composition', () => {
    expect(typeOf('\\f g x. f (g x)')).toBe('(a -> b) -> (c -> a) -> c -> b')
  })

  it('types the S combinator', () => {
    expect(typeOf('\\f g x. f x (g x)')).toBe('(a -> b -> c) -> (a -> b) -> a -> c')
  })

  it('shares the type of a repeated free variable', () => {
    // f is applied to its own result, forcing f : a -> a.
    expect(typeOf('f (f x)')).toBe('a')
    expect(typable('f (f x)')).toBe(true)
  })

  it('rejects self-application (occurs check)', () => {
    expect(typable('\\x. x x')).toBe(false)
  })

  it('rejects the diverging combinator term', () => {
    expect(typable('(\\x. x x) (\\y. y)')).toBe(false)
  })
})

describe('derivation renders as valid KaTeX', () => {
  // Guards against unsupported KaTeX commands (e.g. \strut) sneaking into the
  // derivation LaTeX. strict:'error' turns questionable usage into a throw.
  it('renders every rule shape without errors', () => {
    for (const src of ['\\x. x', '\\f x. f x', '\\x y. x', 'f (g x)', 'PLUS ONE ONE']) {
      const p = parse(src)
      if (!p.ok) throw new Error(`parse failed: ${src}`)
      const r = infer(p.term)
      if (!r.ok) throw new Error(`expected typable: ${src}`)
      const latex = derivationToLatex(r.derivation, r.names)
      expect(() =>
        katex.renderToString(latex, { throwOnError: true, strict: 'error' }),
      ).not.toThrow()
    }
  })
})

describe('unification', () => {
  it('unifies a variable with a type', () => {
    const r = unify(tVar(0), tArrow(tVar(1), tVar(2)))
    expect(r.ok).toBe(true)
  })

  it('unifies two arrows structurally', () => {
    const r = unify(tArrow(tVar(0), tVar(1)), tArrow(tVar(2), tVar(3)))
    expect(r.ok).toBe(true)
  })

  it('fails the occurs check', () => {
    const r = unify(tVar(0), tArrow(tVar(0), tVar(1)))
    expect(r.ok).toBe(false)
  })
})
