/**
 * walk() — parse JSX/TSX source string and return walker IR.
 *
 * Strategy:
 *   1. Wrap the source in `<>...</>` if it's not already a complete JSX expression
 *      (so a bare `<Toolbar>...</Toolbar>` parses as an Expression Statement).
 *   2. Run acorn + acorn-jsx with ecmaVersion: "latest" and sourceType: "module".
 *   3. Find the first JSXElement / JSXFragment in the AST and recurse it into IR.
 *
 * Conversion rules:
 *   - JSXElement → IRNode { type, props, slots }
 *   - JSXFragment (or sibling JSXElements after wrapping) → IRFrame with no layout
 *   - JSXExpressionContainer → IRExpression (source text between the braces)
 *   - JSXText → trimmed string (empty/whitespace-only strings are dropped)
 *   - JSXAttribute whose value is a JSXElement/JSXFragment → goes into slots
 *   - JSXAttribute whose value is a Literal/JSXExpressionContainer w/ Literal → goes into props
 *   - The default `children` mapping lands under the `content` slot per Grade convention
 */

import { Parser, type Node as AcornNode } from "acorn";
import jsx from "acorn-jsx";
import type {
  IRChild,
  IRDiagnostic,
  IRExpression,
  IRFrame,
  IRNode,
  IRRoot,
  PropValue,
} from "./ir";
import { isKnown } from "./registry";

// Parser instance — acorn + JSX plugin. Reuse across calls.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const JsxParser = Parser.extend(jsx() as any);

// ─── Public entry ────────────────────────────────────────────────────────

export interface WalkOptions {
  /** Optional payload name. Surfaced as IRRoot.name. */
  name?: string;
  /** When true, unknown PascalCase tags don't raise diagnostics. */
  permissive?: boolean;
  /**
   * Prop names to drop from the IR (and therefore from the Walked JSX
   * + JSON payload). String patterns are exact-match; RegExp patterns
   * test the prop name. Defaults to empty — IR is faithful unless the
   * caller opts in.
   *
   * Useful pre-sets for the Studio integration:
   *   - `/^data-/` — drops the Studio selection agent's injected
   *     `data-gds-source-id` (and any other host-app data-attribute).
   *   - `"className"` — drops Tailwind class strings. Figma component
   *     variants don't read className anyway.
   */
  excludeProps?: (string | RegExp)[];
  /**
   * Component types to drop from the IR. Matched nodes are removed from
   * their parent's slot (NOT replaced with a placeholder). Diagnostic
   * raised at info level so the user knows something was filtered.
   *
   * Pre-set for the Studio integration: every PascalCase lucide-react
   * export. Icons emitted in the JSX (e.g. `<Settings />`, `<Trash2 />`)
   * resolve to non-existent components in the Figma file otherwise. If
   * the design system later gains a Figma `Icon` component with a
   * `name=` variant, swap this from "drop" to "rewrite" via the
   * sidecar layer described in FIGMA-MAPPINGS.md.
   */
  excludeTypes?: (string | RegExp)[];
  /**
   * Type rewrite rules. Each matched IR node has its `type` replaced
   * with the rule's `to` value, and the original type name is injected
   * as a prop (default key `name`, transformed via `transform` if set).
   *
   * Designed for the lucide-icons case: hundreds of distinct React
   * components (`Settings`, `Trash2`, `UserCircle`) collapse into one
   * Figma `Icon` component with a `name` variant, avoiding name
   * collisions with the host design system's own components.
   *
   * Existing props and slots on the matched element are preserved —
   * a rewrite is a `type` swap plus a prop injection, not a wipe.
   */
  rewriteTypes?: RewriteRule[];
  /**
   * Component types to unwrap — the wrapper is dropped from the IR
   * but its children are inlined into the parent's slot. Use this for
   * React-only convenience components that have no Figma counterpart
   * (e.g. `CardTitle`, `CardDescription` — these usually just style
   * a string and don't exist as Figma components on their own).
   *
   * Difference from `excludeTypes`: exclude drops the node AND its
   * children; unwrap keeps the children. Difference from `rewriteTypes`:
   * rewrite renames the node; unwrap removes it entirely.
   *
   * Props on the unwrapped element are dropped (they were on the
   * wrapper, not the content). Non-content slots are dropped with a
   * diagnostic — unwrap is intended for simple text/wrapper components.
   */
  unwrapTypes?: (string | RegExp | ((name: string) => boolean))[];
}

/** A single type-rewrite rule for {@link WalkOptions.rewriteTypes}. */
export interface RewriteRule {
  /**
   * Predicate against the original IR type name. String = exact match;
   * RegExp = `.test`; function = called with the name, returns boolean.
   */
  match: string | RegExp | ((name: string) => boolean);
  /**
   * New `type` value. Two shapes:
   *
   * - **String** — many-to-one collapse. Every matched element becomes
   *   the same `type`. Pair with `propName` so the original name is
   *   preserved as a variant (e.g. `to: "Icon"`, `propName: "name"`).
   *
   * - **Function** — many-to-many rename. Each matched element keeps
   *   its identity but the type string is transformed. Use this when
   *   the React naming convention (PascalCase) differs from the Figma
   *   file's (kebab-case, snake_case). No `propName` needed — the
   *   transformed name IS the new type.
   */
  to: string | ((originalName: string) => string);
  /**
   * Prop key to receive the original type name. Only meaningful when
   * `to` is a string (the many-to-one case). Defaults to `"name"`.
   * If `to` is a function and `propName` is unset, no prop is injected.
   */
  propName?: string;
  /**
   * Transform applied to the original type name before it becomes the
   * prop value. Only meaningful with `propName`. Defaults to identity.
   */
  transform?: (originalName: string) => string;
}

export function walk(source: string, opts: WalkOptions = {}): IRRoot {
  const diagnostics: IRDiagnostic[] = [];

  // The model emits one of three shapes:
  //   a) A standalone JSX element: `<Toolbar>...</Toolbar>`
  //   b) A full app source with `export default function App() { return (<Toolbar/>) }`
  //   c) A list of sibling JSXs (rare but possible during streaming)
  //
  // Strategy: try to find the *largest* JSXElement / JSXFragment in the AST.
  // For (b) that's the JSX inside the return statement. For (a) it's the
  // ExpressionStatement's expression. For (c) it's a fragment we synthesise.
  //
  // To avoid implementing return-statement detection, we just walk the
  // ESTree top-down looking for any JSX node. The first one we hit (after
  // skipping import/function-wrapper nodes) is the root.

  let ast: AcornNode;
  try {
    ast = JsxParser.parse(source, {
      sourceType: "module",
      ecmaVersion: "latest",
      locations: false,
      allowReturnOutsideFunction: true,
      allowImportExportEverywhere: true,
    });
  } catch (firstErr) {
    // Wrap in a fragment and retry — handles the bare-expression case
    // when the source itself is just JSX (not a module).
    try {
      ast = JsxParser.parse(`<>${source}</>`, {
        sourceType: "module",
        ecmaVersion: "latest",
        locations: false,
      });
    } catch {
      diagnostics.push({
        level: "error",
        path: "root",
        message: `Parse failed: ${(firstErr as Error).message}`,
      });
      return { name: opts.name, root: { type: "$expression", source }, diagnostics };
    }
  }

  const jsxRoot = findFirstJsx(ast);
  if (!jsxRoot) {
    diagnostics.push({
      level: "warning",
      path: "root",
      message: "No JSX element found in source.",
    });
    return { name: opts.name, root: { type: "$expression", source }, diagnostics };
  }

  const rootResult = convert(jsxRoot, source, diagnostics, "root", opts);
  // Three shapes the root can come back as:
  //   - null: filtered out entirely (excludeTypes matched the root —
  //     vanishingly rare; emit a tombstone expression to keep IR valid).
  //   - IRChild[]: the root was unwrapped — wrap inlined children in a
  //     $frame so we still have a single root.
  //   - IRChild: normal case.
  const root: IRChild =
    rootResult === null
      ? { type: "$expression", source: "" }
      : Array.isArray(rootResult)
        ? rootResult.length === 1
          ? rootResult[0]!
          : { type: "$frame", children: rootResult }
        : rootResult;
  return { name: opts.name, root, diagnostics };
}

// ─── AST scanning ────────────────────────────────────────────────────────

interface JsxAttr {
  type: "JSXAttribute";
  name: { type: "JSXIdentifier"; name: string } | { type: "JSXNamespacedName" };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any | null;
}

interface JsxElementNode {
  type: "JSXElement";
  openingElement: {
    name:
      | { type: "JSXIdentifier"; name: string }
      | { type: "JSXMemberExpression"; object: unknown; property: { name: string } };
    attributes: JsxAttr[];
    selfClosing: boolean;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: any[];
  start: number;
  end: number;
}

interface JsxFragmentNode {
  type: "JSXFragment";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: any[];
  start: number;
  end: number;
}

type JsxRoot = JsxElementNode | JsxFragmentNode;

function findFirstJsx(node: unknown): JsxRoot | null {
  if (!node || typeof node !== "object") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const n = node as any;
  if (n.type === "JSXElement" || n.type === "JSXFragment") return n as JsxRoot;
  // Recursively search every child key.
  for (const key of Object.keys(n)) {
    if (key === "loc" || key === "range" || key === "start" || key === "end") continue;
    const v = n[key];
    if (Array.isArray(v)) {
      for (const item of v) {
        const found = findFirstJsx(item);
        if (found) return found;
      }
    } else if (v && typeof v === "object") {
      const found = findFirstJsx(v);
      if (found) return found;
    }
  }
  return null;
}

// ─── Conversion: AST → IR ───────────────────────────────────────────────

/**
 * Returned by {@link convert}. Three shapes:
 *   - null              — element was filtered out by excludeTypes
 *   - IRChild           — normal case (single node)
 *   - IRChild[]         — element was unwrapped; caller inlines into parent
 */
type ConvertResult = IRChild | IRChild[] | null;

function convert(
  jsxNode: JsxRoot,
  source: string,
  diagnostics: IRDiagnostic[],
  path: string,
  opts: WalkOptions,
): ConvertResult {
  if (jsxNode.type === "JSXFragment") {
    const children = convertChildren(jsxNode.children, source, diagnostics, path, opts);
    // A fragment with a single child collapses to that child — keeps
    // `walk("<Button/>")` returning `{ type: "Button" }` and not a $frame.
    if (children.length === 1) return children[0]!;
    const frame: IRFrame = {
      type: "$frame",
      children,
    };
    return frame;
  }

  const name = jsxTagName(jsxNode);
  if (!name) {
    diagnostics.push({
      level: "warning",
      path,
      message: "JSX element with non-identifier name (e.g. <Foo.Bar/>) — emitted as expression.",
    });
    return { type: "$expression", source: source.slice(jsxNode.start, jsxNode.end) };
  }

  // Caller-side type exclusion (lucide icons, etc.). Diagnostic raised
  // at info so dropped nodes are visible if the user goes looking, but
  // not surfaced in the panel's warning strip (which only shows
  // warning + error levels).
  if (matchesExclusion(name, opts.excludeTypes)) {
    diagnostics.push({
      level: "info",
      path,
      message: `Dropped <${name}/> — matched excludeTypes pattern.`,
    });
    return null;
  }

  // Unwrap — the React wrapper is dropped, but its content is kept and
  // inlined into the parent's slot. Used for components without a
  // Figma counterpart (CardTitle, CardDescription, fragmenty helpers).
  // Evaluated before rewrite so unwrap wins if a name matches both.
  if (matchesAnyPattern(name, opts.unwrapTypes)) {
    const children = convertChildren(
      jsxNode.children,
      source,
      diagnostics,
      path,
      opts,
    );
    diagnostics.push({
      level: "info",
      path,
      message: `Unwrapped <${name}/> — ${children.length} child${children.length === 1 ? "" : "ren"} inlined into parent.`,
    });
    return children;
  }

  // Type rewrites — many-to-one collapses (`lucide → Icon`) or
  // many-to-many renames (`PascalCase → kebab-case`). Evaluated after
  // exclusions so an exclude rule always wins over a rewrite.
  const rewrite = matchRewrite(name, opts.rewriteTypes);
  const effectiveName = rewrite
    ? typeof rewrite.to === "function"
      ? rewrite.to(name)
      : rewrite.to
    : name;
  // Inject the original-name prop only when explicitly asked. The
  // many-to-many rename case (function `to`, no `propName`) doesn't
  // need it — the transformed name IS the new type.
  const injectedProp =
    rewrite && rewrite.propName
      ? {
          key: rewrite.propName,
          value: (rewrite.transform ?? identity)(name),
        }
      : rewrite && typeof rewrite.to === "string"
        ? {
            // Default propName when `to` is a string and propName is
            // unset — preserves the many-to-one ergonomics where
            // `{ to: "Icon" }` injects `name` by default.
            key: "name",
            value: (rewrite.transform ?? identity)(name),
          }
        : null;
  if (rewrite) {
    diagnostics.push({
      level: "info",
      path,
      message: injectedProp
        ? `Rewrote <${name}/> → <${effectiveName} ${injectedProp.key}="${injectedProp.value}"/>`
        : `Renamed <${name}/> → <${effectiveName}/>`,
    });
  }

  if (!opts.permissive && /^[A-Z]/.test(effectiveName) && !isKnown(effectiveName)) {
    diagnostics.push({
      level: "warning",
      path,
      message: `Unknown component "${effectiveName}" — not in the walker registry. Did you forget registerAll(Grade)?`,
    });
  }

  // Native HTML tags ('div', 'span') are lowercase and not part of the Grade
  // taxonomy. Emit them as $frame directives so the plugin can still draw
  // them as ad-hoc layout containers rather than failing on a missing
  // Figma component.
  if (/^[a-z]/.test(name)) {
    const layoutFrame: IRFrame = {
      type: "$frame",
      name,
      children: convertChildren(jsxNode.children, source, diagnostics, `${path}.children`, opts),
    };
    return layoutFrame;
  }

  const { props, slotProps } = extractAttributes(
    jsxNode.openingElement.attributes,
    source,
    diagnostics,
    path,
    opts,
  );

  const content = convertChildren(jsxNode.children, source, diagnostics, `${path}.slots.content`, opts);

  const slots: Record<string, IRChild[]> = {};
  if (content.length) slots.content = content;
  for (const [k, v] of Object.entries(slotProps)) {
    if (v.length) slots[k] = v;
  }

  // If a rewrite rule matched, inject the original-name prop. We do
  // this LAST so an explicit `name=` in the JSX wins over the injected
  // one — protects against the (rare) case where a Grade component
  // happens to share a name with a lucide icon and the user wrote an
  // explicit prop the walker shouldn't clobber.
  const mergedProps =
    injectedProp && !(injectedProp.key in props)
      ? { ...props, [injectedProp.key]: injectedProp.value }
      : props;

  const node: IRNode = {
    type: effectiveName,
    loc: { start: jsxNode.start, end: jsxNode.end },
  };
  if (Object.keys(mergedProps).length) node.props = mergedProps;
  if (Object.keys(slots).length) node.slots = slots;
  return node;
}

function identity(s: string): string {
  return s;
}

function matchRewrite(
  name: string,
  rules: RewriteRule[] | undefined,
): RewriteRule | null {
  if (!rules || !rules.length) return null;
  for (const rule of rules) {
    const m = rule.match;
    if (typeof m === "string") {
      if (m === name) return rule;
    } else if (typeof m === "function") {
      if (m(name)) return rule;
    } else if (m.test(name)) {
      return rule;
    }
  }
  return null;
}

/**
 * Generic matcher used by both excludeTypes (string|RegExp only) and
 * unwrapTypes (string|RegExp|fn). Returns true if any pattern fires.
 */
function matchesAnyPattern(
  name: string,
  patterns: (string | RegExp | ((name: string) => boolean))[] | undefined,
): boolean {
  if (!patterns || !patterns.length) return false;
  for (const p of patterns) {
    if (typeof p === "string") {
      if (p === name) return true;
    } else if (typeof p === "function") {
      if (p(name)) return true;
    } else if (p.test(name)) {
      return true;
    }
  }
  return false;
}

function matchesExclusion(
  name: string,
  patterns: (string | RegExp)[] | undefined,
): boolean {
  if (!patterns || !patterns.length) return false;
  for (const p of patterns) {
    if (typeof p === "string") {
      if (p === name) return true;
    } else if (p.test(name)) {
      return true;
    }
  }
  return false;
}

function jsxTagName(n: JsxElementNode): string | null {
  const open = n.openingElement.name;
  if (open.type === "JSXIdentifier") return open.name;
  // JSXMemberExpression (e.g. <Card.Header />). Treat the leaf as the name.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const me = open as any;
  if (me.property?.name) return me.property.name;
  return null;
}

// ─── Children ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertChildren(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawChildren: any[],
  source: string,
  diagnostics: IRDiagnostic[],
  path: string,
  opts: WalkOptions,
): IRChild[] {
  const out: IRChild[] = [];
  let i = 0;
  for (const c of rawChildren) {
    const childPath = `${path}[${i}]`;
    if (!c || typeof c !== "object") continue;

    if (c.type === "JSXText") {
      const trimmed = (c.value as string).replace(/\s+/g, " ").trim();
      if (trimmed) out.push(trimmed);
      // No `i++` for dropped whitespace — keeps `path` indices aligned
      // with what the user sees in the JSX, not what the AST emits.
      continue;
    }
    if (c.type === "JSXElement" || c.type === "JSXFragment") {
      const result = convert(c, source, diagnostics, childPath, opts);
      // Three shapes — single, multi (unwrap), or null (exclude).
      if (Array.isArray(result)) {
        out.push(...result);
      } else if (result !== null) {
        out.push(result);
      }
      // Increment regardless — the user-facing path-index in the
      // diagnostic message should match the JSX source position even
      // when a node gets filtered out.
      i++;
      continue;
    }
    if (c.type === "JSXExpressionContainer") {
      const expr = c.expression;
      if (expr.type === "JSXEmptyExpression") continue;
      // Static string / number / bool literal in `{ ... }` — promote to scalar.
      if (expr.type === "Literal") {
        const v = expr.value;
        if (typeof v === "string") {
          if (v.trim()) out.push(v);
          continue;
        }
        if (typeof v === "number" || typeof v === "boolean") {
          out.push(String(v));
          continue;
        }
        // null / undefined / regex — drop with a diagnostic.
        diagnostics.push({
          level: "info",
          path: childPath,
          message: `Literal of unsupported type "${typeof v}" — dropped.`,
        });
        continue;
      }
      if (expr.type === "TemplateLiteral" && expr.expressions.length === 0) {
        out.push(expr.quasis.map((q: { value: { cooked: string } }) => q.value.cooked).join(""));
        continue;
      }
      // Anything else (binary expression, call, conditional, identifier) —
      // round-trips as an opaque expression. Diagnostics flag it so the
      // payload emitter can choose to skip or stringify.
      const src = source.slice(c.start + 1, c.end - 1).trim();
      const expression: IRExpression = { type: "$expression", source: src };
      out.push(expression);
      diagnostics.push({
        level: "info",
        path: childPath,
        message: `Dynamic expression "{${src.length > 40 ? src.slice(0, 40) + "…" : src}}" — emitted as $expression.`,
      });
      i++;
      continue;
    }
    if (c.type === "JSXSpreadChild") {
      diagnostics.push({
        level: "warning",
        path: childPath,
        message: "JSX spread child (`{...arr}`) not supported — dropped.",
      });
      continue;
    }
  }
  return out;
}

// ─── Attributes (props + slots) ─────────────────────────────────────────

function extractAttributes(
  attrs: JsxAttr[],
  source: string,
  diagnostics: IRDiagnostic[],
  path: string,
  opts: WalkOptions,
): { props: Record<string, PropValue>; slotProps: Record<string, IRChild[]> } {
  const props: Record<string, PropValue> = {};
  const slotProps: Record<string, IRChild[]> = {};
  let i = 0;
  for (const a of attrs) {
    if (a.type !== "JSXAttribute") {
      i++;
      continue;
    }
    if (a.name.type !== "JSXIdentifier") {
      diagnostics.push({
        level: "warning",
        path: `${path}.attr[${i}]`,
        message: "Namespaced JSX attribute (e.g. xlink:href) skipped.",
      });
      i++;
      continue;
    }
    const propName = a.name.name;

    // Caller-side exclusions (e.g. data-* + className for Studio).
    // Dropped silently — no diagnostic because they're not bugs, they're
    // the host app saying "this prop is implementation noise for my
    // downstream target."
    if (matchesExclusion(propName, opts.excludeProps)) {
      i++;
      continue;
    }

    // Bare attribute `<Foo bar />` → boolean true.
    if (a.value === null) {
      props[propName] = true;
      i++;
      continue;
    }

    // String literal `<Foo bar="baz" />`.
    if (a.value.type === "Literal") {
      const v = a.value.value;
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        props[propName] = v;
      } else {
        diagnostics.push({
          level: "info",
          path: `${path}.props.${propName}`,
          message: `Non-scalar literal (${typeof v}) — dropped.`,
        });
      }
      i++;
      continue;
    }

    // Expression container — could be a slot (JSXElement inside) or a static literal.
    if (a.value.type === "JSXExpressionContainer") {
      const inner = a.value.expression;
      if (inner.type === "JSXElement" || inner.type === "JSXFragment") {
        const result = convert(inner, source, diagnostics, `${path}.slots.${propName}`, opts);
        // Excluded types vanish from the slot entirely. Unwrap results
        // (arrays) are spread into the slot. The empty array is dropped
        // downstream by stripChildren in to-payload.
        if (Array.isArray(result)) {
          if (result.length) slotProps[propName] = result;
        } else if (result !== null) {
          slotProps[propName] = [result];
        }
        i++;
        continue;
      }
      if (
        inner.type === "ArrayExpression" &&
        inner.elements.every(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (e: any) => e && (e.type === "JSXElement" || e.type === "JSXFragment"),
        )
      ) {
        const children: IRChild[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        inner.elements.forEach((e: any, idx: number) => {
          const r = convert(e, source, diagnostics, `${path}.slots.${propName}[${idx}]`, opts);
          if (Array.isArray(r)) children.push(...r);
          else if (r !== null) children.push(r);
        });
        if (children.length) {
          slotProps[propName] = children;
        }
        i++;
        continue;
      }
      if (inner.type === "Literal") {
        const v = inner.value;
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
          props[propName] = v;
          i++;
          continue;
        }
      }
      if (inner.type === "TemplateLiteral" && inner.expressions.length === 0) {
        props[propName] = inner.quasis
          .map((q: { value: { cooked: string } }) => q.value.cooked)
          .join("");
        i++;
        continue;
      }
      // Unresolved expression — drop with a diagnostic. We could carry
      // these as $expression slots, but for the v1 Figma path the
      // plugin can't render dynamic values anyway, so flag-and-skip
      // beats emitting noise the user has to scrub manually.
      diagnostics.push({
        level: "info",
        path: `${path}.props.${propName}`,
        message: "Dynamic prop value — not serialisable to Figma; dropped.",
      });
      i++;
      continue;
    }

    if (a.value.type === "JSXElement" || a.value.type === "JSXFragment") {
      // Some parsers allow `<Foo slot=<Bar/>/>` without braces.
      const result = convert(a.value, source, diagnostics, `${path}.slots.${propName}`, opts);
      if (Array.isArray(result)) {
        if (result.length) slotProps[propName] = result;
      } else if (result !== null) {
        slotProps[propName] = [result];
      }
      i++;
      continue;
    }

    diagnostics.push({
      level: "info",
      path: `${path}.props.${propName}`,
      message: `Unhandled attribute value type "${a.value.type}".`,
    });
    i++;
  }
  return { props, slotProps };
}
