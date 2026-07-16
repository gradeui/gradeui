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

/** One prop on a registry contract spec — the JSON-safe subset of
 *  `@gradeui/contracts` PropContract (rule 1: no zod on the registry).
 *  Consumers (the settings panel) convert specs into real zod-backed
 *  ComponentContracts at the edge — see apps/docs/lib/registry-contracts. */
export interface RegistryPropSpec {
  kind: "enum" | "boolean" | "string" | "number";
  /** Enum members, in display order. Required when kind === "enum". */
  values?: readonly string[];
  /** Same taxonomy as PropContract.design. Controls panel visibility:
   *  knob/content render controls; plumbing/event/ref are recorded for
   *  completeness but filtered from the UI. */
  design: "knob" | "content" | "structured" | "plumbing" | "event" | "ref";
  optional?: boolean;
  default?: string | number | boolean;
  description?: string;
}

/** Serialisable per-component contract — what the settings panel needs
 *  to render correct tweak controls for a non-gradeui DS (the right
 *  variant/size scales, not gradeui's). Transform output of the DS's
 *  own metadata (component-meta.json, sidecars), grounded in the real
 *  barrel exports. */
export interface RegistryContractSpec {
  name: string;
  description?: string;
  props: Readonly<Record<string, RegistryPropSpec>>;
  /** Default variant values baked into the component (cva
   *  defaultVariants equivalent) — lets the panel show the effective
   *  value instead of a blank control. */
  variantDefaults?: Readonly<Record<string, string>>;
}

/** One composed PATTERN from the design system — a block: a login
 *  layout, a data table with toolbar/pagination, a sidebar family
 *  member. Harvested from the DS's own Storybook (blocks harvest) or
 *  hand-authored. `source` is JSX or a CSF story object literal — the
 *  Blocks browser normalises at render time. Serialisable (rule 1). */
export interface RegistryBlock {
  id: string;
  /** Grouping label ("DataTable", "Sidebar", "Map", "Form"). */
  group: string;
  /** Human story name ("Login Form", "Server Side"). */
  name: string;
  /** One-line human description for the block's card — what the pattern
   *  is FOR ("A page header with title, breadcrumb, and actions").
   *  Composition recipes carry these from the DS's own MCP. */
  description?: string;
  source: string;
  /** Identifiers the source references that exist only in the DS's
   *  story file (projectColumns, mainItems). Detected at generation
   *  time by executing the block in a stubbed VM; the preview shims
   *  them as empty arrays so structure renders, and the UI badges the
   *  card as partially-shimmed. */
  freeIds?: readonly string[];
}

/** One STARTER TEMPLATE — what the Starters/empty-state picker offers
 *  for projects on this registry. Two kinds, one shape:
 *    - prompt templates (gradeui's originals): a labelled prompt that
 *      seeds the chat input; the model generates the screen.
 *    - source templates (external scaffolds): hand-authored full-page
 *      JSX applied DIRECTLY as the screen's appSource — "literally what
 *      I call scaffolds… full example pages" (BYODS pilot). Both fields
 *      may be present; source wins when the consumer can apply it. */
export interface RegistryTemplate {
  id: string;
  /** Short chip label (≤ ~16 chars reads best). */
  label: string;
  description: string;
  prompt?: string;
  source?: string;
}

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
  /** Component name → serialisable contract spec. Feeds the settings
   *  panel's tweak controls for THIS registry's components. Absent =
   *  the registry has no contract data; the panel must NOT fall back to
   *  another registry's contracts (component names collide — "Button"
   *  exists everywhere, with different prop scales). */
  contracts?: Readonly<Record<string, RegistryContractSpec>>;
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
  /** Component → per-file subpath ("Button" → "@brightlocal/ui-components/button").
   *  Consumed ONLY by the exporters: Studio's internal normal form stays the
   *  barrel (generation + preview), and export/handoff rewrites to the DS's
   *  per-file import convention when this map is present. Absent = the DS
   *  has no such convention and exports keep the barrel. */
  importMap?: Readonly<Record<string, string>>;
}

export interface RegistryRuntime {
  /** Extra npm dependencies the preview must install alongside the DS
   *  package itself (a separate tokens package, an icons package, …).
   *  The DS package + version come from `package`; this is only for
   *  companions. */
  dependencies?: Readonly<Record<string, string>>;
  /** The DS's OWN Tailwind v4 `@theme` block (v4 SOURCE, compiled by the
   *  preview's v4 browser build). This is the full utility vocabulary —
   *  primitive family remaps, semantic colors, fonts, weights, radii.
   *  When present it REPLACES the generic shadcn-vocabulary bridge; a
   *  hand-approximated bridge renders stock Tailwind for every primitive
   *  utility, which reads as "not the design system". */
  previewThemeCss?: string;
  /** Raw CSS injected into the preview alongside `package.styleImports`.
   *  For design systems whose published CSS is a build-time SOURCE file
   *  (Tailwind v4 @import/@theme presets) rather than compiled output,
   *  this carries the runtime-consumable extract — e.g. BrightLocal's
   *  semantic :root/.dark alias blocks. Plain data; stays serialisable. */
  previewCss?: string;
}

/** One registry rules file (registries/<id>/rules/<file>.md), kept
 *  separate so the Rules screen can list and toggle them per project.
 *  `id` = filename without .md ("00-house-rules"); `name` = the
 *  filename as displayed ("00-house-rules.md"). */
export interface RegistryRuleFile {
  id: string;
  name: string;
  content: string;
}

export interface RegistryPrompt {
  /** House rules injected verbatim as a system-prompt stanza (a design
   *  system's AI_USAGE.md distilled: conventions the model must follow
   *  beyond what sidecars express — required props, styling rules, …).
   *  Forerunner of the full B3 `prompt.designMd` slot. Kept as the
   *  concatenated fallback; when `ruleFiles` is present consumers
   *  prefer it (it enables per-file toggling). */
  extraRules?: string;
  /** The same rules split per source .md file — lets the Rules screen
   *  show each file and lets buildSystemPrompt exclude the ids a
   *  project has toggled off. Generated by
   *  scripts/generate-registry-rules.mjs. */
  ruleFiles?: readonly RegistryRuleFile[];
}

export interface RegistrySelection {
  /** Attribute the library stamps on addressable parts ("data-gds-part").
   *  The in-iframe selection agent walks up the DOM looking for it; a
   *  library that stamps nothing degrades to tag-level selection.
   *  Values must name COMPONENTS (kebab-case → Pascal), not instances —
   *  shadcn-derived libraries stamp this as `data-slot` ("card-header").
   *  BrightLocal ships BOTH: data-slot (component identity, stamped by
   *  the components themselves) and data-hook (instance names, stamped
   *  by app code) — use data-slot here and data-hook as
   *  `nameAttribute`. */
  partAttribute: string;
  /** Attribute carrying a human/QA INSTANCE label ("data-hook":
   *  "settings-save-button"). Surfaces as the breadcrumb/layer display
   *  name (after any explicit data-gds-name), never as a component
   *  name. Absent = no instance labels. */
  nameAttribute?: string;
  /** For DSes whose part attribute names INSTANCES, not components
   *  (BrightLocal's data-hook convention is "{context}-{componentType}"
   *  — "settings-save-button"), a suffix → component-name map so
   *  selection can still resolve WHICH component was clicked. Checked
   *  longest-suffix-first. Absent = the attribute value is already a
   *  kebab-case component name (gradeui). */
  partSuffixMap?: Readonly<Record<string, string>>;
  /** Exceptions to "part value is the component name": slot values that
   *  DON'T kebab→Pascal into a real export, mapped to the export whose
   *  root element stamps them. BrightLocal's global-layout.js is the
   *  motivating case — it stamps shortened slots ("sidebar-container"
   *  on GlobalLayoutSidebar's aside, "content-wrapper" on
   *  GlobalLayoutContent) while the rest of the library stamps true
   *  component names. Without the alias, selection resolves a
   *  fabricated component ("SidebarContainer"), the contract lookup
   *  misses, and the source mutator's tag guard (correctly) refuses to
   *  write — inspector edits silently no-op. Checked BEFORE the
   *  kebab→Pascal default. */
  partAliases?: Readonly<Record<string, string>>;
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
  prompt?: RegistryPrompt;
  runtime?: RegistryRuntime;
  /** Composed patterns (blocks) — browsable in Studio's Blocks area,
   *  future starter seeds + agent composition examples. Absent = the
   *  registry ships no blocks (gradeui's equivalents live in the
   *  playbook's reference layouts today). */
  blocks?: Readonly<Record<string, RegistryBlock>>;
  /** Starter templates for the chat empty state / Starters picker.
   *  gradeui points at the playbook's STUDIO_TEMPLATES; external
   *  registries author source scaffolds under
   *  registries/<id>/templates/*.jsx (hand-editable, generator-built). */
  templates?: readonly RegistryTemplate[];

  // B2/B3 fields (theme, prompt.designMd/extraRules, scaffolds, runtime
  // dependencies) are specified in STUDIO-BYODS.md and land with the
  // consumers that read them — don't add dead fields here ahead of need.
}

/** `shortName` with its documented fallback applied. */
export function registryShortName(registry: DesignSystemRegistry): string {
  return registry.shortName ?? registry.name;
}
