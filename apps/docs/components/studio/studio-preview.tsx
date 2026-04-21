"use client";

/**
 * StudioPreview — the middle column of /studio.
 *
 * Renders whatever JSX the chat most recently produced inside a Sandpack
 * iframe, using the theme currently in the builder panel (the *working*
 * theme) rather than the site-wide active theme. This lets the user edit
 * the theme freely without affecting the rest of the docs site.
 *
 * Deliberately mirrors the Sandpack setup in DesignPreview + /play so the
 * same components render consistently — only difference is where the
 * theme comes from (prop vs. useGradeTheme hook).
 */

import * as React from "react";
import { useMemo, useState } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  SandpackCodeEditor,
} from "@codesandbox/sandpack-react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Code2,
  ExternalLink,
  Eye,
  Loader2,
  Package,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildSandpackFiles,
  looksComplete,
  PLAYGROUND_DEPENDENCIES,
  PLAYGROUND_EXTERNAL_RESOURCES,
  prepareAppSource,
} from "@/lib/chat-sandpack";
import { openInCodeSandboxNpm } from "@/lib/chat-export-npm";
import type { GeneratedTheme } from "@/lib/themes";

interface StudioPreviewProps {
  /** The raw JSX block extracted from the latest assistant message — may be
   *  a bare expression, a named function, or a full module. We normalize it
   *  via prepareAppSource() before handing it to Sandpack. Pass `null` when
   *  nothing to show yet. */
  appSource: string | null;
  /** The theme being edited in the builder panel. Drives CSS vars injected
   *  into the Sandpack iframe. */
  theme: GeneratedTheme;
  /** Preview mode — light or dark. Independent of the site mode. */
  mode: "light" | "dark";
  /** Preview/code toggle — controlled so the parent can persist the choice
   *  across theme edits (otherwise Sandpack remounts reset it). */
  view: "preview" | "code";
  onViewChange: (view: "preview" | "code") => void;
  /** True while the chat is generating a response. Drives the header
   *  spinner and the full-column placeholder when there's no code yet. */
  isStreaming?: boolean;
  className?: string;
}

export function StudioPreview({
  appSource,
  theme,
  mode,
  view,
  onViewChange,
  isStreaming = false,
  className,
}: StudioPreviewProps) {
  // While streaming, render whatever we've parsed so far — even mid-fence
  // — so the user sees the component take shape. Sandpack will transiently
  // error on incomplete JSX and recover the moment the fence closes. When
  // idle, keep the old guard (only render when the code looks syntactically
  // balanced) to avoid flashing an error screen on malformed responses.
  const canRender = Boolean(appSource) && (isStreaming || looksComplete(appSource || ""));

  // Normalize the snippet so Sandpack always finds a default export. Without
  // this, bare-JSX or missing-export snippets surface as
  //   "Element type is invalid … got: undefined".
  const preparedSource = useMemo(
    () => (appSource ? prepareAppSource(appSource) : ""),
    [appSource]
  );

  // The complete Sandpack files object — entry, styles, index.html,
  // inlined components. Recomputed on every theme/mode tweak, but
  // Sandpack's file-level diffing only remounts when /public/index.html
  // actually changes (which happens when mode flips, since it controls
  // the html class and data attributes).
  const sandpackFiles = useMemo(
    () =>
      buildSandpackFiles({
        appSource: preparedSource,
        appSourceIsPrepared: true,
        theme,
        mode,
      }),
    [preparedSource, theme, mode]
  );

  // "Open as npm sandbox" — sibling export path that ships a CodeSandbox
  // project with @gradeui/ui pulled from npm (no inlined component blobs).
  // The default Sandpack "Open in CodeSandbox" button still ships the
  // inlined files; this one is the real integration test of the published
  // package.
  const [exportingNpm, setExportingNpm] = useState(false);
  const handleOpenNpm = async () => {
    if (!appSource || exportingNpm) return;
    setExportingNpm(true);
    try {
      await openInCodeSandboxNpm({ appSource, theme, mode });
    } catch (err) {
      // Surface as console — a toast system would be the next step but the
      // failure is rare (CodeSandbox API is generally up).
      console.error("Failed to open in CodeSandbox (npm):", err);
    } finally {
      setExportingNpm(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-background border border-border rounded-lg overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Eye className="h-3 w-3" />
          <span>Live preview</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70 border border-border rounded px-1.5 py-0.5">
            {theme.name}
          </span>
          {isStreaming && (
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-primary">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onViewChange("preview")}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-0.5 text-xs transition-colors",
              view === "preview"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye className="h-3 w-3" />
            Preview
          </button>
          <button
            type="button"
            onClick={() => onViewChange("code")}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-0.5 text-xs transition-colors",
              view === "code"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Code2 className="h-3 w-3" />
            Code
          </button>
          <div className="mx-1 h-3 w-px bg-border" aria-hidden />
          <button
            type="button"
            onClick={handleOpenNpm}
            disabled={!appSource || exportingNpm}
            title="Open in CodeSandbox using @gradeui/ui from npm"
            className={cn(
              "flex items-center gap-1 rounded px-2 py-0.5 text-xs transition-colors",
              "text-muted-foreground hover:text-foreground",
              "disabled:opacity-50 disabled:pointer-events-none"
            )}
          >
            {exportingNpm ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Package className="h-3 w-3" />
            )}
            npm
            <ExternalLink className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {canRender ? (
          // Keyed by the source so the boundary resets the moment new code
          // arrives — otherwise a prior crash stays latched even after the
          // model produces valid JSX on the next turn.
          //
          // `--sp-layout-height: 100%` overrides Sandpack's built-in 300px
          // floor on SandpackLayout so the preview iframe stretches to fill
          // the column instead of pinning at a stubby default height.
          <SandpackErrorBoundary resetKey={preparedSource}>
            <SandpackProvider
              template="react-ts"
              theme={mode === "dark" ? "dark" : "light"}
              options={{
                externalResources: [...PLAYGROUND_EXTERNAL_RESOURCES],
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
                  display: view === "code" ? "flex" : "none",
                  border: 0,
                }}
              >
                <SandpackCodeEditor showLineNumbers style={{ height: "100%" }} />
              </SandpackLayout>
              <SandpackLayout
                style={{
                  height: "100%",
                  display: view === "preview" ? "flex" : "none",
                  border: 0,
                }}
              >
                <SandpackPreview
                  showOpenInCodeSandbox
                  showRefreshButton
                  style={{ height: "100%", flex: 1 }}
                />
              </SandpackLayout>
            </SandpackProvider>
          </SandpackErrorBoundary>
        ) : isStreaming ? (
          <GeneratingPreview />
        ) : (
          <EmptyPreview />
        )}
      </div>
    </div>
  );
}

/**
 * Catches render-time failures inside Sandpack — specifically the
 *   "Cannot assign to read only property 'message' of SyntaxError"
 * that `@codesandbox/sandpack-client` throws when trying to enrich a frozen
 * Babel error. These happen when the LLM emits syntactically invalid JSX
 * (unterminated strings, stray fence markers, etc.) faster than our
 * `repairMultilineStrings` pass can defuse.
 *
 * We key the boundary on the source so a subsequent valid snippet auto-
 * resets the boundary and re-mounts the provider — no user click needed,
 * though we also expose a manual Retry for the pathological case where
 * the same broken code comes back.
 */
interface SandpackErrorBoundaryProps {
  resetKey: string;
  children: React.ReactNode;
}
interface SandpackErrorBoundaryState {
  error: Error | null;
}
class SandpackErrorBoundary extends React.Component<
  SandpackErrorBoundaryProps,
  SandpackErrorBoundaryState
> {
  state: SandpackErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): SandpackErrorBoundaryState {
    return { error };
  }

  componentDidUpdate(prev: SandpackErrorBoundaryProps) {
    // Auto-recover when the input code changes — next chat turn usually
    // produces valid JSX and we want the preview to come back on its own.
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
  // Babel error messages carry a lot of line/col context that is more
  // useful when formatted vertically. Strip our sandboxed paths from the
  // front so the user sees the real problem.
  const cleaned = error.message
    .replace(/^\/?App\.tsx:\s*/, "")
    .replace(/^\s*Cannot assign to read only property 'message' of object '[^']+':\s*/, "");
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

function EmptyPreview() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/70 to-primary/30 flex items-center justify-center mb-4 shadow-md">
        <Sparkles className="h-7 w-7 text-primary-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">
        Describe a UI on the left
      </h3>
      <p className="text-sm max-w-sm">
        Ask the assistant for a component — a login form, a pricing card,
        a settings panel — and the result renders here, wearing whatever
        theme you&rsquo;re building on the right.
      </p>
    </div>
  );
}

/**
 * Shown after send but before any usable JSX has arrived. Mirrors the
 * "Thinking…" indicator in the chat column so both sides of the split feel
 * alive at the same time. A set of skeleton blocks hints at where the
 * component will land, pulsing in sync.
 */
function GeneratingPreview() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md"
      >
        <Loader2 className="h-7 w-7 text-primary-foreground animate-spin" />
      </motion.div>
      <div className="text-center">
        <h3 className="text-base font-semibold text-foreground">
          Generating your component
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          The preview will light up as soon as the code starts arriving.
        </p>
      </div>
      <div className="w-full max-w-xs space-y-2 mt-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
            className={cn(
              "h-3 rounded-md bg-muted",
              i === 0 && "w-3/4",
              i === 1 && "w-full",
              i === 2 && "w-1/2"
            )}
          />
        ))}
      </div>
    </div>
  );
}
