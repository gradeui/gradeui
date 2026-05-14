"use client";

/**
 * Fast sandbox — the Next page loaded in an iframe by the Fast renderer.
 *
 * Why this exists: the previous "same-document" Fast approach ran React
 * in the parent realm and rendered into a div below the Studio chrome.
 * That broke any cross-realm interaction — Radix `instanceof HTMLElement`
 * checks (elements are instances of the iframe's HTMLElement, not the
 * parent's), Dialog/Popover/Sheet/Tooltip portals leaking to
 * parent.document.body, @media queries evaluating against the parent
 * window's viewport instead of the preview container. Moving the React
 * tree INSIDE the iframe fixes all of those in one go — `document` in
 * every component's module refers to the iframe's document, portals land
 * where they should, and media queries see the iframe's width.
 *
 * The sandbox page is a normal client-rendered Next route. Its bundle
 * contains static imports of everything the preview needs: React,
 * ReactDOM, sucrase, the full `@gradeui/ui` namespace, lucide-react,
 * recharts, canvas-confetti, clsx, cva, tailwind-merge. No npm fetch at
 * runtime — the first load is one Next chunk, then every subsequent
 * compile is instant because the modules are already in memory.
 *
 * Parent ↔ sandbox protocol (postMessage):
 *
 *   Parent → sandbox
 *     { type: "grade:fast-compile",  source }        — compile + render
 *     { type: "grade:fast-theme",    vars, mode }    — apply CSS vars
 *     { type: "grade:select-mode",   enabled }       — toggle agent
 *     { type: "grade:clear-selection" }              — hide overlay
 *
 *   Sandbox → parent
 *     { type: "grade:fast-ready" }                   — bundle loaded
 *     { type: "grade:selected",      selection }     — user clicked
 *     { type: "grade:fast-error",    message }       — compile/runtime error
 *
 * Event names deliberately reuse the Sandpack agent's (`grade:select-mode`,
 * `grade:selected`, `grade:clear-selection`) so the parent-side listener
 * doesn't need to branch on which renderer is active.
 */

import * as React from "react";
import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as ReactJsxRuntime from "react/jsx-runtime";
import * as ReactJsxDevRuntime from "react/jsx-dev-runtime";
import { transform as sucraseTransform } from "sucrase";

// ─── Static imports of every module the preview can reach for. ────────
//
// Mirrors the fast-mode module resolver AND Sandpack's PLAYGROUND_
// DEPENDENCIES. If you add an entry to either of those, mirror it here
// so snippets that import it actually resolve.
import * as GradeuiUi from "@gradeui/ui";
import * as LucideReact from "lucide-react";
import * as Recharts from "recharts";
import * as CanvasConfetti from "canvas-confetti";
import * as Clsx from "clsx";
import * as ClassVarianceAuthority from "class-variance-authority";
import * as TailwindMerge from "tailwind-merge";

// Design-system stylesheet. Next's CSS loader bundles this into the
// sandbox page's chunk, so the iframe document gets Tailwind utilities
// + every @gradeui/ui component style without any runtime style
// cloning from the parent. Tokens (--primary, --background, etc.) are
// defined here as defaults and then overridden per-preview by the
// `grade:fast-theme` message handler.
import "@gradeui/ui/styles.css";

// `cn` lives in the host app — imported explicitly so snippets that
// `import { cn } from "@/lib/utils"` resolve without going through the
// @gradeui/ui namespace.
import { cn } from "@/lib/utils";

// Shared selection agent — same module Sandpack will use once task #10
// completes. Installing on `document` (this iframe's document) + body.
import {
  installStudioSelectionAgent,
  type SelectionPayload,
} from "@/lib/studio-selection-agent";

// ─── Module resolver ──────────────────────────────────────────────────
//
// Sucrase's "imports" transform rewrites ESM imports into require() calls.
// We provide this resolver as the `require` argument to the compiled
// function. Every path the model is allowed to import must map to a
// pre-bundled module object here — the whole point of the sandbox page
// is that there's no runtime npm fetch.

function resolveImport(path: string): unknown {
  // Stylesheets — no-op; styles are bundled by Next's CSS loader at
  // module import time (e.g. @gradeui/ui/styles.css is imported below).
  if (path.endsWith(".css")) return {};

  // React + JSX automatic-runtime bindings.
  if (path === "react") return React;
  if (path === "react/jsx-runtime") return ReactJsxRuntime;
  if (path === "react/jsx-dev-runtime") return ReactJsxDevRuntime;

  // Bundled preview-vocab modules.
  if (path === "@gradeui/ui" || path.startsWith("@gradeui/ui/")) {
    return GradeuiUi;
  }
  if (path === "lucide-react") return LucideReact;
  if (path === "recharts") return Recharts;
  if (path === "canvas-confetti") return CanvasConfetti;
  if (path === "clsx") return Clsx;
  if (path === "class-variance-authority") return ClassVarianceAuthority;
  if (path === "tailwind-merge") return TailwindMerge;

  // cn — the host app's canonical utility path, plus the common
  // relative variants older prompts sometimes emit.
  if (
    path === "@/lib/utils" ||
    path === "./lib/utils" ||
    path === "../lib/utils"
  ) {
    return { cn };
  }

  // Relative imports to `components/ui/*` that `autoImportGradeComponents`
  // in chat-sandpack.ts doesn't catch — route to the barrel.
  if (/^\.\.?\/components\/ui\//.test(path)) return GradeuiUi;

  throw new Error(
    `Fast sandbox: unknown module "${path}". Add it to the resolver ` +
      `in apps/docs/app/fast-sandbox/page.tsx + the corresponding import.`
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
          "Fast sandbox: snippet didn't export a default React component. " +
            "Expected `export default function App() { ... }`."
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

// ─── Preview wrap ─────────────────────────────────────────────────────
//
// Wraps the compiled component in the small set of providers a normal
// app root would carry. TooltipProvider is required for any `<Tooltip>`
// to resolve its context; without it Radix throws "must be used within
// TooltipProvider". Other providers (DirectionProvider, future Toaster)
// can land here without touching the renderer contract.

function PreviewWrap({ children }: { children: React.ReactNode }) {
  return (
    <GradeuiUi.TooltipProvider delayDuration={300}>
      {children}
    </GradeuiUi.TooltipProvider>
  );
}

// ─── Runtime error panel ──────────────────────────────────────────────

function FailurePanel({ error }: { error: Error }) {
  return (
    <div className="h-full overflow-auto p-6 text-sm">
      <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive-soft p-4 text-destructive-deep">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="font-medium leading-tight">
            Fast renderer couldn&rsquo;t run the snippet
          </div>
          <pre className="text-xs whitespace-pre-wrap break-words font-mono opacity-90 bg-background/40 border border-border rounded px-2 py-1.5">
            {error.message.replace(/^\/?App\.tsx:\s*/, "")}
          </pre>
          <p className="text-xs opacity-80">
            Try the chat&rsquo;s &ldquo;fix the syntax&rdquo; prompt, or
            flip Dev &rarr; Sandpack in the Studio header to load it
            through the full bundler (slower, more forgiving).
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── The sandbox page ─────────────────────────────────────────────────

export default function FastSandboxPage() {
  const rootElRef = useRef<HTMLDivElement | null>(null);
  const reactRootRef = useRef<Root | null>(null);
  const agentTeardownRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!rootElRef.current) return;
    reactRootRef.current = createRoot(rootElRef.current);

    function renderCompiled(source: string) {
      const { Component, error } = compile(source);
      if (error) {
        reactRootRef.current?.render(<FailurePanel error={error} />);
        // Also bubble up so the parent can mirror the failure state in
        // its own error surfaces if it wants to (e.g. header badge).
        window.parent.postMessage(
          { type: "grade:fast-error", message: error.message },
          "*"
        );
        return;
      }
      if (!Component) return;
      reactRootRef.current?.render(
        <PreviewWrap>
          <Component />
        </PreviewWrap>
      );
    }

    function applyTheme(vars: Record<string, string>, mode: "light" | "dark") {
      const root = document.documentElement;
      for (const [key, value] of Object.entries(vars)) {
        root.style.setProperty(key, value);
      }
      root.classList.toggle("dark", mode === "dark");
      // Mirror the `data-gds-theme` hash attribute convention used by
      // theme-aware media components (ThreeScene etc.) — simple dbj2 of
      // the serialized vars so a MutationObserver downstream can tell
      // the theme changed even when individual var values move without
      // crossing a light/dark boundary.
      root.dataset.gdsTheme = String(hash(JSON.stringify({ vars, mode })));
    }

    function handleMessage(event: MessageEvent) {
      const data = event.data as
        | { type?: string; [key: string]: unknown }
        | null;
      if (!data || typeof data !== "object") return;
      switch (data.type) {
        case "grade:fast-compile": {
          const source = data.source;
          if (typeof source === "string") renderCompiled(source);
          break;
        }
        case "grade:fast-theme": {
          const vars = data.vars as Record<string, string> | undefined;
          const mode = data.mode as "light" | "dark" | undefined;
          if (vars && mode) applyTheme(vars, mode);
          break;
        }
        case "grade:select-mode": {
          const enabled = Boolean(data.enabled);
          if (enabled && !agentTeardownRef.current) {
            agentTeardownRef.current = installStudioSelectionAgent({
              root: document,
              overlayHost: document.body,
              reportSelected: (payload: SelectionPayload) => {
                window.parent.postMessage(
                  { type: "grade:selected", selection: payload },
                  "*"
                );
              },
            });
          } else if (!enabled && agentTeardownRef.current) {
            agentTeardownRef.current();
            agentTeardownRef.current = null;
          }
          break;
        }
        case "grade:clear-selection": {
          // Agent hides its own overlay on the next mouseleave; the
          // parent's chip clear is the authoritative state. Nothing
          // extra to do here unless we want to force-hide the overlay.
          break;
        }
      }
    }

    window.addEventListener("message", handleMessage);

    // Standalone-preview handoff. If the page was opened directly
    // (not as an iframe child) with a hash like `#screen=<key>`, we
    // read the screen's payload from localStorage under that key
    // and render it without waiting for postMessage. The stored
    // value is JSON shaped like `{ source, name }` — source drives
    // the React render, name sets `document.title` ("<Name> -
    // Preview - Grade"). We also subscribe to `storage` events so
    // the standalone preview live-updates as the Studio canvas
    // writes new source / renames the screen.
    //
    // Shareable within the same browser session only — true cross-
    // browser sharing needs server-side persistence (future work).
    const urlHash = window.location.hash;
    const screenMatch = urlHash.match(/[#&]screen=([^&]+)/);
    let onStorage: ((e: StorageEvent) => void) | null = null;

    const applyScreenPayload = (raw: string | null) => {
      if (!raw) return;
      // Try JSON first (new format); fall back to a raw source
      // string for backward compatibility with old keys.
      let source: string | null = null;
      let name: string | null = null;
      try {
        const parsed = JSON.parse(raw) as { source?: string; name?: string };
        if (parsed && typeof parsed.source === "string") {
          source = parsed.source;
          if (typeof parsed.name === "string") name = parsed.name;
        }
      } catch {
        // Not JSON — treat the raw value as the JSX source itself.
        source = raw;
      }
      if (source) renderCompiled(source);
      if (name) {
        // Defer to the next animation frame. On the initial mount
        // Next's metadata pass re-applies the layout's default
        // title ("Grade Design System") AFTER this useEffect runs;
        // setting document.title synchronously here gets stomped
        // and the tab shows the default. By deferring we land
        // after that pass and the title sticks. The storage-event
        // path doesn't need this (it fires long after hydration)
        // but using the same code path is cheaper than branching.
        const title = `${name} - Preview - Grade`;
        document.title = title;
        requestAnimationFrame(() => {
          document.title = title;
        });
      }
    };

    if (screenMatch) {
      const screenKey = decodeURIComponent(screenMatch[1]);
      try {
        applyScreenPayload(window.localStorage.getItem(screenKey));
      } catch {
        // localStorage disabled / quota / corrupt key — silently
        // fall through to the empty preview rather than crashing.
      }
      onStorage = (e: StorageEvent) => {
        if (e.key !== screenKey) return;
        // newValue is null when the writer called removeItem
        // (design closed); rendering an empty preview in that case
        // beats showing a frozen stale render of a deleted screen.
        if (e.newValue == null) return;
        applyScreenPayload(e.newValue);
      };
      window.addEventListener("storage", onStorage);
    }

    // Announce readiness so any parent iframe host can start pushing
    // compile/theme messages. Harmless on the standalone path —
    // `window.parent === window` when not iframed, so the message
    // just bounces to ourselves and the (absent) parent ignores it.
    window.parent.postMessage({ type: "grade:fast-ready" }, "*");

    return () => {
      window.removeEventListener("message", handleMessage);
      if (onStorage) window.removeEventListener("storage", onStorage);
      agentTeardownRef.current?.();
      agentTeardownRef.current = null;
      reactRootRef.current?.unmount();
      reactRootRef.current = null;
    };
  }, []);

  return (
    <div
      ref={rootElRef}
      id="root"
      className="min-h-screen bg-background text-foreground"
    />
  );
}

// Cheap djb2-style hash — used as the `data-gds-theme` signature so
// MutationObservers downstream can detect "any var changed" without
// diffing the full var map.
function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return h >>> 0;
}
