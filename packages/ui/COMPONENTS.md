# gradeui — Component Inventory

Single source of truth for every `@gradeui/ui` component and its Figma library status. Update this file whenever a component lands or its API changes — it's read by tooling and humans (designers, future Claude sessions) to avoid drift between code and Figma.

**Figma status legend:** ✅ built · ⚠️ partial · ⏳ pending · ❌ not in Figma (intentionally) · 🔁 deferred

## Layout primitives

| Component | File | Key props | Figma | Notes |
|---|---|---|---|---|
| Stack | `stack.tsx` | `gap` (none/xs/sm/md/lg/xl/2xl), `align` (start/center/end/stretch) | ✅ | Vertical autolayout in Figma |
| Row | `row.tsx` | `gap`, `align`, `justify`, `wrap` | ✅ | Horizontal autolayout |
| Grid | `grid.tsx` | `cols` (1/2/3/4/5/6/12), `gap`, `align` | ✅ | Responsive ladder per `cols` value |
| Flex | `flex.tsx` | `direction`, `gap`, `align`, `justify`, `wrap` | ✅ | Escape hatch — CSS-aligned defaults |
| AppShell + Header/Nav/Aside/Main/Footer | `app-shell.tsx` | `nav` (none/top/side/three-pane), `maxWidth`, `sticky` | ✅ | 5-slot CSS-grid template-areas layout. `nav="three-pane"` adds an `Aside` column with width via `--rds-app-shell-aside` (default 320px). Header + Footer span full width — covers marketing pages too. |
| ResizablePanelGroup / ResizablePanel / ResizableHandle | `resizable.tsx` | direction h/v · withHandle · id (persists layout) | ⏳ | Port of shadcn resizable on `react-resizable-panels`. Use for user-adjustable columns; for static fixed-width middle, prefer `AppShell nav="three-pane"`. |

## Form primitives

| Component | File | Key props | Figma | Notes |
|---|---|---|---|---|
| Button | `button.tsx` | `variant` (default/secondary/destructive/outline/ghost/link), `size` (default/sm/lg/icon) | ✅ | 6 × 4 = 24 variants |
| Input | `input.tsx` | type, plus `with-icon-left` Figma-only variant | ⚠️ | Figma adds icon-left layout; source has none |
| Textarea | `textarea.tsx` | min-h-80, no formal variants | ✅ | State variants in Figma |
| Label | `label.tsx` | none — text-sm/medium/leading-none | ✅ | |
| Checkbox | `checkbox.tsx` | none formally; checked/indeterminate states | ✅ | |
| RadioGroup / RadioGroupItem | `radio-group.tsx` | container `grid gap-2` | ✅ | vertical + horizontal orientation variants |
| Switch | `switch.tsx` | none — w-11 h-6 thumb-translate | ✅ | |
| Slider | `slider.tsx` | none — track h-2 thumb 20×20 | ✅ | |
| Toggle | `toggle.tsx` | `variant` (default/outline), `size` (default/sm/lg) | ⚠️ | Figma covers default size only |
| ToggleGroup / ToggleGroupItem | `toggle-group.tsx` | inherits Toggle variants | ✅ | type=single/multiple |
| Toolbar / ToolbarSlot | `toolbar.tsx` | `position` (top/bottom/inline), `variant` (default/subtle/transparent), `size` (sm/md/lg), `sticky` | — | Slot-based: `leading` / `center` / `trailing` props. Apple HIG "Toolbar". Reach for instead of `Row justify="between"` + manual flex-1 middle. Use inside AppShellHeader for window chrome; standalone for section / bottom action toolbars. |

## Surfaces & feedback

| Component | File | Key props | Figma | Notes |
|---|---|---|---|---|
| Card + CardHeader/Title/Description/Content/Footer | `card.tsx` | none — bg-card text-card-foreground | ✅ | |
| Callout | `callout.tsx` | `variant` (default/destructive/success/warning/info) | ✅ | Renamed from Alert (May 2026); `highlight` variant dropped. ARIA role conditional: `status` (polite) for info/success/default, `alert` (assertive) for warning/destructive. Soft-bg + deep-text. |
| Badge | `badge.tsx` | 17 variants — solid/soft/outline × status colours | ✅ | |
| Skeleton | `skeleton.tsx` | none — animate-pulse rounded-md bg-muted | ✅ | 4 shape variants in Figma |
| Progress | `progress.tsx` | none — track bg-secondary, fill bg-primary | ✅ | 4 fill values in Figma |
| Separator | `separator.tsx` | `orientation` (horizontal/vertical), `decorative` | ✅ | |
| Sonner | `sonner.tsx` | toast surface, success/error/info kinds | ✅ | default/success/error/warning/info |

## Overlays & menus

| Component | File | Key props | Figma | Notes |
|---|---|---|---|---|
| Dialog (+ Header/Content/Footer/Title/Description/Close) | `dialog.tsx` | none formally | ✅ | Built with overlay frame |
| Sheet | `sheet.tsx` | `side` (top/right/bottom/left) | ✅ | 4 sides, on overlay |
| Popover | `popover.tsx` | none — w-72 shadow-md | ✅ | |
| Tooltip | `tooltip.tsx` | none — bg-primary px-3 py-1.5 | ✅ | 4 sides in Figma |
| HoverCard | `hover-card.tsx` | none — w-64 shadow-md | ✅ | |
| DropdownMenu (+ Item/CheckboxItem/RadioItem/Separator/Label) | `dropdown-menu.tsx` | none formally | ✅ | |
| Select (+ Trigger/Content/Item/Value) | `select.tsx` | none formally | ✅ | placeholder/filled/open in Figma |
| MultiSelect | `multi-select.tsx` | `options`, `value`/`defaultValue`, `onValueChange`, `placeholder`, `maxCount` (badges before "+N more"), `searchable`, `badgeDismissible`, `modalPopover` | ⏳ | Composes Popover + Command + Badge. Data-driven via `options`; selected items render as removable Badges in the trigger with maxCount overflow. Select-all / Clear / Close actions in dropdown footer. For unbounded/async lists use `Command` directly. |
| Command (+ Input/Item/Group) | `command.tsx` | none — bg-popover | ✅ | |

## Navigation

| Component | File | Key props | Figma | Notes |
|---|---|---|---|---|
| TopMenu | `top-menu.tsx` | breadcrumbs, leftContent, rightContent, sticky | ✅ | |
| Sidebar (+ Header/Content/Footer/Section/Item) | `sidebar.tsx` | `collapsed`/`defaultCollapsed`/`onCollapsedChange`, `collapsible` · Header / Content / Footer slots · Section: `title`/`icon`/`collapsible`/`defaultExpanded` · Item: `icon`/`badge`/`active`/`asChild`/`asButton`/`disabled`/`collapsedLabel` · `href` on Item | ✅ | Renamed from SideMenu (May 2026) and rebuilt as a compound API so consumers can slot custom chrome (search, drag handles, custom brand) alongside nav. Sized via `--rds-sidebar-*` CSS vars. Auto-wraps collapsed items in Tooltips. |
| Tabs (+ List/Trigger/Content) | `tabs.tsx` | `variant` (pill/underlined), `size` (sm/md/lg) | ✅ | Pill = shadcn chip style (default). Underlined = minimal text + bottom-border (formerly SimpleTabs, merged May 2026). |

## Content & data

| Component | File | Key props | Figma | Notes |
|---|---|---|---|---|
| Table (+ Header/Body/Row/Head/Cell/Caption) | `table.tsx` | none — text-sm hover:bg-muted/50 | ✅ | |
| Accordion (+ Item/Trigger/Content) | `accordion.tsx` | none — chevron rotates 180° on open | ✅ | |
| Collapsible (+ Trigger/Content) | `collapsible.tsx` | pure Radix passthrough | ✅ | |
| ScrollArea + ScrollBar | `scroll-area.tsx` | `orientation` for ScrollBar | ✅ | |
| Calendar | `calendar.tsx` | day-grid w/ data-state-* attrs | ✅ | single + range modes |
| DatePicker / DateRangePicker | `date-picker.tsx` | composes Button + Popover + Calendar | ✅ | closed + open states |
| Avatar (+ Image/Fallback) | `avatar.tsx` | h-10 w-10 default; sizes via className | ✅ | sm/md/lg/xl in Figma (Figma-side convention) |

## Composition blocks (higher-order)

| Component | File | Key props | Figma | Notes |
|---|---|---|---|---|
| SectionBlock | `section-block.tsx` | `padding`, `background` (transparent/muted/card/primary/gradient), `container` | ✅ | 5 background variants |
| CardBlock | `card-block.tsx` | `layout` (single/carousel/grid/bento/sideBySide), `columns` | ✅ | grid/sideBySide/bento built |
| MediaBlock | `media-block.tsx` | `layout` (single/carousel/grid/bento/sideBySide) | ✅ | single/grid/sideBySide/bento built |
| MediaSurface | `media-surface.tsx` | `aspect` (square/video/portrait/wide) | ✅ | gradient placeholder fill |
| FaqBlock | `faq-block.tsx` | composed Accordion section | ⏳ | |
| Carousel (+ Slide / VideoSlide / Dots / Arrows / Prev / Next) | `carousel.tsx` | `loop`, `align`, `slidesPerView`, `autoplay`, `draggable`, `onSlideChange` · per-slide `duration` · VideoSlide `src`/`poster`/`alt`/`loop`/`controls`/`fit` | ⏳ | Embla-backed. Custom autoplay loop (no plugin) so per-slide duration + advance-on-video-ended fall out cleanly. Token-driven via `--rds-carousel-*` vars. Disambiguates from `<Slider>` (range input) at the sidecar level. |

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
| Chart | `chart.tsx` | recharts wrapper | 🔁 | deferred |

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
