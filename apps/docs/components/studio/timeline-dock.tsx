"use client";

import * as React from "react";
import {
  Copy,
  Download,
  Film,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@gradeui/ui";
import { cn } from "@/lib/utils";
import {
  duplicateScene,
  removeScene,
  setSceneProp,
} from "@/lib/motion-source";
import {
  TimelineBars,
  type TimelineBarClip,
} from "@/components/studio/timeline-bars";

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
const SCENE_TRANSITIONS = [
  "fade",
  "slide-up",
  "slide-down",
  "slide-left",
  "slide-right",
  "pop",
  "zoom",
  "wipe-circle",
  "none",
] as const;

type SceneAction =
  | { kind: "rename" }
  | { kind: "duplicate" }
  | { kind: "delete" }
  | { kind: "transition"; value: string };

/** The chip's ⋯ menu — rename / duplicate / delete / transition. */
function SceneChipMenu({
  scene,
  onAction,
}: {
  scene: TimelineMotionScene;
  onAction: (action: SceneAction) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Scene actions"
          className="absolute right-1 top-1 h-5 w-5 inline-flex items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover/chip:opacity-100 data-[state=open]:opacity-100 [&_svg]:size-3"
        >
          <MoreHorizontal />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuItem onSelect={() => onAction({ kind: "rename" })}>
          <Pencil className="h-3.5 w-3.5" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAction({ kind: "duplicate" })}>
          <Copy className="h-3.5 w-3.5" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Arrives with
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={scene.transition}
          onValueChange={(value) => onAction({ kind: "transition", value })}
        >
          {SCENE_TRANSITIONS.map((t) => (
            <DropdownMenuRadioItem key={t} value={t}>
              {t}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => onAction({ kind: "delete" })}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete scene
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SceneSpine({
  scenes,
  activeScene,
  onSeek,
  onAction,
}: {
  scenes: TimelineMotionScene[];
  activeScene?: number;
  onSeek?: (i: number) => void;
  onAction?: (i: number, action: SceneAction) => void;
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
          <div className="group/chip relative shrink-0" style={{ width: 132 }}>
            <button
              type="button"
              onClick={() => onSeek?.(i)}
              title={`Play from ${s.label ?? `scene ${i + 1}`}`}
              className={cn(
                "flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border px-3 py-2 text-left transition-colors",
                i === activeScene
                  ? "border-primary bg-primary/20"
                  : "border-primary/40 bg-primary/10 hover:bg-primary/15",
              )}
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
            {onAction && (
              <SceneChipMenu scene={s} onAction={(a) => onAction(i, a)} />
            )}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

/** Scene lanes — Motion scenes as clips on the time ruler, rendered by
 *  the reusable <TimelineBars> primitive (timeline-bars.tsx — the
 *  hand-editable home of the ruler/clips/playhead/scrub UI). This
 *  wrapper just maps scenes → clips and adds the dock's track gutter. */
function SceneLanes({
  scenes,
  activeScene,
  paused = false,
  onSeek,
  clockTimeMs,
  clockDurations,
  onScrub,
}: {
  scenes: TimelineMotionScene[];
  activeScene?: number;
  paused?: boolean;
  onSeek?: (i: number) => void;
  /** CLOCK MODE: the film's exact master time + per-scene durations
   *  (broadcast by the Motion) — clips and playhead become exact and
   *  drags scrub continuously. */
  clockTimeMs?: number;
  clockDurations?: number[];
  onScrub?: (ms: number) => void;
}) {
  const clips: TimelineBarClip[] = React.useMemo(() => {
    // Prefer the film's OWN durations (the clock's schedule) over the
    // dock's regex estimates whenever they're available and aligned.
    const exact =
      clockDurations && clockDurations.length === scenes.length
        ? clockDurations
        : null;
    let t = 0;
    return scenes.map((s, i) => {
      const dur = exact ? exact[i] : s.durationMs;
      const clip: TimelineBarClip = {
        startMs: t,
        durMs: dur,
        label: s.label ?? `Scene ${i + 1}`,
        title: `${s.label ?? `Scene ${i + 1}`} — ${(dur / 1000).toFixed(1)}s. Drag to scrub.`,
      };
      t += dur;
      return clip;
    });
  }, [scenes, clockDurations]);

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
      <TimelineBars
        clips={clips}
        activeIndex={activeScene}
        paused={paused}
        onSelect={onSeek}
        playheadMs={clockTimeMs}
        onScrub={onScrub}
      />
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
  designId,
}: {
  appSource: string | null;
  /** The source-mutation channel (same one the inspector uses). Enables
   *  the dock's write affordances — today, the one-gesture "Add scene"
   *  on Motion designs. */
  onSourceMutation?: (next: string, label?: string) => void;
  /** Focused design id — stamped into export filenames so every video
   *  maps back to its live, editable Motion (provenance v1). */
  designId?: string;
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

  // ── Per-scene editor actions (the chips' context menu) ──
  // All of these are one-line calls into lib/motion-source — the
  // tested scene-surgery kit — written back through the same mutation
  // channel as everything else (undo-able, revisioned).
  const handleSceneAction = React.useCallback(
    (
      i: number,
      action:
        | { kind: "rename" }
        | { kind: "duplicate" }
        | { kind: "delete" }
        | { kind: "transition"; value: string },
    ) => {
      if (!appSource || !onSourceMutation) return;
      switch (action.kind) {
        case "rename": {
          const current = scenes[i]?.label ?? "";
          const name = window.prompt("Scene name", current);
          if (name === null) return;
          const next = setSceneProp(appSource, i, "label", name.trim() || null);
          if (next) onSourceMutation(next, "Rename scene");
          return;
        }
        case "duplicate": {
          const next = duplicateScene(appSource, i);
          if (next) onSourceMutation(next, "Duplicate scene");
          return;
        }
        case "delete": {
          const next = removeScene(appSource, i);
          if (next) onSourceMutation(next, "Delete scene");
          return;
        }
        case "transition": {
          const next = setSceneProp(
            appSource,
            i,
            "transition",
            action.value === "fade" ? null : action.value,
          );
          if (next) onSourceMutation(next, "Change transition");
          return;
        }
      }
    },
    [appSource, onSourceMutation, scenes],
  );

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
  // THE CLOCK feed — the film broadcasts its master time (~every 150ms
  // while playing); the playhead renders this exact number.
  const [clock, setClock] = React.useState<{
    timeMs: number;
    totalMs: number;
    durations: number[];
  } | null>(null);
  // Live mirror for closures that outlive a render (the export HUD).
  const clockRef = React.useRef(clock);
  clockRef.current = clock;
  // THE FOCUSED FILM'S IFRAME — the dock's single source + single target.
  //
  // The canvas can hold MANY design iframes, and several can be Motions
  // playing their own clocks simultaneously. Listening to every window
  // message made the dock's state a mix of every film on the canvas: the
  // scene lozenges lit up like a pinball machine (each film's state
  // alternating), the snap-back restore compared one film's clock against
  // another's and yanked playback around boundaries, and broadcast
  // controls seeked EVERY film at once. Scope everything to the focused
  // frame via the canvas's `data-grade-focused-frame` contract (the same
  // one the path bar + selection inspector rely on).
  const focusedMotionIframe = React.useCallback(():
    | HTMLIFrameElement
    | null => {
    const container = document.querySelector<HTMLElement>(
      "[data-grade-focused-frame]",
    );
    const framed = container?.querySelector("iframe");
    if (framed) return framed as HTMLIFrameElement;
    // No focused-frame wrapper (non-canvas hosts): fall back to the only
    // iframe present, never to "the first of many".
    const all = document.querySelectorAll("iframe");
    return all.length === 1 ? (all[0] as HTMLIFrameElement) : null;
  }, []);
  const findMotionIframe = focusedMotionIframe;
  React.useEffect(() => {
    if (!motion) return;
    const onMsg = (e: MessageEvent) => {
      const d = e.data as
        | {
            type?: string;
            scene?: number;
            paused?: boolean;
            done?: boolean;
            view?: string;
            timeMs?: number;
            totalMs?: number;
            durations?: number[];
          }
        | null;
      if (
        d?.type === "grade:motion-state" ||
        d?.type === "grade:motion-time"
      ) {
        // ONLY the focused film feeds the dock. Other Motion tiles on the
        // canvas broadcast too — their clocks are noise here.
        const win = focusedMotionIframe()?.contentWindow;
        if (win && e.source !== win) return;
      }
      if (d?.type === "grade:motion-state" && typeof d.scene === "number") {
        setMotionState({
          scene: d.scene,
          paused: !!d.paused,
          done: !!d.done,
          view: d.view,
        });
      } else if (
        d?.type === "grade:motion-time" &&
        typeof d.timeMs === "number" &&
        typeof d.totalMs === "number"
      ) {
        setClock({
          timeMs: d.timeMs,
          totalMs: d.totalMs,
          durations: d.durations ?? [],
        });
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [motion]);
  const postControl = React.useCallback(
    (payload: Record<string, unknown>) => {
      // Control ONLY the focused film — broadcasting seeked/paused every
      // Motion tile on the canvas at once (and restarted them on export).
      const focused = focusedMotionIframe();
      const targets = focused
        ? [focused]
        : Array.from(document.querySelectorAll("iframe"));
      targets.forEach((el) => {
        (el as HTMLIFrameElement).contentWindow?.postMessage(
          { type: "grade:motion-control", ...payload },
          "*",
        );
      });
    },
    [focusedMotionIframe],
  );
  const seekScene = React.useCallback(
    (i: number) => {
      userSeekAtRef.current = Date.now();
      postControl({ scene: i });
      // Also tell PARENT-side surfaces (the scene inspector panel) that
      // the user explicitly picked this scene — playback state alone
      // can't distinguish a seek from a natural advance.
      window.postMessage({ type: "grade:motion-select", scene: i }, "*");
    },
    [postControl],
  );

  // Continuous scrub, rAF-COALESCED: pointer moves can fire far faster
  // than frames; we keep only the latest position and post at most one
  // seek per animation frame (pause once at drag start, not per move).
  const scrubPendingRef = React.useRef<number | null>(null);
  const scrubRafRef = React.useRef(0);
  const scrubPausedRef = React.useRef(false);
  const scrubTo = React.useCallback(
    (ms: number) => {
      userSeekAtRef.current = Date.now();
      scrubPendingRef.current = ms;
      if (!scrubPausedRef.current) {
        scrubPausedRef.current = true;
        postControl({ action: "pause" });
        // Re-arm the once-per-drag pause after the drag settles.
        setTimeout(() => {
          scrubPausedRef.current = false;
        }, 600);
      }
      if (scrubRafRef.current) return;
      scrubRafRef.current = requestAnimationFrame(() => {
        scrubRafRef.current = 0;
        const pending = scrubPendingRef.current;
        if (pending !== null) {
          scrubPendingRef.current = null;
          postControl({ action: "seek", ms: pending });
        }
      });
    },
    [postControl],
  );

  // ── D7 v2 — EXPORT TO VIDEO, deterministic (server render) ──
  // The browser-capture path is GONE (real-time MediaRecorder dropped
  // frames AND returned zero bytes on this machine — never smooth, never
  // reliable). Instead we POST the film's source + the LIVE theme to
  // /api/motion/render, which drives the headless Playwright/ffmpeg
  // pipeline (scripts/render-motion.mjs): every frame is seeked exactly
  // and waited on until painted, so output is locked to a perfect fps no
  // matter how heavy the shaders. Returns a finished mp4 to download.
  const [exporting, setExporting] = React.useState(false);
  const [exportMsg, setExportMsg] = React.useState<string | null>(null);
  // 0–1 across the render; null = indeterminate (compiling / encoding).
  const [exportPct, setExportPct] = React.useState<number | null>(null);
  // Capture resolution tier — persisted. Lower = far fewer pixels for
  // headless SwiftShader to shade, so shader-heavy films render MUCH
  // faster. 0.5 ≈ 960×540 (fast test), 1 = 1080p (delivery), 2 = 4K.
  const [exportRes, setExportRes] = React.useState<number>(1);
  React.useEffect(() => {
    const saved = Number(
      typeof window !== "undefined"
        ? window.localStorage.getItem("grade-export-res")
        : null,
    );
    if (saved === 0.5 || saved === 1 || saved === 2) setExportRes(saved);
  }, []);
  const pickRes = React.useCallback((r: number) => {
    setExportRes(r);
    try {
      window.localStorage.setItem("grade-export-res", String(r));
    } catch {
      /* ignore */
    }
  }, []);

  // Pull the theme vars off the LIVE focused iframe so the headless render
  // matches exactly what's on screen (fast-frame applies them as inline
  // custom properties on :root). Returns only --tokens.
  const readLiveTheme = React.useCallback(() => {
    const doc = focusedMotionIframe()?.contentDocument;
    const root = doc?.documentElement;
    if (!root) return null;
    const vars: Record<string, string> = {};
    const s = root.style;
    for (let i = 0; i < s.length; i++) {
      const prop = s.item(i);
      if (prop.startsWith("--")) vars[prop] = s.getPropertyValue(prop).trim();
    }
    const mode = root.getAttribute("data-mode") === "dark" ? "dark" : "light";
    return Object.keys(vars).length ? { vars, mode } : null;
  }, [focusedMotionIframe]);

  const handleExport = React.useCallback(
    async (opts?: { res?: number; poster?: boolean }) => {
      if (exporting || !appSource) return;
      setExporting(true);
      setExportPct(null);
      setExportMsg("Starting render…");
      try {
        const res = await fetch("/api/motion/render", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: appSource,
            theme: readLiveTheme(),
            fps: 30,
            res: opts?.res ?? 1,
            poster: opts?.poster ?? false,
            width: opts?.poster ? 1200 : undefined, // og-sized poster
            designId,
          }),
        });
        if (!res.ok || !res.body) {
          const { error } = await res
            .json()
            .catch(() => ({ error: `Render failed (${res.status}).` }));
          setExportMsg(error || `Render failed (${res.status}).`);
          return;
        }

        // Read the NDJSON progress stream. The render runs on the SERVER,
        // headless — this tab can be left or backgrounded; it's just
        // listening. Each line is a progress/done/error event.
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        let finished = false;
        while (!finished) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) !== -1) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line) continue;
            let ev: {
              type: string;
              phase?: string;
              frame?: number;
              total?: number;
              message?: string;
              detail?: string;
              name?: string;
              contentType?: string;
              file?: string;
            };
            try {
              ev = JSON.parse(line);
            } catch {
              continue;
            }
            if (ev.type === "progress") {
              if (ev.phase === "install") {
                setExportPct(null);
                setExportMsg(
                  ev.message ||
                    "First render — installing the renderer (one time)…",
                );
              } else if (ev.phase === "compile") {
                setExportPct(null);
                setExportMsg("Compiling film…");
              } else if (ev.phase === "encode") {
                setExportPct(null);
                setExportMsg("Encoding video…");
              } else if (
                ev.phase === "step" &&
                ev.total &&
                ev.frame !== undefined
              ) {
                const p = Math.min(1, ev.frame / ev.total);
                setExportPct(p);
                setExportMsg(
                  `Rendering frame ${ev.frame}/${ev.total} — you can leave this tab`,
                );
              }
            } else if (ev.type === "done" && ev.file) {
              const bin = atob(ev.file);
              const arr = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
              const blob = new Blob([arr], {
                type: ev.contentType || "video/mp4",
              });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download =
                ev.name ?? `grade-motion_${designId ?? "film"}.mp4`;
              a.click();
              URL.revokeObjectURL(a.href);
              setExportPct(1);
              setExportMsg("Saved ✓");
              finished = true;
              setTimeout(() => setExportMsg(null), 4000);
            } else if (ev.type === "error") {
              setExportMsg(ev.message || "Render failed.");
              finished = true;
            }
          }
        }
      } catch (e) {
        setExportMsg(`Render error: ${(e as Error).message}`);
      } finally {
        setExporting(false);
        setExportPct(null);
      }
    },
    [exporting, appSource, designId, readLiveTheme],
  );

  // ── Position restore across recompiles ──
  // Every source mutation (inspector field, fill swatch, chat edit)
  // recompiles the source IN PLACE — no reload, no fast-ready — and the
  // remounted Motion restarts at t=0. Detection: we timestamp every
  // appSource change; when the film's clock SNAPS BACK to ~0 shortly
  // after an edit (having been further along), we re-seek to the last
  // good time and PAUSE — you're editing, the frame must hold still.
  const lastGoodTimeRef = React.useRef(0);
  const editAtRef = React.useRef(0);
  const restoringRef = React.useRef(false);
  const firstSourceRef = React.useRef(true);
  // A USER seek toward the start is indistinguishable from a post-edit
  // reset by clock value alone — so every user-initiated transport
  // gesture stamps this, and snap-back detection stands down around it.
  const userSeekAtRef = React.useRef(0);
  React.useEffect(() => {
    if (firstSourceRef.current) {
      firstSourceRef.current = false;
      return;
    }
    editAtRef.current = Date.now();
  }, [appSource]);
  React.useEffect(() => {
    if (!clock || restoringRef.current) return;
    const t = clock.timeMs;
    const snapBack =
      t < 500 &&
      lastGoodTimeRef.current > 1500 &&
      Date.now() - editAtRef.current < 5000 &&
      // …but never fight a user's own scrub/seek/restart.
      Date.now() - userSeekAtRef.current > 1500;
    if (snapBack) {
      restoringRef.current = true;
      const target = lastGoodTimeRef.current;
      postControl({ action: "pause" });
      setTimeout(() => postControl({ action: "seek", ms: target }), 80);
      setTimeout(() => {
        restoringRef.current = false;
      }, 900);
      return;
    }
    if (t > 800) lastGoodTimeRef.current = t;
  }, [clock, postControl]);
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
          {/* THE TRANSPORT — the editor's real play/pause/restart,
              state-synced with the film via grade:motion-state. (The
              view toggle below is deliberately labelled Film/Arrange so
              "Play" only ever means playback.) */}
          {motion && (
            <div className="flex items-center gap-0.5 rounded-md border border-border/70 p-0.5">
              <button
                type="button"
                onClick={() =>
                  postControl({
                    action: motionState?.paused || motionState?.done ? "play" : "pause",
                  })
                }
                aria-label={
                  motionState?.paused || motionState?.done ? "Play" : "Pause"
                }
                title="Play / pause (Space)"
                className="inline-flex h-5 w-6 items-center justify-center rounded text-foreground hover:bg-muted [&_svg]:size-3"
              >
                {motionState?.paused || motionState?.done ? <Play /> : <Pause />}
              </button>
              <button
                type="button"
                onClick={() => {
                  userSeekAtRef.current = Date.now();
                  postControl({ action: "restart" });
                }}
                aria-label="Restart"
                title="Restart from scene 1"
                className="inline-flex h-5 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground [&_svg]:size-3"
              >
                <RotateCcw />
              </button>
            </div>
          )}

          {/* Film ↔ Arrange — flips the CANVAS VIEW between the playing
              film and the scenes-in-a-row strip (no source mutation; a
              control message the <Motion> obeys). */}
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
                  {v === "play" ? "Film" : "Arrange"}
                </button>
              ))}
            </div>
          )}

          {/* D7 v2 — deterministic server render. Posts source + live
              theme to /api/motion/render (Playwright frame-steps + ffmpeg
              encodes), returns a perfect locked-fps mp4. No tab capture. */}
          {motion && (
            <>
              {/* Capture resolution — lower = faster (fewer pixels for the
                  headless CPU shader). Persisted across sessions. */}
              <div
                className="flex items-center gap-0.5 rounded-md border border-border/70 p-0.5 text-[10px]"
                title="Capture resolution — lower renders faster (shaders run on CPU when headless)"
              >
                {(
                  [
                    [0.5, "540p"],
                    [1, "1080p"],
                    [2, "4K"],
                  ] as const
                ).map(([r, label]) => (
                  <button
                    key={r}
                    type="button"
                    disabled={exporting}
                    onClick={() => pickRes(r)}
                    className={cn(
                      "rounded px-1.5 py-0.5 transition-colors disabled:opacity-50",
                      exportRes === r
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => handleExport({ res: exportRes })}
                disabled={exporting}
                title="Render to video — deterministic, headless, perfect framerate (renders on this machine, free)"
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border border-border/70 px-2 py-0.5 text-[10px] transition-colors",
                  exporting
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Download className="h-3 w-3" />
                {exporting ? "Rendering…" : "Render video"}
              </button>
              {(exporting || exportMsg) && (
                <div className="flex items-center gap-1.5">
                  {exporting && (
                    <span className="relative h-1 w-24 overflow-hidden rounded-full bg-muted">
                      {exportPct === null ? (
                        // Indeterminate (compile/encode) — a sliding sliver.
                        <span className="gds-export-indeterminate absolute inset-y-0 w-1/3 rounded-full bg-primary" />
                      ) : (
                        <span
                          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-150"
                          style={{ width: `${Math.round(exportPct * 100)}%` }}
                        />
                      )}
                    </span>
                  )}
                  {exporting && exportPct !== null && (
                    <span className="tabular-nums text-[10px] text-primary">
                      {Math.round(exportPct * 100)}%
                    </span>
                  )}
                  {exportMsg && (
                    <span
                      className="max-w-[260px] truncate text-[10px] text-muted-foreground"
                      title={exportMsg}
                    >
                      {exportMsg}
                    </span>
                  )}
                </div>
              )}
              <style>{`
                @keyframes gdsExportSlide { 0% { left: -33% } 100% { left: 100% } }
                .gds-export-indeterminate { animation: gdsExportSlide 1.1s ease-in-out infinite; }
              `}</style>
            </>
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
              onAction={onSourceMutation ? handleSceneAction : undefined}
            />
          ) : (
            <SceneLanes
              scenes={scenes}
              activeScene={motionState?.scene}
              paused={motionState?.paused ?? false}
              onSeek={seekScene}
              clockTimeMs={clock?.timeMs}
              clockDurations={clock?.durations}
              onScrub={scrubTo}
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
