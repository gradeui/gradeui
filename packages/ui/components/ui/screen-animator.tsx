"use client";

import * as React from "react";
import { useReducedMotion } from "../../lib/motion";
import { cn } from "@/lib/utils";

/**
 * ScreenAnimator — wrap any content in a directed camera.
 *
 * Give it a list of `shots` (a zoom + focal point + dwell) and it tours them:
 * flies in from offscreen, eases between shots, settles back to the start,
 * exits, and loops, with a focus spotlight, a synthetic cursor, captions, and
 * a play/pause/restart transport. The content stays live and interactive
 * underneath; the camera just directs the eye. It works around ANY children,
 * a dashboard, an app shell, a single card.
 *
 * It's the reusable form of the camera in the embed (`useCameraTimeline` /
 * `ZoomPan`) and the `camera-tour` scaffold — see STUDIO-DIRECTOR.md. Honours
 * reduced motion (settles on the starter frame, no movement).
 */

export interface ScreenAnimatorShot {
  /** Magnification (1 = fit). >1 pushes in. */
  zoom?: number;
  /** Focal point as fractions of the content (0..1). Defaults to centre. */
  cx?: number;
  cy?: number;
  /** Milliseconds to dwell on this shot. */
  hold?: number;
  /** Milliseconds to glide INTO this shot from the previous one. */
  trans?: number;
  /** Caption shown while on this shot. */
  label?: string;
}

export interface ScreenAnimatorProps {
  /** The shot list. Omit (or one shot) for a static framed view. */
  shots?: ScreenAnimatorShot[];
  /** Start playing on mount. Default true. */
  autoplay?: boolean;
  /** Loop the tour (fly in → shots → back to start → exit → repeat). Default true. */
  loop?: boolean;
  /** Show the play / pause / restart transport. Default true. */
  controls?: boolean;
  /** Dim the edges when pushed in (focus vignette). Default true. */
  spotlight?: boolean;
  /** Render the synthetic cursor pulse on detail shots. Default true. */
  cursor?: boolean;
  /** Fly in from offscreen on start (and exit on loop). Default true. */
  enter?: boolean;
  /** Background of the stage the content sits on while it's small (fly in/out).
   *  A CSS background string. Default a dark cinematic stage. */
  stage?: string;
  /** A live backdrop rendered BEHIND the content, filling the stage — an
   *  image, a gradient, or a `<ThreeScene>` shader. Shows around the screen
   *  while it's small (fly in/out) and behind any padding. */
  backdrop?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const TRANS_MS = 1150;
const ENTER_MS = 1500;
const ENTER_TRANSFORM = "translate(101%, 95%) scale(0.18)";
const EXIT_TRANSFORM = "translate(122%, 36%) scale(0.2)";
const DEFAULT_STAGE = "radial-gradient(circle at 50% 38%, #1b1b22, #0b0b0e)";
const SETTLE = "cubic-bezier(0.34, 1.16, 0.64, 1)";
const PUSH = "cubic-bezier(0.65, 0, 0.35, 1)";

interface Frame {
  transform: string;
  zoom: number;
  label: string | null;
  opacity: number;
  hold: number;
  trans: number;
}

function shotToFrame(s: ScreenAnimatorShot, trans: number): Frame {
  const zoom = s.zoom ?? 1;
  const cx = s.cx ?? 0.5;
  const cy = s.cy ?? 0.5;
  return {
    transform: `translate(${(0.5 - cx * zoom) * 100}%, ${(0.5 - cy * zoom) * 100}%) scale(${zoom})`,
    zoom,
    label: s.label ?? null,
    opacity: 1,
    hold: s.hold ?? 2400,
    trans,
  };
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

export function ScreenAnimator({
  shots,
  autoplay = true,
  loop = true,
  controls = true,
  spotlight = true,
  cursor = true,
  enter = true,
  stage = DEFAULT_STAGE,
  backdrop,
  className,
  style,
  children,
}: ScreenAnimatorProps) {
  const reduced = useReducedMotion();

  // Build the full loop as explicit frames.
  const frames = React.useMemo<Frame[]>(() => {
    const list = shots && shots.length > 0 ? shots : [{ zoom: 1 }];
    const out: Frame[] = [];
    if (enter) {
      out.push({
        transform: ENTER_TRANSFORM,
        zoom: 0.18,
        label: null,
        opacity: 0,
        hold: 360,
        trans: 0,
      });
    }
    out.push(shotToFrame(list[0], enter ? ENTER_MS : 0));
    for (let k = 1; k < list.length; k++) out.push(shotToFrame(list[k], TRANS_MS));
    if (loop) {
      out.push(shotToFrame(list[0], ENTER_MS)); // back to start
      out.push({
        transform: EXIT_TRANSFORM,
        zoom: 0.2,
        label: null,
        opacity: 0,
        hold: 520,
        trans: ENTER_MS,
      });
    }
    return out;
  }, [shots, enter, loop]);

  // The starter (poster) frame is the first real shot.
  const starter = enter && frames.length > 1 ? 1 : 0;
  const [i, setI] = React.useState(autoplay ? 0 : starter);
  const [playing, setPlaying] = React.useState(autoplay);

  React.useEffect(() => {
    if (reduced || !playing || frames.length <= 1) return;
    const t = setTimeout(() => {
      setI((n) => {
        const next = n + 1;
        if (next >= frames.length) return loop ? 0 : n;
        return next;
      });
    }, frames[i].hold);
    return () => clearTimeout(t);
  }, [i, playing, reduced, frames, loop]);

  // Reduced motion holds the starter frame, no movement.
  const fi = reduced ? starter : Math.min(i, frames.length - 1);
  const f = frames[fi] ?? frames[0];
  const zoomed = f.opacity === 1 && f.zoom > 1.05;
  const transMs = reduced ? 0 : f.trans;
  const ease = f.zoom <= 1.05 ? SETTLE : PUSH;

  return (
    <div
      className={cn("gds-screen-animator", className)}
      data-gds-part="screen-animator"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: stage,
        ...style,
      }}
    >
      <style>{`
        @keyframes gdsSaPing { from { transform: scale(0.4); opacity: 0.9 } to { transform: scale(1.8); opacity: 0 } }
        @keyframes gdsSaPulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }
      `}</style>

      {/* Backdrop — a fill / image / ThreeScene behind the content. Shows
          around the screen while it's small. */}
      {backdrop && (
        <div
          aria-hidden
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          {backdrop}
        </div>
      )}

      {/* The content, transformed by the camera. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: f.transform,
          transformOrigin: "0 0",
          opacity: f.opacity,
          transition: `transform ${transMs}ms ${ease}, opacity 700ms ease`,
        }}
      >
        {children}
      </div>

      {/* Focus spotlight. */}
      {spotlight && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at 50% 50%, transparent 26%, rgba(0,0,0,0.46) 80%)",
            opacity: zoomed ? 1 : 0,
            transition: `opacity ${TRANS_MS}ms ease`,
          }}
        />
      )}

      {/* Synthetic cursor + click ripple, centred on the focal point. */}
      {cursor && (
        <div
          key={fi}
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            opacity: zoomed ? 1 : 0,
            transition: `opacity ${TRANS_MS}ms ease`,
          }}
        >
          <span
            style={{
              position: "absolute",
              left: -19,
              top: -19,
              width: 38,
              height: 38,
              borderRadius: 999,
              border: "2px solid rgba(59,130,246,0.75)",
              animation: "gdsSaPing 1100ms ease-out 0.4s 1",
            }}
          />
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 3l14 7-6 1.5L10 18 5 3z"
              fill="#fff"
              stroke="#111"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Caption. */}
      {f.label && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 22,
            transform: "translateX(-50%)",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              padding: "8px 14px",
              borderRadius: 999,
              background: "rgba(15,15,17,0.62)",
              color: "#fff",
              fontSize: 13.5,
              fontWeight: 600,
              backdropFilter: "blur(10px)",
              boxShadow: "0 6px 22px rgba(0,0,0,0.25)",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                background: "#34d399",
                animation: "gdsSaPulse 1600ms ease-in-out infinite",
              }}
            />
            {f.label}
          </span>
        </div>
      )}

      {/* Transport — it's a directed playback: play / pause / restart. */}
      {controls && frames.length > 1 && !reduced && (
        <div
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
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause" : "Play"}
            style={btn}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            type="button"
            onClick={() => {
              setI(0);
              setPlaying(true);
            }}
            aria-label="Restart"
            style={btn}
          >
            <RestartIcon />
          </button>
        </div>
      )}
    </div>
  );
}
