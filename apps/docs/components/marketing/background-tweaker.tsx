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
import {
  DEFAULT_TUNING,
  getBackgroundTuning,
  setBackgroundTuning,
  type BackgroundTuning,
} from "@/components/marketing/marketing-background";

const KNOBS: Array<{
  key: keyof BackgroundTuning;
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: "speed", label: "Drift", min: 0, max: 0.15, step: 0.005 },
  { key: "scale", label: "Zoom", min: 0.8, max: 3.5, step: 0.05 },
  { key: "falloff", label: "Touch size", min: 0.5, max: 10, step: 0.25 },
  { key: "push", label: "Push", min: 0, max: 0.4, step: 0.01 },
  { key: "sheen", label: "Sheen", min: 0, max: 1, step: 0.05 },
  { key: "lift", label: "Accent lift", min: 0, max: 0.3, step: 0.01 },
  { key: "vein", label: "Veins", min: 0, max: 0.5, step: 0.01 },
  { key: "halftone", label: "Halftone", min: 0, max: 1, step: 0.05 },
  { key: "dotSize", label: "Dot size", min: 3, max: 24, step: 0.5 },
];

export function BackgroundTweaker({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false);
  const reducedMotion = useReducedMotion();
  const [values, setValues] = React.useState<BackgroundTuning>(() =>
    getBackgroundTuning(),
  );
  const [copied, setCopied] = React.useState(false);

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

  // Knob rows cascade in as the panel opens — 25ms apart, each on a
  // quick spring. Disabled under reduced motion (rows just appear).
  const listVariants = {
    hidden: {},
    show: reducedMotion
      ? {}
      : { transition: { staggerChildren: 0.025, delayChildren: 0.04 } },
  };
  const rowVariants = reducedMotion
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: -6 },
        show: {
          opacity: 1,
          y: 0,
          transition: { type: "spring" as const, stiffness: 600, damping: 34 },
        },
      };

  return (
    <div className={cn("fixed top-4 md:top-6 right-4 md:right-6 z-50", className)}>
      {/* No mode="wait": exit and enter run CONCURRENTLY (a true
          crossfade), so switching feels instant instead of paying both
          animations sequentially. Both children anchor absolute to the
          same corner so they overlap during the handoff. */}
      <AnimatePresence initial={false}>
      {!open ? (
        <motion.div key="trigger" {...triggerMotion} className="absolute top-0 right-0">
          <Button
            variant="ghost"
            size="icon"
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

          <motion.div
            className="flex flex-col gap-3"
            variants={listVariants}
            initial="hidden"
            animate="show"
          >
            {KNOBS.map((knob) => (
              <motion.div key={knob.key} variants={rowVariants}>
                <span className="flex items-center justify-between leading-none mb-1">
                  <Label
                    htmlFor={`bg-knob-${knob.key}`}
                    size="xs"
                    className="text-foreground/80"
                  >
                    {knob.label}
                  </Label>
                  <span className="font-mono text-xs text-muted-foreground">
                    {values[knob.key].toFixed(3)}
                  </span>
                </span>
                <input
                  id={`bg-knob-${knob.key}`}
                  type="range"
                  min={knob.min}
                  max={knob.max}
                  step={knob.step}
                  value={values[knob.key]}
                  onChange={(e) => update(knob.key, Number(e.target.value))}
                  className="block w-full h-1.5 cursor-pointer appearance-none rounded-full bg-border accent-[oklch(var(--accent))]"
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
