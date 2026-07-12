/**
 * Registry — the "bring your own design system" seam.
 *
 * `DesignSystemRegistry` is the serialisable contract describing a design
 * system to Studio; `GRADE_REGISTRY` is the default built from the playbook
 * constants. Design doc: STUDIO-BYODS.md at the repo root.
 */

export type {
  DesignSystemRegistry,
  RegistryComponents,
  RegistryContractSpec,
  RegistryPackage,
  RegistryPropSpec,
  RegistryPrompt,
  RegistrySelection,
} from "./types";
export { registryShortName } from "./types";
export { GRADE_REGISTRY } from "./gradeui";
export { BRIGHTLOCAL_REGISTRY } from "./brightlocal";
