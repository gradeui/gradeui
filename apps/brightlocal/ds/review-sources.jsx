// @brightlocal/review-sources — one description of every review site.
//
// REVIEW MANAGER IS THE DEFACTO ONE (Ali, 7 Sep). Its SOURCES map is the model
// the rest of the product should follow, so it moves here rather than being
// copied a third time. Review Tracker was drawing coloured chart swatches in
// its source dropdown instead of brand marks, which made the same list look
// like two different lists depending on which page you were on.
//
// WHAT A SOURCE CARRIES:
//   name        as the site writes it, "Yahoo! Local" not "Yahoo"
//   Icon        the mark to draw
//   hasMark     false when there is no real brand mark and Icon is a stand-in
//               or a generic globe, so the caller can mute it
//   isStandIn   true when the mark is hand-drawn rather than the site's own
//   ratingKind  "star" or "recommendation". Facebook is recommendations, not
//               stars, which is why any code that assumes a 1-5 value has to
//               ask here first (Ali, 7 Sep: "as this also splits Facebook
//               recommendations").
//
// ONLY FIVE REAL MARKS EXIST in @brightlocal/icons: Google, Facebook, Yelp,
// Apple and Trustpilot. TripAdvisor is drawn below because the package has
// none; Yahoo! Local and Bing Places fall back to a muted globe.
import * as React from "react";
import {
  GoogleOriginal,
  FacebookOriginal,
  YelpOriginal,
  AppleOriginal,
  TrustpilotOriginal,
  Globe,
} from "@brightlocal/icons";

function TripAdvisorMark({ size = 16, className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
      data-ds-standin="brand-mark"
    >
      <path d="M12 4.4c2.2 0 4.1 1 5.3 2.5H6.7C7.9 5.4 9.8 4.4 12 4.4Z" fill="#00AF87" />
      <circle cx="7.2" cy="13.1" r="5.1" fill="#fff" stroke="#00AF87" strokeWidth="1.8" />
      <circle cx="16.8" cy="13.1" r="5.1" fill="#fff" stroke="#00AF87" strokeWidth="1.8" />
      <circle cx="7.2" cy="13.1" r="2.1" fill="#000" />
      <circle cx="16.8" cy="13.1" r="2.1" fill="#000" />
    </svg>
  );
}

export const REVIEW_SOURCES = {
  google: { name: "Google", Icon: GoogleOriginal, hasMark: true, ratingKind: "star" },
  facebook: { name: "Facebook", Icon: FacebookOriginal, hasMark: true, ratingKind: "recommendation" },
  yelp: { name: "Yelp", Icon: YelpOriginal, hasMark: true, ratingKind: "star" },
  tripadvisor: { name: "TripAdvisor", Icon: TripAdvisorMark, hasMark: true, isStandIn: true, ratingKind: "star" },
  trustpilot: { name: "Trustpilot", Icon: TrustpilotOriginal, hasMark: true, ratingKind: "star" },
  apple: { name: "Apple Maps", Icon: AppleOriginal, hasMark: true, ratingKind: "star" },
  yahoo: { name: "Yahoo! Local", Icon: Globe, hasMark: false, ratingKind: "star" },
  bing: { name: "Bing Places", Icon: Globe, hasMark: false, ratingKind: "star" },
};

// Muted when the mark is not the site's own, so a generic globe never reads as
// a brand. Same rule Review Manager already applied.
export function SourceMark({ source, size = 16, className = "" }) {
  const entry = typeof source === "string" ? REVIEW_SOURCES[source] : source;
  if (!entry) return null;
  const Icon = entry.Icon;
  return (
    <Icon
      size={size}
      className={`size-4 shrink-0 ${entry.hasMark ? "" : "text-muted-foreground"} ${className}`}
    />
  );
}
