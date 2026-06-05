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

// ── Motion (scene-sequence) support ────────────────────────────────────
//
// A Motion design's blob is `<Motion>` of `<MotionScene>`s (see
// STUDIO-DIRECTOR.md "Grade Motion"). The dock reads the SCENE lane out of
// the source the same heuristic way it reads camera shots — regex, not a
// full parse — and writes new scenes back in through the same
// source-mutation channel.

export interface TimelineMotionScene {
  label: string | null;
  /** Estimated run length in ms (explicit durationMs, or derived from the
   *  scene's timed children — camera tours / text templates). */
  durationMs: number;
  /** Content summary, e.g. "2 screens · text". */
  summary: string;
  /** The scene's entrance transition ("fade" default). */
  transition: string;
}

const MOTION_ENTER_MS = 1500;
const MOTION_BEAT_MS = 420;
const MOTION_UNTIMED_MS = 4000;
const TEXT_TEMPLATE_MS: Record<string, number> = {
  title: 3800,
  "lower-third": 3200,
  "section-break": 4200,
};

/** Is this blob a Motion (scene sequence) rather than a screen? */
export function isMotionSource(src: string | null): boolean {
  return !!src && /<Motion[\s>]/.test(src);
}

/** Total of one shots-array literal's holds + transitions. */
function shotsDuration(arr: string): number {
  const objs = arr.match(/\{[^{}]*\}/g) ?? [];
  let total = MOTION_ENTER_MS; // fly-in
  objs.forEach((o, i) => {
    const num = (key: string, d: number) => {
      const m = o.match(new RegExp(`${key}\\s*:\\s*(-?[0-9.]+)`));
      return m ? Number(m[1]) : d;
    };
    total += num("hold", DEFAULT_HOLD) + (i === 0 ? 0 : num("trans", DEFAULT_TRANS));
  });
  return total;
}

/**
 * Pull the scene lane out of a Motion source. Splits on `<MotionScene`
 * boundaries; each scene's duration is its explicit `durationMs`, else the
 * max of its timed children (screens' camera tours run in parallel; text
 * templates have fixed lengths), else the untimed fallback.
 */
export function extractMotionScenes(
  src: string | null,
): TimelineMotionScene[] {
  if (!src || !isMotionSource(src)) return [];
  const parts = src.split(/<MotionScene\b/).slice(1);
  return parts.map((part) => {
    const openTag = part.slice(0, part.indexOf(">") + 1);
    const lm = openTag.match(/label\s*=\s*["'{`]+([^"'`}]*)["'`}]/);
    const dm = openTag.match(/durationMs\s*=\s*\{?\s*([0-9.]+)/);
    const tm = openTag.match(/transition\s*=\s*["']([a-z-]+)["']/);

    const screens = part.match(/<MotionScreen\b/g)?.length ?? 0;
    const texts = part.match(/<MotionText\b/g)?.length ?? 0;
    const videos = part.match(/<video\b|<VideoPlayer\b/g)?.length ?? 0;

    // Timed children: camera tours (max across parallel screens) + text
    // templates.
    const timed: number[] = [];
    for (const m of part.matchAll(/shots=\{(\[[\s\S]*?\])\}/g))
      timed.push(shotsDuration(m[1]));
    // A MotionScreen with no shots still times itself (fly-in + dwell).
    const shotsCount = part.match(/shots=\{/g)?.length ?? 0;
    for (let k = shotsCount; k < screens; k++)
      timed.push(MOTION_ENTER_MS + DEFAULT_HOLD);
    for (const m of part.matchAll(/template\s*=\s*["']([a-z-]+)["']/g))
      timed.push(TEXT_TEMPLATE_MS[m[1]] ?? MOTION_UNTIMED_MS);
    // Bare MotionText (default template = title).
    const textWithTemplate =
      part.match(/<MotionText\b[^>]*template/g)?.length ?? 0;
    for (let k = textWithTemplate; k < texts; k++)
      timed.push(TEXT_TEMPLATE_MS.title);

    // An explicit durationMs is a MINIMUM runtime (the floor); timed
    // children can extend past it. True duration = max of both.
    const fromChildren =
      timed.length > 0 ? Math.max(...timed) + MOTION_BEAT_MS : 0;
    const durationMs = dm
      ? Math.max(Number(dm[1]), fromChildren)
      : fromChildren || MOTION_UNTIMED_MS;

    const bits: string[] = [];
    if (screens > 0) bits.push(screens === 1 ? "1 screen" : `${screens} screens`);
    if (texts > 0) bits.push(texts === 1 ? "text" : `${texts} texts`);
    if (videos > 0) bits.push(videos === 1 ? "video" : `${videos} videos`);

    return {
      label: lm ? lm[1] : null,
      durationMs,
      summary: bits.join(" · ") || "empty",
      transition: tm ? tm[1] : "fade",
    };
  });
}

/**
 * Append a placeholder scene before `</Motion>` — the WRITE half for the
 * dock's one-gesture "Add scene". Returns the new source, or null when
 * there's no `</Motion>` anchor.
 */
export function appendSceneToSource(src: string, index: number): string | null {
  if (!/<\/Motion>/.test(src)) return null;
  const scene = `  <MotionScene label="Scene ${index + 1}">
    <MotionText template="title" heading="New scene" text="Replace me" />
  </MotionScene>
`;
  return src.replace(/(\s*)<\/Motion>/, `\n${scene}$1</Motion>`);
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

/**
 * Scene spine — the Motion counterpart of EventSpine: scene cards joined
 * by transition noodles ("fade →"). Sequence view, not exact timing.
 * Cards are tappable: click seeks the film to that scene.
 */
function SceneSpine({
  scenes,
  activeScene,
  onSeek,
}: {
  scenes: TimelineMotionScene[];
  activeScene?: number;
  onSeek?: (i: number) => void;
}) {
  if (scenes.length === 0)
    return (
      <div className="flex h-full items-center justify-center px-3 text-[11px] text-muted-foreground">
        No scenes yet — add one with the + above.
      </div>
    );
  return (
    <div className="flex h-full items-center overflow-x-auto px-5">
      {scenes.map((s, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <div className="flex shrink-0 flex-col items-center" style={{ width: 76 }}>
              <svg width="76" height="26" viewBox="0 0 76 26" className="text-primary/45" aria-hidden>
                <path d="M2 13 C 26 13, 46 13, 70 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                <path d="M64 8 L72 13 L64 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[9px] text-muted-foreground">{s.transition}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => onSeek?.(i)}
            title={`Play from ${s.label ?? `scene ${i + 1}`}`}
            className={cn(
              "flex shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border px-3 py-2 text-left transition-colors",
              i === activeScene
                ? "border-primary bg-primary/20"
                : "border-primary/40 bg-primary/10 hover:bg-primary/15",
            )}
            style={{ width: 132 }}
          >
            <span className="max-w-full truncate text-[11px] font-medium text-foreground">
              {s.label ?? `Scene ${i + 1}`}
            </span>
            <span className="max-w-full truncate text-[10px] text-muted-foreground">
              {s.summary}
            </span>
            <span className="text-[10px] tabular-nums text-primary/80">
              {(s.durationMs / 1000).toFixed(1)}s
            </span>
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

/** Scene lanes — Motion scenes as clips on the time ruler. Clips are
 *  tappable (seek), the ruler is drag-scrubbable (scene-snap), and the
 *  playhead travels through each scene at its estimated duration,
 *  pausing with playback. Frame-accurate scrub arrives with the
 *  seekable clock (STUDIO-DIRECTOR D4/M2). */
function SceneLanes({
  scenes,
  activeScene,
  paused = false,
  onSeek,
}: {
  scenes: TimelineMotionScene[];
  activeScene?: number;
  paused?: boolean;
  onSeek?: (i: number) => void;
}) {
  const laneRef = React.useRef<HTMLDivElement>(null);
  const dragSeek = React.useCallback(
    (clientX: number) => {
      const el = laneRef.current;
      if (!el || !onSeek || scenes.length === 0) return;
      const r = el.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      let t = 0;
      const total = scenes.reduce((a, s) => a + s.durationMs, 0) || 1;
      const target = ratio * total;
      for (let i = 0; i < scenes.length; i++) {
        t += scenes[i].durationMs;
        if (target < t) {
          onSeek(i);
          return;
        }
      }
      onSeek(scenes.length - 1);
    },
    [onSeek, scenes],
  );
  const draggingRef = React.useRef(false);
  const { clips, totalMs } = React.useMemo(() => {
    let t = 0;
    const cs: Clip[] = scenes.map((s, i) => {
      const clip: Clip = {
        startMs: t,
        durMs: s.durationMs,
        label: s.label ?? `Scene ${i + 1}`,
        zoom: 1,
      };
      t += s.durationMs;
      return clip;
    });
    return { clips: cs, totalMs: Math.max(t, 1000) };
  }, [scenes]);
  const seconds = Math.max(1, Math.ceil(totalMs / 1000));

  return (
    <div className="flex h-full min-h-0">
      <div className="w-40 shrink-0 border-r border-border/70 bg-background/40 text-xs">
        <div className="h-7 border-b border-border/40" />
        <div className="flex h-10 items-center gap-2 border-b border-border/30 px-3">
          <span className="h-2 w-2 rounded-full bg-primary/70" />
          Scenes
        </div>
        <div className="flex h-8 items-center gap-1.5 px-3 text-[11px] text-muted-foreground">
          <Plus className="h-3 w-3" />
          Add track
        </div>
      </div>
      <div
        ref={laneRef}
        className="relative min-w-0 flex-1"
        // Drag-to-scrub anywhere on the ruler/lanes (scene-snap).
        onPointerDown={(e) => {
          draggingRef.current = true;
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          dragSeek(e.clientX);
        }}
        onPointerMove={(e) => {
          if (draggingRef.current) dragSeek(e.clientX);
        }}
        onPointerUp={() => {
          draggingRef.current = false;
        }}
        style={{ cursor: "ew-resize", touchAction: "none" }}
      >
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
          {clips.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSeek?.(i)}
              title={`${c.label} — ${(c.durMs / 1000).toFixed(1)}s. Click to play from here.`}
              className={cn(
                "absolute top-2 flex h-6 cursor-pointer items-center justify-center overflow-hidden rounded-md border text-[10px] text-primary/80 transition-colors",
                i === activeScene
                  ? "border-primary bg-primary/25"
                  : "border-primary/40 bg-primary/15 hover:bg-primary/20",
              )}
              style={{
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
        <div className="flex h-8 items-center px-3">
          <div className="h-5 w-full rounded border border-dashed border-border/60" />
        </div>
        {/* Playhead — travels through the active scene over its
            estimated duration, pausing with playback (animation-play-
            state). Keyed per scene so it restarts at each boundary.
            Estimated, not sample-accurate — the seekable clock makes it
            exact later. */}
        <style>{`@keyframes gdsDockHead { from { left: var(--ph-from) } to { left: var(--ph-to) } }`}</style>
        {(() => {
          const i = Math.max(0, Math.min(activeScene ?? 0, clips.length - 1));
          const c = clips[i];
          if (!c) return null;
          return (
            <div
              key={i}
              className="pointer-events-none absolute bottom-0 top-0 w-px bg-primary"
              style={{
                ["--ph-from" as string]: `${(c.startMs / totalMs) * 100}%`,
                ["--ph-to" as string]: `${((c.startMs + c.durMs) / totalMs) * 100}%`,
                animation: `gdsDockHead ${c.durMs}ms linear both`,
                animationPlayState: paused ? "paused" : "running",
              }}
            >
              <span className="absolute -left-[3px] -top-0.5 h-2 w-[7px] rounded-sm bg-primary" />
            </div>
          );
        })()}
      </div>
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

export function TimelineDock({
  appSource,
  onSourceMutation,
}: {
  appSource: string | null;
  /** The source-mutation channel (same one the inspector uses). Enables
   *  the dock's write affordances — today, the one-gesture "Add scene"
   *  on Motion designs. */
  onSourceMutation?: (next: string, label?: string) => void;
}) {
  const shots = React.useMemo(() => extractCameraShots(appSource), [appSource]);
  const motion = React.useMemo(() => isMotionSource(appSource), [appSource]);
  const scenes = React.useMemo(
    () => extractMotionScenes(appSource),
    [appSource],
  );
  const [mode, setMode] = React.useState<"events" | "timeline">("events");

  const handleAddScene = React.useCallback(() => {
    if (!appSource || !onSourceMutation) return;
    const next = appendSceneToSource(appSource, scenes.length);
    if (next) onSourceMutation(next, "Add scene");
  }, [appSource, onSourceMutation, scenes.length]);

  // ── Motion playback state + control (the scrub channel) ──
  // The <Motion> component inside the iframe broadcasts
  // `grade:motion-state` and obeys `grade:motion-control` (see
  // packages/ui motion.tsx) — works in both renderers because the
  // component itself is the handler.
  const [motionState, setMotionState] = React.useState<{
    scene: number;
    paused: boolean;
    done: boolean;
    view?: string;
  } | null>(null);
  React.useEffect(() => {
    if (!motion) return;
    const onMsg = (e: MessageEvent) => {
      const d = e.data as
        | { type?: string; scene?: number; paused?: boolean; done?: boolean; view?: string }
        | null;
      if (d?.type === "grade:motion-state" && typeof d.scene === "number") {
        setMotionState({
          scene: d.scene,
          paused: !!d.paused,
          done: !!d.done,
          view: d.view,
        });
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [motion]);
  const postControl = React.useCallback(
    (payload: Record<string, unknown>) => {
      document.querySelectorAll("iframe").forEach((el) => {
        (el as HTMLIFrameElement).contentWindow?.postMessage(
          { type: "grade:motion-control", ...payload },
          "*",
        );
      });
    },
    [],
  );
  const seekScene = React.useCallback(
    (i: number) => postControl({ scene: i }),
    [postControl],
  );
  // Spacebar = play/pause while the dock is up (standard scrubber key).
  // Guarded against typing surfaces so the chat composer stays usable.
  React.useEffect(() => {
    if (!motion) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "BUTTON" ||
          t.isContentEditable)
      )
        return;
      e.preventDefault();
      postControl({ action: motionState?.paused ? "play" : "pause" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [motion, motionState?.paused, postControl]);
  const motionView =
    motionState?.view === "strip" ? ("strip" as const) : ("play" as const);

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
          {motion && scenes.length > 0 ? (
            <span className="text-[10px] font-normal text-muted-foreground">
              {scenes.length === 1 ? "1 scene" : `${scenes.length} scenes`}
            </span>
          ) : shots.length > 0 ? (
            <span className="text-[10px] font-normal text-muted-foreground">
              {shots.length} foci
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {/* Play ↔ Arrange — flips the canvas between the film and the
              scenes-in-a-row strip (no source mutation; a control
              message the <Motion> obeys). Motion designs only. */}
          {motion && (
            <div className="flex items-center gap-0.5 rounded-md border border-border/70 p-0.5 text-[10px]">
              {(["play", "strip"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => postControl({ action: "set-view", view: v })}
                  className={cn(
                    "rounded px-2 py-0.5 transition-colors",
                    motionView === v
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {v === "play" ? "Play" : "Arrange"}
                </button>
              ))}
            </div>
          )}

          {/* One-gesture scene add — Motion designs only. */}
          {motion && onSourceMutation && (
            <button
              type="button"
              onClick={handleAddScene}
              className="inline-flex items-center gap-1 rounded-md border border-border/70 px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <Plus className="h-3 w-3" />
              Add scene
            </button>
          )}

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
      </div>

      {/* Body — Motion designs get the SCENE lane; screens get the camera
          lane, exactly as before. */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {motion ? (
          mode === "events" ? (
            <SceneSpine
              scenes={scenes}
              activeScene={motionState?.scene}
              onSeek={seekScene}
            />
          ) : (
            <SceneLanes
              scenes={scenes}
              activeScene={motionState?.scene}
              paused={motionState?.paused ?? false}
              onSeek={seekScene}
            />
          )
        ) : mode === "events" ? (
          <EventSpine shots={shots} />
        ) : (
          <TimelineLanes shots={shots} />
        )}
      </div>
    </div>
  );
}
