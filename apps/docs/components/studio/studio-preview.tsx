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
import { useEffect, useMemo, useRef, useState } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  SandpackCodeEditor,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Code2,
  Crosshair,
  ExternalLink,
  Eye,
  Loader2,
  MousePointerClick,
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
  type StudioSelection,
} from "@/lib/chat-sandpack";
import { openInCodeSandboxNpm } from "@/lib/chat-export-npm";
import type { GeneratedTheme } from "@/lib/themes";

/**
 * Minimal App module used to prewarm Sandpack when we don't yet have real
 * JSX from the chat. Renders nothing visible — the EmptyPreview overlay
 * sits on top of the iframe anyway. What we care about is that this
 * stands up the bundle / npm installs / CSS pipeline eagerly, so the
 * first real assistant turn lands as an HMR update (fast) rather than a
 * cold Sandpack boot (slow).
 *
 * Keep this a valid standalone module — default export, no imports — or
 * Sandpack will surface a bundler error when the user first visits
 * /studio, before they've even typed anything.
 */
const PLAYGROUND_PLACEHOLDER_APP = [
  "export default function App() {",
  "  return null;",
  "}",
  "",
].join("\n");

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
  /** Current in-iframe element selection. Rendered here purely to gate the
   *  "clear-selection" postMessage — the chat column owns the chip UI. Null
   *  means "no selection; hide overlay". */
  selection?: StudioSelection | null;
  /** Fires when the user clicks an element in select mode. Parent should
   *  stash this into design state so the chat column can show a chip. */
  onSelect?: (selection: StudioSelection) => void;
  className?: string;
}

export function StudioPreview({
  appSource,
  theme,
  mode,
  view,
  onViewChange,
  isStreaming = false,
  selection = null,
  onSelect,
  className,
}: StudioPreviewProps) {
  // While streaming, render whatever we've parsed so far — even mid-fence
  // — so the user sees the component take shape. Sandpack will transiently
  // error on incomplete JSX and recover the moment the fence closes. When
  // idle, keep the old guard (only render when the code looks syntactically
  // balanced) to avoid flashing an error screen on malformed responses.
  //
  // `canRender` still gates whether we *show* the iframe vs an overlay, but
  // Sandpack is now always mounted behind the overlay (see the render path
  // below) so the bundle is already warm when the first JSX arrives.
  const canRender = Boolean(appSource) && (isStreaming || looksComplete(appSource || ""));

  // Normalize the snippet so Sandpack always finds a default export. Without
  // this, bare-JSX or missing-export snippets surface as
  //   "Element type is invalid … got: undefined".
  //
  // Fall back to a no-op placeholder App when we don't yet have real code.
  // This keeps the Sandpack iframe booted and bundled from the moment the
  // /studio route loads — so the *first* chat turn finishes as an HMR swap
  // (fast) rather than triggering a cold bundle boot (slow, jarring). The
  // user sees the EmptyPreview overlay, but behind it the iframe is already
  // up, npm packages installed, CSS applied.
  const preparedSource = useMemo(
    () =>
      appSource ? prepareAppSource(appSource) : PLAYGROUND_PLACEHOLDER_APP,
    [appSource]
  );

  // The complete Sandpack files object — entry, styles, index.html, App.
  // Recomputed on every theme/mode tweak; /index.tsx writes mode +
  // component options onto <html> at runtime so those changes HMR live
  // without needing an iframe reload. See buildPlaygroundEntryTsx.
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

  // ─── Element-selection bus ─────────────────────────────────────────
  //
  // The Sandpack iframe bundles a side-effect module (/selection-agent.ts,
  // see PLAYGROUND_SELECTION_AGENT_TSX in chat-sandpack.ts) imported by
  // /index.tsx. We talk to that agent via window.postMessage so the user
  // can click an element in the preview and ship it back as a chat chip.
  //
  // Why a ref + querySelector instead of useSandpack():
  //   - useSandpack() only works BELOW <SandpackProvider>. This component
  //     owns the provider, so hooks here land above it — out of scope.
  //   - Sandpack's provider doesn't expose the iframe ref in a stable
  //     place across versions; grabbing the iframe via the container
  //     once it's mounted is boring-and-reliable in a way hooks aren't.
  //
  // The iframe reloads on provider remount (we key SandpackErrorBoundary
  // by source), so we also listen for the agent's `grade:agent-ready`
  // ping and re-send the current select-mode / clear state whenever a
  // fresh iframe reports in.
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const [selectMode, setSelectMode] = useState(false);

  const postToIframe = React.useCallback(
    (payload: Record<string, unknown>) => {
      const container = previewContainerRef.current;
      if (!container) return;
      const iframe = container.querySelector("iframe");
      const win = iframe?.contentWindow;
      if (!win) return;
      try {
        win.postMessage(payload, "*");
      } catch {
        // Cross-origin post can reject once the iframe origin locks down;
        // swallow so a flaky frame doesn't blow up the studio.
      }
    },
    []
  );

  // Push the current select-mode + selection state whenever either flips.
  // Re-runs after the iframe reload as well, because the effect reattaches
  // on provider remount and `postToIframe` resolves a fresh iframe each
  // call.
  useEffect(() => {
    postToIframe({ type: "grade:select-mode", enabled: selectMode });
  }, [selectMode, postToIframe]);

  useEffect(() => {
    if (!selection) {
      postToIframe({ type: "grade:clear-selection" });
    }
  }, [selection, postToIframe]);

  // Inbound bus: listen for `grade:selected` (user clicked an element) and
  // `grade:agent-ready` (iframe booted — replay current state so a fresh
  // reload inherits whatever we last wanted). Scoped to `window` because
  // messages from the Sandpack iframe surface on the top-level window.
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      const type = (data as { type?: string }).type;
      if (type === "grade:selected") {
        const sel = (data as { selection?: StudioSelection }).selection;
        if (sel && typeof sel === "object") {
          onSelect?.(sel);
          // Auto-exit select mode after a single capture so the user
          // goes straight back to interacting with the preview. If they
          // want to pick another element, they flip the toggle again.
          setSelectMode(false);
        }
      } else if (type === "grade:agent-ready") {
        // Fresh iframe booted — rehydrate it with our latest intent.
        postToIframe({ type: "grade:select-mode", enabled: selectMode });
        if (!selection) {
          postToIframe({ type: "grade:clear-selection" });
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onSelect, postToIframe, selectMode, selection]);

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
          {selection?.componentName && (
            <span
              className="flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-medium text-primary"
              title={
                selection.part
                  ? `Editing <${selection.componentName}> (data-gds-part="${selection.part}")`
                  : `Editing <${selection.componentName}>`
              }
            >
              <Crosshair className="h-3 w-3" aria-hidden />
              Editing
              <span className="opacity-90">&lt;{selection.componentName}&gt;</span>
            </span>
          )}
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
            onClick={() => setSelectMode((v) => !v)}
            disabled={!appSource || !canRender}
            title={
              selectMode
                ? "Click an element in the preview to attach it to your next prompt"
                : "Enable element select — click a component to comment on it"
            }
            aria-pressed={selectMode}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-0.5 text-xs transition-colors",
              selectMode
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
              "disabled:opacity-50 disabled:pointer-events-none"
            )}
          >
            <MousePointerClick className="h-3 w-3" />
            {selectMode ? "Pick…" : "Select"}
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

      <div
        ref={previewContainerRef}
        className="relative flex-1 min-h-0"
      >
        {/*
          Sandpack is ALWAYS mounted — even before the first chat turn — so
          the bundle, npm installs, and CSS pipeline are already warm when
          real JSX finally arrives. The first real render then lands as an
          HMR swap (sub-second) instead of a cold boot (multi-second, with
          a jarring spinner → flash → content cascade).

          When we don't have real code yet, preparedSource is the no-op
          placeholder defined above; the iframe renders nothing visible,
          and the overlays below cover whatever is (or isn't) showing.

          Keyed by the source so the error boundary resets the moment new
          code arrives — otherwise a prior crash stays latched even after
          the model produces valid JSX on the next turn.

          `--sp-layout-height: 100%` overrides Sandpack's built-in 300px
          floor on SandpackLayout so the preview iframe stretches to fill
          the column instead of pinning at a stubby default height.
        */}
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
                display: view === "code" && canRender ? "flex" : "none",
                border: 0,
              }}
            >
              <SandpackCodeEditor showLineNumbers style={{ height: "100%" }} />
            </SandpackLayout>
            <SandpackLayout
              style={{
                height: "100%",
                // Keep the preview layout mounted at all times (even when
                // !canRender) so Sandpack bundles/installs/boots eagerly.
                // Hide visually — not with `display: none`, which some
                // Sandpack versions treat as "unmount" and defer work —
                // by stretching it under the overlay and letting the
                // overlay take the stage.
                display: view === "preview" ? "flex" : "none",
                border: 0,
              }}
            >
              <SandpackPreviewWithFriendlyErrors />
            </SandpackLayout>
          </SandpackProvider>
        </SandpackErrorBoundary>

        {/*
          Overlays. Positioned absolutely so they sit ON TOP of the warm
          iframe rather than replacing it — that way Sandpack keeps bundling
          in the background while the user looks at EmptyPreview /
          GeneratingPreview, and the transition to the real design is
          instant. `bg-background` hides the empty iframe behind them so the
          user doesn't see the placeholder render flash through.
        */}
        {!canRender && (
          <div className="absolute inset-0 bg-background z-10">
            {isStreaming ? <GeneratingPreview /> : <EmptyPreview />}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Wraps <SandpackPreview> with a friendlier runtime-error overlay.
 *
 * Sandpack ships its own red error screen inside the iframe for runtime
 * failures (undefined identifiers, missing modules, thrown errors, etc.).
 * It's accurate but raw — "Google is not defined" with a stack trace is
 * not what a designer wants to see mid-flow. We suppress the default
 * overlay and render our own, translated via `translateRuntimeError` so
 * the common culprits (Lucide brand-icon hallucinations, subpath imports
 * the barrel doesn't have, frozen babel/syntax issues) get an explanation
 * the user can act on and a one-click Retry.
 *
 * Must live INSIDE <SandpackProvider> — `useSandpack()` reads from the
 * provider context, which is why this is a separate component rather than
 * inlined up at the provider level.
 */
function SandpackPreviewWithFriendlyErrors() {
  const { sandpack } = useSandpack();
  const error = sandpack.error ?? null;

  return (
    <div className="relative flex-1 flex min-h-0 h-full">
      <SandpackPreview
        showOpenInCodeSandbox
        showRefreshButton
        showSandpackErrorOverlay={false}
        style={{ height: "100%", flex: 1 }}
      />
      {error && (
        <FriendlyRuntimeError
          error={error}
          onRetry={() => {
            // Clear the error state and reboot the bundler — usually the
            // underlying cause is fixed by a fresh chat turn, but for the
            // cases where the *same* broken code comes back (user asked
            // to see it render), give them an explicit reset too.
            sandpack.runSandpack();
          }}
        />
      )}
    </div>
  );
}

/**
 * Lucide brand / company names the model loves to hallucinate. Lucide's icon
 * set is tradename-free on purpose, so these imports always explode at render
 * time with "Element type is invalid" / "X is not defined". We catch them
 * here so the user sees "Lucide doesn't ship the Google logo" instead of a
 * generic reference error.
 */
const LUCIDE_BRAND_NAMES = new Set<string>([
  "Google",
  "Apple",
  "GitHub",
  "Github",
  "Facebook",
  "Twitter",
  "X",
  "Meta",
  "Discord",
  "LinkedIn",
  "Linkedin",
  "Instagram",
  "TikTok",
  "Tiktok",
  "YouTube",
  "Youtube",
  "Slack",
  "Figma",
  "Notion",
  "Spotify",
  "Microsoft",
  "Amazon",
]);

interface TranslatedError {
  title: string;
  body: React.ReactNode;
  /** Optional "technical details" string — rendered in a collapsible so it's
   *  there for the rare case a designer wants to copy-paste into chat, but
   *  not in the user's face by default. */
  raw?: string;
}

/**
 * Map Sandpack's raw error text into something designer-legible.
 *
 * The ordering matters — more specific matches first, then fallthroughs.
 * Returning `raw` on the default path is a safety net: if we don't recognize
 * the shape, at least don't hide the message entirely.
 */
function translateRuntimeError(message: string): TranslatedError {
  const text = message || "";

  // "Could not find module '@gradeui/ui/button'" / "Cannot find module"
  const modMatch = text.match(/(?:Could not find|Cannot find) module ['"]([^'"]+)['"]/);
  if (modMatch) {
    const mod = modMatch[1];
    // Subpath import from the barrel-only package.
    if (/^@gradeui\/ui\//.test(mod)) {
      return {
        title: `“${mod}” isn’t a valid import path`,
        body: (
          <>
            <code className="font-mono">@gradeui/ui</code> only exports the
            single top-level barrel. Ask the chat to import everything from{" "}
            <code className="font-mono">&quot;@gradeui/ui&quot;</code> in one
            statement — e.g.{" "}
            <code className="font-mono">
              import &#123; Button, Card &#125; from &quot;@gradeui/ui&quot;
            </code>
            .
          </>
        ),
        raw: text,
      };
    }
    return {
      title: `Missing package: “${mod}”`,
      body: (
        <>
          The preview sandbox can&rsquo;t find{" "}
          <code className="font-mono">{mod}</code>. It&rsquo;s probably not in
          the preview&rsquo;s dependency list. Ask the chat to stick to{" "}
          <code className="font-mono">@gradeui/ui</code>,{" "}
          <code className="font-mono">lucide-react</code>, and{" "}
          <code className="font-mono">recharts</code>.
        </>
      ),
      raw: text,
    };
  }

  // "X is not defined" (ReferenceError) — classic for missing import.
  const refMatch = text.match(/(?:ReferenceError:\s*)?(\w+) is not defined/);
  if (refMatch) {
    const name = refMatch[1];
    if (LUCIDE_BRAND_NAMES.has(name)) {
      return {
        title: `lucide-react doesn’t ship a “${name}” icon`,
        body: (
          <>
            Lucide is trademark-free, so brand logos like{" "}
            <code className="font-mono">{name}</code> aren&rsquo;t in the set.
            Ask the chat to use a neutral icon (<code>LogIn</code>,{" "}
            <code>Mail</code>, <code>KeyRound</code>) and put the brand in the
            text label, or drop the icon entirely.
          </>
        ),
        raw: text,
      };
    }
    return {
      title: `“${name}” isn’t defined in the preview`,
      body: (
        <>
          The generated code uses <code className="font-mono">{name}</code> but
          never imports or declares it. Ask the chat to fix the imports — if
          it&rsquo;s meant to be a Grade DS component, make sure it&rsquo;s
          pulled in from <code className="font-mono">&quot;@gradeui/ui&quot;</code>.
        </>
      ),
      raw: text,
    };
  }

  // "Element type is invalid" — almost always an undefined import.
  if (/Element type is invalid/.test(text)) {
    return {
      title: "A component rendered as `undefined`",
      body: (
        <>
          Usually caused by importing a name the package doesn&rsquo;t export —
          common culprits are brand icons from{" "}
          <code className="font-mono">lucide-react</code> (<code>Google</code>,{" "}
          <code>Apple</code>, <code>GitHub</code>, etc.) or a typo in a{" "}
          <code className="font-mono">@gradeui/ui</code> component name. Ask the
          chat to double-check the <code>import</code> statements.
        </>
      ),
      raw: text,
    };
  }

  // Babel / parser failures.
  if (/SyntaxError|Unexpected token|Unterminated/.test(text)) {
    return {
      title: "The JSX has a syntax error",
      body: (
        <>
          Often a <code>className</code> attribute split across lines or an
          unterminated string. Asking the chat to &ldquo;regenerate&rdquo; or
          &ldquo;fix the syntax&rdquo; usually clears it on the next turn.
        </>
      ),
      raw: text,
    };
  }

  // TypeError — often "Cannot read properties of undefined (reading 'foo')".
  if (/TypeError:/.test(text)) {
    return {
      title: "Something rendered with missing data",
      body: (
        <>
          The component read a property off{" "}
          <code className="font-mono">undefined</code>. Ask the chat to add
          default values or guard the render (e.g. &ldquo;show an empty state
          when the list is empty&rdquo;).
        </>
      ),
      raw: text,
    };
  }

  return {
    title: "Preview ran into an error",
    body: (
      <>
        Something inside the generated component threw at runtime. Asking the
        chat to &ldquo;fix the preview error&rdquo; and sharing this message
        usually gets a working version on the next turn.
      </>
    ),
    raw: text,
  };
}

function FriendlyRuntimeError({
  error,
  onRetry,
}: {
  error: { message: string; title?: string };
  onRetry: () => void;
}) {
  const translated = useMemo(
    () => translateRuntimeError(error.message ?? ""),
    [error.message]
  );
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="absolute inset-0 z-20 overflow-auto bg-background/95 backdrop-blur-sm p-6">
      <div className="max-w-lg mx-auto rounded-lg border border-destructive/30 bg-destructive-soft text-destructive-deep p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" aria-hidden />
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <div className="text-sm font-semibold leading-tight">
                {translated.title}
              </div>
              <div className="text-[11px] uppercase tracking-wide opacity-60 mt-0.5">
                Preview error
              </div>
            </div>
            <div className="text-sm leading-relaxed opacity-95">
              {translated.body}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Retry preview
              </button>
              {translated.raw && (
                <button
                  type="button"
                  onClick={() => setShowRaw((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-1 text-xs font-medium opacity-70 hover:opacity-100 hover:border-border transition-colors"
                >
                  {showRaw ? "Hide" : "Show"} technical details
                </button>
              )}
            </div>
            {showRaw && translated.raw && (
              <pre className="text-[11px] whitespace-pre-wrap break-words font-mono opacity-80 bg-background/60 border border-border rounded px-2 py-1.5 max-h-48 overflow-auto">
                {translated.raw}
              </pre>
            )}
          </div>
        </div>
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
