/**
 * Adapter: `ComponentContract` (Zod-based, machine-readable) → the
 * legacy `ComponentManifest` shape the Studio settings panel was
 * originally built around.
 *
 * Why an adapter rather than rewriting the panel:
 *   - The existing `PropControl` already knows how to render
 *     enum/boolean/number/string controls + emit prop mutations into
 *     `appSource`. That logic is non-trivial and already battle-tested.
 *   - Doing this as a thin adapter lets the contract surface go live
 *     today with the panel's existing rendering, while leaving room for
 *     a richer `ContractPropControl` (glyph-picker, per-kind structured
 *     sub-forms, slider, etc.) to land incrementally without blocking
 *     the broader contracts rollout.
 *
 * What this adapter currently handles:
 *   - `z.string`  → kind: "string"
 *   - `z.number`  → kind: "number"
 *   - `z.boolean` → kind: "boolean"
 *   - `z.enum`    → kind: "enum", with .options as the value list
 *   - `z.union(z.literal, …)` → kind: "enum" with literal values
 *   - `z.optional(...)` / `z.nullable(...)` — unwrapped, sets `optional: true`
 *
 * What it punts to kind: "unknown" (the panel's filter drops these):
 *   - `z.object` / `z.union` of objects — discriminated structured
 *     props (MediaSurface's `source`). Will get a dedicated sub-form
 *     renderer in a follow-up; until then the chat is the escape.
 *   - `z.function`, `z.any`, `z.unknown`, anything we don't recognise.
 *   - Anything where `prop.design` is `"plumbing" | "event" | "ref"`.
 *     These are filtered out BEFORE the kind inference runs — they
 *     don't belong on the panel by definition.
 */

import { z } from "zod";
import type { ComponentContract, PropContract } from "@gradeui/contracts";
import type {
  ComponentManifest,
  PropManifest,
} from "@gradeui/studio/playbook";

/**
 * Convert a kebab-case `componentName` to its `data-gds-part` shape.
 * Used to populate the manifest's `part` field so downstream code that
 * keys off `part` (the selection chip, the manifest lookup cache) keeps
 * working when reading contract-driven manifests.
 */
function pascalToKebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

/** Recursively strip `z.optional()` / `z.nullable()` wrappers. */
function unwrap(schema: z.ZodTypeAny): {
  inner: z.ZodTypeAny;
  optional: boolean;
} {
  let inner: z.ZodTypeAny = schema;
  let optional = false;
  // Zod 3 nests Optional/Nullable arbitrarily. Walk until we hit a
  // concrete leaf. The `_def.innerType` accessor is the documented
  // Zod 3 way to introspect wrappers.
  while (
    inner instanceof z.ZodOptional ||
    inner instanceof z.ZodNullable ||
    inner instanceof z.ZodDefault
  ) {
    if (
      inner instanceof z.ZodOptional ||
      inner instanceof z.ZodNullable
    ) {
      optional = true;
    }
    inner = (inner._def as { innerType: z.ZodTypeAny }).innerType;
  }
  return { inner, optional };
}

/** Pull the literal value out of `z.literal(<value>)`. */
function literalValueOf(schema: z.ZodTypeAny): string | number | null {
  if (schema instanceof z.ZodLiteral) {
    const v = (schema._def as { value: unknown }).value;
    if (typeof v === "string" || typeof v === "number") return v;
  }
  return null;
}

/**
 * Adapt one contract prop to the legacy `PropManifest` shape. Returns
 * `null` if the prop is plumbing/event/ref and should be dropped
 * before reaching the panel — caller filters those out.
 */
export function adaptContractProp(
  name: string,
  prop: PropContract,
): PropManifest | null {
  if (
    prop.design === "plumbing" ||
    prop.design === "event" ||
    prop.design === "ref"
  ) {
    return null;
  }

  const { inner, optional } = unwrap(prop.schema);
  const raw = `${name}${optional ? "?" : ""}: <contract>`;
  const description = prop.description;
  const defaultValue =
    prop.default !== undefined ? String(prop.default) : undefined;

  // Enum-shaped: z.enum(["a","b","c"])
  if (inner instanceof z.ZodEnum) {
    return {
      name,
      optional,
      kind: "enum",
      enum: (inner._def as { values: ReadonlyArray<string> }).values,
      defaultValue,
      description,
      raw,
    };
  }

  // Union of literals → enum. Common after `discriminatedUnion` strips
  // its discriminator-aware wrapping, but also appears when authors
  // write `z.union([z.literal("a"), z.literal("b")])` directly.
  if (inner instanceof z.ZodUnion) {
    const options = (inner._def as { options: ReadonlyArray<z.ZodTypeAny> })
      .options;
    const literals: Array<string | number> = [];
    let allLiterals = true;
    for (const opt of options) {
      const lit = literalValueOf(opt);
      if (lit !== null) {
        literals.push(lit);
      } else {
        allLiterals = false;
        break;
      }
    }
    if (allLiterals && literals.length > 0) {
      return {
        name,
        optional,
        kind: "enum",
        enum: literals,
        defaultValue,
        description,
        raw,
      };
    }
    // Discriminated unions / object unions get punted to unknown — the
    // panel filter drops them; the chat handles `source`-style edits
    // until the structured renderer lands.
    return {
      name,
      optional,
      kind: "unknown",
      defaultValue,
      description,
      raw,
    };
  }

  if (inner instanceof z.ZodBoolean) {
    return { name, optional, kind: "boolean", defaultValue, description, raw };
  }
  if (inner instanceof z.ZodNumber) {
    return { name, optional, kind: "number", defaultValue, description, raw };
  }
  if (inner instanceof z.ZodString) {
    return { name, optional, kind: "string", defaultValue, description, raw };
  }

  return { name, optional, kind: "unknown", defaultValue, description, raw };
}

/**
 * Convert an entire `ComponentContract` to a `ComponentManifest`. Plumbing
 * props are stripped here; the resulting manifest is panel-ready.
 */
export function contractToManifest(
  contract: ComponentContract,
): ComponentManifest {
  const props: PropManifest[] = [];
  for (const [name, prop] of Object.entries(contract.props)) {
    const adapted = adaptContractProp(name, prop);
    if (adapted) props.push(adapted);
  }
  return {
    name: contract.name,
    part: pascalToKebab(contract.name),
    import: contract.import ?? "@gradeui/ui",
    props,
    when_to_use: contract.when ?? contract.description,
  };
}
