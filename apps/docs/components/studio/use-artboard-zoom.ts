"use client";

/**
 * useArtboardZoom — the one zoom/fit implementation for every surface
 * that frames a rendered screen as an artboard (share view, focused
 * canvas, embed). Extracted from shared-screen.tsx so the canvas's
 * Fast Frame gets the exact same treatment the share UI has, instead
 * of a third hand-rolled copy.
 *
 * Vocabulary (matches the share view):
 *   - Discrete zoom levels are down-only — never past 100%, where
 *     scaling up just looks broken.
 *   - "Fit" is a computed scale (never above 1) that keeps the whole
 *     artboard inside the padded canvas. Responsive has no fixed
 *     artboard, so Fit just means 100%.
 *   - Picking a discrete level drops Fit; picking Fit re-enables it.
 *
 * The hook owns: zoom + fitMode state, canvas measurement (live via
 * ResizeObserver), the fit math, and the three mutation gestures
 * (pickZoom / stepZoom / fit). Consumers own their own DOM + keyboard
 * wiring — attach `canvasRef` to the scrollable canvas area and apply
 * `effectiveZoom` as a CSS transform on the artboard.
 */

import * as React from "react";

/** Discrete zoom levels. Index 0 = most zoomed-in (100%). */
export const ZOOM_LEVELS = [1, 0.9, 0.75, 0.5];

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
  /** Live canvas measurement (the element canvasRef is attached to). */
  canvasSize: { w: number; h: number };
  /** The resolved artboard size — the input value, or the result of
   *  calling the input function with the live canvas size. Undefined =
   *  no fixed artboard (responsive fill). */
  deviceSize: { w: number; h: number } | undefined;
  /** The manually-picked discrete level (one of ZOOM_LEVELS). */
  zoom: number;
  /** True while Fit overrides the discrete level. */
  fitMode: boolean;
  /** The computed fit scale (1 when there's no fixed artboard). */
  fitZoom: number;
  /** The scale to actually apply to the artboard. */
  effectiveZoom: number;
  /** Pick a discrete level — always drops Fit mode. */
  pickZoom: (z: number) => void;
  /** Step through ZOOM_LEVELS. dir +1 = zoom in (toward 100%). */
  stepZoom: (dir: number) => void;
  /** Enable Fit mode. */
  fit: () => void;
}

export function useArtboardZoom({
  deviceSize,
  defaultFit = false,
  pad = 64,
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
} = {}): ArtboardZoom {
  const [zoom, setZoom] = React.useState(1);
  const [fitMode, setFitMode] = React.useState(defaultFit);

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

  const pickZoom = React.useCallback((z: number) => {
    setFitMode(false);
    setZoom(z);
  }, []);

  const stepZoom = React.useCallback((dir: number) => {
    setFitMode(false);
    setZoom((z) => {
      const i = ZOOM_LEVELS.indexOf(z);
      if (i === -1) return z;
      const next = Math.min(
        ZOOM_LEVELS.length - 1,
        Math.max(0, i - dir), // dir +1 = zoom in (toward index 0)
      );
      return ZOOM_LEVELS[next];
    });
  }, []);

  const fit = React.useCallback(() => setFitMode(true), []);

  return {
    canvasRef,
    canvasSize,
    deviceSize: resolvedDeviceSize,
    zoom,
    fitMode,
    fitZoom,
    effectiveZoom,
    pickZoom,
    stepZoom,
    fit,
  };
}
