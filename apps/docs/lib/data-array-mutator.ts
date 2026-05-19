/**
 * Data-array mutator — per-item edits for scaffolds that render lists
 * via `array.map(item => <Component instanceId={item.id} ... />)`.
 *
 * The pattern: the model writes JSX like:
 *
 *     const shelf1 = [
 *       { id: "alb-mm", title: "Midnight Memories", artist: "One Direction" },
 *       ...
 *     ];
 *
 *     {shelf1.map((a) => (
 *       <MediaSurface
 *         instanceId={a.id}
 *         hint={a.hint ?? "album"}
 *         alt={a.alt ?? `${a.title} — ${a.artist}`}
 *         source={a.source ?? { kind: "album", artist: a.artist, title: a.title }}
 *       />
 *     ))}
 *
 * The Studio settings panel reads `selection.instanceId` from the
 * clicked card, finds the array entry whose `id` matches, and adds
 * or updates a property (e.g. `hint: "poster"`). The JSX's `??`
 * fallback pattern means added fields take precedence over defaults
 * without the user (or model) having to write per-entry control flow.
 *
 * This module owns ONLY the find-and-patch transform. The settings
 * panel decides WHEN to route through here (when the prop's `design`
 * taxonomy is "content" or "structured", and the selection carries an
 * `instanceId`); template-wide "knob" edits still go through
 * `updateComponentProp` in `studio-source-mutator.ts`.
 *
 * Patches are returned as a new JSX string. Caller pushes the result
 * back into the design's appSource map; Sandpack HMR picks it up.
 *
 * The mutator scans ALL top-level array literals in the source — it
 * doesn't care about variable names (`shelf1` vs `albums` vs `items`),
 * just about array entries shaped `{ id: "<entryId>", ... }`.
 */

import * as ts from "typescript";

/**
 * Self-heal old screens so Fill can target their MediaSurfaces.
 *
 * Three sub-passes, each idempotent so the function is safe to call
 * before every Fill batch:
 *
 *   1. **instanceId injection** — for every `<MediaSurface>` JSX element
 *      that lives inside `array.map((param) => …)` and has no
 *      `instanceId` attribute, insert `instanceId={param.id}`. If the
 *      mapped array's entries don't have `id` fields yet, mint stable
 *      `gid-<8>` ids and add them too.
 *
 *   2. **src injection** — for every `<MediaSurface instanceId={x.id}/>`
 *      that has no `src=` attribute, insert `src={x.src ?? undefined}`
 *      right after `instanceId`.
 *
 *   3. (existing) **passthrough** — surfaces that already have both
 *      attributes are left alone.
 *
 * Why this exists: the data-array model needs every MediaSurface inside
 * a `.map()` to declare both `instanceId={x.id}` (so Studio can target
 * one card) and `src={x.src ?? undefined}` (so resolved URLs show
 * through). Newer scaffolds emit both; older screens (instantiated
 * before that landed) don't. Without this self-heal, Fill on those
 * screens silently 0/N-skips every card.
 */
export function backfillMediaSurfaceSrcProp(jsx: string): string {
  let sf: ts.SourceFile;
  try {
    sf = ts.createSourceFile(
      "App.tsx",
      jsx,
      ts.ScriptTarget.Latest,
      /* setParentNodes */ true,
      ts.ScriptKind.TSX,
    );
  } catch {
    return jsx;
  }

  // All edits accumulated here, applied right-to-left at the end so
  // earlier positions stay valid.
  const edits: { pos: number; text: string }[] = [];

  // ── Pre-pass A: upgrade legacy `kind: "poster"` references inside
  // `<MediaSurface>` tags to the new concrete kinds (`tv-show`,
  // `movie`) when there's enough context to tell which. Chat doesn't
  // yet know about the new kinds and keeps emitting `kind: "poster"`
  // for Netflix/Disney/Apple-TV-style screens, which routes to Picsum
  // instead of TMDb. This heuristic recovers most of those:
  //
  //   - Standalone `source={{ kind: "poster", title: "<Title>" }}`
  //     becomes `kind: "tv-show"` by default.
  //   - The shared-shelf pattern
  //     `source={{ kind: "poster", title: item.title }}`
  //     becomes a runtime ternary that picks `movie` when the shelf's
  //     title hints at film ("films", "movies", "must-see films"),
  //     otherwise `tv-show`. The ternary reads `shelf.title` which is
  //     in scope inside the outer `.map((shelf) => ...)` that wraps
  //     these shared-shelf scaffolds.
  //
  // Idempotent — `kind: "tv-show"` / `kind: "movie"` already in the
  // source are left alone. The textual replacements are conservative
  // (require the exact `source={{ kind: "poster", title: ... }}`
  // shape) so we don't accidentally touch arbitrary `kind: "poster"`
  // strings elsewhere.
  {
    const ternaryReplacement =
      'source={{ kind: ((shelf && shelf.title) || "").toLowerCase().match(/film|movie/) ? "movie" : "tv-show", title: item.title }}';
    const tvShowReplacement = (m: string, title: string) =>
      m.replace(`kind: "poster"`, `kind: "tv-show"`);

    jsx = jsx.replace(
      /source=\{\{\s*kind:\s*"poster",\s*title:\s*item\.title\s*\}\}/g,
      ternaryReplacement,
    );
    jsx = jsx.replace(
      /source=\{\{\s*kind:\s*"poster",\s*title:\s*"([^"]+)"([^}]*)\}\}/g,
      tvShowReplacement,
    );

    // Re-parse so subsequent passes see the updated tree.
    try {
      sf = ts.createSourceFile(
        "App.tsx",
        jsx,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
    } catch {
      // If the rewrite somehow broke parsing, revert to original and
      // continue — better a partial fill than a broken screen.
      return jsx;
    }
  }

  // ── Pre-pass B: ensure every array-of-objects declaration in the
  // file has `id` on each entry. Walk the WHOLE tree, not just top-
  // level statements — scaffold patterns very often declare their
  // data inside the component function body (e.g.
  // `function App() { const continueWatching = [...]; ... }`) which
  // makes the const a nested statement, not a top-level one.
  //
  // Earlier this pre-pass only looked at `sf.statements`, which made
  // backfill silently miss the tv-streaming case (3 shelves declared
  // inside `App()`). Recursive walk fixes that; idempotent on already-
  // id'd entries.
  function visitForArrays(node: ts.Node) {
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (!decl.initializer) continue;
        if (!ts.isArrayLiteralExpression(decl.initializer)) continue;
        // Only touch arrays of object literals — leaves arrays of strings
        // (sidebar nav names, etc.) untouched.
        const looksLikeData = decl.initializer.elements.some((el) =>
          ts.isObjectLiteralExpression(el),
        );
        if (looksLikeData) ensureIdsOnArrayEntries(decl.initializer);
      }
    }
    ts.forEachChild(node, visitForArrays);
  }
  visitForArrays(sf);

  // Walk every `array.map((param) => …)` in the source and for each
  // MediaSurface inside the callback that has no `instanceId`, insert
  // `instanceId={param.id}` plus (if needed) `src={param.src ?? undefined}`.
  function visit(node: ts.Node) {
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      const tagName = node.tagName.getText(sf);
      if (tagName === "MediaSurface") {
        processMediaSurfaceTag(node);
      }
    }
    ts.forEachChild(node, visit);
  }

  function processMediaSurfaceTag(
    node: ts.JsxSelfClosingElement | ts.JsxOpeningElement,
  ) {
    const attrs = node.attributes.properties;
    let hasSrc = false;
    let instanceIdAttr: ts.JsxAttribute | null = null;
    let identName: string | null = null;

    for (const a of attrs) {
      if (!ts.isJsxAttribute(a)) continue;
      const name = a.name.getText(sf);
      if (name === "src") hasSrc = true;
      if (name === "instanceId" && a.initializer) {
        if (ts.isJsxExpression(a.initializer) && a.initializer.expression) {
          const expr = a.initializer.expression;
          if (
            ts.isPropertyAccessExpression(expr) &&
            ts.isIdentifier(expr.expression) &&
            ts.isIdentifier(expr.name) &&
            expr.name.text === "id"
          ) {
            identName = expr.expression.text;
            instanceIdAttr = a;
          }
        }
      }
    }

    // Case 1: surface already has instanceId={x.id} but no src — old
    // music-app path. Inject src after instanceId.
    if (instanceIdAttr && identName && !hasSrc) {
      edits.push(srcInsertEdit(instanceIdAttr, identName));
      return;
    }

    // Case 2: surface has BOTH already — nothing to do, idempotent.
    if (instanceIdAttr && hasSrc) return;

    // Case 3: no instanceId at all. Try to discover an enclosing
    // `.map((param) => …)` so we can mint `instanceId={param.id}` and
    // ensure the array entries have ids.
    const mapCtx = findEnclosingMapCallback(node);

    // Case 3b: standalone surface (not inside a .map). This is the
    // AI-prompted-from-zero case — chat will absolutely emit a lone
    // `<MediaSurface source={…} />` without any data-array structure.
    // We inject a stable synthetic instanceId as a string literal so
    // Fill can target THIS specific tag and write `src="…"` inline on
    // the JSX (handled by setInlineMediaSurfaceSrc, not the data-array
    // path). String-literal id distinguishes the two write paths cleanly.
    if (!mapCtx) {
      const synthId = `ms-${Math.random().toString(36).slice(2, 10)}`;
      const insertAfter = node.tagName.end;
      edits.push({
        pos: insertAfter,
        text: ` instanceId="${synthId}"`,
      });
      return;
    }

    const param = mapCtx.paramName;

    // First, ensure the array literal that's being mapped has `id` fields.
    // If we can't reach the array literal (e.g. it's bound to a variable
    // outside the file), just inject `instanceId={param.id}` and hope —
    // worst case, that row stays unfillable.
    if (mapCtx.arrayLiteral) {
      ensureIdsOnArrayEntries(mapCtx.arrayLiteral);
    }

    // Now inject instanceId + src as the first attributes on the
    // MediaSurface tag. Position: immediately after the tag name.
    const insertAfter = node.tagName.end;
    const tagLineStart = jsx.lastIndexOf("\n", node.getStart(sf));
    const tagIndent =
      tagLineStart >= 0
        ? jsx.slice(tagLineStart + 1).match(/^[\t ]*/)?.[0] ?? ""
        : "";
    // Attributes typically sit two-space deeper than the tag. Pick that
    // up by looking at the FIRST attribute's indent if any exist.
    let attrIndent = `${tagIndent}  `;
    if (attrs.length > 0) {
      const firstAttr = attrs[0];
      const firstLineStart = jsx.lastIndexOf(
        "\n",
        firstAttr.getStart(sf),
      );
      if (firstLineStart >= 0) {
        const ind = jsx
          .slice(firstLineStart + 1)
          .match(/^[\t ]*/)?.[0];
        if (ind) attrIndent = ind;
      }
    }
    const pieces = [
      `\n${attrIndent}instanceId={${param}.id}`,
    ];
    if (!hasSrc) {
      pieces.push(`\n${attrIndent}src={${param}.src ?? undefined}`);
    }
    edits.push({ pos: insertAfter, text: pieces.join("") });
  }

  // Build the "src={x.src ?? undefined}" edit, preserving the line's
  // indent so the injected line aligns with the instanceId line above.
  function srcInsertEdit(
    instanceIdAttr: ts.JsxAttribute,
    ident: string,
  ): { pos: number; text: string } {
    const lineStart = jsx.lastIndexOf("\n", instanceIdAttr.getStart(sf));
    const indent =
      lineStart >= 0
        ? jsx.slice(lineStart + 1).match(/^[\t ]*/)?.[0] ?? ""
        : "";
    return {
      pos: instanceIdAttr.end,
      text: `\n${indent}src={${ident}.src ?? undefined}`,
    };
  }

  // Walk up the AST from a JSX element to find the enclosing
  // `<array>.map((param) => …)` call, if any. Returns the param name +
  // (when reachable) the ArrayLiteralExpression that's being mapped.
  function findEnclosingMapCallback(
    start: ts.Node,
  ): { paramName: string; arrayLiteral: ts.ArrayLiteralExpression | null } | null {
    let cur: ts.Node | undefined = start.parent;
    while (cur) {
      if (ts.isArrowFunction(cur) || ts.isFunctionExpression(cur)) {
        const fn = cur;
        const parent = fn.parent;
        if (
          parent &&
          ts.isCallExpression(parent) &&
          ts.isPropertyAccessExpression(parent.expression) &&
          ts.isIdentifier(parent.expression.name) &&
          parent.expression.name.text === "map"
        ) {
          // Found the .map() — extract the param name.
          if (fn.parameters.length === 0) return null;
          const firstParam = fn.parameters[0];
          if (!ts.isIdentifier(firstParam.name)) return null;
          const paramName = firstParam.name.text;
          const arrayLiteral = resolveArrayLiteral(parent.expression.expression);
          return { paramName, arrayLiteral };
        }
      }
      cur = cur.parent;
    }
    return null;
  }

  // Given the receiver of `.map()`, try to find the ArrayLiteralExpression
  // it points to. Handles two cases:
  //   - inline array: `[{...}, {...}].map(...)` — the receiver IS the array.
  //   - variable: `products.map(...)` — chase the variable's declaration
  //     in the same source file.
  function resolveArrayLiteral(
    receiver: ts.Expression,
  ): ts.ArrayLiteralExpression | null {
    if (ts.isArrayLiteralExpression(receiver)) return receiver;
    if (ts.isIdentifier(receiver)) {
      const ident = receiver.text;
      // Scan top-level for `const ident = [...]` or `let ident = [...]`.
      let match: ts.ArrayLiteralExpression | null = null;
      function search(n: ts.Node) {
        if (match) return;
        if (ts.isVariableStatement(n)) {
          for (const decl of n.declarationList.declarations) {
            if (
              ts.isIdentifier(decl.name) &&
              decl.name.text === ident &&
              decl.initializer &&
              ts.isArrayLiteralExpression(decl.initializer)
            ) {
              match = decl.initializer;
              return;
            }
          }
        }
        ts.forEachChild(n, search);
      }
      search(sf);
      return match;
    }
    return null;
  }

  // Walk every object literal entry in the array and ensure each one
  // has an `id` property. Missing ids get minted as `gid-<8>` and
  // pushed as edits.
  function ensureIdsOnArrayEntries(arr: ts.ArrayLiteralExpression) {
    for (const element of arr.elements) {
      if (!ts.isObjectLiteralExpression(element)) continue;
      let hasId = false;
      for (const prop of element.properties) {
        if (!ts.isPropertyAssignment(prop)) continue;
        const name = prop.name;
        if (
          (ts.isIdentifier(name) && name.text === "id") ||
          (ts.isStringLiteral(name) && name.text === "id")
        ) {
          hasId = true;
          break;
        }
      }
      if (hasId) continue;
      // Mint a fresh id and insert it as the first property of the
      // object. Same insertion strategy as updateDataArrayEntry — find
      // the opening `{`, insert after it.
      const id = `gid-${Math.random().toString(36).slice(2, 10)}`;
      const openBracePos = element.getStart(sf); // points at `{`
      const insertAt = openBracePos + 1;
      const needsLeadingComma = element.properties.length > 0;
      edits.push({
        pos: insertAt,
        text: ` id: "${id}"${needsLeadingComma ? "," : ""}`,
      });
    }
  }

  visit(sf);

  if (edits.length === 0) return jsx;
  edits.sort((a, b) => b.pos - a.pos);
  let out = jsx;
  for (const edit of edits) {
    out = out.slice(0, edit.pos) + edit.text + out.slice(edit.pos);
  }
  return out;
}

/**
 * Result of applying a mutation: either the patched source string,
 * or a reason the patch couldn't land. The "no-match" case is the
 * common one for non-data-driven JSX — caller falls back to the
 * JSX-template mutator (`updateComponentProp`) when this misses.
 */
export interface DataArrayMutationResult {
  ok: boolean;
  jsx?: string;
  reason?: "no-match" | "parse-error" | "unserialisable-value";
}

/**
 * The value type acceptable for a data-array entry field. Matches
 * what JSX prop values typically are — strings, numbers, booleans,
 * shallow JSON-shaped objects. Complex values (functions, ReactNode)
 * don't belong in a data array entry by design; if the panel ever
 * tries to write one, we bail with `unserialisable-value`.
 */
export type SerialisableValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: SerialisableValue }
  | SerialisableValue[];

/**
 * Per-instance read counterpart to `updateDataArrayEntry`. Finds the
 * array entry whose `id` matches `entryId` and returns the value of
 * `propName` on it (if present), shaped to match `ReadPropResult`
 * from `studio-source-mutator.ts` so the settings panel can switch
 * between template-wide and per-instance reads without caring which
 * path produced the value.
 *
 *   string literal `"album"`     → { kind: "string",     value: "album" }
 *   numeric literal `15`          → { kind: "expression", raw: "{15}" }
 *   boolean literal `true`        → { kind: "expression", raw: "{true}" }
 *   anything else (object, etc.)  → { kind: "expression", raw: "{<source>}" }
 *
 * Returns `undefined` when the entry doesn't exist or the property
 * isn't set on it — caller treats that as "use the JSX fallback /
 * placeholder", same as for `readComponentProp`.
 */
export function readDataArrayEntryField(
  jsx: string,
  entryId: string,
  propName: string,
):
  | { kind: "string"; value: string }
  | { kind: "boolean"; value: true }
  | { kind: "expression"; raw: string }
  | undefined {
  let sf: ts.SourceFile;
  try {
    sf = ts.createSourceFile(
      "App.tsx",
      jsx,
      ts.ScriptTarget.Latest,
      /* setParentNodes */ true,
      ts.ScriptKind.TSX,
    );
  } catch {
    return undefined;
  }

  const entry = findEntryById(sf, entryId);
  if (!entry) return undefined;
  const prop = findPropertyByName(entry, propName);
  if (!prop) return undefined;

  const init = prop.initializer;
  if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) {
    return { kind: "string", value: init.text };
  }
  if (init.kind === ts.SyntaxKind.TrueKeyword) {
    return { kind: "boolean", value: true };
  }
  if (init.kind === ts.SyntaxKind.FalseKeyword) {
    return { kind: "expression", raw: "{false}" };
  }
  // Numeric / object / array / call expression / etc. — return the
  // source text wrapped in braces so it round-trips through the
  // same shape the JSX read path emits (`raw: "{15}"`,
  // `raw: "{a.title}"`, etc.). The panel uses this only to drive
  // control state, not to eval, so verbatim source is enough.
  const raw = init.getText(sf);
  return { kind: "expression", raw: `{${raw}}` };
}

/**
 * Update a single property on the array entry whose `id` matches.
 * - Sets the property (creates it if missing).
 * - `null` / `undefined` value REMOVES the property (the JSX's `??`
 *   fallback then reverts the rendered prop to its default).
 * - If the entry has no other properties after a removal, the entry
 *   itself stays (the id keeps it discoverable) — we don't drop rows.
 */
export function updateDataArrayEntry(
  jsx: string,
  entryId: string,
  propName: string,
  value: SerialisableValue | undefined,
): DataArrayMutationResult {
  let sf: ts.SourceFile;
  try {
    sf = ts.createSourceFile(
      "App.tsx",
      jsx,
      ts.ScriptTarget.Latest,
      /* setParentNodes */ true,
      ts.ScriptKind.TSX,
    );
  } catch {
    return { ok: false, reason: "parse-error" };
  }

  let serialised: string;
  try {
    serialised = value === undefined ? "" : serialiseLiteral(value);
  } catch {
    return { ok: false, reason: "unserialisable-value" };
  }

  // Walk every ObjectLiteralExpression in the file. For each one, see
  // if it has an `id` property with the matching string literal — if
  // so, this is the entry we're patching. We do NOT pre-filter to
  // array literals: walking objects directly is simpler and still
  // correct because every data-array entry IS an object literal.
  const entry = findEntryById(sf, entryId);
  if (!entry) return { ok: false, reason: "no-match" };

  // Find the property within the entry, if it exists.
  const existing = findPropertyByName(entry, propName);

  if (value === undefined || value === null) {
    // Remove (clear) — if the property exists, splice it out plus any
    // trailing comma so the remaining JSON stays valid. If it doesn't
    // exist, the JSX is already in the "default" state for this prop
    // and there's nothing to do.
    if (!existing) return { ok: true, jsx };
    const removed = removePropertyText(jsx, existing);
    return { ok: true, jsx: removed };
  }

  if (existing) {
    // Replace the existing initializer. Bounds: from the start of the
    // initializer expression to its end. Keep the prop name + colon
    // intact.
    const startOfInit = existing.initializer.getStart(sf);
    const endOfInit = existing.initializer.getEnd();
    const patched =
      jsx.slice(0, startOfInit) + serialised + jsx.slice(endOfInit);
    return { ok: true, jsx: patched };
  }

  // Insert a new property at the end of the entry's properties list.
  // Strategy: find the `}` that closes the entry and inject the new
  // field immediately before it, taking care to produce valid JS in
  // three shapes:
  //
  //   empty entry            `{ id: "x" }`           → `{ id: "x", src: "u" }`
  //   trailing-comma entry   `{ id: "x", }`          → `{ id: "x", src: "u", }`
  //   no-trailing-comma      `{ id: "x", a: 1 }`     → `{ id: "x", a: 1, src: "u" }`
  //
  // The bug we're fixing: the no-trailing-comma case previously inserted
  // the new field WITHOUT a leading comma, producing `{ a: 1 src: "u" }`
  // which sucrase rejects with "expected ',' at column N". Music-app's
  // scaffold entries all hit that branch, so every Fill click was
  // breaking the JSX.
  const closingBracePos = entry.end - 1; // `}`
  const before = jsx.slice(0, closingBracePos);
  const lastNonWhitespace = /([^\s])\s*$/.exec(before);
  const lastChar = lastNonWhitespace?.[1] ?? "{";

  let insertText: string;
  if (entry.properties.length === 0) {
    // Empty object literal: `{}`. No leading comma needed.
    insertText = ` ${propName}: ${serialised} `;
  } else if (lastChar === ",") {
    // Trailing comma already there. Insert after the comma (still
    // before the brace) — we just need ` propName: value,` without a
    // leading comma.
    insertText = ` ${propName}: ${serialised},`;
  } else {
    // Properties exist but the last one has no trailing comma. We must
    // prepend a comma to separate from the previous field, else we end
    // up with `..."One Direction" src: "url"`.
    insertText = `, ${propName}: ${serialised}`;
  }

  const updatedJsx =
    jsx.slice(0, closingBracePos) + insertText + jsx.slice(closingBracePos);
  return { ok: true, jsx: updatedJsx };
}

/**
 * Inline write: find the `<MediaSurface … instanceId="<id>" … />` tag in
 * the JSX and insert or replace its `src` attribute with the given URL
 * literal. Use this for *standalone* MediaSurfaces that aren't backed by
 * a data-array — the JSX itself is the storage.
 *
 * Mirrors the contract of `updateDataArrayEntry`: pass `undefined` to
 * remove `src` instead of setting it.
 *
 * The backfill (`backfillMediaSurfaceSrcProp`) synthesises string-literal
 * instanceIds for standalone surfaces (`instanceId="ms-XXXXXXXX"`) so
 * this writer can find them. Data-array-backed surfaces use the
 * expression form (`instanceId={x.id}`) and route through
 * `updateDataArrayEntry` instead.
 */
export function setInlineMediaSurfaceSrc(
  jsx: string,
  instanceId: string,
  url: string | undefined,
): DataArrayMutationResult {
  let sf: ts.SourceFile;
  try {
    sf = ts.createSourceFile(
      "App.tsx",
      jsx,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
  } catch {
    return { ok: false, reason: "parse-error" };
  }

  let target: ts.JsxSelfClosingElement | ts.JsxOpeningElement | null = null;
  function visit(node: ts.Node) {
    if (target) return;
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      const tagName = node.tagName.getText(sf);
      if (tagName === "MediaSurface") {
        for (const a of node.attributes.properties) {
          if (!ts.isJsxAttribute(a)) continue;
          if (a.name.getText(sf) !== "instanceId") continue;
          // Match string-literal instanceId values only — the
          // expression form (`instanceId={x.id}`) belongs to the
          // data-array path and shouldn't be written inline.
          const init = a.initializer;
          if (init && ts.isStringLiteral(init) && init.text === instanceId) {
            target = node;
            return;
          }
          // Also accept `instanceId={"…"}` for the same id — JSX
          // sometimes wraps string literals in braces.
          if (
            init &&
            ts.isJsxExpression(init) &&
            init.expression &&
            ts.isStringLiteral(init.expression) &&
            init.expression.text === instanceId
          ) {
            target = node;
            return;
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);

  if (!target) return { ok: false, reason: "no-match" };

  // Find existing src attribute, if any.
  let existingSrc: ts.JsxAttribute | null = null;
  for (const a of (target as ts.JsxOpeningLikeElement).attributes.properties) {
    if (ts.isJsxAttribute(a) && a.name.getText(sf) === "src") {
      existingSrc = a;
      break;
    }
  }

  if (url === undefined) {
    // Clear — remove `src="…"` (plus surrounding whitespace if it was
    // on its own line).
    if (!existingSrc) return { ok: true, jsx };
    const start = existingSrc.getFullStart();
    let end = existingSrc.end;
    while (end < jsx.length && /[ \t]/.test(jsx[end])) end++;
    if (jsx[end] === "\n") end++;
    return { ok: true, jsx: jsx.slice(0, start) + jsx.slice(end) };
  }

  const literal = `src=${JSON.stringify(url)}`;
  if (existingSrc) {
    // Replace.
    const start = existingSrc.getStart(sf);
    const end = existingSrc.end;
    return { ok: true, jsx: jsx.slice(0, start) + literal + jsx.slice(end) };
  }

  // Insert immediately after the tag name (first attribute slot).
  const insertAt = (target as ts.JsxOpeningLikeElement).tagName.end;
  return {
    ok: true,
    jsx: jsx.slice(0, insertAt) + ` ${literal}` + jsx.slice(insertAt),
  };
}

// ─── Internals ────────────────────────────────────────────────────────

/**
 * Walk the source tree for an ObjectLiteralExpression whose `id`
 * property is a string literal matching `entryId`. Returns the FIRST
 * match — the assumption is `id` values are unique within a design
 * (the starter picker enforces this on instantiation).
 */
function findEntryById(
  sf: ts.SourceFile,
  entryId: string,
): ts.ObjectLiteralExpression | null {
  let match: ts.ObjectLiteralExpression | null = null;
  function visit(node: ts.Node) {
    if (match) return;
    if (ts.isObjectLiteralExpression(node)) {
      const idProp = findPropertyByName(node, "id");
      if (
        idProp &&
        ts.isStringLiteral(idProp.initializer) &&
        idProp.initializer.text === entryId
      ) {
        match = node;
        return;
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return match;
}

/**
 * Find a property by its name on an object literal. Returns the
 * PropertyAssignment node, or null. We don't handle shorthand
 * properties (`{ id }`) — the data-array convention always writes
 * `id: "..."` explicitly, so shorthand never appears.
 */
function findPropertyByName(
  obj: ts.ObjectLiteralExpression,
  propName: string,
): ts.PropertyAssignment | null {
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const name = prop.name;
    if (ts.isIdentifier(name) && name.text === propName) return prop;
    if (ts.isStringLiteral(name) && name.text === propName) return prop;
  }
  return null;
}

/**
 * Remove a property from the surrounding object literal text. Strips
 * a trailing comma + whitespace if one immediately follows, OR a
 * leading comma + whitespace if it doesn't (for the case of removing
 * the last property). Keeps surrounding whitespace minimal so the
 * source stays readable across many edits.
 */
function removePropertyText(jsx: string, prop: ts.PropertyAssignment): string {
  const start = prop.getFullStart();
  const end = prop.end;
  // Look for trailing punctuation immediately after `end`.
  let after = end;
  // Skip whitespace.
  while (after < jsx.length && /\s/.test(jsx[after])) after++;
  // If there's a trailing comma, consume it.
  if (jsx[after] === ",") after++;
  // Skip trailing whitespace after the comma so we don't leave a
  // dangling blank line.
  while (after < jsx.length && /[ \t]/.test(jsx[after])) after++;
  // Newline after a removed line: keep ONE so the surrounding lines
  // stay separated.
  if (jsx[after] === "\n") after++;
  return jsx.slice(0, start) + jsx.slice(after);
}

/**
 * Serialise a JS value as a JSX-safe initializer expression. Strings
 * get JSON-quoted (JSX accepts JSON-style strings inside `{}`).
 * Numbers / booleans / null pass through verbatim. Objects and arrays
 * recurse — JSON.stringify gives us the right shape for the simple
 * cases, but it doesn't handle e.g. literal-key shorthand or template
 * strings, both of which would require richer escaping. For now,
 * panel-driven edits only set simple scalar overrides; complex values
 * fall through to JSON.stringify which is correct for any
 * SerialisableValue.
 */
function serialiseLiteral(value: SerialisableValue): string {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  // Object / array — JSON.stringify produces a valid JS object/array
  // literal too. Strict JSON is a subset of JS, so this is safe.
  return JSON.stringify(value);
}
