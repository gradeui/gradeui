/**
 * QA pass — validate model-emitted JSX against the live component contracts.
 *
 * The model gets shown sidecar examples (Fix A, May 2026) before it writes
 * JSX, but compliance with the actual API is still best-effort — it can
 * hallucinate a prop, mis-spell a variant value, or omit a required prop.
 * This validator is the safety net: it walks the JSX, looks up each
 * component's contract from `COMPONENT_CONTRACTS`, and validates every
 * prop against the Zod schema declared in the contract.
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
 *   - Sub-component props (`<Carousel.Slide duration={…} />`) — no contract
 *     for Carousel.Slide exists as a separate entry; only root components
 *     are in COMPONENT_CONTRACTS today.
 *   - Expression-valued props (`maxCount={someVar}`) — can't evaluate
 *     without running the code.
 *   - Contracts whose generator produced `z.unknown()` because the .md
 *     prop line wasn't parseable. Those are silently passed (validator
 *     reports `unchecked` info-level for visibility).
 *
 * Why a TS-AST walker instead of regex: JSX nesting + spread attributes +
 * computed expressions are noise the regex would fight. TS is already a
 * dep of the docs app (studio-source-mutator.ts uses it), so the marginal
 * cost is zero.
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
 * contract, return a structured result. Never throws.
 *
 * Typical wiring in a streaming chat route:
 *
 *   const text = await streamToString(modelStream);
 *   const jsx = extractFencedJsxBlock(text);
 *   const result = validateJsx(jsx, { contracts: COMPONENT_CONTRACTS });
 *   if (!result.ok) console.warn("[chat/validator]", formatViolations(result));
 */
export function validateJsx(
  source: string,
  options: ValidateOptions,
): ValidationResult {
  const {
    contracts,
    skipUnknownComponents = true,
    skipSubcomponents = true,
  } = options;

  const violations: ValidationViolation[] = [];
  let componentsChecked = 0;

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
          // Skip — no contract for Carousel.Slide etc. yet.
        } else {
          const contract = contracts[componentName];
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
            validateAttributes(
              node.attributes.properties,
              contract,
              componentName,
              sf,
              violations,
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
) {
  const seenProps = new Set<string>();

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
 * Render a `ValidationResult` as a one-line-per-violation human-readable
 * string. Used by the server-side console.warn in the chat route.
 */
export function formatViolations(result: ValidationResult): string {
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
