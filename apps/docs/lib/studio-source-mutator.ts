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
  value: PropValue
): string {
  const tag = findComponentOpenTag(source, componentName);
  if (!tag) return source;

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
  propName: string
): ReadPropResult {
  const tag = findComponentOpenTag(source, componentName);
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
