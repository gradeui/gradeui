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
  Minus,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";
import { Input } from "./input";
import { Slider } from "./slider";
import { Switch } from "./switch";
import { Button } from "./button";
import { ColorPicker } from "./color-picker";
import { Swatch } from "./swatch";
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
  gradient?: {
    from?: string;
    via?: string;
    to?: string;
    angle?: number;
    /** Gradient kind. Absent = linear (the historical default). `radial`
     *  renders `radial-gradient(...)`, `conic` renders
     *  `conic-gradient(from <angle> ...)`. */
    type?: "linear" | "radial" | "conic";
    /** Centre position for radial / conic gradients ("center",
     *  "25% 25%", "top left"). Linear ignores it. */
    position?: string;
    /** Provenance — `"tailwind"` marks a parsed Tailwind preset so the
     *  editor locks to ≤3 stops and the serialiser prefers re-emitting the
     *  utility class. */
    source?: "tailwind" | "custom" | "scoped";
    /** Original Tailwind class string for a parsed preset. */
    tailwindClass?: string;
    /** v4 `/interp` modifier. */
    interpolation?: string;
  };
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

/** A pickable token chip, rendered via the shared <Swatch>. Transparent
 *  tokens fall back to the checkerboard `type="solid" color="transparent"`. */
function TokenSwatch({
  token,
  active,
  onClick,
}: {
  token: string;
  active: boolean;
  onClick: () => void;
}) {
  const common = { size: "sm", shape: "rounded", selected: active, onSelect: onClick, title: token } as const;
  if (token === "transparent") {
    return <Swatch {...common} type="solid" color="transparent" />;
  }
  return <Swatch {...common} token={token} />;
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
        {TABS.map(({ tab: t, icon: Icon, label }) => {
          // Image fill disabled for now (keep solid + gradient + others).
          if (t === "image") return null;
          return (
            <ToggleGroupItem key={t} value={t} aria-label={label} title={label}>
              <Icon className="h-4 w-4" />
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>

      {/* Per-type panel */}
      {tab === "solid" && (
        <div className="flex flex-col gap-1.5">
          <span className={LABEL}>Token</span>
          <div className="flex flex-wrap gap-1.5">
            {FILL_TOKENS.map((t) => (
              <TokenSwatch
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
                <TokenSwatch
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
                <TokenSwatch
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
/** A bare-word value (no `(`, `#`, space) is a theme token name; anything
 *  else is a raw CSS colour (hex / oklch() / rgb()). */
function isRawColor(value: string): boolean {
  return /[#(\s]/.test(value) || value.startsWith("var(");
}

function toGradientValue(v: FillValue): GradientValue {
  const g = v.gradient ?? {};
  const stops: GradientValue["stops"] = [];
  const push = (value: string | undefined, position: number, id: string) => {
    if (value == null) return;
    if (value === "transparent" || isRawColor(value))
      stops.push({ id, position, color: value, opacity: 1 });
    else stops.push({ id, position, token: value, opacity: 1 });
  };
  push(g.from ?? "primary", 0, "g-from");
  if (g.via != null) push(g.via, 50, "g-via");
  push(g.to ?? "accent", 100, "g-to");
  return {
    type: "linear",
    angle: g.angle ?? 90,
    stops,
    source: g.source,
    tailwindClass: g.tailwindClass,
    interpolation: g.interpolation,
  };
}

function fromGradientValue(gv: GradientValue): FillValue["gradient"] {
  const sorted = [...gv.stops].sort((a, b) => a.position - b.position);
  const from = sorted[0]?.token ?? sorted[0]?.color;
  const to = sorted[sorted.length - 1]?.token ?? sorted[sorted.length - 1]?.color;
  const via =
    sorted.length > 2 ? (sorted[1]?.token ?? sorted[1]?.color) : undefined;
  return {
    from,
    via,
    to,
    angle: gv.angle,
    source: gv.source,
    tailwindClass: gv.tailwindClass,
    interpolation: gv.interpolation,
  };
}

export interface FillSectionProps {
  /** The ordered list of fills (top-most last, Figma-style — but the list
   *  renders in array order; the consumer owns z-ordering semantics). */
  value: FillValue[];
  /** Fired with the next list on any add / edit / remove / reorder. */
  onChange: (value: FillValue[]) => void;
  /** Section heading. Default "Fills". */
  title?: string;
  /** Hide the internal header (title + add) — use when an outer section
   *  already provides the heading + add control (e.g. the inspector). */
  hideHeader?: boolean;
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
  hideHeader = false,
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
      {!hideHeader && (
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
      )}

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
              className="flex flex-col gap-1"
            >
              {/* Type toggle + actions (matches Figma Fill Section) */}
              <div className="flex items-center gap-1.5">
                <ToggleGroup
                  type="single"
                  variant="segmented"
                  size="2xs"
                  value={kind}
                  onValueChange={(v) => v && switchKind(index, v as RowKind)}
                  className="flex-1"
                >
                  <ToggleGroupItem value="solid" className="flex-1">
                    Solid
                  </ToggleGroupItem>
                  <ToggleGroupItem value="gradient" className="flex-1">
                    Gradient
                  </ToggleGroupItem>
                  {/* Image disabled for now (code path kept in switchKind) */}
                  <ToggleGroupItem value="image" className="flex-1" disabled>
                    Image
                  </ToggleGroupItem>
                </ToggleGroup>
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
                <Button
                  size="xs"
                  iconOnly
                  variant="ghost"
                  onClick={() => removeAt(index)}
                  aria-label="Remove fill"
                  title="Remove fill"
                >
                  <Minus />
                </Button>
              </div>

              {/* Value field + opacity */}
              <div className="flex items-center gap-1.5">
                <div className="min-w-0 flex-1">
                  {kind === "solid" && (
                    <ColorPicker
                      value={fill.color ?? null}
                      onValueChange={(v) =>
                        setAt(index, { color: v ?? undefined })
                      }
                      className="w-full"
                      aria-label="Fill colour"
                    />
                  )}
                  {kind === "gradient" && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          aria-label="Edit gradient"
                          className="flex h-7 w-full min-w-0 items-center gap-2 rounded-md border border-input bg-background px-2 text-left"
                        >
                          <Swatch
                            size="2xs"
                            shape="rounded"
                            type="gradient"
                            gradient={gradientToCss(toGradientValue(fill))}
                          />
                          <span className="truncate text-xs">
                            {`Linear · ${toGradientValue(fill).stops.length} stops`}
                          </span>
                        </button>
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
                <Input
                  size="xs"
                  type="number"
                  min={0}
                  max={100}
                  value={Math.round(opacity * 100)}
                  onChange={(e) =>
                    setAt(index, {
                      opacity:
                        Math.max(0, Math.min(100, Number(e.target.value))) /
                        100,
                    })
                  }
                  endSlot="%"
                  aria-label="Fill opacity"
                  className="w-14"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
FillSection.displayName = "FillSection";
