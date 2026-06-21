import { EXAMPLE_GROUPS } from '../data/examples'

interface ExamplesProps {
  onLoad: (expr: string) => void
}

// A gallery of classic example terms, grouped by topic. Clicking a button loads
// that expression into the input. Sits beside the input so terms are one click
// away while composing.
export default function Examples({ onLoad }: ExamplesProps) {
  return (
    <section className="examples">
      <h2>Examples</h2>
      <div className="example-groups">
        {EXAMPLE_GROUPS.map((group) => (
          <div key={group.title} className="example-group">
            <h3>{group.title}</h3>
            <ul>
              {group.examples.map((ex) => (
                <li key={ex.label}>
                  <button className="example-btn" onClick={() => onLoad(ex.expr)} title={ex.note}>
                    {ex.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
