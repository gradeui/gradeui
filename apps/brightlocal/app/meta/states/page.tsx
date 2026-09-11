"use client";

/**
 * The state browser (Ali, 10 Sep: "something where I can see every screenshot
 * with the explanations like we were having in Figma, so instead of videos I
 * just get thumbs that I can click to see in the main area").
 *
 * The main area is the REAL PAGE, not a picture of it. Tapping a thumbnail
 * loads that screen in the frame and drives it into the state, because this
 * app serves both this page and the screens it frames, so there is nothing
 * cross-origin in the way. The thumbnail is only ever the index; the thing
 * you look at is live and you can carry on clicking in it.
 *
 * The frame is sticky at the top (Ali, same message), so the thumbnails
 * scroll under a picture that stays put.
 */

import * as React from "react";
import Link from "next/link";
import { Maximize2, Minimize2, RotateCcw, ExternalLink, Check, TriangleAlert, Sparkles } from "@brightlocal/icons";
import { Button } from "@brightlocal/ui-components/button";
import {
  STATES,
  STATE_SECTIONS,
  SECTION_LABEL,
  statesIn,
  thumbFor,
  type ScreenState,
} from "@/lib/states";
import { replay, seedLook, type ReplayResult } from "@/lib/state-driver";

/** The shapes a frame can be fitted to. The height is the width over the
 *  ratio, so it is a crop of the page rather than a letterbox of it: the same
 *  thing a screenshot at that shape would be. */
const RATIOS: { id: string; label: string; value: number | null }[] = [
  { id: "native", label: "Native", value: null },
  { id: "3:2", label: "3:2", value: 3 / 2 },
  { id: "16:9", label: "16:9", value: 16 / 9 },
  { id: "4:3", label: "4:3", value: 4 / 3 },
];

export default function StatesPage() {
  const [active, setActive] = React.useState<ScreenState>(STATES[0]);
  const [ratio, setRatio] = React.useState(RATIOS[0]);
  // A GLOBAL SWITCH (Ali, 10 Sep: "an option for all the screens to either
  // show insights or not, this could also be a global setting for these
  // screens"). null follows whatever each state asks for; true and false
  // override every one of them.
  const [insights, setInsights] = React.useState<boolean | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<ReplayResult | null>(null);
  const [full, setFull] = React.useState(false);
  const [nonce, setNonce] = React.useState(0);
  const frameRef = React.useRef<HTMLIFrameElement>(null);
  const shellRef = React.useRef<HTMLDivElement>(null);

  // The persona has to be in storage before the frame boots, so it is written
  // on the way to setting the src rather than after.
  const lookFor = React.useCallback(
    (state: ScreenState) => ({
      personaId: state.persona ?? "engaged",
      tone: state.tone ?? "neutral",
      insights: insights ?? state.insights,
    }),
    [insights],
  );

  const open = React.useCallback(
    (state: ScreenState) => {
      seedLook(lookFor(state));
      setResult(null);
      setBusy(true);
      setActive(state);
      setNonce((n) => n + 1);
    },
    [lookFor],
  );

  // Changing the global switch or the ratio reloads whatever is in the frame,
  // because both are read on boot.
  React.useEffect(() => {
    seedLook(lookFor(active));
    setResult(null);
    setBusy(true);
    setNonce((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insights]);

  const onLoad = React.useCallback(async () => {
    const frame = frameRef.current;
    if (!frame) return;
    // ALWAYS through the driver, even with no steps: it is also what closes
    // the trial recap, which opens on its own for a trial or a lapsed trial
    // and would otherwise cover a state that has nothing to do with it.
    await new Promise((r) => setTimeout(r, 900));
    const r = await replay(frame, active.steps ?? []);
    setResult(r);
    setBusy(false);
  }, [active]);

  React.useEffect(() => {
    const on = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  const toggleFull = () => {
    const el = shellRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => {});
    else void el.requestFullscreen?.().catch(() => {});
  };

  const width = active.width ?? 1280;
  // The page renders at its own width; the ratio decides how much of its
  // height the frame shows.
  const frameHeight = ratio.value ? Math.round(width / ratio.value) : 900;
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);

  // The screens are drawn at 1280 (or the state's own width), so the frame is
  // rendered at that width and scaled to fit rather than given a narrow
  // viewport it was never designed for. Same trick the capture stage uses.
  React.useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const fit = () => {
      const w = box.clientWidth;
      const h = box.clientHeight;
      if (!w || !h) return;
      // FIT THE WIDTH, not the height. Fitting the height left a third of the
      // box empty beside a 1280 screen. The pages are tall, so showing the top
      // of one at full width is the right crop, and the frame scrolls inside
      // itself for the rest. A narrow state (the 430 phone) is never blown up
      // past life size.
      setScale(full ? Math.min(w / width, h / frameHeight) : Math.min(w / width, width < 900 ? 1 : 4));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [width, full, active.id, frameHeight]);

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-6 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-heading-page font-display">Every state</h1>
        <p className="text-body text-muted-foreground max-w-[72ch] text-pretty">
          {STATES.length} interaction states across {STATE_SECTIONS.length} sections, each with the
          note that would have gone beside it in Figma. Tap one and it opens here for real: the
          frame is the live page driven into that state, so you can carry on clicking in it.
        </p>
      </header>

      {/* ── the frame, stuck to the top ─────────────────────────────── */}
      <div className="bg-background sticky top-0 z-20 -mx-6 border-b px-6 pt-2 pb-4" data-hook="states-sticky">
        <div ref={shellRef} className={full ? "flex h-screen w-screen flex-col bg-black p-4" : "flex flex-col gap-3"}>
          <div
            ref={boxRef}
            className={`relative flex justify-center overflow-hidden border bg-white ${full ? "min-h-0 flex-1 rounded-lg" : "rounded-xl"}`}
            data-hook="states-frame-box"
            style={full ? undefined : { aspectRatio: `${width} / ${frameHeight}`, maxHeight: "min(52vh, 600px)" }}
          >
            <iframe
              key={`${active.id}-${nonce}`}
              ref={frameRef}
              data-hook="states-frame"
              title={active.title}
              src={active.path}
              onLoad={onLoad}
              className="origin-top border-0"
              style={{
                width,
                height: full ? Math.round((boxRef.current?.clientHeight ?? 900) / (scale || 1)) : frameHeight,
                transform: `scale(${scale})`,
              }}
            />
            {busy ? (
              <span className="pointer-events-none absolute inset-x-0 top-0 h-0.5 animate-pulse bg-[var(--ds-tailwind-colors-green-500)]" />
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-0 flex-col">
              <span className={`text-body font-semibold ${full ? "text-white" : ""}`}>{active.title}</span>
              <span className={`text-label-sm ${full ? "text-white/70" : "text-muted-foreground"}`}>
                {SECTION_LABEL[active.section]} · {active.id}
              </span>
            </div>
            <span className="grow" />
            {result ? (
              <span
                className={`inline-flex items-center gap-1.5 text-label-sm ${
                  result.ok
                    ? full ? "text-white/70" : "text-muted-foreground"
                    : "text-[var(--ds-tailwind-colors-red-700)]"
                }`}
                data-hook="states-replay-result"
              >
                {result.ok ? <Check className="size-3.5" /> : <TriangleAlert className="size-3.5" />}
                {result.ok ? "In the state" : `Stopped at step ${(result.failedAt ?? 0) + 1}: ${result.reason}`}
              </span>
            ) : null}
            <span className="flex items-center gap-1" data-hook="states-ratio">
              {RATIOS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRatio(r)}
                  aria-pressed={r.id === ratio.id}
                  className={`rounded-full border px-2.5 py-1 text-label-sm font-semibold transition-colors ${
                    r.id === ratio.id
                      ? "border-[var(--ds-tailwind-colors-neutral-950)] bg-[var(--ds-tailwind-colors-neutral-950)] text-[var(--ds-tailwind-colors-base-white)]"
                      : full ? "border-white/30 text-white/80 hover:bg-white/10" : "hover:bg-accent"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </span>
            <Button
              variant={insights === false ? "primary" : "outline"}
              size="sm"
              dataHook="states-insights"
              onClick={() => setInsights(insights === false ? null : false)}
            >
              <Sparkles className="size-4" />
              {insights === false ? "Insights off" : "Insights on"}
            </Button>
            <Button variant="outline" size="sm" dataHook="states-replay" onClick={() => open(active)}>
              <RotateCcw className="size-4" />
              Replay
            </Button>
            <Button variant="outline" size="sm" dataHook="states-open" asChild>
              <a href={active.path} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                Open in a tab
              </a>
            </Button>
            <Button variant="outline" size="sm" dataHook="states-fullscreen" onClick={toggleFull} ariaLabel="Full screen">
              {full ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* ── the note for whatever is in the frame ───────────────────── */}
      <p className="text-body max-w-[80ch] text-pretty" data-hook="states-note">
        {active.note}
      </p>

      {/* ── every state, by section ─────────────────────────────────── */}
      {STATE_SECTIONS.map((section) => (
        <section key={section} className="flex flex-col gap-3" data-hook={`states-section-${section}`}>
          <h2 className="text-heading-subsection font-display">{SECTION_LABEL[section]}</h2>
          <ul className="grid gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {statesIn(section).map((s) => {
              const current = s.id === active.id;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    id={s.id}
                    data-hook={`states-card-${s.id}`}
                    onClick={() => open(s)}
                    // scroll-mt keeps a card clear of the sticky frame when
                    // anything scrolls to it: without it a card jumped to by
                    // its anchor lands underneath and cannot be clicked.
                    className="group flex w-full scroll-mt-[70vh] flex-col gap-2 text-left"
                  >
                    <span
                      style={{ aspectRatio: `${s.width ?? 1280} / ${ratio.value ? Math.round((s.width ?? 1280) / ratio.value) : 900}` }}
                      className={`bg-muted relative block w-full overflow-hidden rounded-xl border-2 transition-colors ${
                        current ? "border-[var(--ds-tailwind-colors-neutral-950)]" : "border-transparent group-hover:border-[var(--ds-tailwind-colors-neutral-300)]"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumbFor(s.id)}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover object-top"
                      />
                      {s.persona && s.persona !== "engaged" ? (
                        <span className="absolute top-2 left-2 rounded-md bg-black/80 px-1.5 py-0.5 text-label-sm font-semibold text-white capitalize">
                          {s.persona}
                        </span>
                      ) : null}
                      {s.width ? (
                        <span className="absolute top-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-label-sm font-semibold text-white tabular-nums">
                          {s.width}
                        </span>
                      ) : null}
                    </span>
                    <span className="flex flex-col gap-1">
                      <span className="text-body font-semibold group-hover:underline">{s.title}</span>
                      <span className="text-body-sm text-muted-foreground text-pretty">{s.note}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <p className="text-body-sm text-muted-foreground border-t pt-6">
        The catalogue is <code>lib/states.ts</code>: where each state is, how to get into it, and the
        note. <code>npx tsx scripts/capture-states.mts</code> re-shoots the thumbnails from the same
        definitions. <Link href="/meta" className="underline underline-offset-4">Back to /meta</Link>.
      </p>
    </div>
  );
}
