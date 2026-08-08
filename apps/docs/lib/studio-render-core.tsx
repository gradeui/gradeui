"use client";

/**
 * Studio render core — the ONE renderer.
 *
 * The fidelity-critical pieces of the Fast renderer, extracted out of
 * `app/fast-sandbox/page.tsx` so there is exactly ONE place that defines
 * the preview vocabulary + how a JSX source string becomes a React
 * component. Consumed by:
 *
 *   - `app/fast-sandbox/page.tsx` — the Studio iframe (adds its chrome:
 *     double-buffered commit/swap, selection agent, comment pins, the
 *     grade:* postMessage protocol) around this core.
 *   - the MCP App View (`preview-view/`) — adds the MCP Apps `tool-result`
 *     handshake + a plain createRoot mount, no Studio chrome.
 *
 * Anything that affects WHAT renders (the module vocabulary, the sucrase
 * compile, import self-heal, the esm.sh fallback, the provider wrap, the
 * failure UI, the runtime error boundary) lives here so the two consumers
 * can never drift. Anything that's a per-surface concern (how/when to
 * mount, selection, comments, theme transport) stays in the consumer.
 */

import * as React from "react";
import * as ReactJsxRuntime from "react/jsx-runtime";
import * as ReactJsxDevRuntime from "react/jsx-dev-runtime";
// react-dom is Tier-1 (bundled), NOT Tier-2: screens import createPortal
// (map-pin overlays), and an esm.sh copy would be a SECOND React renderer
// instance — portals must come from the same copy that mounts the tree.
// Also the MCP preview View's CSP is connect-src 'none', so for it the
// CDN tier can never resolve anything.
import * as ReactDom from "react-dom";
import * as ReactDomClient from "react-dom/client";
import { transform as sucraseTransform } from "sucrase";

// ─── Static imports of every module the preview can reach for. ────────
//
// Mirrors the fast-mode module resolver AND Sandpack's PLAYGROUND_
// DEPENDENCIES. If you add an entry to either of those, mirror it here
// so snippets that import it actually resolve.
import * as GradeuiUi from "@gradeui/ui";
// Composer comes from the VENDORED copy, NOT @gradeui/ui/composer (dist). The
// Studio chat chrome already loads the vendored composer, and lexical requires a
// single module instance app-wide. Pulling the dist subpath here loaded a second
// copy of lexical-beautiful-mentions, so BeautifulMentionNode subclassed a
// different LexicalNode and the editor threw on creation. Merged into the
// "@gradeui/ui" namespace so existing <Composer> screens still resolve.
import * as GradeuiComposer from "@/components/ui/composer";
import * as LucideReact from "lucide-react";
import * as Recharts from "recharts";
import * as CanvasConfetti from "canvas-confetti";
import * as Clsx from "clsx";
import * as ClassVarianceAuthority from "class-variance-authority";
import * as TailwindMerge from "tailwind-merge";
import * as TiptapReact from "@tiptap/react";
import * as TiptapStarterKit from "@tiptap/starter-kit";
import * as TiptapExtensionMention from "@tiptap/extension-mention";
import * as TiptapExtensionPlaceholder from "@tiptap/extension-placeholder";
import * as DndKitCore from "@dnd-kit/core";
import * as DndKitSortable from "@dnd-kit/sortable";
import * as DndKitUtilities from "@dnd-kit/utilities";
import * as MotionReact from "motion/react";
import * as ReactVirtuoso from "react-virtuoso";
import * as ReactHotkeysHook from "react-hotkeys-hook";
import * as TanstackReactTable from "@tanstack/react-table";
import * as RadixContextMenu from "@radix-ui/react-context-menu";
import * as RadixToolbar from "@radix-ui/react-toolbar";

// Design-system stylesheet — Tailwind utilities + every @gradeui/ui
// component style, plus the default token values overridden per-preview.
import "@gradeui/ui/styles.css";

import { cn } from "@/lib/utils";

// ─── Module resolver ──────────────────────────────────────────────────
//
// Sucrase's "imports" transform rewrites ESM imports into require() calls.
// We provide this resolver as the `require` argument to the compiled
// function. Every path the model is allowed to import must map to a
// pre-bundled module object here — the whole point is that there's no
// runtime npm fetch.

// ─── Registry vocab extensions ────────────────────────────────────────
//
// Seam for bundling an EXTERNAL registry's vocabulary into a consumer
// WITHOUT weighing down every other surface that imports this core. The
// MCP preview View registers the brightlocal vocab through this
// (preview-view/brightlocal-vocab.ts) — its bundle inlines the DS npm
// package and the registry lib modules, then answers for the
// "@brightlocal/*" specifiers here. `knows` must be cheap and
// side-effect-free (it gates the esm.sh pre-resolve); `resolve` may
// lazily compile (lib modules) and throw a descriptive error.

export interface ImportResolverExtension {
  knows(spec: string): boolean;
  resolve(spec: string): unknown;
}

const RESOLVER_EXTENSIONS: ImportResolverExtension[] = [];

export function registerImportResolver(ext: ImportResolverExtension): void {
  if (!RESOLVER_EXTENSIONS.includes(ext)) RESOLVER_EXTENSIONS.push(ext);
}

export function resolveImport(path: string): unknown {
  if (path.endsWith(".css")) return {};

  if (path === "react") return React;
  if (path === "react/jsx-runtime") return ReactJsxRuntime;
  if (path === "react/jsx-dev-runtime") return ReactJsxDevRuntime;
  if (path === "react-dom") return ReactDom;
  if (path === "react-dom/client") return ReactDomClient;

  if (path === "@gradeui/ui" || path.startsWith("@gradeui/ui/")) {
    return { ...GradeuiUi, ...GradeuiComposer };
  }
  if (path === "lucide-react") return LucideReact;
  if (path === "recharts") return Recharts;
  if (path === "canvas-confetti") return CanvasConfetti;
  if (path === "clsx") return Clsx;
  if (path === "class-variance-authority") return ClassVarianceAuthority;
  if (path === "tailwind-merge") return TailwindMerge;
  if (path === "@tiptap/react") return TiptapReact;
  if (path === "@tiptap/starter-kit") return TiptapStarterKit;
  if (path === "@tiptap/extension-mention") return TiptapExtensionMention;
  if (path === "@tiptap/extension-placeholder") return TiptapExtensionPlaceholder;
  if (path === "@dnd-kit/core") return DndKitCore;
  if (path === "@dnd-kit/sortable") return DndKitSortable;
  if (path === "@dnd-kit/utilities") return DndKitUtilities;
  if (path === "motion" || path === "motion/react") return MotionReact;
  if (path === "react-virtuoso") return ReactVirtuoso;
  if (path === "react-hotkeys-hook") return ReactHotkeysHook;
  if (path === "@tanstack/react-table") return TanstackReactTable;
  if (path === "@radix-ui/react-context-menu") return RadixContextMenu;
  if (path === "@radix-ui/react-toolbar") return RadixToolbar;

  if (
    path === "@/lib/utils" ||
    path === "./lib/utils" ||
    path === "../lib/utils"
  ) {
    return { cn };
  }

  if (/^\.\.?\/components\/ui\//.test(path)) return { ...GradeuiUi, ...GradeuiComposer };

  // Registered registry vocabularies (e.g. brightlocal in the MCP View)
  // answer BEFORE the CDN tier — their specifiers must never hit esm.sh.
  for (const ext of RESOLVER_EXTENSIONS) {
    if (ext.knows(path)) return ext.resolve(path);
  }

  if (CDN_CACHE.has(path)) {
    const entry = CDN_CACHE.get(path);
    if (entry && typeof entry === "object" && "__cdn_error__" in entry) {
      throw new Error(
        `Studio render: esm.sh failed to load "${path}": ${(entry as { __cdn_error__: string }).__cdn_error__}`
      );
    }
    return entry;
  }

  throw new Error(
    `Studio render: unknown module "${path}". The Tier-2 pre-resolve ` +
      `missed it (deeply-dynamic import?) — either pre-stamp it in ` +
      `lib/studio-render-core.tsx or rewrite the source to use a ` +
      `top-level import.`
  );
}

// ─── Tier-2: esm.sh runtime-CDN fallback ──────────────────────────────

const CDN_CACHE = new Map<string, unknown>();

const KNOWN_TIER_1 = new Set<string>([
  "react",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "react-dom",
  "react-dom/client",
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
  for (const ext of RESOLVER_EXTENSIONS) if (ext.knows(spec)) return true;
  return false;
}

const IMPORT_SPEC_RE =
  /(?:import\s+(?:\*\s+as\s+\w+|\{[^}]*\}|\w+(?:\s*,\s*\{[^}]*\})?)?\s+from\s+|import\s*\(\s*|require\s*\(\s*)['"]([^'"]+)['"]/g;

export async function preResolveUnknownImports(source: string): Promise<void> {
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
        // ?external=react,react-dom — the CDN module's own react imports
        // stay BARE and resolve through the document importmap to the
        // SAME esm.sh react@19 the sandbox renders with. Without it,
        // esm.sh bundles a second React and any hook/context-using
        // package (e.g. @vis.gl/react-google-maps' APIProvider) dies
        // with invalid-hook-call. Harmless for react-free packages.
        const mod = await import(
          /* webpackIgnore: true */ `https://esm.sh/${spec}?external=react,react-dom`
        );
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

export function healMissingLucideImports(source: string): string {
  const used = new Set<string>();
  const tagRx = /<([A-Z][A-Za-z0-9_]*)(?=[\s/>])/g;
  let m: RegExpExecArray | null;
  while ((m = tagRx.exec(source)) !== null) used.add(m[1]);
  if (used.size === 0) return source;

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

export interface CompileResult {
  Component: React.ComponentType | null;
  error: Error | null;
}

/** Compile + execute a MODULE (registry lib module — no default-export
 *  requirement) and return its exports namespace. Same sucrase config as
 *  `compile`; the resolver defaults to `resolveImport` and is overridable
 *  so a vocab extension can inject a cycle-guarded resolver. */
export function compileModule(
  source: string,
  resolver: (path: string) => unknown = resolveImport,
): Record<string, unknown> {
  const { code } = sucraseTransform(source, {
    transforms: ["jsx", "typescript", "imports"],
    jsxRuntime: "automatic",
    production: true,
    filePath: "/lib-module.tsx",
  });
  // "React" in the compiled scope — parity with /external-sandbox (its
  // executor does exactly this): screens/lib modules may use bare
  // React.useState etc. without importing React, and must not depend on
  // a window.React global the host page never sets.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function("module", "exports", "require", "React", code);
  const shim = { exports: {} as Record<string, unknown> };
  fn(shim, shim.exports, resolver, React);
  return shim.exports;
}

// ─── Project shared components ────────────────────────────────────────
//
// Project-scoped reusable modules (shared_components table, migration
// 0025) that screens import via ONE stable specifier. The host surface
// (FlatScreen, the MCP View, the embed) calls setProjectModules() with
// {name → raw JSX module source} BEFORE compiling the screen; the
// resolver below answers the specifier with a LAZY namespace — each
// component compiles on first property access via compileModule, so
// unused components cost nothing and A-uses-B-uses-A only fails on a
// true circular *initialization* access, not on mutual imports.

export const PROJECT_COMPONENTS_SPECIFIER = "@project/components";

let projectModuleSources: Readonly<Record<string, string>> = {};
const projectModuleExports = new Map<
  string,
  Record<string, unknown> | "compiling"
>();
let projectNamespace: Record<string, unknown> | null = null;

/** Replace the current render's shared-component sources ({name → JSX
 *  module source}). Clears compiled caches so edits take effect on the
 *  next compile. Pass null/{} to clear. */
export function setProjectModules(
  sources: Readonly<Record<string, string>> | null | undefined,
): void {
  projectModuleSources = sources ?? {};
  projectModuleExports.clear();
  projectNamespace = null;
}

function compileProjectModule(name: string): Record<string, unknown> {
  const state = projectModuleExports.get(name);
  if (state === "compiling") {
    throw new Error(
      `Shared component "${name}" is part of a circular initialization — ` +
        `break the cycle by referencing the other component inside render, ` +
        `not at module top level.`,
    );
  }
  if (state) return state;
  const source = projectModuleSources[name];
  if (source == null) {
    throw new Error(
      `Unknown shared component "${name}" — not in this project's ` +
        `shared_components (or the host didn't pass it to this render).`,
    );
  }
  projectModuleExports.set(name, "compiling");
  try {
    const exports = compileModule(source, (path) =>
      path === PROJECT_COMPONENTS_SPECIFIER
        ? getProjectNamespace()
        : resolveImport(path),
    );
    projectModuleExports.set(name, exports);
    return exports;
  } catch (err) {
    projectModuleExports.delete(name);
    throw err instanceof Error
      ? new Error(`Shared component "${name}" failed to compile: ${err.message}`)
      : err;
  }
}

function getProjectNamespace(): Record<string, unknown> {
  if (!projectNamespace) {
    const ns: Record<string, unknown> = {};
    for (const name of Object.keys(projectModuleSources)) {
      Object.defineProperty(ns, name, {
        enumerable: true,
        configurable: true,
        get: () => {
          const exports = compileProjectModule(name);
          return (exports[name] ?? exports.default) as unknown;
        },
      });
    }
    projectNamespace = ns;
  }
  return projectNamespace;
}

registerImportResolver({
  // Always claim the specifier (even with no modules loaded) so the
  // esm.sh pre-resolve never tries to fetch it from npm; resolve gives
  // the actionable error instead.
  knows: (spec) => spec === PROJECT_COMPONENTS_SPECIFIER,
  resolve: () => {
    if (Object.keys(projectModuleSources).length === 0) {
      throw new Error(
        `This screen imports "${PROJECT_COMPONENTS_SPECIFIER}" but no shared ` +
          `components were loaded for this render — the host surface must ` +
          `fetch the project's shared_components and call setProjectModules() ` +
          `before compiling.`,
      );
    }
    return getProjectNamespace();
  },
});

export function compile(source: string): CompileResult {
  try {
    const { code } = sucraseTransform(source, {
      transforms: ["jsx", "typescript", "imports"],
      jsxRuntime: "automatic",
      production: true,
      filePath: "/App.tsx",
    });
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const fn = new Function("module", "exports", "require", "React", code);
    const shim = { exports: {} as Record<string, unknown> };
    fn(shim, shim.exports, resolveImport, React);
    const Component =
      ((shim.exports.default ?? shim.exports.App) as
        | React.ComponentType
        | undefined) ?? null;
    if (!Component) {
      return {
        Component: null,
        error: new Error(
          "Studio render: snippet didn't export a default React component. " +
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

export function PreviewWrap({ children }: { children: React.ReactNode }) {
  return (
    <GradeuiUi.TooltipProvider delayDuration={300}>
      {children}
    </GradeuiUi.TooltipProvider>
  );
}

// ─── Runtime error panel ──────────────────────────────────────────────

export function FailurePanel({ error }: { error: Error }) {
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
            The generated code couldn&rsquo;t run.
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
      </div>
    </div>
  );
}

// ─── Render error boundary ────────────────────────────────────────────

export class RenderErrorBoundary extends React.Component<
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
