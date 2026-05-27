"use client";

/**
 * CanvasCommentPinsOverlay — positions one CanvasCommentPin per
 * open comment thread, anchored to its element inside the canvas
 * iframe.
 *
 * Mechanics:
 *
 *   1. The iframe (`/fast-sandbox`) is same-origin, so the parent
 *      can read `iframe.contentDocument` directly — no postMessage
 *      round-trip needed for Fast mode.
 *   2. For each thread, we query the iframe document for the
 *      matching `data-gds-source-id` / `data-gds-instance-id`
 *      attribute and read its bounding rect.
 *   3. We render pins via fixed-position absolute coords in the
 *      parent realm. `position: fixed` uses viewport coords, which
 *      `getBoundingClientRect()` already returns — they survive
 *      parent-page scroll naturally.
 *   4. Rect tracking re-runs on:
 *        - threads list changing (add / delete / resolve)
 *        - the iframe scroll (user scrolls inside the preview)
 *        - the parent window resize
 *        - a short polling interval (covers iframe content reflows
 *          we can't get a direct hook into — appSource regen, font
 *          load, image load, etc.)
 *
 * Limited to fast-frame mode for now. Sandpack mode is cross-origin
 * (Sandpack's CDN) so the contentDocument query throws — for that
 * mode we'd need a postMessage round-trip with the in-iframe
 * agent. Not in scope today; the user is on Fast by default.
 */

import * as React from "react";

import type { CommentThreadWithMessages } from "@/lib/studio-storage";

import { CanvasCommentPin } from "./canvas-comment-pin";

interface CanvasCommentPinsOverlayProps {
  /** Ref to the iframe rendering the preview. We read
   *  `iframe.contentDocument` to find anchored elements. */
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  /** Threads to render pins for. Resolved threads are filtered
   *  out by the parent — this overlay just renders what it's
   *  given. */
  threads: CommentThreadWithMessages[];
  /** Optional — the currently focused thread id. Drives the
   *  `active` styling on the matching pin. */
  activeThreadId?: string | null;
  /** Pin click — usually scrolls the Comments tab to the
   *  matching thread (and opens the right panel if collapsed). */
  onPinClick: (threadId: string) => void;
}

interface PinPosition {
  threadId: string;
  top: number;
  left: number;
}

export function CanvasCommentPinsOverlay({
  iframeRef,
  threads,
  activeThreadId,
  onPinClick,
}: CanvasCommentPinsOverlayProps) {
  const [positions, setPositions] = React.useState<PinPosition[]>([]);

  React.useEffect(() => {
    if (threads.length === 0) {
      setPositions([]);
      return;
    }

    function update() {
      const iframe = iframeRef.current;
      if (!iframe) return;
      let doc: Document | null = null;
      try {
        // Same-origin (our /fast-sandbox), so this never throws in
        // Fast mode. Sandpack mode would throw a SecurityError —
        // we catch + bail so the overlay quietly disappears
        // rather than the page crashing.
        doc = iframe.contentDocument;
      } catch {
        doc = null;
      }
      if (!doc) return;

      const iframeRect = iframe.getBoundingClientRect();
      const next: PinPosition[] = [];
      for (const t of threads) {
        const attr =
          t.thread.anchorKind === "source"
            ? "data-gds-source-id"
            : "data-gds-instance-id";
        // Escape the id for the attribute selector — anchor ids
        // are mintable client-side and could theoretically contain
        // quotes / brackets in pathological cases. CSS.escape
        // covers the common cases.
        const safeId =
          typeof CSS !== "undefined" && CSS.escape
            ? CSS.escape(t.thread.anchorId)
            : t.thread.anchorId;
        const el = doc.querySelector(`[${attr}="${safeId}"]`);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        // The pin's own transform parks it above-and-to-the-right
        // of the (top, left) anchor (see translate(-50%, -100%)
        // in the pin component). Anchor against the element's
        // top-left so the pin appears just outside that corner.
        next.push({
          threadId: t.thread.id,
          top: iframeRect.top + r.top,
          left: iframeRect.left + r.left,
        });
      }
      setPositions(next);
    }

    update();

    // Polling — cheap insurance against reflows we can't directly
    // observe (appSource regen, font/image loads, animations).
    // 250 ms is below the eye's "lag" perception threshold for
    // pin updates while not pegging the CPU.
    const interval = window.setInterval(update, 250);

    // Iframe scroll — listen on the contentDocument; capture
    // phase so we catch nested scroll containers too.
    let doc: Document | null = null;
    try {
      doc = iframeRef.current?.contentDocument ?? null;
    } catch {
      doc = null;
    }
    doc?.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    return () => {
      window.clearInterval(interval);
      doc?.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [threads, iframeRef]);

  return (
    <>
      {positions.map((p, i) => {
        // Sequential 1-indexed label. Future: stable per-thread
        // label so deleting thread #2 doesn't renumber the rest.
        const label = String(i + 1);
        return (
          <CanvasCommentPin
            key={p.threadId}
            label={label}
            top={p.top}
            left={p.left}
            active={p.threadId === activeThreadId}
            onClick={() => onPinClick(p.threadId)}
          />
        );
      })}
    </>
  );
}
