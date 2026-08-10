# Studio Themes — the theme contract, remix, and community

How a theme travels from a private tweak to a curated share to a public, remixable artifact — without changing what a theme *is* at any step.

> Status: design doc. Drafted 2026-05-31.
> Companion to [`STUDIO-LEARNING.md`](./STUDIO-LEARNING.md) (what the system learns) and [`STUDIO-CHAT.md`](./STUDIO-CHAT.md) (how it's presented). This doc is the third sibling: *what a theme is, and how it moves between people.*

**Terminology note** — throughout, "the contract" = the portable, deterministic unit that *is* a theme: a `ThemeInput`. Everything else in this doc (variants, shares, the community catalog, showcase clones) is the same `ThemeInput` at a different visibility. If you remember one thing: **the theme is the contract; storage and visibility are layers on top of it.**

---

## Problem

Remixing themes sounds like a feature. It's actually a data-model decision that, made wrong, calcifies. The moment a designer can tweak a theme and *share that tweak* — and a stranger can take it further — three questions become load-bearing:

- **What exactly is being shared?** If a theme is "the colours currently on screen," it can't be reproduced, attributed, or built upon. It has to be a portable, regenerable unit.
- **Where does it live as visibility widens?** A private scratch remix, a designer's "here are 2 alternates" on a share link, and a public community theme are the *same thing* seen by progressively more people — but they can't all live in the same place (a JSON blob can't be queried by strangers; a global table is overkill for a scratch tweak).
- **Where did it come from?** Community means lineage: "this is a remix of that." Without it, the catalog is a flat pile, not a graph you can navigate or attribute.

We're also about to pour content in: **showcase "clones"** — recreations of real apps and websites — as a jumping-off point and a map of where the product's edges are. Each clone carries a theme. Browsing a clone, remixing its theme, and publishing the remix back is the community loop. So the theme model and the showcase model meet here, and the theme contract is what makes a clone *remixable* rather than just a screenshot.

This doc locks the contract first, so the UI and the catalog don't get built on sand.

## The contract: a theme is a `ThemeInput`

A `ThemeInput` (see `apps/docs/lib/themes/types.ts`) is the whole theme: hues, chroma, intensity, typography, radius, spacing, effects, component knobs, plus `id`/`name`/`description`. `generateTheme(input)` turns it into a `GeneratedTheme` (the resolved OKLCH ramps + CSS variables the renderer applies).

Two properties make `ThemeInput` the right contract:

1. **Deterministic.** Same input → identical output, every time. We never store the *generated* theme — only the input. A variant is reproducible forever from a few hundred bytes of JSON, and a theme published today renders the same in six months. (This is also why the seed must stay deterministic — see "Constraints.")
2. **Portable.** It's plain JSON. It serialises into a project column, a share link, a database row, or a file with no transformation. The same bytes mean the same theme on every surface.

Everything below is a place to *put* a `ThemeInput`, plus the metadata that place needs. The contract itself never forks.

**Custom fonts travel inside the contract** (built June 2026). `typography.display/body/mono` accept either a `FONTS` registry key or a `custom:<family>` reference into `typography.customFonts: CustomFontFace[]` — family name, permanent public asset URL (STUDIO-STORAGE bucket), format/weight/style. The generator resolves selections to family stacks and carries the faces on `GeneratedTypography.fontFaces`; every applying surface (root provider, builder scope, Fast Frame via `grade:fast-theme`, Sandpack, share, embed, exports) injects the `@font-face` via `fontFaceCSS()`/`injectFontFaces()` in `lib/themes/apply.ts`. Because the URL is public and permanent, both deterministic and portable hold: the same JSON renders the same face on any surface, including cross-origin embeds. (Trade-off accepted: a theme shared publicly exposes its font URL — same posture as image assets.)

### Metadata the contract grows for community

A bare `ThemeInput` is enough for private use. To travel publicly it needs an envelope — kept *around* the input, not baked into it, so the input stays a pure render unit:

```ts
interface ThemeRecord {
  input: ThemeInput;        // the contract — unchanged
  author: Subject | null;   // null = Grade / bundle (no author), per the earlier decision
  visibility: "private" | "unlisted" | "public";
  remixOf: string | null;   // id of the parent ThemeRecord — lineage
  createdAt: number;
  // future: usageCount, forkCount, tags
}
```

`author: null` is deliberate — bundle/Grade themes have no author, so the "by …" line is simply absent rather than attributed to a system account. A user-published public theme carries its author. (Earlier working decision; restated here as part of the contract.)

## The three tiers (same contract, widening visibility)

```
  PRIVATE                 CURATED                  COMMUNITY
  project variants   →    share link set      →    themes catalog
  (JSON on project)       (subset, flagged)        (queryable table, authored, lineage)
        │                       │                         │
        └───────────  one ThemeInput each  ─────────────┘
```

**1. Private — `project.theme_variants_json`.** *(built — migration `0013`)*
A designer's scratch remixes, stored as a `ThemeVariant[]` JSON array on the project (`{ id, name, input, includeInShare, createdAt }`). Not queryable across projects, not browsable — and that's correct. It's a sketchpad. Mirrors the existing `theme_draft_json` persistence path exactly.

**2. Curated — the share's theme set.** *(partially built)*
A share link already carries the project theme + color mode + device (`share_links`, migrations `0010`–`0013`). The curated set is the variants flagged `includeInShare`: "the designer shared 2 alternates." The share toolbar's theme switcher (already live in `shared-screen.tsx`, currently showing the public bundle) narrows to *that curated set* instead. Viewer-facing, read-only, A/B-able.

**3. Community — a `themes` catalog.** *(not built — the deferred table this doc justifies)*
A real table keyed to author + visibility + `remixOf`. This is what lets a stranger discover a theme, see who made it, and fork it into their own project. A JSON blob on a project structurally *cannot* do this — querying, attribution, and lineage all require rows. "Community" is precisely the trigger that promotes the deferred table from nice-to-have to necessary.

The promotion paths between tiers are one-directional and cheap because the payload is identical: publish a private variant → it becomes a community row (copy input, add envelope). Fork a community theme → it lands as a private variant with `remixOf` set. No transformation, no lossy conversion.

## Showcase clones — content on top of the contract

The clones (recreations of real apps/sites) are **seed projects**, not a separate primitive. Each is a normal project with screens and a theme. What makes them a *showcase* is a surfacing layer — a gallery — plus a flag marking them as Grade-authored exemplars.

Why they belong in this doc: a clone is only interesting to the community if its theme is **remixable**. The loop is: browse a clone → "make it yours" forks its theme (community → private variant, `remixOf` = the clone's theme) → tweak → optionally publish back. The clone is the jumping-off point; the theme contract is the mechanism. Without the contract, a clone is a dead-end screenshot.

Clones also do double duty for [`STUDIO-LEARNING.md`](./STUDIO-LEARNING.md): they're high-quality corpus seed material (real production patterns, already in `@gradeui/ui` primitives). The themes doc and the learning doc meet at the clone.

## What's built today

- **`ThemeInput` + `generateTheme`** — the deterministic contract. (`lib/themes`)
- **Bundle themes** — `BUILT_IN_INPUTS` / `builtInThemes`, including the 8 deterministic "wild" seeds. Author-less by design.
- **Private variants storage** — `theme_variants_json` on projects, `ThemeVariant` type, plumbed through both storage adapters. (migration `0013`, slice 1)
- **Share carries theme + mode + device** — `share_links` (migrations `0010`–`0013`); the share toolbar re-skins live on a theme prop change.

## What's planned

- **Variant authoring UI (slice 2)** — "save current as variant," a variant list (apply-as-preview → load-to-edit → save), rename/delete, `includeInShare` toggle. Lives in the theme builder panel. *Non-destructive preview first* (try a variant on the canvas without clobbering the draft), then opt-in to edit/save — needs a preview-override channel in `ThemeBuilderProvider`.
- **Curated share set (slice 3)** — share route reads `includeInShare` variants; share toolbar shows project theme + curated set instead of the whole bundle.
- **Community `themes` table** — the `ThemeRecord` envelope above, RLS-gated like `project_access`. Publish-from-variant + fork-to-variant.
- **Showcase gallery** — surface Grade-authored clone projects; "make it yours" fork flow.
- **Remix lineage UI** — "remixed from X," fork counts, a navigable graph.

## Rollout

Each phase is shippable on its own; each is a strict superset of the contract, never a fork of it.

**Phase T0 — Variant storage** *(done)*
`theme_variants_json`, `ThemeVariant`, adapter plumbing. The backbone the rest hangs off.

**Phase T1 — Private authoring**
The slice-2 UI. Save/apply/curate variants in the theme builder, non-destructive preview, persistence via the slice-0 column. At the end of T1 a designer can remix privately and flag alternates for a share.

**Phase T2 — Curated shares**
The slice-3 wiring. The "designer shared 2 alternates" story goes live end-to-end. Still no database beyond the project.

**Phase T3 — Community catalog**
Introduce the `themes` table + `ThemeRecord` envelope + RLS. Publish a variant public/unlisted; browse public themes; fork into a project (sets `remixOf`). This is the first tier that needs a migration beyond a project column.

**Phase T4 — Showcase clones**
Seed clone projects + a gallery surface + "make it yours." Clones reference community themes; forking a clone's theme is just T3's fork flow pointed at an exemplar.

**Phase T5 — Lineage + signals**
Surface `remixOf` as a graph, fork/usage counts, tags. Feeds the learning loop's preference signals (a heavily-forked theme is a strong taste signal).

## Constraints we're honest about

**The seed must stay deterministic.** The whole contract rests on `generateTheme` being pure. If the generator's output drifts for a fixed input, every stored variant and published theme silently changes. Any change to the seed/generation is a breaking change to the contract and needs versioning (a `generatorVersion` on the record, or a frozen generator per published theme). This is the single most important invariant in this doc. Edge-testing the generator ("trash it a bit") is exactly right — but the trashing has to happen *before* themes are published against it, or behind a version bump.

**Bundle vs. authored.** Bundle/Grade themes have no author (`author: null`); user public themes do. Don't paper over this with a synthetic "Grade" user — the absence is meaningful and the UI should render it as absence.

**Visibility ≠ permission.** A `public` theme is discoverable, but forking it into *your* project still goes through normal project write permission (the RBAC in migration `0008`). Community visibility and project access are orthogonal axes; don't conflate them.

**Private stays private.** A variant on a project is only visible to people who can read that project. Promoting it to the community catalog is an explicit publish action with an explicit visibility choice — never automatic, never a side effect of sharing a screen.

**Cold start for community.** An empty catalog is uninteresting. The showcase clones (Phase T4) double as the seed population — Grade-authored public themes give the catalog mass on day one, the same way the seed corpus generator bootstraps learning.

## See also

- [`STUDIO-LEARNING.md`](./STUDIO-LEARNING.md) — the corpus + preference loop. Clones seed it; theme fork-counts feed it.
- [`STUDIO-CHAT.md`](./STUDIO-CHAT.md) — generative UI in chat. "Remix this theme" / "make it yours" are natural chat tool-calls.
- `apps/docs/lib/themes/` — the contract: `ThemeInput`, `generateTheme`, `BUILT_IN_INPUTS`.
- `apps/docs/supabase/migrations/0010`–`0013` — share links (theme, color mode, device) + the private variants column.
- `CLAUDE.md` → "Runtime token namespace" — the `gds-*` / `--gds-*` token contract the generated theme writes into.
