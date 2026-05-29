# @gradeui/ui

## 1.2.0

### Minor Changes

- d6b506f: Composer, Message, ComposerReply, and lib/demo scripted-demo primitive.

  **New components**

  - `<Composer>` — Lexical-backed text composition surface. Plain text or rich (bold / italic / underline / strike / code / h1-h3 / blockquote / pullquote / lists), mentions and slash commands via `lexical-beautiful-mentions`, image attachments via paperclip + clipboard paste, scripted demo playback for marketing surfaces. Replaces hand-rolled `<textarea>` + toolbar + send-button patterns wherever a user composes text. CSS-variable themed (`--gds-composer-*`).
  - `<Message>` — canonical "avatar + author + timestamp + body" row for chat, comments, post replies, activity logs. Slot-based avatar, optional `edited` / `pinned` / `reactions` / `threadCount` / `badge` / `actions` props, `align="end"` for "your messages" in DM threads.
  - `<ComposerReply>` — preset wrapping Composer for reply boxes (placeholder, no toolbar, no attachments, Cmd+Enter submit).
  - `<DemoStage>` + `<Reveal>` — context-driven staging for whole-interface scripted reveals (marketing heroes, tutorial overlays, onboarding flows).
  - `<BlinkingCursor>` — shared caret primitive used by scripted-typing demos.

  **New primitive layer**

  - `packages/ui/lib/demo/` — shared step-machine spine behind every scripted-demo surface in the design system. Exposes `useScriptedDemo` hook, `sleep`, `typeText`, `DEMO_SPEED_PRESETS`, `DemoStage`, `Reveal`, `BlinkingCursor`. Re-exported from the `@gradeui/ui` barrel.

  **Enhanced**

  - `<Avatar>` gains a `size` prop (xs / sm / md / lg / xl).
  - `<AvatarFallback>` gains a `tone` prop (muted / primary / violet / amber / emerald / sky / rose / plum / lime) for stable per-author colour mapping.
  - `<Code>` refactored onto `lib/demo` — same behaviour, shares the step machine + blinking cursor with Composer.
  - `<AIChatComposer>` refactored onto Composer — same API, ~125-line shim that wraps Composer with chat-input defaults (formats=false, attachments, Press Enter hint).

  **Studio playbook**

  - `Composer`, `ComposerReply`, `Message`, `DemoStage`, `Reveal` added to the allowlist.
  - Sidecar anti-patterns added to `composer.md` and `message.md` to steer the model away from inline `<textarea>` + toolbar and inline avatar+row patterns.
  - `linear-clone` and `notion-clone` reference scaffolds refactored to use the new primitives (Message for comment threads, Composer for input surfaces); Tiptap dependency removed from both.
  - Four new playground scaffolds: `hero-staged-reveal`, `composer-chat-demo`, `composer-comments-demo`, `composer-document-demo`.

  **Docs**

  - New `/components/composer` and `/components/message` pages.
  - `gradeui/CLAUDE.md` gained a 12-step "Creating a new component" ship checklist.

  **Dependencies**

  Adds `lexical`, `@lexical/react`, `@lexical/rich-text`, `@lexical/list`, `@lexical/link`, `@lexical/code`, `@lexical/markdown`, `@lexical/selection`, `@lexical/utils`, `lexical-beautiful-mentions` to `@gradeui/ui`.

## 1.1.0

### Minor Changes

- 7ed04dd: Code + Banner components, Surface axis across containers, Studio polish

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

## 1.0.0

### Major Changes

- fcc5317: **BREAKING: runtime token namespace renamed from `rds-*` / `ramp-*` to `gds-*` / `grade-*`**

  The last of the legacy `ramp-ds`-era token names are gone. Every runtime surface that touches the brand prefix has been renamed in one sweep:

  | Old                    | New                    | Where it lives                                                                                                                                                          |
  | ---------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `--rds-*`              | `--gds-*`              | CSS custom properties (every theme token, every component token — ~720 references)                                                                                      |
  | `.rds-*`               | `.gds-*`               | CSS class names (`gds-app-shell`, `gds-card`, `gds-button`, `gds-aura-*`, `gds-surface-*`, `gds-flex`/`grid`/`row`/`stack`, the `gds.*` Tailwind color namespace, etc.) |
  | `data-ramp-theme`      | `data-grade-theme`     | HTML attribute on `<html>` set by `GRADE_PRE_HYDRATION_SCRIPT`                                                                                                          |
  | `'ramp-mode'`          | `'grade-mode'`         | localStorage                                                                                                                                                            |
  | `'ramp-theme'`         | `'grade-theme'`        | localStorage                                                                                                                                                            |
  | `'ramp-user-themes'`   | `'grade-user-themes'`  | localStorage                                                                                                                                                            |
  | `'rds-playgrounds'`    | `'gds-playgrounds'`    | localStorage                                                                                                                                                            |
  | `'rds-template-saves'` | `'gds-template-saves'` | localStorage                                                                                                                                                            |
  | `'rds-chat-settings'`  | `'gds-chat-settings'`  | localStorage                                                                                                                                                            |

  ### What stays

  - `--ramp-*` CSS custom properties — these are the per-step OKLCH color-ramp values (`--ramp-50` … `--ramp-950`) and refer to _color ramps_ as a technical concept, not the Ramp brand. Untouched, as in the previous Ramp→Grade pass.
  - The React API (`GradeThemeProvider`, `useGradeTheme`, `GRADE_PRE_HYDRATION_SCRIPT`) — already on the new names from the prior rebrand.

  ### Migration

  Anyone consuming `@gradeui/ui` from npm needs to:

  1. **CSS overrides** — find/replace `--rds-` → `--gds-` and bare `.rds-` → `.gds-` in any stylesheet that targets Grade tokens or classes.
  2. **Tailwind config** — if you extended Grade's colour palette, update references to the `rds` namespace (`text-rds-gray-500` → `text-gds-gray-500`, etc.).
  3. **HTML attribute targeting** — replace `[data-ramp-theme="…"]` selectors with `[data-grade-theme="…"]`.
  4. **localStorage** — no migration shim ships with this release. The library had no external installs prior to this change, so anyone on a dev branch will get a one-time loss of their saved theme / playground / template-saves selection on next load.

  ### Why now

  The rename was on the books from the original Ramp→Grade rebrand. It was deferred to avoid wiping persisted user state for any in-flight consumer. With no public installs yet, "now" was the cheapest moment to take it.

  The rename script (`scripts/rename-rds-to-gds.py`) is checked in. It walks the monorepo, runs a longest-first replacement list, and protects technical substrings (`--ramp-*`, `@rds-energy`, `rds-energy-zap` URL slug). Re-runnable and idempotent.

### Minor Changes

- bc47f79: May 2026 refresh — new components, two renames, AI pipeline upgrades, bug fixes

  ### Component renames (BREAKING for `@gradeui/ui`)

  - **`Alert` → `Callout`.** The old name implied modal / interruptive behaviour the component doesn't have (Apple HIG `Alert` is a modal, and `role="alert"` is assertive ARIA). The component is inline, ambient, and non-blocking — `Callout` is honest about that. `Alert` is now reserved in the barrel for a future genuinely-interruptive primitive. For modal-alert semantics (HIG / React Native `Alert`), use `<Dialog>`. The `highlight` variant was dropped in the same change — it overlapped `warning` (amber) without a distinct intent. ARIA role is now variant-conditional: `warning` / `destructive` → `role="alert"` (assertive), `info` / `success` / `default` → `role="status"` (polite).
  - **`SideMenu` → `Sidebar`**, rebuilt as a compound API: `Sidebar` / `SidebarHeader` / `SidebarContent` / `SidebarFooter` / `SidebarSection` / `SidebarItem`. `asChild` and `asButton` on Item for routing integration (Next/Link, React Router, action rows). Semantic theme tokens replace the old hard-coded greys; sizing knobs via `--gds-sidebar-*` CSS variables.
  - **`SimpleTabs` deleted.** Merged into Tabs as `variant="underlined"` on TabsList (cascades to triggers via context). `pill` remains the default.

  ### Migration

  ```diff
  - import { Alert, AlertTitle, AlertDescription } from "@gradeui/ui";
  + import { Callout, CalloutTitle, CalloutDescription } from "@gradeui/ui";

  - import { SideMenu } from "@gradeui/ui";
  + import { Sidebar, SidebarHeader, SidebarContent, SidebarSection, SidebarItem } from "@gradeui/ui";

  - import { SimpleTabs } from "@gradeui/ui";
  + // Use Tabs with variant="underlined" on TabsList
  ```

  ### New components

  - **`Carousel`** — embla-backed compound API (`Carousel` + `.Slide` + `.VideoSlide` + `.Dots` + `.Arrows` + `.Prev` + `.Next`). Custom autoplay loop (no plugin) so per-slide `duration` overrides and "advance-on-video-end" fall out cleanly. `VideoSlide` autoplays muted + loop with a poster swap on activation by default. Token-driven via `--gds-carousel-*`. Wired into the `tv-streaming` reference layout as the featured row.
  - **`MultiSelect`** — multi-pick combobox (Popover + Command + Badge). Data-driven via `options`; selected items render as removable badges in the trigger with `maxCount` "+N more" overflow; Select All / Clear / Close actions in the dropdown footer. Per-option `icon` shows up in both the dropdown row and on the selected badge.
  - **`Stack.justify`** — new main-axis prop on Stack (mirrors Row's existing `justify`). Stops scaffolds from reaching for `className="flex flex-col justify-end"`.

  ### Studio playbook upgrades

  - **Sidecar prose body now pinned to the model.** Previously only the frontmatter shipped to the system prompt; the canonical JSX example and `### Anti-patterns` only rendered to humans on the docs page. Now the prose body gets pinned verbatim under a labelled section whenever the sidecar wins retrieval. This closed the "model guessed the API" failure mode for compound components like Carousel and MultiSelect.
  - **Contract-backed JSX validator.** New post-pass at `apps/docs/lib/qa/validate-jsx.ts` runs on `streamText.onFinish`. Walks every `<Component prop=…/>` in the emitted JSX, looks up the contract, and validates each used prop against the Zod schema. Reports unknown props, invalid enum values, missing required props, wrong types — all with source locations. Logs server-side today; surfacing into the chat UI is a follow-up.
  - **Cross-platform aliases sweep.** Every sidecar's `aliases:` array now includes Apple HIG (macOS, iOS, SwiftUI) and React Native vocabulary alongside the existing web/shadcn terms. Designers speccing across RN-mobile + Tailwind-web teams can describe components in any of those vocabularies and retrieval still fires. HIG is a _reference_ vocabulary — no renames.
  - **Studio scaffolds migrated to Sidebar.** `saas-user-editor`, `music-app`, `ecommerce-listing` now compose Sidebar inside `<AppShellNav placement="side">` instead of raw Stacks of Buttons. Starter prompts (`app-side-nav`, `app-docs`) updated to instruct the model to do the same.

  ### Bug fixes

  - **Studio selection panel refresh.** Clicking from one MediaSurface to another now correctly refreshes the right panel. `PropControl` key includes `instanceId` (so React fully remounts); new `readDataArrayEntryField` reads per-instance content props from the data-array entry instead of template-wide.
  - **Map preview not rendering** (across all providers). Removed `/* webpackIgnore: true */` from the dynamic peer-dep imports in the maplibre / mapbox / google adapters. The directive kept bare specifiers literal at runtime, which browsers can't resolve — every Map render fell into the `sdk-missing` catch even when the peer dep was installed. Plain dynamic imports let the bundler code-split each peer into its own chunk that loads only when Map mounts.
  - **AI Chat icon-light refresh.** Dropped User + Sparkles avatars on messages, gradient sparkle box on the header, big sparkle on the empty state, sparkle on the thinking indicator. Suggested-prompt chips are text-only. The chat reads as conversation now, not as a branded product surface.

  ### Docs

  - New component pages: Callout, MultiSelect, Sidebar, Carousel, ComponentProps. Old Alert / SimpleTabs / SideMenu routes return `notFound()` — clean break, no redirects (no external consumers yet).
  - Components nav reordered: Layout → Navigation → Forms → Data Display → Charts → Feedback → Media → Map → Studio. "Blocks" category renamed to "Studio" (AI Chat + Component Props under it).
  - `/docs/studio/how-it-works` rewritten: Fast Frame as the default renderer (Sandpack moves to parity-check role), contracts system documented, prose-body pinning and JSX validator added to the pipeline diagram (now six steps).
  - New `ComponentProps` docs renderer auto-derives a props table from a `ComponentContract` (hand-rolled Zod → TS-string printer; no extra dep). Designed to replace per-page hand-authored `PropsTable` as docs migrate.

  ### `@gradeui/studio` impact (patch)

  - Playbook allow-list, sidecars, and contracts registry updated to track the renames + new components. Existing Studio designs that contain `<Alert>` / `<SideMenu>` / `<SimpleTabs>` won't compile in Fast Frame after upgrading — the chat will need to regenerate them, or a manual find-replace is fine.
  - Generators (`generate-sidecars.mjs`, `generate-contracts.mjs`) now drop empty `.md` files as "retired" so truncate-as-delete works cleanly.

  ### New subpath: `@gradeui/ui/contracts`

  Server-safe entrypoint for the typed contracts registry. The main `@gradeui/ui` entry bundles every component, so importing `COMPONENT_CONTRACTS` from it loads React at module init — which crashes in a Server Component / API route boundary with "useEffect cannot be used in a Server Component." The new `@gradeui/ui/contracts` subpath has only Zod + the per-component `*.contract.ts` files (no React), so it's safe from anywhere (Edge runtime, API routes, MCP servers, CLI). Migration:

  ```diff
  - import { COMPONENT_CONTRACTS } from "@gradeui/ui";
  + import { COMPONENT_CONTRACTS } from "@gradeui/ui/contracts";
  ```

## 0.10.0

### Minor Changes

- c4f222f: Component sidecars now ship inside the package.

  Every component in `@gradeui/ui` has a sidecar Markdown file at
  `components/ui/<name>.md` — same folder as its `.tsx` source — describing
  the component's API, when to reach for it, idiomatic examples, and any
  gotchas. The `files` field in `package.json` now includes
  `components/ui/*.md`, so the briefs travel with the published tarball.

  The sidecars are what the Grade Studio chat reads to steer model
  generations, and they're being added so that:

  - Consumers building their own AI tooling (custom Studio forks, MCP
    servers, code-gen pipelines) can feed `node_modules/@gradeui/ui/components/ui/*.md`
    to their LLM of choice without depending on `@gradeui/studio`.
  - The single-source-of-truth promise actually holds across the package
    boundary — change a component, change its sidecar, in the same commit.

  Sidecars added in this release for every shipping component:
  `accordion`, `ai-chat`, `alert`, `app-shell`, `avatar`, `badge`,
  `breadcrumb`, `button`, `calendar`, `card`, `chart`, `checkbox`,
  `collapsible`, `command`, `date-picker`, `dialog`, `dropdown-menu`,
  `flex`, `grid`, `hover-card`, `input`, `label`, `map`, `media-surface`,
  `popover`, `progress`, `radio-group`, `resizable`, `rive-player`, `row`,
  `scroll-area`, `select`, `separator`, `shader-preset-picker`,
  `shader-preset-preview`, `sheet`, `side-menu`, `simple-tabs`,
  `skeleton`, `slider`, `stack`, `switch`, `table`, `tabs`, `textarea`,
  `three-scene`, `toast`, `toggle`, `toggle-group`, `tooltip`,
  `video-player`.

  No runtime changes — this is purely a packaging change. Existing
  imports keep working.

## 0.9.0

### Minor Changes

- 6a61a68: **AppShell**: add `Header`, `Aside`, `Footer` slots and a new `nav="three-pane"` variant.

  The shell is now a CSS-grid template-areas layout keyed off `data-nav` on the
  root, so slot order in JSX no longer matters — each slot has a fixed
  `grid-area`. This unlocks marketing-page layouts (`<AppShellHeader>` + main

  - `<AppShellFooter>`) and the Slack/Mail/Notion 3-column shape (nav rail +
    fixed Aside + flex Main).

  The middle column width in `nav="three-pane"` is set by the
  `--rds-app-shell-aside` CSS variable (default 320px) — override per-screen
  without forking the component.

  The existing `nav="none" | "top" | "side"` variants keep their previous
  visual behaviour; only the implementation moved to template areas.

  New exports: `AppShellHeader`, `AppShellAside`, `AppShellFooter` plus their
  prop types.

  **Resizable** (new): port of shadcn's `resizable`, built on
  `react-resizable-panels`. Use when you want user-adjustable column widths
  inside any layout — e.g. a 3-column app where the user can drag the divider
  between list and detail. Static layouts should keep using
  `<AppShell nav="three-pane">`.

  New exports: `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`.
  New runtime dep: `react-resizable-panels@^2.1.7`.

- 6a61a68: Add `<Map>` and `<MapMarker>` — a provider-agnostic map primitive.

  The component lazy-loads one of three adapters per the `provider` prop:

  - `maplibre` (default) — uses `maplibre-gl` + MapTiler tiles. The free
    zero-key public demo on `gradeui.com` works via a referrer-locked
    Grade-owned MapTiler key (lives in
    `components/ui/map/demo-config.ts`); consumers on other domains must
    pass their own key via the `tilerKey` prop.
  - `mapbox` — requires `accessToken`. Same engine and style spec as
    MapLibre, swap with one line.
  - `google` — requires `apiKey`. Uses `AdvancedMarkerElement` for DOM
    markers so children inherit `--rds-*` tokens like every other DS part.

  All three SDKs are **optional peer deps** — `maplibre-gl`, `mapbox-gl`,
  and `@googlemaps/js-api-loader` are declared in `peerDependenciesMeta`
  as optional. Consumers install only what they use. Using a provider
  without its SDK installed surfaces `onError({ code: "sdk-missing" })`
  with a developer-facing message containing the install command.

  API highlights (full spec in `packages/ui/MAP.md`, model-facing notes
  in `packages/studio/src/playbook/components/map.md`):

  - `<Map provider center zoom appearance="auto" hoveredId onHoveredIdChange>`
  - `<MapMarker id at anchor>` — children are arbitrary DOM, inherit tokens
  - `appearance="auto"` follows `<GradeThemeProvider>` mode (light/dark)
  - Imperative ref: `flyTo(id|coords)`, `panTo`, `fitBounds`, `getCenter`,
    `getZoom`, `getBounds`, plus `instance` (the provider-native escape
    hatch — cast and use the SDK directly for 3D, custom layers, drawing,
    heatmaps, etc.)

  Sub-path exports `@gradeui/ui/map/maplibre`, `/map/mapbox`, `/map/google`
  let consumers preload a single adapter (skipping the default async
  boundary) for SSG or eager-load scenarios.

  Coordinates are always `[lng, lat]` tuples in the public API. Each
  adapter normalizes internally — Google's `{ lat, lng }` object form is
  handled in `adapters/google.ts`.

  Unblocks the `airbnb-listings` reference layout, parked under
  `MISSING_COMPONENTS` in `packages/studio/src/playbook/layouts/index.ts`.
  That scaffold ships in a follow-up changeset alongside the
  `MISSING_COMPONENTS` cleanup.

- 47b97b0: Foundation pass on Tabs, ToggleGroup, Button + new Breadcrumb primitive.

  **Tabs**

  - T-shirt sizes (`sm` / `md` / `lg`) via CVA, default `md`. A small
    size context cascades from `TabsList` to every `TabsTrigger` so
    consumers set the size once on the list.
  - Explicit per-size heights on the trigger so vertical and horizontal
    whitespace stay symmetric — fixes the "padding feels off" v1
    papercut.
  - New `tooltip` prop on `TabsTrigger`. Pass it on an icon-only trigger
    and the component wraps the trigger in the design-system `Tooltip`
    - auto-applies `aria-label` (if not set) so screen readers still
      have an accessible name. Requires a `TooltipProvider` somewhere
      above the tabs.
  - `[&_svg]:size-*` baked into each size variant, so icon children
    sit at the right scale without per-call className overrides.

  **ToggleGroup**

  - Self-contained CVA (`toggleGroupVariants` /
    `toggleGroupItemVariants`) instead of composing `toggleVariants`
    from `Toggle`. The two components have different intents
    (standalone on/off vs in-group picker) and shouldn't share styling.
  - Visual parity with `TabsList`/`TabsTrigger` — same pill chrome,
    same active-state lift, same t-shirt scale. A segmented control
    reads identically whether you reached for Tabs or ToggleGroup.
  - Size cascades from group to items via context (matches the Tabs
    pattern).

  **Button**

  - Size scale aligned to Tabs heights exactly: `sm` = h-7, `md` = h-8,
    `lg` = h-10. Type and icon sizes follow the same scale.
  - `default` is preserved as an alias for `md` so existing call sites
    keep working through the rename.
  - A button placed next to a `TabsList` of the same size now lines up
    edge-to-edge without per-call overrides.

  **New `Breadcrumb` primitive**

  - Composable, surface-less navigation primitive (Breadcrumb /
    BreadcrumbList / BreadcrumbItem / BreadcrumbLink / BreadcrumbPage /
    BreadcrumbSeparator / BreadcrumbEllipsis).
  - Density matches `TabsTrigger`. Theme-token colours throughout.
  - `BreadcrumbLink` renders an `<a>` when `href` is set, a `<button>`
    for in-app click handlers, or a `<span>` when `asChild` is used —
    same visual either way.

  **Removed: `TopMenu`**

  - `TopMenu` and its subcomponents (`TopMenuUser`, `TopMenuUserItem`,
    `TopMenuUserSection`) are dropped from the package. Inherited from
    an earlier iteration and too specific to one app-shell shape to
    pull its weight as a design-system primitive. The new `Breadcrumb`
    covers the navigation-crumbs case generically; compose any other
    header chrome at the consumer level.

  **Theme system**

  - `applyThemeToRoot` is now a thin wrapper over the new
    `applyThemeToElement(theme, mode, target)` so themes can be scoped
    to any `HTMLElement` (a div, an iframe's document element). Same
    semantics as before for the existing usage.

  **Studio theme**

  - New `studioInput` ships as the default chrome theme — off-white
    parchment surface, near-black text and buttons via a small
    per-theme tokenOverrides pass that re-routes the primary token to
    the dark end of the neutral ramp.
  - `defaultThemeId` now points at `studio`. Existing user themes
    (calm, energy) remain available in the switcher.

## 0.8.2

### Patch Changes

- c0b8e6b: Export `Avatar`, `AvatarImage`, `AvatarFallback` from the package barrel.
  The component has shipped since v0.3 but was never re-exported from
  `lib/index.ts`, so `import { Avatar } from "@gradeui/ui"` resolved to
  `undefined` and Sandpack crashed with "Element type is invalid".
  Visible in Studio as four of the five reference-layout scaffolds
  (saas-user-editor, music-app, tv-streaming, data-table-filters) failing
  to render; ecommerce-listing was the only one that didn't use Avatar.

## 0.8.1

### Patch Changes

- 8b11cd2: Expose `./package.json` as a subpath export so consumers (notably the
  docs app's Studio header) can import the raw manifest to read
  `version` at build time without a deep `node_modules` path.

## 0.8.0

### Minor Changes

- bd9400b: Add `Flex` — the unopinionated flexbox primitive, the CSS-aligned escape hatch under Stack / Row / Grid. Exposes `direction` (`"row" | "col" | "row-reverse" | "col-reverse"`), `gap`, `align` (including `baseline`, which Stack/Row don't expose), `justify`, and `wrap` (`"nowrap" | "wrap" | "wrap-reverse"`) directly. Defaults match CSS — no baked-in rhythm — so consumers pay for exactly the props they set. Reach for Flex when Stack / Row / Grid don't fit (reverse direction, baseline alignment, or when you want raw CSS defaults instead of Row's `items-center gap-md` starting point).
- ac0d760: Add `Grid` — the 2D layout primitive, completing the Stack/Row/Grid trio. `cols` prop (`"1" | "2" | "3" | "4" | "5" | "6" | "12"`) bakes in a sensible responsive ladder so `<Grid cols="4">` expands to the canonical `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` stat-card pattern. `gap` and `align` scales match Stack and Row so props transfer cleanly when switching layout types.

## 0.7.0

### Minor Changes

- 8a9d01e: Add `AppShell`, `AppShellNav`, and `AppShellMain` — a top-level page scaffold primitive. `nav` variant picks the layout structure (`"none" | "top" | "side"`), `AppShellMain`'s `maxWidth` caps content width (`"full" | "container"`), and `AppShellNav` is sticky by default. Just structure — no collapse state, no context, SSR-safe.

## 0.6.0

### Minor Changes

- 557459c: Add `Stack` and `Row` — the first wave of layout primitives.

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

### Patch Changes

- 557459c: Stamp `data-gds-part` on every Card subcomponent so LLMs, design tools, and CSS can target the stable internal parts the same way they already target the media/shader primitives.

  - `Card` → `data-gds-part="card"`
  - `CardHeader` → `data-gds-part="card-header"`
  - `CardTitle` → `data-gds-part="card-title"`
  - `CardDescription` → `data-gds-part="card-description"`
  - `CardContent` → `data-gds-part="card-content"`
  - `CardFooter` → `data-gds-part="card-footer"`

  Non-breaking: the attributes are added above the existing `{...props}` spread, so consumers can still pass their own `data-gds="..."` (or any other attr) and have it win. This follows the same convention established on `MediaSurface`, `ThreeScene`, `VideoPlayer`, `ShaderPresetPicker`, and `ShaderPresetPreview` — DS owns `data-gds-part`, consumers own `data-gds`.

  Applied in both the library source (`packages/ui/components/ui/card.tsx`) and the docs-site copy (`apps/docs/components/ui/card.tsx`) to keep them in sync until the docs app starts importing from the library directly.

## 0.5.3

### Patch Changes

- e7948fd: Fix `ThreeScene` palette when tokens are authored as bare channel triplets (shadcn / gradeui convention — `--primary: 0.610 0.128 20`, no `oklch()` wrapper).

  Passing `palette={{ primary: "var(--primary)" }}` on the gradeui default theme rendered the shader pure black because `var(--primary)` expanded to the raw string `"0.610 0.128 20"`, which is not a valid CSS `<color>` — the browser fell back to the inherited colour (black) and the palette resolver happily handed that to THREE.

  The resolver now peeks at the raw custom-property value whenever the input is a `var(--token)` reference. If the value looks like an OKLCH triplet (three bare floats) or an HSL triplet (shadcn-style, with `%` on channels 2 and 3), it's re-wrapped as `oklch(...)` / `hsl(...)` before being handed to the DOM probe. Fully-formed colours (`oklch(...)`, `#hex`, `rgb(...)`, named colours, and `var(...)` pointing at a pre-wrapped value) are unchanged.

  Net effect: `palette={{ primary: "var(--primary)", secondary: "var(--secondary)", ... }}` now Just Works on gradeui themes and re-tints on theme change, matching the docs.

## 0.5.2

### Patch Changes

- 800b9ac: Fix `ThreeScene` palette failing when tokens are authored in `oklch()` / `oklab()` / `color(srgb …)`.

  0.5.1 resolved CSS expressions via a DOM probe, but `getComputedStyle` preserves CSS Color 4 formats — so `var(--primary)` in a gradeui theme came out as `oklch(0.74 0.18 350)`, which `THREE.Color.setStyle()` can't parse and silently rendered black.

  The resolver now rasterises the computed colour through a 1×1 canvas, which is guaranteed to gamut-convert any CSS colour to sRGB bytes. Result: `var(--primary)` on an `oklch`-based theme round-trips into `rgb(r, g, b)` before THREE sees it.

  Fast path retained: if the browser already returned `rgb(…)` form, we skip the canvas step.

## 0.5.1

### Patch Changes

- 875dcb7: `ThreeScene` palette now accepts any CSS-legal colour expression.

  Previously the palette only worked with hex / `rgb()` / named colours (what `THREE.Color.setStyle()` happens to parse). Raw values like `oklch(0.74 0.18 350)` or `var(--primary)` silently fell through to black.

  Palette values are now normalised via a DOM probe + `getComputedStyle`, so every slot accepts:

  - CSS custom properties — `"var(--primary)"`
  - `oklch()`, `lab()`, `lch()`, `oklab()` — full CSS Color 4
  - `hsl()`, `rgb()`, hex, named colours (still work)

  **Automatic theme re-tinting.** A `MutationObserver` on the document root watches for `class`, `data-theme`, `data-gds-theme`, and `data-grade-mode` changes. When the active theme flips, the scene re-resolves palette values and pushes new uniforms into the running shader — no WebGL remount.

  Recommended pattern for DS consumers:

  ```jsx
  <ThreeScene
    preset="plasma"
    palette={{
      primary: "var(--primary)",
      secondary: "var(--secondary)",
      accent: "var(--accent)",
      background: "var(--background)",
    }}
  />
  ```

## 0.5.0

### Minor Changes

- 4eb7cac: Expand `ThreeScene` with on-demand custom fragment shaders and three new shipped presets.

  **New preset scenes** (`preset="…"`):

  - `plasma` — soft rolling colour clouds driven by overlapping sine waves.
  - `voronoi` — jittered cellular grid with glowing, time-animated edges.
  - `synthwave` — retro perspective grid receding to a banded sun disc.

  All palette-driven off the same `{ primary, secondary, accent, background }` slots as `space`.

  **New `fragmentShader` prop.** Users (and LLM agents) can now write GLSL directly against a fixed uniform contract — `uTime`, `uResolution`, `uMouse`, `uPrimary`, `uSecondary`, `uAccent`, `uBackground`, plus `varying vec2 vUv`. The header is auto-injected; only `void main()` needs to be authored. Runs on a fullscreen orthographic quad, auto-wires pointer tracking, and shares all post-FX presets with preset-backed scenes.

  **Resilient compile errors.** A new `ShaderCompileError` class surfaces GL info logs via an `onShaderError` callback; the scene automatically falls back to `preset="space"` on compile failure, so a bad shader never leaves the surface blank.

  New public exports: `FRAGMENT_HEADER` (the auto-injected prelude, for introspection), `ShaderCompileError`, `buildFragmentShaderScene`.

## 0.4.0

### Minor Changes

- 4e71353: Add Media section: `MediaSurface`, `VideoPlayer`, `RivePlayer`, `ThreeScene`,
  `ShaderPresetPreview`, `ShaderPresetPicker`. All share a common
  aspect-ratio surface with `--rds-media-radius` and pause-on-offscreen
  behaviour.

  - `VideoPlayer` — native `<video>` wrapped in the shared surface; controls
    on by default, or chromeless viewer mode for hero/background loops.
    Posters render as a `loading="lazy"` `<img>` overlay rather than using
    the native `poster` attribute, so offscreen players don't fetch the
    still eagerly.
  - `RivePlayer` — `@rive-app/react-canvas` runtime (optional dep, lazy
    imported) with state-machine inputs and fit modes.
  - `ThreeScene` — WebGL primitive with a shader preset registry + post-FX
    presets (`vhs`, `cinematic`, `synthwave`, `crt`). Bring-your-own scene
    factory also supported.
  - `ShaderPresetPreview` / `ShaderPresetPicker` — thumbnail cards and a
    filterable gallery, both backed by the same registry that drives
    `<ThreeScene preset="…" />`.

  Also: fixed a Calendar SSR hydration mismatch (locale-dependent
  `data-day` attribute — now emitted as an ISO string) and split
  convolution vs UV-transforming effects into separate
  `EffectPass` instances so post-processing composition doesn't throw at
  construction time.

## 0.3.0

### Minor Changes

- 899d77c: Add `DatePicker` and `DateRangePicker` as sealed complex components, and export the underlying `Calendar` and `Popover` primitives from the barrel.

  Previously consumers had to compose Popover + Button + Calendar themselves (or fall back to `<input type="date">`). Now:

  ```tsx
  import { DatePicker, DateRangePicker } from "@gradeui/ui"

  <DatePicker value={date} onChange={setDate} />
  <DateRangePicker value={range} onChange={setRange} numberOfMonths={2} />
  ```

  The DatePicker exposes a `value` / `onChange` contract over a `Date` (or `DateRange`), with optional `placeholder`, `format` (date-fns token, default `"PPP"`), `align`, `side`, `captionLayout`, `icon`, `contentClassName`, and `numberOfMonths` (range only). Internally it still composes Popover + Button + Calendar, so consumers who need a custom trigger can import those primitives directly and build their own.

## 0.2.0

### Minor Changes

- fc1241a: Alert gains paired soft/deep status tokens across success, warning, info,
  highlight, and destructive. The `-soft` token drives tinted surfaces and
  `-deep` drives on-surface text and icon colour, derived through
  `deriveAlertPair` in the theme pipeline so both remain legible across
  generated palettes. Exposed as `bg-*-soft`, `text-*-deep`, and
  `border-*/30` utilities via the Tailwind preset.

  Finishes the Ramp → Grade rename: `ramp-mode-switcher`,
  `ramp-theme-provider`, and `ramp-theme-switcher` are now `grade-*`.
  `@ramp-ds/ui` consumers should switch to `@gradeui/ui` (the old package
  is defunct).

## 0.1.1

### Patch Changes

- 74baf04: Initial public release of @gradeui/core, @gradeui/ui, and @gradeui/pro.
