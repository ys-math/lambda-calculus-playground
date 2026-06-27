# Lambda Calculus Playground

An interactive web app for **learning lambda calculus** across three calculi —
the **untyped** lambda calculus, the **simply typed** lambda calculus, and the
**Calculus of Constructions** (dependent types). Type a term, watch it reduce
one step at a time with the active redex highlighted, see its inferred type and
typing derivation, and work through guided lessons — all rendered as proper math
with [KaTeX](https://katex.org/).

> **Live demo:** https://ys-math.github.io/lambda-calculus-playground/

## Three modes

Switch modes from the toggle in the header (Untyped · Typed · CoC).

### Untyped lambda calculus

- **Step-by-step reduction** — step forward/back or run to normal form; the redex
  about to be contracted is highlighted at every step. Includes β, optional η, and
  explicit α-conversion steps.
- **Two reduction strategies** — compare **normal order** (leftmost-outermost) with
  **applicative order** (leftmost-innermost) and see how termination differs.
- **Named definitions / macros** — a built-in library of Church booleans, numerals,
  pairs, and combinators (`S K I`, `Y`, …), plus your own `NAME = expression` bindings.
  Reduced terms are folded back into definition names / Church numerals.
- **Step cap** — a configurable bound that safely handles non-terminating terms like
  Ω `= (\x. x x) (\x. x x)`.

### Typed lambda calculus (STLC)

- **Type inference** — Hindley–Milner / Algorithm W infers each term's principal
  simple type (no annotations needed).
- **Typing derivation** — the full proof tree (`var`, `→I`, `→E`) rendered as nested
  inference rules; self-application is reported as *not simply typable*.

### Calculus of Constructions (CoC)

- **Dependent types** — terms, types, and proofs in one language, with the two sorts
  `Prop` and `Type` (`Prop : Type`) and Coq/Lean-flavoured syntax.
- **Type + normal form** — infers each term's (dependent) type or explains the error.
- **Definitions** — add abbreviations (`Name = term`, δ-unfoldable) and postulates
  (`Name : type`) on top of a small standard library (`Nat`, `Bool`, …).
- **Step-by-step β / δ calculation** — a scrubbable reducer that fires the
  leftmost-outermost β-redex, then unfolds definitions (δ), each step highlighted
  and labelled.

### Lessons

A **Learn** panel groups guided lessons into Untyped, Typed, and CoC sections (all
visible regardless of the active mode). Each lesson has one-click "try it" terms
that load into the playground and switch to the matching mode.

## Syntax

### Untyped / Typed

| You type           | Meaning                                   |
| ------------------ | ----------------------------------------- |
| `\x. x` or `λx. x` | abstraction (identity function)           |
| `\x y. x`          | sugar for `\x. \y. x`                      |
| `f a b`            | application, left-associative `((f a) b)` |
| `TRUE`, `SUCC`     | built-in named definitions                |

### CoC (Coq/Lean-flavoured)

| You type                  | Meaning                                       |
| ------------------------- | --------------------------------------------- |
| `fun (x : A) => M`        | abstraction (also `\x : A. M`)                |
| `forall (x : A), B`       | dependent function type (Π); `∀` also accepted |
| `A -> B`                  | non-dependent function type                    |
| `Prop`, `Type`            | the two universes (`Prop : Type`)             |
| `Name = term`             | definition (abbreviation) in the panel         |
| `Name : type`             | postulate (axiom) in the panel                 |

## Running locally

```bash
npm install
npm run dev      # start the dev server
npm run test     # run the engine unit tests (Vitest)
npm run build    # production build into dist/
```

## How it works

Each calculus has a pure, framework-free TypeScript engine so it can be
unit-tested in isolation; the React UI in [`src/components/`](src/components/)
wraps them.

**Untyped** — [`src/lambda/`](src/lambda/):

- `lexer.ts` / `parser.ts` — tokenise and parse source into an AST (`ast.ts`).
- `substitute.ts` — capture-avoiding substitution with alpha-renaming.
- `reduce.ts` — find the next redex per strategy and contract it.
- `environment.ts` / `builtins.ts` — named-definition expansion + standard library.
- `infer.ts` / `unify.ts` / `types.ts` — STLC type inference + typing derivation.
- `pretty.ts` — render a term to ASCII or to LaTeX (with redex highlighting).

**CoC** — [`src/coc/`](src/coc/):

- `lexer.ts` / `parser.ts` — Coq/Lean-flavoured surface syntax → CoC AST (`ast.ts`).
- `normalize.ts` — capture-avoiding substitution, β/δ whnf + normal form, def. equality.
- `check.ts` — bidirectional dependent type checker over the PTS sorts `Prop`/`Type`.
- `reduce.ts` — single-step β/δ reduction for the step-by-step view.
- `environment.ts` / `stdlib.ts` — user definitions (abbreviations + postulates) + library.
- `pretty.ts` — render a CoC term to ASCII or LaTeX (with redex highlighting).

## Deployment

Pushing to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which runs the tests, builds, and publishes `dist/` to GitHub Pages. In your repo
settings, set **Settings → Pages → Source** to **GitHub Actions**.

The Vite `base` is set to `/lambda-calculus-playground/` in `vite.config.ts`; if you rename the
repository, update that value to match.

## License

MIT — see [LICENSE](LICENSE).
