# λ Lambda Calculus Playground

An interactive web app for **learning the untyped lambda calculus**. Type a term,
watch it reduce one beta-step at a time with the active redex highlighted, and
explore Church encodings — all rendered as proper math with [KaTeX](https://katex.org/).

> **Live demo:** https://ys-math.github.io/lambda-calculator/
> _(available once the first Pages deploy finishes)_

## Features

- **Step-by-step reduction** — step forward/back or run to normal form; the redex
  about to be contracted is highlighted at every step.
- **Two reduction strategies** — compare **normal order** (leftmost-outermost) with
  **applicative order** (leftmost-innermost) and see how termination differs.
- **Named definitions / macros** — a built-in library of Church booleans, numerals,
  pairs, and combinators (`S K I`, `Y`, …), plus your own `NAME = expression` bindings.
- **Guided lessons + examples** — a progression from variables and beta reduction
  through Church encodings to the Y combinator, each with one-click "try it" terms.
- **LaTeX rendering** — type ASCII (`\x. x`) and see it as `λx. x`.
- **Step cap** — a configurable bound that safely handles non-terminating terms like
  Ω `= (\x. x x) (\x. x x)`.

## Syntax

| You type           | Meaning                                   |
| ------------------ | ----------------------------------------- |
| `\x. x` or `λx. x` | abstraction (identity function)           |
| `\x y. x`          | sugar for `\x. \y. x`                      |
| `f a b`            | application, left-associative `((f a) b)` |
| `TRUE`, `SUCC`     | built-in named definitions                |

## Running locally

```bash
npm install
npm run dev      # start the dev server
npm run test     # run the interpreter unit tests (Vitest)
npm run build    # production build into dist/
```

## How it works

The interpreter lives in [`src/lambda/`](src/lambda/) as pure, framework-free
TypeScript so it can be unit-tested in isolation:

- `lexer.ts` / `parser.ts` — tokenise and parse source into an AST (`ast.ts`).
- `substitute.ts` — capture-avoiding substitution with alpha-renaming.
- `reduce.ts` — find the next redex per strategy and contract it.
- `environment.ts` / `builtins.ts` — named-definition expansion + standard library.
- `pretty.ts` — render a term to ASCII or to LaTeX (with redex highlighting).

The React UI in [`src/components/`](src/components/) wraps that engine.

## Deployment

Pushing to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which runs the tests, builds, and publishes `dist/` to GitHub Pages. In your repo
settings, set **Settings → Pages → Source** to **GitHub Actions**.

The Vite `base` is set to `/lambda-calculator/` in `vite.config.ts`; if you rename the
repository, update that value to match.

## License

MIT — see [LICENSE](LICENSE).
