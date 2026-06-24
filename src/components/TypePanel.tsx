import MathView from './MathView'
import { toLatex } from '../lambda/pretty'
import { typeToLatex } from '../lambda/types'
import { derivationToLatex } from '../lambda/infer'
import type { InferResult } from '../lambda/infer'
import type { Term } from '../lambda/ast'

interface TypePanelProps {
  term: Term
  result: InferResult
}

// Shows the simple type inferred for the current term (or why it has none),
// plus the full typing derivation rendered as an inference-rule proof tree.
// Definitions are treated as free variables here — the type is of the term as
// written, not of its expansion.
export default function TypePanel({ term, result }: TypePanelProps) {
  return (
    <section className="typing">
      <h2>Type — Simply Typed λ-calculus</h2>

      {result.ok ? (
        <>
          <div className="type-headline">
            <MathView
              latex={`${toLatex(term)} \\;:\\; ${typeToLatex(result.type, result.names)}`}
              display
            />
          </div>
          <details className="derivation-wrap" open>
            <summary>Typing derivation</summary>
            <div className="derivation">
              <MathView latex={derivationToLatex(result.derivation, result.names)} display />
            </div>
          </details>
        </>
      ) : (
        <div className="type-error">✗ {result.error}</div>
      )}
    </section>
  )
}
