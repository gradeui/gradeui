"use client";

/**
 * ComponentProps — read-only docs renderer for a `ComponentContract`.
 *
 * Replaces the hand-authored `<PropsTable />` on component docs pages.
 * The point: the contract IS the source of truth for prop names, types,
 * defaults, and design taxonomy. Reading from the contract directly
 * means docs update when the contract changes — no per-page maintenance.
 *
 * Two callers, same data:
 *
 *   <ComponentProps>           — the read-only docs surface (this file)
 *   <StudioSettingsPanel>      — the live mutator inside Studio
 *
 * Both walk `contract.props` and render one row per prop. Studio's
 * version also wires onChange + filters by `design`. This one
 * pretty-prints the Zod schema as a TypeScript type signature and
 * tags each row with a `design` badge so designers can see at a glance
 * which props are knobs vs content vs plumbing.
 *
 * Architecture note: the Zod printer is hand-rolled (~80 lines) rather
 * than pulling `zod-to-ts`. Contracts use a tight Zod surface
 * (string, number, boolean, enum, literal, union, optional, object,
 * array, function, record, unknown) and the printer handles each
 * explicitly. Falls back to `"unknown"` for shapes we haven't taught
 * it — better to print conservatively than to mis-print a complex
 * shape.
 */

import * as React from "react";
import type { z } from "zod";
import type {
  ComponentContract,
  Design,
  PropContract,
} from "@gradeui/contracts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ComponentPropsProps {
  /** Contract to render. Usually imported from a `*.contract.ts` file
   *  alongside the component, or pulled from `COMPONENT_CONTRACTS`. */
  contract: ComponentContract;
  /** Which design axes to include in the table. Default shows the
   *  "user-facing" ones — knob / content / structured. Plumbing /
   *  event / ref are usually noise on a docs page; pass `"all"` to
   *  include them too. */
  show?: ReadonlyArray<Design> | "all";
  className?: string;
}

const DEFAULT_SHOW: ReadonlyArray<Design> = ["knob", "content", "structured"];

const DESIGN_BADGE: Record<Design, { label: string; tone: string }> = {
  knob: {
    label: "knob",
    tone: "bg-primary/10 text-primary border-primary/20",
  },
  content: {
    label: "content",
    tone: "bg-info-soft text-info-deep border-info/20",
  },
  structured: {
    label: "structured",
    tone: "bg-success-soft text-success-deep border-success/20",
  },
  plumbing: {
    label: "plumbing",
    tone: "bg-muted text-muted-foreground border-border",
  },
  event: {
    label: "event",
    tone: "bg-warning-soft text-warning-deep border-warning/20",
  },
  ref: {
    label: "ref",
    tone: "bg-muted text-muted-foreground border-border",
  },
};

export function ComponentProps({
  contract,
  show = DEFAULT_SHOW,
  className,
}: ComponentPropsProps) {
  // Defensive: guard against `contract` or `contract.props` being
  // undefined (registry miss when looking up `COMPONENT_CONTRACTS.X`
  // for a name that doesn't exist; contract module still loading;
  // someone passing a stub contract during dev). Crashing on
  // `Object.entries(undefined)` makes the docs page unrenderable —
  // a clear inline notice is better.
  if (!contract || !contract.props) {
    return (
      <div className={cn("my-6 rounded-lg border border-destructive/30 bg-destructive-soft p-4 text-sm text-destructive-deep", className)}>
        <strong className="font-mono">&lt;ComponentProps&gt;</strong>: no
        contract supplied (or the contract has no <code className="font-mono">.props</code> map).
        Pass a value from <code className="font-mono">COMPONENT_CONTRACTS</code> —
        e.g. <code className="font-mono">&lt;ComponentProps contract={`{COMPONENT_CONTRACTS.Button}`} /&gt;</code>.
      </div>
    );
  }

  const allowed = show === "all" ? null : new Set(show);
  const entries = Object.entries(contract.props).filter(
    ([, prop]) => !allowed || allowed.has(prop.design),
  );

  if (entries.length === 0) {
    return (
      <div className={cn("my-6 rounded-lg border p-4 text-sm text-muted-foreground", className)}>
        No {show === "all" ? "" : "user-facing "}props.
      </div>
    );
  }

  return (
    <div className={cn("my-6 overflow-hidden rounded-lg border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Prop</TableHead>
            <TableHead className="w-[260px]">Type</TableHead>
            <TableHead className="w-[110px]">Default</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[100px] text-right">Kind</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map(([name, prop]) => (
            <PropRow key={name} name={name} prop={prop} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PropRow({ name, prop }: { name: string; prop: PropContract }) {
  const optional = isOptional(prop.schema);
  const typeStr = printZodType(prop.schema);
  const defaultStr =
    prop.default !== undefined ? formatLiteral(prop.default) : null;
  const badge = DESIGN_BADGE[prop.design];

  return (
    <TableRow>
      <TableCell className="font-mono text-sm align-top">
        {name}
        {optional && <span className="text-muted-foreground">?</span>}
      </TableCell>
      <TableCell className="font-mono text-sm text-muted-foreground align-top">
        {typeStr}
      </TableCell>
      <TableCell className="font-mono text-sm text-muted-foreground align-top">
        {defaultStr ?? "—"}
      </TableCell>
      <TableCell className="text-sm align-top">
        {prop.description ?? <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell className="text-right align-top">
        <Badge
          variant="outline"
          className={cn("font-mono text-[10px]", badge.tone)}
        >
          {badge.label}
        </Badge>
      </TableCell>
    </TableRow>
  );
}

// ─── Zod printer ───────────────────────────────────────────────────────

/**
 * Detect optional-ness by trying `safeParse(undefined)`. More reliable
 * than introspecting `_def.typeName === "ZodOptional"` because
 * `.optional()` chains aren't always at the top of the schema. Same
 * trick the validator uses for required-prop detection.
 */
function isOptional(schema: z.ZodType<unknown>): boolean {
  try {
    return schema.safeParse(undefined).success;
  } catch {
    return false;
  }
}

/**
 * Convert a Zod schema into a readable TypeScript type string.
 * Hand-rolled, recursive, handles the limited surface Grade contracts
 * use. Unknown shapes fall through to "unknown" — better than
 * mis-printing.
 *
 * Examples:
 *   z.string()                        → "string"
 *   z.number()                        → "number"
 *   z.boolean()                       → "boolean"
 *   z.enum(["pill", "underlined"])    → "\"pill\" | \"underlined\""
 *   z.literal("primary")              → "\"primary\""
 *   z.array(z.string())               → "string[]"
 *   z.union([z.string(), z.number()]) → "string | number"
 *   z.string().optional()             → "string"   (optional is on the row, not the type)
 *   z.function()                      → "(...args) => unknown"
 *   z.record(z.string(), z.unknown()) → "Record<string, unknown>"
 */
function printZodType(schema: z.ZodType<unknown>): string {
  // The cast is necessary because Zod's internal `_def` types are
  // not part of the public surface. Walking them is the pragmatic
  // way to print a TS type — there's no `schema.toTypeString()`.
  const def = (schema as unknown as { _def: ZodDef })._def;
  if (!def) return "unknown";

  switch (def.typeName) {
    case "ZodOptional":
    case "ZodNullable":
    case "ZodDefault":
      return printZodType(def.innerType as z.ZodType<unknown>);
    case "ZodString":
      return "string";
    case "ZodNumber":
      return "number";
    case "ZodBoolean":
      return "boolean";
    case "ZodNull":
      return "null";
    case "ZodUndefined":
      return "undefined";
    case "ZodVoid":
      return "void";
    case "ZodAny":
    case "ZodUnknown":
      return "unknown";
    case "ZodNever":
      return "never";
    case "ZodLiteral":
      return formatLiteral(def.value);
    case "ZodEnum":
      return (def.values as unknown[]).map((v) => JSON.stringify(v)).join(" | ");
    case "ZodNativeEnum":
      return Object.values(def.values as Record<string, unknown>)
        .map(formatLiteral)
        .join(" | ");
    case "ZodUnion":
    case "ZodDiscriminatedUnion": {
      const opts = (def.options as z.ZodType<unknown>[]) ?? [];
      return opts.map(printZodType).join(" | ");
    }
    case "ZodIntersection":
      return `${printZodType(def.left as z.ZodType<unknown>)} & ${printZodType(def.right as z.ZodType<unknown>)}`;
    case "ZodArray":
      return `${wrap(printZodType(def.type as z.ZodType<unknown>))}[]`;
    case "ZodTuple": {
      const items = (def.items as z.ZodType<unknown>[]) ?? [];
      return `[${items.map(printZodType).join(", ")}]`;
    }
    case "ZodObject": {
      const shape = (def.shape as () => Record<string, z.ZodType<unknown>>)();
      const fields = Object.entries(shape).map(([k, v]) => {
        const opt = isOptional(v) ? "?" : "";
        return `${k}${opt}: ${printZodType(v)}`;
      });
      return `{ ${fields.join("; ")} }`;
    }
    case "ZodRecord": {
      const key = def.keyType
        ? printZodType(def.keyType as z.ZodType<unknown>)
        : "string";
      const value = def.valueType
        ? printZodType(def.valueType as z.ZodType<unknown>)
        : "unknown";
      return `Record<${key}, ${value}>`;
    }
    case "ZodMap":
      return `Map<${printZodType(def.keyType as z.ZodType<unknown>)}, ${printZodType(def.valueType as z.ZodType<unknown>)}>`;
    case "ZodFunction":
      return "(...args) => unknown";
    case "ZodLazy":
      return "unknown";
    case "ZodPromise":
      return `Promise<${printZodType(def.type as z.ZodType<unknown>)}>`;
    default:
      return "unknown";
  }
}

/** Wrap a printed type in parens when it's a union — `(A | B)[]` not
 *  `A | B[]`. Cheap heuristic that's right for every case we hit. */
function wrap(printed: string): string {
  return printed.includes(" | ") ? `(${printed})` : printed;
}

/** Pretty-print a literal value for the default column and for
 *  `z.literal()`. Strings get JSON-quoted; everything else passes
 *  through `String(...)`. */
function formatLiteral(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (value === null || value === undefined) return String(value);
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[object]";
    }
  }
  return String(value);
}

// Narrow type for the internal `_def` shapes we read. Kept loose
// because Zod doesn't export these as public types and the printer
// gracefully falls through to "unknown" for anything it doesn't
// recognise.
interface ZodDef {
  typeName: string;
  innerType?: unknown;
  value?: unknown;
  values?: unknown;
  options?: unknown;
  left?: unknown;
  right?: unknown;
  type?: unknown;
  items?: unknown;
  shape?: unknown;
  keyType?: unknown;
  valueType?: unknown;
}
