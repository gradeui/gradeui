"use client";

/**
 * ZoomControl — the shared zoom chrome over `useArtboardZoom`.
 *
 * One component, two consumers (Studio's focused canvas + the share
 * view's toolbar; the embed can adopt it later). Renders:
 *
 *   [ Fit | Free ]  [−] ──────●────── [+]  100%
 *
 *   - Fit / Free segmented toggle — Fit re-enables the computed
 *     fit scale; Free hands control back at the snapped current scale
 *     (so toggling never jumps the view).
 *   - − / + steppers — ±10% (×1.25 above 400%; see stepZoom).
 *   - Range slider — 10%–5000% on a LOG scale, 10% increments in the
 *     working range, 25% steps above 400% (pixel-inspection range).
 *     Dragging exits Fit, same as any manual gesture.
 *   - Tabular percent readout, doubling as a click-to-reset-to-100%.
 *
 * Pinch / ctrl+wheel is NOT wired here — gestures belong to the canvas
 * surface, not the control. Pair with `useZoomGestures` (and the
 * sandbox's `grade:zoom-gesture` forwarding for pinches that start over
 * the preview iframe).
 *
 * Styling matches the share toolbar's glass vocabulary (border-border/60,
 * hover:bg-foreground/10) and exposes the slider accent through the
 * `--gds-zoom-accent` custom property (defaults to the theme primary)
 * so a surface can retint it without touching the component.
 */

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_STEP,
  type ArtboardZoom,
} from "@/components/studio/use-artboard-zoom";

export interface ZoomControlProps {
  /** The artboard-zoom state object from `useArtboardZoom`. */
  artboard: Pick<
    ArtboardZoom,
    "zoom" | "fitMode" | "effectiveZoom" | "pickZoom" | "stepZoom" | "fit"
  >;
  /** Hide the slider (steppers + readout only) for tight toolbars. */
  compact?: boolean;
  className?: string;
}

const PCT_MIN = Math.round(ZOOM_MIN * 100); // 10
const PCT_MAX = Math.round(ZOOM_MAX * 100); // 5000

/**
 * The slider runs on a LOG scale — 10% → 5000% is two and a half
 * orders of magnitude, and a linear track would bury everything below
 * 400% in the first few pixels. Position t ∈ [0, SLIDER_STEPS] maps to
 * zoom = MIN · (MAX/MIN)^(t/STEPS); values snap to the 10% grid below
 * the coarse threshold and to 25% steps above, mirroring stepZoom.
 */
const SLIDER_STEPS = 200;
const LOG_RATIO = Math.log(ZOOM_MAX / ZOOM_MIN);
function zoomToSlider(z: number): number {
  const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
  return Math.round((Math.log(clamped / ZOOM_MIN) / LOG_RATIO) * SLIDER_STEPS);
}
function sliderToZoom(pos: number): number {
  const z = ZOOM_MIN * Math.exp((pos / SLIDER_STEPS) * LOG_RATIO);
  // Mirror stepZoom's snapping: tidy 10% values in the working range,
  // 25% steps in pixel-inspection territory.
  return z < 4 ? Math.round(z / ZOOM_STEP) * ZOOM_STEP : Math.round(z * 4) / 4;
}

export function ZoomControl({ artboard, compact, className }: ZoomControlProps) {
  const { fitMode, effectiveZoom, pickZoom, stepZoom, fit } = artboard;
  const pct = Math.round(effectiveZoom * 100);

  // "Free" hands control back at the current (snapped) scale so the
  // artboard doesn't jump when leaving Fit.
  const toFree = React.useCallback(() => {
    pickZoom(Math.round(effectiveZoom / ZOOM_STEP) * ZOOM_STEP);
  }, [pickZoom, effectiveZoom]);

  const segBtn =
    "h-5 rounded-[5px] px-1.5 text-[11px] font-medium leading-none transition";

  return (
    <div
      data-gds-part="zoom-control"
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-md border border-border/60 px-1.5 text-xs text-foreground",
        className,
      )}
      style={
        {
          "--gds-zoom-accent": "oklch(var(--primary))",
        } as React.CSSProperties
      }
    >
      {/* Fit / Free mode toggle */}
      <div
        role="group"
        aria-label="Zoom mode"
        className="flex items-center gap-0.5 rounded-md bg-foreground/5 p-0.5"
      >
        <button
          type="button"
          onClick={fit}
          aria-pressed={fitMode}
          title="Fit the whole artboard (0)"
          className={cn(
            segBtn,
            fitMode
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Fit
        </button>
        <button
          type="button"
          onClick={toFree}
          aria-pressed={!fitMode}
          title="Freeform zoom"
          className={cn(
            segBtn,
            !fitMode
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Free
        </button>
      </div>

      {/* − stepper */}
      <button
        type="button"
        onClick={() => stepZoom(-1)}
        disabled={!fitMode && pct <= PCT_MIN}
        title="Zoom out 10% (−)"
        aria-label="Zoom out"
        className="flex h-5 w-5 items-center justify-center rounded-[5px] text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      {/* 10%–5000% log slider — 10% increments in the working range,
          coarser above 400% (see zoomToSlider/sliderToZoom). */}
      {!compact && (
        <input
          type="range"
          min={0}
          max={SLIDER_STEPS}
          step={1}
          value={zoomToSlider(effectiveZoom)}
          // gesture: true — a slider drag is a continuous input, so it
          // rides the gesture path (no per-tick easing, overlay up)
          // instead of re-triggering the deliberate-pick overshoot.
          onChange={(e) =>
            pickZoom(sliderToZoom(Number(e.target.value)), { gesture: true })
          }
          aria-label="Zoom level"
          title={`Zoom: ${pct}%`}
          className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-foreground/15 accent-[var(--gds-zoom-accent)] [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--gds-zoom-accent)] [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[var(--gds-zoom-accent)]"
        />
      )}

      {/* + stepper */}
      <button
        type="button"
        onClick={() => stepZoom(1)}
        disabled={!fitMode && pct >= PCT_MAX}
        title="Zoom in 10% (+)"
        aria-label="Zoom in"
        className="flex h-5 w-5 items-center justify-center rounded-[5px] text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>

      {/* Readout — click to reset to 100% */}
      <button
        type="button"
        onClick={() => pickZoom(1)}
        title="Reset to 100% (1)"
        className="min-w-[3.25rem] rounded-[5px] px-1 text-right tabular-nums text-foreground transition hover:bg-foreground/10"
      >
        {fitMode ? `Fit · ${pct}%` : `${pct}%`}
      </button>
    </div>
  );
}
