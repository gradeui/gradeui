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
import { SlidersHorizontal, X, RotateCcw, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  { key: "grain", label: "Grain", min: 0, max: 0.15, step: 0.005 },
];

export function BackgroundTweaker({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false);
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

  return (
    <div className={cn("fixed top-4 md:top-6 right-4 md:right-6 z-50", className)}>
      {!open ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label="Tune the background"
          className="rounded-full border border-border/60 bg-background/60 backdrop-blur-xl shadow-[var(--gds-shadow-lg)]"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      ) : (
        <div className="w-64 rounded-[var(--gds-radius-xl)] border border-border/60 bg-background/70 backdrop-blur-xl shadow-[var(--gds-shadow-lg)] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Background
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={copy}
                aria-label="Copy values"
                className="h-7 w-7"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={reset}
                aria-label="Reset to defaults"
                className="h-7 w-7"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Close tweaker"
                className="h-7 w-7"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {KNOBS.map((knob) => (
              <label key={knob.key} className="block">
                <span className="flex items-center justify-between text-xs mb-1">
                  <span className="text-foreground/80">{knob.label}</span>
                  <span className="font-mono text-muted-foreground">
                    {values[knob.key].toFixed(3)}
                  </span>
                </span>
                <input
                  type="range"
                  min={knob.min}
                  max={knob.max}
                  step={knob.step}
                  value={values[knob.key]}
                  onChange={(e) => update(knob.key, Number(e.target.value))}
                  className="w-full h-1.5 cursor-pointer appearance-none rounded-full bg-border accent-[oklch(var(--accent))]"
                  aria-label={knob.label}
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
