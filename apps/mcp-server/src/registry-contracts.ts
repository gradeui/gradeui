/**
 * Registry-keyed contract resolution for the MCP server — the
 * transport-side twin of `apps/docs/lib/registry-contracts.ts`.
 *
 * The problem (same as the docs seam): contract lookup used to go
 * straight to `@gradeui/ui`'s COMPONENT_CONTRACTS keyed by bare
 * component name — and component names collide across design systems.
 * `save_screen` on a BrightLocal-registry project rejected valid
 * BrightLocal JSX because <Sidebar dataHook=…> was validated against
 * GRADEUI's Sidebar contract (July 2026, the account-switcher screen).
 *
 * Resolution rule (identical to the docs seam):
 *   - registry carries `components.contracts` (serialisable
 *     RegistryContractSpec — no zod on the registry) → convert each
 *     spec into a zod-backed contract here, cached per registry.
 *   - gradeui → the package's own COMPONENT_CONTRACTS (zero-diff).
 *   - any other registry without specs → EMPTY map. Never another
 *     registry's contracts; validateAgainstContract's
 *     skipUnknownComponents (default true) turns that into a no-op
 *     rather than a wall of false errors.
 *
 * The registry map is duplicated from `apps/docs/lib/active-registry.ts`
 * deliberately — the MCP server resolves per-REQUEST from the project
 * row's `registry_id`, never from a client singleton.
 */

import { z } from "zod";
import { COMPONENT_CONTRACTS } from "@gradeui/ui/contracts";
import { validateAgainstContract } from "@gradeui/studio/core";
import {
  GRADE_REGISTRY,
  BRIGHTLOCAL_REGISTRY,
} from "@gradeui/studio/registry";
import type {
  DesignSystemRegistry,
  RegistryContractSpec,
  RegistryPropSpec,
} from "@gradeui/studio/registry";

/** The exact contracts-map type the validator accepts — derived from the
 *  function signature so this file needs no direct `@gradeui/contracts`
 *  dependency. */
type ContractsMap = Parameters<typeof validateAgainstContract>[1]["contracts"];
type Contract = ContractsMap[string];
type Prop = Contract["props"][string];

const REGISTRIES: Readonly<Record<string, DesignSystemRegistry>> = {
  [GRADE_REGISTRY.id]: GRADE_REGISTRY,
  [BRIGHTLOCAL_REGISTRY.id]: BRIGHTLOCAL_REGISTRY,
};

/** Every registry id a project row may carry — for tool descriptions and
 *  the "which design system am I on?" error paths. */
export const REGISTRY_IDS: readonly string[] = Object.keys(REGISTRIES);

/** The registry a project's screens are generated for AND validated
 *  against. One resolver so no tool can answer from a different design
 *  system than `save_screen` enforces (Aug 2026: `list_components` was
 *  registry-blind and authoritatively described gradeui components to a
 *  BrightLocal project — every one of which fails the contract check). */
export function registryFor(
  registryId: string | null | undefined,
): DesignSystemRegistry {
  return (registryId && REGISTRIES[registryId]) || GRADE_REGISTRY;
}

function specPropToContract(spec: RegistryPropSpec): Prop {
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

function specToContract(spec: RegistryContractSpec): Contract {
  const props: Record<string, Prop> = {};
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

/** registryId → fully converted contracts map (built once per registry). */
const cache = new Map<string, ContractsMap>();

/** Contracts to validate a project's JSX against, resolved through the
 *  project's `registry_id` (null/unknown → gradeui, matching the studio
 *  page's fallback). */
export function contractsForRegistry(
  registryId: string | null | undefined,
): { registry: DesignSystemRegistry; contracts: ContractsMap } {
  const registry = registryFor(registryId);
  const specs = registry.components.contracts;
  if (!specs) {
    // gradeui's contracts live in the package itself; any OTHER registry
    // without specs validates against nothing (skipUnknownComponents
    // handles the rest) — never leak a different DS's by name collision.
    return {
      registry,
      contracts: registry.id === "gradeui" ? COMPONENT_CONTRACTS : {},
    };
  }
  let contracts = cache.get(registry.id);
  if (!contracts) {
    const built: Record<string, Contract> = {};
    for (const [name, spec] of Object.entries(specs)) {
      built[name] = specToContract(spec);
    }
    contracts = built;
    cache.set(registry.id, contracts);
  }
  return { registry, contracts };
}
