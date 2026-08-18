/**
 * Component reference loader + formatter.
 *
 * Consumes the inlined `SIDECARS` map (generated from `sidecars/*.md` by
 * `scripts/generate-sidecars.mjs`) and turns it into:
 *
 *   • `ComponentRef[]` — parsed frontmatter, for retrieval / rendering
 *   • a formatted text block for the system prompt
 *   • `ComponentManifest[]` — structured props for the settings panel
 *
 * No runtime dependencies: no `fs`, no network, no React. The playbook's
 * hard rule. Everything is string-in → string-or-object-out, which is also
 * what makes this package serveable from @gradeui/mcp over a pure JSON-RPC
 * transport.
 *
 * Why a bespoke frontmatter parser:
 *   gray-matter + a YAML lib would add ~80KB to the server bundle just to
 *   parse a handful of tightly-controlled keys. We OWN the MD schema — it
 *   only needs to handle `key: value`, `key: [a, b, c]`, and block lists
 *   (`key:\n  - item`). ~100 lines, zero deps.
 */

import type {
  ComponentRef,
  PropManifest,
  ComponentManifest,
} from "./types";
import { GRADE_REGISTRY } from "../../registry/gradeui";
import type {
  DesignSystemRegistry,
  RegistryContractSpec,
  RegistryPropSpec,
} from "../../registry/types";

// ─── Frontmatter parsing ──────────────────────────────────────────────────

/**
 * Dead-simple frontmatter parser tuned to our schema. Accepts:
 *   key: string value
 *   key: [a, b, c]
 *   key:
 *     - item
 *     - item
 *   key: |
 *     multi-line
 *     literal text (indentation stripped to common prefix)
 *
 * Ignores everything past the second `---`. Returns an empty record if the
 * file has no frontmatter fence.
 */
function parseFrontmatter(raw: string): Record<string, string | string[]> {
  if (!raw.startsWith("---")) return {};
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return {};
  const block = raw.slice(3, end).replace(/^\r?\n/, "");
  const lines = block.split(/\r?\n/);

  const out: Record<string, string | string[]> = {};
  let currentKey: string | null = null;
  let collectingList: string[] | null = null;
  let collectingBlock: string[] | null = null;
  let blockIndent = 0;

  const closeCollectors = () => {
    if (collectingList && currentKey) {
      out[currentKey] = collectingList;
    } else if (collectingBlock && currentKey) {
      // Strip the common leading indent (determined on first non-empty line)
      // and trim a single trailing newline.
      let text = collectingBlock.join("\n");
      if (text.endsWith("\n")) text = text.slice(0, -1);
      out[currentKey] = text;
    }
    collectingList = null;
    collectingBlock = null;
    currentKey = null;
  };

  for (const line of lines) {
    // Block literal collection — any line with at least `blockIndent` spaces
    // (or a blank line) is part of the block. Dedent closes it. The first
    // non-empty body line sets the indent — standard YAML block-scalar
    // behaviour (the "indentation indicator" defaults to the first line).
    if (collectingBlock !== null) {
      if (line.trim() === "") {
        collectingBlock.push("");
        continue;
      }
      const leading = line.match(/^ */)![0].length;
      if (blockIndent === -1) {
        blockIndent = leading;
      }
      if (leading >= blockIndent) {
        collectingBlock.push(line.slice(blockIndent));
        continue;
      }
      // Dedent — block ends, fall through to re-parse this line as a new key.
      closeCollectors();
    }

    // Continuation of a block list under a previously opened key.
    if (collectingList && /^\s*-\s+/.test(line)) {
      collectingList.push(line.replace(/^\s*-\s+/, "").trim());
      continue;
    }
    // Any non-list line closes the previous block list (if any).
    if (collectingList && currentKey) {
      closeCollectors();
    }

    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (!m) continue;
    const [, key, rest] = m;

    // Block literal: `key: |` — collect subsequent indented lines as a string.
    // `blockIndent = -1` signals "detect from first non-empty body line".
    if (rest.trim() === "|") {
      currentKey = key;
      collectingBlock = [];
      blockIndent = -1;
      continue;
    }

    // Inline flow array: key: [a, b, c]
    if (rest.startsWith("[") && rest.endsWith("]")) {
      const inner = rest.slice(1, -1).trim();
      out[key] = inner
        ? inner.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      continue;
    }

    // Empty value → a block list follows on subsequent lines.
    if (rest.trim() === "") {
      currentKey = key;
      collectingList = [];
      continue;
    }

    // Plain scalar. Strip optional surrounding quotes.
    out[key] = rest.trim().replace(/^['"]|['"]$/g, "");
  }

  // Close any collectors that ran to the end of the frontmatter.
  closeCollectors();

  return out;
}

/**
 * Convert a parsed frontmatter record into a typed `ComponentRef`. Missing
 * keys become `undefined` — the assembler downstream just skips empty slots
 * so the rendered block doesn't grow empty "Variants:" lines.
 */
function toRef(
  fm: Record<string, string | string[]>,
  fallbackName: string
): ComponentRef {
  const asArray = (v: string | string[] | undefined): string[] | undefined => {
    if (v == null) return undefined;
    return Array.isArray(v) ? v : [v];
  };
  const asString = (v: string | string[] | undefined): string | undefined => {
    if (v == null) return undefined;
    return Array.isArray(v) ? v.join(", ") : v;
  };
  return {
    name: asString(fm.name) || fallbackName,
    import: asString(fm.import),
    variants: asArray(fm.variants),
    sizes: asArray(fm.sizes),
    props: asArray(fm.props),
    when_to_use: asString(fm.when_to_use),
    composes_with: asArray(fm.composes_with),
    subcomponents: asArray(fm.subcomponents),
    aliases: asArray(fm.aliases),
    notes: asString(fm.notes),
  };
}

// ─── Loader ───────────────────────────────────────────────────────────────

/**
 * Walk the inlined `SIDECARS` map once at module load and cache the parsed
 * refs. Errors per-file are swallowed with a console.warn so a malformed MD
 * can't take the chat route offline — we'd rather degrade to "no reference
 * for that component" than 500 the request.
 */
function loadAll(sidecars: Readonly<Record<string, string>>): ComponentRef[] {
  const refs: ComponentRef[] = [];
  const files = Object.keys(sidecars).sort();
  for (const file of files) {
    try {
      const raw = sidecars[file];
      const fm = parseFrontmatter(raw);
      const fallback = file.replace(/\.md$/, "");
      const ref = toRef(fm, fallback);
      ref.body = extractBody(raw);
      refs.push(ref);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[studio/playbook] skipping sidecar ${file}:`, err);
    }
  }
  return refs;
}

/**
 * Pull everything after the second `---` fence — the prose body of a sidecar.
 * Holds the canonical JSX example and the `### Anti-patterns` block — both
 * critical for the model and useless to anti-hallucination unless we pin
 * them into the prompt (which `formatRef` does).
 *
 * Returns "" when:
 *   - the file has no frontmatter (whole file is body)
 *   - the file is frontmatter-only (no body)
 *   - the file is empty / malformed
 *
 * Note this is content-agnostic: it doesn't try to parse JSX or markdown.
 * We trust the sidecar author to keep the body tight (~200 words guideline
 * in STUDIO.md) and pass the whole thing through. Cheaper than building a
 * section extractor and not noticeably worse than one.
 */
function extractBody(raw: string): string {
  if (!raw.startsWith("---")) return raw.trim();
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return "";
  // Skip the `\n---` (4 chars) plus the trailing newline if present.
  const afterFence = end + 4;
  return raw.slice(afterFence).replace(/^\r?\n/, "").trim();
}

// Per-registry cache keyed by `registry.id` (B1 — STUDIO-BYODS.md). The
// old module-scope constant was the gradeui special case; each registry's
// sidecars are still parsed exactly once per process. Unlike the old
// fs-based loader, there's no "dev hot-reload" wrinkle: sidecar bundles
// are generated TS modules, so editing a .md and regenerating is a normal
// HMR module update — Next's watcher picks it up for free.
const REF_CACHE = new Map<string, ComponentRef[]>();

function getRefs(registry: DesignSystemRegistry = GRADE_REGISTRY): ComponentRef[] {
  let refs = REF_CACHE.get(registry.id);
  if (!refs) {
    refs = loadAll(registry.components.sidecars);
    REF_CACHE.set(registry.id, refs);
  }
  return refs;
}

// ─── Contract-derived API lines ───────────────────────────────────────────
//
// A sidecar's `props:` list and the registry's generated contracts are two
// descriptions of one API, and they DRIFT. The BrightLocal sidecars are a
// transform of that DS's `component-meta.json`, which documents only the
// props the design system ADDS — Radix passthrough (`Checkbox.checked`,
// `TabsTrigger.value`) never appears in it. The contracts are extracted
// from the shipped `.d.ts` by the type checker, so they carry the whole
// resolved surface.
//
// `save_screen` validates against the CONTRACTS. When this block described
// props from the sidecars instead, the two disagreed in the direction that
// costs the most: the reference the author reads was NARROWER than the
// gate they are judged by, so real props read as unavailable and authors
// hand-rolled components the DS already had (Aug 2026 reports; the
// `list_components` half of the same divergence that made contract lookup
// registry-blind).
//
// So: where a contract exists, it wins — for the props line, for Variants
// and Sizes (both are just enum props), and for SUBCOMPONENTS, which get
// their own contract per export and were previously described by nothing
// at all. Sidecars keep everything the checker cannot know: when_to_use,
// composes_with, aliases, notes, and the worked example body.

/** Props the validator never checks — universal React/DOM passthrough. */
const UNIVERSAL_PROPS = new Set(["key", "ref", "className", "style", "children"]);

/** Compact-style cap on props rendered per component. Only three contracts
 *  in either registry exceed it (ChartLegend 180, Calendar 79,
 *  DatePickerCalendar 78 — all wrapping a third-party surface); the median
 *  is under a dozen. The overflow line states the true count rather than
 *  silently truncating, because "not listed = will fail" is the rule this
 *  block asserts and a quiet cut would make that a lie. */
const COMPACT_PROP_CAP = 40;

/** Compact-style cap on rendered sub-exports. Sidebar ships 34 and Map 18;
 *  rendering every one turned a single-component answer into 16k chars,
 *  against a 28k budget for the WHOLE screen context. The names all still
 *  appear on the Sub-exports line — only their prop detail is deferred. */
const COMPACT_SUBCOMPONENT_CAP = 12;

/** Sidecar prop line → its description text, keyed by prop name.
 *
 *  The contract supplies the prop SET (complete) and its type (resolved);
 *  the sidecar supplies the better PROSE. `dataHook`'s contract JSDoc is
 *  "Data hook for automated testing"; its sidecar line carries the house
 *  rule an author actually needs — kebab-case `{context}-{componentType}`.
 *  Taking the set from one and the words from the other keeps both. */
function sidecarDescriptions(ref: ComponentRef): Map<string, string> {
  const out = new Map<string, string>();
  for (const line of ref.props ?? []) {
    const [sig, ...rest] = line.split("—");
    const desc = rest.join("—").trim();
    const name = sig.trim().split(/[?:\s(]/)[0];
    if (name && desc) out.set(name, desc);
  }
  return out;
}

/** `disabled?: boolean — Whether the checkbox is disabled` — the sidecar
 *  grammar, rebuilt from the contract so both sources read identically. */
function contractPropLine(
  name: string,
  p: RegistryPropSpec,
  descriptions?: Map<string, string>,
  /** "override" on the component the sidecar documents; "fallback" on its
   *  sub-exports. A sidecar folds the family's prose onto the ROOT, so
   *  `value` there is described as the active tab's controlled value —
   *  true of `<Tabs>`, wrong for `<TabsTrigger value>`, which identifies
   *  one tab. Sub-exports keep their own JSDoc and borrow the sidecar only
   *  where the checker had nothing to say (the house rule on dataHook). */
  descriptionMode: "override" | "fallback" = "override",
  withDescriptions = true,
): string {
  const opt = p.optional ? "?" : "";
  let type = "";
  if (p.kind === "enum" && p.values?.length) type = `: ${p.values.join(" | ")}`;
  else if (p.kind !== "unknown") type = `: ${p.kind}`;
  const bits = [`${name}${opt}${type}`];
  if (!p.optional) bits.push("REQUIRED");
  if (p.default !== undefined) bits.push(`default ${JSON.stringify(p.default)}`);
  const head = bits.length > 1 ? `${bits[0]} (${bits.slice(1).join(", ")})` : bits[0];
  if (!withDescriptions) return head;
  const sidecar = descriptions?.get(name);
  const description =
    descriptionMode === "override"
      ? (sidecar ?? p.description)
      : (p.description ?? sidecar);
  // The requiredness marker is already in `head`; sidecar lines lead with
  // their own "REQUIRED (…)" so drop the duplicate rather than print both.
  const trimmed = description?.replace(/^REQUIRED\s*/, "");
  return trimmed ? `${head} — ${trimmed}` : head;
}

/** Contract → rendered prop lines, minus the enum props already shown on
 *  their own Variants/Sizes lines. */
function contractProps(
  spec: RegistryContractSpec,
  skip: readonly string[],
  style: "full" | "compact",
  descriptions?: Map<string, string>,
  descriptionMode: "override" | "fallback" = "override",
  /** false → names, types, enums and requiredness only. That IS the
   *  contract surface the validator enforces; the prose is idiom. Compact
   *  style drops it on SUB-EXPORTS, where the whole point of the line is
   *  "this prop exists and is required" — the family's prose already sits
   *  on the root. Without this, a fat brief's compact context grew by a
   *  third against a budget it was already over. */
  withDescriptions = true,
): { line: string; total: number } | null {
  const entries = Object.entries(spec.props).filter(
    ([n]) => !skip.includes(n) && !UNIVERSAL_PROPS.has(n),
  );
  if (!entries.length) return null;
  // REQUIRED props are never truncated. Calendar carries 79 props and its
  // required `dataHook` sat past the cap — omitting the one prop an author
  // cannot guess is worse than omitting twenty optional ones.
  const required = entries.filter(([, p]) => !p.optional);
  const optional = entries.filter(([, p]) => p.optional);
  const shown =
    style === "compact" && entries.length > COMPACT_PROP_CAP
      ? [
          ...required,
          ...optional.slice(0, Math.max(0, COMPACT_PROP_CAP - required.length)),
        ]
      : entries;
  const rendered = shown
    .map(([n, p]) =>
      contractPropLine(
        n,
        p,
        withDescriptions ? descriptions : undefined,
        descriptionMode,
        withDescriptions,
      ),
    )
    .join("; ");
  const overflow =
    shown.length < entries.length
      ? ` … +${entries.length - shown.length} more (${entries.length} total — this component wraps a third-party surface; query it by name for the rest)`
      : "";
  return { line: rendered + overflow, total: entries.length };
}

function contractFor(
  name: string,
  registry: DesignSystemRegistry,
): RegistryContractSpec | undefined {
  return registry.components.contracts?.[name];
}

// ─── Public API: render ───────────────────────────────────────────────────

/**
 * Format a single component ref as a terse prompt block. Lines are skipped
 * when the corresponding frontmatter key is empty so we don't pay tokens
 * for stubs. Example output:
 *
 *   Button — import { Button } from "@gradeui/ui"
 *     Variants: default, destructive, outline, secondary, ghost, link
 *     Sizes: default, sm, lg, icon
 *     Props: variant?, size?, asChild?
 *     Sub-exports: (none)
 *     Composes with: Dialog, DropdownMenu
 *     When: Any clickable action.
 *
 * The header is a ready-to-copy `import { … } from "<pkg>"` line — written
 * that way because consumers (including other LLMs reading this prompt)
 * have been observed pasting the path verbatim and producing broken
 * default imports / relative paths. Giving them the full statement
 * removes that failure mode.
 */
function formatRef(
  ref: ComponentRef,
  style: "full" | "compact" = "full",
  registry: DesignSystemRegistry = GRADE_REGISTRY,
): string {
  const lines: string[] = [];
  const names = [ref.name, ...(ref.subcomponents ?? [])].join(", ");
  const header = ref.import
    ? `${ref.name} — import { ${names} } from "${ref.import}"`
    : ref.name;
  lines.push(header);
  if (ref.subcomponents && ref.subcomponents.length) {
    lines.push(`  Sub-exports: ${ref.subcomponents.join(", ")}`);
  }
  // Contract first, sidecar second — see the note above `contractPropLine`.
  const spec = contractFor(ref.name, registry);
  const variants = spec?.props.variant?.values ?? ref.variants;
  const sizes = spec?.props.size?.values ?? ref.sizes;
  if (variants && variants.length) {
    lines.push(`  Variants: ${variants.join(", ")}`);
  }
  if (sizes && sizes.length) {
    lines.push(`  Sizes: ${sizes.join(", ")}`);
  }
  const descriptions = sidecarDescriptions(ref);
  const fromContract = spec
    ? contractProps(spec, ["variant", "size"], style, descriptions)
    : null;
  if (fromContract) {
    lines.push(`  Props: ${fromContract.line}`);
  } else if (ref.props && ref.props.length) {
    lines.push(`  Props: ${ref.props.join("; ")}`);
  }
  // A contract carrying `element` tells the validator to accept that tag's
  // native attributes and `on*` handlers on top of the props above. Saying
  // so is the difference between "htmlFor is not available" and "htmlFor is
  // a label attribute, use it" — the former sent authors to hand-rolled
  // markup for props the gate would have passed.
  if (spec?.element) {
    lines.push(
      `  Also accepts <${spec.element}> native attributes and on* handlers.`,
    );
  }
  // Subcomponents carry their OWN contract per export (TabsTrigger.value is
  // required there, and was described nowhere before this). Rendering them
  // under the root is what makes the family's real surface visible without
  // a query per sub-export.
  const subs = (ref.subcomponents ?? []).filter((sub) =>
    contractFor(sub, registry),
  );
  const shownSubs =
    style === "compact" && subs.length > COMPACT_SUBCOMPONENT_CAP
      ? subs.slice(0, COMPACT_SUBCOMPONENT_CAP)
      : subs;
  for (const sub of shownSubs) {
    const subSpec = contractFor(sub, registry);
    if (!subSpec) continue;
    const subProps = contractProps(
      subSpec,
      [],
      style,
      descriptions,
      "fallback",
      style === "full",
    );
    const el = subSpec.element ? ` (+ <${subSpec.element}> native attrs)` : "";
    if (subProps) lines.push(`    ${sub}: ${subProps.line}${el}`);
  }
  if (shownSubs.length < subs.length) {
    lines.push(
      `    … +${subs.length - shownSubs.length} more sub-exports listed above; query one by name for its props.`,
    );
  }
  if (ref.composes_with && ref.composes_with.length) {
    lines.push(`  Composes with: ${ref.composes_with.join(", ")}`);
  }
  if (ref.when_to_use) lines.push(`  When: ${ref.when_to_use}`);
  // Compact mode stops here — the API surface (import, variants, sizes,
  // props, composes, when) is the part the contract validator enforces;
  // the notes + worked-example body below are idiom guidance. Transport-
  // budgeted surfaces (MCP tool results) drop them when the full block
  // would exceed the host's result-size limit, and lean on the
  // validation gate to catch idiom misses.
  if (style === "compact") return lines.join("\n");
  // Notes are emitted last because they're the richest content and we want
  // the model to see the terse header first. Each line is indented to stay
  // visually grouped under the component header.
  if (ref.notes) {
    lines.push("  Notes:");
    for (const noteLine of ref.notes.split("\n")) {
      lines.push(`    ${noteLine}`);
    }
  }
  // Prose body — canonical JSX example + ### Anti-patterns. Pinned for
  // the model so it actually sees the composition we authored, instead
  // of guessing it from prop names + shadcn training data. The body is
  // emitted verbatim (its own ``` fences survive) under a clearly
  // labelled section so the model knows it's a worked example, not
  // further instructions to follow literally.
  //
  // Cost: ~150–300 extra tokens per pinned sidecar. Retrieval is
  // selective (the refs block only includes components that won
  // alias-match), so the cost only bites when the sidecar is genuinely
  // relevant — which is exactly when the example is worth its tokens.
  //
  // No indentation: ``` fences need column 0 to render as code blocks
  // in tools that re-display the prompt, and the model's parser is
  // happier with un-indented fenced blocks too.
  if (ref.body) {
    lines.push("");
    lines.push(`  Example & anti-patterns for <${ref.name}> ↓`);
    lines.push(ref.body);
  }
  return lines.join("\n");
}

/**
 * Produce the component-reference block for injection into the system prompt.
 *
 * Pass `onlyFor` to restrict output to a subset of components (case-insensitive
 * match against `ComponentRef.name`). Without `onlyFor` every ref is emitted —
 * heavy (~2k tokens for a 17-component DS) and only worth doing if you
 * genuinely want the whole surface.
 *
 * Callers should prefer `relevantComponentNames(text)` → `renderComponentRefsBlock({ onlyFor })`
 * to keep per-request overhead proportional to what the conversation actually
 * touches.
 *
 * Returns an empty string when the filter rules out every ref (or when no
 * MDs are present), so the caller can safely `prompt + "\n\n" + block`
 * without worrying about trailing gaps.
 */
export function renderComponentRefsBlock(options?: {
  onlyFor?: readonly string[];
  /** "full" (default) includes each ref's notes + worked example +
   *  anti-patterns body. "compact" emits only the API header lines
   *  (import, variants, sizes, props, composes, when) — built for
   *  transport-budgeted surfaces (MCP tool results) where the full
   *  block can exceed the host's result-size limit. The contract
   *  surface survives; idiom misses are caught downstream by
   *  validateAgainstContract. */
  style?: "full" | "compact";
  /** Design system whose sidecars feed the block (default gradeui). */
  registry?: DesignSystemRegistry;
}): string {
  const refs = getRefs(options?.registry);
  if (!refs.length) return "";
  const style = options?.style ?? "full";
  const filter = options?.onlyFor?.length
    ? new Set(options.onlyFor.map((n) => n.toLowerCase()))
    : null;
  const picked = filter
    ? refs.filter((r) => filter.has(r.name.toLowerCase()))
    : refs;
  if (!picked.length) return "";

  const registry = options?.registry ?? GRADE_REGISTRY;
  const body = picked.map((r) => formatRef(r, style, registry)).join("\n\n");
  const intro =
    style === "compact"
      ? [
          "COMPONENT REFERENCE (compact) — API shapes for the components in play.",
          "Use ONLY the variants/sizes/props listed per component. Compound components compose via their Sub-exports (e.g. <Avatar><AvatarFallback>AL</AvatarFallback></Avatar>).",
        ]
      : [
          "COMPONENT REFERENCE — API shapes + canonical examples + anti-patterns for the components in play.",
          "Read the example block under each component before emitting JSX for that component — it shows the composition (compound subcomponent ordering, required wrappers, prop spelling) that this DS actually expects. Anti-patterns lines marked `DO NOT` are hard rules.",
        ];
  return [
    ...intro,
    "",
    body,
    "",
    "Using a variant/size/prop not listed above will fail the render, except where a component is noted as accepting native attributes.",
  ].join("\n");
}

// ─── Public API: retrieve ─────────────────────────────────────────────────

/**
 * Given a free-form text blob (concatenated chat messages + any inlined code),
 * pick out which component refs are worth injecting. A ref qualifies if:
 *
 *   - its own `name` (e.g. "Button") appears as a whole word, OR
 *   - any of its `subcomponents` (e.g. "DialogTrigger") appears as a whole word
 *
 * Matching is case-insensitive and word-boundary-anchored so "buttoned" won't
 * falsely match "Button". Returned names use the ref's canonical casing.
 *
 * The common case (first turn of a fresh chat, vague prompt) returns an empty
 * array — the main system prompt's allowed-list already tells the model what
 * components exist; we only pay for API details when there's signal we need them.
 */
export function relevantComponentNames(
  text: string,
  registry?: DesignSystemRegistry,
): string[] {
  const refs = getRefs(registry);
  if (!text || !refs.length) return [];

  // Build alias table: each canonical name maps to itself + any sub-exports
  // + any informal aliases declared in the frontmatter. Longest aliases first
  // so the regex prefers `CardHeader` over `Card` when both would match
  // (avoids over-including Card for a subcomponent mention).
  const aliases: { canonical: string; alias: string }[] = [];
  for (const ref of refs) {
    aliases.push({ canonical: ref.name, alias: ref.name });
    for (const sub of ref.subcomponents ?? []) {
      aliases.push({ canonical: ref.name, alias: sub });
    }
    for (const informal of ref.aliases ?? []) {
      aliases.push({ canonical: ref.name, alias: informal });
    }
  }
  aliases.sort((a, b) => b.alias.length - a.alias.length);

  const hits = new Set<string>();
  for (const { canonical, alias } of aliases) {
    // Word-boundary match with optional plural suffix. Without the suffix,
    // "buttons"/"switches"/"dialogs" wouldn't pick up their singular refs —
    // we'd miss cases like "create a settings panel with switches" even
    // though `Switch` is obviously what's asked for. `(?:es|s)?` catches
    // both "cards" and "switches"; the `i` flag handles casing.
    //
    // `(?<!\.)` rejects matches preceded by a dot — that's the JS method-
    // call shape (`array.map(...)`, `arr.filter(...)`, `obj.toggle(...)`),
    // which would otherwise pollute the refs with the Map / Filter / Toggle
    // components on any list-rendering JSX. False positive we hit live:
    // music-app scaffold renders playlists with `[...].map(p => ...)` and
    // the refs always shipped `Map` even though no Map was anywhere near
    // the conversation.
    //
    // Escaped because informal aliases may contain characters that look
    // like regex metachars (e.g. "three.js" → the `.` would otherwise match
    // any char, so "threeXjs" would false-positive). Canonical names and
    // sub-export names are identifier-shaped so this is only defensive for
    // the frontmatter-declared aliases, but cheap enough to apply everywhere.
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?<!\\.)\\b${escaped}(?:es|s)?\\b`, "i");
    if (re.test(text)) hits.add(canonical);
  }
  return Array.from(hits);
}

/** Introspection for debugging — not used by the prompt pipeline. */
export function listComponentRefs(
  registry?: DesignSystemRegistry,
): ReadonlyArray<ComponentRef> {
  return getRefs(registry);
}

// ─── Structured prop manifest ─────────────────────────────────────────────

/**
 * Convert a PascalCase component name into the kebab-case value we expect to
 * see on `data-gds-part`. Mirrors the inverse converter in the in-iframe
 * selection agent (kebabToPascal), so a `part` captured from the DOM round-
 * trips cleanly through the manifest lookup.
 */
function pascalToKebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

/**
 * Parse one prop descriptor line out of the frontmatter into a structured
 * PropManifest. The descriptor grammar is informal — authors have written
 * things like:
 *
 *   variant? (default | destructive | outline | secondary | ghost | link)
 *   asChild?: boolean — renders as the child element (use to wrap <a>/<Link>)
 *   src: string — video URL
 *   aspect?: "video" | "square" | "portrait" | "wide" | "auto" (default "video")
 *   columns?: 2 | 3 | 4 (default 3)
 *   controls?: boolean (default false)
 *   playbackRate?: number (default 1)
 *   maxDpr?: number (default min(devicePixelRatio, 2))
 *   onChange?: (id: string) => void — called when …
 *   palette?: Partial<Palette> — shared palette applied …
 *   All native button HTML attrs (onClick, type, etc.)
 *
 * Anything the parser can't identify returns `{ kind: "unknown", raw }` so
 * the caller always sees a complete record — the settings panel filters
 * unknowns out, but the structure stays uniform for downstream tooling.
 */
function parsePropSignature(line: string): PropManifest | null {
  const raw = line.trim();
  if (!raw) return null;

  // "All native button HTML attrs (…)" — a pure catch-all sentence, not a
  // parseable prop descriptor. Skip entirely so it doesn't pollute the panel
  // with a nonsensical "unknown" row.
  if (/^all\s/i.test(raw)) return null;

  // Split description off at the first em-dash (—) or " - " separator.
  // Plain hyphens inside types (`(id: string) => void`) must NOT split — the
  // rule is: em-dash always splits; hyphen only splits when it's flanked by
  // spaces AND follows a type-like token. The em-dash case covers 95% of
  // authored lines; the hyphen fallback is defensive.
  let head = raw;
  let description: string | undefined;
  const emIdx = raw.indexOf(" — ");
  const hyphenIdx = raw.indexOf(" - ");
  const splitIdx =
    emIdx !== -1 ? emIdx : hyphenIdx !== -1 ? hyphenIdx : -1;
  if (splitIdx !== -1) {
    head = raw.slice(0, splitIdx).trim();
    description = raw.slice(splitIdx + 3).trim();
  }

  // Pull `(default X)` out of the head, preserving raw text. We accept
  // nested parens in X (e.g. `(default min(devicePixelRatio, 2))`) by
  // scanning paren depth rather than a greedy regex.
  let defaultValue: string | undefined;
  const defIdx = head.toLowerCase().lastIndexOf("(default");
  if (defIdx !== -1) {
    let depth = 0;
    let end = -1;
    for (let i = defIdx; i < head.length; i++) {
      const ch = head[i];
      if (ch === "(") depth++;
      else if (ch === ")") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end !== -1) {
      const inner = head.slice(defIdx + "(default".length, end).trim();
      defaultValue = inner;
      head = (head.slice(0, defIdx) + head.slice(end + 1)).trim();
    }
  }

  // Name + optional marker. Accept `name?`, `name?:`, or `name:`.
  //
  // The parser handles two top-level shapes for `head` after stripping
  // `(default …)`:
  //   1. "name? (a | b | c)"       — enum in unquoted parens
  //   2. "name?: <type expression>" — colon-typed prop
  //
  // Name pattern matches a JS identifier (plus `-` to be safe for camelCase
  // attrs that accidentally got hyphens in a sidecar).
  const nameMatch = head.match(/^([A-Za-z_$][A-Za-z0-9_$-]*)(\?)?(\s*:\s*|\s+|$)(.*)$/);
  if (!nameMatch) {
    // Last-ditch: extract just the name, mark as unknown. Better than
    // dropping the row silently.
    const bare = head.match(/^([A-Za-z_$][A-Za-z0-9_$-]*)(\?)?/);
    if (!bare) return null;
    return {
      name: bare[1],
      optional: Boolean(bare[2]),
      kind: "unknown",
      defaultValue,
      description,
      raw,
    };
  }

  const [, name, questionMark, , rest] = nameMatch;
  const optional = Boolean(questionMark);
  const tail = rest.trim();

  // Shape 1 — parens enum: `(a | b | c)` (bare identifiers, unquoted).
  if (tail.startsWith("(") && tail.endsWith(")")) {
    const inner = tail.slice(1, -1).trim();
    const parts = inner.split("|").map((s) => s.trim()).filter(Boolean);
    if (parts.length) {
      return {
        name,
        optional,
        kind: "enum",
        enum: parts,
        defaultValue,
        description,
        raw,
      };
    }
  }

  // Shape 2 — typed form. Strip the tail to just the type expression.
  const typeExpr = tail.replace(/^:\s*/, "").trim();

  if (!typeExpr) {
    return { name, optional, kind: "unknown", defaultValue, description, raw };
  }

  // Pipe-union enum: quoted strings, bare numbers, or a mix of identifiers.
  if (typeExpr.includes("|") && !/[=>{}()<]/.test(typeExpr)) {
    const parts = typeExpr.split("|").map((s) => s.trim()).filter(Boolean);
    const values: Array<string | number> = [];
    for (const p of parts) {
      const stripped = p.replace(/^['"]|['"]$/g, "");
      if (stripped !== p) {
        values.push(stripped);
      } else if (/^-?\d+(\.\d+)?$/.test(p)) {
        values.push(Number(p));
      } else if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(p)) {
        values.push(p);
      } else {
        // Gave up — bail to unknown rather than emit a garbage enum.
        return { name, optional, kind: "unknown", defaultValue, description, raw };
      }
    }
    if (values.length) {
      return {
        name,
        optional,
        kind: "enum",
        enum: values,
        defaultValue,
        description,
        raw,
      };
    }
  }

  if (/^boolean$/i.test(typeExpr)) {
    return { name, optional, kind: "boolean", defaultValue, description, raw };
  }
  if (/^number$/i.test(typeExpr)) {
    return { name, optional, kind: "number", defaultValue, description, raw };
  }
  if (/^string$/i.test(typeExpr)) {
    return { name, optional, kind: "string", defaultValue, description, raw };
  }

  // Anything else (function types, generics, ReactNode, Partial<X>, custom
  // object types) → "unknown". Settings panel hides these.
  return { name, optional, kind: "unknown", defaultValue, description, raw };
}

/**
 * Build the manifest for a single ComponentRef by parsing every descriptor
 * string. Variants and sizes are synthesised as enum props (`"variant"` /
 * `"size"`) so the settings panel has one uniform shape to render from.
 */
function buildManifestFromRef(ref: ComponentRef): ComponentManifest {
  const props: PropManifest[] = [];

  if (ref.variants && ref.variants.length) {
    props.push({
      name: "variant",
      optional: true,
      kind: "enum",
      enum: ref.variants,
      raw: `variant? (${ref.variants.join(" | ")})`,
    });
  }
  if (ref.sizes && ref.sizes.length) {
    props.push({
      name: "size",
      optional: true,
      kind: "enum",
      enum: ref.sizes,
      raw: `size? (${ref.sizes.join(" | ")})`,
    });
  }

  for (const line of ref.props ?? []) {
    const parsed = parsePropSignature(line);
    if (!parsed) continue;
    // Skip duplicates already synthesised from variants/sizes (Button's
    // frontmatter lists both `variants: [...]` AND `props: - variant? (…)`
    // — keep the CVA-derived list canonical).
    if (
      (parsed.name === "variant" && ref.variants?.length) ||
      (parsed.name === "size" && ref.sizes?.length)
    ) {
      continue;
    }
    props.push(parsed);
  }

  return {
    name: ref.name,
    part: pascalToKebab(ref.name),
    import: ref.import,
    variants: ref.variants,
    sizes: ref.sizes,
    props,
    when_to_use: ref.when_to_use,
  };
}

/**
 * Build the component manifest JSON payload for the Studio settings panel.
 *
 * `onlyFor` — optional case-insensitive filter against component names or
 * their `data-gds-part` (kebab-case) values. The panel passes the selected
 * part so we only ship one manifest per request (tiny payload, no client-
 * side filtering needed).
 *
 * Returns a flat array. Ordering matches sidecar read order (alphabetical
 * by filename) to keep diffs stable.
 */
export function buildComponentManifest(options?: {
  onlyFor?: readonly string[];
  /** Design system whose sidecars feed the manifest (default gradeui). */
  registry?: DesignSystemRegistry;
}): ComponentManifest[] {
  const refs = getRefs(options?.registry);
  if (!refs.length) return [];
  const filter = options?.onlyFor?.length
    ? new Set(options.onlyFor.map((s) => s.toLowerCase()))
    : null;
  const picked = filter
    ? refs.filter((r) => {
        const name = r.name.toLowerCase();
        const part = pascalToKebab(r.name).toLowerCase();
        return filter.has(name) || filter.has(part);
      })
    : refs;
  return picked.map(buildManifestFromRef);
}
