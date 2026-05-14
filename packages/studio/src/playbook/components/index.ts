/**
 * Component knowledge base — public surface.
 *
 * Lives under `playbook/components/` so everything related to "what the
 * model knows about the library's components" sits in one folder: the
 * parsed sidecars, the retrieval heuristic, the system-prompt block
 * renderer, the structured manifest for the settings panel, and the
 * allowlist that bounds it all.
 */

export type {
  ComponentRef,
  PropKind,
  PropManifest,
  ComponentManifest,
} from "./types";

export {
  renderComponentRefsBlock,
  relevantComponentNames,
  listComponentRefs,
  buildComponentManifest,
} from "./refs";

export {
  ALLOWED_COMPONENTS,
  ALLOWED_EXTERNAL_IMPORTS,
  PINNED_COMPONENTS,
} from "./allowlist";

/**
 * Raw inlined sidecar markdown, keyed by filename ("button.md", "row.md",
 * "<name>.md"). Exposed so the docs site (and any other consumer) can
 * surface the same source-of-truth markdown that Studio feeds the model.
 * Generated from packages/ui/components/ui/*.md by
 * scripts/generate-sidecars.mjs.
 */
export { SIDECARS } from "./sidecars.generated";
