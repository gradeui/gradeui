"use client";

/**
 * StageBInspector — what's actually on the current screen.
 *
 * Replaces the placeholder card that used to live in the Stage B slot
 * of `<StudioRightPanel>`. When the user has a design open but
 * nothing's selected (Stage B), the right column now shows a live
 * inspection of the rendered JSX:
 *
 *   - Grade Components — every `<X>` JSX tag that resolves to a
 *     known DS component (matched against ALLOWED_COMPONENTS), with
 *     per-component use counts + a link to the docs page.
 *   - React libraries — every external `import` specifier (Tier 1
 *     pre-stamped + Tier 2 esm.sh fallback), with a tier badge so
 *     consumers know which side of the resolver they're on.
 *
 * Parsing strategy: TypeScript compiler API for the JSX walk (same
 * approach the JSX validator uses), plus a regex for import specifiers
 * (lifted from fast-sandbox's preResolveUnknownImports). Both are pure
 * read-only — the inspector never mutates source.
 *
 * Re-derives on every appSource change. Cheap enough at scaffold size
 * (~150 LoC); when designs grow past that, memoise on a hash of the
 * source.
 */

import * as React from "react";
import Link from "next/link";
import * as ts from "typescript";
import { Boxes, Package, ExternalLink, Sparkles } from "lucide-react";
import { ALLOWED_COMPONENTS } from "@gradeui/studio/playbook";
import { COMPONENT_CONTRACTS } from "@gradeui/ui/contracts";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Mirror of `KNOWN_TIER_1` in apps/docs/app/fast-sandbox/page.tsx.
// Inlined here (not imported) because fast-sandbox/page.tsx is a
// client-only React component file and importing it into Studio's
// chrome would drag its iframe-only setup along. Kept in sync by
// hand — a single source-of-truth move is on the wishlist (the
// playbook's ALLOWED_EXTERNAL_IMPORTS would be the natural home).
const TIER_1_SPECIFIERS = new Set<string>([
  "react",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "@gradeui/ui",
  "lucide-react",
  "recharts",
  "canvas-confetti",
  "clsx",
  "class-variance-authority",
  "tailwind-merge",
  "motion",
  "motion/react",
  "@tiptap/react",
  "@tiptap/starter-kit",
  "@tiptap/extension-mention",
  "@tiptap/extension-placeholder",
  "@dnd-kit/core",
  "@dnd-kit/sortable",
  "@dnd-kit/utilities",
  "react-virtuoso",
  "react-hotkeys-hook",
  "@tanstack/react-table",
  "@radix-ui/react-context-menu",
  "@radix-ui/react-toolbar",
]);

const ALLOWED_COMPONENT_LOWER = new Set(
  ALLOWED_COMPONENTS.map((c) => c.toLowerCase()),
);

/**
 * Subcomponent → root map built from the contract registry. Lets the
 * inspector roll `<AppShellNav>` + `<AppShellMain>` (separate named
 * exports) under "AppShell" the same way the dot-notation walker
 * already rolls `<Carousel.Slide>` under "Carousel".
 *
 * Built once at module load. The contract's `subcomponents` array is
 * the single source of truth — both this map and the playbook's
 * model-facing refs read it.
 *
 * Compound subcomponents come in two naming styles:
 *
 *   AppShellHeader  — concatenated, separate named export. Sidebar
 *                     and AppShell both ship like this.
 *   Carousel.Slide  — dot-notation, attached to the root export.
 *                     Carousel + Sortable ship like this.
 *
 * The map only catches the FIRST style — dot-notation is already
 * handled by `extractRootComponentName`'s parent-walk.
 */
const SUBCOMPONENT_TO_ROOT = (() => {
  const map = new Map<string, string>();
  for (const [rootName, contract] of Object.entries(COMPONENT_CONTRACTS)) {
    for (const sub of contract.subcomponents ?? []) {
      // Skip dot-notation entries like "Carousel.Slide" — those are
      // already handled by extractRootComponentName.
      if (sub.includes(".")) continue;
      map.set(sub, rootName);
    }
  }
  return map;
})();

interface SubcomponentBreakdown {
  /** Short subcomponent label, e.g. "Nav" (with the root prefix stripped
   *  if it was concatenated) or "Slide" for dot-notation children. */
  label: string;
  count: number;
}

interface ComponentUsage {
  /** PascalCase root component name. */
  name: string;
  /** kebab-case slug for routing — `MultiSelect` → `multi-select`. */
  slug: string;
  /** Total count INCLUDING subcomponent occurrences. */
  count: number;
  /** True when the name matches an entry in `ALLOWED_COMPONENTS`. */
  isGrade: boolean;
  /** Per-subcomponent breakdown, empty when the root has no parts on
   *  this screen. */
  parts: SubcomponentBreakdown[];
}

interface LibraryUsage {
  specifier: string;
  /** Tier 1 = pre-stamped instant resolution; Tier 2 = esm.sh CDN. */
  tier: "tier-1" | "tier-2";
  /** Optional npm link for Tier 2 (esm.sh has no canonical page). */
  npmLink: string;
}

interface Inspection {
  components: ComponentUsage[];
  libraries: LibraryUsage[];
  /** Lucide icon names used on the current screen, deduped + sorted. */
  icons: string[];
  totalComponents: number;
  totalGrade: number;
}

const EMPTY: Inspection = {
  components: [],
  libraries: [],
  icons: [],
  totalComponents: 0,
  totalGrade: 0,
};

function pascalToKebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

function extractRootComponentName(
  tagName: ts.JsxTagNameExpression,
): string | null {
  if (ts.isIdentifier(tagName)) {
    const name = tagName.text;
    // Lowercase first char → JSX intrinsic (div, span, etc.). Skip.
    if (name[0] !== name[0].toUpperCase()) return null;
    return name;
  }
  if (ts.isPropertyAccessExpression(tagName)) {
    // `Carousel.Slide` / `Sortable.Item` → walk to the root identifier.
    let expr: ts.LeftHandSideExpression = tagName;
    while (ts.isPropertyAccessExpression(expr)) {
      expr = expr.expression as ts.LeftHandSideExpression;
    }
    if (ts.isIdentifier(expr)) return expr.text;
  }
  return null;
}

// Same regex preResolveUnknownImports uses in fast-sandbox.
const IMPORT_SPEC_RE =
  /(?:import\s+(?:\*\s+as\s+\w+|\{[^}]*\}|\w+(?:\s*,\s*\{[^}]*\})?)?\s+from\s+|import\s*\(\s*|require\s*\(\s*)['"]([^'"]+)['"]/g;

/**
 * Parse imports more thoroughly than the spec-only regex above —
 * we need to know which IDENTIFIERS came from which MODULES so the
 * JSX walker can tell a lucide icon (e.g. `<Home>`) apart from a
 * user-land component with the same shape.
 *
 * Returns:
 *   bindingToModule  — { "Home": "lucide-react", "useState": "react", … }
 *   modules          — every module specifier seen, for the Libraries list
 *
 * Uses the TS AST to walk import declarations cleanly. Named, default,
 * namespace, and renamed (`{ Foo as Bar }`) forms all surface their
 * local binding correctly.
 */
function parseImports(sf: ts.SourceFile): {
  bindingToModule: Map<string, string>;
  modules: Set<string>;
} {
  const bindingToModule = new Map<string, string>();
  const modules = new Set<string>();
  sf.statements.forEach((stmt) => {
    if (!ts.isImportDeclaration(stmt)) return;
    const spec = (stmt.moduleSpecifier as ts.StringLiteral).text;
    modules.add(spec);
    const clause = stmt.importClause;
    if (!clause) return;
    if (clause.name) {
      // `import Foo from "…"`
      bindingToModule.set(clause.name.text, spec);
    }
    const bindings = clause.namedBindings;
    if (!bindings) return;
    if (ts.isNamespaceImport(bindings)) {
      // `import * as Foo from "…"` — register the namespace local
      // name; member access (`Foo.Bar`) on it is rare enough in
      // model output that we don't bother resolving it.
      bindingToModule.set(bindings.name.text, spec);
    } else if (ts.isNamedImports(bindings)) {
      // `import { Foo, Bar as Baz } from "…"`
      bindings.elements.forEach((el) => {
        bindingToModule.set(el.name.text, spec);
      });
    }
  });
  return { bindingToModule, modules };
}

function inspect(source: string): Inspection {
  let sf: ts.SourceFile;
  try {
    sf = ts.createSourceFile(
      "Inspect.tsx",
      source,
      ts.ScriptTarget.Latest,
      /* setParentNodes */ true,
      ts.ScriptKind.TSX,
    );
  } catch {
    return EMPTY;
  }

  const { bindingToModule, modules } = parseImports(sf);

  // Walk the JSX. For each tag we decide: lucide icon, Grade root,
  // Grade subcomponent (rolls into root), or non-DS user-land.
  // `rawCounts` keeps unprocessed PascalCase names; we post-process
  // into the rollup shape after.
  const rawCounts = new Map<string, number>();
  const iconUsage = new Map<string, number>();

  const visit = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = node.tagName;
      // First check for the dot-notation case (e.g. `<Carousel.Slide>`)
      // — the parent-walk handles it.
      const rootName = extractRootComponentName(tagName);
      if (rootName) {
        // If this is dot-notation, the literal tag was `<Foo.Bar>` and
        // rootName is "Foo". Otherwise it's an Identifier and we
        // categorise based on its import source first.
        if (ts.isIdentifier(tagName)) {
          const tagText = tagName.text;
          const source = bindingToModule.get(tagText);
          if (source === "lucide-react") {
            iconUsage.set(tagText, (iconUsage.get(tagText) ?? 0) + 1);
            ts.forEachChild(node, visit);
            return;
          }
        }
        rawCounts.set(rootName, (rawCounts.get(rootName) ?? 0) + 1);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  // Roll up: for every raw name, decide its root component. If the
  // name itself is a known root, it stays. If it's a known subcomponent
  // (via SUBCOMPONENT_TO_ROOT), it folds into its parent. Otherwise
  // it's a standalone user-land component (or an unknown root) and
  // stays as itself.
  //
  // For each root, also track per-subcomponent counts so the UI can
  // render "Sidebar ×7 · Header, Content, Item ×3, Footer".
  type RootAccum = {
    rootCount: number;
    partCounts: Map<string, number>;
  };
  const byRoot = new Map<string, RootAccum>();
  const ensure = (name: string): RootAccum => {
    const existing = byRoot.get(name);
    if (existing) return existing;
    const next: RootAccum = { rootCount: 0, partCounts: new Map() };
    byRoot.set(name, next);
    return next;
  };

  for (const [name, count] of rawCounts) {
    const root = SUBCOMPONENT_TO_ROOT.get(name);
    if (root) {
      // Subcomponent. Strip the root prefix from the part label so
      // "AppShellNav" → "Nav", "SidebarHeader" → "Header". Falls back
      // to the full name if the strip would empty it.
      const acc = ensure(root);
      const stripped = name.startsWith(root) && name.length > root.length
        ? name.slice(root.length)
        : name;
      acc.partCounts.set(stripped, (acc.partCounts.get(stripped) ?? 0) + count);
    } else {
      // Either a root in its own right, or a user-land non-DS
      // component. Track it under its own name.
      ensure(name).rootCount += count;
    }
  }

  const components: ComponentUsage[] = Array.from(byRoot.entries())
    .map(([name, acc]) => {
      const isGrade = ALLOWED_COMPONENT_LOWER.has(name.toLowerCase());
      const parts: SubcomponentBreakdown[] = Array.from(acc.partCounts.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => a.label.localeCompare(b.label));
      const partTotal = parts.reduce((n, p) => n + p.count, 0);
      return {
        name,
        slug: pascalToKebab(name),
        count: acc.rootCount + partTotal,
        isGrade,
        parts,
      };
    })
    .sort((a, b) => {
      if (a.isGrade !== b.isGrade) return a.isGrade ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  // Library specifiers — filter the same way as before.
  const librariesSeen = new Set<string>();
  for (const spec of modules) {
    if (/^\.\.?\//.test(spec)) continue;
    if (spec === "@/lib/utils") continue;
    if (spec === "react" || spec === "react/jsx-runtime" || spec === "react/jsx-dev-runtime") continue;
    if (spec === "@gradeui/ui" || spec.startsWith("@gradeui/ui/")) continue;
    librariesSeen.add(spec);
  }
  // Also pick up any specifiers the AST missed (defensive — covers
  // dynamic `import()` calls + `require()` that the import-declaration
  // walker doesn't see).
  IMPORT_SPEC_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = IMPORT_SPEC_RE.exec(source)) !== null) {
    const spec = match[1];
    if (/^\.\.?\//.test(spec)) continue;
    if (spec === "@/lib/utils") continue;
    if (spec === "react" || spec === "react/jsx-runtime" || spec === "react/jsx-dev-runtime") continue;
    if (spec === "@gradeui/ui" || spec.startsWith("@gradeui/ui/")) continue;
    librariesSeen.add(spec);
  }

  const libraries: LibraryUsage[] = Array.from(librariesSeen)
    .map((specifier) => ({
      specifier,
      tier: (TIER_1_SPECIFIERS.has(specifier) ? "tier-1" : "tier-2") as
        | "tier-1"
        | "tier-2",
      npmLink: `https://www.npmjs.com/package/${specifier.split("/").slice(0, specifier.startsWith("@") ? 2 : 1).join("/")}`,
    }))
    .sort((a, b) => {
      if (a.tier !== b.tier) return a.tier === "tier-1" ? -1 : 1;
      return a.specifier.localeCompare(b.specifier);
    });

  const icons = Array.from(iconUsage.keys()).sort();

  const gradeComponents = components.filter((c) => c.isGrade);
  return {
    components,
    libraries,
    icons,
    totalComponents: components.reduce((n, c) => n + c.count, 0),
    totalGrade: gradeComponents.reduce((n, c) => n + c.count, 0),
  };
}

export interface StageBInspectorProps {
  appSource: string | null;
  /** Affordance to re-open the starter picker (Stage A). Passed
   *  through from StudioRightPanel — keeps the swap-starter action
   *  reachable without a dedicated chrome strip. */
  onSwapStarter: () => void;
  className?: string;
}

export function StageBInspector({
  appSource,
  onSwapStarter,
  className,
}: StageBInspectorProps) {
  const inspection = React.useMemo<Inspection>(
    () => (appSource ? inspect(appSource) : EMPTY),
    [appSource],
  );

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header strip — totals + swap-starter affordance. */}
      <div className="px-3 pt-3 pb-2 shrink-0 flex items-center justify-between border-b border-border">
        <span className="text-[11px] text-muted-foreground">
          {inspection.totalComponents > 0 || inspection.icons.length > 0
            ? `${inspection.totalGrade}/${inspection.totalComponents} Grade components · ${inspection.icons.length} icons · ${inspection.libraries.length} libraries`
            : "No JSX detected"}
        </span>
        <button
          type="button"
          onClick={onSwapStarter}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5",
            "text-[10px] font-medium text-muted-foreground",
            "hover:bg-muted hover:text-foreground transition-colors",
          )}
          title="Show the reference-layout starter picker"
        >
          Swap starter
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Grade Components section */}
        <section className="space-y-2">
          <header className="flex items-center gap-1.5">
            <Boxes className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Grade Components
            </h3>
            {inspection.components.filter((c) => c.isGrade).length > 0 && (
              <span className="text-[10px] text-muted-foreground/70">
                {inspection.components.filter((c) => c.isGrade).length}
              </span>
            )}
          </header>
          {inspection.components.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No DS components in the current source.
            </p>
          ) : (
            <ul className="space-y-1">
              {inspection.components
                .filter((c) => c.isGrade)
                .map((c) => (
                  <li key={c.name}>
                    <Link
                      href={`/components/${c.slug}`}
                      target="_blank"
                      className="group block rounded-md px-2 py-1 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs">{c.name}</span>
                        <div className="flex items-center gap-1.5">
                          {c.count > 1 && (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-mono"
                            >
                              ×{c.count}
                            </Badge>
                          )}
                          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      {/* Subcomponent breakdown caption — "Header, Nav,
                          Main ×2, Footer" — only when this root has
                          subcomponents on the current screen. Compound
                          components (AppShell, Sidebar, Carousel) flow
                          through here; primitives (Button, Input) skip
                          this branch entirely. */}
                      {c.parts.length > 0 && (
                        <div className="text-[10px] text-muted-foreground/80 mt-0.5 pl-0.5">
                          {c.parts
                            .map((p) =>
                              p.count > 1 ? `${p.label} ×${p.count}` : p.label,
                            )
                            .join(" · ")}
                        </div>
                      )}
                    </Link>
                  </li>
                ))}
              {inspection.components.some((c) => !c.isGrade) && (
                <li className="pt-2 mt-2 border-t border-border">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70 mb-1 px-2">
                    Other components
                  </p>
                  {inspection.components
                    .filter((c) => !c.isGrade)
                    .map((c) => (
                      <div
                        key={c.name}
                        className="flex items-center justify-between rounded-md px-2 py-1 text-muted-foreground"
                      >
                        <span className="font-mono text-xs">{c.name}</span>
                        {c.count > 1 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono"
                          >
                            ×{c.count}
                          </Badge>
                        )}
                      </div>
                    ))}
                </li>
              )}
            </ul>
          )}
        </section>

        {/* Icons section — lucide-react usages, surfaced separately so
            the Grade list stays focused. Detected via import-source
            matching, not just PascalCase tags. */}
        {inspection.icons.length > 0 && (
          <section className="space-y-2">
            <header className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Icons
              </h3>
              <span className="text-[10px] text-muted-foreground/70">
                {inspection.icons.length}
              </span>
              <span className="text-[10px] text-muted-foreground/50 ml-auto">
                from <code className="font-mono">lucide-react</code>
              </span>
            </header>
            <div className="flex flex-wrap gap-1 px-1">
              {inspection.icons.map((name) => (
                <Badge
                  key={name}
                  variant="outline"
                  className="font-mono text-[10px]"
                  title={`<${name} />`}
                >
                  {name}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* React Libraries section */}
        <section className="space-y-2">
          <header className="flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              React Libraries
            </h3>
            {inspection.libraries.length > 0 && (
              <span className="text-[10px] text-muted-foreground/70">
                {inspection.libraries.length}
              </span>
            )}
          </header>
          {inspection.libraries.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No external library imports.
            </p>
          ) : (
            <ul className="space-y-1">
              {inspection.libraries.map((lib) => (
                <li
                  key={lib.specifier}
                  className="group flex items-center justify-between rounded-md px-2 py-1 hover:bg-muted/50 transition-colors"
                >
                  <a
                    href={lib.npmLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-mono text-xs flex-1 min-w-0"
                  >
                    <span className="truncate">{lib.specifier}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </a>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-mono shrink-0",
                      lib.tier === "tier-1"
                        ? "bg-success-soft text-success-deep border-success/20"
                        : "bg-warning-soft text-warning-deep border-warning/20",
                    )}
                    title={
                      lib.tier === "tier-1"
                        ? "Pre-stamped — resolves instantly from Fast Frame's bundled imports."
                        : "esm.sh fallback — loaded from CDN on first use (~200–800ms cold)."
                    }
                  >
                    {lib.tier === "tier-1" ? "T1" : "T2"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          {inspection.libraries.some((l) => l.tier === "tier-2") && (
            <p className="text-[10px] text-muted-foreground/70 pt-1">
              <strong>T2</strong> libraries load from esm.sh on first use.
              Pre-stamp in <code className="font-mono">fast-sandbox/page.tsx</code>{" "}
              to make them <strong>T1</strong>.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
