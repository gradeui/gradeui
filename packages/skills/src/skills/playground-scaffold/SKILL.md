---
name: playground-scaffold
description: >
  Generates a new playground scaffold for the Grade design system (gradeui) from a
  screenshot, a URL, or a textual description. Writes the JSX file into
  packages/studio/src/playbook/layouts/scaffolds-playground/ with the required JSDoc
  frontmatter, regenerates the bundle, and tells the user where the new entry will
  show up in Studio. Use this skill whenever the user shares a screenshot or design
  reference and asks to "playground this", "scaffold this screenshot", "add this to
  the playground", "experiment with this design", "make a playground from this",
  "drop this into the playground tab", or any variation that implies converting a
  visual into a Grade-flavoured prototype that lives in the Playground tab (not the
  curated reference layouts). Also use when the user wants to iterate on an existing
  playground scaffold ("update the crm playground", "redo the dashboard playground
  with a bigger sidebar"). Lean on this skill — guessing the file path, frontmatter
  format, or which Tailwind values are allowed wastes time when this skill captures
  the exact workflow.
---

# Playground scaffold — screenshot → JSX

Convert a visual reference into a `.jsx` scaffold that lives in the Grade design
system's Playground tab. Playground scaffolds are siloed from the curated reference
layouts: they're for screenshot-faithful experiments, throwaway prototypes, and the
"can the DS actually express this" testing loop. Never shipped to gradeui.com
visitors, never seen by the model's retrieval, never auto-graduated to the
curated set.

## When to reach for this skill vs not

**Reach for it when:**
- The user shares a screenshot / image and wants a Grade-flavoured replica.
- The user describes a UI ("a CRM with a left-rail pipeline kanban and a contact
  detail pane") and wants it scaffolded for the Playground.
- The user asks to iterate on or replace an existing playground entry.

**Don't use it when:**
- The user is asking for a curated reference layout (those go in
  `packages/studio/src/playbook/layouts/scaffolds/` and require an entry in
  `REFERENCE_LAYOUTS`). Playground is the loose sandbox; curated is the vetted set.
- The user wants a brand-new DS component (sidecar + contract + barrel exports —
  totally different workflow).
- The user just wants to discuss an idea without writing a file.

## Workflow

### 1. Confirm intent and gather inputs

If the trigger is ambiguous, confirm in one short message:
- Is this for the Playground tab (this skill) or a curated reference layout?
- If the user hasn't dropped a screenshot, are they providing a URL, a Figma link,
  or a written description?

If you have a screenshot in the conversation, that's the source of truth — read
it carefully before writing anything.

### 2. Read the playbook before writing JSX

These are the inputs the scaffold MUST respect. Read them at the start of every
invocation — they change over time and stale memory will produce broken scaffolds.

- **Allowlist** — `packages/studio/src/playbook/components/allowlist.ts`
  Only components in `ALLOWED_COMPONENTS` (and external imports in
  `ALLOWED_EXTERNAL_IMPORTS`) may appear in the JSX. Anything else won't resolve
  in Fast Frame.
- **Component inventory** — `packages/ui/COMPONENTS.md`
  The source-of-truth list of every Grade component with one-line descriptions.
  Skim it before guessing whether a component exists.
- **Sidecars** — `packages/ui/components/ui/*.md`
  Per-component usage rules. For any component you're not certain about (Sortable,
  Sidebar, Carousel, Map, MediaSurface, MultiSelect, etc.), READ the relevant
  sidecar before composing it. Sidecars list the compound API, anti-patterns, and
  the exact prop shape.
- **Existing scaffolds** — `packages/studio/src/playbook/layouts/scaffolds/*.jsx`
  Patterns to mirror — particularly `linear-clone.jsx`, `notion-clone.jsx`,
  `kanban-board.jsx` for app-shell heavy layouts.
- **Playground README** —
  `packages/studio/src/playbook/layouts/scaffolds-playground/README.md`
  Frontmatter format, graduation path, current authoring rules.

### 3. Identify structural primitives

Before writing line one of JSX, identify the structural patterns in the screenshot:

- **App scaffold**: pick the AppShell `nav` variant that matches the source.
  - `nav="none"` — single-column marketing / landing.
  - `nav="top"` — top bar + content (Reddit-style chrome).
  - `nav="side"` — left nav + content (Linear, Notion sidebars).
  - `nav="three-pane"` — narrow icon rail + Aside + Main (Slack, WhatsApp,
    Plane, Mail). This is **the right answer whenever you see a vertical
    icon rail next to a separate list/sidebar.** Compose with
    `<AppShellNav placement="side">` (the rail), `<AppShellAside>` (the
    middle column), `<AppShellMain>` (content). Override the middle
    column's width via the CSS var: `style={{ "--gds-app-shell-aside":
    "245px" }}` on the AppShell root. AppShellHeader / AppShellFooter
    add full-bleed top/bottom rows.
- **Sidebar**: flat list of items? grouped sections? nested page tree? →
  `<Sidebar>` + `<SidebarHeader>` / `<SidebarContent>` / `<SidebarSection>` /
  `<SidebarItem>` / `<SidebarTreeItem>` (the tree primitive handles auto-indent).
- **Lists with reorder** → `<Sortable>` (single column) or `<Sortable.Group>`
  (cross-column kanban).
- **Data tables with filters/sort/selection** → `@tanstack/react-table` headless
  + `<Table>` primitives. See `scaffolds/data-table-filters.jsx` for the canonical
  wire-up.
- **Breadcrumb path trails** → `<Breadcrumb>` / `<BreadcrumbList>` / etc. Don't
  hand-roll `path > path > path` with ChevronRight icons.
- **Multi-select filters / action menus** → `<DropdownMenu>` with
  `DropdownMenuCheckboxItem` for multi-select.
- **Chip-in-trigger / badges-in-input patterns** → `<MultiSelect>` (NOT a
  custom ChipInput). MultiSelect's trigger renders selected items as
  removable Badges with X icons inside the trigger button, opens a
  searchable Popover with checkable rows, supports "+N more" collapse
  past `maxCount`. Reach for it for Linear's filter bar, Slack's channel
  picker, Notion's relation property, GitHub's label picker, etc.
  Don't reinvent the chip-in-input shape — MultiSelect already covers
  the common case.
- **Rich text editors** → `@tiptap/react` + `StarterKit`. See `linear-clone.jsx`
  and `notion-clone.jsx` for the wire-up.
- **Image surfaces** → `<MediaSurface>` (non-person) or `<Avatar>` (people).
  MediaSurface takes `hint` + `alt` + `source` props.
- **Charts** → `recharts` is pre-stamped; use it.

Layout primitives (always prefer over raw flex/grid):
- `<Stack>` — vertical 1D, accepts `gap`, `align`, `justify`.
- `<Row>` — horizontal 1D, same props.
- `<Grid>` — 2D responsive, `cols` prop bakes in the responsive ladder.
- `<Flex>` — the unopinionated escape hatch.

### 4. Tailwind discipline (looser here than in curated scaffolds)

**Arbitrary Tailwind values ARE allowed in playground scaffolds.** Both
`apps/docs/tailwind.config.ts` and the `@source` directive in
`packages/ui/styles/globals.css` scan
`scaffolds-playground/`, so classes like `h-[600px]`,
`md:grid-cols-[minmax(0,440px)_1fr]`, `w-[440px]` compile correctly. Use them
freely when matching a screenshot — exact pixel measurements are part of the
point during the first pass.

(In the curated `scaffolds/` folder the rule is the opposite — arbitrary values
silently no-op there. Don't carry this latitude into curated scaffolds.)

Still prefer semantic tokens (`bg-background`, `bg-muted`, `text-foreground`,
`text-muted-foreground`, `border-border`, `bg-card`) over raw colour scales
(`bg-blue-500`, `text-gray-900`) when fidelity allows. The DS theme picker
should still rotate the playground entry's palette.

### 5. Write the JSX file

Save to `packages/studio/src/playbook/layouts/scaffolds-playground/<id>.jsx`
where `<id>` is kebab-case and matches what the user would search for
("crm-dashboard", "stripe-checkout", "linear-issue-list").

**Required JSDoc frontmatter** — parsed by the generator. `@label` is mandatory;
the rest are optional but pull their weight on the picker card.

```jsx
/**
 * @label       <Short name shown on the picker card>
 * @description <One-liner under the label — what this is, ~120 chars max>
 * @tags        <space-separated soft-match tokens — crm sales pipeline etc>
 * @source      <URL or filename the screenshot came from, if known>
 * @notes       <Free-text. Use for "generated 2026-MM-DD from X",
 *              caveats, things you couldn't quite match, follow-ups.>
 */
import { AppShell, AppShellNav, AppShellMain, /* ... */ } from "@gradeui/ui";
import { /* ... */ } from "lucide-react";

export default function App() {
  return (
    <AppShell nav="side" className="min-h-screen bg-background">
      {/* ... */}
    </AppShell>
  );
}
```

The component MUST be named `App` and the export MUST be default — Fast Frame
mounts whatever default export it finds.

Aim for under ~200 lines for the first pass; the user will iterate. Comments
explaining decisions ("breadcrumb has 3 levels — Home / Section / Page",
"sidebar collapses below 768px") help future-you remember the intent when
the user asks for changes.

### 6. Append a "DS gaps surfaced" comments section

**Always** end the scaffold file with a comment block listing the things you
had to hand-roll because no Grade primitive covers them yet. This is the
single most valuable signal the playground produces — it's how the DS
roadmap grows. Without it, the observations evaporate into chat and the
gap recurs in the next scaffold.

Format:

```jsx
// ────────────────────────────────────────────────────────────────────
// DS gaps surfaced by this scaffold
// ────────────────────────────────────────────────────────────────────
//
// Things this layout had to hand-roll because no Grade primitive covers
// them yet. Each entry is a candidate for a future component — when the
// next <domain> layout shows up and we hand-roll the same pattern
// again, that's the signal to graduate it into @gradeui/ui.
//
// • <ComponentName> — one-line description of the pattern that
//   recurred, with a sketch of the proposed API. Note where else this
//   pattern likely shows up so future-us can spot the recurrence.
//
// • ...
```

Guidelines for what counts as a gap:
- A pattern you wrote inline that you'd reach for again in a second scaffold.
- A component variant the source needed that the existing DS component
  doesn't expose (e.g., non-person `<Avatar>` variants, branded
  `<Button>` colours).
- Layout patterns that are "obvious primitives in retrospect" — toggleable
  rails, detail panes, system-message pills.

NOT gaps (don't pad the list):
- One-off creative-content (background patterns, brand iconography).
- Things that are deliberately the user's job to fill in.
- Tailwind utilities that already work.
- **Patterns the DS already covers.** Before adding an entry,
  grep `packages/ui/COMPONENTS.md` for the pattern name and
  skim `packages/studio/src/playbook/components/allowlist.ts`.
  Common misses to check first:
  - chip-in-input → `<MultiSelect>` (don't propose `<ChipInput>`).
  - 3-pane app layout → `<AppShell nav="three-pane">` (don't
    propose `<Topbar leading center trailing>` first).
  - nested page tree → `<SidebarTreeItem>` (don't hand-roll
    recursive `<SidebarItem>` with depth state).
  - cross-container drag → `<Sortable.Group>` (don't reach
    for raw `@dnd-kit/core`).
  - row sort/select/page → `@tanstack/react-table` with
    `<Table>` primitives.

If the scaffold genuinely needs nothing new, write `// (No new DS gaps —
this layout composes cleanly from existing primitives.)` so the comment
block is always there, just sometimes empty. Consistency makes the gap
audit cheap.

### 7. Regenerate the playground bundle

```bash
cd <repo-root>/gradeui
pnpm -F @gradeui/studio gen:scaffolds-playground
```

If `pnpm` isn't available in the sandbox, fall back to:

```bash
node packages/studio/scripts/generate-scaffolds-playground.mjs
```

This rewrites `packages/studio/src/playbook/layouts/scaffolds-playground.generated.ts`.
The generator parses the frontmatter and emits the metadata + raw source as a
keyed record. The Starter Picker's Playground tab reads this bundle.

### 8. (Optional) Typecheck

If the scaffold uses anything non-trivial, run a quick typecheck so the user
doesn't hit it at runtime:

```bash
cd <repo-root>/gradeui/packages/studio && npx tsc --noEmit
```

### 9. Tell the user what shipped

In one or two sentences:
- The new scaffold's `id` and `label`.
- That it'll appear in the Playground tab of the Starter Picker after a
  dev-server reload (or already, since the bundle was regenerated).
- Anything you couldn't match faithfully — explicit caveats let the user
  steer the next iteration without having to spot the drift themselves.

## Iterating on an existing playground scaffold

The user often comes back wanting changes. Read the existing
`scaffolds-playground/<id>.jsx`, identify what they want different (often a
single section — "make the sidebar wider", "swap the pie chart for a bar
chart", "add an empty state"), edit in place, regenerate the bundle.

Don't rewrite the whole file unless the structural change demands it — small
diffs are easier for the user to review and let them keep mental continuity
with previous iterations.

## Anti-patterns

- **Don't** save to `packages/studio/src/playbook/layouts/scaffolds/`
  (the curated folder) — that's a different workflow that requires editing
  `REFERENCE_LAYOUTS` in `layouts/index.ts` and capturing a Playwright
  thumbnail. Playground is one file + one generator run.
- **Don't** invent components that aren't in the allowlist. If the screenshot
  shows something Grade doesn't have (e.g., a Sheet/Drawer, a Tooltip, a
  Slider, a Rating), hand-roll a plausible stand-in with the layout primitives
  + Card + Button etc., then mention the missing component in `@notes`. The
  `MISSING_COMPONENTS` list in `layouts/index.ts` is the running roadmap.
- **Don't** use `italic` for emphasis on UI text — the user has flagged this
  consistently. Weight, size, or colour instead.
- **Don't** call `toLocaleDateString()` without a locale argument — hydration
  mismatch in SSR.
- **Don't** restate `flex flex-col` on `<Stack>` or `flex flex-row` on `<Row>`
  — those primitives already apply them. If the layout knob you want is
  missing on the primitive, that's a primitive-level bug worth flagging
  separately, not a className workaround.

## Where this lives

- Scaffolds: `gradeui/packages/studio/src/playbook/layouts/scaffolds-playground/`
- Generator: `gradeui/packages/studio/scripts/generate-scaffolds-playground.mjs`
- Output bundle: `gradeui/packages/studio/src/playbook/layouts/scaffolds-playground.generated.ts`
- Picker consumer: `gradeui/apps/docs/components/studio/starter-picker.tsx`
  (the Playground tab imports `PLAYGROUND_SCAFFOLDS` from `@gradeui/studio/playbook`)
- README: `gradeui/packages/studio/src/playbook/layouts/scaffolds-playground/README.md`
