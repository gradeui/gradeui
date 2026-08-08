"use client";

/**
 * SharedScreen — the read-only render behind a /s/<token> share link.
 *
 * Reuses the exact same iframe renderer as Studio (FastIframeHost), so a
 * shared screen looks identical to the editor — same components, same
 * compile path, same theme.
 *
 * The Grade share toolbar carries the brand + a live theme / light-dark
 * switcher: the viewer can flip the SAME screen through different
 * treatments instantly (the renderer re-skins on a theme prop change,
 * no reload). Hide it all with `.` for a clean full-bleed view. This is
 * the "controls" shelf that'll grow more tweakers over time.
 */

import * as React from "react";
import * as ReactDOM from "react-dom";
import {
  Sun,
  Moon,
  PanelTopClose,
  PanelTopOpen,
  ChevronDown,
  Check,
  MessageSquare,
  X,
  Send,
  Maximize,
  Smartphone,
  Tablet,
  Monitor,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";
import { CanvasCommentPinsOverlay } from "@/components/studio/canvas-comment-pins-overlay";
import { FastIframeHost } from "@/components/studio/fast-frame";
import { ExternalIframeHost } from "@/components/studio/external-ds-frame";
import { getActiveRegistry, getRegistryById } from "@/lib/active-registry";
import { setProjectPreviewCss } from "@/lib/project-preview-css";
import { tagTypeColor } from "@/lib/studio-view-prefs";

// Viewer-side Arrange (group-by in the compare row) — built, then
// benched as half-baked pending the compare-row polish pass (#22).
const ARRANGE_ENABLED = false;
import { GradeLogo } from "@/components/grade-logo";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type {
  CommentThreadWithMessages,
  ShareViewportSpec,
} from "@/lib/studio-storage";
import {
  getStudioStorage,
  SHARE_VIEWPORT_PRESETS,
  shareViewportSize,
} from "@/lib/studio-storage";
import type { User } from "@/lib/studio-users";
import { useSupabaseAuth } from "@/components/supabase-provider";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@gradeui/ui";
import {
  generateTheme,
  builtInThemes,
  defaultThemeId,
  listThemes,
} from "@/lib/themes";
import type { ThemeInput, GeneratedTheme } from "@/lib/themes";
import { cn } from "@/lib/utils";
import {
  useArtboardZoom,
  ZOOM_MAX,
  ZOOM_MIN,
} from "@/components/studio/use-artboard-zoom";
import { ZoomControl } from "@/components/studio/zoom-control";

/** Viewports are SPECS now (named, arbitrary W×H, orientation, any
 *  count) — see ShareViewportSpec in lib/studio-storage. The classic
 *  four presets are just the default spec set; icons are picked by
 *  width heuristic so custom sizes get a sensible glyph too. */
function iconForSpec(spec: ShareViewportSpec): typeof Maximize {
  if (spec.responsive) return Maximize;
  const size = shareViewportSize(spec);
  if (!size) return Maximize;
  const portraitW = Math.min(size.w, size.h);
  if (portraitW < 600) return Smartphone;
  if (portraitW < 1100) return Tablet;
  return Monitor;
}
function specDims(spec: ShareViewportSpec): string | null {
  const size = shareViewportSize(spec);
  return size ? `${size.w}×${size.h}` : null;
}

/** Mini swatch for the theme menu. Shows the BRAND colours (primary +
 *  accent) and skips the neutral stop — including grey made every chip
 *  read muted regardless of how bold the theme actually is. */
function ThemeSwatch({ theme }: { theme: GeneratedTheme }) {
  return (
    <span
      className="flex h-4 shrink-0 items-center overflow-hidden rounded-sm border border-border/60"
      aria-hidden
    >
      <span className="h-full w-2.5" style={{ background: `oklch(${theme.ramps.primary[600]})` }} />
      <span className="h-full w-2.5" style={{ background: `oklch(${theme.ramps.accent[500]})` }} />
    </span>
  );
}

export function SharedScreen({
  appSource,
  sharedModules = null,
  themeDraftJson,
  mode: initialMode = "light",
  viewportSpecs,
  initialViewportId,
  screenName = "Screen",
  projectName = "Untitled project",
  canComment = false,
  commentThreads = [],
  commentUsers = [],
  registryId = null,
  projectCss = "",
  flowScreens,
  scoped = false,
  scopeLabel,
  scopeTagType,
  entryDesignId,
  shareToken,
  initialChromeHidden = false,
  initialFit = false,
}: {
  appSource: string | null;
  /** Project shared components ({name → JSX module source}). */
  sharedModules?: Readonly<Record<string, string>> | null;
  themeDraftJson: string | null;
  mode?: "light" | "dark";
  /** The viewports this share EXPOSES, in menu order — the creator's
   *  toggles (named / arbitrary W×H / orientation / any count). A
   *  single entry collapses the device menu to a locked badge.
   *  Omitted/empty = the classic four presets. */
  viewportSpecs?: ShareViewportSpec[];
  /** Which spec the share opens on. Clamped into the set. */
  initialViewportId?: string;
  screenName?: string;
  projectName?: string;
  canComment?: boolean;
  commentThreads?: CommentThreadWithMessages[];
  commentUsers?: User[];
  /** The share's PROJECT registry id (projects.registry_id), resolved
   *  server-side by /s/[token]. null = deployment default. */
  registryId?: string | null;
  /** The project's CSS overrides (enabled .css rules files), resolved
   *  server-side by /s/[token]. Seeded into the preview-css store so
   *  both frame hosts inject it — the share renders what the creator
   *  sees (e.g. custom.css patches over a client DS). */
  projectCss?: string;
  /** Flow map (STUDIO-FLOWS) — every screen in the share's project, in
   *  canvas order, resolved server-side by /s/[token]. Navigation is
   *  history-shaped: a click on an author-wired [data-grade-goto]
   *  element resolves against this list and pushes onto an in-memory
   *  stack; Back (chip / Escape) pops. The token stays the address of
   *  the FLOW, not the position — no URL change. */
  flowScreens?: {
    id: string;
    name: string;
    appSource: string | null;
    /** Member tags (STUDIO-TAGS) — feed the compare row's viewer-side
     *  group-by. Absent on older payloads; everything degrades. */
    tags?: { type: string; value: string; order?: number }[];
  }[];
  /** True when the share is SCOPED to a screen set (STUDIO-TAGS T2:
   *  share a tag / share these N). Scoped shares open on the COMPARE
   *  ROW — every member side by side as live panes on the camera
   *  canvas; clicking a pane focuses it (pushes the flow stack, so
   *  Back returns to the row). flowScreens is already filtered to
   *  members server-side. */
  scoped?: boolean;
  /** Human name for the scope — the tag VALUE exactly as typed
   *  ("White VS Black", "proposal-walkthrough") or "N screens". */
  scopeLabel?: string;
  /** The scope tag's TYPE — colour only (chart-ramp facet accent),
   *  never viewer copy. */
  scopeTagType?: string;
  /** The entry screen's design id — scopes the single-view pins to the
   *  entry (threads may span every member on scoped shares). */
  entryDesignId?: string | null;
  /** The share's URL token — the capability the viewer-pin route
   *  validates. Present = signed-in viewers can CREATE pins. */
  shareToken?: string;
  /** ?fullscreen=1 — open with the chrome hidden (the "." toggle's
   *  state; "." still brings it back). Server-parsed by /s/[token]. */
  initialChromeHidden?: boolean;
  /** ?fullscreen=1 — seed Fit so a device-viewport flip lands scaled
   *  to the window instead of 100%. */
  initialFit?: boolean;
}) {
  // Seed the preview-css store BEFORE the frame hosts push source —
  // Studio's page-level effect does this in the editor; the share view
  // has no studio page, so it seeds from the server-resolved prop.
  React.useEffect(() => {
    setProjectPreviewCss(projectCss);
  }, [projectCss]);

  // ─── Flow navigation (STUDIO-FLOWS F0) ────────────────────────────
  // History, not a sitemap: an in-memory stack of visited screens.
  // Empty stack = the share's own screen (the entry the token names).
  // A click on an author-wired [data-grade-goto] element resolves
  // against the flow map and pushes; Back (chip / Escape) pops. The URL
  // never changes — the token stays the address of the flow, not the
  // position — but each push ALSO adds a same-URL history entry stamped
  // with the flow depth, so the BROWSER back button pops the flow
  // exactly like the chip (snag, Ali 22 Jul: "make the actual browser
  // back button work"). Forward re-walks the remembered path.
  const [flowStack, setFlowStack] = React.useState<
    { id: string; appSource: string }[]
  >([]);
  // The full visited line (survives pops) — lets the FORWARD button
  // restore entries the popstate handler sliced off.
  const flowPathRef = React.useRef<{ id: string; appSource: string }[]>([]);
  // Live mirror of flowStack.length so event handlers can stamp history
  // WITHOUT side effects inside the state updater (StrictMode runs
  // updaters twice in dev — a pushState in there duplicated entries and
  // made the first Back press a no-op).
  const flowDepthRef = React.useRef(0);
  React.useEffect(() => {
    flowDepthRef.current = flowStack.length;
  }, [flowStack]);
  const flowTop = flowStack.length > 0 ? flowStack[flowStack.length - 1] : null;
  // currentSource feeds BOTH renderer branches below — navigation is
  // just "source push with a different screen" (swap is what every
  // surface already does when source changes).
  const currentSource = flowTop ? flowTop.appSource : appSource;
  // The header names the CURRENT screen (STUDIO-FLOWS "Showing the
  // flow") — look the visited screen up in the map, fall back to the
  // entry's name if the row went missing.
  const currentScreenName = flowTop
    ? (flowScreens?.find((s) => s.id === flowTop.id)?.name ?? screenName)
    : screenName;
  const resolveGoto = React.useCallback(
    (target: string) => {
      const t = target.trim();
      if (!t) return;
      // "screen:<id>" pins exactly (ids survive renames); anything else
      // is a screen NAME, matched case-insensitively after trimming —
      // the authoring ergonomic (see STUDIO-FLOWS.md "wire contract").
      const match = t.toLowerCase().startsWith("screen:")
        ? flowScreens?.find((s) => s.id === t.slice("screen:".length))
        : flowScreens?.find(
            (s) => s.name.trim().toLowerCase() === t.toLowerCase(),
          );
      if (!match || !match.appSource) {
        // Unresolvable targets no-op with a warn — never a broken screen.
        // eslint-disable-next-line no-console
        console.warn(
          `[flows] goto target "${target}" did not resolve to a screen`,
        );
        return;
      }
      const src = match.appSource;
      const entry = { id: match.id, appSource: src };
      // Side effects OUT here (never in the updater — StrictMode runs
      // updaters twice): truncate any forward branch, record the new
      // line, and mirror the depth into a same-URL history entry
      // (spread the existing state so Next's router entries survive).
      const nextDepth = flowDepthRef.current + 1;
      flowPathRef.current = [
        ...flowPathRef.current.slice(0, flowDepthRef.current),
        entry,
      ];
      try {
        // Stamp the CURRENT entry lazily before pushing — the mount
        // effect's replaceState loses a race with Next's router, which
        // re-stamps history.state during hydration; push time is after
        // all that, so this marker sticks.
        if (typeof window.history.state?.blFlowDepth !== "number") {
          window.history.replaceState(
            { ...(window.history.state ?? {}), blFlowDepth: flowDepthRef.current },
            "",
          );
        }
        window.history.pushState(
          { ...(window.history.state ?? {}), blFlowDepth: nextDepth },
          "",
        );
      } catch {
        /* history unavailable (SSR/sandboxed) — chip/Esc still work */
      }
      flowDepthRef.current = nextDepth;
      setFlowStack((prev) => [...prev, entry]);
    },
    [flowScreens],
  );
  const popFlow = React.useCallback(() => {
    // Route through real history so the browser's own back/forward and
    // the chip stay one system: back() fires popstate, and THAT handler
    // slices the stack. Direct-slice fallback if our depth marker is
    // missing (history unavailable or an un-stamped entry).
    if (
      typeof window !== "undefined" &&
      typeof window.history.state?.blFlowDepth === "number" &&
      window.history.state.blFlowDepth > 0
    ) {
      window.history.back();
      return;
    }
    setFlowStack((prev) => prev.slice(0, -1));
  }, []);
  // Depth 0 marker for the entry the share opened on + the popstate
  // bridge: browser Back lands on a lower-depth entry → slice to it;
  // Forward lands on a higher one → restore from the remembered path.
  React.useEffect(() => {
    try {
      if (typeof window.history.state?.blFlowDepth !== "number") {
        window.history.replaceState(
          { ...(window.history.state ?? {}), blFlowDepth: 0 },
          "",
        );
      }
    } catch {
      /* ignore */
    }
    const onPopState = (e: PopStateEvent) => {
      const depth = (e.state as { blFlowDepth?: number } | null)?.blFlowDepth;
      if (typeof depth !== "number") return;
      setFlowStack((prev) => {
        if (depth < prev.length) return prev.slice(0, depth);
        if (depth > prev.length && flowPathRef.current.length >= depth)
          return flowPathRef.current.slice(0, depth);
        return prev;
      });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  // External-renderer iframe — the comment-pins overlay reads its
  // contentDocument (same-origin) to anchor pins by data-gds-source-id.
  const extIframeRef = React.useRef<HTMLIFrameElement | null>(null);
  // F1 "instant linkage": the OTHER flow screens' sources, forwarded to
  // the external host as ext:precompile so the sandbox warms its compile
  // cache during idle time and a goto swap is paint-only. Only worth the
  // message when the project actually has siblings (2+ screens); the
  // currently rendered source is excluded (render() caches it anyway).
  const precompileSources = React.useMemo<string[] | undefined>(() => {
    if (!flowScreens || flowScreens.length < 2) return undefined;
    const sources = flowScreens
      .map((s) => s.appSource)
      .filter(
        (src): src is string =>
          typeof src === "string" && src.length > 0 && src !== currentSource,
      );
    return sources.length > 0 ? sources : undefined;
  }, [flowScreens, currentSource]);

  // The project's own theme — the default treatment the share opens on.
  const projectTheme = React.useMemo<GeneratedTheme>(() => {
    if (themeDraftJson) {
      try {
        return generateTheme(JSON.parse(themeDraftJson) as ThemeInput);
      } catch {
        /* fall through */
      }
    }
    return builtInThemes[defaultThemeId];
  }, [themeDraftJson]);

  // Switchable set: the project theme first, then the public bundle
  // (deduped by id). "Browse all" / curated A/B sets layer on later.
  const themes = React.useMemo<GeneratedTheme[]>(() => {
    const map = new Map<string, GeneratedTheme>();
    map.set(projectTheme.id, projectTheme);
    for (const t of listThemes()) if (!map.has(t.id)) map.set(t.id, t);
    return [...map.values()];
  }, [projectTheme]);

  const [activeThemeId, setActiveThemeId] = React.useState(projectTheme.id);
  const [mode, setMode] = React.useState<"light" | "dark">(initialMode);
  // Smooth light ⇄ dark ("flashy do da" → View Transition): the HOST
  // chrome fades via a VT here, and the SANDBOX fades its own document
  // when the mode-only source push arrives (external-sandbox render()).
  // flushSync so the new scheme is painted inside the capture window;
  // no-VT browsers keep the instant flip.
  const setModeSmooth = React.useCallback((next: "light" | "dark") => {
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => unknown;
    };
    if (doc.startViewTransition) {
      doc.startViewTransition(() => {
        ReactDOM.flushSync(() => setMode(next));
      });
    } else {
      setMode(next);
    }
  }, []);
  const [chromeVisible, setChromeVisible] = React.useState(!initialChromeHidden);
  // Motion toggle. true = animate (still respects the viewer's OS
  // reduced-motion, reduce-only); false = force still. Forwarded to
  // FastIframeHost as the `motion` prop → grade:set-motion.
  const [motionOn, setMotionOn] = React.useState(true);
  // Viewport set — the creator's specs, in their order. Defaults to
  // the classic presets for legacy callers. The initial id arrives
  // pre-clamped from the route, but clamp again so a direct consumer
  // can't drift out of set.
  const specs = React.useMemo<ShareViewportSpec[]>(
    () =>
      viewportSpecs && viewportSpecs.length > 0
        ? viewportSpecs
        : SHARE_VIEWPORT_PRESETS,
    [viewportSpecs],
  );
  const [viewportId, setViewportId] = React.useState<string>(() =>
    specs.some((s) => s.id === initialViewportId)
      ? (initialViewportId as string)
      : specs[0].id,
  );
  const activeSpec = specs.find((s) => s.id === viewportId) ?? specs[0];
  // Memoized — resolveDeviceSize keys on it, and a fresh object every
  // render would churn the artboard-zoom fit memo for nothing.
  const activeSize = React.useMemo(
    () => shareViewportSize(activeSpec),
    [activeSpec],
  );
  const isFixedDevice = Boolean(activeSize);
  const ActiveIcon = iconForSpec(activeSpec);

  // ─── Compare row (STUDIO-TAGS T2: scoped shares) ──────────────────
  // A scoped share's HOME is all members side by side — live panes in
  // one row that the camera treats as a single wide artboard (Fit /
  // zoom / pan machinery unchanged). Clicking a pane FOCUSES it via
  // the flow stack — the entire single-screen path (Back chip, gotos,
  // Escape) applies to a focused member for free; popping the stack
  // lands back on the row.
  type ScopedMember = {
    id: string;
    name: string;
    appSource: string;
    tags?: { type: string; value: string; order?: number }[];
  };
  const scopedMembers = React.useMemo<ScopedMember[]>(
    () =>
      scoped && flowScreens
        ? flowScreens.filter(
            (s): s is ScopedMember =>
              typeof s.appSource === "string" && s.appSource.length > 0,
          )
        : [],
    [scoped, flowScreens],
  );
  const compare = scopedMembers.length >= 2 && flowStack.length === 0;
  // Generous air between panes — variants must read as separate objects
  // at Fit, not columns of one layout (Ali: "larger gaps").
  const PANE_GAP = 120;
  const PANE_LABEL_H = 44;
  // Pane artboard: the share's device spec, or a desktop default for
  // "responsive" (a fill viewport is meaningless × N — panes scroll
  // internally instead, like any live screen).
  const paneSize = activeSize ?? { w: 1280, h: 800 };

  // Viewer-side GROUP BY (STUDIO-TAGS "member tags ride the share"):
  // arrange the row by any facet the members carry — the 1D sibling of
  // the map view's partitioning. Viewer-local state, never persisted;
  // the share's own order stays the default. The scope's own type is
  // excluded (every member matches it — grouping by it is a no-op).
  const [rowGroupBy, setRowGroupBy] = React.useState<string | null>(null);
  const memberFacetTypes = React.useMemo(() => {
    const types = new Map<string, Set<string>>();
    for (const m of scopedMembers) {
      for (const t of m.tags ?? []) {
        if (t.type === scopeTagType) continue;
        let s = types.get(t.type);
        if (!s) types.set(t.type, (s = new Set()));
        s.add(t.value);
      }
    }
    return [...types.keys()];
  }, [scopedMembers, scopeTagType]);
  const GROUP_GAP = 240;
  const GROUP_LABEL_H = rowGroupBy ? 48 : 0;
  const rowGroups = React.useMemo<
    { label: string | null; panes: ScopedMember[] }[]
  >(() => {
    if (!rowGroupBy) return [{ label: null, panes: scopedMembers }];
    const groups = new Map<string, ScopedMember[]>();
    const untagged: ScopedMember[] = [];
    for (const m of scopedMembers) {
      const t = (m.tags ?? []).find((x) => x.type === rowGroupBy);
      if (!t) {
        untagged.push(m);
        continue;
      }
      const arr = groups.get(t.value);
      if (arr) arr.push(m);
      else groups.set(t.value, [m]);
    }
    const out = [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, panes]) => ({ label: label as string | null, panes }));
    if (untagged.length) out.push({ label: "Untagged", panes: untagged });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowGroupBy, scopedMembers]);
  // Arranged x-offset per pane — one source of truth for BOTH the
  // row's width math and the focus camera.
  const paneOffsets = React.useMemo(() => {
    const map = new Map<string, number>();
    let x = 0;
    rowGroups.forEach((g, gi) => {
      if (gi > 0) x += GROUP_GAP;
      g.panes.forEach((m, pi) => {
        if (pi > 0) x += PANE_GAP;
        map.set(m.id, x);
        x += paneSize.w;
      });
    });
    return { map, totalW: x };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowGroups, paneSize.w]);

  // Responsive content-height artboard — identical behaviour to the
  // focused canvas: the same-origin iframe reports its rendered
  // scrollHeight; a page meaningfully taller than the viewer's window
  // becomes a full-height artboard, so Fit frames the ENTIRE scrolling
  // page. Pages that fit keep the plain fill. Stale heights reset on
  // viewport flips (min-h-screen pages can't shrink their own
  // scrollHeight — re-probe from the fill state instead).
  const [contentH, setContentH] = React.useState<number | null>(null);
  React.useEffect(() => {
    setContentH(null);
    // flowTop: a flow navigation swaps the rendered screen — its height
    // is a different page's height, so re-probe like a viewport flip.
  }, [viewportId, flowTop]);
  const resolveDeviceSize = React.useCallback(
    (canvas: { w: number; h: number }) => {
      // Compare row: the artboard IS the row — the arranged panes
      // (incl. group gaps + label strip when grouped) as one artboard.
      // Fit frames the whole arrangement at once.
      if (compare) {
        return {
          w: paneOffsets.totalW,
          h: paneSize.h + PANE_LABEL_H + GROUP_LABEL_H,
        };
      }
      if (activeSize) return activeSize;
      // ?fullscreen=1 keeps the PLAIN fill even for tall pages: the
      // framed content-height artboard centres via the camera, which
      // opens long forms mid-page and leaves no native scroll (Ali's
      // iPad walkthrough, 8 Aug). Plain fill means the iframe document
      // scrolls like the real product, and the sandbox's resetScroll
      // handles goto navigation. Framing stays for chrome-on viewing,
      // where Fit-the-whole-page is the point.
      if (
        !initialChromeHidden &&
        contentH !== null &&
        canvas.w > 0 &&
        canvas.h > 0 &&
        contentH > canvas.h + 8
      ) {
        return { w: Math.max(320, canvas.w - 64), h: contentH };
      }
      return undefined;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeSize, contentH, compare, paneOffsets.totalW, GROUP_LABEL_H, paneSize.h, initialChromeHidden],
  );

  // Zoom + Fit — the shared artboard-zoom implementation (also drives
  // the focused canvas). Owns canvas measurement, the fit math, and
  // the pick/step/fit gestures. The share opens at 100% (defaultFit
  // false) — the creator framed the screen; honour it.
  // External registry (BYODS) — the share renders through the ext:*
  // kernel instead of Fast Frame, and theme/motion chrome is hidden
  // (external DS themes aren't Studio-switchable yet). Resolved from
  // the share's PROJECT (registryId prop), falling back to the
  // deployment default — synchronous, so first paint mounts the right
  // renderer with no remount flash.
  const shareRegistry = getRegistryById(registryId) ?? getActiveRegistry();
  const isExternal = shareRegistry.id !== "gradeui";
  const artboard = useArtboardZoom({
    deviceSize: resolveDeviceSize,
    // 100% is the creator-framed default; ?fullscreen=1 seeds Fit.
    defaultFit: initialFit,
  });
  const {
    canvasRef: screenRef,
    canvasEl,
    deviceSize,
    fitMode,
    effectiveZoom,
    pickZoom,
    stepZoom,
    zoomBy,
    fit,
  } = artboard;
  // True whenever an artboard is framed — a fixed device preset OR the
  // responsive content-height artboard. Drives the card layout below.
  const framed = Boolean(deviceSize);

  // The compare row lands in Fit — the whole set framed at once is the
  // "here are your options" moment; 100% of an N-pane row would open
  // on one corner. Re-fit on member-count changes; leaving compare
  // (focusing a pane) keeps the user's zoom.
  React.useEffect(() => {
    if (compare && canvasEl) fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compare, scopedMembers.length, rowGroupBy, canvasEl]);

  // ─── Imperative camera session — SAME pattern as the focused canvas
  // (FocusedFastMount). Pinch/pan write a translate+scale straight to
  // the camera wrapper each frame (compositor-only, anchored at the
  // pointer) and commit ONE pan+zoom state update on settle. See
  // fast-frame.tsx for the annotated original; this is the share-view
  // port (no drag/modes — viewers pinch and wheel-pan only).
  // TODO: extract into a shared useArtboardCamera hook once both
  // implementations have soaked.
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const cameraRef = React.useRef<HTMLDivElement | null>(null);
  const [imperativeGesturing, setImperativeGesturing] = React.useState(false);
  interface ShareCameraSession {
    baseZoom: number;
    basePan: { x: number; y: number };
    rect0: { x: number; y: number };
    k: number;
    d: { x: number; y: number };
    el: HTMLElement;
    idleTimer: number | null;
  }
  const sessionRef = React.useRef<ShareCameraSession | null>(null);

  const PAN_KEEP_VISIBLE = 48;
  const clampPan = React.useCallback(
    (p: { x: number; y: number }, zoomOverride?: number) => {
      const z = zoomOverride ?? effectiveZoom;
      const scaledW = (deviceSize?.w ?? 0) * z;
      const scaledH = (deviceSize?.h ?? 0) * z;
      const cw = canvasEl?.clientWidth ?? 0;
      const ch = canvasEl?.clientHeight ?? 0;
      const maxX = Math.max(0, (scaledW + cw) / 2 - PAN_KEEP_VISIBLE);
      const maxY = Math.max(0, (scaledH + ch) / 2 - PAN_KEEP_VISIBLE);
      return {
        x: Math.min(maxX, Math.max(-maxX, p.x)),
        y: Math.min(maxY, Math.max(-maxY, p.y)),
      };
    },
    [deviceSize?.w, deviceSize?.h, effectiveZoom, canvasEl],
  );
  React.useEffect(() => {
    if (fitMode) setPan({ x: 0, y: 0 });
  }, [fitMode]);

  // ─── In-place pane focus (compare row) ────────────────────────────
  // Tap a pane → the CAMERA frames it and siblings dim (opacity +
  // desaturate); nothing leaves the canvas — "look closer" is a camera
  // move, not a view switch (the jump-cut version read as disjointed).
  // Esc / "← All screens" returns to the fitted row. A goto INSIDE the
  // focused (now interactive) pane still walks the flow full-screen via
  // the flow stack; Back lands home on the row.
  const [focusedPaneId, setFocusedPaneId] = React.useState<string | null>(
    null,
  );
  const focusedPaneRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    focusedPaneRef.current = focusedPaneId;
  });
  // Leaving compare (flow walk / share without scope) drops the focus.
  React.useEffect(() => {
    if (!compare) setFocusedPaneId(null);
  }, [compare]);
  const focusPane = React.useCallback(
    (id: string) => {
      const offset = paneOffsets.map.get(id);
      if (offset === undefined || !canvasEl || !deviceSize) return;
      setFocusedPaneId(id);
      // Frame the pane with breathing room, never past 100%. Camera
      // home is the row centre, so panning to a pane is the offset
      // between the row centre and that pane's centre, scaled. The
      // offset map is arrangement-aware (group-by reflows honoured).
      const margin = 96;
      const z = Math.min(
        (canvasEl.clientWidth - margin) / paneSize.w,
        (canvasEl.clientHeight - margin) / (paneSize.h + PANE_LABEL_H),
        1,
      );
      const paneCenterX = offset + paneSize.w / 2;
      pickZoom(z);
      setPan({ x: (deviceSize.w / 2 - paneCenterX) * z, y: 0 });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paneOffsets, canvasEl, deviceSize, paneSize.w, paneSize.h, pickZoom],
  );
  const unfocusPanes = React.useCallback(() => {
    setFocusedPaneId(null);
    fit();
  }, [fit]);

  // Pane-LOCAL navigation: a goto inside a focused pane swaps THAT
  // pane's screen in place — the row stays, siblings stay put (walking
  // variant A's nav while B sits alongside is the point of multiview;
  // the old full-screen walk collapsed the row — "SADFACE", Ali).
  // Targets resolve against the scoped members only (same privacy rule
  // as the flow map). Per-pane ← chip pops; the cross-fade rides along
  // because the goto click armed the transition inside that iframe.
  const [paneStacks, setPaneStacks] = React.useState<
    Record<string, { id: string; appSource: string }[]>
  >({});
  const paneGoto = React.useCallback(
    (paneId: string, target: string) => {
      const t = target.trim();
      if (!t) return;
      const match = t.toLowerCase().startsWith("screen:")
        ? scopedMembers.find((s) => s.id === t.slice("screen:".length))
        : scopedMembers.find(
            (s) => s.name.trim().toLowerCase() === t.toLowerCase(),
          );
      if (!match) {
        // eslint-disable-next-line no-console
        console.warn(
          `[flows] pane goto "${target}" did not resolve within the scoped set`,
        );
        return;
      }
      setPaneStacks((prev) => ({
        ...prev,
        [paneId]: [
          ...(prev[paneId] ?? []),
          { id: match.id, appSource: match.appSource },
        ],
      }));
    },
    [scopedMembers],
  );
  const panePop = React.useCallback((paneId: string) => {
    setPaneStacks((prev) => ({
      ...prev,
      [paneId]: (prev[paneId] ?? []).slice(0, -1),
    }));
  }, []);
  // Per-pane iframe refs — the comment-pin overlays anchor into each
  // pane's contentDocument (same-origin), one overlay per member.
  // Stable ref objects per id, minted on demand.
  const paneIframeRefs = React.useRef(
    new Map<string, React.MutableRefObject<HTMLIFrameElement | null>>(),
  );
  const paneIframeRef = React.useCallback((id: string) => {
    let r = paneIframeRefs.current.get(id);
    if (!r) {
      r = { current: null };
      paneIframeRefs.current.set(id, r);
    }
    return r;
  }, []);
  React.useEffect(() => {
    setPan({ x: 0, y: 0 });
  }, [viewportId]);

  const applySession = (s: ShareCameraSession) => {
    s.el.style.transition = "none";
    s.el.style.transformOrigin = "0 0";
    s.el.style.transform = `translate(${s.basePan.x + s.d.x}px, ${
      s.basePan.y + s.d.y
    }px) scale(${s.k})`;
  };
  const centeringShift = (s: ShareCameraSession, k: number) => ({
    x: ((deviceSize?.w ?? 0) * s.baseZoom * (k - 1)) / 2,
    y: ((deviceSize?.h ?? 0) * s.baseZoom * (k - 1)) / 2,
  });
  const clampSessionD = (
    s: ShareCameraSession,
    d: { x: number; y: number },
    k: number,
  ) => {
    const shift = centeringShift(s, k);
    const committed = clampPan(
      { x: s.basePan.x + d.x + shift.x, y: s.basePan.y + d.y + shift.y },
      s.baseZoom * k,
    );
    return {
      x: committed.x - shift.x - s.basePan.x,
      y: committed.y - shift.y - s.basePan.y,
    };
  };

  const ensureSessionRef = React.useRef<() => ShareCameraSession | null>(
    () => null,
  );
  ensureSessionRef.current = () => {
    if (sessionRef.current) return sessionRef.current;
    const el = cameraRef.current;
    if (!el || !framed) return null;
    const rect = el.getBoundingClientRect();
    sessionRef.current = {
      baseZoom: effectiveZoom,
      basePan: { ...pan },
      rect0: { x: rect.left, y: rect.top },
      k: 1,
      d: { x: 0, y: 0 },
      el,
      idleTimer: null,
    };
    setImperativeGesturing(true);
    return sessionRef.current;
  };
  const commitSessionRef = React.useRef<() => void>(() => {});
  commitSessionRef.current = () => {
    const s = sessionRef.current;
    if (!s) return;
    sessionRef.current = null;
    if (s.idleTimer !== null) window.clearTimeout(s.idleTimer);
    const shift = centeringShift(s, s.k);
    setPan(
      clampPan(
        { x: s.basePan.x + s.d.x + shift.x, y: s.basePan.y + s.d.y + shift.y },
        s.baseZoom * s.k,
      ),
    );
    if (s.k !== 1) zoomBy(s.k);
    setImperativeGesturing(false);
  };
  const pinchSessionRef = React.useRef<
    (factor: number, anchor: { kind: "client" | "iframe"; x: number; y: number } | null) => void
  >(() => {});
  pinchSessionRef.current = (factor, anchor) => {
    // PRODUCT MODE (?fullscreen=1, Ali 23 Jul): zoom gestures are OFF —
    // the share should behave like the real product, and a stray pinch
    // or ctrl+wheel breaking the illusion is worse than losing the
    // canvas trick. Deliberate zooming stays available via the toolbar
    // once the chrome is shown with ".".
    if (initialChromeHidden) return;
    const s = ensureSessionRef.current();
    if (!s) {
      zoomBy(factor); // responsive fill — no camera
      return;
    }
    const cur = s.baseZoom * s.k;
    const target = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, cur * factor));
    const f = target / cur;
    if (f !== 1 && anchor) {
      const O = { x: s.rect0.x + s.d.x, y: s.rect0.y + s.d.y };
      const P =
        anchor.kind === "client"
          ? { x: anchor.x, y: anchor.y }
          : { x: O.x + anchor.x * cur, y: O.y + anchor.y * cur };
      s.d = {
        x: s.d.x + (O.x - P.x) * (f - 1),
        y: s.d.y + (O.y - P.y) * (f - 1),
      };
    }
    s.k *= f;
    s.d = clampSessionD(s, s.d, s.k);
    applySession(s);
    if (s.idleTimer !== null) window.clearTimeout(s.idleTimer);
    s.idleTimer = window.setTimeout(() => commitSessionRef.current(), 180);
  };
  const panSessionByRef = React.useRef<(dx: number, dy: number) => void>(
    () => {},
  );
  panSessionByRef.current = (dx, dy) => {
    const s = ensureSessionRef.current();
    if (!s) return;
    s.d = clampSessionD(s, { x: s.d.x + dx, y: s.d.y + dy }, s.k);
    applySession(s);
    if (s.idleTimer !== null) window.clearTimeout(s.idleTimer);
    s.idleTimer = window.setTimeout(() => commitSessionRef.current(), 180);
  };
  // Re-assert mid-session inline styles after unrelated re-renders.
  React.useEffect(() => {
    const s = sessionRef.current;
    if (s) applySession(s);
  });

  // Space-hold quick-pan — same vocabulary as the canvas's Interact
  // mode: hold Space for the grab hand, drag to pan, release to hand
  // the prototype back. Middle-mouse drag works without Space.
  const [spaceHeld, setSpaceHeld] = React.useState(false);
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t) {
        if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
        if (t.isContentEditable) return;
      }
      e.preventDefault();
      setSpaceHeld(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceHeld(false);
    };
    const blur = () => setSpaceHeld(false);
    // Space FORWARDED from the prototype iframes (grade:space /
    // ext:space, both renderer dialects): once a viewer clicks into a
    // live screen the iframe owns keyboard focus and the window
    // listeners above go deaf — the sandboxes post the key out instead
    // ("spacebar drag doesn't work — stuck on live screens", Ali).
    const onMessage = (e: MessageEvent) => {
      const d = e.data as { type?: string; down?: boolean } | null;
      if (d?.type === "grade:space" || d?.type === "ext:space") {
        setSpaceHeld(Boolean(d.down));
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      window.removeEventListener("message", onMessage);
    };
  }, []);

  // Drag-pan through the session (pointer up commits).
  const dragRef = React.useRef<{
    id: number;
    x: number;
    y: number;
    startX: number;
    startY: number;
  } | null>(null);
  const [panning, setPanning] = React.useState(false);
  const beginPan = (e: React.PointerEvent<HTMLElement>) => {
    const s = ensureSessionRef.current();
    if (!s) return;
    if (s.idleTimer !== null) {
      window.clearTimeout(s.idleTimer);
      s.idleTimer = null;
    }
    dragRef.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      startX: s.d.x,
      startY: s.d.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    setPanning(true);
  };
  const movePan = (e: React.PointerEvent<HTMLElement>) => {
    const p = dragRef.current;
    const s = sessionRef.current;
    if (!p || !s || e.pointerId !== p.id) return;
    s.d = clampSessionD(
      s,
      { x: p.startX + (e.clientX - p.x), y: p.startY + (e.clientY - p.y) },
      s.k,
    );
    applySession(s);
  };
  const endPan = (e: React.PointerEvent<HTMLElement>) => {
    if (dragRef.current?.id !== e.pointerId) return;
    dragRef.current = null;
    setPanning(false);
    commitSessionRef.current();
  };

  // rAF-coalesced gesture queue feeding the session — wheel events at
  // 120Hz+, applied once per frame.
  const gestureAccRef = React.useRef<{
    factor: number;
    anchor: { kind: "client" | "iframe"; x: number; y: number } | null;
    raf: number | null;
  }>({ factor: 1, anchor: null, raf: null });
  const queueGesture = React.useCallback(
    (
      factor: number,
      anchor: { kind: "client" | "iframe"; x: number; y: number } | null,
    ) => {
      const acc = gestureAccRef.current;
      acc.factor *= factor;
      if (anchor) acc.anchor = anchor;
      if (acc.raf !== null) return;
      acc.raf = requestAnimationFrame(() => {
        const f = acc.factor;
        const a = acc.anchor;
        acc.factor = 1;
        acc.anchor = null;
        acc.raf = null;
        if (f !== 1) pinchSessionRef.current(f, a);
      });
    },
    [],
  );

  // Pinch over the chrome / canvas area — canvasEl is the overlay's
  // ancestor, so no events are lost while the pointer shield is up.
  React.useEffect(() => {
    if (!canvasEl) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      queueGesture(Math.exp(-e.deltaY * 0.01), {
        kind: "client",
        x: e.clientX,
        y: e.clientY,
      });
    };
    canvasEl.addEventListener("wheel", onWheel, { passive: false });
    return () => canvasEl.removeEventListener("wheel", onWheel);
  }, [canvasEl, queueGesture]);
  // Pinch over the live iframe — the sandbox forwards ctrl+wheel with
  // iframe-local pointer coords. TWO dialects, one queue: Fast Frame
  // posts grade:zoom-gesture with a raw deltaY; the external sandbox
  // posts ext:zoom-gesture with a pre-multiplied factor (+ coords since
  // the share-pinch fix) — before this branch the external share
  // dropped pinch entirely ("using a different frame to render").
  React.useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const data = e.data as {
        type?: string;
        deltaY?: number;
        factor?: number;
        clientX?: number;
        clientY?: number;
      } | null;
      if (!data) return;
      const factor =
        data.type === "grade:zoom-gesture" && typeof data.deltaY === "number"
          ? Math.exp(-data.deltaY * 0.01)
          : data.type === "ext:zoom-gesture" && typeof data.factor === "number"
            ? data.factor
            : null;
      if (factor === null) return;
      const anchor =
        typeof data.clientX === "number" && typeof data.clientY === "number"
          ? { kind: "iframe" as const, x: data.clientX, y: data.clientY }
          : null;
      queueGesture(factor, anchor);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [queueGesture]);

  // Comments — pins shown by default when the screen has any. Reading is
  // open to anyone with the link; replying requires a signed-in viewer.
  const { user: viewer } = useSupabaseAuth();
  const [threads, setThreads] = React.useState(commentThreads);
  const hasComments = threads.length > 0;
  // Scoped shares carry threads for EVERY member (server fetches all) —
  // group by screen so each compare pane shows only ITS pins, and the
  // single view shows only the entry's.
  const threadsByDesign = React.useMemo(() => {
    const map = new Map<string, CommentThreadWithMessages[]>();
    for (const t of threads) {
      const arr = map.get(t.thread.designId) ?? [];
      arr.push(t);
      map.set(t.thread.designId, arr);
    }
    return map;
  }, [threads]);
  const entryThreads = entryDesignId
    ? (threadsByDesign.get(entryDesignId) ?? [])
    : threads;

  // ─── Viewer-side PIN CREATION (Ali: "these are the tools I need so
  // people can start interacting") ─────────────────────────────────────
  // Pin mode arms the sandbox selection agent (single view: the live
  // screen; compare: the FOCUSED pane); a pick opens the composer; the
  // post goes through /api/shares/[token]/comments — the server route
  // that validates the capability token + scope and writes with the
  // service role (RLS correctly refuses outsiders client-side).
  const [pinMode, setPinMode] = React.useState(false);
  const [pendingPin, setPendingPin] = React.useState<{
    designId: string;
    anchorId: string;
    anchorKind: "source" | "instance";
    label: string;
    componentName?: string;
  } | null>(null);
  const [pinText, setPinText] = React.useState("");
  const [postingPin, setPostingPin] = React.useState(false);
  // Outside commenters aren't in the server-rendered user list — carry
  // them locally so their avatar/name shows on the pin immediately.
  const [extraUsers, setExtraUsers] = React.useState<User[]>([]);
  const handlePinPick = React.useCallback(
    (sel: unknown, designId: string | null | undefined) => {
      if (!designId) return;
      const s = sel as {
        sourceId?: string;
        instanceId?: string;
        anchorSourceId?: string;
        componentName?: string;
        part?: string;
        tag?: string;
      } | null;
      if (!s) return;
      const anchor = s.sourceId
        ? { id: s.sourceId, kind: "source" as const }
        : s.instanceId
          ? { id: s.instanceId, kind: "instance" as const }
          : s.anchorSourceId
            ? { id: s.anchorSourceId, kind: "source" as const }
            : null;
      if (!anchor) return;
      setPendingPin({
        designId,
        anchorId: anchor.id,
        anchorKind: anchor.kind,
        label: s.componentName || s.part || s.tag || "element",
        componentName: s.componentName,
      });
      setPinMode(false); // one pick per arm — the composer takes over
    },
    [],
  );
  // Delete OWN comment (author-only, route-enforced). Local state
  // mirrors the server rule: the thread goes when its last comment
  // does, and the drawer closes if it was showing that thread.
  const handleDeleteComment = React.useCallback(
    async (commentId: string) => {
      if (!shareToken) return;
      try {
        const res = await fetch(
          `/api/shares/${shareToken}/comments?commentId=${encodeURIComponent(commentId)}`,
          { method: "DELETE" },
        );
        const data = (await res.json().catch(() => null)) as {
          deleted?: boolean;
          threadDeleted?: boolean;
          error?: string;
        } | null;
        if (!res.ok || !data?.deleted) {
          throw new Error(data?.error ?? `delete failed (${res.status})`);
        }
        setThreads((prev) =>
          prev
            .map((t) => ({
              ...t,
              comments: t.comments.filter((c) => c.id !== commentId),
            }))
            .filter((t) => t.comments.length > 0),
        );
        if (data.threadDeleted) {
          setActiveThreadId((cur) => cur); // recomputed via activeThread lookup
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[share] delete comment failed:", err);
      }
    },
    [shareToken],
  );

  const handlePostPin = React.useCallback(async () => {
    if (!pendingPin || !pinText.trim() || !shareToken) return;
    setPostingPin(true);
    try {
      const res = await fetch(`/api/shares/${shareToken}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designId: pendingPin.designId,
          anchorId: pendingPin.anchorId,
          anchorKind: pendingPin.anchorKind,
          elementLabel: pendingPin.label,
          componentName: pendingPin.componentName,
          body: pinText.trim(),
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        thread?: CommentThreadWithMessages["thread"];
        comments?: CommentThreadWithMessages["comments"];
        author?: User;
        error?: string;
      } | null;
      if (!res.ok || !data?.thread) {
        throw new Error(data?.error ?? `pin failed (${res.status})`);
      }
      setThreads((prev) => [
        ...prev,
        { thread: data.thread!, comments: data.comments ?? [] },
      ]);
      if (data.author) {
        setExtraUsers((prev) =>
          prev.some((u) => u.id === data.author!.id)
            ? prev
            : [...prev, data.author!],
        );
      }
      setActiveThreadId(data.thread.id);
      setShowComments(true);
      setPendingPin(null);
      setPinText("");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[share] pin failed:", err);
    } finally {
      setPostingPin(false);
    }
  }, [pendingPin, pinText, shareToken]);
  const [showComments, setShowComments] = React.useState(true);
  const [activeThreadId, setActiveThreadId] = React.useState<string | null>(
    null,
  );
  const [replyText, setReplyText] = React.useState("");
  const [posting, setPosting] = React.useState(false);
  const getCommentUser = React.useCallback(
    (id: string) =>
      commentUsers.find((u) => u.id === id) ??
      extraUsers.find((u) => u.id === id),
    [commentUsers, extraUsers],
  );
  const activeThread =
    threads.find((t) => t.thread.id === activeThreadId) ?? null;

  const handlePostReply = React.useCallback(async () => {
    const t = threads.find((x) => x.thread.id === activeThreadId);
    if (!t || !replyText.trim() || !viewer) return;
    setPosting(true);
    try {
      const comment = await getStudioStorage().addComment({
        projectId: t.thread.projectId,
        designId: t.thread.designId,
        threadId: t.thread.id,
        authorId: viewer.id,
        body: replyText.trim(),
      });
      setThreads((prev) =>
        prev.map((x) =>
          x.thread.id === t.thread.id
            ? { ...x, comments: [...x.comments, comment] }
            : x,
        ),
      );
      setReplyText("");
    } catch (err) {
      toast.error("Couldn't post comment", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setPosting(false);
    }
  }, [threads, activeThreadId, replyText, viewer]);

  const activeTheme =
    themes.find((t) => t.id === activeThemeId) ?? projectTheme;

  // Keyboard shortcuts (parent-focus only — keys pressed while focus is
  // inside the rendered iframe stay in that realm). Figma-ish:
  //   .        hide / show the UI
  //   0        fit to screen
  //   1–4      jump to a zoom level (100 / 90 / 75 / 50)
  //   − / =    step zoom out / in through the levels
  //   C        toggle comments
  //   M        toggle motion (animate / hold still)
  React.useEffect(() => {
    const jump = pickZoom;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // PRODUCT MODE (?fullscreen=1): zoom keys (0–4, −/=) are off —
      // same rationale as the pinch gate above. "." (chrome), C and M
      // stay live.
      const zoomKeysOff = initialChromeHidden;
      switch (e.key) {
        case ".":
          e.preventDefault();
          setChromeVisible((v) => !v);
          break;
        case "c":
        case "C":
          setShowComments((v) => !v);
          break;
        case "m":
        case "M":
          setMotionOn((v) => !v);
          break;
        case "0":
          if (!zoomKeysOff) fit();
          break;
        case "1":
          if (!zoomKeysOff) jump(1);
          break;
        case "2":
          if (!zoomKeysOff) jump(0.9);
          break;
        case "3":
          if (!zoomKeysOff) jump(0.75);
          break;
        case "4":
          if (!zoomKeysOff) jump(0.5);
          break;
        case "-":
        case "_":
          if (!zoomKeysOff) stepZoom(-1);
          break;
        case "=":
        case "+":
          if (!zoomKeysOff) stepZoom(1);
          break;
        case "Escape":
          // Focused compare pane first — Esc steps OUT one level:
          // pane → row, then flow Back. Ref keeps the dep list stable.
          if (focusedPaneRef.current) {
            setFocusedPaneId(null);
            fit();
            break;
          }
          // Flow Back (STUDIO-FLOWS). Safe to own here: the share view
          // has no parent-realm Escape consumer (selection-clearing
          // Escapes happen INSIDE the iframe realm and never reach this
          // listener). Functional pop keeps the effect's dep list
          // unchanged.
          setFlowStack((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // pickZoom / stepZoom / fit are stable useCallbacks from the hook.
  }, [pickZoom, stepZoom, fit, initialChromeHidden]);

  const iconBtn =
    "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground";
  const segBtn =
    "inline-flex h-5 w-6 items-center justify-center rounded-sm transition";

  return (
    <div
      className={cn(
        // DYNAMIC viewport units (dvh/dvw), not vh/vw: in iOS
        // STANDALONE (home-screen) mode the static units go stale on
        // portrait↔landscape rotation — the layout stays sized to the
        // previous orientation until reload (Ali's iPhone test, 23
        // Jul). dv* re-resolve on rotate and also track Safari's
        // collapsing toolbar in-browser.
        "flex h-dvh w-dvw flex-col overflow-hidden bg-background",
        mode === "dark" && "dark",
      )}
      data-mode={mode}
    >
      {/* ── Glass toolbar — in flow on top, so it never covers the
          screen at 100%. Reads as a floating glass bar via the margin
          + translucency. ── */}
      {chromeVisible ? (
        <header className="relative z-[70] m-2 flex h-11 shrink-0 items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/70 px-3 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/55">
          {/* Brand + project / screen breadcrumb — both always visible
              (the project name was sm-hidden and easy to miss). */}
          <div className="flex min-w-0 items-center gap-2.5">
            <GradeLogo size={20} className="shrink-0 text-foreground" />
            <div className="flex min-w-0 items-baseline gap-1.5">
              <span className="truncate text-xs text-muted-foreground">
                {projectName}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground/60">/</span>
              {compare ? (
                // The SCOPE names a compare share — and doubles as the
                // member menu: pick a screen to glide the camera to its
                // pane (Ali: "a dropdown next to the shared tag name").
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex min-w-0 items-center gap-1 rounded text-sm font-medium text-foreground transition hover:opacity-70"
                    >
                      <span className="truncate">
                        {scopeLabel ?? `${scopedMembers.length} screens`}
                      </span>
                      <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="z-[80] w-56 border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/65"
                  >
                    {scopedMembers.map((m) => (
                      <DropdownMenuItem
                        key={m.id}
                        onClick={() => focusPane(m.id)}
                        className="gap-2 focus:bg-foreground/10 focus:text-foreground"
                      >
                        <span className="flex-1 truncate">{m.name}</span>
                        {focusedPaneId === m.id && (
                          <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <span className="truncate text-sm font-medium text-foreground">
                  {/* Names the CURRENT screen — updates on flow navigation. */}
                  {currentScreenName}
                </span>
              )}
              {/* Arrange — viewer-side group-by over the members' OWN
                  tags (the 1D partition; nothing persisted, the share's
                  order stays the default). DISABLED for now (Ali, 18
                  Jul: "half baked") — the reflow works but the
                  interaction isn't presentation-grade; re-enable with
                  the #22 compare-row polish pass. Machinery
                  (rowGroupBy/rowGroups/paneOffsets) stays live. */}
              {ARRANGE_ENABLED && compare && memberFacetTypes.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="ml-0.5 inline-flex h-6 shrink-0 items-center gap-1 self-center rounded-md px-1.5 text-xs text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground"
                      title="Arrange the screens by one of their tags"
                    >
                      {rowGroupBy ? `By ${rowGroupBy}` : "Arrange"}
                      <ChevronDown className="h-3 w-3 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="z-[80] w-48 border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/65"
                  >
                    <DropdownMenuItem
                      onClick={() => {
                        setRowGroupBy(null);
                        setFocusedPaneId(null);
                      }}
                      className="gap-2 focus:bg-foreground/10 focus:text-foreground"
                    >
                      <span className="flex-1">Shared order</span>
                      {!rowGroupBy && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                      )}
                    </DropdownMenuItem>
                    {memberFacetTypes.map((type) => (
                      <DropdownMenuItem
                        key={type}
                        onClick={() => {
                          setRowGroupBy(type);
                          setFocusedPaneId(null);
                        }}
                        className="gap-2 focus:bg-foreground/10 focus:text-foreground"
                      >
                        <span
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: tagTypeColor(type) }}
                        />
                        <span className="flex-1 truncate">Group by {type}</span>
                        {rowGroupBy === type && (
                          <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {/* Zoom out — back to the fitted row (same as Esc). */}
              {compare && (
                <button
                  type="button"
                  onClick={unfocusPanes}
                  title="Zoom out to all screens (Esc)"
                  aria-label="Zoom out to all screens"
                  className="ml-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center self-center rounded-md text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground"
                >
                  <Maximize className="h-3.5 w-3.5" />
                </button>
              )}
              {compare && scopeLabel && (
                <span
                  className="ml-1 inline-flex shrink-0 items-center gap-1 self-center rounded-full px-2 py-0.5 text-[10px] text-muted-foreground"
                  style={{
                    backgroundColor: `color-mix(in oklab, ${tagTypeColor(
                      scopeTagType ?? "label",
                    )} 14%, transparent)`,
                  }}
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{
                      backgroundColor: tagTypeColor(scopeTagType ?? "label"),
                    }}
                  />
                  {scopedMembers.length} screens
                </span>
              )}
            </div>
          </div>

          {/* Controls shelf — theme menu, light/dark, zoom. Grows over
              time (more "tweakers"). */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Theme — glass dropdown with names. HIDDEN for external
                registries: the DS's theme rides inside the sandbox
                (runtime.previewCss) and Studio's theme engine doesn't
                drive it yet — a selector that does nothing is worse
                than none. */}
            {!isExternal && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  title="Theme"
                  className="flex h-7 items-center gap-1.5 rounded-md border border-border/60 px-2 text-xs text-foreground transition hover:bg-foreground/10"
                >
                  <ThemeSwatch theme={activeTheme} />
                  <span className="hidden max-w-[8rem] truncate sm:inline">
                    {activeTheme.name}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="z-[80] max-h-[60vh] w-52 overflow-y-auto border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/65"
              >
                {themes.map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => setActiveThemeId(t.id)}
                    // Neutral hover — the default focus:bg-accent picks up
                    // the PROJECT THEME's accent (olive, anything), which
                    // looks broken on the glass chrome.
                    className="gap-2 focus:bg-foreground/10 focus:text-foreground"
                  >
                    <ThemeSwatch theme={t} />
                    <span className="flex-1 truncate">{t.name}</span>
                    {t.id === activeThemeId && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            )}

            {/* Reset tweaks — clears every shell's session tweak stash
                (the Alt+T demo layer) and reloads to the AUTHORED look.
                The share page and its sandbox iframes are same-origin,
                so the toolbar can clear the iframes' sessionStorage
                directly. External registries only — the tweaker is
                registry-module chrome. */}
            {isExternal && (
              <button
                type="button"
                onClick={() => {
                  try {
                    const doomed: string[] = [];
                    for (let i = 0; i < window.sessionStorage.length; i++) {
                      const k = window.sessionStorage.key(i);
                      if (k && k.includes("session-tweaks")) doomed.push(k);
                    }
                    doomed.forEach((k) => window.sessionStorage.removeItem(k));
                  } catch {
                    /* storage unavailable — reload alone still resets
                       module-scope stashes */
                  }
                  window.location.reload();
                }}
                title="Reset tweaks — back to the authored look"
                aria-label="Reset tweaks"
                className={iconBtn}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Light / dark */}
            <div className="flex items-center rounded-md border border-border/60 p-0.5">
              <button
                type="button"
                onClick={() => setModeSmooth("light")}
                aria-pressed={mode === "light"}
                title="Light"
                className={cn(
                  segBtn,
                  mode === "light"
                    ? "bg-foreground/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setModeSmooth("dark")}
                aria-pressed={mode === "dark"}
                title="Dark"
                className={cn(
                  segBtn,
                  mode === "dark"
                    ? "bg-foreground/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Device — the share's viewport SPECS on a glass menu.
                Part of the share contract: the creator's set travels
                on the link (named entries, arbitrary W×H, orientation).
                A single spec collapses the menu to a locked badge —
                nothing to pick. */}
            {specs.length === 1 ? (
              <span
                title="Device (locked by the share)"
                className="hidden h-7 items-center gap-1.5 rounded-md border border-border/60 px-2 text-xs text-foreground sm:flex"
              >
                <ActiveIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="hidden max-w-[8rem] truncate md:inline">
                  {activeSpec.label}
                </span>
              </span>
            ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  title="Device"
                  className="hidden h-7 items-center gap-1.5 rounded-md border border-border/60 px-2 text-xs text-foreground transition hover:bg-foreground/10 sm:flex"
                >
                  <ActiveIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="hidden max-w-[8rem] truncate md:inline">
                    {activeSpec.label}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="z-[80] min-w-[10rem] border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/65"
              >
                {specs.map((s) => {
                  const Icon = iconForSpec(s);
                  const dims = specDims(s);
                  return (
                    <DropdownMenuItem
                      key={s.id}
                      onClick={() => setViewportId(s.id)}
                      // Neutral hover — see the theme menu note.
                      className="gap-2 focus:bg-foreground/10 focus:text-foreground"
                    >
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="flex-1 truncate">{s.label}</span>
                      {dims && (
                        <span className="text-[11px] tabular-nums text-muted-foreground">
                          {dims}
                        </span>
                      )}
                      {s.id === viewportId && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            )}

            {/* Zoom — the shared ZoomControl (Fit/Free toggle, ±10%
                steppers, 10–400% slider, percent readout). Same chrome
                as the focused canvas; pinch/ctrl+wheel feed the same
                hook via useZoomGestures above. */}
            <ZoomControl artboard={artboard} className="hidden sm:flex" />

            {/* Motion — pause/resume animation (shaders, ThreeScene, CSS).
                Mirrors ThreeScene's own play/pause vocabulary. Reduce-only:
                the viewer's OS reduced-motion is honoured regardless.
                Hidden for external registries — no ext:set-motion yet. */}
            {!isExternal && (
            <button
              type="button"
              onClick={() => setMotionOn((v) => !v)}
              aria-pressed={!motionOn}
              title={motionOn ? "Pause motion (press M)" : "Play motion (press M)"}
              aria-label={motionOn ? "Pause motion" : "Play motion"}
              className={cn(iconBtn, !motionOn && "bg-foreground/10 text-foreground")}
            >
              {motionOn ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
            )}

            {/* New pin — viewer-side comment creation. Signed-in only
                (the unsigned path is the reply drawer's sign-in-and-
                return link); in compare, focus a pane first so the pick
                has one target screen. */}
            {viewer && shareToken && (
              <button
                type="button"
                onClick={() => setPinMode((v) => !v)}
                disabled={compare && !focusedPaneId}
                aria-pressed={pinMode}
                title={
                  compare && !focusedPaneId
                    ? "Focus a screen first, then pin"
                    : pinMode
                      ? "Click an element to pin a comment"
                      : "New pin — click an element to comment on it"
                }
                className={cn(
                  iconBtn,
                  pinMode && "bg-foreground/10 text-foreground",
                  compare && !focusedPaneId && "opacity-40",
                )}
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            )}
            {hasComments && (
              <button
                type="button"
                onClick={() => setShowComments((v) => !v)}
                aria-pressed={showComments}
                title="Comments (press C)"
                className={cn(
                  iconBtn,
                  showComments && "bg-foreground/10 text-foreground",
                )}
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setChromeVisible(false)}
              title="Hide UI (press .)"
              aria-label="Hide UI"
              className={iconBtn}
            >
              <PanelTopClose className="h-4 w-4" />
            </button>
          </div>
        </header>
      ) : initialChromeHidden ? null : (
        /* Chrome-restore control (non-fullscreen "." only): a CIRCLE
           that stays invisible until the pointer enters the top-right
           corner hotspot — tweaker-style reveal. In ?fullscreen=1 mode
           it doesn't exist AT ALL (Ali, 23 Jul: "it is just the real
           app") — "." remains the one deliberate way back. The hotspot
           sits over the iframe, so corner hover registers in the
           parent realm. */
        <div className="group absolute right-0 top-0 z-[70] h-16 w-16">
          <button
            type="button"
            onClick={() => setChromeVisible(true)}
            title="Show UI (press .)"
            aria-label="Show UI"
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/80 text-muted-foreground opacity-0 shadow-sm backdrop-blur-md transition-opacity duration-150 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
          >
            <PanelTopOpen className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Rendered screen — fills below the bar (never obscured). A
          studio-style dot grid shows on zoom-out so the screen reads as
          sitting in a constrained canvas; zoom scales from the centre. ── */}
      <div
        // Measured wrapper — stable (overflow hidden), so Fit never
        // couples to scrollbar appearance on the scroller below
        // (that feedback loop oscillates; see use-artboard-zoom.ts).
        ref={screenRef}
        className="relative min-h-0 flex-1 overflow-hidden"
      >
      <div
        className="h-full w-full bg-muted/15"
        onWheel={(e) => {
          // Plain wheel = camera pan when framed (same as the canvas);
          // pinch goes through the session listeners above. Over the
          // live iframe the app keeps its own scrolling.
          if (!framed) return;
          if (e.ctrlKey || e.metaKey) return;
          panSessionByRef.current(-e.deltaX, -e.deltaY);
        }}
        // Middle-mouse drag pans without Space — only catches over
        // canvas chrome (the iframe swallows it elsewhere), same as
        // the focused canvas.
        onPointerDown={(e) => {
          if (e.button !== 1) return;
          e.preventDefault();
          beginPan(e);
        }}
        onPointerMove={movePan}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        style={{
          // Framed artboards are positioned by the translate camera —
          // no scrolling. Plain responsive fill keeps the old auto.
          overflow: framed || fitMode ? "hidden" : "auto",
          scrollbarGutter: framed || fitMode ? undefined : "stable both-edges",
          overscrollBehavior: "contain",
          backgroundImage:
            "radial-gradient(circle, color-mix(in oklab, var(--foreground) 22%, transparent) 1px, transparent 1.6px)",
          backgroundSize: "16px 16px",
        }}
      >
        {/* Pre-content hint only — once a source exists the artboard
            paints over the centre, and on zoom-out this would peek out
            from behind the shrunken artboard forever (the "Loading
            preview… on the canvas" bug). */}
        {!appSource && (
          <div className="absolute inset-0 z-0 flex items-center justify-center">
            <p className="animate-pulse text-sm text-muted-foreground">
              Loading preview…
            </p>
          </div>
        )}

        {/* ← Back — flow history chip (STUDIO-FLOWS). Only rendered once
            the viewer has navigated (stack non-empty); pops one screen.
            Escape does the same via the keyboard handler above. Floats
            top-left INSIDE the canvas area, above the iframe (z above
            the artboard, below the gesture shield at z-[60] is fine —
            the shield only exists mid-gesture). ONLY shown in device
            mode WITH Fit on (Ali, 22 Jul): that's the one arrangement
            where the scaled artboard leaves surround for the chip to
            sit on. Responsive fills the window, and device+Free at
            100% can too — both put the chip ON the app's own chrome.
            Esc still pops everywhere. */}
        {flowStack.length > 0 && !activeSpec.responsive && fitMode && (
          <div className="absolute left-3 top-3 z-[55]">
            <button
              type="button"
              onClick={popFlow}
              title="Back (Esc)"
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-foreground shadow-sm backdrop-blur-md transition hover:bg-foreground/10"
            >
              ← Back
            </button>
          </div>
        )}

        {/* ← All screens — the way home from a focused compare pane.
            Always visible while focused (the undiscoverable exit was
            the disjointed bit); Esc does the same. */}
        {compare && focusedPaneId && (
          <div className="absolute left-3 top-3 z-[55]">
            <button
              type="button"
              onClick={unfocusPanes}
              title="All screens (Esc)"
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-foreground shadow-sm backdrop-blur-md transition hover:bg-foreground/10"
            >
              ← All screens
            </button>
          </div>
        )}

        {/* Annotation — appears on zoom-out, labelling the screen as it
            sits in space. */}
        {effectiveZoom < 1 && (
          <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur-md">
              <span className="font-medium text-foreground">
                {compare
                  ? (scopeLabel ?? `${scopedMembers.length} screens`)
                  : currentScreenName}
              </span>
              <span className="opacity-40">·</span>
              <span className="tabular-nums">
                {fitMode ? "Fit" : `${Math.round(effectiveZoom * 100)}%`}
              </span>
            </span>
          </div>
        )}

        {/* The zoom transform + device width go on the IFRAME itself.
            Inline comments (pins injected into the iframe's own DOM) mean
            there are no parent-realm fixed pins for a transformed ancestor
            to scale — so we're free to wrap + centre the artboard. `framed`
            covers a fixed device preset AND the responsive content-height
            artboard; plain responsive (page fits the window) fills as
            before. */}
        <div
          className={cn(
            framed
              ? // Centred BOTH axes — camera home (pan 0,0) is the canvas
                // centre, mirroring the focused canvas.
                "flex h-full w-full items-center justify-center p-8"
              : "h-full w-full",
          )}
        >
          {/* Camera wrapper — sized to the SCALED artboard and moved by
              the translate camera when framed (sessions write inline
              styles here directly); a plain fill div otherwise. One
              element either way, so the iframe never remounts when
              flipping responsive ↔ device. */}
          <div
            ref={cameraRef}
            className={framed ? "relative shrink-0" : "h-full w-full"}
            style={
              framed && deviceSize
                ? {
                    width: deviceSize.w * effectiveZoom,
                    height: deviceSize.h * effectiveZoom,
                    transform: `translate(${pan.x}px, ${pan.y}px)`,
                    transition:
                      fitMode || artboard.gesturing || imperativeGesturing
                        ? undefined
                        : "width 340ms ease, height 340ms ease, transform 340ms ease",
                  }
                : undefined
            }
          >
          {compare ? (
            // ─── Compare row (scoped share home) — every member as a
            // live pane, side by side. The row carries the zoom
            // transform (panes render at natural size inside it); a
            // click-shield over each pane focuses it via the flow
            // stack, so panes never swallow pan/zoom gestures and a
            // stray click can't navigate a variant. ─────────────────
            <div
              className="flex items-start"
              style={{
                width: deviceSize?.w,
                height: deviceSize?.h,
                gap: GROUP_GAP,
                transform: `scale(${effectiveZoom})`,
                transformOrigin: "top left",
                // MUST match the camera wrapper's curve exactly — the
                // wrapper animates translate (pan) while this animates
                // scale, and a mismatched pair (ease vs overshoot)
                // reads as a boomerang swing on every focus/zoom.
                transition:
                  fitMode || artboard.gesturing || imperativeGesturing
                    ? undefined
                    : "transform 340ms ease",
              }}
            >
              {rowGroups.map((group) => (
                <div key={group.label ?? "*"} className="flex flex-col">
                  {/* Group label strip — only when the viewer picked a
                      group-by facet. Dot carries the facet's chart hue. */}
                  {rowGroupBy && (
                    <div
                      className="flex items-center px-1"
                      style={{ height: GROUP_LABEL_H }}
                    >
                      <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm backdrop-blur-md">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: tagTypeColor(rowGroupBy) }}
                        />
                        {group.label}
                        <span className="text-xs font-normal text-muted-foreground">
                          {group.panes.length}
                        </span>
                      </span>
                    </div>
                  )}
                  <div className="flex items-start" style={{ gap: PANE_GAP }}>
              {group.panes.map((m) => {
                const paneStack = paneStacks[m.id] ?? [];
                const paneTop =
                  paneStack.length > 0 ? paneStack[paneStack.length - 1] : null;
                const paneSource = paneTop?.appSource ?? m.appSource;
                const paneName = paneTop
                  ? (scopedMembers.find((s) => s.id === paneTop.id)?.name ??
                    m.name)
                  : m.name;
                return (
                <div
                  key={m.id}
                  className={cn(
                    "relative shrink-0 transition-opacity duration-300",
                    // Focused sibling treatment — monochrome + a gentle
                    // dim, hover restores opacity only. NO scale and no
                    // filter animation on hover: transform/filter on an
                    // iframe-sized element re-rasters every frame (the
                    // jerky hover); opacity is compositor-cheap. Blend
                    // modes auditioned and declined for the same
                    // processor bill (Ali called it).
                    focusedPaneId &&
                      focusedPaneId !== m.id &&
                      "opacity-70 saturate-0 hover:opacity-95",
                  )}
                  style={{ width: paneSize.w }}
                >
                  <div
                    className="flex items-center gap-1.5 px-1"
                    style={{ height: PANE_LABEL_H }}
                  >
                    {paneStack.length > 0 && (
                      <button
                        type="button"
                        onClick={() => panePop(m.id)}
                        title="Back"
                        className="inline-flex items-center rounded-full border border-border/60 bg-background/80 px-2 py-1 text-xs text-foreground shadow-sm backdrop-blur-md transition hover:bg-foreground/10"
                      >
                        ←
                      </button>
                    )}
                    <span className="inline-flex items-center rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-md">
                      {paneName}
                    </span>
                  </div>
                  <div
                    className="relative"
                    style={{ width: paneSize.w, height: paneSize.h }}
                  >
                    {isExternal ? (
                      <ExternalIframeHost
                        appSource={paneSource}
                        mode={mode}
                        registryId={shareRegistry.id}
                        // Comment pins anchor via contentDocument — one
                        // overlay per pane, mounted outside the camera.
                        iframeRef={paneIframeRef(m.id)}
                        // Per-PANE tweak scope — isolation even between
                        // duplicate screens sharing a dataHook.
                        tweakScope={`pane-${m.id}`}
                        // Pin mode: the focused pane's agent captures a
                        // pick for the composer.
                        selectMode={pinMode && focusedPaneId === m.id}
                        onSelect={(sel) =>
                          handlePinPick(sel, paneTop?.id ?? m.id)
                        }
                        // Interactive only while focused — a goto swaps
                        // THIS pane in place (row + siblings stay).
                        onGoto={
                          focusedPaneId === m.id
                            ? (t) => paneGoto(m.id, t)
                            : undefined
                        }
                        className="block rounded-[28px] ring-1 ring-border/40 bg-white dark:bg-[#09090b]"
                        style={{
                          width: paneSize.w,
                          height: paneSize.h,
                          boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.35)",
                        }}
                      />
                    ) : (
                      <FastIframeHost
                        appSource={paneSource}
                        sharedModules={sharedModules}
                        theme={activeTheme}
                        mode={mode}
                        motion={motionOn}
                        // Inline pins (fast dialect) — threads follow the
                        // pane's CURRENT screen, so pane-local navigation
                        // carries its comments along.
                        commentThreads={
                          showComments
                            ? threadsByDesign.get(paneTop?.id ?? m.id)
                            : undefined
                        }
                        inlineComments
                        getCommentUser={getCommentUser}
                        activeCommentThreadId={activeThreadId}
                        onCommentPinClick={(id) =>
                          setActiveThreadId((cur) => (cur === id ? null : id))
                        }
                        selectMode={pinMode && focusedPaneId === m.id}
                        onSelect={(sel) =>
                          handlePinPick(sel, paneTop?.id ?? m.id)
                        }
                        onGoto={
                          focusedPaneId === m.id
                            ? (t) => paneGoto(m.id, t)
                            : undefined
                        }
                        // Pane-local navigation lands the next screen at
                        // the top, same as the single-frame branch.
                        resetScrollKey={paneTop?.id ?? m.id}
                        className="block rounded-[28px] ring-1 ring-border/40 bg-white dark:bg-[#09090b]"
                        style={{
                          width: paneSize.w,
                          height: paneSize.h,
                          boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.35)",
                        }}
                      />
                    )}
                    {/* Focus shield — tap zooms the CAMERA to this pane
                        in place and dims the siblings; the focused pane
                        loses its shield and becomes the live, touchable
                        prototype. Tapping a dimmed pane refocuses. */}
                    {focusedPaneId !== m.id && (
                      <button
                        type="button"
                        onClick={() => focusPane(m.id)}
                        className="absolute inset-0 cursor-zoom-in rounded-[28px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        aria-label={`Focus ${m.name}`}
                        title={`Focus ${m.name}`}
                      />
                    )}
                  </div>
                </div>
                );
              })}
                  </div>
                </div>
              ))}
            </div>
          ) : isExternal ? (
          // External registry — the ext:* kernel instead of Fast Frame.
          // Theme prop intentionally absent (the DS's own tokens ride
          // inside the sandbox via runtime.previewCss; the toolbar's
          // theme selector is hidden above). Inline comment pins and
          // motion aren't in the ext protocol yet.
          <ExternalIframeHost
            appSource={currentSource}
            mode={mode}
            registryId={shareRegistry.id}
            // ONE tweak scope for the whole share session — tweaks
            // follow the walkthrough across gotos/screens (Ali: "a
            // single screen shared should always maintain the tweaks").
            tweakScope="share-session"
            // Viewer pin creation — pin mode arms the sandbox agent.
            selectMode={pinMode}
            onSelect={(sel) =>
              handlePinPick(sel, flowTop?.id ?? entryDesignId)
            }
            // Comment pins — host-side overlay below needs contentDocument
            // (same-origin /external-sandbox, same pattern as Studio's
            // ExternalDsMount). The ext protocol has no inline-pin channel
            // yet (queued with the F1 comments package).
            iframeRef={extIframeRef}
            // Flow navigation (STUDIO-FLOWS) — clicks on [data-grade-goto]
            // inside the screen resolve + push here.
            onGoto={resolveGoto}
            // F1: idle-compile the flow siblings so navigation swaps are
            // paint-only ("instant linkage").
            precompileSources={precompileSources}
            // Responsive only — feeds the content-height artboard above.
            onContentHeight={activeSpec.responsive ? setContentH : undefined}
            className={cn(
              "block",
              framed ? "shrink-0" : "h-full w-full",
              (framed || effectiveZoom < 1) &&
                // Concentric with the proposal shell's floating sidenav:
                // inner radius 16px (rounded-2xl) + its 12px inset = 28px
                // outer — the canvas curve hugs the panel's curve instead
                // of cutting across it (Ali, 16 Jul; global share change).
                "rounded-[28px] ring-1 ring-border/40 bg-white dark:bg-[#09090b]",
            )}
            style={{
              width: deviceSize?.w,
              height: deviceSize?.h,
              transform: `scale(${effectiveZoom})`,
              transformOrigin: framed ? "top left" : "center center",
              transition:
                fitMode || artboard.gesturing || imperativeGesturing
                  ? "box-shadow 220ms ease"
                  : `transform 340ms ${
                      effectiveZoom === 1
                        ? "cubic-bezier(0.33, 1.08, 0.68, 1)"
                        : "cubic-bezier(0.33, 1.25, 0.68, 1)"
                    }, box-shadow 220ms ease`,
              boxShadow:
                framed || effectiveZoom < 1
                  ? "0 25px 50px -12px rgb(0 0 0 / 0.35)"
                  : undefined,
            }}
          />
          ) : (
          <FastIframeHost
            appSource={currentSource}
            sharedModules={sharedModules}
            theme={activeTheme}
            mode={mode}
            motion={motionOn}
            // Viewer pin creation — same arming as the external branch.
            selectMode={pinMode}
            onSelect={(sel) =>
              handlePinPick(sel, flowTop?.id ?? entryDesignId)
            }
            // Flow navigation — same wire contract as the external host
            // (grade:goto / ext:goto, STUDIO-FLOWS two-agent rule).
            onGoto={resolveGoto}
            // Navigating swaps the source in place; without this the new
            // screen keeps the old scroll offset and long forms open
            // mid-page (Ali's fullscreen iPad walkthrough, 8 Aug).
            resetScrollKey={flowTop?.id ?? entryDesignId}
            // Comment threads stay bound to the ENTRY screen (threads are
            // keyed by design_id and fetched server-side for the token's
            // screen only) — hide the pins while navigated away so they
            // can't mis-anchor on a sibling screen's DOM.
            // TODO(F1): swap thread sets on navigation (STUDIO-FLOWS
            // "Comments … across a flow").
            commentThreads={
              showComments && flowStack.length === 0 ? entryThreads : undefined
            }
            getCommentUser={getCommentUser}
            // Inline mode — pins are injected into the iframe's live DOM by
            // the sandbox, so they ride scroll + the zoom transform below
            // natively. No fade-on-zoom needed (that was a workaround for
            // the parent overlay chasing rects), and crucially they are
            // never written into appSource / the stored source.
            inlineComments
            activeCommentThreadId={activeThreadId}
            onCommentPinClick={(id) =>
              setActiveThreadId((cur) => (cur === id ? null : id))
            }
            // Responsive only — feeds the content-height artboard above.
            onContentHeight={activeSpec.responsive ? setContentH : undefined}
            className={cn(
              "block",
              framed ? "shrink-0" : "h-full w-full",
              // Card treatment when framed as an artboard, or sitting
              // "in space" (zoomed out).
              (framed || effectiveZoom < 1) &&
                // Concentric with the proposal shell's floating sidenav:
                // inner radius 16px (rounded-2xl) + its 12px inset = 28px
                // outer — the canvas curve hugs the panel's curve instead
                // of cutting across it (Ali, 16 Jul; global share change).
                "rounded-[28px] ring-1 ring-border/40 bg-white dark:bg-[#09090b]",
            )}
            style={{
              width: deviceSize?.w,
              height: deviceSize?.h,
              transform: `scale(${effectiveZoom})`,
              // Top-LEFT origin when framed so the sized camera wrapper
              // exactly bounds the visual (and the session's anchor
              // math holds); centre origin for the responsive fill.
              transformOrigin: framed ? "top left" : "center center",
              // Gentle overshoot-and-settle on DELIBERATE zoom picks;
              // snapping back to 100% gets an even subtler curve. Fit
              // recomputes continuously during a browser resize —
              // animating those makes the artboard spring-chase the
              // window, so Fit tracks instantly. Same for continuous
              // GESTURES (pinch / slider drag / session commits):
              // gestures track raw.
              transition:
                fitMode || artboard.gesturing || imperativeGesturing
                  ? "box-shadow 220ms ease"
                  : `transform 340ms ${
                      effectiveZoom === 1
                        ? "cubic-bezier(0.33, 1.08, 0.68, 1)"
                        : "cubic-bezier(0.33, 1.25, 0.68, 1)"
                    }, box-shadow 220ms ease`,
              boxShadow:
                framed || effectiveZoom < 1
                  ? "0 25px 50px -12px rgb(0 0 0 / 0.35)"
                  : undefined,
            }}
          />
          )}
          </div>
        </div>

        {/* Comment pins on the EXTERNAL renderer — host-side overlay
            (fixed-position pins anchored via contentDocument rects,
            scale-aware), mounted OUTSIDE the camera's transformed div
            so position:fixed stays viewport-relative. Fast Frame uses
            inline in-DOM pins instead; this is the BL-share parity fix
            ("I still haven't seen comments"). Same gating as fast:
            toggle on, entry screen only (threads are keyed by
            design_id), faded while a zoom gesture settles. */}
        {/* Compare row (external): one pin overlay PER PANE, anchored
            into that pane's contentDocument. Threads follow each pane's
            CURRENT screen (pane-local navigation carries its comments).
            Multiview meeting notes — Ali, 18 Jul, "I'd really like
            that a lot". */}
        {isExternal &&
          compare &&
          showComments &&
          scopedMembers.map((m) => {
            const paneStack = paneStacks[m.id] ?? [];
            const paneTopId =
              paneStack.length > 0
                ? paneStack[paneStack.length - 1].id
                : m.id;
            const paneThreads = threadsByDesign.get(paneTopId) ?? [];
            if (paneThreads.length === 0) return null;
            return (
              <CanvasCommentPinsOverlay
                key={m.id}
                iframeRef={paneIframeRef(m.id)}
                threads={paneThreads}
                activeThreadId={activeThreadId}
                onPinClick={(id) =>
                  setActiveThreadId((cur) => (cur === id ? null : id))
                }
                getUser={getCommentUser}
                visible={!(artboard.gesturing || imperativeGesturing)}
              />
            );
          })}

        {isExternal &&
          !compare &&
          showComments &&
          flowStack.length === 0 &&
          threads.length > 0 && (
            <CanvasCommentPinsOverlay
              iframeRef={extIframeRef}
              threads={entryThreads}
              activeThreadId={activeThreadId}
              onPinClick={(id) =>
                setActiveThreadId((cur) => (cur === id ? null : id))
              }
              getUser={getCommentUser}
              visible={!(artboard.gesturing || imperativeGesturing)}
            />
          )}

        {/* Gesture / pan overlay — up while a zoom gesture settles
            (transparent pointer shield) or while Space is held (grab
            hand, drag pans — canvas Interact-mode vocabulary).
            ctrl/meta+wheel bubbles to the canvas wrapper (the
            session's listener home) so the pinch continues while the
            shield is up; plain wheel pans via the handler on the
            scroller this overlay covers. */}
        {(artboard.gesturing || imperativeGesturing || spaceHeld) && (
          <div
            data-gds-part="share-gesture-overlay"
            className="absolute inset-0 z-[60]"
            style={{
              touchAction: "none",
              cursor: spaceHeld ? (panning ? "grabbing" : "grab") : undefined,
            }}
            onPointerDown={(e) => {
              if (!spaceHeld && e.button !== 1) return;
              if (e.button !== 0 && e.button !== 1) return;
              e.preventDefault();
              beginPan(e);
            }}
            onPointerMove={movePan}
            onPointerUp={endPan}
            onPointerCancel={endPan}
            onWheel={(e) => {
              if (e.ctrlKey || e.metaKey) return; // pinch — handled upstream
              if (!framed) return;
              panSessionByRef.current(-e.deltaX, -e.deltaY);
            }}
          />
        )}
      </div>
      </div>

      {/* Comment thread popover — opens when a pin is clicked. Read for
          anyone; reply for signed-in viewers. Sits above pins, below the
          toolbar. (Anchoring to the pin + masking come next.) */}
      {activeThread && (
        <div className="absolute right-2 top-16 z-[65] flex max-h-[70vh] w-80 flex-col overflow-hidden rounded-lg border border-border/60 bg-background/80 shadow-xl backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
          <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
            <span className="truncate text-xs font-medium text-foreground">
              {activeThread.thread.componentName ??
                activeThread.thread.elementLabel}
            </span>
            <button
              type="button"
              onClick={() => setActiveThreadId(null)}
              aria-label="Close"
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {activeThread.comments.map((c) => {
              const u = getCommentUser(c.authorId);
              const mine = viewer?.id === c.authorId;
              return (
                <div key={c.id} className="group/comment flex gap-2">
                  <Avatar size="xs">
                    {u?.avatarUrl && (
                      <AvatarImage src={u.avatarUrl} alt={u?.name ?? ""} />
                    )}
                    <AvatarFallback className="text-[10px]">
                      {(u?.name ?? "?").slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-foreground">
                      {u?.name ?? "Someone"}
                    </div>
                    <div className="whitespace-pre-wrap break-words text-xs text-muted-foreground">
                      {c.body}
                    </div>
                  </div>
                  {/* Own comments are retractable — author-only,
                      enforced by the share route. Empty threads clean
                      themselves up (pin disappears). */}
                  {mine && shareToken && (
                    <button
                      type="button"
                      onClick={() => void handleDeleteComment(c.id)}
                      title="Delete your comment"
                      aria-label="Delete your comment"
                      className="h-5 w-5 shrink-0 self-start rounded flex items-center justify-center text-muted-foreground opacity-0 transition-opacity group-hover/comment:opacity-100 hover:bg-muted hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {viewer ? (
            <div className="border-t border-border/60 p-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Reply…"
                rows={2}
                className="w-full resize-none rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground/30"
              />
              <div className="mt-1.5 flex justify-end">
                <button
                  type="button"
                  onClick={handlePostReply}
                  disabled={posting || !replyText.trim()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  <Send className="h-3 w-3" />
                  {posting ? "Posting…" : "Reply"}
                </button>
              </div>
            </div>
          ) : (
            // The full round trip exists: /sign-in?next=… → OAuth
            // (Google/email per NEXT_PUBLIC_GRADE_AUTH_PROVIDERS) →
            // /auth/callback?next=… → back to THIS exact share URL,
            // drawer restorable, viewer signed in. Signing in grants
            // COMMENT ability only — shares stay capability-scoped by
            // token; a signed-in outsider gets no project access.
            <div className="border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
              <a
                href={`/sign-in?next=${encodeURIComponent(
                  typeof window !== "undefined"
                    ? window.location.pathname
                    : "/",
                )}`}
                className="font-medium text-foreground underline underline-offset-2 hover:opacity-80"
              >
                Sign in
              </a>{" "}
              to leave comments — you&apos;ll come straight back here.
            </div>
          )}
        </div>
      )}

      {/* New-pin composer — opens after a pin-mode pick. Fixed
          bottom-right (same neighbourhood as the reply drawer), names
          the picked element, posts through the share-token route. */}
      {pendingPin && (
        <div className="fixed bottom-4 right-4 z-[75] flex w-80 flex-col gap-2 rounded-xl border border-border/60 bg-background/95 p-3 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-medium text-foreground">
              New comment on{" "}
              <span className="text-muted-foreground">{pendingPin.label}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setPendingPin(null);
                setPinText("");
              }}
              aria-label="Cancel pin"
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <textarea
            autoFocus
            value={pinText}
            onChange={(e) => setPinText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void handlePostPin();
              } else if (e.key === "Escape") {
                setPendingPin(null);
                setPinText("");
              }
            }}
            rows={3}
            placeholder="Say the thing…"
            className="w-full resize-none rounded-md border border-border/60 bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary/50"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void handlePostPin()}
              disabled={!pinText.trim() || postingPin}
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition hover:opacity-90 disabled:opacity-40"
            >
              <Send className="h-3 w-3" />
              {postingPin ? "Pinning…" : "Pin comment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
