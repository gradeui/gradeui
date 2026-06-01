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
import { flushSync } from "react-dom";
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
  if (/^\.\.?\/components\/ui\//.test(path)) return GradeuiUi;

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
  const agentTeardownRef = useRef<SelectionAgentHandle | null>(null);

  useEffect(() => {
    if (!rootElRef.current) return;
    reactRootRef.current = createRoot(rootElRef.current);

    async function renderCompiled(source: string, requestId?: string) {
      // Tier-2 fallback: pre-resolve any unknown import specifiers via
      // esm.sh BEFORE sucrase + require() run. Failures don't throw —
      // they land in CDN_CACHE marked with __cdn_error__ so the synchronous
      // resolveImport path can surface a clean error to the user.
      await preResolveUnknownImports(source);
      const { Component, error } = compile(source);
      if (error) {
        // flushSync forces React to commit the render synchronously so
        // the next line runs only after the DOM is updated.
        flushSync(() => {
          reactRootRef.current?.render(<FailurePanel error={error} />);
        });
        // Also bubble up so the parent can mirror the failure state in
        // its own error surfaces if it wants to (e.g. header badge).
        window.parent.postMessage(
          { type: "grade:fast-error", message: error.message, requestId },
          "*"
        );
        return;
      }
      if (!Component) return;
      // flushSync guarantees the DOM is fully updated before we send
      // the `grade:fast-compiled` signal back. Studio's Fill flow
      // listens for this signal to know that newly-stamped
      // data-gds-instance-id attributes (added by the self-heal pass)
      // are present in the DOM before it starts collecting items.
      // Without flushSync, React would commit asynchronously and the
      // parent would race the DOM update — the old arbitrary-timeout
      // approach was a fix for that race.
      flushSync(() => {
        reactRootRef.current?.render(
          <PreviewWrap>
            <Component />
          </PreviewWrap>
        );
      });
      window.parent.postMessage(
        { type: "grade:fast-compiled", requestId },
        "*"
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
          const requestId =
            typeof data.requestId === "string" ? data.requestId : undefined;
          if (typeof source === "string") renderCompiled(source, requestId);
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
          // we stamp `data-fidelity` on the root and let CSS in the
          // sandbox stylesheet hide the media-surface content layer
          // for wireframe mode. No re-render needed.
          const v = data.value === "wireframe" ? "wireframe" : "full";
          document.documentElement.dataset.fidelity = v;
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
      window.removeEventListener("resize", renderPins);
      window.clearInterval(pinPoll);
      pinHost?.remove();
      pinHost = null;
      agentTeardownRef.current?.teardown();
      agentTeardownRef.current = null;
      reactRootRef.current?.unmount();
      reactRootRef.current = null;
    };
  }, []);

  return (
    <>
      {/* Fidelity is a no-op on the render path now. With JSX-as-truth
          MediaSurfaces render imagery whenever `src` is present in the
          data array and fall back to the tiered placeholder otherwise
          — the previous "wireframe hides filled imagery" rule fought
          that model (the user filled the card, then a view toggle
          pretended they hadn't). `data-fidelity` is still stamped on
          <html> in case a future variant — e.g. desaturate filled
          imagery in wireframe mode — wants to discriminate, but no
          rule reads it today. */}
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
