"use client";

/**
 * ShaderControls — renders a `ControlSpec[]` schema into a DS-native control
 * panel. The single renderer behind every shader's params, the universal
 * post stack, and any effect layer (they all describe themselves as
 * ControlSpec[]).
 *
 * DS-consistent by construction: it composes the design-system primitives at
 * tool-panel density (Label size="xs", Slider size="sm", Input size="2xs"
 * variant="ghost", ToggleGroup size="sm", Select size="xs", Switch) — no
 * bespoke markup, so it reads identically to the Studio inspector and the
 * homepage tweaker.
 *
 * `labelPosition` switches between the dense inline layout (label left,
 * control + value right) and label-above (label + value on top, control
 * below). Controlled: parent owns `DemoState`, gets `onChange(key, value)`.
 */

import * as React from "react";
import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Swatch } from "@/components/ui/swatch";
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

export type ControlLabelPosition = "inline" | "above";

export interface ShaderControlsProps {
  controls: readonly ControlSpec[];
  state: DemoState;
  onChange: (key: string, value: number | string | boolean | string[]) => void;
  disabled?: boolean;
  /** Label placement: dense inline (default) or stacked above the control. */
  labelPosition?: ControlLabelPosition;
  /** Number-readout format. "percent" normalises every eligible slider (no
   *  unit, fractional step, non-negative range) to 0–100%, killing the
   *  abstract 0.3753 readouts. A control's own `display: "percent"` always
   *  wins. Default "raw". */
  format?: "raw" | "percent";
  className?: string;
}

/** Whether a slider should read as a percentage. */
function isPercent(
  c: Extract<ControlSpec, { type: "slider" }>,
  format: "raw" | "percent",
): boolean {
  if (c.display === "percent") return true;
  return format === "percent" && !c.unit && c.step < 1 && c.min >= 0;
}

export function ShaderControls({
  controls,
  state,
  onChange,
  disabled,
  labelPosition = "inline",
  format = "raw",
  className,
}: ShaderControlsProps) {
  return (
    <div
      className={cn(
        "flex flex-col",
        labelPosition === "above" ? "gap-2.5" : "gap-1",
        className,
      )}
    >
      {controls.map((c) => {
        if (c.type === "divider") {
          return (
            <div key={c.key} className="mt-2 mb-0.5 first:mt-0">
              {c.label ? (
                <span className="text-[11px] font-medium text-foreground/70">
                  {c.label}
                </span>
              ) : null}
            </div>
          );
        }

        if (c.type === "slider") {
          const value = getNum(state, c.key, c.default);
          return (
            <Row
              key={c.key}
              labelPosition={labelPosition}
              label={c.label}
              value={
                <NumberValue
                  spec={c}
                  value={value}
                  percent={isPercent(c, format)}
                  disabled={disabled}
                  onChange={(v) => onChange(c.key, v)}
                />
              }
              control={
                <Slider
                  size="sm"
                  className="flex-1"
                  value={[value]}
                  min={c.min}
                  max={c.max}
                  step={c.step}
                  disabled={disabled}
                  aria-label={c.label}
                  onValueChange={(v) =>
                    onChange(
                      c.key,
                      Math.min(c.max, Math.max(c.min, v[0] ?? c.default)),
                    )
                  }
                />
              }
            />
          );
        }

        if (c.type === "segmented") {
          const v = getStr(state, c.key, c.default);
          return (
            <Row
              key={c.key}
              labelPosition={labelPosition}
              label={c.label}
              control={
                <ToggleGroup
                  type="single"
                  variant="segmented"
                  size="2xs"
                  value={v}
                  disabled={disabled}
                  onValueChange={(next) => next && onChange(c.key, next)}
                  className={labelPosition === "above" ? "w-full" : ""}
                >
                  {c.options.map((o) => (
                    <ToggleGroupItem
                      key={o.value}
                      value={o.value}
                      className="px-2.5 text-[11px] font-medium"
                    >
                      {o.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              }
            />
          );
        }

        if (c.type === "select") {
          const v = getStr(state, c.key, c.default);
          return (
            <Row
              key={c.key}
              labelPosition={labelPosition}
              label={c.label}
              control={
                <Select
                  value={v}
                  onValueChange={(next) => onChange(c.key, next)}
                  disabled={disabled}
                >
                  <SelectTrigger
                    size="xs"
                    className={labelPosition === "above" ? "w-full" : "w-auto"}
                  >
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
              }
            />
          );
        }

        if (c.type === "toggle") {
          const v = getBool(state, c.key, c.default);
          return (
            <Row
              key={c.key}
              labelPosition={labelPosition}
              label={c.label}
              control={
                <Switch
                  checked={v}
                  onCheckedChange={(next) => onChange(c.key, next)}
                  disabled={disabled}
                />
              }
            />
          );
        }

        if (c.type === "color") {
          const v = getStr(state, c.key, c.default);
          return (
            <Row
              key={c.key}
              labelPosition={labelPosition}
              label={c.label}
              hint={c.slot}
              control={
                <ColorField
                  value={v}
                  disabled={disabled}
                  onChange={(next) => onChange(c.key, next)}
                />
              }
            />
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

/** Lays a label + control (+ optional value readout) inline or stacked. */
function Row({
  labelPosition,
  label,
  hint,
  control,
  value,
}: {
  labelPosition: ControlLabelPosition;
  label: string;
  hint?: string;
  control: React.ReactNode;
  value?: React.ReactNode;
}) {
  const lab = (
    <Label
      size="xs"
      className={cn(
        "text-muted-foreground",
        labelPosition === "inline" && "w-24 shrink-0 truncate",
      )}
    >
      {label}
      {hint ? (
        <span className="ml-1.5 text-[10px] text-muted-foreground/50">
          {hint}
        </span>
      ) : null}
    </Label>
  );

  if (labelPosition === "above") {
    return (
      <div className="space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          {lab}
          {value}
        </div>
        {control}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {lab}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        {control}
        {value}
      </div>
    </div>
  );
}

/** Borderless DS number field (Input 2xs ghost) + optional unit. */
function NumberValue({
  spec,
  value,
  percent,
  disabled,
  onChange,
}: {
  spec: Extract<ControlSpec, { type: "slider" }>;
  value: number;
  percent?: boolean;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  const span = spec.max - spec.min || 1;
  const decimals = spec.step < 1 ? (spec.step < 0.1 ? 3 : 2) : 0;
  const clamp = (n: number) => Math.min(spec.max, Math.max(spec.min, n));
  // Display: percent normalises to 0–100% of the range; raw shows the value.
  const toDisplay = (v: number) =>
    percent
      ? String(Math.round(((v - spec.min) / span) * 100))
      : v.toFixed(decimals);
  // Edit: a typed percent maps back to the real value, then snaps to step.
  const fromInput = (raw: string): number | null => {
    let n = Number(raw.replace("%", ""));
    if (!Number.isFinite(n)) return null;
    if (percent) n = spec.min + (n / 100) * span;
    return clamp(Math.round(n / spec.step) * spec.step);
  };
  const unit = percent ? "%" : spec.unit;
  const [draft, setDraft] = React.useState<string | null>(null);
  const display = draft ?? toDisplay(value);
  const commit = (raw: string) => {
    const n = fromInput(raw);
    if (n !== null) onChange(n);
    setDraft(null);
  };
  return (
    <div className="flex w-14 shrink-0 items-center justify-end gap-0.5">
      <Input
        size="2xs"
        variant="ghost"
        inputMode="decimal"
        aria-label={spec.label}
        className="w-full px-0 text-right tabular-nums"
        value={display}
        disabled={disabled}
        onChange={(e) => setDraft(e.currentTarget.value)}
        onBlur={(e) => commit(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(e.currentTarget.value);
        }}
      />
      {unit ? (
        <span className="text-[9px] text-muted-foreground/50">{unit}</span>
      ) : null}
    </div>
  );
}

/** Borderless DS hex field + the editable DS Swatch (native OS picker
 *  lives inside Swatch). Value first so its right-aligned digits sit
 *  directly against the chip — no dead gap. No hand-rolled colour square. */
function ColorField({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Input
        size="2xs"
        variant="ghost"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.currentTarget.value)}
        className="w-20 px-0 text-right font-mono"
        aria-label="Colour value"
      />
      <Swatch
        color={value}
        size="xs"
        shape="rounded"
        onColorChange={disabled ? undefined : onChange}
        className={disabled ? "opacity-50" : undefined}
      />
    </div>
  );
}

/** Variable-length colour list. */
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
    value.length < max &&
    onChange([...value, value[value.length - 1] ?? "#ffffff"]);
  const removeAt = (i: number) =>
    value.length > min && onChange(value.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex items-center gap-2">
        <Label size="xs" className="w-24 shrink-0 truncate text-muted-foreground">
          {spec.label}
        </Label>
        <div className="flex flex-1 justify-end">
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
      </div>
      <div className="mt-1 space-y-1 pl-24">
        {value.map((c, i) => (
          <div key={i} className="flex items-center justify-end gap-1.5">
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
              className="inline-flex h-6 w-5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 [&_svg]:size-3.5"
            >
              <Minus />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
