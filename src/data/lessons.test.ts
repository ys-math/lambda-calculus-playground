import { describe, it, expect } from 'vitest'
import katex from 'katex'
import { LESSONS } from './lessons'

describe('lesson content', () => {
  it('every math block renders as valid KaTeX', () => {
    for (const lesson of LESSONS) {
      for (const block of lesson.blocks) {
        if (block.kind !== 'math') continue
        expect(
          () => katex.renderToString(block.latex, { throwOnError: true, strict: 'error' }),
          `lesson "${lesson.id}" has invalid LaTeX: ${block.latex}`,
        ).not.toThrow()
      }
    }
  })

  it('has both sections with lessons', () => {
    expect(LESSONS.some((l) => l.section === 'untyped')).toBe(true)
    expect(LESSONS.some((l) => l.section === 'typed')).toBe(true)
  })
})
