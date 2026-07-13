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
 *     { type: "grade:fast-compile",  source, speculative? } — compile + render.
 *       `speculative: true` marks a mid-stream draft (auto-closed partial
 *       JSX from studio-stream-draft.ts): failures are SILENT — no
 *       FailurePanel, no grade:fast-error — the previous render stays up
 *       and the next stream tick retries. Successes render but skip the
 *       grade:fast-compiled ack (the Fill flow must never await a draft).
 *     { type: "grade:fast-theme",    vars, mode, fontFaces? } — apply CSS
 *       vars; `fontFaces` is pre-serialized @font-face CSS for the
 *       theme's custom uploaded fonts, upserted as <style #gds-theme-fonts>
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
import { flushSync } from "react-dom";
import * as ReactJsxRuntime from "react/jsx-runtime";
import * as ReactJsxDevRuntime from "react/jsx-dev-runtime";
import { transform as sucraseTransform } from "sucrase";
import { listRegistries } from "@/lib/active-registry";

// ─── Static imports of every module the preview can reach for. ────────
//
// Mirrors the fast-mode module resolver AND Sandpack's PLAYGROUND_
// DEPENDENCIES. If you add an entry to either of those, mirror it here
// so snippets that import it actually resolve.
import * as GradeuiUi from "@gradeui/ui";
// Composer comes from the VENDORED copy, NOT @gradeui/ui/composer (dist): lexical
// requires a single module instance app-wide, and the dist subpath loaded a
// second copy of lexical-beautiful-mentions (BeautifulMentionNode then subclassed
// a different LexicalNode and the editor threw). Merged into the sandbox's
// "@gradeui/ui" namespace so existing <Composer> screens still resolve.
import * as GradeuiComposer from "@/components/ui/composer";
import * as LucideReact from "lucide-react";
import * as Recharts from "recharts";
import * as CanvasConfetti from "canvas-confetti";
import * as Clsx from "clsx";
import * as ClassVarianceAuthority from "class-variance-authority";
import * as TailwindMerge from "tailwind-merge";
// TipTap — rich-text editor used by linear-clone + notion-clone
// scaffolds. Eager-imported so the preview iframe resolves
// `@tiptap/react` etc. without an npm round-trip per turn.
import * as TiptapReact from "@tiptap/react";
import * as TiptapStarterKit from "@tiptap/starter-kit";
import * as TiptapExtensionMention from "@tiptap/extension-mention";
import * as TiptapExtensionPlaceholder from "@tiptap/extension-placeholder";
// dnd-kit — backs <Sortable> and is also available raw for cross-
// container kanban that Sortable v1 doesn't model.
import * as DndKitCore from "@dnd-kit/core";
import * as DndKitSortable from "@dnd-kit/sortable";
import * as DndKitUtilities from "@dnd-kit/utilities";
// motion (the new framer-motion) — animation primitives.
import * as MotionReact from "motion/react";
// Tier-1 pre-stamps for long-tail clones (Slack messages, Discord
// channels, Linear keyboard-first, real DataTables, right-click menus,
// TipTap toolbar). Each is small (~2–15kb gzip) and high-value.
import * as ReactVirtuoso from "react-virtuoso";
import * as ReactHotkeysHook from "react-hotkeys-hook";
import * as TanstackReactTable from "@tanstack/react-table";
import * as RadixContextMenu from "@radix-ui/react-context-menu";
import * as RadixToolbar from "@radix-ui/react-toolbar";

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
  type SelectionAgentHandle,
  type SelectionPayload,
} from "@/lib/studio-selection-agent";

// ─── Module resolver ──────────────────────────────────────────────────
//
// Sucrase's "imports" transform rewrites ESM imports into require() calls.
// We provide this resolver as the `require` argument to the compiled
// function. Every path the model is allowed to import must map to a
// pre-bundled module object here — the whole point of the sandbox page
// is that there's no runtime npm fetch.

// EVERY known external-DS package name (BYODS B2). This iframe can't see
// the parent's per-project registry override (separate module instance),
// and it only needs the names for a pointed error message — so guard
// against all known external registries instead of just the env default.
const EXTERNAL_DS_PKGS = listRegistries()
  .filter((r) => r.id !== "gradeui")
  .map((r) => r.package.name);

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
    return { ...GradeuiUi, ...GradeuiComposer };
  }
  // BYODS (B2): an EXTERNAL design system is not precompiled into this
  // page, and esm.sh would double-load React (invalid-hook-call). Fail
  // with a pointed message — studio-canvas already pins non-gradeui
  // registries to the Sandpack renderer, so hitting this means a surface
  // (embed/share) mounted Fast Frame with an external registry active.
  const externalHit = EXTERNAL_DS_PKGS.find(
    (pkg) => path === pkg || path.startsWith(`${pkg}/`),
  );
  if (externalHit) {
    throw new Error(
      `Fast sandbox: the external design system "${externalHit}" is not ` +
        `precompiled into Fast Frame. Use the external/Sandpack renderer ` +
        `(studio-canvas picks it automatically for external registries).`
    );
  }
  if (path === "lucide-react") return LucideReact;
  if (path === "recharts") return Recharts;
  if (path === "canvas-confetti") return CanvasConfetti;
  if (path === "clsx") return Clsx;
  if (path === "class-variance-authority") return ClassVarianceAuthority;
  if (path === "tailwind-merge") return TailwindMerge;
  // TipTap — comment composers, doc bodies, slash menus.
  if (path === "@tiptap/react") return TiptapReact;
  if (path === "@tiptap/starter-kit") return TiptapStarterKit;
  if (path === "@tiptap/extension-mention") return TiptapExtensionMention;
  if (path === "@tiptap/extension-placeholder") return TiptapExtensionPlaceholder;
  // dnd-kit — Sortable's backing library, also raw-importable for the
  // kanban cross-container case.
  if (path === "@dnd-kit/core") return DndKitCore;
  if (path === "@dnd-kit/sortable") return DndKitSortable;
  if (path === "@dnd-kit/utilities") return DndKitUtilities;
  // motion — spring physics, layout animations, gesture-driven motion.
  if (path === "motion" || path === "motion/react") return MotionReact;
  // Tier-1 pre-stamps for the long-tail clones.
  if (path === "react-virtuoso") return ReactVirtuoso;
  if (path === "react-hotkeys-hook") return ReactHotkeysHook;
  if (path === "@tanstack/react-table") return TanstackReactTable;
  if (path === "@radix-ui/react-context-menu") return RadixContextMenu;
  if (path === "@radix-ui/react-toolbar") return RadixToolbar;

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
  if (/^\.\.?\/components\/ui\//.test(path)) return { ...GradeuiUi, ...GradeuiComposer };

  // Tier-2 — esm.sh runtime fallback. Pre-resolve in compile() populates
  // CDN_CACHE before the synchronous render path reaches here, so the
  // map lookup is what makes this work. If we get to this branch with
  // an empty cache entry, pre-resolve was missed (a deeply-dynamic
  // import the regex didn't catch) — fall back to a helpful error.
  if (CDN_CACHE.has(path)) {
    const entry = CDN_CACHE.get(path);
    if (entry && typeof entry === "object" && "__cdn_error__" in entry) {
      throw new Error(
        `Fast sandbox: esm.sh failed to load "${path}": ${(entry as { __cdn_error__: string }).__cdn_error__}`
      );
    }
    return entry;
  }

  throw new Error(
    `Fast sandbox: unknown module "${path}". The Tier-2 pre-resolve ` +
      `missed it (deeply-dynamic import?) — either pre-stamp it in ` +
      `apps/docs/app/fast-sandbox/page.tsx or rewrite the source to use ` +
      `a top-level import.`
  );
}

// ─── Tier-2: esm.sh runtime-CDN fallback ──────────────────────────────
//
// Pre-stamping covers the high-value libraries instantly. For long-tail
// imports — anything the model reaches for that we haven't curated — we
// pull from esm.sh at compile time. The cache survives across compiles
// in the same iframe session, so subsequent uses of the same library
// are instant.
//
// The synchronous resolver requires the namespace to already exist when
// `require()` is called. Pre-resolve scans the source for ES-module
// import specifiers + bare require() calls, populates the cache, and
// THEN sucrase compiles + render runs.
//
// Failures land in the cache too, marked with `__cdn_error__`, so the
// next render-path require() shows the user a useful message instead of
// silently retrying esm.sh on every compile.

const CDN_CACHE = new Map<string, unknown>();

const KNOWN_TIER_1 = new Set<string>([
  "react",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "lucide-react",
  "recharts",
  "canvas-confetti",
  "clsx",
  "class-variance-authority",
  "tailwind-merge",
  "@tiptap/react",
  "@tiptap/starter-kit",
  "@tiptap/extension-mention",
  "@tiptap/extension-placeholder",
  "@dnd-kit/core",
  "@dnd-kit/sortable",
  "@dnd-kit/utilities",
  "motion",
  "motion/react",
  "react-virtuoso",
  "react-hotkeys-hook",
  "@tanstack/react-table",
  "@radix-ui/react-context-menu",
  "@radix-ui/react-toolbar",
  "@/lib/utils",
  "./lib/utils",
  "../lib/utils",
]);

function isKnownSpecifier(spec: string): boolean {
  if (KNOWN_TIER_1.has(spec)) return true;
  if (spec === "@gradeui/ui" || spec.startsWith("@gradeui/ui/")) return true;
  if (/^\.\.?\/components\/ui\//.test(spec)) return true;
  return false;
}

const IMPORT_SPEC_RE =
  /(?:import\s+(?:\*\s+as\s+\w+|\{[^}]*\}|\w+(?:\s*,\s*\{[^}]*\})?)?\s+from\s+|import\s*\(\s*|require\s*\(\s*)['"]([^'"]+)['"]/g;

async function preResolveUnknownImports(source: string): Promise<void> {
  const found = new Set<string>();
  IMPORT_SPEC_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = IMPORT_SPEC_RE.exec(source)) !== null) {
    const spec = match[1];
    if (isKnownSpecifier(spec)) continue;
    if (CDN_CACHE.has(spec)) continue;
    found.add(spec);
  }
  if (found.size === 0) return;

  await Promise.all(
    Array.from(found).map(async (spec) => {
      try {
        // Strip leading `@gradeui/`-style scopes through to esm.sh's
        // version-pinning is the consumer's problem; we ship the bare
        // specifier and let esm.sh resolve "latest" by default. For
        // version pinning, callers would use `"some-pkg@1.2.3"` as the
        // specifier — esm.sh respects that syntax.
        const mod = await import(/* webpackIgnore: true */ `https://esm.sh/${spec}`);
        CDN_CACHE.set(spec, mod);
      } catch (err) {
        CDN_CACHE.set(spec, {
          __cdn_error__: err instanceof Error ? err.message : String(err),
        });
      }
    })
  );
}

// ─── Import self-heal ─────────────────────────────────────────────────
//
// Models — ESPECIALLY on edit turns — use a new icon in a REPLACE block
// without extending the import line ("ExternalLink is not defined" at
// runtime, caught by the boundary but still a broken screen). The
// parent-side `autoImportGradeComponents` heals DS components against
// the allowlist, but deliberately won't invent imports for names it
// can't verify. HERE we can verify: the full lucide namespace is
// already in memory. Any used-but-unimported, not-locally-defined
// PascalCase tag that's a real lucide export gets merged into (or
// added as) the lucide-react import before compile. Sandpack (parity
// renderer) doesn't get this heal — acceptable, it's not the default.

function healMissingLucideImports(source: string): string {
  const used = new Set<string>();
  const tagRx = /<([A-Z][A-Za-z0-9_]*)(?=[\s/>])/g;
  let m: RegExpExecArray | null;
  while ((m = tagRx.exec(source)) !== null) used.add(m[1]);
  if (used.size === 0) return source;

  // Anything already in scope: named imports (any module, alias-aware)
  // + local component definitions.
  const resolved = new Set<string>();
  const importRx = /import\s*\{\s*([^}]+?)\s*\}\s*from\s*["'][^"']+["'];?/g;
  while ((m = importRx.exec(source)) !== null) {
    for (const raw of m[1].split(",")) {
      const name = raw.trim().replace(/^.*\s+as\s+/, "").trim();
      if (name) resolved.add(name);
    }
  }
  const defRx = /(?:function|const|let|class)\s+([A-Z][A-Za-z0-9_]*)/g;
  while ((m = defRx.exec(source)) !== null) resolved.add(m[1]);

  const missing = [...used]
    .filter((name) => !resolved.has(name))
    .filter((name) => {
      const exp = (LucideReact as Record<string, unknown>)[name];
      return typeof exp === "function" || typeof exp === "object";
    })
    .sort();
  if (missing.length === 0) return source;

  const lucideImportRx =
    /import\s*\{\s*([^}]+?)\s*\}\s*from\s*["']lucide-react["'];?/;
  const existing = source.match(lucideImportRx);
  if (existing) {
    const names = new Set(
      existing[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );
    for (const name of missing) names.add(name);
    return source.replace(
      lucideImportRx,
      `import { ${[...names].join(", ")} } from "lucide-react";`
    );
  }
  return `import { ${missing.join(", ")} } from "lucide-react";\n${source}`;
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
//
// The friendly face of a broken screen. Generated code WILL throw —
// the design goal is that the user never sees a raw stack or the
// Next.js dev overlay for it (see the error-containment block in the
// page effect). Human-first copy, the recovery actions that actually
// exist (chat fix / toolbar Undo), and the technical detail tucked
// behind a disclosure for whoever wants it.

function FailurePanel({ error }: { error: Error }) {
  const detail = error.message.replace(/^\/?App\.tsx:\s*/, "");
  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center bg-background p-8">
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
          <LucideReact.Wrench
            className="h-5 w-5 text-muted-foreground"
            aria-hidden
          />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-semibold text-foreground">
            This screen hit a snag
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The generated code couldn&rsquo;t run. Ask the chat to fix it
            (&ldquo;fix the error on this screen&rdquo;), or press{" "}
            <span className="font-medium text-foreground">Undo</span> in
            the toolbar to roll back to the last working version.
          </p>
        </div>
        <details className="group mx-auto max-w-sm text-left">
          <summary className="cursor-pointer select-none text-center text-xs text-muted-foreground/70 transition-colors hover:text-foreground">
            Show technical details
          </summary>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
            {detail}
          </pre>
        </details>
        {/* Small print — the parity-renderer escape hatch. Only helps
            when the failure is SPECIFIC to the fast renderer (a package
            esm.sh can't transform, a resolution quirk): genuinely broken
            code fails in any bundler, and Sandpack consumes @gradeui/ui
            from npm, so unpublished components are missing there. The
            parent owns the actual switch (grade:fast-try-sandpack). */}
        <button
          type="button"
          onClick={() =>
            window.parent.postMessage(
              { type: "grade:fast-try-sandpack" },
              "*"
            )
          }
          className="mx-auto block text-[11px] text-muted-foreground/60 underline decoration-dotted underline-offset-2 transition-colors hover:text-foreground"
        >
          Still stuck? Try the slower renderer (Sandpack) — helps when the
          error is specific to the fast renderer.
        </button>
      </div>
    </div>
  );
}

// ─── Render error boundary ────────────────────────────────────────────
//
// CRITICAL piece of the sandbox's resilience story. A RUNTIME error
// thrown while a compiled snippet renders (e.g. a component fed a
// truncated/missing prop) does NOT throw through `flushSync` — React
// routes it to the root's onUncaughtError and, with no boundary in the
// way, UNMOUNTS THE ENTIRE ROOT. That's how a single bad generation
// used to leave a dead white iframe. The boundary contains the blast:
//   - sealed renders fall back to the FailurePanel (and the caller is
//     told via `onError`, so it can post grade:fast-error upward);
//   - speculative drafts fall back to the LAST GOOD draft component,
//     so a mid-stream wobble never blanks the live preview.
// Keyed per compile (renderSeq) so each attempt gets a fresh boundary.

class RenderErrorBoundary extends React.Component<
  {
    fallback: (error: Error) => React.ReactNode;
    onError?: (error: Error) => void;
    children: React.ReactNode;
  },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }
  render() {
    if (this.state.error) return this.props.fallback(this.state.error);
    return this.props.children;
  }
}

// ─── The sandbox page ─────────────────────────────────────────────────

export default function FastSandboxPage() {
  // Transparent embeds (?transparent=1 on the sandbox URL): strip every
  // document-level background so the embedding host shows through
  // wherever the rendered screen doesn't paint. Inline styles outrank
  // the root layout's bg-background class.
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("transparent") === "1") {
        document.documentElement.style.background = "transparent";
        document.body.style.background = "transparent";
      }
    } catch {
      /* no window / malformed URL — leave backgrounds alone */
    }
  }, []);

  const rootElRef = useRef<HTMLDivElement | null>(null);
  const agentTeardownRef = useRef<SelectionAgentHandle | null>(null);
  // Hover-measure inspector (grade:set-inspect) — embed "show my
  // workings" mode. Independent of the selection agent: read-only, no
  // click capture, no parent round-trips. See installMeasureAgent below.
  const measureTeardownRef = useRef<{ teardown: () => void } | null>(null);

  useEffect(() => {
    if (!rootElRef.current) return;
    const host = rootElRef.current;

    // ── Double-buffered rendering ─────────────────────────────────────
    //
    // Every compile produces a BRAND NEW component type (new Function),
    // so React can never reconcile across compiles — each render is a
    // full unmount + remount. With a single root that meant a visible
    // blank-then-repaint on every streamed draft (~the flicker). Two
    // sibling containers with their own React roots fix it: the new
    // tree is committed into the HIDDEN buffer with flushSync, then the
    // buffers swap visibility synchronously — both happen before the
    // browser paints, so the screen goes straight from old frame to new
    // frame with no blank in between. The retired buffer is cleared
    // asynchronously (it's invisible) so document-wide queries — the
    // selection agent, Fill collection, comment-pin anchors — only ever
    // see one copy of the app.
    //
    // display:none (not visibility) on the back buffer so it
    // contributes ZERO height — document.scrollHeight always reflects
    // the visible frame, which the parent polls for the responsive
    // content-height artboard. Mid-remount transients used to bounce
    // that measurement around (fill ↔ framed mode oscillation); with
    // the buffer swap the height only changes when a frame actually
    // lands.
    // ── Error containment vs the Next dev overlay ─────────────────────
    //
    // React 19 reports boundary-caught errors through console.error,
    // and Next's dev overlay treats every console.error as a modal-
    // worthy event — so a HANDLED generated-code error (boundary →
    // FailurePanel) still summoned the full red Next overlay inside
    // the preview. The createRoot error callbacks below replace that
    // default reporting with a quiet console.warn: the user sees OUR
    // panel, the engineer still sees the detail in the console, and
    // the overlay stays out of it. Genuine sandbox-page bugs (not
    // generated code) keep the loud path — see the window-level
    // interceptor's stack heuristic in the page effect.
    const quietReport =
      (label: string) =>
      (error: unknown) =>
        // eslint-disable-next-line no-console
        console.warn(`[fast-sandbox] ${label}:`, error);
    const makeBuffer = () => {
      const el = document.createElement("div");
      el.style.display = "none";
      host.appendChild(el);
      return {
        el,
        root: createRoot(el, {
          onCaughtError: quietReport("contained by boundary"),
          onUncaughtError: quietReport("uncaught in generated tree"),
          onRecoverableError: quietReport("recovered"),
        }),
      };
    };
    const buffers = [makeBuffer(), makeBuffer()];
    let active = 0;
    buffers[active].el.style.display = "";

    /** Commit `node` into the back buffer (synchronously), then flip
     *  the buffers before paint and retire the old front.
     *
     *  `flashChanges` (STUDIO-EDITS X4 — "show me what the AI touched"):
     *  before retiring the old frame, diff the two buffers by
     *  `data-gds-source-id` and stamp `data-gds-flash` on every node
     *  whose content changed — the DS stylesheet pulses them with a
     *  short outline+wash animation. Source-id numbering is stable in
     *  document order, so for the common edit-turn shape (props/text
     *  changed in place) the diff is exact; insertions shift later ids
     *  and over-flash slightly, which reads as "this area changed" —
     *  fine. A REWRITE (>40% of nodes differ, or node counts diverge
     *  wildly) skips the flash entirely: that's a new page, not an
     *  edit, and a full-screen pulse is noise. */
    const commitAndSwap = (
      node: React.ReactNode,
      opts?: { flashChanges?: boolean }
    ) => {
      const back = buffers[1 - active];
      const oldFront = buffers[active];
      // Snapshot the OLD frame's per-node content before anything moves.
      let oldById: Map<string, string> | null = null;
      if (opts?.flashChanges) {
        oldById = new Map();
        for (const el of oldFront.el.querySelectorAll(
          "[data-gds-source-id]"
        )) {
          oldById.set(
            el.getAttribute("data-gds-source-id")!,
            (el as HTMLElement).outerHTML
          );
        }
      }
      flushSync(() => {
        back.root.render(node);
      });
      active = 1 - active;
      back.el.style.display = "";
      oldFront.el.style.display = "none";
      // Clear the retired tree off the sync path — it's invisible, and
      // dropping it keeps duplicate data-gds-* nodes out of the DOM.
      oldFront.root.render(null);

      if (oldById && oldById.size > 0) {
        const newNodes = back.el.querySelectorAll("[data-gds-source-id]");
        const changed: HTMLElement[] = [];
        for (const el of newNodes) {
          const id = el.getAttribute("data-gds-source-id")!;
          const prev = oldById.get(id);
          if (prev !== undefined && prev !== (el as HTMLElement).outerHTML) {
            changed.push(el as HTMLElement);
          }
        }
        // Rewrite heuristic — a page-wide change isn't an "edit".
        const total = newNodes.length || 1;
        if (changed.length > 0 && changed.length / total <= 0.4) {
          // INNERMOST changed nodes only: a changed <Button> also makes
          // every ancestor's outerHTML differ — flashing the chain
          // would pulse half the page for one prop. Keep a node only
          // when it contains no OTHER changed node (i.e. it IS the leaf
          // of the change).
          const innermost = changed.filter(
            (el) => !changed.some((other) => other !== el && el.contains(other))
          );
          for (const el of innermost) {
            el.removeAttribute("data-gds-flash"); // restart if mid-pulse
            // Force a style flush so re-adding retriggers the animation.
            void el.offsetWidth;
            el.setAttribute("data-gds-flash", "");
            el.addEventListener(
              "animationend",
              () => el.removeAttribute("data-gds-flash"),
              { once: true }
            );
          }
        }
      }
    };

    // ── Event-handler + promise error interception ───────────────────
    //
    // Error boundaries can't catch throws from EVENT HANDLERS or
    // unhandled promise rejections — those bubble to window and, in
    // dev, summon the full Next error overlay over the preview. For
    // errors whose stack points at the COMPILED SNIPPET (the
    // `eval at compile` frames are unmistakable), mark the event
    // handled, drop a small self-dismissing chip into the preview so
    // the user knows their click did something wrong, and leave a
    // console.warn breadcrumb. Errors from the sandbox page itself
    // don't match the heuristic and stay loud — we want the overlay
    // for OUR bugs.
    let errorChipEl: HTMLDivElement | null = null;
    let errorChipTimer = 0;
    const showRuntimeErrorChip = (message: string) => {
      if (!errorChipEl) {
        errorChipEl = document.createElement("div");
        errorChipEl.setAttribute("data-gds-part", "runtime-error-chip");
        errorChipEl.style.cssText =
          "position:fixed;left:12px;bottom:12px;z-index:2147483000;" +
          "max-width:380px;padding:8px 12px;border-radius:10px;" +
          "background:rgb(23 23 23 / 0.92);color:#fff;" +
          "font:500 12px/1.45 ui-sans-serif,system-ui;" +
          "box-shadow:0 4px 18px rgb(0 0 0 / 0.35);" +
          "pointer-events:none;transition:opacity .3s;";
        document.body.appendChild(errorChipEl);
      }
      errorChipEl.textContent = `⚠ Something in this screen threw — "${message}". Ask the chat to fix it.`;
      errorChipEl.style.opacity = "1";
      window.clearTimeout(errorChipTimer);
      errorChipTimer = window.setTimeout(() => {
        if (errorChipEl) errorChipEl.style.opacity = "0";
      }, 6000);
    };
    const isFromGeneratedCode = (err: unknown): boolean =>
      err instanceof Error && /eval at compile/.test(err.stack ?? "");
    const onWindowError = (e: ErrorEvent) => {
      if (!isFromGeneratedCode(e.error)) return;
      e.preventDefault();
      quietReport("event-handler error")(e.error);
      showRuntimeErrorChip(e.error?.message ?? "unknown error");
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      if (!isFromGeneratedCode(e.reason)) return;
      e.preventDefault();
      quietReport("unhandled rejection")(e.reason);
      showRuntimeErrorChip(
        e.reason instanceof Error ? e.reason.message : String(e.reason)
      );
    };
    window.addEventListener("error", onWindowError);
    window.addEventListener("unhandledrejection", onRejection);

    // Per-compile sequence — keys each RenderErrorBoundary so every
    // attempt starts un-tripped. Closure state, lives with the roots.
    let renderSeq = 0;

    async function renderCompiled(
      source: string,
      requestId?: string,
      speculative = false
    ) {
      // Tier-2 fallback: pre-resolve any unknown import specifiers via
      // esm.sh BEFORE sucrase + require() run. Failures don't throw —
      // they land in CDN_CACHE marked with __cdn_error__ so the synchronous
      // resolveImport path can surface a clean error to the user.
      // Self-heal missing lucide imports before anything else — see
      // healMissingLucideImports. Fixes both fresh model output and
      // edit-turn folds that changed JSX without touching imports.
      source = healMissingLucideImports(source);
      await preResolveUnknownImports(source);
      const { Component, error } = compile(source);
      if (error) {
        // Speculative drafts fail SILENTLY — they're auto-closed partial
        // JSX from a live stream, so a decent fraction won't compile.
        // Keep the previous good render on screen; the next tick (or the
        // final sealed fence) supersedes this draft anyway.
        if (speculative) return;
        commitAndSwap(<FailurePanel error={error} />);
        // Also bubble up so the parent can mirror the failure state in
        // its own error surfaces if it wants to (e.g. header badge).
        window.parent.postMessage(
          { type: "grade:fast-error", message: error.message, requestId },
          "*"
        );
        return;
      }
      if (!Component) return;
      renderSeq += 1;

      if (speculative) {
        // Draft render into the back buffer. Runtime throws don't
        // propagate through flushSync (React routes them to
        // onUncaughtError) — the boundary contains them. On failure we
        // simply DON'T swap: the front buffer (last good frame) stays
        // on screen and the retired half-tree is cleared invisibly.
        let failed = false;
        const back = buffers[1 - active];
        flushSync(() => {
          back.root.render(
            <PreviewWrap>
              <RenderErrorBoundary
                key={renderSeq}
                fallback={() => null}
                onError={() => {
                  failed = true;
                }}
              >
                <Component />
              </RenderErrorBoundary>
            </PreviewWrap>
          );
        });
        if (failed) {
          back.root.render(null);
          return;
        }
        // Healthy draft — flip before paint (no blank frame).
        const oldFront = buffers[active];
        active = 1 - active;
        back.el.style.display = "";
        oldFront.el.style.display = "none";
        oldFront.root.render(null);
        return;
      }

      // Sealed render. commitAndSwap's flushSync guarantees the DOM is
      // fully updated before we send the `grade:fast-compiled` signal
      // back — Studio's Fill flow relies on that ordering to collect
      // newly-stamped data-gds-instance-id attributes.
      //
      // The boundary turns a RUNTIME render error in the final source
      // into the FailurePanel + a grade:fast-error post, instead of the
      // pre-boundary behaviour (React unmounts the root → dead white
      // iframe). Compile errors are still caught above; this is the
      // throws-while-rendering case (bad props, undefined lookups).
      let sealedFailed = false;
      commitAndSwap(
        // Flash the changed nodes — sealed renders only (speculative
        // drafts land 4×/sec; pulsing per tick would be noise, and the
        // settle commit re-renders the same content anyway).
        <PreviewWrap>
          <RenderErrorBoundary
            key={renderSeq}
            fallback={(err) => <FailurePanel error={err} />}
            onError={(err) => {
              sealedFailed = true;
              window.parent.postMessage(
                {
                  type: "grade:fast-error",
                  message: err.message,
                  requestId,
                },
                "*"
              );
            }}
          >
            <Component />
          </RenderErrorBoundary>
        </PreviewWrap>,
        { flashChanges: true }
      );
      // Don't ack a failed render — the Fill flow must not start
      // collecting against the failure panel's DOM.
      if (!sealedFailed) {
        window.parent.postMessage(
          { type: "grade:fast-compiled", requestId },
          "*"
        );
      }
    }

    function applyTheme(
      vars: Record<string, string>,
      mode: "light" | "dark",
      fontFaces?: string
    ) {
      const root = document.documentElement;
      // No-op guard — the parent re-posts the theme on unrelated
      // re-renders (object identity churn). Re-applying identical vars
      // fires dozens of attribute mutations on <html>, and ThreeScene's
      // MutationObserver (class/style/data-gds-theme) re-resolves its
      // palette on EVERY one — wasted forced style recalcs at best,
      // shader colour pops at worst. Identical push → skip entirely.
      const sig = String(hash(JSON.stringify({ vars, mode, fontFaces })));
      if (root.dataset.gdsTheme === sig) return;
      // Custom uploaded faces — the host serialized the @font-face CSS
      // (see fast-frame.tsx); upsert it into a single managed tag so a
      // theme switch replaces rather than accumulates. Empty → remove.
      {
        const tagId = "gds-theme-fonts";
        let tag = document.getElementById(tagId) as HTMLStyleElement | null;
        if (fontFaces) {
          if (!tag) {
            tag = document.createElement("style");
            tag.id = tagId;
            document.head.appendChild(tag);
          }
          if (tag.textContent !== fontFaces) tag.textContent = fontFaces;
        } else {
          tag?.remove();
        }
      }
      for (const [key, value] of Object.entries(vars)) {
        root.style.setProperty(key, value);
      }
      root.classList.toggle("dark", mode === "dark");
      // Mirror the `data-gds-theme` hash attribute convention used by
      // theme-aware media components (ThreeScene etc.) — simple dbj2 of
      // the serialized vars so a MutationObserver downstream can tell
      // the theme changed even when individual var values move without
      // crossing a light/dark boundary.
      root.dataset.gdsTheme = sig;
    }

    /**
     * Hover-measure inspector — the read-only "show my workings" overlay
     * behind ?inspect on /e/ embeds (grade:set-inspect). Hovering any
     * element outlines it and labels it with its rendered size in the
     * screen's own virtual px (a parent ScaledRender transform doesn't
     * skew the numbers — rects are measured inside this document).
     *
     * Deliberately NOT the selection agent: no click capture, no
     * sourceId plumbing, no parent round-trips — a visitor-safe lens,
     * not an editor. Colours ride the `--selected` token pair so the
     * overlay rethemes with the screen. Mirrored (compact) in the
     * Sandpack agent in chat-sandpack.ts per the two-agent rule.
     */
    function installMeasureAgent(): { teardown: () => void } {
      const host = document.createElement("div");
      host.setAttribute("data-gds-measure-overlay", "");
      host.style.cssText =
        "position:fixed;inset:0;pointer-events:none;z-index:2147483600;";
      const box = document.createElement("div");
      box.style.cssText =
        "position:absolute;display:none;border:1px solid oklch(var(--selected));" +
        "background:oklch(var(--selected) / 0.08);border-radius:2px;";
      const label = document.createElement("div");
      label.style.cssText =
        "position:absolute;display:none;padding:2px 6px;border-radius:4px;" +
        "background:oklch(var(--selected));color:oklch(var(--selected-foreground));" +
        "font:600 11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;" +
        "white-space:nowrap;";
      host.append(box, label);
      document.body.appendChild(host);

      const kebabToPascal = (kebab: string) =>
        kebab
          .split(/-+/)
          .filter(Boolean)
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join("");

      let raf = 0;
      const hide = () => {
        box.style.display = "none";
        label.style.display = "none";
      };
      const onMove = (e: MouseEvent) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const t = e.target;
          if (!(t instanceof Element) || host.contains(t) || t === document.body) {
            hide();
            return;
          }
          const r = t.getBoundingClientRect();
          if (r.width <= 0 || r.height <= 0) {
            hide();
            return;
          }
          box.style.display = "block";
          box.style.left = `${r.left}px`;
          box.style.top = `${r.top}px`;
          box.style.width = `${r.width}px`;
          box.style.height = `${r.height}px`;
          // Prefer the DS part name (kebab→Pascal, same convention the
          // path bar uses); fall back to the tag.
          const part = t.closest("[data-gds-part]")?.getAttribute("data-gds-part");
          const name = part ? kebabToPascal(part) : t.tagName.toLowerCase();
          label.textContent = `${name} · ${Math.round(r.width)} × ${Math.round(r.height)}`;
          label.style.display = "block";
          // Above the box; flip below when there's no headroom.
          label.style.left = `${Math.max(2, r.left)}px`;
          label.style.top =
            r.top >= 26 ? `${r.top - 24}px` : `${Math.min(window.innerHeight - 24, r.bottom + 4)}px`;
        });
      };
      const onLeave = () => hide();
      document.addEventListener("mousemove", onMove, true);
      document.documentElement.addEventListener("mouseleave", onLeave, true);
      return {
        teardown() {
          cancelAnimationFrame(raf);
          document.removeEventListener("mousemove", onMove, true);
          document.documentElement.removeEventListener(
            "mouseleave",
            onLeave,
            true,
          );
          host.remove();
        },
      };
    }

    // Flips true on the first grade:* message we RECEIVE. In a host
    // (iframe) context that means the parent's listener is alive and
    // the ready re-announce loop below can stop. In a standalone tab
    // our own fast-ready bounces back to us (window.parent === window),
    // which also flips this — conveniently ending the loop immediately.
    let hostContacted = false;

    function handleMessage(event: MessageEvent) {
      const data = event.data as
        | { type?: string; [key: string]: unknown }
        | null;
      if (!data || typeof data !== "object") return;
      if (typeof data.type === "string" && data.type.startsWith("grade:")) {
        hostContacted = true;
      }
      switch (data.type) {
        case "grade:fast-compile": {
          const source = data.source;
          const requestId =
            typeof data.requestId === "string" ? data.requestId : undefined;
          const speculative = data.speculative === true;
          if (typeof source === "string")
            renderCompiled(source, requestId, speculative);
          break;
        }
        case "grade:fast-theme": {
          const vars = data.vars as Record<string, string> | undefined;
          const mode = data.mode as "light" | "dark" | undefined;
          const fontFaces =
            typeof data.fontFaces === "string" ? data.fontFaces : undefined;
          if (vars && mode) applyTheme(vars, mode, fontFaces);
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
              reportCleared: () => {
                // User hit Escape inside the iframe. Tell the parent
                // so the right-panel chip drops in lock-step with the
                // ring vanishing.
                window.parent.postMessage(
                  { type: "grade:selection-cleared" },
                  "*"
                );
              },
            });
          } else if (!enabled && agentTeardownRef.current) {
            agentTeardownRef.current.teardown();
            agentTeardownRef.current = null;
          }
          break;
        }
        case "grade:clear-selection": {
          // External clear from the parent (chip × button) — wipe the
          // persistent overlay if the agent is still installed. The
          // hover overlay handles its own mouseout, so nothing else
          // needs doing.
          agentTeardownRef.current?.clear();
          break;
        }
        case "grade:select-by-source-id": {
          // Parent (Selection inspector breadcrumb) asked us to re-
          // select a specific ancestor. The agent does the heavy
          // lifting — find element, run the same heuristics a mouse
          // click would, repaint the overlay, emit a fresh selection
          // back to the parent. We just forward the id.
          const id = typeof data.id === "string" ? data.id : "";
          if (id && agentTeardownRef.current) {
            agentTeardownRef.current.selectBySourceId(id);
          }
          break;
        }
        case "grade:get-children": {
          // Canvas path bar asked for the children of a given
          // sourceId (or the layout-shell root when id is null).
          // Walk the live DOM directly rather than routing through
          // the selection agent — the agent only installs when
          // select-mode is ON, but the path bar needs to work
          // regardless. Logic mirrors `collectImmediateChildren`
          // in studio-selection-agent.ts.
          const requestId =
            typeof data.requestId === "string" ? data.requestId : "";
          const id = typeof data.id === "string" ? data.id : null;
          // Depth = how many levels of nested children each returned
          // item carries. Default 1 = flat. 2 = each peer also has
          // its own `children`. Path bar uses 2 by default so users
          // get a preview of each peer's subtree.
          const depthArg = typeof data.depth === "number" ? data.depth : 1;
          const depth = Math.max(1, Math.min(5, depthArg));
          const kebabToPascal = (kebab: string) =>
            kebab
              .split(/-+/)
              .filter(Boolean)
              .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
              .join("");
          type Item = {
            sourceId: string;
            tag: string;
            componentName?: string;
            instanceId?: string;
            name?: string;
            summary?: string;
            hasChildren: boolean;
            children?: Item[];
          };
          const collect = (root: Element, remaining: number): Item[] => {
            const out: Item[] = [];
            const seen = new Set<string>();
            const walk = (node: Element) => {
              for (let i = 0; i < node.children.length; i++) {
                const kid = node.children[i];
                const kidId = kid.getAttribute("data-gds-source-id") || "";
                if (kidId) {
                  if (seen.has(kidId)) continue;
                  seen.add(kidId);
                  const part = kid.getAttribute("data-gds-part") || "";
                  const nameAttr =
                    kid.getAttribute("data-gds-name") || "";
                  const summaryAttr =
                    kid.getAttribute("data-gds-summary") || "";
                  const instanceId =
                    kid.getAttribute("data-gds-instance-id") || undefined;
                  let fallback: string | undefined;
                  const text =
                    (kid as HTMLElement).innerText || kid.textContent || "";
                  const norm = text.replace(/\s+/g, " ").trim();
                  if (norm) {
                    fallback = norm.length > 40 ? norm.slice(0, 40) + "…" : norm;
                  }
                  const hasChildren = !!kid.querySelector(
                    "[data-gds-source-id]"
                  );
                  const item: Item = {
                    sourceId: kidId,
                    tag: kid.tagName.toLowerCase(),
                    componentName: part ? kebabToPascal(part) : undefined,
                    instanceId,
                    name: nameAttr || undefined,
                    summary: summaryAttr || fallback,
                    hasChildren,
                  };
                  if (remaining > 1 && hasChildren) {
                    item.children = collect(kid, remaining - 1);
                  }
                  out.push(item);
                } else {
                  walk(kid);
                }
              }
            };
            walk(root);
            return out;
          };
          let scope: Element | null = null;
          if (id) {
            scope = document.querySelector(
              `[data-gds-source-id="${CSS.escape(id)}"]`
            );
          } else {
            // Root at the AppShell root — the user's topmost wrapper.
            scope =
              document.querySelector('[data-gds-part="app-shell"]') ||
              document.querySelector('[data-gds-part="app-shell-main"]') ||
              document.querySelector('[data-gds-part^="app-shell"]') ||
              document.body;
          }
          const items = scope ? collect(scope, depth) : [];
          try {
            window.parent.postMessage(
              { type: "grade:children", requestId, items },
              "*"
            );
          } catch {
            /* parent gone — caller will time out */
          }
          break;
        }
        case "grade:set-fidelity": {
          // Wireframe / full toggle. Same protocol as the Sandpack agent
          // (see PLAYGROUND_SELECTION_AGENT_TSX in chat-sandpack.ts) —
          // we stamp `data-fidelity` on the root; the "MediaSurface
          // fidelity" rules in the design-system stylesheet cross-fade
          // the content layer out and the placeholder back in. No
          // re-render needed.
          const v = data.value === "wireframe" ? "wireframe" : "full";
          document.documentElement.dataset.fidelity = v;
          break;
        }
        case "grade:set-inspect": {
          // Hover-measure inspector on/off (embed ?inspect / the chip).
          // Install/teardown mirrors the selection agent's pattern.
          const enabled = Boolean(data.enabled);
          if (enabled && !measureTeardownRef.current) {
            measureTeardownRef.current = installMeasureAgent();
          } else if (!enabled && measureTeardownRef.current) {
            measureTeardownRef.current.teardown();
            measureTeardownRef.current = null;
          }
          break;
        }
        case "grade:set-motion": {
          // Global motion toggle (lib/motion). Stamp / remove `data-motion`
          // on <html>; the @gradeui/ui `useReducedMotion` hook AND the
          // `[data-motion="off"]` reset in the sandbox stylesheet both react,
          // so ThreeScene surfaces pause + paint a still frame and CSS
          // animation/transition stills. Same shape as `grade:set-fidelity`.
          // `enabled !== false` defaults to motion-on. Reduce-only: this only
          // suppresses; the OS reduced-motion query still wins on its own.
          const enabled = data.enabled !== false;
          if (enabled) {
            document.documentElement.removeAttribute("data-motion");
          } else {
            document.documentElement.setAttribute("data-motion", "off");
          }
          break;
        }
        case "grade:collect-media-sources": {
          // Walk the live DOM for every MediaSurface and pair each
          // source descriptor with its instanceId. The pairing is
          // what lets the Fill flow write the resolved URL BACK into
          // the right data-array entry — the JSX itself becomes the
          // store, no parallel URL map needed. Elements without an
          // instanceId are still reported (so standalone MediaSurfaces
          // without data-array backing still get a fill chance), but
          // they're not target-able for data-mutation.
          const requestId =
            typeof data.requestId === "string" ? data.requestId : "";
          const nodes = document.querySelectorAll("[data-media-source]");
          const items: { instanceId?: string; source: unknown }[] = [];
          nodes.forEach((node) => {
            const json = node.getAttribute("data-media-source");
            if (!json) return;
            try {
              const parsed = JSON.parse(json);
              if (parsed && typeof parsed === "object" && "kind" in parsed) {
                const instanceId =
                  node.getAttribute("data-gds-instance-id") || undefined;
                items.push({ instanceId, source: parsed });
              }
            } catch {
              /* malformed JSON on one element shouldn't tank the batch */
            }
          });
          try {
            // Keep the old-shape `sources` field for backwards
            // compatibility with anything reading from a tile iframe
            // mid-roll; the new `items` array is what the canvas
            // consumes after this pivot.
            window.parent.postMessage(
              {
                type: "grade:media-sources",
                requestId,
                sources: items.map((i) => i.source),
                items,
              },
              "*"
            );
          } catch {
            /* parent gone — drop */
          }
          break;
        }
        case "grade:set-media-urls": {
          // Studio resolved the batch and is handing us back a
          // `sourceKey → url` map. Stash on a global and tell every
          // MediaSurface to re-read it via the `grade:media-urls-updated`
          // event (subscribed inside MediaSurface itself).
          const urls =
            data.urls && typeof data.urls === "object"
              ? (data.urls as Record<string, string>)
              : {};
          const w = window as unknown as {
            __gradeMediaUrls?: Record<string, string>;
          };
          w.__gradeMediaUrls = { ...(w.__gradeMediaUrls ?? {}), ...urls };
          try {
            window.dispatchEvent(new Event("grade:media-urls-updated"));
          } catch {
            /* no-op for old browsers */
          }
          break;
        }
        case "grade:set-media-pending": {
          // Fill-in-flight signal. The canvas posts the list of
          // sourceKeys it's about to resolve BEFORE hitting
          // /api/media/resolve-batch, and posts an empty list in its
          // `finally`. Replace semantics (like set-media-overrides) —
          // the canvas always ships the full current pending set, so a
          // cleared fill never strands keys. MediaSurface's
          // `useFillPending` hook re-reads on the event and runs the
          // Presence shimmer over its placeholder while its key is in
          // the set.
          const keys = Array.isArray(data.pending)
            ? (data.pending as unknown[]).filter(
                (k): k is string => typeof k === "string",
              )
            : [];
          const w = window as unknown as {
            __gradeMediaPending?: Record<string, true>;
          };
          w.__gradeMediaPending = Object.fromEntries(
            keys.map((k) => [k, true as const]),
          );
          try {
            window.dispatchEvent(new Event("grade:media-pending-updated"));
          } catch {
            /* no-op for old browsers */
          }
          break;
        }
        case "grade:set-media-overrides": {
          // Same protocol as set-media-urls but for per-instance prop
          // overrides. Canvas keeps `sourceKey → Partial<MediaSurfaceProps>`
          // state and posts it whenever the user edits a prop on a
          // selected MediaSurface in the settings panel. The agent
          // merges into the global; MediaSurface's `useResolvedOverride`
          // hook re-reads on the event and the rendered slot picks up
          // the new prop values without touching JSX.
          const overrides =
            data.overrides && typeof data.overrides === "object"
              ? (data.overrides as Record<string, Record<string, unknown>>)
              : {};
          const w = window as unknown as {
            __gradeMediaOverrides?: Record<string, Record<string, unknown>>;
          };
          // Replace semantics — the canvas always ships the FULL current
          // override state, so the global mirrors it exactly. Merge
          // semantics (..prev, ..new) would leak old entries that the
          // canvas has dropped (e.g. the user clicked "Reset" on a
          // specific override). Replace is the right shape here.
          w.__gradeMediaOverrides = overrides;
          try {
            window.dispatchEvent(new Event("grade:media-overrides-updated"));
          } catch {
            /* no-op for old browsers */
          }
          break;
        }
        case "grade:set-comments": {
          // Parent handing us the open threads to pin in-place. Each
          // entry carries the anchor + the originator's display bits.
          const threads = Array.isArray(data.threads)
            ? (data.threads as PinThread[])
            : [];
          setComments(threads);
          break;
        }
      }
    }

    // ─── In-iframe comment pins ──────────────────────────────────
    // Pins live in the iframe's OWN DOM (runtime only — never written
    // into the compiled source), so they ride document scroll and the
    // parent's zoom transform natively: no parent-realm position
    // chasing, no per-frame jank. The parent posts threads via
    // `grade:set-comments`; a click posts back `grade:comment-pin-click`
    // with the pin's viewport rect so the parent can anchor a popover.
    interface PinThread {
      id: string;
      anchorId: string;
      anchorKind?: string;
      authorName?: string;
      avatarUrl?: string;
    }
    let pinThreads: PinThread[] = [];
    let pinHost: HTMLDivElement | null = null;
    const PIN_PX = 28;

    function ensurePinHost(): HTMLDivElement {
      if (pinHost && pinHost.isConnected) return pinHost;
      const host = document.createElement("div");
      host.setAttribute("data-grade-comment-pins", "");
      host.style.cssText =
        "position:absolute;top:0;left:0;width:0;height:0;z-index:2147482000;pointer-events:none;";
      document.body.appendChild(host);
      pinHost = host;
      return host;
    }

    function renderPins() {
      if (pinThreads.length === 0) {
        pinHost?.replaceChildren();
        return;
      }
      const host = ensurePinHost();
      host.replaceChildren();
      for (const t of pinThreads) {
        const attr =
          t.anchorKind === "instance"
            ? "data-gds-instance-id"
            : "data-gds-source-id";
        const safe =
          typeof CSS !== "undefined" && CSS.escape
            ? CSS.escape(t.anchorId)
            : t.anchorId;
        const el = document.querySelector(`[${attr}="${safe}"]`);
        if (!el) continue; // stale anchor (regenerated source) — skip
        const r = el.getBoundingClientRect();
        const top = r.top + window.scrollY;
        const left = r.left + window.scrollX;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.dataset.threadId = t.id;
        btn.style.cssText = `position:absolute;top:${top}px;left:${left}px;width:${PIN_PX}px;height:${PIN_PX}px;transform:translate(0,-100%);border-radius:9999px 9999px 9999px 0;background:#3b82f6;border:none;box-shadow:0 2px 6px rgba(0,0,0,.25);cursor:pointer;pointer-events:auto;display:inline-flex;align-items:center;justify-content:center;overflow:hidden;padding:0;`;
        if (t.avatarUrl) {
          const img = document.createElement("img");
          img.src = t.avatarUrl;
          img.alt = t.authorName ?? "";
          img.style.cssText =
            "width:24px;height:24px;border-radius:9999px;object-fit:cover;";
          btn.appendChild(img);
        } else {
          const span = document.createElement("span");
          span.textContent = (t.authorName ?? "?").slice(0, 1).toUpperCase();
          span.style.cssText = "color:#fff;font-size:11px;font-weight:600;";
          btn.appendChild(span);
        }
        btn.addEventListener("click", () => {
          const rect = btn.getBoundingClientRect();
          window.parent.postMessage(
            {
              type: "grade:comment-pin-click",
              threadId: t.id,
              rect: {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
              },
            },
            "*"
          );
        });
        host.appendChild(btn);
      }
    }

    function setComments(threads: PinThread[]) {
      pinThreads = threads;
      renderPins();
    }

    // Reposition only on layout reflow — NOT scroll (absolute pins ride
    // the document) and NOT zoom (the parent's transform scales them).
    // A cheap poll covers image/font loads + post-render reflows.
    window.addEventListener("resize", renderPins);
    const pinPoll = window.setInterval(() => {
      if (pinThreads.length) renderPins();
    }, 500);

    window.addEventListener("message", handleMessage);

    // Pinch / ctrl+wheel forwarding — browsers report a trackpad pinch
    // as a `wheel` event with `ctrlKey: true`. The parent's artboard
    // zoom can't see gestures that start over THIS document (the
    // iframe swallows them), so forward the delta out as
    // `grade:zoom-gesture` and let the canvas / share view feed it into
    // `useArtboardZoom.zoomBy`. preventDefault stops the browser's own
    // page-zoom inside the iframe. Plain scrolling (no ctrl/meta) is
    // untouched. Mirrored in the Sandpack agent (two-agent rule).
    const onPinchWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      try {
        // clientX/Y are iframe-local CSS px — the parent converts them
        // through the iframe's scale to anchor the zoom at the pointer
        // (Figma's zoom-to-cursor; see FocusedFastMount).
        window.parent.postMessage(
          {
            type: "grade:zoom-gesture",
            deltaY: e.deltaY,
            clientX: e.clientX,
            clientY: e.clientY,
          },
          "*",
        );
      } catch {
        /* parent gone — drop */
      }
    };
    window.addEventListener("wheel", onPinchWheel, { passive: false });

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
    //
    // RE-ANNOUNCE until the host makes contact. When this sandbox is
    // nested two levels deep (marketing homepage iframe → /e embed →
    // /fast-sandbox) the embed host can hydrate AFTER our boot ping;
    // a single fast-ready then lands in a not-yet-listening window and
    // the screen never commits (hit on the homepage embed, June 2026).
    // The host's fast-ready handling is idempotent (it just sets a
    // ready flag), so repeats are safe; the first message we receive
    // stops the loop (standalone tabs stop instantly via their own
    // bounced ping). Bounded as a belt-and-braces cap.
    window.parent.postMessage({ type: "grade:fast-ready" }, "*");
    let announceTries = 0;
    const announceTimer = window.setInterval(() => {
      announceTries += 1;
      if (hostContacted || announceTries > 40) {
        window.clearInterval(announceTimer);
        return;
      }
      window.parent.postMessage({ type: "grade:fast-ready" }, "*");
    }, 400);

    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("wheel", onPinchWheel);
      if (onStorage) window.removeEventListener("storage", onStorage);
      window.removeEventListener("resize", renderPins);
      window.clearInterval(pinPoll);
      window.clearInterval(announceTimer);
      pinHost?.remove();
      pinHost = null;
      agentTeardownRef.current?.teardown();
      agentTeardownRef.current = null;
      window.removeEventListener("error", onWindowError);
      window.removeEventListener("unhandledrejection", onRejection);
      window.clearTimeout(errorChipTimer);
      errorChipEl?.remove();
      errorChipEl = null;
      for (const b of buffers) {
        b.root.unmount();
        b.el.remove();
      }
    };
  }, []);

  return (
    <>
      {/* Hide Next's dev-overlay badge inside this RENDERER document —
          it stamps an "N issues" circle onto every preview surface.
          Screen errors surface through the snag UI instead. Dev-only
          element; no-op in production builds. */}
      <style>{`nextjs-portal { display: none !important; }`}</style>
      {/* ── Runtime Tailwind JIT ───────────────────────────────────────
          The bundled @gradeui/ui stylesheet is PRECOMPILED — it only
          contains classes the build saw. Anything an agent invents at
          runtime (bottom-[100px], md:w-[450px], group-hover variants)
          silently no-ops without this. The vendored v4 browser build
          (public/vendor/, same version as the repo's tailwindcss)
          watches the DOM and compiles missing classes on the fly, so
          generated screens "just work" with the FULL Tailwind language
          in Studio, share views, and embeds alike.

          The text/tailwindcss block imports theme + utilities but NOT
          preflight — the precompiled stylesheet already shipped the
          reset, and a second copy at the end of <head> would re-reset
          component styles. Theme vars applied by grade:fast-theme are
          inline on <html>, so they keep winning over the default theme
          layer this emits. */}
      <style
        type="text/tailwindcss"
        suppressHydrationWarning
      >{`@layer theme, utilities; @import "tailwindcss/theme" layer(theme); @import "tailwindcss/utilities" layer(utilities);`}</style>
      {/* Plain script tag (NOT next/script) on purpose: it lands in the
          SSR HTML and executes during document parse, so the compiler's
          MutationObserver is armed before React renders the screen.
          next/script's afterInteractive raced Playwright captures —
          the poster screenshot could fire before arbitrary classes
          compiled, shipping a broken-layout poster. */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script src="/vendor/tailwindcss-browser-4.3.0.js" />
      {/* Fidelity is live again (June 2026) — as a VIEW, not a render
          path. JSX stays the truth: MediaSurfaces always render imagery
          when `src` is present. But the placeholder layer stays mounted
          beneath (visibility-hidden via `[data-filled]`), and the
          "MediaSurface fidelity" rules in @gradeui/ui globals.css read
          `data-fidelity="wireframe"` off <html> to cross-fade imagery
          out and placeholders back in. Pure CSS, fully reversible, so
          the old objection (a toggle pretending the user hadn't filled
          the card) doesn't apply — nothing is unfilled, just viewed
          structurally. Driven by Studio's overflow toggle and the
          embed's ?fidelity / ?fidelitytoggle params. */}
      <div
        ref={rootElRef}
        id="root"
        className="min-h-screen bg-background text-foreground"
      />
    </>
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
