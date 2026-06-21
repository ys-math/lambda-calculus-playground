import type { Term } from './ast'
import { mkAbs, mkApp, mkVar } from './ast'
import { freeVars, freshName } from './freeVars'

// Capture-avoiding substitution: [name := value] term.
//
// Replaces every *free* occurrence of `name` in `term` with `value`. When the
// substitution would push `value` under a binder that captures one of value's
// free variables, the binder is alpha-renamed to a fresh name first. This is
// what makes beta-reduction correct.
export function substitute(term: Term, name: string, value: Term): Term {
  switch (term.kind) {
    case 'var':
      return term.name === name ? value : term

    case 'app':
      return mkApp(
        substitute(term.func, name, value),
        substitute(term.arg, name, value),
      )

    case 'abs': {
      // The binder shadows `name`: nothing free named `name` remains inside.
      if (term.param === name) return term

      const valueFree = freeVars(value)
      if (valueFree.has(term.param)) {
        // The binder would capture a free variable of `value`. Rename it.
        const avoid = new Set<string>([
          ...valueFree,
          ...freeVars(term.body),
          name,
        ])
        const fresh = freshName(term.param, avoid)
        const renamedBody = substitute(term.body, term.param, mkVar(fresh))
        return mkAbs(fresh, substitute(renamedBody, name, value))
      }

      return mkAbs(term.param, substitute(term.body, name, value))
    }
  }
}
