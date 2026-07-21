// @brightlocal/proposal-shell — AppLayoutShell + ShellTweakerPanel and
// their preset vocabularies (tones × frames × shadows × page layers)
// + the session tweak stash. Split out of proposal.jsx (18 Jul); the
// barrel re-exports.
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
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuSubVariant,
  SidebarPopoverMenu,
  SidebarSwitcher,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  TypographyH2,
  TypographyH3,
  TypographyMuted,
} from "@brightlocal/ui-components";
import {
  BarChart3,
  Briefcase,
  Building,
  ChevronRight,
  Globe,
  Grid3x3,
  Info,
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
import { ProposalDataProvider, PROPOSAL_DATA } from "@brightlocal/proposal-data";

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
  dark: {
    ...sidebarTone(
      "var(--ds-tailwind-colors-neutral-900)",
      "var(--ds-tailwind-colors-neutral-200)",
      "var(--ds-tailwind-colors-neutral-800)",
      "var(--ds-tailwind-colors-neutral-50)",
      "var(--ds-colors-sidebar-border-dark)",
    ),
    // Dark panels are dark ISLANDS: declare it so NATIVE UI follows —
    // the light scrollbar on the dark sidenav (Ali, 17 Jul) was the
    // browser still painting light-scheme chrome. light-dark() tokens
    // inside the subtree flip too, which is exactly right here.
    colorScheme: "dark",
    scrollbarColor:
      "var(--ds-tailwind-colors-neutral-700) transparent" /* Firefox */,
    "--gds-sidebar-scrollbar": "var(--ds-tailwind-colors-neutral-700)",
  },
  brand: {
    ...sidebarTone(
      "var(--ds-tailwind-colors-green-950)",
      "var(--ds-tailwind-colors-green-200)",
      "var(--ds-tailwind-colors-green-900)",
      "var(--ds-tailwind-colors-green-100)",
      "var(--ds-colors-sidebar-border-dark)",
    ),
    colorScheme: "dark",
    scrollbarColor:
      "var(--ds-tailwind-colors-green-800) transparent" /* Firefox */,
    "--gds-sidebar-scrollbar": "var(--ds-tailwind-colors-green-800)",
  },
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

// Session tweak stash — survives navigation AND sandbox iframe
// remounts (some layout flips re-create the iframe, which wiped the
// module-scope stash after the first hop — Ali, 16 Jul). Module scope
// is the fast path; sessionStorage is the durable one: tweaks stick
// for the browser TAB's lifetime, so a stitched walkthrough stays
// coherent, while a fresh viewer (new tab) still opens the authored
// look. Sandboxed iframes without storage fall back to module scope.
// KEYED PER SHELL (dataHook): sessionStorage is shared across every
// same-origin iframe in the tab, so a single key painted one pane's
// tweaks onto EVERY pane of a side-by-side compare share (Ali, 17 Jul
// — "apply to one, applies to all"). Per-hook keys give each named
// shell (rankings-app-layout, hub-app-layout, …) its own stash; the
// cost is that a tweak no longer follows a flow hop between screens
// with DIFFERENT hooks — per-screen isolation won. Screens sharing the
// default "app-layout" hook still share a stash. The share toolbar's
// "Reset tweaks" clears every key under this prefix.
const TWEAKS_KEY_PREFIX = "bl-proposal-session-tweaks";
const SESSION_TWEAKS_BY_HOOK = {}; // module-scope fast path
// SCOPE resolution: the HOST names the stash scope when it knows the
// surface (window.__gdsTweakScope, set by the sandbox on ext:source):
//   - single share → one constant per session: tweaks FOLLOW the
//     walkthrough across every screen/goto ("a single screen shared
//     should always maintain the tweaks" — Ali, 18 Jul);
//   - compare pane → the pane's member id: isolation even between
//     DUPLICATE screens sharing a dataHook (per-hook keys leaked
//     between comparison duplicates);
//   - no host hint (Studio, Sandpack, standalone) → per-dataHook.
function tweakScopeKey(hook) {
  try {
    const scoped = window.__gdsTweakScope;
    if (typeof scoped === "string" && scoped) return scoped;
  } catch {
    /* no window / cross-realm — fall through */
  }
  return hook;
}
function loadSessionTweaks(hook) {
  const key = tweakScopeKey(hook);
  if (SESSION_TWEAKS_BY_HOOK[key] !== undefined)
    return SESSION_TWEAKS_BY_HOOK[key];
  try {
    return JSON.parse(
      window.sessionStorage.getItem(`${TWEAKS_KEY_PREFIX}:${key}`) || "null",
    );
  } catch {
    return null; /* storage unavailable — module scope only */
  }
}
function stashSessionTweaks(hook, next) {
  const key = tweakScopeKey(hook);
  SESSION_TWEAKS_BY_HOOK[key] = next;
  try {
    if (next && Object.keys(next).length > 0)
      window.sessionStorage.setItem(
        `${TWEAKS_KEY_PREFIX}:${key}`,
        JSON.stringify(next),
      );
    else window.sessionStorage.removeItem(`${TWEAKS_KEY_PREFIX}:${key}`);
  } catch {
    /* fine — module scope carries it */
  }
}

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
    { key: "navDensity", label: "Nav density", values: ["compact", "comfortable"] },
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
  // Nav density — "compact" (the fitted look: 30px rows, 16px/1 icons)
  // or "comfortable" (DS-ish: roomier rows, 20px/1.5 icons). Small vs
  // large menus is a real product question (Ali) — so it's a shell
  // knob AND a tweaker row, implemented as the --gds-nav-* variables.
  navDensity = "compact",
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
  // Header BAND background. The header spans the full content-area width
  // (edge-to-edge, right of the sidebar) while its CONTENT stays aligned
  // with the body; this className paints the band's surface. Default
  // (unset) = transparent → the page background shows through (no visible
  // change). Pass a bg utility (or a scope class) for a distinct header
  // surface — a future tweaker knob will drive it (Ali, 21 Jul).
  headerBackground,
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
  // Pass-through (data-gds-source-id et al.): Studio injects anchor ids
  // onto the SCREEN's JSX elements — a module component that swallows
  // unknown props strands those ids outside the DOM, and comment pins
  // silently never anchor (Ali, 17 Jul). Spread onto the root like the
  // cards already do.
  ...rest
}) {
  // ─── Tweaker override layer (see ShellTweakerPanel): literal props
  // are the AUTHORED look; tweaks shadow them for this session only.
  // Reassigning the params keeps every downstream reference
  // (tone/frame/shadow/layers/sticky) reading the LIVE values.
  const authored = { sidebarTone, sidebarFrame, sidebarShadow, pageLayers, stickyHeader, dataset, navDensity };
  // SESSION MEMORY: seed from the module-scope stash (below) so tweaks —
  // colours, frame, DATASET — persist across flow navigation and screen
  // switches: the lib module is compiled once per sandbox boot and its
  // namespace survives every source swap, while component state dies
  // with each screen's tree. Reload still resets to the authored look
  // (session-local semantics kept). Controlled mode bypasses the stash.
  const [ownTweaks, setOwnTweaksState] = React.useState(
    () => loadSessionTweaks(dataHook) ?? {},
  );
  const setOwnTweaks = React.useCallback(
    (updater) => {
      setOwnTweaksState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        stashSessionTweaks(dataHook, next);
        return next;
      });
    },
    [dataHook],
  );
  const tweaks = controlledTweaks ?? ownTweaks;
  const setTweaks = onTweaksChange ?? setOwnTweaks;
  ({ sidebarTone, sidebarFrame, sidebarShadow, pageLayers, stickyHeader, dataset, navDensity } = {
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
  // Density presets re-point the --gds-nav-* variables the shell's
  // scoped <style> consumes; compact = the CSS defaults (empty).
  const navVars =
    navDensity === "comfortable"
      ? {
          "--gds-nav-row-py": "8px",
          "--gds-nav-sub-py": "7px",
          "--gds-nav-icon-size": "20px",
          "--gds-nav-icon-stroke": "1.5",
        }
      : {};
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
          // Generic camelCase→kebab (backgroundColor, colorScheme,
          // scrollbarColor…) — the old backgroundColor special-case
          // silently emitted invalid properties for any new tone key.
          .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${v}`)
          .join(";")}}`
      : "";
  const shell = (
    <GlobalLayout
      {...rest}
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
      {/* Sidebar scrollbar discipline (Ali, 18 Jul — "pushes content in
          and is the wrong color"): scrollbar-gutter reserves the rail
          so content never shifts when overflow appears; thin width;
          the thumb colour rides the tone (--gds-sidebar-scrollbar from
          dark/brand presets, quiet default otherwise). Covers native
          scrollbars AND Radix ScrollArea thumbs — we can't know which
          the DS uses per surface, so both are addressed. */}
      <style>{
        schemeCss +
        mobileToneCss +
        layerCss +
        /* NAV RHYTHM (Ali + Harry, 18 Jul) — deliberate DS override,
           variable-driven so the values are tunable per screen/theme
           without touching the module again:
             --gds-nav-font-size  label size, BOTH levels (default 14px
                                  — the size="sm" variants dropped subs
                                  to 12px, too small)
             --gds-nav-row-py     main row block padding (default 6px →
                                  ~32px rows; round 2 — 5px/30px "too
                                  small", Ali). comfortable = 8px/36px
             --gds-nav-sub-py     sub row block padding (default 5px)
             --gds-nav-sub-pl     sub label left padding (default 20px:
                                  rail 24px + border + 20px ≈ 45px —
                                  lines subs up with the main LABEL,
                                  which sits at px-4 + icon + gap = 44px)
           Rationale: fit more nav in less height (promo banner below,
           utility slot above are coming) without losing readability.
           The :not guards nav-item-* (the <li> hooks share the nav-
           prefix). height:auto beats the size variant's fixed h-7. */
        '[data-gds-shell-sidebar] [data-hook^="nav-"]:not([data-hook^="nav-item-"]){height:auto;min-height:calc(20px + 2*var(--gds-nav-row-py,6px));padding-block:var(--gds-nav-row-py,6px);font-size:var(--gds-nav-font-size,0.875rem)}' +
        '[data-gds-shell-sidebar] [data-hook^="sub-btn-"]{border-radius:var(--gds-nav-row-radius,9999px);height:auto;min-height:calc(20px + 2*var(--gds-nav-sub-py,5px));padding-block:var(--gds-nav-sub-py,5px);padding-left:var(--gds-nav-sub-pl,20px);font-size:var(--gds-nav-font-size,0.875rem)}' +
        /* Nav icons — 16px / stroke 1 at the compact row size (20px
           icons overpowered the sm rows). Lucide sets stroke-width as
           a presentation attribute on the svg root, so CSS here wins.
             --gds-nav-icon-size    (default 16px)
             --gds-nav-icon-stroke  (default 1.5 — stroke 1 at 16px
                                     read wispy/awful; lucide's native
                                     2 is heavy at this size) */
        '[data-gds-shell-sidebar] [data-hook^="nav-"]:not([data-hook^="nav-item-"]) svg{width:var(--gds-nav-icon-size,16px);height:var(--gds-nav-icon-size,16px);stroke-width:var(--gds-nav-icon-stroke,1.5)}' +
        "[data-gds-shell-sidebar] *{scrollbar-gutter:stable;scrollbar-width:thin;scrollbar-color:var(--gds-sidebar-scrollbar,rgb(0 0 0/0.18)) transparent}" +
        "[data-gds-shell-sidebar] [data-radix-scroll-area-thumb],[data-gds-shell-sidebar] [data-slot=scroll-area-thumb]{background-color:var(--gds-sidebar-scrollbar,rgb(0 0 0/0.18))}" +
        "[data-gds-shell-sidebar] [data-radix-scroll-area-scrollbar],[data-gds-shell-sidebar] [data-slot=scroll-area-scrollbar]{background:transparent}"
      }</style>
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
        // Scope hook for the scrollbar CSS in the shell <style> above.
        data-gds-shell-sidebar=""
        style={{
          ...(pinnedSidebar && flush
            ? {
                top: frame.margin,
                height: `calc(100dvh - ${2 * frame.margin}px)`,
              }
            : {}),
          ...(borderColor ? { borderColor } : {}),
          ...tone,
          ...navVars,
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
            // FULL-BLEED BAND (Ali, 21 Jul): -mx-6/px-6 net-zero the
            // content column's 24px gutters, and max-w-none lifts the
            // DS's 1024px cap — so the header's BACKGROUND spans the whole
            // content area (edge-to-edge, right of the sidebar). The inner
            // measure below re-caps + re-aligns the CONTENT to match the
            // body. z-30: shell chrome must beat PAGE z-indexes (screens
            // use up to z-20 — the LSG map nodes painted over the header at
            // z-10, 16 Jul) while staying under the tweaker (z-50).
            className={[
              "-mx-6 max-w-none px-6 pt-6 pb-4",
              stickyHeader ? "sticky top-0 z-30 border-b" : "",
              // Band surface: explicit headerBackground wins; else the
              // sticky default (bg-background ≈ page bg); else transparent.
              headerBackground || (stickyHeader ? "bg-background" : ""),
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {/* Inner measure — capped by the SAME token the DS caps the
                content with (--breakpoint-lg = 64rem/1024px; the DS's
                ContentHeader/Body both use the lg breakpoint), so the
                header content lines up with the body and follows the
                token if it ever changes — never a hardcoded drift. */}
            <div className="w-full max-w-[var(--breakpoint-lg)]">{header}</div>
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

