import { useMemo, useState } from 'react'
import TermInput from './components/TermInput'
import ReductionStepper from './components/ReductionStepper'
import StrategyPicker from './components/StrategyPicker'
import Definitions from './components/Definitions'
import Lessons from './components/Lessons'
import { parse } from './lambda/parser'
import type { ParseError } from './lambda/parser'
import type { Term } from './lambda/ast'
import type { Strategy } from './lambda/reduce'
import { builtinEnvironment, BUILTIN_DEFINITIONS } from './lambda/builtins'
import { expand } from './lambda/environment'
import type { Definition, Environment } from './lambda/environment'
import './App.css'

const STEP_CAP_OPTIONS = [50, 200, 1000]

export default function App() {
  const [input, setInput] = useState('(\\x. x x) (\\y. y)')
  const [strategy, setStrategy] = useState<Strategy>('normal')
  const [maxSteps, setMaxSteps] = useState(200)
  const [eta, setEta] = useState(false)
  const [showAlpha, setShowAlpha] = useState(true)
  const [userDefs, setUserDefs] = useState<Definition[]>([])

  // Build the active environment: built-ins overlaid with the user's definitions.
  const env: Environment = useMemo(() => {
    const e = builtinEnvironment()
    for (const d of userDefs) e.set(d.name, d.term)
    return e
  }, [userDefs])

  // Parse the current input, then expand macros so the stepper sees a closed term.
  const { term, expanded, error } = useMemo(() => {
    const trimmed = input.trim()
    if (!trimmed) {
      return { term: null as Term | null, expanded: null as Term | null, error: null as ParseError | null }
    }
    const parsed = parse(trimmed)
    if (!parsed.ok) {
      return { term: null, expanded: null, error: parsed.error }
    }
    return { term: parsed.term, expanded: expand(parsed.term, env), error: null }
  }, [input, env])

  const addDef = (def: Definition) => {
    setUserDefs((defs) => [...defs.filter((d) => d.name !== def.name), def])
  }
  const removeDef = (name: string) => {
    setUserDefs((defs) => defs.filter((d) => d.name !== name))
  }
  const insertName = (name: string) => {
    setInput((cur) => (cur.length === 0 || cur.endsWith(' ') ? cur + name : cur + ' ' + name))
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>λ Lambda Calculus Playground</h1>
        <p className="tagline">
          An interactive tool for learning the untyped lambda calculus — type a term,
          watch it reduce step by step.
        </p>
      </header>

      <div className="layout">
        <main className="playground">
          <TermInput value={input} onChange={setInput} term={term} error={error} />

          <div className="controls-row">
            <StrategyPicker value={strategy} onChange={setStrategy} />
            <div className="controls-stack">
              <label className="cap-picker">
                Step cap
                <select value={maxSteps} onChange={(e) => setMaxSteps(Number(e.target.value))}>
                  {STEP_CAP_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <label className="toggle" title="λx. M x → M when x is not free in M">
                <input type="checkbox" checked={eta} onChange={(e) => setEta(e.target.checked)} />
                Include η-reduction
              </label>
              <label className="toggle" title="Rename bound variables explicitly before a capturing β-step">
                <input
                  type="checkbox"
                  checked={showAlpha}
                  onChange={(e) => setShowAlpha(e.target.checked)}
                />
                Show α-conversion steps
              </label>
            </div>
          </div>

          {expanded ? (
            <ReductionStepper
              term={expanded}
              strategy={strategy}
              maxSteps={maxSteps}
              eta={eta}
              showAlpha={showAlpha}
            />
          ) : (
            <p className="empty-note">
              Enter a valid expression above to start reducing.
            </p>
          )}

          <Definitions
            userDefs={userDefs}
            onAdd={addDef}
            onRemove={removeDef}
            onInsert={insertName}
          />
        </main>

        <aside className="sidebar">
          <Lessons onLoad={setInput} />
        </aside>
      </div>

      <footer className="app-footer">
        <p>
          {BUILTIN_DEFINITIONS.length} built-in definitions · β / η / α conversions ·
          Normal &amp; applicative order · Built with React, TypeScript &amp; KaTeX
        </p>
      </footer>
    </div>
  )
}
