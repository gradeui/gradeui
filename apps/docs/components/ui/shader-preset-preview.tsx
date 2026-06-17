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
import { THEME_REACTIVE_PALETTE } from "@/lib/three/theme-palette";
import { cn } from "@/lib/utils";
import type { Palette } from "@/lib/three/types";

export interface ShaderPresetPreviewProps {
  preset: string;
  live?: "never" | "hover" | "always";
  postPreset?: string;
  palette?: Partial<Palette>;
  className?: string;
  aspect?: "video" | "standard" | "square" | "portrait" | "wide";
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
    // `live="never"` stays a static poster/placeholder. Otherwise the
    // scene is always mounted so the thumbnail shows a real STILL frame
    // of the shader (ThreeScene paints one frame even when paused); it
    // only ANIMATES on hover (or when live="always").
    const showScene = live !== "never";
    const animate = live === "always" || (live === "hover" && hovered);

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
        {showScene ? (
          <ThreeScene
            key={preset}
            preset={preset}
            postPreset={postPreset}
            // Theme-reactive by default so thumbnails re-tint with the page
            // theme (same as the live playground). Caller can override.
            palette={palette ?? THEME_REACTIVE_PALETTE}
            aspect={aspect}
            radius={radius}
            // Mount PAUSED (still frame), animate on hover via the
            // controlled `play` prop — no remount, no context churn.
            autoPlay={false}
            play={animate}
            controls={false}
            pauseOffscreen
            // A gallery page can mount dozens of thumbnails; a live
            // WebGLRenderer holds a GL context for its whole lifetime and
            // browsers cap simultaneous contexts (~16 Chrome, ~8 Safari),
            // silently evicting the OLDEST when exceeded (those cards blank
            // with a "Context Lost" log). Thumbnails therefore RELEASE their
            // context while scrolled out of view — only the on-screen cards
            // (plus a small pre-warm margin) hold one. See ThreeScene.
            releaseOffscreen
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
