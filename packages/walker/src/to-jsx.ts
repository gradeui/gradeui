/**
 * toJsx(ir) — IR → pretty-printed JSX source.
 *
 * Used by the Code tab's JSX view: takes the walker IR and emits idiomatic
 * JSX so what the designer sees is what the model emitted, minus formatting
 * noise. The roundtrip is intentionally lossy on whitespace and comments —
 * we're showing a cleaned, canonicalised view, not preserving the original
 * byte-for-byte source.
 *
 * Rules:
 *   - Children (slot key "content") emit as JSX children, not as a `content={}` prop
 *   - Other slots emit as JSX attributes: `leading={<Breadcrumbs ... />}`
 *   - Props emit as attributes: `variant="default"`, `disabled`
 *   - $frame directives become `<div>` (or with layout, an inferred utility div)
 *   - $expression nodes round-trip as `{<source>}`
 */

import type {
  IRChild,
  IRExpression,
  IRFrame,
  IRNode,
  IRRoot,
} from "./ir";

export interface ToJsxOptions {
  /** Indent width in spaces. Default 2. */
  indent?: number;
}

export function toJsx(ir: IRRoot, opts: ToJsxOptions = {}): string {
  const indent = opts.indent ?? 2;
  return renderChild(ir.root, 0, indent);
}

function renderChild(c: IRChild, depth: number, step: number): string {
  if (typeof c === "string") return c;
  if (isExpression(c)) return `{${c.source}}`;
  if (isFrame(c)) return renderFrame(c, depth, step);
  return renderNode(c, depth, step);
}

function isFrame(c: IRNode | IRFrame): c is IRFrame {
  return c.type === "$frame";
}

function renderNode(n: IRNode, depth: number, step: number): string {
  const pad = " ".repeat(depth * step);
  const propParts = renderProps(n.props);
  // `content` slot becomes children. Anything else becomes a JSX attribute.
  const otherSlots: string[] = [];
  if (n.slots) {
    for (const [k, v] of Object.entries(n.slots)) {
      if (k === "content") continue;
      otherSlots.push(renderSlotAttr(k, v, depth + 1, step));
    }
  }
  const attrs = [...propParts, ...otherSlots];
  const attrStr = attrs.length ? " " + attrs.join(" ") : "";

  const children = n.slots?.content ?? [];
  if (!children.length) {
    return `${pad}<${n.type}${attrStr} />`;
  }
  // Single text child stays on one line for compactness.
  if (children.length === 1 && typeof children[0] === "string") {
    return `${pad}<${n.type}${attrStr}>${children[0]}</${n.type}>`;
  }
  const inner = children.map((c) => renderChild(c, depth + 1, step)).join("\n");
  return `${pad}<${n.type}${attrStr}>\n${inner}\n${pad}</${n.type}>`;
}

function renderFrame(f: IRFrame, depth: number, step: number): string {
  const pad = " ".repeat(depth * step);
  const tag = f.name ?? "div";
  // For v1 we don't translate layout objects back to className utilities —
  // the IR carries the structured layout, but the JSX view doesn't need
  // to round-trip it. The payload view does.
  if (!f.children.length) return `${pad}<${tag} />`;
  const inner = f.children.map((c) => renderChild(c, depth + 1, step)).join("\n");
  return `${pad}<${tag}>\n${inner}\n${pad}</${tag}>`;
}

function renderProps(props?: Record<string, string | number | boolean>): string[] {
  if (!props) return [];
  const out: string[] = [];
  for (const [k, v] of Object.entries(props)) {
    if (v === true) {
      out.push(k);
      continue;
    }
    if (v === false) {
      out.push(`${k}={false}`);
      continue;
    }
    if (typeof v === "number") {
      out.push(`${k}={${v}}`);
      continue;
    }
    out.push(`${k}=${JSON.stringify(v)}`);
  }
  return out;
}

function renderSlotAttr(
  name: string,
  children: IRChild[],
  depth: number,
  step: number,
): string {
  if (children.length === 1) {
    const c = children[0]!;
    if (typeof c === "string") return `${name}=${JSON.stringify(c)}`;
    const inner = renderChild(c, 0, step);
    return `${name}={${inner}}`;
  }
  const pad = " ".repeat(depth * step);
  const inner = children
    .map((c) => renderChild(c, depth + 1, step))
    .join(",\n");
  return `${name}={[\n${inner}\n${pad}]}`;
}

function isExpression(c: unknown): c is IRExpression {
  return typeof c === "object" && c !== null && (c as { type: unknown }).type === "$expression";
}
