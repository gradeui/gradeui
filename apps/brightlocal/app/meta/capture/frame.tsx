"use client";

/**
 * The capture stage's live shell.
 *
 * The recorder does NOT navigate between shots. It calls `window.__stage`,
 * which swaps the iframe's src, the canvas colour and the caption in place,
 * so the canvas never unloads and nothing ever flashes white (Ali, 12 Sep).
 * The frame fades out, loads, settles, fades back in; the canvas colour
 * cross-fades under it.
 *
 *   await page.evaluate(() => window.__stage.set({ url, bg, caption }))
 *   await page.evaluate(() => window.__stage.reloadFrame())
 *   await page.locator("[data-hook=capture-stage][data-ready=true]").waitFor()
 */

import * as React from "react";
import { Logo } from "@brightlocal/ui-components";
import { STAGES, CAPTION_BAND } from "@/lib/stage";
import { CutSceneCard } from "@/components/cut-scene-card";
import { cardFor } from "@/lib/cards";

export interface StageState {
  url: string;
  bg: string;
  caption?: string;
  /** A cut-scene card, rendered over the canvas. No navigation, so a cut
   *  never flashes white (Ali, 12 Sep). */
  card?: string | null;
}

declare global {
  interface Window {
    __stage?: {
      set: (next: Partial<StageState>) => void;
      card: (slug: string | null) => void;
      reloadFrame: () => void;
      ready: () => boolean;
    };
  }
}

export function CaptureStage({ initial, w, h, pad, radius }: { initial: StageState; w: number; h: number; pad: number; radius: number }) {
  const [state, setState] = React.useState(initial);
  const [ready, setReady] = React.useState(false);
  // A cut-scene card stays up until the NEXT screen has loaded and faded
  // in, or you see the bare canvas in between: fade out, gap, fade back in
  // (Ali, 12 Sep). The card is cleared by the effect below, not by set().
  const clearCardWhenReady = React.useRef(false);
  const [scale, setScale] = React.useState(0);
  const frameRef = React.useRef<HTMLIFrameElement>(null);
  const stage = STAGES[state.bg] ?? STAGES.neutral;
  const cardSpec = state.card ? cardFor(state.card) : undefined;

  React.useEffect(() => {
    const fit = () => {
      const availW = window.innerWidth - pad * 2;
      const availH = window.innerHeight - pad * 2 - (state.caption ? CAPTION_BAND : 0);
      setScale(Math.min(availW / w, availH / h));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [w, h, pad, state.caption]);

  React.useEffect(() => {
    window.__stage = {
      set: (next) => {
        // A new url means a new load: hide the frame first so the incoming
        // page never paints white over the canvas.
        const isNewUrl = Boolean(next.url && next.url !== state.url);
        if (isNewUrl) setReady(false);
        setState((s) => {
          const holdCard = isNewUrl && s.card && next.card === null;
          if (holdCard) clearCardWhenReady.current = true;
          return { ...s, ...next, card: holdCard ? s.card : next.card !== undefined ? next.card : s.card };
        });
      },
      card: (slug) => setState((s) => ({ ...s, card: slug })),
      reloadFrame: () => {
        setReady(false);
        const el = frameRef.current;
        if (el) el.src = el.src;
      },
      ready: () => ready,
    };
    return () => { delete window.__stage; };
  }, [state.url, ready]);

  // Cross-fade: the card goes only once the screen behind it is up.
  React.useEffect(() => {
    if (!ready || !clearCardWhenReady.current) return;
    clearCardWhenReady.current = false;
    const t = setTimeout(() => setState((s) => ({ ...s, card: null })), 120);
    return () => clearTimeout(t);
  }, [ready]);

  return (
    <main
      data-hook="capture-stage"
      data-ready={ready ? "true" : "false"}
      className="relative grid h-screen w-screen overflow-hidden"
      style={{
        background: stage.bg,
        color: stage.ink,
        gridTemplateRows: state.caption ? `1fr ${CAPTION_BAND}px` : "1fr",
        paddingTop: pad,
        transition: "background-color 480ms ease-out, color 480ms ease-out",
      }}
    >
      <div className="flex min-h-0 items-center justify-center">
        <div
          style={{
            width: w,
            height: h,
            // The scaled frame gets its own compositor layer, or every
            // repaint inside the iframe re-rasterises the whole stage and
            // the recording judders (Ali, 12 Sep: "still quite janky").
            transform: `scale(${scale || 1}) translateZ(0)`,
            transformOrigin: "center",
            willChange: "opacity",
            backfaceVisibility: "hidden",
            borderRadius: radius / (scale || 1),
            overflow: "hidden",
            opacity: ready && scale ? 1 : 0,
            transition: "opacity 600ms ease-out",
            boxShadow: ready ? "0 40px 120px rgba(0,0,0,0.25)" : "none",
            flex: "0 0 auto",
          }}
        >
          <iframe
            ref={frameRef}
            data-hook="capture-frame"
            title="capture"
            src={state.url}
            width={w}
            height={h}
            // The load event fires before fonts and first paint settle.
            onLoad={() => setTimeout(() => setReady(true), 700)}
            style={{ border: 0, display: "block", background: "var(--ds-tailwind-colors-base-white)" }}
          />
        </div>
      </div>
      {state.caption ? (
        <div
          className="flex items-center justify-center px-24 pb-8"
          style={{
            opacity: ready ? 1 : 0,
            transform: ready ? "none" : "translateY(10px)",
            // Always behind the frame: the product lands, then the line
            // about it (Ali, 12 Sep).
            transition: "opacity 480ms ease-out 420ms, transform 480ms ease-out 420ms",
          }}
        >
          <p data-hook="capture-caption" className="text-stage-caption max-w-[44ch] text-center text-balance">
            {state.caption}
          </p>
        </div>
      ) : null}
      <Logo
        dataHook="stage-logo"
        data-ink={stage.ink === "var(--ds-tailwind-colors-base-white)" ? "white" : "black"}
        className="absolute bottom-10 left-12 h-9 w-auto"
      />
      {/* The cut-scene card sits over the whole canvas and cross-fades, so a
          cut costs no navigation and shows no white. */}
      <div
        data-hook="stage-card"
        aria-hidden={!cardSpec}
        className="pointer-events-none absolute inset-0"
        style={{ opacity: cardSpec ? 1 : 0, transition: "opacity 520ms ease-out" }}
      >
        {cardSpec ? <CutSceneCard card={cardSpec} /> : null}
      </div>
    </main>
  );
}
