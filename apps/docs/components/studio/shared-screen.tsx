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
} from "lucide-react";
import { CanvasCommentPinsOverlay } from "@/components/studio/canvas-comment-pins-overlay";
import { FastIframeHost } from "@/components/studio/fast-frame";
import { ExternalIframeHost } from "@/components/studio/external-ds-frame";
import { getActiveRegistry, getRegistryById } from "@/lib/active-registry";
import { setProjectPreviewCss } from "@/lib/project-preview-css";
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
}: {
  appSource: string | null;
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
  flowScreens?: { id: string; name: string; appSource: string | null }[];
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
  // against the flow map and pushes; Back (chip / Escape) pops. No URL
  // change — the token stays the address of the flow, not the position.
  const [flowStack, setFlowStack] = React.useState<
    { id: string; appSource: string }[]
  >([]);
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
      setFlowStack((prev) => [...prev, { id: match.id, appSource: src }]);
    },
    [flowScreens],
  );
  const popFlow = React.useCallback(
    () => setFlowStack((prev) => prev.slice(0, -1)),
    [],
  );
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
  const [chromeVisible, setChromeVisible] = React.useState(true);
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
      if (activeSize) return activeSize;
      if (
        contentH !== null &&
        canvas.w > 0 &&
        canvas.h > 0 &&
        contentH > canvas.h + 8
      ) {
        return { w: Math.max(320, canvas.w - 64), h: contentH };
      }
      return undefined;
    },
    [activeSize, contentH],
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
  const artboard = useArtboardZoom({ deviceSize: resolveDeviceSize });
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
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
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
  const [showComments, setShowComments] = React.useState(true);
  const [activeThreadId, setActiveThreadId] = React.useState<string | null>(
    null,
  );
  const [replyText, setReplyText] = React.useState("");
  const [posting, setPosting] = React.useState(false);
  const getCommentUser = React.useCallback(
    (id: string) => commentUsers.find((u) => u.id === id),
    [commentUsers],
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
          fit();
          break;
        case "1":
          jump(1);
          break;
        case "2":
          jump(0.9);
          break;
        case "3":
          jump(0.75);
          break;
        case "4":
          jump(0.5);
          break;
        case "-":
        case "_":
          stepZoom(-1);
          break;
        case "=":
        case "+":
          stepZoom(1);
          break;
        case "Escape":
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
  }, [pickZoom, stepZoom, fit]);

  const iconBtn =
    "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground";
  const segBtn =
    "inline-flex h-5 w-6 items-center justify-center rounded-sm transition";

  return (
    <div
      className={cn(
        "flex h-screen w-screen flex-col overflow-hidden bg-background",
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
              <span className="truncate text-sm font-medium text-foreground">
                {/* Names the CURRENT screen — updates on flow navigation. */}
                {currentScreenName}
              </span>
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

            {/* Light / dark */}
            <div className="flex items-center rounded-md border border-border/60 p-0.5">
              <button
                type="button"
                onClick={() => setMode("light")}
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
                onClick={() => setMode("dark")}
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
      ) : (
        <button
          type="button"
          onClick={() => setChromeVisible(true)}
          title="Show UI (press .)"
          aria-label="Show UI"
          className="absolute right-2 top-2 z-[70] inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-background/70 text-muted-foreground shadow-sm backdrop-blur-md hover:text-foreground"
        >
          <PanelTopOpen className="h-4 w-4" />
        </button>
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
            the shield only exists mid-gesture). */}
        {flowStack.length > 0 && (
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

        {/* Annotation — appears on zoom-out, labelling the screen as it
            sits in space. */}
        {effectiveZoom < 1 && (
          <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur-md">
              <span className="font-medium text-foreground">{currentScreenName}</span>
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
          {isExternal ? (
          // External registry — the ext:* kernel instead of Fast Frame.
          // Theme prop intentionally absent (the DS's own tokens ride
          // inside the sandbox via runtime.previewCss; the toolbar's
          // theme selector is hidden above). Inline comment pins and
          // motion aren't in the ext protocol yet.
          <ExternalIframeHost
            appSource={currentSource}
            mode={mode}
            registryId={shareRegistry.id}
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
                "rounded-[28px] ring-1 ring-border/40",
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
            theme={activeTheme}
            mode={mode}
            motion={motionOn}
            // Flow navigation — same wire contract as the external host
            // (grade:goto / ext:goto, STUDIO-FLOWS two-agent rule).
            onGoto={resolveGoto}
            // Comment threads stay bound to the ENTRY screen (threads are
            // keyed by design_id and fetched server-side for the token's
            // screen only) — hide the pins while navigated away so they
            // can't mis-anchor on a sibling screen's DOM.
            // TODO(F1): swap thread sets on navigation (STUDIO-FLOWS
            // "Comments … across a flow").
            commentThreads={
              showComments && flowStack.length === 0 ? threads : undefined
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
                "rounded-[28px] ring-1 ring-border/40",
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
        {isExternal &&
          showComments &&
          flowStack.length === 0 &&
          threads.length > 0 && (
            <CanvasCommentPinsOverlay
              iframeRef={extIframeRef}
              threads={threads}
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
              return (
                <div key={c.id} className="flex gap-2">
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
            <div className="border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
              Sign in to reply.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
