// Example CoC terms, grouped by topic. Clicking one loads it into the CoC input.
// Terms either use the standard context (Nat, Bool, …) or are fully
// self-contained (System-F style impredicative encodings inside CoC).

export interface CoCExample {
  label: string
  expr: string
  note: string
}

export interface CoCExampleGroup {
  title: string
  examples: CoCExample[]
}

export const COC_EXAMPLE_GROUPS: CoCExampleGroup[] = [
  {
    title: 'First steps',
    examples: [
      { label: 'polymorphic id', expr: 'fun (A : Prop) (x : A) => x', note: 'identity for any type A' },
      { label: 'id applied', expr: '(fun (A : Prop) (x : A) => x) Bool', note: 'instantiate id at Bool' },
      { label: 'a number', expr: 'succ (succ zero)', note: 'two, using the standard context' },
      { label: 'const (K)', expr: 'fun (A B : Prop) (x : A) (y : B) => x', note: 'keep the first argument' },
    ],
  },
  {
    title: 'Types & propositions',
    examples: [
      { label: 'identity type', expr: 'forall (A : Prop), A -> A', note: 'the type of polymorphic id' },
      { label: 'arrow Nat→Nat', expr: 'Nat -> Nat', note: 'a function type' },
      { label: 'Prop : Type', expr: 'Prop', note: 'the universe of propositions' },
      { label: 'apply (modus ponens)', expr: 'fun (A B : Prop) (f : A -> B) (a : A) => f a', note: 'from A→B and A get B' },
    ],
  },
  {
    title: 'Church encodings (no axioms)',
    examples: [
      { label: 'Church Bool', expr: 'forall (A : Prop), A -> A -> A', note: 'booleans as a type' },
      { label: 'church true', expr: 'fun (A : Prop) (t : A) (f : A) => t', note: 'pick the first' },
      { label: 'Church Nat', expr: 'forall (A : Prop), (A -> A) -> A -> A', note: 'numerals as a type' },
      { label: 'church two', expr: 'fun (A : Prop) (f : A -> A) (x : A) => f (f x)', note: 'apply f twice' },
    ],
  },
  {
    title: 'Dependent types',
    examples: [
      { label: 'compose', expr: 'fun (A B C : Prop) (g : B -> C) (f : A -> B) (x : A) => g (f x)', note: 'function composition' },
      { label: 'Pi over a value', expr: 'fun (P : Nat -> Prop) (h : forall (n : Nat), P n) => h zero', note: 'P depends on a Nat' },
    ],
  },
]
