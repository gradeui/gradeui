"use client";

/**
 * GradientEditor — edit a multi-stop CSS gradient with token-led stops.
 *
 * A type Select (Linear / Radial / Angular) with reverse + rotate actions, a
 * live full-width preview bar (a <Swatch type="gradient">), then a "Stops"
 * list: each stop is a position %, a colour (token via <ColorPicker>, or a
 * raw colour), an opacity %, and a remove button. An add button in the Stops
 * header appends a stop.
 *
 * The CSS gradient string is computed from type + angle + stops; token stops
 * resolve to `oklch(var(--<token>))` so the preview re-voices with the theme.
 * It emits the structured `GradientValue` (NOT a string) so the value stays
 * editable and serialisable — the caller renders the string via
 * `gradientToCss(value)` (exported alongside).
 */

import * as React from "react";
import { ArrowLeftRight, RotateCw, Plus, Minus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Swatch } from "@/components/ui/swatch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type GradientType = "linear" | "radial" | "angular";

/** A single colour stop. `token` wins over `color`; `opacity` is 0–1. */
export interface GradientStop {
  /** Stable key for list rendering / edits. */
  id: string;
  /** Position along the gradient, 0–100 (%). */
  position: number;
  /** A Grade colour token NAME ("action/primary"). Takes precedence. */
  token?: string;
  /** A raw CSS colour, used when no `token`. */
  color?: string;
  /** Stop opacity, 0–1. */
  opacity: number;
}

export interface GradientValue {
  type: GradientType;
  /** Angle in degrees for linear / angular gradients. */
  angle?: number;
  /** Centre position for radial / conic gradients, e.g. "center",
   *  "25% 25%", "top left". Defaults to "center" when absent. */
  position?: string;
  stops: GradientStop[];
  /** Provenance. `"tailwind"` = parsed from a Tailwind gradient preset
   *  (locks the editor to ≤3 stops and shows a "Tailwind preset" badge);
   *  `"custom"` = user-built; `"scoped"` = inherited (future). */
  source?: "tailwind" | "custom" | "scoped";
  /** The original Tailwind class string for a parsed preset, kept so it
   *  can be re-emitted verbatim on serialise. */
  tailwindClass?: string;
  /** Colour-interpolation modifier from a v4 `/oklch` etc. suffix. */
  interpolation?: string;
}

/** Tailwind presets cap at from/via/to. */
const TAILWIND_MAX_STOPS = 3;

const TYPE_OPTIONS: { value: GradientType; label: string }[] = [
  { value: "linear", label: "Linear" },
  { value: "radial", label: "Radial" },
  { value: "angular", label: "Angular" },
];

/** Resolve a stop to a CSS colour, applying its opacity via color-mix. */
function stopColor(stop: GradientStop): string {
  const base =
    stop.token && stop.token !== "transparent"
      ? `oklch(var(--${stop.token.replace(/^--/, "")}))`
      : stop.token === "transparent"
        ? "transparent"
        : (stop.color ?? "transparent");
  if (stop.opacity >= 1) return base;
  const pct = Math.round(stop.opacity * 100);
  // color-mix lets us apply opacity to any colour form (token / oklch / hex)
  // without parsing it — fade toward transparent.
  return `color-mix(in oklab, ${base} ${pct}%, transparent)`;
}

/** Compute the CSS gradient string from a structured value. */
export function gradientToCss(value: GradientValue): string {
  const stops = [...value.stops].sort((a, b) => a.position - b.position);
  const parts = stops.map((s) => `${stopColor(s)} ${s.position}%`);
  const list = parts.join(", ");
  const angle = value.angle ?? 90;
  const pos = value.position?.trim() || "center";
  if (value.type === "radial")
    return `radial-gradient(circle at ${pos}, ${list})`;
  if (value.type === "angular")
    return `conic-gradient(from ${angle}deg at ${pos}, ${list})`;
  return `linear-gradient(${angle}deg, ${list})`;
}

let stopSeq = 0;
function newStopId(): string {
  stopSeq += 1;
  return `stop-${Date.now().toString(36)}-${stopSeq}`;
}

export interface GradientEditorProps {
  value: GradientValue;
  onChange: (value: GradientValue) => void;
  className?: string;
}

const LABEL = "text-[11px] font-medium text-muted-foreground";

export const GradientEditor = React.forwardRef<
  HTMLDivElement,
  GradientEditorProps
>(function GradientEditor({ value, onChange, className }, ref) {
  const set = (patch: Partial<GradientValue>) => onChange({ ...value, ...patch });

  // A Tailwind-preset gradient is locked to from/via/to (≤3 stops).
  const isTailwind = value.source === "tailwind";
  const atStopCap = isTailwind && value.stops.length >= TAILWIND_MAX_STOPS;

  const setStop = (id: string, patch: Partial<GradientStop>) =>
    set({
      stops: value.stops.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });

  const addStop = () => {
    if (atStopCap) return; // preset cap — from/via/to only
    set({
      stops: [
        ...value.stops,
        {
          id: newStopId(),
          position: 100,
          token: "action/primary",
          opacity: 1,
        },
      ],
    });
  };

  const removeStop = (id: string) =>
    set({ stops: value.stops.filter((s) => s.id !== id) });

  const reverse = () =>
    set({
      stops: value.stops.map((s) => ({ ...s, position: 100 - s.position })),
    });

  const rotate = () => set({ angle: ((value.angle ?? 90) + 45) % 360 });

  const css = gradientToCss(value);

  return (
    <div ref={ref} className={cn("flex flex-col gap-3", className)}>
      {/* Provenance — a parsed Tailwind preset shows a badge so the user
          knows the editor is locked to from/via/to. */}
      {isTailwind && (
        <div className="flex items-center justify-between">
          <span
            className="inline-flex items-center rounded-[4px] border border-border/60 bg-muted px-1.5 py-0.5 text-2xs font-medium text-muted-foreground"
            title={value.tailwindClass}
          >
            Tailwind preset
          </span>
          {value.interpolation && (
            <span className="text-2xs text-muted-foreground">
              /{value.interpolation}
            </span>
          )}
        </div>
      )}
      {/* Type + actions */}
      <div className="flex items-center gap-1.5">
        <Select
          value={value.type}
          onValueChange={(v) => set({ type: v as GradientType })}
        >
          <SelectTrigger size="sm" className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent size="sm">
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          iconOnly
          variant="ghost"
          onClick={reverse}
          aria-label="Reverse stops"
          title="Reverse stops"
        >
          <ArrowLeftRight />
        </Button>
        <Button
          size="sm"
          iconOnly
          variant="ghost"
          onClick={rotate}
          aria-label="Rotate gradient"
          title="Rotate gradient"
        >
          <RotateCw />
        </Button>
      </div>

      {/* Preview bar */}
      <Swatch
        type="gradient"
        gradient={css}
        shape="rounded"
        className="h-8 w-full"
      />

      {/* Stops */}
      <div className="flex items-center justify-between">
        <span className={LABEL}>Stops</span>
        <Button
          size="2xs"
          iconOnly
          variant="ghost"
          onClick={addStop}
          disabled={atStopCap}
          aria-label="Add stop"
          title={atStopCap ? "Tailwind presets are limited to 3 stops" : "Add stop"}
        >
          <Plus />
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        {value.stops.map((stop) => (
          <div key={stop.id} className="flex items-center gap-1.5">
            <Input
              size="xs"
              type="number"
              min={0}
              max={100}
              value={stop.position}
              onChange={(e) =>
                setStop(stop.id, { position: Number(e.target.value) })
              }
              endSlot="%"
              aria-label="Stop position"
              className="w-16"
            />
            <ColorPicker
              triggerVariant="inline"
              value={stop.token ?? null}
              onValueChange={(v) =>
                setStop(stop.id, { token: v ?? undefined, color: undefined })
              }
              aria-label="Stop colour"
            />
            <Input
              size="xs"
              type="number"
              min={0}
              max={100}
              value={Math.round(stop.opacity * 100)}
              onChange={(e) =>
                setStop(stop.id, {
                  opacity: Math.max(0, Math.min(100, Number(e.target.value))) / 100,
                })
              }
              endSlot="%"
              aria-label="Stop opacity"
              className="w-16"
            />
            <Button
              size="xs"
              iconOnly
              variant="ghost"
              onClick={() => removeStop(stop.id)}
              disabled={value.stops.length <= 2}
              aria-label="Remove stop"
              title="Remove stop"
              className="ml-auto"
            >
              <Minus />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
});
GradientEditor.displayName = "GradientEditor";
