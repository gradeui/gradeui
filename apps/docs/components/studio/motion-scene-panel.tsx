"use client";

/**
 * MotionScenePanel — the right-panel SCENE INSPECTOR for Motion designs.
 *
 * When the focused design is a Motion (`<Motion>` of `<MotionScene>`s),
 * the Layout tab swaps its component inspector for this panel. Same
 * visual idiom as the selection inspector: edge-to-edge collapsible
 * sections (Figma/Paper style), `2xs` controls, muted field labels.
 *
 * Three sections under a "Scenes" list:
 *
 *   Scenes  — every scene as a compact row (label · duration ·
 *             transition). Clicking SELECTS it locally AND seeks
 *             playback via `grade:motion-control` — the same channel
 *             the timeline dock scrubs through. The panel listens to
 *             `grade:motion-state` so the currently-playing scene is
 *             highlighted, and follows playback until the user pins a
 *             manual selection.
 *   Scene   — label / duration / transition / transition-ms fields for
 *             the selected scene. Every commit is one call into
 *             lib/motion-source (`setSceneProp`) written back through
 *             the page's source-mutation channel (undo-able,
 *             revisioned) — identical to how the dock's chip menu
 *             writes.
 *   Fill    — the scene's `fill` (CSS background painted over the
 *             stage): quick-pick swatches (theme-token solids +
 *             gradients) plus a free-text input for any CSS background.
 *   Actions — duplicate / delete (delete disabled at one scene, same
 *             guard `removeScene` enforces).
 *
 * READ half: `extractMotionScenes` (timeline-dock) for the per-scene
 * label/duration/transition, plus a fill read off the exact opening-tag
 * span `findMotionScenes` locates. WRITE half: lib/motion-source. All
 * writes guard null returns ("don't write").
 */

import * as React from "react";
import { ChevronDown, Copy, Film, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  duplicateScene,
  findMotionScenes,
  removeScene,
  setSceneProp,
} from "@/lib/motion-source";
import {
  extractMotionScenes,
  type TimelineMotionScene,
} from "./timeline-dock";

/* Same tier-two field label the selection inspector uses. */
const FIELD_LABEL = "text-2xs font-medium text-foreground/80";

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

/** Quick-pick fills — theme-token solids/gradients first (they re-skin
 *  with the screen theme), two literal slates for the classic dark /
 *  light title card. `null` = no fill (the stage shows through). */
const FILL_PRESETS: { label: string; value: string | null }[] = [
  { label: "None", value: null },
  { label: "Primary", value: "oklch(var(--primary))" },
  {
    label: "Brand sweep",
    value:
      "linear-gradient(135deg, oklch(var(--background)), oklch(var(--primary)) 140%)",
  },
  { label: "Ink", value: "#0b0b0e" },
  { label: "Paper", value: "#f5f5f7" },
];

/**
 * Read scene `i`'s `fill` prop straight off its opening tag.
 * `extractMotionScenes` doesn't surface fill (the dock never needed
 * it), so we slice the exact span `findMotionScenes` locates and run
 * one regex over JUST that tag — no chance of matching a fill on some
 * other element inside the scene.
 */
function readSceneFill(src: string | null, i: number): string | null {
  if (!src) return null;
  const span = findMotionScenes(src)[i];
  if (!span) return null;
  const openTag = src.slice(span.start, span.openTagEnd);
  const m = openTag.match(/\bfill\s*=\s*"([^"]*)"/);
  return m ? m[1] : null;
}

/**
 * CollapsibleSection — copied idiom from selection-inspector.tsx: the
 * section header is the prominent tier (text-xs medium + disclosure
 * chevron), the divider runs edge-to-edge (shell carries no horizontal
 * padding; each section owns its px-3).
 */
function CollapsibleSection({
  title,
  hint,
  defaultOpen = true,
  children,
}: {
  title: string;
  hint?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <section className="border-t border-border/60 first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-1.5 px-3 pt-2.5 text-left",
          open ? "pb-1.5" : "pb-2.5",
        )}
      >
        <ChevronDown
          aria-hidden
          className={cn(
            "h-3 w-3 shrink-0 text-muted-foreground transition-transform",
            !open && "-rotate-90",
          )}
        />
        <span className="text-xs font-medium text-foreground">{title}</span>
        {hint ? <span className="ml-auto pl-2">{hint}</span> : null}
      </button>
      {open && <div className="space-y-2 px-3 pb-3">{children}</div>}
    </section>
  );
}

/** Text input that commits on blur / Enter — the inspector's standard
 *  draft-then-commit text pattern (LayerName in selection-inspector). */
function CommitTextField({
  id,
  value,
  placeholder,
  onCommit,
}: {
  id: string;
  value: string;
  placeholder?: string;
  onCommit: (next: string) => void;
}) {
  const [draft, setDraft] = React.useState<string | null>(null);
  const ref = React.useRef<HTMLInputElement>(null);
  // New upstream value (scene switched, external edit) discards the draft.
  React.useEffect(() => {
    setDraft(null);
  }, [value]);
  return (
    <Input
      id={id}
      ref={ref}
      size="2xs"
      autoComplete="off"
      spellCheck={false}
      value={draft ?? value}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.currentTarget.value)}
      onBlur={() => {
        if (draft !== null && draft !== value) onCommit(draft);
        setDraft(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          ref.current?.blur();
        }
      }}
    />
  );
}

/** Number input, same commit-on-blur/Enter contract. Empty commits as
 *  null (remove the prop); anything non-numeric is dropped. */
function CommitNumberField({
  id,
  value,
  placeholder,
  onCommit,
}: {
  id: string;
  /** Current value, or null when the prop is unset. */
  value: number | null;
  placeholder?: string;
  onCommit: (next: number | null) => void;
}) {
  const display = value === null ? "" : String(value);
  const [draft, setDraft] = React.useState<string | null>(null);
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    setDraft(null);
  }, [display]);
  return (
    <Input
      id={id}
      ref={ref}
      size="2xs"
      type="number"
      inputMode="numeric"
      min={0}
      value={draft ?? display}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.currentTarget.value)}
      onBlur={() => {
        if (draft !== null && draft !== display) {
          const trimmed = draft.trim();
          if (trimmed === "") {
            onCommit(null);
          } else {
            const n = Number(trimmed);
            if (Number.isFinite(n) && n >= 0) onCommit(Math.round(n));
          }
        }
        setDraft(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          ref.current?.blur();
        }
      }}
    />
  );
}

export interface MotionScenePanelProps {
  /** The Motion design's JSX blob. */
  appSource: string | null;
  /** The page's source-mutation channel (handleSourceMutation) — same
   *  one the timeline dock and the inspector write through, so every
   *  edit here is an undo step with a label. */
  onSourceMutation: (next: string, label?: string) => void;
  className?: string;
}

export function MotionScenePanel({
  appSource,
  onSourceMutation,
  className,
}: MotionScenePanelProps) {
  const scenes = React.useMemo(
    () => extractMotionScenes(appSource),
    [appSource],
  );

  // ── Selection: manual pick pins; otherwise follow playback ──
  const [manualSelected, setManualSelected] = React.useState<number | null>(
    null,
  );
  const [playingScene, setPlayingScene] = React.useState(0);

  // The <Motion> in the iframe broadcasts grade:motion-state — same
  // listener trick as the timeline dock. We track the playing scene to
  // highlight it, and to drive selection while the user hasn't pinned
  // one manually.
  React.useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data as { type?: string; scene?: number } | null;
      if (d?.type === "grade:motion-state" && typeof d.scene === "number") {
        setPlayingScene(d.scene);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Clamp everything when scenes are added/removed.
  const count = scenes.length;
  const selected = Math.max(
    0,
    Math.min(manualSelected ?? playingScene, count - 1),
  );

  // ── Seek: post grade:motion-control at every iframe (same broadcast
  // the dock's postControl does — the Motion component is the handler,
  // so it works in both renderers). ──
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

  const selectScene = React.useCallback(
    (i: number) => {
      setManualSelected(i);
      postControl({ scene: i });
    },
    [postControl],
  );

  // ── Write half — every gesture is one motion-source call, null-guarded. ──
  const write = React.useCallback(
    (next: string | null, label: string) => {
      if (next !== null) onSourceMutation(next, label);
    },
    [onSourceMutation],
  );

  const scene: TimelineMotionScene | undefined = scenes[selected];

  // Raw props (as opposed to the dock's DERIVED duration estimate):
  // the duration field edits the explicit `durationMs` prop, so read it
  // straight off the opening tag — showing the estimate in an editable
  // field would write estimates back into the source.
  const rawProps = React.useMemo(() => {
    if (!appSource) return { durationMs: null as number | null, transitionMs: null as number | null };
    const span = findMotionScenes(appSource)[selected];
    if (!span) return { durationMs: null, transitionMs: null };
    const openTag = appSource.slice(span.start, span.openTagEnd);
    const dm = openTag.match(/\bdurationMs\s*=\s*\{?\s*([0-9.]+)/);
    const tm = openTag.match(/\btransitionMs\s*=\s*\{?\s*([0-9.]+)/);
    return {
      durationMs: dm ? Number(dm[1]) : null,
      transitionMs: tm ? Number(tm[1]) : null,
    };
  }, [appSource, selected]);

  const currentFill = React.useMemo(
    () => readSceneFill(appSource, selected),
    [appSource, selected],
  );

  if (!appSource || count === 0) {
    return (
      <div
        className={cn(
          "flex h-full items-center justify-center px-4 text-center text-[11px] text-muted-foreground",
          className,
        )}
      >
        No scenes yet — add one with “Add scene” in the timeline below.
      </div>
    );
  }

  return (
    <div
      className={cn(
        // No horizontal padding on the shell — sections own px-3 so the
        // dividers run edge-to-edge (selection-inspector idiom).
        "flex h-full flex-col overflow-y-auto",
        className,
      )}
      // Lenis smooth-scroll opt-out — same as the selection inspector.
      data-lenis-prevent
      data-gds-part="motion-scene-panel"
    >
      {/* Header — mirrors the docked inspector's title strip. */}
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2.5 text-sm">
        <Film className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-semibold">Motion scenes</span>
        <span className="ml-auto text-2xs text-muted-foreground">
          {count === 1 ? "1 scene" : `${count} scenes`}
        </span>
      </header>

      {/* ── Scenes list ── */}
      <CollapsibleSection title="Scenes">
        <div className="space-y-0.5">
          {scenes.map((s, i) => {
            const isSelected = i === selected;
            const isPlaying = i === playingScene;
            return (
              <button
                key={i}
                type="button"
                onClick={() => selectScene(i)}
                title={`Select & play from ${s.label ?? `scene ${i + 1}`}`}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                  isSelected
                    ? "bg-primary/10 text-foreground"
                    : "text-foreground/90 hover:bg-muted",
                )}
              >
                {/* Playhead dot — solid while this scene is on screen. */}
                <span
                  aria-hidden
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    isPlaying ? "bg-primary" : "bg-border",
                  )}
                />
                <span className="min-w-0 flex-1 truncate text-xs">
                  {s.label ?? `Scene ${i + 1}`}
                </span>
                <span className="shrink-0 text-2xs tabular-nums text-muted-foreground">
                  {(s.durationMs / 1000).toFixed(1)}s
                </span>
                <span className="w-14 shrink-0 truncate text-right text-2xs text-muted-foreground">
                  {s.transition}
                </span>
              </button>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* ── Selected scene fields ── */}
      {scene && (
        <CollapsibleSection title="Scene">
          <div className="space-y-1">
            <Label htmlFor="motion-scene-label" className={FIELD_LABEL}>
              Label
            </Label>
            <CommitTextField
              id="motion-scene-label"
              value={scene.label ?? ""}
              placeholder={`Scene ${selected + 1}`}
              onCommit={(next) =>
                write(
                  setSceneProp(
                    appSource,
                    selected,
                    "label",
                    next.trim() || null,
                  ),
                  "Rename scene",
                )
              }
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="motion-scene-duration" className={FIELD_LABEL}>
              Duration ms
            </Label>
            <CommitNumberField
              id="motion-scene-duration"
              value={rawProps.durationMs}
              // The dock's derived estimate is a useful hint when the
              // prop is unset (timed children keep the clock).
              placeholder={`Auto · ~${Math.round(scene.durationMs)}`}
              onCommit={(n) =>
                write(
                  setSceneProp(appSource, selected, "durationMs", n),
                  "Change scene duration",
                )
              }
            />
            <p className="text-[10px] text-muted-foreground/70">
              Minimum runtime — timed children can run past it.
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="motion-scene-transition" className={FIELD_LABEL}>
              Transition
            </Label>
            <Select
              value={scene.transition}
              onValueChange={(v) =>
                write(
                  setSceneProp(
                    appSource,
                    selected,
                    "transition",
                    v === "fade" ? null : v,
                  ),
                  "Change transition",
                )
              }
            >
              <SelectTrigger
                id="motion-scene-transition"
                size="2xs"
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent size="2xs" position="item-aligned">
                {SCENE_TRANSITIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="motion-scene-transition-ms" className={FIELD_LABEL}>
              Transition ms
            </Label>
            <CommitNumberField
              id="motion-scene-transition-ms"
              value={rawProps.transitionMs}
              placeholder="Default"
              onCommit={(n) =>
                write(
                  setSceneProp(appSource, selected, "transitionMs", n),
                  "Change transition timing",
                )
              }
            />
          </div>
        </CollapsibleSection>
      )}

      {/* ── Fill ── */}
      {scene && (
        <CollapsibleSection title="Fill">
          <div className="flex items-center gap-1.5">
            {FILL_PRESETS.map((p) => {
              const active = (currentFill ?? null) === p.value;
              return (
                <button
                  key={p.label}
                  type="button"
                  title={p.label}
                  aria-label={`Fill: ${p.label}`}
                  onClick={() =>
                    write(
                      setSceneProp(appSource, selected, "fill", p.value),
                      "Change scene fill",
                    )
                  }
                  className={cn(
                    "relative h-7 w-7 shrink-0 overflow-hidden rounded-md border transition-shadow",
                    active
                      ? "border-primary ring-1 ring-primary"
                      : "border-border hover:border-foreground/40",
                  )}
                >
                  {p.value === null ? (
                    // "None" — the classic diagonal slash swatch.
                    <span
                      aria-hidden
                      className="absolute inset-0 bg-background"
                    >
                      <span className="absolute left-1/2 top-1/2 h-px w-[150%] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-destructive/70" />
                    </span>
                  ) : (
                    <span
                      aria-hidden
                      className="absolute inset-0"
                      style={{ background: p.value }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <div className="space-y-1">
            <Label htmlFor="motion-scene-fill" className={FIELD_LABEL}>
              Custom CSS background
            </Label>
            <CommitTextField
              id="motion-scene-fill"
              value={currentFill ?? ""}
              placeholder="e.g. radial-gradient(…) or #101014"
              onCommit={(next) =>
                write(
                  setSceneProp(
                    appSource,
                    selected,
                    "fill",
                    next.trim() || null,
                  ),
                  "Change scene fill",
                )
              }
            />
          </div>
        </CollapsibleSection>
      )}

      {/* ── Actions ── */}
      {scene && (
        <CollapsibleSection title="Actions">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                write(duplicateScene(appSource, selected), "Duplicate scene")
              }
              className="inline-flex h-6 items-center gap-1 rounded-md border border-border px-2 text-2xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-3"
            >
              <Copy />
              Duplicate
            </button>
            <button
              type="button"
              disabled={count <= 1}
              onClick={() => {
                const next = removeScene(appSource, selected);
                if (next !== null) {
                  // Keep the selection on a real row after the splice.
                  setManualSelected(Math.max(0, selected - 1));
                  onSourceMutation(next, "Delete scene");
                }
              }}
              className="inline-flex h-6 items-center gap-1 rounded-md border border-border px-2 text-2xs text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-3"
            >
              <Trash2 />
              Delete
            </button>
          </div>
          {count <= 1 && (
            <p className="text-[10px] text-muted-foreground/70">
              A motion keeps at least one scene.
            </p>
          )}
        </CollapsibleSection>
      )}
    </div>
  );
}
