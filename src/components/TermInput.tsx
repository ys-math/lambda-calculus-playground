import MathView from './MathView'
import { toLatex } from '../lambda/pretty'
import type { Term } from '../lambda/ast'
import type { ParseError } from '../lambda/parser'

interface TermInputProps {
  value: string
  onChange: (value: string) => void
  term: Term | null
  error: ParseError | null
}

// The expression editor: a text field plus a live preview of how the typed term
// renders as math, or a friendly error pointing at the offending position.
export default function TermInput({ value, onChange, term, error }: TermInputProps) {
  return (
    <div className="term-input">
      <label className="field-label" htmlFor="expr">
        Expression <span className="hint">(type \ for λ)</span>
      </label>
      <textarea
        id="expr"
        className="expr-field"
        value={value}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        rows={2}
        placeholder="e.g. (\x. x) y   or   PLUS ONE ONE"
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="preview">
        {error ? (
          <span className="parse-error">
            {error.message}
            {error.pos < value.length && (
              <code className="error-caret"> near “{value.slice(error.pos, error.pos + 6)}”</code>
            )}
          </span>
        ) : term ? (
          <MathView latex={toLatex(term)} display />
        ) : (
          <span className="hint">Start typing an expression…</span>
        )}
      </div>
    </div>
  )
}
