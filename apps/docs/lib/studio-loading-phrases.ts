/**
 * Rotating loading-state copy used across Studio's loading surfaces.
 *
 * Shared between the chat's <ThinkingIndicator> (small, in-flow) and the
 * preview pane's loading dialog (modal, full-pane overlay). Same set so the
 * two surfaces feel like one product rather than two unrelated spinners.
 *
 * Tone notes (so future additions don't drift):
 *   - Short — 1-3 words after the verb. Long phrases reflow the dialog as
 *     they rotate.
 *   - Verb-led, gerund or imperative.
 *   - Brand-anchored where it fits ("Grading up…"). The rest lean on craft
 *     vocab the user actually associates with design work — spacing, kerning,
 *     tokens, variants. Avoids generic "processing…" / "please wait…" filler.
 *   - One classic ("Reticulating splines…") for the heads that catch it.
 */
"use client";

import { useEffect, useState } from "react";

export const STUDIO_LOADING_PHRASES: readonly string[] = [
  "Grading up",
  "Tightening the kerning",
  "Aligning the auto-layout",
  "Settling the spacing",
  "Polishing the pixels",
  "Curving the corners",
  "Threading the tokens",
  "Composing the components",
  "Wiring the variants",
  "Calibrating the contrast",
  "Reticulating splines",
] as const;

/**
 * Cycle through the supplied phrase list at a steady cadence, starting from
 * a random index so consecutive sessions don't always open with "Grading
 * up…". Wraps sequentially after that — random-on-every-tick felt twitchy
 * in early prototypes (the user couldn't tell whether the list was finite).
 *
 *  - `phrases`: override the canonical list (testing, alt-tone surfaces).
 *  - `intervalMs`: cadence. Default 1400ms — slow enough to read, fast
 *     enough that a long bundle (~3s) shows two distinct phrases.
 */
export function useRotatingPhrase(
  phrases: readonly string[] = STUDIO_LOADING_PHRASES,
  intervalMs = 1400
): string {
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * phrases.length)
  );

  useEffect(() => {
    if (phrases.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [phrases, intervalMs]);

  return phrases[index] ?? phrases[0] ?? "";
}
