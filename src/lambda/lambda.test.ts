import { describe, it, expect } from 'vitest'
import { parse } from './parser'
import { toAscii } from './pretty'
import { alphaEquiv } from './ast'
import type { Term } from './ast'
import { reduceMany, stepOnce } from './reduce'
import type { Strategy } from './reduce'
import { builtinEnvironment } from './builtins'
import { expand, parseDefinition } from './environment'

// Parse helper that throws on error — convenient for tests.
function p(src: string): Term {
  const r = parse(src)
  if (!r.ok) throw new Error(`parse failed: ${r.error.message} @${r.error.pos}`)
  return r.term
}

// Reduce a source string to normal form under a strategy, returning the result.
function normalize(src: string, strategy: Strategy = 'normal'): { term: Term; status: string } {
  const env = builtinEnvironment()
  const expanded = expand(p(src), env)
  const r = reduceMany(expanded, strategy, 2000)
  return { term: r.terms[r.terms.length - 1], status: r.status }
}

describe('parser', () => {
  it('parses a simple abstraction', () => {
    expect(toAscii(p('\\x. x'))).toBe('\\x. x')
  })

  it('accepts the unicode lambda', () => {
    expect(alphaEquiv(p('λx. x'), p('\\x. x'))).toBe(true)
  })

  it('desugars multiple binders', () => {
    expect(alphaEquiv(p('\\x y z. x'), p('\\x. \\y. \\z. x'))).toBe(true)
  })

  it('treats application as left-associative', () => {
    expect(alphaEquiv(p('a b c'), p('(a b) c'))).toBe(true)
  })

  it('extends abstraction body as far right as possible', () => {
    expect(alphaEquiv(p('\\x. f x y'), p('\\x. ((f x) y)'))).toBe(true)
  })

  it('reports an error for unbalanced parens', () => {
    const r = parse('(\\x. x')
    expect(r.ok).toBe(false)
  })

  it('reports an error for a bare lambda', () => {
    const r = parse('\\. x')
    expect(r.ok).toBe(false)
  })
})

describe('beta reduction', () => {
  it('reduces the identity application', () => {
    expect(alphaEquiv(normalize('(\\x. x) y').term, p('y'))).toBe(true)
  })

  it('reduces K a b to a', () => {
    expect(alphaEquiv(normalize('(\\x y. x) a b').term, p('a'))).toBe(true)
  })

  it('avoids variable capture', () => {
    // (\x y. x) y  must NOT become \y. y; the bound y is renamed.
    const result = normalize('(\\x y. x) y').term
    expect(alphaEquiv(result, p('\\z. y'))).toBe(true)
    // And explicitly: it is not the identity.
    expect(alphaEquiv(result, p('\\z. z'))).toBe(false)
  })

  it('stepOnce returns null on a normal form', () => {
    expect(stepOnce(p('\\x. x'), 'normal')).toBeNull()
  })
})

describe('Church arithmetic', () => {
  it('SUCC ZERO equals ONE', () => {
    expect(alphaEquiv(normalize('SUCC ZERO').term, normalize('ONE').term)).toBe(true)
  })

  it('PLUS ONE ONE equals TWO', () => {
    expect(alphaEquiv(normalize('PLUS ONE ONE').term, normalize('TWO').term)).toBe(true)
  })

  it('MULT TWO THREE equals SUCC of PLUS', () => {
    const six = normalize('MULT TWO THREE').term
    const alsoSix = normalize('PLUS THREE THREE').term
    expect(alphaEquiv(six, alsoSix)).toBe(true)
  })

  it('ISZERO ZERO is TRUE, ISZERO ONE is FALSE', () => {
    expect(alphaEquiv(normalize('ISZERO ZERO').term, normalize('TRUE').term)).toBe(true)
    expect(alphaEquiv(normalize('ISZERO ONE').term, normalize('FALSE').term)).toBe(true)
  })
})

describe('booleans and pairs', () => {
  it('AND TRUE FALSE is FALSE', () => {
    expect(alphaEquiv(normalize('AND TRUE FALSE').term, normalize('FALSE').term)).toBe(true)
  })

  it('FST (PAIR a b) is a', () => {
    expect(alphaEquiv(normalize('FST (PAIR a b)').term, p('a'))).toBe(true)
  })
})

describe('reduction strategies', () => {
  it('normal order terminates where applicative order diverges', () => {
    // (\x y. y) OMEGA : normal order discards the diverging argument.
    const normal = normalize('(\\a b. b) OMEGA', 'normal')
    expect(normal.status).toBe('normal')
    expect(alphaEquiv(normal.term, p('\\b. b'))).toBe(true)

    // Applicative order tries to reduce OMEGA first and never finishes.
    const applicative = normalize('(\\a b. b) OMEGA', 'applicative')
    expect(applicative.status).toBe('capped')
  })
})

describe('definitions', () => {
  it('parses a NAME = expr definition', () => {
    const d = parseDefinition('DOUBLE = \\f x. f (f x)')
    expect(d.ok).toBe(true)
  })

  it('rejects a definition with an invalid name', () => {
    const d = parseDefinition('1bad = x')
    expect(d.ok).toBe(false)
  })

  it('does not expand shadowed names', () => {
    // Here TRUE is locally bound, so it must not expand to the boolean.
    const env = builtinEnvironment()
    const expanded = expand(p('\\TRUE. TRUE'), env)
    expect(alphaEquiv(expanded, p('\\TRUE. TRUE'))).toBe(true)
  })
})
