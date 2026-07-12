"use client";

/**
 * ComponentInventory — what's actually on the current screen.
 *
 * The body half of the old "Stage B inspector". Today it lives inside
 * the "Component inventory" accordion on the screen-info panel
 * (`stage-b-screen-info.tsx`); previously it WAS the Stage B view but
 * the data-engineering tone was at odds with what the right panel
 * should feel like by default, so the metadata view took over the
 * top slot and this got tucked under a collapsed accordion.
 *
 * What it surfaces:
 *
 *   - Grade Components — every `<X>` JSX tag that resolves to a
 *     known DS component (matched against ALLOWED_COMPONENTS), with
 *     per-component use counts + a link to the docs page.
 *   - React libraries — every external `import` specifier (Tier 1
 *     pre-stamped + Tier 2 esm.sh fallback), with a tier badge so
 *     consumers know which side of the resolver they're on.
 *
 * Icons section deliberately dropped — the lucide breakdown was
 * noise at this surface; if we ever want it back it should be its
 * own purposeful affordance, not a wall of badges in the default
 * panel.
 *
 * Parsing strategy: TypeScript compiler API for the JSX walk, plus
 * a regex for import specifiers (lifted from fast-sandbox's
 * preResolveUnknownImports). Both are pure read-only — the
 * inventory never mutates source.
 */

import * as React from "react";
import Link from "next/link";
import * as ts from "typescript";
import { Boxes, Package, ExternalLink } from "lucide-react";
import {
  getActiveRegistry,
  subscribeActiveRegistry,
} from "@/lib/active-registry";
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

let ALLOWED_COMPONENT_LOWER = new Set(
  getActiveRegistry().components.allowed.map((c) => c.toLowerCase()),
);
// Per-project registries flip the override at runtime — recompute.
subscribeActiveRegistry(() => {
  ALLOWED_COMPONENT_LOWER = new Set(
    getActiveRegistry().components.allowed.map((c) => c.toLowerCase()),
  );
});

/**
 * Subcomponent → root map built from the contract registry. Lets the
 * inspector roll `<AppShellNav>` + `<AppShellMain>` (separate named
 * exports) under "AppShell" the same way the dot-notation walker
 * already rolls `<Carousel.Slide>` under "Carousel".
 */
const SUBCOMPONENT_TO_ROOT = (() => {
  const map = new Map<string, string>();
  for (const [rootName, contract] of Object.entries(COMPONENT_CONTRACTS)) {
    for (const sub of contract.subcomponents ?? []) {
      if (sub.includes(".")) continue;
      map.set(sub, rootName);
    }
  }
  return map;
})();

interface SubcomponentBreakdown {
  label: string;
  count: number;
}

interface ComponentUsage {
  name: string;
  slug: string;
  count: number;
  isGrade: boolean;
  parts: SubcomponentBreakdown[];
}

interface LibraryUsage {
  specifier: string;
  tier: "tier-1" | "tier-2";
  npmLink: string;
}

interface Inspection {
  components: ComponentUsage[];
  libraries: LibraryUsage[];
  totalComponents: number;
  totalGrade: number;
}

const EMPTY: Inspection = {
  components: [],
  libraries: [],
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
    if (name[0] !== name[0].toUpperCase()) return null;
    return name;
  }
  if (ts.isPropertyAccessExpression(tagName)) {
    let expr: ts.LeftHandSideExpression = tagName;
    while (ts.isPropertyAccessExpression(expr)) {
      expr = expr.expression as ts.LeftHandSideExpression;
    }
    if (ts.isIdentifier(expr)) return expr.text;
  }
  return null;
}

const IMPORT_SPEC_RE =
  /(?:import\s+(?:\*\s+as\s+\w+|\{[^}]*\}|\w+(?:\s*,\s*\{[^}]*\})?)?\s+from\s+|import\s*\(\s*|require\s*\(\s*)['"]([^'"]+)['"]/g;

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
      bindingToModule.set(clause.name.text, spec);
    }
    const bindings = clause.namedBindings;
    if (!bindings) return;
    if (ts.isNamespaceImport(bindings)) {
      bindingToModule.set(bindings.name.text, spec);
    } else if (ts.isNamedImports(bindings)) {
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

  // Walk the JSX. lucide-react imports are filtered out at the
  // tag-walk stage so the inventory doesn't have to track them.
  const rawCounts = new Map<string, number>();

  const visit = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = node.tagName;
      const rootName = extractRootComponentName(tagName);
      if (rootName) {
        if (ts.isIdentifier(tagName)) {
          const tagText = tagName.text;
          const source = bindingToModule.get(tagText);
          if (source === "lucide-react") {
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
      const acc = ensure(root);
      const stripped =
        name.startsWith(root) && name.length > root.length
          ? name.slice(root.length)
          : name;
      acc.partCounts.set(stripped, (acc.partCounts.get(stripped) ?? 0) + count);
    } else {
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

  const librariesSeen = new Set<string>();
  for (const spec of modules) {
    if (/^\.\.?\//.test(spec)) continue;
    if (spec === "@/lib/utils") continue;
    if (spec === "react" || spec === "react/jsx-runtime" || spec === "react/jsx-dev-runtime") continue;
    if (spec === "@gradeui/ui" || spec.startsWith("@gradeui/ui/")) continue;
    librariesSeen.add(spec);
  }
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

  const gradeComponents = components.filter((c) => c.isGrade);
  return {
    components,
    libraries,
    totalComponents: components.reduce((n, c) => n + c.count, 0),
    totalGrade: gradeComponents.reduce((n, c) => n + c.count, 0),
  };
}

export interface ComponentInventoryProps {
  appSource: string | null;
  className?: string;
}

/**
 * Body-only inventory view — no panel chrome. Use inside an
 * accordion / disclosure where the surrounding surface already
 * provides the container.
 */
export function ComponentInventory({
  appSource,
  className,
}: ComponentInventoryProps) {
  const inspection = React.useMemo<Inspection>(
    () => (appSource ? inspect(appSource) : EMPTY),
    [appSource],
  );

  const gradeComponents = inspection.components.filter((c) => c.isGrade);
  const otherComponents = inspection.components.filter((c) => !c.isGrade);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Grade Components section */}
      <section className="space-y-2">
        <header className="flex items-center gap-1.5">
          <Boxes className="h-3.5 w-3.5 text-muted-foreground" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Grade components
          </h3>
          {gradeComponents.length > 0 && (
            <span className="text-[10px] text-muted-foreground/70">
              {gradeComponents.length}
            </span>
          )}
        </header>
        {inspection.components.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No DS components in the current source.
          </p>
        ) : (
          <ul className="space-y-1">
            {gradeComponents.map((c) => (
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
                          x{c.count}
                        </Badge>
                      )}
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  {c.parts.length > 0 && (
                    <div className="text-[10px] text-muted-foreground/80 mt-0.5 pl-0.5">
                      {c.parts
                        .map((p) =>
                          p.count > 1 ? `${p.label} x${p.count}` : p.label,
                        )
                        .join(" · ")}
                    </div>
                  )}
                </Link>
              </li>
            ))}
            {otherComponents.length > 0 && (
              <li className="pt-2 mt-2 border-t border-border">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70 mb-1 px-2">
                  Other components
                </p>
                {otherComponents.map((c) => (
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
                        x{c.count}
                      </Badge>
                    )}
                  </div>
                ))}
              </li>
            )}
          </ul>
        )}
      </section>

      {/* React Libraries section */}
      <section className="space-y-2">
        <header className="flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5 text-muted-foreground" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            React libraries
          </h3>
          {inspection.libraries.length > 0 && (
            <span className="text-[10px] text-muted-foreground/70">
              {inspection.libraries.length}
            </span>
          )}
        </header>
        {inspection.libraries.length === 0 ? (
          <p className="text-xs text-muted-foreground">
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
                      ? "Pre-stamped, resolves instantly from Fast Frame's bundled imports."
                      : "esm.sh fallback, loaded from CDN on first use."
                  }
                >
                  {lib.tier === "tier-1" ? "T1" : "T2"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
