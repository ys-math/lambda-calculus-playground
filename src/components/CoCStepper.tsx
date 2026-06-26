import { useEffect, useMemo, useState } from 'react'
import MathView from './MathView'
import { toAscii, toLatex } from '../coc/pretty'
import { reduceMany } from '../coc/reduce'
import type { CoCStepKind } from '../coc/reduce'
import type { CTerm } from '../coc/ast'
import type { Defs } from '../coc/normalize'

interface CoCStepperProps {
  term: CTerm
  bodies: Defs
}

const KIND_LABEL: Record<CoCStepKind, string> = {
  beta: 'β-reduction',
  delta: 'δ-unfold',
}

const MAX_STEPS = 200

// Step-by-step β/δ reduction for CoC, mirroring the untyped ReductionStepper:
// compute the whole sequence once, then scrub through it with the sub-term that
// is about to be rewritten highlighted, and each step labelled.
export default function CoCStepper({ term, bodies }: CoCStepperProps) {
  const result = useMemo(() => reduceMany(term, bodies, MAX_STEPS), [term, bodies])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [result])

  const lastIndex = result.terms.length - 1
  const current = result.terms[index]
  const nextStep = index < lastIndex ? result.steps[index] : undefined
  const prevStep = index > 0 ? result.steps[index - 1] : undefined
  const atStart = index === 0
  const atEnd = index === lastIndex

  // A term already in normal form has no steps — say so plainly.
  if (lastIndex === 0 && result.status === 'normal') {
    return (
      <section className="stepper coc-stepper">
        <div className="stepper-display">
          <MathView latex={toLatex(current)} display />
        </div>
        <div className="stepper-status">
          <span className="status-normal">✓ Already in normal form — nothing to compute.</span>
        </div>
      </section>
    )
  }

  return (
    <section className="stepper coc-stepper">
      <div className="stepper-display">
        <MathView latex={toLatex(current, nextStep?.redexPath)} display />
      </div>

      <div className="stepper-controls">
        <button onClick={() => setIndex(0)} disabled={atStart} title="Reset to start">⏮</button>
        <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={atStart} title="Step back">◀ Back</button>
        <span className="step-counter">step {index} / {lastIndex}</span>
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
            ⚠ Stopped after {MAX_STEPS} steps — this term may not have a normal form.
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
