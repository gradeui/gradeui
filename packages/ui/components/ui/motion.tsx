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
  /** Fly the CONTENT in from offscreen when the scene starts. Default
   *  FALSE for framed screens — the full-screen fly-in choreography
   *  reads badly inside a small clipped frame (content sliding around
   *  in a box). Scene `transition` and frame `animate` are the
   *  entrances here; opt back in for full-bleed hero screens. */
  enter?: boolean;
  /** Animate the FRAME in place within the scene — independent of (and
   *  composable with) the camera inside it. "rise" / "tilt-settle" are
   *  entrances; "float" / "drift" are ambient loops. Default "none".
   *  Pair with enter={false} when using an entrance here. */
  animate?: MotionScreenAnimate;
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
  enter = false,
  animate = "none",
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
        ...(playing && SCREEN_ANIMATE[animate]
          ? { animation: SCREEN_ANIMATE[animate]! }
          : {}),
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

export type MotionTextTemplate =
  | "title"
  | "lower-third"
  | "section-break"
  | "broadcast"
  | "ticker"
  | "stat"
  | "quote";

const TEMPLATE_DURATION: Record<MotionTextTemplate, number> = {
  title: 3800,
  "lower-third": 3200,
  "section-break": 4200,
  broadcast: 4200,
  ticker: 6000,
  stat: 4200,
  quote: 5200,
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
  /**
   * Lift the type off a busy or low-contrast backdrop (pale shader washes,
   * photos, video). `"shadow"` adds a soft contrast shadow to the glyphs;
   * `"scrim"` additionally drops a quiet radial darkening behind the text
   * block. Default "none" — flat fills don't need it.
   */
  lift?: "none" | "shadow" | "scrim";
  className?: string;
  style?: React.CSSProperties;
}

export function MotionText({
  template = "title",
  heading,
  text,
  durationMs,
  tone = "light",
  lift = "none",
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
  // Lift — contrast treatment for busy/pale backdrops. The shadow tracks
  // the tone (light type gets a dark shadow, dark type a light glow).
  const liftShadow =
    lift === "none"
      ? undefined
      : tone === "dark"
        ? "0 1px 2px rgba(255,255,255,0.55), 0 2px 24px rgba(255,255,255,0.45)"
        : "0 1px 2px rgba(0,0,0,0.35), 0 2px 28px rgba(0,0,0,0.30)";
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
        position:
          template === "lower-third" ||
          template === "broadcast" ||
          template === "ticker"
            ? "absolute"
            : "relative",
        ...(template === "lower-third"
          ? { left: "6%", bottom: "9%" }
          : template === "broadcast"
            ? { left: 0, right: 0, bottom: "6%" }
            : template === "ticker"
              ? { left: 0, right: 0, bottom: 0 }
              : template === "quote"
                ? { textAlign: "center", maxWidth: "64%" }
                : { textAlign: "center", maxWidth: "72%" }),
        color,
        textShadow: liftShadow,
        // The scrim child sits at z -1; isolating keeps it INSIDE this
        // block's stacking context (above the scene's fill layers).
        isolation: lift === "scrim" ? "isolate" : undefined,
        pointerEvents: "none",
        ...style,
      }}
    >
      {lift === "scrim" && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: "-30% -20%",
            zIndex: -1,
            pointerEvents: "none",
            background:
              tone === "dark"
                ? "radial-gradient(ellipse at center, rgba(255,255,255,0.45), transparent 70%)"
                : "radial-gradient(ellipse at center, rgba(0,0,0,0.34), transparent 70%)",
            filter: "blur(2px)",
          }}
        />
      )}
      <style>{`
        @keyframes gdsMotionFadeUp { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes gdsMotionSlideIn { from { opacity: 0; transform: translateX(-28px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes gdsMotionPush { from { opacity: 0; transform: scale(1.05) } to { opacity: 1; transform: scale(1) } }
        @keyframes gdsMotionMarquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes gdsMotionStatSlam { 0% { opacity: 0; transform: scale(2.2) } 60% { opacity: 1; transform: scale(0.96) } 80% { transform: scale(1.02) } 100% { opacity: 1; transform: scale(1) } }
        @keyframes gdsMotionQuoteMark { from { opacity: 0; transform: translateY(10px) scale(0.9) } to { opacity: 0.14; transform: translateY(0) scale(1) } }
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

      {template === "broadcast" && (
        // The TV one — a full-width band that sits OVER the screen the
        // way news graphics do. Brand-blue by default (primary token);
        // a thin lighter strap on top carries the secondary line.
        <div style={{ overflow: "hidden", ...anim("gdsMotionSlideIn", 600) }}>
          {text && (
            <div
              style={{
                display: "inline-block",
                marginLeft: "6%",
                padding: "5px 14px",
                fontSize: 12.5,
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "#fff",
                background:
                  "oklch(var(--primary, 0.45 0.18 264) / 0.85)",
              }}
            >
              {text}
            </div>
          )}
          <div
            style={{
              padding: "12px 6% 14px",
              background:
                "linear-gradient(90deg, oklch(var(--primary, 0.45 0.18 264)) 0%, oklch(var(--primary, 0.45 0.18 264) / 0.92) 70%, oklch(var(--primary, 0.45 0.18 264) / 0) 100%)",
              color: "#fff",
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.01em" }}>
              {heading}
            </span>
          </div>
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

      {template === "ticker" && (
        // The news ticker — a thin dark-glass bar pinned to the very
        // bottom; the heading is an uppercase label chip, the text scrolls
        // as a seamless marquee (the line is duplicated so -50% loops).
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            background:
              tone === "dark" ? "rgba(255,255,255,0.78)" : "rgba(15,15,17,0.62)",
            backdropFilter: "blur(10px)",
            overflow: "hidden",
            ...anim("gdsMotionFadeUp", 500),
          }}
        >
          <span
            style={{
              flex: "0 0 auto",
              display: "inline-flex",
              alignItems: "center",
              padding: "7px 14px",
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#fff",
              background: "oklch(var(--primary, 0.45 0.18 264))",
            }}
          >
            {heading}
          </span>
          {text && (
            <div
              style={{
                flex: "1 1 0%",
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                overflow: "hidden",
                maskImage:
                  "linear-gradient(90deg, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  whiteSpace: "nowrap",
                  fontSize: 13,
                  ...(animate
                    ? {
                        animation: "gdsMotionMarquee 24000ms linear infinite",
                        animationPlayState: playState,
                      }
                    : {}),
                }}
              >
                {/* Two copies = a seamless -50% loop. */}
                <span style={{ padding: "0 0 0 16px" }}>{text} · </span>
                <span style={{ padding: "0 0 0 4px" }}>{text} · </span>
              </div>
            </div>
          )}
        </div>
      )}

      {template === "stat" && (
        // The oversized statistic — the number slams in (scale 2.2 →
        // overshoot → settle), the label fades up beneath it.
        <>
          <div
            style={{
              fontSize: "clamp(48px, 16vw, 180px)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              ...anim("gdsMotionStatSlam", 800),
            }}
          >
            {heading}
          </div>
          {text && (
            <div
              style={{
                marginTop: 16,
                fontSize: "clamp(14px, 1.8vw, 20px)",
                opacity: 0.72,
                ...anim("gdsMotionFadeUp", 700, 420),
              }}
            >
              {text}
            </div>
          )}
        </>
      )}

      {template === "quote" && (
        // The editorial pull-quote — an oversized low-opacity opening
        // mark floats behind the quote; the attribution follows, staggered.
        <div style={{ position: "relative" }}>
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: "-0.45em",
              left: "-0.18em",
              fontSize: "clamp(80px, 12vw, 160px)",
              fontWeight: 800,
              lineHeight: 1,
              opacity: animate ? undefined : 0.14,
              pointerEvents: "none",
              ...anim("gdsMotionQuoteMark", 900),
            }}
          >
            &ldquo;
          </span>
          <div
            style={{
              position: "relative",
              fontSize: "clamp(22px, 3.6vw, 44px)",
              fontWeight: 600,
              letterSpacing: "-0.015em",
              lineHeight: 1.25,
              ...anim("gdsMotionFadeUp", 700),
            }}
          >
            {heading}
          </div>
          {text && (
            <div
              style={{
                marginTop: 18,
                fontSize: "clamp(13px, 1.6vw, 17px)",
                opacity: 0.65,
                ...anim("gdsMotionFadeUp", 700, 240),
              }}
            >
              &mdash; {text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MotionOverlay — the broadcast layer ────────────────────────────────
// Persistent on-screen graphics that belong to the FILM, not a scene:
// a network-bug logo, a live clock, a ticker, a video layer. Declared as
// a direct child of <Motion> (a peer of scenes); renders above every
// scene for the whole runtime, in a standard anchor zone. Ignored by the
// strip view (it's film chrome, not a scene).

export type MotionOverlayZone =
  | "top-left"
  | "top"
  | "top-right"
  | "center"
  | "bottom-left"
  | "bottom"
  | "bottom-right"
  | "lower-third";

const OVERLAY_ZONE: Record<MotionOverlayZone, React.CSSProperties> = {
  "top-left": { top: 18, left: 20 },
  top: { top: 18, left: 0, right: 0, display: "grid", placeItems: "center" },
  "top-right": { top: 18, right: 20 },
  center: { inset: 0, display: "grid", placeItems: "center" },
  "bottom-left": { bottom: 18, left: 20 },
  bottom: { bottom: 18, left: 0, right: 0, display: "grid", placeItems: "center" },
  "bottom-right": { bottom: 52, right: 20 }, // clears the transport
  "lower-third": { left: "6%", right: "6%", bottom: "8%" },
};

export interface MotionOverlayProps {
  /** Anchor zone. Default "top-right" (the classic network-bug corner). */
  zone?: MotionOverlayZone;
  /** Visible from this scene index (inclusive). Default 0 — overlays are
   *  a second TIMELINE: always-on is just the full-range case. */
  fromScene?: number;
  /** Visible through this scene index (inclusive). Default: the end. */
  toScene?: number;
  /** Re-enable pointer events for interactive overlays. Default false. */
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function MotionOverlay({
  zone = "top-right",
  fromScene: _fromScene,
  toScene: _toScene,
  interactive = false,
  className,
  style,
  children,
}: MotionOverlayProps) {
  return (
    <div
      data-gds-part="motion-overlay"
      className={cn("gds-motion-overlay", className)}
      style={{
        position: "absolute",
        zIndex: 20,
        pointerEvents: interactive ? "auto" : "none",
        ...OVERLAY_ZONE[zone],
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── MotionScene — one stage moment ─────────────────────────────────────

/** How a scene ARRIVES on the stage. Entrance-only by design — the
 *  outgoing scene cuts; the incoming one performs. (True cross-fades
 *  need both scenes mounted; that rides the seekable-clock work.) */
export type MotionSceneTransition =
  | "fade"
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right"
  | "pop"
  | "zoom"
  | "wipe-circle"
  | "none";

/** Per-transition default timing (ms) — override per scene with
 *  `transitionMs`. Also the OVERLAP window the outgoing scene stays
 *  visible underneath. */
export const SCENE_TRANSITION_DEFAULT_MS: Record<MotionSceneTransition, number> = {
  fade: 420,
  "slide-up": 520,
  "slide-down": 520,
  "slide-left": 520,
  "slide-right": 520,
  pop: 420,
  zoom: 650,
  "wipe-circle": 750,
  none: 0,
};

function sceneTransitionAnim(
  t: MotionSceneTransition,
  ms: number,
): string | null {
  switch (t) {
    case "fade":
      return `gdsMotionSceneIn ${ms}ms ease both`;
    case "slide-up":
      return `gdsMotionSceneUp ${ms}ms cubic-bezier(0.22, 1, 0.36, 1) both`;
    case "slide-down":
      return `gdsMotionSceneDown ${ms}ms cubic-bezier(0.22, 1, 0.36, 1) both`;
    case "slide-left":
      return `gdsMotionSceneLeft ${ms}ms cubic-bezier(0.22, 1, 0.36, 1) both`;
    case "slide-right":
      return `gdsMotionSceneRight ${ms}ms cubic-bezier(0.22, 1, 0.36, 1) both`;
    case "pop":
      return `gdsMotionScenePop ${ms}ms cubic-bezier(0.34, 1.56, 0.64, 1) both`;
    case "zoom":
      return `gdsMotionSceneZoom ${ms}ms cubic-bezier(0.22, 1, 0.36, 1) both`;
    case "wipe-circle":
      return `gdsMotionSceneWipe ${ms}ms cubic-bezier(0.65, 0, 0.35, 1) both`;
    case "none":
      return null;
  }
}

const SCENE_TRANSITION_KEYFRAMES = `
@keyframes gdsMotionSceneIn    { from { opacity: 0 } to { opacity: 1 } }
@keyframes gdsMotionSceneUp    { from { opacity: 0; transform: translateY(7%) }  to { opacity: 1; transform: translateY(0) } }
@keyframes gdsMotionSceneDown  { from { opacity: 0; transform: translateY(-7%) } to { opacity: 1; transform: translateY(0) } }
@keyframes gdsMotionSceneLeft  { from { opacity: 0; transform: translateX(7%) }  to { opacity: 1; transform: translateX(0) } }
@keyframes gdsMotionSceneRight { from { opacity: 0; transform: translateX(-7%) } to { opacity: 1; transform: translateX(0) } }
@keyframes gdsMotionScenePop   { from { opacity: 0; transform: scale(0.9) }      to { opacity: 1; transform: scale(1) } }
@keyframes gdsMotionSceneZoom  { from { opacity: 0; transform: scale(1.1) }      to { opacity: 1; transform: scale(1) } }
@keyframes gdsMotionSceneWipe  { from { clip-path: circle(0% at 50% 50%) }       to { clip-path: circle(141% at 50% 50%) } }
@keyframes gdsMotionScreenRise  { from { opacity: 0; transform: translateY(7%) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
@keyframes gdsMotionScreenFloat { from { transform: translateY(-1.2%) } to { transform: translateY(1.2%) } }
@keyframes gdsMotionScreenTilt  { from { transform: perspective(1100px) rotateX(12deg) rotateY(-16deg) } to { transform: perspective(1100px) rotateX(0deg) rotateY(0deg) } }
@keyframes gdsMotionScreenDrift { from { transform: translateX(-1.5%) } to { transform: translateX(1.5%) } }
`;

/** In-place frame animation for MotionScreen — the screen performs
 *  WITHIN the scene (independent of the camera inside it, composable
 *  with it). "rise" and "tilt-settle" are entrances; "float" and
 *  "drift" are ambient loops. */
export type MotionScreenAnimate =
  | "rise"
  | "float"
  | "tilt-settle"
  | "drift"
  | "none";

const SCREEN_ANIMATE: Record<MotionScreenAnimate, string | null> = {
  rise: "gdsMotionScreenRise 900ms cubic-bezier(0.22, 1, 0.36, 1) both",
  float: "gdsMotionScreenFloat 6s ease-in-out infinite alternate",
  "tilt-settle": "gdsMotionScreenTilt 1800ms cubic-bezier(0.22, 1, 0.36, 1) both",
  drift: "gdsMotionScreenDrift 9s ease-in-out infinite alternate",
  none: null,
};

export interface MotionSceneProps {
  /** Shown in the strip view + read by the timeline dock. */
  label?: string;
  /** Minimum runtime (ms); the whole clock when nothing inside keeps
   *  time. Default 4000 for untimed scenes. */
  durationMs?: number;
  /** Scene background painted over the shared stage for this moment only
   *  (a CSS background — the white title card, a brand fill). */
  fill?: string;
  /** How the scene arrives: fade · slide-up/down/left/right · pop ·
   *  zoom · wipe-circle (a mask wipe) · none. Default "fade". The
   *  OUTGOING scene stays visible underneath for the transition window,
   *  so slides/wipes reveal it rather than the stage. */
  transition?: MotionSceneTransition;
  /** Transition timing override (ms). Defaults per transition — see
   *  SCENE_TRANSITION_DEFAULT_MS. */
  transitionMs?: number;
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
  transitionMs,
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
  // `durationMs`. AND: an EXPLICIT `durationMs` is a MINIMUM runtime —
  // a scene with a 3s caption and `durationMs={16000}` runs the full 16s
  // (a lower-third finishing early must not cut a long visual mid-flight).
  const explicitDur = durationMs != null;
  const totalRef = React.useRef(0);
  const doneRef = React.useRef(0);
  const endedRef = React.useRef(false);
  const minDoneRef = React.useRef(!explicitDur);
  const endNow = React.useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    onSceneEnd();
  }, [onSceneEnd]);
  const endTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // Pause-aware completion: a pause landing inside the advance "breath"
  // (or arriving while children finish) must hold the cut, not lose it.
  const pausedRef = React.useRef(paused);
  pausedRef.current = paused;
  const pendingEndRef = React.useRef(false);
  const check = React.useCallback(() => {
    if (!minDoneRef.current) return; // the duration floor hasn't elapsed
    if (totalRef.current > 0 && doneRef.current < totalRef.current) return;
    if (pausedRef.current) {
      pendingEndRef.current = true; // resume re-arms the cut
      return;
    }
    // A breath after the last child settles, then cut.
    if (!endTimer.current)
      endTimer.current = setTimeout(endNow, ADVANCE_BEAT_MS);
  }, [endNow]);
  React.useEffect(() => {
    if (paused) {
      // Pausing inside the breath: cancel the scheduled cut, remember it.
      if (endTimer.current) {
        clearTimeout(endTimer.current);
        endTimer.current = null;
        pendingEndRef.current = true;
      }
      return;
    }
    if (pendingEndRef.current) {
      pendingEndRef.current = false;
      check();
    }
  }, [paused, check]);
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

  // The duration clock (pause-aware). Runs as the ONLY clock for scenes
  // with no timed children, and as the MINIMUM-runtime floor when an
  // explicit `durationMs` coexists with timed children.
  const remainRef = React.useRef(durationMs ?? UNTIMED_FALLBACK_MS);
  React.useEffect(() => {
    if (!playing) return;
    remainRef.current = durationMs ?? UNTIMED_FALLBACK_MS;
    endedRef.current = false;
    minDoneRef.current = !explicitDur;
    return () => {
      if (endTimer.current) {
        clearTimeout(endTimer.current);
        endTimer.current = null;
      }
    };
  }, [playing, durationMs, explicitDur]);
  React.useEffect(() => {
    if (!playing || paused) return;
    // Without an explicit duration, timed children own the clock.
    if (!explicitDur && totalRef.current > 0) return;
    const started = Date.now();
    const t = setTimeout(() => {
      minDoneRef.current = true;
      check();
    }, remainRef.current);
    return () => {
      clearTimeout(t);
      remainRef.current = Math.max(
        0,
        remainRef.current - (Date.now() - started),
      );
    };
  }, [playing, paused, explicitDur, check]);

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
          // Each scene is its OWN stacking context — without this, an
          // outgoing scene's internal z-indexed layers (FX reels use
          // z 1–5) interleave ABOVE the incoming scene's content during
          // the transition overlap: "artifacts of the last slide".
          isolation: "isolate",
          ...(playing
            ? (() => {
                const ms =
                  transitionMs ?? SCENE_TRANSITION_DEFAULT_MS[transition];
                const a = sceneTransitionAnim(transition, ms);
                return a ? { animation: a } : {};
              })()
            : {}),
          ...style,
        }}
      >
        <style>{SCENE_TRANSITION_KEYFRAMES}</style>
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

function isOverlayElement(
  child: React.ReactNode,
): child is React.ReactElement<MotionOverlayProps> {
  return React.isValidElement(child) && child.type === MotionOverlay;
}

function isMotionScene(
  child: React.ReactNode,
): child is React.ReactElement<MotionSceneProps> {
  // Permissive on purpose (any element that isn't film chrome is a
  // scene) — matches how the strip/play views have always treated
  // children.
  return React.isValidElement(child) && child.type !== MotionOverlay;
}

// ─── THE CLOCK — one master timeline per film ───────────────────────────
// Scene durations are computed from the element tree (camera tours, text
// templates, explicit floors), summed into a schedule, and a single
// rAF-driven `timeMs` advances through it. Scrub = set the number;
// pause = stop it; scene selection = a lookup. CSS animations inside the
// active scene are puppeted through the Web Animations API
// (getAnimations({subtree:true})) so seeking lands keyframes mid-flight
// WITHOUT rewriting any scene content. Known v1 limit: ScreenAnimator's
// JS-driven camera restarts from its first shot on an intra-scene seek.

const CAMERA_ENTER_MS = 1500;
const CAMERA_DEFAULT_HOLD = 2400;
const CAMERA_DEFAULT_TRANS = 1150;

function cameraDurationMs(props: MotionScreenProps): number {
  const shots = props.shots && props.shots.length > 0 ? props.shots : [{}];
  let total = props.enter === true ? CAMERA_ENTER_MS : 0;
  shots.forEach((s: ScreenAnimatorShot, i: number) => {
    total += (s.hold ?? CAMERA_DEFAULT_HOLD) + (i > 0 ? (s.trans ?? CAMERA_DEFAULT_TRANS) : 0);
  });
  return total;
}

/** Deep-walk a scene's children for timed content. */
function walkTimed(node: React.ReactNode, depth: number, out: number[]): void {
  if (depth > 7) return;
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === MotionScreen) {
      out.push(cameraDurationMs(child.props as MotionScreenProps));
      return;
    }
    if (child.type === MotionText) {
      const p = child.props as MotionTextProps;
      out.push(p.durationMs ?? TEMPLATE_DURATION[p.template ?? "title"]);
      return;
    }
    const inner = (child.props as { children?: React.ReactNode }).children;
    if (inner) walkTimed(inner, depth + 1, out);
  });
}

export function computeSceneDurationMs(
  scene: React.ReactElement<MotionSceneProps>,
): number {
  const timed: number[] = [];
  walkTimed(scene.props.children, 0, timed);
  const fromChildren = timed.length > 0 ? Math.max(...timed) : 0;
  const floor = scene.props.durationMs ?? 0;
  const base =
    Math.max(fromChildren, floor) ||
    (scene.props.durationMs ?? UNTIMED_FALLBACK_MS);
  return base + ADVANCE_BEAT_MS;
}

/** Sync every CSS animation inside `host` to `offsetMs` (and pause them
 *  when `hold`). The WAAPI puppet that makes arbitrary scene content
 *  seekable without rewriting it. */
function syncSubtreeAnimations(
  host: Element | null,
  offsetMs: number,
  hold: boolean,
): void {
  if (!host || typeof (host as HTMLElement).getAnimations !== "function")
    return;
  try {
    for (const anim of (host as HTMLElement).getAnimations({
      subtree: true,
    })) {
      try {
        anim.currentTime = offsetMs;
        if (hold) anim.pause();
        else anim.play();
      } catch {
        // Individual animations can be in non-seekable states; skip.
      }
    }
  } catch {
    // getAnimations unsupported — seek still lands scene-accurately.
  }
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
  const kids = React.Children.toArray(children);
  const scenes = kids.filter(isMotionScene);
  const overlays = kids.filter(isOverlayElement);
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
  // Host-driven view override (the dock's Film/Arrange toggle posts
  // "set-view" over the control channel) — beats the `view` prop without
  // a source mutation. Reduced motion still forces the strip.
  const [viewOverride, setViewOverride] = React.useState<
    "play" | "strip" | null
  >(null);
  const effectiveView = viewOverride ?? view;
  // Export mode (control: {action:"export-mode", enabled}) — hides the
  // transport chrome from the recording and shows the minimal corner
  // watermark (AI-generated-content marking + brand provenance).
  const [exportMode, setExportMode] = React.useState(false);

  // ── THE CLOCK ──
  // The schedule: per-scene durations computed from the element tree,
  // cumulative starts, the film's total.
  const schedule = React.useMemo(() => {
    const durations = scenes.map((s) =>
      computeSceneDurationMs(s as React.ReactElement<MotionSceneProps>),
    );
    const starts: number[] = [];
    let t = 0;
    for (const d of durations) {
      starts.push(t);
      t += d;
    }
    return { durations, starts, totalMs: Math.max(t, 1) };
  }, [scenes]);

  const timeRef = React.useRef(0);
  const filmRef = React.useRef<HTMLDivElement>(null);
  const idxRef = React.useRef(0);
  idxRef.current = idx;

  const sceneAtTime = React.useCallback(
    (ms: number) => {
      const { starts, durations } = schedule;
      for (let i = starts.length - 1; i >= 0; i--) {
        if (ms >= starts[i]) return Math.min(i, starts.length - 1);
      }
      return 0;
      void durations;
    },
    [schedule],
  );

  /** The active scene's DOM node (outgoing overlay renders first, so
   *  the active scene is always the LAST motion-scene in the film). */
  const activeSceneEl = React.useCallback((): Element | null => {
    const list = filmRef.current?.querySelectorAll(
      '[data-gds-part="motion-scene"]',
    );
    return list && list.length > 0 ? list[list.length - 1] : null;
  }, []);

  /** Set the master time. The single entry point for scrub, scene
   *  jumps, restarts, and restore — playback state is untouched.
   *  FAST PATH: a seek within the current scene skips React entirely
   *  (no remount) and just retargets the live animations — this is what
   *  makes drag-scrubbing smooth. */
  const seekMs = React.useCallback(
    (ms: number, opts?: { resume?: boolean }) => {
      const t = Math.max(0, Math.min(ms, schedule.totalMs - 1));
      timeRef.current = t;
      setDone(false);
      if (opts?.resume) setPaused(false);
      const fastTarget = sceneAtTime(t);
      if (fastTarget === idxRef.current && !opts?.resume) {
        const offset = t - schedule.starts[fastTarget];
        syncSubtreeAnimations(
          activeSceneEl(),
          offset,
          pausedNowRef.current,
        );
        try {
          window.parent?.postMessage(
            {
              type: "grade:motion-time",
              timeMs: Math.round(t),
              totalMs: schedule.totalMs,
              durations: schedule.durations,
            },
            "*",
          );
        } catch {
          /* no host */
        }
        return;
      }
      // Echo the new position immediately — the dock's playhead must
      // track a paused scrub, not just the playing tick loop.
      try {
        window.parent?.postMessage(
          {
            type: "grade:motion-time",
            timeMs: Math.round(t),
            totalMs: schedule.totalMs,
            durations: schedule.durations,
          },
          "*",
        );
      } catch {
        /* no host */
      }
      // SLOW PATH (scene boundary crossed): remount the scene so its
      // animations restart at zero, then puppet them to the in-scene
      // offset on the next frames (WAAPI).
      const target = fastTarget;
      setIdx(target);
      setRunId((r) => r + 1);
      const offset = t - schedule.starts[target];
      const hold = !(opts?.resume) && pausedNowRef.current;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          syncSubtreeAnimations(activeSceneEl(), offset, hold);
        }),
      );
    },
    [schedule, sceneAtTime, activeSceneEl],
  );
  const pausedNowRef = React.useRef(paused);
  pausedNowRef.current = paused;

  // The tick: one rAF loop advances timeMs while playing; scene index is
  // a lookup; the end is a comparison. Broadcasts ride the same loop
  // (throttled) so the dock's playhead is the SAME number.
  // The tick reads the schedule through a REF, never a closure. Under
  // heavy load (export recording, shader compiles) effect teardown can
  // lag — a tick whose closure held a STALE schedule (e.g. totalMs from a
  // partial render) would clamp/end the clock at that old total while the
  // fresh loop pushed forward: the clock sawed back and forth and the film
  // sat "stuck" flickering at a boundary. The ref makes every loop read
  // the CURRENT schedule on every frame, so a stale loop is harmless.
  const scheduleRef = React.useRef(schedule);
  scheduleRef.current = schedule;
  React.useEffect(() => {
    if (paused || done || reduced || effectiveView !== "play" || count === 0)
      return;
    let raf = 0;
    let last = performance.now();
    let lastPost = 0;
    const tick = (now: number) => {
      const sched = scheduleRef.current;
      // Clamp dt: a blocked main thread (shader compile, encoder) must
      // not teleport the clock — the film loses a beat, not its place.
      const dt = Math.min(now - last, 120);
      last = now;
      timeRef.current += dt;
      if (timeRef.current >= sched.totalMs) {
        if (loop) {
          timeRef.current = 0;
          setIdx(0);
          setRunId((r) => r + 1);
        } else {
          timeRef.current = sched.totalMs;
          setDone(true);
          setPaused(true);
          return;
        }
      } else {
        const { starts } = sched;
        let target = 0;
        for (let i = starts.length - 1; i >= 0; i--) {
          if (timeRef.current >= starts[i]) {
            target = i;
            break;
          }
        }
        if (target !== idxRef.current) {
          setIdx(target);
          setRunId((r) => r + 1);
        }
      }
      if (now - lastPost > 150) {
        lastPost = now;
        try {
          window.parent?.postMessage(
            {
              type: "grade:motion-time",
              timeMs: Math.round(timeRef.current),
              totalMs: sched.totalMs,
              durations: sched.durations,
            },
            "*",
          );
        } catch {
          /* no host */
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, done, reduced, effectiveView, count, loop]);

  // Pause/resume freezes EVERYTHING in the active scene — including
  // author-written CSS keyframes — via the WAAPI puppet.
  React.useEffect(() => {
    if (reduced || effectiveView !== "play") return;
    const scenesInDom = filmRef.current?.querySelectorAll(
      '[data-gds-part="motion-scene"]',
    );
    const activeEl = scenesInDom?.[scenesInDom.length - 1] ?? null;
    if (!activeEl || typeof (activeEl as HTMLElement).getAnimations !== "function")
      return;
    try {
      for (const anim of (activeEl as HTMLElement).getAnimations({ subtree: true })) {
        try {
          if (paused) anim.pause();
          else anim.play();
        } catch {
          /* skip */
        }
      }
    } catch {
      /* unsupported */
    }
  }, [paused, reduced, effectiveView, idx, runId]);
  // ── Transition overlap ──
  // The OUTGOING scene stays mounted as a static layer UNDER the incoming
  // one for the incoming scene's transition window — so a slide reveals
  // the previous scene, a wipe cuts through it, a fade dissolves over it,
  // instead of flashing the bare stage. Cleared on a timer.
  const [outgoing, setOutgoing] = React.useState<number | null>(null);
  const prevIdxRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    const prev = prevIdxRef.current;
    prevIdxRef.current = idx;
    if (prev === null || prev === idx) return;
    const incoming = scenes[idx];
    if (!incoming) return;
    const t = (incoming.props.transition ?? "fade") as MotionSceneTransition;
    const overlapMs =
      incoming.props.transitionMs ?? SCENE_TRANSITION_DEFAULT_MS[t] ?? 0;
    // No overlap while PAUSED (i.e. while scrubbing): boundary crossings
    // should be clean cuts, not flashes of the previous scene.
    if (overlapMs <= 0 || pausedNowRef.current) {
      setOutgoing(null);
      return;
    }
    setOutgoing(prev);
    const timer = setTimeout(() => setOutgoing(null), overlapMs + 60);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, runId]);
  // Transport jumps: a dot/restart is "play from the start of scene i" —
  // a seek that also resumes.
  const goTo = React.useCallback(
    (i: number) => {
      seekMs(schedule.starts[Math.max(0, Math.min(i, count - 1))] ?? 0, {
        resume: true,
      });
    },
    [seekMs, schedule, count],
  );
  // Skip (used by the scene error boundary): jump past the broken scene.
  const advance = React.useCallback(() => {
    const next = idxRef.current + 1;
    if (next < count) {
      seekMs(schedule.starts[next], { resume: true });
    } else if (loop && count > 0) {
      seekMs(0, { resume: true });
    } else {
      setDone(true);
      setPaused(true);
    }
  }, [count, loop, seekMs, schedule]);

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
        | {
            type?: string;
            action?: string;
            scene?: number;
            ms?: number;
            view?: string;
          }
        | null;
      if (!d || d.type !== "grade:motion-control") return;
      if (d.action === "set-view") {
        if (d.view === "play" || d.view === "strip") setViewOverride(d.view);
        return;
      }
      if (d.action === "export-mode") {
        setExportMode(
          !!(d as { enabled?: boolean }).enabled,
        );
        return;
      }
      if (d.action === "seek" && typeof d.ms === "number") {
        // THE scrub: set the master clock. Playback state untouched —
        // a paused film stays paused (frozen mid-frame via WAAPI).
        setViewOverride("play");
        seekMs(d.ms);
        return;
      }
      if (typeof d.scene === "number") {
        // Editor scene-jump: seek to the scene's start, keep pause state.
        setViewOverride("play");
        seekMs(
          schedule.starts[
            Math.max(0, Math.min(count - 1, Math.round(d.scene)))
          ] ?? 0,
        );
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
  }, [reduced, goTo, count, seekMs, schedule]);
  // ── DETERMINISTIC RENDER KERNEL (Playwright export, D7 v2) ──
  //
  // Real-time capture can never be smooth — a slow shader frame drops a
  // video frame. The render pipeline instead STEPS the film: seek to an
  // exact frame time, wait for it to fully paint (however long that
  // takes), screenshot, advance. Output is locked to a perfect fps no
  // matter how heavy the scene.
  //
  // We expose that contract on `window.__gradeMotion` so a headless
  // driver (scripts/render-motion.mjs) can: read meta (totalMs), then
  // call `renderFrame(ms)` which seeks + resolves once the frame is
  // committed (double-rAF = layout + paint flushed). The film must be
  // paused for this — the kernel forces it.
  const seekMsRef = React.useRef(seekMs);
  seekMsRef.current = seekMs;
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as {
      __gradeMotion?: {
        ready: boolean;
        meta: () => { totalMs: number; durations: number[]; count: number };
        renderFrame: (ms: number) => Promise<void>;
        enterRenderMode: () => void;
      };
    };
    w.__gradeMotion = {
      ready: true,
      meta: () => ({
        totalMs: scheduleRef.current.totalMs,
        durations: scheduleRef.current.durations,
        count,
      }),
      enterRenderMode: () => {
        // Freeze the live clock and hide transport; show the watermark
        // exactly as the recorded film should look.
        setPaused(true);
        setViewOverride("play");
        setExportMode(true);
      },
      renderFrame: (ms: number) =>
        new Promise<void>((resolve) => {
          setPaused(true);
          // seekMs FAST-PATHs within a scene and remounts at boundaries;
          // either way the WAAPI puppet lands the exact offset. Wait two
          // frames so React commit + browser paint are flushed before the
          // driver screenshots.
          seekMsRef.current(Math.max(0, ms));
          requestAnimationFrame(() =>
            requestAnimationFrame(() => resolve()),
          );
        }),
    };
    return () => {
      delete (window as unknown as { __gradeMotion?: unknown }).__gradeMotion;
    };
  }, [count]);

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
      ref={filmRef}
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

      {/* The outgoing scene, frozen UNDER the incoming one during the
          transition window (active=false → no clocks, posters not
          players). Rendered first in DOM = beneath. */}
      {outgoing !== null && outgoing !== idx && scenes[outgoing] && (
        <SceneBoundary key={`out:${outgoing}`} label={scenes[outgoing].props.label}>
          <MotionSceneImpl
            {...scenes[outgoing].props}
            transition="none"
            internal={{
              active: false,
              paused: true,
              mode: "play",
              onSceneEnd: () => {},
            }}
          />
        </SceneBoundary>
      )}

      {active && (
        <SceneBoundary
          key={`${idx}:${runId}`}
          label={active.props.label}
          onSkip={count > 1 ? advance : undefined}
        >
          <MotionSceneImpl
            {...active.props}
            // THE CLOCK owns scene advancement now — the per-scene
            // completion registry still runs (it's harmless and keeps
            // standalone scenes working) but its end signal is inert
            // inside a film.
            internal={{ active: true, paused, mode: "play", onSceneEnd: () => {} }}
          />
        </SceneBoundary>
      )}

      {/* The broadcast layer — film-level overlays (network bug, live
          clock, ticker, persistent video). A second timeline: each
          overlay shows for its fromScene..toScene range (default: the
          whole film). Rendered above scenes, below the transport. */}
      {overlays.filter((o) => {
        const from = o.props.fromScene ?? 0;
        const to = o.props.toScene ?? Infinity;
        return idx >= from && idx <= to;
      })}

      {/* Export watermark — the minimal corner mark: brand provenance +
          honest AI-generated-content marking on every exported video.
          Bottom-left (the transport owns bottom-right). Default artwork
          is the Grade mark; the branding profile swaps it later. */}
      {exportMode && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 14,
            bottom: 14,
            zIndex: 30,
            width: 16,
            height: 16,
            opacity: 0.55,
            color: "#fff",
            mixBlendMode: "difference",
            pointerEvents: "none",
          }}
        >
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M28 0L32 4V10L26 4H6L4 6V26L6 28H16L26 18V24L18 32H4L0 28V4L4 0H28ZM32 32H28V18H16V14H32V32Z"
              fill="currentColor"
            />
          </svg>
        </div>
      )}

      {/* Transport — COLLAPSED to a lone play/pause button; restart + the
          scene dots reveal on hover/focus of the pill (they eat stage
          space and a film should look like a film at rest). Hidden in
          export mode so chrome never lands in the recording. */}
      {controls && count > 0 && !exportMode && (
        <div
          role="group"
          aria-label="Motion playback controls"
          className="gds-motion-transport"
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
          <style>{`
            .gds-motion-transport [data-gds-transport-extras] {
              display: flex; align-items: center; gap: 4px;
              max-width: 0; opacity: 0; overflow: hidden;
              transition: max-width 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease;
            }
            .gds-motion-transport:hover [data-gds-transport-extras],
            .gds-motion-transport:focus-within [data-gds-transport-extras] {
              max-width: 360px; opacity: 1;
            }
          `}</style>
          <button
            type="button"
            onClick={() => (done ? goTo(0) : setPaused((p) => !p))}
            aria-label={done ? "Replay" : paused ? "Play" : "Pause"}
            style={btn}
          >
            {done ? <RestartIcon /> : paused ? <PlayIcon /> : <PauseIcon />}
          </button>
          <div data-gds-transport-extras>
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
                  tabIndex={-1}
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
        // Letterbox: TRANSPARENT in the editor (the bars blend into the
        // host surface and the film just floats centered — visible black
        // bars read as a defect); true black only in export mode, where
        // bars are video-correct.
        background: ratio ? (exportMode ? "#000" : "transparent") : stage,
        ...style,
      }}
    >
      {ratio ? <FitBox ratio={ratio}>{film}</FitBox> : film}
    </div>
  );
}
