// Tokenizer for Calculus-of-Constructions source text.
//
// Recognised tokens:
//   - 'lambda' : `\` or `λ`            (also written `fun`, handled as a keyword)
//   - 'arrow'  : `->` or `→`
//   - 'darrow' : `=>` or `⇒`           (separates `fun … => body`)
//   - 'colon'  : `:`
//   - 'comma'  : `,`
//   - 'dot'    : `.`
//   - 'lparen' / 'rparen'
//   - 'ident'  : identifiers and keywords (fun, forall, Prop, Type)
//
// Each token carries the source `pos` of its first character for error reports.

export type TokenType =
  | 'lambda'
  | 'arrow'
  | 'darrow'
  | 'colon'
  | 'comma'
  | 'dot'
  | 'lparen'
  | 'rparen'
  | 'ident'

export interface Token {
  type: TokenType
  value: string
  pos: number
}

export interface LexError {
  message: string
  pos: number
}

export type LexResult =
  | { ok: true; tokens: Token[] }
  | { ok: false; error: LexError }

const isIdentStart = (c: string): boolean => /[A-Za-z_]/.test(c)
const isIdentPart = (c: string): boolean => /[A-Za-z0-9_'?!]/.test(c)

export function lex(src: string): LexResult {
  const tokens: Token[] = []
  let i = 0
  const push = (type: TokenType, value: string, pos: number) =>
    tokens.push({ type, value, pos })

  while (i < src.length) {
    const c = src[i]
    if (/\s/.test(c)) {
      i++
      continue
    }
    // Two-character operators first.
    if (c === '-' && src[i + 1] === '>') {
      push('arrow', '->', i)
      i += 2
      continue
    }
    if (c === '=' && src[i + 1] === '>') {
      push('darrow', '=>', i)
      i += 2
      continue
    }
    switch (c) {
      case '→':
        push('arrow', c, i); i++; continue
      case '⇒':
        push('darrow', c, i); i++; continue
      case '\\':
      case 'λ':
        push('lambda', c, i); i++; continue
      case '∀':
        // Unicode ∀ is sugar for the `forall` keyword.
        push('ident', 'forall', i); i++; continue
      case ':':
        push('colon', c, i); i++; continue
      case ',':
        push('comma', c, i); i++; continue
      case '.':
        push('dot', c, i); i++; continue
      case '(':
        push('lparen', c, i); i++; continue
      case ')':
        push('rparen', c, i); i++; continue
    }
    if (isIdentStart(c)) {
      const start = i
      while (i < src.length && isIdentPart(src[i])) i++
      push('ident', src.slice(start, i), start)
      continue
    }
    return { ok: false, error: { message: `Unexpected character "${c}"`, pos: i } }
  }
  return { ok: true, tokens }
}
