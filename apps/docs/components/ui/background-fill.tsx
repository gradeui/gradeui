"use client";

/**
 * BackgroundFill — a frame's background *paint*, as a layer.
 *
 * This is the render boundary for the "fill" model: a generative
 * background (shader), an image, a video, a gradient, a repeating
 * texture, or a solid token is NEVER a free-standing selectable node.
 * It is a paint that belongs to a frame, exactly like a fill in Figma /
 * Paper. The frame is the thing you select; this layer is plumbing.
 *
 * Drop it as the FIRST child of a `relative` frame. It paints an
 * `absolute inset-0`, `z-0`, `pointer-events-none` layer behind the
 * frame's content — so siblings that carry `relative z-10` (or any
 * positioned/z-indexed content) sit on top automatically. It is marked
 * `data-gds-part="frame-fill"` + `aria-hidden` so Studio treats it as
 * chrome (not separately selectable) and a11y trees skip it.
 *
 * The `type` switch picks what gets painted:
 *   none     → renders nothing
 *   solid    → a theme token (or any CSS colour)
 *   gradient → a linear-gradient from from/via/to stops
 *   image    → an <img> (object-fit) or a tiled background (repeat)
 *   video    → a muted, looping, autoplaying <video>
 *   shader   → a <ThreeScene> generative shader (preset or GLSL)
 *
 * Common controls — `opacity` and `blendMode` — apply to every type,
 * mirroring the inspector's Blending section.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { ThreeScene } from "./three-scene";
import type { Palette, PostPreset } from "@/lib/three/types";
import type { MediaRadius } from "./media-surface";

export type BackgroundFillType =
  | "none"
  | "solid"
  | "gradient"
  | "image"
  | "video"
  | "shader";

export type BackgroundFillFit = "cover" | "contain" | "fill" | "none";

/** Solid-fill tokens — kept in step with the inspector's FILL_COLOR_TOKENS. */
const TOKEN_COLORS: Record<string, string> = {
  background: "oklch(var(--background))",
  card: "oklch(var(--card))",
  muted: "oklch(var(--muted))",
  secondary: "oklch(var(--secondary))",
  accent: "oklch(var(--accent))",
  primary: "oklch(var(--primary))",
  destructive: "oklch(var(--destructive))",
  transparent: "transparent",
};

/** Resolve a colour value: a known token name → `oklch(var(--token))`,
 *  anything else (hex / rgb / oklch / named) passes through untouched. */
function resolveColor(value?: string): string | undefined {
  if (!value) return undefined;
  return TOKEN_COLORS[value] ?? value;
}

const radiusClass: Record<MediaRadius, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
};

const objectFitClass: Record<BackgroundFillFit, string> = {
  cover: "object-cover",
  contain: "object-contain",
  fill: "object-fill",
  none: "object-none",
};

export interface BackgroundFillProps {
  /** Which paint to render. */
  type: BackgroundFillType;

  // ── solid ──────────────────────────────────────────────────────────
  /** Token name (`primary`, `card`, …) or any CSS colour. */
  color?: string;

  // ── gradient ───────────────────────────────────────────────────────
  /** Gradient stops — token names or CSS colours. `shape: "radial"`
   *  swaps the linear paint for a radial wash (the classic "soft glow
   *  behind the hero"); `at` positions its centre, `size` fixes the
   *  ellipse (e.g. "45rem 50rem" — defaults to farthest-corner).
   *  `angle` is linear-only; `at`/`size` are radial-only. */
  gradient?: {
    from?: string;
    via?: string;
    to?: string;
    angle?: number;
    shape?: "linear" | "radial";
    at?: string;
    size?: string;
  };

  // ── image / video ──────────────────────────────────────────────────
  /** Image or video URL. */
  src?: string;
  /** object-fit for image / video. Default `cover`. */
  fit?: BackgroundFillFit;
  /** CSS object-position / background-position. Default `center`. */
  position?: string;
  /** Tile the image (uses background-image + repeat instead of <img>). */
  repeat?: boolean;
  /** Tile size when `repeat` (CSS background-size, e.g. "120px"). */
  tileSize?: string;

  // ── shader ─────────────────────────────────────────────────────────
  /** Shader preset id (see ThreeScene). */
  preset?: string;
  /** Custom GLSL fragment shader (takes precedence over preset). */
  fragmentShader?: string;
  /** Palette overrides for the shader. */
  palette?: Partial<Palette>;
  /** Post-FX preset id or live PostPreset object. */
  postPreset?: string | PostPreset;

  // ── common ─────────────────────────────────────────────────────────
  /** Layer opacity (0–1). */
  opacity?: number;
  /** CSS mix-blend-mode against the frame behind it. */
  blendMode?: React.CSSProperties["mixBlendMode"];
  /** Corner radius — match the frame's so the paint clips cleanly. */
  radius?: MediaRadius;
  className?: string;
  style?: React.CSSProperties;
}

export const BackgroundFill = React.forwardRef<
  HTMLDivElement,
  BackgroundFillProps
>(
  (
    {
      type,
      color,
      gradient,
      src,
      fit = "cover",
      position = "center",
      repeat = false,
      tileSize,
      preset,
      fragmentShader,
      palette,
      postPreset,
      opacity,
      blendMode,
      radius = "none",
      className,
      style,
    },
    ref,
  ) => {
    if (type === "none") return null;

    const layerStyle: React.CSSProperties = {
      opacity,
      mixBlendMode: blendMode,
      ...style,
    };

    let paint: React.ReactNode = null;

    if (type === "solid") {
      layerStyle.background = resolveColor(color) ?? "oklch(var(--background))";
    } else if (type === "gradient") {
      const stops = [
        resolveColor(gradient?.from) ?? "oklch(var(--primary))",
        resolveColor(gradient?.via),
        resolveColor(gradient?.to) ?? "oklch(var(--accent))",
      ].filter(Boolean) as string[];
      if (gradient?.shape === "radial") {
        // radial-gradient([size ]at position, stops). Size omitted →
        // farthest-corner, the CSS default — fills the frame softly.
        const at = gradient.at ?? "center";
        const size = gradient.size ? `${gradient.size} ` : "";
        layerStyle.backgroundImage = `radial-gradient(${size}at ${at}, ${stops.join(", ")})`;
      } else {
        const angle = gradient?.angle ?? 135;
        layerStyle.backgroundImage = `linear-gradient(${angle}deg, ${stops.join(", ")})`;
      }
    } else if (type === "image") {
      if (repeat && src) {
        layerStyle.backgroundImage = `url(${src})`;
        layerStyle.backgroundRepeat = "repeat";
        layerStyle.backgroundPosition = position;
        if (tileSize) layerStyle.backgroundSize = tileSize;
      } else if (src) {
        paint = (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className={cn(
              "absolute inset-0 h-full w-full",
              objectFitClass[fit],
            )}
            style={{ objectPosition: position }}
          />
        );
      }
    } else if (type === "video") {
      if (src) {
        paint = (
          <video
            src={src}
            autoPlay
            muted
            loop
            playsInline
            className={cn(
              "absolute inset-0 h-full w-full",
              objectFitClass[fit],
            )}
            style={{ objectPosition: position }}
          />
        );
      }
    } else if (type === "shader") {
      paint = (
        <ThreeScene
          preset={preset}
          fragmentShader={fragmentShader}
          palette={palette}
          postPreset={postPreset}
          aspect="auto"
          radius="none"
          className="absolute inset-0"
        />
      );
    }

    return (
      <div
        ref={ref}
        data-gds-part="frame-fill"
        data-gds-fill-type={type}
        aria-hidden="true"
        className={cn(
          "absolute inset-0 z-0 overflow-hidden pointer-events-none",
          radius !== "none" && radiusClass[radius],
          className,
        )}
        style={layerStyle}
      >
        {paint}
      </div>
    );
  },
);
BackgroundFill.displayName = "BackgroundFill";
