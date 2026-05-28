---
"@gradeui/ui": minor
---

May 2026 refresh — new components, two renames, AI pipeline upgrades, bug fixes

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
- **Cross-platform aliases sweep.** Every sidecar's `aliases:` array now includes Apple HIG (macOS, iOS, SwiftUI) and React Native vocabulary alongside the existing web/shadcn terms. Designers speccing across RN-mobile + Tailwind-web teams can describe components in any of those vocabularies and retrieval still fires. HIG is a *reference* vocabulary — no renames.
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
