"use client";

/**
 * The video library (Ali, 10 Sep: "let's build a youtube page for your
 * insights videos. A grid of videos, with title, desc"). Unlisted, like the
 * rest of /meta: nothing links here from the product.
 *
 * A card is a poster, a title, a description and its tags. The tag row above
 * filters, and a tag on a card filters to it, so browsing works either way.
 */

import * as React from "react";
import Link from "next/link";
import { Play, Clock } from "@brightlocal/icons";
import { VIDEOS, VIDEO_TAGS, type VideoTag } from "@/lib/videos";

export default function VideoLibraryPage() {
  const [tag, setTag] = React.useState<VideoTag | null>(null);
  const shown = tag ? VIDEOS.filter((v) => v.tags.includes(tag)) : VIDEOS;
  const total = VIDEOS.reduce((a, v) => a + v.duration, 0);
  const mins = Math.round(total / 60);

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-heading-page font-display">Insights, on video</h1>
        <p className="text-body text-muted-foreground max-w-[70ch] text-pretty">
          Every walkthrough of Reviews: Contextual Insights and Actions. {VIDEOS.length} videos,
          about {mins} minutes in all. Each one has a subtitle track, a transcript you can click,
          and sections you can jump between.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2" data-hook="video-tags">
        <TagChip label="Everything" active={tag === null} onClick={() => setTag(null)} count={VIDEOS.length} />
        {VIDEO_TAGS.map((t) => (
          <TagChip
            key={t}
            label={t}
            active={tag === t}
            onClick={() => setTag(tag === t ? null : t)}
            count={VIDEOS.filter((v) => v.tags.includes(t)).length}
          />
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-body text-muted-foreground">Nothing tagged {tag}.</p>
      ) : (
        <ul className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3" data-hook="video-grid">
          {shown.map((v) => (
            <li key={v.slug}>
              <Link href={`/meta/videos/${v.slug}`} className="group flex flex-col gap-3" data-hook={`video-card-${v.slug}`}>
                <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.poster}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-md bg-black/80 px-1.5 py-0.5 text-label-sm font-semibold text-white tabular-nums">
                    <Clock className="size-3" />
                    {v.length}
                  </span>
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="flex size-14 items-center justify-center rounded-full bg-white/95 shadow-lg">
                      <Play className="size-6 text-[var(--ds-tailwind-colors-neutral-950)]" />
                    </span>
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <h2 className="text-heading-subsection font-display text-balance group-hover:underline">{v.title}</h2>
                  <p className="text-body-sm text-muted-foreground line-clamp-3 text-pretty">{v.description}</p>
                  <p className="text-label-sm text-muted-foreground">
                    {v.sections.length} sections
                  </p>
                </div>
              </Link>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {v.tags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTag(t)}
                    className="hover:bg-accent rounded-full border px-2 py-0.5 text-label-sm transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TagChip({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-hook={`video-tag-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className={`rounded-full border px-3 py-1 text-label-sm font-semibold transition-colors ${
        active
          ? "border-[var(--ds-tailwind-colors-neutral-950)] bg-[var(--ds-tailwind-colors-neutral-950)] text-[var(--ds-tailwind-colors-base-white)]"
          : "hover:bg-accent"
      }`}
    >
      {label}
      <span className={`ml-1.5 tabular-nums ${active ? "opacity-70" : "text-muted-foreground"}`}>{count}</span>
    </button>
  );
}
