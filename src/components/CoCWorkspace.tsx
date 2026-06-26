import { useMemo } from 'react'
import MathView from './MathView'
import { parse } from '../coc/parser'
import { check } from '../coc/check'
import { toLatex } from '../coc/pretty'
import { alphaEquiv } from '../coc/ast'
import { STD_CONTEXT, STD_CONSTANTS } from '../coc/stdlib'
import { COC_EXAMPLE_GROUPS } from '../data/cocExamples'

interface CoCWorkspaceProps {
  value: string
  onChange: (value: string) => void
}

// The Calculus-of-Constructions workspace: a term editor with a live render,
// a panel showing the inferred (dependent) type and the βη-normal form, and a
// gallery of examples plus the standard context that terms may refer to.
export default function CoCWorkspace({ value, onChange }: CoCWorkspaceProps) {
  const parsed = useMemo(() => parse(value.trim()), [value])
  const result = useMemo(
    () => (parsed.ok ? check(parsed.term, STD_CONTEXT) : null),
    [parsed],
  )

  return (
    <div className="workspace coc-workspace">
      <div className="term-input">
        <label className="field-label" htmlFor="coc-expr">
          Term <span className="hint">(Coq/Lean syntax · type \ for λ)</span>
        </label>
        <textarea
          id="coc-expr"
          className="expr-field"
          value={value}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          rows={2}
          placeholder="e.g. fun (A : Prop) (x : A) => x"
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="preview">
          {!value.trim() ? (
            <span className="hint">Start typing a term…</span>
          ) : parsed.ok ? (
            <MathView latex={toLatex(parsed.term)} display />
          ) : (
            <span className="parse-error">
              {parsed.error.message}
              {parsed.error.pos < value.length && (
                <code className="error-caret"> near “{value.slice(parsed.error.pos, parsed.error.pos + 6)}”</code>
              )}
            </span>
          )}
        </div>
      </div>

      <section className="typing coc-result">
        <h2>Type &amp; normal form — Calculus of Constructions</h2>
        {!parsed.ok || !result ? (
          <p className="empty-note">Enter a well-formed term above to type-check it.</p>
        ) : result.ok ? (
          <>
            <div className="type-headline">
              <MathView
                latex={`${toLatex(parsed.term)} \\;:\\; ${toLatex(result.type)}`}
                display
              />
            </div>
            {alphaEquiv(parsed.term, result.normal) ? (
              <p className="coc-note">This term is already in normal form.</p>
            ) : (
              <div className="coc-normal">
                <span className="coc-label">β-normal form</span>
                <MathView latex={toLatex(result.normal)} display />
              </div>
            )}
          </>
        ) : (
          <div className="type-error">✗ {result.error}</div>
        )}
      </section>

      <aside className="ws-side">
        <section className="coc-context">
          <h2>Standard context</h2>
          <p className="coc-context-note">Constants you may use without defining them:</p>
          <ul className="coc-context-list">
            {STD_CONSTANTS.map((c) => (
              <li key={c.name} title={c.note}>
                <code>{c.name}</code> : <code>{c.type}</code>
              </li>
            ))}
          </ul>
        </section>

        <section className="examples">
          <h2>Examples</h2>
          <div className="example-groups">
            {COC_EXAMPLE_GROUPS.map((group) => (
              <div key={group.title} className="example-group">
                <h3>{group.title}</h3>
                <ul>
                  {group.examples.map((ex) => (
                    <li key={ex.label}>
                      <button className="example-btn" onClick={() => onChange(ex.expr)} title={ex.note}>
                        {ex.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  )
}
