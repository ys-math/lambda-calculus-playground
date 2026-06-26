import { useState } from 'react'
import { parseCoCDefinition } from '../coc/environment'
import type { UserEntry } from '../coc/environment'
import type { StdConstant } from '../coc/stdlib'
import { toAscii } from '../coc/pretty'

interface CoCDefinitionsProps {
  entries: UserEntry[]
  stdConstants: StdConstant[]
  onAdd: (source: string) => void
  onRemove: (source: string) => void
  onInsert: (name: string) => void
}

// Manage CoC definitions. Users add `Name = term` (abbreviation) or `Name : type`
// (postulate); the standard library is listed for one-click insertion. Inferred
// types and per-line errors come from the parent's `buildEnv` pass.
export default function CoCDefinitions({
  entries,
  stdConstants,
  onAdd,
  onRemove,
  onInsert,
}: CoCDefinitionsProps) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    if (!draft.trim()) return
    const parsed = parseCoCDefinition(draft)
    if (!parsed.ok) {
      setError(parsed.error)
      return
    }
    onAdd(draft.trim())
    setDraft('')
    setError(null)
  }

  return (
    <section className="definitions coc-definitions">
      <h2>Definitions</h2>
      <p className="hint">
        Add <code>Name = term</code> (an abbreviation, unfolds during steps) or{' '}
        <code>Name : type</code> (a postulate). Then use the name in your term.
      </p>

      <div className="def-add">
        <input
          className="def-field"
          value={draft}
          spellCheck={false}
          placeholder="Bool = forall (A : Prop), A -> A"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
        />
        <button onClick={submit}>Add</button>
      </div>
      {error && <div className="parse-error">{error}</div>}

      {entries.length > 0 && (
        <div className="def-list">
          <h3>Your definitions</h3>
          <ul>
            {entries.map((entry, i) => (
              <li key={`${entry.source}-${i}`} className={entry.error ? 'def-bad' : ''}>
                {entry.def ? (
                  <>
                    <button
                      className="def-name"
                      onClick={() => onInsert(entry.def!.name)}
                      title="Insert into the term"
                    >
                      {entry.def.name}
                    </button>
                    <span className={`def-kind def-kind-${entry.def.kind}`}>
                      {entry.def.kind === 'def' ? 'def' : 'postulate'}
                    </span>
                    <code className="def-source">: {toAscii(entry.def.type)}</code>
                  </>
                ) : (
                  <>
                    <code className="def-source def-source-bad">{entry.source}</code>
                    <span className="def-error" title={entry.error}>✗ {entry.error}</span>
                  </>
                )}
                <button className="def-remove" onClick={() => onRemove(entry.source)} title="Remove">✕</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="def-list builtins">
        <h3>Standard library</h3>
        <p className="hint">Postulated constants — click to insert.</p>
        <div className="builtin-chips">
          {stdConstants.map((c) => (
            <button
              key={c.name}
              className="chip"
              onClick={() => onInsert(c.name)}
              title={`${c.name} : ${c.type} — ${c.note}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
