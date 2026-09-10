/**
 * One video: the player, its sections, its transcript, and the way to the
 * next one. Server component so the title, description and section list are
 * in the HTML; the player itself is the client half.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "@brightlocal/icons";
import { VideoPlayer } from "@/components/video-player";
import { VIDEOS, neighbours, videoBySlug } from "@/lib/videos";

export function generateStaticParams() {
  return VIDEOS.map((v) => ({ slug: v.slug }));
}

export default async function VideoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const video = videoBySlug(slug);
  if (!video) notFound();
  const { prev, next } = neighbours(slug);

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-3">
        <Link href="/meta/videos" className="text-body-sm text-muted-foreground inline-flex w-fit items-center gap-1 hover:underline">
          <ChevronLeft className="size-4" />
          All videos
        </Link>
        <h1 className="text-heading-page font-display text-balance">{video.title}</h1>
        <p className="text-body max-w-[75ch] text-pretty">{video.description}</p>
        <div className="text-body-sm text-muted-foreground flex flex-wrap items-center gap-2">
          <span className="tabular-nums">{video.length}</span>
          <span aria-hidden>·</span>
          <span>{video.sections.length} sections</span>
          <span aria-hidden>·</span>
          <span>{video.transcript.length} lines of transcript</span>
          {video.tags.map((t) => (
            <span key={t} className="rounded-full border px-2 py-0.5 text-label-sm">{t}</span>
          ))}
        </div>
      </div>

      <VideoPlayer video={video} prev={prev} next={next} />
    </div>
  );
}
