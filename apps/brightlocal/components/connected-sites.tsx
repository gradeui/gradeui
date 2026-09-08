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
import { Check, GoogleOriginal, FacebookOriginal, YelpOriginal } from "@brightlocal/icons";

// The same stand-in the Manager draws (no TripAdvisor mark in @brightlocal/icons yet).
function TripAdvisorMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false" data-ds-standin="brand-mark">
      <path d="M12 4.4c2.2 0 4.1 1 5.3 2.5H6.7C7.9 5.4 9.8 4.4 12 4.4Z" fill="#00AF87" />
      <circle cx="7.2" cy="13.1" r="5.1" fill="#fff" stroke="#00AF87" strokeWidth="1.8" />
      <circle cx="16.8" cy="13.1" r="5.1" fill="#fff" stroke="#00AF87" strokeWidth="1.8" />
      <circle cx="7.2" cy="13.1" r="2.1" fill="#000" />
      <circle cx="16.8" cy="13.1" r="2.1" fill="#000" />
    </svg>
  );
}

const MARK: Record<string, React.ComponentType<{ className?: string }>> = { google: GoogleOriginal, facebook: FacebookOriginal, tripadvisor: TripAdvisorMark, yelp: YelpOriginal };

const REPORT_SETTINGS = "screen:dmtkj124xagqa";
const NEXT_SITES = [
  { id: "facebook", name: "Facebook", why: "Recommendations, and you can reply from here" },
  { id: "tripadvisor", name: "TripAdvisor", why: "Where visitors compare you" },
  { id: "yelp", name: "Yelp", why: "Still read by a lot of people" },
];

export function ConnectedSites({ connected }: { connected: { id: string; name: string; count: number }[] }) {
  const ids = new Set(connected.map((c) => c.id));
  const next = NEXT_SITES.filter((s) => !ids.has(s.id));
  return (
    <div className="flex flex-col divide-y" data-hook="connected-sites">
      {connected.map((c) => {
        const Mark = MARK[c.id];
        return (
          <div key={c.id} className="flex items-center justify-between gap-4 py-2.5">
            <span className="flex min-w-0 items-center gap-2.5 text-sm">
              {Mark ? <Mark className="size-4 shrink-0" /> : null}
              <span className="font-medium">{c.name}</span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Check className="size-3" />Connected</span>
            </span>
            <span className="shrink-0 text-sm tabular-nums">{c.count.toLocaleString("en-GB")} {c.count === 1 ? "review" : "reviews"}</span>
          </div>
        );
      })}
      {next.map((s) => {
        const Mark = MARK[s.id];
        return (
          <div key={s.id} className="flex items-center justify-between gap-4 py-2.5">
            <span className="flex min-w-0 items-center gap-2.5 text-sm">
              {Mark ? <Mark className="size-4 shrink-0 opacity-60 grayscale" /> : null}
              <span className="flex min-w-0 flex-col">
                <span className="font-medium">{s.name}</span>
                <span className="truncate text-xs text-muted-foreground">{s.why}</span>
              </span>
            </span>
            <span className="shrink-0" data-grade-goto={REPORT_SETTINGS}>
              <Button variant="outline" size="sm" dataHook={`connect-${s.id}`}>Connect</Button>
            </span>
          </div>
        );
      })}
      <p className="pt-3 text-xs text-muted-foreground">
        And 80+ more review sites. Every one you connect lands in the same inbox, and this chart becomes worth reading.
      </p>
    </div>
  );
}
