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
import { SIDECARS } from "./sidecars.generated";

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
function loadAll(): ComponentRef[] {
  const refs: ComponentRef[] = [];
  const files = Object.keys(SIDECARS).sort();
  for (const file of files) {
    try {
      const raw = SIDECARS[file];
      const fm = parseFrontmatter(raw);
      const fallback = file.replace(/\.md$/, "");
      refs.push(toRef(fm, fallback));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[studio/playbook] skipping sidecar ${file}:`, err);
    }
  }
  return refs;
}

// Cache once at module scope. Unlike the old fs-based loader, there's no
// "dev hot-reload" wrinkle: SIDECARS is a bundled TS module, so editing a
// .md and regenerating with `generate:sidecars` is a normal HMR module
// update — Next's watcher picks it up for free.
const CACHED_REFS: ComponentRef[] = loadAll();

function getRefs(): ComponentRef[] {
  return CACHED_REFS;
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
}): ComponentManifest[] {
  const refs = getRefs();
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
