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

export default function CardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const card = cardFor(slug);
  if (!card) {
    return (
      <div className="flex min-h-screen flex-col gap-3 p-10">
        <p className="text-heading-page">Cards</p>
        <ul className="flex flex-col gap-1">
          {CARDS.map((c) => (
            <li key={c.slug}><Link className="underline underline-offset-4" href={`/cards/${c.slug}`}>{c.slug}</Link></li>
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
      className="flex min-h-screen w-full items-center justify-center"
      style={{ background: card.surface, color: ink }}
    >
      <div className="flex w-[min(92vw,1400px)] items-center gap-16">
        <Art className="size-[28vh] shrink-0" />
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <span className="rounded-sm border px-2 py-0.5 text-label-sm" style={{ borderColor: ink }}>Beacon <span className="ml-1 opacity-70">Beta</span></span>
            <span className="text-label-sm font-semibold uppercase tracking-widest opacity-80">{card.kicker}</span>
          </div>
          <h1 className="font-display text-[7vh] leading-[1.05] tracking-tight text-balance">{card.title}</h1>
          <p className="max-w-[28ch] text-[2.6vh] leading-snug text-pretty opacity-90">{card.line}</p>
        </div>
      </div>
    </main>
  );
}
