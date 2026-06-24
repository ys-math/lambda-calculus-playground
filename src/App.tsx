import { useMemo, useState } from 'react'
import TermInput from './components/TermInput'
import ReductionStepper from './components/ReductionStepper'
import StrategyPicker from './components/StrategyPicker'
import Definitions from './components/Definitions'
import Examples from './components/Examples'
import SavedFormulas from './components/SavedFormulas'
import TypePanel from './components/TypePanel'
import Lessons from './components/Lessons'
import { useLocalStorage } from './hooks/useLocalStorage'
import { addFormula, removeFormula } from './lib/savedFormulas'
import { parse } from './lambda/parser'
import type { ParseError } from './lambda/parser'
import type { Term } from './lambda/ast'
import type { Strategy } from './lambda/reduce'
import { builtinEnvironment, BUILTIN_DEFINITIONS } from './lambda/builtins'
import { expand } from './lambda/environment'
import type { Definition, Environment } from './lambda/environment'
import { buildRecognizer } from './lambda/recognize'
import { infer } from './lambda/infer'
import './App.css'

const STEP_CAP_OPTIONS = [50, 200, 1000]

export default function App() {
  const [input, setInput] = useState('(\\x. x x) (\\y. y)')
  const [strategy, setStrategy] = useState<Strategy>('normal')
  const [maxSteps, setMaxSteps] = useState(200)
  const [eta, setEta] = useState(false)
  const [showAlpha, setShowAlpha] = useState(true)
  const [userDefs, setUserDefs] = useState<Definition[]>([])
  // Typed mode (Simply Typed λ-calculus) persists across sessions.
  const [typed, setTyped] = useLocalStorage<boolean>('lambda-playground:typed-mode', false)
  // Saved formulas persist across sessions in localStorage.
  const [savedFormulas, setSavedFormulas] = useLocalStorage<string[]>(
    'lambda-playground:saved-formulas',
    [],
  )

  // Build the active environment: built-ins overlaid with the user's definitions.
  const env: Environment = useMemo(() => {
    const e = builtinEnvironment()
    for (const d of userDefs) e.set(d.name, d.term)
    return e
  }, [userDefs])

  // Recognizer that folds a reduced term back into a definition name or numeral.
  // Built-ins and user definitions are deduped by name (user wins).
  const recognizer = useMemo(() => {
    const byName = new Map<string, Definition>()
    for (const d of BUILTIN_DEFINITIONS) byName.set(d.name, d)
    for (const d of userDefs) byName.set(d.name, d)
    return buildRecognizer([...byName.values()], env)
  }, [userDefs, env])

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

  // In typed mode, infer the simple type of the raw term (macros are treated as
  // free variables, not expanded).
  const typeResult = useMemo(
    () => (typed && term ? infer(term) : null),
    [typed, term],
  )

  const addDef = (def: Definition) => {
    setUserDefs((defs) => [...defs.filter((d) => d.name !== def.name), def])
  }
  const removeDef = (name: string) => {
    setUserDefs((defs) => defs.filter((d) => d.name !== name))
  }
  const insertName = (name: string) => {
    setInput((cur) => (cur.length === 0 || cur.endsWith(' ') ? cur + name : cur + ' ' + name))
  }
  const saveCurrentFormula = () => {
    setSavedFormulas((list) => addFormula(list, input))
  }
  const removeSavedFormula = (expr: string) => {
    setSavedFormulas((list) => removeFormula(list, expr))
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-row">
          <h1>Lambda Calculus Playground</h1>
          <div className="mode-toggle" role="group" aria-label="Calculus mode">
            <button
              className={typed ? '' : 'active'}
              aria-pressed={!typed}
              onClick={() => setTyped(false)}
            >
              Untyped
            </button>
            <button
              className={typed ? 'active' : ''}
              aria-pressed={typed}
              onClick={() => setTyped(true)}
            >
              Typed
            </button>
          </div>
        </div>
        <p className="tagline">
          {typed
            ? 'Typed mode infers each term’s simple type and shows the typing derivation — reduction still runs alongside.'
            : 'An interactive tool for learning the untyped lambda calculus — type a term, watch it reduce step by step.'}
        </p>
      </header>

      <div className="workspace">
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

        {typed && term && typeResult && <TypePanel term={term} result={typeResult} />}

        {expanded ? (
          <ReductionStepper
            term={expanded}
            strategy={strategy}
            maxSteps={maxSteps}
            eta={eta}
            showAlpha={showAlpha}
            recognizer={recognizer}
          />
        ) : (
          <p className="empty-note">
            Enter a valid expression above to start reducing.
          </p>
        )}

        <aside className="ws-side">
          <SavedFormulas
            saved={savedFormulas}
            current={input}
            onSave={saveCurrentFormula}
            onLoad={setInput}
            onRemove={removeSavedFormula}
          />
          <Definitions
            userDefs={userDefs}
            onAdd={addDef}
            onRemove={removeDef}
            onInsert={insertName}
          />
          <Examples onLoad={setInput} />
        </aside>
      </div>

      <Lessons onLoad={setInput} onSelectMode={setTyped} />

      <footer className="app-footer">
        <p>
          {BUILTIN_DEFINITIONS.length} built-in definitions · β / η / α conversions ·
          Normal &amp; applicative order · Built with React, TypeScript &amp; KaTeX
        </p>
      </footer>
    </div>
  )
}
