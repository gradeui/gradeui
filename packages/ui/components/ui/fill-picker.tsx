"use client";

/**
 * FillPicker — Grade's paint picker, modelled on Figma's fill popover.
 *
 * A type-icon row across the top (solid · gradient · image · pattern ·
 * video · shader) switches the panel below to that paint's controls,
 * with a global opacity at the foot. It emits a `FillValue` that maps
 * 1:1 onto `<BackgroundFill>` props, so the inspector's Fill section and
 * any frame background share one control + one data shape.
 *
 * Grade is token-led, so the SOLID tab leads with theme-token swatches
 * (the "Libraries" half of Figma's picker) rather than a freeform HSV
 * square. A custom-colour square is a deliberate later pass.
 */

import * as React from "react";
import {
  Square,
  Blend,
  Image as ImageIcon,
  Grid3x3,
  Video as VideoIcon,
  Sparkles,
  Eye,
  EyeOff,
  Plus,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";
import { Input } from "./input";
import { Slider } from "./slider";
import { Switch } from "./switch";
import { Button } from "./button";
import { ColorPicker } from "./color-picker";
import {
  GradientEditor,
  gradientToCss,
  type GradientValue,
} from "./gradient-editor";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";
import { ShaderPresetPicker } from "./shader-preset-picker";
import type { BackgroundFillType, BackgroundFillFit } from "./background-fill";
import type { Palette, PostPreset } from "@/lib/three/types";

/** A paint value — the serialisable shape both the picker and
 *  `<BackgroundFill>` speak. */
export interface FillValue {
  type: BackgroundFillType;
  color?: string;
  gradient?: { from?: string; via?: string; to?: string; angle?: number };
  src?: string;
  fit?: BackgroundFillFit;
  repeat?: boolean;
  tileSize?: string;
  preset?: string;
  palette?: Partial<Palette>;
  postPreset?: string | PostPreset;
  opacity?: number;
}

/** Theme tokens offered as solid / gradient swatches. */
export const FILL_TOKENS = [
  "primary",
  "accent",
  "secondary",
  "muted",
  "card",
  "background",
  "destructive",
  "transparent",
] as const;

function tokenColor(token: string): string {
  return token === "transparent" ? "transparent" : `oklch(var(--${token}))`;
}

/** UI tabs — "pattern" is sugar for an image fill with repeat on. */
type FillTab =
  | "solid"
  | "gradient"
  | "image"
  | "pattern"
  | "video"
  | "shader";

const TABS: { tab: FillTab; icon: React.ElementType; label: string }[] = [
  { tab: "solid", icon: Square, label: "Solid" },
  { tab: "gradient", icon: Blend, label: "Gradient" },
  { tab: "image", icon: ImageIcon, label: "Image" },
  { tab: "pattern", icon: Grid3x3, label: "Pattern" },
  { tab: "video", icon: VideoIcon, label: "Video" },
  { tab: "shader", icon: Sparkles, label: "Shader" },
];

function tabOf(v: FillValue): FillTab {
  if (v.type === "image" && v.repeat) return "pattern";
  if (v.type === "image") return "image";
  return v.type as FillTab;
}

export interface FillPickerProps {
  value: FillValue;
  onChange: (value: FillValue) => void;
  className?: string;
}

const LABEL = "text-[11px] font-medium text-muted-foreground";

function Swatch({
  token,
  active,
  onClick,
}: {
  token: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={token}
      onClick={onClick}
      className={cn(
        "h-7 w-7 rounded-md border border-border/60 transition-shadow",
        token === "transparent" &&
          "bg-[linear-gradient(45deg,#bbb_25%,transparent_25%,transparent_75%,#bbb_75%),linear-gradient(45deg,#bbb_25%,transparent_25%,transparent_75%,#bbb_75%)] bg-[length:8px_8px] bg-[position:0_0,4px_4px]",
        active && "ring-2 ring-primary ring-offset-1 ring-offset-background",
      )}
      style={
        token === "transparent" ? undefined : { background: tokenColor(token) }
      }
    />
  );
}

export function FillPicker({ value, onChange, className }: FillPickerProps) {
  const tab = tabOf(value);
  const set = (patch: Partial<FillValue>) => onChange({ ...value, ...patch });

  const selectTab = (next: FillTab) => {
    if (!next) return;
    if (next === "pattern") set({ type: "image", repeat: true });
    else if (next === "image") set({ type: "image", repeat: false });
    else set({ type: next as BackgroundFillType });
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Type row */}
      <ToggleGroup
        type="single"
        size="sm"
        value={tab}
        onValueChange={(v) => selectTab(v as FillTab)}
        className="justify-start gap-0.5"
      >
        {TABS.map(({ tab: t, icon: Icon, label }) => (
          <ToggleGroupItem key={t} value={t} aria-label={label} title={label}>
            <Icon className="h-4 w-4" />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/* Per-type panel */}
      {tab === "solid" && (
        <div className="flex flex-col gap-1.5">
          <span className={LABEL}>Token</span>
          <div className="flex flex-wrap gap-1.5">
            {FILL_TOKENS.map((t) => (
              <Swatch
                key={t}
                token={t}
                active={value.color === t}
                onClick={() => set({ color: t })}
              />
            ))}
          </div>
        </div>
      )}

      {tab === "gradient" && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1.5">
            <span className={LABEL}>From</span>
            <div className="flex flex-wrap gap-1.5">
              {FILL_TOKENS.map((t) => (
                <Swatch
                  key={t}
                  token={t}
                  active={value.gradient?.from === t}
                  onClick={() =>
                    set({ gradient: { ...value.gradient, from: t } })
                  }
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={LABEL}>To</span>
            <div className="flex flex-wrap gap-1.5">
              {FILL_TOKENS.map((t) => (
                <Swatch
                  key={t}
                  token={t}
                  active={value.gradient?.to === t}
                  onClick={() => set({ gradient: { ...value.gradient, to: t } })}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={LABEL}>
              Angle — {value.gradient?.angle ?? 135}°
            </span>
            <Slider
              value={[value.gradient?.angle ?? 135]}
              min={0}
              max={360}
              step={5}
              onValueChange={([a]) =>
                set({ gradient: { ...value.gradient, angle: a } })
              }
            />
          </div>
        </div>
      )}

      {(tab === "image" || tab === "pattern") && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1.5">
            <span className={LABEL}>Image URL</span>
            <Input
              size="sm"
              value={value.src ?? ""}
              placeholder="https://… or /asset.png"
              onChange={(e) => set({ src: e.target.value })}
            />
          </div>
          {tab === "image" && (
            <div className="flex flex-col gap-1.5">
              <span className={LABEL}>Fit</span>
              <ToggleGroup
                type="single"
                size="sm"
                value={value.fit ?? "cover"}
                onValueChange={(v) =>
                  v && set({ fit: v as BackgroundFillFit })
                }
                className="justify-start gap-0.5"
              >
                {(["cover", "contain", "fill", "none"] as BackgroundFillFit[]).map(
                  (f) => (
                    <ToggleGroupItem
                      key={f}
                      value={f}
                      className="px-2 text-[11px] capitalize"
                    >
                      {f}
                    </ToggleGroupItem>
                  ),
                )}
              </ToggleGroup>
            </div>
          )}
          {tab === "pattern" && (
            <div className="flex flex-col gap-1.5">
              <span className={LABEL}>Tile size</span>
              <Input
                size="sm"
                value={value.tileSize ?? ""}
                placeholder="120px"
                onChange={(e) => set({ tileSize: e.target.value })}
              />
            </div>
          )}
        </div>
      )}

      {tab === "video" && (
        <div className="flex flex-col gap-1.5">
          <span className={LABEL}>Video URL</span>
          <Input
            size="sm"
            value={value.src ?? ""}
            placeholder="https://….mp4"
            onChange={(e) => set({ src: e.target.value })}
          />
        </div>
      )}

      {tab === "shader" && (
        <div className="flex flex-col gap-1.5">
          <span className={LABEL}>Shader</span>
          <ShaderPresetPicker
            value={value.preset}
            onChange={(id) => set({ preset: id })}
            live="hover"
            columns={3}
          />
        </div>
      )}

      {/* Global opacity */}
      {value.type !== "none" && (
        <div className="flex items-center gap-2 border-t border-border/50 pt-2.5">
          <span className={cn(LABEL, "shrink-0")}>Opacity</span>
          <Slider
            value={[value.opacity ?? 1]}
            min={0}
            max={1}
            step={0.05}
            onValueChange={([o]) => set({ opacity: o })}
            className="flex-1"
          />
          <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-foreground">
            {Math.round((value.opacity ?? 1) * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
FillPicker.displayName = "FillPicker";

/* ──────────────────────────────────────────────────────────────────────
   FillSection — the multi-fill list (Figma's "Fill" inspector section).

   Where <FillPicker> edits ONE paint with the full type-icon row,
   <FillSection> stacks a LIST of fills: each row is a Solid/Gradient/Image
   toggle, the matching value control (ColorPicker / GradientEditor popover /
   image URL), an opacity %, a visibility eye, and a remove button. The header
   carries an "add fill" button. Reuses FillValue + the new ColorPicker +
   GradientEditor so the data shape stays the one <BackgroundFill> speaks.

   `visible` rides FillValue.opacity: hiding a fill stashes its opacity and
   sets 0; showing restores it.
   ────────────────────────────────────────────────────────────────────── */

/** The three fill kinds FillSection rows can switch between. */
type RowKind = "solid" | "gradient" | "image";

const ROW_KINDS: { kind: RowKind; icon: React.ElementType; label: string }[] = [
  { kind: "solid", icon: Square, label: "Solid" },
  { kind: "gradient", icon: Blend, label: "Gradient" },
  { kind: "image", icon: ImageIcon, label: "Image" },
];

function rowKindOf(v: FillValue): RowKind {
  if (v.type === "gradient") return "gradient";
  if (v.type === "image") return "image";
  return "solid";
}

/** Bridge FillValue.gradient ({from,via,to,angle}) → the structured
 *  GradientValue the GradientEditor edits, and back. */
function toGradientValue(v: FillValue): GradientValue {
  const g = v.gradient ?? {};
  const stops: GradientValue["stops"] = [];
  const push = (token: string | undefined, position: number, id: string) => {
    if (token == null) return;
    stops.push({ id, position, token, opacity: 1 });
  };
  push(g.from ?? "primary", 0, "g-from");
  if (g.via != null) push(g.via, 50, "g-via");
  push(g.to ?? "accent", 100, "g-to");
  return { type: "linear", angle: g.angle ?? 90, stops };
}

function fromGradientValue(gv: GradientValue): FillValue["gradient"] {
  const sorted = [...gv.stops].sort((a, b) => a.position - b.position);
  const from = sorted[0]?.token;
  const to = sorted[sorted.length - 1]?.token;
  const via = sorted.length > 2 ? sorted[1]?.token : undefined;
  return { from, via, to, angle: gv.angle };
}

export interface FillSectionProps {
  /** The ordered list of fills (top-most last, Figma-style — but the list
   *  renders in array order; the consumer owns z-ordering semantics). */
  value: FillValue[];
  /** Fired with the next list on any add / edit / remove / reorder. */
  onChange: (value: FillValue[]) => void;
  /** Section heading. Default "Fills". */
  title?: string;
  className?: string;
}

/** A sensible new solid fill. */
function defaultFill(): FillValue {
  return { type: "solid", color: "primary", opacity: 1 };
}

export function FillSection({
  value,
  onChange,
  title = "Fills",
  className,
}: FillSectionProps) {
  const setAt = (index: number, patch: Partial<FillValue>) =>
    onChange(value.map((f, i) => (i === index ? { ...f, ...patch } : f)));

  const removeAt = (index: number) =>
    onChange(value.filter((_, i) => i !== index));

  const add = () => onChange([...value, defaultFill()]);

  const switchKind = (index: number, kind: RowKind) => {
    if (kind === "image") setAt(index, { type: "image", repeat: false });
    else setAt(index, { type: kind as BackgroundFillType });
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <span className={LABEL}>{title}</span>
        <Button
          size="2xs"
          iconOnly
          variant="ghost"
          onClick={add}
          aria-label="Add fill"
          title="Add fill"
        >
          <Plus />
        </Button>
      </div>

      {value.length === 0 && (
        <p className="text-[11px] text-muted-foreground">No fills.</p>
      )}

      <div className="flex flex-col gap-1.5">
        {value.map((fill, index) => {
          const kind = rowKindOf(fill);
          const opacity = fill.opacity ?? 1;
          const visible = opacity > 0;
          const stashed = (fill as { _opacity?: number })._opacity;

          const toggleVisible = () => {
            if (visible)
              setAt(index, {
                opacity: 0,
                ...({ _opacity: opacity } as Partial<FillValue>),
              });
            else setAt(index, { opacity: stashed ?? 1 });
          };

          return (
            <div
              key={index}
              data-gds-part="fill-row"
              className="flex items-center gap-1.5"
            >
              <ToggleGroup
                type="single"
                size="sm"
                value={kind}
                onValueChange={(v) => v && switchKind(index, v as RowKind)}
                className="gap-0.5"
              >
                {ROW_KINDS.map(({ kind: k, icon: Icon, label }) => (
                  <ToggleGroupItem
                    key={k}
                    value={k}
                    aria-label={label}
                    title={label}
                  >
                    <Icon className="h-4 w-4" />
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>

              {/* Value control per kind */}
              <div className="min-w-0 flex-1">
                {kind === "solid" && (
                  <ColorPicker
                    triggerVariant="inline"
                    value={fill.color ?? null}
                    onValueChange={(v) =>
                      setAt(index, { color: v ?? undefined })
                    }
                    aria-label="Fill colour"
                  />
                )}
                {kind === "gradient" && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        aria-label="Edit gradient"
                        className="h-6 w-full rounded-md border border-border/60"
                        style={{
                          background: gradientToCss(toGradientValue(fill)),
                        }}
                      />
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-64">
                      <GradientEditor
                        value={toGradientValue(fill)}
                        onChange={(gv) =>
                          setAt(index, { gradient: fromGradientValue(gv) })
                        }
                      />
                    </PopoverContent>
                  </Popover>
                )}
                {kind === "image" && (
                  <Input
                    size="xs"
                    value={fill.src ?? ""}
                    placeholder="https://… or /asset.png"
                    onChange={(e) => setAt(index, { src: e.target.value })}
                    aria-label="Image URL"
                  />
                )}
              </div>

              {/* Opacity */}
              <Input
                size="xs"
                type="number"
                min={0}
                max={100}
                value={Math.round(opacity * 100)}
                onChange={(e) =>
                  setAt(index, {
                    opacity:
                      Math.max(0, Math.min(100, Number(e.target.value))) / 100,
                  })
                }
                endSlot="%"
                aria-label="Fill opacity"
                className="w-14"
              />

              {/* Visibility */}
              <Button
                size="xs"
                iconOnly
                variant="ghost"
                onClick={toggleVisible}
                aria-label={visible ? "Hide fill" : "Show fill"}
                title={visible ? "Hide fill" : "Show fill"}
              >
                {visible ? <Eye /> : <EyeOff />}
              </Button>

              {/* Remove */}
              <Button
                size="xs"
                iconOnly
                variant="ghost"
                onClick={() => removeAt(index)}
                aria-label="Remove fill"
                title="Remove fill"
              >
                <Trash2 />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
FillSection.displayName = "FillSection";
