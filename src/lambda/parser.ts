// Recursive-descent parser for the untyped lambda calculus.
//
// Grammar (standard conventions):
//   term        := application
//   application := atom atom*                 (left-associative)
//   atom        := variable
//                | '(' term ')'
//                | lambda idents '.' term     (body extends as far right as possible)
//   lambda      := '\' | 'λ'
//
// `\x y. M` is sugar for `\x. \y. M` (multiple binders).
//
// Parsing returns a Result so callers (the UI) can render friendly errors with a
// source position instead of catching thrown exceptions.

import type { Term } from './ast'
import { mkAbs, mkApp, mkVar } from './ast'
import { lex } from './lexer'
import type { Token } from './lexer'

export interface ParseError {
  message: string
  pos: number
}

export type ParseResult =
  | { ok: true; term: Term }
  | { ok: false; error: ParseError }

class Parser {
  private pos = 0
  private readonly tokens: Token[]
  private readonly srcLen: number

  constructor(tokens: Token[], srcLen: number) {
    this.tokens = tokens
    this.srcLen = srcLen
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos]
  }

  private next(): Token | undefined {
    return this.tokens[this.pos++]
  }

  private errorPos(): number {
    const t = this.peek()
    return t ? t.pos : this.srcLen
  }

  // term := application
  parseTerm(): Term {
    return this.parseApplication()
  }

  // application := atom atom*
  private parseApplication(): Term {
    let left = this.parseAtom()
    // Keep consuming atoms while the next token can start one.
    while (this.startsAtom()) {
      const right = this.parseAtom()
      left = mkApp(left, right)
    }
    return left
  }

  private startsAtom(): boolean {
    const t = this.peek()
    if (!t) return false
    return t.type === 'ident' || t.type === 'lparen' || t.type === 'lambda'
  }

  // atom := variable | '(' term ')' | lambda idents '.' term
  private parseAtom(): Term {
    const t = this.peek()
    if (!t) {
      throw { message: 'Unexpected end of input', pos: this.srcLen } as ParseError
    }
    switch (t.type) {
      case 'ident':
        this.next()
        return mkVar(t.value)

      case 'lparen': {
        this.next()
        const inner = this.parseTerm()
        const close = this.next()
        if (!close || close.type !== 'rparen') {
          throw {
            message: 'Expected ")"',
            pos: close ? close.pos : this.srcLen,
          } as ParseError
        }
        return inner
      }

      case 'lambda':
        return this.parseAbstraction()

      default:
        throw {
          message: `Unexpected "${t.value}"`,
          pos: t.pos,
        } as ParseError
    }
  }

  // lambda idents '.' term  (at least one binder required)
  private parseAbstraction(): Term {
    this.next() // consume lambda
    const params: string[] = []
    while (this.peek()?.type === 'ident') {
      params.push(this.next()!.value)
    }
    if (params.length === 0) {
      throw {
        message: 'Expected a variable name after λ',
        pos: this.errorPos(),
      } as ParseError
    }
    const dot = this.next()
    if (!dot || dot.type !== 'dot') {
      throw {
        message: 'Expected "." after lambda binders',
        pos: dot ? dot.pos : this.srcLen,
      } as ParseError
    }
    const body = this.parseTerm()
    // Desugar multiple binders right-to-left: \x y. M => \x. (\y. M)
    let result = body
    for (let i = params.length - 1; i >= 0; i--) {
      result = mkAbs(params[i], result)
    }
    return result
  }

  atEnd(): boolean {
    return this.pos >= this.tokens.length
  }

  currentPos(): number {
    return this.errorPos()
  }
}

export function parse(src: string): ParseResult {
  const lexed = lex(src)
  if (!lexed.ok) {
    return { ok: false, error: lexed.error }
  }
  if (lexed.tokens.length === 0) {
    return { ok: false, error: { message: 'Empty expression', pos: 0 } }
  }
  const parser = new Parser(lexed.tokens, src.length)
  try {
    const term = parser.parseTerm()
    if (!parser.atEnd()) {
      return {
        ok: false,
        error: { message: 'Unexpected trailing input', pos: parser.currentPos() },
      }
    }
    return { ok: true, term }
  } catch (e) {
    return { ok: false, error: e as ParseError }
  }
}
