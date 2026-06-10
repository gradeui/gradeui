# @gradeui/studio

## 0.3.0

### Minor Changes

- 2845f87: The primitive token layer, the BYODS registry, and modular type scales.

  **@gradeui/core — first real release.** No longer a placeholder. Ships the primitive token layer (layers 1–2 of the token model):

  - `tokens.css` (import via `@gradeui/core/tokens.css`) — brand color ramps, neutral grays, semantic role aliases, spacing scale, border radii, font stacks + the new `--font-display` / `--font-body` slots, and the type scale. Authored source of truth.
  - Typed data generated from the CSS (`GDS_COLOR_RAMPS`, `GDS_NEUTRALS`, `GDS_SEMANTIC_ALIASES`, `GDS_SPACING`, `GDS_RADIUS`, `GDS_FONT_FAMILIES`, `GDS_TYPE_SCALE`, `GDS_RAMP_NAMES`) via `scripts/generate-tokens.mjs`.
  - Modular scales: `GDS_MODULAR_SCALES` (musical-interval ratios), `modularRamp`, `modularStep`, and `modularTypeSizes` — the middle-out (Utopia-model) ladder over Tailwind's size vocabulary (`GDS_TYPE_SIZE_NAMES`, base mid-ladder, reciprocal descent, floored).
  - Semantic alias model: every alias is a ROLE pointing at a whole ramp. Added palette roles `--gds-primary` / `--gds-secondary` / `--gds-neutral`; removed `--gds-teal-semantic` (named a color, not a meaning) and `--gds-energy` (brand flavor, not a role).

  **@gradeui/ui.** Now depends on `@gradeui/core`; `styles/globals.css` imports `@gradeui/core/tokens.css` instead of carrying the primitives inline (built `dist/styles.css` remains self-contained and is verified var-identical). Theme engine: `ThemeInput.typography.scale` accepts modular scale ids (`TypeScale = TypeScalePreset | ModularScaleId`) and generates the semantic ladder middle-out from the body size; legacy presets unchanged.

  **@gradeui/studio.** New `registry` module (`@gradeui/studio/registry`): the `DesignSystemRegistry` contract for bring-your-own-design-system, with `GRADE_REGISTRY` as the default assembled from the playbook constants. `buildSystemPrompt()` takes an optional registry (component list, DS name, package specifier); output with the default registry is byte-identical to the previous prompt.

## 0.2.0

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

## 0.1.0

### Minor Changes

- 6a61a68: Add the `airbnb-listings` reference layout — the canonical two-pane
  list ↔ map pattern. Was parked under "Reference layouts we WANT to
  ship" pending the Map primitive; ships now that `<Map>` and
  `<MapMarker>` landed in `@gradeui/ui@0.9.0`.

  Shape: `AppShell nav="top"` with a filter bar (search input,
  DateRangePicker, guests + type Selects, Filters button), then a
  two-pane main — scrollable Card listings on the left, full-bleed
  `<Map>` on the right. Hover sync runs through the controlled
  `hoveredId` / `onHoveredIdChange` prop pair, demonstrating the
  recommended pattern (no refs, no imperative `flyTo`).

  Tags include `airbnb`, `stays`, `listings`, `real estate`, `fleet`,
  `logistics`, `lodging`, `vacation` — covers the full "location-first
  SaaS demo" cluster of prompts the retrieval pass is most likely to
  match.

  Source: `packages/studio/src/playbook/layouts/scaffolds/airbnb-listings.jsx`.
  Run `pnpm -F @gradeui/studio generate:scaffolds` after pulling to
  inline it into `scaffolds.generated.ts`.
