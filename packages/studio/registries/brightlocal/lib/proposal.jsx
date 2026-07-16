// @brightlocal/proposal — shared user-land components for the BrightLocal
// side-nav proposal (STUDIO-FLOWS M0, "the verbosity killer").
//
// REGISTRY-SCOPED module (not project-scoped): Ali runs play projects and
// share projects on the same registry and needs ONE source of truth.
// Compiled into the registry bundle as a SOURCE STRING
// (runtime.libModules via scripts/generate-registry-lib.mjs) and exposed
// to screens as the "@brightlocal/proposal" import:
//
//   - external sandbox: compiled + registered at boot, before any screen
//     module loads (apps/docs/app/external-sandbox/page.tsx).
//   - Sandpack parity: the same source ships as /brightlocal-proposal.jsx
//     in the file map with the import aliased to it — an exported sandbox
//     is screen + this one lib file, runs as-is.
//
// Screens shrink to just the page:
//   import { AppLayoutShell, ProposalSidebar, PageHeader, HubStatCard }
//     from "@brightlocal/proposal";
//
// Canonical copies extracted from templates/hub-page.jsx (July 2026);
// the recipes (app-layout-shell.jsx, hub-stat-card.jsx, hub-hero-card.jsx,
// page-header-with-breadcrumbs.jsx) remain the generation-retrieval
// documentation of the same patterns. Edit HERE, re-run
// `node scripts/generate-registry-lib.mjs`, and every importing screen
// follows. Hand-authored — safe from harvest re-runs.

import * as React from "react";
import {
  Avatar,
  AvatarFallback,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  GlobalLayout,
  GlobalLayoutContent,
  GlobalLayoutContentHeader,
  GlobalLayoutSidebar,
  Logo,
  Sidebar,
  SidebarAccountDropdown,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
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
  SidebarSwitcher,
  TypographyH2,
  TypographyH3,
} from "@brightlocal/ui-components";
import {
  BarChart3,
  Briefcase,
  Building,
  ChevronRight,
  Globe,
  Grid3x3,
  Link,
  ListChecks,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  TrendingUp,
} from "@brightlocal/icons";
// Named datasets — generated from registries/brightlocal/lib/data/*.json
// (raw hand-editable JSON; filename = dataset name). Lib-to-lib import,
// resolved through the same libModules seam as this file itself.
import { DATASETS } from "@brightlocal/data";

// ─── Nav + account data (the proposal's default IA) ──────────────────
// Screens can pass their own `sections` / `accounts` to ProposalSidebar;
// these exports are the July 2026 IA from Ali's tree so a screen that
// just wants "the proposal sidenav" carries zero data.
//
// Row fields: `paid` marks add-ons in the IA data (not rendered),
// `active` opens the trail, `goto: "<screen name>"` links a row to
// another screen and `transition: "fade" | "slide-left" | …` picks the
// swap treatment (STUDIO-FLOWS — transitions are DATA ON THE LINK; both
// stamp data-grade-* attributes).

export const PROPOSAL_ACCOUNTS = [
  { label: "Acme Local Agency", icon: <Building className="size-4" /> },
  { label: "Harbour & Co", icon: <Building className="size-4" /> },
  { label: "Northside Dental Group", icon: <Building className="size-4" /> },
];

export const PROPOSAL_SECTIONS = [
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
  // NOTE: no baked `active` flags in the default IA — which row is
  // active is a PER-SCREEN statement (ProposalSidebar activeId). A
  // screen without activeId highlights nothing (correct for landings);
  // custom `sections` may still carry their own active flags.
  {
    id: "rankings",
    label: "Rankings",
    icon: TrendingUp,
    sub: [
      { id: "rk-positions", label: "Positions" },
      { id: "rk-table", label: "Rankings Table" },
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
    // Keyword rows are DATA-DRIVEN — injected from data.keywords by
    // buildProposalSections below (Harry: keywords come from the JSON).
    // This static fallback only renders if sections are used raw.
    sub: [
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

/** The proposal IA with data-driven rows injected:
 *  - Local Search Grid's keyword sub-items come from `data.keywords`,
 *    ahead of the section's static rows (Add more / Settings).
 *  - `data.navLinks` wires goto targets onto nav rows BY ID — per
 *    project data, not module structure, so links can change over time
 *    without touching the IA. Value is a screen name string, or
 *    { goto, transition } for a transition preset:
 *      "navLinks": { "rk-table": "Rankings Table",
 *                    "lp-hours": { "goto": "Opening Hours", "transition": "slide-left" } }
 *  ProposalSidebar calls this with the context data by default; screens
 *  with a custom nav can call it themselves or pass `sections` raw. */
export function buildProposalSections(data) {
  const keywords = data?.keywords ?? [];
  const links = data?.navLinks ?? {};
  const applyLinks = (item) => {
    const link = links[item.id];
    const patched = link
      ? typeof link === "string"
        ? { ...item, goto: link }
        : {
            ...item,
            goto: link.goto ?? item.goto,
            transition: link.transition ?? item.transition,
          }
      : item;
    return patched.sub
      ? { ...patched, sub: patched.sub.map(applyLinks) }
      : patched;
  };
  return PROPOSAL_SECTIONS.map((section) => {
    const withKeywords =
      section.id === "local-search-grid"
        ? {
            ...section,
            sub: [
              ...keywords.map((kw, i) => ({ id: `lsg-kw-${i}`, label: kw })),
              ...section.sub,
            ],
          }
        : section;
    return applyLinks(withKeywords);
  });
}

/** Does this item's subtree contain the id? Drives the open trail when
 *  ProposalSidebar gets an explicit activeId. */
function subtreeHas(item, id) {
  if (!id) return false;
  if (item.id === id) return true;
  return (item.sub ?? []).some((child) => subtreeHas(child, id));
}

// ─── Proposal data layer (lightweight data binding — Ali/Harry) ───────
// "You could just switch the data and it would be magic": ONE data
// object drives the interface. The context's DEFAULT value is the demo
// data below, so screens need zero setup — mount nothing and every
// component renders the Acme/Blackberry demo. To re-skin a whole screen
// (client name, location, metrics), wrap it once:
//
//   <ProposalDataProvider data={{ account: { label: "Harbour & Co" } }}>
//
// Partial objects deep-merge over the defaults (two levels — enough for
// this shape, cheap enough to read). Components resolve props first,
// then context: an explicit prop always wins, so per-instance overrides
// stay possible. This is deliberately NOT a fetching layer — it's a
// binding seam; real data arrives by swapping the object.

export const PROPOSAL_DATA = {
  account: { label: "Acme Local Agency" },
  user: { name: "Joe Bloggs", meta: "Trial: 14 days left", initials: "JB" },
  location: {
    name: "Blackberry Farm Park — Lewes, BN8 6JD",
    status: "Active",
  },
  // Tracked keywords — feed the Local Search Grid nav sub-items (via
  // buildProposalSections) and any keyword table/grid a screen renders.
  // Arrays replace WHOLESALE on merge, so a dataset swaps the whole
  // list (Harry's point: keywords should come from the JSON).
  keywords: [
    "campsite lewes",
    "holiday park east sussex",
    "family camping near me",
    "glamping south downs",
    "caravan park brighton",
  ],
  // Nav goto links BY ROW ID — per-project wiring, stable per project
  // but editable over time without touching the IA structure. Value:
  // screen name, or { goto, transition }. Applied by
  // buildProposalSections; authored per project via ProposalDataProvider
  // data or a dataset JSON.
  navLinks: {},
  // AI Insights — the headline featureset. A dataset section of its
  // own: `summary` is the one-liner surfaces quote (hero, hub);
  // `items` are "the three things to fix first" — area matches a nav
  // section id, severity drives any status treatment. Refine the shape
  // against the real product output when it lands; the JSON is the
  // contract and screens bind through useProposalData().aiInsights.
  aiInsights: {
    summary:
      "Your listings are strong, but reviews velocity dropped and two citations conflict.",
    items: [
      {
        id: "ins-1",
        area: "reviews",
        severity: "high",
        title: "Review replies are 9 days behind",
        action: "Respond to 6 unanswered reviews on Google and Yelp.",
      },
      {
        id: "ins-2",
        area: "citations",
        severity: "medium",
        title: "Conflicting opening hours on 2 citations",
        action: "Sync hours from the Location Profile to Bing and Apple.",
      },
      {
        id: "ins-3",
        area: "website-seo",
        severity: "low",
        title: "Location page is missing LocalBusiness schema",
        action: "Add structured data to lift map-pack eligibility.",
      },
    ],
  },
  metrics: {
    reviews: {
      metric: "4.3",
      delta: "+0.2 this month",
      description: "Monitor and respond across 30+ sites",
    },
    rankings: {
      metric: "12",
      delta: "↑ 3 places",
      description: "Local search positions for tracked keywords",
    },
    citations: {
      metric: "86",
      description: "Live listings across the citation network",
    },
    localSearchGrid: {
      metric: "5",
      delta: "keywords tracked",
      description: "Map-grid visibility for your keywords",
    },
    gbpManager: {
      metric: "3",
      delta: "pending posts",
      description: "Posts, Q&A and profile updates",
    },
    websiteSeo: {
      metric: "78",
      delta: "site score",
      description: "On-site health and optimisation",
    },
  },
};

const ProposalDataContext = React.createContext(PROPOSAL_DATA);

/** Recursive merge: plain objects merge key-by-key over the defaults,
 *  so `{ metrics: { reviews: { metric: "4.9" } } }` patches ONE value
 *  and keeps the sibling description/delta. Anything non-object —
 *  including arrays and ReactNodes — replaces wholesale. */
function mergeProposalData(base, patch) {
  if (!patch) return base;
  const isPlain = (v) =>
    v && typeof v === "object" && !Array.isArray(v) && !React.isValidElement(v);
  const out = { ...base };
  for (const key of Object.keys(patch)) {
    const b = base[key];
    const p = patch[key];
    out[key] = isPlain(b) && isPlain(p) ? mergeProposalData(b, p) : p;
  }
  return out;
}

// Named datasets (raw JSON in lib/data/*.json, folded into the
// "@brightlocal/data" module at generation time). Re-exported so
// screens/chrome can enumerate the options.
export const PROPOSAL_DATASETS = DATASETS;

export function ProposalDataProvider({ dataset, data, children }) {
  // Merge order: PARENT context → named dataset patch → the `data`
  // prop. Base is the parent (not PROPOSAL_DATA directly — though with
  // no outer provider the parent IS the defaults), so nested providers
  // STACK: a screen-level provider carrying project navLinks survives
  // the shell/tweaker mounting a dataset provider inside it.
  const parent = React.useContext(ProposalDataContext);
  const merged = React.useMemo(() => {
    const named = dataset && dataset !== "default" ? DATASETS[dataset] : undefined;
    if (dataset && dataset !== "default" && !named) {
      // eslint-disable-next-line no-console
      console.warn(`[proposal] unknown dataset "${dataset}" — using defaults`);
    }
    return mergeProposalData(mergeProposalData(parent, named), data);
  }, [parent, dataset, data]);
  return (
    <ProposalDataContext.Provider value={merged}>
      {children}
    </ProposalDataContext.Provider>
  );
}

export function useProposalData() {
  return React.useContext(ProposalDataContext);
}

// ─── Shell presets — tones × frames × shadows × page layers ─────────
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
// (schemeCss in AppLayoutShell), so every preset flips with Studio's
// mode toggle.
const ld = (light, dark) => `light-dark(${light}, ${dark})`;

export const SIDEBAR_TONES = {
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
export const SIDEBAR_FRAMES = {
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
export const SIDEBAR_SHADOWS = {
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
// reason as the sidebar tones; backgroundColor paints the canvas
// directly — the body backdrop is set at :root and won't follow a
// mid-tree var swap.
export const PAGE_LAYERS = {
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

// ─── ShellTweakerPanel — hidden, session-local demo controls ─────────
// Stakeholder-demo layer: reveals in the bottom-right corner (hover the
// corner, or Alt+T) and OVERRIDES the shell's look knobs at runtime.
// Two layers, two owners: literal props on <AppLayoutShell> are the
// AUTHORED decision (the inspector edits those, they persist in the
// screen source); tweaks live in component state — a viewer on a share
// link can play freely and reload always returns to the authored look.
// Chips mark overridden knobs; Reset drops back to authored. Plain
// elements on purpose — this is prototype chrome, not proposal UI.
export function ShellTweakerPanel({ authored, tweaks, setTweaks }) {
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
    // Named datasets — flips the WHOLE interface's data live (account,
    // user, location, metrics) via a nested ProposalDataProvider in
    // AppLayoutShell. The meeting trick: Alt+T, switch client.
    { key: "dataset", label: "Data", values: ["default", ...Object.keys(DATASETS)] },
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
        <div className="w-64 rounded-xl border border-[var(--border)] bg-[light-dark(var(--ds-tailwind-colors-base-white),var(--ds-tailwind-colors-neutral-900))] p-3 shadow-lg">
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
                {"×"}
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
          className="flex size-9 items-center justify-center rounded-full border border-[var(--border)] bg-[light-dark(var(--ds-tailwind-colors-base-white),var(--ds-tailwind-colors-neutral-900))] opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100"
        >
          <SlidersHorizontal className="size-4" />
        </button>
      )}
    </div>
  );
}

// ─── AppLayoutShell — the proposal's layout root ──────────────────────
// Cancels GlobalLayout's baked-in p-section-sm + viewport p-1 (string
// literals in the dist, not prop-overridable — rules/90-audit.md) and
// exposes the layout explorations as props.
export function AppLayoutShell({
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
  // aside is hidden below lg). Presets in SIDEBAR_FRAMES.
  sidebarFrame = "floating", // "flush" | "floating"
  // Sidebar drop shadow — overrides the frame's own. Presets in
  // SIDEBAR_SHADOWS. "frame" (default) defers to the frame preset.
  sidebarShadow = "frame", // "frame" | "none" | "sm" | "md" | "lg"
  // Optional 1px border around the sidebar container. Any CSS color —
  // tokens welcome: "var(--sidebar-border)", "var(--ds-tailwind-colors-neutral-200)".
  sidebarBorder,
  // Page-wide layer treatment — canvas + card surface. Presets in
  // PAGE_LAYERS. "raised" = green-grey canvas, white cards.
  pageLayers = "raised", // "default" | "raised"
  // Named dataset (lib/data/*.json) — "default" renders PROPOSAL_DATA;
  // anything else wraps the shell in a nested ProposalDataProvider, so
  // it also OVERRIDES any provider a screen mounted outside. A tweaker
  // knob like the visual ones: authored here, overridable via Alt+T.
  dataset = "default",
  sidebar,
  header,
  // Mobile top bar slot (hamburger + logo). Rendered FIRST inside the
  // content column so it sits ABOVE the page header below lg — passing
  // it via children put it underneath (July 2026 screenshot).
  mobileBar,
  children,
  className,
  // Render the hidden demo tweaker (corner hover / Alt+T). Turn off
  // for screens where prototype chrome must not exist at all — or when
  // mounting ShellTweakerPanel OUTSIDE the shell (it's fixed-position
  // chrome, not layout) via the controlled pair below.
  tweaker = true,
  // Controlled tweaks (optional): pass `tweaks` + `onTweaksChange` to
  // own the override state outside the shell — e.g. a screen that
  // mounts ShellTweakerPanel itself, next to other prototype chrome.
  // Uncontrolled (default) keeps the state internal.
  tweaks: controlledTweaks,
  onTweaksChange,
  dataHook = "app-layout",
}) {
  // ─── Tweaker override layer (see ShellTweakerPanel): literal props
  // are the AUTHORED look; tweaks shadow them for this session only.
  // Reassigning the params keeps every downstream reference
  // (tone/frame/shadow/layers/sticky) reading the LIVE values.
  const authored = { sidebarTone, sidebarFrame, sidebarShadow, pageLayers, stickyHeader, dataset };
  const [ownTweaks, setOwnTweaks] = React.useState({});
  const tweaks = controlledTweaks ?? ownTweaks;
  const setTweaks = onTweaksChange ?? setOwnTweaks;
  ({ sidebarTone, sidebarFrame, sidebarShadow, pageLayers, stickyHeader, dataset } = {
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
  // Shadows stay a SIDEBAR treatment. Scoped <style> because
  // border-color can't ride the --card token swap.
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
  const shell = (
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
            // pinning. z-30: shell chrome must beat PAGE z-indexes
            // (screens use up to z-20 — the LSG map nodes painted over
            // the header at z-10, 16 Jul screenshot) while staying
            // under the tweaker (z-50) and portalled overlays.
            className={[
              "pt-6 pb-4",
              stickyHeader
                ? "bg-background sticky top-0 z-30 border-b"
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
  // Named dataset (authored prop or live tweak) — nested provider wins
  // over both the module default AND any provider the screen mounted
  // outside, which is exactly what a demo switch should do. "default"
  // mounts nothing, so an outer provider (or the defaults) shows through.
  return dataset && dataset !== "default" ? (
    <ProposalDataProvider dataset={dataset}>{shell}</ProposalDataProvider>
  ) : (
    shell
  );
}

/* Sub rows. A row with its own `sub` renders a NESTED disclosure —
   trigger restyled via twMerge (h-7 px-2 rounded-md text-sm) to sit in
   the sub rhythm instead of the top-level pill. NOTE: the nested
   SidebarMenuCollapsible renders its own <li>, so it is NOT wrapped in
   SidebarMenuSubItem (li>li). */
/* Active resolution: an explicit activeId (per-screen prop) overrides
   the IA's baked `active` flags entirely — the id names the row, and
   every collapsible on the trail to it opens. No activeId = legacy
   behaviour (the flags in the sections data). */
function SubRows({ items, activeId }) {
  return items.map((item) =>
    item.sub ? (
      <SidebarMenuCollapsible
        key={item.id}
        dataHook={`collapsible-${item.id}`}
        defaultOpen={activeId ? subtreeHas(item, activeId) : item.active}
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
          <SubRows items={item.sub} activeId={activeId} />
        </SidebarMenuCollapsibleContent>
      </SidebarMenuCollapsible>
    ) : (
      <SidebarMenuSubItem key={item.id} dataHook={`sub-item-${item.id}`}>
        <SidebarMenuSubButton
          className="h-auto min-h-7 w-full py-1 [&>span:last-of-type]:whitespace-normal!"
          dataHook={`sub-btn-${item.id}`}
          isActive={activeId ? item.id === activeId : item.active}
          data-grade-goto={item.goto}
          data-grade-transition={item.transition}
        >
          <span>{item.label}</span>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    ),
  );
}

function NavSection({ section, activeId }) {
  if (!section.sub) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          className="px-4 [&>span:last-of-type]:whitespace-normal!"
          dataHook={`nav-${section.id}`}
          isActive={activeId ? section.id === activeId : section.active}
          data-grade-goto={section.goto}
          data-grade-transition={section.transition}
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
      defaultOpen={activeId ? subtreeHas(section, activeId) : section.active}
    >
      <SidebarMenuCollapsibleTrigger
        className="px-4 [&>span:last-of-type]:whitespace-normal!"
        tooltip={section.label}
      >
        <section.icon className="size-5" />
        <span>{section.label}</span>
      </SidebarMenuCollapsibleTrigger>
      {/* ml-6: rail ≈ the icon centreline with the px-4/px-4 inset
          split. pr-2 overrides the variant's baked pr-10 — 40px of
          dead right padding per level was the truncation driver.
          items-stretch + w-full make sub rows span the full width. */}
      <SidebarMenuCollapsibleContent
        variant={SidebarMenuSubVariant.BORDER}
        className="ml-6 items-stretch pr-2"
      >
        <SubRows items={section.sub} activeId={activeId} />
      </SidebarMenuCollapsibleContent>
    </SidebarMenuCollapsible>
  );
}

// ─── ProposalSidebar — the proposal side navigation ───────────────────
// The full sidenav composition: logo header (32px alignment line),
// SECTIONS-driven three-level nav, and the STUCK footer (account
// switcher + signed-in dropdown). Wrap in the DS's SidebarProvider at
// the screen root — the provider is per-screen state, not lib chrome.
export function ProposalSidebar({
  // Default nav is DATA-DRIVEN: built from the proposal data context
  // (keywords feed the Local Search Grid rows; data.navLinks wires goto
  // targets by row id), so a dataset switch re-writes the left nav too.
  // Pass `sections` to opt out.
  sections,
  // WHICH ROW IS ACTIVE — the per-screen knob ("this page is Opening
  // Hours"): pass the nav row's id (activeId="lp-hours") and the row
  // highlights + every collapsible on its trail opens. Overrides the
  // IA's baked flags; omit for the default (Rankings Table).
  activeId,
  accounts = PROPOSAL_ACCOUNTS,
  // Account/user rows resolve PROPS FIRST, then the proposal data
  // context — so a screen wrapped in ProposalDataProvider re-skins the
  // footer with zero sidebar props, and a per-instance prop still wins.
  accountLabel,
  userName,
  // `email` renders as span CHILDREN in the dist, so it takes an
  // entity — the plan/trial line rides there (plain text; a Chip
  // proved too loud for the footer). Upstream ask: rename to a typed
  // `meta` ReactNode slot.
  userMeta,
  userInitials,
  userMenuGroups = [
    [
      { label: "Account Details" },
      { label: "Billing Details" },
      { label: "Addons" },
      { label: "Support Tickets" },
    ],
    [{ label: "Logout" }],
  ],
  dataHook = "app-sidebar",
}) {
  const data = useProposalData();
  sections = sections ?? buildProposalSections(data);
  accountLabel = accountLabel ?? data.account.label;
  userName = userName ?? data.user.name;
  userMeta = userMeta ?? data.user.meta;
  userInitials = userInitials ?? data.user.initials;
  return (
    <Sidebar dataHook={dataHook}>
      {/* Logo-only header; the account switcher lives in the STUCK
          footer with the signed-in row. pb-3 overrides the DS's
          hardcoded pb-9; pl-6 keeps the logo on the tightened 24px
          icon line (groups px-2 + buttons px-4) — the DS default pl-8
          assumed the airier inset. */}
      <SidebarHeader dataHook="sidebar-header" className="pb-3 pl-6">
        <Logo className="h-6" dataHook="sidebar-logo" />
      </SidebarHeader>

      {/* Tight vertical rhythm: kill the DS's default gap between
          groups and menu items — separators alone mark the sections.
          pr-2 ALWAYS: the DS adds pr-2 only when the nav overflows
          (hasOverflow in sidebar.tsx), so the whole nav nudged 8px left
          the moment it became scrollable. Reserving the gutter
          permanently keeps the width stable either way. */}
      <SidebarContent dataHook="sidebar-content" className="gap-0 pt-1 pr-2">
        <SidebarGroup className="px-2 py-1">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0">
              {sections.map((section) => (
                <NavSection key={section.id} section={section} activeId={activeId} />
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
        {/* Account switcher — full-width row above the signed-in user.
            No trigger icon — the label carries it; the popover items
            keep theirs for scanability. */}
        <SidebarSwitcher
          dataHook="account-switcher"
          label={accountLabel}
          triggerAriaLabel="Switch account"
          triggerClassName="w-full px-2 py-1 [&>span]:flex-1 [&>span]:text-left [&>svg:last-child]:size-3 [&>svg:last-child]:opacity-100"
        >
          <SidebarPopoverMenu
            dataHook="account-switcher-menu"
            groupTitle="Accounts"
            items={accounts}
          />
        </SidebarSwitcher>
        <SidebarMenu>
          {/* The dropdown trigger inherits SidebarMenuButton's baked
              px-6 (rounded-full nav sizing) — comically wide in a
              compact footer, and the DS plumbs no className through.
              Target its data-hook from the item instead. */}
          <SidebarMenuItem className="[&_[data-hook=sidebar-account-dropdown-button]]:px-2 [&_[data-hook=sidebar-account-dropdown-button]]:py-1">
            <SidebarAccountDropdown
              dataHook="sidebar-account-dropdown"
              name={userName}
              email={userMeta}
              avatar={
                <Avatar dataHook="sidebar-user-avatar">
                  <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              }
              menuGroups={userMenuGroups}
              side="top"
              align="end"
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
    </Sidebar>
  );
}

// ─── PageHeader — the composed page header ────────────────────────────
// There is NO PageHeader component in the DS — the page header IS this
// composition (recipe: page-header-with-breadcrumbs.jsx; upstream note:
// it should be a component). Trail RULE: ANCESTORS ONLY, max two — the
// current page never appears in the breadcrumb (the H2 IS the current
// page); BreadcrumbPage is deliberately unused. `meta` renders in the
// muted row under the title; `actions` right-aligns (buttons, menus).
export function PageHeader({
  breadcrumbs = [],
  title,
  // Muted row under the title. DEFAULT is data-bound: the current
  // location (name + status badge) from the proposal data context —
  // reads at render position, so it follows dataset switches. Pass
  // `meta={null}` to suppress, or any node to replace.
  meta,
  actions,
  dataHook = "page-header",
}) {
  const data = useProposalData();
  const resolvedMeta =
    meta === undefined ? (
      <>
        <span>{data.location.name}</span>
        <Badge dataHook="location-status">{data.location.status}</Badge>
      </>
    ) : (
      meta
    );
  return (
    <div
      data-hook={dataHook}
      className="flex min-w-0 items-start justify-between gap-4"
    >
      <div className="flex min-w-0 flex-col gap-1">
        {breadcrumbs.length > 0 ? (
          <Breadcrumb dataHook={`${dataHook}-breadcrumb`}>
            <BreadcrumbList>
              {breadcrumbs.map((crumb) => (
                <BreadcrumbItem key={crumb.label}>
                  <BreadcrumbLink href={crumb.href ?? "#"}>
                    {crumb.label}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        ) : null}
        <TypographyH2 dataHook={`${dataHook}-title`}>{title}</TypographyH2>
        {resolvedMeta ? (
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            {resolvedMeta}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

// ─── HubStatCard ──────────────────────────────────────────────────────
// The canonical arrangement: icon → title → chevron (drill-down) →
// description → metric (+ delta). `metric` and `delta` accept
// ReactNodes so screens can pass richer values (a formatted number, a
// sparkline) without changing the seam.
export function HubStatCard({
  icon: Icon,
  title,
  // Data binding: name a key in data.metrics ("reviews", "rankings",
  // …) and the card reads metric/delta/description from the proposal
  // data context AT RENDER POSITION — so it follows dataset switches
  // (tweaker or provider). Explicit props win over the bound values.
  metricKey,
  description,
  metric,
  delta,
  // Screen link (STUDIO-FLOWS): name of the screen this card drills
  // into — stamps data-grade-goto; shares/embeds navigate on click.
  // `transition` picks the swap treatment (data on the link).
  goto,
  transition,
  // ctaHook names the chevron (the card's single drill-down control —
  // footer CTAs were dropped once the chevron landed; two buttons to
  // the same place was noise).
  ctaHook,
  dataHook,
  // Everything else (data-* stamps, aria) rides through to the Card —
  // user-land components must not swallow wire-contract attributes.
  ...rest
}) {
  const data = useProposalData();
  const bound = metricKey ? data.metrics?.[metricKey] : undefined;
  metric = metric ?? bound?.metric;
  delta = delta ?? bound?.delta;
  description = description ?? bound?.description;
  // The whole card is a drill-down target (wire navigation per-screen;
  // the chevron is the named control for keyboard/AT users). No hover
  // treatment — resting state stays border-only per the Figma, and the
  // chevron's own hover carries the affordance.
  return (
    <Card
      density="condensed"
      className="max-w-none cursor-pointer"
      dataHook={dataHook}
      data-grade-goto={goto}
      data-grade-transition={transition}
      {...rest}
    >
      <CardHeader>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            {/* Icon tile pinned to neutral-50 — the faintest step, so
                it reads on BOTH a raised white card and a regular
                default/filled card without riding the muted token
                (which the raised layer bumps to neutral-100). */}
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[light-dark(var(--ds-tailwind-colors-neutral-50),var(--ds-tailwind-colors-neutral-800))]">
              <Icon className="size-4" />
            </div>
            {/* DS scale reference (2.20.0): CardTitle default =
                text-2xl font-medium (too big here); size="small" =
                text-base — the sanctioned smaller title. Weight bumped
                to semibold; size stays on their scale. */}
            <CardTitle size="small" className="font-semibold">
              {title}
            </CardTitle>
            {/* Drill-down affordance — mirrors the whole-card click
                target for pointer users and gives AT/keyboard a
                focusable control. */}
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              className="ml-auto shrink-0"
              ariaLabel={`Open ${typeof title === "string" ? title : "module"}`}
              dataHook={ctaHook ? `${ctaHook}-chevron` : undefined}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-semibold tracking-tight">
            {metric}
          </span>
          {/* Badge, NOT Chip — BL's Chip always renders a remove ✕
              (it's a dismissible input); Badge is the read-only
              status/delta component. */}
          {delta ? <Badge variant="secondary">{delta}</Badge> : null}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── HubHeroCard ──────────────────────────────────────────────────────
export function HubHeroCard({
  title,
  description,
  primaryCta = "Get started",
  primaryHook,
  secondaryCta,
  secondaryHook,
  media,
  // Media proportion presets — Tailwind aspect utilities. "4/3" is the
  // default (video read too letterboxy at w-2/5); "square" for
  // illustration-led heroes.
  mediaAspect = "4/3", // "4/3" | "square" | "video"
  // Screen link (STUDIO-FLOWS) — stamps data-grade-goto/-transition.
  goto,
  transition,
  dataHook,
  // Pass-through — same rule as HubStatCard.
  ...rest
}) {
  const MEDIA_ASPECTS = {
    "4/3": "aspect-[4/3]",
    square: "aspect-square",
    video: "aspect-video",
  };
  const aspect = MEDIA_ASPECTS[mediaAspect] ?? MEDIA_ASPECTS["4/3"];
  // condensed density bakes px-3 on the card — too tight for a hero.
  // px-6 wins the merge (same utility group); vertical rhythm stays
  // condensed.
  return (
    <Card
      density="condensed"
      className="max-w-none px-6"
      dataHook={dataHook}
      data-grade-goto={goto}
      data-grade-transition={transition}
      {...rest}
    >
      <CardContent>
        <div className="flex items-center gap-8">
          {/* Copy column */}
          <div className="flex min-w-0 flex-1 flex-col items-start gap-3 py-4">
            <TypographyH3>{title}</TypographyH3>
            <p className="text-muted-foreground max-w-prose text-sm">
              {description}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button dataHook={primaryHook}>{primaryCta}</Button>
              {secondaryCta ? (
                <Button variant="ghost" dataHook={secondaryHook}>
                  {secondaryCta}
                </Button>
              ) : null}
            </div>
          </div>
          {/* Media column — hidden below md; proportion owned by the
              aspect preset so real media and the placeholder agree. */}
          <div className={`hidden w-2/5 shrink-0 md:block ${aspect}`}>
            {media ?? (
              <div className="flex h-full w-full items-center justify-center rounded-lg border border-[var(--border)] bg-[light-dark(var(--ds-tailwind-colors-neutral-50),var(--ds-tailwind-colors-neutral-800))]">
                <Sparkles className="text-muted-foreground size-6" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
