/**
 * DesignSystemRegistry — the contract for "bring your own design system".
 *
 * One serialisable object describes everything Studio needs to know about
 * a design system: what the model may emit, how components are documented,
 * what the preview must load, and how selection finds component boundaries.
 * The gradeui playbook constants become the DEFAULT registry (see
 * `gradeui.ts`); every playbook entry point takes an optional registry and
 * falls back to it, so existing behaviour is unchanged.
 *
 * Design rules (full rationale in STUDIO-BYODS.md at the repo root):
 *
 *   1. Data only. No functions, no React, no fs — the registry must be
 *      JSON-serialisable so it can live per-org in Supabase, be served from
 *      an API route, or ship as an npm package. Same constraint that makes
 *      the playbook serveable over MCP.
 *   2. Layered. Every content field is optional on a registry that
 *      `extends` a base; a Level 1 "theme pack" registry overrides only
 *      theme/prompt fields and inherits the whole gradeui component
 *      surface. Resolution (merging child over base) happens in
 *      `resolveRegistry`, not in consumers.
 *   3. Sidecars are the unit of onboarding. A component is usable in
 *      Studio exactly when it has a sidecar; the schema is already
 *      library-agnostic.
 */

/** The component-surface portion of a registry. */
export interface RegistryComponents {
  /** Components the model may emit in `jsx` blocks (OUTPUT RULE #4). */
  allowed: readonly string[];
  /** Subset of `allowed` whose ref blocks are pinned into every prompt
   *  regardless of retrieval (layout primitives suffer most from the
   *  retrieval gap — see allowlist.ts). */
  pinned: readonly string[];
  /** Additional bare module specifiers the model may import from
   *  (lucide-react, recharts, …). Must be resolvable by the preview. */
  externalImports: readonly string[];
  /** filename → raw sidecar markdown ("button.md" → "---\nname: Button…").
   *  Feeds refs, retrieval aliases, and the settings-panel prop manifest. */
  sidecars: Readonly<Record<string, string>>;
}

export interface RegistryPackage {
  /** Barrel the model imports from ("@gradeui/ui"). Rendered verbatim
   *  into import statements in the system prompt. */
  name: string;
  /** npm version the preview resolves. Optional in B0 —
   *  `apps/docs/lib/chat-sandpack.ts` still owns the pin until B2. */
  version?: string;
  /** Stylesheets the preview iframe must load ("@gradeui/ui/styles.css"). */
  styleImports: readonly string[];
}

export interface RegistrySelection {
  /** Attribute the library stamps on addressable parts ("data-gds-part").
   *  The in-iframe selection agent walks up the DOM looking for it; a
   *  library that stamps nothing degrades to tag-level selection. */
  partAttribute: string;
}

export interface DesignSystemRegistry {
  /** Stable identifier ("gradeui", "acme-ds"). Keys caching and, later,
   *  per-org storage. */
  id: string;
  /** Human name used in prompt prose ("Grade Design System"). */
  name: string;
  /** Compact name for terse prompt mentions ("Grade DS"). Falls back to
   *  `name` when absent. */
  shortName?: string;
  /** id of the registry this one layers on. Level 1/2 registries extend
   *  "gradeui" and override only theme/prompt/content fields. Absent =
   *  standalone (must supply the full component surface). Resolution is
   *  `resolveRegistry`'s job — consumers always receive a fully-merged
   *  registry and never look at this field. */
  extends?: string;

  package: RegistryPackage;
  components: RegistryComponents;
  selection: RegistrySelection;

  // B2/B3 fields (theme, prompt.designMd/extraRules, scaffolds, runtime
  // dependencies) are specified in STUDIO-BYODS.md and land with the
  // consumers that read them — don't add dead fields here ahead of need.
}

/** `shortName` with its documented fallback applied. */
export function registryShortName(registry: DesignSystemRegistry): string {
  return registry.shortName ?? registry.name;
}
