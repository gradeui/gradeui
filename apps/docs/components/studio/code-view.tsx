"use client";

/**
 * Read-only highlighted JSX/TSX view for Studio's "Code" mode.
 *
 * Replaces a plain `<pre>` of the user's snippet — gives proper token
 * colouring (keyword, string, tag, attribute, comment) so the panel
 * reads like a real editor rather than the diff log it was before.
 *
 * Why prism-react-renderer over shiki: prism is sync and tiny (~6kb
 * gzipped). Studio re-renders this panel on every streamed chunk from
 * the model, and an async highlighter would either flicker or lag
 * behind the stream. Prism just emits spans in one pass.
 *
 * Scroll behaviour: the outer wrapper carries `data-lenis-prevent` so
 * the global Lenis smooth-scroll on the Studio page stops intercepting
 * wheel events when the cursor's over the code. Without this, trackpad
 * scrolling inside the panel feels dead — Lenis swallows the deltas
 * and applies them to the page body instead.
 */

import { Highlight, themes, type Language } from "prism-react-renderer";
import { useMaybeGradeTheme } from "@/components/grade-theme-provider";

interface CodeViewProps {
  code: string;
  /** Language hint — Prism's parser is forgiving; "tsx" handles JSX too. */
  language?: Language;
  /** Optional class on the scrolling wrapper. */
  className?: string;
}

export function CodeView({ code, language = "tsx", className }: CodeViewProps) {
  // Match the Studio mode so the highlight palette inverts with the
  // rest of the chrome instead of fighting it. `useMaybeGradeTheme`
  // returns null outside the provider — render as light in that case
  // rather than crashing (the studio canvas tree is always inside the
  // provider, but the safety belt costs nothing).
  const gradeTheme = useMaybeGradeTheme();
  const isDark = gradeTheme?.mode === "dark" || gradeTheme?.mode === "superDark";
  const theme = isDark ? themes.vsDark : themes.vsLight;

  return (
    <div
      // Lenis would otherwise eat trackpad deltas before they reach the
      // overflow-auto div — see lib/lenis-provider for the context.
      data-lenis-prevent
      className={[
        "h-full w-full overflow-auto bg-muted/20 p-4",
        // overscroll-contain keeps a long scroll inside the panel
        // (no rubber-band into the parent canvas when you hit the end).
        "overscroll-contain",
        className ?? "",
      ].join(" ")}
    >
      <Highlight code={code} language={language} theme={theme}>
        {({ className: hlClass, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${hlClass} text-xs font-mono leading-relaxed whitespace-pre`}
            // Drop Prism's default bg so it inherits our muted/20 wrapper.
            style={{ ...style, background: "transparent" }}
          >
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line });
              return (
                <div key={i} {...lineProps}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              );
            })}
          </pre>
        )}
      </Highlight>
    </div>
  );
}
