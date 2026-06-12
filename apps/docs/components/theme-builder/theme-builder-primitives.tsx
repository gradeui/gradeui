"use client";

/**
 * Small shared form primitives for the theme builder. These are dumb
 * presentation pieces — no context coupling — so they can be reused by
 * any of the outer composites (Controls, a bespoke host form, etc.).
 *
 * Visual language MATCHES the selection inspector (the Layout tab):
 * sentence-case text-2xs labels, collapsible chevron sections with
 * edge-to-edge dividers, Select size="2xs" triggers. The two panels sit
 * in the same tab strip — they must read as one tool, not two eras.
 * Design tokens drive the colours so the panel picks up whichever theme
 * it's hosted under.
 */

import { useState } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  FONTS,
  FONT_LABELS,
  FONT_CATEGORY,
  CUSTOM_FONT_PREFIX,
  customFontFamily,
  type CustomFontFace,
  type FontKey,
  type FontSelection,
} from "@/lib/themes";
import { hueToRamp, RAMP_KEYS } from "@/lib/themes/oklch";
import { cn } from "@/lib/utils";

/** Field label classes — keep in sync with FIELD_LABEL in
 *  selection-inspector.tsx (the Layout tab). Sentence case, no
 *  uppercase. */
export const FIELD_LABEL = "text-2xs font-medium text-foreground/80";

/* ──────────────────────────────────────────────────────────────────────
   Section
   ────────────────────────────────────────────────────────────────────── */

/**
 * Collapsible section — mirrors the selection inspector's
 * CollapsibleSection (chevron toggle, sentence-case text-xs title,
 * edge-to-edge top divider) so the Design System and Layout tabs read
 * as one tool.
 */
export function Section({
  title,
  subtitle,
  defaultOpen = true,
  children,
}: {
  title: React.ReactNode;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
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
      </button>
      {open && (
        <div className="space-y-2 px-3 pb-3">
          {subtitle && (
            <p className="text-2xs leading-snug text-muted-foreground">
              {subtitle}
            </p>
          )}
          {children}
        </div>
      )}
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Label
   ────────────────────────────────────────────────────────────────────── */

export function Label({
  children,
  changed,
  onReset,
}: {
  children: React.ReactNode;
  /** Render the changed-from-base dot. The Design System tab compares
   *  the control's value against the provider's `baseline` and flips
   *  this on, so the user can see exactly which knobs drifted. */
  changed?: boolean;
  /** Per-control reset — writes THIS field's baseline value back
   *  (everything else keeps its edits). Rendered only while changed. */
  onReset?: () => void;
}) {
  return (
    <div className={cn("flex items-center gap-1.5 mb-1", FIELD_LABEL)}>
      {children}
      {changed && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-studio-accent"
          title="Changed from the base theme"
          aria-label="Changed from the base theme"
        />
      )}
      {changed && onReset && (
        <button
          type="button"
          onClick={onReset}
          title="Reset this control to the base theme"
          aria-label="Reset this control to the base theme"
          className="inline-flex h-4 w-4 items-center justify-center rounded text-muted-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground"
        >
          <RotateCcw className="h-2.5 w-2.5" />
        </button>
      )}
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
    // Canonical ToggleGroup at inspector density — pill-on-track
    // treatment (muted track, active segment lifts to bg-background),
    // the same vocabulary as TabsList and the canvas fidelity toggle.
    <ToggleGroup
      type="single"
      size="2xs"
      value={value}
      onValueChange={(v: string) => {
        // Radix emits "" when the active segment is clicked again —
        // a segmented pick is always-one-selected, so ignore it.
        if (v) onChange(v as T);
      }}
      className="w-full justify-start gap-0.5 rounded-md bg-foreground/5 p-0.5"
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          className={cn(
            // rounded-sm (not a hardcoded px radius) so the segment
            // corners ride the Studio theme's --radius like every
            // other control in the panel.
            "h-5 flex-1 rounded-sm px-2 text-2xs font-medium",
            "text-muted-foreground hover:text-foreground",
            "data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm",
          )}
        >
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
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
   Hue control — the generated ramp as swatch blocks; slider on demand
   ────────────────────────────────────────────────────────────────────── */

/**
 * The row shows what the hue actually PRODUCES — the 11-step OKLCH ramp
 * as swatch blocks — instead of a rainbow slider (which showed every
 * colour except the ones you'd get). Clicking the strip (or the degree
 * readout) reveals the hue slider for adjusting; the native slider is
 * tinted to the ramp's 500 step via accent-color rather than custom
 * thumb/track chrome.
 *
 * Swatches paint with `oklch(<triplet>)` directly — SSR-stable (no
 * browser parsing involved), so the old hex round-trip is gone.
 */
export function HueRow({
  label,
  hue,
  chroma,
  onChange,
  changed,
  onReset,
}: {
  label: string;
  hue: number;
  chroma: number;
  onChange: (hue: number) => void;
  /** Changed-from-base dot — see Label. */
  changed?: boolean;
  /** Per-control reset — see Label. */
  onReset?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ramp = hueToRamp({ hue, chromaScale: chroma });

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label changed={changed} onReset={onReset}>
          {label}
        </Label>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          title="Adjust hue"
          className={cn(
            "rounded px-1 text-2xs font-mono tabular-nums transition-colors",
            open
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {Math.round(hue)}°
        </button>
      </div>

      {/* The ramp itself, 50 → 950. Click to adjust. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        title={`${label} ramp — click to adjust hue`}
        className={cn(
          "flex h-6 w-full overflow-hidden rounded-md border border-border/60",
          "transition-shadow hover:ring-2 hover:ring-ring/30",
          open && "ring-2 ring-ring/40",
        )}
      >
        {RAMP_KEYS.map((step) => (
          <span
            key={step}
            className="h-full flex-1"
            style={{ background: `oklch(${ramp[step]})` }}
            aria-hidden
          />
        ))}
      </button>

      {open && (
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={hue}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={`${label} hue`}
          className="w-full"
          // Native slider, tinted to the ramp — no bespoke chrome.
          style={{ accentColor: `oklch(${ramp[500]})` }}
        />
      )}
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
  customFonts,
  changed,
  onReset,
}: {
  label: string;
  value: FontSelection;
  onChange: (v: FontSelection) => void;
  filter: (cat: "sans" | "serif" | "mono") => boolean;
  /** Uploaded faces offered alongside the registry — the theme's own
   *  customFonts merged with the user's font asset library. Rendered as a
   *  "Your fonts" group whose values are `custom:<family>` selections.
   *  Filtered by the same category predicate as registry fonts. */
  customFonts?: CustomFontFace[];
  /** Changed-from-base dot — see Label. */
  changed?: boolean;
  /** Per-control reset — see Label. */
  onReset?: () => void;
}) {
  const keys = (Object.keys(FONTS) as FontKey[]).filter((k) =>
    filter(FONT_CATEGORY[k])
  );
  const sans = keys.filter((k) => FONT_CATEGORY[k] === "sans");
  const serif = keys.filter((k) => FONT_CATEGORY[k] === "serif");
  const mono = keys.filter((k) => FONT_CATEGORY[k] === "mono");
  const custom = (customFonts ?? []).filter((f) =>
    filter(f.category ?? "sans")
  );

  // A selection naming a face that's gone from both the theme and the
  // library would render an empty trigger — surface it as a raw item so
  // the user can see (and move off) the dangling value.
  const valueFamily = customFontFamily(value);
  const valueIsOrphan =
    valueFamily !== null && !custom.some((f) => f.family === valueFamily);

  const group = (heading: string, items: FontKey[]) =>
    items.length > 0 && (
      <SelectGroup>
        <SelectLabel>{heading}</SelectLabel>
        {items.map((k) => (
          <SelectItem key={k} value={k}>
            {FONT_LABELS[k]}
          </SelectItem>
        ))}
      </SelectGroup>
    );

  return (
    <div className="space-y-1">
      <Label changed={changed} onReset={onReset}>{label}</Label>
      {/* Canonical Select at inspector density (size="2xs") — matches
          the Layout tab's NumericSelectRow triggers. */}
      <Select
        value={value}
        onValueChange={(v) => onChange(v as FontSelection)}
      >
        <SelectTrigger size="2xs" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent size="2xs">
          {(custom.length > 0 || valueIsOrphan) && (
            <SelectGroup>
              <SelectLabel>Your fonts</SelectLabel>
              {custom.map((f) => (
                <SelectItem
                  key={f.family}
                  value={`${CUSTOM_FONT_PREFIX}${f.family}`}
                >
                  {f.family}
                </SelectItem>
              ))}
              {valueIsOrphan && (
                <SelectItem value={value}>{valueFamily} (missing)</SelectItem>
              )}
            </SelectGroup>
          )}
          {group("Sans", sans)}
          {group("Serif", serif)}
          {group("Mono", mono)}
        </SelectContent>
      </Select>
    </div>
  );
}
