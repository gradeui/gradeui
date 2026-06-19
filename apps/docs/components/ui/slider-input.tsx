"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

/**
 * SliderInput — the DS Slider with a TYPEABLE value on the right. Drag the
 * slider OR click the number and type. Generic: any continuous numeric knob
 * (hue, opacity, a dimension, a ratio). The caller owns the label.
 *
 * The readout is a borderless, transparent input so it reads as a value, not
 * a form field, until you focus it. Typing holds a free-text draft (so "0."
 * / "-" are allowed mid-edit) and commits clamped on blur / Enter; Escape
 * cancels.
 */
export interface SliderInputProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Decimal places in the readout. Default 0. */
  decimals?: number;
  /** Suffix after the number (e.g. "°", "px"). */
  unit?: string;
  size?: "default" | "sm";
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function SliderInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  decimals = 0,
  unit,
  size = "sm",
  disabled,
  className,
  "aria-label": ariaLabel,
}: SliderInputProps) {
  const [draft, setDraft] = React.useState<string | null>(null);
  const shown = draft ?? value.toFixed(decimals);
  const commit = (raw: string) => {
    const n = parseFloat(raw);
    if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
    setDraft(null);
  };
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Slider
        size={size}
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={([v]) => onChange(v)}
        aria-label={ariaLabel}
        className="flex-1"
      />
      <span className="flex w-12 shrink-0 items-baseline justify-end">
        <input
          value={shown}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (draft != null) commit(draft);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commit(draft ?? shown);
              e.currentTarget.blur();
            } else if (e.key === "Escape") {
              setDraft(null);
              e.currentTarget.blur();
            }
          }}
          inputMode="decimal"
          aria-label={ariaLabel ? `${ariaLabel} value` : "value"}
          className="w-full bg-transparent text-right font-mono text-2xs tabular-nums text-muted-foreground outline-none focus:text-foreground"
        />
        {unit ? (
          <span className="font-mono text-2xs text-muted-foreground">{unit}</span>
        ) : null}
      </span>
    </div>
  );
}
