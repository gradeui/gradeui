"use client";

/**
 * What the Tracker shows in place of the Sources donut when only one
 * review site is connected (Ali, 10 Sep: "a donut chart for just one
 * type is annoying, what's the best practice?"). A single-slice donut
 * carries no information, so the panel becomes the connection list: the
 * site that is connected with its count, the next sites to connect, and
 * the long tail, which is the site's own pitch ("Bring all your reviews
 * into one place", "80+ sites"). The donut comes back at two sites.
 */

import { Button } from "@brightlocal/ui-components/button";
import { Check, Plus } from "@brightlocal/icons";

const REPORT_SETTINGS = "screen:dmtkj124xagqa";
const NEXT_SITES = [
  { id: "facebook", name: "Facebook", why: "recommendations, and you can reply from here" },
  { id: "tripadvisor", name: "TripAdvisor", why: "where visitors compare you" },
  { id: "yelp", name: "Yelp", why: "still read by a lot of people" },
];

export function ConnectedSites({ connected }: { connected: { id: string; name: string; count: number }[] }) {
  const ids = new Set(connected.map((c) => c.id));
  const next = NEXT_SITES.filter((s) => !ids.has(s.id));
  return (
    <div className="flex flex-col divide-y" data-hook="connected-sites">
      {connected.map((c) => (
        <div key={c.id} className="flex items-center justify-between gap-4 py-2.5">
          <span className="flex items-center gap-2 text-sm">
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-[var(--ds-tailwind-colors-green-200)]"><Check className="size-3" /></span>
            {c.name}
            <span className="text-muted-foreground">connected</span>
          </span>
          <span className="text-sm tabular-nums">{c.count.toLocaleString("en-GB")} {c.count === 1 ? "review" : "reviews"}</span>
        </div>
      ))}
      {next.map((s) => (
        <div key={s.id} className="flex items-center justify-between gap-4 py-2.5">
          <span className="flex items-center gap-2 text-sm">
            <span className="inline-flex size-5 items-center justify-center rounded-full border border-dashed"><Plus className="size-3" /></span>
            {s.name}
            <span className="text-muted-foreground hidden lg:inline">{s.why}</span>
          </span>
          <span data-grade-goto={REPORT_SETTINGS}>
            <Button variant="outline" size="sm" dataHook={`connect-${s.id}`}>Connect</Button>
          </span>
        </div>
      ))}
      <p className="pt-3 text-xs text-muted-foreground">
        And 80+ more review sites. Every one you connect lands in the same inbox, and this chart becomes worth reading.
      </p>
    </div>
  );
}
