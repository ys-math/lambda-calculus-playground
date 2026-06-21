import { useState } from 'react'
import { parseDefinition } from '../lambda/environment'
import type { Definition } from '../lambda/environment'
import { BUILTIN_DEFINITIONS } from '../lambda/builtins'

interface DefinitionsProps {
  userDefs: Definition[]
  onAdd: (def: Definition) => void
  onRemove: (name: string) => void
  onInsert: (name: string) => void
}

// Manage named macros. Users add `NAME = expression` bindings; built-in
// definitions are listed for reference and one-click insertion.
export default function Definitions({ userDefs, onAdd, onRemove, onInsert }: DefinitionsProps) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    if (!draft.trim()) return
    const parsed = parseDefinition(draft)
    if (!parsed.ok) {
      setError(parsed.error)
      return
    }
    onAdd({ name: parsed.name, source: parsed.source, term: parsed.term })
    setDraft('')
    setError(null)
  }

  return (
    <section className="definitions">
      <h2>Definitions</h2>
      <p className="hint">
        Bind a name to a term, then use it in expressions. Names are expanded before reduction.
      </p>

      <div className="def-add">
        <input
          className="def-field"
          value={draft}
          spellCheck={false}
          placeholder="DOUBLE = \f x. f (f x)"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
        />
        <button onClick={submit}>Add</button>
      </div>
      {error && <div className="parse-error">{error}</div>}

      {userDefs.length > 0 && (
        <div className="def-list">
          <h3>Your definitions</h3>
          <ul>
            {userDefs.map((d) => (
              <li key={d.name}>
                <button className="def-name" onClick={() => onInsert(d.name)} title="Insert into expression">
                  {d.name}
                </button>
                <code className="def-source">= {d.source}</code>
                <button className="def-remove" onClick={() => onRemove(d.name)} title="Remove">✕</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="def-list builtins">
        <h3>Built-in library</h3>
        <p className="hint">Click any name to insert it.</p>
        <div className="builtin-chips">
          {BUILTIN_DEFINITIONS.map((d) => (
            <button key={d.name} className="chip" onClick={() => onInsert(d.name)} title={d.source}>
              {d.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
