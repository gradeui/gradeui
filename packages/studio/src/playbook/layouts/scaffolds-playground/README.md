# Playground scaffolds

Throwaway / experimental scaffolds that live alongside the curated
`scaffolds/` folder. Visible only inside Studio under the **Playground**
tab in the starter picker — never shipped via `REFERENCE_LAYOUTS`,
never seen by the model's retrieval, never surfaced to gradeui.com
visitors.

This is where screenshot-to-JSX experiments live until they're either
graduated to a real reference layout or thrown away.

## File shape

Each scaffold is a `.jsx` file with a JSDoc frontmatter block at the top
describing it. The block is parsed by
`packages/studio/scripts/generate-scaffolds-playground.mjs` and emitted
into the bundle alongside the source.

```jsx
/**
 * @label       CRM dashboard
 * @description Multi-pane CRM — pipeline kanban, contact list, activity timeline.
 * @tags        crm sales pipeline hubspot salesforce deals
 * @source      https://example.com/screenshot.png
 * @notes       Generated from screenshot 2026-05-16. Sidebar nav structure
 *              slightly different from the source.
 */
import { AppShell, ... } from "@gradeui/ui";

export default function App() {
  return <AppShell> ... </AppShell>;
}
```

All fields except `@label` are optional. Tags are space-separated.

## Adding a scaffold

1. Drop `kebab-case-id.jsx` in this folder.
2. Add the JSDoc frontmatter block above the imports.
3. Run `pnpm -F @gradeui/studio gen:scaffolds-playground` (or the
   per-script `node packages/studio/scripts/generate-scaffolds-playground.mjs`).
4. Reload Studio. The new scaffold shows up under the Playground tab.

## DS gaps comment block (required tail)

Every playground scaffold ends with a `// DS gaps surfaced by this scaffold`
comment block listing the things the scaffold had to hand-roll because no
Grade primitive covers them yet. This is the single most valuable signal
the playground produces — when the same gap shows up in two or three
scaffolds, that's the cue to graduate it into `@gradeui/ui`.

If the layout genuinely needs nothing new, the block still goes in with
`// (No new DS gaps — this layout composes cleanly from existing primitives.)`.
Consistency makes the gap audit cheap.

See `todoist-design-requests.jsx` and `whatsapp-community.jsx` for the
format. The skill enforces it on every new scaffold.

### Auditing gaps across the whole folder

```bash
grep -A 20 "DS gaps surfaced" packages/studio/src/playbook/layouts/scaffolds-playground/*.jsx
```

Run this any time you're thinking about what to ship next in `@gradeui/ui`.
When the same primitive name (`<ChatRow>`, `<EditorToolbar>`, `<StatCard>`,
`<ChipInput>`, etc.) shows up in two or three scaffolds, that's the cue to
graduate it. The grep output groups by file so you can scan the whole
roadmap in a single page. When the playground grows past ~10 entries,
swap the ad-hoc grep for a small `gaps-audit.mjs` that dedupes
candidate names and writes a `roadmap.md`.

## Authoring rules

Looser than the curated `scaffolds/` folder — these are screenshot-faithful
prototypes, not training data for the model. Still:

- Use ONLY components from `packages/studio/src/playbook/components/allowlist.ts`.
- Reach for layout primitives (Stack, Row, Grid, Flex, AppShell) over raw flex/grid where it doesn't hurt fidelity.
- Semantic tokens preferred (`bg-background`, `text-muted-foreground`, etc.) but raw colour classes are tolerated when matching a source.

### Arbitrary Tailwind values ARE allowed here

Unlike the curated `scaffolds/` folder, this directory is scanned by
both `apps/docs/tailwind.config.ts` AND `packages/ui/tailwind.config.ts`
(which produces the `@gradeui/ui/styles.css` Fast Frame loads). So
classes like `h-[600px]`, `md:grid-cols-[minmax(0,440px)_1fr]`,
`w-[440px]` etc. compile correctly and the rules show up at runtime.
Screenshot-driven prototypes often need exact pixel measurements during
the first pass — use them freely, then refactor toward the responsive
flex/min-h-0 patterns before graduating to a curated scaffold.

## Graduating to a real reference layout

If a playground scaffold is good enough to ship:

1. `mv packages/studio/src/playbook/layouts/scaffolds-playground/foo.jsx \\
       packages/studio/src/playbook/layouts/scaffolds/foo.jsx`
2. Strip the JSDoc frontmatter from the top of the file.
3. Add an entry to `REFERENCE_LAYOUTS` in
   `packages/studio/src/playbook/layouts/index.ts` (the metadata maps
   1:1 — `label` / `description` / `tags`).
4. Run `pnpm -F @gradeui/studio generate:scaffolds`.
5. Capture a thumbnail with `pnpm -F @gradeui/docs capture:layout-thumbs`.

## Why inline frontmatter (vs a central registry)

Curated `REFERENCE_LAYOUTS` are a deliberate, ordered list — the
registry doubles as the curation surface. The playground is the
opposite: chaotic, frequent churn, throwaway-ready. Asking us to keep a
central registry in sync would be friction; inline frontmatter means
adding/removing a playground scaffold is a single file operation.

## Where this is consumed

The starter picker (`apps/docs/components/studio/starter-picker.tsx`)
imports `PLAYGROUND_SCAFFOLDS` from `@gradeui/studio/playbook`. The
bundle is a tree-shakeable export — it's not pulled into the model's
system prompt or any retrieval path, so it adds zero cost to the
shipped Studio bundle even though it lives inside the package.
