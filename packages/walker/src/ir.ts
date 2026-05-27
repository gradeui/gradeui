/**
 * Walker IR — the in-memory shape we keep between parsing the JSX source
 * and emitting either a Figma payload or a pretty-printed JSX string.
 *
 * Designed to be a strict superset of the plugin payload format
 * (gradeui-figma/code-to-figma-ready-latest/README.md). One extra field —
 * `expression` — carries verbatim source for any JSX content the parser
 * couldn't statically resolve (e.g. `{items.map(...)}`, `{isOpen && <X />}`).
 * Those round-trip back into JSX, and are flagged in diagnostics when
 * serialized to a payload.
 */

/** A literal value usable as a prop (variant axis or boolean flag). */
export type PropValue = string | number | boolean;

/** A single node in the IR tree. */
export interface IRNode {
  /** PascalCase component name as it appears in JSX, e.g. "Button". */
  type: string;
  /** Static props extracted from JSX attributes. Lowercase by Grade convention. */
  props?: Record<string, PropValue>;
  /** Slot contents keyed by slot name. `content` is the canonical primary slot. */
  slots?: Record<string, IRChild[]>;
  /** Optional source-coordinates for debugging / future per-instance state. */
  loc?: { start: number; end: number };
}

/** $frame directive — an ad-hoc layout container with no Figma component. */
export interface IRFrame {
  type: "$frame";
  name?: string;
  layout?: {
    direction?: "horizontal" | "vertical";
    gap?: number;
    padding?: number | { top?: number; right?: number; bottom?: number; left?: number };
    align?: "start" | "center" | "end" | "stretch";
    justify?: "start" | "center" | "end" | "space-between";
    wrap?: boolean;
  };
  children: IRChild[];
}

/** An unresolved JSX expression — `{foo.bar}`, `{items.map(...)}`, etc. */
export interface IRExpression {
  type: "$expression";
  /** Verbatim source between the curly braces, trimmed. */
  source: string;
}

/** Anything that can live inside a slot or a $frame's children. */
export type IRChild = IRNode | IRFrame | IRExpression | string;

/** A diagnostic raised during parsing or payload emission. */
export interface IRDiagnostic {
  level: "warning" | "error" | "info";
  /** Dotted path through the tree, e.g. "root.slots.content[0].slots.content[1]". */
  path: string;
  message: string;
}

/** Top-level walker output. */
export interface IRRoot {
  /** Optional human label; used as the payload's `name` field. */
  name?: string;
  /** Root node — typically a single component or a $frame wrapping siblings. */
  root: IRChild;
  /** Issues raised during parsing. Empty array on a clean walk. */
  diagnostics: IRDiagnostic[];
}
