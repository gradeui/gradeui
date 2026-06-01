"use client";

/**
 * ShaderControls — renders a `ControlSpec[]` schema into a live controls
 * panel using the DS control primitives. One component drives every
 * shader's params, the universal post stack (POST_CONTROLS), and any
 * effect layer — because they all describe themselves as ControlSpec[].
 *
 * Controlled: parent owns the `DemoState` and gets `onChange(key, value)`
 * on every edit. UI-only; it knows nothing about WebGL.
 *
 * Mapping:
 *   slider     → Slider + editable number (with optional unit)
 *   segmented  → ToggleGroup (single)
 *   select     → Select (compact)
 *   toggle     → Switch
 *   color      → swatch + hex field (with optional "→ slot" binding hint)
 *   colorList  → N swatches + add/remove (Paper's colorCount)
 *   divider    → section heading + rule
 */

import * as React from "react";
import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getBool,
  getColors,
  getNum,
  getStr,
  type ControlSpec,
  type DemoState,
} from "@/lib/three/schema";

// Full-contrast foreground (not muted) so labels stay legible when the
// panel floats over a busy / bright shader. The frosted scrim behind the
// controls (see playground) does the rest.
const LABEL = "text-[11px] font-medium text-foreground";

export interface ShaderControlsProps {
  controls: readonly ControlSpec[];
  state: DemoState;
  onChange: (key: string, value: number | string | boolean | string[]) => void;
  disabled?: boolean;
  className?: string;
}

export function ShaderControls({
  controls,
  state,
  onChange,
  disabled,
  className,
}: ShaderControlsProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {controls.map((c) => {
        if (c.type === "divider") {
          return (
            <div
              key={c.key}
              className="mt-3 mb-1 border-t border-border/60 pt-2 first:mt-0 first:border-t-0 first:pt-0"
            >
              {c.label ? (
                <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground/80">
                  {c.label}
                </span>
              ) : null}
            </div>
          );
        }

        if (c.type === "slider") {
          return (
            <SliderRow
              key={c.key}
              spec={c}
              value={getNum(state, c.key, c.default)}
              disabled={disabled}
              onChange={(v) => onChange(c.key, v)}
            />
          );
        }

        if (c.type === "segmented") {
          const v = getStr(state, c.key, c.default);
          return (
            <Field key={c.key} label={c.label}>
              <ToggleGroup
                type="single"
                size="sm"
                value={v}
                onValueChange={(next) => next && onChange(c.key, next)}
                disabled={disabled}
                className="w-full justify-start"
              >
                {c.options.map((o) => (
                  <ToggleGroupItem key={o.value} value={o.value} className="flex-1">
                    {o.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
          );
        }

        if (c.type === "select") {
          const v = getStr(state, c.key, c.default);
          return (
            <Field key={c.key} label={c.label}>
              <Select
                value={v}
                onValueChange={(next) => onChange(c.key, next)}
                disabled={disabled}
              >
                <SelectTrigger size="xs" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent size="xs">
                  {c.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          );
        }

        if (c.type === "toggle") {
          const v = getBool(state, c.key, c.default);
          return (
            <div
              key={c.key}
              className="flex items-center justify-between gap-2 py-1"
            >
              <Label className={LABEL}>{c.label}</Label>
              <Switch
                checked={v}
                onCheckedChange={(next) => onChange(c.key, next)}
                disabled={disabled}
              />
            </div>
          );
        }

        if (c.type === "color") {
          const v = getStr(state, c.key, c.default);
          return (
            <Field
              key={c.key}
              label={c.label}
              hint={c.slot ? `→ ${c.slot}` : undefined}
            >
              <ColorField
                value={v}
                disabled={disabled}
                onChange={(next) => onChange(c.key, next)}
              />
            </Field>
          );
        }

        // colorList
        const colors = getColors(state, c.key, c.default);
        return (
          <ColorListField
            key={c.key}
            spec={c}
            value={colors}
            disabled={disabled}
            onChange={(next) => onChange(c.key, next)}
          />
        );
      })}
    </div>
  );
}

/** Stacked label + control wrapper. */
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1 py-1">
      <div className="flex items-baseline justify-between gap-2">
        <Label className={LABEL}>{label}</Label>
        {hint ? (
          <span className="text-[10px] text-muted-foreground/70">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/** Slider + editable number readout (with optional unit). */
function SliderRow({
  spec,
  value,
  disabled,
  onChange,
}: {
  spec: Extract<ControlSpec, { type: "slider" }>;
  value: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  const decimals = spec.step < 1 ? (spec.step < 0.1 ? 3 : 2) : 0;
  const clamp = (n: number) => Math.min(spec.max, Math.max(spec.min, n));
  const [draft, setDraft] = React.useState<string | null>(null);
  const display = draft ?? value.toFixed(decimals);

  const commit = (raw: string) => {
    const n = Number(raw);
    if (Number.isFinite(n)) onChange(clamp(n));
    setDraft(null);
  };

  return (
    <div className="space-y-1 py-1">
      <div className="flex items-center justify-between gap-2">
        <Label className={LABEL}>{spec.label}</Label>
        <Input
          size="xs"
          type="text"
          inputMode="decimal"
          aria-label={spec.label}
          value={display}
          disabled={disabled}
          endSlot={
            spec.unit ? (
              <span className="text-[9px] text-muted-foreground/60">
                {spec.unit}
              </span>
            ) : undefined
          }
          className="w-16 tabular-nums"
          onChange={(e) => setDraft(e.currentTarget.value)}
          onBlur={(e) => commit(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit(e.currentTarget.value);
          }}
        />
      </div>
      <Slider
        value={[value]}
        min={spec.min}
        max={spec.max}
        step={spec.step}
        disabled={disabled}
        onValueChange={(v) => onChange(clamp(v[0] ?? spec.default))}
      />
    </div>
  );
}

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Native colour swatch + free-text field (so rgb()/hex/named all work). */
function ColorField({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  // Native <input type=color> only accepts #rrggbb; fall back for
  // non-hex CSS colours so the swatch doesn't break the value.
  const swatch = HEX_RE.test(value) ? value : "#000000";
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="color"
        value={swatch}
        disabled={disabled}
        onChange={(e) => onChange(e.currentTarget.value)}
        aria-label="Colour swatch"
        className="h-7 w-9 shrink-0 cursor-pointer rounded-md border border-input bg-transparent disabled:opacity-50"
      />
      <Input
        size="xs"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.currentTarget.value)}
        className="font-mono"
      />
    </div>
  );
}

/** Variable-length colour list — Paper's colorCount + swatches. */
function ColorListField({
  spec,
  value,
  disabled,
  onChange,
}: {
  spec: Extract<ControlSpec, { type: "colorList" }>;
  value: string[];
  disabled?: boolean;
  onChange: (v: string[]) => void;
}) {
  const min = spec.min ?? 1;
  const max = spec.max ?? 8;
  const setAt = (i: number, c: string) =>
    onChange(value.map((v, idx) => (idx === i ? c : v)));
  const add = () =>
    value.length < max && onChange([...value, value[value.length - 1] ?? "#ffffff"]);
  const removeAt = (i: number) =>
    value.length > min && onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-1 py-1">
      <div className="flex items-baseline justify-between gap-2">
        <Label className={LABEL}>{spec.label}</Label>
        <button
          type="button"
          onClick={add}
          disabled={disabled || value.length >= max}
          aria-label="Add colour"
          className="inline-flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 [&_svg]:size-3.5"
        >
          <Plus />
        </button>
      </div>
      <div className="space-y-1.5">
        {value.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <ColorField
              value={c}
              disabled={disabled}
              onChange={(next) => setAt(i, next)}
            />
            <button
              type="button"
              onClick={() => removeAt(i)}
              disabled={disabled || value.length <= min}
              aria-label="Remove colour"
              className="inline-flex h-7 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 [&_svg]:size-3.5"
            >
              <Minus />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
