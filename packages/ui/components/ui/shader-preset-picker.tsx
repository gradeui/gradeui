"use client";

/**
 * ShaderPresetPicker — runtime preset gallery + selection.
 *
 * A grid of `<ShaderPresetPreview>` cards. Click to select. Used for
 * things like "pick a vibe for your course background".
 *
 * For a browsing-only catalogue with no selection, just lay out
 * `<ShaderPresetPreview>` directly.
 *
 * TODO(phase 2): static catalogue page for the docs site mirroring this.
 */

import * as React from "react";
import { ShaderPresetPreview } from "./shader-preset-preview";
import { shaderPresets } from "@/lib/three/shader-presets";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { Palette } from "@/lib/three/types";

export interface ShaderPresetPickerProps {
  /** Currently selected preset id (controlled). */
  value?: string;
  /** Called when the user clicks a preset. */
  onChange?: (presetId: string) => void;
  /** Filter by tag — e.g. only show `"space"` or `"retro"` presets. */
  filterTags?: string[];
  /** Live-render mode for thumbnails. Default "hover". */
  live?: "never" | "hover" | "always";
  /** Shared post-FX preset applied to all thumbnails. Default: each preset's own. */
  postPreset?: string;
  /** Shared palette for all thumbnails. */
  palette?: Partial<Palette>;
  /** Columns at md+ breakpoint. Default 3. */
  columns?: 2 | 3 | 4;
  className?: string;
}

export function ShaderPresetPicker({
  value,
  onChange,
  filterTags,
  live = "hover",
  postPreset,
  palette,
  columns = 3,
  className,
}: ShaderPresetPickerProps) {
  const presets = React.useMemo(() => {
    if (!filterTags?.length) return shaderPresets;
    return shaderPresets.filter((p) =>
      filterTags.some((t) => p.tags.includes(t)),
    );
  }, [filterTags]);

  const colsClass =
    columns === 2
      ? "md:grid-cols-2"
      : columns === 4
        ? "md:grid-cols-4"
        : "md:grid-cols-3";

  return (
    <div
      data-gds-part="preset-grid"
      role="radiogroup"
      className={cn("grid grid-cols-2 gap-3", colsClass, className)}
    >
      {presets.map((preset) => {
        const selected = value === preset.id;
        return (
          <div key={preset.id} className="relative" role="radio" aria-checked={selected}>
            <ShaderPresetPreview
              preset={preset.id}
              postPreset={postPreset}
              palette={palette}
              live={live}
              onClick={() => onChange?.(preset.id)}
              className={cn(
                "transition-all",
                selected && "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg",
              )}
            />
            {selected && (
              <div
                data-gds-part="picker-selected-badge"
                className="absolute top-2 right-2 rounded-full bg-primary text-primary-foreground p-1 shadow-sm"
              >
                <Check className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
