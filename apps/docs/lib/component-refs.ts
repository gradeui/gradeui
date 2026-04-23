/**
 * Thin re-export shim.
 *
 * The component reference retrieval layer moved to `@gradeui/studio/playbook`
 * so that all model-facing knowledge (sidecars, prompts, allowlist, templates)
 * lives in one lift-and-shift package. This file keeps existing import paths
 * (`@/lib/component-refs`) working while callers migrate.
 *
 * New code should import from `@gradeui/studio/playbook` directly — this shim
 * will be deleted once the remaining consumers are updated.
 */

export type {
  ComponentRef,
  PropKind,
  PropManifest,
  ComponentManifest,
} from "@gradeui/studio/playbook";

export {
  renderComponentRefsBlock,
  relevantComponentNames,
  listComponentRefs,
  buildComponentManifest,
} from "@gradeui/studio/playbook";
