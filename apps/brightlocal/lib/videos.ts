/**
 * The video library behind /meta/videos.
 *
 * TWO HALVES, ON PURPOSE. Everything a machine can know about a video comes
 * from the recording and lands in `videos.generated.ts`: how long it runs,
 * where each section starts, every subtitle cue and its timing. Everything a
 * person decides lives HERE and is keyed by slug, so re-recording a video and
 * re-running `scripts/publish-videos.mjs` never overwrites the writing.
 *
 * A section's own name and one-liner come from its cut-scene card, which is
 * the card the video actually shows, so the page and the video can never
 * disagree. Override one here only if the card is wrong.
 */

import { RECORDED, type RecordedChapter, type RecordedCue } from "@/lib/videos.generated";

export type VideoTag =
  | "Overview"
  | "Personas"
  | "Insights"
  | "Sections"
  | "First run"
  | "Trial"
  | "Multi-location";

export interface VideoEntry {
  slug: string;
  title: string;
  /** One or two sentences. The grid card and the player page both show it. */
  description: string;
  tags: VideoTag[];
  /** Lower sorts first in the grid and drives previous/next. */
  order: number;
  /** Per-section overrides, keyed by the section id. Rarely needed. */
  sections?: Record<string, { title?: string; description?: string }>;
}

const ENTRIES: VideoEntry[] = [
  {
    slug: "insights-overview",
    title: "Contextual Insights and Actions",
    description:
      "The whole idea in one pass. What the layer says on each page, how a finding opens into the thing that fixes it, and what changes when the account is a trial, a lapsed trial or a brand with three branches.",
    tags: ["Overview", "Insights", "Personas"],
    order: 1,
  },
  {
    slug: "day-one-to-habit",
    title: "Day one to a habit",
    description:
      "An account that has just signed up. Nothing connected, nothing in, and the product still has to say something useful. Then the same account once reviews start arriving.",
    tags: ["First run", "Personas"],
    order: 2,
  },
  {
    slug: "the-trial",
    title: "Three days left",
    description:
      "Google connected, four reviews in, nobody answered. What the trial shows to earn its keep, and what it says on the day it ends.",
    tags: ["Trial", "Personas"],
    order: 3,
  },
  {
    slug: "the-gap",
    title: "Hove is not Brighton",
    description:
      "A brand with three branches, where the lifetime rating hides what the last thirty days are saying. The plan comes out about one branch, not the brand.",
    tags: ["Multi-location", "Personas"],
    order: 4,
  },
  {
    slug: "insights-walkthrough",
    title: "Every section, end to end",
    description:
      "The Reviews hub, then Manager, Tracker, Builder and Showcase in order, with the insight each one leads on.",
    tags: ["Sections", "Overview"],
    order: 5,
  },
  {
    slug: "insights-popovers",
    title: "Every dialog",
    description:
      "The Tell me more dialog on each page, one after another, so the whole set can be read side by side.",
    tags: ["Insights", "Sections"],
    order: 6,
  },
];

export interface VideoSection extends RecordedChapter {
  /** Minutes and seconds, for the chapter rail. */
  stamp: string;
}

// `sections` means two different things: the sparse OVERRIDES an author may
// write on an entry, and the resolved list a page renders. Omit the override
// shape here rather than collide with it.
export interface Video extends Omit<VideoEntry, "sections"> {
  duration: number;
  /** "7:50" */
  length: string;
  sections: VideoSection[];
  transcript: RecordedCue[];
  src: string;
  poster: string;
  captions: string;
  sprite: string;
  thumbs: string;
  tileW: number;
  tileH: number;
}

export function stamp(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

/** Every published video, in editorial order. A slug with no recording yet is
 *  left out rather than rendered as a broken card. */
export const VIDEOS: Video[] = ENTRIES.flatMap((entry) => {
  const rec = RECORDED.find((r) => r.slug === entry.slug);
  if (!rec) return [];
  const sections = rec.chapters.map((c) => {
    const over = entry.sections?.[c.id];
    return { ...c, title: over?.title ?? c.title, description: over?.description ?? c.description, stamp: stamp(c.t) };
  });
  return [{
    ...entry,
    duration: rec.duration,
    length: stamp(rec.duration),
    sections,
    transcript: rec.transcript,
    src: `/videos/${entry.slug}.mp4`,
    poster: `/videos/${entry.slug}.poster.jpg`,
    captions: `/videos/${entry.slug}.vtt`,
    sprite: `/videos/${entry.slug}.sprite.jpg`,
    thumbs: `/videos/${entry.slug}.thumbs.vtt`,
    tileW: rec.tileW,
    tileH: rec.tileH,
  }];
}).sort((a, b) => a.order - b.order);

export const VIDEO_TAGS: VideoTag[] = (() => {
  const seen = new Set<VideoTag>();
  for (const v of VIDEOS) for (const t of v.tags) seen.add(t);
  return [...seen].sort();
})();

export const videoBySlug = (slug: string) => VIDEOS.find((v) => v.slug === slug) ?? null;

/** The one before and the one after, for the player's ends. */
export function neighbours(slug: string) {
  const i = VIDEOS.findIndex((v) => v.slug === slug);
  return { prev: i > 0 ? VIDEOS[i - 1] : null, next: i >= 0 && i < VIDEOS.length - 1 ? VIDEOS[i + 1] : null };
}

/** Every section of every video, for a "jump to any section" view. */
export const ALL_SECTIONS = VIDEOS.flatMap((v) => v.sections.map((s) => ({ ...s, video: v })));
