"use client";

/**
 * EmbedOptionsShowcase — one live screen, rendered several ways, so the
 * embed configuration options read at a glance. Every tile is the SAME
 * share token; only the URL params differ, and each tile prints the params
 * that produced it. A teaching surface for what `/e/<token>?…` can do.
 *
 * Note: each tile boots its own iframe, so keep the variant count modest.
 */

import * as React from "react";
import { LiveEmbed } from "@/components/marketing/live-embed";
import { SectionHeader } from "@/components/marketing/sections";

const TOKEN = "dc108b3d-2023-47b5-898d-f21933fb42e6";

interface EmbedVariant {
  label: string;
  caption: string;
  /** Query string (without the leading `?`). */
  params: string;
}

const VARIANTS: EmbedVariant[] = [
  {
    label: "Fill",
    caption: "Width only: the screen reflows to fill the frame.",
    params: "w=1280&mode=light&motion=off&shield=1",
  },
  {
    label: "Contain",
    caption: "Width + height: a fixed 1280×800 artboard, scaled to fit and letterboxed.",
    params: "w=1280&h=800&mode=light&motion=off&shield=1",
  },
  {
    label: "Wireframe",
    caption: "Structure over imagery, with the tiered placeholders showing.",
    params: "w=1280&mode=light&fidelity=wireframe&motion=off&shield=1",
  },
  {
    label: "Spotlight",
    caption: "Zoom to a focal point so the frame crops to a detail.",
    params: "w=1280&zoom=1.7&cx=0.24&cy=0.42&mode=light&motion=off&shield=1",
  },
  {
    label: "Camera tour",
    caption: "A scripted zoom-and-pan that holds, glides, and loops.",
    // Shot separator `;` is URL-encoded (%3B) so it survives query parsing
    // and parseCameraParam sees all three shots (a raw `;` gets truncated
    // to a single shot, which renders static).
    params:
      "w=1280&mode=light&motion=on&camera=1,0.5,0.5,2%3B2,0.24,0.42,2.5%3B1,0.5,0.5,2&shield=1",
  },
  {
    label: "Live tweaker",
    caption: "Visitors change the theme and mode inside the embed.",
    params: "w=1280&mode=light&tweak=theme,mode&tweakopen=1&shield=1",
  },
  {
    label: "Padded canvas",
    caption: "Padding, a canvas colour, and a rounded viewport (pad + bg + radius).",
    params:
      "w=1280&h=800&mode=light&pad=24&radius=8&bg=%23FF361F&motion=off&shield=1",
  },
  {
    label: "Viewports",
    caption: "A viewport switcher that swaps device sizes, auto-cycling here.",
    params:
      "w=1280&mode=light&viewports=desktop,tablet,mobile&viewportsauto=1&pad=16&radius=8&bg=%233f3f46&shield=1",
  },
];

export function EmbedOptionsShowcase() {
  return (
    <section className="border-t border-border/60 py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <SectionHeader
          title={
            <>
              One screen, <em>many embeds</em>
            </>
          }
          subtitle="The same live screen, configured entirely by URL params. Resize it, drop to wireframe, spotlight a detail, run a camera tour, or hand the visitor a theme tweaker."
          className="max-w-2xl mb-10"
        />
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-10">
          {VARIANTS.map((v) => (
            <figure key={v.label} className="flex flex-col gap-3">
              <LiveEmbed
                src={`/e/${TOKEN}?${v.params}`}
                title={`Pocket Films embed: ${v.label}`}
                colorScheme="light"
                frameClassName="aspect-video"
                className="rounded-[var(--gds-radius-lg)] border border-border/70 overflow-hidden shadow-[var(--gds-shadow-lg)]"
              />
              <figcaption className="space-y-1">
                <span className="text-sm font-medium text-foreground">{v.label}</span>
                <p className="text-sm text-muted-foreground">{v.caption}</p>
                <code className="block text-[11px] font-mono text-muted-foreground/70 break-all">
                  ?{v.params}
                </code>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
