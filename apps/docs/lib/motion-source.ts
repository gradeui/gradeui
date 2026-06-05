/**
 * motion-source — scene-level surgery on a Motion design's JSX blob.
 *
 * The Motion editor's write half. Every editor gesture reduces to "find
 * scene N's exact character span and rewrite it":
 *
 *   - inspector field edit  → setSceneProp
 *   - drag-reorder          → moveScene
 *   - duplicate / delete    → duplicateScene / removeScene
 *   - add scene             → (timeline-dock's appendSceneToSource)
 *
 * Heuristic (regex + scan, not a full parse) — the same contract as
 * timeline-dock's extractCameraShots/extractMotionScenes: it reads the
 * shapes Studio writes. Scenes don't nest, so "next closing tag after
 * the opener" is exact. All functions return null when the source
 * doesn't contain what they need — callers treat null as "don't write".
 *
 * See STUDIO-DIRECTOR.md ("Grade Motion", M2) for the editor plan.
 */

export interface MotionSceneSpan {
  /** Index into the scene sequence (dock chips, strip cards). */
  index: number;
  /** Character offset of `<MotionScene`. */
  start: number;
  /** Character offset just past `</MotionScene>` (or `/>` when
   *  self-closing). */
  end: number;
  /** Character offset just past the opening tag's `>`. */
  openTagEnd: number;
  /** True for `<MotionScene ... />` with no children. */
  selfClosing: boolean;
  /** The label prop, when present. */
  label: string | null;
}

const OPEN = "<MotionScene";
const CLOSE = "</MotionScene>";

/** Locate every scene's exact span in the blob. */
export function findMotionScenes(src: string): MotionSceneSpan[] {
  const spans: MotionSceneSpan[] = [];
  let cursor = 0;
  let index = 0;
  for (;;) {
    const start = src.indexOf(OPEN, cursor);
    if (start === -1) break;
    // Reject matches that are a different tag sharing the prefix
    // (defensive — nothing ships with one today).
    const after = src[start + OPEN.length];
    if (after !== " " && after !== ">" && after !== "\n" && after !== "\t" && after !== "/") {
      cursor = start + OPEN.length;
      continue;
    }
    // Find the end of the opening tag, respecting `{...}` expressions
    // (a `>` inside an arrow function in a prop must not close the tag).
    let i = start + OPEN.length;
    let brace = 0;
    let openTagEnd = -1;
    let selfClosing = false;
    for (; i < src.length; i++) {
      const ch = src[i];
      if (ch === "{") brace++;
      else if (ch === "}") brace--;
      else if (ch === ">" && brace === 0) {
        openTagEnd = i + 1;
        selfClosing = src[i - 1] === "/";
        break;
      }
    }
    if (openTagEnd === -1) break; // malformed — stop scanning
    let end: number;
    if (selfClosing) {
      end = openTagEnd;
    } else {
      const close = src.indexOf(CLOSE, openTagEnd);
      if (close === -1) break; // malformed — stop scanning
      end = close + CLOSE.length;
    }
    const openTag = src.slice(start, openTagEnd);
    const lm = openTag.match(/label\s*=\s*["'{`]+([^"'`}]*)["'`}]/);
    spans.push({
      index,
      start,
      end,
      openTagEnd,
      selfClosing,
      label: lm ? lm[1] : null,
    });
    cursor = end;
    index++;
  }
  return spans;
}

/** Swap scene `i`'s entire JSX for `nextJsx`. */
export function replaceScene(
  src: string,
  i: number,
  nextJsx: string,
): string | null {
  const s = findMotionScenes(src)[i];
  if (!s) return null;
  return src.slice(0, s.start) + nextJsx + src.slice(s.end);
}

/** Delete scene `i` (plus its surrounding blank line, so the source
 *  stays tidy). Refuses to remove the last remaining scene. */
export function removeScene(src: string, i: number): string | null {
  const spans = findMotionScenes(src);
  if (spans.length <= 1) return null;
  const s = spans[i];
  if (!s) return null;
  // Eat leading whitespace back to (and including) the previous newline.
  let from = s.start;
  while (from > 0 && (src[from - 1] === " " || src[from - 1] === "\t")) from--;
  if (from > 0 && src[from - 1] === "\n") from--;
  return src.slice(0, from) + src.slice(s.end);
}

/** Insert a copy of scene `i` immediately after itself. The copy's
 *  label gets a " copy" suffix when a label exists. */
export function duplicateScene(src: string, i: number): string | null {
  const s = findMotionScenes(src)[i];
  if (!s) return null;
  let copy = src.slice(s.start, s.end);
  if (s.label) {
    copy = copy.replace(
      /(label\s*=\s*["'`])([^"'`]*)(["'`])/,
      (_m, p1, p2, p3) => `${p1}${p2} copy${p3}`,
    );
  }
  const indent = "\n" + " ".repeat(Math.max(0, indentOf(src, s.start)));
  return src.slice(0, s.end) + indent + copy + src.slice(s.end);
}

/** Move scene `from` to position `to` (both indices in scene order). */
export function moveScene(
  src: string,
  from: number,
  to: number,
): string | null {
  const spans = findMotionScenes(src);
  if (from === to) return src;
  const a = spans[from];
  const b = spans[to];
  if (!a || !b) return null;
  const blockA = src.slice(a.start, a.end);
  const blockB = src.slice(b.start, b.end);
  // Swap-free splice: rebuild with the moved block extracted then
  // re-inserted. Two-block swap is enough for drag-reorder semantics
  // when applied per single-step move; for arbitrary jumps, extract +
  // insert keeps every other scene untouched.
  if (from < to) {
    return (
      src.slice(0, a.start) +
      src.slice(a.end, b.end) +
      (src.slice(a.start - indentOf(src, a.start) - 1, a.start).includes("\n")
        ? "\n" + " ".repeat(indentOf(src, a.start))
        : "") +
      blockA +
      src.slice(b.end)
    );
  }
  return (
    src.slice(0, b.start) +
    blockA +
    "\n" +
    " ".repeat(indentOf(src, b.start)) +
    src.slice(b.start, a.start).replace(/[ \t]*$/, "") +
    src.slice(a.end)
  );
}

/**
 * Set (or remove) a prop on scene `i`'s opening tag — the inspector's
 * write half. `value` semantics:
 *   - string  → label="..." style prop
 *   - number  → durationMs={4000} style prop
 *   - null    → remove the prop entirely
 * Replaces in place when present, inserts after `<MotionScene` when not.
 */
export function setSceneProp(
  src: string,
  i: number,
  prop: string,
  value: string | number | null,
): string | null {
  const s = findMotionScenes(src)[i];
  if (!s) return null;
  const openTag = src.slice(s.start, s.openTagEnd);
  // Match `prop="..."` / `prop={...}` (balanced enough for flat values).
  const re = new RegExp(`\\s${prop}\\s*=\\s*(?:"[^"]*"|'[^']*'|\\{[^{}]*\\})`);
  let nextTag: string;
  if (value === null) {
    if (!re.test(openTag)) return src; // nothing to remove
    nextTag = openTag.replace(re, "");
  } else {
    const lit =
      typeof value === "number" ? `${prop}={${value}}` : `${prop}=${JSON.stringify(value)}`;
    nextTag = re.test(openTag)
      ? openTag.replace(re, ` ${lit}`)
      : openTag.replace(OPEN, `${OPEN} ${lit}`);
  }
  return src.slice(0, s.start) + nextTag + src.slice(s.openTagEnd);
}

function indentOf(src: string, offset: number): number {
  let n = 0;
  let j = offset - 1;
  while (j >= 0 && src[j] === " ") {
    n++;
    j--;
  }
  return n;
}
