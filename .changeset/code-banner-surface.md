---
"@gradeui/ui": minor
---

Code + Banner components, Surface axis across containers, Studio polish

### New components

- **`<Code>`** — syntax-highlighted code surface (`prism-react-renderer` under the hood, shared with Studio's Source panel). Diff hero mode, line emphasis, scroll-triggered reveals via `motion`'s `useInView`, speed presets (`slow` / `normal` / `fast`), terminal `prompt` prop, blinking cursor (auto-on for typewriter and scripted sessions), and a `steps` machine for scripted CLI demos (`type` / `wait` / `output` / `clear`, with optional `loop`). Token palette via `--gds-code-*` CSS variables; theme inversion is automatic.
- **`<Banner>`** — full-width horizontal strip for system-level state, announcements, and first-run guidance. Variants: `default` / `info` / `success` / `warning` / `destructive` / `announcement`. Surface axis (solid / translucent / glass / glass-strong), sticky, dismissible, icon + action slots. Auto role mapping (warning/destructive → `role="alert"`; others → `role="status"`). Extracted out of an inline-style `FigmaIntroBanner` that was rendering nearly invisible because it referenced `--gds-*` tokens that don't exist in our system — the primitive makes that category of mistake impossible.

### Surface axis across containers

`surface` prop added to `Card`, `Dialog`, `Sheet`, `Popover`, `DropdownMenu` (root + sub), `HoverCard`, and `SectionBlock`. Maps to the existing `gds-surface-*` classes from the Presence system (PRESENCE.md). Replaces the "roll `bg-card/40 backdrop-blur-md` by hand" pattern with theme-tuned blur + edge highlight, exposed as a knob in Studio's inspector. Sidecars rewritten as scenario-led canonical examples (intent → output → anti-pattern) so the playbook steers retrieval correctly.

Shared `surface.ts` module so every surface-bearing component imports the same `SURFACE_CLASS` map and `surfaceBg()` helper.

### Studio polish

- `Replay` control in the canvas toolbar (next to viewport toggles) — re-keys the focused iframe so every `inView` reveal animation runs again. Owns the replay state at the StudioCanvas level; forwarded via `replayKey` prop.
- `CodeView` (Source panel) migrated to `<Code bare>` — picks up the new `--gds-code-*` palette automatically instead of the washed-out prism `vsLight` / `vsDark` themes.
- `GradePayloadPanel` (walker) — fallback token names corrected from non-existent `--gds-card` / `--gds-border` / `--gds-foreground` to the actual unprefixed semantic tokens. The Source panel was rendering with the inline-style numeric fallbacks instead of inheriting the theme.

### Tokens

- **`--accent-glow`** — new tonal halo for raised/tactile chrome. Defaults to `var(--primary)` so `<Button variant="raised">` reads as branded by default, not as selection blue. Per-button `--btn-glow` overrides still flow through.
- **`--gds-code-*`** — full set of token roles for the Code component (bg, fg, keyword, string, function, comment, number, tag, attr-name, attr-value, diff-added, diff-removed, line-highlight). Light + dark + mirrors in `apps/docs/app/globals.css`.
- **`.gds-code-cursor`** — blinking caret keyframes (1.05s iOS/macOS cadence, respects `prefers-reduced-motion`).

### Docs

- Component pages for `Code` and `Banner` (covering every variant + scenario + props table + accessibility).
- `ComponentPreview` (used on every component docs page) now renders its Code tab through `<Code bare>` so docs syntax highlighting matches Studio + marketing.
- Sidecars across all surface-bearing components rewritten as scenario-led canonical examples with explicit anti-patterns.

### Fixes

- `theme-export-md`: guard against `theme.input` being undefined; `JSON.stringify(undefined)` was returning `undefined`, blowing up downstream `.replace` calls with the cryptic "Cannot read properties of undefined (reading 'replace')".
- Maps: `maplibre-gl` added to `apps/docs` so the `/components/map` page's MapLibre adapter actually loads (was failing the dynamic import silently, rendering an empty container).
