/**
 * Regex-based JSX source mutator for the Studio settings panel.
 *
 * Stage 3 of highlight-and-comment: when the user toggles a prop control in
 * the settings panel, we don't round-trip through the LLM — we rewrite the
 * component's JSX attribute directly in the `App.tsx` source and re-feed
 * the patched source back to Sandpack. Fast (sub-frame) and deterministic.
 *
 * Scope and explicit non-goals:
 *
 *   - **One instance per file.** We always mutate the FIRST `<ComponentName>`
 *     opening tag we find. If the design happens to use two `<Button>`s, the
 *     panel will only ever reach the first. The alternative (positional
 *     targeting via the selection's outerHTML) is doable but the juice isn't
 *     worth the squeeze for v1 — document the limit and leave it.
 *
 *   - **No AST.** A Babel parse + generate round-trip here would be ~200KB
 *     of deps server-side (babel-parser + generator) for 3 mutations a user
 *     might do. Regex is miserly and the grammar we care about is tight:
 *     JSX opening tag → attribute list → string literal | JSX expression |
 *     boolean shorthand. If/when this grows to conditional JSX, spread
 *     attributes, or multi-instance, swap in jscodeshift and move on.
 *
 *   - **No formatting.** We preserve the existing whitespace around
 *     attributes and never "prettify" unchanged portions of the file. The
 *     user's chat-emitted source is already reasonably formatted; don't
 *     touch what you don't have to.
 *
 * Safe failures: every mutation function returns the original source on
 * any parse ambiguity. The settings panel can then surface "couldn't
 * locate the attribute — try the chat" without the preview rendering
 * broken code.
 */

/**
 * Type of the prop value being written. Covers the shapes a settings panel
 * control can actually produce.
 *
 * `null` means "remove the prop entirely" (used when the user resets a
 * control to its default).
 */
import { injectSourceIds } from "./chat-sandpack";

export type PropValue = string | number | boolean | null;

/**
 * Find the opening tag of the first `<ComponentName>` in `source`. Returns
 * the `{ start, end, attrs, selfClosing }` slice so callers can splice the
 * updated attrs back in without touching anything else. `null` when the
 * component isn't present.
 *
 * Shape of the match:
 *
 *   <Name[attrs](/? )>
 *   ^               ^
 *   start           end (index *after* the closing '>')
 *
 * `attrs` is the raw text between the component name and the closing
 * `/>` or `>` — trimmed of leading whitespace but preserving interior
 * formatting.
 *
 * Components are word-boundary matched so `<ButtonGroup>` doesn't collide
 * with `<Button>`. We start from `<Name` + whitespace|/|>, same rule JSX
 * itself uses for tag-name termination.
 */
export function findComponentOpenTag(
  source: string,
  componentName: string
): {
  start: number;
  end: number;
  attrs: string;
  selfClosing: boolean;
} | null {
  // Match <Name followed by whitespace, /, or > — never a word character.
  // Non-greedy attrs up to the first unbalanced `>` that isn't inside a
  // string or a JSX expression. We scan manually because a naive regex
  // wouldn't respect `{ foo: ">" }` inside an attribute expression.
  const namePattern = new RegExp(
    `<${escapeRegex(componentName)}(?=[\\s/>])`,
    "g"
  );
  const nameMatch = namePattern.exec(source);
  if (!nameMatch) return null;

  const tagStart = nameMatch.index;
  const attrsStart = tagStart + 1 + componentName.length;

  // Walk forward from attrsStart tracking brace depth + string state so we
  // don't close on a `>` that lives inside an expression or string literal.
  let i = attrsStart;
  let depth = 0;
  let inString: '"' | "'" | "`" | null = null;
  let escaped = false;
  const len = source.length;
  while (i < len) {
    const ch = source[i];

    if (escaped) {
      escaped = false;
      i++;
      continue;
    }

    if (inString) {
      if (ch === "\\") {
        escaped = true;
      } else if (ch === inString) {
        inString = null;
      }
      i++;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      i++;
      continue;
    }

    if (ch === "{") {
      depth++;
      i++;
      continue;
    }
    if (ch === "}") {
      depth = Math.max(0, depth - 1);
      i++;
      continue;
    }

    if (depth === 0 && ch === ">") {
      const selfClosing = source[i - 1] === "/";
      const attrsEnd = selfClosing ? i - 1 : i;
      const attrs = source.slice(attrsStart, attrsEnd);
      return {
        start: tagStart,
        end: i + 1,
        attrs,
        selfClosing,
      };
    }

    i++;
  }

  return null;
}

/**
 * Find the JSX opening tag whose attrs contain `data-gds-source-id="<id>"`.
 * Used to target a specific JSX node from a preview-click — the id is
 * injected at `prepareAppSource` time, so every PascalCase component
 * gets one and every DOM rendering of a single source node shares it.
 *
 * Returns the same shape as `findComponentOpenTag`. The component name
 * isn't passed in — the function recovers it from the `<Name` token
 * preceding the matched attribute. Returns `null` if no tag carries
 * that id (e.g. the source was regenerated between selection and
 * mutation; the chip's single-shot lifecycle prevents this in
 * practice but the null is the safe failure).
 */
/** Guard for sourceId-based lookups: a click on a USER-LAND wrapper
 *  component (e.g. AppLayoutShell — defined in-file, rendering a DS
 *  compound as its root) captures the sourceId of the wrapper's
 *  INTERNAL root tag (<GlobalLayout> inside the function definition),
 *  not the usage site. Mutating that tag silently no-ops — the prop
 *  lands in the DS component's rest-spread as a meaningless DOM attr
 *  ("the switches don't do anything", July 2026). If the sourceId hit
 *  isn't the component the inspector believes is selected, discard it
 *  so the caller falls back to the first `<ComponentName>` in source
 *  order — in-file wrapper components typically have exactly one
 *  usage site, so first-match is correct there.
 */
function matchTagForComponent<T extends { componentName: string }>(
  tag: T | null,
  componentName: string,
): T | null {
  return tag && tag.componentName === componentName ? tag : null;
}

export function findComponentOpenTagBySourceId(
  source: string,
  sourceId: string
): {
  start: number;
  end: number;
  attrs: string;
  selfClosing: boolean;
  componentName: string;
} | null {
  // Forward-scan every PascalCase opening tag in source order, and
  // for each one walk the attrs with the same brace/string-aware
  // scanner the rest of the mutator uses. When a tag's attrs match
  // the target `data-gds-source-id="<id>"`, we're done.
  //
  // A regex-only search (find the attr literal then walk backward to
  // the enclosing `<Name`) is tempting but fragile — backward walks
  // can't easily track string state, so a `>` inside another attr's
  // string value would false-bail. This forward scan reuses the
  // exact logic that already works elsewhere.
  const escId = escapeRegex(sourceId);
  const targetAttr = new RegExp(
    `data-gds-source-id\\s*=\\s*(?:"${escId}"|'${escId}')`
  );
  // Match every JSX/HTML opening tag — `injectSourceIds` puts
  // source-ids on both PascalCase DS components AND lowercase HTML
  // tags (so raw <div className="…">s can be edited via the
  // inspector's Spacing controls), and this lookup has to walk the
  // same surface to find them. Dotted member-expression tags
  // (<motion.h1>, <Sortable.Item>) included — keep in sync with
  // injectSourceIds' pattern in chat-sandpack.ts.
  const tagPattern =
    /<([A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)*)(?=[\s/>])/g;
  const len = source.length;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(source)) !== null) {
    const componentName = match[1];
    const tagStart = match.index;
    const attrsStart = tagStart + 1 + componentName.length;

    let j = attrsStart;
    let depth = 0;
    let inString: '"' | "'" | "`" | null = null;
    let escaped = false;
    while (j < len) {
      const ch = source[j];
      if (escaped) {
        escaped = false;
        j++;
        continue;
      }
      if (inString) {
        if (ch === "\\") escaped = true;
        else if (ch === inString) inString = null;
        j++;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") {
        inString = ch;
        j++;
        continue;
      }
      if (ch === "{") {
        depth++;
        j++;
        continue;
      }
      if (ch === "}") {
        depth = Math.max(0, depth - 1);
        j++;
        continue;
      }
      if (depth === 0 && ch === ">") {
        const selfClosing = source[j - 1] === "/";
        const attrsEnd = selfClosing ? j - 1 : j;
        const attrs = source.slice(attrsStart, attrsEnd);
        if (targetAttr.test(attrs)) {
          return {
            start: tagStart,
            end: j + 1,
            attrs,
            selfClosing,
            componentName,
          };
        }
        break; // This tag's attrs don't match — move to the next match.
      }
      j++;
    }
  }
  return null;
}

/**
 * Splice a new `attrs` string into the opening tag at `tag` and return the
 * full updated source. `attrs` may be empty (for zero-prop components).
 * Re-inserts the self-closing slash when appropriate.
 */
function replaceAttrs(
  source: string,
  tag: { start: number; end: number; selfClosing: boolean },
  newAttrs: string
): string {
  const head = source.slice(0, tag.start);
  const tail = source.slice(tag.end);
  const trimmed = newAttrs.trim();
  const body = trimmed ? ` ${trimmed}` : "";
  const closer = tag.selfClosing ? " />" : ">";
  const name = source.slice(tag.start + 1).match(/^[A-Za-z_][A-Za-z0-9_]*/)?.[0];
  return `${head}<${name}${body}${closer}${tail}`;
}

/**
 * Walk one attribute out of a JSX attrs string starting at index `i`.
 * Returns the slice bounds `{ start, end, name, valueStart, valueEnd, kind }`
 * or null if no attribute starts at `i` (e.g. trailing whitespace).
 *
 * `kind`:
 *   - "string"     — attr="value"
 *   - "expression" — attr={value}
 *   - "boolean"    — attr (no value, shorthand for {true})
 *
 * `valueStart`/`valueEnd` bound the *raw* value including the surrounding
 * quotes/braces so callers can substitute the whole thing. For boolean
 * shorthand these equal `end` (no value span).
 */
interface AttrSlice {
  start: number;
  end: number;
  name: string;
  valueStart: number;
  valueEnd: number;
  kind: "string" | "expression" | "boolean";
}

function parseNextAttr(attrs: string, from: number): AttrSlice | null {
  // Skip leading whitespace.
  let i = from;
  while (i < attrs.length && /\s/.test(attrs[i])) i++;
  if (i >= attrs.length) return null;

  const nameMatch = attrs.slice(i).match(/^([A-Za-z_$][A-Za-z0-9_$-]*)/);
  if (!nameMatch) return null;
  const nameStart = i;
  const name = nameMatch[1];
  i += name.length;

  // Skip spaces between name and `=` (rare but legal).
  let j = i;
  while (j < attrs.length && /\s/.test(attrs[j])) j++;

  if (attrs[j] !== "=") {
    // Boolean shorthand.
    return {
      start: nameStart,
      end: i,
      name,
      valueStart: i,
      valueEnd: i,
      kind: "boolean",
    };
  }

  // Skip `=` and any optional whitespace before the value.
  j++;
  while (j < attrs.length && /\s/.test(attrs[j])) j++;
  const valueStart = j;

  const ch = attrs[j];
  if (ch === '"' || ch === "'") {
    // String literal — find the matching closer respecting escapes.
    let k = j + 1;
    while (k < attrs.length) {
      if (attrs[k] === "\\") {
        k += 2;
        continue;
      }
      if (attrs[k] === ch) {
        return {
          start: nameStart,
          end: k + 1,
          name,
          valueStart,
          valueEnd: k + 1,
          kind: "string",
        };
      }
      k++;
    }
    // Unterminated string — bail.
    return null;
  }

  if (ch === "{") {
    // JSX expression — track brace depth and string state.
    let k = j + 1;
    let depth = 1;
    let inString: '"' | "'" | "`" | null = null;
    let escaped = false;
    while (k < attrs.length && depth > 0) {
      const c = attrs[k];
      if (escaped) {
        escaped = false;
        k++;
        continue;
      }
      if (inString) {
        if (c === "\\") escaped = true;
        else if (c === inString) inString = null;
        k++;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") {
        inString = c;
        k++;
        continue;
      }
      if (c === "{") depth++;
      else if (c === "}") depth--;
      if (depth === 0) {
        return {
          start: nameStart,
          end: k + 1,
          name,
          valueStart,
          valueEnd: k + 1,
          kind: "expression",
        };
      }
      k++;
    }
    return null;
  }

  // Unquoted literal (not technically valid JSX — bail defensively).
  return null;
}

/**
 * Format a PropValue as its JSX source representation. Strings become
 * `"…"`, true becomes the attr shorthand, false becomes `={false}`
 * explicitly, numbers become `{42}`. The caller decides when to call this.
 *
 * Why `false` is written explicitly instead of being omitted: for props
 * whose declared default is `true` (ThreeScene's `autoPlay` /
 * `pauseOffscreen`, VideoPlayer's `autoPlay`), omitting the attr would
 * fall back to the library default — i.e. turning the Switch OFF would
 * have zero visible effect. Explicitly writing `prop={false}` preserves
 * user intent regardless of the component's default. The reset button
 * sends `null` when the user wants to clear the prop entirely.
 */
function formatValue(value: PropValue): {
  /** What to emit after `name=` — empty string means "no `=`, boolean
   *  shorthand" (used when caller handles that case). */
  afterEq: string;
  /** True when the attr should be omitted entirely (only for null — i.e. reset). */
  omit: boolean;
} {
  if (value === null) return { afterEq: "", omit: true };
  if (value === true) return { afterEq: "", omit: false };
  if (value === false) return { afterEq: "{false}", omit: false };
  if (typeof value === "number") return { afterEq: `{${value}}`, omit: false };
  // string — always double-quote; escape interior double quotes.
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return { afterEq: `"${escaped}"`, omit: false };
}

/**
 * Update (or insert, or remove) a single prop on the first
 * `<ComponentName>` in `source`. Returns the mutated source — or the
 * original source unchanged if the component isn't present.
 *
 * Semantics:
 *   - `value === null`          → remove the prop if present; no-op if absent.
 *   - `value === true`          → write `propName` (boolean shorthand).
 *   - `value === false`         → remove the prop (React treats absence === false
 *                                 for boolean props).
 *   - `typeof value === "number"` → write `propName={42}`.
 *   - `typeof value === "string"` → write `propName="…"`.
 *
 * When inserting, we place the new attribute at the end of the existing
 * attrs with a single space separator. When updating, we replace only the
 * value span (or the whole attr if switching between boolean-shorthand and
 * valued forms).
 */
export function updateComponentProp(
  source: string,
  componentName: string,
  propName: string,
  value: PropValue,
  /**
   * Stable identifier for the JSX node to mutate, captured at click
   * time from the rendered DOM (`data-gds-source-id`, injected at
   * `prepareAppSource` time). Pass it through and the mutator
   * targets the exact JSX opening tag the user clicked — robust
   * across `.map()` loops, where many DOM elements share one
   * source node and the previous index-based approach hit random
   * other components.
   *
   * When omitted (or no tag matches), falls back to the first
   * `<ComponentName>` in source order — the legacy v1 behavior.
   */
  sourceId?: string
): string {
  // Ensure the source carries `data-gds-source-id` attrs before we
  // search. `injectSourceIds` is idempotent + deterministic: a
  // counter walks PascalCase opening tags in source order, so the
  // IDs we compute here match the IDs `prepareAppSource` already put
  // into the rendered DOM. Without this, `appSource` (as stored in
  // page state) is the raw assistant output with NO ids, and the
  // sourceId lookup would always fail → fallback to first-match →
  // every click would mutate the first instance. (Mirror the same
  // pattern in `readComponentProp`.)
  const ensured = sourceId ? injectSourceIds(source) : source;
  const tag = sourceId
    ? matchTagForComponent(
        findComponentOpenTagBySourceId(ensured, sourceId),
        componentName,
      ) ?? findComponentOpenTag(ensured, componentName)
    : findComponentOpenTag(ensured, componentName);
  if (!tag) return source;
  source = ensured;

  // Walk attrs looking for an existing entry.
  let pos = 0;
  let existing: AttrSlice | null = null;
  while (pos < tag.attrs.length) {
    const attr = parseNextAttr(tag.attrs, pos);
    if (!attr) break;
    if (attr.name === propName) {
      existing = attr;
      break;
    }
    pos = attr.end;
  }

  const formatted = formatValue(value);

  // Remove.
  if (formatted.omit) {
    if (!existing) return source; // already absent
    // Also swallow one separator (space or newline) before the attr so we
    // don't leave `<Component  otherProp>` double-spaced after removal. If
    // the attr is at the very start we instead eat trailing whitespace.
    let removeFrom = existing.start;
    let removeTo = existing.end;
    if (removeFrom > 0 && /\s/.test(tag.attrs[removeFrom - 1])) {
      removeFrom--;
    } else if (
      removeTo < tag.attrs.length &&
      /\s/.test(tag.attrs[removeTo])
    ) {
      removeTo++;
    }
    const newAttrs =
      tag.attrs.slice(0, removeFrom) + tag.attrs.slice(removeTo);
    return replaceAttrs(source, tag, newAttrs);
  }

  // Update or insert.
  const newAttrText =
    formatted.afterEq === ""
      ? propName // boolean shorthand
      : `${propName}=${formatted.afterEq}`;

  if (existing) {
    const newAttrs =
      tag.attrs.slice(0, existing.start) +
      newAttrText +
      tag.attrs.slice(existing.end);
    return replaceAttrs(source, tag, newAttrs);
  }

  // Insert — append with a single whitespace separator. If the existing
  // attrs already end in whitespace (common: `<Tag controls />` has a
  // trailing space before the self-close) reuse it rather than adding a
  // second space. Preserves multi-line attr blocks that already end with a
  // newline + indent.
  let newAttrs: string;
  if (tag.attrs.length === 0) {
    newAttrs = newAttrText;
  } else if (/\s$/.test(tag.attrs)) {
    newAttrs = tag.attrs + newAttrText;
  } else {
    newAttrs = tag.attrs + " " + newAttrText;
  }
  return replaceAttrs(source, tag, newAttrs);
}

// ─── Inline style (expression attr) ──────────────────────────────────
//
// Detached / "custom" inspector values (an exact radius px, a raw
// box-shadow) must render in Fast Frame — the DEFAULT renderer — whose
// stylesheet is compiled at build time: a runtime-minted arbitrary
// Tailwind class (`rounded-[10px]`) produces no CSS there. Inline
// `style` needs no compiler, so it's the carrier for every detached
// value; bound values stay token classes and the inspector keeps the
// two mutually exclusive.
//
// v1 scope: the style attribute is treated as a SIMPLE object literal
// of string-literal values — `style={{ borderRadius: "10px" }}` — which
// is the only shape this module ever writes. If an existing style attr
// carries anything more exotic (spreads, variables, ternaries), both
// functions bail rather than risk corrupting user code: read returns
// null, write returns the source unchanged.

const STYLE_PAIR_RE =
  /([A-Za-z_$][\w$]*)\s*:\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')/g;

/** Parse a simple object-literal style expression (raw including the
 *  outer JSX braces) into key→value pairs. Null when too complex. */
function parseStyleObject(raw: string): Record<string, string> | null {
  const inner = raw.trim().replace(/^\{/, "").replace(/\}$/, "").trim();
  if (inner === "") return {};
  if (!inner.startsWith("{") || !inner.endsWith("}")) return null;
  const body = inner.slice(1, -1);
  const out: Record<string, string> = {};
  let leftover = body;
  STYLE_PAIR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = STYLE_PAIR_RE.exec(body)) !== null) {
    out[m[1]] = (m[2] ?? m[3] ?? "").replace(/\\(.)/g, "$1");
    leftover = leftover.replace(m[0], "");
  }
  // Anything beyond commas/whitespace means syntax we can't faithfully
  // rebuild — refuse rather than corrupt.
  if (/[^\s,]/.test(leftover)) return null;
  return out;
}

function serializeStyleObject(styles: Record<string, string>): string {
  const entries = Object.entries(styles).map(
    ([k, v]) => `${k}: "${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`,
  );
  return `{{ ${entries.join(", ")} }}`;
}

/** Read the inline `style` object on the targeted JSX node. `{}` when no
 *  style attr is present; null when one is present but too complex. */
export function readInlineStyle(
  source: string,
  componentName: string,
  sourceId?: string,
): Record<string, string> | null {
  const read = readComponentProp(source, componentName, "style", sourceId);
  if (read === undefined) return {};
  if (read.kind !== "expression") return null;
  return parseStyleObject(read.raw);
}

/** Merge `styles` into the targeted node's inline `style` attr (null
 *  values delete keys). Creates the attr when absent, removes it when
 *  the merged object is empty, and bails (source unchanged) when an
 *  existing style expression is too complex to round-trip. */
export function setInlineStyle(
  source: string,
  componentName: string,
  styles: Record<string, string | null>,
  sourceId?: string,
): string {
  const ensured = sourceId ? injectSourceIds(source) : source;
  const tag = sourceId
    ? matchTagForComponent(
        findComponentOpenTagBySourceId(ensured, sourceId),
        componentName,
      ) ?? findComponentOpenTag(ensured, componentName)
    : findComponentOpenTag(ensured, componentName);
  if (!tag) return source;
  source = ensured;

  let pos = 0;
  let existing: AttrSlice | null = null;
  while (pos < tag.attrs.length) {
    const attr = parseNextAttr(tag.attrs, pos);
    if (!attr) break;
    if (attr.name === "style") {
      existing = attr;
      break;
    }
    pos = attr.end;
  }

  let current: Record<string, string> = {};
  if (existing) {
    if (existing.kind !== "expression") return source; // style="…" — not ours
    const parsed = parseStyleObject(
      tag.attrs.slice(existing.valueStart, existing.valueEnd),
    );
    if (parsed === null) return source; // too complex — refuse to corrupt
    current = parsed;
  }

  const merged: Record<string, string> = { ...current };
  for (const [k, v] of Object.entries(styles)) {
    if (v === null) delete merged[k];
    else merged[k] = v;
  }

  // Empty → remove the attr entirely (mirrors updateComponentProp).
  if (Object.keys(merged).length === 0) {
    if (!existing) return source;
    let removeFrom = existing.start;
    let removeTo = existing.end;
    if (removeFrom > 0 && /\s/.test(tag.attrs[removeFrom - 1])) {
      removeFrom--;
    } else if (removeTo < tag.attrs.length && /\s/.test(tag.attrs[removeTo])) {
      removeTo++;
    }
    return replaceAttrs(
      source,
      tag,
      tag.attrs.slice(0, removeFrom) + tag.attrs.slice(removeTo),
    );
  }

  const newAttrText = `style=${serializeStyleObject(merged)}`;
  if (existing) {
    return replaceAttrs(
      source,
      tag,
      tag.attrs.slice(0, existing.start) +
        newAttrText +
        tag.attrs.slice(existing.end),
    );
  }
  let newAttrs2: string;
  if (tag.attrs.length === 0) newAttrs2 = newAttrText;
  else if (/\s$/.test(tag.attrs)) newAttrs2 = tag.attrs + newAttrText;
  else newAttrs2 = tag.attrs + " " + newAttrText;
  return replaceAttrs(source, tag, newAttrs2);
}

/**
 * Read the current value of `propName` on the first `<ComponentName>` in
 * `source`, returning `undefined` when the attr isn't present. The return
 * type is:
 *
 *   { kind: "string",     value: string }   // attr="value"
 *   { kind: "boolean",    value: true }     // attr (shorthand)
 *   { kind: "expression", raw:   string }   // attr={anything} — raw including braces
 *
 * Expression values are returned as raw text because we can't safely eval
 * them here; the settings panel uses this only to decide whether the
 * control should reflect "dirty vs default" — the raw text is enough for
 * that.
 */
export type ReadPropResult =
  | { kind: "string"; value: string }
  | { kind: "boolean"; value: true }
  | { kind: "expression"; raw: string }
  | undefined;

export function readComponentProp(
  source: string,
  componentName: string,
  propName: string,
  /**
   * Stable identifier for the JSX node to read from — same semantics
   * as `updateComponentProp`'s `sourceId`. Pass `selection.sourceId`
   * so the current-value badge reflects the clicked instance.
   */
  sourceId?: string
): ReadPropResult {
  // Same injection trick as `updateComponentProp` — ensure the
  // source has IDs before searching, so the deterministic counter
  // here matches the one `prepareAppSource` used to label the DOM.
  const ensured = sourceId ? injectSourceIds(source) : source;
  const tag = sourceId
    ? matchTagForComponent(
        findComponentOpenTagBySourceId(ensured, sourceId),
        componentName,
      ) ?? findComponentOpenTag(ensured, componentName)
    : findComponentOpenTag(ensured, componentName);
  if (!tag) return undefined;

  let pos = 0;
  while (pos < tag.attrs.length) {
    const attr = parseNextAttr(tag.attrs, pos);
    if (!attr) break;
    if (attr.name === propName) {
      if (attr.kind === "boolean") return { kind: "boolean", value: true };
      if (attr.kind === "string") {
        // Strip surrounding quotes; un-escape interior \" and \\.
        const raw = tag.attrs.slice(attr.valueStart, attr.valueEnd);
        const quote = raw[0];
        const inner = raw.slice(1, -1);
        const unescaped = inner
          .replace(new RegExp(`\\\\${quote}`, "g"), quote)
          .replace(/\\\\/g, "\\");
        return { kind: "string", value: unescaped };
      }
      // expression
      return {
        kind: "expression",
        raw: tag.attrs.slice(attr.valueStart, attr.valueEnd),
      };
    }
    pos = attr.end;
  }
  return undefined;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Element children (text content) ────────────────────────────────
//
// Read + write the children of a JSX element identified by source-id.
// The use cases this v1 targets:
//
//   - Heading text editing (`<h1>Welcome</h1>` → "Welcome")
//   - Button labels (`<Button>Save</Button>` → "Save")
//   - Label / paragraph / span / div with a text-only child
//
// We intentionally limit "editable text" to children that are a SINGLE
// plain string — no nested elements, no JSX expressions, no fragments.
// Anything more structured (a Button containing an icon + a string,
// or text mixed with `{user.name}`) is left alone — replacing all
// children would destroy structure the user didn't intend to drop. A
// richer editor would parse + rebuild the children list; for v1 the
// chat is still the escape hatch for those cases.

/**
 * Find the children span of a JSX element identified by source-id.
 * Returns `null` when the element is self-closing or can't be
 * matched. Otherwise returns `{ start, end, value }` where value
 * is the verbatim text between `>` and `</Name>` — including any
 * surrounding whitespace.
 */
export function findElementChildren(
  source: string,
  sourceId: string
): { start: number; end: number; value: string } | null {
  // Make sure source has ids; the by-sourceId lookup needs them.
  const ensured = injectSourceIds(source);
  const tag = findComponentOpenTagBySourceId(ensured, sourceId);
  if (!tag || tag.selfClosing) return null;

  // Walk forward from `tag.end` looking for the matching closing
  // tag `</Name>`. We track depth on same-name opening tags so a
  // nested `<Name>` doesn't close us prematurely — rare in
  // practice for the text-bearing elements we target, but cheap
  // to handle correctly.
  const name = tag.componentName;
  const openRe = new RegExp(`<${escapeRegex(name)}(?=[\\s/>])`, "g");
  const closeRe = new RegExp(`</${escapeRegex(name)}\\s*>`, "g");
  openRe.lastIndex = tag.end;
  closeRe.lastIndex = tag.end;
  let depth = 1;
  while (depth > 0) {
    const openMatch = openRe.exec(ensured);
    const closeMatch = closeRe.exec(ensured);
    if (!closeMatch) return null;
    if (openMatch && openMatch.index < closeMatch.index) {
      depth++;
      closeRe.lastIndex = openMatch.index + 1;
    } else {
      depth--;
      if (depth === 0) {
        // Map positions back from `ensured` to original `source` is
        // unnecessary because `injectSourceIds` only INSERTS chars;
        // the positions on the right side of any insertion in
        // `ensured` are ≥ original. For the simple "no JSX expr
        // inside" cases this function targets, the children span
        // in `ensured` happens to be identical to the original
        // (no PascalCase tags inside means no insertions). For
        // safety, callers should treat the returned positions as
        // relative to the source they passed in only when no ids
        // were injected by this call — i.e. when the caller has
        // already ensured ids upstream. The inspector flow always
        // round-trips through the id-rich source, so this is fine
        // in practice.
        return {
          start: tag.end,
          end: closeMatch.index,
          value: ensured.slice(tag.end, closeMatch.index),
        };
      }
      openRe.lastIndex = closeMatch.index + closeMatch[0].length;
    }
  }
  return null;
}

/**
 * Replace the children of a text-bearing element with `newText`.
 * Returns the source unchanged when the element can't be found,
 * is self-closing, or its current children contain anything other
 * than plain text — i.e. nested tags, JSX expressions, or
 * fragments. Caller decides what to do with the no-op (most likely
 * just don't render the Text field for that element).
 */
export function updateElementText(
  source: string,
  sourceId: string,
  newText: string
): string {
  const ensured = injectSourceIds(source);
  const children = findElementChildren(ensured, sourceId);
  if (!children) return source;
  // Reject any children span that has structure we'd lose. `<` is
  // the obvious one (nested tags); `{` covers JSX expressions like
  // `{user.name}`. Whitespace is fine.
  if (/[<{}]/.test(children.value)) return source;
  return (
    ensured.slice(0, children.start) +
    newText +
    ensured.slice(children.end)
  );
}

/**
 * Returns true when the element identified by `sourceId` has
 * children that are plain text only — i.e. `updateElementText`
 * would actually replace them rather than no-op. The inspector
 * uses this to decide whether to render the Text input row.
 */
export function isElementTextEditable(
  source: string,
  sourceId: string
): boolean {
  const ensured = injectSourceIds(source);
  const children = findElementChildren(ensured, sourceId);
  if (!children) return false;
  // Empty string counts — the user can add text to an empty
  // element. Reject only when there's structure inside.
  return !/[<{}]/.test(children.value);
}

// ── Inline-rich text (the heading mini-editor) ─────────────────────────
//
// The plain text path above refuses ANY `<` or `{` inside an element —
// which is exactly what blocks a styled span in a heading. These helpers
// are the richer path: read/replace an element's children as raw INLINE
// JSX (text + a small set of inline tags), so the TipTap heading editor
// can wrap a selection in `<span className="font-accent">…</span>` and
// write it straight back. JSX expressions ({…}) and block/component tags
// are still out of scope — those stay on the plain field / chat.

/** Inline tags the rich heading editor can faithfully round-trip. */
const INLINE_RICH_TAGS = new Set(["span", "strong", "em", "b", "i", "br"]);

/** An element's children as a RAW JSX string (may include inline spans),
 *  for seeding the heading editor. null when the element isn't found or is
 *  self-closing. */
export function getElementInnerJsx(
  source: string,
  sourceId: string
): string | null {
  const ensured = injectSourceIds(source);
  const children = findElementChildren(ensured, sourceId);
  return children ? children.value : null;
}

/** True when an element's children are INLINE-ONLY — text plus the inline
 *  tags above, no JSX expressions and no block/component tags — so the
 *  heading editor can represent them without losing anything. Plain text
 *  (no tags) qualifies too. */
export function isElementInlineRichEditable(
  source: string,
  sourceId: string
): boolean {
  const ensured = injectSourceIds(source);
  const children = findElementChildren(ensured, sourceId);
  if (!children) return false;
  const value = children.value;
  if (/[{}]/.test(value)) return false; // JSX expressions can't be marks
  const tags = value.match(/<\/?\s*([A-Za-z][\w-]*)/g) ?? [];
  return tags.every((t) =>
    INLINE_RICH_TAGS.has(t.replace(/[</\s]/g, "").toLowerCase())
  );
}

/** The tag name of the element carrying `sourceId` (e.g. "h1", "span",
 *  "Button"), or null when not found. Lets the inspector gate the rich
 *  heading editor to actual headings. */
export function getElementTagName(
  source: string,
  sourceId: string
): string | null {
  const ensured = injectSourceIds(source);
  const esc = sourceId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = ensured.match(
    new RegExp(`<([A-Za-z][\\w.-]*)[^>]*?data-gds-source-id="${esc}"`)
  );
  return m ? m[1] : null;
}

/** Replace an element's children with a RAW JSX inner string (spans and
 *  all). Unlike `updateElementText` this does NOT reject structured
 *  content — it's the write path for the heading editor. Returns the
 *  source unchanged when the element can't be found. */
export function updateElementInnerJsx(
  source: string,
  sourceId: string,
  inner: string
): string {
  const ensured = injectSourceIds(source);
  const children = findElementChildren(ensured, sourceId);
  if (!children) return source;
  return ensured.slice(0, children.start) + inner + ensured.slice(children.end);
}
