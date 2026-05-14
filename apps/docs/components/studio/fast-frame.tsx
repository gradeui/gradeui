"use client";

/**
 * Fast renderer — iframe edition.
 *
 * Hosts a dedicated Next sandbox page (`/fast-sandbox`) in an iframe and
 * pipes source / theme / selection via postMessage. React lives *inside*
 * the iframe, so:
 *
 *   - Radix portals (Dialog, Popover, DropdownMenu, Sheet, Tooltip, etc.)
 *     land in `iframe.body` rather than leaking to the Studio chrome.
 *   - `instanceof HTMLElement` and other cross-realm checks resolve
 *     against the iframe's own window — no realm mismatches.
 *   - `@media` queries evaluate against the iframe's viewport, so the
 *     viewport-width picker (Mobile 390 / Tablet 768 / Desktop 1024)
 *     actually trips responsive breakpoints inside the preview.
 *   - Scroll events never cross the iframe boundary → no Lenis
 *     touchpoint, no overscroll-behavior hacks.
 *
 * What still lives here (parent realm):
 *   - Iframe lifecycle + message plumbing
 *   - Preview chrome (viewport artboard, Code view read-only pre)
 *   - Per-tile scaling math for All mode
 *
 * What moved to the sandbox page:
 *   - Module vocabulary (all @gradeui/ui, lucide, recharts, etc.)
 *   - sucrase compile + new Function eval
 *   - Selection agent (installStudioSelectionAgent from the shared
 *     module — same one Sandpack will consume once task #10 lands)
 *   - Default provider wrapping (TooltipProvider) so snippets don't
 *     need to include boilerplate a normal app root already has.
 *
 * Exports mirror sandpack-frame.tsx so StudioCanvas switches renderers
 * with a single conditional:
 *   FocusedFastMount — full-column preview with view (preview/code) +
 *                      viewport-width artboard.
 *   TileFastMount    — shrunken preview for All-mode tiles. Pure iframe,
 *                      no chrome.
 */

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  prepareAppSource,
  type StudioSelection,
} from "@/lib/chat-sandpack";
import { CodeView } from "@/components/studio/code-view";
import { themeToCSSVars } from "@/lib/themes/apply";
import type { GeneratedTheme } from "@/lib/themes";
import type { ViewportWidth } from "@/components/studio/sandpack-frame";

// URL of the sandbox Next route. Route is defined at
// apps/docs/app/fast-sandbox/page.tsx.
const SANDBOX_URL = "/fast-sandbox";

// ─── FastIframeHost ───────────────────────────────────────────────────
//
// Core building block — a configured iframe + message bus. Single
// instance for FocusedFastMount, one per tile for TileFastMount.

interface FastIframeHostProps {
  appSource: string | null;
  theme: GeneratedTheme;
  mode: "light" | "dark";
  selectMode?: boolean;
  onSelect?: (selection: StudioSelection) => void;
  /** Called after the agent reports a selection so the parent can flip
   *  the Select-mode pill off — matches the Sandpack agent's auto-exit
   *  behaviour. */
  onSelectModeChange?: (next: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
}

function FastIframeHost({
  appSource,
  theme,
  mode,
  selectMode = false,
  onSelect,
  onSelectModeChange,
  className,
  style,
}: FastIframeHostProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  // Stash the callbacks in refs so the message-listener effect's dep
  // array stays empty — new onSelect identities on every parent render
  // shouldn't tear down and reattach the listener.
  const onSelectRef = useRef(onSelect);
  const onSelectModeChangeRef = useRef(onSelectModeChange);
  useEffect(() => {
    onSelectRef.current = onSelect;
    onSelectModeChangeRef.current = onSelectModeChange;
  }, [onSelect, onSelectModeChange]);

  // Listen for sandbox → parent messages. Guard on source so multiple
  // Fast iframes (one focused + N tiles in All mode) don't cross-talk.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const data = e.data as
        | { type?: string; [key: string]: unknown }
        | null;
      if (!data || typeof data !== "object") return;
      switch (data.type) {
        case "grade:fast-ready":
          setReady(true);
          break;
        case "grade:selected": {
          const sel = data.selection as StudioSelection | undefined;
          if (sel) onSelectRef.current?.(sel);
          // Auto-exit — parity with Sandpack agent's "flip off after
          // capture" behaviour so the user keeps their flow.
          onSelectModeChangeRef.current?.(false);
          break;
        }
        // grade:fast-error messages currently just log — the sandbox
        // already rendered its own failure panel inside the iframe, so
        // there's nothing more for the parent to paint.
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Post-to-sandbox helper. No-ops if the iframe isn't loaded yet —
  // the effects below only fire once `ready` flips true, so we're
  // guaranteed to have a contentWindow by then.
  const postToSandbox = (payload: unknown) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(payload, "*");
  };

  // Source updates. Run prepareAppSource here (parent side) so input
  // normalization matches the Sandpack path — duplicate @gradeui/ui
  // imports get merged, legacy local paths rewritten, etc. — before
  // the sandbox compile sees it.
  const preparedSource = useMemo(
    () => (appSource ? prepareAppSource(appSource) : null),
    [appSource]
  );
  useEffect(() => {
    if (!ready || !preparedSource) return;
    postToSandbox({ type: "grade:fast-compile", source: preparedSource });
    // postToSandbox is stable-ish; deliberately excluded from deps so
    // we don't re-send on iframe ref identity thrashes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, preparedSource]);

  // Theme updates. Serialize the var map once and push it over.
  useEffect(() => {
    if (!ready) return;
    const vars = themeToCSSVars(theme, mode);
    postToSandbox({ type: "grade:fast-theme", vars, mode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, theme, mode]);

  // Select-mode toggle.
  useEffect(() => {
    if (!ready) return;
    postToSandbox({ type: "grade:select-mode", enabled: selectMode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, selectMode]);

  return (
    <iframe
      ref={iframeRef}
      src={SANDBOX_URL}
      title="Grade Studio preview"
      // sandbox attribute left off deliberately — the iframe is same-
      // origin (our own Next route) and we trust what we serve there.
      // Setting sandbox="allow-scripts ..." would block same-origin
      // access to iframe.contentDocument which we don't need here
      // (all interop is via postMessage) but would break debugging.
      className={cn("block w-full h-full bg-background", className)}
      style={{ border: 0, ...style }}
    />
  );
}

// ─── Focused mount ────────────────────────────────────────────────────

interface FocusedFastMountProps {
  appSource: string | null;
  theme: GeneratedTheme;
  mode: "light" | "dark";
  view: "preview" | "code";
  /** False while the chat hasn't produced a renderable snippet yet. */
  canRender: boolean;
  viewportWidth: ViewportWidth;
  selectMode?: boolean;
  onSelect?: (selection: StudioSelection) => void;
  onSelectModeChange?: (next: boolean) => void;
}

// Pixel widths for the viewport artboard. Duplicated from sandpack-frame
// — small enough that duplication beats threading a shared map.
const FAST_VIEWPORT_WIDTHS: Record<
  Exclude<ViewportWidth, "responsive">,
  number
> = {
  mobile: 390,
  tablet: 768,
  desktop: 1024,
};

export function FocusedFastMount({
  appSource,
  theme,
  mode,
  view,
  canRender,
  viewportWidth,
  selectMode = false,
  onSelect,
  onSelectModeChange,
}: FocusedFastMountProps) {
  // Memoize the prepared source for the Code view so we don't re-run
  // prepareAppSource on every render purely to display the text.
  const preparedForCodeView = useMemo(
    () => (appSource ? prepareAppSource(appSource) : ""),
    [appSource]
  );

  if (view === "code") {
    // CodeView ships prism-react-renderer highlighting + the
    // data-lenis-prevent attribute that lets trackpad scroll work
    // inside this panel. Fast mode is still read-only; for editing,
    // flip to Sandpack where SandpackCodeEditor is wired up.
    return <CodeView code={preparedForCodeView} language="tsx" />;
  }

  // Preview view — scope by viewport-width artboard to match Sandpack's
  // behaviour: "responsive" fills the column; presets float a width-
  // constrained frame on a dot-grid backdrop so the preview reads like
  // a device sitting on a design surface.
  const isResponsive = viewportWidth === "responsive";
  const maxWidthPx = isResponsive
    ? undefined
    : FAST_VIEWPORT_WIDTHS[viewportWidth];

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        justifyContent: "center",
        alignItems: "stretch",
        backgroundColor: isResponsive ? undefined : "var(--muted)",
        backgroundImage: isResponsive
          ? undefined
          : "radial-gradient(circle, currentColor 1px, transparent 1px)",
        backgroundSize: isResponsive ? undefined : "16px 16px",
        color: isResponsive
          ? undefined
          : "color-mix(in oklab, var(--muted-foreground) 45%, transparent)",
        padding: isResponsive ? 0 : "1rem",
      }}
    >
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          border: isResponsive ? 0 : "1px solid var(--border)",
          borderRadius: isResponsive ? 0 : "0.5rem",
          overflow: isResponsive ? undefined : "hidden",
          boxShadow: isResponsive
            ? undefined
            : "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)",
          background: "var(--background)",
          maxWidth: maxWidthPx,
        }}
      >
        {canRender ? (
          <FastIframeHost
            appSource={appSource}
            theme={theme}
            mode={mode}
            selectMode={selectMode}
            onSelect={onSelect}
            onSelectModeChange={onSelectModeChange}
          />
        ) : null}
      </div>
    </div>
  );
}

// ─── Tile mount ───────────────────────────────────────────────────────

interface TileFastMountProps {
  appSource: string | null;
  theme: GeneratedTheme;
  mode: "light" | "dark";
}

/**
 * Fast-mode counterpart of TileSandpackMount. Caller wraps this in a
 * pointer-events-none scaled div so the iframe renders at virtual
 * viewport size and CSS-scales down into the tile. Select mode is
 * not forwarded — tiles are read-only previews in All mode.
 */
export function TileFastMount({
  appSource,
  theme,
  mode,
}: TileFastMountProps) {
  if (!appSource) return null;
  return (
    <FastIframeHost
      appSource={appSource}
      theme={theme}
      mode={mode}
    />
  );
}
