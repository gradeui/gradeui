# gradeui — Component Inventory

Single source of truth for every `@gradeui/ui` component and its Figma library status. Update this file whenever a component lands or its API changes — it's read by tooling and humans (designers, future Claude sessions) to avoid drift between code and Figma.

**Figma status legend:** ✅ built · ⚠️ partial · ⏳ pending · ❌ not in Figma (intentionally) · 🔁 deferred

## Layout primitives

| Component | File | Key props | Figma | Notes |
|---|---|---|---|---|
| Section + Container (+ SectionEyebrow/Title/Subtitle/Description/Actions/Media) | `section.tsx` | Section: `scope` (default/inverse/brand/accent/muted/card), `pad` (none/sm/md/lg/xl), `as`. Container: `maxW` (sm/md/lg/xl/prose/full), `grid`, `as` | ⏳ | The page SCAFFOLD (STUDIO-SECTIONS.md). Section = full-width band (colour scope + vertical rhythm, content free); Container = the centred max-width measure dropped inside (omit for full-bleed). Parts give the heading+copy+CTA+media shape design intent. Distinct from the heavier `SectionBlock` (bakes title/cta props). |
| Stack | `stack.tsx` | `gap` (none/xs/sm/md/lg/xl/2xl), `align` (start/center/end/stretch) | ✅ | Vertical autolayout in Figma |
| Row | `row.tsx` | `gap`, `align`, `justify`, `wrap` | ✅ | Horizontal autolayout |
| Grid | `grid.tsx` | `cols` (1/2/3/4/5/6/12), `gap`, `align` | ✅ | Responsive ladder per `cols` value |
| Flex | `flex.tsx` | `direction`, `gap`, `align`, `justify`, `wrap` | ✅ | Escape hatch — CSS-aligned defaults |
| AppShell + Header/Nav/Aside/Main/Footer | `app-shell.tsx` | `nav` (none/top/side/three-pane), `maxWidth`, `sticky` | ✅ | 5-slot CSS-grid template-areas layout. `nav="three-pane"` adds an `Aside` column with width via `--gds-app-shell-aside` (default 320px). Header + Footer span full width — covers marketing pages too. |
| ResizablePanelGroup / ResizablePanel / ResizableHandle | `resizable.tsx` | direction h/v · withHandle · id (persists layout) | ⏳ | Port of shadcn resizable on `react-resizable-panels`. Use for user-adjustable columns; for static fixed-width middle, prefer `AppShell nav="three-pane"`. |

## Form primitives

| Component | File | Key props | Figma | Notes |
|---|---|---|---|---|
| Button | `button.tsx` | `variant` (default/secondary/destructive/outline/ghost/link/raised), `size` (default/sm/lg/icon) | ✅ | `raised` is the tactile bevel + drop-shadow variant; tone via `--btn-glow` |
| Input | `input.tsx` | type, plus `with-icon-left` Figma-only variant | ⚠️ | Figma adds icon-left layout; source has none |
| Textarea | `textarea.tsx` | min-h-80, no formal variants | ✅ | State variants in Figma |
| Label | `label.tsx` | none — text-sm/medium/leading-none | ✅ | |
| Checkbox | `checkbox.tsx` | none formally; checked/indeterminate states | ✅ | |
| RadioGroup / RadioGroupItem | `radio-group.tsx` | container `grid gap-2` | ✅ | vertical + horizontal orientation variants |
| Switch | `switch.tsx` | none — w-11 h-6 thumb-translate | ✅ | |
| Field (+ Label/Description/Trailing) | `field.tsx` | `layout` (option/setting) · slots: Field.Label / Field.Description / Field.Trailing | ⏳ | Inline composition for a bare control + caption. Auto-wires `id` + `aria-describedby` (clones the control child). `setting` = text-left, control-right row. Keeps Checkbox/Radio/Switch primitives bare — they never grow a `description` prop. |
| RadioCard / CheckboxCard / SwitchCard | `selection-card.tsx` | `label`, `description`, `aside`, `hideIndicator`, `indicatorPosition` (leading/trailing) + native control props | ⏳ | Selectable cards where the WHOLE surface is the control — focus / hover / checked on the parent. Share one `.gds-selection-card` look (token-driven via `--gds-selection-card-*`); dot/check/switch glyph differs by type by design. RadioCard goes in a RadioGroup. Static content only — never nest interactive controls (plain Card + Field for that). |
| Slider | `slider.tsx` | none — track h-2 thumb 20×20 | ✅ | |
| Toggle | `toggle.tsx` | `variant` (default/outline), `size` (default/sm/lg) | ⚠️ | Figma covers default size only |
| ToggleGroup / ToggleGroupItem | `toggle-group.tsx` | inherits Toggle variants | ✅ | type=single/multiple |
| Toolbar / ToolbarSlot | `toolbar.tsx` | `position` (top/bottom/inline), `variant` (default/subtle/transparent), `size` (sm/md/lg), `sticky` | — | Slot-based: `leading` / `center` / `trailing` props. Apple HIG "Toolbar". Reach for instead of `Row justify="between"` + manual flex-1 middle. Use inside AppShellHeader for window chrome; standalone for section / bottom action toolbars. |

## Surfaces & feedback

| Component | File | Key props | Figma | Notes |
|---|---|---|---|---|
| Card + CardHeader/Title/Description/Content/Footer | `card.tsx` | `surface` (solid/translucent/glass/glass-strong) — opt into the Presence Surface system | ✅ | First-class `surface` prop landed May 2026. Replaces the "roll `bg-card/40 backdrop-blur-md` by hand" pattern with theme-tuned blur + edge highlight. See `card.md` for scenarios. |
| Banner | `banner.tsx` | `variant` (default/info/success/warning/destructive/announcement), `surface`, `align`, `sticky`, `dismissible`, `icon`, `action`, `onDismiss` | ⏳ | Full-width horizontal strip — system messages, announcements, first-run guidance. Extracted out of `FigmaIntroBanner` after invisible-banner dogfooding feedback (it referenced `--gds-*` tokens that don't exist). Distinct from Callout (inline boxed message). |
| Callout | `callout.tsx` | `variant` (default/destructive/success/warning/info) | ✅ | Renamed from Alert (May 2026); `highlight` variant dropped. ARIA role conditional: `status` (polite) for info/success/default, `alert` (assertive) for warning/destructive. Soft-bg + deep-text. |
| Badge | `badge.tsx` | 17 variants — solid/soft/outline × status colours | ✅ | |
| Swatch | `swatch.tsx` | `color`/`token`, `type` (solid/gradient/image) + `gradient`/`image`, `size` (2xs–xl), `shape` (square/rounded/circle), `selected`, `onSelect`, `label` | ✅ | A single colour chip — brand-pop strips, palette/accent pickers, theme/token previews. `type` renders a solid colour, a `gradient`, or an `image` in place; transparency checkerboard behind the fill (`--gds-media-checker-*`); pickable variant renders a `<button>` with the shared selection ring (`--selected`). Replaces hand-rolled `<div>` colour chips. **Figma:** size(2xs–xl)×shape×Type variants + `Selected` boolean, transparency checker behind each fill, solid defaults to `action/primary` (per-instance override); the `label` caption is code-only. |
| ColorPicker | `color-picker.tsx` | `value` (token name / "transparent" / null), `onValueChange`, `tokens` (groups), `searchable`, `triggerVariant` (default/inline), `allowTransparent`, `align`, `disabled` | ⏳ | Token-led, grouped, searchable single-select colour picker — the focused "pick one colour token" sibling of FillPicker's solid tab. Composes Popover + Command + Swatch (like Combobox). Each row a Swatch + token short name, grouped by family (surface/action/status); `triggerVariant="inline"` reduces it to a clickable swatch for inspector / fill-row use. |
| GradientEditor | `gradient-editor.tsx` | `value` ({ type, angle?, stops }), `onChange`; exports `gradientToCss(value)` | ⏳ | Edit a multi-stop CSS gradient with token-led stops — type Select (linear/radial/angular) + reverse/rotate, live preview bar (Swatch type="gradient"), Stops list (position % + ColorPicker + opacity % + remove), add button. Emits structured GradientValue (kept editable/serialisable); token stops resolve to `oklch(var(--<token>))`. |
| FillPicker + FillSection | `fill-picker.tsx` | FillPicker: `value` (FillValue), `onChange`. FillSection: `value` (FillValue[]), `onChange`, `title` | ⏳ | Grade's paint picker (Figma fill popover): type-icon row (solid/gradient/image/pattern/video/shader) + global opacity, emits a FillValue 1:1 with BackgroundFill. FillSection stacks a LIST of fills — each row a Solid/Gradient/Image toggle, value control (ColorPicker / GradientEditor popover / image URL), opacity %, visibility eye, remove; add in the header. |
| Skeleton | `skeleton.tsx` | none — animate-pulse rounded-md bg-muted | ✅ | 4 shape variants in Figma |
| Progress | `progress.tsx` | none — track bg-secondary, fill bg-primary | ✅ | 4 fill values in Figma |
| Separator | `separator.tsx` | `orientation` (horizontal/vertical), `decorative` | ✅ | |
| Sonner | `sonner.tsx` | toast surface, success/error/info kinds | ✅ | default/success/error/warning/info |

## Overlays & menus

| Component | File | Key props | Figma | Notes |
|---|---|---|---|---|
| Dialog (+ Header/Content/Footer/Title/Description/Close) | `dialog.tsx` | DialogContent: `surface` (solid/translucent/glass/glass-strong) | ✅ | Built with overlay frame. `surface` prop landed May 2026 — solid for destructive confirmations, glass for canvas-tool aesthetic. |
| Sheet | `sheet.tsx` | `side` (top/right/bottom/left), SheetContent: `surface` | ✅ | 4 sides, on overlay. `surface="glass"` is the Studio-inspector / iOS-action-sheet signature. |
| Popover | `popover.tsx` | PopoverContent: `surface` | ✅ | w-72 shadow-md by default. Glass for inspector popovers. |
| Tooltip | `tooltip.tsx` | none — bg-primary px-3 py-1.5 | ✅ | 4 sides in Figma. NO surface prop — tooltips are tiny and need maximum legibility; opaque by design. |
| HoverCard | `hover-card.tsx` | HoverCardContent: `surface` | ✅ | w-64 shadow-md by default. Glass for layer-preview HoverCards in canvas tools. |
| DropdownMenu (+ Item/CheckboxItem/RadioItem/Separator/Label) | `dropdown-menu.tsx` | DropdownMenuContent + DropdownMenuSubContent: `surface` | ✅ | Translucent matches iOS / Apple HIG menu sheets. Match surface between parent and submenus. |
| Select (+ Trigger/Content/Item/Value) | `select.tsx` | none formally | ✅ | placeholder/filled/open in Figma |
| MultiSelect | `multi-select.tsx` | `options`, `value`/`defaultValue`, `onValueChange`, `placeholder`, `maxCount` (badges before "+N more"), `searchable`, `badgeDismissible`, `modalPopover` | ⏳ | Composes Popover + Command + Badge. Data-driven via `options`; selected items render as removable Badges in the trigger with maxCount overflow. Select-all / Clear / Close actions in dropdown footer. For unbounded/async lists use `Command` directly. |
| Combobox | `combobox.tsx` | `options`, `value`/`defaultValue` (string\|null), `onValueChange`, `placeholder`, `searchable`, `clearable`, `triggerVariant` (default/inline), `renderValue`, `hideChevron`, `disabled`, `align` | ⏳ | Single-pick searchable picker — the single-select sibling of MultiSelect, and the Linear "selectable badge" pattern. Composes Popover + Command + Button. `triggerVariant="inline"` + `renderValue` returning a Badge makes the value itself the trigger. `disabled` (driven by a permission check) gives the read-only display. Use Select for a small fixed list with no search. |
| Command (+ Input/Item/Group) | `command.tsx` | none — bg-popover | ✅ | |

## Navigation

| Component | File | Key props | Figma | Notes |
|---|---|---|---|---|
| TopMenu | `top-menu.tsx` | breadcrumbs, leftContent, rightContent, sticky | ✅ | |
| Sidebar (+ Header/Content/Footer/Section/Item) | `sidebar.tsx` | `collapsed`/`defaultCollapsed`/`onCollapsedChange`, `collapsible` · Header / Content / Footer slots · Section: `title`/`icon`/`collapsible`/`defaultExpanded` · Item: `icon`/`badge`/`active`/`asChild`/`asButton`/`disabled`/`collapsedLabel` · `href` on Item | ✅ | Renamed from SideMenu (May 2026) and rebuilt as a compound API so consumers can slot custom chrome (search, drag handles, custom brand) alongside nav. Sized via `--gds-sidebar-*` CSS vars. Auto-wraps collapsed items in Tooltips. |
| Tabs (+ List/Trigger/Content) | `tabs.tsx` | `variant` (pill/underlined), `size` (sm/md/lg) | ✅ | Pill = shadcn chip style (default). Underlined = minimal text + bottom-border (formerly SimpleTabs, merged May 2026). |

## Content & data

| Component | File | Key props | Figma | Notes |
|---|---|---|---|---|
| Table (+ Header/Body/Row/Head/Cell/Caption) | `table.tsx` | none — text-sm hover:bg-muted/50 | ✅ | |
| DataView (+ Toggle/Columns · useDataView) | `data-view.tsx` | `data`, `columns` (schema: key/header/type/cell/role/sortable/pinned/width/align/hideable), `view`/`views` (table/cards/grid), `activeId`, `sorting`, `columnVisibility`, `stickyHeader`, `toolbar`, `renderCard` | ⏳ | Wraps TanStack. One schema drives table + cards + grid; cell renderers by `type` with `cell` override. `useDataView` hook externalises view/selection state so the toggle (`DataViewToggle`) + column menu (`DataViewColumns`) can live anywhere. Pinned (sticky-left) columns + sticky header. Pulls `@tanstack/react-table` into `@gradeui/ui`. Tokens `--gds-data-view-*`. |
| PropertyList (+ Row) | `property-list.tsx` | `layout` (row/stack), `density` (compact/default/relaxed), `align` (start/center), `divider`, `labelWidth` · Row: `label`, `icon`, `value`, `align` | ⏳ | Read-only "one record, stacked" — a Table row transposed. Renders `<dl>`/`<dt>`/`<dd>`. Value side is a polymorphic slot, so Table cell renderers (Badge, Avatar stack, date, tags) drop straight in. Token-driven via `--gds-property-list-*`. For editable fields use `Field`; a read↔edit detail panel swaps PropertyList for a stack of Fields. |
| Accordion (+ Item/Trigger/Content) | `accordion.tsx` | none — chevron rotates 180° on open | ✅ | |
| Collapsible (+ Trigger/Content) | `collapsible.tsx` | pure Radix passthrough | ✅ | |
| ScrollArea + ScrollBar | `scroll-area.tsx` | `orientation` for ScrollBar | ✅ | |
| Calendar | `calendar.tsx` | day-grid w/ data-state-* attrs | ✅ | single + range modes |
| DatePicker / DateRangePicker | `date-picker.tsx` | composes Button + Popover + Calendar | ✅ | closed + open states |
| Avatar (+ Image/Fallback) | `avatar.tsx` | h-10 w-10 default; sizes via className | ✅ | sm/md/lg/xl in Figma (Figma-side convention) |
| Logo | `logo.tsx` | `sources` (square/horizontal/icon × light/dark/mono), `lockup`, `mode`, `mono`, `size`, `label`, `href` | ⏳ | Brand mark; artwork supplied by consumer. Picks the right lockup/appearance for toolbars, sidenavs, footers. |
| GradeLoader | `grade-loader.tsx` | `size` (sm/md/lg/xl/px), `label`, `showLabel` | ⏳ | THE branded indeterminate loader — G-arrow mark + brand-pop shimmer sweep; reduced-motion pulse; role="status". |

## Composition blocks (higher-order)

| Component | File | Key props | Figma | Notes |
|---|---|---|---|---|
| SectionBlock | `section-block.tsx` | `padding`, `background` (transparent/muted/card/primary/gradient), `surface` (solid/translucent/glass/glass-strong), `container`, `alignment`, `title`, `subtitle`, `cta1/cta2`, `backgroundImage`, `as` | ✅ | 5 background variants + Presence Surface axis. Marketing hero pattern: `background="gradient"` + glass Card children. |
| CardBlock | `card-block.tsx` | `layout` (single/carousel/grid/bento/sideBySide), `columns` | ✅ | grid/sideBySide/bento built |
| MediaBlock | `media-block.tsx` | `layout` (single/carousel/grid/bento/sideBySide) | ✅ | single/grid/sideBySide/bento built |
| MediaSurface | `media-surface.tsx` | `aspect` (square/video/portrait/wide) | ✅ | gradient placeholder fill |
| FaqBlock | `faq-block.tsx` | composed Accordion section | ⏳ | |
| Carousel (+ Slide / VideoSlide / Dots / Arrows / Prev / Next) | `carousel.tsx` | `loop`, `align`, `slidesPerView`, `autoplay`, `draggable`, `onSlideChange` · per-slide `duration` · VideoSlide `src`/`poster`/`alt`/`loop`/`controls`/`fit` | ⏳ | Embla-backed. Custom autoplay loop (no plugin) so per-slide duration + advance-on-video-ended fall out cleanly. Token-driven via `--gds-carousel-*` vars. Disambiguates from `<Slider>` (range input) at the sidecar level. |
| Code | `code.tsx` | `source`, `language` (tsx/jsx/ts/js/html/css/json/bash/md/…), `highlight` (line\|range\|mixed), `diff` ({added,removed}), `reveal` (none/lines/typewriter/diff), `trigger` (mount/inView/manual), `filename`, `showLineNumbers`, `wrap`, `bare` | ⏳ | Syntax-highlighted read-only code surface. Shared `prism-react-renderer` with Studio's `CodeView`. Token palette via `--gds-code-*` CSS vars. Diff hero pattern (added/removed line bgs + `+`/`-` gutter); scroll-triggered reveals via `motion`'s `useInView`. Not an editor — for editable code, compose CodeMirror/Monaco yourself. |

## Interactions

| Component | File | Key props | Figma | Notes |
|---|---|---|---|---|
| Sortable (+ Item / Handle) | `sortable.tsx` | `values` (id[]), `onReorder`, `strategy` (vertical/horizontal/grid), `disabled` · Item: `value`, `asChild`, `disabled` · Handle: `asChild` | ⏳ | Built on `@dnd-kit/sortable`. Composes with any layout primitive (Stack/Row/Grid). v1 covers single-list reorder + horizontal strip + 2D grid; cross-container kanban deferred to `Sortable.Group`. Optional Handle scopes drag activation. |

## Media & runtime surfaces

| Component | File | Key props | Figma | Notes |
|---|---|---|---|---|
| Map / MapMarker | `map/` | MapLibre default + Mapbox/Google adapters | ⏳ | gradient placeholder used in airbnb-listings layout for now |
| VideoPlayer | `video-player.tsx` | src, poster, controls | ⏳ | |
| RivePlayer | `rive-player.tsx` | runtime-only | ❌ | excluded by "no exotics" decision |
| ThreeScene | `three-scene.tsx` | runtime-only | ❌ | excluded |
| ShaderPresetPicker / ShaderPresetPreview | `shader-preset-*.tsx` | runtime-only | ❌ | excluded |
| AiChat | `ai-chat.tsx` | message stream | 🔁 | deferred — large compound component |
| Chart (ChartContainer + Tooltip/Legend) | `chart.tsx` | recharts wrapper; `config` ChartConfig | ❌ | Barrel-exported + Studio-allowlisted (Jun 2026); chart shape brought from `recharts`. Code-only (not a Figma component). |
| ScreenAnimator | `screen-animator.tsx` | `shots` (zoom/cx/cy/hold/trans/label), `loop`, `maxLoops`, `spotlight`, `cursor`, `paused`, `onEnded`, `stage`, `backdrop` | ❌ | runtime-only — the directed-camera primitive (see STUDIO-DIRECTOR.md) |
| Motion (+ MotionScene / MotionScreen / MotionText) | `motion.tsx` | `view` (play/strip), `aspect` (16/9 · 9/16 · 1/1 · auto), `stage`, `loop`, `controls` · Scene: `label`, `durationMs`, `fill`, `transition` · Screen: `device`, `shots` (own camera), `screenId` · Text: `template` (title/lower-third/section-break), `heading`, `text`, `tone` | ❌ | runtime-only — Grade Motion: directed scene sequences (text → demo → video). Completion contract: scene advances when all timed children finish. See STUDIO-DIRECTOR.md "Grade Motion" |

## Iconography

| Component | File | Notes |
|---|---|---|
| BookIcon | `book-icon.tsx` | hand-drawn SVG icon |
| PaintIcon | `paint-icon.tsx` | hand-drawn SVG icon |
| StackIcon | `stack-icon.tsx` | hand-drawn SVG icon |
| (general icons) | n/a | use `lucide-react` directly. **Figma plan:** import the Lucide community library; do NOT make a single "Icon" master in Figma — that creates drift since gradeui has no such abstraction. |

## Reference layouts (in `packages/studio/src/playbook/layouts/scaffolds/`)

| Layout | Components used | Figma frame |
|---|---|---|
| airbnb-listings | AppShell, Stack, Row, Card, Button, Badge, Input, Select, DateRangePicker, MediaSurface, Map | ✅ |
| confetti-celebration | AppShell, Stack, Row, Grid, Card, Button, Badge, Separator | ✅ |
| data-table-filters | AppShell, Stack, Row, Button, Badge, Input, Select, Table, Avatar, Checkbox | ✅ |
| data-table-detail | AppShell, Stack, Row, Card, Button, Badge, Avatar, Separator, Input, Switch, DataView, useDataView, Combobox, MultiSelect, PropertyList | ⏳ |
| ecommerce-listing | AppShell, Stack, Row, Grid, Button, Card, Input, Label, Checkbox, Separator, Badge, Select, MediaSurface | ✅ |
| music-app | AppShell, Stack, Row, Button, Card, Separator, Input, MediaSurface, Avatar | ✅ |
| saas-user-editor | AppShell, Stack, Row, Button, Card, Input, Label, Textarea, Switch, Separator, Badge, Avatar, Select | ✅ |
| tv-streaming | AppShell, Stack, Row, Button, Card, MediaSurface, Avatar, Badge | ✅ |

## App layout skeletons (Figma `Layouts` page)

Empty starter frames — full 1440×900 — based on AppShell's `nav` variants. Use as the first step when starting a new screen: duplicate, rename, then drop your composition into the dashed `<AppShellMain>` slot. They're not components (no shared master) — they're launchpads.

| Skeleton | AppShell `nav` | Includes |
|---|---|---|
| skeleton-blank | none | bare AppShellMain slot |
| skeleton-top-nav | top | TopMenu + Main |
| skeleton-side-nav | side | Sidebar + Main |
| skeleton-top+side | top+side | Sidebar + TopMenu + Main |

## Figma-side conventions (recorded so they don't drift)

- **Variables:** `Primitives` collection (color ramps), `Semantic` collection (4 modes: Calm Light · Calm Dark · Energy Light · Energy Dark), `Scale` collection (spacing/radius/duration). Effect styles for shadows.
- **Text styles:** `display`, `h1–h6`, `body/lg|md|sm`, `label/lg|md`, `caption`, `overline`, `code`. All Geist / Geist Mono.
- **Component instance contract:** every "atomic UI element" in a layout must be an instance of a master in the Components / Wave 1–3 pages — no inline `figma.createFrame` for buttons, badges, avatars, etc. Compositional structure (Stack/Row/Grid wrapping) stays as autolayout.
- **Icon strategy:** Lucide Figma community library should be imported as a team library. Until then, layouts use unicode glyphs in text nodes (clearly placeholders, not pretending to be components).
