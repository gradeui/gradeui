"use client";

/**
 * /layout-preview/[id] — a minimal, chromeless preview that renders a
 * single reference layout from `@gradeui/studio/playbook`. Used by:
 *
 *   - The Playwright thumbnail script (`scripts/capture-layout-thumbnails.mjs`)
 *     — visits this URL per layout, waits for ready, screenshots into
 *     `public/layout-thumbs/<id>.png`.
 *   - The Playwright responsive checker (`scripts/check-layouts.mjs`)
 *     — visits at multiple viewport widths, captures console errors,
 *     writes a manifest the responsive-reviewer skill consumes.
 *
 * Renderer: Fast Frame (`<TileFastMount>`), not Sandpack.
 *
 *   Sandpack iframes install `@gradeui/ui@latest` from npm — so a layout
 *   that uses an unpublished component (e.g. Map, freshly added) silently
 *   fails: the import resolves to undefined and React errors with
 *   "Element type is invalid". Fast Frame instead loads workspace source
 *   via the host app's bundle, so the same layout works the moment the
 *   workspace `dist` is built. See `apps/docs/STUDIO.md` "Fast Frame"
 *   and "dist-rebuild gotcha" sections for the full picture.
 *
 * Design goals:
 *   - No header, no scrollbars, no interactive chrome — pure preview surface.
 *   - Theme is the site's active theme; thumbnails match the live palette.
 *   - `?snap=1` (or env `E2E=1`) hides the loading spinner so headless
 *     captures get a stable frame. Keep the page usable without the flag
 *     for manual debugging.
 *
 * This route is deliberately excluded from the marketing site navigation
 * — it's tooling. Do not link it from user-visible surfaces.
 */

import { use, useEffect, useMemo, useState } from "react";
import { REFERENCE_LAYOUTS } from "@gradeui/studio/playbook";

import { TileFastMount } from "@/components/studio/fast-frame";
import { useGradeTheme } from "@/components/grade-theme-provider";

export default function LayoutPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ snap?: string }>;
}) {
  const { id } = use(params);
  // searchParams is consumed but not currently read — kept on the
  // signature for future `?snap=1` hooks (loading-spinner suppression
  // etc.). Read with `use(searchParams)` when needed.
  void searchParams;

  const { theme, isDark } = useGradeTheme();
  const mode = isDark ? "dark" : "light";

  const layout = useMemo(
    () => REFERENCE_LAYOUTS.find((l) => l.id === id),
    [id]
  );

  if (!layout) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Unknown layout id: <code className="ml-2 font-mono">{id}</code>
      </div>
    );
  }

  return (
    // Chromeless wrapper — Fast Frame fills 100vw × 100vh so Playwright
    // can screenshot the page without touching any DOM beyond this root.
    <div
      data-layout-id={id}
      className="h-screen w-screen overflow-hidden bg-background"
    >
      <TileFastMount appSource={layout.scaffold} theme={theme} mode={mode} />
      <ReadinessBeacon id={id} />
    </div>
  );
}

/**
 * Invisible DOM marker the Playwright drivers wait on. Flips
 * `data-ready="0"` → `"1"` once the outer React tree has mounted —
 * i.e. the iframe is in the document. Note this does NOT mean the
 * iframe's content has rendered yet. Capture scripts settle for a
 * short window after the marker fires to let the in-iframe sucrase
 * compile + first paint complete. See:
 *   - scripts/capture-layout-thumbnails.mjs
 *   - scripts/check-layouts.mjs
 */
function ReadinessBeacon({ id }: { id: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <div
      data-ready={mounted ? "1" : "0"}
      data-layout-id={id}
      style={{ position: "fixed", inset: 0, pointerEvents: "none" }}
      aria-hidden
    />
  );
}
