/**
 * Cut-scene cards (Ali, 12 Sep): full-frame 16:9 title cards the video
 * recorder navigates to between persona cut scenes, and the same frames
 * for Figma Slides. One per persona, one per section, on the site's
 * full-strength palette (the "super bright" block).
 */

import { PERSONAS } from "@/lib/personas";

export interface CardSpec {
  slug: string;
  kicker: string;
  title: string;
  line: string;
  surface: string;
  ink: "black" | "white";
  art: string[];
}

const PERSONA_CARDS: Record<string, Omit<CardSpec, "slug">> = {
  empty: { kicker: "Day one", title: "Signed up, looking around", line: "Nothing connected, nothing in. What does the product say to someone with no reviews?", surface: "var(--ds-tailwind-colors-sky-400)", ink: "black", art: ["welcome", "hello"] },
  starter: { kicker: "Three days left", title: "On a free trial", line: "Google connected, four reviews in, nobody answered. The trial has to earn its keep.", surface: "var(--ds-tailwind-colors-yellow-400)", ink: "black", art: ["trial", "days"] },
  engaged: { kicker: "Month eight", title: "A single location, engaged", line: "Campaigns running, replies flowing, and a rating that is hard to move.", surface: "var(--ds-tailwind-colors-green-500)", ink: "black", art: ["growth", "grow"] },
  multi: { kicker: "Three branches", title: "A multi-location brand", line: "Customers compare Hove with Brighton, and Beacon says so.", surface: "var(--ds-tailwind-colors-violet-400)", ink: "black", art: ["location", "local"] },
  agency: { kicker: "Every client", title: "An agency", line: "Five locations under one account, switching between them.", surface: "var(--ds-tailwind-colors-neutral-950)", ink: "white", art: ["help", "support"] },
  lapsed: { kicker: "Nine days after", title: "The trial ended", line: "Reviews still arriving, nobody watching. How do we bring them back?", surface: "var(--ds-tailwind-colors-yellow-400)", ink: "black", art: ["welcome", "back"] },
};

const SECTION_CARDS: Record<string, Omit<CardSpec, "slug">> = {
  beacon: { kicker: "Overview", title: "Beacon", line: "Like someone sat next to you, telling you what to do about your reviews.", surface: "var(--ds-tailwind-colors-neutral-950)", ink: "white", art: ["review", "stars"] },
  hub: { kicker: "Section", title: "The Reviews hub", line: "Four cards, one trend each, and the first thing to do.", surface: "var(--ds-tailwind-colors-green-500)", ink: "black", art: ["review", "stars"] },
  manager: { kicker: "Section", title: "Review Manager", line: "Every review in one inbox, and the plan for the ones waiting.", surface: "var(--ds-tailwind-colors-violet-400)", ink: "black", art: ["reply", "answer"] },
  tracker: { kicker: "Section", title: "Review Tracker", line: "The trend across every review site, and what moved it.", surface: "var(--ds-tailwind-colors-sky-400)", ink: "black", art: ["velocity", "spike"] },
  builder: { kicker: "Section", title: "Review Builder", line: "Ask by email, SMS and a code by the till.", surface: "var(--ds-tailwind-colors-yellow-400)", ink: "black", art: ["campaign", "email"] },
  showcase: { kicker: "Section", title: "Review Showcase", line: "Your best reviews on your own website, updating themselves.", surface: "var(--ds-tailwind-colors-green-500)", ink: "black", art: ["website", "widget"] },
  roadmap: { kicker: "Section", title: "Insights & Actions", line: "The next three months, one stage at a time.", surface: "var(--ds-tailwind-colors-sky-400)", ink: "black", art: ["habit", "win"] },
  account: { kicker: "Section", title: "Subscription and pricing", line: "What the trial got you, what stops, and the way up.", surface: "var(--ds-tailwind-colors-neutral-950)", ink: "white", art: ["price", "offer"] },
  tones: { kicker: "Section", title: "Tones and dark", line: "Neutral, tinted, families, super bright, and the dark side of all of it.", surface: "var(--ds-tailwind-colors-violet-400)", ink: "black", art: ["idea", "tip"] },
  walkthrough: { kicker: "One location, one month", title: "What Beacon says, page by page", line: "Minus 1 Studios, eight months in. The same numbers on every screen.", surface: "var(--ds-tailwind-colors-green-500)", ink: "black", art: ["review", "stars"] },
  end: { kicker: "Beacon", title: "Someone sat next to you", line: "Telling you what to do about your reviews, in your own numbers.", surface: "var(--ds-tailwind-colors-neutral-950)", ink: "white", art: ["help", "support"] },
};

export const CARDS: CardSpec[] = [
  ...Object.entries(SECTION_CARDS).map(([slug, c]) => ({ slug, ...c })),
  ...PERSONAS.map((p) => ({ slug: `persona-${p.id}`, ...(PERSONA_CARDS[p.id] ?? { kicker: "Persona", title: p.label, line: p.description, surface: "var(--ds-tailwind-colors-neutral-100)", ink: "black" as const, art: ["review"] }) })),
];

export function cardFor(slug: string): CardSpec | undefined {
  return CARDS.find((c) => c.slug === slug);
}
