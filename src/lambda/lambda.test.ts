import { describe, it, expect } from 'vitest'
import { parse } from './parser'
import { toAscii } from './pretty'
import { alphaEquiv } from './ast'
import type { Term } from './ast'
import { reduceMany, stepOnce } from './reduce'
import type { Strategy } from './reduce'
import { builtinEnvironment, BUILTIN_DEFINITIONS } from './builtins'
import { expand, parseDefinition } from './environment'
import { buildRecognizer, churchNumeral } from './recognize'

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

  it('POW TWO THREE equals MULT of TWOs (eight)', () => {
    expect(alphaEquiv(normalize('POW TWO THREE').term, normalize('MULT TWO FOUR').term)).toBe(true)
  })
})

describe('predecessor, subtraction and comparison', () => {
  it('PRED THREE equals TWO; PRED ZERO equals ZERO', () => {
    expect(alphaEquiv(normalize('PRED THREE').term, normalize('TWO').term)).toBe(true)
    expect(alphaEquiv(normalize('PRED ZERO').term, normalize('ZERO').term)).toBe(true)
  })

  it('SUB truncates at zero', () => {
    expect(alphaEquiv(normalize('SUB FOUR TWO').term, normalize('TWO').term)).toBe(true)
    expect(alphaEquiv(normalize('SUB TWO FOUR').term, normalize('ZERO').term)).toBe(true)
  })

  it('LEQ orders numerals', () => {
    expect(alphaEquiv(normalize('LEQ TWO THREE').term, normalize('TRUE').term)).toBe(true)
    expect(alphaEquiv(normalize('LEQ THREE TWO').term, normalize('FALSE').term)).toBe(true)
  })

  it('EQ tests numeric equality', () => {
    expect(alphaEquiv(normalize('EQ TWO TWO').term, normalize('TRUE').term)).toBe(true)
    expect(alphaEquiv(normalize('EQ ONE TWO').term, normalize('FALSE').term)).toBe(true)
  })

  it('XOR is exclusive or', () => {
    expect(alphaEquiv(normalize('XOR TRUE TRUE').term, normalize('FALSE').term)).toBe(true)
    expect(alphaEquiv(normalize('XOR TRUE FALSE').term, normalize('TRUE').term)).toBe(true)
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

describe('eta reduction', () => {
  it('reduces \\x. f x to f when eta is enabled', () => {
    const r = reduceMany(p('\\x. f x'), 'normal', 100, { eta: true })
    expect(alphaEquiv(r.terms[r.terms.length - 1], p('f'))).toBe(true)
    expect(r.steps.some((s) => s.kind === 'eta')).toBe(true)
  })

  it('does NOT eta-reduce when the variable is free in the function', () => {
    const r = reduceMany(p('\\x. x x'), 'normal', 100, { eta: true })
    expect(r.status).toBe('normal')
    expect(alphaEquiv(r.terms[r.terms.length - 1], p('\\x. x x'))).toBe(true)
  })

  it('leaves \\x. f x unchanged when eta is disabled (default)', () => {
    const r = reduceMany(p('\\x. f x'), 'normal', 100)
    expect(alphaEquiv(r.terms[r.terms.length - 1], p('\\x. f x'))).toBe(true)
  })
})

describe('alpha conversion steps', () => {
  it('emits an explicit alpha step before a capturing beta reduction', () => {
    const r = reduceMany(p('(\\x y. x) y'), 'normal', 100, { showAlpha: true })
    expect(r.steps.some((s) => s.kind === 'alpha')).toBe(true)
    // The final result is still correct: the bound y was renamed, not captured.
    expect(alphaEquiv(r.terms[r.terms.length - 1], p('\\z. y'))).toBe(true)
  })

  it('does not emit an alpha step when no capture would occur', () => {
    const r = reduceMany(p('(\\x. x) y'), 'normal', 100, { showAlpha: true })
    expect(r.steps.some((s) => s.kind === 'alpha')).toBe(false)
  })

  it('produces the same result with and without explicit alpha steps', () => {
    const withAlpha = reduceMany(p('(\\x y. x) y'), 'normal', 100, { showAlpha: true })
    const without = reduceMany(p('(\\x y. x) y'), 'normal', 100)
    const a = withAlpha.terms[withAlpha.terms.length - 1]
    const b = without.terms[without.terms.length - 1]
    expect(alphaEquiv(a, b)).toBe(true)
  })
})

describe('Church numeral detection', () => {
  it('recognises numerals 0..3 regardless of variable names', () => {
    expect(churchNumeral(p('\\f x. x'))).toBe(0)
    expect(churchNumeral(p('\\g y. g y'))).toBe(1)
    expect(churchNumeral(p('\\f x. f (f x)'))).toBe(2)
    expect(churchNumeral(p('\\f x. f (f (f x))'))).toBe(3)
  })

  it('returns null for non-numerals', () => {
    expect(churchNumeral(p('\\x. x'))).toBeNull() // identity, not a numeral
    expect(churchNumeral(p('\\f x. x x'))).toBeNull()
    expect(churchNumeral(p('a b'))).toBeNull()
  })
})

describe('result recognition (folding)', () => {
  const env = builtinEnvironment()
  const rec = buildRecognizer(BUILTIN_DEFINITIONS, env)

  // Recognise the β-normal form of a source expression.
  const recognizeNF = (src: string) => {
    const nf = reduceMany(expand(p(src), env), 'normal', 2000)
    return rec.recognize(nf.terms[nf.terms.length - 1])
  }

  it('folds PLUS ONE ONE back to TWO', () => {
    const r = recognizeNF('PLUS ONE ONE')
    expect(r.names).toContain('TWO')
    expect(r.churchNumeral).toBe(2)
  })

  it('recognises a numeral with no matching name (MULT TWO THREE = 6)', () => {
    const r = recognizeNF('MULT TWO THREE')
    expect(r.churchNumeral).toBe(6)
  })

  it('folds S K K back to the identity I', () => {
    const r = recognizeNF('S K K')
    expect(r.names).toContain('I')
  })

  it('recognises ZERO and FALSE as the same term', () => {
    const r = recognizeNF('ZERO')
    expect(r.names).toContain('ZERO')
    expect(r.names).toContain('FALSE')
  })

  it('recognises a user definition that references built-ins', () => {
    const userEnv = builtinEnvironment()
    const six = parseDefinition('SIX = MULT TWO THREE')
    if (!six.ok) throw new Error('bad def')
    userEnv.set(six.name, six.term)
    const recognizer = buildRecognizer(
      [...BUILTIN_DEFINITIONS, { name: six.name, source: 'MULT TWO THREE', term: six.term }],
      userEnv,
    )
    const nf = reduceMany(expand(p('MULT THREE TWO'), userEnv), 'normal', 2000)
    expect(recognizer.recognize(nf.terms[nf.terms.length - 1]).names).toContain('SIX')
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
