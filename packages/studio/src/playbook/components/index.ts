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
