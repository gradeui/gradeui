"use client";

/**
 * A cut-scene card, full frame, 16:9. The video recorder navigates here
 * between persona scenes; the same frame is a Figma slide. No shell, no
 * chrome: the palette, the illustration, the badge, a title and a line.
 */

import { use } from "react";
import { cardFor, CARDS } from "@/lib/cards";
import { pickIllustration } from "@/lib/illustrations";
import { BeaconBadge } from "@/components/review-summary";
import Link from "next/link";
import { Logo } from "@brightlocal/ui-components";

export default function CardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const card = cardFor(slug);
  if (!card) {
    return (
      <div className="flex min-h-screen flex-col gap-3 p-10">
        <p className="text-heading-page">Cards</p>
        <ul className="flex flex-col gap-1">
          {CARDS.map((c) => (
            <li key={c.slug}><Link className="underline underline-offset-4" href={`/meta/cards/${c.slug}`}>{c.slug}</Link></li>
          ))}
        </ul>
      </div>
    );
  }
  const Art = pickIllustration(card.art);
  const ink = card.ink === "white" ? "var(--ds-tailwind-colors-base-white)" : "var(--ds-tailwind-colors-neutral-950)";
  return (
    <main
      data-hook={`card-${card.slug}`}
      className="relative flex min-h-screen w-full items-center justify-center"
      style={{ background: card.surface, color: ink }}
    >
      <div className="flex w-[min(92vw,1400px)] items-center gap-16">
        <Art className="size-[24rem] shrink-0" />
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <span className="rounded-md border-2 px-3 py-1 text-[1.5rem] font-semibold" style={{ borderColor: ink }}>Beacon <span className="ml-2 opacity-70">Beta</span></span>
            <span className="text-stage-kicker opacity-80">{card.kicker}</span>
          </div>
          <h1 className="text-stage-title text-balance">{card.title}</h1>
          <p className="text-stage-line max-w-[26ch] text-pretty opacity-90">{card.line}</p>
        </div>
      </div>
      <Logo dataHook="stage-logo" data-ink={card.ink === "white" ? "white" : "black"} className="absolute bottom-10 left-12 h-9 w-auto" />
    </main>
  );
}
