/**
 * Shared Sandpack helpers for the chat design renderer.
 *
 * Mirrors the setup in app/play/page.tsx so generated components render with
 * the same tokens, fonts, and Tailwind config. Kept as plain strings / pure
 * functions so this module can be imported from a server component too (no
 * React/browser APIs).
 *
 * If you change /play's Sandpack config, also update these helpers so the
 * chat preview stays in sync.
 */

import { themeToCSSVars, type GeneratedTheme } from "@/lib/themes";
import { injectMediaSourceAttrs } from "@/lib/media-fill";
import { ALLOWED_COMPONENTS } from "@gradeui/studio/playbook";

// ─────────────────────────────────────────────────────────────────────
// Selection agent wire types
// ─────────────────────────────────────────────────────────────────────

/**
 * Shape the in-iframe selection agent ships back to the parent on click.
 * Kept co-located with the agent string below so it's obvious when the wire
 * format changes on one side but not the other.
 *
 *   - tag            lowercased tag name — e.g. "button"; used for the chip label
 *   - text           trimmed + truncated innerText (≤120 chars); fallback chip label
 *   - outerHTML      truncated outerHTML (≤500 chars) — embedded verbatim into the
 *                    system prompt so the model knows which DOM node the user is
 *                    pointing at
 *   - rect           viewport-relative bounding rect (rounded ints); only used for
 *                    diagnostics / potential future overlay in parent
 *   - part           value of the nearest ancestor's `data-gds-part` attribute.
 *                    DS components emit `data-gds-part="<kebab-component-name>"`
 *                    on their root element, so walking up from the click target
 *                    via `closest('[data-gds-part]')` tells us which DS component
 *                    the user actually meant — not just the raw DOM node they
 *                    happened to click on (which is almost always an inner child
 *                    element, not the component boundary).
 *   - componentName  the part value re-cased as PascalCase — e.g. "three-scene"
 *                    → "ThreeScene". Provided alongside `part` so the chip and
 *                    system prompt can show the exported component identifier
 *                    without re-deriving it on every consumer. Absent when
 *                    `part` is absent.
 */
export interface StudioSelection {
  tag: string;
  text: string;
  outerHTML: string;
  rect: { x: number; y: number; width: number; height: number };
  part?: string;
  componentName?: string;
  /** Raw JSON of the picked element's `data-media-source` attribute (only
   *  set when the resolved selection is a `<MediaSurface>` with a `source`
   *  prop). The right panel reads this to surface a "Regenerate this slot"
   *  affordance — saves a round-trip back to the iframe DOM to recover the
   *  descriptor. */
  mediaSourceJson?: string;
  /** Per-instance ID stamped by the component (`data-gds-instance-id`).
   *  Used by the settings panel to find the matching data-array entry
   *  in the JSX and mutate per-item rather than per-template. */
  instanceId?: string;
  /** Stable JSX-node identifier auto-injected at `prepareAppSource`
   *  time as `data-gds-source-id="N"`. Identifies WHICH JSX opening
   *  tag in the source rendered this DOM element — robust across
   *  loops, where many DOM nodes share a single source node. The
   *  mutator finds the JSX tag by this id instead of counting
   *  document-order matches (which broke for `.map()` loops). All
   *  rendered iterations of one looped JSX node share the same
   *  sourceId; their `instanceId` differentiates them within the
   *  list. Undefined for ad-hoc clicks where the injection pass
   *  hasn't run (e.g. `<div>` and other non-PascalCase tags). */
  sourceId?: string;
  /** Ancestor chain captured at click time, root → target. The last
   *  entry is the currently-selected element itself. The Selection
   *  inspector renders this as a clickable breadcrumb so the user
   *  can jump to any ancestor with one click — addresses the
   *  "I keep clicking the wrong nested Stack" pain point. Walk stops
   *  at the layout shell (any `data-gds-part="app-shell-*"`) so it
   *  doesn't include Studio chrome. */
  chain?: SelectionChainSegment[];
}

/** One step in the ancestor chain. The inspector renders these as
 *  small buttons labelled `Stack [34]`; clicking one re-selects the
 *  matching element via the iframe's `grade:select-by-source-id`
 *  message. */
export interface SelectionChainSegment {
  sourceId: string;
  tag: string;
  componentName?: string;
  instanceId?: string;
  /** User-supplied layer name from `data-gds-name`. The path bar
   *  uses this as the primary label when set, falling back to
   *  `componentName`/`tag`. */
  name?: string;
}

// ─────────────────────────────────────────────────────────────────────
// Snippet preparation
// ─────────────────────────────────────────────────────────────────────

/**
 * Heuristic: a "complete enough to render" JSX block ends with a closing
 * `}` or `)` once trailing comments + whitespace are stripped. If it
 * doesn't, assume it's still streaming. Shared between DesignPreview
 * (/chat) and StudioPreview (/studio).
 *
 * Why strip trailing comments: a perfectly valid file can end with a
 * `// ...` explanatory block or a `/* ... *\/` JSDoc footer. Without
 * the strip, those files trip the heuristic ("last char is a letter,
 * not `}` or `)`") and the canvas falls back to the "Empty screen"
 * overlay even though the JS is parseable. The playground scaffolds
 * each carry a "DS gaps surfaced" comment block at the end; pre-fix,
 * none of them rendered in the focused preview. Same risk for any
 * hand-authored scaffold that ends with a note.
 */
export function looksComplete(code: string): boolean {
  let trimmed = code.trimEnd();
  // Peel trailing line / block comments + whitespace, one comment at a
  // time, until we hit something that isn't a comment. Cheap loop;
  // scaffolds rarely end with more than a handful of comment lines.
  let prev = "";
  while (trimmed && trimmed !== prev) {
    prev = trimmed;
    // Trailing line comment — match the last `// …` segment to EOF
    // (no trailing newline by this point because of trimEnd).
    const lineComment = /(^|\n)[ \t]*\/\/[^\n]*$/.exec(trimmed);
    if (lineComment) {
      trimmed = trimmed.slice(0, lineComment.index).trimEnd();
      continue;
    }
    // Trailing block comment — find the matching `/*` looking backwards.
    if (trimmed.endsWith("*/")) {
      const openIdx = trimmed.lastIndexOf("/*", trimmed.length - 2);
      if (openIdx >= 0) {
        trimmed = trimmed.slice(0, openIdx).trimEnd();
        continue;
      }
    }
  }
  if (!trimmed) return false;
  const last = trimmed[trimmed.length - 1];
  return last === "}" || last === ")";
}

/**
 * Collapse any double-quoted string literal that contains a literal newline
 * into a single-line form. JSX attribute values are not allowed to span
 * lines — if they do, Babel throws "Unterminated string constant" and the
 * preview dies.
 *
 * LLMs occasionally emit wrapped className attributes like:
 *
 *   <div className="flex flex-col items-
 *                   center justify-center">
 *
 * which is invalid syntax. This repair pass re-joins them. We restrict to
 * double-quoted literals so template literals (which legitimately span
 * lines) pass through untouched; character classes `[^"\\]` match newlines
 * inside the class, so the regex naturally bridges the break.
 *
 * Exported so other Sandpack consumers (template viewer, /chat preview) can
 * apply the same defensive pass before handing code to the iframe.
 */
export function repairMultilineStrings(code: string): string {
  return code.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match, inner: string) => {
    if (!inner.includes("\n")) return match;
    const collapsed = inner.replace(/\s*\n\s*/g, " ").trim();
    return `"${collapsed}"`;
  });
}

/**
 * Collapse every `import { ... } from "./components/ui/<name>"` into a
 * single `import { ... } from "@gradeui/ui"`. The Sandpack iframe no
 * longer mounts hand-rolled copies of those components — it installs the
 * real `@gradeui/ui` from npm — so any legacy snippet that still uses
 * the old local path must be rewritten before the bundler sees it.
 *
 * This runs inside `prepareAppSource`, which means every consumer
 * (studio, chat, play, templates, embedded code editor examples) gets
 * the rewrite for free. Keeps the Sandpack swap decoupled from every
 * page that hand-authored example code against the old rule.
 *
 * Multi-line imports are handled — JSX source frequently wraps:
 *   import {
 *     Card, CardHeader, CardTitle,
 *   } from "./components/ui/card"
 * and the regex would miss it without the `s` flag (dotAll).
 *
 * We DON'T touch `lucide-react`, `recharts`, `@gradeui/ui`, or any other
 * bare specifier. Only the local `./components/ui/<slug>` pattern is
 * rewritten — anything else the model produced is already correct.
 */
export function rewriteLocalComponentImports(code: string): string {
  // `[^}]+?` already matches newlines inside the braces (character
  // classes match any char except the negated one, newlines included),
  // so we don't need the `s` (dotAll) flag — which would only be needed
  // to make `.` span newlines. Sticking with character classes keeps us
  // compatible with tsconfig targets below ES2018.
  //
  // Three shapes need healing:
  //   1. `./components/ui/<name>` — legacy local path (pre-npm-swap).
  //   2. `../components/ui/<name>` — same, one level up.
  //   3. `@gradeui/ui/<subpath>` — LLM literal-translates the new rule
  //      and emits `@gradeui/ui/button`, but package.json only exports
  //      the barrel at `"."`. Subpath imports fail with "Could not find
  //      module in path: '@gradeui/ui/button'". Fold them into the
  //      single barrel import alongside the legacy local matches.
  //
  // All three collapse into one consolidated `import { ... } from
  // "@gradeui/ui"` at the top of the file. Plain `from "@gradeui/ui"`
  // (no subpath) is NOT matched — it's already correct.
  const rx =
    /import\s*\{\s*([^}]+?)\s*\}\s*from\s*["'](?:\.\.?\/components\/ui\/[a-z-]+|@gradeui\/ui\/[a-z-]+)["'];?/g;
  const specifiers = new Set<string>();
  let matched = false;
  const stripped = code.replace(rx, (_m, group: string) => {
    matched = true;
    for (const raw of group.split(",")) {
      const name = raw.trim();
      if (name) specifiers.add(name);
    }
    // Replace each matched import with an empty string — stripped.trimStart
    // below cleans up the leading whitespace before we prepend the merged
    // import.
    return "";
  });
  if (!matched) return code;
  const merged = `import { ${Array.from(specifiers).join(", ")} } from "@gradeui/ui";\n`;
  return merged + stripped.trimStart();
}

/**
 * Auto-inject missing `@gradeui/ui` imports. The model sometimes emits
 * a JSX tag like `<Flex>` or `<Separator>` without including it in the
 * import list — either because it started with a subset and added more
 * tags during generation, or simply lost track. Sandpack then throws
 * "Flex is not defined" at parse time and the whole preview goes red.
 *
 * We scan the source for capitalized JSX tags, cross-reference against
 * `ALLOWED_COMPONENTS` (our canonical list of what @gradeui/ui exposes
 * for Studio), and add any missing names to a consolidated
 * `import { ... } from "@gradeui/ui"` line. We do NOT touch tags that
 * are already imported from anywhere — including non-Grade sources
 * like `lucide-react` — to avoid introducing duplicate identifiers.
 *
 * Kept as a separate pass (rather than folded into
 * `rewriteLocalComponentImports`) because the two have different
 * preconditions: the rewriter fires on a literal local path we want
 * to normalize, this one fires on a missing import we want to
 * fabricate. Composing them at the `prepareAppSource` level keeps
 * each function small enough to reason about in isolation.
 */
export function autoImportGradeComponents(code: string): string {
  // Collect every capitalized JSX tag reference. Matches opening tags
  // only (`<Foo …>`, `<Foo/>`) — closing tags don't add new identifiers
  // so we can skip them for free.
  const usedTags = new Set<string>();
  const tagRx = /<([A-Z][A-Za-z0-9_]*)/g;
  let tm: RegExpExecArray | null;
  while ((tm = tagRx.exec(code)) !== null) {
    usedTags.add(tm[1]);
  }
  if (usedTags.size === 0) return code;

  // What's already imported — from ANY module. Import guards against
  // a `Button` from lucide-react colliding with the Grade `Button`.
  const resolved = new Set<string>();
  const anyImportRx = /import\s*\{\s*([^}]+?)\s*\}\s*from\s*["'][^"']+["'];?/g;
  let im: RegExpExecArray | null;
  while ((im = anyImportRx.exec(code)) !== null) {
    for (const raw of im[1].split(",")) {
      // Handle `X as Y` — Y is the binding in scope, strip the alias.
      const name = raw.trim().replace(/\s+as\s+.+$/, "").trim();
      if (name) resolved.add(name);
    }
  }

  // The set we want to add. Already-resolved names are skipped so we
  // never duplicate an identifier. Only allowlisted Grade components
  // get auto-injected — anything else was either a local component or
  // a typo, and neither is safe for us to invent an import for.
  // Linear scan over ALLOWED_COMPONENTS. The array is ~50 entries and
  // prepareAppSource only runs on message-seal, so a Set cache isn't
  // worth the hoisting dance of declaring it after the array 1600 lines
  // down the file.
  const missing: string[] = [];
  for (const tag of usedTags) {
    if ((ALLOWED_COMPONENTS as readonly string[]).includes(tag) && !resolved.has(tag)) {
      missing.push(tag);
    }
  }
  if (missing.length === 0) return code;
  missing.sort();

  // Merge into an existing `@gradeui/ui` import if one's present, else
  // prepend a new one at the top of the file. `rewriteLocalComponentImports`
  // has already collapsed any legacy paths into a single barrel import
  // by the time we run, so there's at most one import to touch.
  const gradeImportRx =
    /import\s*\{\s*([^}]+?)\s*\}\s*from\s*["']@gradeui\/ui["'];?/;
  const gradeMatch = code.match(gradeImportRx);
  if (gradeMatch) {
    const existing = new Set(
      gradeMatch[1].split(",").map((raw) => raw.trim()).filter(Boolean)
    );
    for (const name of missing) existing.add(name);
    const merged = Array.from(existing).sort();
    return code.replace(
      gradeImportRx,
      `import { ${merged.join(", ")} } from "@gradeui/ui";`
    );
  }
  return `import { ${missing.join(", ")} } from "@gradeui/ui";\n${code}`;
}

/**
 * Make sure the snippet exports a default React component so Sandpack's
 *   import App from "./App"
 * resolves to something callable. The model emits any of these shapes:
 *
 *   1. A proper module with `export default` — pass through.
 *   2. A bare JSX expression (`<Card>…</Card>`) — wrap in an App component.
 *   3. A named `function Foo(...)` without the default export — append one.
 *   4. Anything else — append `export default App` as a last-ditch guess.
 *
 * Also applies `repairMultilineStrings` to defuse the classic LLM bug of
 * wrapping long className attributes across lines,
 * `rewriteLocalComponentImports` so legacy `./components/ui/<name>`
 * paths resolve to the real `@gradeui/ui` npm package, and
 * `autoImportGradeComponents` so a `<Flex>` the model forgot to import
 * doesn't blow up the preview. Without those passes the iframe throws:
 *   "Element type is invalid … got: undefined. You likely forgot to export
 *    your component from the file it's defined in …"
 * or
 *   "Unterminated string constant"
 * or
 *   "Flex is not defined"
 * all of which Sandpack prints as a red "Something went wrong" panel.
 */
export function prepareAppSource(code: string): string {
  const rewritten = rewriteLocalComponentImports(code);
  const autoImported = autoImportGradeComponents(rewritten);
  const repaired = repairMultilineStrings(autoImported);
  const trimmed = repaired.trim();
  if (!trimmed) return `export default function App() { return null }`;

  // Final pipeline tail: media attrs first (existing), then source-id
  // injection (new). Source-id stamps every PascalCase JSX opening
  // tag with `data-gds-source-id="N"`, monotonically. The selection
  // agent reads it on click, and the mutator finds the matching JSX
  // tag in source — robust across `.map()` loops where one source
  // node renders many DOM elements (they all share the same id).
  const finalise = (src: string): string =>
    injectSourceIds(injectMediaSourceAttrs(src));

  // Already a proper module — leave alone…ish. Still run the media-
  // source-attr injection so the iframe's `@gradeui/ui@<npm>` MediaSurface
  // (which doesn't yet emit `data-media-source` natively) gets the
  // attribute via its `...props` spread. See `injectMediaSourceAttrs`
  // for the why; the transform is idempotent and a no-op on screens
  // with no MediaSurfaces.
  if (/export\s+default\s+/.test(trimmed)) {
    return finalise(trimmed);
  }

  // Bare JSX expression — wrap it in a component.
  if (trimmed.startsWith("<")) {
    const wrapped = `export default function App() {\n  return (\n${trimmed
      .split("\n")
      .map((l) => "    " + l)
      .join("\n")}\n  )\n}`;
    return finalise(wrapped);
  }

  // Named function — append default export.
  const fnMatch = trimmed.match(/function\s+([A-Z][A-Za-z0-9_]*)/);
  if (fnMatch) {
    return finalise(`${trimmed}\n\nexport default ${fnMatch[1]}`);
  }

  // Fallback: wrap whatever we got.
  return finalise(`${trimmed}\n\nexport default App`);
}

/**
 * Inject `data-gds-source-id="N"` onto every PascalCase JSX opening
 * tag in `source`, with a monotonic counter starting at 0. The id
 * uniquely identifies the JSX node in source — so the selection
 * mutator can find "the Stack you clicked" by id instead of by
 * counting matches (which broke for loops, where one source node
 * renders many DOM nodes that all need to share one id).
 *
 * Idempotency: when a tag already has a `data-gds-source-id`, the
 * existing value is preserved and the counter is advanced past it
 * so newly-injected ids stay unique.
 *
 * Caveats:
 *   - We use a regex tag scanner that mirrors `findComponentOpenTag`'s
 *     name pattern + brace/string-aware attrs walk. Strings or
 *     comments containing `<Foo>`-like substrings could be falsely
 *     matched — same vulnerability as the rest of the mutator stack,
 *     and rare in real assistant output.
 *   - PascalCase only — `<div>` and friends are skipped, which is
 *     what we want (the inspector only operates on DS components).
 */
export function injectSourceIds(source: string): string {
  // Match every JSX/HTML opening tag — both PascalCase DS components
  // (<Stack>, <Card>) AND lowercase HTML tags (<div>, <section>).
  // The expanded match is what lets the inspector edit raw <div>s
  // via the Spacing & layout controls, which is the v1 escape
  // hatch when the assistant still emits Tailwind soup instead of
  // a DS primitive.
  //
  // The `[A-Za-z]` first-char filter intentionally excludes `<!`
  // (HTML comments, doctypes) and the angle-brackets-in-string
  // false-positives the rest of the mutator stack tolerates.
  const tagPattern = /<([A-Za-z][A-Za-z0-9_]*)(?=[\s/>])/g;
  const pieces: string[] = [];
  let pos = 0;
  let counter = 0;
  const len = source.length;
  let match: RegExpExecArray | null;
  // Tracks every source-id observed during THIS pass so we can
  // detect collisions. If the model regenerates a turn and copies
  // a chunk of source verbatim (with its existing
  // `data-gds-source-id="N"` attribute), the duplicate node would
  // otherwise sail through the idempotency check and the sibling-
  // overlay query would then match across unrelated JSX nodes —
  // the "two distinct nodes look selected at once" bug. When we
  // see a collision, treat the offending tag as id-less and
  // assign a fresh one.
  const seenIds = new Set<string>();

  while ((match = tagPattern.exec(source)) !== null) {
    const tagStart = match.index;
    const componentName = match[1];
    const attrsStart = tagStart + 1 + componentName.length;

    // Walk forward to the `>` that closes this opening tag, skipping
    // strings and JSX expression depth — same logic as
    // `findComponentOpenTag` in studio-source-mutator.ts. Anything
    // unterminated, we bail on quietly and leave the tag alone.
    let j = attrsStart;
    let depth = 0;
    let inString: '"' | "'" | "`" | null = null;
    let escaped = false;
    let tagEnd = -1;
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
        tagEnd = j;
        break;
      }
      j++;
    }
    if (tagEnd === -1) continue;

    const attrsText = source.slice(attrsStart, tagEnd);

    // Idempotent: preserve any pre-existing id and advance the
    // counter past it so subsequent injections stay unique.
    //
    // Collision handling: if the same id has already been seen
    // this pass, the model duplicated a chunk of source. We can't
    // safely preserve the duplicate (it would break the
    // sourceId → JSX-node-uniqueness contract the sibling-overlay
    // query relies on). Rewrite the duplicate tag's id by
    // stripping the stale attribute from this tag's slice and
    // injecting a fresh one in the regular splice path below.
    const existing = attrsText.match(
      /data-gds-source-id\s*=\s*["']([^"']+)["']/
    );
    if (existing) {
      const id = existing[1];
      if (!seenIds.has(id)) {
        seenIds.add(id);
        const existingNum = Number(id);
        if (Number.isFinite(existingNum) && existingNum >= counter) {
          counter = existingNum + 1;
        }
        continue;
      }
      // Collision — strip the duplicated attribute (and its
      // leading whitespace) from this tag's attrs before
      // splicing in a new id. We emit the source up to
      // `attrsStart`, then the new attr, then we'll need to skip
      // over the stale attr in the next emit. Easiest path: emit
      // the cleaned attrs span explicitly here and advance `pos`
      // past the closing tag entirely so the next iteration
      // doesn't re-emit the stale id.
      const cleanedAttrs = attrsText.replace(
        /\s*data-gds-source-id\s*=\s*["'][^"']+["']/,
        ""
      );
      const newId = String(counter++);
      seenIds.add(newId);
      pieces.push(source.slice(pos, attrsStart));
      pieces.push(` data-gds-source-id="${newId}"`);
      pieces.push(cleanedAttrs);
      pieces.push(source[tagEnd]); // the `>` itself
      pos = tagEnd + 1;
      continue;
    }

    // Splice ` data-gds-source-id="N"` immediately after the
    // component name. Emit everything from the last cursor position
    // through `attrsStart` unchanged, then the new attribute, then
    // bump the cursor.
    const newId = String(counter++);
    seenIds.add(newId);
    pieces.push(source.slice(pos, attrsStart));
    pieces.push(` data-gds-source-id="${newId}"`);
    pos = attrsStart;
  }

  pieces.push(source.slice(pos));
  return pieces.join("");
}

// ─────────────────────────────────────────────────────────────────────
// Fonts + Sandpack external resources
//
// Everything that mounts a SandpackProvider — /studio's StudioPreview,
// /chat's DesignPreview, /play's Sandpack iframe, the inline code editor,
// the template viewer — MUST consume PLAYGROUND_EXTERNAL_RESOURCES as its
// `externalResources` option. Hand-rolling a literal array per-site is how
// we ended up with Tailwind CDN in every iframe but Google Fonts in none.
//
// The Google Fonts `<link>` tag we emit inside /public/index.html is not a
// reliable substitute — Sandpack's iframe sandbox / CSP strips or ignores
// arbitrary stylesheet links in the host HTML, whereas anything listed in
// `externalResources` is injected via the bundler's trusted path.
// ─────────────────────────────────────────────────────────────────────

export const PLAYGROUND_TAILWIND_CDN = "https://cdn.tailwindcss.com";

export const PLAYGROUND_FONTS_URL =
  "https://fonts.googleapis.com/css2" +
  "?family=Geist:wght@100..900" +
  "&family=Geist+Mono:wght@100..900" +
  "&family=Fraunces:ital,wght@0,100..900;1,100..900" +
  "&family=Instrument+Serif:ital@0;1" +
  "&family=Source+Serif+4:ital,wght@0,200..900;1,200..900" +
  "&family=Inter:wght@100..900" +
  "&family=Manrope:wght@200..800" +
  "&family=Figtree:wght@300..900" +
  "&family=DM+Sans:ital,wght@0,100..1000;1,100..1000" +
  "&family=Lexend:wght@100..900" +
  "&family=Outfit:wght@100..900" +
  "&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800" +
  "&family=Space+Grotesk:wght@300..700" +
  "&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800" +
  "&family=IBM+Plex+Mono:wght@400;500;600" +
  "&display=swap";

export const PLAYGROUND_FONT_VARS = `
        --font-geist: "Geist", "Geist Fallback", system-ui, sans-serif;
        --font-jetbrains-mono: "JetBrains Mono", ui-monospace, monospace;
        --font-geist-mono: "Geist Mono", "JetBrains Mono", ui-monospace, monospace;
        --font-inter: "Inter", system-ui, sans-serif;
        --font-manrope: "Manrope", system-ui, sans-serif;
        --font-figtree: "Figtree", system-ui, sans-serif;
        --font-dm-sans: "DM Sans", system-ui, sans-serif;
        --font-lexend: "Lexend", system-ui, sans-serif;
        --font-outfit: "Outfit", system-ui, sans-serif;
        --font-plus-jakarta: "Plus Jakarta Sans", system-ui, sans-serif;
        --font-space-grotesk: "Space Grotesk", system-ui, sans-serif;
        --font-fraunces: "Fraunces", Georgia, serif;
        --font-instrument-serif: "Instrument Serif", Georgia, serif;
        --font-source-serif: "Source Serif 4", Georgia, serif;
        --font-ibm-plex-mono: "IBM Plex Mono", ui-monospace, monospace;`;

/**
 * The definitive list of external resources every Grade Sandpack iframe
 * must pull in. Keep this the single source of truth — if you need
 * another CDN script or stylesheet in the preview, add it here and every
 * consumer picks it up for free.
 */
export const PLAYGROUND_EXTERNAL_RESOURCES: readonly string[] = [
  PLAYGROUND_TAILWIND_CDN,
  PLAYGROUND_FONTS_URL,
];

/**
 * The Sandpack `customSetup.dependencies` map every Grade preview uses.
 * Every consumer (play, studio, design chat, code editor, template viewer)
 * should pass this instead of hand-writing the map — otherwise a future
 * dependency bump has to chase five sites.
 *
 * `@gradeui/ui` is the ACTUAL published design system. Pulling it in
 * from npm (rather than shipping hand-simplified copies of Button/Input/
 * Checkbox etc.) is the only way to guarantee 1:1 parity with what a
 * consumer sees — if the Sandpack preview renders something different
 * from the real package, we're lying to the user about how their theme
 * will look.
 *
 * The other entries are kept so user JSX that imports them directly
 * (e.g. `import { Mail } from "lucide-react"`, `import { cn } from
 * "tailwind-merge"`) still resolves. `recharts` is pinned for chart
 * generation. `react` + `react-dom` are provided by the Sandpack
 * template so they don't go here.
 *
 * We PIN @gradeui/ui to an EXACT version rather than `latest` or a caret
 * range. Two reasons:
 *
 *   1. Cache: Sandpack's bundler (CodeSandbox CSB-services) caches
 *      dist-tag resolutions aggressively — once a browser session has
 *      resolved `latest → 0.6.0` it keeps using that tarball even after
 *      we publish 0.7.0, which shows up as "Element type is invalid"
 *      when the model emits a component added in the newer version.
 *   2. Resolver bugs: CSB's resolver has intermittently returned null
 *      from the manifest fetcher when given a caret range against a very
 *      recently published version, surfacing as "Cannot read properties
 *      of null (reading 'match')". An exact version sidesteps the
 *      semver-range path entirely.
 *
 * Bump this when a new minor/major lands and the newly exported
 * components need to be reachable in Studio.
 */
export const PLAYGROUND_DEPENDENCIES: Readonly<Record<string, string>> = {
  "@gradeui/ui": "0.10.0",
  "class-variance-authority": "^0.7.0",
  clsx: "^2.0.0",
  "tailwind-merge": "^2.0.0",
  "lucide-react": "^0.300.0",
  recharts: "^2.12.0",
  // `canvas-confetti` — one of those dependencies where a grown-up mentions
  // "whimsy" and everyone nods. Tiny runtime (~12KB), declarative API
  // (`confetti()`), nothing to clean up. Reach for it when a scaffold wants
  // to celebrate something — checkout success, form submission, a won game.
  "canvas-confetti": "^1.9.3",
  // `three` and `postprocessing` are NOT listed here because they're regular
  // (non-optional) deps of @gradeui/ui and npm pulls them in transitively.
  //
  // RivePlayer is intentionally NOT surfaced in Studio — its @rive-app/react-canvas
  // runtime adds ~900KB to every sandbox boot and we're not pushing Rive as a
  // studio-first primitive. Consumers installing @gradeui/ui directly can still
  // use it by adding the optional dep themselves.
};

// ─────────────────────────────────────────────────────────────────────
// Theme vars
// ─────────────────────────────────────────────────────────────────────

export function formatThemeVars(
  theme: GeneratedTheme,
  mode: "light" | "dark"
): string {
  const vars = themeToCSSVars(theme, mode);
  return Object.entries(vars)
    .map(([key, value]) => `        ${key}: ${value};`)
    .join("\n");
}

// ─────────────────────────────────────────────────────────────────────
// HTML / CSS builders
// ─────────────────────────────────────────────────────────────────────

export function buildPlaygroundIndexHtml(
  lightVars: string,
  darkVars: string,
  mode: "light" | "dark",
  components: { buttonShape: string; inputStyle: string; cardStyle: string }
): string {
  // NOTE on mode class + data-* attrs: we used to stamp them directly on
  // the <html> tag here (e.g. `class="dark" data-button-shape="rounded"`).
  // That worked for the first paint but broke live updates — Sandpack
  // serves /public/index.html ONCE at iframe boot and never reloads it,
  // so slider flips in the theme builder didn't visibly change anything
  // in the preview (even though the CodeSandbox *export* was correct,
  // because that spins up a fresh iframe with the new HTML).
  //
  // Both mode and component options are now applied at runtime from
  // /index.tsx, which lives inside Sandpack's JS bundle graph and does
  // hot-reload. We still emit the attrs here as INITIAL values so the
  // first paint doesn't flash the wrong shape before the bundle loads.
  const htmlClass = mode === "dark" ? ' class="dark"' : "";
  const dataAttrs = ` data-button-shape="${components.buttonShape}" data-input-style="${components.inputStyle}" data-card-style="${components.cardStyle}"`;
  return `<!DOCTYPE html>
<html lang="en"${htmlClass}${dataAttrs}>
  <head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="${PLAYGROUND_FONTS_URL}">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Grade DS Chat Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              border: "oklch(var(--border) / <alpha-value>)",
              input: "oklch(var(--input) / <alpha-value>)",
              ring: "oklch(var(--ring) / <alpha-value>)",
              background: "oklch(var(--background) / <alpha-value>)",
              foreground: "oklch(var(--foreground) / <alpha-value>)",
              primary: {
                DEFAULT: "oklch(var(--primary) / <alpha-value>)",
                foreground: "oklch(var(--primary-foreground) / <alpha-value>)",
              },
              secondary: {
                DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
                foreground: "oklch(var(--secondary-foreground) / <alpha-value>)",
              },
              destructive: {
                DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
                foreground: "oklch(var(--destructive-foreground) / <alpha-value>)",
                soft: "oklch(var(--destructive-soft) / <alpha-value>)",
                deep: "oklch(var(--destructive-deep) / <alpha-value>)",
              },
              muted: {
                DEFAULT: "oklch(var(--muted) / <alpha-value>)",
                foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
              },
              accent: {
                DEFAULT: "oklch(var(--accent) / <alpha-value>)",
                foreground: "oklch(var(--accent-foreground) / <alpha-value>)",
              },
              popover: {
                DEFAULT: "oklch(var(--popover) / <alpha-value>)",
                foreground: "oklch(var(--popover-foreground) / <alpha-value>)",
              },
              card: {
                DEFAULT: "oklch(var(--card) / <alpha-value>)",
                foreground: "oklch(var(--card-foreground) / <alpha-value>)",
              },
              // Status colors expose -soft (surface) + -deep (text/icon)
              // siblings. Keep these in sync with tailwind-preset.ts.
              success: {
                DEFAULT: "oklch(var(--success) / <alpha-value>)",
                soft: "oklch(var(--success-soft) / <alpha-value>)",
                deep: "oklch(var(--success-deep) / <alpha-value>)",
              },
              warning: {
                DEFAULT: "oklch(var(--warning) / <alpha-value>)",
                soft: "oklch(var(--warning-soft) / <alpha-value>)",
                deep: "oklch(var(--warning-deep) / <alpha-value>)",
              },
              info: {
                DEFAULT: "oklch(var(--info) / <alpha-value>)",
                soft: "oklch(var(--info-soft) / <alpha-value>)",
                deep: "oklch(var(--info-deep) / <alpha-value>)",
              },
              highlight: {
                DEFAULT: "oklch(var(--highlight) / <alpha-value>)",
                soft: "oklch(var(--highlight-soft) / <alpha-value>)",
                deep: "oklch(var(--highlight-deep) / <alpha-value>)",
              },
            },
            borderRadius: {
              lg: "var(--radius)",
              md: "calc(var(--radius) - 2px)",
              sm: "calc(var(--radius) - 4px)",
            },
          },
        },
      }
    </script>
    <style>
      :root {
${PLAYGROUND_FONT_VARS}
${lightVars}
      }
      .dark {
${darkVars}
      }
      * { border-color: oklch(var(--border)); }
      body {
        background-color: oklch(var(--background));
        color: oklch(var(--foreground));
        font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
        margin: 0;
      }
      /* Form controls don't inherit font-family from body by default — every
         browser's user-agent stylesheet plants its own. Without this reset
         <Button>, <Input>, <Select>, <Textarea> render in the system font
         while the rest of the page obeys --font-sans. Mirrors Tailwind's
         preflight, but explicit so we don't rely on CDN preflight timing. */
      button, input, optgroup, select, textarea {
        font-family: inherit;
        font-feature-settings: inherit;
        font-variation-settings: inherit;
        font-size: 100%;
        font-weight: inherit;
        line-height: inherit;
        color: inherit;
      }
      h1, h2, h3, h4 {
        font-family: var(--font-display, var(--font-sans));
        font-weight: var(--font-heading-weight, 600);
        letter-spacing: var(--font-heading-tracking, -0.01em);
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────
// Selection agent — the small piece of logic that lives INSIDE the
// Sandpack iframe and powers "click an element → chip in chat" flow in
// /studio.
//
// HISTORY: this used to be a bare `<script>` tag injected into
// /public/index.html. Moved into the JS bundle graph as a side-effect
// module imported from /index.tsx because Sandpack's CRA runtime
// (react-scripts 4) did not reliably preserve inline body scripts in
// the remote iframe — the HTML round-trip worked for head-level
// <script src=...> tags (Tailwind CDN loaded fine) but inline
// IIFEs at the end of body were silently dropped, so the agent never
// ran, the parent-to-iframe messages landed against a missing
// listener, and the select pill did nothing. Bundling it guarantees
// the code actually executes in the iframe.
//
// Protocol (window.postMessage, both directions):
//
//   parent → iframe
//     { type: "grade:select-mode", enabled: boolean }
//       Enter / leave selection mode. In select mode the agent paints a
//       hover outline, swallows the next click, and ships the captured
//       element's shape back up.
//
//     { type: "grade:clear-selection" }
//       Drop any current outline without changing enabled state. Fires
//       when the chat input's chip is X'd off.
//
//   iframe → parent
//     { type: "grade:agent-ready" }
//       One-shot ping at boot so the parent knows it's safe to start
//       sending messages (otherwise the first toggle might land before
//       the listener attaches).
//
//     { type: "grade:selected", selection: { tag, text, outerHTML, rect } }
//       User clicked in select mode. `text` is a trimmed, truncated
//       innerText (for the chat chip label). `outerHTML` is truncated
//       to ~500 chars (the system prompt includes this verbatim so the
//       model knows what the user is pointing at). `rect` is in viewport
//       coords (not page coords — only used by the parent for debugging).
//
// The agent ignores clicks on <body>, <html>, and #root so the user
// can't "select the whole frame". It also ignores its own overlay.
// ─────────────────────────────────────────────────────────────────────

const PLAYGROUND_SELECTION_AGENT_TSX = `// Runs once per iframe boot as a side-effect import from /index.tsx.
// No React, no JSX — pure DOM + postMessage so the agent is up the
// moment the bundle loads, independent of the React root's state.

type SelectionPayload = {
  tag: string;
  text: string;
  outerHTML: string;
  rect: { x: number; y: number; width: number; height: number };
  // Design-system identification. When the click target is inside a gradeui
  // component (every DS component emits data-gds-part="<kebab-name>" on its
  // root), we walk up to that boundary and report the PART + its PascalCase
  // identifier. The chat chip + system prompt prefer these over the raw tag
  // name so the agent knows it's editing <ThreeScene>, not the inner <canvas>.
  part?: string;
  componentName?: string;
};

// "three-scene" → "ThreeScene". Small enough to inline; runs once per click.
function kebabToPascal(kebab: string): string {
  return kebab
    .split(/-+/)
    .filter(Boolean)
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join("");
}

// Parts that live INSIDE another DS component rather than being their own
// JSX component. Clicking them should resolve to the enclosing component,
// not to a phantom name like "ShaderCanvas" that doesn't exist in source.
//
// Example: <ThreeScene> renders a <canvas> with data-gds-part="shader-canvas"
// inside a host div with data-gds-part="three-scene". Without this list,
// clicking the canvas pinned the settings panel to <ShaderCanvas>, which the
// source mutator can never find.
//
// Long-term fix is a library-side data-gds-component attribute on real JSX
// component roots; until then this list stays in sync with what's stamped
// inside @gradeui/ui media components.
const SUB_PART_NAMES = new Set<string>([
  "shader-canvas",
  "scene-poster",
  "scene-controls",
  "video-poster",
  "preset-poster",
  "preset-label",
  "picker-selected-badge",
]);

// Walk up from an element to the nearest "real component" data-gds-part,
// skipping sub-parts. Returns null if the element isn't inside any DS
// component.
function findComponentOwner(el: Element | null): Element | null {
  if (!el || !el.closest) return null;
  let node: Element | null = el.closest("[data-gds-part]") as Element | null;
  while (node) {
    const part = node.getAttribute("data-gds-part") || "";
    if (!SUB_PART_NAMES.has(part)) return node;
    const parent = node.parentElement;
    if (!parent) return null;
    node = parent.closest("[data-gds-part]") as Element | null;
  }
  return null;
}

(function installSelectionAgent() {
  // Guard against double-install (e.g. if HMR somehow re-runs this
  // module). The agent holds document-level listeners; we don't want to
  // double up on them.
  const w = window as unknown as { __gradeSelectionAgentInstalled?: boolean };
  if (w.__gradeSelectionAgentInstalled) return;
  w.__gradeSelectionAgentInstalled = true;

  let enabled = false;
  let overlay: HTMLDivElement | null = null;
  let lastHovered: Element | null = null;

  function ensureOverlay(): HTMLDivElement {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.setAttribute("data-grade-selection-overlay", "");
    overlay.style.cssText = [
      "position:fixed",
      "pointer-events:none",
      "z-index:2147483647",
      "border:2px solid oklch(var(--primary, 0.55 0.22 260))",
      "background:oklch(var(--primary, 0.55 0.22 260) / 0.12)",
      "border-radius:6px",
      "box-shadow:0 0 0 1px oklch(var(--background, 1 0 0) / 0.5) inset",
      "transition:left 80ms ease-out, top 80ms ease-out, width 80ms ease-out, height 80ms ease-out",
      "display:none",
    ].join(";");
    // Body may not exist yet on early boot — defer append until ready.
    if (document.body) {
      document.body.appendChild(overlay);
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        if (overlay && !overlay.isConnected) document.body.appendChild(overlay);
      });
    }
    return overlay;
  }

  function isIgnored(el: Element | null): boolean {
    if (!el || el.nodeType !== 1) return true;
    if (el === document.body || el === document.documentElement) return true;
    if ((el as HTMLElement).id === "root") return true;
    if (el.hasAttribute && el.hasAttribute("data-grade-selection-overlay"))
      return true;
    return false;
  }

  function positionOverlay(el: Element) {
    const ov = ensureOverlay();
    const rect = el.getBoundingClientRect();
    ov.style.left = rect.left + "px";
    ov.style.top = rect.top + "px";
    ov.style.width = rect.width + "px";
    ov.style.height = rect.height + "px";
    ov.style.display = "block";
  }

  function hideOverlay() {
    if (overlay) overlay.style.display = "none";
  }

  function serialize(el: Element): SelectionPayload {
    // Walk up to the nearest DS component boundary. If the click landed
    // inside a <ThreeScene>, <Card>, etc., we want to report the COMPONENT
    // the user conceptually pointed at — not the leaf <div> / <canvas> they
    // happened to hit. Non-DS elements (bare <button>, plain <div>, etc.)
    // have no ancestor with data-gds-part, so \`part\` stays undefined and
    // the chip/prompt fall back to tag-name behaviour. findComponentOwner
    // also skips internal sub-parts (e.g. the canvas stamped with
    // data-gds-part="shader-canvas" inside <ThreeScene>) so the settings
    // panel pins to the real, source-addressable component.
    const partOwner = findComponentOwner(el);
    // Use the part owner's bounding rect + outerHTML when we have one, so
    // overlay positioning and the model's TARGETED EDIT stanza both agree
    // with what the chip is showing.
    const target = partOwner ?? el;
    const part = partOwner
      ? partOwner.getAttribute("data-gds-part") || undefined
      : undefined;
    const componentName = part ? kebabToPascal(part) : undefined;

    const rect = target.getBoundingClientRect();
    const rawText = (
      (target as HTMLElement).innerText ||
      target.textContent ||
      ""
    )
      .replace(/\\s+/g, " ")
      .trim();
    const text = rawText.length > 120 ? rawText.slice(0, 120) + "…" : rawText;
    let outer = target.outerHTML || "";
    if (outer.length > 500) outer = outer.slice(0, 500) + "…";
    return {
      tag: target.tagName ? target.tagName.toLowerCase() : "",
      text,
      outerHTML: outer,
      rect: {
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      part,
      componentName,
    };
  }

  function resolveSelectionTarget(el: Element | null): Element | null {
    if (!el) return null;
    // Prefer the nearest DS component boundary so the overlay + eventual
    // click target both land on what the user conceptually means. Skips
    // internal sub-parts so e.g. the canvas inside <ThreeScene> hands back
    // the ThreeScene host, not the canvas itself.
    const partOwner = findComponentOwner(el);
    return partOwner ?? el;
  }

  function onMouseOver(e: MouseEvent) {
    if (!enabled) return;
    const raw = e.target as Element | null;
    if (isIgnored(raw)) return;
    const target = resolveSelectionTarget(raw);
    if (!target || isIgnored(target)) return;
    lastHovered = target;
    positionOverlay(target);
  }

  function onMouseOut(e: MouseEvent) {
    if (!enabled) return;
    if (e.target === lastHovered) hideOverlay();
  }

  function onClick(e: MouseEvent) {
    if (!enabled) return;
    const raw = e.target as Element | null;
    if (isIgnored(raw)) return;
    const target = resolveSelectionTarget(raw);
    if (!target || isIgnored(target)) return;
    e.preventDefault();
    e.stopPropagation();
    positionOverlay(target);
    try {
      window.parent.postMessage(
        { type: "grade:selected", selection: serialize(target) },
        "*"
      );
    } catch {
      /* parent may be gone / cross-origin refusing — swallow */
    }
  }

  function enable() {
    if (enabled) return;
    enabled = true;
    document.documentElement.style.cursor = "crosshair";
    document.addEventListener("mouseover", onMouseOver, true);
    document.addEventListener("mouseout", onMouseOut, true);
    document.addEventListener("click", onClick, true);
  }

  function disable() {
    if (!enabled) return;
    enabled = false;
    document.documentElement.style.cursor = "";
    document.removeEventListener("mouseover", onMouseOver, true);
    document.removeEventListener("mouseout", onMouseOut, true);
    document.removeEventListener("click", onClick, true);
    hideOverlay();
    lastHovered = null;
  }

  function clear() {
    hideOverlay();
    lastHovered = null;
  }

  window.addEventListener("message", (e: MessageEvent) => {
    const data = e && (e.data as {
      type?: string;
      enabled?: boolean;
      value?: string;
      requestId?: string;
      urls?: Record<string, string>;
    } | null);
    if (!data || typeof data !== "object") return;
    if (data.type === "grade:select-mode") {
      if (data.enabled) enable();
      else disable();
    } else if (data.type === "grade:clear-selection") {
      clear();
    } else if (data.type === "grade:set-fidelity") {
      // Wireframe / full toggle. The CSS lives in playground-styles
      // (look for [data-fidelity="wireframe"] rules) and reads this
      // attribute off the root; flipping it is enough to hide the
      // media-surface content layer and reveal the placeholders
      // beneath. No re-bundle, no re-mount.
      const v = data.value === "wireframe" ? "wireframe" : "full";
      document.documentElement.dataset.fidelity = v;
    } else if (data.type === "grade:set-motion") {
      // Global motion toggle (lib/motion). Stamp / remove data-motion on
      // <html>; the useReducedMotion hook + the [data-motion="off"] CSS
      // reset both react, pausing ThreeScene + stilling CSS animation.
      // Mirrors the Fast sandbox handler — kept in sync per the two-agent
      // rule in STUDIO.md. enabled !== false defaults to motion-on.
      if (data.enabled !== false) {
        document.documentElement.removeAttribute("data-motion");
      } else {
        document.documentElement.setAttribute("data-motion", "off");
      }
    } else if (data.type === "grade:collect-media-sources") {
      // Walk every rendered MediaSurface, harvest the
      // \`data-media-source\` JSON the component stamps on its root
      // (see packages/ui/components/ui/media-surface.tsx). The walker
      // operates on the DOM AFTER React has evaluated the JSX, so a
      // source like \`{ kind: "album", artist: a.artist, title: a.title }\`
      // inside a .map() comes back with the concrete artist/title that
      // each row resolved to — exactly what the static JSX walker can't
      // do.
      const requestId = typeof data.requestId === "string" ? data.requestId : "";
      const nodes = document.querySelectorAll("[data-media-source]");
      const sources: unknown[] = [];
      nodes.forEach((node) => {
        const json = node.getAttribute("data-media-source");
        if (!json) return;
        try {
          const parsed = JSON.parse(json);
          if (parsed && typeof parsed === "object" && "kind" in parsed) {
            sources.push(parsed);
          }
        } catch {
          // Malformed data-media-source on a single element shouldn't
          // tank the whole batch — skip it and keep going.
        }
      });
      try {
        window.parent.postMessage(
          { type: "grade:media-sources", requestId, sources },
          "*"
        );
      } catch {
        /* parent gone — drop */
      }
    } else if (data.type === "grade:set-media-urls") {
      // Studio just resolved a batch of sources. Stash the URL map on
      // the global and tell every MediaSurface to re-read it. Components
      // listen for \`grade:media-urls-updated\` and call setState so the
      // <img> layer paints with the new src.
      const urls = data.urls && typeof data.urls === "object" ? data.urls : {};
      const w = window as unknown as { __gradeMediaUrls?: Record<string, string> };
      w.__gradeMediaUrls = { ...(w.__gradeMediaUrls ?? {}), ...urls };
      try {
        window.dispatchEvent(new Event("grade:media-urls-updated"));
      } catch {
        /* old browsers — no-op */
      }
    }
  });

  // Ping parent once now and again on DOM ready. The parent may have
  // mounted its listener already (first ping wins), or we may have
  // loaded before it did (DOMContentLoaded ping catches that case).
  function ready() {
    try {
      window.parent.postMessage({ type: "grade:agent-ready" }, "*");
    } catch {
      /* ignore */
    }
  }
  ready();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready);
  }
})();

export {};
`;

export function buildPlaygroundStylesCss(lightVars: string, darkVars: string): string {
  return `:root {
${PLAYGROUND_FONT_VARS}
${lightVars}
}

.dark {
${darkVars}
}

*, *::before, *::after {
  box-sizing: border-box;
  border-color: oklch(var(--border));
}

body {
  background-color: oklch(var(--background));
  color: oklch(var(--foreground));
  font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
  margin: 0;
}

/* Form controls don't inherit font-family from body by default — every
   browser's user-agent stylesheet plants its own. Without this reset
   <Button>, <Input>, <Select>, <Textarea> render in the system font
   while the rest of the page obeys --font-sans. */
button, input, optgroup, select, textarea {
  font-family: inherit;
  font-feature-settings: inherit;
  font-variation-settings: inherit;
  font-size: 100%;
  font-weight: inherit;
  line-height: inherit;
  color: inherit;
}

/* Utility fallbacks for components that ship semantic classnames. Tailwind
   CDN's JIT scanner misses classes built at runtime by cva() (Alert, Badge
   etc. all do this), so we hand-author the rules those variants reach for.
   Without these the iframe renders colourless surfaces even though the CSS
   vars + tailwind.config.extend.colors are both in place. */
.bg-primary { background-color: oklch(var(--primary)); }
.bg-primary\\/90 { background-color: oklch(var(--primary) / 0.9); }
.bg-primary\\/80 { background-color: oklch(var(--primary) / 0.8); }
.text-primary { color: oklch(var(--primary)); }
.text-primary-foreground { color: oklch(var(--primary-foreground)); }
.bg-secondary { background-color: oklch(var(--secondary)); }
.text-secondary-foreground { color: oklch(var(--secondary-foreground)); }
.bg-destructive { background-color: oklch(var(--destructive)); }
.text-destructive { color: oklch(var(--destructive)); }
.text-destructive-foreground { color: oklch(var(--destructive-foreground)); }
.bg-muted { background-color: oklch(var(--muted)); }
.text-muted-foreground { color: oklch(var(--muted-foreground)); }
.bg-accent { background-color: oklch(var(--accent)); }
.text-accent-foreground { color: oklch(var(--accent-foreground)); }
.bg-card { background-color: oklch(var(--card)); }
.text-card-foreground { color: oklch(var(--card-foreground)); }
.bg-background { background-color: oklch(var(--background)); }
.text-foreground { color: oklch(var(--foreground)); }
.border-input { border-color: oklch(var(--input)); }
.ring-ring { --tw-ring-color: oklch(var(--ring)); }
.rounded-lg { border-radius: var(--radius); }
.rounded-md { border-radius: calc(var(--radius) - 2px); }
.rounded-sm { border-radius: calc(var(--radius) - 4px); }

/* Status palette — solid + soft (tinted surface) + deep (on-surface text /
   icon) siblings. These back the new Alert variants and any other component
   leaning on deriveAlertPair output. */
.bg-success { background-color: oklch(var(--success)); }
.text-success { color: oklch(var(--success)); }
.bg-success-soft { background-color: oklch(var(--success-soft)); }
.text-success-deep { color: oklch(var(--success-deep)); }
.border-success { border-color: oklch(var(--success)); }
.border-success\\/30 { border-color: oklch(var(--success) / 0.3); }

.bg-warning { background-color: oklch(var(--warning)); }
.text-warning { color: oklch(var(--warning)); }
.bg-warning-soft { background-color: oklch(var(--warning-soft)); }
.text-warning-deep { color: oklch(var(--warning-deep)); }
.border-warning { border-color: oklch(var(--warning)); }
.border-warning\\/30 { border-color: oklch(var(--warning) / 0.3); }

.bg-info { background-color: oklch(var(--info)); }
.text-info { color: oklch(var(--info)); }
.bg-info-soft { background-color: oklch(var(--info-soft)); }
.text-info-deep { color: oklch(var(--info-deep)); }
.border-info { border-color: oklch(var(--info)); }
.border-info\\/30 { border-color: oklch(var(--info) / 0.3); }

.bg-highlight { background-color: oklch(var(--highlight)); }
.text-highlight { color: oklch(var(--highlight)); }
.bg-highlight-soft { background-color: oklch(var(--highlight-soft)); }
.text-highlight-deep { color: oklch(var(--highlight-deep)); }
.border-highlight { border-color: oklch(var(--highlight)); }
.border-highlight\\/30 { border-color: oklch(var(--highlight) / 0.3); }

.bg-destructive-soft { background-color: oklch(var(--destructive-soft)); }
.text-destructive-deep { color: oklch(var(--destructive-deep)); }
.border-destructive\\/30 { border-color: oklch(var(--destructive) / 0.3); }

/* Opacity scale — safelisted because the Studio inspector edits these
   tokens at runtime (the Appearance group's Opacity dropdown), and
   the Play CDN's JIT scan can race the React re-render that injects
   a new className. Pre-emitting every step of OPACITY_SCALE means
   the rule is already in the cascade when the new class lands, so
   the first pick visibly fades the element instead of waiting for
   the next scan tick. Add a new scale entry → add a new line here. */
.opacity-0 { opacity: 0; }
.opacity-5 { opacity: 0.05; }
.opacity-10 { opacity: 0.1; }
.opacity-20 { opacity: 0.2; }
.opacity-30 { opacity: 0.3; }
.opacity-40 { opacity: 0.4; }
.opacity-50 { opacity: 0.5; }
.opacity-60 { opacity: 0.6; }
.opacity-70 { opacity: 0.7; }
.opacity-80 { opacity: 0.8; }
.opacity-90 { opacity: 0.9; }
.opacity-100 { opacity: 1; }

/* Font weight scale — same safelist reasoning as Opacity above. The
   Appearance group's Font weight dropdown writes font-{thin..black}
   onto a heading or Button at runtime; pre-emitting every value
   stops the JIT race from making the first pick look like a no-op. */
.font-thin { font-weight: 100; }
.font-extralight { font-weight: 200; }
.font-light { font-weight: 300; }
.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
.font-extrabold { font-weight: 800; }
.font-black { font-weight: 900; }

/* Font size scale — same safelist reasoning. The Appearance group's
   Font size dropdown writes text-{xs..5xl} onto a heading at
   runtime. Values lifted from Tailwind's default scale (rem × 1rem
   = 16px) plus matching line-heights. */
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-base { font-size: 1rem; line-height: 1.5rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
.text-5xl { font-size: 3rem; line-height: 1; }

/* Interactive-state fallbacks — Tailwind CDN's JIT scanner misses classes
   inside cva() template strings (same failure mode as the base-color
   fallbacks above). That's harmless for the initial paint, but it also
   means hover:, focus-visible: and disabled: variants never get generated
   at all, so buttons, inputs, links etc. looked "dead" on interaction.
   Hand-author them here so state transitions honour the theme tokens. */

/* Hover — buttons */
.hover\\:bg-primary\\/90:hover { background-color: oklch(var(--primary) / 0.9); }
.hover\\:bg-primary\\/80:hover { background-color: oklch(var(--primary) / 0.8); }
.hover\\:bg-secondary\\/80:hover { background-color: oklch(var(--secondary) / 0.8); }
.hover\\:bg-destructive\\/90:hover { background-color: oklch(var(--destructive) / 0.9); }
.hover\\:bg-destructive\\/80:hover { background-color: oklch(var(--destructive) / 0.8); }
.hover\\:bg-accent:hover { background-color: oklch(var(--accent)); }
.hover\\:bg-muted\\/50:hover { background-color: oklch(var(--muted) / 0.5); }
.hover\\:text-accent-foreground:hover { color: oklch(var(--accent-foreground)); }
.hover\\:text-foreground:hover { color: oklch(var(--foreground)); }
.hover\\:underline:hover { text-decoration-line: underline; }
.hover\\:opacity-100:hover { opacity: 1; }

/* Focus — simplified to a box-shadow ring. The real Tailwind ring stack
   is a layered set of CSS vars (--tw-ring-offset-shadow + --tw-ring-shadow
   composed into box-shadow); reproducing that verbatim inside this
   fallback is brittle and easy to desync. A single box-shadow ring using
   --ring matches the visual intent of every focus style in our components
   — and stays legible regardless of whether Tailwind's ring vars got
   generated. */
.focus\\:outline-none:focus,
.focus-visible\\:outline-none:focus-visible {
  outline: 2px solid transparent;
  outline-offset: 2px;
}
/* Kill the native user-agent outline on form controls. Our components
   declare focus-visible outline-none plus focus-visible ring-1 ring-ring
   so keyboard focus already draws the themed ring — but mouse-click
   focus fires :focus (not :focus-visible), which means neither rule
   applies and browsers fall back to their default blue ring. That read
   as a bug ("input focus color is wrong") because it ignored the theme.
   This reset keeps the native ring OFF while still letting
   :focus-visible draw our box-shadow ring for keyboard users. Same
   effect as Tailwind v4 preflight, which zeroes outlines globally. */
button:focus, input:focus, select:focus, textarea:focus,
[role="button"]:focus, [role="checkbox"]:focus, [role="switch"]:focus,
[role="radio"]:focus, [role="tab"]:focus, [role="menuitem"]:focus {
  outline: none;
}
.focus-visible\\:ring-1:focus-visible {
  box-shadow: 0 0 0 1px oklch(var(--ring));
}
.focus-visible\\:ring-2:focus-visible {
  box-shadow: 0 0 0 2px oklch(var(--ring));
}
.focus\\:ring-2:focus {
  box-shadow: 0 0 0 2px oklch(var(--ring));
}
.focus-visible\\:ring-ring:focus-visible,
.focus\\:ring-ring:focus {
  /* ring-ring is purely a colour utility; the ring-1/ring-2 rules above
     already use oklch(var(--ring)) so this is a no-op, but keep the
     selector present so nothing cascades over it. */
}
.focus\\:ring-offset-2:focus {
  /* Offset would normally be achieved via a second box-shadow layer in
     the --tw-ring stack. In the fallback we just leave the ring flush;
     drop this rule or extend the ring rule if we ever want true offset. */
}

/* Disabled */
.disabled\\:cursor-not-allowed:disabled { cursor: not-allowed; }
.disabled\\:opacity-50:disabled { opacity: 0.5; }
.disabled\\:pointer-events-none:disabled { pointer-events: none; }

/* peer-disabled:* — needs a sibling .peer input being :disabled, which is
   how <Label> dims when its <Input> is disabled. Tailwind generates
   .peer:disabled ~ .peer-disabled\\:* for these. */
.peer:disabled ~ .peer-disabled\\:cursor-not-allowed { cursor: not-allowed; }
.peer:disabled ~ .peer-disabled\\:opacity-50 { opacity: 0.5; }
.peer:disabled ~ .peer-disabled\\:opacity-70 { opacity: 0.7; }
`;
}

// ─────────────────────────────────────────────────────────────────────
// Component source files (legacy — hand-simplified copies of the real
// components, kept around only for the STANDALONE HTML download path.
//
// The in-page Sandpack preview and Studio no longer use these; they now
// install `@gradeui/ui` from npm (see PLAYGROUND_DEPENDENCIES) so the
// iframe gets byte-for-byte the same Button/Input/Checkbox every npm
// consumer does. That gives us real 1:1 parity — the whole point of the
// design system.
//
// The only remaining consumer is lib/chat-export.ts, which produces a
// single-file .html downloadable: no bundler, no npm install, just
// Babel Standalone + an importmap of data: URLs. That path CAN'T reach
// npm, so it falls back to these inlined sources. When a user exports
// a design as HTML, they get these copies — acceptable trade-off for
// an offline download, not acceptable for the live theme preview.
// ─────────────────────────────────────────────────────────────────────

export const componentFiles: Record<string, string> = {
  "/components/ui/button.tsx": `import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
)
Button.displayName = "Button"

export { Button, buttonVariants }`,

  "/components/ui/card.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-xl border bg-card text-card-foreground shadow", className)} {...props} />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }`,

  "/components/ui/input.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

// Kept in 1:1 class parity with packages/ui/components/ui/input.tsx so the
// Sandpack preview and the published component render the same chrome.
// The focus outline reset in the sandpack fallback CSS is what actually
// makes the themed ring win over the browser's native blue outline on
// mouse click — this class list is just the Tailwind intent.
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        // Use explicit pl-3 + pr-3 instead of the px-3 shorthand so
        // consumer overrides like \`pl-7\` (search input with a leading
        // icon) win via twMerge. twMerge doesn't dedupe px-* vs pl-*
        // (separate conflict groups), so a leftover px-3 would override
        // pl-7 via CSS source order. Kept in 1:1 parity with
        // packages/ui/components/ui/input.tsx.
        "flex h-9 w-full rounded-md border border-input bg-transparent pl-3 pr-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
)
Input.displayName = "Input"

export { Input }`,

  "/components/ui/label.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
      {...props}
    />
  )
)
Label.displayName = "Label"

export { Label }`,

  "/components/ui/callout.tsx": `import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

// Kept in sync with the real Callout in packages/ui/components/ui/callout.tsx.
// Renamed from Alert (May 2026) — the old name implied modal/interruptive
// behaviour the component doesn't have. \`Alert\` is reserved for a future
// blocking primitive; current modal-alert semantics live in <Dialog>.
// The \`highlight\` variant was dropped in the same change — it overlapped
// \`warning\` semantically without a distinct intent.
const calloutVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground [&>svg]:text-foreground",
        destructive: "border-destructive/30 bg-destructive-soft text-destructive-deep [&>svg]:text-destructive-deep",
        success: "border-success/30 bg-success-soft text-success-deep [&>svg]:text-success-deep",
        warning: "border-warning/30 bg-warning-soft text-warning-deep [&>svg]:text-warning-deep",
        info: "border-info/30 bg-info-soft text-info-deep [&>svg]:text-info-deep",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

// role="alert" (assertive) for warning/destructive; role="status" (polite)
// for ambient variants so screen readers don't interrupt for confirmations.
const ROLE_BY_VARIANT = {
  destructive: "alert", warning: "alert",
  info: "status", success: "status", default: "status",
}

const Callout = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof calloutVariants>>(
  ({ className, variant, role, ...props }, ref) => (
    <div
      ref={ref}
      role={role ?? ROLE_BY_VARIANT[(variant ?? "default")]}
      data-gds-part="callout"
      className={cn(calloutVariants({ variant }), className)}
      {...props}
    />
  )
)
Callout.displayName = "Callout"

const CalloutTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} data-gds-part="callout-title" className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />
  )
)
CalloutTitle.displayName = "CalloutTitle"

const CalloutDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} data-gds-part="callout-description" className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
  )
)
CalloutDescription.displayName = "CalloutDescription"

export { Callout, CalloutTitle, CalloutDescription }`,

  "/components/ui/badge.tsx": `import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-green-500 text-white shadow hover:bg-green-600",
        warning: "border-transparent bg-yellow-500 text-white shadow hover:bg-yellow-600",
        info: "border-transparent bg-blue-500 text-white shadow hover:bg-blue-600",
        energy: "border-transparent bg-yellow-400 text-yellow-900 shadow hover:bg-yellow-500",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }`,

  "/components/ui/dialog.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

const Dialog = ({ children, ...props }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false)
  return (
    <div {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { open, setOpen })
        }
        return child
      })}
    </div>
  )
}

const DialogTrigger = ({ children, asChild, open, setOpen }: any) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, { onClick: () => setOpen(true) })
  }
  return <button onClick={() => setOpen(true)}>{children}</button>
}

const DialogContent = ({ children, className, open, setOpen }: any) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div className={cn("relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg", className)}>
        <button onClick={() => setOpen(false)} className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">✕</button>
        {children}
      </div>
    </div>
  )
}

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
)

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)

const DialogTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
)

const DialogDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
)

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription }`,

  "/components/ui/textarea.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = "Textarea"

export { Textarea }`,

  "/components/ui/separator.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
  decorative?: boolean
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
    <div
      ref={ref}
      role={decorative ? "none" : "separator"}
      aria-orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = "Separator"

export { Separator }`,

  "/components/ui/progress.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className)}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: "translateX(-" + (100 - Math.max(0, Math.min(100, value))) + "%)" }}
      />
    </div>
  )
)
Progress.displayName = "Progress"

export { Progress }`,

  "/components/ui/checkbox.tsx": `import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "../../lib/utils"

// Dual-mode (controlled + uncontrolled) checkbox. The real library uses
// Radix Checkbox which handles this automatically; here we re-implement
// the dual-mode logic manually because Radix isn't bundled into the
// Sandpack deps (it ships as @gradeui/ui's transitive deps when you
// install for real). Without this dual-mode path a model-emitted bare
// <Checkbox /> would render but never toggle on click — the previous
// version forwarded checked={undefined} and no internal state ever
// flipped, so the visual stayed unchecked no matter how many times you
// clicked. This caused the "checkbox doesn't work" bug in /studio.
export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  onCheckedChange?: (checked: boolean) => void
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  defaultChecked?: boolean
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, checked, defaultChecked, ...props }, ref) => {
    const isControlled = checked !== undefined
    const [internal, setInternal] = React.useState<boolean>(
      Boolean(defaultChecked)
    )
    const current = isControlled ? Boolean(checked) : internal
    return (
      <label className="inline-flex items-center">
        <input
          ref={ref}
          type="checkbox"
          className="peer sr-only"
          {...(isControlled ? { checked: current } : { defaultChecked: Boolean(defaultChecked) })}
          onChange={(e) => {
            if (!isControlled) setInternal(e.target.checked)
            onCheckedChange?.(e.target.checked)
            onChange?.(e)
          }}
          {...props}
        />
        <span
          className={cn(
            // Fixed 3px radius so the checkbox always reads as a rounded
            // square — mirrors the real component. Using rounded-sm here
            // (which derives from --radius) would turn the 4x4 box circular
            // under pill/round themes and it'd look like a radio button.
            // Kept hand-authored literal so it tracks the real component,
            // not the active theme radius.
            "h-4 w-4 shrink-0 rounded-[3px] border border-primary shadow-sm flex items-center justify-center cursor-pointer",
            "peer-focus-visible:ring-1 peer-focus-visible:ring-ring",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            current ? "bg-primary text-primary-foreground" : "bg-background",
            className
          )}
        >
          {current ? <Check className="h-3 w-3" /> : null}
        </span>
      </label>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }`,

  "/components/ui/switch.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, onChange, checked, ...props }, ref) => (
    <label className="inline-flex items-center">
      <input
        ref={ref}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => {
          onCheckedChange?.(e.target.checked)
          onChange?.(e)
        }}
        {...props}
      />
      <span
        className={cn(
          "relative inline-flex h-5 w-9 items-center rounded-full border border-transparent transition-colors",
          "peer-focus-visible:ring-1 peer-focus-visible:ring-ring",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          checked ? "bg-primary" : "bg-muted",
          className
        )}
      >
        <span
          className={cn(
            "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </span>
    </label>
  )
)
Switch.displayName = "Switch"

export { Switch }`,

  "/components/ui/avatar.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted", className)}
      {...props}
    />
  )
)
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ className, ...props }, ref) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img ref={ref} className={cn("aspect-square h-full w-full object-cover", className)} {...props} />
  )
)
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground", className)}
      {...props}
    />
  )
)
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }`,

  "/components/ui/skeleton.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />
}

export { Skeleton }`,

  "/components/ui/tabs.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

interface TabsContextValue {
  value: string
  setValue: (v: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

const Tabs: React.FC<TabsProps> = ({ defaultValue = "", value, onValueChange, className, children, ...props }) => {
  const [internal, setInternal] = React.useState(defaultValue)
  const current = value ?? internal
  const setValue = (v: string) => {
    if (value === undefined) setInternal(v)
    onValueChange?.(v)
  }
  return (
    <TabsContext.Provider value={{ value: current, setValue }}>
      <div className={cn("", className)} {...props}>{children}</div>
    </TabsContext.Provider>
  )
}

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      className={cn("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className)}
      {...props}
    />
  )
)
TabsList.displayName = "TabsList"

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => {
    const ctx = React.useContext(TabsContext)
    if (!ctx) throw new Error("TabsTrigger must be used inside Tabs")
    const active = ctx.value === value
    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={active}
        onClick={() => ctx.setValue(value)}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          active ? "bg-background text-foreground shadow" : "",
          className
        )}
        {...props}
      />
    )
  }
)
TabsTrigger.displayName = "TabsTrigger"

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const ctx = React.useContext(TabsContext)
    if (!ctx) throw new Error("TabsContent must be used inside Tabs")
    if (ctx.value !== value) return null
    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn("mt-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", className)}
        {...props}
      />
    )
  }
)
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }`,

  "/components/ui/select.tsx": `import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"

// Minimal, native-select-backed version for Sandpack. The real Grade Select
// is Radix-based; consumers using <Select>/<SelectItem> get reasonable JSX,
// and children with a 'value' prop become native <option>s.
interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  children?: React.ReactNode
  className?: string
  placeholder?: string
}

const Select: React.FC<SelectProps> = ({
  value,
  defaultValue,
  onValueChange,
  disabled,
  children,
  className,
  placeholder,
}) => {
  const [internal, setInternal] = React.useState(defaultValue ?? "")
  const current = value ?? internal
  return (
    <div className={cn("relative inline-block", className)}>
      <select
        value={current}
        disabled={disabled}
        onChange={(e) => {
          if (value === undefined) setInternal(e.target.value)
          onValueChange?.(e.target.value)
        }}
        className={cn(
          "appearance-none h-9 w-full rounded-md border border-input bg-background px-3 pr-8 text-sm shadow-sm",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        {placeholder && !current ? <option value="" disabled hidden>{placeholder}</option> : null}
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    </div>
  )
}

interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  value: string
}

const SelectItem = React.forwardRef<HTMLOptionElement, SelectItemProps>(
  ({ value, children, ...props }, ref) => (
    <option ref={ref} value={value} {...props}>{children}</option>
  )
)
SelectItem.displayName = "SelectItem"

// These are accepted as passthrough children so the model's Radix-shaped JSX
// compiles without error. They render nothing structural.
const SelectTrigger: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children }) => <>{children}</>
const SelectContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children }) => <>{children}</>
const SelectValue: React.FC<{ placeholder?: string }> = () => null

export { Select, SelectTrigger, SelectContent, SelectValue, SelectItem }`,

  "/components/ui/table.tsx": `import * as React from "react"
import { cn } from "../../lib/utils"

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
)
Table.displayName = "Table"

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
  )
)
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  )
)
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...props} />
  )
)
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)}
      {...props}
    />
  )
)
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn("h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  )
)
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("p-2 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
  )
)
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
  )
)
TableCaption.displayName = "TableCaption"

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }`,

  "/lib/utils.ts": `import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`,
};

/**
 * Re-export the allowlist tables from @gradeui/studio/playbook so existing
 * callers (`import { ALLOWED_COMPONENTS } from "@/lib/chat-sandpack"`) keep
 * working. Single source of truth lives in the playbook package now —
 * keep in sync with `componentFiles` above (the Sandpack virtual filesystem
 * still needs the source for every allowed component).
 */
export {
  ALLOWED_COMPONENTS,
  ALLOWED_EXTERNAL_IMPORTS,
} from "@gradeui/studio/playbook";

// ─────────────────────────────────────────────────────────────────────
// buildSandpackFiles — the single source of truth for what goes into
// a Grade Sandpack iframe.
//
// Every preview surface (/play, /studio, the chat DesignPreview, the
// CodeEditor on component pages, the template viewer) previously
// hand-assembled its own `files` object and duplicated the
// index.tsx / styles.css / index.html fragments. That drift is exactly
// how we ended up with Alert variants rendering colourless in /play
// while working fine in /studio — the two surfaces had diverged.
//
// This helper returns the exact files object to spread into
// <SandpackProvider files={...}>. Consumers decide theme + mode +
// view mode; everything else is centralised here.
// ─────────────────────────────────────────────────────────────────────

/**
 * The minimal entry + styles every Sandpack iframe needs.
 *
 * CRITICAL — import order is the whole ballgame for live theming:
 *   1. `@gradeui/ui/styles.css` ships the library's compiled Tailwind
 *      output + :root defaults. Loaded FIRST so every utility class the
 *      real component emits (bg-primary, rounded-md, focus-visible ring
 *      stack, data-[state=checked]:*, peer-disabled:*, etc.) is already
 *      resolved before theme vars come in.
 *   2. `./styles.css` contains the active theme's CSS variable values —
 *      --primary, --foreground, --font-sans, plus the data-*-shape
 *      overrides. Loaded SECOND so its `:root { --primary: ... }`
 *      declaration wins over the library's default triplet via same-
 *      specificity cascade (last rule wins).
 *
 * Flip the order and the library's built-in defaults would override the
 * user's theme — silently making every preview look identical regardless
 * of slider position.
 */
/**
 * Two-file pattern for the Sandpack entry:
 *
 *   - /index.tsx          — STATIC. Mounts the React root. Never changes
 *                           across theme tweaks, so Sandpack never needs
 *                           to re-execute `createRoot().render()` (which
 *                           would force an iframe reload, because entry
 *                           modules with side-effect top-levels can't be
 *                           hot-patched safely).
 *
 *   - /theme-options.tsx  — VARIES. Exports a wrapper component that
 *                           writes the current mode + component options
 *                           onto <html> via a layout effect. When the
 *                           builder panel changes, this is the only file
 *                           whose content updates, and because it exports
 *                           a React component, react-refresh can patch
 *                           it in place — no full reload, the wrapper
 *                           just re-renders with the new closure values
 *                           and the effect rewrites the attrs.
 *
 * Earlier iteration: we wrote the attrs at the top of /index.tsx. That
 * reached the iframe fine, but changing any component option forced
 * Sandpack to reload the whole preview (because index.tsx is the entry
 * and its top-level side effects can't be HMR'd). Splitting the varying
 * part into a component-exporting module is what makes the update land
 * without a reload.
 *
 * Applied in useLayoutEffect with no deps so it runs synchronously
 * before paint on every render — keeps <html> in lockstep with the
 * panel even if something else in the tree re-renders for unrelated
 * reasons.
 */
const PLAYGROUND_INDEX_TSX = [
  'import React from "react";',
  'import ReactDOM from "react-dom/client";',
  'import "@gradeui/ui/styles.css";',
  'import "./styles.css";',
  // Side-effect import: installs the element-selection agent (hover
  // outline, click capture, postMessage bus). Imported BEFORE the React
  // root so the `grade:agent-ready` ping goes out the door as early as
  // possible — the parent uses it to replay select-mode state across
  // iframe remounts.
  'import "./selection-agent";',
  'import ThemeOptionsApplier from "./theme-options";',
  'import App from "./App";',
  "",
  'ReactDOM.createRoot(document.getElementById("root")!).render(',
  "  <ThemeOptionsApplier>",
  "    <App />",
  "  </ThemeOptionsApplier>",
  ");",
].join("\n");

/**
 * Tiny, deterministic string hash. Used to derive a short signature from
 * the serialized theme vars so the in-iframe ThemeOptionsApplier can
 * stamp it onto `document.documentElement` and — via a MutationObserver —
 * let CSS-var-aware components (ThreeScene, anything else reading
 * `var(--primary)` off the host) know the theme changed. dbj2; not
 * cryptographic, just collision-resistant enough for tick-to-tick diffs.
 */
function themeVarsSignature(lightVars: string, darkVars: string): string {
  const s = lightVars + "\n" + darkVars;
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

function buildPlaygroundThemeOptionsTsx(
  mode: "light" | "dark",
  components: { buttonShape: string; inputStyle: string; cardStyle: string },
  themeSignature: string
): string {
  return [
    'import * as React from "react";',
    "",
    "// These constants are rewritten by the parent app on every slider tick.",
    "// Because this file exports a React component, Sandpack's react-refresh",
    "// integration can hot-patch the module without tearing down the root —",
    "// the wrapper re-renders, the layout effect re-runs, the new attrs land.",
    `const MODE: "light" | "dark" = ${JSON.stringify(mode)};`,
    `const BUTTON_SHAPE = ${JSON.stringify(components.buttonShape)};`,
    `const INPUT_STYLE = ${JSON.stringify(components.inputStyle)};`,
    `const CARD_STYLE = ${JSON.stringify(components.cardStyle)};`,
    "// THEME_SIGNATURE changes whenever ANY CSS-var value changes (hue,",
    "// chroma, radius, etc. — not just the component-shape attrs above).",
    "// Writing it to root.dataset on every render is what lets in-iframe",
    "// palette consumers (notably ThreeScene) notice var-only theme edits",
    "// via their MutationObserver — CSS hot-reloads don't mutate any attr",
    "// by themselves, so without this ThreeScene's shader stays frozen on",
    "// the old primary until a dark/light toggle fires the observer.",
    `const THEME_SIGNATURE = ${JSON.stringify(themeSignature)};`,
    "",
    "export default function ThemeOptionsApplier({",
    "  children,",
    "}: {",
    "  children: React.ReactNode;",
    "}) {",
    "  React.useLayoutEffect(() => {",
    "    const root = document.documentElement;",
    '    root.classList.toggle("dark", MODE === "dark");',
    "    root.dataset.buttonShape = BUTTON_SHAPE;",
    "    root.dataset.inputStyle = INPUT_STYLE;",
    "    root.dataset.cardStyle = CARD_STYLE;",
    "    root.dataset.gdsTheme = THEME_SIGNATURE;",
    "  });",
    "  return <>{children}</>;",
    "}",
    "",
  ].join("\n");
}

export interface BuildSandpackFilesArgs {
  /** Raw JSX the user/model produced. Run through prepareAppSource. Pass
   *  an already-prepared source if you prefer to call prepareAppSource
   *  yourself upstream (e.g. to memoize separately from the files obj). */
  appSource: string;
  /** The theme currently driving the preview — provides CSS var values
   *  and the data-* shape attributes for button/input/card. */
  theme: GeneratedTheme;
  /** Light or dark. Independent of the parent page's mode. */
  mode: "light" | "dark";
  /** When true, treat `appSource` as already normalised and skip the
   *  prepareAppSource pass. Useful when the caller memoizes separately. */
  appSourceIsPrepared?: boolean;
  /** Extra files to merge in after the defaults. Consumers can override
   *  any file (e.g. swap /App.tsx) or add new ones. */
  extraFiles?: Record<string, string>;
}

/**
 * Build the complete Sandpack files object — entry, styles, index.html,
 * App, and every inlined component file. Spread directly into
 * <SandpackProvider files={...}>.
 */
export function buildSandpackFiles({
  appSource,
  theme,
  mode,
  appSourceIsPrepared,
  extraFiles,
}: BuildSandpackFilesArgs): Record<string, string> {
  const lightVars = formatThemeVars(theme, "light");
  const darkVars = formatThemeVars(theme, "dark");
  const themeSignature = themeVarsSignature(lightVars, darkVars);
  const components = {
    buttonShape: theme.components.buttonShape ?? "default",
    inputStyle: theme.components.inputStyle ?? "outlined",
    cardStyle: theme.components.cardStyle ?? "flat",
  };
  // Always rewrite legacy `./components/ui/<name>` imports even when the
  // caller claims the source is pre-prepared — templates/view passes
  // `appSourceIsPrepared: true` (so the bare-JSX + default-export passes
  // are skipped for cleanliness), but their authored template code still
  // has the old local paths that need to resolve to @gradeui/ui now.
  // The rewrite is idempotent, so re-running it after prepareAppSource
  // already ran is a no-op.
  const normalized = appSourceIsPrepared ? appSource : prepareAppSource(appSource);
  const prepared = rewriteLocalComponentImports(normalized);

  // NOTE: no `...componentFiles` spread. The Sandpack iframe now
  // installs `@gradeui/ui` from npm (see PLAYGROUND_DEPENDENCIES) and
  // user JSX imports directly from "@gradeui/ui". Shipping hand-rolled
  // copies of Button/Input/Checkbox alongside that would double-define
  // the modules and invite drift — exactly the drift that motivated the
  // switch ("we dont want closer parity — we want ACTUAL parity").
  //
  // The `componentFiles` export is still used by lib/chat-export.ts's
  // standalone-HTML download path (browser Babel + data: URL importmap),
  // which can't hit npm directly. Keep it exported; just don't mount it
  // in the Sandpack file map here.
  return {
    "/App.tsx": prepared,
    "/public/index.html": buildPlaygroundIndexHtml(lightVars, darkVars, mode, components),
    // Entry module is static across theme tweaks (see PLAYGROUND_INDEX_TSX)
    // so Sandpack never has to reload the iframe. The mode + component
    // option values live in /theme-options.tsx instead — a component
    // module react-refresh can hot-patch in place when the panel changes.
    "/index.tsx": PLAYGROUND_INDEX_TSX,
    // Element-selection agent — bundled side-effect module imported from
    // /index.tsx. Lives in the JS graph (not /public/index.html) so it
    // reliably runs inside Sandpack's cross-origin iframe; see the big
    // comment above PLAYGROUND_SELECTION_AGENT_TSX for why.
    "/selection-agent.ts": PLAYGROUND_SELECTION_AGENT_TSX,
    "/theme-options.tsx": buildPlaygroundThemeOptionsTsx(mode, components, themeSignature),
    "/styles.css": buildPlaygroundStylesCss(lightVars, darkVars),
    ...(extraFiles ?? {}),
  };
}
