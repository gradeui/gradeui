"use client";

/**
 * BackgroundTweaker — the public knobs for the homepage shader.
 *
 * Lives top-right as a collapsed Sliders button; expands into a small
 * glass card of range inputs. Writes straight into the background's
 * tuning store (read by the render loop every frame), so dragging a
 * slider re-tunes the scene live with zero React re-renders of the
 * canvas.
 *
 * Deliberately LIVE ON THE SITE, not dev-gated: letting visitors bend
 * the scene is the Grade pitch in miniature — everything is a knob.
 */

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { SlidersHorizontal, X, RotateCcw, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ShaderControls } from "@/components/ui/shader-controls";
import type { ControlSpec, DemoState } from "@/lib/three/schema";
import {
  DEFAULT_TUNING,
  getBackgroundTuning,
  setBackgroundTuning,
  type BackgroundTuning,
} from "@/components/marketing/marketing-background";

// The knobs as a Grade control contract — rendered by the same ShaderControls
// component as the shader showcase and the docs, so the homepage tweaker reads
// identically. (Was bespoke native range inputs.)
const TWEAK_CONTROLS: ControlSpec[] = [
  { type: "slider", key: "speed", label: "Drift", min: 0, max: 0.15, step: 0.005, default: DEFAULT_TUNING.speed },
  { type: "slider", key: "scale", label: "Zoom", min: 0.8, max: 3.5, step: 0.05, default: DEFAULT_TUNING.scale },
  { type: "slider", key: "falloff", label: "Touch size", min: 0.5, max: 10, step: 0.25, default: DEFAULT_TUNING.falloff },
  { type: "slider", key: "push", label: "Push", min: 0, max: 0.4, step: 0.01, default: DEFAULT_TUNING.push },
  { type: "slider", key: "sheen", label: "Sheen", min: 0, max: 1, step: 0.05, default: DEFAULT_TUNING.sheen },
  { type: "slider", key: "lift", label: "Accent lift", min: 0, max: 0.3, step: 0.01, default: DEFAULT_TUNING.lift },
  { type: "slider", key: "vein", label: "Veins", min: 0, max: 0.5, step: 0.01, default: DEFAULT_TUNING.vein },
  { type: "slider", key: "halftone", label: "Halftone", min: 0, max: 1, step: 0.05, default: DEFAULT_TUNING.halftone },
  { type: "slider", key: "dotSize", label: "Dot size", min: 3, max: 24, step: 0.5, default: DEFAULT_TUNING.dotSize },
];

export function BackgroundTweaker({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false);
  const reducedMotion = useReducedMotion();
  const [values, setValues] = React.useState<BackgroundTuning>(() =>
    getBackgroundTuning(),
  );
  const [copied, setCopied] = React.useState(false);

  // Auto-dismiss on scroll, with tolerance: anchor the scroll position
  // when the panel opens; a deliberate scroll past the threshold closes
  // it (playing the exit spring). Small movements — trackpad drift,
  // rubber-banding, nudging the page a few px — don't count.
  React.useEffect(() => {
    if (!open) return;
    const anchor = window.scrollY;
    const TOLERANCE_PX = 120;
    const onScroll = () => {
      if (Math.abs(window.scrollY - anchor) > TOLERANCE_PX) setOpen(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

  // Disappear when there's nothing left to influence: the whole widget
  // (trigger included) fades out once the shader canvas scrolls out of
  // view, and returns when it's back. A panel for an off-screen scene
  // is just clutter.
  const [hasTarget, setHasTarget] = React.useState(true);
  React.useEffect(() => {
    const canvas = document.getElementById("gds-home-canvas");
    if (!canvas) {
      setHasTarget(false);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = entry?.isIntersecting ?? false;
        setHasTarget(visible);
        if (!visible) setOpen(false);
      },
      { threshold: 0.05 },
    );
    io.observe(canvas);
    return () => io.disconnect();
  }, []);

  const update = (key: keyof BackgroundTuning, value: number) => {
    setValues((v) => ({ ...v, [key]: value }));
    setBackgroundTuning({ [key]: value });
  };

  const reset = () => {
    setValues({ ...DEFAULT_TUNING });
    setBackgroundTuning({ ...DEFAULT_TUNING });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(values, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  // Subtle open/close motion: the panel springs out of the top-right
  // corner (where the trigger sits) and the trigger crossfades. Under
  // prefers-reduced-motion both collapse to a plain fade.
  const panelMotion = reducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15 },
      }
    : {
        initial: { opacity: 0, scale: 0.92, y: -4 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.92, y: -4 },
        transition: { type: "spring" as const, stiffness: 500, damping: 34 },
      };
  const triggerMotion = reducedMotion
    ? panelMotion
    : {
        initial: { opacity: 0, scale: 0.85 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.85 },
        transition: { type: "spring" as const, stiffness: 550, damping: 30 },
      };

  return (
    <div
      className={cn(
        "fixed top-4 md:top-6 right-4 md:right-6 z-50 transition-opacity duration-300",
        hasTarget ? "opacity-100" : "opacity-0 pointer-events-none",
        className,
      )}
      aria-hidden={hasTarget ? undefined : true}
    >
      {/* No mode="wait": exit and enter run CONCURRENTLY (a true
          crossfade), so switching feels instant instead of paying both
          animations sequentially. Both children anchor absolute to the
          same corner so they overlap during the handoff. */}
      <AnimatePresence initial={false}>
      {!open ? (
        <motion.div key="trigger" {...triggerMotion} className="absolute top-0 right-0">
          <Button
            variant="ghost"
            iconOnly
            onClick={() => setOpen(true)}
            aria-label="Tune the background"
            className="rounded-full border border-border/60 bg-background/60 backdrop-blur-xl shadow-[var(--gds-shadow-lg)]"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </motion.div>
      ) : (
        <motion.div
          key="panel"
          {...panelMotion}
          style={{ transformOrigin: "top right" }}
          className="absolute top-0 right-0 w-64 max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain rounded-[var(--gds-radius-xl)] border border-border/60 bg-background/70 backdrop-blur-xl shadow-[var(--gds-shadow-lg)] p-4">
          <div className="flex items-center justify-between mb-3">
            <Label size="xs" className="text-muted-foreground">Background Shader</Label>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="2xs"
                onClick={copy}
                aria-label="Copy values"
                className="w-6 px-0"
              >
                {copied ? <Check /> : <Copy />}
              </Button>
              <Button
                variant="ghost"
                size="2xs"
                onClick={reset}
                aria-label="Reset to defaults"
                className="w-6 px-0"
              >
                <RotateCcw />
              </Button>
              <Button
                variant="ghost"
                size="2xs"
                onClick={() => setOpen(false)}
                aria-label="Close tweaker"
                className="w-6 px-0"
              >
                <X />
              </Button>
            </div>
          </div>

          <ShaderControls
            controls={TWEAK_CONTROLS}
            state={values as unknown as DemoState}
            labelPosition="above"
            format="percent"
            onChange={(k, v) =>
              update(k as keyof BackgroundTuning, Number(v))
            }
          />
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
