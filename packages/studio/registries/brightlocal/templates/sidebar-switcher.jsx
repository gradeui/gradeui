// Sidebar Switcher — App shell with an account switcher (SidebarSwitcher) at the top and per-section collapsible submenus.
//
// Sidebar proposal (July 2026): SidebarSwitcher in the header driving a
// SidebarPopoverMenu of accounts, and each nav section rendered as a
// SidebarMenuCollapsible whose bordered submenu expands for the selected
// section. Composed the way blocks-sidebar--default and
// blocks-sidebar-sidebarmenusubbutton--default do it: DS compounds only,
// no hand-rolled nav. Hand-authored — safe from harvest re-runs (those
// only rewrite blocks/ and sidecar bodies). Edit freely; re-run
// `node scripts/generate-registry-templates.mjs`.

import {
  Avatar,
  AvatarFallback,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Card,
  CardContent,
  Chip,
  GlobalLayout,
  GlobalLayoutContent,
  GlobalLayoutContentBody,
  GlobalLayoutContentHeader,
  GlobalLayoutSidebar,
  Logo,
  Sidebar,
  SidebarAccountDropdown,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuCollapsible,
  SidebarMenuCollapsibleContent,
  SidebarMenuCollapsibleTrigger,
  SidebarMenuItem,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuSubVariant,
  SidebarPopoverMenu,
  SidebarProvider,
  SidebarSeparator,
  SidebarSwitcher,
  SidebarTrigger,
  TypographyH2,
} from "@brightlocal/ui-components";
import {
  BarChart3,
  Briefcase,
  Building,
  Globe,
  Grid3x3,
  House,
  Link,
  ListChecks,
  Menu,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  TrendingUp,
} from "@brightlocal/icons";
 
// ─── Accounts for the switcher popover ─────────────────────────────
// No shortcuts, no add-action: this is an account switcher, not a
// command menu.
const ACCOUNTS = [
  { label: "Acme Local Agency", icon: <Building className="size-4" /> },
  { label: "Harbour & Co", icon: <Building className="size-4" /> },
  { label: "Northside Dental Group", icon: <Building className="size-4" /> },
];

// ─── Nav model — the new IA (July 2026). Three levels: section →
// item → leaf. `paid` marks add-ons in the IA data (not rendered —
// the '$' marker was spreadsheet notation, not UI); `active` opens the
// trail; `goto: "<screen name>"` links a row to another screen
// (STUDIO-FLOWS — the flow lives in this data, not in markup).
const SECTIONS = [
  {
    id: "ai-insights",
    label: "AI Insights",
    icon: Sparkles,
    sub: [
      { id: "ai-website-content", label: "Website and Content" },
      { id: "ai-gbp", label: "Google Business Profile" },
      { id: "ai-reviews", label: "Reviews" },
      { id: "ai-citations", label: "Citations" },
      { id: "ai-export", label: "Export Report" },
    ],
  },
  { id: "setup-tasks", label: "Set-up Tasks", icon: ListChecks },
  {
    id: "location-profile",
    label: "Location Profile",
    icon: Building,
    sub: [
      { id: "lp-connect", label: "Connect to Listing Platforms" },
      {
        id: "lp-core",
        label: "Core Information",
        sub: [
          { id: "lp-general", label: "General Settings" },
          { id: "lp-business", label: "Business Details" },
          { id: "lp-gbt", label: "Google Business Tracking" },
          { id: "lp-categories", label: "Categories" },
          { id: "lp-hours", label: "Opening Hours" },
          { id: "lp-about", label: "About the Business" },
          { id: "lp-additional", label: "Additional Data" },
          { id: "lp-images", label: "Image Management" },
          { id: "lp-cb-data", label: "Citation Builder Data" },
          { id: "lp-alerts", label: "Email Alerts" },
        ],
      },
    ],
  },
  {
    id: "rankings",
    label: "Rankings",
    icon: TrendingUp,
    active: true,
    sub: [
      { id: "rk-positions", label: "Positions" },
      { id: "rk-table", label: "Rankings Table", active: true },
      { id: "rk-keywords", label: "Keyword Groups" },
      { id: "rk-competitors", label: "Chosen Competitors" },
      {
        id: "rk-settings",
        label: "Settings",
        sub: [
          { id: "rk-general", label: "General Settings" },
          { id: "rk-search", label: "Search Settings" },
          { id: "rk-advanced", label: "Advanced Settings" },
          { id: "rk-alerts", label: "Email Alerts" },
        ],
      },
    ],
  },
  {
    id: "local-search-grid",
    label: "Local Search Grid",
    icon: Grid3x3,
    sub: [
      { id: "lsg-kw1", label: "Keyword phrase #1" },
      { id: "lsg-kw2", label: "Keyword phrase #2" },
      { id: "lsg-kw3", label: "Keyword phrase #3" },
      { id: "lsg-kw4", label: "Keyword phrase #4" },
      { id: "lsg-kw5", label: "Keyword phrase #5" },
      { id: "lsg-add", label: "Add more keywords", paid: true },
      { id: "lsg-settings", label: "Settings" },
    ],
  },
  {
    id: "citations",
    label: "Citations",
    icon: Link,
    sub: [
      { id: "cit-live", label: "Live Citations" },
      { id: "cit-pending", label: "Pending Citations" },
      { id: "cit-competitor", label: "Competitor Citations" },
      { id: "cit-builder", label: "Citation Builder", paid: true },
    ],
  },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "gbp-manager", label: "GBP Manager", icon: Store },
  { id: "website-seo", label: "Website SEO", icon: Globe },
  { id: "google-analytics", label: "Google Analytics", icon: BarChart3 },
  { id: "agency-tools", label: "Agency Tools", icon: Briefcase },
];

// ─── AppLayoutShell (in-file layout component — see recipes/app-layout-shell.jsx) ───
// Cancels GlobalLayout's baked-in p-section-sm + viewport p-1 (string
// literals in the dist, not prop-overridable — rules/90-audit.md) and
// exposes the layout explorations as props.
// NOTE the --color-* doubles: the theme maps --color-sidebar-* from
// --sidebar-* AT :ROOT, and var() inside a custom property resolves
// where the property is DEFINED — so a mid-tree --sidebar-background
// override never reaches utilities compiled to
// var(--color-sidebar-background). Override BOTH prefixes; the
// --color-* ones are what the compiled utilities actually read.
function sidebarTone(bg, fg, accent, accentFg, border) {
  return {
    // Paint the background DIRECTLY: the desktop Sidebar never sets a
    // background (bg-sidebar-background exists only in its mobile Sheet
    // branch — verified against the 2.20.0 dist), so re-pointing the
    // token alone recolors nothing. The container paints it instead.
    backgroundColor: bg,
    // Foreground still cascades via `color` inheritance, and the
    // token doubles below drive the accent/hover/active utilities.
    color: fg,
    "--sidebar-background": bg,
    "--color-sidebar-background": bg,
    "--sidebar-foreground": fg,
    "--color-sidebar-foreground": fg,
    "--sidebar-accent": accent,
    "--color-sidebar-accent": accent,
    "--sidebar-accent-foreground": accentFg,
    "--color-sidebar-accent-foreground": accentFg,
    "--sidebar-border": border,
    "--color-sidebar-border": border,
  };
}

// Theme-aware pair: resolves via CSS light-dark(), which follows
// color-scheme — the shell wires color-scheme to the .dark class
// (schemeCss below), so every preset flips with Studio's mode toggle.
// Without this the presets pinned LIGHT ramp steps and dark mode had
// nothing left to flip (the semantic .dark overrides were bypassed).
const ld = (light, dark) => `light-dark(${light}, ${dark})`;

const SIDEBAR_TONES = {
  default: {},
  // Pure white panel — pairs with pageLayers "raised" (white nav +
  // white cards on the green-grey canvas) and the flush frame's
  // default border.
  white: sidebarTone(
    ld("var(--ds-tailwind-colors-base-white)", "var(--ds-tailwind-colors-neutral-900)"),
    ld("var(--ds-tailwind-colors-neutral-600)", "var(--ds-tailwind-colors-neutral-300)"),
    ld("var(--ds-tailwind-colors-neutral-100)", "var(--ds-tailwind-colors-neutral-800)"),
    ld("var(--ds-tailwind-colors-neutral-900)", "var(--ds-tailwind-colors-neutral-50)"),
    ld("var(--ds-colors-sidebar-border-light)", "var(--ds-colors-sidebar-border-dark)"),
  ),
  // The grey/green light version: BL's neutral ramp IS green-tinted
  // (#f2f7f3 etc.), so neutral-100 on the neutral-50 page reads as a
  // subtle brand-adjacent panel rather than plain grey.
  subtle: sidebarTone(
    ld("var(--ds-tailwind-colors-neutral-100)", "var(--ds-tailwind-colors-neutral-950)"),
    ld("var(--ds-tailwind-colors-neutral-600)", "var(--ds-tailwind-colors-neutral-300)"),
    ld("var(--ds-tailwind-colors-neutral-200)", "var(--ds-tailwind-colors-neutral-800)"),
    ld("var(--ds-tailwind-colors-neutral-900)", "var(--ds-tailwind-colors-neutral-50)"),
    ld("var(--ds-colors-sidebar-border-light)", "var(--ds-colors-sidebar-border-dark)"),
  ),
  dark: sidebarTone(
    "var(--ds-tailwind-colors-neutral-900)",
    "var(--ds-tailwind-colors-neutral-200)",
    "var(--ds-tailwind-colors-neutral-800)",
    "var(--ds-tailwind-colors-neutral-50)",
    "var(--ds-colors-sidebar-border-dark)",
  ),
  brand: sidebarTone(
    "var(--ds-tailwind-colors-green-950)",
    "var(--ds-tailwind-colors-green-200)",
    "var(--ds-tailwind-colors-green-900)",
    "var(--ds-tailwind-colors-green-100)",
    "var(--ds-colors-sidebar-border-dark)",
  ),
};

// Frame presets — how the sidebar sits against the screen edge.
// "flush" = hard against it; "floating" = lifted off it a little
// (margin + rounded corners). Values live HERE as presets, not as
// free-text instance props — tweak the preset, every screen follows.
const SIDEBAR_FRAMES = {
  // `classes` = the Tailwind for the preset; `margin` also feeds the
  // pinned top/height, which MUST stay inline style — the DS sets those
  // inline on the aside, and classes can't beat inline styles.
  flush: { margin: 0, classes: "" },
  // shadow-sm lifts the panel off a near-white canvas — with the
  // 50-step tint, the border alone doesn't carry the elevation.
  floating: { margin: 12, classes: "m-3 overflow-hidden rounded-2xl shadow-sm" },
};

// Sidebar shadow presets — Tailwind's scale, switchable independently
// of the frame. "frame" = whatever the frame preset ships (floating's
// shadow-sm); anything else replaces it.
const SIDEBAR_SHADOWS = {
  frame: null,
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};

// Page layer presets — the page-side counterpart of SIDEBAR_TONES:
// re-point the PAGE tokens (canvas + card surface) on the layout root.
// "raised": canvas on the subtlest green-grey (BL's neutral ramp is
// green-tinted), cards lift to WHITE. Both var prefixes for the same
// reason as the sidebar tones (utilities read --color-*; :root
// indirections resolve where DEFINED). backgroundColor paints the
// canvas directly — the body backdrop is set at :root and won't
// follow a mid-tree var swap.
const PAGE_LAYERS = {
  default: {},
  // Canvas at neutral-50 (#fcfdfc — the faintest tint; neutral-100
  // read too strong), cards pure white, muted UP to neutral-100 so
  // filled surfaces sit between card and canvas.
  raised: {
    backgroundColor: ld("var(--ds-tailwind-colors-neutral-50)", "var(--ds-tailwind-colors-neutral-950)"),
    "--background": ld("var(--ds-tailwind-colors-neutral-50)", "var(--ds-tailwind-colors-neutral-950)"),
    "--color-background": ld("var(--ds-tailwind-colors-neutral-50)", "var(--ds-tailwind-colors-neutral-950)"),
    "--card": ld("var(--ds-tailwind-colors-base-white)", "var(--ds-tailwind-colors-neutral-900)"),
    "--color-card": ld("var(--ds-tailwind-colors-base-white)", "var(--ds-tailwind-colors-neutral-900)"),
    "--muted": ld("var(--ds-tailwind-colors-neutral-100)", "var(--ds-tailwind-colors-neutral-800)"),
    "--color-muted": ld("var(--ds-tailwind-colors-neutral-100)", "var(--ds-tailwind-colors-neutral-800)"),
  },
};


// ─── ShellTweaker — hidden, session-local demo controls ─────────────
// Stakeholder-demo layer: reveals in the bottom-right corner (hover the
// corner, or Alt+T) and OVERRIDES the shell's look knobs at runtime.
// Two layers, two owners: literal props on <AppLayoutShell> are the
// AUTHORED decision (the inspector edits those, they persist in the
// screen source); tweaks live in component state — a viewer on a share
// link can play freely and reload always returns to the authored look.
// Chips mark overridden knobs; Reset drops back to authored. Plain
// elements on purpose — this is prototype chrome, not proposal UI.
function ShellTweakerPanel({ authored, tweaks, setTweaks }) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.altKey && (e.code === "KeyT" || e.key === "t" || e.key === "T")) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const ROWS = [
    { key: "sidebarTone", label: "Sidebar tone", values: ["default", "white", "subtle", "dark", "brand"] },
    { key: "sidebarFrame", label: "Frame", values: ["flush", "floating"] },
    { key: "sidebarShadow", label: "Shadow", values: ["frame", "none", "sm", "md", "lg"] },
    { key: "pageLayers", label: "Page layers", values: ["default", "raised"] },
    { key: "stickyHeader", label: "Sticky header", values: [true, false] },
  ];
  const live = { ...authored, ...tweaks };
  const dirty = Object.keys(tweaks).length > 0;
  const set = (key, v) =>
    setTweaks((prev) => {
      const next = { ...prev };
      if (v === authored[key]) delete next[key];
      else next[key] = v;
      return next;
    });
  return (
    <div className="group fixed right-0 bottom-0 z-50 p-3" data-slot="shell-tweaker">
      {open ? (
        <div className="w-64 rounded-xl border border-[light-dark(var(--ds-tailwind-colors-neutral-100),var(--ds-tailwind-colors-neutral-800))] bg-[light-dark(var(--ds-tailwind-colors-base-white),var(--ds-tailwind-colors-neutral-900))] p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold">Shell tweaks</span>
            <span className="flex items-center gap-2">
              {dirty ? (
                <button
                  onClick={() => setTweaks({})}
                  className="text-muted-foreground text-[11px] underline underline-offset-2"
                >
                  Reset
                </button>
              ) : null}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close shell tweaks"
                className="text-muted-foreground text-sm leading-none"
              >
                {"\u00d7"}
              </button>
            </span>
          </div>
          {ROWS.map((row) => (
            <div key={row.key} className="mb-2 last:mb-0">
              <div className="text-muted-foreground mb-1 flex items-center justify-between text-[11px]">
                <span>{row.label}</span>
                {tweaks[row.key] !== undefined ? <span>tweaked</span> : null}
              </div>
              <div className="flex flex-wrap gap-1">
                {row.values.map((v) => (
                  <button
                    key={String(v)}
                    onClick={() => set(row.key, v)}
                    className={
                      live[row.key] === v
                        ? "rounded-full bg-[light-dark(var(--ds-tailwind-colors-neutral-900),var(--ds-tailwind-colors-neutral-50))] px-2 py-0.5 text-[11px] text-[light-dark(white,var(--ds-tailwind-colors-neutral-900))]"
                        : "rounded-full bg-[light-dark(var(--ds-tailwind-colors-neutral-50),var(--ds-tailwind-colors-neutral-800))] px-2 py-0.5 text-[11px] text-[light-dark(var(--ds-tailwind-colors-neutral-600),var(--ds-tailwind-colors-neutral-300))]"
                    }
                  >
                    {v === true ? "on" : v === false ? "off" : v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open shell tweaks (Alt+T)"
          className="flex size-9 items-center justify-center rounded-full border border-[light-dark(var(--ds-tailwind-colors-neutral-100),var(--ds-tailwind-colors-neutral-800))] bg-[light-dark(var(--ds-tailwind-colors-base-white),var(--ds-tailwind-colors-neutral-900))] opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100"
        >
          <SlidersHorizontal className="size-4" />
        </button>
      )}
    </div>
  );
}

function AppLayoutShell({
  flush = true,
  stickyHeader = false,
  pinnedSidebar = true,
  sidebarTone = "white",
  // Carry the tone onto the MOBILE Sheet too. The Sheet portals to
  // document.body — outside this tree — so container-level vars can't
  // reach it; a scoped <style> targeting its data-sidebar/data-mobile
  // marks does. Toggle off to keep mobile in the default light tone.
  mobileTone = true,
  // Content column cap. The DS's GlobalLayoutContent self-caps at
  // breakpoint-lg and centres within the column, so pinning the
  // sidebar to the edge does NOT make content run full-bleed — this
  // knob just makes that cap adjustable ("1280px", "none", …).
  // NOTE: GlobalLayoutContentHeader hardcodes its own breakpoint-lg
  // max-width in the dist, so only the body follows a custom value.
  contentMaxWidth,
  // How the sidebar sits against the screen edge (desktop only — the
  // aside is hidden below lg). Presets in SIDEBAR_FRAMES above.
  sidebarFrame = "floating", // "flush" | "floating"
  // Sidebar drop shadow — overrides the frame's own. Presets in
  // SIDEBAR_SHADOWS. "frame" (default) defers to the frame preset.
  sidebarShadow = "frame", // "frame" | "none" | "sm" | "md" | "lg"
  // Optional 1px border around the sidebar container. Any CSS color —
  // tokens welcome: "var(--sidebar-border)", "var(--ds-tailwind-colors-neutral-200)".
  sidebarBorder,
  // Page-wide layer treatment — canvas + card surface. Presets in
  // PAGE_LAYERS above. "raised" = green-grey canvas, white cards.
  pageLayers = "raised", // "default" | "raised"
  sidebar,
  header,
  // Mobile top bar slot (hamburger + logo). Rendered FIRST inside the
  // content column so it sits ABOVE the page header below lg — passing
  // it via children put it underneath (July 2026 screenshot).
  mobileBar,
  children,
  className,
  // Render the hidden demo tweaker (corner hover / Alt+T). Turn off
  // for screens where prototype chrome must not exist at all.
  tweaker = true,
  dataHook = "app-layout",
}) {
  // ─── Tweaker override layer (see ShellTweakerPanel above): literal
  // props are the AUTHORED look; tweaks shadow them for this session
  // only. Reassigning the params keeps every downstream reference
  // (tone/frame/shadow/layers/sticky) reading the LIVE values.
  const authored = { sidebarTone, sidebarFrame, sidebarShadow, pageLayers, stickyHeader };
  const [tweaks, setTweaks] = React.useState({});
  ({ sidebarTone, sidebarFrame, sidebarShadow, pageLayers, stickyHeader } = {
    ...authored,
    ...tweaks,
  });

  const flushClasses = flush
    ? // Zero the baked padding for the desktop flush layout, but put a
      // uniform p-4 BACK below lg — the sidebar is hidden there and the
      // content column was hugging the screen edges on tablet/mobile.
      "[&>[data-radix-scroll-area-viewport]]:p-0! [&_[data-slot=app-layout-shell]]:p-0! [&_[data-slot=app-layout-shell]]:max-lg:p-4!"
    : "";
  const frame = SIDEBAR_FRAMES[sidebarFrame] ?? SIDEBAR_FRAMES.flush;
  const shadowOverride = SIDEBAR_SHADOWS[sidebarShadow] ?? null;
  const frameClasses =
    shadowOverride === null
      ? frame.classes
      : [frame.classes.replace(/\bshadow-\w+\b/g, "").trim(), shadowOverride]
          .filter(Boolean)
          .join(" ");
  // Pinned/flush sidebars get a border BY DEFAULT — without a
  // containing edge the horizontal rules float on the page. Floating
  // frames have their own boundary (radius + lift). Explicit
  // sidebarBorder overrides; "transparent" opts out.
  const borderColor =
    sidebarBorder ??
    (sidebarFrame === "flush" ? "var(--sidebar-border)" : undefined);
  const tone = SIDEBAR_TONES[sidebarTone] ?? {};
  const layers = PAGE_LAYERS[pageLayers] ?? {};
  // Raised layers: cards are WHITE (the layer re-points --card) with
  // base/border (semantic --border → neutral-200 #E6EDE8, .dark flips
  // it) and NO shadow — matches their Figma, where card elevation is
  // border-only. NEEDED because the DS's own card-border token is
  // TRANSPARENT (filled cards ship borderless — rules/90-audit.md).
  // Shadows stay a SIDEBAR treatment (SIDEBAR_SHADOWS / the floating
  // frame). Scoped <style> because border-color can't ride the --card
  // token swap.
  const layerCss =
    pageLayers === "raised"
      ? `[data-slot="card"]{border-color:var(--border)}`
      : "";
  // color-scheme wiring for the ld() pairs above — .dark flips them.
  const schemeCss = ":root{color-scheme:light}.dark{color-scheme:dark}";
  const mobileToneCss =
    mobileTone && Object.keys(tone).length > 0
      ? `[data-sidebar="sidebar"][data-mobile="true"]{${Object.entries(tone)
          .map(([k, v]) => `${k === "backgroundColor" ? "background-color" : k}:${v}`)
          .join(";")}}`
      : "";
  return (
    <GlobalLayout
      dataHook={dataHook}
      // Selection stamp: GlobalLayout's inner div spreads rest props
      // AFTER its own data-slot, so this overrides "global-layout" and
      // the selection agent resolves clicks to AppLayoutShell.
      data-slot="app-layout-shell"
      className={[flushClasses, className].filter(Boolean).join(" ") || undefined}
      // Pinned = at the actual browser edge: the DS's global-container
      // centres the WHOLE app at max-width breakpoint-xl, guttering the
      // sidebar away from the edge on wide screens. maxWidth is a real
      // prop, so pinned mode disables it.
      maxWidth={pinnedSidebar && flush ? "none" : undefined}
      // Layer vars + canvas paint land on GlobalLayout's inner div via
      // its rest-spread; every bg-background / bg-card / bg-muted
      // inside resolves against them.
      style={layers}
    >
      <style>{schemeCss + mobileToneCss + layerCss}</style>
      {tweaker ? (
        <ShellTweakerPanel authored={authored} tweaks={tweaks} setTweaks={setTweaks} />
      ) : null}
      <GlobalLayoutSidebar
        dataHook={`${dataHook}-sidebar`}
        // Tailwind for everything static (py-4 breathing room, frame
        // preset classes, border width). Inline style only where it
        // must be: pinned top/height override the DS's OWN inline
        // values, and tone/border-color are dynamic.
        className={[
          "pt-4",
          frameClasses,
          borderColor ? (sidebarFrame === "flush" ? "border-r" : "border") : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          ...(pinnedSidebar && flush
            ? {
                top: frame.margin,
                height: `calc(100dvh - ${2 * frame.margin}px)`,
              }
            : {}),
          ...(borderColor ? { borderColor } : {}),
          ...tone,
        }}
      >
        {sidebar}
      </GlobalLayoutSidebar>
      <GlobalLayoutContent
        dataHook={`${dataHook}-content`}
        maxWidth={contentMaxWidth}
      >
        {mobileBar}
        {header ? (
          <GlobalLayoutContentHeader
            dataHook={`${dataHook}-header`}
            // The header owns its padding — it must render identically
            // sticky or not; stickiness only adds surface + border +
            // pinning.
            className={[
              "pt-6 pb-4",
              stickyHeader
                ? "bg-background sticky top-0 z-10 border-b"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {header}
          </GlobalLayoutContentHeader>
        ) : null}
        {children}
      </GlobalLayoutContent>
    </GlobalLayout>
  );
}


/* Sub rows. A row with its own `sub` renders a NESTED disclosure —
   trigger restyled via twMerge (h-7 px-2 rounded-md text-sm) to sit in
   the sub rhythm instead of the top-level pill. NOTE: the nested
   SidebarMenuCollapsible renders its own <li>, so it is NOT wrapped in
   SidebarMenuSubItem (li>li). */
function SubRows({ items }) {
  return items.map((item) =>
    item.sub ? (
      <SidebarMenuCollapsible
        key={item.id}
        dataHook={`collapsible-${item.id}`}
        defaultOpen={item.active}
      >
        <SidebarMenuCollapsibleTrigger
          size="sm"
          className="h-7 rounded-md px-2 text-sm font-normal [&>span:last-of-type]:whitespace-normal!"
        >
          <span>{item.label}</span>
        </SidebarMenuCollapsibleTrigger>
        <SidebarMenuCollapsibleContent
          variant={SidebarMenuSubVariant.BORDER}
          className="ml-2 items-stretch pr-0"
        >
          <SubRows items={item.sub} />
        </SidebarMenuCollapsibleContent>
      </SidebarMenuCollapsible>
    ) : (
      <SidebarMenuSubItem key={item.id} dataHook={`sub-item-${item.id}`}>
        <SidebarMenuSubButton
          className="h-auto min-h-7 w-full py-1 [&>span:last-of-type]:whitespace-normal!"
          dataHook={`sub-btn-${item.id}`}
          isActive={item.active}
          data-grade-goto={item.goto}
        >
          <span>{item.label}</span>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    ),
  );
}

function NavSection({ section }) {
  if (!section.sub) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          className="px-4 [&>span:last-of-type]:whitespace-normal!"
          dataHook={`nav-${section.id}`}
          isActive={section.active}
          data-grade-goto={section.goto}
        >
          <section.icon className="size-5" />
          <span>{section.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }
  return (
    <SidebarMenuCollapsible
      dataHook={`collapsible-${section.id}`}
      defaultOpen={section.active}
    >
      <SidebarMenuCollapsibleTrigger
        className="px-4 [&>span:last-of-type]:whitespace-normal!"
        tooltip={section.label}
      >
        <section.icon className="size-5" />
        <span>{section.label}</span>
      </SidebarMenuCollapsibleTrigger>
      {/* ml-8 (on-scale, ~the parent icon's centreline); items-stretch
          + w-full make sub rows span the full width. */}
      {/* ml-6: rail ≈ the icon centreline with the px-4/px-4 inset
          split. pr-2 overrides the variant's baked pr-10 — 40px of
          dead right padding per level was the truncation driver. */}
      <SidebarMenuCollapsibleContent
        variant={SidebarMenuSubVariant.BORDER}
        className="ml-6 items-stretch pr-2"
      >
        <SubRows items={section.sub} />
      </SidebarMenuCollapsibleContent>
    </SidebarMenuCollapsible>
  );
}

export default function App() {
  const sidebar = (
    <Sidebar dataHook="app-sidebar">
      {/* Logo-only header; the account switcher lives in the STUCK
          footer with the signed-in row. pb-3 overrides the DS's
          hardcoded pb-9. */}
      {/* pl-6 keeps the logo on the tightened 24px icon line
          (groups px-2 + buttons px-4); the DS default pl-8 assumed the
          airier inset. */}
      <SidebarHeader dataHook="sidebar-header" className="pb-3 pl-6">
        <Logo className="h-6" dataHook="sidebar-logo" />
      </SidebarHeader>

      {/* Tight vertical rhythm: kill the DS's default gap between
          groups and between menu items — the separators alone mark
          the sections. */}
      {/* pr-2 ALWAYS: the DS adds pr-2 only when the nav overflows
          (hasOverflow in sidebar.tsx), so the whole nav nudged 8px left
          the moment it became scrollable. Reserving the gutter
          permanently keeps the width stable either way — cn dedupes the
          double pr-2 when the DS adds its own. */}
      <SidebarContent dataHook="sidebar-content" className="gap-0 pt-1 pr-2">
        <SidebarGroup className="px-2 py-1">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0">
              {SECTIONS.map((section) => (
                <NavSection key={section.id} section={section} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      {/* STUCK footer — deliberately NOT SidebarFooter: that component
          PORTALS itself into the content scroll area (SidebarContent's
          mt-auto portal target), so with an overflowing nav it scrolls
          away with the content. A plain sibling of the scroll area is
          always pinned. px-2 matches the nav groups' inset. Upstream
          ask: SidebarFooter needs a non-portalling/sticky option. */}
      <div
        data-hook="sidebar-footer"
        className="border-sidebar-border flex shrink-0 flex-col gap-0.5 border-t px-2 py-1.5"
      >
        {/* Account switcher — full-width row above the signed-in user. */}
        {/* No trigger icon — the label carries it; the popover items
            keep theirs for scanability. */}
        <SidebarSwitcher
          dataHook="account-switcher"
          label="Acme Local Agency"
          triggerAriaLabel="Switch account"
          triggerClassName="w-full px-2 py-1 [&>span]:flex-1 [&>span]:text-left [&>svg:last-child]:size-3 [&>svg:last-child]:opacity-100"
        >
          <SidebarPopoverMenu
            dataHook="account-switcher-menu"
            groupTitle="Accounts"
            items={ACCOUNTS}
          />
        </SidebarSwitcher>
        <SidebarMenu>
          {/* The dropdown trigger inherits SidebarMenuButton's baked
              px-6 (rounded-full nav sizing) — comically wide in a
              compact footer, and the DS plumbs no className through.
              Target its data-hook from the item instead. */}
          <SidebarMenuItem className="[&_[data-hook=sidebar-account-dropdown-button]]:px-2 [&_[data-hook=sidebar-account-dropdown-button]]:py-1">
            {/* `email` renders as span CHILDREN in the dist, so it
                takes an entity — the plan/trial line rides there (plain
                text; a Chip proved too loud for the footer). Upstream
                ask: rename to a typed `meta` ReactNode slot. */}
            <SidebarAccountDropdown
              dataHook="sidebar-account-dropdown"
              name="Joe Bloggs"
              email="Trial: 14 days left"
              avatar={
                <Avatar dataHook="sidebar-user-avatar">
                  <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                    JB
                  </AvatarFallback>
                </Avatar>
              }
              menuGroups={[
                [
                  { label: "Account Details" },
                  { label: "Billing Details" },
                  { label: "Addons" },
                  { label: "Support Tickets" },
                ],
                [{ label: "Logout" }],
              ]}
              side="top"
              align="end"
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
    </Sidebar>
  );

  // Page header — the page-header-with-breadcrumbs recipe: trail above
  // the title, meta row below, no avatar. (There is no PageHeader
  // component in the DS — the page header IS this composition.)
  const header = (
    <div className="flex min-w-0 flex-col gap-1">
      {/* Trail RULE: ANCESTORS ONLY, max two — the current page never
          appears in the breadcrumb (the H2 below IS the current page).
          BreadcrumbPage is deliberately unused. */}
      <Breadcrumb dataHook="page-breadcrumb">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Your Locations</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Blackberry Farm Park</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <TypographyH2 dataHook="page-title">Monitor Reviews</TypographyH2>
      <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
        <span>Blackberry Farm Park — Lewes, BN8 6JD</span>
        <Badge dataHook="location-status">Active</Badge>
      </div>
    </div>
  );

  return (
    <SidebarProvider dataHook="switcher-sidebar-provider" defaultOpen>
      {/* Layout knobs are LITERAL props so the inspector can edit them —
          select the shell (click the page background) and flip
          flush / stickyHeader / pinnedSidebar / sidebarTone. */}
      <AppLayoutShell
        flush={true}
        stickyHeader={true}
        pinnedSidebar={true}
        sidebarTone="default"
        sidebar={sidebar}
        header={header}
        mobileBar={
          <header className="flex items-center gap-1 px-1 py-1 lg:hidden">
            <SidebarTrigger dataHook="mobile-sidebar-trigger" className="size-11">
              <Menu className="size-5" />
            </SidebarTrigger>
            <Logo className="h-6" dataHook="mobile-logo" />
          </header>
        }
        dataHook="app-layout"
      >
        <GlobalLayoutContentBody dataHook="page-body">
          <Card variant="filled" className="max-w-none" dataHook="content-placeholder">
            <CardContent>
              <p className="text-muted-foreground py-16 text-center text-sm">
                Content region — tall on purpose so the sticky header and
                pinned sidebar are visible while scrolling.
              </p>
              {/* Height-only spacer — an earlier bg-muted version painted a
                  huge neutral-100 rectangle that read as "the canvas is
                  too strong". */}
              <div className="h-[1200px]" />
            </CardContent>
          </Card>
        </GlobalLayoutContentBody>
      </AppLayoutShell>
    </SidebarProvider>
  );
}
