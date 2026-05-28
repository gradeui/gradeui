"use client";

/**
 * FigmaIntroBanner — first-run guidance for the Studio Code tab's
 * Send-to-Figma flow.
 *
 * Shown once, above GradePayloadPanel, the first time a user lands on
 * the Code tab. Dismissal is persisted to localStorage so the banner
 * doesn't reappear on subsequent visits.
 *
 * SSR-safety note: localStorage is only read inside useEffect after
 * mount. The initial render returns `null` so the server and the first
 * client render agree (no hydration mismatch). See the feedback memory
 * "localStorage in useState init is an SSR trap".
 */

import * as React from "react";

const STORAGE_KEY = "studio:figma-intro-seen";

// Figma community / plugin install URL. Placeholder for now — swap to
// the real published plugin link when it lands.
//
// PRD open question #4: where to point users for the plugin install?
// For v1 we point at the Figma community search; this is the lowest-
// friction step that doesn't bake in a URL that might 404 later.
const PLUGIN_INSTALL_URL =
  "https://www.figma.com/community/search?model_type=plugins&q=grade%20code-to-figma";

export function FigmaIntroBanner() {
  // null = haven't rehydrated from localStorage yet; render nothing.
  // false = user has seen the banner before; render nothing.
  // true = first run; show the banner.
  const [show, setShow] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      setShow(seen !== "1");
    } catch {
      // localStorage blocked (private browsing, embedded contexts). Treat
      // as "show once per session" — better than never showing the hint
      // at all. We don't try to persist the dismissal in that case.
      setShow(true);
    }
  }, []);

  const dismiss = React.useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* see note in mount effect */
    }
    setShow(false);
  }, []);

  if (!show) return null;

  return (
    <div
      role="status"
      // Visual chrome via CSS variables — keeps the banner aligned with
      // the Studio theme even as the theme picker mutates --gds-*.
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        padding: "0.625rem 0.875rem",
        borderBottom:
          "1px solid oklch(var(--gds-border, 0.9 0 0))",
        background:
          "color-mix(in oklab, oklch(var(--gds-primary, 0.2 0 0)) 6%, transparent)",
        color: "oklch(var(--gds-foreground, 0.15 0 0))",
        fontSize: "0.8125rem",
        lineHeight: 1.5,
      }}
      data-gds-part="figma-intro-banner"
    >
      <span style={{ flex: 1 }}>
        Send your design to Figma as live components.{" "}
        <a
          href={PLUGIN_INSTALL_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "oklch(var(--gds-primary, 0.2 0 0))",
            textDecoration: "underline",
            textUnderlineOffset: "0.15em",
            fontWeight: 500,
          }}
        >
          Get the Grade plugin →
        </a>
      </span>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          appearance: "none",
          border: 0,
          background: "transparent",
          color: "oklch(var(--gds-muted-foreground, 0.5 0 0))",
          font: "inherit",
          fontSize: "0.75rem",
          padding: "0.125rem 0.375rem",
          cursor: "pointer",
          borderRadius: "0.25rem",
        }}
      >
        Got it
      </button>
    </div>
  );
}
