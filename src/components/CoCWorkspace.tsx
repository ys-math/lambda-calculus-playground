import { useMemo } from 'react'
import MathView from './MathView'
import CoCStepper from './CoCStepper'
import CoCDefinitions from './CoCDefinitions'
import { parse } from '../coc/parser'
import { check } from '../coc/check'
import { toLatex } from '../coc/pretty'
import { buildEnv } from '../coc/environment'
import { STD_DEFS, STD_CONSTANTS } from '../coc/stdlib'
import { COC_EXAMPLE_GROUPS } from '../data/cocExamples'

interface CoCWorkspaceProps {
  value: string
  onChange: (value: string) => void
  defSources: string[]
  onAddDef: (source: string) => void
  onRemoveDef: (source: string) => void
}

// The Calculus-of-Constructions workspace: a term editor with a live render, a
// panel showing the inferred (dependent) type, a scrubbable β/δ calculation, a
// definitions panel (abbreviations + postulates), and an example gallery.
export default function CoCWorkspace({
  value,
  onChange,
  defSources,
  onAddDef,
  onRemoveDef,
}: CoCWorkspaceProps) {
  const env = useMemo(() => buildEnv(STD_DEFS, defSources), [defSources])
  const parsed = useMemo(() => parse(value.trim()), [value])
  const result = useMemo(
    () => (parsed.ok ? check(parsed.term, env.context, env.bodies) : null),
    [parsed, env],
  )

  const insertName = (name: string) => {
    onChange(value.length === 0 || value.endsWith(' ') ? value + name : value + ' ' + name)
  }

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
        <h2>Type — Calculus of Constructions</h2>
        {!parsed.ok || !result ? (
          <p className="empty-note">Enter a well-formed term above to type-check it.</p>
        ) : result.ok ? (
          <div className="type-headline">
            <MathView
              latex={`${toLatex(parsed.term)} \\;:\\; ${toLatex(result.type)}`}
              display
            />
          </div>
        ) : (
          <div className="type-error">✗ {result.error}</div>
        )}
      </section>

      {parsed.ok && result && result.ok && (
        <section className="coc-steps">
          <h2>Calculation — β / δ reduction</h2>
          <CoCStepper term={parsed.term} bodies={env.bodies} />
        </section>
      )}

      <aside className="ws-side">
        <CoCDefinitions
          entries={env.userEntries}
          stdConstants={STD_CONSTANTS}
          onAdd={onAddDef}
          onRemove={onRemoveDef}
          onInsert={insertName}
        />
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
