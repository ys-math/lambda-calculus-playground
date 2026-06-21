import type { Strategy } from '../lambda/reduce'

interface StrategyPickerProps {
  value: Strategy
  onChange: (s: Strategy) => void
}

const OPTIONS: { value: Strategy; label: string; hint: string }[] = [
  { value: 'normal', label: 'Normal order', hint: 'leftmost-outermost · always normalises if possible' },
  { value: 'applicative', label: 'Applicative order', hint: 'leftmost-innermost · call-by-value, may diverge' },
]

export default function StrategyPicker({ value, onChange }: StrategyPickerProps) {
  return (
    <fieldset className="strategy-picker">
      <legend>Reduction strategy</legend>
      {OPTIONS.map((opt) => (
        <label key={opt.value} className={`strategy-opt ${value === opt.value ? 'active' : ''}`}>
          <input
            type="radio"
            name="strategy"
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          <span className="strategy-label">{opt.label}</span>
          <span className="strategy-hint">{opt.hint}</span>
        </label>
      ))}
    </fieldset>
  )
}
