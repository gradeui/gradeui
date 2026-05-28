"use client";

/**
 * Read-only highlighted JSX/TSX view for Studio's "Code" mode.
 *
 * Thin wrapper around the shared `<Code>` primitive from @gradeui/ui.
 * Previously this file held its own `prism-react-renderer` setup with
 * `themes.vsLight` / `themes.vsDark` — those are the upstream VS Code
 * palettes and read as washed-out grey against Grade's surfaces. The
 * shared component drives token colour from `--gds-code-*` CSS
 * variables, so Studio now picks up the same palette as marketing and
 * docs without us maintaining a second theme.
 *
 * Why we still wrap it (instead of using `<Code>` directly at the call
 * site): two pieces of behaviour belong to Studio specifically and
 * don't make sense on the public primitive — the `data-lenis-prevent`
 * marker (Lenis-controlled smooth-scroll on the Studio page would
 * otherwise eat trackpad deltas inside the panel) and `overscroll-
 * contain` so a long scroll doesn't rubber-band into the parent canvas.
 *
 * The component still re-renders on every streamed chunk from the
 * model; `<Code>` uses sync prism tokenisation under the hood, so
 * each chunk → tokens → DOM is one frame. No async flicker.
 */

import { Code, type CodeLanguage } from "@gradeui/ui";

interface CodeViewProps {
  code: string;
  /** Language hint — Prism's parser is forgiving; "tsx" handles JSX too. */
  language?: CodeLanguage;
  /** Optional class on the scrolling wrapper. */
  className?: string;
}

export function CodeView({ code, language = "tsx", className }: CodeViewProps) {
  return (
    <div
      // Lenis would otherwise eat trackpad deltas before they reach the
      // overflow-auto div — see lib/lenis-provider for the context.
      data-lenis-prevent
      className={[
        "h-full w-full overflow-auto p-4",
        // overscroll-contain keeps a long scroll inside the panel
        // (no rubber-band into the parent canvas when you hit the end).
        "overscroll-contain",
        // Surface tint matches the Studio panel chrome — sits between
        // canvas (`background`) and a real card (`muted`) so the panel
        // reads as "secondary surface".
        "bg-[var(--gds-code-bg)]",
        className ?? "",
      ].join(" ")}
    >
      <Code
        source={code}
        language={language}
        // bare drops the border/header/padding — the wrapper above
        // already handles the panel chrome (scroll, Lenis, sizing).
        bare
        // Studio streams chunks; the reveal animation would replay on
        // every chunk and feel laggy. Static render is correct here.
        reveal="none"
        className="text-xs"
      />
    </div>
  );
}
