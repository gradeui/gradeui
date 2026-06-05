"use client";

import * as React from "react";
import { useReducedMotion } from "../../lib/motion";
import { cn } from "@/lib/utils";
import { ScreenAnimator, type ScreenAnimatorShot } from "./screen-animator";

/**
 * Motion — a directed sequence of scenes on one persistent stage.
 *
 * The grammar of a modern product demo: text → demo → video → text, any
 * order, any mix. A `<Motion>` owns the stage (one continuous backdrop) and
 * plays its `<MotionScene>`s in order. A scene is a *stage moment* holding
 * arbitrary content:
 *
 *   - `<MotionScreen>` — a framed screen with its OWN camera (`shots`,
 *     ScreenAnimator applied per-screen). Several can share a scene
 *     (mobile + desktop side by side).
 *   - `<MotionText>` — templated text animations (Motion Templates:
 *     title / lower-third / section-break).
 *   - anything else — a <video>, an image, plain JSX. Untimed content
 *     rides the scene's `durationMs`.
 *
 * THE COMPLETION CONTRACT: a scene advances when all its *timed* children
 * have finished (a camera tour ending, a text template completing), or
 * after `durationMs` when nothing in it keeps time. Timed children register
 * with the scene; static content doesn't. New content types plug in by
 * registering — nothing else changes.
 *
 * Two views of the same children: `view="play"` (the film) and
 * `view="strip"` (the arrangement — scenes left-to-right as labelled
 * cards, the Studio edit view). Under `prefers-reduced-motion` the play
 * view falls back to the strip: see everything, move nothing.
 *
 * See STUDIO-DIRECTOR.md ("Grade Motion") for the design doc.
 */

// ─── Scene context: how content talks to its scene ─────────────────────

export interface MotionSceneRegistration {
  /** Signal this timed child has finished its run. Idempotent. */
  done: () => void;
  /** Unregister (unmount) without deadlocking the scene. */
  cancel: () => void;
}

interface SceneCtxValue {
  mode: "play" | "strip";
  active: boolean;
  paused: boolean;
  /** Register as a timed child. Call in a mount effect; cancel on cleanup. */
  register: () => MotionSceneRegistration;
}

const SceneCtx = React.createContext<SceneCtxValue | null>(null);

const STANDALONE_CTX: SceneCtxValue = {
  mode: "play",
  active: true,
  paused: false,
  register: () => ({ done: () => {}, cancel: () => {} }),
};

/** Read the enclosing scene (or a permissive standalone default). */
export function useMotionScene(): SceneCtxValue {
  return React.useContext(SceneCtx) ?? STANDALONE_CTX;
}

// Same canvas-fill token ScreenAnimator reads, so every stage matches.
const DEFAULT_STAGE =
  "var(--gds-canvas-fill, radial-gradient(circle at 50% 38%, #1b1b22, #0b0b0e))";

// ─── Scene error isolation ──────────────────────────────────────────────
// A scene that throws must not take the film down. The boundary catches
// the render error, shows a quiet chip, and (in play mode) auto-skips to
// the next scene — the show goes on. Keyed per scene activation so a
// failure in scene 4 never poisons scene 5.

function SceneFailedCard({
  label,
  onSkip,
}: {
  label?: string;
  onSkip?: () => void;
}) {
  React.useEffect(() => {
    if (!onSkip) return;
    const t = setTimeout(onSkip, 1400);
    return () => clearTimeout(t);
  }, [onSkip]);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          padding: "8px 14px",
          borderRadius: 999,
          background: "rgba(15,15,17,0.6)",
          border: "1px solid rgba(255,255,255,0.16)",
          color: "rgba(255,255,255,0.75)",
          fontSize: 12.5,
          backdropFilter: "blur(10px)",
        }}
      >
        {label ? `Scene “${label}” hit an error` : "This scene hit an error"}
        {onSkip ? " — skipping" : ""}
      </span>
    </div>
  );
}

class SceneBoundary extends React.Component<
  { label?: string; onSkip?: () => void; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    // Quiet by design — the chip is the surface; the host's console
    // still carries the original error for debugging.
  }
  render() {
    if (this.state.failed)
      return <SceneFailedCard label={this.props.label} onSkip={this.props.onSkip} />;
    return this.props.children;
  }
}

// ─── MiniRender: a screen at a virtual width, scaled to its frame ───────

function MiniRender({
  virtualWidth,
  children,
}: {
  virtualWidth: number;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [box, setBox] = React.useState<{ w: number; h: number } | null>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () =>
      setBox({ w: el.clientWidth || 1, h: el.clientHeight || 1 });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scale = box ? box.w / virtualWidth : 0;
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {box && scale > 0 && (
        <div
          style={{
            width: virtualWidth,
            height: box.h / scale,
            transform: `scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ─── FitBox: letterbox a fixed-aspect stage into the container ──────────

function parseAspect(aspect: string): number | null {
  const m = aspect.match(/^\s*([0-9.]+)\s*\/\s*([0-9.]+)\s*$/);
  if (!m) return null;
  const r = Number(m[1]) / Number(m[2]);
  return Number.isFinite(r) && r > 0 ? r : null;
}

function FitBox({
  ratio,
  children,
}: {
  ratio: number;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [box, setBox] = React.useState<{ w: number; h: number } | null>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const cw = el.clientWidth || 1;
      const ch = el.clientHeight || 1;
      const w = Math.min(cw, ch * ratio);
      setBox({ w, h: w / ratio });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ratio]);
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0 }}>
      {box && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: box.w,
            height: box.h,
            overflow: "hidden",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ─── MotionScreen — a framed screen with its own camera ─────────────────

export interface MotionScreenProps {
  /** Frame preset. Desktop is a 16:10 browser-ish frame; mobile a tall
   *  device frame. Default "desktop". */
  device?: "desktop" | "mobile";
  /** Camera shots for THIS screen (ScreenAnimator, per-screen). Omit for
   *  fly-in + a single dwell. */
  shots?: ScreenAnimatorShot[];
  /** Virtual CSS width the content is laid out at before scaling into the
   *  frame. Defaults: desktop 1100, mobile 390. */
  virtualWidth?: number;
  /** Dim edges when the camera pushes in. Default false. */
  spotlight?: boolean;
  /** Synthetic cursor on detail shots. Default true. */
  cursor?: boolean;
  /** Fly in from offscreen when the scene starts. Default true. */
  enter?: boolean;
  /** Provenance — the Studio screen this was copied from. Ignored at
   *  render; read by tooling (the dock, future live-reference scenes). */
  screenId?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function MotionScreen({
  device = "desktop",
  shots,
  virtualWidth,
  spotlight = false,
  cursor = true,
  enter = true,
  screenId: _screenId,
  className,
  style,
  children,
}: MotionScreenProps) {
  const scene = useMotionScene();
  const vw = virtualWidth ?? (device === "mobile" ? 390 : 1100);

  // Register as a timed child while active in play mode: the camera tour
  // (or the default fly-in + dwell) is this screen's clock.
  const regRef = React.useRef<MotionSceneRegistration | null>(null);
  const playing = scene.mode === "play" && scene.active;
  const { register } = scene;
  React.useEffect(() => {
    if (!playing) return;
    const reg = register();
    regRef.current = reg;
    return () => {
      regRef.current = null;
      reg.cancel();
    };
  }, [playing, register]);

  const frame: React.CSSProperties =
    device === "mobile"
      ? {
          position: "relative",
          height: "76%",
          aspectRatio: "390 / 800",
          borderRadius: 22,
          flex: "0 0 auto",
        }
      : {
          position: "relative",
          flex: "1 1 0%",
          maxWidth: "82%",
          aspectRatio: "16 / 10",
          minWidth: 0,
          borderRadius: 12,
        };

  return (
    <div
      data-gds-part="motion-screen"
      className={cn("gds-motion-screen", className)}
      style={{
        ...frame,
        overflow: "hidden",
        background: "var(--gds-background, #fff)",
        boxShadow:
          "0 18px 60px rgba(0,0,0,0.38), 0 2px 10px rgba(0,0,0,0.22)",
        ...style,
      }}
    >
      {playing ? (
        <ScreenAnimator
          shots={shots}
          loop={false}
          controls={false}
          enter={enter}
          spotlight={spotlight}
          cursor={cursor}
          stage="transparent"
          paused={scene.paused}
          onEnded={() => regRef.current?.done()}
        >
          <MiniRender virtualWidth={vw}>{children}</MiniRender>
        </ScreenAnimator>
      ) : (
        // Strip / inactive: a static poster, no camera.
        <MiniRender virtualWidth={vw}>{children}</MiniRender>
      )}
    </div>
  );
}

// ─── MotionText — Motion Templates (pre-directed text animations) ───────

export type MotionTextTemplate = "title" | "lower-third" | "section-break";

const TEMPLATE_DURATION: Record<MotionTextTemplate, number> = {
  title: 3800,
  "lower-third": 3200,
  "section-break": 4200,
};

export interface MotionTextProps {
  /** Which Motion Template. Default "title". */
  template?: MotionTextTemplate;
  heading: string;
  /** Supporting line (title / lower-third). */
  text?: string;
  /** Override the template's run length (ms). */
  durationMs?: number;
  /** Text colour against the stage. Default "light" (for the dark stage). */
  tone?: "light" | "dark";
  className?: string;
  style?: React.CSSProperties;
}

export function MotionText({
  template = "title",
  heading,
  text,
  durationMs,
  tone = "light",
  className,
  style,
}: MotionTextProps) {
  const scene = useMotionScene();
  const reduced = useReducedMotion();
  const dur = durationMs ?? TEMPLATE_DURATION[template];
  const playing = scene.mode === "play" && scene.active;
  const animate = playing && !reduced;

  // Timed child: register, run a pause-aware clock, signal done.
  const regRef = React.useRef<MotionSceneRegistration | null>(null);
  const remainRef = React.useRef(dur);
  const { register, paused } = scene;
  React.useEffect(() => {
    if (!playing) return;
    remainRef.current = dur;
    const reg = register();
    regRef.current = reg;
    return () => {
      regRef.current = null;
      reg.cancel();
    };
  }, [playing, dur, register]);
  React.useEffect(() => {
    if (!playing || paused) return;
    const started = Date.now();
    const t = setTimeout(() => {
      remainRef.current = 0;
      regRef.current?.done();
    }, remainRef.current);
    return () => {
      clearTimeout(t);
      remainRef.current = Math.max(0, remainRef.current - (Date.now() - started));
    };
  }, [playing, paused]);

  const color = tone === "dark" ? "#16161a" : "#fff";
  const playState = paused ? ("paused" as const) : ("running" as const);
  const anim = (name: string, ms: number, delay = 0): React.CSSProperties =>
    animate
      ? {
          animation: `${name} ${ms}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms both`,
          animationPlayState: playState,
        }
      : {};

  return (
    <div
      data-gds-part="motion-text"
      className={cn("gds-motion-text", className)}
      style={{
        position: template === "lower-third" ? "absolute" : "relative",
        ...(template === "lower-third"
          ? { left: "6%", bottom: "9%" }
          : { textAlign: "center", maxWidth: "72%" }),
        color,
        pointerEvents: "none",
        ...style,
      }}
    >
      <style>{`
        @keyframes gdsMotionFadeUp { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes gdsMotionSlideIn { from { opacity: 0; transform: translateX(-28px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes gdsMotionPush { from { opacity: 0; transform: scale(1.05) } to { opacity: 1; transform: scale(1) } }
      `}</style>

      {template === "title" && (
        <>
          <div
            style={{
              fontSize: "clamp(26px, 5.2vw, 60px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.06,
              ...anim("gdsMotionFadeUp", 700),
            }}
          >
            {heading}
          </div>
          {text && (
            <div
              style={{
                marginTop: 14,
                fontSize: "clamp(14px, 1.8vw, 20px)",
                opacity: 0.72,
                ...anim("gdsMotionFadeUp", 700, 160),
              }}
            >
              {text}
            </div>
          )}
        </>
      )}

      {template === "lower-third" && (
        <div
          style={{
            display: "inline-flex",
            flexDirection: "column",
            gap: 3,
            padding: "10px 16px",
            borderRadius: 12,
            background:
              tone === "dark" ? "rgba(255,255,255,0.78)" : "rgba(15,15,17,0.62)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 6px 22px rgba(0,0,0,0.25)",
            ...anim("gdsMotionSlideIn", 500),
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 650 }}>{heading}</span>
          {text && <span style={{ fontSize: 12.5, opacity: 0.72 }}>{text}</span>}
        </div>
      )}

      {template === "section-break" && (
        <div
          style={{
            fontSize: "clamp(30px, 6vw, 72px)",
            fontWeight: 700,
            letterSpacing: "-0.025em",
            lineHeight: 1.04,
            ...anim("gdsMotionPush", 1400),
          }}
        >
          {heading}
        </div>
      )}
    </div>
  );
}

// ─── MotionScene — one stage moment ─────────────────────────────────────

export interface MotionSceneProps {
  /** Shown in the strip view + read by the timeline dock. */
  label?: string;
  /** Fallback clock when the scene has no timed children (ms). Default 4000. */
  durationMs?: number;
  /** Scene background painted over the shared stage for this moment only
   *  (a CSS background — the white title card, a brand fill). */
  fill?: string;
  /** How the scene arrives. Default "fade". */
  transition?: "fade" | "none";
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const UNTIMED_FALLBACK_MS = 4000;
const ADVANCE_BEAT_MS = 420;

interface MotionSceneInternal {
  active: boolean;
  paused: boolean;
  mode: "play" | "strip";
  onSceneEnd: () => void;
}

function MotionSceneImpl({
  label: _label,
  durationMs,
  fill,
  transition = "fade",
  className,
  style,
  children,
  internal,
}: MotionSceneProps & { internal: MotionSceneInternal }) {
  const { active, paused, mode, onSceneEnd } = internal;
  const playing = mode === "play" && active;

  // ── The completion registry ──
  // Timed children register on mount (their effects run before ours, so by
  // the time the scene's own effect looks, the count is settled). The scene
  // advances when all registered children are done — or, with none, after
  // `durationMs`.
  const totalRef = React.useRef(0);
  const doneRef = React.useRef(0);
  const endedRef = React.useRef(false);
  const endNow = React.useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    onSceneEnd();
  }, [onSceneEnd]);
  const endTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const check = React.useCallback(() => {
    if (totalRef.current > 0 && doneRef.current >= totalRef.current) {
      // A breath after the last child settles, then cut.
      if (!endTimer.current)
        endTimer.current = setTimeout(endNow, ADVANCE_BEAT_MS);
    }
  }, [endNow]);
  const register = React.useCallback((): MotionSceneRegistration => {
    totalRef.current += 1;
    let isDone = false;
    return {
      done: () => {
        if (isDone) return;
        isDone = true;
        doneRef.current += 1;
        check();
      },
      cancel: () => {
        totalRef.current -= 1;
        if (isDone) doneRef.current -= 1;
        else check();
      },
    };
  }, [check]);

  // Untimed fallback clock (pause-aware).
  const remainRef = React.useRef(durationMs ?? UNTIMED_FALLBACK_MS);
  React.useEffect(() => {
    if (!playing) return;
    remainRef.current = durationMs ?? UNTIMED_FALLBACK_MS;
    endedRef.current = false;
    return () => {
      if (endTimer.current) {
        clearTimeout(endTimer.current);
        endTimer.current = null;
      }
    };
  }, [playing, durationMs]);
  React.useEffect(() => {
    if (!playing || paused) return;
    if (totalRef.current > 0) return; // timed children own the clock
    const started = Date.now();
    const t = setTimeout(endNow, remainRef.current);
    return () => {
      clearTimeout(t);
      remainRef.current = Math.max(
        0,
        remainRef.current - (Date.now() - started),
      );
    };
  }, [playing, paused, endNow]);

  const ctx = React.useMemo<SceneCtxValue>(
    () => ({ mode, active, paused, register }),
    [mode, active, paused, register],
  );

  return (
    <SceneCtx.Provider value={ctx}>
      <div
        data-gds-part="motion-scene"
        className={cn("gds-motion-scene", className)}
        style={{
          position: "absolute",
          inset: 0,
          background: fill,
          ...(playing && transition === "fade"
            ? { animation: "gdsMotionSceneIn 420ms ease both" }
            : {}),
          ...style,
        }}
      >
        <style>{`@keyframes gdsMotionSceneIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4%",
            padding: "6%",
          }}
        >
          {children}
        </div>
      </div>
    </SceneCtx.Provider>
  );
}

/**
 * One stage moment in a `<Motion>`. Holds arbitrary content; advances by
 * the completion contract (see the file header). Renders standalone too
 * (active, looping nothing) so a scene can be previewed in isolation —
 * each scene is independently editable.
 */
export function MotionScene(props: MotionSceneProps) {
  // Standalone render (no Motion parent injecting internals): play, active.
  return (
    <MotionSceneImpl
      {...props}
      internal={{ active: true, paused: false, mode: "play", onSceneEnd: () => {} }}
    />
  );
}

// ─── Motion — the sequencer ─────────────────────────────────────────────

export interface MotionProps {
  /** "play" runs the film; "strip" lays the scenes out left-to-right as
   *  labelled cards (the arrangement / edit view). Default "play". */
  view?: "play" | "strip";
  /** Fixed artboard aspect for the film, letterboxed into the container —
   *  "16/9" (landscape demo), "9/16" (TikTok / Reels / Shorts), "1/1".
   *  Default "auto": the stage fills the container responsively. Strip
   *  cards adopt the same ratio. */
  aspect?: "auto" | "16/9" | "9/16" | "1/1" | (string & {});
  /** The persistent stage behind every scene (CSS background). */
  stage?: string;
  /** A live layer behind all scenes (image, gradient, <ThreeScene>). */
  backdrop?: React.ReactNode;
  /** Start playing on mount. Default true. */
  autoplay?: boolean;
  /** Return to scene 1 and keep going at the end. Default false — a
   *  motion is a movie; it ends. */
  loop?: boolean;
  /** Show the transport (play/pause, restart, scene dots). Default true. */
  controls?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  borderRadius: 999,
  border: "none",
  background: "transparent",
  color: "#fff",
  cursor: "pointer",
};

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}
function RestartIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function isMotionScene(
  child: React.ReactNode,
): child is React.ReactElement<MotionSceneProps> {
  return React.isValidElement(child);
}

export function Motion({
  view = "play",
  aspect = "auto",
  stage = DEFAULT_STAGE,
  backdrop,
  autoplay = true,
  loop = false,
  controls = true,
  className,
  style,
  children,
}: MotionProps) {
  const reduced = useReducedMotion();
  const scenes = React.Children.toArray(children).filter(isMotionScene);
  const count = scenes.length;
  const ratio = aspect !== "auto" ? parseAspect(aspect) : null;
  const cardAspect = ratio ? aspect : "16 / 9";
  // Vertical formats want narrower strip cards.
  const cardWidth =
    ratio && ratio < 1 ? "clamp(150px, 17%, 250px)" : "clamp(260px, 30%, 440px)";

  const [idx, setIdx] = React.useState(0);
  const [paused, setPaused] = React.useState(!autoplay);
  const [done, setDone] = React.useState(false);
  // Remount the active scene per activation so its clocks start fresh.
  const [runId, setRunId] = React.useState(0);
  // Host-driven view override (the dock's Play/Arrange toggle posts
  // "set-view" over the control channel) — beats the `view` prop without
  // a source mutation. Reduced motion still forces the strip.
  const [viewOverride, setViewOverride] = React.useState<
    "play" | "strip" | null
  >(null);
  const effectiveView = viewOverride ?? view;

  const goTo = React.useCallback((i: number) => {
    setIdx(i);
    setDone(false);
    setPaused(false);
    setRunId((r) => r + 1);
  }, []);
  const advance = React.useCallback(() => {
    setIdx((cur) => {
      const next = cur + 1;
      if (next < count) {
        setRunId((r) => r + 1);
        return next;
      }
      if (loop && count > 0) {
        setRunId((r) => r + 1);
        return 0;
      }
      setDone(true);
      setPaused(true);
      return cur;
    });
  }, [count, loop]);

  // ── External control + state broadcast (the scrub channel) ──
  // The component itself is the protocol handler, so it works in any
  // host iframe (Fast Frame AND Sandpack) with zero host wiring:
  //   parent → iframe  { type: "grade:motion-control", scene? , action? }
  //   iframe → parent  { type: "grade:motion-state", scene, paused, done, count }
  // Scene-level seek today (jump to scene i); intra-scene time scrub
  // arrives with the seekable-clock refactor (STUDIO-DIRECTOR, D4/M2).
  const isPlay = effectiveView === "play" && !reduced;
  React.useEffect(() => {
    if (reduced || typeof window === "undefined") return;
    const onMsg = (e: MessageEvent) => {
      const d = e.data as
        | { type?: string; action?: string; scene?: number; view?: string }
        | null;
      if (!d || d.type !== "grade:motion-control") return;
      if (d.action === "set-view") {
        if (d.view === "play" || d.view === "strip") setViewOverride(d.view);
        return;
      }
      if (typeof d.scene === "number") {
        setViewOverride("play");
        goTo(Math.max(0, Math.min(count - 1, Math.round(d.scene))));
      } else if (d.action === "pause") {
        setPaused(true);
      } else if (d.action === "play") {
        setViewOverride("play");
        setDone(false);
        setPaused(false);
      } else if (d.action === "restart") {
        setViewOverride("play");
        goTo(0);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [reduced, goTo, count]);
  // Spacebar = play/pause, the universal transport key. Guarded so
  // typing in any input / textarea / contenteditable (a live composer
  // in a scene!) never toggles playback.
  React.useEffect(() => {
    if (reduced || typeof window === "undefined") return;
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
      setViewOverride("play");
      setDone(false);
      setPaused((p) => !p);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reduced]);

  React.useEffect(() => {
    if (reduced || typeof window === "undefined") return;
    try {
      window.parent?.postMessage(
        {
          type: "grade:motion-state",
          scene: idx,
          paused,
          done,
          count,
          view: effectiveView,
        },
        "*",
      );
    } catch {
      // Cross-origin parent that rejects the message — fine, no dock there.
    }
  }, [reduced, idx, paused, done, count, effectiveView]);

  // Reduced motion (or strip view): the arrangement, nothing moves.
  // TEASER CAP: when we land here via reduced/motion-off (grid tiles,
  // posters) rather than an explicit strip request, render only the
  // first two scenes + a "+N scenes" chip — a tile is a teaser, and
  // mounting every scene's full screen copies makes tiles meaty.
  // An explicit Arrange view (view prop or host override) stays complete.
  const explicitStrip = view === "strip" || viewOverride === "strip";
  if (effectiveView === "strip" || reduced) {
    const TEASER = 2;
    const teaser = !explicitStrip && scenes.length > TEASER;
    const shown = teaser ? scenes.slice(0, TEASER) : scenes;
    const hidden = scenes.length - shown.length;
    return (
      <div
        data-gds-part="motion"
        className={cn("gds-motion", className)}
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          background: stage,
          ...style,
        }}
      >
        {backdrop && (
          <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {backdrop}
          </div>
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            gap: 28,
            padding: "0 48px",
            overflowX: "auto",
          }}
        >
          {shown.map((scene, i) => (
            <figure
              key={i}
              style={{ margin: 0, flex: "0 0 auto", width: cardWidth }}
            >
              <figcaption
                style={{
                  marginBottom: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.66)",
                }}
              >
                {scene.props.label ?? `Scene ${i + 1}`}
              </figcaption>
              <div
                style={{
                  position: "relative",
                  aspectRatio: cardAspect,
                  borderRadius: 10,
                  overflow: "hidden",
                  background: scene.props.fill ?? "rgba(127,127,127,0.10)",
                  border: "1px solid rgba(127,127,127,0.22)",
                  boxShadow: "0 10px 34px rgba(0,0,0,0.28)",
                }}
              >
                <SceneBoundary label={scene.props.label}>
                  <MotionSceneImpl
                    {...scene.props}
                    // The card already paints the fill; don't double-paint.
                    fill={undefined}
                    internal={{
                      active: false,
                      paused: true,
                      mode: "strip",
                      onSceneEnd: () => {},
                    }}
                  />
                </SceneBoundary>
              </div>
            </figure>
          ))}

          {/* The teaser's "+N scenes" chip — same footprint, no content
              mounted, so the tile stays light. */}
          {teaser && hidden > 0 && (
            <figure style={{ margin: 0, flex: "0 0 auto", width: cardWidth }}>
              <figcaption
                style={{
                  marginBottom: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.66)",
                }}
              >
                …
              </figcaption>
              <div
                style={{
                  aspectRatio: cardAspect,
                  borderRadius: 10,
                  display: "grid",
                  placeItems: "center",
                  border: "1px dashed rgba(127,127,127,0.4)",
                  color: "rgba(255,255,255,0.55)",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                +{hidden} scene{hidden === 1 ? "" : "s"}
              </div>
            </figure>
          )}
        </div>
      </div>
    );
  }

  const active = scenes[Math.min(idx, Math.max(0, count - 1))];

  // The film frame: stage + backdrop + active scene + transport. With a
  // fixed aspect it letterboxes into the container (9/16 = TikTok/Reels);
  // with "auto" it fills responsively.
  const film = (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: stage,
      }}
    >
      {backdrop && (
        <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {backdrop}
        </div>
      )}

      {active && (
        <SceneBoundary
          key={`${idx}:${runId}`}
          label={active.props.label}
          onSkip={count > 1 ? advance : undefined}
        >
          <MotionSceneImpl
            {...active.props}
            internal={{ active: true, paused, mode: "play", onSceneEnd: advance }}
          />
        </SceneBoundary>
      )}

      {/* Transport — play/pause, restart, and the scene dots (random access:
          a motion is slides that play themselves). */}
      {controls && count > 0 && (
        <div
          role="group"
          aria-label="Motion playback controls"
          style={{
            position: "absolute",
            right: 16,
            bottom: 16,
            display: "flex",
            gap: 4,
            alignItems: "center",
            padding: "4px 6px",
            borderRadius: 999,
            background: "rgba(15,15,17,0.55)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 6px 22px rgba(0,0,0,0.25)",
          }}
        >
          <button
            type="button"
            onClick={() => (done ? goTo(0) : setPaused((p) => !p))}
            aria-label={done ? "Replay" : paused ? "Play" : "Pause"}
            style={btn}
          >
            {done ? <RestartIcon /> : paused ? <PlayIcon /> : <PauseIcon />}
          </button>
          <button type="button" onClick={() => goTo(0)} aria-label="Restart" style={btn}>
            <RestartIcon />
          </button>
          <div style={{ display: "flex", gap: 5, padding: "0 6px" }} aria-hidden>
            {scenes.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to ${s.props.label ?? `scene ${i + 1}`}`}
                style={{
                  ...btn,
                  width: 14,
                  height: 14,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background:
                      i === idx ? "#fff" : "rgba(255,255,255,0.35)",
                    transition: "background 200ms ease",
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ended — centred replay, like a finished video. */}
      {done && (
        <button
          type="button"
          onClick={() => goTo(0)}
          aria-label="Replay"
          style={{
            position: "absolute",
            inset: 0,
            margin: "auto",
            width: 64,
            height: 64,
            display: "grid",
            placeItems: "center",
            borderRadius: 999,
            border: "none",
            color: "#fff",
            background: "rgba(15,15,17,0.55)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
            cursor: "pointer",
          }}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      )}
    </div>
  );

  return (
    <div
      data-gds-part="motion"
      className={cn("gds-motion", className)}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        // Letterbox bars when a fixed aspect floats in the container.
        background: ratio ? "#0a0a0c" : stage,
        ...style,
      }}
    >
      {ratio ? <FitBox ratio={ratio}>{film}</FitBox> : film}
    </div>
  );
}
