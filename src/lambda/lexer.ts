// Tokenizer for lambda-calculus source text.
//
// Recognised tokens:
//   - 'lambda'  : `\` or the unicode `λ`
//   - 'dot'     : `.`
//   - 'lparen'  : `(`
//   - 'rparen'  : `)`
//   - 'ident'   : a run of identifier characters (letters, digits, _, ', ?, !)
//
// Whitespace separates tokens but is otherwise ignored. Each token carries the
// source `pos` of its first character so the parser can report precise errors.

export type TokenType = 'lambda' | 'dot' | 'lparen' | 'rparen' | 'ident'

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
  while (i < src.length) {
    const c = src[i]
    if (/\s/.test(c)) {
      i++
      continue
    }
    switch (c) {
      case '\\':
      case 'λ':
        tokens.push({ type: 'lambda', value: c, pos: i })
        i++
        continue
      case '.':
        tokens.push({ type: 'dot', value: c, pos: i })
        i++
        continue
      case '(':
        tokens.push({ type: 'lparen', value: c, pos: i })
        i++
        continue
      case ')':
        tokens.push({ type: 'rparen', value: c, pos: i })
        i++
        continue
    }
    if (isIdentStart(c)) {
      const start = i
      while (i < src.length && isIdentPart(src[i])) i++
      tokens.push({ type: 'ident', value: src.slice(start, i), pos: start })
      continue
    }
    return { ok: false, error: { message: `Unexpected character "${c}"`, pos: i } }
  }
  return { ok: true, tokens }
}
