BrightLocal DS workarounds — things the package gets wrong that change what you must EMIT. Follow them; don't fight them. (Diagnosis, evidence and the upstream asks live in registries/brightlocal/DS-AUDIT.md, which does NOT ride this prompt. Add new findings there; add a line here only when it changes emitted output.)

- Card bakes `max-w-[400px]` into its BASE classes. Add className="max-w-none" to any card meant to span more than 400px (plus w-full where it must stretch). Never use the deprecated maxWidth prop.
- Card's default border is invisible (`--card-border` is transparent). Where a card needs a visible edge, paint `border-color: var(--border)`.
- Badge has NO success/warning/info variants. For a status badge, the ONE sanctioned className exception is `border-transparent bg-success-background text-success-foreground`. Do not restyle Badge any other way.
- Chip ALWAYS renders a remove ✕ and is an INPUT control (filters, selected values). For read-only status/plan/delta labels use Badge (primary | secondary | destructive | outline).
- Inside a sidebar use `SidebarSeparator`, never the generic `Separator` (that one paints the page border token and reads harsh). Override its baked rhythm with className="my-2".
- Sidebar nav labels must never truncate (data values like business names may). The DS hardcodes truncation, so pass `[&>span:last-of-type]:whitespace-normal!` plus h-auto/min-h rows, and override `pr-10` on nested sub-lists.
- `SidebarContent` only adds `pr-2` once its nav overflows, so the nav jumps 8px when it becomes scrollable. Pass `pr-2` permanently via className (cn dedupes).
- Never set `--sidebar-width` from `:root` or via classes — it is set inline by SidebarProvider and patched in the project's custom.css.
- Theming the sidebar area means painting the container (AppLayoutShell's `sidebarTone`); the `--sidebar-background` token does nothing on desktop.
- GlobalLayout's padding is stripped by the project's custom.css. When a screen uses GlobalLayoutSidebar's sticky geometry, reset it per-screen with style={{ top: 0, height: "100dvh" }} (its style prop merges, user wins).
- Sidebar icons are 20px `size-5`. Keep the ABSOLUTE icon stroke at ~1.33px across sizes (24px at strokeWidth 1.33, 14px meta icons at 2.28).
- `dataHook` names the INSTANCE ("settings-save-button"), not the component.
- Use `SidebarAccountDropdown` exactly as published — do not fake the live platform's bordered avatar card with utility classes. Mount SidebarTrigger + the built-in mobile sheet for the responsive shell; never hand-roll a drawer.
- There is no Bing mark in `@brightlocal/icons`. Use lucide `Globe` in neutral grey for a Bing Places row.
- For a drill-down affordance on a clickable card, use `DrillArrow` (variant "solid" | "glass") from the proposal lib. Do not hand-roll the circular arrow Button.
- RankGrid derives pin size from zoom and clamps to min/max zoom bounds so pins never overlap. Keep that contract.
