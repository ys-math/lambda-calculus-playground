import { useEffect, useMemo, useState } from 'react'
import MathView from './MathView'
import { toAscii, toLatex } from '../lambda/pretty'
import { reduceMany } from '../lambda/reduce'
import type { Strategy } from '../lambda/reduce'
import type { Term } from '../lambda/ast'

interface ReductionStepperProps {
  term: Term
  strategy: Strategy
  maxSteps: number
}

// Drives the step-by-step reduction view: computes the full sequence once, then
// lets the user scrub through it. The redex contracted to reach the *next* step
// is highlighted on the current term.
export default function ReductionStepper({ term, strategy, maxSteps }: ReductionStepperProps) {
  const result = useMemo(
    () => reduceMany(term, strategy, maxSteps),
    [term, strategy, maxSteps],
  )

  const [index, setIndex] = useState(0)

  // Reset to the start whenever the term, strategy, or cap changes.
  useEffect(() => {
    setIndex(0)
  }, [result])

  const lastIndex = result.terms.length - 1
  const current = result.terms[index]
  // The redex that turns terms[index] into terms[index + 1].
  const activePath = index < lastIndex ? result.redexPaths[index] : undefined

  const atStart = index === 0
  const atEnd = index === lastIndex

  return (
    <section className="stepper">
      <div className="stepper-display">
        <MathView latex={toLatex(current, activePath)} display />
      </div>

      <div className="stepper-controls">
        <button onClick={() => setIndex(0)} disabled={atStart} title="Reset to start">⏮</button>
        <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={atStart} title="Step back">◀ Back</button>
        <span className="step-counter">
          step {index} / {lastIndex}
        </span>
        <button onClick={() => setIndex((i) => Math.min(lastIndex, i + 1))} disabled={atEnd} title="Step forward">Step ▶</button>
        <button onClick={() => setIndex(lastIndex)} disabled={atEnd} title="Run to the end">Run ⏭</button>
      </div>

      <div className="stepper-status">
        {atEnd && result.status === 'normal' && (
          <span className="status-normal">✓ Normal form reached</span>
        )}
        {atEnd && result.status === 'capped' && (
          <span className="status-capped">
            ⚠ Stopped after {maxSteps} steps — this term may not have a normal form.
          </span>
        )}
        {!atEnd && (
          <span className="status-active">
            Highlighted redex will be reduced next.
          </span>
        )}
      </div>

      <details className="ascii-out">
        <summary>Current term as text</summary>
        <code>{toAscii(current)}</code>
      </details>
    </section>
  )
}
