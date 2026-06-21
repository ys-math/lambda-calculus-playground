import { useEffect, useMemo, useState } from 'react'
import MathView from './MathView'
import { toAscii, toLatex } from '../lambda/pretty'
import { reduceMany } from '../lambda/reduce'
import type { ConversionKind, Strategy } from '../lambda/reduce'
import type { Term } from '../lambda/ast'

interface ReductionStepperProps {
  term: Term
  strategy: Strategy
  maxSteps: number
  eta: boolean
  showAlpha: boolean
}

const KIND_LABEL: Record<ConversionKind, string> = {
  beta: 'β-reduction',
  eta: 'η-reduction',
  alpha: 'α-conversion',
}

// Drives the step-by-step view: computes the full sequence once, then lets the
// user scrub through it. The sub-term rewritten to reach the *next* step is
// highlighted, and each step is labelled with the conversion applied.
export default function ReductionStepper({
  term,
  strategy,
  maxSteps,
  eta,
  showAlpha,
}: ReductionStepperProps) {
  const result = useMemo(
    () => reduceMany(term, strategy, maxSteps, { eta, showAlpha }),
    [term, strategy, maxSteps, eta, showAlpha],
  )

  const [index, setIndex] = useState(0)

  // Reset to the start whenever the computed reduction changes.
  useEffect(() => {
    setIndex(0)
  }, [result])

  const lastIndex = result.terms.length - 1
  const current = result.terms[index]
  // The step that turns terms[index] into terms[index + 1].
  const nextStep = index < lastIndex ? result.steps[index] : undefined
  // The step that produced the current term (for the "applied" label).
  const prevStep = index > 0 ? result.steps[index - 1] : undefined

  const atStart = index === 0
  const atEnd = index === lastIndex

  return (
    <section className="stepper">
      <div className="stepper-display">
        <MathView latex={toLatex(current, nextStep?.redexPath)} display />
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
        {nextStep ? (
          <span className="status-next">
            Next step:{' '}
            <span className={`kind-badge kind-${nextStep.kind}`}>{KIND_LABEL[nextStep.kind]}</span>
            {nextStep.note && <span className="kind-note"> ({nextStep.note})</span>}
            {' '}— the highlighted sub-term will be rewritten.
          </span>
        ) : result.status === 'normal' ? (
          <span className="status-normal">
            ✓ Normal form reached
            {prevStep && (
              <>
                {' '}(last step:{' '}
                <span className={`kind-badge kind-${prevStep.kind}`}>{KIND_LABEL[prevStep.kind]}</span>)
              </>
            )}
          </span>
        ) : (
          <span className="status-capped">
            ⚠ Stopped after {maxSteps} steps — this term may not have a normal form.
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
