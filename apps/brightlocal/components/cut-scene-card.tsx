"use client";

/**
 * A cut-scene card: full frame, 16:9, no chrome. Rendered on its own route
 * at /meta/cards/<slug> for Figma Slides, and rendered inside the capture
 * stage during a recording so a cut never costs a page navigation (which
 * is what put a white flash between scenes).
 */

import { Logo } from "@brightlocal/ui-components";
import { pickIllustration } from "@/lib/illustrations";
import type { CardSpec } from "@/lib/cards";

export function CutSceneCard({ card }: { card: CardSpec }) {
  const Art = pickIllustration(card.art);
  const ink = card.ink === "white" ? "var(--ds-tailwind-colors-base-white)" : "var(--ds-tailwind-colors-neutral-950)";
  return (
    <div
      data-hook={`card-${card.slug}`}
      className="flex h-full w-full items-center justify-center"
      style={{ background: card.surface, color: ink }}
    >
      <div className="flex w-[min(92vw,1400px)] items-center gap-16">
        <div className="shrink-0" aria-hidden>
          <Art className="size-[24rem]" />
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <span className="rounded-md border-2 px-3 py-1 text-[1.5rem] font-semibold" style={{ borderColor: ink }}>
              Insights
            </span>
            <span className="text-stage-kicker opacity-80">{card.kicker}</span>
          </div>
          <h1 className="text-stage-title text-balance">{card.title}</h1>
          <p className="text-stage-line max-w-[26ch] text-pretty opacity-90">{card.line}</p>
        </div>
      </div>
      <Logo dataHook="stage-logo" data-ink={card.ink === "white" ? "white" : "black"} className="absolute bottom-10 left-12 h-9 w-auto" />
    </div>
  );
}
