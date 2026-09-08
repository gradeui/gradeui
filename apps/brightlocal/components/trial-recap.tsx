"use client";

/**
 * The trial recap (Ali, 10 Sep): shown when you switch to the trial
 * persona. "N days left, here is what the trial has done for you", from
 * the same rows as every page, then what stays and what stops, and the
 * plan in the site's pricing style (price in black, action in green).
 * For the lapsed persona it becomes the win-back: what has happened
 * since the trial ended, and an offer to come back.
 *
 * ASSUMPTION (for Ali): the plan and price are the site's Grow plan,
 * $49 USD a month billed annually (brightlocal.com/pricing, 10 Sep 2026).
 * The win-back offer ("first month half price") is a proposal, not a
 * BrightLocal offer; nothing on the site names one.
 */

import * as React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@brightlocal/ui-components/dialog";
import { Button } from "@brightlocal/ui-components/button";
import { Check, X, ArrowRight } from "@brightlocal/icons";
import { usePersona } from "@/lib/demo";
import { useLocationKey } from "@/lib/location";
import { statsFor, reviewsFor } from "@/lib/reviews-data";
import { BeaconBadge } from "@/components/review-summary";
import { CalendarSchedule, HandWave } from "@brightlocal/illustrations";

const PLAN = { name: "Grow", price: "$49", per: "USD / mo, billed annually" };

export function TrialRecapModal() {
  const persona = usePersona();
  const location = useLocationKey();
  const [open, setOpen] = React.useState(false);
  const lastId = React.useRef<string | null>(null);
  // Opens on a switch INTO a trial or lapsed persona (and on first load
  // with one), once per switch.
  React.useEffect(() => {
    if (lastId.current === persona.id) return;
    lastId.current = persona.id;
    setOpen(Boolean(persona.trial || persona.lapsed));
  }, [persona.id, persona.trial, persona.lapsed]);
  if (!persona.trial && !persona.lapsed) return null;

  const stats = statsFor(location, persona);
  const reviews = reviewsFor(location, persona);
  const lapsed = persona.lapsed;
  const since = lapsed ? reviews.filter((r) => r.daysAgo <= lapsed.daysAgo) : [];
  const sinceWaiting = since.filter((r) => r.status === "needs").length;
  const fiveStar = reviews.filter((r) => r.rating === 5).length;

  const title = lapsed ? `Your free trial ended ${lapsed.daysAgo} days ago` : `${persona.trial!.daysLeft} days left on your free trial`;
  const headline = lapsed
    ? since.length > 0
      ? `${since.length} new ${since.length === 1 ? "review has" : "reviews have"} arrived since, and ${sinceWaiting === since.length ? "none of them" : `${since.length - sinceWaiting} of them`} ${sinceWaiting === since.length ? "have" : "has"} had a reply.`
      : "Your reviews are still out there, and nobody is watching them."
    : `So far the trial has found your ${stats.total} Google ${stats.total === 1 ? "review" : "reviews"}, ${fiveStar} of them five stars.`;
  const during = stats.total - since.length;
  const got = lapsed
    ? [
        during > 0 ? `${during} reviews found on Google during the trial, rating ${stats.rating}` : "Google Business Profile connected during the trial",
        `${since.length} arrived after it ended, ${sinceWaiting} still waiting for a reply`,
        "Monitoring stopped the day the trial did",
      ]
    : [
        `${stats.total} reviews pulled in from Google, rating ${stats.rating}`,
        `${stats.needReply} waiting for a reply, ${stats.replied} answered`,
        `${persona.trial!.credits} free auto-replies still unused`,
      ];
  const keeps = ["Every review from Google, Facebook and 80+ review sites in one inbox", "Replies to Google and Facebook without leaving BrightLocal", "Review requests by email, SMS and QR code", "Auto-reply rules for five-star Google reviews"];
  const stops = ["New reviews stop arriving here", "Auto-replies and campaigns pause", "The showcase on your website goes blank"];
  // Calendar for the countdown, a wave for the welcome back (not Globey, he is everywhere already).
  const Art = lapsed ? HandWave : CalendarSchedule;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent dataHook="trial-recap" className="flex max-h-[90vh] w-[min(96vw,1040px)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <div className="flex items-start justify-between gap-6 border-b px-8 py-6">
          <div className="flex items-center gap-4">
            <Art className="size-16 shrink-0" />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <BeaconBadge beta dataHook="trial-recap-badge" />
                <span className="text-label-sm text-muted-foreground">{persona.accountLabel}</span>
              </div>
              <DialogTitle className="text-heading-page font-sans leading-tight text-balance">{title}</DialogTitle>
            </div>
          </div>
        </div>
        {/* Content left, the plan up the right (Ali, 10 Sep: "a better read,
            then simply stack on mobile"). The plan panel is black with white
            text, the site's pricing colours reversed for weight. */}
        <div className="grid gap-0 overflow-y-auto lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-8 px-8 py-8">
          <DialogDescription className="sr-only">{headline}</DialogDescription>
          <p className="text-metric font-display max-w-[34ch] text-balance">{headline}</p>
          <div className="grid gap-8">
            <div className="flex flex-col gap-3">
              <p className="text-heading-subsection">{lapsed ? "Since the trial ended" : "What the trial has got you"}</p>
              <ul className="flex flex-col gap-2">
                {got.map((g) => (
                  <li key={g} className="flex gap-2 text-body"><Check className="mt-1 size-4 shrink-0 text-[var(--ds-tailwind-colors-green-500)]" />{g}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-heading-subsection">{lapsed ? "What you are missing" : "What stops when the trial ends"}</p>
              <ul className="flex flex-col gap-2">
                {stops.map((g) => (
                  <li key={g} className="flex gap-2 text-body text-muted-foreground"><X className="mt-1 size-4 shrink-0" />{g}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
          <div className="flex flex-col justify-between gap-8 bg-[var(--ds-tailwind-colors-neutral-950)] px-8 py-8 text-[var(--ds-tailwind-colors-base-white)]" data-hook="trial-recap-plan">
            <div className="flex flex-col gap-2">
              <p className="text-label-sm font-semibold uppercase tracking-wide">{PLAN.name}</p>
              <p className="flex items-baseline gap-2">
                <span className="text-display font-display leading-none">{PLAN.price}</span>
                <span className="text-body-sm text-[var(--ds-tailwind-colors-neutral-400)]">{PLAN.per}</span>
              </p>
              {lapsed ? (
                <span className="inline-flex w-fit items-center rounded-full bg-[var(--ds-tailwind-colors-green-500)] px-3 py-1 text-label-sm font-semibold text-[var(--ds-tailwind-colors-neutral-950)]">Come back this week: first month half price</span>
              ) : (
                <span className="inline-flex w-fit items-center rounded-full bg-[var(--ds-tailwind-colors-green-500)] px-2.5 py-0.5 text-label-sm font-semibold text-[var(--ds-tailwind-colors-neutral-950)]">Saving 21% on annual</span>
              )}
              <ul className="mt-2 flex flex-col gap-1">
                {keeps.map((k) => (
                  <li key={k} className="flex gap-2 text-body-sm"><Check className="mt-0.5 size-3.5 shrink-0" />{k}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="primary" dataHook="trial-recap-cta" onClick={() => setOpen(false)}>
                {lapsed ? "Pick up where you left off" : "Keep everything"}
                <ArrowRight className="size-4" />
              </Button>
              <Button variant="outline" dataHook="trial-recap-later" className="border-[var(--ds-tailwind-colors-neutral-600)] bg-transparent text-[var(--ds-tailwind-colors-base-white)] hover:bg-[var(--ds-tailwind-colors-neutral-800)] hover:text-[var(--ds-tailwind-colors-base-white)]" onClick={() => setOpen(false)}>
                {lapsed ? "Just looking" : "Remind me later"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
