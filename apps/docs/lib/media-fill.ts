/**
 * MediaSurface fill walker.
 *
 * Parses a JSX source string with the TypeScript compiler API, finds every
 * `<MediaSurface ... source={...} />` element whose `source` prop is a
 * **fully static** object literal, and produces (a) the descriptors to
 * resolve via @gradeui/media's source router and (b) the position info to
 * patch each element with `src="..."` once resolution returns.
 *
 * Scope of v1 — static literals only:
 *   FILLABLE      → source={{ kind: "album", artist: "Daft Punk", title: "Discovery" }}
 *   NOT FILLABLE  → source={{ kind: "album", artist: a.artist, title: a.title }}
 *   NOT FILLABLE  → source={someDescriptor}
 *
 * Dynamic sources (variable references, template strings with embedded
 * expressions, spreads) are reported as `unresolvable` so the route can
 * tell the caller how many slots were skipped. The full architecture for
 * filling dynamic sources is a context provider + DOM-discovery flow —
 * deferred. The static path handles every chat-generated screen where the
 * model embedded literal data, which is the common case.
 *
 * Pure parse + patch — no IO. The caller (`/api/media/resolve`) orchestrates
 * the resolver round-trip and stitches the result.
 */

import * as ts from "typescript";
import type { SourceDescriptor, SourceKind } from "@gradeui/media";

/** All recognised hint kinds — must match the union in @gradeui/media's
 *  `SourceKind`. Used to validate the parsed `kind` field. */
const KNOWN_KINDS: ReadonlySet<SourceKind> = new Set([
  "album",
  "portrait",
  "landscape",
  "poster",
  "product",
  "food",
  "video",
  "audio",
  "embed",
  "3d",
  "generic",
]);

/**
 * One MediaSurface element discovered in the JSX, with the info the patch
 * step needs to insert `src="..."` after resolution.
 */
export interface MediaSurfaceMatch {
  /** Absolute character offset where the element starts. */
  start: number;
  /** Absolute character offset where the element ends. */
  end: number;
  /**
   * Position to insert a `src="..."` attribute, right before the closing
   * `/>` (self-closing) or `>` (opening tag). One whitespace char is
   * inserted ahead of the attribute so output stays readable.
   */
  insertAt: number;
  /** True if the element ALREADY has a `src=` attribute — skip it. */
  alreadyFilled: boolean;
  /** True if a `source={...}` attribute is present (regardless of static). */
  hasSource: boolean;
  /** Parsed source descriptor; null when the source prop is non-static or
   *  malformed. The route reports these as `skipped`. */
  source: SourceDescriptor | null;
  /** Why this match was skipped (only set when `source` is null AND
   *  `hasSource` is true). Surfaced in the diagnostic response. */
  skipReason?: "dynamic" | "missing-kind" | "unknown-kind" | "parse-error";
}

/**
 * Find every MediaSurface JSX element in the source. Self-closing and
 * tag-pair forms both supported. Imports aren't traced — if a file
 * aliases `MediaSurface` to another name, we'll miss it (rare in
 * practice; the chat playbook steers the model toward the canonical
 * name and our scaffolds all use it directly).
 */
export function findMediaSurfaces(jsx: string): MediaSurfaceMatch[] {
  // Parse as TSX so JSX is recognised. JSXFactory / preserveValueImports
  // don't matter for our needs — we only walk the AST, never emit.
  const sf = ts.createSourceFile(
    "App.tsx",
    jsx,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TSX,
  );

  const matches: MediaSurfaceMatch[] = [];

  function visit(node: ts.Node) {
    if (ts.isJsxSelfClosingElement(node) && isMediaSurfaceTag(node.tagName)) {
      matches.push(extractMatch(node, /* selfClosing */ true));
    } else if (ts.isJsxElement(node) && isMediaSurfaceTag(node.openingElement.tagName)) {
      matches.push(extractMatch(node.openingElement, /* selfClosing */ false));
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return matches;
}

/**
 * Inject `data-media-source={JSON.stringify(<source>)}` into every
 * `<MediaSurface>` element that has a `source` prop. The expression is
 * the same one the caller wrote for `source` — duplicated verbatim
 * inside `JSON.stringify(...)` so it evaluates at React render time and
 * the resulting JSON ends up on the rendered root via MediaSurface's
 * existing `...props` spread.
 *
 * Why this lives here rather than inside MediaSurface itself:
 *   Sandpack pulls `@gradeui/ui` from npm (currently 0.8.2 — see
 *   PLAYGROUND_DEPENDENCIES in chat-sandpack.ts). The new
 *   MediaSurface that natively emits `data-media-source` lives in the
 *   workspace, not on npm, so the iframe wouldn't see it without a
 *   release. This server-side JSX rewrite lands the attribute via the
 *   existing prop-spread regardless of which MediaSurface version the
 *   iframe ends up with. Once `@gradeui/ui` is republished with the
 *   native emission, this function becomes a no-op (it skips elements
 *   that already have `data-media-source`) and can be safely deleted.
 *
 * Idempotent — running it twice doesn't double up the attribute,
 * because the second pass sees the existing data attr and skips.
 */
export function injectMediaSourceAttrs(jsx: string): string {
  const sf = ts.createSourceFile(
    "App.tsx",
    jsx,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TSX,
  );

  interface Injection {
    insertAt: number;
    text: string;
  }
  const injections: Injection[] = [];

  function visit(node: ts.Node) {
    let opening: ts.JsxOpeningElement | ts.JsxSelfClosingElement | null = null;
    let selfClosing = false;
    if (ts.isJsxSelfClosingElement(node) && isMediaSurfaceTag(node.tagName)) {
      opening = node;
      selfClosing = true;
    } else if (ts.isJsxElement(node) && isMediaSurfaceTag(node.openingElement.tagName)) {
      opening = node.openingElement;
    }
    if (opening) {
      const sourceAttr = findSourceAttribute(opening);
      const alreadyHasData = hasDataMediaSourceAttribute(opening);
      if (sourceAttr && !alreadyHasData) {
        const initializer = sourceAttr.initializer;
        // Only inject when the source has a JSX expression initializer —
        // string-valued sources (`source="foo"`) don't fit the shape
        // and shouldn't be rewritten.
        if (initializer && ts.isJsxExpression(initializer) && initializer.expression) {
          // Slice the literal expression text so we can re-embed it inside
          // JSON.stringify(...). Picking up `getStart`/`end` includes any
          // surrounding whitespace inside the braces, which is fine —
          // JSON.stringify is whitespace-insensitive.
          const exprText = jsx.slice(
            initializer.expression.getStart(sf),
            initializer.expression.getEnd(),
          );
          // Insert just before the closing `/>` or `>`. One leading space
          // keeps the attribute readable in dev tools / source view.
          const endOfOpening = opening.end;
          const closingLen = selfClosing ? 2 : 1;
          const insertAt = endOfOpening - closingLen;
          injections.push({
            insertAt,
            text: ` data-media-source={JSON.stringify(${exprText})}`,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);

  if (injections.length === 0) return jsx;
  // Apply in reverse so positions stay valid.
  injections.sort((a, b) => b.insertAt - a.insertAt);
  let out = jsx;
  for (const inj of injections) {
    out = out.slice(0, inj.insertAt) + inj.text + out.slice(inj.insertAt);
  }
  return out;
}

function findSourceAttribute(
  opening: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
): ts.JsxAttribute | null {
  for (const attr of opening.attributes.properties) {
    if (!ts.isJsxAttribute(attr) || !attr.name || !ts.isIdentifier(attr.name)) continue;
    if (attr.name.text === "source") return attr;
  }
  return null;
}

function hasDataMediaSourceAttribute(
  opening: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
): boolean {
  for (const attr of opening.attributes.properties) {
    if (!ts.isJsxAttribute(attr) || !attr.name) continue;
    // JSX accepts string-named attributes for hyphenated names like
    // `data-foo`; the parser surfaces them as identifiers when the name
    // is a valid identifier, but `data-media-source` uses dashes, which
    // makes the name a string literal in the AST. Handle both.
    if (ts.isIdentifier(attr.name) && attr.name.text === "data-media-source") return true;
    if (
      // @ts-expect-error — string-literal-named JSX attribute, narrow type
      attr.name.kind === ts.SyntaxKind.StringLiteral &&
      // @ts-expect-error — same
      attr.name.text === "data-media-source"
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Apply resolved URLs to a JSX source. The caller supplies one fill per
 * match (or `null` to skip). Patches are applied in **reverse order**
 * so the recorded offsets stay valid as the string mutates.
 */
export function applyFills(
  jsx: string,
  fills: ReadonlyArray<{ match: MediaSurfaceMatch; url: string | null }>,
): string {
  // Reverse-sort by insertion point so we don't invalidate earlier offsets.
  const ordered = fills
    .filter((f) => f.url && !f.match.alreadyFilled)
    .sort((a, b) => b.match.insertAt - a.match.insertAt);

  let out = jsx;
  for (const { match, url } of ordered) {
    if (!url) continue;
    // The JSX prop value is double-quoted with the URL escaped. URLs
    // shouldn't contain `"` in practice but we defensively escape just
    // in case a future provider returns a weird URL.
    const safe = url.replace(/"/g, "&quot;");
    const insertion = ` src="${safe}"`;
    out = out.slice(0, match.insertAt) + insertion + out.slice(match.insertAt);
  }
  return out;
}

// ─── Internals ────────────────────────────────────────────────────────

function isMediaSurfaceTag(tagName: ts.JsxTagNameExpression): boolean {
  return ts.isIdentifier(tagName) && tagName.text === "MediaSurface";
}

function extractMatch(
  opening: ts.JsxSelfClosingElement | ts.JsxOpeningElement,
  selfClosing: boolean,
): MediaSurfaceMatch {
  const attrs = opening.attributes.properties;
  let hasSource = false;
  let alreadyFilled = false;
  let source: SourceDescriptor | null = null;
  let skipReason: MediaSurfaceMatch["skipReason"];

  for (const attr of attrs) {
    if (!ts.isJsxAttribute(attr) || !attr.name || !ts.isIdentifier(attr.name)) continue;
    const name = attr.name.text;
    if (name === "src") {
      alreadyFilled = true;
      continue;
    }
    if (name !== "source") continue;
    hasSource = true;
    const init = attr.initializer;
    if (!init || !ts.isJsxExpression(init) || !init.expression) {
      skipReason = "parse-error";
      continue;
    }
    const expr = init.expression;
    if (!ts.isObjectLiteralExpression(expr)) {
      // Variable reference, function call, etc. Can't statically
      // evaluate — caller is on the hook to handle dynamic sources
      // via a future context-provider flow.
      skipReason = "dynamic";
      continue;
    }
    const parsed = parseObjectLiteral(expr);
    if (!parsed) {
      skipReason = "dynamic";
      continue;
    }
    const validated = validateDescriptor(parsed);
    if (!validated.ok) {
      skipReason = validated.reason;
      continue;
    }
    source = validated.descriptor;
  }

  // Insert just before the closing `/>` or `>`. The end of the opening
  // element includes the closing punctuation; subtract its length.
  const endOfOpening = opening.end;
  const closingLen = selfClosing ? 2 : 1;
  const insertAt = endOfOpening - closingLen;

  return {
    start: opening.getStart(),
    end: opening.end,
    insertAt,
    alreadyFilled,
    hasSource,
    source,
    skipReason,
  };
}

/**
 * Walk an ObjectLiteralExpression and turn it into a plain JS object,
 * returning `null` if any non-literal value is encountered. Nested
 * objects are walked recursively; arrays / spreads / methods are
 * treated as non-static and bail the whole node.
 */
function parseObjectLiteral(
  expr: ts.ObjectLiteralExpression,
): Record<string, unknown> | null {
  const out: Record<string, unknown> = {};
  for (const prop of expr.properties) {
    if (!ts.isPropertyAssignment(prop)) return null;
    const key = prop.name;
    let keyText: string;
    if (ts.isIdentifier(key)) keyText = key.text;
    else if (ts.isStringLiteral(key)) keyText = key.text;
    else return null;
    const value = parseLiteralValue(prop.initializer);
    if (value === SENTINEL_DYNAMIC) return null;
    out[keyText] = value;
  }
  return out;
}

const SENTINEL_DYNAMIC = Symbol("dynamic");

function parseLiteralValue(node: ts.Expression): unknown | typeof SENTINEL_DYNAMIC {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts.isNumericLiteral(node)) {
    return Number(node.text);
  }
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isObjectLiteralExpression(node)) {
    const sub = parseObjectLiteral(node);
    return sub ?? SENTINEL_DYNAMIC;
  }
  // Arrays, identifiers, calls, template-with-substitution, etc. all
  // mean "we can't know this statically."
  return SENTINEL_DYNAMIC;
}

/**
 * Confirm the parsed object looks like a `SourceDescriptor`. We only
 * verify `kind`; the per-kind fields are enforced upstream by the
 * descriptor's discriminated union when the consuming code reads them.
 * (Providers tolerate optional fields gracefully — see picsum / pollinations.)
 */
function validateDescriptor(
  raw: Record<string, unknown>,
):
  | { ok: true; descriptor: SourceDescriptor }
  | { ok: false; reason: "missing-kind" | "unknown-kind" } {
  const kind = raw.kind;
  if (typeof kind !== "string") return { ok: false, reason: "missing-kind" };
  if (!KNOWN_KINDS.has(kind as SourceKind)) {
    return { ok: false, reason: "unknown-kind" };
  }
  // The cast is safe enough — the kind is verified, and providers tolerate
  // missing optional fields. The descriptor's discriminated-union shape
  // would reject malformed extras at strict TS callers, but our route
  // hands these straight to the resolver which only reads the kind plus
  // the per-kind fields it expects.
  return { ok: true, descriptor: raw as unknown as SourceDescriptor };
}
