"use client";

/**
 * EmbedScreen — the chrome-free render behind an /e/<token> embed.
 *
 * Same renderer as Studio and the share view (FastIframeHost), with the
 * editing + presentation chrome stripped: no toolbar, no theme switcher,
 * no zoom controls, no comment pins. An embed is read-or-tweak, not edit
 * and not annotate (see STUDIO-EMBED.md / STUDIO-CAPTURE.md consumer 3).
 *
 * Two sizing modes:
 *
 *   - Responsive (default) — the screen fills the host iframe and reflows
 *     to its width, so @media breakpoints evaluate against the iframe's
 *     own viewport. A narrow box shows the mobile layout.
 *
 *   - Fixed resolution (renderWidth set) — the screen renders at that
 *     virtual WIDTH and is scaled to fit the iframe via CSS transform.
 *     Breakpoints fire at the fixed width, so you get a faithful,
 *     proportionally-shrunk render (a desktop layout miniaturised) rather
 *     than a reflow. Width is the meaningful knob — it pins the
 *     breakpoints. Height is optional:
 *       - width only → the render fills the iframe box; its virtual height
 *         is derived from the box so it always fills (the common case).
 *       - width + height → exact contain-fit into a width×height artboard,
 *         centred and letterboxed (a precise thumbnail). Same model the
 *         Studio grid tiles and the share view's fixed-device frame use.
 *
 * The screen's stored colour mode is applied as the initial mode. Theme
 * comes from the project's themeDraftJson (same path as SharedScreen),
 * falling back to the default built-in theme.
 */

import * as React from "react";
import { Play, Pause, Frame, Image as ImageIcon, Ruler } from "lucide-react";
import { useReducedMotion } from "@gradeui/ui";
import { FastIframeHost } from "@/components/studio/fast-frame";
import { ExternalIframeHost } from "@/components/studio/external-ds-frame";
import { getActiveRegistry, getRegistryById } from "@/lib/active-registry";
import { EmbedTweaker, type EmbedTweakControl } from "@/components/studio/embed-tweaker";
import {
  generateTheme,
  builtInThemes,
  defaultThemeId,
} from "@/lib/themes";
import type { ThemeInput, GeneratedTheme } from "@/lib/themes";
import { cn } from "@/lib/utils";

/**
 * Renders `children` at a fixed virtual `width` and scales the box to fit
 * the parent via CSS transform. A ResizeObserver keeps the scale live as
 * the host iframe resizes. Two behaviours:
 *
 *   - height given → contain-fit: the largest scale that keeps a
 *     width×height artboard inside the container on both axes, centred and
 *     letterboxed. A precise thumbnail. Mirrors the fitZoom math in
 *     shared-screen.tsx and the tile scaling in studio-canvas.tsx.
 *   - height omitted → width-fit: scale = containerWidth / width, and the
 *     artboard's virtual height is derived from the container so the
 *     scaled box fills the iframe edge-to-edge from the top-left. Width
 *     still pins the breakpoints; the box just fills whatever shape it is
 *     given.
 *
 * The inner box is sized here and `children` fills it (h-full w-full), so
 * the iframe always has an explicit pixel height (it can't auto-size to
 * content cross-origin — that's the future auto-height handshake).
 */
function ScaledRender({
  width,
  height,
  transparent = false,
  pad = 0,
  radius = 0,
  canvasColor,
  animate = false,
  children,
}: {
  width: number;
  height?: number;
  transparent?: boolean;
  /** Inset (px) between the canvas edge and the screen, so the screen floats
   *  with margin inside the canvas fill. Most meaningful in contain-fit. */
  pad?: number;
  /** Corner radius (px, in screen space) applied to the rendered viewport. */
  radius?: number;
  /** Override the canvas / letterbox fill colour (else the DS token). */
  canvasColor?: string;
  /** Smoothly tween size/scale changes (used by the viewport switcher). */
  animate?: boolean;
  children: React.ReactNode;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [box, setBox] = React.useState<{ w: number; h: number; scale: number }>(
    { w: width, h: height ?? 0, scale: 1 },
  );

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      // Subtract the padding so the fit happens inside the inset, leaving
      // `pad` of canvas fill showing around the screen.
      const cw = Math.max(0, el.clientWidth - pad * 2);
      const ch = Math.max(0, el.clientHeight - pad * 2);
      if (height) {
        // Contain-fit into a fixed width×height artboard.
        const scale = Math.min(cw / width, ch / height);
        setBox({
          w: width,
          h: height,
          scale: Number.isFinite(scale) && scale > 0 ? scale : 1,
        });
      } else {
        // Width-fit: scale by width, derive the virtual height so the
        // scaled box exactly fills the (padded) container height.
        const scale = cw / width;
        const ok = Number.isFinite(scale) && scale > 0;
        setBox({ w: width, h: ok ? ch / scale : ch, scale: ok ? scale : 1 });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height, pad]);

  // Contain-fit centres + letterboxes; width-fit fills from the top-left.
  const centered = typeof height === "number" && height > 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 overflow-hidden",
        centered && "flex items-center justify-center",
      )}
      // The canvas behind the screen — visible as letterbox bars in
      // contain-fit and as the `pad` inset around the screen. Defaults to the
      // DS canvas-fill token so embed/share/animator match; `canvasColor`
      // (?bg=<colour>) overrides it.
      style={{
        background: transparent
          ? "transparent"
          : (canvasColor ?? "var(--gds-canvas-fill)"),
        padding: pad || undefined,
      }}
    >
      <div
        style={{
          width: box.w,
          height: box.h,
          transform: `scale(${box.scale})`,
          transformOrigin: centered ? "center" : "top left",
          flexShrink: 0,
          // Radius is in screen px; divide by the scale so it renders at the
          // requested size after the box is scaled down to fit.
          borderRadius: radius ? radius / (box.scale || 1) : undefined,
          overflow: radius ? "hidden" : undefined,
          // Tween size + scale so a viewport switch glides rather than snaps.
          // A soft ease-in-out (slow-in, slow-out) reads as a deliberate
          // "device morph" rather than a snap.
          transition: animate
            ? "width 640ms cubic-bezier(0.65, 0, 0.35, 1), height 640ms cubic-bezier(0.65, 0, 0.35, 1), transform 640ms cubic-bezier(0.65, 0, 0.35, 1)"
            : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}

/**
 * Zoom + focal-point pan for the embedded screen. Scales by `zoom` and
 * shifts so the focal point (fractions of the screen) lands at the centre of
 * the box; the parent's overflow-hidden crops to the visible window.
 *
 * Transform math (origin 0,0): a point at (fx·W, fy·H) maps to
 * (fx·W·zoom, fy·H·zoom) after scaling, then we translate it to the centre
 * (W/2, H/2) — in element-relative %, translate((0.5 − fx·zoom),
 * (0.5 − fy·zoom)). When zoom is 1 and the focus is centred it's a plain
 * full-bleed wrapper (no transform), so interactivity + layout are untouched.
 */
function ZoomPan({
  zoom,
  focusX,
  focusY,
  children,
}: {
  zoom: number;
  focusX: number;
  focusY: number;
  children: React.ReactNode;
}) {
  const z = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  const fx = clamp01(focusX);
  const fy = clamp01(focusY);
  const active = z !== 1 || fx !== 0.5 || fy !== 0.5;

  if (!active) return <div className="absolute inset-0">{children}</div>;

  return (
    <div
      className="absolute inset-0"
      style={{
        transform: `translate(${(0.5 - fx * z) * 100}%, ${(0.5 - fy * z) * 100}%) scale(${z})`,
        transformOrigin: "0 0",
      }}
    >
      {children}
    </div>
  );
}

// ── Camera timeline ──────────────────────────────────────────────────
//
// A camera is a zoom + focal point. A *timeline* is an ordered list of
// shots the camera tweens between — hold on a shot, glide to the next, loop.
// This is the engine behind "chainable zoom"; later it can be driven by
// interaction events (auto-zoom to a click) or carry narrative captions per
// shot, but the runner is the same.

export interface CameraShot {
  zoom: number;
  cx: number;
  cy: number;
  /** How long to hold on this shot before moving on. */
  holdMs: number;
  /** How long the glide INTO this shot takes (from the previous one). */
  transMs: number;
}

type CamPosition = { zoom: number; cx: number; cy: number };

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Runs a camera timeline, returning the live {zoom, cx, cy} to apply. Honours
 * reduced-motion / explicit pause by `frozen` — settles on the first shot and
 * doesn't animate. `paused` halts in place (the position is held; resuming
 * continues from the current shot). Returns null when there's no timeline.
 */
/** One option in the viewport switcher (?viewports=). A virtual width
 *  (pins breakpoints) and an optional height (for a contain-fit device
 *  artboard). */
export interface ViewportOption {
  id: string;
  label: string;
  w: number;
  h?: number;
}

function useCameraTimeline(
  shots: CameraShot[] | undefined,
  frozen: boolean,
  paused: boolean,
): CamPosition | null {
  const first = shots && shots.length > 0 ? shots[0] : null;
  const [cam, setCam] = React.useState<CamPosition | null>(
    first ? { zoom: first.zoom, cx: first.cx, cy: first.cy } : null,
  );
  // Persist the current shot index across pause/resume + re-renders.
  const idxRef = React.useRef(0);

  React.useEffect(() => {
    if (!shots || shots.length === 0) {
      setCam(null);
      return;
    }
    const f = { zoom: shots[0].zoom, cx: shots[0].cx, cy: shots[0].cy };
    // Single shot, reduced-motion, or motion off → static on the first shot.
    if (shots.length === 1 || frozen) {
      idxRef.current = 0;
      setCam(f);
      return;
    }
    // Paused → hold whatever position we're at (don't reset).
    if (paused) return;

    let cancelled = false;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const at = (i: number): CamPosition => ({
      zoom: shots[i].zoom,
      cx: shots[i].cx,
      cy: shots[i].cy,
    });
    const lerp = (a: CamPosition, b: CamPosition, t: number): CamPosition => ({
      zoom: a.zoom + (b.zoom - a.zoom) * t,
      cx: a.cx + (b.cx - a.cx) * t,
      cy: a.cy + (b.cy - a.cy) * t,
    });
    const wait = (ms: number) =>
      new Promise<void>((res) => {
        timer = setTimeout(res, ms);
      });
    const glide = (from: CamPosition, to: CamPosition, durMs: number) =>
      new Promise<void>((res) => {
        if (durMs <= 0) {
          setCam(to);
          res();
          return;
        }
        const start = performance.now();
        const tick = (now: number) => {
          if (cancelled) return res();
          const t = Math.min(1, (now - start) / durMs);
          setCam(lerp(from, to, easeInOutCubic(t)));
          if (t < 1) raf = requestAnimationFrame(tick);
          else res();
        };
        raf = requestAnimationFrame(tick);
      });

    const run = async () => {
      while (!cancelled) {
        const i = idxRef.current;
        setCam(at(i));
        await wait(shots[i].holdMs);
        if (cancelled) return;
        const next = (i + 1) % shots.length;
        await glide(at(i), at(next), shots[next].transMs);
        if (cancelled) return;
        idxRef.current = next;
      }
    };
    void run();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
    };
  }, [shots, frozen, paused]);

  return cam;
}

export function EmbedScreen({
  appSource,
  sharedModules = null,
  themeDraftJson,
  registryId = null,
  flowScreens,
  mode = "light",
  renderWidth,
  renderHeight,
  motion,
  zoom = 1,
  focusX = 0.5,
  focusY = 0.5,
  camera,
  tweak,
  tweakThemes,
  tweakOpen = false,
  shield = false,
  transparent = false,
  fidelity = "full",
  fidelityToggle = false,
  inspect = false,
  inspectToggle = false,
  pad = 0,
  radius = 0,
  canvasColor,
  viewports,
  viewportsAuto = false,
  viewportsDelay = 4600,
  viewportsMaxLoops = 0,
}: {
  appSource: string | null;
  /** Project shared components ({name → JSX module source}) — ride
   *  every Fast Frame compile so screens can import
   *  "@project/components". Fetched server-side by /e/[token]. */
  sharedModules?: Readonly<Record<string, string>> | null;
  themeDraftJson: string | null;
  /** The share's PROJECT registry id (projects.registry_id) — same
   *  contract as SharedScreen. External registries (BYODS, e.g.
   *  "brightlocal") render through ExternalIframeHost's ext:* kernel;
   *  null/"gradeui" keeps Fast Frame. Before this prop the embed was
   *  the ONE surface that wasn't registry-aware — every BL screen
   *  404-of-the-soul'd here, which also broke MCP preview_screen. */
  registryId?: string | null;
  /** Flow map (STUDIO-FLOWS) — every screen in the share's project,
   *  resolved server-side by /e/[token]. Same stack + resolver pattern
   *  as SharedScreen: [data-grade-goto] clicks push, Back/Escape pop. */
  flowScreens?: { id: string; name: string; appSource: string | null }[];
  mode?: "light" | "dark";
  /** Fixed virtual resolution. `renderWidth` alone engages fixed mode
   *  (width pins the breakpoints; the box fills); add `renderHeight` for an
   *  exact contain-fit artboard. No width = responsive. */
  renderWidth?: number;
  renderHeight?: number;
  /** Global motion toggle, forwarded to the iframe. `false` suppresses
   *  animation (ThreeScene pauses, CSS animation stills); `undefined` leaves
   *  the iframe to honour the viewer's OS reduced-motion preference.
   *  Reduce-only. */
  motion?: boolean;
  /** Magnification of the rendered screen (1 = none). >1 zooms in; the
   *  host box crops to the visible window. */
  zoom?: number;
  /** Focal point to centre in the box, as fractions of the screen
   *  (0 = left/top, 0.5 = centre, 1 = right/bottom). Lets you zoom into a
   *  specific region rather than the middle. */
  focusX?: number;
  focusY?: number;
  /** A camera timeline — an ordered list of shots the camera glides between
   *  (chainable zoom). When set, it drives the transform instead of the
   *  static zoom/focus. 2+ shots show a play/pause transport. */
  camera?: CameraShot[];
  /** Embed-local theme playground (?tweak= on the embed URL). Lists the
   *  controls to expose; null/empty = no overlay. Changes regenerate a
   *  theme client-side and flow through the normal grade:fast-theme
   *  push — nothing persists. */
  tweak?: EmbedTweakControl[] | null;
  /** Curated theme ids for the tweaker's picker (?themes=). */
  tweakThemes?: string[] | null;
  /** Start the theme playground open (?tweakopen=1). */
  tweakOpen?: boolean;
  /** Click-to-interact shield (?shield=1), rendered INSIDE the embed so
   *  every host gets it for free. Clicks are guarded until the visitor
   *  opts in; moving the pointer off the frame re-arms it. Page scroll
   *  over the frame keeps working via the wheel forwarder. */
  shield?: boolean;
  /** Transparent embed (?bg=transparent): no page background, no
   *  letterbox fill, and the sandbox document paints nothing — the host
   *  page shows through wherever the screen doesn't paint. */
  transparent?: boolean;
  /** Initial render fidelity (?fidelity=wireframe). "wireframe" stamps
   *  `data-fidelity="wireframe"` inside the sandbox (via the existing
   *  grade:set-fidelity push), cross-fading MediaSurface imagery out and
   *  the tiered placeholders back in — the "show the structure, not the
   *  pictures" view. Pure CSS inside the iframe; see the "MediaSurface
   *  fidelity" rules in @gradeui/ui globals.css. */
  fidelity?: "wireframe" | "full";
  /** Viewer-facing fidelity toggle (?fidelitytoggle=1): a corner chip
   *  that flips between full imagery and wireframe with the cross-fade.
   *  `fidelity` sets which side it starts on. */
  fidelityToggle?: boolean;
  /** Start with the hover-measure inspector on (?inspect=1): hovering
   *  any element outlines it with its part name + size in virtual px.
   *  Read-only — no selection, nothing leaves the iframe. */
  inspect?: boolean;
  /** Viewer-facing inspector toggle (?inspecttoggle=1) — corner chip
   *  next to the fidelity one. */
  inspectToggle?: boolean;
  /** Inset in px between the canvas edge and the screen (?pad=). The screen
   *  floats with that much canvas fill around it. */
  pad?: number;
  /** Corner radius in px (screen space) on the rendered viewport (?radius=). */
  radius?: number;
  /** Canvas / letterbox fill colour, overriding the DS token (?bg=<colour>).
   *  `transparent` still wins and clears the fill entirely. */
  canvasColor?: string;
  /** Viewer-facing viewport switcher (?viewports=desktop,tablet,mobile).
   *  Each option swaps the virtual width/height at runtime, so the screen
   *  re-lays-out at real breakpoints. The URL w/h are the initial size. */
  viewports?: ViewportOption[];
  /** Auto-cycle through `viewports` on a loop, animated (?viewportsauto=1).
   *  Honours reduced-motion / ?motion=off (then it holds on the first).
   *  Stops the moment the visitor picks a viewport or engages the embed. */
  viewportsAuto?: boolean;
  /** ms each viewport is held before auto-advancing (?viewportsdelay=). */
  viewportsDelay?: number;
  /** How many full passes to auto-cycle before stopping (?viewportsloops=).
   *  0 = loop forever (until the visitor interacts). */
  viewportsMaxLoops?: number;
}) {
  // Project theme — same resolution as SharedScreen: parse the draft,
  // generate the ramp set, fall back to the default built-in on any
  // malformed input.
  const theme = React.useMemo<GeneratedTheme>(() => {
    if (themeDraftJson) {
      try {
        return generateTheme(JSON.parse(themeDraftJson) as ThemeInput);
      } catch {
        /* fall through to default */
      }
    }
    return builtInThemes[defaultThemeId];
  }, [themeDraftJson]);

  // The screen's own ThemeInput — the EmbedTweaker's "Original" anchor.
  const baseInput = React.useMemo<ThemeInput>(() => {
    if (themeDraftJson) {
      try {
        return JSON.parse(themeDraftJson) as ThemeInput;
      } catch {
        /* fall through */
      }
    }
    return builtInThemes[defaultThemeId].input;
  }, [themeDraftJson]);

  // Embed-local overrides from the tweaker. Null = render the screen's
  // own theme/mode. FastIframeHost re-pushes grade:fast-theme whenever
  // these change, so edits re-theme the live render instantly.
  const [liveTheme, setLiveTheme] = React.useState<GeneratedTheme | null>(null);
  const [liveMode, setLiveMode] = React.useState<"light" | "dark" | null>(null);
  const effTheme = liveTheme ?? theme;
  const effMode = liveMode ?? mode;
  const onTweak = React.useCallback(
    (t: GeneratedTheme, m: "light" | "dark") => {
      setLiveTheme(t);
      setLiveMode(m);
    },
    [],
  );

  // ─── Flow navigation (STUDIO-FLOWS F0) — same stack + resolver as
  // SharedScreen. Empty stack = the share's own screen; a click on an
  // author-wired [data-grade-goto] element pushes; Back/Escape pops.
  const [flowStack, setFlowStack] = React.useState<
    { id: string; appSource: string }[]
  >([]);
  const flowTop = flowStack.length > 0 ? flowStack[flowStack.length - 1] : null;
  // currentSource feeds EVERY renderer callsite below (the external
  // frame + both FastIframeHost branches) — navigation is just a
  // source push with a different screen.
  const currentSource = flowTop ? flowTop.appSource : appSource;
  const resolveGoto = React.useCallback(
    (target: string) => {
      const t = target.trim();
      if (!t) return;
      // "screen:<id>" pins exactly; anything else is a screen name,
      // matched case-insensitively after trimming (STUDIO-FLOWS).
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
  // F1 "instant linkage" — same derivation as SharedScreen: the OTHER
  // flow screens' sources, forwarded as ext:precompile so a goto swap
  // is paint-only. Only when the project actually has siblings.
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

  // Escape pops one screen. The embed has no other parent-realm Escape
  // consumer (selection/inspector Escapes live inside the iframe realm).
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setFlowStack((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // In-embed click shield (?shield=1): guard interaction until the
  // visitor opts in; re-arm when the pointer leaves the frame.
  const [shieldDown, setShieldDown] = React.useState(false);

  // Live fidelity — starts on the param's side, flipped by the viewer
  // chip. Forwarded into FastIframeHost, which re-posts on iframe boot
  // so a re-mounted frame keeps the current side.
  const [liveFidelity, setLiveFidelity] = React.useState<"wireframe" | "full">(
    fidelity,
  );

  // Live inspector state — same shape as fidelity: param picks the
  // starting side, the chip flips it, FastIframeHost re-posts on boot.
  const [liveInspect, setLiveInspect] = React.useState(inspect);

  // Wheel forwarding — when the embed is framed and the wheel event
  // isn't consumed by a scrollable element INSIDE the embed (the theme
  // sheet's list, say), post the delta to the parent so hovering the
  // embed never creates a page-scroll dead zone. The host opts in by
  // listening for grade:embed-wheel (LiveEmbed does when shieldless).
  const onWheelForward = React.useCallback((e: React.WheelEvent) => {
    if (typeof window === "undefined" || window.parent === window) return;
    // Walk up from the target: if anything scrollable can consume this
    // delta, let it (the sheet's theme list must keep its own scroll).
    let el = e.target as HTMLElement | null;
    while (el && el !== e.currentTarget) {
      if (el.scrollHeight > el.clientHeight + 1) {
        const oy = getComputedStyle(el).overflowY;
        if (oy === "auto" || oy === "scroll") return;
      }
      el = el.parentElement;
    }
    try {
      window.parent.postMessage(
        { type: "grade:embed-wheel", deltaY: e.deltaY, deltaX: e.deltaX },
        "*",
      );
    } catch {
      /* parent gone */
    }
  }, []);

  // Boot beacons — when the embed is itself FRAMED (an MCP App panel, a
  // blog, the future grade-embed host page), post lifecycle milestones to
  // the parent. postMessage crosses origins and sandboxes, so this is the
  // one periscope into the embed when the surrounding host (e.g. a Claude
  // MCP panel) gives us no DevTools. Fire-and-forget; "*" target is fine —
  // the payload carries no data worth protecting.
  React.useEffect(() => {
    if (typeof window === "undefined" || window.parent === window) return;
    const beacon = (stage: string) => {
      try {
        window.parent.postMessage({ type: "grade:embed-status", stage }, "*");
      } catch {
        /* parent gone — nothing to report to */
      }
    };
    beacon("hydrated");
    // "painted" ≈ two RAFs after mount — first real frame committed.
    let raf1 = 0, raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => beacon("painted"));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  // Camera timeline. Reduced-motion or ?motion=off freezes it on the first
  // shot (it's motion, so it answers to the same control as everything else).
  // `paused` is the viewer's play/pause. When there's no timeline, the static
  // zoom/focus props drive the transform.
  const reduced = useReducedMotion();
  const motionFrozen = reduced || motion === false;
  const [paused, setPaused] = React.useState(false);
  const cam = useCameraTimeline(camera, motionFrozen, paused);
  const eff = cam ?? { zoom, cx: focusX, cy: focusY };
  const showTransport =
    Array.isArray(camera) && camera.length > 1 && !motionFrozen;

  // Viewport switcher. The active option overrides the URL's w/h at runtime,
  // so the screen re-lays-out at real breakpoints. Auto-cycle loops through
  // them (animated) unless motion is frozen.
  const hasViewports = Array.isArray(viewports) && viewports.length > 0;
  const [vpIdx, setVpIdx] = React.useState(0);
  const [vpAuto, setVpAuto] = React.useState(viewportsAuto);
  const activeVp = hasViewports
    ? viewports![Math.min(vpIdx, viewports!.length - 1)]
    : null;
  // Any deliberate interaction stops the auto-cycle so the visitor isn't
  // fighting a moving target.
  const pickViewport = React.useCallback((i: number) => {
    setVpIdx(i);
    setVpAuto(false);
  }, []);
  React.useEffect(() => {
    if (!hasViewports || !vpAuto || motionFrozen) return;
    const n = viewports!.length;
    const maxSteps = viewportsMaxLoops > 0 ? viewportsMaxLoops * n : Infinity;
    let steps = 0;
    const id = setInterval(
      () => {
        steps += 1;
        setVpIdx((i) => (i + 1) % n);
        // After the requested number of full passes, settle and stop.
        if (steps >= maxSteps) {
          clearInterval(id);
          setVpAuto(false);
        }
      },
      Math.max(600, viewportsDelay),
    );
    return () => clearInterval(id);
  }, [hasViewports, vpAuto, motionFrozen, viewports, viewportsDelay, viewportsMaxLoops]);

  const effWidth = activeVp ? activeVp.w : renderWidth;
  const effHeight = activeVp ? activeVp.h : renderHeight;

  // Fixed mode needs only a width. Height is an optional refinement.
  const fixed = typeof effWidth === "number" && effWidth > 0;

  // External registry (BYODS) — same branch as SharedScreen: resolve
  // the project's registry, and anything non-gradeui renders through
  // the ext:* kernel. Theme/motion/fidelity/inspect props are Fast
  // Frame concerns and intentionally absent on the external host (the
  // DS's own tokens ride inside the sandbox via runtime.previewCss).
  const embedRegistry = getRegistryById(registryId) ?? getActiveRegistry();
  const isExternal = embedRegistry.id !== "gradeui";
  // Readiness contract for the capture loop (preview.ts): the external
  // sandbox paints visible STATUS text ("loading design system…") while
  // esm.sh boots, which would trip the capturer's visible-text fallback
  // into screenshotting the loading state. Stamp data-grade-ready on a
  // layout-neutral wrapper instead — "0" booting, "1" on ext:rendered,
  // "error" on ext:error (the error panel is then the honest capture).
  const [extReady, setExtReady] = React.useState<"0" | "1" | "error">("0");
  const externalFrame = (
    <div style={{ display: "contents" }} data-grade-ready={extReady}>
      <ExternalIframeHost
        appSource={currentSource}
        mode={effMode}
        registryId={embedRegistry.id}
        // Flow navigation (STUDIO-FLOWS) — [data-grade-goto] clicks
        // resolve + push via the stack above.
        onGoto={resolveGoto}
        // F1: idle-compile flow siblings ("instant linkage").
        precompileSources={precompileSources}
        onRendered={() => setExtReady("1")}
        // null = "error cleared" (retry succeeded) — only real messages
        // stamp the error state; a later ext:rendered flips it to "1".
        onError={(m) => (m ? setExtReady("error") : undefined)}
        className="block h-full w-full"
      />
    </div>
  );

  const content = fixed ? (
    <ScaledRender
      transparent={transparent}
      pad={pad}
      radius={radius}
      canvasColor={canvasColor}
      animate={hasViewports}
      width={effWidth!}
      height={
        typeof effHeight === "number" && effHeight > 0
          ? effHeight
          : undefined
      }
    >
      {/* The ScaledRender box owns the pixel size; the iframe fills it. */}
      {isExternal ? (
        externalFrame
      ) : (
        <FastIframeHost
          appSource={currentSource}
          sharedModules={sharedModules}
          theme={effTheme}
          mode={effMode}
          motion={motion}
          fidelity={liveFidelity}
          inspect={inspect || inspectToggle ? liveInspect : undefined}
          transparent={transparent}
          // Flow navigation — grade:goto, the Fast Frame twin of the
          // external host's ext:goto (STUDIO-FLOWS).
          onGoto={resolveGoto}
          // Navigation lands the next screen at the top (long forms
          // otherwise keep the previous screen's scroll offset).
          resetScrollKey={flowTop?.id ?? "entry"}
          className="block h-full w-full"
        />
      )}
    </ScaledRender>
  ) : isExternal ? (
    externalFrame
  ) : (
    <FastIframeHost
      appSource={currentSource}
      sharedModules={sharedModules}
      theme={effTheme}
      mode={effMode}
      motion={motion}
      fidelity={liveFidelity}
      inspect={inspect || inspectToggle ? liveInspect : undefined}
      transparent={transparent}
      // Flow navigation — grade:goto (STUDIO-FLOWS).
      onGoto={resolveGoto}
      // Navigation lands the next screen at the top (long forms
      // otherwise keep the previous screen's scroll offset).
      resetScrollKey={flowTop?.id ?? "entry"}
      className="block h-full w-full"
    />
  );

  return (
    <div
      className={cn(
        "relative h-screen w-screen overflow-hidden",
        transparent ? "bg-transparent" : "bg-background",
        effMode === "dark" && "dark",
      )}
      data-mode={effMode}
      onWheel={onWheelForward}
      onPointerLeave={shield ? () => setShieldDown(false) : undefined}
      style={
        !transparent && canvasColor ? { background: canvasColor } : undefined
      }
    >
      <ZoomPan zoom={eff.zoom} focusX={eff.cx} focusY={eff.cy}>
        {content}
      </ZoomPan>

      {shield && !shieldDown && (
        <button
          type="button"
          aria-label="Click to interact with this render"
          onClick={() => {
            setShieldDown(true);
            setVpAuto(false);
          }}
          className="absolute inset-0 z-30 cursor-pointer appearance-none border-0 bg-transparent p-0"
        />
      )}
      {shield && !shieldDown && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute bottom-3 right-3 z-40 rounded-full border px-3 py-1.5 text-xs backdrop-blur-md",
            effMode === "dark"
              ? "border-white/20 bg-black/45 text-white/90"
              : "border-black/15 bg-white/70 text-neutral-900",
          )}
        >
          Click to interact
        </span>
      )}

      {/* Viewer mode chips (?fidelitytoggle=1 / ?inspecttoggle=1) — a
          bottom-LEFT row, so it coexists with the shield pill / camera
          transport on the right. Both are VIEW toggles delivered as
          postMessages into the sandbox: fidelity is the pure-CSS
          wireframe cross-fade (grade:set-fidelity → data-fidelity),
          inspect is the read-only hover-measure overlay
          (grade:set-inspect). */}
      {/* The flow Back chip shares this row (bottom-LEFT) so it never
          collides with the fidelity/measure chips — the embed is
          chrome-free, keep it one subtle cluster. z-10 like the other
          chips is fine: you can't have navigated while the shield
          (z-30) is still up, so Back never needs to beat it. */}
      {(fidelityToggle || inspectToggle || flowStack.length > 0) && (
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
          {/* ← Back — flow history (STUDIO-FLOWS), only when navigated.
              Escape pops too (keydown effect above). */}
          {flowStack.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setFlowStack((prev) => prev.slice(0, -1))
              }
              aria-label="Back to the previous screen"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs backdrop-blur-md transition",
                effMode === "dark"
                  ? "border-white/20 bg-black/45 text-white/90 hover:bg-black/60"
                  : "border-black/15 bg-white/70 text-neutral-900 hover:bg-white/90",
              )}
            >
              ← Back
            </button>
          )}
          {fidelityToggle && (
            <button
              type="button"
              onClick={() =>
                setLiveFidelity((f) => (f === "full" ? "wireframe" : "full"))
              }
              aria-label={
                liveFidelity === "full"
                  ? "Show wireframe (hide imagery)"
                  : "Show full imagery"
              }
              aria-pressed={liveFidelity === "wireframe"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs backdrop-blur-md transition",
                effMode === "dark"
                  ? "border-white/20 bg-black/45 text-white/90 hover:bg-black/60"
                  : "border-black/15 bg-white/70 text-neutral-900 hover:bg-white/90",
              )}
            >
              {liveFidelity === "full" ? (
                <Frame className="h-3.5 w-3.5" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5" />
              )}
              {liveFidelity === "full" ? "Wireframe" : "Full"}
            </button>
          )}
          {inspectToggle && (
            <button
              type="button"
              onClick={() => setLiveInspect((v) => !v)}
              aria-label={
                liveInspect
                  ? "Turn off measurements"
                  : "Measure elements on hover"
              }
              aria-pressed={liveInspect}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs backdrop-blur-md transition",
                effMode === "dark"
                  ? "border-white/20 bg-black/45 text-white/90 hover:bg-black/60"
                  : "border-black/15 bg-white/70 text-neutral-900 hover:bg-white/90",
                liveInspect &&
                  (effMode === "dark" ? "bg-black/70" : "bg-white"),
              )}
            >
              <Ruler className="h-3.5 w-3.5" />
              Measure
            </button>
          )}
        </div>
      )}

      {/* Viewport switcher (?viewports=) — a bottom-centre segmented pill.
          Each option swaps the virtual width/height; the change tweens via
          ScaledRender's `animate`. z-40 keeps it tappable over the shield. */}
      {hasViewports && (
        <div
          className={cn(
            "absolute bottom-3 left-1/2 z-40 inline-flex -translate-x-1/2 items-center gap-0.5 rounded-full border p-1 backdrop-blur-md",
            effMode === "dark"
              ? "border-white/20 bg-black/45"
              : "border-black/15 bg-white/70",
          )}
        >
          {viewports!.map((vp, i) => {
            const on = i === vpIdx;
            return (
              <button
                key={vp.id}
                type="button"
                onClick={() => pickViewport(i)}
                aria-pressed={on}
                aria-label={`Viewport: ${vp.label}`}
                className={cn(
                  "rounded-full px-3 py-1 text-xs transition",
                  on
                    ? effMode === "dark"
                      ? "bg-white/90 text-neutral-900"
                      : "bg-neutral-900 text-white"
                    : effMode === "dark"
                      ? "text-white/80 hover:text-white"
                      : "text-neutral-700 hover:text-neutral-900",
                )}
              >
                {vp.label}
              </button>
            );
          })}
        </div>
      )}

      {tweak && tweak.length > 0 && (
        <EmbedTweaker
          baseInput={baseInput}
          baseMode={mode}
          allow={tweak}
          themeIds={tweakThemes}
          defaultOpen={tweakOpen}
          onChange={onTweak}
        />
      )}

      {showTransport && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "Play camera" : "Pause camera"}
          className="absolute bottom-3 right-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-md transition hover:bg-black/60"
        >
          {paused ? (
            <Play className="h-4 w-4" />
          ) : (
            <Pause className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
}
