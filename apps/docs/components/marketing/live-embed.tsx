"use client";

/**
 * LiveEmbed — a host frame for Grade embeds (/e/<token>).
 *
 * Deliberately thin: the iframe plus two host-side niceties.
 *
 *   - color-scheme on the iframe element, so the browser paints the
 *     pre-render canvas dark instead of flashing white in dark pages.
 *   - a wheel replayer: the embed forwards wheel deltas nothing inside
 *     it consumed (grade:embed-wheel), and this component replays them
 *     as page scrolls, so the cursor passing over the frame never
 *     creates a scroll dead zone.
 *
 * The click-to-interact shield that used to live here moved INTO the
 * embed itself (?shield=1 on the embed URL) so every host gets it
 * without host-side code.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface LiveEmbedProps {
  src: string;
  title: string;
  /** Paints the iframe's pre-render canvas (color-scheme) so a loading
   *  embed never flashes white inside a dark page. Default dark — the
   *  marketing surface is dark-only. */
  colorScheme?: "light" | "dark";
  /** Classes for the iframe itself (sizing/aspect). */
  frameClassName?: string;
  className?: string;
}

export function LiveEmbed({
  src,
  title,
  colorScheme = "dark",
  frameClassName,
  className,
}: LiveEmbedProps) {
  // Replay the embed's forwarded wheel deltas as page scrolls. The
  // embed posts grade:embed-wheel only for deltas nothing inside it
  // consumed (its own scrollable panels keep their scroll).
  React.useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const d = e.data as { type?: string; deltaY?: number; deltaX?: number };
      if (!d || d.type !== "grade:embed-wheel") return;
      window.scrollBy({ top: d.deltaY ?? 0, left: d.deltaX ?? 0 });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <iframe
        src={src}
        title={title}
        className={cn("block w-full border-0 bg-background", frameClassName)}
        style={{ colorScheme }}
      />
    </div>
  );
}
