import { isSaved } from '../lib/savedFormulas'

interface SavedFormulasProps {
  saved: string[]
  current: string
  onSave: () => void
  onLoad: (expr: string) => void
  onRemove: (expr: string) => void
}

// Personal saved-formula list (persisted in localStorage by App). Save the
// current expression, click a saved one to load it back, or remove it. Sits in
// the side column next to the input so saving/recalling is one click away.
export default function SavedFormulas({
  saved,
  current,
  onSave,
  onLoad,
  onRemove,
}: SavedFormulasProps) {
  const trimmed = current.trim()
  const alreadySaved = isSaved(saved, trimmed)
  const canSave = trimmed !== '' && !alreadySaved

  return (
    <section className="saved">
      <h2>Saved formulas</h2>
      <p className="hint">Save the current expression to revisit it later.</p>

      <button
        className="save-btn"
        onClick={onSave}
        disabled={!canSave}
        title={
          trimmed === ''
            ? 'Type an expression to save'
            : alreadySaved
              ? 'This formula is already saved'
              : 'Save the current expression'
        }
      >
        {alreadySaved ? '✓ Saved' : '★ Save current formula'}
      </button>

      {saved.length === 0 ? (
        <p className="hint saved-empty">No saved formulas yet.</p>
      ) : (
        <ul className="saved-list">
          {saved.map((expr) => (
            <li key={expr}>
              <button
                className="saved-item"
                onClick={() => onLoad(expr)}
                title="Load into the input"
              >
                <code>{expr}</code>
              </button>
              <button
                className="saved-remove"
                onClick={() => onRemove(expr)}
                title="Remove"
                aria-label={`Remove ${expr}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
