# CLAUDE.md

Guidance for Claude Code working in this repository.

## What this is

**Lambda Calculus Playground** — a React + TypeScript + Vite single-page app for
learning lambda calculus, published to GitHub Pages. It has three modes, each with
its own pure (DOM-free) engine plus a React UI:

- **Untyped** lambda calculus — `src/lambda/`
- **Simply Typed** lambda calculus (Hindley–Milner inference) — also `src/lambda/`
  (`infer.ts`, `unify.ts`, `types.ts`)
- **Calculus of Constructions** (dependent types) — `src/coc/`

The mode lives in `App.tsx` (`type Mode = 'untyped' | 'typed' | 'coc'`, persisted in
localStorage). All math is rendered with KaTeX via `src/components/MathView.tsx`.

## Architecture

- Engines are **pure TypeScript** (no React/DOM) so they unit-test in isolation.
  Keep new logic there, not in components.
- Each engine follows the same shape: `lexer` → `parser` → AST → reduction +
  (for typed/CoC) a type checker → `pretty` (ASCII + LaTeX).
- `pretty.toLatex(term, highlightPath?)` wraps a sub-term in `\htmlClass{redex}{…}`
  for step highlighting; the stepper components scrub a precomputed sequence.
- Lessons/examples are data: `src/data/lessons.ts` (sectioned `untyped|typed|coc`),
  `src/data/examples.ts`, `src/data/cocExamples.ts`.

## Commands

```bash
npm install        # use install, NOT ci (see Gotchas)
npm run dev        # dev server
npm run test       # Vitest (node env, includes src/**/*.test.ts)
npm run build      # tsc -b && vite build  (type-checks the whole app)
```

Always run `npm run test` **and** `npm run build` before committing — the build is
the only full type-check.

## Conventions

- Match the surrounding style: terse top-of-file comments explaining the *why*,
  `interface` discriminated unions with a `kind` field, `{ ok: true; … } | { ok: false; error }`
  result types instead of throwing across module boundaries.
- New "try it" lesson terms and every example **must type-check / parse** — this is
  enforced by tests (`src/coc/coc.test.ts` parametrises over `COC_EXAMPLE_GROUPS` and
  CoC lesson `try` blocks; `src/data/lessons.test.ts` renders every lesson math block
  through KaTeX in strict mode). Verify new content against the engine before adding.
- When adding CoC features, thread the δ-environment (`Defs`, name→body map) through
  `whnf`/`normalize`/`defEqual`/`check` rather than unfolding eagerly.

## Gotchas (learned the hard way)

- **`erasableSyntaxOnly` + `verbatimModuleSyntax`** (tsconfig): no `enum`, no
  constructor parameter properties, use `import type` for type-only imports.
- **KaTeX has no `\strut`** and no proof-tree packages. Build derivations with nested
  `\dfrac`; use `\;` for spacing. A render-regression test guards against bad LaTeX.
- **CoC has only two sorts** (`Prop : Type`, `Type` is untyped). So `Type` has no
  type, and a postulate's declared type must inhabit a sort — `X : Type` is correctly
  rejected; postulate abstract base types in `Prop` (e.g. `Color : Prop`). No
  universe hierarchy and no inductive datatypes (deliberate; possible future work).
- **CI uses `npm install --no-audit --no-fund`, not `npm ci`** — `npm ci` fails on a
  cross-platform optional-dependency mismatch in Vite's rolldown wasm binding.
- **Vite `base`** is `/lambda-calculus-playground/`; preview/deploy URLs include it.

## Verifying UI in a real browser

Screenshot/inspection workflow used in this repo: `npm run preview -- --port <p>`,
launch headless Chrome with `--remote-debugging-port`, connect over the CDP
WebSocket (Node has a global `WebSocket`), set React-controlled inputs via the
native value setter + `dispatchEvent(new Event('input', { bubbles: true }))`, click
`.mode-toggle` / `.try-btn` / stepper buttons, then assert
`document.querySelectorAll('.katex-error').length === 0` and capture a screenshot.

## Git / deployment

- Commit messages end with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- **Pushing to `main` deploys to production** (GitHub Pages via
  `.github/workflows/deploy.yml`). Only push to `main` when the user explicitly says
  to ship; then poll the deploy with `gh run …` to confirm success.
