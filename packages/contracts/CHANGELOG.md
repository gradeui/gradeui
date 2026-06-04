# @gradeui/contracts

## 0.1.0

### Minor Changes

- 0686676: Inspector-parity polish across the contract pipeline and panel chrome.

  **@gradeui/contracts** — new optional `variantDefaults` field on
  `ComponentContract`: the primary cva's `defaultVariants` extracted from
  component source (`{ variant: "default", size: "md" }`). Lets consumers
  (the Studio inspector) show the REAL resolved value for an unset enum
  prop instead of a meaningless "(default)". Additive; existing contracts
  are unaffected.

  **@gradeui/ui**

  - `generate:contracts` now emits `variantDefaults` per component
    (resolved from the cva referenced by the root part); all generated
    contracts regenerated.
  - `Input`: the dense panel sizes (`xs`, `2xs`) drop the base
    `shadow-sm` (`shadow-none`) so they sit flush with `SelectTrigger` in
    tool panels. `default`/`sm` keep their shadow.
  - `Select`: trigger placeholder muting fixed — `placeholder:` is the
    input pseudo-element and never matched Radix's placeholder span; now
    `data-[placeholder]:text-muted-foreground`, so placeholder/ghost
    values actually render muted.
