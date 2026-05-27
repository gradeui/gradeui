/**
 * toPayload(ir) — IR → Grade payload JSON, the shape the code-to-figma
 * Figma plugin consumes (see gradeui-figma/code-to-figma-ready-latest/README.md).
 *
 * Strips IR-only metadata (loc, $expression nodes) and produces a tree
 * matching the plugin's expected schema:
 *
 *   { name?, root: { type, props?, slots?, ... } }
 *
 * $expression nodes are dropped from slots (with a diagnostic appended)
 * because the plugin can't render dynamic JSX. If a slot becomes empty
 * after stripping, the slot key is dropped too.
 */

import type {
  IRChild,
  IRDiagnostic,
  IRExpression,
  IRFrame,
  IRNode,
  IRRoot,
} from "./ir";

// ─── Plugin payload types (mirror the plugin's schema 1:1) ──────────────

export interface PayloadFrame {
  type: "$frame";
  name?: string;
  layout?: IRFrame["layout"];
  children: PayloadChild[];
}

export interface PayloadNode {
  type: string;
  props?: Record<string, string | boolean | number>;
  slots?: Record<string, PayloadChild[]>;
  name?: string;
}

export type PayloadChild = PayloadNode | PayloadFrame | string;

export interface Payload {
  name?: string;
  root: PayloadChild;
}

// ─── Conversion ─────────────────────────────────────────────────────────

export interface ToPayloadResult {
  payload: Payload;
  /** Includes any new diagnostics raised during the payload pass. */
  diagnostics: IRDiagnostic[];
}

export function toPayload(ir: IRRoot): ToPayloadResult {
  const diagnostics: IRDiagnostic[] = [...ir.diagnostics];
  const root = stripChild(ir.root, "root", diagnostics);
  // If the IR root collapsed entirely (an expression-only source), emit
  // an empty $frame as a safe stub the plugin can still render.
  const safeRoot: PayloadChild = root ?? { type: "$frame", children: [] };
  return {
    payload: ir.name ? { name: ir.name, root: safeRoot } : { root: safeRoot },
    diagnostics,
  };
}

/** Stringified payload, ready to land on the clipboard. */
export function toPayloadString(ir: IRRoot, name?: string): string {
  const withName = name ? { ...ir, name } : ir;
  return JSON.stringify(toPayload(withName).payload, null, 2);
}

function stripChild(
  c: IRChild,
  path: string,
  diagnostics: IRDiagnostic[],
): PayloadChild | null {
  if (typeof c === "string") return c;
  if (isExpression(c)) {
    diagnostics.push({
      level: "warning",
      path,
      message: `Dropped dynamic expression "{${preview(c.source)}}" — not serialisable to Figma.`,
    });
    return null;
  }
  if (isFrame(c)) {
    const frame: PayloadFrame = {
      type: "$frame",
      ...(c.name ? { name: c.name } : {}),
      ...(c.layout ? { layout: c.layout } : {}),
      children: stripChildren(c.children, `${path}.children`, diagnostics),
    };
    return frame;
  }
  return stripNode(c, path, diagnostics);
}

function stripNode(
  n: IRNode,
  path: string,
  diagnostics: IRDiagnostic[],
): PayloadNode {
  const out: PayloadNode = { type: n.type };
  if (n.props && Object.keys(n.props).length) {
    out.props = { ...n.props };
  }
  if (n.slots) {
    const slots: Record<string, PayloadChild[]> = {};
    for (const [k, v] of Object.entries(n.slots)) {
      const stripped = stripChildren(v, `${path}.slots.${k}`, diagnostics);
      if (stripped.length) slots[k] = stripped;
    }
    if (Object.keys(slots).length) out.slots = slots;
  }
  return out;
}

function stripChildren(
  children: IRChild[],
  path: string,
  diagnostics: IRDiagnostic[],
): PayloadChild[] {
  const out: PayloadChild[] = [];
  let i = 0;
  for (const c of children) {
    const result = stripChild(c, `${path}[${i}]`, diagnostics);
    if (result !== null) out.push(result);
    i++;
  }
  return out;
}

function isExpression(c: unknown): c is IRExpression {
  return typeof c === "object" && c !== null && (c as { type: unknown }).type === "$expression";
}

function isFrame(c: IRNode | IRFrame): c is IRFrame {
  return c.type === "$frame";
}

function preview(s: string): string {
  return s.length > 40 ? s.slice(0, 40) + "…" : s;
}
