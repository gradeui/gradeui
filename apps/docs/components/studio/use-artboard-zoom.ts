"use client";

/**
 * useArtboardZoom — the one zoom/fit implementation for every surface
 * that frames a rendered screen as an artboard (share view, focused
 * canvas, embed). Extracted from shared-screen.tsx so the canvas's
 * Fast Frame gets the exact same treatment the share UI has, instead
 * of a third hand-rolled copy.
 *
 * Vocabulary (matches the share view):
 *   - Freeform zoom is continuous on a 10%–400% range; the +/− steppers
 *     and the slider move in 10% increments, pinch (zoomBy) is
 *     continuous.
 *   - "Fit" is a computed scale (never above 1) that keeps the whole
 *     artboard inside the padded canvas. Responsive has no fixed
 *     artboard, so Fit just means 100%.
 *   - Any manual zoom gesture (pick / step / zoomBy) drops Fit;
 *     picking Fit re-enables it. Fit vs freeform is therefore a real
 *     mode toggle, not just a preset.
 *
 * The hook owns: zoom + fitMode state, canvas measurement (live via
 * ResizeObserver), the fit math, and the mutation gestures
 * (pickZoom / stepZoom / zoomBy / fit). Consumers own their own DOM +
 * keyboard wiring — attach `canvasRef` to the scrollable canvas area
 * and apply `effectiveZoom` as a CSS transform on the artboard. The
 * <ZoomControl> chrome component (zoom-control.tsx) is the shared UI
 * over this hook; `useZoomGestures` wires ctrl+wheel / trackpad pinch.
 */

import * as React from "react";

/** Continuous zoom range + the stepper/slider increment. The ceiling
 *  is deliberately deep (5000%) — pixel-inspection territory; the
 *  pixel-grid overlay kicks in at ZOOM_PIXEL_GRID and steps go coarse
 *  (multiplicative) above ZOOM_COARSE so ± stays useful up there. */
export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 50;
export const ZOOM_STEP = 0.1;
/** Above this, ± steps multiply by 1.25 instead of adding 10% — an
 *  additive 10% is imperceptible at 2000%. */
export const ZOOM_COARSE = 4;
/** Zoom at which the artboard shows the device-pixel grid overlay. */
export const ZOOM_PIXEL_GRID = 4;

/** Legacy discrete levels — kept for the keyboard shortcuts (1–4) and
 *  any UI that still presents presets. These are just convenient points
 *  on the continuous range now. Index 0 = 100%. */
export const ZOOM_LEVELS = [1, 0.9, 0.75, 0.5];

function clampZoom(z: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
}

/** Snap to the 10% grid — keeps stepper/slider values tidy after a
 *  continuous pinch leaves zoom at e.g. 0.6321. */
function snapZoom(z: number): number {
  return clampZoom(Math.round(z / ZOOM_STEP) * ZOOM_STEP);
}

/**
 * Device artboards — explicit width AND height so a preset reads as a
 * real device sitting on the canvas, not a full-height strip. Single
 * source of truth shared by the share view and the focused canvas
 * (widths match Studio's viewport vocabulary; heights are the common
 * logical sizes — iPhone 14/15 ≈ 844, iPad ≈ 1024, desktop window 900).
 */
export const ARTBOARD_DEVICE_SIZES: Record<
  "mobile" | "tablet" | "desktop",
  { w: number; h: number }
> = {
  mobile: { w: 390, h: 844 },
  tablet: { w: 768, h: 1024 },
  desktop: { w: 1440, h: 900 },
};

export interface ArtboardZoom {
  /** Attach to the scrollable canvas area the artboard sits in. The
   *  hook measures it (live, via ResizeObserver) to compute Fit. */
  canvasRef: (el: HTMLElement | null) => void;
  /** The element canvasRef is currently attached to — exposed so
   *  consumers can hang gesture listeners (useZoomGestures) on the
   *  same surface the fit math measures. */
  canvasEl: HTMLElement | null;
  /** Live canvas measurement (the element canvasRef is attached to). */
  canvasSize: { w: number; h: number };
  /** The resolved artboard size — the input value, or the result of
   *  calling the input function with the live canvas size. Undefined =
   *  no fixed artboard (responsive fill). */
  deviceSize: { w: number; h: number } | undefined;
  /** The manually-picked zoom (clamped to ZOOM_MIN..ZOOM_MAX). */
  zoom: number;
  /** True while Fit overrides the freeform zoom. */
  fitMode: boolean;
  /** The computed fit scale (1 when there's no fixed artboard). */
  fitZoom: number;
  /** The scale to actually apply to the artboard. */
  effectiveZoom: number;
  /** Pick a zoom value — always drops Fit mode. Clamped. Pass
   *  `{ gesture: true }` for continuous inputs (the slider drag) so
   *  the pick rides the gesture path: no per-tick transition, overlay
   *  up. Single deliberate picks omit it and keep the overshoot. */
  pickZoom: (z: number, opts?: { gesture?: boolean }) => void;
  /** Step ±10% (snapped to the grid). dir +1 = zoom in. Drops Fit —
   *  stepping FROM fit starts at the current fit scale, so the first
   *  press nudges what you're looking at rather than jumping to a
   *  stale freeform value. */
  stepZoom: (dir: number) => void;
  /** Multiply the current effective zoom — continuous, for pinch /
   *  ctrl+wheel. Drops Fit (seeded from the fit scale, same as
   *  stepZoom). No grid snapping; the UI snaps on its own gestures. */
  zoomBy: (factor: number) => void;
  /** True while a continuous gesture (zoomBy) is in flight — flips
   *  back ~180ms after the last tick. Consumers use it to (a) drop
   *  the deliberate-pick transform transition, which otherwise
   *  re-eases toward the transform origin on every wheel tick (the
   *  "sideways swoop"), and (b) raise an interaction-blocking overlay
   *  over the live preview so a pinch never clicks/scrolls the app. */
  gesturing: boolean;
  /** Enable Fit mode. */
  fit: () => void;
}

export function useArtboardZoom({
  deviceSize,
  defaultFit = false,
  pad = 64,
  persistKey,
}: {
  /** The artboard's fixed size. Omit for responsive (Fit = 100%).
   *  Can be a function of the live canvas size — used for the
   *  content-height artboard, whose width derives from the column
   *  (the hook owns the measurement, so a plain value can't see it). */
  deviceSize?:
    | { w: number; h: number }
    | ((canvas: { w: number; h: number }) =>
        | { w: number; h: number }
        | undefined);
  /** Start in Fit mode (the canvas does; the share view opens at 100%). */
  defaultFit?: boolean;
  /** Breathing room around the fitted artboard, in px (both axes). */
  pad?: number;
  /** localStorage prefix (e.g. "studio:artboard") — when set, zoom +
   *  fit survive a refresh. OPT-IN on purpose: the Studio canvas wants
   *  sticky workspace prefs; the share view and embeds must always
   *  open at their own defaults, never another surface's leftovers. */
  persistKey?: string;
} = {}): ArtboardZoom {
  // SSR-deterministic defaults; the persisted values are restored in a
  // one-shot effect AFTER mount. Reading localStorage inside the
  // useState initializer (the previous shape) made the client's first
  // render diverge from the server HTML whenever a stored zoom/fit
  // differed from the default — a hydration mismatch that regenerated
  // the whole tree client-side (and, as a side effect, tripped React
  // 19's "script tag while rendering" warning on the layout's
  // pre-hydration <Script>). Same hydrate-after-mount pattern as the
  // page's panel-visibility state.
  const [zoom, setZoom] = React.useState(1);
  const [fitMode, setFitMode] = React.useState(defaultFit);
  const restoredRef = React.useRef(false);
  React.useEffect(() => {
    if (restoredRef.current || !persistKey) return;
    restoredRef.current = true;
    try {
      const z = Number(window.localStorage.getItem(`${persistKey}:zoom`));
      if (Number.isFinite(z) && z >= ZOOM_MIN && z <= ZOOM_MAX) setZoom(z);
      const f = window.localStorage.getItem(`${persistKey}:fit`);
      if (f !== null) setFitMode(f === "true");
    } catch {
      // storage unavailable — keep defaults
    }
  }, [persistKey]);
  // Persist on change — skip the very first commit so the defaults
  // never clobber stored values before the restore effect's setState
  // has re-rendered.
  const persistArmedRef = React.useRef(false);
  React.useEffect(() => {
    if (!persistKey) return;
    if (!persistArmedRef.current) {
      persistArmedRef.current = true;
      return;
    }
    try {
      window.localStorage.setItem(`${persistKey}:zoom`, String(zoom));
      window.localStorage.setItem(`${persistKey}:fit`, String(fitMode));
    } catch {
      // storage unavailable — zoom just won't stick across refreshes
    }
  }, [persistKey, zoom, fitMode]);

  // Measure the canvas area so Fit can compute a scale. Callback-ref +
  // element state (rather than a RefObject) so measurement starts even
  // when the canvas element mounts conditionally / late.
  const [canvasEl, setCanvasEl] = React.useState<HTMLElement | null>(null);
  const canvasRef = React.useCallback(
    (el: HTMLElement | null) => setCanvasEl(el),
    [],
  );
  const [canvasSize, setCanvasSize] = React.useState({ w: 0, h: 0 });
  React.useEffect(() => {
    if (!canvasEl) return;
    // IMPORTANT: attach canvasRef to a STABLE, non-scrolling wrapper —
    // never the overflow:auto element itself. Measuring the scroller
    // creates a feedback loop: artboard overflows → scrollbar appears →
    // clientWidth shrinks → fit recomputes smaller → scrollbar drops →
    // width grows → fit recomputes bigger → oscillation ("bouncing").
    // The functional setState below also bails when nothing changed,
    // so ResizeObserver chatter can't re-render per frame.
    const measure = () =>
      setCanvasSize((prev) => {
        const w = canvasEl.clientWidth;
        const h = canvasEl.clientHeight;
        return prev.w === w && prev.h === h ? prev : { w, h };
      });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(canvasEl);
    return () => ro.disconnect();
  }, [canvasEl]);

  // Resolve a function-valued deviceSize against the live measurement.
  const resolvedDeviceSize = React.useMemo(
    () =>
      typeof deviceSize === "function" ? deviceSize(canvasSize) : deviceSize,
    [deviceSize, canvasSize],
  );

  // Fit scale — largest scale (never above 1) that keeps the whole
  // artboard inside the padded canvas.
  const fitZoom = React.useMemo(() => {
    if (!resolvedDeviceSize || canvasSize.w === 0 || canvasSize.h === 0)
      return 1;
    const s = Math.min(
      (canvasSize.w - pad) / resolvedDeviceSize.w,
      (canvasSize.h - pad) / resolvedDeviceSize.h,
    );
    return Math.min(1, Math.max(0.1, s));
  }, [resolvedDeviceSize, canvasSize, pad]);

  const effectiveZoom = fitMode ? fitZoom : zoom;

  // Mirror the live effective zoom into a ref so stepZoom/zoomBy can
  // seed from "what the user is currently looking at" (which is the
  // FIT scale while fitMode is on) without re-creating their callbacks
  // every time the fit math changes.
  const effectiveZoomRef = React.useRef(effectiveZoom);
  React.useEffect(() => {
    effectiveZoomRef.current = effectiveZoom;
  }, [effectiveZoom]);

  // Gesture-in-flight flag — see the ArtboardZoom doc. Timer-decayed
  // rather than event-paired because wheel-based pinches have no "end"
  // event; 180ms of silence is the conventional settle heuristic.
  const [gesturing, setGesturing] = React.useState(false);
  const gestureTimerRef = React.useRef<number | null>(null);
  const markGesture = React.useCallback(() => {
    setGesturing(true);
    if (gestureTimerRef.current !== null)
      window.clearTimeout(gestureTimerRef.current);
    gestureTimerRef.current = window.setTimeout(
      () => setGesturing(false),
      180,
    );
  }, []);
  React.useEffect(
    () => () => {
      if (gestureTimerRef.current !== null)
        window.clearTimeout(gestureTimerRef.current);
    },
    [],
  );

  const pickZoom = React.useCallback(
    (z: number, opts?: { gesture?: boolean }) => {
      setFitMode(false);
      setZoom(clampZoom(z));
      if (opts?.gesture) markGesture();
    },
    [markGesture],
  );

  const stepZoom = React.useCallback((dir: number) => {
    setFitMode(false);
    // Seed from the effective zoom (fit scale included). Below the
    // coarse threshold: snap to the 10% grid, step ±10% — from a
    // fitted 63%: snap → 60%, then +1 → 70%, −1 → 50%. Above it the
    // step turns multiplicative (×1.25 / ÷1.25, snapped to 25%-ish
    // values) so ± stays meaningful in pixel-inspection territory.
    setZoom(() => {
      const cur = effectiveZoomRef.current;
      if (cur < ZOOM_COARSE || (dir < 0 && cur <= ZOOM_COARSE)) {
        return snapZoom(snapZoom(cur) + dir * ZOOM_STEP);
      }
      const next = cur * (dir > 0 ? 1.25 : 1 / 1.25);
      return clampZoom(Math.max(ZOOM_COARSE, Math.round(next * 4) / 4));
    });
  }, []);

  const zoomBy = React.useCallback(
    (factor: number) => {
      if (!Number.isFinite(factor) || factor <= 0) return;
      setFitMode(false);
      setZoom(() => clampZoom(effectiveZoomRef.current * factor));
      markGesture();
    },
    [markGesture],
  );

  const fit = React.useCallback(() => setFitMode(true), []);

  return {
    canvasRef,
    canvasEl,
    canvasSize,
    deviceSize: resolvedDeviceSize,
    zoom,
    fitMode,
    fitZoom,
    effectiveZoom,
    pickZoom,
    stepZoom,
    zoomBy,
    gesturing,
    fit,
  };
}

/**
 * useZoomGestures — wires trackpad pinch / ctrl+wheel (and Safari's
 * proprietary `gesturechange`) on a target element into an ArtboardZoom.
 *
 * Browsers report a macOS trackpad pinch as a `wheel` event with
 * `ctrlKey: true` (a de-facto standard across Chrome/Firefox/Edge), so
 * one listener covers both "pinch on trackpad" and "ctrl/cmd + scroll
 * wheel". `preventDefault` stops the browser's own page-zoom from
 * firing — which is why the listener is attached non-passive.
 *
 * Scope note: events only reach the parent document while the pointer
 * is over parent-owned chrome (canvas padding, toolbars, the artboard
 * frame). Over the preview IFRAME the events land in the iframe's
 * document — the sandbox agent forwards ctrl+wheel out via the
 * `grade:zoom-gesture` postMessage, which consumers feed into the same
 * `zoomBy`. See studio-canvas / shared-screen wiring.
 */
export function useZoomGestures(
  el: HTMLElement | null,
  zoomBy: (factor: number) => void,
) {
  React.useEffect(() => {
    if (!el) return;
    // Coalesce to one application per animation frame — trackpads fire
    // wheel at 120Hz+, and a state update per tick re-renders the whole
    // consumer tree per event (the "treacly pinch"). Factors compose
    // multiplicatively, so accumulating then applying once is lossless.
    let acc = 1;
    let raf: number | null = null;
    const flush = () => {
      raf = null;
      const f = acc;
      acc = 1;
      if (f !== 1) zoomBy(f);
    };
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      // Exponential mapping keeps pinch speed perceptually uniform
      // across zoom levels; 0.01 is the conventional sensitivity.
      acc *= Math.exp(-e.deltaY * 0.01);
      if (raf === null) raf = requestAnimationFrame(flush);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [el, zoomBy]);
}
