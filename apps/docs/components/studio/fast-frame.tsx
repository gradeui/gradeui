"use client";

/**
 * Fast renderer — same-document alternative to the Sandpack iframe.
 *
 * Parses the model's emitted JSX with sucrase (JSX + TypeScript + imports
 * transforms), evaluates the result via `new Function` with a scope that
 * has React, hooks, every `@gradeui/ui` export and every `lucide-react`
 * icon, and renders the resulting component inside a React subtree.
 *
 * Trade-offs vs Sandpack:
 *
 *   + No bundler. No npm install. No iframe boot. Sub-100ms from source
 *     change to rendered DOM on a warm cache.
 *
 *   + Same React tree as the rest of Studio. Selection becomes a plain
 *     click handler on our wrapper; theme CSS variables cascade in via
 *     inline style rather than needing a generated /styles.css file.
 *
 *   + Reads `@gradeui/ui` from the workspace via the host app's own
 *     bundle — newly-added components are instantly available in Studio
 *     without the publish-lag dance Sandpack suffers.
 *
 *   - No bundler means no code-splitting, no dynamic imports, no
 *     non-allowlisted npm packages. If the model emits `import foo from
 *     "some-other-thing"` the resolver throws and we surface a failure
 *     with a "Switch to Sandpack" hint.
 *
 *   - No file system. "Code view" in fast mode renders the prepared
 *     source in a read-only <pre>; the full Sandpack code editor is
 *     only available in Sandpack mode.
 *
 * Exports mirror sandpack-frame.tsx:
 *   FocusedFastMount — full-column preview with preview/code toggle and
 *                      viewport-width artboard.
 *   TileFastMount    — shrunken preview used inside ScreenTile in All
 *                      mode. Pure preview, no chrome.
 */

import * as React from "react";
import { useMemo } from "react";
// React 19's automatic JSX runtime. Pulling it in statically here so
// the resolver can hand it back for `import { jsx, jsxs } from
// "react/jsx-runtime"` lines sucrase emits when JSX auto-runtime is
// active. Keeping it static (not dynamic) since it's already in the
// Studio bundle via React itself — no cost to import eagerly.
import * as ReactJsxRuntime from "react/jsx-runtime";
import * as ReactJsxDevRuntime from "react/jsx-dev-runtime";
import { transform as sucraseTransform } from "sucrase";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { prepareAppSource } from "@/lib/chat-sandpack";
import { themeToCSSVars } from "@/lib/themes/apply";
import type { GeneratedTheme } from "@/lib/themes";
import type { ViewportWidth } from "@/components/studio/sandpack-frame";

// ─── Module resolver ──────────────────────────────────────────────────
//
// The model's code uses `import` statements. Sucrase's "imports" transform
// rewrites those into `require(...)` calls against a module shim we
// provide. This map is the shim — a whitelist of names the model is
// allowed to reach for. @gradeui/ui and lucide-react are dynamically
// imported at module load so the cost of pulling their full namespaces
// happens once per Studio session, not per render.

// Lazy bags — populated by ensureModulesLoaded() the first time we compile.
// Dynamic imports keep them out of the initial Studio bundle so loading
// the Studio page doesn't pay for the fast renderer until it's used.
//
// These mirror the Sandpack path's PLAYGROUND_DEPENDENCIES in
// chat-sandpack.ts — same set of modules the model's system prompt
// says it can reach for. If you add an entry there, mirror it here
// (and add it to apps/docs/package.json so Next can bundle it).
let _gradeuiUi: Record<string, unknown> | null = null;
let _lucideReact: Record<string, unknown> | null = null;
let _recharts: Record<string, unknown> | null = null;
let _canvasConfetti: Record<string, unknown> | null = null;
let _clsx: Record<string, unknown> | null = null;
let _cva: Record<string, unknown> | null = null;
let _tailwindMerge: Record<string, unknown> | null = null;
let _modulesReady: Promise<void> | null = null;

// Subscribers notified once the dynamic imports resolve. useCompiledApp
// subscribes via useSyncExternalStore so its memo re-runs on the flip
// without depending on fragile useState lazy-initializer timing.
const _modulesReadySubscribers = new Set<() => void>();

/**
 * Normalize a dynamic-import result so named exports are always reachable
 * at the top level, and shout loudly on the console when the snippet
 * reaches for a name the module doesn't actually have.
 *
 * Dynamic `import()` returns different shapes depending on whether the
 * bundler resolved the target as ESM or CJS-wrapped:
 *   - ESM: `{ Button, Card, ..., default?: ..., [Symbol.toStringTag]: "Module" }`
 *   - CJS (webpack/turbopack interop wrap): `{ default: { Button, ... }, __esModule: true }`
 *
 * The returned Proxy falls through to `.default` on miss (the CJS case)
 * and logs a `[fast-frame]` warning whenever a PascalCase export is
 * queried but not found — which is the only class of miss that will
 * ever cause React's "Element type is invalid" error.
 */
function normalizeModuleNamespace(
  mod: unknown,
  label: string
): Record<string, unknown> {
  const m = mod as Record<string, unknown> & { default?: unknown };
  if (!m || typeof m !== "object") {
    return {};
  }
  const def = (m.default && typeof m.default === "object"
    ? (m.default as Record<string, unknown>)
    : null);

  return new Proxy({} as Record<string, unknown>, {
    get(_, key) {
      if (typeof key !== "string") return undefined;
      // Top-level first (ESM case), then .default (CJS-wrap case).
      if (m[key] !== undefined) return m[key];
      if (def && key in def) return def[key];
      // Diagnostic: PascalCase misses are almost always component
      // references that would otherwise surface as React's opaque
      // "Element type is invalid: ... got: undefined" error. Naming
      // the miss here turns a 5-minute whodunit into an instant fix.
      if (/^[A-Z]/.test(key) && process.env.NODE_ENV !== "production") {
        const topExports = Object.keys(m).filter(
          (k) => /^[A-Z]/.test(k) && k !== "default"
        );
        const defExports = def
          ? Object.keys(def).filter((k) => /^[A-Z]/.test(k))
          : [];
        const all = Array.from(new Set([...topExports, ...defExports]));
        // eslint-disable-next-line no-console
        console.warn(
          `[fast-frame] "${label}" has no export named "${key}". ` +
            `The snippet will render as \`undefined\` → React "Element ` +
            `type is invalid". Available exports (${all.length}): ` +
            `${all.slice(0, 20).join(", ")}${all.length > 20 ? ", ..." : ""}`
        );
      }
      return undefined;
    },
    has(_, key) {
      if (typeof key !== "string") return false;
      if (m[key] !== undefined) return true;
      return Boolean(def && key in def);
    },
  });
}

function ensureModulesLoaded(): Promise<void> {
  if (_modulesReady) return _modulesReady;
  _modulesReady = Promise.all([
    import("@gradeui/ui").then((m) => {
      _gradeuiUi = normalizeModuleNamespace(m, "@gradeui/ui");
    }),
    import("lucide-react").then((m) => {
      _lucideReact = normalizeModuleNamespace(m, "lucide-react");
    }),
    import("recharts").then((m) => {
      _recharts = normalizeModuleNamespace(m, "recharts");
    }),
    import("canvas-confetti").then((m) => {
      _canvasConfetti = normalizeModuleNamespace(m, "canvas-confetti");
    }),
    import("clsx").then((m) => {
      _clsx = normalizeModuleNamespace(m, "clsx");
    }),
    import("class-variance-authority").then((m) => {
      _cva = normalizeModuleNamespace(m, "class-variance-authority");
    }),
    import("tailwind-merge").then((m) => {
      _tailwindMerge = normalizeModuleNamespace(m, "tailwind-merge");
    }),
  ]).then(() => {
    // Fan out to every mounted useCompiledApp so their external stores
    // flip and useMemo re-runs with modules in hand.
    _modulesReadySubscribers.forEach((cb) => cb());
  });
  return _modulesReady;
}

// Kick off module loads the moment fast-frame.tsx is imported by the
// Studio bundle. We don't wait for a component to mount — the imports
// start the instant someone imports this module, which closes the race
// window between "fast mode first toggled on" and "first prompt lands".
if (typeof window !== "undefined") {
  void ensureModulesLoaded();
}

function subscribeModulesReady(cb: () => void): () => void {
  _modulesReadySubscribers.add(cb);
  // Fire ensureModulesLoaded in case the import-time kick was skipped
  // (SSR boundary, etc.).
  void ensureModulesLoaded();
  return () => {
    _modulesReadySubscribers.delete(cb);
  };
}

function getModulesReadySnapshot(): boolean {
  // All of PLAYGROUND_DEPENDENCIES must be loaded before we compile, so
  // resolveImport never hits its "not ready" throw for a module that's
  // still in flight. They're loaded as a single Promise.all so this
  // flips true in one go.
  return (
    _gradeuiUi !== null &&
    _lucideReact !== null &&
    _recharts !== null &&
    _canvasConfetti !== null &&
    _clsx !== null &&
    _cva !== null &&
    _tailwindMerge !== null
  );
}

function resolveImport(path: string): unknown {
  // Stylesheets — the Studio app already ships @gradeui/ui's compiled
  // CSS at the root level, so an `import "@gradeui/ui/styles.css"` in
  // the snippet is a harmless no-op in fast mode.
  if (path.endsWith(".css")) return {};
  // React + hooks. Using the React already in scope here (same version
  // the host app ships), not pulling a fresh copy.
  if (path === "react") return React;
  // JSX auto-runtime — sucrase emits `require("react/jsx-runtime")` (or
  // the dev variant) when `jsxRuntime: "automatic"` is active. Hand
  // back the statically-imported runtime so the emitted code resolves
  // without needing `React` to be a lexical binding.
  if (path === "react/jsx-runtime") return ReactJsxRuntime;
  if (path === "react/jsx-dev-runtime") return ReactJsxDevRuntime;
  // @gradeui/ui and submodule paths (e.g. @gradeui/ui/button) — the
  // barrel covers both; submodule paths are tolerated for legacy prompts.
  if (path === "@gradeui/ui" || path.startsWith("@gradeui/ui/")) {
    if (!_gradeuiUi) {
      throw new Error(
        "Fast renderer: @gradeui/ui module not ready. " +
          "This usually means the dynamic import hasn't resolved yet. " +
          "Try again in a moment."
      );
    }
    return _gradeuiUi;
  }
  if (path === "lucide-react") {
    if (!_lucideReact) {
      throw new Error("Fast renderer: lucide-react module not ready.");
    }
    return _lucideReact;
  }
  // Remaining entries of the Sandpack PLAYGROUND_DEPENDENCIES set. These
  // are lazy-loaded in ensureModulesLoaded so the initial Studio bundle
  // stays small; each becomes "not ready" for the brief window between
  // fast-mode first mount and all dynamic imports resolving.
  if (path === "recharts") {
    if (!_recharts) throw new Error("Fast renderer: recharts not ready.");
    return _recharts;
  }
  if (path === "canvas-confetti") {
    if (!_canvasConfetti) {
      throw new Error("Fast renderer: canvas-confetti not ready.");
    }
    return _canvasConfetti;
  }
  if (path === "clsx") {
    if (!_clsx) throw new Error("Fast renderer: clsx not ready.");
    return _clsx;
  }
  if (path === "class-variance-authority") {
    if (!_cva) {
      throw new Error("Fast renderer: class-variance-authority not ready.");
    }
    return _cva;
  }
  if (path === "tailwind-merge") {
    if (!_tailwindMerge) {
      throw new Error("Fast renderer: tailwind-merge not ready.");
    }
    return _tailwindMerge;
  }
  // Utility imports — cn lives at @/lib/utils in the host app.
  if (
    path === "@/lib/utils" ||
    path === "./lib/utils" ||
    path === "../lib/utils"
  ) {
    return { cn };
  }
  // Relative imports the model sometimes emits despite the system
  // prompt's guidance to use "@gradeui/ui" — normalize to the barrel.
  // `autoImportGradeComponents` in chat-sandpack rewrites most of these
  // upstream, but a few slip through via older prompts.
  if (/^\.\.?\/components\/ui\//.test(path)) {
    return _gradeuiUi ?? {};
  }
  throw new Error(
    `Fast renderer: unknown module "${path}". Either add it to the ` +
      `resolver in fast-frame.tsx, or switch to Sandpack (Dev → ` +
      `Sandpack in the Studio header) to load it from npm.`
  );
}

// ─── Compile ──────────────────────────────────────────────────────────

interface CompileResult {
  Component: React.ComponentType | null;
  error: Error | null;
}

function compile(source: string): CompileResult {
  try {
    const { code } = sucraseTransform(source, {
      transforms: ["jsx", "typescript", "imports"],
      // Automatic runtime: sucrase emits `import { jsx, jsxs, Fragment }
      // from "react/jsx-runtime"` at the top of the output. That avoids
      // the classic-runtime requirement that `React` be a lexical
      // binding at every JSX site — a pain to thread cleanly once
      // sucrase's imports transform has rewritten the snippet's own
      // `import React from "react"` into module-object member access.
      // Automatic sidesteps the whole dance by not referencing React
      // by name at all.
      jsxRuntime: "automatic",
      production: true,
      filePath: "/App.tsx",
    });

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const fn = new Function("module", "exports", "require", code);
    const shim = { exports: {} as Record<string, unknown> };
    fn(shim, shim.exports, resolveImport);

    const Component =
      ((shim.exports.default ?? shim.exports.App) as
        | React.ComponentType
        | undefined) ?? null;

    if (!Component) {
      return {
        Component: null,
        error: new Error(
          "Fast renderer: the snippet didn't export a default React " +
            "component. Expected something like " +
            "`export default function App() { ... }`."
        ),
      };
    }
    return { Component, error: null };
  } catch (err) {
    return {
      Component: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

function useCompiledApp(source: string | null): CompileResult {
  // Subscribe to the global modules-ready flag via useSyncExternalStore.
  // This is the React-sanctioned way to read a mutable module-level
  // value and have the component re-render when it changes — no useState
  // lazy-initializer timing concerns, no stale closure over a state
  // snapshot, no HMR cross-talk.
  const modulesReady = React.useSyncExternalStore(
    subscribeModulesReady,
    getModulesReadySnapshot,
    // Server snapshot — on SSR we report "not ready" so no compile is
    // attempted. Fast mode is client-only anyway.
    () => false
  );

  return useMemo(() => {
    if (!source || !modulesReady) return { Component: null, error: null };
    // Belt-and-braces in case HMR nulls a module pointer between
    // modulesReady flipping true and this memo running. Surfacing as
    // a null component (nothing rendered) is better than throwing
    // from the resolver.
    if (!getModulesReadySnapshot()) {
      return { Component: null, error: null };
    }
    // Run prepareAppSource here too so input normalization matches the
    // Sandpack path (merges duplicate @gradeui/ui imports, rewrites
    // legacy local component paths, etc.).
    const prepared = prepareAppSource(source);
    return compile(prepared);
  }, [source, modulesReady]);
}

// ─── Runtime error boundary ───────────────────────────────────────────
//
// Parallel to SandpackErrorBoundary — catches errors thrown by the
// compiled component during render, resets on source change.

interface FastErrorBoundaryProps {
  resetKey: string;
  children: React.ReactNode;
}
interface FastErrorBoundaryState {
  error: Error | null;
}

class FastErrorBoundary extends React.Component<
  FastErrorBoundaryProps,
  FastErrorBoundaryState
> {
  state: FastErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): FastErrorBoundaryState {
    return { error };
  }

  componentDidUpdate(prev: FastErrorBoundaryProps) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  handleRetry = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return <FastFailure error={this.state.error} onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

function FastFailure({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  const cleaned = error.message
    .replace(/^\/?App\.tsx:\s*/, "")
    .replace(/^Error:\s*/, "");
  return (
    <div className="h-full overflow-auto p-6 text-sm">
      <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive-soft p-4 text-destructive-deep">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="font-medium leading-tight">
            Fast renderer couldn&rsquo;t run the snippet
          </div>
          <pre className="text-xs whitespace-pre-wrap break-words font-mono opacity-90 bg-background/40 border border-border rounded px-2 py-1.5">
            {cleaned}
          </pre>
          <p className="text-xs opacity-80">
            This usually means a missing component in the fast-renderer
            scope or malformed JSX. Try the chat&rsquo;s &ldquo;fix the
            syntax&rdquo; prompt, or flip Dev &rarr; Sandpack in the
            header to run it through the full bundler (slower but more
            forgiving).
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

// ─── Theme-scoped wrapper ─────────────────────────────────────────────

interface FastPreviewWrapperProps {
  theme: GeneratedTheme;
  mode: "light" | "dark";
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Applies the draft theme's CSS variables to a scoped container so the
 * preview wears the theme being built without leaking vars out to the
 * Studio chrome. Same isolation Sandpack gets from its iframe, but via
 * CSS cascade scoping instead of a document boundary.
 *
 * The `dark` class is also toggled here so @gradeui/ui components that
 * key off `.dark ~ X` selectors resolve correctly inside the preview
 * regardless of the Studio chrome's current theme.
 */
function FastPreviewWrapper({
  theme,
  mode,
  children,
  className,
  style,
}: FastPreviewWrapperProps) {
  const cssVars = useMemo(
    () => themeToCSSVars(theme, mode) as React.CSSProperties,
    [theme, mode]
  );
  return (
    <div
      data-grade-fast-preview
      data-gds-theme-mode={mode}
      // Lenis wraps the Studio site for smooth scrolling and, by
      // default, intercepts wheel events everywhere. The preview
      // subtree is same-document (unlike Sandpack's iframe, which
      // naturally isolates its scroll), so Lenis would otherwise
      // swallow the trackpad wheel and redirect it to the root —
      // which has overflow-hidden, so scrolling looks broken. The
      // `data-lenis-prevent` attribute is Lenis's own escape hatch:
      // any wheel/touch event inside this subtree gets native
      // handling, letting overflow-auto do its job.
      data-lenis-prevent
      className={cn(
        "h-full w-full overflow-auto bg-background text-foreground",
        mode === "dark" && "dark",
        className
      )}
      style={{
        ...cssVars,
        // Prevent scroll-chaining to the Studio page when the preview
        // hits its top/bottom extremes. Without this the native wheel
        // event (which Lenis has declined to handle thanks to
        // data-lenis-prevent) bubbles up to the root and the page
        // tries to scroll — looks like a scroll "stall" at the ends.
        overscrollBehavior: "contain",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Focused mount ────────────────────────────────────────────────────

interface FocusedFastMountProps {
  appSource: string | null;
  theme: GeneratedTheme;
  mode: "light" | "dark";
  view: "preview" | "code";
  /** True when the snippet is ready to evaluate. False while the chat
   *  hasn't produced a renderable source yet (drives the overlay the
   *  parent canvas paints on top). */
  canRender: boolean;
  viewportWidth: ViewportWidth;
}

// Pixel widths for the viewport artboard. Duplicated from sandpack-frame
// — small enough that duplication beats threading a prop map.
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
}: FocusedFastMountProps) {
  const { Component, error } = useCompiledApp(canRender ? appSource : null);

  // Memoize the prepared source for the Code view so we don't re-run
  // prepareAppSource on every render just to display it.
  const preparedForCodeView = useMemo(
    () => (appSource ? prepareAppSource(appSource) : ""),
    [appSource]
  );

  if (view === "code") {
    return (
      <div className="h-full overflow-auto bg-muted/20 p-4">
        {/* Fast mode doesn't ship a code editor — just a read-only view
            of the prepared source. For editing, flip to Sandpack where
            SandpackCodeEditor is wired up. */}
        <pre className="text-xs font-mono whitespace-pre leading-relaxed">
          {preparedForCodeView}
        </pre>
      </div>
    );
  }

  // Preview view — scope by viewport-width artboard to match Sandpack's
  // behavior: "responsive" fills the column; presets float a width-
  // constrained frame on a dot-grid backdrop. Same conditions as
  // FocusedSandpackMount so the two renderers visually match.
  const isResponsive = viewportWidth === "responsive";
  const maxWidthPx = isResponsive
    ? undefined
    : FAST_VIEWPORT_WIDTHS[viewportWidth];

  const content = error ? (
    <FastFailure
      error={error}
      onRetry={() => {
        // Compile-time errors are re-thrown next render because the
        // memo deps haven't changed. The only way out is a new source —
        // same as Sandpack. This stub is for UX symmetry with the
        // runtime error boundary's retry.
      }}
    />
  ) : Component ? (
    <FastErrorBoundary resetKey={appSource ?? ""}>
      <FastPreviewWrapper theme={theme} mode={mode}>
        <Component />
      </FastPreviewWrapper>
    </FastErrorBoundary>
  ) : null;

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
        {content}
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
 * The fast-mode counterpart of TileSandpackMount. Same API shape, same
 * per-tile scaling contract — caller wraps this in a pointer-events-none
 * scaled div so interactions don't fire inside the tile.
 */
export function TileFastMount({ appSource, theme, mode }: TileFastMountProps) {
  const { Component, error } = useCompiledApp(appSource);

  if (error) {
    // Tiles are small — surface a terse error summary rather than the
    // full failure card, which would just clip anyway.
    return (
      <div className="h-full w-full flex items-center justify-center p-2 bg-background text-[10px] text-destructive-deep text-center">
        Fast-render error
      </div>
    );
  }

  if (!Component) {
    return null;
  }

  return (
    <FastErrorBoundary resetKey={appSource ?? ""}>
      <FastPreviewWrapper theme={theme} mode={mode}>
        <Component />
      </FastPreviewWrapper>
    </FastErrorBoundary>
  );
}
