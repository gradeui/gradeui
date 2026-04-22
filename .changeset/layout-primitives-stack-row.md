---
"@gradeui/ui": minor
---

Add `Stack` and `Row` — the first wave of layout primitives.

These exist so the model (and a human reaching for the settings panel) composes pages with named layout components instead of hand-rolling `flex flex-col gap-*` on every generation. The alignment, gap, and distribution knobs are variant props, which means they become editable in Studio the moment Studio can see them — the same way every other DS component's settings come through.

**`Stack`** — vertical rhythm primitive.

- `gap`: `none | xs | sm | md | lg | xl | 2xl` (default `md`)
- `align`: `start | center | end | stretch` (default `stretch`)
- `asChild` via Radix Slot for stamping onto a semantic tag (`<section>`, `<main>`, etc.)
- Root class `rds-stack flex flex-col`, `data-gds-part="stack"`
- Exported alongside `stackVariants` and `StackProps`

**`Row`** — horizontal rhythm primitive.

- `gap`: same scale as Stack
- `align`: `start | center | end | stretch | baseline` (default `center` — matches what most real rows want)
- `justify`: `start | center | end | between | around | evenly` (default `start`)
- `wrap`: boolean (default `false`)
- `asChild` via Radix Slot
- Root class `rds-row flex flex-row`, `data-gds-part="row"`
- Exported alongside `rowVariants` and `RowProps`

Row is distinct from a two-pane `Split` primitive (coming later). Row evenly flows whatever children it holds with a shared gap; `Split` will enforce an explicit pane ratio (1/3 + 2/3, sidebar + content, etc.).

Both components have sidecar docs in `apps/docs/components/ui/{stack,row}.md` with a new `role: layout` frontmatter field — the first use of the role taxonomy that slot-based App Shells / scaffolds will filter against.
