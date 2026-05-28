"use client";

/**
 * FigmaIntroBanner — first-run guidance for the Studio Code tab's
 * Send-to-Figma flow.
 *
 * Shown once, above GradePayloadPanel, the first time a user lands on
 * the Code tab. Dismissal is persisted to localStorage so the banner
 * doesn't reappear on subsequent visits.
 *
 * v2 (May 2026) — gutted in favour of the `<Banner>` primitive after
 * the user flagged the previous inline-style version as invisible. The
 * old implementation reached for `--gds-primary` / `--gds-border` /
 * `--gds-foreground` token names that don't exist in our system (our
 * tokens are unprefixed: `--primary`, `--border`, `--foreground`). The
 * inline-style fallback values kicked in and the chrome washed out
 * completely against the Studio dark surface.
 *
 * This file now owns:
 *   - the localStorage persistence (visibility state)
 *   - the plugin URL constant
 *   - the wording / link copy
 * The visual chrome (tint, dismiss button, role mapping, theme
 * inheritance) lives on `<Banner>`.
 *
 * SSR-safety note: localStorage is only read inside useEffect after
 * mount. The initial render returns `null` so the server and the first
 * client render agree (no hydration mismatch). See the feedback memory
 * "localStorage in useState init is an SSR trap".
 */

import * as React from "react";
import { Banner } from "@gradeui/ui";

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
    <Banner
      variant="announcement"
      dismissible
      onDismiss={dismiss}
      action={
        <a
          href={PLUGIN_INSTALL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium underline underline-offset-4 hover:opacity-80"
        >
          Get the Grade plugin →
        </a>
      }
    >
      Send your design to Figma as live components.
    </Banner>
  );
}
