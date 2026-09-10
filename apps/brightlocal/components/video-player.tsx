"use client";

/**
 * The player behind /meta/videos/<slug> (Ali, 10 Sep: "a video player that can
 * also have a track with thumbnails for previous and next sections", plus an
 * audio transcript on screen and points you can jump to).
 *
 * Four parts, and each one exists because it earns its place:
 *
 *  - The scrub bar is SEGMENTED BY SECTION, so the shape of the video is
 *    visible before you touch it, and hovering it shows the frame you would
 *    land on. That preview comes from a sprite sheet and a thumbnail VTT,
 *    which is how YouTube does it: one image request for the whole video
 *    rather than one per hover.
 *  - The section rail under the video is the previous and next thumbnails.
 *    The current section is marked, and each carries the one-line description
 *    off its own cut-scene card.
 *  - The transcript is the subtitle track again, as text. The active line
 *    highlights and scrolls itself into view, and clicking any line seeks.
 *  - Subtitles ride on a real <track>, so the browser's own caption control
 *    and any download of the file both work.
 *
 * Everything is keyboard reachable: space and k play, arrows seek, j and l
 * jump ten seconds, c toggles captions, f goes full screen.
 */

import * as React from "react";
import Link from "next/link";
import { Play, Pause, Volume2, VolumeX, Maximize2, ChevronLeft, ChevronRight, Subtitles } from "@brightlocal/icons";
import { Button } from "@brightlocal/ui-components/button";
import { stamp, type Video } from "@/lib/videos";

interface ThumbCue { t: number; end: number; x: number; y: number; w: number; h: number }

/** Parse the thumbnail VTT the publish script writes. It is small and the
 *  shape is fixed, so a regex beats pulling in a parser. */
function parseThumbs(text: string): ThumbCue[] {
  const out: ThumbCue[] = [];
  const re = /(\d\d):(\d\d):(\d\d)\.(\d\d\d) --> (\d\d):(\d\d):(\d\d)\.(\d\d\d)\n\S+#xywh=(\d+),(\d+),(\d+),(\d+)/g;
  for (const m of text.matchAll(re)) {
    out.push({
      t: +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000,
      end: +m[5] * 3600 + +m[6] * 60 + +m[7] + +m[8] / 1000,
      x: +m[9], y: +m[10], w: +m[11], h: +m[12],
    });
  }
  return out;
}

export function VideoPlayer({ video, prev, next }: { video: Video; prev: Video | null; next: Video | null }) {
  const ref = React.useRef<HTMLVideoElement>(null);
  const barRef = React.useRef<HTMLDivElement>(null);
  const transcriptRef = React.useRef<HTMLOListElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [t, setT] = React.useState(0);
  const [muted, setMuted] = React.useState(false);
  // OFF BY DEFAULT, and that is not an oversight. The caption is painted into
  // the video by the capture stage, because the same frames go to Figma and
  // anywhere else with no player around them. Showing the <track> as well
  // renders every line twice. The track still ships, still downloads, and the
  // button turns it on for anyone who needs selectable or restyled captions.
  const [captionsOn, setCaptionsOn] = React.useState(false);
  const [thumbs, setThumbs] = React.useState<ThumbCue[]>([]);
  const [hover, setHover] = React.useState<{ x: number; t: number } | null>(null);

  const duration = video.duration || 1;

  React.useEffect(() => {
    let live = true;
    fetch(video.thumbs)
      .then((r) => (r.ok ? r.text() : ""))
      .then((s) => live && setThumbs(parseThumbs(s)))
      .catch(() => {});
    return () => { live = false; };
  }, [video.thumbs]);

  // The browser hides the native <track> by default in some engines and shows
  // it in others, so the mode is set explicitly on load and on every toggle.
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => {
      const tr = el.textTracks?.[0];
      if (tr) tr.mode = captionsOn ? "showing" : "hidden";
    };
    apply();
    el.addEventListener("loadedmetadata", apply);
    return () => el.removeEventListener("loadedmetadata", apply);
  }, [captionsOn]);

  const seek = React.useCallback((to: number) => {
    const el = ref.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(duration - 0.05, to));
    setT(el.currentTime);
  }, [duration]);

  const toggle = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) void el.play(); else el.pause();
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const el = ref.current;
      if (!el) return;
      if (e.key === " " || e.key === "k") { e.preventDefault(); toggle(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); seek(el.currentTime + 5); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); seek(el.currentTime - 5); }
      else if (e.key === "l") seek(el.currentTime + 10);
      else if (e.key === "j") seek(el.currentTime - 10);
      else if (e.key === "c") setCaptionsOn((v) => !v);
      else if (e.key === "m") { el.muted = !el.muted; setMuted(el.muted); }
      else if (e.key === "f") void el.parentElement?.requestFullscreen?.().catch(() => {});
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [seek, toggle]);

  const activeSection = React.useMemo(() => {
    let found = video.sections[0] ?? null;
    for (const s of video.sections) if (t >= s.t - 0.01) found = s;
    return found;
  }, [t, video.sections]);

  const activeCue = React.useMemo(
    () => video.transcript.findIndex((c) => t >= c.t && t < c.end),
    [t, video.transcript],
  );

  // Keep the spoken line in view without hijacking the page's own scroll.
  React.useEffect(() => {
    if (activeCue < 0 || !transcriptRef.current) return;
    const li = transcriptRef.current.children[activeCue] as HTMLElement | undefined;
    if (!li) return;
    const box = transcriptRef.current;
    const top = li.offsetTop - box.offsetTop;
    if (top < box.scrollTop || top + li.offsetHeight > box.scrollTop + box.clientHeight) {
      box.scrollTo({ top: top - box.clientHeight / 3, behavior: "smooth" });
    }
  }, [activeCue]);

  const hoverThumb = hover ? thumbs.find((c) => hover.t >= c.t && hover.t < c.end) ?? thumbs[thumbs.length - 1] : null;

  const onBar = (e: React.MouseEvent<HTMLDivElement>) => {
    const box = barRef.current?.getBoundingClientRect();
    if (!box) return null;
    const ratio = Math.max(0, Math.min(1, (e.clientX - box.left) / box.width));
    return { ratio, x: ratio * box.width };
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        {/* ── the video ─────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-xl bg-black" data-hook="player-stage">
          <video
            ref={ref}
            data-hook="player-video"
            src={video.src}
            poster={video.poster}
            preload="metadata"
            playsInline
            className="block w-full"
            onClick={toggle}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
            onEnded={() => setPlaying(false)}
          >
            <track kind="subtitles" srcLang="en" label="English" src={video.captions} />
          </video>
          {!playing ? (
            <button
              type="button"
              onClick={toggle}
              aria-label="Play"
              data-hook="player-big-play"
              className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors hover:bg-black/20"
            >
              <span className="flex size-20 items-center justify-center rounded-full bg-white/95 shadow-xl">
                <Play className="size-8 text-[var(--ds-tailwind-colors-neutral-950)]" />
              </span>
            </button>
          ) : null}
        </div>

        {/* ── the scrub bar, segmented by section ───────────────────── */}
        <div className="relative">
          {hover && hoverThumb ? (
            <div
              className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full overflow-hidden rounded-lg border-2 border-white bg-black shadow-xl"
              style={{ left: hover.x, width: hoverThumb.w, height: hoverThumb.h }}
              data-hook="player-scrub-preview"
            >
              <div
                style={{
                  width: hoverThumb.w,
                  height: hoverThumb.h,
                  backgroundImage: `url(${video.sprite})`,
                  backgroundPosition: `-${hoverThumb.x}px -${hoverThumb.y}px`,
                }}
              />
              <span className="absolute bottom-0 left-0 right-0 bg-black/70 py-0.5 text-center text-label-sm font-semibold text-white tabular-nums">
                {stamp(hover.t)}
              </span>
            </div>
          ) : null}
          <div
            ref={barRef}
            data-hook="player-scrub"
            role="slider"
            tabIndex={0}
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(t)}
            aria-valuetext={`${stamp(t)} of ${stamp(duration)}`}
            className="relative flex h-6 cursor-pointer items-center"
            onMouseMove={(e) => { const p = onBar(e); if (p) setHover({ x: p.x, t: p.ratio * duration }); }}
            onMouseLeave={() => setHover(null)}
            onClick={(e) => { const p = onBar(e); if (p) seek(p.ratio * duration); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") { e.preventDefault(); seek(t + 5); }
              if (e.key === "ArrowLeft") { e.preventDefault(); seek(t - 5); }
            }}
          >
            {/* One track per section, with a gap between them, so the video's
                shape is legible standing still. */}
            <div className="flex h-1.5 w-full items-stretch gap-[3px] overflow-hidden rounded-full">
              {video.sections.map((s) => {
                const width = ((s.end - s.t) / duration) * 100;
                const filled = Math.max(0, Math.min(1, (t - s.t) / Math.max(0.01, s.end - s.t)));
                return (
                  <div key={s.id} className="bg-muted relative h-full overflow-hidden rounded-full" style={{ width: `${width}%` }}>
                    <div
                      className="absolute inset-y-0 left-0 bg-[var(--ds-tailwind-colors-green-500)]"
                      style={{ width: `${filled * 100}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <span
              className="pointer-events-none absolute size-3.5 -translate-x-1/2 rounded-full bg-[var(--ds-tailwind-colors-neutral-950)] ring-2 ring-white"
              style={{ left: `${(t / duration) * 100}%` }}
            />
          </div>
        </div>

        {/* ── the controls ──────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" dataHook="player-toggle" onClick={toggle} ariaLabel={playing ? "Pause" : "Play"}>
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            {playing ? "Pause" : "Play"}
          </Button>
          <span className="text-body-sm text-muted-foreground tabular-nums" data-hook="player-time">
            {stamp(t)} / {video.length}
          </span>
          <span className="grow" />
          <Button
            variant={captionsOn ? "primary" : "outline"}
            size="sm"
            dataHook="player-captions"
            onClick={() => setCaptionsOn((v) => !v)}
            ariaLabel="Subtitles"
          >
            <Subtitles className="size-4" />
            {captionsOn ? "Subtitles on" : "Subtitles"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            dataHook="player-mute"
            ariaLabel={muted ? "Unmute" : "Mute"}
            onClick={() => { const el = ref.current; if (!el) return; el.muted = !el.muted; setMuted(el.muted); }}
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            dataHook="player-fullscreen"
            ariaLabel="Full screen"
            onClick={() => void ref.current?.parentElement?.requestFullscreen?.().catch(() => {})}
          >
            <Maximize2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* ── the section rail ─────────────────────────────────────────── */}
      <section className="flex flex-col gap-3" data-hook="player-sections">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-heading-subsection font-display">Sections</h2>
          <p className="text-body-sm text-muted-foreground">
            {activeSection ? `Now: ${activeSection.title}` : null}
          </p>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {video.sections.map((s, i) => {
            const current = activeSection?.id === s.id;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => { seek(s.t + 0.05); void ref.current?.play(); }}
                  data-hook={`player-section-${s.id}`}
                  id={s.id}
                  className={`group flex w-full flex-col gap-2 rounded-xl border p-2 text-left transition-colors ${
                    current ? "border-[var(--ds-tailwind-colors-neutral-950)] bg-accent" : "hover:bg-accent"
                  }`}
                >
                  <span className="bg-muted relative block aspect-video w-full overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.thumb} alt="" className="h-full w-full object-cover" />
                    <span className="absolute right-1.5 bottom-1.5 rounded bg-black/80 px-1 py-0.5 text-label-sm font-semibold text-white tabular-nums">
                      {s.stamp}
                    </span>
                    {current ? (
                      <span className="absolute inset-x-0 bottom-0 h-1 bg-[var(--ds-tailwind-colors-green-500)]" />
                    ) : null}
                  </span>
                  <span className="flex flex-col gap-0.5 px-1 pb-1">
                    <span className="text-label-sm text-muted-foreground tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-body font-semibold text-pretty">{s.title}</span>
                    {s.description ? (
                      <span className="text-body-sm text-muted-foreground text-pretty">{s.description}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ── the transcript ───────────────────────────────────────────── */}
      <section className="flex flex-col gap-3" data-hook="player-transcript">
        <h2 className="text-heading-subsection font-display">Transcript</h2>
        <ol ref={transcriptRef} className="max-h-[22rem] overflow-y-auto rounded-xl border p-2">
          {video.transcript.map((c, i) => (
            <li key={`${c.t}-${i}`}>
              <button
                type="button"
                onClick={() => { seek(c.t + 0.05); void ref.current?.play(); }}
                className={`flex w-full gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                  i === activeCue ? "bg-accent font-semibold" : "hover:bg-accent"
                }`}
              >
                <span className="text-label-sm text-muted-foreground w-10 shrink-0 pt-0.5 tabular-nums">{stamp(c.t)}</span>
                <span className="text-body text-pretty">{c.text}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      {/* ── the ends ─────────────────────────────────────────────────── */}
      <nav className="flex flex-wrap items-stretch justify-between gap-4 border-t pt-6" data-hook="player-neighbours">
        {prev ? <Neighbour video={prev} dir="prev" /> : <span />}
        {next ? <Neighbour video={next} dir="next" /> : <span />}
      </nav>
    </div>
  );
}

function Neighbour({ video, dir }: { video: Video; dir: "prev" | "next" }) {
  return (
    <Link
      href={`/meta/videos/${video.slug}`}
      data-hook={`player-${dir}`}
      className="hover:bg-accent flex max-w-[26rem] items-center gap-3 rounded-xl border p-2 transition-colors"
    >
      {dir === "prev" ? <ChevronLeft className="size-5 shrink-0" /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={video.poster} alt="" className="h-14 w-24 shrink-0 rounded-lg object-cover" />
      <span className="flex flex-col gap-0.5">
        <span className="text-label-sm text-muted-foreground">{dir === "prev" ? "Previous" : "Next"}</span>
        <span className="text-body font-semibold text-pretty">{video.title}</span>
      </span>
      {dir === "next" ? <ChevronRight className="size-5 shrink-0" /> : null}
    </Link>
  );
}
