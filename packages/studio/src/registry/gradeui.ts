/**
 * The default registry — the Grade Design System described in the
 * `DesignSystemRegistry` shape.
 *
 * Assembled from the existing playbook constants rather than duplicating
 * them: the allowlist, pins, external imports, and inlined sidecars remain
 * authored exactly where they always were (`playbook/components/`), and
 * this module is just the delivery shape. Adding a component still means
 * following the ship checklist in gradeui/CLAUDE.md — this file never
 * needs touching for that.
 *
 * Every registry-aware entry point defaults to this object, which is what
 * keeps B0 a zero-diff refactor (see STUDIO-BYODS.md).
 */

import { ALLOWED_COMPONENTS, ALLOWED_EXTERNAL_IMPORTS, PINNED_COMPONENTS } from "../playbook/components/allowlist";
import { SIDECARS } from "../playbook/components/sidecars.generated";
import { STUDIO_TEMPLATES } from "../playbook/templates";
import type { DesignSystemRegistry } from "./types";

export const GRADE_REGISTRY: DesignSystemRegistry = {
  id: "gradeui",
  name: "Grade Design System",
  shortName: "Grade DS",
  package: {
    name: "@gradeui/ui",
    // B2: the registry owns the npm pin (chat-sandpack derives its
    // dependency map from here). EXACT version, not a range — see the
    // cache/resolver rationale on PLAYGROUND_DEPENDENCIES in
    // apps/docs/lib/chat-sandpack.ts. Bump when a new minor lands and
    // newly exported components need to be reachable in Studio.
    version: "0.10.0",
    styleImports: ["@gradeui/ui/styles.css"],
  },
  components: {
    allowed: ALLOWED_COMPONENTS,
    pinned: PINNED_COMPONENTS,
    externalImports: ALLOWED_EXTERNAL_IMPORTS,
    sidecars: SIDECARS,
  },
  selection: {
    partAttribute: "data-gds-part",
  },
  // The playbook's labelled-prompt starters, unchanged and unmoved —
  // the registry is the delivery shape, templates/index.ts stays the
  // authoring home. (StudioTemplate is structurally a RegistryTemplate
  // with prompt required.)
  templates: STUDIO_TEMPLATES,
};
