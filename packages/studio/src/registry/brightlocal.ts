/**
 * BRIGHTLOCAL_REGISTRY — the first external (Level 3) design system
 * described in the `DesignSystemRegistry` shape. Pilot for the BYODS
 * workstream; plan: BYODS-BRIGHTLOCAL-PLAN.md at the repo root.
 *
 * Assembled from BrightLocal's own shipped metadata:
 *   - `component-meta.json` → allowlist + import map (allowlist.generated.ts)
 *   - drafted sidecars      → registries/brightlocal/sidecars/*.md
 *                             (sidecars.generated.ts)
 *   - `AI_USAGE.md`         → the prompt.extraRules stanza below
 *
 * Import-style note: BrightLocal mandates per-file imports in production
 * ("never barrel"). Studio's internal normal form remains the barrel —
 * the package DOES export `.` — and the per-file convention is applied
 * at export/handoff via `package.importMap`. Do not add "never barrel"
 * to extraRules: it would fight OUTPUT RULE #3.
 */

import type { DesignSystemRegistry } from "./types";
import {
  BRIGHTLOCAL_ALLOWED_COMPONENTS,
  BRIGHTLOCAL_IMPORT_MAP,
} from "./brightlocal/allowlist.generated";
import { BRIGHTLOCAL_SIDECARS } from "./brightlocal/sidecars.generated";
import { BRIGHTLOCAL_CONTRACTS } from "./brightlocal/contracts.generated";
import { BRIGHTLOCAL_BLOCKS } from "./brightlocal/blocks.generated";
import { BRIGHTLOCAL_RECIPES } from "./brightlocal/recipes.generated";
import {
  BRIGHTLOCAL_RULES,
  BRIGHTLOCAL_RULES_FILES,
} from "./brightlocal/rules.generated";
import { BRIGHTLOCAL_TEMPLATES } from "./brightlocal/templates.generated";
import { BRIGHTLOCAL_PREVIEW_CSS } from "./brightlocal/preview-css.generated";
import { BRIGHTLOCAL_PREVIEW_THEME_FULL } from "./brightlocal/preview-theme.generated";

// Generation rules live in registries/brightlocal/rules/*.md — the
// hand-editable home (00-house-rules.md carries the AI_USAGE.md
// distillation). Drop a new .md there + `node
// scripts/generate-registry-rules.mjs` to extend the harness.

export const BRIGHTLOCAL_REGISTRY: DesignSystemRegistry = {
  id: "brightlocal",
  name: "BrightLocal Design System",
  shortName: "BrightLocal DS",
  package: {
    name: "@brightlocal/ui-components",
    version: "2.20.0",
    // Empty ON PURPOSE. The tokens CSS is inlined via runtime.previewCss
    // instead of npm-imported: tailwind-preset.css is a Tailwind v4
    // SOURCE file (@import "tailwindcss" / "tw-animate-css", @theme) —
    // a bundler that tries to resolve those imports stalls the preview
    // (the Sandpack TIME_OUT) — and the plain per-layer CSS exports lean
    // on exports-map resolution the legacy CSB bundler is flaky about.
    // See preview-css.generated.ts.
    styleImports: [],
    importMap: BRIGHTLOCAL_IMPORT_MAP,
  },
  components: {
    allowed: BRIGHTLOCAL_ALLOWED_COMPONENTS,
    // Page-scaffold + layout components — the retrieval-gap sufferers,
    // mirroring gradeui's pinning rationale (allowlist.ts).
    pinned: [
      "GlobalLayout",
      "CentredLayout",
      "SplitLayout",
      "Header",
      "Card",
      "Field",
      "Typography",
    ],
    externalImports: ["@brightlocal/icons"],
    sidecars: BRIGHTLOCAL_SIDECARS,
    // Serialisable contract specs (sidecar transform, dist-grounded) —
    // the settings panel renders BL's OWN variant/size scales from
    // these instead of colliding into gradeui's contracts by name.
    contracts: BRIGHTLOCAL_CONTRACTS,
  },
  selection: {
    // Their components stamp shadcn-style `data-slot` with kebab-case
    // COMPONENT names ("card-header", "global-layout") on every part —
    // verified in the published dist (Ali spotted it on the live
    // platform, July 2026). That's the same semantics as gradeui's
    // data-gds-part, stamped by the DS itself, so selection no longer
    // depends on the model's dataHook discipline or suffix guessing.
    partAttribute: "data-slot",
    // data-hook names INSTANCES ("settings-save-button") — now the
    // display/QA label, not the component-identity signal.
    nameAttribute: "data-hook",
    // Legacy suffix map (data-hook → component), kept as the fallback
    // for surfaces still fed instance-named parts (finding #2 in the
    // upstream report documents why it exists).
    partSuffixMap: {
      button: "Button", btn: "Button", input: "Input", select: "Select",
      card: "Card", table: "Table", dialog: "Dialog", tabs: "Tabs",
      tab: "TabsTrigger", badge: "Badge", switch: "Switch", checkbox: "Checkbox",
      textarea: "Textarea", avatar: "Avatar", sidebar: "Sidebar", form: "Field",
      field: "Field", row: "TableRow", link: "Link", list: "List",
      dropdown: "DropdownMenu", menu: "DropdownMenu", tooltip: "Tooltip",
      accordion: "Accordion", alert: "Alert", progress: "Progress",
      slider: "Slider", stepper: "Stepper", chip: "Chip", rating: "Rating",
    },
  },
  prompt: {
    extraRules: BRIGHTLOCAL_RULES,
    // Per-file split of the same rules — drives the Rules screen's
    // registry section + per-project file toggles.
    ruleFiles: BRIGHTLOCAL_RULES_FILES,
  },
  // Their composed patterns, two provenances, one browsable surface:
  //   - blocks: harvested from the hidden blocks-* Storybook section
  //     (story-store originalSource) — component-family stories.
  //   - recipes: the DS MCP's get_composition_recipe catalogue —
  //     page-level patterns (PageHeader, StatsGrid, SettingsPage…) the
  //     Storybook doesn't cover. "Recipes" group first — they're what
  //     a designer reaches for when composing a page.
  blocks: { ...BRIGHTLOCAL_RECIPES, ...BRIGHTLOCAL_BLOCKS },
  // Hand-authored full-page scaffolds (registries/brightlocal/templates)
  // — SOURCE templates: picking one applies the JSX as the screen.
  templates: BRIGHTLOCAL_TEMPLATES,
  runtime: {
    dependencies: {
      // Icons: the sanctioned icon source per AI_USAGE. The tokens
      // package is NOT installed — its CSS rides inlined in previewCss.
      // ui-components' own heavy deps (radix, framer-motion, recharts,
      // …) arrive transitively.
      "@brightlocal/icons": "2.3.1",
    },
    previewCss: BRIGHTLOCAL_PREVIEW_CSS,
    // FULL preset extraction: the @theme block PLUS the preset's
    // @utility sections — px-section-md etc. are how Card gets its
    // padding; @theme alone rendered every component flush (the "cards
    // have no padding" bug).
    previewThemeCss: BRIGHTLOCAL_PREVIEW_THEME_FULL,
  },
};
