// Recursive-descent parser for the Calculus of Constructions, using a
// Coq/Lean-flavoured surface syntax.
//
// Grammar:
//   term    := arrow
//   arrow   := app ('->' arrow)?                 (right-associative, non-dependent)
//   app     := atom atom*                         (left-associative)
//   atom    := ident | 'Prop' | 'Type'
//            | '(' term ')'
//            | binder
//   binder  := ('fun' | '\' | 'λ') groups '=>' term     (or '.' instead of '=>')
//            | 'forall'              groups ','  term     (or '.' instead of ',')
//   groups  := group+                              (one or more annotated binders)
//   group   := '(' ident+ ':' term ')'             (grouped, e.g. (A : Prop))
//            | ident ':' term                       (single bare binder, e.g. x : A)
//
// `fun (A : Prop) (x : A) => x` desugars right-to-left to nested λ's; likewise
// `forall (x : A) (y : B), C` to nested Π's.

import type { CTerm } from './ast'
import { cApp, cArrow, cLam, cPi, cSort, cVar } from './ast'
import { lex } from './lexer'
import type { Token } from './lexer'

export interface ParseError {
  message: string
  pos: number
}

export type ParseResult =
  | { ok: true; term: CTerm }
  | { ok: false; error: ParseError }

interface Group {
  names: string[]
  type: CTerm
}

const FUN_KEYWORDS = new Set(['fun', 'lambda'])

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
  private fail(message: string, pos = this.errorPos()): never {
    throw { message, pos } as ParseError
  }

  // term := arrow
  parseTerm(): CTerm {
    return this.parseArrow()
  }

  // arrow := app ('->' arrow)?
  private parseArrow(): CTerm {
    const left = this.parseApplication()
    if (this.peek()?.type === 'arrow') {
      this.next()
      const right = this.parseArrow()
      return cArrow(left, right)
    }
    return left
  }

  // app := atom atom*
  private parseApplication(): CTerm {
    let left = this.parseAtom()
    while (this.startsAtom()) {
      left = cApp(left, this.parseAtom())
    }
    return left
  }

  private startsAtom(): boolean {
    const t = this.peek()
    if (!t) return false
    return t.type === 'ident' || t.type === 'lparen' || t.type === 'lambda'
  }

  private parseAtom(): CTerm {
    const t = this.peek()
    if (!t) this.fail('Unexpected end of input', this.srcLen)
    switch (t!.type) {
      case 'lambda':
        return this.parseLambda()
      case 'ident': {
        if (t!.value === 'forall') return this.parseForall()
        if (FUN_KEYWORDS.has(t!.value)) return this.parseLambda()
        if (t!.value === 'Prop') {
          this.next()
          return cSort('prop')
        }
        if (t!.value === 'Type') {
          this.next()
          return cSort('type')
        }
        this.next()
        return cVar(t!.value)
      }
      case 'lparen': {
        this.next()
        const inner = this.parseTerm()
        const close = this.next()
        if (!close || close.type !== 'rparen') {
          this.fail('Expected ")"', close ? close.pos : this.srcLen)
        }
        return inner
      }
      default:
        return this.fail(`Unexpected "${t!.value}"`, t!.pos)
    }
  }

  // ('fun' | '\' | 'λ') groups ('=>' | '.') term
  private parseLambda(): CTerm {
    this.next() // consume fun / \ / λ
    const groups = this.parseGroups('a function')
    const sep = this.next()
    if (!sep || (sep.type !== 'darrow' && sep.type !== 'dot')) {
      this.fail('Expected "=>" after the binders of fun', sep ? sep.pos : this.srcLen)
    }
    const body = this.parseTerm()
    return foldGroups(groups, body, cLam)
  }

  // 'forall' groups (',' | '.') term
  private parseForall(): CTerm {
    this.next() // consume forall
    const groups = this.parseGroups('a forall')
    const sep = this.next()
    if (!sep || (sep.type !== 'comma' && sep.type !== 'dot')) {
      this.fail('Expected "," after the binders of forall', sep ? sep.pos : this.srcLen)
    }
    const body = this.parseTerm()
    return foldGroups(groups, body, cPi)
  }

  // One or more annotated binder groups.
  private parseGroups(what: string): Group[] {
    const groups: Group[] = []
    if (this.peek()?.type === 'lparen') {
      while (this.peek()?.type === 'lparen') groups.push(this.parseParenGroup())
    } else if (this.peek()?.type === 'ident') {
      // Single bare binder: `x : A`.
      const name = this.next()!.value
      this.expectColon()
      const type = this.parseTerm()
      groups.push({ names: [name], type })
    } else {
      this.fail(`Expected a binder for ${what}, e.g. (x : A)`)
    }
    return groups
  }

  // '(' ident+ ':' term ')'
  private parseParenGroup(): Group {
    this.next() // consume '('
    const names: string[] = []
    while (this.peek()?.type === 'ident') names.push(this.next()!.value)
    if (names.length === 0) this.fail('Expected a variable name inside "("')
    this.expectColon()
    const type = this.parseTerm()
    const close = this.next()
    if (!close || close.type !== 'rparen') {
      this.fail('Expected ")" to close the binder', close ? close.pos : this.srcLen)
    }
    return { names, type }
  }

  private expectColon(): void {
    const colon = this.next()
    if (!colon || colon.type !== 'colon') {
      this.fail('Expected ":" to annotate the binder', colon ? colon.pos : this.srcLen)
    }
  }

  atEnd(): boolean {
    return this.pos >= this.tokens.length
  }
  currentPos(): number {
    return this.errorPos()
  }
}

// Expand grouped binders right-to-left into nested Pi/Lam nodes.
function foldGroups(
  groups: Group[],
  body: CTerm,
  make: (param: string, domain: CTerm, inner: CTerm) => CTerm,
): CTerm {
  // Flatten (names, type) groups into a single ordered list of (name, type).
  const binders: { name: string; type: CTerm }[] = []
  for (const g of groups) for (const name of g.names) binders.push({ name, type: g.type })
  let result = body
  for (let i = binders.length - 1; i >= 0; i--) {
    result = make(binders[i].name, binders[i].type, result)
  }
  return result
}

export function parse(src: string): ParseResult {
  const lexed = lex(src)
  if (!lexed.ok) return { ok: false, error: lexed.error }
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
