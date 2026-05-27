"use client";

/**
 * ThemeDraftPersister — invisible helper that bridges the
 * ThemeBuilderProvider's internal state to per-project persistence.
 *
 * The page can't read `useThemeBuilder()` directly because it sits
 * OUTSIDE the provider. This component lives INSIDE and reports
 * input changes upward via a callback. The page then stores the
 * serialised draft on the active project's snapshot (the storage
 * adapter already reserves `themeDraftJson` for this).
 *
 * Reports are debounced because the theme builder fires on every
 * slider tick — without the debounce we'd write to localStorage
 * dozens of times per drag. 250ms feels instant in UX terms but
 * coalesces a drag into one or two writes.
 *
 * Rendering nothing; it's a side-effect-only component.
 */

import * as React from "react";
import { useThemeBuilder } from "@/components/theme-builder";

interface ThemeDraftPersisterProps {
  /** Called when the draft input has stabilised. The page receives
   *  the serialised JSON (or null on the very first call, before
   *  the user has touched anything — caller can ignore those). */
  onChange: (json: string) => void;
  /** Debounce window in milliseconds. Defaults to 250 — long
   *  enough to coalesce a drag, short enough that release-to-
   *  reload feels safe. */
  debounceMs?: number;
}

export function ThemeDraftPersister({
  onChange,
  debounceMs = 250,
}: ThemeDraftPersisterProps) {
  const { input } = useThemeBuilder();
  // Track the latest callback in a ref so the debounce effect
  // doesn't re-arm itself when the parent passes a new function
  // identity each render — the timer always calls the freshest one.
  const callbackRef = React.useRef(onChange);
  React.useEffect(() => {
    callbackRef.current = onChange;
  }, [onChange]);

  // Skip the initial mount — that's just the seed value the page
  // already knows about. Only fire on subsequent changes.
  const mountedRef = React.useRef(false);

  React.useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    const timer = window.setTimeout(() => {
      try {
        callbackRef.current(JSON.stringify(input));
      } catch {
        // ThemeInput is plain JSON — stringify shouldn't fail in
        // practice. Belt-and-braces: don't crash the tree if it
        // ever does.
      }
    }, debounceMs);
    return () => window.clearTimeout(timer);
  }, [input, debounceMs]);

  return null;
}
