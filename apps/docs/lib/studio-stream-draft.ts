/**
 * studio-stream-draft — turn a PARTIAL streamed JSX module into a
 * speculatively renderable draft.
 *
 * While the model streams an app inside a ```jsx fence, the source is
 * truncated at an arbitrary token boundary: open tags, open braces,
 * half-written attributes. This module "auto-closes" that truncation so
 * Fast Frame can attempt a silent compile and the user watches the app
 * draw top-down as tokens arrive (the v0/bolt streaming-preview model).
 *
 * Strategy — single-pass scanner over the source tracking a stack of
 * open constructs (`{`, `(`, `[`, JSX tags, fragments), skipping
 * strings, template literals, and comments. At end of input we append
 * the closers the stack still owes, innermost first.
 *
 * Deliberately heuristic, deliberately forgiving:
 *  - The trailing (almost certainly incomplete) line is dropped before
 *    scanning — the stream re-delivers it completed on the next tick.
 *  - A truncation point we can't recover from (mid-tag, unterminated
 *    string, mismatched closer) returns `null` — the caller keeps the
 *    last good draft and tries again on the next chunk.
 *  - Failures downstream are cheap by design: drafts compile with
 *    `speculative: true`, so the sandbox keeps the previous render and
 *    surfaces nothing. Correctness is restored by the final SEALED
 *    fence, which flows through the normal (loud) compile path.
 *
 * Kept dependency-free and pure so it can be unit-tested in isolation.
 */

type StackEntry =
  | { kind: "brace" } // {
  | { kind: "paren" } // (
  | { kind: "bracket" } // [
  | { kind: "tag"; name: string }; // <div> / <Card> / <> (name "" = fragment)

/**
 * Auto-close a partial JSX/TSX module so it has a chance of compiling.
 * Returns `null` when the draft is too early or too mangled to bother
 * the compiler with.
 */
export function completePartialJsx(partial: string): string | null {
  if (!partial) return null;

  // Drop the trailing line — it's mid-token more often than not.
  // The next stream tick re-delivers it whole.
  const lastNewline = partial.lastIndexOf("\n");
  if (lastNewline === -1) return null;
  const src = partial.slice(0, lastNewline);

  // Too early to render anything useful until the component shell has
  // streamed in. (Matches both `export default function App` and the
  // `function App` + trailing `export default App` shape.)
  if (!/function\s+App\b|const\s+App\s*=/.test(src)) return null;

  const stack: StackEntry[] = [];
  const n = src.length;
  let i = 0;

  /** Last non-whitespace character before index `at` (or ""). */
  const prevSignificant = (at: number): string => {
    for (let j = at - 1; j >= 0; j--) {
      const c = src[j];
      if (!/\s/.test(c)) return c;
    }
    return "";
  };

  /** Skip a string literal starting at `start` (src[start] is the quote).
   *  Returns the index just past the closing quote, or -1 if unterminated. */
  const skipString = (start: number): number => {
    const quote = src[start];
    for (let j = start + 1; j < n; j++) {
      const c = src[j];
      if (c === "\\") {
        j++;
        continue;
      }
      if (c === quote) return j + 1;
      // Plain strings don't span lines; templates are handled separately.
      if (quote !== "`" && c === "\n") return -1;
      // Template expression — recurse via a simple depth counter. `${`
      // bodies can contain strings of their own.
      if (quote === "`" && c === "$" && src[j + 1] === "{") {
        let depth = 1;
        j += 2;
        while (j < n && depth > 0) {
          const e = src[j];
          if (e === "\\") j++;
          else if (e === "'" || e === '"' || e === "`") {
            const end = skipString(j);
            if (end === -1) return -1;
            j = end - 1;
          } else if (e === "{") depth++;
          else if (e === "}") depth--;
          j++;
        }
        if (depth > 0) return -1;
        j--; // loop's j++ compensates
      }
    }
    return -1;
  };

  /**
   * Consume a JSX tag starting at `start` (src[start] === "<").
   * Handles attribute strings and `{...}` attribute expressions (depth
   * counted — nested JSX inside an attr expression is consumed blindly,
   * which is fine: it can't unbalance the outer tag stack).
   * Returns `{ end, selfClosing, closing, name }` or null when the tag
   * is truncated mid-way (caller bails to the previous good draft).
   */
  const readTag = (
    start: number
  ): { end: number; selfClosing: boolean; closing: boolean; name: string } | null => {
    let j = start + 1;
    const closing = src[j] === "/";
    if (closing) j++;
    let name = "";
    while (j < n && /[A-Za-z0-9_.\-]/.test(src[j])) {
      name += src[j];
      j++;
    }
    // Attribute scan
    let exprDepth = 0;
    let lastWasSlash = false;
    while (j < n) {
      const c = src[j];
      if (c === "'" || c === '"' || c === "`") {
        const end = skipString(j);
        if (end === -1) return null;
        j = end;
        lastWasSlash = false;
        continue;
      }
      if (c === "{") exprDepth++;
      else if (c === "}") exprDepth--;
      else if (c === ">" && exprDepth <= 0) {
        return { end: j + 1, selfClosing: lastWasSlash, closing, name };
      }
      lastWasSlash = c === "/" && exprDepth <= 0;
      j++;
    }
    return null; // truncated mid-tag
  };

  while (i < n) {
    const c = src[i];
    const top = stack[stack.length - 1];
    const inJsxChildren = top?.kind === "tag";

    // ── Comments (JS context and JSX expressions; JSX text can't
    // contain JS comments but a stray "//" in copy is harmless to skip
    // only in JS context) ─────────────────────────────────────────────
    if (!inJsxChildren && c === "/" && src[i + 1] === "/") {
      const nl = src.indexOf("\n", i);
      if (nl === -1) break;
      i = nl + 1;
      continue;
    }
    if (!inJsxChildren && c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      if (end === -1) return null; // unterminated comment
      i = end + 2;
      continue;
    }

    // ── Strings (JS context only — quotes inside JSX text are prose) ──
    if (!inJsxChildren && (c === "'" || c === '"' || c === "`")) {
      const end = skipString(i);
      if (end === -1) return null; // unterminated → wait for more tokens
      i = end;
      continue;
    }

    // ── JSX ───────────────────────────────────────────────────────────
    if (c === "<") {
      const next = src[i + 1];
      const isTagStart =
        /[A-Za-z]/.test(next ?? "") || next === "/" || next === ">";
      if (isTagStart) {
        // Inside JSX children every "<" is structure. In JS context,
        // disambiguate from comparisons/generics via the preceding
        // significant character (JSX can follow openers/operators,
        // generics follow identifiers).
        const jsContextOk =
          inJsxChildren ||
          ["", "(", ",", "{", ";", "=", ">", "&", "|", "?", ":", "[", "}"].includes(
            prevSignificant(i)
          );
        if (jsContextOk) {
          // JSX comment-ish `<!--` never appears; `</` closes, `<>` opens
          // a fragment.
          const tag = readTag(i);
          if (!tag) return null; // truncated mid-tag — try next tick
          if (tag.closing) {
            // Pop to the matching open tag. Mismatch = mangled draft.
            const idx = [...stack]
              .reverse()
              .findIndex((s) => s.kind === "tag" && s.name === tag.name);
            if (idx === -1) return null;
            stack.length = stack.length - 1 - idx;
          } else if (!tag.selfClosing) {
            stack.push({ kind: "tag", name: tag.name });
          }
          i = tag.end;
          continue;
        }
      }
      i++;
      continue;
    }

    // ── Plain JS / JSX-expression containers ──────────────────────────
    if (c === "{") {
      stack.push({ kind: "brace" });
      i++;
      continue;
    }
    if (c === "(") {
      if (!inJsxChildren) stack.push({ kind: "paren" });
      i++;
      continue;
    }
    if (c === "[") {
      if (!inJsxChildren) stack.push({ kind: "bracket" });
      i++;
      continue;
    }
    if (c === "}" || c === ")" || c === "]") {
      if (inJsxChildren) {
        // Stray closer inside JSX text — prose, ignore.
        i++;
        continue;
      }
      const expected =
        c === "}" ? "brace" : c === ")" ? "paren" : "bracket";
      if (!top || top.kind !== expected) return null; // mismatched
      stack.pop();
      i++;
      continue;
    }

    i++;
  }

  // Append the owed closers, innermost first.
  let suffix = "";
  for (let s = stack.length - 1; s >= 0; s--) {
    const entry = stack[s];
    switch (entry.kind) {
      case "tag":
        suffix += entry.name ? `</${entry.name}>` : "</>";
        break;
      case "brace":
        suffix += "}";
        break;
      case "paren":
        suffix += ")";
        break;
      case "bracket":
        suffix += "]";
        break;
    }
  }

  const draft = src + "\n" + suffix;
  // If the module used the `function App ... export default App` shape
  // and the export line hasn't streamed yet, append it so the sandbox
  // finds a default export. (Harmless duplicate-export situations can't
  // arise: if `export default` already appears, we skip.)
  if (!/export\s+default/.test(draft)) {
    return draft + "\nexport default App;";
  }
  return draft;
}
