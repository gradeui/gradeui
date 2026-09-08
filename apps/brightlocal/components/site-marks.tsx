"use client";

/** The review-site brand marks, shared by the Tracker's connection list
 *  and the early-days review list. TripAdvisor is the Manager's stand-in
 *  (no mark in @brightlocal/icons yet). */

import { GoogleOriginal, FacebookOriginal, YelpOriginal } from "@brightlocal/icons";

export function TripAdvisorMark({ className }: { className?: string }) {
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

export const SITE_MARK: Record<string, React.ComponentType<{ className?: string }>> = {
  google: GoogleOriginal,
  facebook: FacebookOriginal,
  tripadvisor: TripAdvisorMark,
  yelp: YelpOriginal,
};

export const SITE_LABEL: Record<string, string> = { google: "Google", facebook: "Facebook", tripadvisor: "TripAdvisor", yelp: "Yelp", trustpilot: "Trustpilot", yahoo: "Yahoo", apple: "Apple Maps", bing: "Bing" };
