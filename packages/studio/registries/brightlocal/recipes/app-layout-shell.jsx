// AppLayoutShell — Composable app-shell wrapper: cancels GlobalLayout's baked-in padding and exposes sticky-header / pinned-sidebar / sidebar-tone options as props.
// keywords: app shell, layout shell, layout options, sticky header, pinned sidebar, sidebar color, sidebar tone, flush layout, remove padding, composable layout, edge to edge
// components: global-layout, sidebar, scroll-area
// Hand-authored (July 2026, layout explorations) — NOT harvested; the
// recipe harvester does not touch this file.
//
// WHY THIS EXISTS (see rules/90-audit.md): GlobalLayout bakes
// `p-section-sm` into its inner div as a string literal (no cn() merge)
// and ScrollArea hardcodes `p-1` on its viewport — neither is
// prop-overridable, and the padding blocks sticky headers and
// edge-locked sidebars. Screens are self-contained single-file JSX, so
// this shell is defined IN-FILE (user-land component), never imported.
// Copy the whole function into the screen and compose with it.

import {
  GlobalLayout,
  GlobalLayoutContent,
  GlobalLayoutContentHeader,
  GlobalLayoutSidebar,
} from "@brightlocal/ui-components";

// Sidebar tones are pure CSS-variable swaps — the Sidebar compounds
// paint from --sidebar-* tokens, so re-pointing them on the container
// re-skins every descendant without touching component internals.
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

const SIDEBAR_TONES = {
  default: {},
  // Pure white panel — pairs with pageLayers "raised" (white nav +
  // white cards on the green-grey canvas) and the flush frame's
  // default border.
  white: sidebarTone(
    "var(--ds-tailwind-colors-base-white)",
    "var(--ds-tailwind-colors-neutral-600)",
    "var(--ds-tailwind-colors-neutral-100)",
    "var(--ds-tailwind-colors-neutral-900)",
    "var(--ds-colors-sidebar-border-light)",
  ),
  // The grey/green light version: BL's neutral ramp IS green-tinted
  // (#f2f7f3 etc.), so neutral-100 on the neutral-50 page reads as a
  // subtle brand-adjacent panel rather than plain grey.
  subtle: sidebarTone(
    "var(--ds-tailwind-colors-neutral-100)",
    "var(--ds-tailwind-colors-neutral-600)",
    "var(--ds-tailwind-colors-neutral-200)",
    "var(--ds-tailwind-colors-neutral-900)",
    "var(--ds-colors-sidebar-border-light)",
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
    backgroundColor: "var(--ds-tailwind-colors-neutral-50)",
    "--background": "var(--ds-tailwind-colors-neutral-50)",
    "--color-background": "var(--ds-tailwind-colors-neutral-50)",
    "--card": "var(--ds-tailwind-colors-base-white)",
    "--color-card": "var(--ds-tailwind-colors-base-white)",
    "--muted": "var(--ds-tailwind-colors-neutral-100)",
    "--color-muted": "var(--ds-tailwind-colors-neutral-100)",
  },
};

function AppLayoutShell({
  // Cancel the DS's baked-in p-section-sm + viewport p-1. Arbitrary
  // variants from GlobalLayout's outer ScrollArea (where className
  // lands) reach both hardcoded nodes — no custom.css needed.
  flush = true,
  // Header sticks to the top of the scroll viewport (needs flush,
  // otherwise it sticks 24px down inside the padding).
  stickyHeader = false,
  // Sidebar locked to the viewport edge, full height. The DS default
  // offsets it by --ds-section-padding-y-sm, which is wrong once flush.
  pinnedSidebar = true,
  sidebarTone = "white", // "default" | "white" | "subtle" | "dark" | "brand"
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
  dataHook = "app-layout",
}) {
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
  // Tinted layers earn the floating-panel card treatment page-wide:
  // filled cards are already WHITE (the layer re-points --card) — the
  // shadow lifts them off the near-white canvas, same as the floating
  // sidebar frame. Border softens to the light hairline. Scoped <style>
  // because a box-shadow can't ride a token swap.
  const layerCss =
    pageLayers === "raised"
      ? `[data-slot="card"]{box-shadow:0 1px 3px 0 rgb(0 0 0/0.06),0 1px 2px -1px rgb(0 0 0/0.06);border-color:var(--ds-tailwind-colors-neutral-100)}`
      : "";
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
      {mobileToneCss || layerCss ? <style>{mobileToneCss + layerCss}</style> : null}
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

// Usage — knobs are plain props, so a screen can demo variants by
// flipping a single object:
// <SidebarProvider dataHook="provider" defaultOpen>
//   <AppLayoutShell
//     flush
//     stickyHeader
//     pinnedSidebar
//     sidebarTone="dark"
//     sidebar={<Sidebar dataHook="app-sidebar">…</Sidebar>}
//     header={<TypographyH2>Page title</TypographyH2>}
//   >
//     <GlobalLayoutContentBody dataHook="page-body">…</GlobalLayoutContentBody>
//   </AppLayoutShell>
// </SidebarProvider>
