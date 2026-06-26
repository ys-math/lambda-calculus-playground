// Ordered guided lessons, split into two sections: untyped and typed lambda
// calculus. Each lesson is a sequence of blocks: prose paragraphs, inline-math
// snippets, and "try it" buttons that load an expression into the playground.
//
// Titles carry no numbers — the Learn panel numbers lessons per section.

export type LessonBlock =
  | { kind: 'p'; text: string }
  | { kind: 'math'; latex: string }
  | { kind: 'try'; expr: string; caption: string }

export type LessonSection = 'untyped' | 'typed' | 'coc'

export interface Lesson {
  id: string
  section: LessonSection
  title: string
  blocks: LessonBlock[]
}

export const LESSONS: Lesson[] = [
  // ===================== Untyped lambda calculus =====================
  {
    id: 'intro',
    section: 'untyped',
    title: 'What is lambda calculus?',
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
    section: 'untyped',
    title: 'Variables: free and bound',
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
    section: 'untyped',
    title: 'Beta reduction',
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
    section: 'untyped',
    title: 'Currying and multiple arguments',
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
    section: 'untyped',
    title: 'α-conversion and η-reduction',
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
    section: 'untyped',
    title: 'Reduction strategies',
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
    id: 'confluence',
    section: 'untyped',
    title: 'Confluence (Church–Rosser)',
    blocks: [
      {
        kind: 'p',
        text:
          'A term can have several redexes, and different strategies reduce them in different orders. The Church–Rosser theorem guarantees this never changes the destination: if a term has a normal form, that normal form is unique.',
      },
      {
        kind: 'math',
        latex: '(\\lambda x\\, y.\\; x)\\;((\\lambda z.\\, z)\\, p)\\; q \\;\\longrightarrow^{*}\\; p',
      },
      {
        kind: 'p',
        text:
          'Below, the inner (λz. z) p could be reduced first, or the outer application — both routes meet at p. Switch the strategy selector and confirm both reach the same result:',
      },
      { kind: 'try', expr: '(\\x y. x) ((\\z. z) p) q', caption: 'Reduce two ways — both give p' },
    ],
  },
  {
    id: 'combinators',
    section: 'untyped',
    title: 'Combinators: S, K, I',
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
    section: 'untyped',
    title: 'Church booleans',
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
    section: 'untyped',
    title: 'Church numerals',
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
    section: 'untyped',
    title: 'Pairs and data structures',
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
    section: 'untyped',
    title: 'Subtraction and comparison',
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
    section: 'untyped',
    title: 'Recursion and the Y combinator',
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

  // ===================== Typed lambda calculus =====================
  {
    id: 'types',
    section: 'typed',
    title: 'Simple types and inference',
    blocks: [
      {
        kind: 'p',
        text:
          'These lessons cover Typed mode. Loading any example here switches the app into Typed mode, where it infers the term’s simplest type and draws the typing derivation. A simple type is either a type variable (a, b, …) or a function type A → B.',
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
          'Every typable term has a most general (principal) type. The identity works at any type, so it gets a → a. Load these and watch the derivation build:',
      },
      { kind: 'try', expr: '\\x. x', caption: 'Type the identity (a → a)' },
      { kind: 'try', expr: '\\f x. f x', caption: 'Type application ((a → b) → a → b)' },
    ],
  },
  {
    id: 'typed-derivation',
    section: 'typed',
    title: 'Reading the typing derivation',
    blocks: [
      {
        kind: 'p',
        text:
          'When Typed mode infers a type it draws a typing derivation — a proof tree. Each row is a judgment Γ ⊢ M : T, read “in the context Γ, the term M has type T.” The context Γ lists the type assumed for every variable currently in scope.',
      },
      {
        kind: 'math',
        latex: 'f {:}\\, a \\to b,\\; x {:}\\, a \\;\\vdash\\; f\\, x : b',
      },
      {
        kind: 'p',
        text:
          'Read the tree from the bottom up. The conclusion — the term you asked about — sits under the bottom bar; above each bar are the premises it needs, and the rule name on the right says which typing rule justifies that step. The leaves are var steps: a variable’s type read straight out of the context, with nothing above the bar.',
      },
      {
        kind: 'math',
        latex: '\\dfrac{\\;}{\\Gamma,\\, x{:}A \\vdash x : A}\\;(\\mathsf{var})',
      },
      {
        kind: 'p',
        text:
          'Here is the whole derivation for the identity — one var leaf, wrapped by one →I step. To type λx. x we use →I, which needs the body typed with x : a in scope; that body is a var leaf giving x : a. The result is a → a.',
      },
      {
        kind: 'math',
        latex:
          '\\dfrac{\\dfrac{\\;}{x {:}\\, a \\vdash x : a}\\;(\\mathsf{var})}{\\vdash \\lambda x.\\, x : a \\to a}\\;({\\to}\\mathsf{I})',
      },
      { kind: 'try', expr: '\\x. x', caption: 'See the identity’s derivation' },
    ],
  },
  {
    id: 'typed-derivation-app',
    section: 'typed',
    title: 'A bigger derivation: application',
    blocks: [
      {
        kind: 'p',
        text:
          'Application is typed with the →E rule, which has two premises — the function and its argument. →E checks that the function’s input type matches the argument’s type, and the conclusion is the function’s output type.',
      },
      {
        kind: 'math',
        latex:
          '\\dfrac{\\dfrac{\\;}{f {:}\\, a \\to b,\\, x {:}\\, a \\vdash f : a \\to b}\\;(\\mathsf{var}) \\qquad \\dfrac{\\;}{f {:}\\, a \\to b,\\, x {:}\\, a \\vdash x : a}\\;(\\mathsf{var})}{f {:}\\, a \\to b,\\, x {:}\\, a \\vdash f\\, x : b}\\;({\\to}\\mathsf{E})',
      },
      {
        kind: 'p',
        text:
          'Both premises here are var leaves: from the context f : a → b and x : a. →E matches the function’s input a against the argument’s type a and concludes f x : b.',
      },
      {
        kind: 'p',
        text:
          'Now wrap that in the two binders λf. λx. … — each adds an →I step that discharges one assumption from the context, giving the full type (a → b) → a → b. Load it and read the whole tree, bottom row first:',
      },
      { kind: 'try', expr: '\\f x. f x', caption: 'Read the full application derivation' },
    ],
  },
  {
    id: 'typed-functions',
    section: 'typed',
    title: 'Reading function types',
    blocks: [
      {
        kind: 'p',
        text:
          'A term’s type mirrors its structure. The constant function takes an a and a b and returns the a, so it has type a → b → a. Arrows associate to the right, so this means a → (b → a).',
      },
      {
        kind: 'math',
        latex: '\\text{K} = \\lambda x\\, y.\\; x \\;:\\; a \\to b \\to a',
      },
      { kind: 'try', expr: '\\x y. x', caption: 'Type K (a → b → a)' },
      {
        kind: 'p',
        text:
          'Composition feeds its input through g and then f. Its type threads three variables — an a → b, a c → a, and a c — producing b. Note the parentheses: an arrow on the left of another arrow must be parenthesised, because → is right-associative.',
      },
      {
        kind: 'math',
        latex: '\\lambda f\\, g\\, x.\\; f\\,(g\\, x) \\;:\\; (a \\to b) \\to (c \\to a) \\to c \\to b',
      },
      { kind: 'try', expr: '\\f g x. f (g x)', caption: 'Type composition' },
    ],
  },
  {
    id: 'typed-occurs',
    section: 'typed',
    title: 'When typing fails: the occurs check',
    blocks: [
      {
        kind: 'p',
        text:
          'Not every untyped term has a simple type. To type self-application λx. x x, the application x x forces x to be both a function a → b and its own argument a — that is, a = a → b. No finite type satisfies that, so inference fails the occurs check.',
      },
      {
        kind: 'math',
        latex: 'x : a \\quad\\Longrightarrow\\quad x\\, x \\text{ needs } a = a \\to b \\;\\; (\\text{impossible})',
      },
      { kind: 'try', expr: '\\x. x x', caption: 'λx. x x — not simply typable' },
      {
        kind: 'p',
        text:
          'This is the whole point of types: the paradoxical terms behind Ω and the Y combinator are exactly the ones simple types reject. Their untyped versions still run fine in Untyped mode.',
      },
      { kind: 'try', expr: '(\\x. x x) (\\y. y)', caption: 'An Ω-style term — also untypable' },
    ],
  },
  {
    id: 'typed-termination',
    section: 'typed',
    title: 'Typed terms always terminate',
    blocks: [
      {
        kind: 'p',
        text:
          'A landmark theorem — strong normalization — says every simply typed term reduces to a normal form, no matter which strategy you use. Typed lambda calculus simply cannot loop forever.',
      },
      {
        kind: 'p',
        text:
          'So you can never build Ω or an endless Y-unfolding out of typable pieces. Here is a typable term: it has a type and it terminates.',
      },
      { kind: 'try', expr: '(\\f x. f x) g a', caption: 'Typable and terminating (type b)' },
      {
        kind: 'p',
        text:
          'By contrast, the looping shapes from Untyped mode have no type at all — here, termination and typability go hand in hand.',
      },
      { kind: 'try', expr: '\\x. x x', caption: 'The non-terminating shape is untypable' },
    ],
  },
  {
    id: 'typed-encodings',
    section: 'typed',
    title: 'Typing the encodings',
    blocks: [
      {
        kind: 'p',
        text:
          'The Church encodings are typable too. Because Typed mode types a term exactly as written, load the expanded lambda forms here (not the names TRUE, TWO, …).',
      },
      {
        kind: 'p',
        text:
          'TRUE picks the first of two arguments, so it has type a → b → a — the very same type as K.',
      },
      {
        kind: 'math',
        latex: '\\lambda x\\, y.\\; x \\;:\\; a \\to b \\to a',
      },
      { kind: 'try', expr: '\\x y. x', caption: 'TRUE / K : a → b → a' },
      {
        kind: 'p',
        text:
          'A Church numeral applies f to x some number of times. For n ≥ 1 every numeral has type (a → a) → a → a — a function and a starting value:',
      },
      {
        kind: 'math',
        latex: '\\lambda f\\, x.\\; f\\,(f\\, x) \\;:\\; (a \\to a) \\to a \\to a',
      },
      { kind: 'try', expr: '\\f x. f (f x)', caption: 'TWO : (a → a) → a → a' },
      { kind: 'try', expr: '\\f x. f (f (f x))', caption: 'THREE : the same type' },
      {
        kind: 'p',
        text:
          'ZERO and ONE have more general principal types (their f need not be used, or used only once), but they can all be used at this common numeral type (a → a) → a → a.',
      },
    ],
  },
  {
    id: 'typed-curry-howard',
    section: 'typed',
    title: 'Curry–Howard: types are propositions',
    blocks: [
      {
        kind: 'p',
        text:
          'Read → as logical implication and a remarkable correspondence appears: a type is a proposition, and a term of that type is a proof of it. This is the Curry–Howard correspondence.',
      },
      {
        kind: 'p',
        text:
          'The identity proves a → a (anything implies itself). K proves a → b → a. And the →I and →E rules are exactly implication-introduction and modus ponens from logic — the typing derivation is a proof tree.',
      },
      {
        kind: 'math',
        latex: 'I : a \\to a \\qquad K : a \\to b \\to a \\qquad S : (a \\to b \\to c) \\to (a \\to b) \\to a \\to c',
      },
      { kind: 'try', expr: '\\x. x', caption: 'Proof of a → a' },
      { kind: 'try', expr: '\\x y. x', caption: 'Proof of a → b → a' },
      { kind: 'try', expr: '\\f g x. f x (g x)', caption: 'Proof of the S axiom' },
    ],
  },

  // ================= Calculus of Constructions =================
  {
    id: 'coc-intro',
    section: 'coc',
    title: 'What is the Calculus of Constructions?',
    blocks: [
      {
        kind: 'p',
        text:
          'The Calculus of Constructions (CoC) is a lambda calculus with dependent types. Here types are not a separate layer bolted on top of terms — types are themselves terms, written in the very same language. This one idea is the foundation of modern proof assistants like Coq and Lean.',
      },
      {
        kind: 'p',
        text:
          'Because types are terms, a function can take a type as an argument and return one, types can be computed, and — the key novelty — a type may mention a value. “A list of length n” is a type that depends on the number n. That is what “dependent” means.',
      },
      {
        kind: 'p',
        text:
          'Switch to the CoC tab (top right) to follow along. The input uses Coq/Lean-style syntax: fun (x : A) => body for a function, forall (x : A), B for a dependent function type, A -> B for an ordinary one. The panel shows each term’s type and its normal form.',
      },
      { kind: 'try', expr: 'fun (A : Prop) (x : A) => x', caption: 'The polymorphic identity' },
    ],
  },
  {
    id: 'coc-sorts',
    section: 'coc',
    title: 'Two universes: Prop and Type',
    blocks: [
      {
        kind: 'p',
        text:
          'If types are terms, then types must have types too. CoC organises them into two universes (called sorts): Prop, the universe of propositions and small types, and Type, the universe above it. The fundamental axiom is that Prop itself has type Type.',
      },
      {
        kind: 'math',
        latex: '\\mathsf{Prop} : \\mathsf{Type}',
      },
      {
        kind: 'p',
        text:
          'So there are layers: a value like x lives in a type like A; that type A lives in Prop; and Prop lives in Type. Load Prop below and read its type in the panel — it is Type. (Type has no type of its own; it is the top of the tower.)',
      },
      { kind: 'try', expr: 'Prop', caption: 'Load Prop (its type is Type)' },
    ],
  },
  {
    id: 'coc-pi',
    section: 'coc',
    title: 'Dependent function types (∀)',
    blocks: [
      {
        kind: 'p',
        text:
          'The heart of CoC is the dependent function type, written forall (x : A), B. It is the type of functions that take an x of type A and return a result of type B — where B is allowed to mention x. When B does not mention x, it collapses to the ordinary arrow A -> B.',
      },
      {
        kind: 'math',
        latex:
          '\\mathsf{id} \\;:\\; \\forall\\,(A {:}\\, \\mathsf{Prop}),\\; A \\to A',
      },
      {
        kind: 'p',
        text:
          'Look at the polymorphic identity. It first takes a type A, then an x of that type, and returns x. Its type is a forall: the type of the second argument and of the result both depend on the first argument A. That dependence is impossible to express in the simply typed calculus.',
      },
      {
        kind: 'p',
        text:
          'Applying it to a concrete type specialises it. Feed Bool to id and the panel shows the result has type Bool -> Bool — the A in the type has been replaced by Bool. This substitution-into-the-type is exactly the →E rule made dependent.',
      },
      { kind: 'try', expr: 'fun (A : Prop) (x : A) => x', caption: 'id : ∀(A:Prop), A → A' },
      { kind: 'try', expr: '(fun (A : Prop) (x : A) => x) Bool', caption: 'id Bool : Bool → Bool' },
    ],
  },
  {
    id: 'coc-encodings',
    section: 'coc',
    title: 'Data from nothing: Church encodings',
    blocks: [
      {
        kind: 'p',
        text:
          'With dependent/polymorphic functions you can build data types using no built-in data at all — the same Church encodings as in the untyped calculus, but now they have honest types. A boolean is anything that, given two results of some type A, picks one.',
      },
      {
        kind: 'math',
        latex: '\\mathsf{Bool} \\;:=\\; \\forall\\,(A {:}\\, \\mathsf{Prop}),\\; A \\to A \\to A',
      },
      {
        kind: 'p',
        text:
          'A natural number is anything that, given a function f and a start x, applies f some number of times. “Two” applies f twice. Load these and check their types in the panel; they are the encodings’ types written as foralls.',
      },
      {
        kind: 'math',
        latex:
          '\\mathsf{Nat} \\;:=\\; \\forall\\,(A {:}\\, \\mathsf{Prop}),\\; (A \\to A) \\to A \\to A',
      },
      { kind: 'try', expr: 'fun (A : Prop) (t : A) (f : A) => t', caption: 'true : Church Bool' },
      { kind: 'try', expr: 'fun (A : Prop) (f : A -> A) (x : A) => f (f x)', caption: 'two : Church Nat' },
    ],
  },
  {
    id: 'coc-curry-howard',
    section: 'coc',
    title: 'Propositions as types, proofs as programs',
    blocks: [
      {
        kind: 'p',
        text:
          'In the simply typed calculus, → was implication. CoC extends the dictionary: the dependent function forall (x : A), B is the universal quantifier “for all x in A, B holds”. A term of that type is a uniform proof that works for every x. This is why CoC can serve as a logic.',
      },
      {
        kind: 'p',
        text:
          'Modus ponens is still just function application: from a proof of A -> B and a proof of A, applying one to the other yields a proof of B. The program is the proof; running it (normalising) is checking the proof.',
      },
      {
        kind: 'math',
        latex:
          '\\dfrac{f : A \\to B \\qquad a : A}{f\\; a : B}\\;({\\to}\\mathsf{E})',
      },
      {
        kind: 'p',
        text:
          'The example below takes propositions A and B, a proof f of A -> B, and a proof a of A, and produces a proof of B. Load it and confirm the panel reports its type as the implication ∀(A B:Prop), (A → B) → A → B.',
      },
      { kind: 'try', expr: 'fun (A B : Prop) (f : A -> B) (a : A) => f a', caption: 'Modus ponens' },
      { kind: 'try', expr: 'fun (A B C : Prop) (g : B -> C) (f : A -> B) (x : A) => g (f x)', caption: 'Compose two implications' },
    ],
  },
]
