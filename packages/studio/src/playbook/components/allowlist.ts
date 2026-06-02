/**
 * The components the model is allowed to emit in `jsx` code blocks.
 *
 * Used by:
 *   - the system prompt (OUTPUT RULES #4) — the model sees this list and is
 *     instructed not to stray outside it
 *   - the retrieval layer — ref matches outside the allowlist are dropped
 *     before they reach the system prompt so we don't hint at components
 *     the model can't actually emit (e.g. a prompt mentioning "animation"
 *     matches RivePlayer's aliases, but RivePlayer isn't in the list, so
 *     don't surface its ref block)
 *   - Sandpack's virtual filesystem (in `apps/docs/lib/chat-sandpack.ts`) —
 *     which ships the source for every allowed component so the iframe can
 *     resolve them
 *
 * Keep in sync with the `componentFiles` map in chat-sandpack.ts until that
 * whole setup graduates into `src/runtime/`.
 */
export const ALLOWED_COMPONENTS = [
  // Layout primitives — reach for these over hand-rolled flex/grid so
  // the resulting structure is editable via the settings panel and the
  // vertical/horizontal rhythm stays consistent across designs.
  //   Stack — vertical 1D
  //   Row   — horizontal 1D
  //   Grid  — 2D responsive; `cols` prop bakes in the responsive ladder
  //           so "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" becomes
  //           <Grid cols="4">. The model hand-rolls the same pattern
  //           otherwise, often with invented classes like `gap-md` that
  //           silently do nothing.
  //   Flex  — the unopinionated escape hatch. CSS-aligned — direction,
  //           gap, align, justify, wrap exposed directly. Reach for Flex
  //           when Stack / Row / Grid don't fit (reverse direction,
  //           baseline alignment, CSS defaults).
  "Stack",
  "Row",
  "Grid",
  "Flex",
  // App scaffold — the top-level page shell. FOUR `nav` variants pick
  // the structure; reach for AppShell instead of hand-rolling grid
  // templates on every app layout:
  //   nav="none"        Single column. Marketing, login.
  //   nav="top"         Top bar + content. Reddit, Twitter chrome.
  //   nav="side"        Left nav + content. Linear, Notion.
  //   nav="three-pane"  **Narrow rail + Aside + Main.** Slack, WhatsApp,
  //                     Mail, Plane, Discord. ANY screen with a vertical
  //                     icon rail next to a separate list/sidebar is
  //                     this — don't reach for raw `<div className="grid">`
  //                     with three columns.
  // AppShellHeader / AppShellFooter slot full-bleed top/bottom rows.
  // AppShellAside is the middle column in three-pane (width via the CSS
  // var: style={{ "--gds-app-shell-aside": "260px" }}). AppShellMain's
  // maxWidth caps content width ("full" | "container").
  "AppShell",
  "AppShellHeader",
  "AppShellNav",
  "AppShellAside",
  "AppShellMain",
  "AppShellFooter",
  // Toolbar — slot-based chrome bar with `leading` / `center` /
  // `trailing` props (Apple HIG "Toolbar" shape). THE ANSWER for any
  // three-region top/bottom bar — Reddit / Twitter / GitHub / Linear's
  // top chrome, section toolbars inside a Card, bottom action bars.
  // Don't hand-roll `<Row justify="between">` with a flex-1 middle
  // child — Toolbar's grid template is auto/1fr/auto so the center slot
  // stays visually centered regardless of leading/trailing widths.
  // position="top"|"bottom"|"inline", size="sm"|"md"|"lg", sticky.
  // Drops naturally inside <AppShellHeader> for window chrome.
  "Toolbar",
  "ToolbarSlot",
  // Brand — the Logo mark (square/horizontal/icon × light/dark/mono),
  // artwork supplied by the consumer. Lands in headers, sidenavs, footers.
  "Logo",
  // Core primitives
  "Button",
  "Card",
  "CardHeader",
  "CardTitle",
  "CardDescription",
  "CardContent",
  "CardFooter",
  "Input",
  "Label",
  "Textarea",
  // Composer — Lexical-backed text composition surface. MANDATORY for
  // any chat input (Slack / Discord / Teams clones), comment box
  // (Linear / GitHub / Jira), reply input (Reddit / Twitter), AI prompt
  // surface, or document body editor. CONCRETE TEST: if the layout
  // would otherwise be `<textarea>` + a row of Bold/Italic/Paperclip/
  // Send buttons, that IS `<Composer>`. Do NOT roll the textarea +
  // toolbar + send button inline. Do NOT import @tiptap, @lexical, or
  // any other editor framework directly — Composer wraps Lexical.
  // Plain text via `formats={false}` or rich text via the `formats`
  // array; `triggers` for @-mentions and /-commands; `attachments` for
  // paperclip + paste-image intake with full object URL lifecycle.
  // Scripted demo playback via the `steps` prop reads the same
  // vocabulary as Code's step machine. See composer.md's anti-patterns.
  "Composer",
  // ComposerReply — preset for reply boxes (placeholder="Write a reply…",
  // formats=false, submitOnEnter=false). Reach for it in comment threads
  // and reply surfaces; falls through to Composer for everything richer.
  "ComposerReply",
  // Feedback
  // Callout — renamed from Alert (May 2026). The Alert name is reserved
  // for a future blocking/interruptive primitive; current modal-alert
  // semantics live in <Dialog>. Don't re-add "Alert" here.
  "Callout",
  "CalloutTitle",
  "CalloutDescription",
  "Badge",
  "Progress",
  "Skeleton",
  // Overlays
  "Dialog",
  "DialogTrigger",
  "DialogContent",
  "DialogHeader",
  "DialogTitle",
  "DialogDescription",
  "DialogFooter",
  // DropdownMenu — Radix-backed menu primitive. Reach for it whenever
  // the prompt says "menu", "dropdown", "actions menu", "filter menu",
  // "more menu", "user menu", "context menu" (right-click), or "split
  // button". DropdownMenuCheckboxItem + DropdownMenuRadioItem handle
  // multi-/single-select filters; DropdownMenuSub for nested menus.
  // Don't reach for it for navigation chrome (use Sidebar/Tabs) or
  // for typeahead search (use Command).
  "DropdownMenu",
  "DropdownMenuTrigger",
  "DropdownMenuContent",
  "DropdownMenuItem",
  "DropdownMenuCheckboxItem",
  "DropdownMenuRadioGroup",
  "DropdownMenuRadioItem",
  "DropdownMenuLabel",
  "DropdownMenuSeparator",
  "DropdownMenuShortcut",
  "DropdownMenuSub",
  "DropdownMenuSubTrigger",
  "DropdownMenuSubContent",
  "DropdownMenuGroup",
  // Breadcrumb — DS-styled path-trail navigation. Compound API:
  // <Breadcrumb><BreadcrumbList><BreadcrumbItem>…<BreadcrumbLink/>
  // or <BreadcrumbPage/></BreadcrumbItem><BreadcrumbSeparator/>…
  // </BreadcrumbList></Breadcrumb>. Final crumb (current page) MUST
  // be <BreadcrumbPage> — it's the non-clickable terminal. Use
  // <BreadcrumbEllipsis> in the middle when collapsing a deep path.
  // Don't hand-roll path > path > path with ChevronRight icons.
  "Breadcrumb",
  "BreadcrumbList",
  "BreadcrumbItem",
  "BreadcrumbLink",
  "BreadcrumbPage",
  "BreadcrumbSeparator",
  "BreadcrumbEllipsis",
  // Form controls
  "Checkbox",
  "Switch",
  // RadioGroup wraps RadioCard / RadioGroupItem for single-select.
  "RadioGroup",
  "RadioGroupItem",
  // Field — inline composition: a bare control (Checkbox/RadioGroupItem/
  // Switch) + Field.Label + Field.Description (+ Field.Trailing). Wires
  // id / aria automatically. `layout="setting"` for the text-left,
  // control-right settings row.
  "Field",
  "FieldLabel",
  "FieldDescription",
  "FieldTrailing",
  // Selection cards — the WHOLE card is the control (focus + checked state
  // on the parent surface). RadioCard goes inside a RadioGroup; CheckboxCard
  // and SwitchCard stand alone. Pass `label` + `description` (+ `aside` for a
  // Badge); `hideIndicator` / `indicatorPosition` to tune the glyph. THE
  // ANSWER for shipping-option / plan-picker / settings-toggle cards — don't
  // hand-roll a Card with a Radio floating in the corner. Static content
  // only inside (no nested Slider/Input/Button).
  "RadioCard",
  "CheckboxCard",
  "SwitchCard",
  "Select",
  "SelectTrigger",
  "SelectContent",
  "SelectValue",
  "SelectItem",
  // MultiSelect — multi-pick combobox, data-driven via `options`. THE
  // ANSWER for any "removable-chips-inside-an-input" / "chip-in-trigger"
  // pattern: selected items render as Badges with X icons inside the
  // trigger button; a Popover with searchable Command list opens for
  // selection; "+N more" collapses past `maxCount`. Reach for it for:
  //   - tag pickers, label pickers, category pickers
  //   - filter chips (Linear / Jira filter bars — assignee, status, project)
  //   - channel pickers (Slack), relation properties (Notion)
  //   - GitHub label / reviewer pickers
  //   - "filter by N things" everywhere
  // Don't invent <ChipInput> / <TagInput> — MultiSelect covers it.
  // Use Select for SINGLE selection; reach for Command directly when the
  // option set is unbounded / async (users to @-mention, email recipients).
  "MultiSelect",
  // Date + Popover (shipped in @gradeui/ui@0.3.0)
  "DatePicker",
  "DateRangePicker",
  "Calendar",
  "Popover",
  "PopoverTrigger",
  "PopoverContent",
  "PopoverAnchor",
  // Layout & data display
  "Separator",
  "Avatar",
  "AvatarImage",
  "AvatarFallback",
  // Message — the canonical "avatar + author + timestamp + body" row.
  // MANDATORY for any chat surface (Slack / Discord / Teams clones),
  // comment thread (Linear / GitHub / Jira), post-reply feed (Reddit /
  // Twitter), or in-app activity log. CONCRETE TEST: if the layout
  // would otherwise be `<Avatar>` + `<Row>` of author/time + `<p>`
  // body, that IS `<Message>`. Do NOT roll it inline with raw flex
  // divs. The slot-based avatar prop accepts any Avatar composition
  // (size + tone for stable per-author colour). align="end" mirrors
  // the row for "your messages" in DM threads. See message.md's
  // anti-patterns section for the exact shape to avoid.
  "Message",
  // Tabs — has `variant: "pill" | "underlined"` on TabsList. The
  // underlined treatment replaced the retired SimpleTabs component
  // (May 2026); the model should pick `variant="underlined"` for
  // marketing / docs-style tab strips and the default pill for app
  // chrome.
  "Tabs",
  "TabsList",
  "TabsTrigger",
  "TabsContent",
  "Table",
  "TableHeader",
  "TableBody",
  "TableFooter",
  "TableHead",
  "TableRow",
  "TableCell",
  "TableCaption",
  // Media (shipped in @gradeui/ui@0.4.0)
  //   - VideoPlayer / ThreeScene are the high-level wrappers the model
  //     should reach for. MediaSurface is the low-level shell; exposing
  //     it too means a user who says "build a bespoke media thing" has a
  //     way to do it without the model inventing imports.
  //   - RivePlayer is intentionally NOT exposed to Studio right now — the
  //     @rive-app/react-canvas runtime is ~900KB and we aren't pushing Rive
  //     as a studio-first primitive. Consumers installing @gradeui/ui
  //     directly can still use it by adding the optional dep themselves.
  //   - Shader preset primitives are included so a prompt like "show a
  //     gallery of shader backgrounds" picks the registry-driven UI instead
  //     of fabricating one.
  "VideoPlayer",
  "ThreeScene",
  "MediaSurface",
  "ShaderPresetPreview",
  "ShaderPresetPicker",
  //   - BackgroundFill is the "set a background" primitive. A background
  //     (shader / image / video / gradient / solid) is a FILL of a frame,
  //     not a free-standing node: drop <BackgroundFill> as the first child
  //     of a `relative overflow-hidden` frame and put content above it with
  //     `relative z-10`. When the user asks to "set a background" / "add a
  //     shader background", reach for this — NOT a full-bleed <ThreeScene>
  //     sibling (which floats unselectable at z-0).
  "BackgroundFill",
  // Sidebar (renamed from SideMenu, May 2026). Compound API — the model
  // should compose <Sidebar><SidebarHeader/><SidebarContent>...
  // <SidebarSection title="..."><SidebarItem icon={...}>Label</SidebarItem>
  // </SidebarSection></SidebarContent><SidebarFooter/></Sidebar>. Drop the
  // old `sections={[…]}` data-driven shape — that was SideMenu's API, now
  // retired.
  "Sidebar",
  "SidebarHeader",
  "SidebarContent",
  "SidebarFooter",
  "SidebarSection",
  "SidebarItem",
  // SidebarTreeItem — Notion-style nested page trees. Branch row
  // with chevron expand/collapse + auto-indent for nested children
  // (SidebarItem or more SidebarTreeItem). Use when the sidebar
  // models a hierarchical tree (workspace > project > pages); flat
  // sidebars stay with SidebarItem only.
  "SidebarTreeItem",
  // Map (shipped in @gradeui/ui@0.9.0)
  //   - Provider-agnostic: provider="maplibre" (default, free) | "mapbox"
  //     | "google". The model should default to omitting the prop (uses
  //     MapLibre + Grade demo MapTiler key — works on gradeui.com /
  //     localhost zero-config).
  //   - Coords are ALWAYS [lng, lat] tuples in the public API.
  //   - Controlled `hoveredId` / `onHoveredIdChange` is the canonical
  //     list↔map sync path; the model should reach for that pair
  //     instead of useRef + .flyTo on every hover.
  //   - Sidecar at sidecars/map.md documents the API + anti-patterns.
  "Map",
  "MapMarker",
  // Carousel (shipped in @gradeui/ui@0.11.0)
  //   - Embla-backed slideshow with a compound API: Carousel + .Slide,
  //     .VideoSlide, .Dots, .Arrows. All sizing/colour driven by
  //     `--gds-carousel-*` CSS vars; data-gds-part on every addressable
  //     piece for Studio selection.
  //   - VideoSlide is the canonical "video that plays when its slide is
  //     active" — muted + loop + no controls by default (autoplay-friendly).
  //   - Per-slide autoplay duration via `<Carousel.Slide duration={ms}>` —
  //     e.g. a still hero held for 15s while video slides cycle naturally.
  //   - DISAMBIGUATION: "slider" colloquially means a slideshow, but
  //     `<Slider>` in this allow-list is the range input. The retrieval
  //     layer maps "slider" → Carousel's sidecar so the model picks the
  //     right primitive; if a user really wants a draggable thumb on a
  //     track, the prompt usually says "range".
  "Carousel",
  "CarouselSlide",
  "CarouselVideoSlide",
  "CarouselDots",
  "CarouselArrows",
  "CarouselPrev",
  "CarouselNext",
  // Sortable (shipped May 2026). Drag-to-reorder built on @dnd-kit.
  // Model should reach for this on "make this list reorderable",
  // "drag to sort", "kanban", "sortable shelf". Wraps a layout
  // primitive — Stack/Row/Grid stay pure. SortableHandle is
  // optional; use it when only a grip should activate drag.
  "Sortable",
  "SortableItem",
  "SortableHandle",
  // Sortable.Group — cross-container drag (May 2026 follow-up). Wrap
  // multiple <Sortable> instances inside <Sortable.Group> and items
  // can drag BETWEEN columns. Use for kanban / multi-column-list
  // layouts. Each child Sortable needs an `id` prop so the Group can
  // route drag-end events. Standalone Sortable (no Group) still works
  // for single-column reorder.
  "SortableGroup",
  // DemoStage + Reveal — whole-interface scripted reveals from
  // lib/demo. Wrap a region in <DemoStage steps={[...]}> and the
  // script drives which <Reveal id="x"> children become visible, in
  // what order, with what cadence. Same speed / trigger / loop / play
  // vocabulary as <Code> and <Composer>. Use for marketing heroes
  // ("badge appears, then headline, then subhead, then CTA"),
  // tutorial overlays, onboarding flows. <Reveal> outside a stage
  // renders visible by default, so the same JSX ships to production
  // without the demo wrapper.
  "DemoStage",
  "Reveal",
] as const;

/**
 * Additional bare module specifiers the model is allowed to import from.
 *
 * These must be declared in the Sandpack `customSetup.dependencies` block so
 * the iframe can actually resolve them. Keep in sync with the Sandpack setup
 * in `apps/docs/lib/chat-sandpack.ts` (and wherever else the iframe gets
 * built — studio-preview, design-chat, the template viewer, /play).
 */
export const ALLOWED_EXTERNAL_IMPORTS = [
  "lucide-react",
  "recharts",
  // canvas-confetti — small declarative confetti library. Reach for it
  // when a scaffold wants to celebrate something (checkout success, form
  // win, puzzle solved). Tiny runtime, imperative API, nothing to clean
  // up: `import confetti from "canvas-confetti"; confetti({...})`.
  "canvas-confetti",
  // motion (the new name for framer-motion, same v12 API). Already
  // a dep of @gradeui/ui. Reach for it for spring physics, layout
  // animations, gesture-driven motion, view transitions. The
  // common entrypoint is `import { motion } from "motion/react"`
  // — `motion.div` / `motion.button` accept all standard React
  // props plus `initial` / `animate` / `exit` / `transition` /
  // `whileHover` / `whileTap` / `layout`. For drag-and-drop reorder
  // specifically reach for <Sortable> first; motion is for
  // appearance / state-change animation, not pointer drag.
  "motion",
  "motion/react",
  // @dnd-kit/core — escape hatch under <Sortable>. The wrapper
  // covers single-list reorder + grid + horizontal strip; if you
  // need cross-container drag (kanban columns), custom collision
  // detection, or drag overlays with arbitrary chrome, reach for
  // the raw library. Most generations should NOT need this — the
  // <Sortable> compound is the path of least resistance.
  "@dnd-kit/core",
  "@dnd-kit/sortable",
  "@dnd-kit/utilities",
  // TipTap — the rich-text editor stack for comments, doc bodies,
  // slash menus, @mentions. The Linear/Notion-flavoured editing
  // primitive. Default starter-kit covers bold/italic/headings/lists/
  // links; @tiptap/extension-mention adds @-typeahead;
  // @tiptap/extension-placeholder adds the "Write something…" hint.
  "@tiptap/react",
  "@tiptap/starter-kit",
  "@tiptap/extension-mention",
  "@tiptap/extension-placeholder",
  // Long-tail-clone enablers (May 2026). Each is small, high-value,
  // and pre-stamped in Fast Frame so they resolve instantly.
  // - react-virtuoso: virtualised long lists (Slack messages,
  //   Discord channels, 1000-row tables that don't lag).
  // - react-hotkeys-hook: global keyboard shortcuts (Linear j/k,
  //   cmd-k, gmail-style chords).
  // - @tanstack/react-table: headless data table — sorting,
  //   filtering, pagination, column defs. Pair with the DS Table
  //   component for chrome.
  // - @radix-ui/react-context-menu: right-click menus (Discord
  //   message actions, Notion block actions, file managers).
  // - @radix-ui/react-toolbar: roving-focus toolbar — perfect
  //   pairing for a TipTap rich-text toolbar.
  "react-virtuoso",
  "react-hotkeys-hook",
  "@tanstack/react-table",
  "@radix-ui/react-context-menu",
  "@radix-ui/react-toolbar",
] as const;

/**
 * Layout primitives whose ref block gets pinned to the system prompt
 * regardless of whether the user's message mentions them.
 *
 * Retrieval's text-match heuristic fires on component names and aliases,
 * but most user prompts ("a card with two buttons at the bottom") don't
 * say "row" or "stack" — so the model never sees their props and falls
 * back to hand-rolled `flex gap-2 justify-end`. Pinning them costs ~4
 * small .md files worth of tokens and reliably steers the model toward
 * the settings-panel-editable path.
 *
 * Kept small on purpose — this isn't a "star components" list, it's
 * specifically the layout primitives that suffer most from the retrieval
 * gap. If a non-layout component needs similar treatment, consider
 * fixing its aliases first.
 */
export const PINNED_COMPONENTS = ["AppShell", "Stack", "Row", "Grid", "Flex"] as const;
