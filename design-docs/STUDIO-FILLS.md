# STUDIO-FILLS.md — the fill model, the pickers, and popover rationalisation

This doc is the source of truth for how **backgrounds / paints** work in Grade and Studio, and the two pickers that drive them (`FillPicker` and the future **token picker**). It also captures the cross-cutting **popover-panel rationalisation** the Studio inspector now needs. Sibling to `STUDIO-THEMES.md` (a fill references theme tokens; a theme is the set of tokens a fill picks from).

If anyone asks "how do backgrounds work / where's the colour picker going?", this is the answer.

## The core idea — a background is a *fill of a frame*, never a node

A generative background, image, video, gradient, repeating texture, or solid colour is **a property of a frame**, exactly like a fill in Figma / Paper. You select the *frame*; its Fill controls drive the paint. The paint is never a free-standing selectable node.

This replaces the broken pattern where the agent dropped a full-bleed `<ThreeScene>` as a `position:fixed`, `z-0`, `pointer-events-none` sibling — which is unselectable by design (hover hit-testing via `mouseover` never fires on a `pointer-events:none` element, and there's nothing to click).

### Render boundary — `BackgroundFill`

`packages/ui/components/ui/background-fill.tsx` (shipped). Drops in as the **first child of a `relative overflow-hidden` frame**. Paints an `absolute inset-0`, `z-0`, `pointer-events-none` layer behind content; siblings carry `relative z-10` to sit on top. Marked `data-gds-part="frame-fill"` + `aria-hidden` so Studio treats it as chrome (not separately selectable) and a11y skips it.

`type` switches the paint: `none · solid · gradient · image · video · shader`. Solid *can* be a className (`bg-<token>`) instead of a layer; everything else needs the layer. `opacity` + `blendMode` apply to every type.

### Data shape — `FillValue`

`FillPicker` and `BackgroundFill` share one serialisable shape (`FillValue` in `fill-picker.tsx`):

```ts
{ type, color?, gradient?{from,via,to,angle}, src?, fit?, repeat?, tileSize?,
  preset?, palette?, postPreset?, opacity? }
```

Store it on a frame, feed it straight to `<BackgroundFill {...value} />`. This is the unit the inspector reads/writes and the agent emits.

## What's built (June 2026)

- **`BackgroundFill`** — render boundary. Full ship-checklist: source, sidecar, barrel, vendored copy, docs page (`/components/background-fill`), sidebar + components-list, contract, dist.
- **`FillPicker`** — Figma-style paint picker (`fill-picker.tsx`): a fill-type icon row (solid · gradient · image · pattern · video · shader) over a per-type panel, global opacity at the foot. Token-led: solid + gradient lead with theme-token swatches; the shader tab embeds `ShaderPresetPicker`. Shipped + demoed on the docs page; sidecar + contract generated. **Chrome-only — not allowlisted** (it's a tool, not app content).
- **Agent enablement** — `BackgroundFill` is in the playbook allowlist with a usage note: "set a background" → emit `<BackgroundFill>` as the first child of a frame, NOT a floating `<ThreeScene>`.
- **Frame capability** — `spacing-capabilities.ts` now grants `fill` to every frame: `Stack`, `Row`, `Grid`, `div` (already had it) **and the AppShell parts** (newly added; opacity stays off as chrome).
- **Breadcrumb / path-bar roots at `<AppShell>`** — the ancestor walk used to break at the first `app-shell-*` child, dropping the root. It now passes through the inner parts and stops at the `app-shell` root, so AppShell is the topmost selectable wrapper (and thus fillable). Both the Fast Frame agent (`studio-selection-agent.ts`) and the `grade:get-children` root resolution (agent + `fast-sandbox/page.tsx`) prefer `[data-gds-part="app-shell"]`.

## What's NOT built yet — the integration work

### 1. Inspector Fill section → `FillPicker`

The inspector's Fill section today is the **solid-token** control only. Swap in `FillPicker` (likely as a popover trigger showing the current paint summary + swatch). This is mostly wiring — the picker exists.

### 2. The child-injection mutation (the meaty bit)

Solid fill is a className edit, which the inspector already does. **Shader / image / video / gradient need a `<BackgroundFill>` child injected** into the selected frame's JSX (and the frame made `relative overflow-hidden`, content wrapped `relative z-10`). That's a **new mutation type** beyond the className edits the inspector performs today:

- prepend/replace/remove a `frame-fill` child on the target node,
- idempotent (one fill layer per frame — re-applying updates the existing child),
- round-trips through the same code-mutation path as className edits,
- reflected in both renderers (Fast Frame + Sandpack).

This is the main remaining engineering. Design it as "set the frame's fill" (one operation that reconciles the child), not "insert an element".

### 3. `FillPicker` as a modal popover

Near-term: present `FillPicker` in a **modal popover** (dismiss-on-outside, escape, focus-trapped) rather than inline — the Figma model. Should reuse the shared popover-panel shell (below), not a bespoke container.

## Popover-panel rationalisation (cross-cutting)

Studio has accumulated several floating panels — the shader playground glass panel, the shared share-dropdown, the shader-preset popover, soon the `FillPicker` popover, and eventually the token picker. They've drifted (different glass treatments, scrims, label colours, widths, dark-mode handling).

**Action:** define one **Studio popover-panel** primitive/convention — a single surface treatment (the dark glass we settled on), consistent header (title + close), padding scale, max-height + internal scroll (`data-lenis-prevent`), width tokens, and `dark`-context handling — and migrate every Studio floating panel onto it. The `FillPicker` modal popover and the token picker are the forcing function; do the rationalisation as they land so we don't add two more bespoke panels.

## The token picker (future — its own task)

Colour is chosen in **many** places — text, highlight, fills, gradient stops, borders, shadows. A dropdown doesn't scale. We need a dedicated **token picker**:

- **Grouped** — brand / surface / semantic / chart (additional) / state. Collapsible groups.
- **Searchable** — filter by token name or role.
- **Swatch previews** — resolved colour chips, with the token name + resolved value (and px/oklch where relevant), plus recent/used.
- **One control, many call sites** — text colour, highlight, every `FillPicker` swatch grid, border colour, shadow colour all use it. `FillPicker`'s inline swatch grid is the throwaway v0; it graduates to embedding the token picker.

### DTCG-readiness (the important architectural note)

A migration to **DTCG** (W3C Design Tokens Community Group format) is on the horizon. Build the picker **abstracted over a token registry** — it reads tokens from a registry interface (`{ name, group, value, description? }[]`), never hard-coded names. Then the DTCG switch is a *data-source swap* feeding the registry; the picker UI and every call site are untouched. This is the single most important constraint: **decouple the picker from where tokens come from.**

## Phased rollout

- **F0 (done)** — `BackgroundFill` render boundary, `FillValue`, `FillPicker`, allowlist, frame capability incl. AppShell, breadcrumb/path-bar rooted at AppShell.
- **F1** — Inspector Fill section adopts `FillPicker` (solid path first, className-backed).
- **F2** — Child-injection mutation: shader/image/video/gradient fills as a reconciled `BackgroundFill` child, both renderers.
- **F3** — `FillPicker` modal popover + Studio popover-panel rationalisation (shared shell, migrate existing panels).
- **F4** — Token picker (grouped + searchable, registry-abstracted), adopted by `FillPicker` and all colour call sites.
- **F5** — DTCG token source feeds the registry; no UI change.

## See also

- `packages/ui/components/ui/background-fill.md` / `fill-picker.md` — the component sidecars.
- `apps/docs/lib/spacing-capabilities.ts` — which frames expose Fill.
- `apps/docs/lib/studio-selection-agent.ts` — breadcrumb chain + `getChildrenOf` root.
- `STUDIO-THEMES.md` — what a token/theme is; the fill picks from it.
- `STUDIO.md` — selection bus, allow-list, the two-renderer rule.
