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
  // One step darker than "subtle" — the "depth" step so the sidebar can
  // sit a tone below whatever the page background is (Ali, 22 Jul).
  muted: sidebarTone(
    ld("var(--ds-tailwind-colors-neutral-200)", "var(--ds-tailwind-colors-neutral-900)"),
    ld("var(--ds-tailwind-colors-neutral-700)", "var(--ds-tailwind-colors-neutral-300)"),
    ld("var(--ds-tailwind-colors-neutral-300)", "var(--ds-tailwind-colors-neutral-800)"),
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
  // Brand pair — TOKENS ONLY, never mixed colours (Ali, 22 Jul):
  // brand = green-900, brand-dark = green-950 (one ramp step). The pair
  // lets two brand surfaces sit adjacent with visible depth between
  // them (e.g. brand header + brand-dark sidebar, or vice versa).
  brand: {
    ...sidebarTone(
      "var(--ds-tailwind-colors-green-900)",
      "var(--ds-tailwind-colors-green-100)",
      "var(--ds-tailwind-colors-green-800)",
      "var(--ds-tailwind-colors-green-50)",
      "var(--ds-colors-sidebar-border-dark)",
    ),
    colorScheme: "dark",
    scrollbarColor:
      "var(--ds-tailwind-colors-green-700) transparent" /* Firefox */,
    "--gds-sidebar-scrollbar": "var(--ds-tailwind-colors-green-700)",
  },
  "brand-dark": {
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
// "flush" = hard against the viewport edge; "floating" = lifted off it
// a little (margin + rounded corners); "attached" = LIVES WITH THE
// CONTENT — no viewport pinning, the sidebar sits in-flow inside the
// (centred, max-width-capped) layout container, exactly the DS default
// look. Values live HERE as presets, not as free-text instance props —
// tweak the preset, every screen follows.
export const SIDEBAR_FRAMES = {
  // `classes` = the Tailwind for the preset; `margin` also feeds the
  // pinned top/height, which MUST stay inline style — the DS sets those
  // inline on the aside, and classes can't beat inline styles.
  flush: { margin: 0, classes: "" },
  // shadow-sm lifts the panel off a near-white canvas — with the
  // 50-step tint, the border alone doesn't carry the elevation.
  floating: { margin: 12, classes: "m-3 overflow-hidden rounded-2xl shadow-sm" },
  // In-flow: positioning comes from the DS layout itself. The pinned
  // top/height overrides are skipped for this frame (see `pinned`).
  // Rounded like floating (Ali, 21 Jul) — but no margin/lift/border;
  // it reads as a soft panel sitting WITH the content.
  attached: { margin: 0, classes: "overflow-hidden rounded-2xl" },
};

// THE DEPTH MODEL (Ali, 24 Jul): on the FLUSH frame the content panel
// is ALWAYS above the sidebar — not a knob, the model — and casts this
// soft shadow onto it (an elevated sheet over the nav rail).
// Mechanics: the aside is position:sticky (positioned, z auto); a bare
// `relative` on the later-sibling content column puts both in the
// positioned paint group where DOM order wins — no z-index, no new
// stacking context (the sticky header's z-30 keeps working).
// Ink: derived from the darkest brand neutral via CSS relative color —
// plain black read "murky" against the green-leaning palette, and a
// hand-mixed hex would break the tokens-only rule. Reach kept tight
// (first cut's 40px bloom was "a real massive shadow").
// Inline style, not a class: the registry's JIT can't be trusted with
// rgb(from …) inside an arbitrary-value class. Below lg the aside is
// hidden and content is full-width, so the left-cast shadow just
// bleeds offscreen — no gate needed.
const SEAM_INK = "var(--ds-tailwind-colors-neutral-950)";
// Round 4 of tuning (Ali, 24 Jul): ONE soft layer — the 1px hairline
// layer read as a hard line and is gone; slightly longer reach,
// lighter still. This is THE depth-tuning site; adjust the px reach /
// alpha here only. The seamShadow prop/tweak toggles it entirely.
export const CONTENT_SEAM_SHADOW =
  `-6px 0 16px -6px rgb(from ${SEAM_INK} r g b / 0.05)`;

// Sidebar shadow presets — Tailwind's scale, switchable independently
// of the frame. "frame" = whatever the frame preset ships (floating's
// shadow-sm); anything else replaces it. NOTE (Ali, 24 Jul): on the
// FLUSH frame these can never paint at the seam — the content panel is
// permanently above (CONTENT_SEAM_SHADOW owns that edge) — so this
// knob is effectively a FLOATING-frame control.
export const SIDEBAR_SHADOWS = {
  frame: null,
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};

// Header surface presets — the band's colour, tweaker-switchable. Dark
// surfaces also re-point the TEXT tokens (title/muted/breadcrumb all
// resolve through --foreground/--muted-foreground) so the header stays
// readable — a bg swap alone would leave near-black text on dark green.
export const HEADER_SURFACES = {
  none: null, // transparent — page background shows through
  white: {
    style: { backgroundColor: "var(--ds-tailwind-colors-base-white)" },
  },
  subtle: {
    style: { backgroundColor: "var(--ds-tailwind-colors-neutral-100)" },
  },
  // Dark surfaces are FENCED with the DS's own dark mode (Ali, 22 Jul:
  // "not hand rolling dark mode buttons"): the band carries the `dark`
  // class, so BL's native `.dark { --border/--accent/--secondary/… }`
  // block re-points EVERY semantic token for everything inside — no
  // per-token re-pointing here. We only choose the band's background
  // (pure ramp tokens) + declare colorScheme (BL's .dark doesn't).
  dark: {
    className: "dark",
    style: {
      backgroundColor: "var(--ds-tailwind-colors-neutral-900)",
      // Inherited text (elements with NO text-* class, e.g. Button
      // labels) must follow the fence too — inside .dark this token
      // resolves to the dark-mode foreground.
      color: "var(--foreground)",
      colorScheme: "dark",
    },
  },
  // Brand pair — TOKENS ONLY: brand = green-900, brand-dark =
  // green-950, matching the sidebar tones of the same names.
  brand: {
    className: "dark",
    style: {
      backgroundColor: "var(--ds-tailwind-colors-green-900)",
      color: "var(--foreground)",
      colorScheme: "dark",
    },
  },
  "brand-dark": {
    className: "dark",
    style: {
      backgroundColor: "var(--ds-tailwind-colors-green-950)",
      color: "var(--foreground)",
      colorScheme: "dark",
    },
  },
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
  // ── Card-only treatments (Ali, 22 Jul): these touch the CARD tokens
  // only — the canvas is the Background knob's job (pageBackground).
  // "outline" = transparent cards, border carries the shape;
  // "subtle"  = faint tinted cards;
  // "white"   = white elevated cards.
  outline: {
    "--card": "transparent",
    "--color-card": "transparent",
  },
  subtle: {
    "--card": ld("var(--ds-tailwind-colors-neutral-50)", "var(--ds-tailwind-colors-neutral-900)"),
    "--color-card": ld("var(--ds-tailwind-colors-neutral-50)", "var(--ds-tailwind-colors-neutral-900)"),
    "--muted": ld("var(--ds-tailwind-colors-neutral-100)", "var(--ds-tailwind-colors-neutral-800)"),
    "--color-muted": ld("var(--ds-tailwind-colors-neutral-100)", "var(--ds-tailwind-colors-neutral-800)"),
  },
  white: {
    "--card": ld("var(--ds-tailwind-colors-base-white)", "var(--ds-tailwind-colors-neutral-900)"),
    "--color-card": ld("var(--ds-tailwind-colors-base-white)", "var(--ds-tailwind-colors-neutral-900)"),
    "--muted": ld("var(--ds-tailwind-colors-neutral-100)", "var(--ds-tailwind-colors-neutral-800)"),
    "--color-muted": ld("var(--ds-tailwind-colors-neutral-100)", "var(--ds-tailwind-colors-neutral-800)"),
  },
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

// Page background presets — the CANVAS colour on its own, independent
// of the card treatment (Ali, 22 Jul: "page background should be able
// to be set"). "auto" defers to the Layers/Cards preset. Both var
// prefixes for the same reason as PAGE_LAYERS; backgroundColor paints
// the canvas directly.
function pageBg(light, dark) {
  const v = ld(light, dark);
  return {
    backgroundColor: v,
    "--background": v,
    "--color-background": v,
  };
}
export const PAGE_BACKGROUNDS = {
  auto: null,
  white: pageBg("var(--ds-tailwind-colors-base-white)", "var(--ds-tailwind-colors-neutral-950)"),
  subtle: pageBg("var(--ds-tailwind-colors-neutral-50)", "var(--ds-tailwind-colors-neutral-950)"),
  muted: pageBg("var(--ds-tailwind-colors-neutral-100)", "var(--ds-tailwind-colors-neutral-900)"),
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

// Session-selected DATASET — its own GLOBAL stash, deliberately NOT the
// per-hook tweak stash: "which client am I looking at" is a property of
// the whole walkthrough, while visual tweaks are per-pane (their
// per-hook keys don't follow a goto between screens with different
// dataHooks). A location card click stashes its dataset BEFORE the goto
// fires; every shell mounted after reads it — so the data persists
// across screens exactly like Ali expects tweaks to (22 Jul). Priority
// in AppLayoutShell: explicit tweaker Data row > session-selected >
// authored prop.
const DATASET_KEY = "bl-proposal-session-dataset";
let SESSION_DATASET; // module-scope fast path (same-iframe gotos)
// Google Maps key — the OFFICIAL gradeui key (Ali, 23 Jul; replaced
// the throttle-prone demo key). ONE home so key swaps stay one-line;
// both map screens (LSG page, hub mini) import it from the barrel.
export const GMAPS_DEMO_KEY = "AIzaSyDYxqK_vv19DKmfVy4Rljh6Czo4GyvaX00";

export function selectSessionDataset(dataset) {
  if (!dataset) return;
  SESSION_DATASET = dataset;
  try {
    window.sessionStorage.setItem(DATASET_KEY, dataset);
  } catch {
    /* storage unavailable — module scope carries it */
  }
}
export function loadSessionDataset() {
  if (SESSION_DATASET !== undefined) return SESSION_DATASET;
  try {
    return window.sessionStorage.getItem(DATASET_KEY) ?? undefined;
  } catch {
    return undefined;
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
// Platform-aware shortcut label: the handler matches the PHYSICAL KeyT
// with the modifier, which macOS calls Option — so the hint must say
// "⌥T" there, not "Alt+T" (Ali, 22 Jul).
const SHORTCUT_LABEL =
  typeof navigator !== "undefined" &&
  /Mac|iP(hone|ad|od)/.test(navigator.platform ?? navigator.userAgent ?? "")
    ? "⌥T"
    : "Alt+T";

// Named LOOK presets — one-click bundles of the shell knobs (Ali, 22
// Jul: "defaults… maybe a dropdown in the header"). "current" = the
// screen's AUTHORED props (clears look overrides, keeps any session
// dataset). Values are look knobs only — retune them here and every
// screen's preset follows.
// Header band breathing room (tweaker: Header → Space). Values are the
// band's own padding; px stays the DS content inset on both.
export const HEADER_SPACES = {
  default: "px-6 pt-6 pb-4",
  spacious: "px-6 pt-10 pb-8",
};

export const LOOK_PRESETS = {
  // Today's canonical look: subtle flush sidebar, white band, white
  // cards on the softest canvas.
  "subtle-depth": {
    sidebarTone: "subtle",
    sidebarFrame: "flush",
    sidebarShadow: "none",
    navDensity: "compact",
    stickyHeader: true,
    headerSurface: "white",
    pageLayers: "white",
    pageBackground: "subtle",
  },
  // Heavy Depth (Ali's settings, 22 Jul): muted depth-step sidebar,
  // brand-dark band, white cards on the muted canvas. The dark band
  // gets the SPACIOUS header air (Ali, 23 Jul) — a coloured band wants
  // more breathing room than the default white one.
  "heavy-depth": {
    sidebarTone: "muted",
    sidebarFrame: "flush",
    sidebarShadow: "none",
    navDensity: "compact",
    stickyHeader: true,
    headerSurface: "brand-dark",
    headerSpace: "spacious",
    pageLayers: "white",
    pageBackground: "muted",
  },
  // Live Site (Ali's settings, 22 Jul): mirrors the real BrightLocal
  // product — attached in-flow sidebar, the large nav, no header band,
  // outline cards on the soft canvas.
  "live-site": {
    sidebarTone: "default",
    sidebarFrame: "attached",
    sidebarShadow: "none",
    navDensity: "expansive",
    stickyHeader: false,
    headerSurface: "none",
    pageLayers: "outline",
    pageBackground: "subtle",
  },
};
const PRESET_LABELS = {
  current: "Current",
  "subtle-depth": "Subtle Depth",
  "heavy-depth": "Heavy Depth",
  "live-site": "Live Site",
};

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
  // Knobs GROUPED by the surface they affect (Ali, 22 Jul): everything
  // sidebar-ish together, everything header-ish together, then page +
  // data. `display` renames a stored value for the UI only — the prop
  // value is unchanged (sidebarShadow "frame" READS as "auto": it means
  // "defer to the frame preset", which on floating equals sm and on
  // flush equals none — that's why it looked like a duplicate).
  const GROUPS = [
    {
      title: "Sidebar",
      rows: [
        { key: "sidebarTone", label: "Tone", values: ["default", "white", "subtle", "muted", "dark", "brand", "brand-dark"] },
        { key: "sidebarFrame", label: "Frame", values: ["flush", "floating", "attached"] },
        { key: "sidebarShadow", label: "Shadow", values: ["frame", "none", "sm", "md", "lg"], display: { frame: "auto" } },
        // The flush depth model's content-edge shadow (Ali, 24 Jul).
        { key: "seamShadow", label: "Seam shadow", values: [true, false] },
        { key: "navDensity", label: "Nav density", values: ["compact", "comfortable", "expansive"] },
      ],
    },
    {
      title: "Header",
      rows: [
        { key: "headerSurface", label: "Surface", values: ["none", "white", "subtle", "dark", "brand", "brand-dark"] },
        { key: "headerSpace", label: "Space", values: ["default", "spacious"] },
        { key: "headerBorder", label: "Border", values: [true, false] },
        { key: "stickyHeader", label: "Sticky", values: [true, false] },
      ],
    },
    {
      title: "Page",
      rows: [
        // pageLayers is REALLY the card treatment — labelled accordingly.
        // outline = transparent + border; subtle = tinted; white =
        // elevated white. ("default"/"raised" remain valid authored
        // values; raised = white cards + tinted canvas, the legacy
        // combo.) (Ali, 22 Jul)
        { key: "pageLayers", label: "Cards", values: ["outline", "subtle", "white"] },
        { key: "pageBackground", label: "Background", values: ["auto", "white", "subtle", "muted"] },
      ],
    },
    {
      // Named datasets — flips the WHOLE interface's data live (account,
      // user, location, metrics) via a nested ProposalDataProvider in
      // AppLayoutShell. The meeting trick: open the tweaker, switch client.
      title: "Data",
      rows: [{ key: "dataset", label: "Dataset", values: ["default", ...Object.keys(DATASETS)] }],
    },
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
        <div className="w-96 rounded-xl border border-[var(--border)] bg-[light-dark(var(--ds-tailwind-colors-base-white),var(--ds-tailwind-colors-neutral-900))] p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-baseline gap-2">
              <span className="text-sm font-semibold">Shell tweaks</span>
              {/* Discoverability: the toggle shortcut, right where you
                  learn it (Ali, 22 Jul — it existed but nothing said so). */}
              <kbd className="rounded border border-[var(--border)] px-1 py-px font-mono text-[10px] text-muted-foreground">
                {SHORTCUT_LABEL}
              </kbd>
            </span>
            <span className="flex items-center gap-1">
              {/* Preset dropdown — applies a LOOK bundle; the session
                  dataset survives every preset switch. */}
              <select
                aria-label="Look preset"
                data-hook="tweaker-preset"
                value={(() => {
                  const look = Object.fromEntries(
                    Object.entries(tweaks).filter(([k]) => k !== "dataset"),
                  );
                  if (Object.keys(look).length === 0) return "current";
                  for (const [name, vals] of Object.entries(LOOK_PRESETS)) {
                    if (
                      Object.keys(vals).length === Object.keys(look).length &&
                      Object.entries(vals).every(([k, v]) => look[k] === v)
                    )
                      return name;
                  }
                  return "custom";
                })()}
                onChange={(e) => {
                  const name = e.target.value;
                  setTweaks((prev) => {
                    const keepData =
                      prev.dataset !== undefined ? { dataset: prev.dataset } : {};
                    if (name === "current") return keepData;
                    return { ...(LOOK_PRESETS[name] ?? {}), ...keepData };
                  });
                }}
                className="mr-1 rounded-md border border-[var(--border)] bg-transparent px-1.5 py-0.5 text-[11px]"
              >
                {Object.entries(PRESET_LABELS).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
                <option value="custom" disabled hidden>
                  Custom
                </option>
              </select>
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
                className="text-muted-foreground -mr-1 rounded-md px-1.5 py-0.5 text-sm leading-none transition-colors hover:bg-[light-dark(var(--ds-tailwind-colors-neutral-100),var(--ds-tailwind-colors-neutral-700))] hover:text-[light-dark(var(--ds-tailwind-colors-neutral-900),var(--ds-tailwind-colors-neutral-100))]"
              >
                {"×"}
              </button>
            </span>
          </div>
          {GROUPS.map((group) => (
            // Edge-to-edge rule above each GROUP (except the first —
            // the panel title already separates it); -mx-3/px-3 cancel
            // the panel padding (Ali, 22 Jul).
            <div
              key={group.title}
              className="-mx-3 mb-3 border-t border-[var(--border)] px-3 pt-2.5 first:border-t-0 first:pt-0 last:mb-0"
            >
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </p>
              {group.rows.map((row) => (
                <div key={row.key} className="mb-2.5 last:mb-0">
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="text-xs font-medium text-[light-dark(var(--ds-tailwind-colors-neutral-800),var(--ds-tailwind-colors-neutral-100))]">
                      {row.label}
                    </span>
                    {tweaks[row.key] !== undefined ? (
                      <span className="text-muted-foreground text-[11px]">tweaked</span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {row.values.map((v) => (
                      <button
                        key={String(v)}
                        onClick={() => set(row.key, v)}
                        className={
                          live[row.key] === v
                            ? "rounded-full bg-[light-dark(var(--ds-tailwind-colors-neutral-900),var(--ds-tailwind-colors-neutral-50))] px-2 py-0.5 text-[11px] text-[light-dark(white,var(--ds-tailwind-colors-neutral-900))] transition-colors hover:bg-[light-dark(var(--ds-tailwind-colors-neutral-700),var(--ds-tailwind-colors-neutral-200))]"
                            : "rounded-full bg-[light-dark(var(--ds-tailwind-colors-neutral-100),var(--ds-tailwind-colors-neutral-800))] px-2 py-0.5 text-[11px] text-[light-dark(var(--ds-tailwind-colors-neutral-600),var(--ds-tailwind-colors-neutral-300))] transition-colors hover:bg-[light-dark(var(--ds-tailwind-colors-neutral-200),var(--ds-tailwind-colors-neutral-600))] hover:text-[light-dark(var(--ds-tailwind-colors-neutral-900),var(--ds-tailwind-colors-neutral-50))]"
                        }
                      >
                        {v === true ? "on" : v === false ? "off" : (row.display?.[v] ?? v)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label={`Open shell tweaks (${SHORTCUT_LABEL})`}
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
  // Nav density — "compact" (the fitted look: 30px rows, 16px/1 icons),
  // "comfortable" (DS-ish: roomier rows, 20px/1.5 icons), or "expansive"
  // (the LIVE product's generous nav: ~48px rows, 15px labels, 20px
  // icons). Small vs large menus is a real product question (Ali) — so
  // it's a shell knob AND a tweaker row, via the --gds-nav-* variables.
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
  // The header band is shell-owned (a sibling of GlobalLayoutContent),
  // so this knob affects the BODY only; the band always spans the column.
  contentMaxWidth,
  // How the sidebar sits against the screen edge (desktop only — the
  // aside is hidden below lg). Presets in SIDEBAR_FRAMES.
  sidebarFrame = "floating", // "flush" | "floating" | "attached"
  // Sidebar drop shadow — overrides the frame's own. Presets in
  // SIDEBAR_SHADOWS. "frame" (default) defers to the frame preset.
  sidebarShadow = "frame", // "frame" | "none" | "sm" | "md" | "lg"
  // The flush depth model's seam shadow (CONTENT_SEAM_SHADOW), on the
  // content sheet's left edge. The DEPTH ORDER is not a knob — content
  // is always above on flush — but the shadow itself toggles (Ali, 24
  // Jul). Also a tweaker row (Sidebar → Seam shadow).
  seamShadow = true,
  // Optional 1px border around the sidebar container. Any CSS color —
  // tokens welcome: "var(--sidebar-border)", "var(--ds-tailwind-colors-neutral-200)".
  sidebarBorder,
  // Page-wide layer treatment — canvas + card surface. Presets in
  // PAGE_LAYERS. "raised" = green-grey canvas, white cards.
  pageLayers = "raised",
  // Canvas colour on its own — "auto" defers to the pageLayers preset;
  // white/subtle/muted re-point the page background independently of
  // the card treatment (tweaker: Page → Background). (Ali, 22 Jul)
  pageBackground = "auto", // "default" | "raised"
  // Named dataset (lib/data/*.json) — "default" renders PROPOSAL_DATA;
  // anything else wraps the shell in a nested ProposalDataProvider, so
  // it also OVERRIDES any provider a screen mounted outside. A tweaker
  // knob like the visual ones: authored here, overridable via Alt+T.
  // minus-one-studios by DEFAULT (Ali, 23 Jul) — the real captured
  // client is the baseline everywhere; "default" (the generic Joe
  // Bloggs data) remains available via the tweaker's Data row.
  dataset = "minus-one-studios",
  sidebar,
  header,
  // Header BAND background. The header spans the full content-area width
  // (edge-to-edge, right of the sidebar) while its CONTENT stays aligned
  // with the body; this className paints the band's surface. Default
  // (unset) = transparent → the page background shows through (no visible
  // change). Pass a bg utility (or a scope class) for a distinct header
  // surface — a future tweaker knob will drive it (Ali, 21 Jul).
  headerBackground,
  // Named band surface (HEADER_SURFACES preset): "none" | "white" |
  // "subtle" | "dark" | "brand". The canonical colour knob — dark
  // presets also flip the header's text tokens. Beats headerBackground
  // when set; also a tweaker row (Alt+T). (Ali, 21 Jul)
  headerSurface = "none",
  // Header band bottom border, independent of stickiness. Unset = auto
  // (border only while sticky — the band needs an edge when content
  // scrolls beneath it); true/false forces it on/off (Ali, 21 Jul).
  headerBorder,
  // Band breathing room: "default" | "spacious" — spacious roughly
  // doubles the vertical air for presentation looks. Also a tweaker
  // row (Header → Space). (Ali, 23 Jul.)
  headerSpace = "default",
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
  const authored = { sidebarTone, sidebarFrame, sidebarShadow, seamShadow, pageLayers, pageBackground, stickyHeader, headerBorder, headerSurface, headerSpace, dataset, navDensity };
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
  ({ sidebarTone, sidebarFrame, sidebarShadow, seamShadow, pageLayers, pageBackground, stickyHeader, headerBorder, headerSurface, headerSpace, dataset, navDensity } = {
    ...authored,
    ...tweaks,
  });

  const flushClasses = flush
    ? // Zero the baked padding for the desktop flush layout, but put a
      // uniform p-4 BACK below lg — the sidebar is hidden there and the
      // content column was hugging the screen edges on tablet/mobile.
      // Below lg the shell stays p-0 TOO — the old max-lg:p-4 inset the
      // full-bleed header band + mobile bar off the viewport edges
      // (Ali, 23 Jul screenshot). Body gutters below lg live on the DS
      // content-wrapper instead, px-6 to MATCH the band's inner inset —
      // band text and card edges share one measure at every width.
      "[&>[data-radix-scroll-area-viewport]]:p-0! [&_[data-slot=app-layout-shell]]:p-0! [&_[data-slot=content-wrapper]]:max-lg:px-6!"
    : "";
  const frame = SIDEBAR_FRAMES[sidebarFrame] ?? SIDEBAR_FRAMES.flush;
  // "attached" lives with the content — never viewport-pinned, whatever
  // pinnedSidebar says (the pin is what detaches it in the first place).
  const pinned = pinnedSidebar && sidebarFrame !== "attached";
  const shadowOverride = SIDEBAR_SHADOWS[sidebarShadow] ?? null;
  const frameClasses =
    shadowOverride === null
      ? frame.classes
      : [frame.classes.replace(/\bshadow-\w+\b/g, "").trim(), shadowOverride]
          .filter(Boolean)
          .join(" ");
  // Pinned/flush sidebars get a border BY DEFAULT — without a containing
  // edge the horizontal rules float on the page. Floating frames have
  // their own boundary (radius + lift); ATTACHED is borderless (it lives
  // with the content — Ali, 21 Jul). Explicit sidebarBorder overrides.
  const borderColor =
    sidebarBorder ??
    (sidebarFrame === "flush" ? "var(--sidebar-border)" : undefined);
  const tone = SIDEBAR_TONES[sidebarTone] ?? {};
  // Density presets re-point the --gds-nav-* variables the shell's
  // scoped <style> consumes; compact = the CSS defaults (empty).
  // Density presets re-point the --gds-nav-* variables the shell's
  // scoped <style> consumes; "compact" = the CSS defaults (empty).
  // "expansive" mirrors the LIVE BrightLocal nav's generous rhythm
  // (~48px rows, 15px labels, 20px icons — Ali, 21 Jul).
  const NAV_DENSITIES = {
    compact: {},
    comfortable: {
      "--gds-nav-row-py": "8px",
      "--gds-nav-sub-py": "7px",
      "--gds-nav-icon-size": "20px",
      "--gds-nav-icon-stroke": "1.5",
    },
    expansive: {
      "--gds-nav-font-size": "0.9375rem",
      "--gds-nav-row-py": "14px",
      "--gds-nav-sub-py": "10px",
      "--gds-nav-sub-pl": "24px",
      "--gds-nav-icon-size": "20px",
      "--gds-nav-icon-stroke": "1.5",
    },
  };
  const navVars = NAV_DENSITIES[navDensity] ?? {};
  const layers = {
    ...(PAGE_LAYERS[pageLayers] ?? {}),
    // Background override wins over the layers preset's canvas colour.
    ...(PAGE_BACKGROUNDS[pageBackground] ?? {}),
  };
  // Raised layers: cards are WHITE (the layer re-points --card) with
  // base/border (semantic --border → neutral-200 #E6EDE8, .dark flips
  // it) and NO shadow — matches their Figma, where card elevation is
  // border-only. NEEDED because the DS's own card-border token is
  // TRANSPARENT (filled cards ship borderless — rules/90-audit.md).
  // Shadows stay a SIDEBAR treatment. Scoped <style> because
  // border-color can't ride the --card token swap.
  const layerCss =
    pageLayers !== "default"
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
      maxWidth={pinned && flush ? "none" : undefined}
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
      {/* DARK-FENCE BRIDGE: BL's `.dark` block re-points the RAW tokens
          (--foreground …), but compiled utilities read the --color-*
          bridge, which the theme defines AT :ROOT — where var() resolves
          against the ROOT (light) values, ignoring a mid-tree .dark
          fence (same gotcha as the sidebar tones' --color-* doubles).
          Re-declaring the bridge INSIDE .dark scope makes every fenced
          subtree resolve its own dark tokens — one universal mapping,
          mirroring BL's .dark token list, instead of hand-rolling
          per-surface (Ali, 22 Jul: unreadable "Add Client"). */}
      <style>{".dark{--color-background:var(--background);--color-foreground:var(--foreground);--color-card:var(--card);--color-card-foreground:var(--card-foreground);--color-card-border:var(--card-border);--color-popover:var(--popover);--color-popover-foreground:var(--popover-foreground);--color-primary:var(--primary);--color-primary-foreground:var(--primary-foreground);--color-secondary:var(--secondary);--color-secondary-foreground:var(--secondary-foreground);--color-muted:var(--muted);--color-muted-foreground:var(--muted-foreground);--color-accent:var(--accent);--color-accent-foreground:var(--accent-foreground);--color-destructive:var(--destructive);--color-destructive-foreground:var(--destructive-foreground);--color-border:var(--border);--color-input:var(--input);--color-ring:var(--ring);--color-ring-offset:var(--ring-offset);--color-link:var(--link);--color-link-visited:var(--link-visited);--color-outline:var(--outline);--color-brand-primary-foreground:var(--brand-primary-foreground);--color-destructive-20:var(--destructive-20);--color-destructive-40:var(--destructive-40);--color-success-background:var(--success-background);--color-success-foreground:var(--success-foreground);--color-info-background:var(--info-background);--color-info-foreground:var(--info-foreground);--color-warning-background:var(--warning-background);--color-warning-foreground:var(--warning-foreground);--color-chart-1:var(--chart-1);--color-chart-2:var(--chart-2);--color-chart-3:var(--chart-3);--color-chart-4:var(--chart-4);--color-chart-5:var(--chart-5);--color-sidebar-background:var(--sidebar-background);--color-sidebar-foreground:var(--sidebar-foreground);--color-sidebar-primary:var(--sidebar-primary);--color-sidebar-primary-foreground:var(--sidebar-primary-foreground);--color-sidebar-accent:var(--sidebar-accent);--color-sidebar-accent-foreground:var(--sidebar-accent-foreground);--color-sidebar-border:var(--sidebar-border);--color-sidebar-ring:var(--sidebar-ring);--color-loading-gradient-from:var(--loading-gradient-from);--color-loading-gradient-to:var(--loading-gradient-to);--color-alpha-5:var(--alpha-5);--color-alpha-10:var(--alpha-10);--color-alpha-20:var(--alpha-20);--color-alpha-30:var(--alpha-30);--color-alpha-40:var(--alpha-40);--color-alpha-50:var(--alpha-50);--color-alpha-60:var(--alpha-60);--color-alpha-70:var(--alpha-70);--color-alpha-80:var(--alpha-80);--color-alpha-90:var(--alpha-90)}"}</style>
      {/* CLICKABLE-LINK TOKENS — the one definition site for the
          --bl-card-link seam clickable text reads (inline Learn/Read
          more links, accordion action rows). Base green-800 (#006918) —
          ASSUMPTION (Ali, 22 Jul: "nudge the link colour greener" from
          green-950; 900 is a near-invisible step, 800 is the visible
          nudge; go 700 if it should be greener still).
          CARD TITLES NO LONGER HOVER-GREEN (Ali, 24 Jul: the green
          link hover "looks unfinished" — another designer's
          suggestion, removed). A clickable card's affordance is the
          DrillArrow button moving to its hover state + a card shadow
          (see the hub screen's group/group-hover pattern). The
          accordion rows keep their own hover rules below. Unlayered
          CSS beats the utility classes. */}
      {/* CARD PADDING — the one place to tune it (Ali, 22 Jul: "change
          it in one place"). DS default-density cards read the
          RESPONSIVE section tokens (16px base / 24px ≥1024 / 32px
          ≥1280); re-declaring them SCOPED to [data-slot=card] caps the
          top step at 24px without touching other section-md consumers
          (GlobalLayout etc.) or condensed cards (px-3/py-3 literals).
          The BL sheet has no Tailwind --spacing var to point at, so
          the values mirror the DS's own px steps. Vars inherit into
          CardHeader/CardContent, which carry the px utilities. */}
      <style>{
        ":root{--bl-card-link:var(--ds-tailwind-colors-green-800);--bl-card-link-hover:var(--ds-tailwind-colors-green-700)}" +
        "[data-bl-link]{transition:color 120ms ease}" +
        /* NO generic [data-bl-link]:hover colour rule any more — card
           titles stay put on hover (Ali, 24 Jul); the accordion row
           rule below is the only hover recolour left. */
        "[data-slot=accordion-trigger]:hover [data-bl-link]{color:var(--bl-card-link-hover,var(--ds-tailwind-colors-green-700))}" +
        /* The trigger's own hover:underline decorates in the TRIGGER's
           colour (dark foreground) while the label sits in link green —
           a mismatched underline (Ali, 23 Jul). Match the decoration to
           the hovered label colour. */
        "[data-slot=accordion-trigger]:hover{text-decoration-color:var(--bl-card-link-hover,var(--ds-tailwind-colors-green-700))}" +
        /* Chevron follows the row (Ali, 22 Jul): the DS trigger bakes a
           muted ChevronDown (stroke = currentColor), so colour is ours
           to set. ASSUMPTION: rest stays DS-muted for hierarchy; hover
           joins the label at green-700. Make it green-800 always by
           adding a non-:hover rule here. transition keeps the DS's
           rotate AND eases the colour. */
        "[data-slot=accordion-trigger]>svg{transition:transform 200ms,color 120ms ease}" +
        "[data-slot=accordion-trigger]:hover>svg{color:var(--bl-card-link-hover,var(--ds-tailwind-colors-green-700))}" +
        /* ILLUSTRATION TINT SEAM — @brightlocal/illustrations bakes its
           palette as fill ATTRIBUTES (ink #111412, accent #2AE855,
           paper #FFFEFD); CSS beats presentation attributes, so a
           [data-bl-illo-tint] wrapper re-points each role via custom
           props (StatusBanner tints the robot to its band this way —
           the mock's monochrome maroon robot). Unset props fall back
           to the original palette. */
        "[data-bl-illo-tint] svg [fill='#111412']{fill:var(--bl-illo-ink,#111412)}" +
        "[data-bl-illo-tint] svg [fill='#2AE855']{fill:var(--bl-illo-accent,#2AE855)}" +
        "[data-bl-illo-tint] svg [fill='#FFFEFD']{fill:var(--bl-illo-paper,#FFFEFD)}" +
        "[data-slot=card]{--ds-section-padding-x-md:16px;--ds-section-padding-y-md:16px}" +
        "@media (min-width:1024px){[data-slot=card]{--ds-section-padding-x-md:24px;--ds-section-padding-y-md:24px}}"
      }</style>
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
          ...(pinned && flush
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
      {/* OUR content column (Ali, 21 Jul: "we control it directly" — no
          more negative-margin hacks against DS classes). The header band
          is a SIBLING of GlobalLayoutContent, so it spans the column
          edge-to-edge BY CONSTRUCTION; the DS's padded content wrapper
          only wraps the page body. PageHeader's `align` still owns where
          the content lands inside the band ("center" = capped + centred,
          matching the body; "justify" = fills it).
          FLUSH DEPTH MODEL: the content sheet is always above the
          sidebar, casting CONTENT_SEAM_SHADOW onto it — see the
          constant's comment for the full mechanics + rationale. */}
      <div
        className={[
          "flex min-w-0 flex-1 flex-col",
          sidebarFrame === "flush" ? "relative" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={
          sidebarFrame === "flush" && seamShadow
            ? { boxShadow: CONTENT_SEAM_SHADOW }
            : undefined
        }
      >
        {mobileBar ? (
          // The mobile bar rides the SAME surface as the header band
          // (Ali, 23 Jul): this wrapper paints HEADER_SURFACES
          // [headerSurface] — class (incl. the .dark fence) + style —
          // so background, text, the hamburger AND the Logo all follow
          // the band with zero per-screen wiring. (The Logo is pure
          // currentColor on the brand-primary-foreground token, and the
          // dark fence re-points that token, so it flips itself.)
          <div
            data-hook={`${dataHook}-mobilebar-surface`}
            className={["lg:hidden", HEADER_SURFACES[headerSurface]?.className ?? ""]
              .filter(Boolean)
              .join(" ")}
            style={HEADER_SURFACES[headerSurface]?.style}
          >
            {mobileBar}
          </div>
        ) : null}
        {header ? (
          <header
            data-hook={`${dataHook}-header`}
            className={[
              // Same inset as the DS content wrapper (px-section-xs =
              // 24px), so the band's inner measure lines up with the
              // body without any width games. Vertical air comes from
              // the headerSpace preset (tweaker: Header → Space);
              // ASSUMPTION (Ali to verify): spacious = pt-10/pb-8,
              // roughly double the default — tune HEADER_SPACES.
              HEADER_SPACES[headerSpace] ?? HEADER_SPACES.default,
              // z-30: shell chrome must beat PAGE z-indexes (screens
              // use up to z-20 — the LSG map painted over the header at
              // z-10, 16 Jul) while staying under the tweaker (z-50).
              stickyHeader ? "sticky top-0 z-30" : "",
              // Border: explicit headerBorder wins; unset = auto (border
              // while sticky, since content scrolls beneath the band).
              (headerBorder ?? stickyHeader) ? "border-b" : "",
              // Band surface: a named headerSurface preset wins (style
              // below carries bg + text tokens); else headerBackground
              // (custom class escape hatch); else the sticky default
              // (bg-background ≈ page bg); else transparent.
              !HEADER_SURFACES[headerSurface]
                ? headerBackground || (stickyHeader ? "bg-background" : "")
                : "",
              // Dark surfaces fence the band with the DS's .dark scope.
              HEADER_SURFACES[headerSurface]?.className ?? "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={HEADER_SURFACES[headerSurface]?.style}
          >
            {header}
          </header>
        ) : null}
        <GlobalLayoutContent
          dataHook={`${dataHook}-content`}
          maxWidth={contentMaxWidth}
          // Vertical breathing room for the page body — the flush shell
          // cancels the DS's outer padding, which left content sitting
          // hard against the header band (Ali, 21 Jul). Top is modest
          // (the band carries pb-4); the bottom covers the "no padding
          // at bottom of page" snag for every screen at once.
          className="pt-6 pb-12"
        >
          {children}
        </GlobalLayoutContent>
      </div>
    </GlobalLayout>
  );
  // Named dataset (authored prop or live tweak) — nested provider wins
  // over both the module default AND any provider the screen mounted
  // outside, which is exactly what a demo switch should do. "default"
  // mounts nothing, so an outer provider (or the defaults) shows through.
  // Dataset priority: explicit tweaker Data row > session-selected
  // (location-card click) > authored prop.
  const effectiveDataset =
    tweaks?.dataset !== undefined ? dataset : (loadSessionDataset() ?? dataset);
  return effectiveDataset && effectiveDataset !== "default" ? (
    <ProposalDataProvider dataset={effectiveDataset}>{shell}</ProposalDataProvider>
  ) : (
    shell
  );
}

