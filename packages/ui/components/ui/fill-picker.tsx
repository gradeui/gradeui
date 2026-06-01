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
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";
import { Input } from "./input";
import { Slider } from "./slider";
import { Switch } from "./switch";
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
