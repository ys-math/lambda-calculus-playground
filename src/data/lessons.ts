// Ordered guided lessons. Each lesson is a sequence of blocks: prose paragraphs,
// inline-math snippets, and "try it" buttons that load an expression into the
// playground.

export type LessonBlock =
  | { kind: 'p'; text: string }
  | { kind: 'math'; latex: string }
  | { kind: 'try'; expr: string; caption: string }

export interface Lesson {
  id: string
  title: string
  blocks: LessonBlock[]
}

export const LESSONS: Lesson[] = [
  {
    id: 'intro',
    title: '1. What is lambda calculus?',
    blocks: [
      {
        kind: 'p',
        text:
          'Lambda calculus is a tiny language for describing computation. Everything is built from just three kinds of expression: variables, functions (abstractions), and applying a function to an argument.',
      },
      {
        kind: 'p',
        text:
          'A variable is just a name, like x. An abstraction λx. M is an anonymous function whose parameter is x and whose body is M. An application M N means "apply function M to argument N".',
      },
      {
        kind: 'math',
        latex: '\\lambda x.\\; x \\qquad \\lambda f\\, x.\\; f\\;(f\\; x) \\qquad (\\lambda x.\\, x)\\; y',
      },
      {
        kind: 'p',
        text:
          'In this app you type a backslash \\ for λ. So \\x. x is the identity function. Try loading it and reducing it:',
      },
      { kind: 'try', expr: '(\\x. x) y', caption: 'Load (\\x. x) y' },
    ],
  },
  {
    id: 'beta',
    title: '2. Beta reduction',
    blocks: [
      {
        kind: 'p',
        text:
          'Computation happens by beta reduction. When a function is applied to an argument, we substitute the argument for the parameter throughout the body. The pattern (λx. body) arg is called a redex (reducible expression).',
      },
      {
        kind: 'math',
        latex: '(\\lambda x.\\; \\text{body})\\; \\text{arg} \\;\\longrightarrow\\; \\text{body}[x := \\text{arg}]',
      },
      {
        kind: 'p',
        text:
          'Load the example below and use the step buttons. The redex about to be reduced is highlighted at each step.',
      },
      { kind: 'try', expr: '(\\f x. f (f x)) g a', caption: 'Step through a double application' },
      {
        kind: 'p',
        text:
          'Substitution is careful: if an argument contains a free variable that would be accidentally captured by an inner binder, that binder is renamed first. Watch the variable get renamed here:',
      },
      { kind: 'try', expr: '(\\x y. x) y', caption: 'See capture avoidance (y gets renamed)' },
    ],
  },
  {
    id: 'conversions',
    title: '3. α-conversion and η-reduction',
    blocks: [
      {
        kind: 'p',
        text:
          'Beta reduction is not the only rewrite rule. α-conversion renames a bound variable — λx. x and λy. y are the same function. It is needed when a substitution would otherwise capture a free variable. Turn on "Show α-conversion steps" and reduce the term below: the bound y is renamed before the β-step.',
      },
      {
        kind: 'math',
        latex: '(\\lambda x\\, y.\\; x)\\; y \\;\\xrightarrow{\\;\\alpha\\;}\\; (\\lambda x\\, y\'.\\; x)\\; y \\;\\xrightarrow{\\;\\beta\\;}\\; \\lambda y\'.\\; y',
      },
      { kind: 'try', expr: '(\\x y. x) y', caption: 'Watch α-conversion avoid capture' },
      {
        kind: 'p',
        text:
          'η-reduction says a function that just passes its argument straight through is redundant: λx. (M x) reduces to M whenever x does not appear in M. Enable "Include η-reduction" and reduce this:',
      },
      {
        kind: 'math',
        latex: '\\lambda x.\\; f\\; x \\;\\xrightarrow{\\;\\eta\\;}\\; f',
      },
      { kind: 'try', expr: '\\x. f x', caption: 'η-reduce λx. f x to f' },
    ],
  },
  {
    id: 'strategies',
    title: '4. Reduction strategies',
    blocks: [
      {
        kind: 'p',
        text:
          'When a term has several redexes, which do we reduce first? Normal order always reduces the leftmost-outermost redex; applicative order reduces arguments first (leftmost-innermost), like call-by-value.',
      },
      {
        kind: 'p',
        text:
          'This matters. Normal order finds a normal form whenever one exists. Applicative order can loop forever on terms that normal order would finish. Switch the strategy selector and reduce the term below both ways:',
      },
      { kind: 'try', expr: '(\\a b. b) ((\\x. x x) (\\x. x x))', caption: 'Compare strategies (one diverges)' },
    ],
  },
  {
    id: 'booleans',
    title: '5. Church booleans',
    blocks: [
      {
        kind: 'p',
        text:
          'We can encode data as functions. TRUE picks its first argument, FALSE picks its second. With this, AND, OR, NOT, and IF are just lambda terms — all available as named definitions here.',
      },
      {
        kind: 'math',
        latex: '\\text{TRUE} = \\lambda x\\, y.\\; x \\qquad \\text{FALSE} = \\lambda x\\, y.\\; y',
      },
      { kind: 'try', expr: 'AND TRUE FALSE', caption: 'Reduce AND TRUE FALSE' },
      { kind: 'try', expr: 'NOT FALSE', caption: 'Reduce NOT FALSE' },
    ],
  },
  {
    id: 'numerals',
    title: '6. Church numerals',
    blocks: [
      {
        kind: 'p',
        text:
          'A number n is encoded as a function that applies f to x exactly n times. ZERO applies f zero times, ONE once, and so on. SUCC, PLUS, and MULT operate on these encodings.',
      },
      {
        kind: 'math',
        latex: '\\overline{n} = \\lambda f\\, x.\\; \\underbrace{f\\,(f\\,(\\cdots f\\,}_{n}\\; x)\\cdots)',
      },
      { kind: 'try', expr: 'SUCC ONE', caption: 'Successor of one' },
      { kind: 'try', expr: 'PLUS TWO THREE', caption: 'Two plus three' },
      { kind: 'try', expr: 'MULT TWO THREE', caption: 'Two times three' },
    ],
  },
  {
    id: 'fixpoint',
    title: '7. Recursion and the Y combinator',
    blocks: [
      {
        kind: 'p',
        text:
          'Lambda calculus has no built-in names, so how does a function call itself? A fixed-point combinator like Y manufactures recursion. Y g reduces to g (Y g), feeding a function a copy of itself.',
      },
      {
        kind: 'math',
        latex: 'Y = \\lambda f.\\; (\\lambda x.\\; f\\,(x\\, x))\\,(\\lambda x.\\; f\\,(x\\, x))',
      },
      {
        kind: 'p',
        text:
          'Y unfolds forever under reduction, so use a small step cap and watch how it keeps regenerating its body:',
      },
      { kind: 'try', expr: 'Y g', caption: 'Watch Y g unfold (use the step cap)' },
    ],
  },
]
