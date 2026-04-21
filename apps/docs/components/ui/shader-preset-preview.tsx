"use client";

/**
 * ShaderPresetPreview — a thumbnail-sized preview of a shader preset.
 *
 * Default behaviour: static poster until hovered, then kick in a live
 * `<ThreeScene>` render. Keeps gallery pages cheap (ten live shaders on
 * one page eats FPS fast, Safari caps WebGL contexts ~8).
 *
 * Props:
 *   live: "never"  → always show poster, no canvas
 *   live: "hover"  → (default) canvas spins up on hover, tears down on leave
 *   live: "always" → canvas always rendering
 */

import * as React from "react";
import { ThreeScene } from "./three-scene";
import { MediaSurface } from "./media-surface";
import { shaderPresetById } from "@/lib/three/shader-presets";
import { cn } from "@/lib/utils";
import type { Palette } from "@/lib/three/types";

export interface ShaderPresetPreviewProps {
  preset: string;
  live?: "never" | "hover" | "always";
  postPreset?: string;
  palette?: Partial<Palette>;
  className?: string;
  aspect?: "video" | "square" | "portrait" | "wide";
  radius?: "none" | "sm" | "md" | "lg" | "xl";
  /** Text label shown on the card. Defaults to preset label. */
  label?: string;
  /** Hide the label strip. */
  hideLabel?: boolean;
  onClick?: () => void;
}

export const ShaderPresetPreview = React.forwardRef<
  HTMLDivElement,
  ShaderPresetPreviewProps
>(
  (
    {
      preset,
      live = "hover",
      postPreset,
      palette,
      className,
      aspect = "video",
      radius = "lg",
      label,
      hideLabel = false,
      onClick,
    },
    ref,
  ) => {
    const entry = shaderPresetById[preset];
    const [hovered, setHovered] = React.useState(false);
    const shouldRender = live === "always" || (live === "hover" && hovered);

    return (
      <div
        ref={ref}
        data-gds-part="picker-card"
        data-gds-preset={preset}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onClick}
        className={cn(
          "group cursor-pointer flex flex-col gap-2",
          className,
        )}
      >
        {shouldRender ? (
          <ThreeScene
            preset={preset}
            postPreset={postPreset}
            palette={palette}
            aspect={aspect}
            radius={radius}
            autoPlay
            controls={false}
            pauseOffscreen
            poster={entry?.poster}
            maxDpr={1} // thumbnails — keep GPU work low
          />
        ) : (
          <MediaSurface
            aspect={aspect}
            radius={radius}
            data-gds-part="preset-poster"
            className="bg-gradient-to-br from-muted to-muted/50"
          >
            {entry?.poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={entry.poster}
                alt={entry.label}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                {entry?.label ?? preset}
              </div>
            )}
          </MediaSurface>
        )}
        {!hideLabel && (
          <div className="flex items-baseline justify-between text-xs">
            <span
              className="font-medium text-foreground"
              data-gds-part="preset-label"
            >
              {label ?? entry?.label ?? preset}
            </span>
            {entry?.tags?.[0] && (
              <span className="text-muted-foreground">{entry.tags[0]}</span>
            )}
          </div>
        )}
      </div>
    );
  },
);
ShaderPresetPreview.displayName = "ShaderPresetPreview";
