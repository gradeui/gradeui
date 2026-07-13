"use client";

/**
 * RegistryBlocksBrowser — Design System → Blocks. The registry's
 * COMPOSED PATTERNS (login layouts, data tables, sidebar family, map
 * states), harvested from the DS's own Storybook into
 * `registry.blocks`.
 *
 * SOURCE-FIRST on purpose: the point of this area is taking the code
 * (and, next, seeding screens / feeding the agent composition
 * examples). Previews are best-effort — block sources are CSF story
 * objects that reference story-file locals (columns, useDataTable)
 * which only exist in the DS's repo, so:
 *   - DS components (allowlist + subcomponents) import for real;
 *   - unknown PascalCase components become labelled placeholder stubs
 *     (the login block renders its SplitLayout with visible
 *     "story-local" panels instead of erroring);
 *   - common story helpers (fn, breakpoint) are shimmed;
 *   - anything still unrunnable shows the renderer's error strip —
 *     the source above it is the artifact that matters.
 */

import * as React from "react";
import { ArrowLeft, Copy, Check } from "lucide-react";
import type {
  DesignSystemRegistry,
  RegistryBlock,
} from "@gradeui/studio/registry";
import { listComponentRefs } from "@gradeui/studio/playbook";
import { useActiveRegistry } from "@/lib/use-active-registry";
import { ExternalIframeHost } from "@/components/studio/external-ds-frame";
import { Badge, Input } from "@gradeui/ui";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** Block story source → renderable module (best effort). */
function blockToApp(
  block: RegistryBlock,
  registry: DesignSystemRegistry,
  dsNames: ReadonlySet<string>,
): string {
  const source = block.source.trim();

  // Tag census: DS names import for real, everything else is stubbed.
  const tags = new Set<string>();
  const tagRe = /<([A-Z][A-Za-z0-9]*)/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(source)) !== null) tags.add(m[1]);
  const ds: string[] = [];
  const stubs: string[] = [];
  for (const t of tags) (dsNames.has(t) ? ds : stubs).push(t);

  const imports = [
    `import * as React from "react";`,
    ds.length
      ? `import { ${ds.sort().join(", ")} } from "${registry.package.name}";`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const stubDefs = stubs
    .sort()
    .map(
      (s) =>
        `const ${s} = (props) => <div style={{ padding: 16, border: "1px dashed #cbd5e1", borderRadius: 8, color: "#64748b", fontSize: 12 }}>{"<${s} /> (story-local)"}{props.children}</div>;`,
    )
    .join("\n");

  // Story-helper shims — the common CSF vocab (fn() handlers,
  // breakpoint constants) plus the block's DETECTED story-local data
  // identifiers (block.freeIds, found by the generator's VM audit).
  // Empty arrays: lists render their structure with no rows, which
  // beats an error strip. The card badges the shim.
  const shims = [
    `const fn = () => () => {};`,
    `const breakpoint = { sm: 640, md: 768, lg: 1024, xl: 1280, "2xl": 1536 };`,
    ...(block.freeIds ?? []).map((id) => `const ${id} = [];`),
  ].join("\n");

  const isStoryObject = source.startsWith("{");
  const body = isStoryObject
    ? `const __story = (${source});
export default function BlockPreview() {
  const R = __story.render;
  if (!R) return <div style={{ padding: 24, color: "#64748b", fontSize: 13 }}>Story has no render() — see source.</div>;
  return <R {...(__story.args ?? {})} />;
}`
    : `export default function BlockPreview() {
  return (
    <div style={{ padding: 24, boxSizing: "border-box" }}>
${
  // Leading // header lines (recipe provenance/keywords) would render
  // as literal text in JSX children — strip them from the PREVIEW
  // build only; the code view shows the full source.
  source.replace(/^(?:\/\/[^\n]*\n)+/, "")
}
    </div>
  );
}`;

  // NO prepareAppSource here — its repair/inject passes (multiline-
  // string repair, source-id injection) use regex scanners that mangle
  // the nested template literals CSF story objects carry
  // (parameters.docs.source.code = `...JSX...`). Blocks previews are
  // read-only and the imports are explicit, so none of those passes
  // are needed.
  return [imports, shims, stubDefs, "", body].filter(Boolean).join("\n");
}

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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy source"}
    </button>
  );
}

function BlockPreviewFrame({
  block,
  registry,
  dsNames,
  className,
}: {
  block: RegistryBlock;
  registry: DesignSystemRegistry;
  dsNames: ReadonlySet<string>;
  className?: string;
}) {
  const [booting, setBooting] = React.useState(true);
  const appSource = React.useMemo(
    () => blockToApp(block, registry, dsNames),
    [block, registry, dsNames],
  );
  return (
    <div className={cn("relative bg-white", className)}>
      <ExternalIframeHost
        appSource={appSource}
        mode="light"
        registryId={registry.id}
        rawSource
        onRendered={() => setBooting(false)}
      />
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

function BlockCard({
  block,
  registry,
  dsNames,
  onOpen,
}: {
  block: RegistryBlock;
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
        <div className="min-w-0">
          <span className="block truncate text-sm font-medium group-hover:underline">
            {block.name}
          </span>
          <span className="block truncate text-[11px] text-muted-foreground">
            {block.description ?? block.group}
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-1.5">
          {block.freeIds && block.freeIds.length > 0 && (
            <span
              title={`Story data shimmed as empty: ${block.freeIds.join(", ")} — the real data lives in BrightLocal's story file`}
              className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700"
            >
              shimmed
            </span>
          )}
        </span>
      </button>
      <div className="relative h-72">
        {inView ? (
          <>
            <BlockPreviewFrame
              block={block}
              registry={registry}
              dsNames={dsNames}
              className="h-full w-full"
            />
            {/* Click shield → detail; the iframe must not eat the click. */}
            <button
              type="button"
              aria-label={`Open ${block.name}`}
              onClick={onOpen}
              className="absolute inset-0 cursor-pointer"
            />
          </>
        ) : (
          <div className="h-full w-full animate-pulse bg-muted/40" />
        )}
      </div>
    </div>
  );
}

function BlockDetail({
  block,
  registry,
  dsNames,
  onBack,
}: {
  block: RegistryBlock;
  registry: DesignSystemRegistry;
  dsNames: ReadonlySet<string>;
  onBack: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All blocks
      </button>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="flex flex-col gap-4 pb-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">{block.name}</h3>
              <p className="text-xs text-muted-foreground">
                {block.group}
                {block.description ? ` — ${block.description}` : ""}
              </p>
            </div>
            <CopyButton text={block.source} />
          </div>
          {block.freeIds && block.freeIds.length > 0 && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Preview shims story data as empty arrays:{" "}
              <code className="font-mono">{block.freeIds.join(", ")}</code> —
              the real data lives in {registry.name}&rsquo;s story file (ask
              them for the blocks source).
            </p>
          )}
          <BlockPreviewFrame
            block={block}
            registry={registry}
            dsNames={dsNames}
            className="h-[480px] rounded-md border border-border"
          />
          <section className="flex flex-col gap-1.5">
            <h4 className="text-sm font-medium">Source</h4>
            <pre className="overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed">
              {block.source}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}

export function RegistryBlocksBrowser() {
  const registry = useActiveRegistry();
  const refs = React.useMemo(() => listComponentRefs(registry), [registry]);
  const dsNames = React.useMemo(() => {
    const s = new Set<string>(registry.components.allowed);
    for (const r of refs) {
      s.add(r.name);
      for (const sub of r.subcomponents ?? []) s.add(sub);
    }
    return s;
  }, [registry, refs]);

  const blocks = React.useMemo(
    () => Object.values(registry.blocks ?? {}),
    [registry],
  );
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<string | null>(null);
  React.useEffect(() => {
    setSelected(null);
  }, [registry.id]);
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return blocks;
    return blocks.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.group.toLowerCase().includes(q) ||
        b.source.toLowerCase().includes(q),
    );
  }, [blocks, query]);
  const groups = React.useMemo(() => {
    const byGroup = new Map<string, RegistryBlock[]>();
    for (const b of filtered) {
      const list = byGroup.get(b.group) ?? [];
      list.push(b);
      byGroup.set(b.group, list);
    }
    return [...byGroup.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const selectedBlock = selected
    ? blocks.find((b) => b.id === selected)
    : null;
  if (selectedBlock) {
    return (
      <BlockDetail
        block={selectedBlock}
        registry={registry}
        dsNames={dsNames}
        onBack={() => setSelected(null)}
      />
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        <p>{registry.name} ships no blocks yet.</p>
        <p className="mt-1 text-xs">
          Blocks are harvested from the design system&rsquo;s Storybook —
          see packages/studio/scripts/harvest-*-blocks.mjs.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold">Blocks</h3>
          <p className="text-xs text-muted-foreground">
            {blocks.length} composed patterns from {registry.name} — copy the
            source, or use them as references for what &ldquo;their way&rdquo;
            looks like.
          </p>
        </div>
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search blocks…"
            className="pl-8"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1" data-lenis-prevent>
        <div className="flex flex-col gap-8 pb-10">
          {groups.map(([group, items]) => (
            <section key={group} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold">{group}</h4>
                <Badge variant="outline" className="font-normal">
                  {items.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {items.map((b) => (
                  <BlockCard
                    key={`${registry.id}:${b.id}`}
                    block={b}
                    registry={registry}
                    dsNames={dsNames}
                    onOpen={() => setSelected(b.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
