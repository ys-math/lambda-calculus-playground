import { describe, it, expect } from 'vitest'
import { addFormula, removeFormula, isSaved } from './savedFormulas'

describe('saved formulas', () => {
  it('adds a formula to the front', () => {
    expect(addFormula([], 'x')).toEqual(['x'])
    expect(addFormula(['a'], 'b')).toEqual(['b', 'a'])
  })

  it('trims whitespace and ignores empty input', () => {
    expect(addFormula([], '  \\x. x  ')).toEqual(['\\x. x'])
    expect(addFormula(['a'], '   ')).toEqual(['a'])
    expect(addFormula(['a'], '')).toEqual(['a'])
  })

  it('moves an existing formula to the front instead of duplicating', () => {
    expect(addFormula(['a', 'b', 'c'], 'c')).toEqual(['c', 'a', 'b'])
    expect(addFormula(['a', 'b'], 'a')).toEqual(['a', 'b'])
  })

  it('removes a formula by exact match', () => {
    expect(removeFormula(['a', 'b', 'c'], 'b')).toEqual(['a', 'c'])
    expect(removeFormula(['a'], 'missing')).toEqual(['a'])
  })

  it('reports whether a formula is already saved (trimmed)', () => {
    expect(isSaved(['\\x. x'], '  \\x. x ')).toBe(true)
    expect(isSaved(['a'], 'b')).toBe(false)
  })

  it('caps the list length', () => {
    const many = Array.from({ length: 100 }, (_, i) => `f${i}`)
    const result = addFormula(many, 'new')
    expect(result.length).toBe(100)
    expect(result[0]).toBe('new')
    expect(result).not.toContain('f99')
  })
})
