#!/usr/bin/env node
/**
 * generate-brightlocal-contracts.mjs — BrightLocal registry contract specs,
 * extracted from the SHIPPED TYPE DECLARATIONS.
 *
 * Reads `@brightlocal/ui-components`'s `dist/index.d.ts` with the
 * TypeScript compiler API and asks the type checker for each export's
 * fully-RESOLVED prop list. Emits one contract per EXPORT (so
 * subcomponents get their own props, not a family bag) to
 * src/registry/brightlocal/contracts.generated.ts.
 *
 *   cd packages/studio && node scripts/generate-brightlocal-contracts.mjs
 *
 * ─── Why this was rewritten (Aug 2026) ───────────────────────────────
 *
 * v1 generated contracts from the committed sidecars
 * (registries/brightlocal/sidecars/*.md), which are themselves a
 * transform of BrightLocal's `component-meta.json` + hosted MCP. Two
 * structural consequences, both of which cost a day of prototyping:
 *
 *   1. component-meta documents only the props the DS *adds*. Radix and
 *      native passthrough (`checked` / `onCheckedChange` on Checkbox,
 *      `onClick` on Button, `value` on Input) never appear, so
 *      `save_screen` rejected props that genuinely exist. Authors
 *      concluded "the DS can't do this" and hand-rolled working
 *      components.
 *   2. Sidecars fold a family's whole surface onto the ROOT and mark a
 *      subcomponent's props with a `SubName: …` description prefix.
 *      Families that don't use the prefix (Tabs) produced EMPTY
 *      subcomponent contracts — `<TabsTrigger value=…>` failed with
 *      "Valid props: ." even though `value` is REQUIRED in source.
 *
 * Neither was a TypeScript-extraction rule misfiring: no TypeScript was
 * ever read. The checker fixes both classes at once — it resolves
 * `extends`, `Omit<>`, `ComponentProps<typeof X>` and `VariantProps<>`
 * for free, and per-export emission removes the prefix convention.
 *
 * ─── What is and isn't emitted ───────────────────────────────────────
 *
 * A resolved props type carries ~290 properties for anything spreading
 * `React.ComponentProps<"button">`. Emitting all of them would be a
 * 200k-line file restating @types/react. Instead:
 *
 *   - Props whose declarations ALL live in @types/react are DROPPED, and
 *     the contract declares its rendered `element` instead. The
 *     validator already accepts an element's native attrs + `on*`
 *     handlers on any contract carrying `element` — that is the
 *     mechanism this generator was missing.
 *   - Props declared by BrightLocal, Radix, TanStack, cva &c. are KEPT
 *     with their real kind, requiredness, JSDoc description and
 *     `@default`. This is the half that fixes `checked`, `asChild`,
 *     `table`, `value`.
 *
 * Requiredness mirrors the declaration (`dataHook` really is required;
 * so is `TabsTrigger.value`).
 *
 * Re-run on every `@brightlocal/ui-components` version bump.
 * `scripts/check-registry-contracts.mjs` fails CI when the committed
 * output no longer matches a fresh run.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = join(
  __dirname,
  "..",
  "src",
  "registry",
  "brightlocal",
  "contracts.generated.ts",
);
const ALLOWLIST_FILE = join(
  __dirname,
  "..",
  "src",
  "registry",
  "brightlocal",
  "allowlist.generated.ts",
);
const SIDECAR_DIR = join(
  __dirname,
  "..",
  "registries",
  "brightlocal",
  "sidecars",
);

/** The package is a dependency of apps/docs, not of packages/studio —
 *  resolve from there so this script works from a clean install. */
const require_ = createRequire(
  join(__dirname, "..", "..", "..", "apps", "docs", "package.json"),
);

/** Untyped/opaque names that are wiring, not design knobs — matches v1's
 *  taxonomy so the settings panel keeps hiding them. */
const PLUMBING_NAMES = new Set([
  "dataHook",
  "ariaLabel",
  "value",
  "defaultValue",
  "name",
  "id",
  "type",
  "table",
  "row",
  "column",
  "form",
  "key",
  "ref",
]);

/** ref element type → JSX tag the validator knows native attrs for. */
const REF_ELEMENTS = {
  HTMLButtonElement: "button",
  HTMLInputElement: "input",
  HTMLTextAreaElement: "textarea",
  HTMLSelectElement: "select",
  HTMLLabelElement: "label",
  HTMLFormElement: "form",
  HTMLFieldSetElement: "fieldset",
  HTMLAnchorElement: "a",
  HTMLImageElement: "img",
  HTMLTableElement: "table",
  HTMLTableRowElement: "table",
  HTMLTableCellElement: "table",
  HTMLTableSectionElement: "table",
  HTMLTableCaptionElement: "table",
  HTMLParagraphElement: "p",
  HTMLSpanElement: "span",
  HTMLHeadingElement: "h2",
  HTMLUListElement: "ul",
  HTMLOListElement: "ol",
  HTMLLIElement: "li",
  HTMLHRElement: "hr",
  HTMLPreElement: "pre",
  HTMLDialogElement: "dialog",
  HTMLDivElement: "div",
  HTMLElement: "div",
  SVGSVGElement: "svg",
};

/** How many @types/react-only props mark "this component spreads a full
 *  native attribute surface". Components with a hand-written props
 *  interface (DataTablePagination: 9 props) score 0 and get NO `element`,
 *  so they stay strict. */
const NATIVE_SURFACE_THRESHOLD = 30;

function isReactTypesFile(fileName) {
  return (
    fileName.includes(`${sep}@types${sep}react${sep}`) ||
    fileName.includes(`${sep}@types${sep}react-dom${sep}`) ||
    fileName.includes("/@types/react/") ||
    fileName.includes("/@types/react-dom/")
  );
}

/** True when EVERY declaration of this prop comes from @types/react — a
 *  native HTML attribute the `element` gate covers. A prop the DS (or
 *  Radix, or TanStack) declares anywhere survives. */
function isNativeOnly(sym) {
  const decls = sym.declarations ?? [];
  if (decls.length === 0) return false;
  return decls.every((d) => isReactTypesFile(d.getSourceFile().fileName));
}

function jsDocText(sym, checker) {
  const s = ts.displayPartsToString(sym.getDocumentationComment(checker)).trim();
  return s ? s.replace(/\s+/g, " ") : undefined;
}

function jsDocDefault(sym) {
  const tag = sym.getJsDocTags().find((t) => t.name === "default");
  if (!tag) return undefined;
  const raw = ts.displayPartsToString(tag.text ?? []).trim();
  if (!raw) return undefined;
  const unquoted = raw.replace(/^["'`]|["'`]$/g, "");
  if (unquoted === "true") return true;
  if (unquoted === "false") return false;
  if (unquoted !== "" && !Number.isNaN(Number(unquoted))) return Number(unquoted);
  return unquoted;
}

/** Strip `undefined` / `null` from a union so `"sm" | "lg" | undefined`
 *  reads as the enum it is. */
function meaningfulConstituents(type) {
  if (!type.isUnion()) return [type];
  return type.types.filter(
    (t) =>
      !(t.flags & ts.TypeFlags.Undefined) && !(t.flags & ts.TypeFlags.Null),
  );
}

/** Resolved prop type → RegistryPropSpec {kind, values, design}. */
function classify(name, type, checker) {
  const parts = meaningfulConstituents(type);

  // String-literal union → enum (this is how cva variants surface once
  // VariantProps<typeof xVariants> is resolved).
  if (parts.length > 1 && parts.every((t) => t.isStringLiteral())) {
    return {
      kind: "enum",
      values: parts.map((t) => t.value),
      design: "knob",
    };
  }
  if (parts.length === 1 && parts[0].isStringLiteral()) {
    return { kind: "enum", values: [parts[0].value], design: "knob" };
  }

  const isBool = parts.every(
    (t) =>
      t.flags & (ts.TypeFlags.Boolean | ts.TypeFlags.BooleanLiteral),
  );
  if (parts.length && isBool) return { kind: "boolean", design: "knob" };

  const isNumber = parts.every(
    (t) => t.flags & (ts.TypeFlags.Number | ts.TypeFlags.NumberLiteral),
  );
  if (parts.length && isNumber) return { kind: "number", design: "knob" };

  const isFn = parts.some((t) => t.getCallSignatures().length > 0);
  if (isFn || /^on[A-Z]/.test(name)) {
    return { kind: "unknown", design: "event" };
  }

  const asText = checker.typeToString(type);
  if (/\bReactNode\b|\bReactElement\b|\bJSX\.Element\b/.test(asText)) {
    return { kind: "unknown", design: "content" };
  }

  const isString = parts.every(
    (t) => t.flags & (ts.TypeFlags.String | ts.TypeFlags.StringLiteral),
  );
  if (parts.length && isString) {
    return {
      kind: "string",
      design: PLUMBING_NAMES.has(name) ? "plumbing" : "knob",
    };
  }

  // Everything else — opaque objects (TanStack `Table<TData>`), mixed
  // unions (Radix `CheckedState` = boolean | "indeterminate";
  // ChartContainer's `number | ${number}%`), generics. `unknown` accepts
  // any literal: narrowing these to `string` would reject valid JSX
  // (`<Checkbox checked />`, `<ChartContainer width={190} />`), which is
  // the exact failure class this rewrite exists to remove.
  return { kind: "unknown", design: "plumbing" };
}

/** Is this export a React component, and what is its props type?
 *
 *  `{ isComponent: false }` for hooks, cva class functions, types and
 *  constants. `{ isComponent: true, propsType: null }` for a component
 *  that takes NO props — `declare function Sonner(): JSX.Element`. That
 *  distinction matters: props-less components still belong on the
 *  allowlist (the model may emit `<Sonner />`) even though they can have
 *  no useful contract. Collapsing the two dropped Sonner entirely. */
function componentExportInfo(sym, checker) {
  const notAComponent = { isComponent: false, propsType: null };
  const decl = sym.valueDeclaration ?? sym.declarations?.[0];
  if (!decl) return notAComponent;
  const type = checker.getTypeOfSymbolAtLocation(sym, decl);
  const sigs = type.getCallSignatures();
  if (sigs.length === 0) return notAComponent;

  // Component-shaped ⇔ returns something React renders. `ButtonVariants`
  // (cva) is PascalCase and takes a props object too, but returns string.
  const returns = checker.typeToString(sigs[0].getReturnType());
  if (!/ReactNode|ReactElement|JSX\.Element|Element\b|null/.test(returns)) {
    return notAComponent;
  }

  const params = sigs[0].getParameters();
  if (params.length === 0) return { isComponent: true, propsType: null };
  const pdecl = params[0].valueDeclaration ?? params[0].declarations?.[0];
  return {
    isComponent: true,
    propsType: checker.getTypeOfSymbolAtLocation(params[0], pdecl ?? decl),
  };
}

function elementFor(propsType, nativeCount, checker) {
  if (nativeCount < NATIVE_SURFACE_THRESHOLD) return undefined;
  const refSym = propsType.getProperty("ref");
  if (!refSym) return "div";
  const decl = refSym.valueDeclaration ?? refSym.declarations?.[0];
  if (!decl) return "div";
  const text = checker.typeToString(
    checker.getTypeOfSymbolAtLocation(refSym, decl),
  );
  const m = text.match(/\b((?:HTML|SVG)\w*Element)\b/);
  return (m && REF_ELEMENTS[m[1]]) || "div";
}

function buildSpec(name, propsType, checker) {
  const props = {};
  const variantDefaults = {};
  let nativeCount = 0;

  const symbols = propsType.getProperties();
  for (const p of symbols) {
    if (isNativeOnly(p)) {
      nativeCount++;
      continue;
    }
    const pname = p.getName();
    // `key` / `ref` / `className` / `style` / aria-* / data-* are
    // universal React passthrough — the validator never checks them.
    if (["key", "ref", "className", "style", "children"].includes(pname)) {
      continue;
    }
    const decl = p.valueDeclaration ?? p.declarations?.[0];
    if (!decl) continue;

    const type = checker.getTypeOfSymbolAtLocation(p, decl);
    const { kind, values, design } = classify(pname, type, checker);
    const optional = Boolean(p.flags & ts.SymbolFlags.Optional);
    const description = jsDocText(p, checker);
    const dflt = jsDocDefault(p);

    props[pname] = {
      kind,
      ...(values ? { values } : {}),
      design,
      ...(optional ? { optional: true } : {}),
      ...(dflt !== undefined ? { default: dflt } : {}),
      ...(description ? { description } : {}),
    };
    if (kind === "enum" && typeof dflt === "string") variantDefaults[pname] = dflt;
  }

  const element = elementFor(propsType, nativeCount, checker);

  return {
    spec: {
      name,
      props,
      ...(Object.keys(variantDefaults).length ? { variantDefaults } : {}),
      ...(element ? { element } : {}),
    },
    nativeCount,
  };
}

// ─── Layer 2: registry-local components (sidecar-only) ────────────────
//
// Not everything in the BrightLocal registry comes from the npm package.
// `registries/brightlocal/lib/*.jsx` ships shared modules screens import
// (AppLayoutShell, PageHeader, StatCard, ProposalSidebar, ScoreDonut, …)
// and those have sidecars but no `.d.ts`. The d.ts pass can't see them, so
// a second pass reads their frontmatter — the v1 parser, kept for exactly
// this set. Components the BARREL exports never reach this layer; the
// checker's answer always wins.
//
// Sidecar entries with NO parseable props are DROPPED rather than emitted
// as empty stubs. An empty contract is not "unconstrained", it is "no prop
// is legal" — that is what produced `Valid props: .` on every subcomponent.
// Omitting the name instead lets the validator's skipUnknownComponents
// leave the tag unchecked, which is the correct answer when we have no data.

/** Untyped prop names we can safely call boolean presence knobs. */
const KNOWN_BOOLEANS = new Set([
  "disabled", "loading", "asChild", "iconOnly", "fullWidth", "open",
  "defaultOpen", "modal", "checked", "defaultChecked", "error", "withHandle",
  "unmountOnExit", "closable", "required", "readOnly", "flush", "sticky",
  "stickyHeader", "interactive", "once", "showLocationPin",
]);

function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = m[1];
  const out = { props: [] };
  const name = fm.match(/^name:\s*(.+)$/m);
  if (name) out.name = name[1].trim();
  const variants = fm.match(/^variants:\s*\[([^\]]*)\]/m);
  if (variants)
    out.variants = variants[1].split(",").map((x) => x.trim()).filter(Boolean);
  const sizes = fm.match(/^sizes:\s*\[([^\]]*)\]/m);
  if (sizes)
    out.sizes = sizes[1].split(",").map((x) => x.trim()).filter(Boolean);
  const propsBlock = fm.match(/^props:\n((?:  - .*\n?)*)/m);
  if (propsBlock) {
    out.props = propsBlock[1]
      .split("\n")
      .map((l) => l.replace(/^  - /, "").trim())
      .filter(Boolean);
  }
  return out;
}

/** `name[?][: type][ (a | b)] — desc` → [name, RegistryPropSpec] | null. */
function parsePropLine(line) {
  const [sig, ...descParts] = line.split("—").map((x) => x.trim());
  let description = descParts.join(" — ").trim() || undefined;
  if (description && /^TODO\(review\)/.test(description)) description = undefined;

  const m = sig.match(
    /^([A-Za-z][A-Za-z0-9]*)(\?)?(?::\s*([a-z]+))?(?:\s*\(([^)]+)\))?$/,
  );
  if (!m) return null;
  const [, name, opt, type, enumBody] = m;

  let kind;
  let values;
  let design = "knob";
  if (enumBody && enumBody.includes("|")) {
    kind = "enum";
    values = enumBody.split("|").map((x) => x.trim()).filter(Boolean);
  } else if (type === "boolean") kind = "boolean";
  else if (type === "number") kind = "number";
  else if (type === "string") kind = "string";
  else if (KNOWN_BOOLEANS.has(name)) kind = "boolean";
  else if (/^on[A-Z]/.test(name)) {
    kind = "unknown";
    design = "event";
  } else {
    // Untyped and unrecognised: `unknown`, not `string`. These are
    // overwhelmingly object/node props (menuGroups, breadcrumbs, media)
    // and a string schema would reject their real values.
    kind = "unknown";
    design = "plumbing";
  }
  if (design === "knob" && PLUMBING_NAMES.has(name)) design = "plumbing";

  return [
    name,
    {
      kind,
      ...(values ? { values } : {}),
      design,
      ...(opt ? { optional: true } : {}),
      ...(description ? { description } : {}),
    },
  ];
}

/** Sidecar-derived specs for names layer 1 produced no contract for.
 *  Gated on ALREADY-CONTRACTED, not on barrel-exported: `Sonner` is
 *  exported but its declaration isn't component-shaped to the checker, so
 *  a barrel gate would silently drop a component that has a good sidecar. */
function sidecarSpecs(contracted) {
  const out = {};
  let files;
  try {
    files = readdirSync(SIDECAR_DIR).filter((f) => f.endsWith(".md")).sort();
  } catch {
    return out;
  }
  for (const f of files) {
    const fm = parseFrontmatter(readFileSync(join(SIDECAR_DIR, f), "utf-8"));
    if (!fm?.name || contracted.has(fm.name)) continue;

    const props = {};
    const variantDefaults = {};
    if (fm.variants?.length) {
      props.variant = {
        kind: "enum",
        values: fm.variants,
        design: "knob",
        optional: true,
        default: fm.variants[0],
      };
      variantDefaults.variant = fm.variants[0];
    }
    if (fm.sizes?.length) {
      props.size = {
        kind: "enum",
        values: fm.sizes,
        design: "knob",
        optional: true,
        default: fm.sizes[0],
      };
      variantDefaults.size = fm.sizes[0];
    }
    for (const line of fm.props) {
      const parsed = parsePropLine(line);
      if (!parsed || props[parsed[0]]) continue;
      props[parsed[0]] = parsed[1];
    }
    // No props parsed → no contract. See the note above.
    if (Object.keys(props).length === 0) continue;
    out[fm.name] = {
      name: fm.name,
      props,
      ...(Object.keys(variantDefaults).length ? { variantDefaults } : {}),
    };
  }
  return out;
}

/** `dist/tabs.d.ts` → "tabs"; `dist/blocks/data-table.d.ts` →
 *  "data-table" (the package publishes blocks at the top level);
 *  `dist/lib/utils.d.ts` → "lib/utils" (published nested). Mirrors the
 *  subpaths in the package's own `exports` map. */
function subpathFor(fileName, distDir) {
  if (!fileName.startsWith(distDir)) return null;
  const rel = fileName.slice(distDir.length + 1).replace(/\.d\.ts$/, "");
  if (rel.startsWith("lib/") || rel.startsWith("hooks/")) return rel;
  const base = rel.split("/").pop();
  return base;
}

/** Build the contract map + the exact file text, without writing. The CI
 *  check (scripts/check-registry-contracts.mjs) calls this and diffs the
 *  result against the committed file. */
export function buildContracts() {
  const pkgDir = dirname(
    require_.resolve("@brightlocal/ui-components/package.json"),
  );
  const version = require_("@brightlocal/ui-components/package.json").version;
  const entry = join(pkgDir, "dist", "index.d.ts");

  const program = ts.createProgram([entry], {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    skipLibCheck: true,
    jsx: ts.JsxEmit.ReactJSX,
    types: [],
  });
  const checker = program.getTypeChecker();
  const sf = program.getSourceFile(entry);
  if (!sf) throw new Error(`could not load ${entry}`);

  const moduleSym = checker.getSymbolAtLocation(sf);
  if (!moduleSym) throw new Error("barrel has no module symbol");

  const distDir = join(pkgDir, "dist");
  const specs = {};
  const unconstrained = [];
  /** Barrel re-exports of third-party components (Recharts) — allowlisted,
   *  deliberately uncontracted. */
  const reExported = [];
  /** Component-shaped barrel exports — what the model MAY EMIT. Wider
   *  than the contract set: DataTableToolbarLeft is a real component that
   *  simply has no props of its own. */
  const componentNames = [];
  /** Export → per-file subpath, for `registry.package.importMap`. */
  const importMap = {};
  let skipped = 0;
  for (const exported of checker.getExportsOfModule(moduleSym)) {
    const name = exported.getName();
    // Components are PascalCase exports; hooks (useDataTable), helpers
    // (cn) and types are not contract material.
    if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) continue;
    const sym =
      exported.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(exported)
        : exported;
    const { isComponent, propsType } = componentExportInfo(sym, checker);
    if (!isComponent) {
      skipped++;
      continue;
    }
    componentNames.push(name);
    const declFile = (
      sym.valueDeclaration ?? sym.declarations?.[0]
    )?.getSourceFile?.().fileName;
    const sub = declFile ? subpathFor(declFile, distDir) : null;
    if (sub) importMap[name] = `@brightlocal/ui-components/${sub}`;

    // Props-less component: allowlisted above, but there is nothing to
    // contract. Falls through to the same omission rule as an empty spec.
    if (!propsType) {
      unconstrained.push(name);
      continue;
    }

    // RE-EXPORTS ARE ALLOWLISTED BUT NOT CONTRACTED. The barrel re-exports
    // Recharts wholesale (Pie, Cell, XAxis, …). Those resolve to ~190-prop
    // types that are mostly DOM/SVG passthrough, and they render SVG — so a
    // generated contract lands `element: "div"` and then rejects real SVG
    // attributes (`<Pie stroke="…">`, which Recharts genuinely accepts).
    // A wrong contract is worse than none: with no entry,
    // skipUnknownComponents leaves the tag unchecked, which is the honest
    // answer for a third-party surface we do not own. Same principle as the
    // no-props/no-element omission above.
    if (declFile && !declFile.startsWith(pkgDir)) {
      reExported.push(name);
      continue;
    }
    const spec = buildSpec(name, propsType, checker).spec;
    // A contract with NO props and NO element cannot express anything
    // except "every prop is invalid" — that is precisely the
    // `Valid props: .` failure this rewrite exists to kill. Omitting the
    // name lets the validator's skipUnknownComponents leave the tag
    // unchecked, which is the honest answer when we have no data.
    if (Object.keys(spec.props).length === 0 && !spec.element) {
      unconstrained.push(name);
      continue;
    }
    specs[name] = spec;
  }
  const fromDts = Object.keys(specs).length;

  // Layer 2 — registry-local components with a sidecar but no .d.ts.
  const local = sidecarSpecs(new Set(Object.keys(specs)));
  for (const [name, spec] of Object.entries(local)) {
    if (specs[name]) continue;
    specs[name] = spec;
  }

  // `cn` is the one non-component the import map carries — screens use it
  // for className composition and exporters must rewrite it too.
  const cnSym = checker
    .getExportsOfModule(moduleSym)
    .find((e) => e.getName() === "cn");
  if (cnSym) {
    const d = (cnSym.flags & ts.SymbolFlags.Alias
      ? checker.getAliasedSymbol(cnSym)
      : cnSym
    ).declarations?.[0];
    const sub = d ? subpathFor(d.getSourceFile().fileName, distDir) : null;
    if (sub) importMap.cn = `@brightlocal/ui-components/${sub}`;
  }

  const names = Object.keys(specs).sort();
  const ordered = {};
  for (const n of names) ordered[n] = specs[n];

  const out = `// AUTO-GENERATED by scripts/generate-brightlocal-contracts.mjs from
// @brightlocal/ui-components@${version}'s dist/index.d.ts — do not
// hand-edit; re-run the script after a version bump (CI enforces this via
// scripts/check-registry-contracts.mjs). Props come from the TypeScript
// checker's RESOLVED property list, so \`extends\`, \`Omit<>\`,
// \`ComponentProps<>\` and \`VariantProps<>\` are all followed. Props that
// exist only in @types/react are omitted in favour of the contract's
// \`element\`, which the validator uses to accept that tag's native attrs.
// Serialisable contract specs (no zod — registry rule 1); consumers
// convert them into real ComponentContracts at the edge (the MCP server's
// registry-contracts.ts, apps/docs/lib/registry-contracts.ts).
import type { RegistryContractSpec } from "../types";

export const BRIGHTLOCAL_CONTRACTS: Readonly<
  Record<string, RegistryContractSpec>
> = ${JSON.stringify(ordered, null, 2)} as const;
`;

  const allowed = [...componentNames].sort();
  const mapKeys = Object.keys(importMap).sort();
  const allowlistText = `/* eslint-disable */
// THIS FILE IS GENERATED — do not edit by hand.
// Source: @brightlocal/ui-components@${version} — the type checker's view of
// dist/index.d.ts (the REAL barrel), not component-meta.json. The meta file
// lists exports that do not exist in the published dist (H1/P/Muted →
// TypographyH1/…P/…Muted, InputPassword → InputPasswordRoot, etc.) — grounding
// the allowlist in the meta produced "Element type is invalid" preview crashes.
// Only COMPONENT-shaped exports are listed: type aliases (SidebarSide,
// SidebarVariant) are erased at runtime and were never emittable as JSX.
// Regenerate: pnpm -F @gradeui/studio generate:brightlocal-contracts

/** Every real component export of the published barrel — what the model may emit. */
export const BRIGHTLOCAL_ALLOWED_COMPONENTS = ${JSON.stringify(allowed, null, 2)} as const;

/** Export → per-file subpath (from each export's declaring module).
 * Consumed by exporters only (registry.package.importMap): Studio keeps
 * the barrel internally. */
export const BRIGHTLOCAL_IMPORT_MAP: Readonly<Record<string, string>> = Object.freeze({
${mapKeys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(importMap[k])},`).join("\n")}
});
`;

  return {
    specs: ordered,
    text: out,
    allowlistText,
    allowed,
    stats: {
      version,
      total: names.length,
      fromDts,
      fromSidecars: Object.keys(local).length,
      localNames: Object.keys(local),
      skipped,
      unconstrained,
      reExported,
    },
  };
}

export const OUT_FILE_PATH = OUT_FILE;
export const ALLOWLIST_FILE_PATH = ALLOWLIST_FILE;

function main() {
  const { text, allowlistText, allowed, stats } = buildContracts();
  writeFileSync(OUT_FILE, text);
  writeFileSync(ALLOWLIST_FILE, allowlistText);
  console.log(
    `wrote ${allowed.length} allowlisted components → src/registry/brightlocal/allowlist.generated.ts`,
  );
  console.log(
    `wrote ${stats.total} contract specs → src/registry/brightlocal/contracts.generated.ts`,
  );
  console.log(
    `  ${stats.fromDts} from @brightlocal/ui-components@${stats.version} dist/index.d.ts (${stats.skipped} non-component exports skipped)`,
  );
  console.log(
    `  ${stats.fromSidecars} registry-local, from registries/brightlocal/sidecars/*.md`,
  );
  if (stats.reExported.length) {
    console.log(
      `  ${stats.reExported.length} re-exported third-party components allowlisted but NOT contracted (SVG/DOM passthrough we do not own): ${stats.reExported.slice(0, 8).join(", ")}${stats.reExported.length > 8 ? ", …" : ""}`,
    );
  }
  if (stats.unconstrained.length) {
    console.log(
      `  ${stats.unconstrained.length} omitted (no own props and no host element — a contract there could only reject): ${stats.unconstrained.join(", ")}`,
    );
  }
}

// Only write when RUN, not when imported by the CI check.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
