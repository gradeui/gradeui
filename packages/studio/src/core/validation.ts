/**
 * validateAgainstContract — the contract-conformance gate of the core lib.
 *
 * This is the canonical home for Grade's JSX-vs-contract validator. It used
 * to live at `apps/docs/lib/qa/validate-jsx.ts`; it moved here so both
 * transport adapters share ONE implementation:
 *
 *   - the MCP server adapter validates inbound model output, and
 *   - the product runtime (`/api/chat`) validates the streamed result,
 *
 * against the exact same walker. "The contract lives once" (see
 * grade-local-testing-and-eval.md) — re-validating a slot inside an adapter
 * is the smell this module exists to prevent.
 *
 * Note this function takes the contract registry as a PARAMETER rather than
 * importing `COMPONENT_CONTRACTS` from `@gradeui/ui`. That keeps the core
 * transport-agnostic AND dependency-light: it never pulls in the React
 * component bundle, only the contract types. Each adapter passes the
 * registry it already has.
 *
 * The model gets shown sidecar examples before it writes JSX, but compliance
 * with the actual API is still best-effort — it can hallucinate a prop,
 * mis-spell a variant value, or omit a required prop. This validator is the
 * safety net: it walks the JSX, looks up each component's contract, and
 * validates every prop against the Zod schema declared in the contract.
 *
 * Violations are structured (severity + kind + component/prop + message +
 * source location) so the caller decides what to do with them — log them
 * server-side, surface them as warnings in the Studio chat, or fail the
 * render outright. The validator never throws; a parse error just becomes
 * one `parse-error` violation and the rest of the pipeline can continue.
 *
 * What it CAN catch:
 *   - Unknown props        (`<Carousel videoSrc=… />` when there's no videoSrc)
 *   - Invalid enum values  (`<Tabs variant="huge" />` not in pill|underlined)
 *   - Wrong primitive type (`<MultiSelect maxCount="three" />` not a number)
 *   - Missing required props (a contract prop whose schema rejects undefined)
 *
 * What it CANNOT catch (deferred):
 *   - Dot-form sub-component props (`<Carousel.Slide duration={…} />`) —
 *     skipped entirely. Identifier-form subcomponents (`<TableCell>`)
 *     DO resolve: each contract's `subcomponents` list maps them back to
 *     the family contract's flattened prop bag.
 *   - Expression-valued props (`maxCount={someVar}`) — can't evaluate
 *     without running the code.
 *   - Contracts whose generator produced `z.unknown()` because the .md
 *     prop line wasn't parseable. Those are silently passed.
 *
 * Why a TS-AST walker instead of regex: JSX nesting + spread attributes +
 * computed expressions are noise the regex would fight.
 */

import * as ts from "typescript";
import { z } from "zod";
import type { ComponentContract, PropContract } from "@gradeui/contracts";

// ─── Public types ──────────────────────────────────────────────────────

export type ViolationKind =
  | "unknown-prop"
  | "invalid-enum"
  | "wrong-type"
  | "missing-required"
  | "no-contract"
  | "parse-error";

export type Severity = "error" | "warning" | "info";

export interface ValidationViolation {
  severity: Severity;
  kind: ViolationKind;
  component: string;
  prop?: string;
  message: string;
  /** 1-indexed line in the source JSX. */
  line?: number;
  /** 1-indexed column in the source JSX. */
  column?: number;
}

export interface ValidationResult {
  ok: boolean;
  violations: ValidationViolation[];
  componentsChecked: number;
}

/**
 * Alias matching the name used in grade-local-testing-and-eval.md
 * (`validateAgainstContract(output) -> ViolationReport`). Structurally
 * identical to {@link ValidationResult}; exported so callers can speak
 * in the doc's vocabulary.
 */
export type ViolationReport = ValidationResult;

export interface ValidateOptions {
  /** The contract registry to validate against — typically
   *  `COMPONENT_CONTRACTS` from `@gradeui/ui`. Keyed by PascalCase
   *  component name. */
  contracts: Record<string, ComponentContract>;
  /** Skip the `no-contract` info-level violation for JSX tags that
   *  aren't in the registry. Defaults true — most JSX contains user-land
   *  components (App, Header, NotificationsList) that aren't supposed
   *  to be in the DS registry, and reporting each one is noise. */
  skipUnknownComponents?: boolean;
  /** Skip prop validation for compound subcomponents like
   *  `<Carousel.Slide>`. Defaults true — until subcomponents get their
   *  own contracts, we can't validate them. */
  skipSubcomponents?: boolean;
}

// ─── Implementation ────────────────────────────────────────────────────

/**
 * Walk the JSX source, validate every `<Component>` against the matching
 * contract, return a structured report. Never throws.
 *
 * Typical wiring in a streaming chat route:
 *
 *   const text = await streamToString(modelStream);
 *   const jsx = extractFencedJsxBlock(text);
 *   const report = validateAgainstContract(jsx, { contracts: COMPONENT_CONTRACTS });
 *   if (!report.ok) console.warn("[chat/validator]", formatViolations(report));
 */
export function validateAgainstContract(
  source: string,
  options: ValidateOptions,
): ViolationReport {
  const {
    contracts,
    skipUnknownComponents = true,
    skipSubcomponents = true,
  } = options;

  const violations: ValidationViolation[] = [];
  let componentsChecked = 0;

  // Reverse index: subcomponent name → family contract. `<TableCell>`
  // has no registry entry of its own, but table.md declares it in
  // `subcomponents`, so it validates against the Table family's
  // flattened prop bag instead of passing unchecked (the Tier-3 gap
  // from the July 2026 contract audit). Real registry entries always
  // win over an index hit.
  //
  // ONLY element-audited families take part — `element` (or a
  // `subcomponentElements` map) is the marker that the family's bag +
  // native-attr coverage is complete enough to enforce. Without the
  // gate, families whose sidecars still hold unparseable prop prose
  // (DropdownMenuCheckboxItem's `checked`, ChartTooltip's `content`)
  // would flip from unchecked to strictly-rejected, making canonical
  // documented patterns unsavable (caught by the Aug 2026 pre-push
  // review). Un-audited families keep pre-existing behavior: their
  // subcomponent tags pass unchecked.
  const subIndex = new Map<string, ComponentContract>();
  for (const c of Object.values(contracts)) {
    if (!c.element && !c.subcomponentElements) continue;
    for (const sub of c.subcomponents ?? []) {
      if (!contracts[sub] && !subIndex.has(sub)) subIndex.set(sub, c);
    }
  }

  let sf: ts.SourceFile;
  try {
    sf = ts.createSourceFile(
      "Validate.tsx",
      source,
      ts.ScriptTarget.Latest,
      /* setParentNodes */ true,
      ts.ScriptKind.TSX,
    );
  } catch (err) {
    return {
      ok: false,
      componentsChecked: 0,
      violations: [
        {
          severity: "error",
          kind: "parse-error",
          component: "(file)",
          message: `Failed to parse JSX: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
    };
  }

  const visit = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const { componentName, isSubcomponent } = extractComponentName(node.tagName);
      if (componentName) {
        // Source position for error messages — 1-indexed for human eyes.
        const pos = sf.getLineAndCharacterOfPosition(node.tagName.getStart(sf));
        const line = pos.line + 1;
        const column = pos.character + 1;

        if (isSubcomponent && skipSubcomponents) {
          // Skip — no contract for dot-form Carousel.Slide etc. yet.
        } else {
          const direct = contracts[componentName];
          const contract = direct ?? subIndex.get(componentName);
          if (!contract) {
            if (!skipUnknownComponents && looksLikeDsComponent(componentName)) {
              violations.push({
                severity: "info",
                kind: "no-contract",
                component: componentName,
                message: `No contract registered for <${componentName}>. Validator skipped this element.`,
                line,
                column,
              });
            }
          } else {
            componentsChecked++;
            const viaSubcomponent = !direct;
            validateAttributes(
              node.attributes.properties,
              contract,
              componentName,
              sf,
              violations,
              {
                // Mixed-element families override per subcomponent
                // (InputGroup is a div; InputGroupInput forwards to
                // an <input>).
                element: viaSubcomponent
                  ? (contract.subcomponentElements?.[componentName] ??
                    contract.element)
                  : contract.element,
                // The flattened bag can't express per-sub requiredness;
                // demanding the ROOT's required props on a subcomponent
                // tag would be wrong (e.g. Code's `source` on a child).
                skipRequired: viaSubcomponent,
              },
            );
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  return {
    ok: violations.every((v) => v.severity !== "error"),
    violations,
    componentsChecked,
  };
}

/**
 * Back-compat alias. The validator shipped as `validateJsx`; existing
 * callers (the docs chat route, edit-turn QA) import that name. Keep it
 * pointed at the canonical implementation so there's only ever one walker.
 */
export const validateJsx = validateAgainstContract;

/**
 * Extract the component name from a JSX tag. Handles two forms:
 *   <Carousel>             → { componentName: "Carousel", isSubcomponent: false }
 *   <Carousel.Slide>       → { componentName: "Carousel", isSubcomponent: true }
 *
 * Lower-cased / dashed tags (`<div>`, `<custom-thing>`) are intrinsic HTML
 * elements — return `null`. We skip those entirely; they're not DS
 * components.
 */
function extractComponentName(
  tagName: ts.JsxTagNameExpression,
): { componentName: string | null; isSubcomponent: boolean } {
  if (ts.isIdentifier(tagName)) {
    const name = tagName.text;
    // JSX intrinsic elements start lowercase per React convention.
    if (name[0] !== name[0].toUpperCase()) {
      return { componentName: null, isSubcomponent: false };
    }
    return { componentName: name, isSubcomponent: false };
  }
  if (ts.isPropertyAccessExpression(tagName)) {
    // Walk to the root identifier so `<Foo.Bar.Baz>` resolves to "Foo".
    let expr: ts.LeftHandSideExpression = tagName;
    while (ts.isPropertyAccessExpression(expr)) {
      expr = expr.expression as ts.LeftHandSideExpression;
    }
    if (ts.isIdentifier(expr)) {
      return { componentName: expr.text, isSubcomponent: true };
    }
  }
  return { componentName: null, isSubcomponent: false };
}

/**
 * Heuristic — does this name look like it might be a DS component we
 * forgot to register a contract for? "Carousel" → yes; "App" / "Layout"
 * / "Header" → no (user-land). Used only to suppress noisy no-contract
 * violations for obvious user components.
 *
 * Conservative: anything not matching this whitelist is assumed
 * user-land and skipped. Tighten if we start missing real DS components.
 */
function looksLikeDsComponent(name: string): boolean {
  // Common user-land names — never flag these as missing contracts.
  const userLand = new Set([
    "App", "Page", "Layout", "Header", "Footer", "Main", "Section",
    "Hero", "Nav", "Sidebar", "Content", "Wrapper", "Container",
  ]);
  return !userLand.has(name);
}

/**
 * Validate each attribute on a JSX element against the component's contract.
 * Mutates `violations` in place.
 */
function validateAttributes(
  attrs: ts.NodeArray<ts.JsxAttributeLike>,
  contract: ComponentContract,
  componentName: string,
  sf: ts.SourceFile,
  violations: ValidationViolation[],
  options: {
    /** The intrinsic element whose standard HTML attrs are legal on this
     *  tag (from the contract's `element` / `subcomponentElements`). */
    element?: string;
    /** True when the tag resolved via a family's `subcomponents` list —
     *  the flattened bag's required props belong to the ROOT, so the
     *  missing-required check must not run. */
    skipRequired?: boolean;
  } = {},
) {
  const seenProps = new Set<string>();
  const { element, skipRequired = false } = options;

  for (const attr of attrs) {
    if (ts.isJsxSpreadAttribute(attr)) {
      // Can't statically know what's in {...rest}. Skip the spread
      // gracefully — over-strict validation would false-positive on
      // every spread pattern, which is too common in real JSX.
      continue;
    }

    const propName = attr.name.getText(sf);
    seenProps.add(propName);

    // `key`, `ref`, `aria-*`, `data-*` are React/DOM passthroughs the
    // contracts deliberately don't model. Don't flag them as unknown.
    if (isReactPassthroughAttr(propName)) continue;

    const propContract = contract.props[propName] as PropContract<unknown> | undefined;
    const pos = sf.getLineAndCharacterOfPosition(attr.getStart(sf));
    const line = pos.line + 1;
    const column = pos.character + 1;

    if (!propContract) {
      // Element-standard attrs: a contract that declares its rendered
      // element (`element: "input"`) accepts that element's native
      // attributes, `on*` event handlers, and Radix's `asChild` even
      // though they aren't individually contracted — the docs promise
      // "All native <x> HTML attrs" and the validator must not refuse
      // what generation is taught to write (July 2026 contract audit).
      // asChild rides the element gate (not the universal passthrough
      // list) so contracts that DECLARE asChild keep schema validation
      // and un-audited components keep flagging it.
      if (element) {
        if (propName === "asChild") continue;
        // Native handlers are accepted — EXCEPT names suspiciously
        // close to a CONTRACTED event prop, which are near-certainly
        // typo'd callbacks (`onValueChagne`) that would silently never
        // fire; let those fall through so suggestSimilar can flag them.
        if (
          EVENT_HANDLER_RE.test(propName) &&
          !isLikelyEventTypo(propName, contract)
        ) {
          continue;
        }
        if (
          !EVENT_HANDLER_RE.test(propName) &&
          isNativeAttrForElement(element, propName)
        ) {
          continue;
        }
      }
      violations.push({
        severity: "error",
        kind: "unknown-prop",
        component: componentName,
        prop: propName,
        message: `<${componentName}> has no prop \`${propName}\`. ${suggestSimilar(propName, contract)}`,
        line,
        column,
      });
      continue;
    }

    // Try to read a literal value out of the attribute. If we can't
    // (it's a variable / function call / template literal), we skip
    // value validation. Presence-checking already passed.
    const literal = readAttrLiteral(attr, sf);
    if (literal === LITERAL_UNREADABLE) continue;

    // Validate the literal against the prop's Zod schema. If the schema
    // is `z.unknown()` (parser fallback), the safeParse always succeeds,
    // so this naturally no-ops for that case — no false positives.
    const parsed = propContract.schema.safeParse(literal);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const kind: ViolationKind =
        issue?.code === "invalid_union_discriminator" ||
        issue?.code === "invalid_literal" ||
        issue?.code === "invalid_enum_value"
          ? "invalid-enum"
          : "wrong-type";
      violations.push({
        severity: "error",
        kind,
        component: componentName,
        prop: propName,
        message: `<${componentName} ${propName}={…}> — ${formatZodIssue(issue, propName)}`,
        line,
        column,
      });
    }
  }

  // Required-prop check: any prop whose schema REJECTS undefined is
  // required. Anything that survives `safeParse(undefined)` is optional.
  // This is more reliable than checking `_def.typeName === "ZodOptional"`
  // because `.optional()` chains aren't always at the top level.
  if (skipRequired) return;
  for (const [propName, propContract] of Object.entries(contract.props)) {
    if (seenProps.has(propName)) continue;
    // Skip plumbing / events / refs — never required in JSX-author terms.
    if (
      propContract.design === "plumbing" ||
      propContract.design === "event" ||
      propContract.design === "ref"
    ) {
      continue;
    }
    const undefOk = propContract.schema.safeParse(undefined).success;
    if (!undefOk) {
      const pos = sf.getLineAndCharacterOfPosition(0);
      violations.push({
        severity: "error",
        kind: "missing-required",
        component: componentName,
        prop: propName,
        message: `<${componentName}> is missing required prop \`${propName}\`.`,
        line: pos.line + 1,
        column: pos.character + 1,
      });
    }
  }
}

/** Sentinel — the attribute had a value we can't statically extract. */
const LITERAL_UNREADABLE: unique symbol = Symbol("LITERAL_UNREADABLE");
type AttrLiteral = string | number | boolean | null | typeof LITERAL_UNREADABLE;

/**
 * Extract a literal value from a JSX attribute when possible:
 *
 *   tooltip                  → true                       (boolean shorthand)
 *   tooltip="text"           → "text"                     (string literal)
 *   maxCount={3}             → 3                          (numeric literal)
 *   draggable={false}        → false                      (boolean literal)
 *   align={null}             → null                       (null literal)
 *   onChange={(e) => …}      → LITERAL_UNREADABLE         (function expression)
 *   placeholder={someVar}    → LITERAL_UNREADABLE         (identifier ref)
 *
 * Anything we can't statically resolve becomes LITERAL_UNREADABLE so
 * downstream validation skips it. False positives are worse than missed
 * catches — the validator is a tripwire, not a type system.
 */
function readAttrLiteral(attr: ts.JsxAttribute, sf: ts.SourceFile): AttrLiteral {
  if (!attr.initializer) return true; // boolean shorthand
  if (ts.isStringLiteral(attr.initializer)) return attr.initializer.text;
  if (!ts.isJsxExpression(attr.initializer)) return LITERAL_UNREADABLE;
  const expr = attr.initializer.expression;
  if (!expr) return LITERAL_UNREADABLE;
  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
    return expr.text;
  }
  if (ts.isNumericLiteral(expr)) return Number(expr.text);
  if (expr.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (expr.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (expr.kind === ts.SyntaxKind.NullKeyword) return null;
  return LITERAL_UNREADABLE;
}

/**
 * React's plumbing attributes — never validated against a contract. Two
 * sources: React's reserved attrs (`key`, `ref`), and HTML-passthrough
 * conventions (`aria-*`, `data-*`).
 */
function isReactPassthroughAttr(name: string): boolean {
  if (name === "key" || name === "ref" || name === "className" || name === "style") {
    return true;
  }
  if (name.startsWith("aria-") || name.startsWith("data-")) return true;
  return false;
}

/**
 * Is this uncontracted `on*` name a likely typo of a CONTRACTED event
 * prop (`onValueChagne` next to `onValueChange`)? Those must NOT ride
 * the native-handler allowance — the callback would silently never
 * fire at runtime. Uses the same similarity metric as suggestSimilar,
 * restricted to `design: "event"` props so genuinely-native handlers
 * (onClick, onPointerDown) stay accepted.
 */
function isLikelyEventTypo(
  propName: string,
  contract: ComponentContract,
): boolean {
  const lower = propName.toLowerCase();
  for (const [name, pc] of Object.entries(contract.props)) {
    if (pc.design !== "event") continue;
    if (similarity(lower, name.toLowerCase()) >= 0.6) return true;
  }
  return false;
}

// ─── Element-standard HTML attributes ──────────────────────────────────
//
// When a contract declares its rendered `element`, these are the attrs
// (React camelCase) accepted on top of the contracted props. Global attrs
// apply to every element; the per-element sets add the form/media attrs
// that matter in practice. An element with no entry (span, p, section, …)
// gets the global set only — that's the right default for wrappers.

const EVENT_HANDLER_RE = /^on[A-Z]/;

const GLOBAL_HTML_ATTRS: ReadonlySet<string> = new Set([
  "id", "title", "role", "tabIndex", "hidden", "lang", "dir", "draggable",
  "slot", "spellCheck", "contentEditable", "accessKey", "autoCapitalize",
  "autoCorrect", "autoFocus", "translate", "inputMode", "inert", "is",
  "nonce", "part", "popover", "itemProp", "itemScope", "itemType",
  "itemID", "itemRef", "suppressContentEditableWarning",
  "suppressHydrationWarning",
]);

const ELEMENT_HTML_ATTRS: Readonly<Record<string, readonly string[]>> = {
  button: [
    "type", "name", "value", "disabled", "form", "formAction",
    "formEncType", "formMethod", "formNoValidate", "formTarget",
    "popoverTarget", "popoverTargetAction",
  ],
  input: [
    "type", "name", "value", "defaultValue", "checked", "defaultChecked",
    "placeholder", "required", "readOnly", "disabled", "autoComplete",
    "maxLength", "minLength", "pattern", "min", "max", "step", "multiple",
    "accept", "list", "size", "form", "capture", "enterKeyHint", "alt",
    "src", "height", "width", "dirName",
  ],
  textarea: [
    "name", "value", "defaultValue", "placeholder", "required", "readOnly",
    "disabled", "autoComplete", "rows", "cols", "wrap", "maxLength",
    "minLength", "form", "enterKeyHint", "dirName",
  ],
  // No "multiple" — the DS Select wraps Radix's single-select root, and
  // blessing `multiple` would validate a silently-broken screen.
  select: [
    "name", "value", "defaultValue", "required", "disabled", "autoComplete",
    "size", "form",
  ],
  label: ["htmlFor", "form"],
  form: [
    "action", "method", "encType", "target", "noValidate", "autoComplete",
    "name", "acceptCharset", "rel",
  ],
  fieldset: ["disabled", "form", "name"],
  a: ["href", "target", "rel", "download", "hrefLang", "referrerPolicy", "ping", "type"],
  img: [
    "src", "srcSet", "sizes", "alt", "loading", "decoding", "crossOrigin",
    "referrerPolicy", "width", "height", "useMap", "fetchPriority",
  ],
  // Union of the table family (table/tr/td/th) — the whole family shares
  // one flattened contract, so one set serves Table through TableCell.
  // No "span": it belongs to <col>/<colgroup>, which no Table
  // subcomponent renders — accepting it would swallow colSpan typos.
  table: ["colSpan", "rowSpan", "scope", "headers", "abbr"],
};

function isNativeAttrForElement(element: string, name: string): boolean {
  if (GLOBAL_HTML_ATTRS.has(name)) return true;
  const specific = ELEMENT_HTML_ATTRS[element];
  return specific ? specific.includes(name) : false;
}

/**
 * Render a Zod issue as a one-line human message. Pulls enum / literal
 * options into the message so the violation is actionable ("expected
 * one of pill, underlined").
 */
function formatZodIssue(issue: z.ZodIssue | undefined, propName: string): string {
  if (!issue) return `failed validation for \`${propName}\`.`;
  if (issue.code === "invalid_enum_value") {
    return `expected one of ${issue.options.map(String).join(", ")} — got ${JSON.stringify((issue as { received?: unknown }).received)}.`;
  }
  if (issue.code === "invalid_literal") {
    return `expected ${JSON.stringify(issue.expected)} — got ${JSON.stringify(issue.received)}.`;
  }
  if (issue.code === "invalid_type") {
    return `expected ${issue.expected} — got ${issue.received}.`;
  }
  return issue.message;
}

/**
 * Suggest a similar prop name when the user / model typo'd a real prop.
 * Cheap Levenshtein-style closeness — find any prop whose lowercased
 * name shares ≥ 60% of its characters with the input.
 */
function suggestSimilar(propName: string, contract: ComponentContract): string {
  const lower = propName.toLowerCase();
  const candidates = Object.keys(contract.props);
  let best: { name: string; score: number } | null = null;
  for (const cand of candidates) {
    const score = similarity(lower, cand.toLowerCase());
    if (!best || score > best.score) best = { name: cand, score };
  }
  if (best && best.score >= 0.6) {
    return `Did you mean \`${best.name}\`?`;
  }
  const valid = candidates.slice(0, 5).join(", ");
  return `Valid props: ${valid}${candidates.length > 5 ? ", …" : ""}.`;
}

/** Cheap string-similarity (intersection / union of character sets). Good
 *  enough for typo suggestions; not a full Levenshtein. */
function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const setA = new Set(a);
  const setB = new Set(b);
  let inter = 0;
  setA.forEach((ch) => {
    if (setB.has(ch)) inter++;
  });
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : inter / union;
}

// ─── Formatting helper ─────────────────────────────────────────────────

/**
 * Render a `ViolationReport` as a one-line-per-violation human-readable
 * string. Used by the server-side console.warn in the chat route and by
 * the MCP adapter when echoing violations back to the host.
 */
export function formatViolations(result: ViolationReport): string {
  if (result.ok && result.violations.length === 0) {
    return `JSX validator: clean. (${result.componentsChecked} components checked)`;
  }
  const lines = [
    `JSX validator: ${result.violations.length} issue(s), ${result.componentsChecked} components checked.`,
  ];
  for (const v of result.violations) {
    const loc = v.line ? ` [${v.line}:${v.column}]` : "";
    const prop = v.prop ? ` ${v.prop}` : "";
    lines.push(`  ${v.severity.toUpperCase()} ${v.kind}${loc} <${v.component}>${prop}: ${v.message}`);
  }
  return lines.join("\n");
}

/**
 * Pull the first fenced ```jsx (or ```tsx) block out of a chat response.
 * Returns the body of the block, sans fences, with a trailing newline
 * stripped. Returns null if no block is found.
 *
 * Studio's system prompt instructs the model to emit a single fenced
 * `jsx` block; this is the inverse extractor for the validator's input.
 */
export function extractFencedJsxBlock(response: string): string | null {
  const re = /```(?:jsx|tsx)?\n([\s\S]*?)\n```/;
  const m = response.match(re);
  return m ? m[1].replace(/\n+$/, "") : null;
}
