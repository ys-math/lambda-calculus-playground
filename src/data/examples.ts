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
      { label: 'Identity applied', expr: '(\\x. x) y', note: 'The simplest reduction.' },
      { label: 'Apply a function twice', expr: '(\\f x. f (f x)) g a', note: 'Church-numeral-style repetition.' },
      { label: 'Const', expr: '(\\x y. x) a b', note: 'Throws away the second argument.' },
    ],
  },
  {
    title: 'Booleans',
    examples: [
      { label: 'AND TRUE FALSE', expr: 'AND TRUE FALSE', note: 'Church booleans.' },
      { label: 'NOT TRUE', expr: 'NOT TRUE', note: 'Negation.' },
      { label: 'IF TRUE a b', expr: 'IF TRUE a b', note: 'Conditional selects the first branch.' },
    ],
  },
  {
    title: 'Arithmetic',
    examples: [
      { label: 'SUCC ZERO', expr: 'SUCC ZERO', note: 'The successor of zero is one.' },
      { label: 'PLUS ONE ONE', expr: 'PLUS ONE ONE', note: 'One plus one.' },
      { label: 'MULT TWO THREE', expr: 'MULT TWO THREE', note: 'Two times three.' },
      { label: 'ISZERO ZERO', expr: 'ISZERO ZERO', note: 'Tests for zero.' },
    ],
  },
  {
    title: 'Combinators',
    examples: [
      { label: 'S K K', expr: 'S K K', note: 'Reduces to the identity I.' },
      { label: 'Omega (diverges!)', expr: '(\\x. x x) (\\x. x x)', note: 'Never reaches a normal form — try the step cap.' },
      { label: 'FST (PAIR a b)', expr: 'FST (PAIR a b)', note: 'Projection from a pair.' },
    ],
  },
]
