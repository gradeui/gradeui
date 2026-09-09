"use client";

/**
 * The deck: the walkthrough story as printable pages (Ali, 12 Sep). A4
 * landscape, one page per screenful, cut-scene cards as the section
 * headers. Rendered in the browser so the charts are the real ones, then
 * turned into a PDF by apps/brightlocal/scripts/render-pdf.mjs.
 *
 *   /meta/deck?persona=multi&location=harbour-co-hove
 */

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { DATASETS } from "@brightlocal/data";
import { personaById } from "@/lib/personas";
import { statsFor } from "@/lib/reviews-data";
import { deckFor, type DeckPage } from "@/lib/deck";
import { DrillChart } from "@/components/review-summary";
import { CutSceneCard } from "@/components/cut-scene-card";
import { pickIllustration } from "@/lib/illustrations";

function Seg({ s }: { s: { kind: string; text: string } }) {
  if (s.kind === "text") return <>{s.text}</>;
  return <mark className="rounded-sm bg-[var(--ds-tailwind-colors-neutral-200)] px-1 font-semibold text-inherit">{s.text}</mark>;
}

function Page({ children, surface }: { children: React.ReactNode; surface?: string }) {
  // A4 landscape at 96dpi: 1123 x 794. Fixed, so the PDF never reflows.
  return (
    <section
      className="deck-page relative overflow-hidden"
      style={{ width: 1123, height: 794, background: surface ?? "var(--ds-tailwind-colors-base-white)" }}
    >
      {children}
    </section>
  );
}

function DeckBody() {
  const params = useSearchParams();
  const persona = personaById(params.get("persona") ?? "multi");
  const location = params.get("location") ?? persona.locations[persona.locations.length - 1] ?? "minus-one-studios";
  const stats = statsFor(location, persona);
  const name = (DATASETS as Record<string, { location?: { name?: string } }>)[location]?.location?.name ?? location;
  const pages = deckFor(persona, stats, name);
  return (
    <div className="flex flex-col items-center gap-6 bg-[var(--ds-tailwind-colors-neutral-200)] py-6 print:gap-0 print:bg-white print:py-0">
      {pages.map((p, i) => (
        <Page key={i} surface={p.kind === "card" ? p.card.surface : undefined}>
          {p.kind === "card" ? (
            <CutSceneCard card={p.card} />
          ) : p.kind === "fact" ? (
            <FactPage page={p} />
          ) : (
            <InsightPage page={p} stats={stats} />
          )}
        </Page>
      ))}
    </div>
  );
}

function FactPage({ page }: { page: Extract<DeckPage, { kind: "fact" }> }) {
  const Art = pickIllustration(page.art);
  return (
    <div className="flex h-full w-full items-center gap-16 bg-[var(--ds-tailwind-colors-yellow-100)] px-24">
      <div className="flex flex-col gap-5">
        <p className="text-stage-kicker opacity-70">Did you know</p>
        <p className="font-display text-[7rem] leading-none">{page.value}</p>
        <p className="text-stage-caption max-w-[22ch] text-balance">{page.text}</p>
        <p className="text-[1.25rem] italic opacity-70">*{page.source}</p>
        <p className="max-w-[46ch] text-[1.5rem] leading-snug text-pretty">{page.line}</p>
      </div>
      <div className="ml-auto shrink-0" aria-hidden><Art className="size-[18rem]" /></div>
    </div>
  );
}

function InsightPage({ page, stats }: { page: Extract<DeckPage, { kind: "insight" }>; stats: ReturnType<typeof statsFor> }) {
  const Art = pickIllustration(page.art);
  return (
    <div className="flex h-full w-full flex-col gap-8 px-24 py-16">
      <div className="flex items-start justify-between gap-8">
        <div className="flex flex-col gap-4">
          <p className="text-stage-kicker opacity-60">{page.eyebrow}</p>
          <h2 className="font-display max-w-[24ch] text-[3.5rem] leading-[1.08] tracking-tight text-balance">{page.headline}</h2>
        </div>
        <div className="shrink-0" aria-hidden><Art className="size-[9rem]" /></div>
      </div>
      {page.segments ? (
        <p className="max-w-[64ch] text-[1.6rem] leading-snug text-pretty">
          {page.segments.map((s, i) => <Seg key={i} s={s as { kind: string; text: string }} />)}
        </p>
      ) : null}
      {page.body ? <p className="max-w-[64ch] text-[1.5rem] leading-snug text-pretty opacity-80">{page.body}</p> : null}
      <div className="mt-auto flex items-end justify-between gap-12">
        {page.tiles ? (
          <dl className="flex gap-12">
            {page.tiles.map((t) => (
              <div key={t.label} className="flex flex-col">
                <dd className="font-display text-[3rem] leading-none">{t.value}</dd>
                <dt className="text-[1.15rem] opacity-60">{t.label}</dt>
              </div>
            ))}
          </dl>
        ) : <span />}
        {page.chart ? (
          <div className="w-[30rem] shrink-0 rounded-xl bg-[var(--ds-tailwind-colors-neutral-100)] p-5">
            <DrillChart stats={stats} kind={page.chart} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function DeckPage() {
  return (
    <React.Suspense fallback={null}>
      <DeckBody />
    </React.Suspense>
  );
}
