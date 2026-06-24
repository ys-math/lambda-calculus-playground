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
    id: 'variables',
    title: '2. Variables: free and bound',
    blocks: [
      {
        kind: 'p',
        text:
          'A λ binds its parameter. Inside λx. M the name x is bound; any variable not bound by an enclosing λ is free. In the term below, x is bound but y is free.',
      },
      {
        kind: 'math',
        latex: '\\lambda x.\\; x\\; y \\qquad (x\\text{ bound},\\; y\\text{ free})',
      },
      {
        kind: 'p',
        text:
          'This distinction is everything: reduction substitutes only for free occurrences, and the same name can be bound in one place and free in another. The two x’s below belong to different functions and are completely unrelated.',
      },
      {
        kind: 'math',
        latex: '(\\lambda x.\\, x)\\;(\\lambda x.\\, x)',
      },
      {
        kind: 'p',
        text:
          'When you reduce, a bound variable’s uses are replaced by the argument while free variables survive untouched. Load this — the bound x is consumed, the free y remains:',
      },
      { kind: 'try', expr: '(\\x. x y) (\\z. z)', caption: 'Reduce (\\x. x y) (\\z. z)' },
    ],
  },
  {
    id: 'beta',
    title: '3. Beta reduction',
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
    id: 'currying',
    title: '4. Currying and multiple arguments',
    blocks: [
      {
        kind: 'p',
        text:
          'Every function takes exactly one argument. We model multi-argument functions by returning functions: λx y. M is just shorthand for λx. (λy. M). This is called currying.',
      },
      {
        kind: 'math',
        latex: '\\lambda x\\, y.\\; M \\;\\equiv\\; \\lambda x.\\;(\\lambda y.\\; M)',
      },
      {
        kind: 'p',
        text:
          'Because of this you can apply a function to fewer arguments than it “expects” and get back a function — partial application. Applying the constant function to one argument leaves a function that ignores its next input:',
      },
      { kind: 'try', expr: '(\\x y. x) a', caption: 'Partially apply (\\x y. x) a' },
      {
        kind: 'p',
        text:
          'Application associates to the left, so f a b means (f a) b — arguments are fed in one at a time:',
      },
      { kind: 'try', expr: '(\\x y z. z x y) a b', caption: 'Apply two of three arguments' },
    ],
  },
  {
    id: 'conversions',
    title: '5. α-conversion and η-reduction',
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
    title: '6. Reduction strategies',
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
    id: 'combinators',
    title: '7. Combinators: S, K, I',
    blocks: [
      {
        kind: 'p',
        text:
          'A combinator is a closed term — a lambda term with no free variables. Three are famous: I (identity), K (the constant function), and S (which distributes an argument to two functions).',
      },
      {
        kind: 'math',
        latex: 'I = \\lambda x.\\, x \\qquad K = \\lambda x\\, y.\\, x \\qquad S = \\lambda f\\, g\\, x.\\; f\\, x\\,(g\\, x)',
      },
      {
        kind: 'p',
        text:
          'Astonishingly, S and K alone can express any lambda term — you don’t even need I, because S K K behaves exactly like it. Step through the proof:',
      },
      { kind: 'try', expr: 'S K K x', caption: 'Show S K K x reduces to x' },
      {
        kind: 'p',
        text:
          'Other handy combinators are B (compose), C (flip), and W (duplicate), all available as named definitions. Here B composes NOT with itself:',
      },
      { kind: 'try', expr: 'B NOT NOT TRUE', caption: 'Compose with B: NOT (NOT TRUE)' },
    ],
  },
  {
    id: 'booleans',
    title: '8. Church booleans',
    blocks: [
      {
        kind: 'p',
        text:
          'We can encode data as functions. TRUE picks its first argument, FALSE picks its second. With this, AND, OR, NOT, XOR, and IF are just lambda terms — all available as named definitions here.',
      },
      {
        kind: 'math',
        latex: '\\text{TRUE} = \\lambda x\\, y.\\; x \\qquad \\text{FALSE} = \\lambda x\\, y.\\; y',
      },
      { kind: 'try', expr: 'AND TRUE FALSE', caption: 'Reduce AND TRUE FALSE' },
      { kind: 'try', expr: 'NOT FALSE', caption: 'Reduce NOT FALSE' },
      { kind: 'try', expr: 'XOR TRUE TRUE', caption: 'Reduce XOR TRUE TRUE' },
    ],
  },
  {
    id: 'numerals',
    title: '9. Church numerals',
    blocks: [
      {
        kind: 'p',
        text:
          'A number n is encoded as a function that applies f to x exactly n times. ZERO applies f zero times, ONE once, and so on. SUCC, PLUS, MULT, and POW operate on these encodings.',
      },
      {
        kind: 'math',
        latex: '\\overline{n} = \\lambda f\\, x.\\; \\underbrace{f\\,(f\\,(\\cdots f\\,}_{n}\\; x)\\cdots)',
      },
      { kind: 'try', expr: 'SUCC ONE', caption: 'Successor of one' },
      { kind: 'try', expr: 'PLUS TWO THREE', caption: 'Two plus three' },
      { kind: 'try', expr: 'MULT TWO THREE', caption: 'Two times three' },
      { kind: 'try', expr: 'POW TWO THREE', caption: 'Two to the power three (→ 8)' },
    ],
  },
  {
    id: 'pairs',
    title: '10. Pairs and data structures',
    blocks: [
      {
        kind: 'p',
        text:
          'If functions are all we have, how do we store two things at once? Encode a pair as a function that holds both components and hands them to a selector you supply later.',
      },
      {
        kind: 'math',
        latex: '\\text{PAIR} = \\lambda x\\, y\\, f.\\; f\\, x\\, y \\qquad \\text{FST} = \\lambda p.\\; p\\,\\text{TRUE} \\qquad \\text{SND} = \\lambda p.\\; p\\,\\text{FALSE}',
      },
      {
        kind: 'p',
        text:
          'FST and SND simply feed the pair the booleans TRUE and FALSE, reusing the “pick first / pick second” behaviour of Church booleans. Build a pair and take it apart:',
      },
      { kind: 'try', expr: 'FST (PAIR a b)', caption: 'Project the first component' },
      { kind: 'try', expr: 'SND (PAIR a b)', caption: 'Project the second component' },
    ],
  },
  {
    id: 'subtraction',
    title: '11. Subtraction and comparison',
    blocks: [
      {
        kind: 'p',
        text:
          'Addition and multiplication of Church numerals are easy; subtraction is famously not. The trick is PRED, the predecessor, which peels one application off a numeral. With it, subtraction is just repeated predecessor.',
      },
      {
        kind: 'math',
        latex: '\\text{PRED}\\;\\overline{n+1} = \\overline{n} \\qquad \\text{SUB}\\; m\\; n = \\max(0,\\; m - n)',
      },
      {
        kind: 'p',
        text:
          'Comparisons follow: m ≤ n exactly when m − n is zero, and equality is ≤ in both directions. These take more steps to reduce, but the default step cap is plenty:',
      },
      { kind: 'try', expr: 'PRED THREE', caption: 'Predecessor of three (→ 2)' },
      { kind: 'try', expr: 'SUB FOUR TWO', caption: 'Four minus two (→ 2)' },
      { kind: 'try', expr: 'LEQ TWO THREE', caption: 'Is 2 ≤ 3? (→ TRUE)' },
      { kind: 'try', expr: 'EQ TWO TWO', caption: 'Numeric equality (→ TRUE)' },
    ],
  },
  {
    id: 'fixpoint',
    title: '12. Recursion and the Y combinator',
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
  {
    id: 'types',
    title: '13. Simple types and inference',
    blocks: [
      {
        kind: 'p',
        text:
          'Flip the Untyped / Typed switch at the top to enter typed mode. There the app infers each term’s simplest type and draws the typing derivation. A simple type is either a type variable (a, b, …) or a function type A → B.',
      },
      {
        kind: 'p',
        text:
          'Two rules do all the work: →I types a function by typing its body with the parameter in scope, and →E types an application by matching the function’s input type to the argument.',
      },
      {
        kind: 'math',
        latex:
          '\\dfrac{\\Gamma,\\, x{:}A \\vdash M : B}{\\Gamma \\vdash \\lambda x.\\,M : A \\to B}\\;({\\to}\\mathsf{I}) \\qquad \\dfrac{\\Gamma \\vdash M : A \\to B \\quad \\Gamma \\vdash N : A}{\\Gamma \\vdash M\\,N : B}\\;({\\to}\\mathsf{E})',
      },
      {
        kind: 'p',
        text:
          'Every typable term has a most general (principal) type. The identity works at any type, so it gets a → a. Turn on Typed mode and load these:',
      },
      { kind: 'try', expr: '\\x. x', caption: 'Type the identity (a → a)' },
      { kind: 'try', expr: '\\f x. f x', caption: 'Type application ((a → b) → a → b)' },
      {
        kind: 'p',
        text:
          'But not every untyped term is typable. Self-application λx. x x would need x to be both a and a → b at once — impossible with finite types (the occurs check fails). This is exactly why the untyped Y combinator and Ω have no simple type.',
      },
      { kind: 'try', expr: '\\x. x x', caption: 'See why λx. x x has no simple type' },
    ],
  },
]
