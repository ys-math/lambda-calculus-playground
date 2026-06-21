// Classic lambda terms to drop into the playground with one click.

export interface Example {
  label: string
  expr: string
  note: string
}

export interface ExampleGroup {
  title: string
  examples: Example[]
}

export const EXAMPLE_GROUPS: ExampleGroup[] = [
  {
    title: 'Getting started',
    examples: [
      { label: 'Identity applied', expr: '(\\x. x) y', note: 'The simplest reduction: returns its argument.' },
      { label: 'Apply a function twice', expr: '(\\f x. f (f x)) g a', note: 'Church-numeral-style repetition: g (g a).' },
      { label: 'Const (K)', expr: '(\\x y. x) a b', note: 'Keeps the first argument, throws away the second.' },
      { label: 'Self-application', expr: '(\\x. x x) y', note: 'Duplicates the argument: y y.' },
      { label: 'Flip arguments', expr: '(\\f x y. f y x) k a b', note: 'Swaps the order of two arguments: k b a.' },
    ],
  },
  {
    title: 'Booleans',
    examples: [
      { label: 'AND TRUE FALSE', expr: 'AND TRUE FALSE', note: 'Conjunction of Church booleans → FALSE.' },
      { label: 'OR FALSE FALSE', expr: 'OR FALSE FALSE', note: 'Disjunction → FALSE.' },
      { label: 'NOT TRUE', expr: 'NOT TRUE', note: 'Negation → FALSE.' },
      { label: 'XOR TRUE TRUE', expr: 'XOR TRUE TRUE', note: 'Exclusive or → FALSE.' },
      { label: 'IF TRUE a b', expr: 'IF TRUE a b', note: 'Conditional selects the first branch → a.' },
      { label: 'Double negation', expr: 'NOT (NOT FALSE)', note: 'Returns the original value → FALSE.' },
    ],
  },
  {
    title: 'Arithmetic',
    examples: [
      { label: 'SUCC ZERO', expr: 'SUCC ZERO', note: 'The successor of zero is one.' },
      { label: 'PLUS ONE ONE', expr: 'PLUS ONE ONE', note: 'One plus one → TWO.' },
      { label: 'MULT TWO THREE', expr: 'MULT TWO THREE', note: 'Two times three → 6.' },
      { label: 'POW TWO THREE', expr: 'POW TWO THREE', note: 'Two to the power three → 8.' },
      { label: 'PRED THREE', expr: 'PRED THREE', note: 'Predecessor (the tricky one) → TWO.' },
      { label: 'SUB FOUR TWO', expr: 'SUB FOUR TWO', note: 'Truncated subtraction → TWO.' },
    ],
  },
  {
    title: 'Predicates & comparison',
    examples: [
      { label: 'ISZERO ZERO', expr: 'ISZERO ZERO', note: 'Tests for zero → TRUE.' },
      { label: 'ISZERO (PRED ONE)', expr: 'ISZERO (PRED ONE)', note: 'PRED ONE is ZERO → TRUE.' },
      { label: 'LEQ TWO THREE', expr: 'LEQ TWO THREE', note: 'Two ≤ three → TRUE.' },
      { label: 'EQ TWO TWO', expr: 'EQ TWO TWO', note: 'Numeric equality → TRUE.' },
      { label: 'EQ ONE TWO', expr: 'EQ ONE TWO', note: 'One equals two? → FALSE.' },
    ],
  },
  {
    title: 'Pairs & data',
    examples: [
      { label: 'Build a pair', expr: 'PAIR a b', note: 'A pair is a function awaiting a selector.' },
      { label: 'FST (PAIR a b)', expr: 'FST (PAIR a b)', note: 'First projection → a.' },
      { label: 'SND (PAIR a b)', expr: 'SND (PAIR a b)', note: 'Second projection → b.' },
      { label: 'Swap a pair', expr: '(\\p. PAIR (SND p) (FST p)) (PAIR a b)', note: 'Rebuilds the pair reversed → PAIR b a.' },
    ],
  },
  {
    title: 'Combinators',
    examples: [
      { label: 'S K K → I', expr: 'S K K', note: 'S and K alone build the identity I.' },
      { label: 'S K K x', expr: 'S K K x', note: 'Confirms S K K behaves as the identity → x.' },
      { label: 'Composition (B)', expr: 'B NOT NOT TRUE', note: 'B composes: NOT (NOT TRUE) → TRUE.' },
      { label: 'Flip (C)', expr: 'C K a b', note: 'C flips K’s arguments → b.' },
      { label: 'Omega (diverges!)', expr: '(\\x. x x) (\\x. x x)', note: 'Never reaches a normal form — watch the step cap.' },
      { label: 'Y g (unfolds)', expr: 'Y g', note: 'Fixed-point combinator: Y g → g (Y g) → …' },
    ],
  },
]
