"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * TimelineBars — the reusable clips-on-a-ruler primitive.
 *
 * Extracted from the timeline dock so the bar UI is ONE hand-editable
 * component rather than markup buried in the dock: the ruler, the clip
 * bars, the travelling playhead, and drag-to-scrub all live here. The
 * dock (and anything else that wants a timeline — the overlay lane,
 * camera shots, a future audio lane) feeds it clips and callbacks.
 *
 * Hand-tuning knobs, all in one place:
 *   - RULER_H / LANE_H / CLIP_H  — the vertical rhythm
 *   - clip styling               — the `clipClass` strings below
 *   - playhead                   — the gdsTimelinePlayhead keyframes
 *
 * Scrub is SNAP-TO-CLIP today (pointer position resolves to the clip
 * under it → onSelect). Continuous time scrub arrives with the seekable
 * clock (STUDIO-DIRECTOR, D4/M2) — this component's API already fits it
 * (swap onSelect for an onScrub(ms) without changing callers).
 */

export interface TimelineBarClip {
  label: string;
  startMs: number;
  durMs: number;
  /** Optional hover tooltip; defaults to "label — N.Ns". */
  title?: string;
}

const RULER_H = 28; // px — the seconds ruler strip
const LANE_H = 40; // px — the clip lane
const CLIP_H = 24; // px — a clip bar

export function TimelineBars({
  clips,
  activeIndex,
  paused = false,
  onSelect,
  playheadMs,
  onScrub,
  className,
}: {
  clips: TimelineBarClip[];
  /** Which clip the playhead travels through (estimate mode — used when
   *  `playheadMs` isn't supplied). */
  activeIndex?: number;
  /** Freezes the playhead (animation-play-state, estimate mode). */
  paused?: boolean;
  /** Click a clip / drag — snap-seek fallback when no `onScrub`. */
  onSelect?: (index: number) => void;
  /** CLOCK MODE: the film's master time. When provided, the playhead is
   *  positioned exactly (no estimating animation) and drags emit
   *  millisecond positions via `onScrub`. */
  playheadMs?: number;
  /** CLOCK MODE: continuous scrub — receives the ms under the pointer. */
  onScrub?: (ms: number) => void;
  className?: string;
}) {
  const totalMs = Math.max(
    1000,
    clips.reduce((end, c) => Math.max(end, c.startMs + c.durMs), 0),
  );
  const seconds = Math.max(1, Math.ceil(totalMs / 1000));
  const clockMode = playheadMs !== undefined;

  // Drag-to-scrub — continuous ms in clock mode, snap-to-clip otherwise.
  const laneRef = React.useRef<HTMLDivElement>(null);
  const draggingRef = React.useRef(false);
  const [dragging, setDragging] = React.useState(false);
  const seekAt = React.useCallback(
    (clientX: number) => {
      const el = laneRef.current;
      if (!el || clips.length === 0) return;
      const r = el.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      const t = ratio * totalMs;
      if (onScrub) {
        onScrub(Math.round(t));
        return;
      }
      if (!onSelect) return;
      for (let i = 0; i < clips.length; i++) {
        if (t < clips[i].startMs + clips[i].durMs) {
          onSelect(i);
          return;
        }
      }
      onSelect(clips.length - 1);
    },
    [clips, onSelect, onScrub, totalMs],
  );

  const active = Math.max(0, Math.min(activeIndex ?? 0, clips.length - 1));
  const head = clips[active];

  return (
    <div
      ref={laneRef}
      className={cn("relative min-w-0 flex-1", className)}
      onPointerDown={(e) => {
        draggingRef.current = true;
        setDragging(true);
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        seekAt(e.clientX);
      }}
      onPointerMove={(e) => {
        if (draggingRef.current) seekAt(e.clientX);
      }}
      onPointerUp={() => {
        draggingRef.current = false;
        setDragging(false);
      }}
      style={{ cursor: onSelect ? "ew-resize" : undefined, touchAction: "none" }}
    >
      {/* Ruler */}
      <div
        className="relative border-b border-border/40 text-[9px] text-muted-foreground"
        style={{ height: RULER_H }}
      >
        {Array.from({ length: seconds + 1 }).map((_, s) => (
          <span
            key={s}
            className="absolute bottom-0.5 pl-1"
            style={{ left: `${((s * 1000) / totalMs) * 100}%` }}
          >
            {s}s
          </span>
        ))}
      </div>

      {/* Clip lane */}
      <div
        className="relative border-b border-border/30"
        style={{ height: LANE_H }}
      >
        {clips.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect?.(i)}
            title={c.title ?? `${c.label} — ${(c.durMs / 1000).toFixed(1)}s`}
            className={cn(
              "absolute flex items-center justify-center overflow-hidden rounded-md border text-[10px] text-primary/80 transition-colors",
              onSelect && "cursor-pointer",
              i === activeIndex
                ? "border-primary bg-primary/25"
                : "border-primary/40 bg-primary/15 hover:bg-primary/20",
            )}
            style={{
              top: (LANE_H - CLIP_H) / 2,
              height: CLIP_H,
              left: `${(c.startMs / totalMs) * 100}%`,
              width: `calc(${(c.durMs / totalMs) * 100}% - 2px)`,
            }}
          >
            <span className="absolute left-0 top-0 h-full w-1.5 rounded-l-md bg-primary/50" />
            <span className="truncate px-2">{c.label}</span>
            <span className="absolute right-0 top-0 h-full w-1.5 rounded-r-md bg-primary/50" />
          </button>
        ))}
      </div>

      {/* Playhead. CLOCK MODE: positioned exactly from the film's master
          time (smoothed by a short linear transition between ~150ms
          broadcasts). Estimate mode: animates through the active clip. */}
      {clockMode ? (
        <div
          className="pointer-events-none absolute bottom-0 top-0 w-px bg-primary"
          style={{
            left: `${(Math.min(playheadMs!, totalMs) / totalMs) * 100}%`,
            // Smooth between playback broadcasts; INSTANT under the
            // pointer — smoothing during a drag reads as lag.
            transition: dragging ? "none" : "left 160ms linear",
          }}
        >
          <span className="absolute -left-[3px] -top-0.5 h-2 w-[7px] rounded-sm bg-primary" />
        </div>
      ) : (
        <>
          <style>{`@keyframes gdsTimelinePlayhead { from { left: var(--tb-from) } to { left: var(--tb-to) } }`}</style>
          {head && (
            <div
              key={active}
              className="pointer-events-none absolute bottom-0 top-0 w-px bg-primary"
              style={{
                ["--tb-from" as string]: `${(head.startMs / totalMs) * 100}%`,
                ["--tb-to" as string]: `${((head.startMs + head.durMs) / totalMs) * 100}%`,
                animation: `gdsTimelinePlayhead ${head.durMs}ms linear both`,
                animationPlayState: paused ? "paused" : "running",
              }}
            >
              <span className="absolute -left-[3px] -top-0.5 h-2 w-[7px] rounded-sm bg-primary" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
