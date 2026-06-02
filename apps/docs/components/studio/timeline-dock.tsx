"use client";

import * as React from "react";
import { Film, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * TimelineDock — the docked panel under the Studio preview (the "Timeline" view
 * mode). Encapsulated so studio-canvas just drops it in.
 *
 * Two ways to see the same data (toggle in the header):
 *   - "Events" — the foci-and-noodles view. Each shot is a focus node; the
 *     transitions between them are the noodles ("take me from here to there").
 *     This is the model the director reduces to.
 *   - "Timeline" — the traditional lanes view: clips on a time ruler, sized to
 *     their real durations.
 *
 * It populates from the focused screen's source: the same `<ScreenAnimator>`
 * shot list the iframe animates from (`extractCameraShots`). The write half
 * (`replaceShotsInSource`) round-trips edits back through the source-mutation
 * channel. Reading is live today; dragging / per-event editing is the next slice.
 */

export interface TimelineCameraShot {
  zoom: number;
  cx: number;
  cy: number;
  /** ms dwell on the shot */
  hold: number;
  /** ms glide INTO the shot from the previous one */
  trans: number;
  label: string | null;
}

const DEFAULT_HOLD = 2400;
const DEFAULT_TRANS = 1150;

/**
 * Pull a ScreenAnimator shot list out of a screen's JSX source. Heuristic
 * (regex, not a full parse): finds an inline `shots={[ ... ]}` or a
 * `const SHOTS = [ ... ]` and reads each shot's numeric fields + label.
 */
export function extractCameraShots(src: string | null): TimelineCameraShot[] {
  if (!src) return [];
  let arr: string | null = null;
  const inline = src.match(/shots=\{(\[[\s\S]*?\])\}/);
  if (inline) arr = inline[1];
  if (!arr) {
    const named = src.match(
      /(?:const|let|var)\s+SHOTS\s*=\s*(\[[\s\S]*?\])\s*;/,
    );
    if (named) arr = named[1];
  }
  if (!arr) return [];

  const objs = arr.match(/\{[^{}]*\}/g) ?? [];
  const num = (o: string, key: string, d: number) => {
    const m = o.match(new RegExp(`${key}\\s*:\\s*(-?[0-9.]+)`));
    return m ? Number(m[1]) : d;
  };
  return objs.map((o) => {
    const lm = o.match(/label\s*:\s*["'`]([^"'`]*)["'`]/);
    return {
      zoom: num(o, "zoom", 1),
      cx: num(o, "cx", 0.5),
      cy: num(o, "cy", 0.5),
      hold: num(o, "hold", DEFAULT_HOLD),
      trans: num(o, "trans", DEFAULT_TRANS),
      label: lm ? lm[1] : null,
    };
  });
}

function roundf(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * Serialize a shot list back into a `[ ... ]` array literal — the WRITE half of
 * the round-trip, the inverse of `extractCameraShots`.
 */
export function serializeShots(shots: TimelineCameraShot[]): string {
  const body = shots
    .map((s) => {
      const parts = [
        `zoom: ${roundf(s.zoom)}`,
        `cx: ${roundf(s.cx)}`,
        `cy: ${roundf(s.cy)}`,
        `hold: ${Math.round(s.hold)}`,
      ];
      if (s.trans !== DEFAULT_TRANS) parts.push(`trans: ${Math.round(s.trans)}`);
      if (s.label) parts.push(`label: ${JSON.stringify(s.label)}`);
      return `  { ${parts.join(", ")} }`;
    })
    .join(",\n");
  return `[\n${body},\n]`;
}

/**
 * Write an edited shot list back into a screen's source. Finds the same anchor
 * `extractCameraShots` reads from and swaps the array literal in place. Returns
 * the new source, or null when there's no anchor to write into.
 */
export function replaceShotsInSource(
  src: string,
  shots: TimelineCameraShot[],
): string | null {
  const literal = serializeShots(shots);
  const inlineRe = /(shots=\{)(\[[\s\S]*?\])(\})/;
  if (inlineRe.test(src)) return src.replace(inlineRe, `$1${literal}$3`);
  const namedRe = /((?:const|let|var)\s+SHOTS\s*=\s*)(\[[\s\S]*?\])(\s*;)/;
  if (namedRe.test(src)) return src.replace(namedRe, `$1${literal}$3`);
  return null;
}

// ── Views ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center px-3 text-[11px] text-muted-foreground">
      No camera on this screen yet — wrap it in &lt;ScreenAnimator&gt; to direct
      it.
    </div>
  );
}

function zoomDir(a: number, b: number): string {
  if (b > a + 0.02) return "push in";
  if (b < a - 0.02) return "pull out";
  return "pan";
}

/**
 * Events view — foci and noodles. Each shot is a focus node; the connector
 * between two nodes is the transition ("here → there, like this"). Evenly
 * spaced (sequence, not exact timing — that's what the Timeline view is for).
 */
function EventSpine({ shots }: { shots: TimelineCameraShot[] }) {
  if (shots.length === 0) return <EmptyState />;
  return (
    <div className="flex h-full items-center overflow-x-auto px-5">
      {shots.map((s, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <div className="flex shrink-0 flex-col items-center" style={{ width: 92 }}>
              <svg width="92" height="26" viewBox="0 0 92 26" className="text-primary/45" aria-hidden>
                <path d="M2 13 C 34 13, 58 13, 86 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                <path d="M80 8 L88 13 L80 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[9px] text-muted-foreground">
                {zoomDir(shots[i - 1].zoom, s.zoom)} · {((s.trans ?? DEFAULT_TRANS) / 1000).toFixed(1)}s
              </span>
            </div>
          )}
          <div className="flex shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2" style={{ width: 124 }}>
            <span className="max-w-full truncate text-[11px] font-medium text-foreground">
              {s.label ?? `Focus ${i + 1}`}
            </span>
            <span className="text-[10px] tabular-nums text-primary/80">
              {roundf(s.zoom)}× · {Math.round(s.cx * 100)},{Math.round(s.cy * 100)}
            </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

interface Clip {
  startMs: number;
  durMs: number;
  label: string;
  zoom: number;
}

/** Timeline view — traditional lanes: clips on a ruler, sized to duration. */
function TimelineLanes({
  shots,
}: {
  shots: TimelineCameraShot[];
}) {
  const { clips, totalMs } = React.useMemo(() => {
    let t = 0;
    const cs: Clip[] = shots.map((s, i) => {
      const durMs = (i === 0 ? 0 : s.trans) + s.hold;
      const clip: Clip = {
        startMs: t,
        durMs,
        label: s.label ?? `Shot ${i + 1}`,
        zoom: s.zoom,
      };
      t += durMs;
      return clip;
    });
    return { clips: cs, totalMs: Math.max(t, 1000) };
  }, [shots]);

  const hasData = clips.length > 0;
  const seconds = Math.max(1, Math.ceil(totalMs / 1000));

  return (
    <div className="flex h-full min-h-0">
      {/* Track-label gutter */}
      <div className="w-40 shrink-0 border-r border-border/70 bg-background/40 text-xs">
        <div className="h-7 border-b border-border/40" />
        <div className="flex h-10 items-center gap-2 border-b border-border/30 px-3">
          <span className="h-2 w-2 rounded-full bg-primary/70" />
          Camera · Zoom
        </div>
        <div className="flex h-8 items-center gap-1.5 px-3 text-[11px] text-muted-foreground">
          <Plus className="h-3 w-3" />
          Add track
        </div>
      </div>

      {/* Lanes */}
      <div className="relative min-w-0 flex-1">
        <div className="relative h-7 border-b border-border/40 text-[9px] text-muted-foreground">
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

        <div className="relative h-10 border-b border-border/30">
          {hasData ? (
            clips.map((c, i) => (
              <div
                key={i}
                title={`${c.label} — ${(c.durMs / 1000).toFixed(1)}s, ${c.zoom}× zoom`}
                className="absolute top-2 flex h-6 items-center justify-center overflow-hidden rounded-md border border-primary/40 bg-primary/15 text-[10px] text-primary/80"
                style={{
                  left: `${(c.startMs / totalMs) * 100}%`,
                  width: `calc(${(c.durMs / totalMs) * 100}% - 2px)`,
                }}
              >
                <span className="absolute left-0 top-0 h-full w-1.5 rounded-l-md bg-primary/50" />
                <span className="truncate px-2">{c.label}</span>
                <span className="absolute right-0 top-0 h-full w-1.5 rounded-r-md bg-primary/50" />
              </div>
            ))
          ) : (
            <EmptyState />
          )}
        </div>

        <div className="flex h-8 items-center px-3">
          <div className="h-5 w-full rounded border border-dashed border-border/60" />
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 top-0 w-px bg-primary/60" />
      </div>
    </div>
  );
}

export function TimelineDock({ appSource }: { appSource: string | null }) {
  const shots = React.useMemo(() => extractCameraShots(appSource), [appSource]);
  const [mode, setMode] = React.useState<"events" | "timeline">("events");

  return (
    <div
      data-grade-timeline-dock
      className="flex h-[208px] shrink-0 flex-col border-t border-border bg-muted/20"
    >
      {/* Header */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border/70 bg-background/60 px-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <Film className="h-3.5 w-3.5 text-muted-foreground" />
          Timeline
          {shots.length > 0 && (
            <span className="text-[10px] font-normal text-muted-foreground">
              {shots.length} foci
            </span>
          )}
        </div>

        {/* Same data, two lenses */}
        <div className="flex items-center gap-0.5 rounded-md border border-border/70 p-0.5 text-[10px]">
          {(["events", "timeline"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded px-2 py-0.5 capitalize transition-colors",
                mode === m
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {mode === "events" ? (
          <EventSpine shots={shots} />
        ) : (
          <TimelineLanes shots={shots} />
        )}
      </div>
    </div>
  );
}
