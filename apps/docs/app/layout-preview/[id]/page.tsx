"use client";

/**
 * /layout-preview/[id] — a minimal, chromeless Sandpack that renders a
 * single reference layout from `@gradeui/studio/playbook`. Exists purely
 * as a target for the Playwright thumbnail script
 * (`scripts/capture-layout-thumbnails.mjs`): the script visits this URL
 * for each layout, waits for the preview to boot, and screenshots the
 * viewport into `public/layout-thumbs/<id>.png`.
 *
 * Design goals:
 *   - Fixed viewport size matches the thumbnail aspect the picker shows
 *     (1280×800, i.e. 16:10) so the capture never crops unexpectedly.
 *   - No header, no scrollbars, no interactive chrome — we want a pure
 *     preview surface.
 *   - Theme is the site's active theme. That means thumbnails match the
 *     current palette; if the user swaps brand tokens, regenerating is
 *     a one-liner (`pnpm -F @gradeui/docs capture:layout-thumbs`).
 *   - A query param `?snap=1` (or env `E2E=1`) hides even the loading
 *     spinner so the capture frame is stable. Keep the page usable
 *     without the flag for manual debugging.
 *
 * This route is deliberately excluded from the marketing site navigation
 * — it's tooling. Do not link it from user-visible surfaces.
 */

import { use, useEffect, useMemo, useState } from "react";
import {
  SandpackProvider,
  SandpackPreview,
  SandpackLayout,
} from "@codesandbox/sandpack-react";
import { REFERENCE_LAYOUTS } from "@gradeui/studio/playbook";
import {
  buildSandpackFiles,
  PLAYGROUND_DEPENDENCIES,
  PLAYGROUND_EXTERNAL_RESOURCES,
  prepareAppSource,
} from "@/lib/chat-sandpack";
import { useGradeTheme } from "@/components/grade-theme-provider";

export default function LayoutPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ snap?: string }>;
}) {
  const { id } = use(params);
  const { snap } = use(searchParams);
  const snapMode = snap === "1" || process.env.NEXT_PUBLIC_E2E === "1";

  const { theme } = useGradeTheme();
  const layout = useMemo(
    () => REFERENCE_LAYOUTS.find((l) => l.id === id),
    [id]
  );

  const files = useMemo(() => {
    if (!layout) return null;
    return buildSandpackFiles({
      appSource: prepareAppSource(layout.scaffold),
      theme,
      mode: "light",
      appSourceIsPrepared: true,
    });
  }, [layout, theme]);

  if (!layout || !files) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Unknown layout id: <code className="ml-2 font-mono">{id}</code>
      </div>
    );
  }

  return (
    // Chromeless wrapper. The Sandpack preview fills 100vw × 100vh so
    // Playwright can just screenshot the page without touching the DOM.
    <div
      data-layout-id={id}
      className="h-screen w-screen overflow-hidden bg-background"
    >
      <SandpackProvider
        template="react-ts"
        files={files}
        customSetup={{
          dependencies: PLAYGROUND_DEPENDENCIES,
        }}
        options={{
          externalResources: [...PLAYGROUND_EXTERNAL_RESOURCES],
          recompileMode: "immediate",
          // Bump the bundler timeout — a cold boot plus the `@gradeui/ui`
          // install pulls from npm, which is fine for interactive use
          // but tight for headless capture. 60s is enough headroom even
          // on slow CI runners.
          bundlerTimeOut: 60_000,
        }}
      >
        <SandpackLayout className="!rounded-none !border-none !h-screen">
          <SandpackPreview
            showNavigator={false}
            showOpenInCodeSandbox={false}
            showRefreshButton={false}
            showSandpackErrorOverlay={!snapMode}
            showOpenNewtab={false}
            className="!h-screen !w-screen"
          />
        </SandpackLayout>
        {/* Signal readiness to the Playwright driver. The bundler doesn't
            expose a clean "client rendered" hook from here, so we lean on
            the same polling the capture script uses — waiting for the
            iframe to have non-zero height and then a short settle period.
            See scripts/capture-layout-thumbnails.mjs. */}
        <ReadinessBeacon id={id} />
      </SandpackProvider>
    </div>
  );
}

/**
 * Invisible DOM marker the Playwright script uses as its "OK, Sandpack
 * mounted" sentinel. Separate from the iframe-readiness wait — that's
 * what the script polls for content — but a nice cheap hook for
 * "the outer page rendered".
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
