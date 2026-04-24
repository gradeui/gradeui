"use client";

/**
 * Sandpack-specific preview mounts, extracted from studio-canvas.tsx so
 * the renderer surface can be swapped behind a shared prop interface.
 * Two mount sites, two components here:
 *
 *   FocusedSandpackMount — full-column preview with code/preview toggle
 *                          and viewport-width picker (mobile/tablet/
 *                          desktop/responsive). Mounted once per focused
 *                          design in Fit mode.
 *
 *   TileSandpackMount   — the shrunken preview used inside each ScreenTile
 *                          in All mode. No code view, no viewport picker,
 *                          no interaction (the tile wraps this in a
 *                          pointer-events-none scaled frame and handles
 *                          clicks itself).
 *
 * SandpackErrorBoundary + its SandpackFailure view live here too — they're
 * Sandpack-specific (the copy refers to the bundler's error shape).
 * EmptyPreview / GeneratingPreview are renderer-agnostic and stay in
 * studio-canvas.tsx.
 *
 * The fast-renderer siblings (FocusedFastMount / TileFastMount) will land
 * alongside these in a follow-up so StudioCanvas can switch between them
 * behind a rendererMode prop.
 */

import * as React from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  SandpackCodeEditor,
} from "@codesandbox/sandpack-react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import {
  PLAYGROUND_DEPENDENCIES,
  PLAYGROUND_EXTERNAL_RESOURCES,
  buildSandpackFiles,
} from "@/lib/chat-sandpack";

/**
 * Viewport widths for the focused-frame picker. "responsive" means "let
 * the preview fill the column" — the equivalent of having no width
 * constraint. The pixel presets mirror common device-frame widths that
 * the model is already trained on through Tailwind's `sm/md/lg`
 * breakpoints, so picking "Mobile" actually exercises the sm: branch
 * of the generated markup rather than just cropping the desktop layout.
 *
 * Kept as a module constant so adding a bespoke width later (say a
 * custom iPad Pro 1024 vs 1194) is a one-line change and every
 * consumer picks it up.
 */
export type ViewportWidth = "mobile" | "tablet" | "desktop" | "responsive";
export const VIEWPORT_WIDTHS: Record<
  Exclude<ViewportWidth, "responsive">,
  number
> = {
  mobile: 390,
  tablet: 768,
  desktop: 1024,
};

/** The virtual filesystem shape Sandpack receives — matches whatever
 *  buildSandpackFiles returns so we don't have to restate it here. */
export type SandpackFiles = ReturnType<typeof buildSandpackFiles>;

// ─── Focused mount ────────────────────────────────────────────────────

interface FocusedSandpackMountProps {
  sandpackFiles: SandpackFiles;
  /** The prepared App source. Used only as an error-boundary reset key —
   *  when it changes, any stale compile error is cleared. */
  preparedSource: string;
  mode: "light" | "dark";
  view: "preview" | "code";
  /** False while the chat hasn't produced a renderable snippet yet. Drives
   *  the code-view's display toggle (the preview-side toggle is driven
   *  by `view` alone — the empty/generating overlays are painted by the
   *  parent StudioCanvas, not here). */
  canRender: boolean;
  viewportWidth: ViewportWidth;
}

/**
 * The SandpackProvider + dual-layout subtree that used to live inline
 * inside FocusedFrame. Holds both the code editor layout and the preview
 * layout inside the same provider so flipping between Code/Preview
 * doesn't remount the bundler. Non-"responsive" viewport widths render
 * the preview floating on a dot-grid artboard for a design-tool feel.
 */
export function FocusedSandpackMount({
  sandpackFiles,
  preparedSource,
  mode,
  view,
  canRender,
  viewportWidth,
}: FocusedSandpackMountProps) {
  return (
    <SandpackErrorBoundary resetKey={preparedSource}>
      <SandpackProvider
        template="react-ts"
        theme={mode === "dark" ? "dark" : "light"}
        options={{
          externalResources: [...PLAYGROUND_EXTERNAL_RESOURCES],
          // Scope the code editor to App.tsx. All the other files in
          // the bundle (index.tsx, selection-agent.ts, theme-options.tsx,
          // styles.css, /public/index.html) are scaffold we generate —
          // the user only cares whether the MODEL is emitting the JSX
          // they expected. Hiding them also trims the tab-strip clutter.
          visibleFiles: ["/App.tsx"],
          activeFile: "/App.tsx",
        }}
        customSetup={{
          dependencies: { ...PLAYGROUND_DEPENDENCIES },
          entry: "/index.tsx",
        }}
        files={sandpackFiles}
        style={
          {
            height: "100%",
            "--sp-layout-height": "100%",
          } as React.CSSProperties
        }
      >
        <SandpackLayout
          style={{
            height: "100%",
            display: view === "code" && canRender ? "flex" : "none",
            border: 0,
          }}
        >
          {/* showTabs={false} belt-and-braces with visibleFiles above:
              with a single visible file there's nothing to tab between,
              so the strip is pure chrome. */}
          <SandpackCodeEditor
            showLineNumbers
            showTabs={false}
            style={{ height: "100%" }}
          />
        </SandpackLayout>
        {/* Viewport-width wrapper. The SandpackProvider's root is a
            block-level div, so `flex: 1` on this wrapper wouldn't
            pick up any height — we have to take it explicitly via
            `height: 100%`. "responsive" falls back to width: 100%
            with no max-width so the iframe fills the column as
            before (behavioral parity with pre-picker). Non-responsive
            presets center a width-constrained SandpackLayout on an
            artboard backdrop so the preview reads like a device
            sitting on a design surface — dot grid for spatial cues
            (so you can see exactly where the iframe starts), and an
            outline on the iframe itself so it separates from the
            artboard regardless of whether the rendered UI has its
            own background.

            Pattern: radial-gradient dots at a fixed pitch, tinted
            via the `--border` token so the grid tracks the active
            theme (dark mode gets a dark grid on a slightly-lighter
            artboard, light mode gets the inverse). 16px pitch is
            dense enough to feel like a design tool without moiréing
            against the scaled content inside the iframe. */}
        <div
          style={{
            display: view === "preview" ? "flex" : "none",
            height: "100%",
            width: "100%",
            justifyContent: "center",
            alignItems: "stretch",
            // IMPORTANT: `background` (shorthand) resets
            // `background-image` as part of its longhand
            // cascade, and React doesn't reliably preserve
            // style-object property order when serializing
            // to an inline style attribute. `backgroundColor`
            // longhand alongside `backgroundImage` sidesteps
            // that entirely.
            //
            // Color picked via `--muted-foreground` rather
            // than `--foreground` — the former is the mid-
            // tone the theme already uses for subtle text on
            // `--muted`, so it sits in the same perceptual
            // lightness band across light + dark modes.
            // `--foreground` at any visible alpha was
            // near-black in light mode (way too heavy) and
            // invisible in dark mode (white at low alpha
            // against dark grey just disappears). Mid-tone
            // at ~45% alpha reads in both.
            backgroundColor:
              viewportWidth === "responsive"
                ? undefined
                : "var(--muted)",
            backgroundImage:
              viewportWidth === "responsive"
                ? undefined
                : "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize:
              viewportWidth === "responsive" ? undefined : "16px 16px",
            color:
              viewportWidth === "responsive"
                ? undefined
                : "color-mix(in oklab, var(--muted-foreground) 45%, transparent)",
            padding: viewportWidth === "responsive" ? 0 : "1rem",
          }}
        >
          <SandpackLayout
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              // Visible outline only when the iframe is floating on
              // the dot-grid artboard. In responsive mode the frame
              // already butts right against the column chrome, so a
              // second border there would just be noise.
              border:
                viewportWidth === "responsive"
                  ? 0
                  : "1px solid var(--border)",
              borderRadius:
                viewportWidth === "responsive" ? 0 : "0.5rem",
              // overflow:hidden so the child SandpackPreview's
              // rounded corners line up with our radius. Without it
              // the iframe bleeds past the outline at the corners.
              overflow:
                viewportWidth === "responsive" ? undefined : "hidden",
              // A soft drop shadow reinforces the "artboard" read —
              // cheap depth cue, same pattern Figma/Framer use.
              boxShadow:
                viewportWidth === "responsive"
                  ? undefined
                  : "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)",
              background: "var(--background)",
              // Pin the preview to the selected pixel width, clamped
              // to the column so a narrow canvas doesn't introduce
              // horizontal scroll.
              maxWidth:
                viewportWidth === "responsive"
                  ? undefined
                  : VIEWPORT_WIDTHS[viewportWidth],
            }}
          >
            <SandpackPreview
              showOpenInCodeSandbox
              showRefreshButton
              style={{ height: "100%", flex: 1 }}
            />
          </SandpackLayout>
        </div>
      </SandpackProvider>
    </SandpackErrorBoundary>
  );
}

// ─── Tile mount ───────────────────────────────────────────────────────

interface TileSandpackMountProps {
  sandpackFiles: SandpackFiles;
  preparedSource: string;
  mode: "light" | "dark";
}

/**
 * The small Sandpack used inside each ScreenTile in All mode. Caller
 * wraps this in a scaled, pointer-events-none container, so the preview
 * renders at TILE_VIRTUAL_WIDTH × TILE_VIRTUAL_HEIGHT and is CSS-scaled
 * down to fit the tile. No code editor, no viewport picker — tiles are
 * read-only previews.
 */
export function TileSandpackMount({
  sandpackFiles,
  preparedSource,
  mode,
}: TileSandpackMountProps) {
  return (
    <SandpackErrorBoundary resetKey={preparedSource}>
      <SandpackProvider
        template="react-ts"
        theme={mode === "dark" ? "dark" : "light"}
        options={{
          externalResources: [...PLAYGROUND_EXTERNAL_RESOURCES],
          // Same rationale as FocusedSandpackMount — even though tiles
          // don't surface a code editor, the bundler's "which file am I
          // primarily working on" heuristic is a touch faster when we
          // point it at App.tsx directly.
          visibleFiles: ["/App.tsx"],
          activeFile: "/App.tsx",
        }}
        customSetup={{
          dependencies: { ...PLAYGROUND_DEPENDENCIES },
          entry: "/index.tsx",
        }}
        files={sandpackFiles}
        style={
          {
            height: "100%",
            width: "100%",
            "--sp-layout-height": "100%",
          } as React.CSSProperties
        }
      >
        <SandpackLayout
          style={{ height: "100%", width: "100%", border: 0 }}
        >
          <SandpackPreview
            showOpenInCodeSandbox={false}
            showRefreshButton={false}
            style={{ height: "100%", width: "100%", flex: 1 }}
          />
        </SandpackLayout>
      </SandpackProvider>
    </SandpackErrorBoundary>
  );
}

// ─── Error boundary ───────────────────────────────────────────────────

interface SandpackErrorBoundaryProps {
  resetKey: string;
  children: React.ReactNode;
}
interface SandpackErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches errors thrown during Sandpack's bundling / render of the user's
 * snippet. The reset-key pattern: when `preparedSource` changes identity,
 * clear any stashed error so the next try gets a fresh mount.
 */
export class SandpackErrorBoundary extends React.Component<
  SandpackErrorBoundaryProps,
  SandpackErrorBoundaryState
> {
  state: SandpackErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): SandpackErrorBoundaryState {
    return { error };
  }

  componentDidUpdate(prev: SandpackErrorBoundaryProps) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  handleRetry = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <SandpackFailure error={this.state.error} onRetry={this.handleRetry} />
      );
    }
    return this.props.children;
  }
}

function SandpackFailure({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  const cleaned = error.message
    .replace(/^\/?App\.tsx:\s*/, "")
    .replace(
      /^\s*Cannot assign to read only property 'message' of object '[^']+':\s*/,
      ""
    );
  return (
    <div className="h-full overflow-auto p-6 text-sm">
      <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive-soft p-4 text-destructive-deep">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="font-medium leading-tight">
            Preview couldn&rsquo;t compile the latest snippet
          </div>
          <pre className="text-xs whitespace-pre-wrap break-words font-mono opacity-90 bg-background/40 border border-border rounded px-2 py-1.5">
            {cleaned}
          </pre>
          <p className="text-xs opacity-80">
            Usually this means the model emitted malformed JSX (common cause:
            a <code className="font-mono">className</code> attribute wrapped
            across lines). Asking the chat to &ldquo;fix the syntax&rdquo; or
            regenerate should clear it.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
