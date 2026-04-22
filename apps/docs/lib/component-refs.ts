/**
 * Server-only loader for per-component reference metadata.
 *
 * Reads `components/ui/*.md` files at module scope (warm, Node runtime,
 * cold-start once) and turns their frontmatter into a compact text block
 * that gets appended to the /studio and /chat system prompts. The goal is
 * to hand the model a terse props/variants reference so it stops guessing
 * API shapes — fewer broken drafts → fewer iterations → fewer tokens.
 *
 * Why a bespoke frontmatter parser:
 *   gray-matter + a YAML lib would add ~80KB to the server bundle just to
 *   parse a handful of tightly-controlled keys. We OWN the MD schema — it
 *   only needs to handle `key: value`, `key: [a, b, c]`, and block lists
 *   (`key:\n  - item`). 60 lines, zero deps.
 *
 * Safety: this file pulls `fs`/`path` at the top level, so it must ONLY be
 * imported from server code (route handlers, Server Components). Importing
 * it into a client component will error at build time.
 */

import { readFileSync, readdirSync } from "fs";
import { join } from "path";

export interface ComponentRef {
  /** Display name, e.g. "Button". Matches the exported component name. */
  name: string;
  /** Package the component ships from — almost always `@gradeui/ui`. The
   *  formatter renders this as a full `import { … } from "<pkg>"` line so
   *  the model doesn't guess at named-vs-default or invent relative paths. */
  import?: string;
  /** Variant names — strings from the component's CVA `variant` slot. */
  variants?: string[];
  /** Size tokens — strings from the component's CVA `size` slot. */
  sizes?: string[];
  /** Compact prop list; each entry is the prop's descriptor line verbatim. */
  props?: string[];
  /** Short human sentence on when the model should reach for it. */
  when_to_use?: string;
  /** Components that pair well with this one. */
  composes_with?: string[];
  /** Sub-exports the model can import alongside the root (e.g. CardHeader). */
  subcomponents?: string[];
  /**
   * Informal terms that should pull this ref into the prompt even when the
   * user doesn't say the canonical name. Word-boundary matched, case-insensitive.
   *
   * Example: `aliases: [rive, riv, animation]` on RivePlayer means the prompt
   * "make a rive animation" resolves to RivePlayer even though neither
   * "rive" nor "animation" matches "RivePlayer" via word-boundary equality.
   * Not rendered in the prompt block — matching-only.
   */
  aliases?: string[];
  /**
   * Free-form prose appended to the rendered ref block. Use for non-obvious
   * gotchas the model needs to see — valid preset ids, required props, public
   * demo URLs, "do NOT invent X" warnings. Supports YAML `|` block scalars
   * for multi-paragraph text.
   *
   * Notes are the highest-leverage field for anti-hallucination: you are
   * talking directly to the model at the moment it reasons about this
   * component. Spend tokens here liberally.
   */
  notes?: string;
}

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

/**
 * Walk `components/ui/*.md` once at module load and cache the parsed refs.
 * Errors per-file are swallowed with a console.warn so a malformed MD can't
 * take the chat route offline — we'd rather degrade to "no reference for
 * that component" than 500 the request.
 */
function loadAll(): ComponentRef[] {
  const dir = join(process.cwd(), "components", "ui");
  let files: string[];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }

  const refs: ComponentRef[] = [];
  for (const file of files.sort()) {
    try {
      const raw = readFileSync(join(dir, file), "utf-8");
      const fm = parseFrontmatter(raw);
      const fallback = file.replace(/\.md$/, "");
      refs.push(toRef(fm, fallback));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[component-refs] skipping ${file}:`, err);
    }
  }
  return refs;
}

// Production: cache at module scope so each request is a pure-memory lookup.
// Development: re-read on every access. Next.js's file watcher doesn't track
// `.md` files (they're outside the TS module graph), so editing a component's
// reference in dev would otherwise require a full server restart. Re-reading
// 17 ~20-line files costs <10ms per request — negligible next to the LLM
// round-trip — and the DX win (hot-reloadable docs) is substantial.
const IS_DEV = process.env.NODE_ENV !== "production";
let CACHED_REFS: ComponentRef[] | null = IS_DEV ? null : loadAll();

function getRefs(): ComponentRef[] {
  if (CACHED_REFS) return CACHED_REFS;
  const refs = loadAll();
  if (!IS_DEV) CACHED_REFS = refs; // in prod, cache forever; in dev, stay fresh
  return refs;
}

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
function formatRef(ref: ComponentRef): string {
  const lines: string[] = [];
  const names = [ref.name, ...(ref.subcomponents ?? [])].join(", ");
  const header = ref.import
    ? `${ref.name} — import { ${names} } from "${ref.import}"`
    : ref.name;
  lines.push(header);
  if (ref.subcomponents && ref.subcomponents.length) {
    lines.push(`  Sub-exports: ${ref.subcomponents.join(", ")}`);
  }
  if (ref.variants && ref.variants.length) {
    lines.push(`  Variants: ${ref.variants.join(", ")}`);
  }
  if (ref.sizes && ref.sizes.length) {
    lines.push(`  Sizes: ${ref.sizes.join(", ")}`);
  }
  if (ref.props && ref.props.length) {
    lines.push(`  Props: ${ref.props.join("; ")}`);
  }
  if (ref.composes_with && ref.composes_with.length) {
    lines.push(`  Composes with: ${ref.composes_with.join(", ")}`);
  }
  if (ref.when_to_use) lines.push(`  When: ${ref.when_to_use}`);
  // Notes are emitted last because they're the richest content and we want
  // the model to see the terse header first. Each line is indented to stay
  // visually grouped under the component header.
  if (ref.notes) {
    lines.push("  Notes:");
    for (const noteLine of ref.notes.split("\n")) {
      lines.push(`    ${noteLine}`);
    }
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
}): string {
  const refs = getRefs();
  if (!refs.length) return "";
  const filter = options?.onlyFor?.length
    ? new Set(options.onlyFor.map((n) => n.toLowerCase()))
    : null;
  const picked = filter
    ? refs.filter((r) => filter.has(r.name.toLowerCase()))
    : refs;
  if (!picked.length) return "";

  const body = picked.map(formatRef).join("\n\n");
  return [
    "COMPONENT REFERENCE — API shapes for the components in play:",
    "",
    body,
    "",
    "Using a variant/size/prop not listed above will fail the render.",
  ].join("\n");
}

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
export function relevantComponentNames(text: string): string[] {
  const refs = getRefs();
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
    // Escaped because informal aliases may contain characters that look
    // like regex metachars (e.g. "three.js" → the `.` would otherwise match
    // any char, so "threeXjs" would false-positive). Canonical names and
    // sub-export names are identifier-shaped so this is only defensive for
    // the frontmatter-declared aliases, but cheap enough to apply everywhere.
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}(?:es|s)?\\b`, "i");
    if (re.test(text)) hits.add(canonical);
  }
  return Array.from(hits);
}

/** Introspection for debugging — not used by the prompt pipeline. */
export function listComponentRefs(): ReadonlyArray<ComponentRef> {
  return getRefs();
}
