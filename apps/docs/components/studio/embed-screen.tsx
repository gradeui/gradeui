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
import { Play, Pause } from "lucide-react";
import { useReducedMotion } from "@gradeui/ui";
import { FastIframeHost } from "@/components/studio/fast-frame";
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
  children,
}: {
  width: number;
  height?: number;
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
      const cw = el.clientWidth;
      const ch = el.clientHeight;
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
        // scaled box exactly fills the container height.
        const scale = cw / width;
        const ok = Number.isFinite(scale) && scale > 0;
        setBox({ w: width, h: ok ? ch / scale : ch, scale: ok ? scale : 1 });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height]);

  // Contain-fit centres + letterboxes; width-fit fills from the top-left.
  const centered = typeof height === "number" && height > 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 overflow-hidden",
        centered && "flex items-center justify-center",
      )}
      // The canvas behind the screen — only visible as letterbox bars in
      // contain-fit. Reads the DS canvas-fill token so embed/share/animator
      // all match; a theme can restyle it in one place.
      style={{ background: "var(--gds-canvas-fill)" }}
    >
      <div
        style={{
          width: box.w,
          height: box.h,
          transform: `scale(${box.scale})`,
          transformOrigin: centered ? "center" : "top left",
          flexShrink: 0,
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
  themeDraftJson,
  mode = "light",
  renderWidth,
  renderHeight,
  motion,
  zoom = 1,
  focusX = 0.5,
  focusY = 0.5,
  camera,
}: {
  appSource: string | null;
  themeDraftJson: string | null;
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

  // Fixed mode needs only a width. Height is an optional refinement.
  const fixed = typeof renderWidth === "number" && renderWidth > 0;

  const content = fixed ? (
    <ScaledRender
      width={renderWidth!}
      height={
        typeof renderHeight === "number" && renderHeight > 0
          ? renderHeight
          : undefined
      }
    >
      {/* The ScaledRender box owns the pixel size; the iframe fills it. */}
      <FastIframeHost
        appSource={appSource}
        theme={theme}
        mode={mode}
        motion={motion}
        className="block h-full w-full"
      />
    </ScaledRender>
  ) : (
    <FastIframeHost
      appSource={appSource}
      theme={theme}
      mode={mode}
      motion={motion}
      className="block h-full w-full"
    />
  );

  return (
    <div
      className={cn(
        "relative h-screen w-screen overflow-hidden bg-background",
        mode === "dark" && "dark",
      )}
      data-mode={mode}
    >
      <ZoomPan zoom={eff.zoom} focusX={eff.cx} focusY={eff.cy}>
        {content}
      </ZoomPan>

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
