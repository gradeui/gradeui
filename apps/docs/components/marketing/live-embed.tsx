"use client";

/**
 * LiveEmbed — an iframe with the map-embed interaction pattern.
 *
 * Problem: an interactive iframe swallows wheel events, so smooth
 * scrolling (Lenis) goes dead the moment the cursor crosses it — the
 * scroll hitch around the homepage showcase. pointer-events-none fixes
 * the scroll but kills the demo.
 *
 * This does both: a transparent shield sits over the iframe so wheel
 * events reach the page and scrolling stays smooth. CLICKING the shield
 * removes it (the iframe becomes fully interactive); moving the cursor
 * off the frame re-arms it. A quiet hint chip appears on hover so the
 * affordance is discoverable.
 */

import * as React from "react";
import { MousePointerClick } from "lucide-react";
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
  /** Hint chip label. */
  hint?: string;
}

export function LiveEmbed({
  src,
  title,
  colorScheme = "dark",
  frameClassName,
  className,
  hint = "Click to interact",
}: LiveEmbedProps) {
  const [driving, setDriving] = React.useState(false);

  return (
    <div
      className={cn("group relative", className)}
      onMouseLeave={() => setDriving(false)}
    >
      <iframe
        src={src}
        title={title}
        className={cn("block w-full border-0 bg-background", frameClassName)}
        style={{ colorScheme }}
      />

      {!driving && (
        <button
          type="button"
          aria-label={`Interact with ${title}`}
          onClick={() => setDriving(true)}
          className="absolute inset-0 z-10 cursor-pointer appearance-none border-0 bg-transparent p-0"
        />
      )}

      {/* Hover hint — fades out once driving. */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur transition-opacity duration-300",
          driving ? "opacity-0" : "opacity-0 group-hover:opacity-100",
        )}
      >
        <MousePointerClick className="h-3.5 w-3.5" />
        {hint}
      </span>
    </div>
  );
}
