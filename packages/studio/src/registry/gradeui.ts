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
import type { DesignSystemRegistry } from "./types";

export const GRADE_REGISTRY: DesignSystemRegistry = {
  id: "gradeui",
  name: "Grade Design System",
  shortName: "Grade DS",
  package: {
    name: "@gradeui/ui",
    // version intentionally absent in B0 — chat-sandpack.ts owns the npm
    // pin until the preview bootstrap goes registry-fed (B2).
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
};
