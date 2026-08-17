/**
 * registry-contracts — registry-keyed component-contract lookup.
 *
 * The problem this solves: contract lookup used to go straight to
 * `@gradeui/ui`'s baked-in COMPONENT_CONTRACTS keyed by bare component
 * name — and component names collide across design systems. Selecting a
 * BrightLocal Button surfaced GRADEUI's Button contract (a size scale
 * with 2xs that BL doesn't have). Contracts must be resolved through
 * the active registry.
 *
 * Two sources, one seam:
 *   - A registry that carries `components.contracts` (serialisable
 *     RegistryContractSpec — no zod on the registry, rule 1) has each
 *     spec converted HERE into a real zod-backed ComponentContract, so
 *     everything downstream (contractToManifest, PropControl) is
 *     unchanged. Converted contracts are cached per registry+name.
 *   - The gradeui registry has no spec map and falls through to the
 *     package's own COMPONENT_CONTRACTS (zero-diff).
 *   - A non-gradeui registry WITHOUT a spec for the component returns
 *     null — never another registry's contract. The inspector then
 *     falls back to its legacy sidecar-manifest fetch.
 */

import { z } from "zod";
import type { ComponentContract, PropContract } from "@gradeui/contracts";
import {
  getComponentContract as getGradeuiContract,
  listContractedComponents as listGradeuiContracted,
} from "@gradeui/ui";
import { getActiveRegistry } from "@/lib/active-registry";
import type { RegistryContractSpec, RegistryPropSpec } from "@gradeui/studio/registry";

function specPropToContract(spec: RegistryPropSpec): PropContract {
  let schema: z.ZodType<unknown>;
  switch (spec.kind) {
    case "enum":
      schema =
        spec.values && spec.values.length > 0
          ? z.enum(spec.values as [string, ...string[]])
          : z.string();
      break;
    case "boolean":
      schema = z.boolean();
      break;
    case "number":
      schema = z.number();
      break;
    case "unknown":
      // Mixed unions / opaque objects / callbacks / ReactNode slots —
      // no serialisable kind describes them, and coercing to string
      // would REJECT valid literals (`<Checkbox checked />`).
      schema = z.unknown();
      break;
    default:
      schema = z.string();
  }
  if (spec.optional) schema = schema.optional();
  return {
    schema,
    design: spec.design,
    description: spec.description,
    default: spec.default,
  };
}

function specToContract(spec: RegistryContractSpec): ComponentContract {
  const props: Record<string, PropContract> = {};
  for (const [name, p] of Object.entries(spec.props)) {
    props[name] = specPropToContract(p);
  }
  return {
    name: spec.name,
    description: spec.description ?? "",
    props,
    variantDefaults: spec.variantDefaults
      ? { ...spec.variantDefaults }
      : undefined,
    subcomponents: spec.subcomponents ? [...spec.subcomponents] : undefined,
    element: spec.element,
    subcomponentElements: spec.subcomponentElements
      ? { ...spec.subcomponentElements }
      : undefined,
  };
}

/** registry.id → name → converted contract (or null when the registry
 *  has a spec map but no spec for that name). */
const cache = new Map<string, ComponentContract | null>();

/** Registry-keyed replacement for `getComponentContract`. */
export function getRegistryComponentContract(
  componentName: string | null | undefined,
): ComponentContract | null {
  if (!componentName) return null;
  const registry = getActiveRegistry();
  const specs = registry.components.contracts;
  if (specs) {
    const key = `${registry.id}:${componentName}`;
    let hit = cache.get(key);
    if (hit === undefined) {
      const spec = specs[componentName];
      hit = spec ? specToContract(spec) : null;
      cache.set(key, hit);
    }
    return hit;
  }
  // No spec map on the registry. gradeui's contracts live in the
  // package itself; any OTHER registry without specs has no contracts
  // — never leak a different DS's by name collision.
  return registry.id === "gradeui" ? getGradeuiContract(componentName) : null;
}

/** Component names with contracts under the ACTIVE registry — the
 *  registry-keyed counterpart of `listContractedComponents`. */
export function listRegistryContractedComponents(): string[] {
  const registry = getActiveRegistry();
  if (registry.components.contracts) {
    return Object.keys(registry.components.contracts);
  }
  return registry.id === "gradeui" ? listGradeuiContracted() : [];
}
