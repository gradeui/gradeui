"use client";

/**
 * RegistryComponentsBrowser — the "what does the agent actually know?"
 * surface. Design System → Components in the Studio left rail.
 *
 * GRID of components (Magic-Patterns-style "All components") → click a
 * card for the detail view. Registry-driven end to end, so the same
 * page documents gradeui OR an external DS (BrightLocal) — whichever
 * the project targets:
 *
 *   - the grid is `registry.components.allowed` (OUTPUT RULE #4);
 *   - each card live-renders the component's FIRST canonical example
 *     (the ```jsx blocks in its sidecar body) through the registry's
 *     own renderer — Fast Frame for gradeui, /external-sandbox for
 *     external DSes. Previews mount lazily (IntersectionObserver) so
 *     an 80-component grid doesn't boot 80 iframes up front;
 *   - the detail's "Sent to the agent" is renderComponentRefsBlock
 *     ({ onlyFor }) — byte-identical to the per-turn refs block the
 *     chat route stitches;
 *   - retrieval terms are the exact alias table relevantComponentNames
 *     matches against.
 *
 * Editing (v1): sidecar files are the source of truth — the detail
 * footer shows the path + regen command per registry. An in-Studio
 * editor is the follow-up (needs a dev-only write route).
 */

import * as React from "react";
import { ArrowLeft, Pin, Search, FileCode2 } from "lucide-react";
import {
  listComponentRefs,
  renderComponentRefsBlock,
} from "@gradeui/studio/playbook";
import type { DesignSystemRegistry } from "@gradeui/studio/registry";
import { useActiveRegistry } from "@/lib/use-active-registry";
import { useGeneratedTheme } from "@/components/theme-builder";
import { FastIframeHost } from "@/components/studio/fast-frame";
import { ExternalIframeHost } from "@/components/studio/external-ds-frame";
import { prepareAppSource } from "@/lib/chat-sandpack";
import { Badge, Input } from "@gradeui/ui";
import { cn } from "@/lib/utils";

/** ```jsx / ```tsx fenced blocks out of a sidecar body, in order. */
function extractJsxBlocks(body: string | undefined): string[] {
  if (!body) return [];
  const out: string[] = [];
  const re = /```(?:jsx|tsx)\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const code = m[1].trim();
    // Harvest truncation artifacts are mid-expression cuts — they can
    // never compile (unterminated strings/JSX). Still in the sidecar
    // (the model reads prose fine), just not previewable.
    if (code && !code.includes("…truncated")) out.push(code);
  }
  return out;
}

/** Where to edit this component's sidecar, per registry. */
function sidecarPathHint(registry: DesignSystemRegistry, name: string): {
  path: string;
  regen: string;
} {
  const slug = name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
  if (registry.id === "gradeui") {
    return {
      path: `packages/ui/components/ui/${slug}.md`,
      regen: "pnpm -F @gradeui/studio generate:sidecars && pnpm -F @gradeui/ui generate:contracts",
    };
  }
  return {
    path: `packages/studio/registries/${registry.id}/sidecars/${slug}.md`,
    regen: `pnpm -F @gradeui/studio generate:registry-sidecars && pnpm -F @gradeui/studio generate:${registry.id}-contracts`,
  };
}

/** Mount-once-when-visible — an 80-card grid must not boot 80 iframes
 *  up front. Once a preview has mounted it STAYS mounted (both
 *  renderers cache their module graphs, so later scroll-bys are
 *  cheap and don't flash). */
function useInViewOnce<T extends Element>(): [React.RefObject<T | null>, boolean] {
  const ref = React.useRef<T | null>(null);
  const [seen, setSeen] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setSeen(true);
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return [ref, seen];
}

/** Sidecar snippet → renderable module. Sidecar examples are FRAGMENTS
 *  by design (authors document composition, not app boilerplate): they
 *  lead with `//` prose comments, have several sibling roots, and use
 *  SUBCOMPONENTS (CardHeader, AvatarImage) + lucide icons — none of
 *  which prepareAppSource's auto-import can fabricate (its allowlist
 *  carries roots only). So we build the module ourselves: line comments
 *  become JSX comments, every PascalCase tag known to the registry
 *  (roots + each ref's subcomponents) imports from the DS barrel, and
 *  anything else PascalCase is assumed to be an icon. prepareAppSource
 *  still runs last for source-id/media injection + repair passes. */
function snippetToApp(
  code: string,
  registry: DesignSystemRegistry,
  dsNames: ReadonlySet<string>,
): string {
  // 0. HOIST IMPORTS. Storybook snippets carry their own import lines
  //    (often mid-snippet, before a nested example) — they must sit at
  //    module top, and every name they bind is excluded from our
  //    generated imports (duplicate bindings are a SyntaxError).
  const snippetImports: string[] = [];
  const restLines: string[] = [];
  for (const l of code.split("\n")) {
    (/^\s*import\s/.test(l) ? snippetImports : restLines).push(l);
  }
  const rest = restLines.join("\n").trim();
  const importedNames = new Set<string>();
  for (const l of snippetImports) {
    const named = /\{([^}]*)\}/.exec(l);
    if (named) {
      for (const n of named[1].split(",")) {
        const clean = n.trim().split(/\s+as\s+/).pop();
        if (clean) importedNames.add(clean);
      }
    }
    const dflt = /^import\s+([A-Za-z_$][\w$]*)/.exec(l.trim());
    if (dflt) importedNames.add(dflt[1]);
  }

  // Complete modules / named components: reassemble and let
  // prepareAppSource's own wrapping (export-default detection, named-
  // function fallback) do the rest.
  if (/export\s+default/.test(rest) || /^(?:function|const)\s+[A-Z]/.test(rest)) {
    return prepareAppSource([...snippetImports, "", rest].join("\n"));
  }

  // FRAGMENT path. Split PRELUDE STATEMENTS (hook setup) from JSX —
  // statements belong in the component body, not JSX children. The
  // first column-0 `<` starts the JSX chunk.
  const rawLines = rest.split("\n");
  const firstJsxIdx = rawLines.findIndex((l) => /^</.test(l));
  const preludeLines = firstJsxIdx > 0 ? rawLines.slice(0, firstJsxIdx) : [];
  const jsxLines = firstJsxIdx >= 0 ? rawLines.slice(firstJsxIdx) : rawLines;
  // Strip TS type ARGUMENTS from prelude calls — the esm.sh sucrase
  // build chokes on `useState<Date | undefined>(...)` (works in the
  // local build; parser-version lottery). Types are inert in a
  // preview, so `useState(...)` is behaviour-identical.
  const prelude = preludeLines
    .join("\n")
    .replace(/([A-Za-z_$][\w$]*)<[^<>()]*(?:<[^<>()]*>[^<>()]*)*>\(/g, "$1(")
    .trim();
  const body = jsxLines
    .map((l) =>
      /^\s*\/\//.test(l)
        ? l.replace(/^(\s*)\/\/(.*)$/, "$1{/*$2 */}")
        : l,
    )
    .join("\n");

  // Tag census → import lines (minus what the snippet already imports).
  // Scanned over the JSX CHUNK only — the prelude's TS generics
  // ("useState<Date | undefined>") would otherwise read as tags and
  // fabricate a phantom `import { Date }` that shadows the global.
  const tags = new Set<string>();
  const tagRe = /<([A-Z][A-Za-z0-9]*)/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(body)) !== null) {
    if (!importedNames.has(m[1])) tags.add(m[1]);
  }
  const ds: string[] = [];
  const icons: string[] = [];
  for (const t of tags) (dsNames.has(t) ? ds : icons).push(t);
  const iconPkg =
    registry.components.externalImports.find((p) => /icon|lucide/i.test(p)) ??
    "lucide-react";
  const importLines = [
    importedNames.has("React") ? "" : `import * as React from "react";`,
    ...snippetImports,
    ds.length
      ? `import { ${ds.sort().join(", ")} } from "${registry.package.name}";`
      : "",
    icons.length
      ? `import { ${icons.sort().join(", ")} } from "${iconPkg}";`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  // Inline styles, not Tailwind classes — the wrapper must have its
  // padding regardless of whether the renderer's utility compiler has
  // scanned it (Ali: "no margins on the card page examples").
  return prepareAppSource(
    `${importLines}

export default function Example() {
${prelude ? `  ${prelude.split("\n").join("\n  ")}\n` : ""}  return (
    <div style={{ display: "flex", minHeight: "100%", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", gap: 16, padding: 24, boxSizing: "border-box" }}>
${body}
    </div>
  );
}`,
  );
}

/** allowed roots + every ref's subcomponents — the DS-name census the
 *  snippet import builder classifies tags against. */
function useDsNames(
  registry: DesignSystemRegistry,
  refs: ReadonlyArray<{ name: string; subcomponents?: string[] }>,
): ReadonlySet<string> {
  return React.useMemo(() => {
    const s = new Set<string>(registry.components.allowed);
    for (const r of refs) {
      s.add(r.name);
      for (const sub of r.subcomponents ?? []) s.add(sub);
    }
    return s;
  }, [registry, refs]);
}

function ExamplePreview({
  code,
  registry,
  dsNames,
  className,
}: {
  code: string;
  registry: DesignSystemRegistry;
  dsNames: ReadonlySet<string>;
  className?: string;
}) {
  const theme = useGeneratedTheme();
  const external = registry.id !== "gradeui";
  const appSource = React.useMemo(
    () => snippetToApp(code, registry, dsNames),
    [code, registry, dsNames],
  );
  // Boot shimmer for the external renderer — the esm.sh module graph
  // takes seconds (tens on a dev server), and a silent white box reads
  // as "broken". Dropped on the first ext:rendered.
  const [booting, setBooting] = React.useState(external);
  return (
    <div className={cn("relative overflow-hidden bg-white", className)}>
      {external ? (
        <ExternalIframeHost
          appSource={appSource}
          mode="light"
          registryId={registry.id}
          onRendered={() => setBooting(false)}
        />
      ) : (
        <FastIframeHost
          appSource={appSource}
          theme={theme}
          mode="light"
          motion={false}
        />
      )}
      {booting && (
        <div className="pointer-events-none absolute inset-0 flex animate-pulse items-center justify-center bg-muted/40">
          <span className="text-[11px] text-muted-foreground">
            Booting {registry.shortName ?? registry.name}…
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Grid card ─────────────────────────────────────────────────────────

function ComponentCard({
  name,
  example,
  pinned,
  hasSidecar,
  registry,
  dsNames,
  onOpen,
}: {
  name: string;
  example: string | null;
  pinned: boolean;
  hasSidecar: boolean;
  registry: DesignSystemRegistry;
  dsNames: ReadonlySet<string>;
  onOpen: () => void;
}) {
  const [ref, inView] = useInViewOnce<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className="group flex flex-col overflow-hidden rounded-lg border border-border transition-shadow hover:shadow-md"
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 text-left"
      >
        <span className="truncate text-sm font-medium group-hover:underline">
          {name}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {pinned && <Pin className="h-3 w-3 text-muted-foreground/70" />}
          {!hasSidecar && (
            <span
              title="No sidecar — the agent only knows this name exists"
              className="h-1.5 w-1.5 rounded-full bg-amber-500"
            />
          )}
        </span>
      </button>
      {/* Preview area — the first canonical example, rendered live and
          non-interactive (a card is a poster, not a playground). */}
      <div className="relative h-44">
        {example ? (
          inView ? (
            <>
              <ExamplePreview
                code={example}
                registry={registry}
                dsNames={dsNames}
                className="h-full w-full"
              />
              {/* Click shield — the card opens the detail; the preview
                  iframe must not swallow the click. */}
              <button
                type="button"
                aria-label={`Open ${name}`}
                onClick={onOpen}
                className="absolute inset-0 cursor-pointer"
              />
            </>
          ) : (
            <div className="h-full w-full animate-pulse bg-muted/40" />
          )
        ) : (
          <button
            type="button"
            onClick={onOpen}
            className="flex h-full w-full items-center justify-center bg-muted/20 px-4 text-center text-xs text-muted-foreground"
          >
            {hasSidecar
              ? "No canonical example yet — add a ```jsx block to the sidecar"
              : "No sidecar yet"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Detail view ───────────────────────────────────────────────────────

function ComponentDetail({
  name,
  registry,
  onBack,
}: {
  name: string;
  registry: DesignSystemRegistry;
  onBack: () => void;
}) {
  const refs = React.useMemo(() => listComponentRefs(registry), [registry]);
  const dsNames = useDsNames(registry, refs);
  const ref = refs.find((r) => r.name === name);
  const pinned = registry.components.pinned.includes(name);
  const refBlock = React.useMemo(
    () => renderComponentRefsBlock({ onlyFor: [name], registry }),
    [name, registry],
  );
  const examples = React.useMemo(() => extractJsxBlocks(ref?.body), [ref]);
  const retrievalTerms = ref
    ? [ref.name, ...(ref.subcomponents ?? []), ...(ref.aliases ?? [])]
    : [];
  const hint = sidecarPathHint(registry, name);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All components
      </button>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="flex flex-col gap-6 pb-10">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{name}</h3>
              {pinned && (
                <Badge variant="secondary" className="gap-1">
                  <Pin className="h-3 w-3" /> Pinned
                </Badge>
              )}
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              import {"{"} {name} {"}"} from &quot;
              {ref?.import ?? registry.package.name}&quot;
            </p>
          </div>

          <section className="flex flex-col gap-1.5">
            <h4 className="text-sm font-medium">When the agent sees this</h4>
            {pinned ? (
              <p className="text-sm text-muted-foreground">
                Pinned — this reference rides <em>every</em> prompt for
                projects on {registry.name}, regardless of what you type.
              </p>
            ) : ref ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm text-muted-foreground">
                  Sent when the conversation mentions:
                </span>
                {retrievalTerms.map((t) => (
                  <Badge key={t} variant="outline" className="font-normal">
                    {t}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No sidecar — the agent knows the name from the allowlist but
                gets no API reference, examples, or retrieval aliases. Add a
                sidecar to teach it.
              </p>
            )}
          </section>

          {refBlock && (
            <section className="flex flex-col gap-1.5">
              <h4 className="text-sm font-medium">
                Exactly what the agent receives
              </h4>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed">
                {refBlock}
              </pre>
            </section>
          )}

          {examples.length > 0 && (
            <section className="flex flex-col gap-3">
              <h4 className="text-sm font-medium">
                Canonical examples ({examples.length}) — live on this
                registry&rsquo;s renderer
              </h4>
              {examples.map((code, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <ExamplePreview
                    code={code}
                    registry={registry}
                    dsNames={dsNames}
                    className="h-80 rounded-md border border-border"
                  />
                  <details>
                    <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                      Example {i + 1} source
                    </summary>
                    <pre className="mt-1 overflow-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed">
                      {code}
                    </pre>
                  </details>
                </div>
              ))}
            </section>
          )}

          <section className="flex flex-col gap-1.5 rounded-md border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <FileCode2 className="h-3.5 w-3.5" /> Expand this reference
            </div>
            <p className="text-xs text-muted-foreground">
              Edit <code className="font-mono">{hint.path}</code> — add
              ```jsx blocks to the body and they become canonical examples the
              agent reads (and this page previews). Then run:
            </p>
            <code className="rounded bg-muted px-2 py-1 font-mono text-[11px]">
              {hint.regen}
            </code>
          </section>
        </div>
      </div>
    </div>
  );
}

// ─── Root: grid ⇄ detail ───────────────────────────────────────────────

export function RegistryComponentsBrowser() {
  const registry = useActiveRegistry();
  const refs = React.useMemo(() => listComponentRefs(registry), [registry]);
  const dsNames = useDsNames(registry, refs);
  const refByName = React.useMemo(
    () => new Map(refs.map((r) => [r.name, r])),
    [refs],
  );
  const pinned = React.useMemo(
    () => new Set(registry.components.pinned),
    [registry],
  );
  // ROOTS only. Allowlists include every subcomponent as its own entry
  // (AccordionItem, AlertDialogAction, …) — correct for the model's
  // OUTPUT RULE, noise for a catalog. A name is folded into its root's
  // card when (a) some ref lists it under `subcomponents`, or (b) it has
  // no sidecar of its own but extends another allowed name that does
  // ("CardHeader" → "Card"). Search still finds subcomponents via the
  // alias/subcomponent matching below.
  const allNames = React.useMemo(() => {
    const subOfSomeRoot = new Set<string>();
    for (const r of refs) {
      for (const s of r.subcomponents ?? []) subOfSomeRoot.add(s);
    }
    const withSidecar = new Set(refs.map((r) => r.name));
    const names = [...registry.components.allowed];
    const nameSet = new Set(names);
    return names
      .filter((n) => {
        if (withSidecar.has(n)) return true;
        if (subOfSomeRoot.has(n)) return false;
        // Prefix-fold: "AlertDialogAction" hides when "AlertDialog" (or
        // any shorter prefix at a case boundary) is itself allowed and
        // documented.
        for (let i = n.length - 1; i > 0; i--) {
          if (!/[A-Z]/.test(n[i])) continue;
          const root = n.slice(0, i);
          if (nameSet.has(root) && withSidecar.has(root)) return false;
        }
        return true;
      })
      .sort((a, b) => a.localeCompare(b));
  }, [registry, refs]);
  const firstExampleByName = React.useMemo(() => {
    const map = new Map<string, string | null>();
    for (const name of allNames) {
      map.set(name, extractJsxBlocks(refByName.get(name)?.body)[0] ?? null);
    }
    return map;
  }, [allNames, refByName]);

  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allNames;
    return allNames.filter((n) => {
      if (n.toLowerCase().includes(q)) return true;
      const ref = refByName.get(n);
      return (
        ref?.aliases?.some((a) => a.toLowerCase().includes(q)) ||
        ref?.subcomponents?.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [allNames, refByName, query]);

  // Registry switch (project switch) drops a stale selection.
  React.useEffect(() => {
    setSelected(null);
  }, [registry.id]);

  if (selected && allNames.includes(selected)) {
    return (
      <ComponentDetail
        name={selected}
        registry={registry}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold">All components</h3>
          <p className="text-xs text-muted-foreground">
            {allNames.length} components in {registry.name} — what the agent
            can build with on this project.
          </p>
        </div>
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search components…"
            className="pl-8"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1" data-lenis-prevent>
        <div className="grid grid-cols-1 gap-4 pb-10 sm:grid-cols-2">
          {filtered.map((name) => (
            <ComponentCard
              key={`${registry.id}:${name}`}
              name={name}
              example={firstExampleByName.get(name) ?? null}
              pinned={pinned.has(name)}
              hasSidecar={refByName.has(name)}
              registry={registry}
              dsNames={dsNames}
              onOpen={() => setSelected(name)}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nothing matches “{query}”.
          </p>
        )}
      </div>
    </div>
  );
}
