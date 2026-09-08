"use client";

/**
 * The empty persona's page top: the site's "Why it matters" band (pill,
 * headline, sentence, three sourced stats) and ONE action with a short
 * note, plus the three-step path so they always know where they are.
 * Replaces the Beacon strip on every Reviews page while there is nothing
 * for Beacon to say. Content: lib/first-run.
 */

import { Sparkles, ArrowRight, Check } from "@brightlocal/icons";
import { Button } from "@brightlocal/ui-components/button";
import { firstRunFor, FIRST_RUN_STEPS } from "@/lib/first-run";
import type { NuggetPage } from "@/lib/beacon-pages";

export function FirstRunBand({ page }: { page: NuggetPage }) {
  const fr = firstRunFor(page);
  return (
    <section data-hook={`first-run-${page}`} className="flex flex-col gap-8 rounded-[20px] border bg-[var(--ds-tailwind-colors-base-white)] px-8 py-8 lg:px-10">
      <div className="flex flex-col items-start gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-label-sm font-semibold uppercase tracking-wide">
          <Sparkles className="size-3.5 text-[var(--ds-tailwind-colors-green-500)]" />
          Why it matters
        </span>
        <h2 className="text-heading-page font-display max-w-[28ch] text-balance">{fr.headline}</h2>
        <p className="text-body max-w-[64ch] text-pretty">{fr.lede}</p>
      </div>
      <dl className="grid gap-8 lg:grid-cols-3">
        {fr.stats.map((st) => (
          <div key={st.value + st.source} className="flex flex-col gap-2 border-l-2 border-[var(--ds-tailwind-colors-green-500)] pl-5">
            <dt className="text-display font-display leading-none">{st.value}</dt>
            <dd className="text-body text-pretty">{st.text}</dd>
            <dd className="text-body-sm italic text-muted-foreground">*{st.source}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-4 border-t pt-6 lg:flex-row lg:items-center lg:justify-between">
        <ol className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {FIRST_RUN_STEPS.map((s) => (
            <li key={s.step} className={`flex items-center gap-2 text-body-sm ${s.step === fr.step ? "font-semibold" : "text-muted-foreground"}`}>
              <span className={`inline-flex size-5 items-center justify-center rounded-full border text-label-sm ${s.step === fr.step ? "border-foreground" : ""}`}>
                {s.step < fr.step ? <Check className="size-3" /> : s.step}
              </span>
              {s.label}
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-2 lg:items-end">
          <span data-grade-goto={fr.action.goto}>
            <Button variant="primary" dataHook={`first-run-${page}-cta`}>
              {fr.action.label}
              <ArrowRight className="size-4" />
            </Button>
          </span>
        </div>
      </div>
      <p className="text-body-sm text-muted-foreground -mt-4 max-w-[64ch] text-pretty">{fr.action.note}</p>
    </section>
  );
}
