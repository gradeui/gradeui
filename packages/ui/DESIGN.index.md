<!-- GENERATED — pnpm -F @gradeui/ui generate:design -->
# Grade component index

A cheap scan of all 80 components. Read the foundations + this
index first; then pull only the sidecars you need from `components/ui/<name>.md`
(or the full `@gradeui/ui/DESIGN.md`). Foundations: themes, color-scopes, expressive, typography, spacing-layout.

| component | when to use |
| --- | --- |
| `Accordion` | Long-form content that would overwhelm if shown all at once — FAQs, settings groups, "what's included" sections, nested help. |
| `AIChatComposer` | The reusable "input card" for any chat surface — auto-growing textarea, image attachments via paperclip and clipboard paste, attachment chips with previews, Sen |
| `AIChat` | A flexible chat block — header + scrollable message list + composer. |
| `AppShell` | | |
| `Avatar` | User/entity identity for PEOPLE — profile pictures, author rows, member lists, account headers. |
| `BackgroundFill` | The background *paint* of a frame — a generative shader, image, video, gradient, repeating texture, or solid token rendered as a layer BEHIND the frame's conten |
| `Badge` | Compact status chips, counts, tags, pills. |
| `Banner` | A full-width horizontal strip surfacing system-level state, announcements, or first-run guidance — "you're previewing a draft", "investigating incident", "new f |
| `Breadcrumb` | Reach for Breadcrumb whenever a screen sits inside a hierarchy and you want the path back to the top to be visible. |
| `Button` | Any clickable action. |
| `Calendar` | An inline date grid — date-of-birth pickers in profile forms, scheduling screens with a month view, range selection in reporting filters. |
| `Callout` | Inline, ambient, non-blocking status/feedback that sits inside the layout flow. |
| `Card` | Grouped content with a distinct surface — settings panels, dashboard tiles, list-of-cards layouts, marketing hero containers, AI suggestion overlays. |
| `Carousel` | Anywhere a horizontal stack of slides cycles automatically or on user input — marketing hero rotations, featured rails on a TV / streaming app, onboarding tours |
| `ChartContainer` | Reporting dashboards, single-purpose analytics cards (revenue, conversions, active users), or anywhere you'd otherwise hand-roll a Recharts setup. |
| `CheckboxCard` | Multi-select where each option is a whole selectable card (add-ons, feature toggles, opt-ins). |
| `Checkbox` | Binary on/off tied to a list (select multiple, agree to terms). |
| `Code` | Read-only code surface for marketing heroes, docs, changelog entries, AI-output displays. |
| `Collapsible` | A single show/hide reveal — "Show advanced settings" rows, expandable inline help, "More details" sections inside cards. |
| `ColorPicker` | The token-led single-select colour picker — the focused "pick one colour token" sibling of FillPicker's solid tab. |
| `Combobox` | A searchable picker with type-to-filter. |
| `Command` | A searchable list of actions or destinations — global ⌘K palettes, "jump to" inputs, account switchers with filter. |
| `Composer` | | |
| `DataView` | One dataset, drawn as a table, a list of cards, or a grid — without re-typing the TanStack boilerplate (sortable headers, flexRender, selection, view switch) on |
| `DatePicker` | Any date or date-range entry. |
| `Dialog` | Modal interruptions — confirmations, focused forms, detail views, AI suggestion sheets. |
| `DropdownMenu` | A small action menu attached to a trigger — overflow "…" buttons on cards, user-avatar menus in headers, "Insert" menus in editors. |
| `Field` | The form-field wrapper. |
| `FillPicker` | Grade's paint picker — the control for choosing a frame's background fill, modelled on Figma's fill popover. |
| `Flex` | The unopinionated flexbox primitive — reach for Flex when Stack, Row, or Grid don't quite fit. |
| `grade-loader` |  |
| `GradientEditor` | Edit a multi-stop CSS gradient with token-led stops. |
| `Grid` | 2D layouts where Stack (vertical) and Row (horizontal) don't fit — stat-card grids, feature tiles, pricing columns, photo grids. |
| `HoverCard` | Rich preview content surfaced on hover — user profile mini-cards on @-mentions, link previews, definition popups, layer-thumbnail peeks. |
| `InputGroup` | Compose an input with leading/trailing icons, text affixes, buttons, or a toolbar inside one bordered field. |
| `Input` | Any single-line text entry. |
| `Label` | Every Input / Textarea / Checkbox / Switch / RadioGroup. |
| `Logo` | ALWAYS use <Logo> wherever a screen carries a brand mark — |
| `Map` | Any layout that needs a real map — listings (real estate, Airbnb-style), fleet/logistics dashboards, store locators, anywhere a user picks a location from a vie |
| `MediaSurface` | The canonical media slot for ALL non-person imagery — album art, posters, hero images, landscape photos, video and 3D containers. |
| `Message` | | |
| `Motion` | A directed sequence of scenes on one persistent stage — the |
| `MultiSelect` | | |
| `Popover` | A floating panel anchored to a trigger that contains interactive content — date pickers, color pickers, filter pickers, "more info" panels, inline forms. |
| `Progress` | Determinate progress — file uploads, multi-step forms, quota meters. |
| `PropertyList` | Read-only display of the properties of a SINGLE item — detail panels, inspectors, "about this" cards, order/record summaries. |
| `RadioCard` | Single-select where each option is a whole selectable card (shipping options, plan picker, onboarding choices). |
| `RadioGroup` | A small set of mutually-exclusive options where the user needs to SEE all of them at once — pricing tiers (3-4 options), shipping speed, payment method radio ca |
| `Resizable` | A multi-pane layout where the user wants to drag the divider — Slack/Mail-style list+detail, IDE editor+terminal, side-by-side compare view. |
| `RivePlayer` | Rive runtime wrapped in the shared media surface. |
| `Row` | Horizontal composition — button groups, inline form rows, logo + nav rows, anything on one line. |
| `ScreenAnimator` | Wrap ANY screen or section in a directed camera — a "live demo |
| `ScrollArea` | Bounded content that needs custom scroll chrome — sidebars with long item lists, chat transcripts, table panels inside a dashboard, anywhere the OS scrollbar wo |
| `SectionBlock` | The top-level container for a marketing page section — hero, feature row, pricing table, testimonial strip, FAQ section. |
| `Section` | THE page scaffold. |
| `Select` | Single-choice from 3+ known options. |
| `SelectionCard` | A selectable option where the WHOLE card is the control — plan pickers, shipping/payment options, onboarding choices, settings toggles. |
| `Separator` | Light divider between sibling blocks in a Card, list, or header. |
| `ShaderControls` | Render a `ControlSpec[]` schema into a DS-native control panel — the single renderer behind shader params, the post-processing stack, and any effect layer (they |
| `ShaderPresetPicker` | Runtime gallery of shader presets — click to select. |
| `ShaderPresetPreview` | Thumbnail-sized preview card for a shader preset. |
| `Sheet` | A panel that slides in from a screen edge — mobile nav drawers, side panels for editing a single record without leaving the list, filter trays on small viewport |
| `Sidebar` | Vertical app navigation. |
| `Skeleton` | Loading placeholder for content whose shape you know. |
| `Slider` | A continuous-ish numeric pick — volume, opacity, font size, price-range filters. |
| `Sortable` | Drag-to-reorder lists, kanban-column reordering, sortable shelves, tab strips the user can rearrange. |
| `Stack` | Default top-level layout inside the main slot when composing two or more stacked regions (hero + content + footer, auth card + subtext, etc.). |
| `Swatch` | Showing a colour as a small chip — brand-pop strips, palette / accent pickers, theme previews, token galleries, "pick a colour" rows. |
| `SwitchCard` | A prominent on/off setting presented as a whole selectable card. |
| `Switch` | Instant on/off setting ("Enable notifications", "Dark mode"). |
| `Table` | Structured tabular data — rows × columns with alignment requirements. |
| `Tabs` | A small set of peer views within one surface (2–5 tabs). |
| `Textarea` | Multi-line text entry (descriptions, messages, comments). |
| `ThreeScene` | WebGL primitive for shader backgrounds, generative visuals, and bespoke three.js scenes. |
| `Toaster` | Transient, non-blocking feedback that confirms or warns about an action — "Saved", "Failed to upload", "Copied to clipboard", "Invitation sent". |
| `ToggleGroup` | A small set of mutually-exclusive (`type="single"`) or independent (`type="multiple"`) binary options that live side-by-side as a segmented control — viewport s |
| `Toggle` | A standalone on/off button — Bold/Italic in a toolbar, "Show grid" in a header, single binary toggle that doesn't belong inside a Switch row. |
| `Toolbar` | | |
| `Tooltip` | A short, non-essential label that explains a control on hover/focus — icon-only buttons in toolbars, abbreviated column headers, status dots. |
| `VideoPlayer` | HTML5 video wrapped in the shared media surface. |
