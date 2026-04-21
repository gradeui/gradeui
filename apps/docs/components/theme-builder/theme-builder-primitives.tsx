"use client";

/**
 * Small shared form primitives for the theme builder. These are dumb
 * presentation pieces — no context coupling — so they can be reused by
 * any of the outer composites (Controls, a bespoke host form, etc.).
 *
 * Deliberately chunky because the builder's vibe is "dense admin panel"
 * not "marketing page". Keep spacing tight; keep labels uppercase; keep
 * font sizes small. Design tokens drive the colours so the panel picks
 * up whichever theme it's hosted under.
 */

import { useEffect, useState } from "react";
import {
  FONTS,
  FONT_LABELS,
  FONT_CATEGORY,
  oklchToHex,
  type FontKey,
} from "@/lib/themes";
import { hueToRamp } from "@/lib/themes/oklch";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────
   Section
   ────────────────────────────────────────────────────────────────────── */

export function Section({
  title,
  subtitle,
  children,
}: {
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border last:border-b-0 px-3 py-3 space-y-3">
      <div>
        <h3 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Label
   ────────────────────────────────────────────────────────────────────── */

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Segmented control — thin wrapper over a row of toggle buttons
   ────────────────────────────────────────────────────────────────────── */

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md border px-2 py-1 text-[11px] transition-colors",
            value === o.value
              ? "border-primary bg-primary/10 text-foreground"
              : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Icon button — small square, used for undo/redo/reset
   ────────────────────────────────────────────────────────────────────── */

export function IconButton({
  children,
  onClick,
  disabled,
  title,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={label}
      className={cn(
        "h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground transition-colors",
        !disabled && "hover:bg-muted hover:text-foreground",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Mode button — half of the light/dark segmented group in the controls
   ────────────────────────────────────────────────────────────────────── */

export function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded px-2 py-1 text-[11px] transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Hue control — slider + live hex swatch
   ────────────────────────────────────────────────────────────────────── */

export function HueRow({
  label,
  hue,
  chroma,
  onChange,
}: {
  label: string;
  hue: number;
  chroma: number;
  onChange: (hue: number) => void;
}) {
  // Resolve hue+chroma through the ramp generator so the swatch shows a
  // believable "500-step" brand colour, not raw OKLCH edges.
  //
  // `oklchToHex` uses the browser's own parser (getComputedStyle on a
  // throwaway span) so it returns "" during SSR. If we called it inline
  // via useMemo, the server would emit the oklch() fallback while the
  // first client render would emit a hex — a hydration mismatch. Instead
  // we leave the state empty on first paint (matches SSR → both render the
  // oklch fallback) and fill it in after mount, then recompute whenever
  // hue/chroma change.
  const [swatchHex, setSwatchHex] = useState<string>("");
  useEffect(() => {
    const ramp = hueToRamp({ hue, chromaScale: chroma });
    setSwatchHex(oklchToHex(ramp[500]));
  }, [hue, chroma]);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
          <span
            className="h-3 w-3 rounded-sm border border-border"
            style={{
              background: swatchHex || `oklch(0.6 ${chroma * 0.17} ${hue})`,
            }}
            aria-hidden
          />
          {Math.round(hue)}°
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={360}
        step={1}
        value={hue}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
        style={{
          // Rainbow gradient so the slider reads like a colour wheel —
          // matches what the control actually does.
          background:
            "linear-gradient(to right, " +
            "oklch(0.7 0.17 0), oklch(0.7 0.17 60), oklch(0.7 0.17 120), " +
            "oklch(0.7 0.17 180), oklch(0.7 0.17 240), oklch(0.7 0.17 300), " +
            "oklch(0.7 0.17 360))",
          borderRadius: 4,
          height: 6,
          appearance: "none",
        }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Font picker — grouped select filtered by category
   ────────────────────────────────────────────────────────────────────── */

export function FontRow({
  label,
  value,
  onChange,
  filter,
}: {
  label: string;
  value: FontKey;
  onChange: (v: FontKey) => void;
  filter: (cat: "sans" | "serif" | "mono") => boolean;
}) {
  const keys = (Object.keys(FONTS) as FontKey[]).filter((k) =>
    filter(FONT_CATEGORY[k])
  );
  const sans = keys.filter((k) => FONT_CATEGORY[k] === "sans");
  const serif = keys.filter((k) => FONT_CATEGORY[k] === "serif");
  const mono = keys.filter((k) => FONT_CATEGORY[k] === "mono");

  return (
    <div>
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as FontKey)}
        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
      >
        {sans.length > 0 && (
          <optgroup label="Sans">
            {sans.map((k) => (
              <option key={k} value={k}>
                {FONT_LABELS[k]}
              </option>
            ))}
          </optgroup>
        )}
        {serif.length > 0 && (
          <optgroup label="Serif">
            {serif.map((k) => (
              <option key={k} value={k}>
                {FONT_LABELS[k]}
              </option>
            ))}
          </optgroup>
        )}
        {mono.length > 0 && (
          <optgroup label="Mono">
            {mono.map((k) => (
              <option key={k} value={k}>
                {FONT_LABELS[k]}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}
