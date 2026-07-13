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
import { BRIGHTLOCAL_TEMPLATES } from "./brightlocal/templates.generated";
import { BRIGHTLOCAL_PREVIEW_CSS } from "./brightlocal/preview-css.generated";
import { BRIGHTLOCAL_PREVIEW_THEME_FULL } from "./brightlocal/preview-theme.generated";

/** AI_USAGE.md distilled — everything except the import rule (see note
 *  above) and anything the sidecars already express per component. */
const BRIGHTLOCAL_EXTRA_RULES = `BrightLocal house rules (from the design system's AI_USAGE.md):
- dataHook is REQUIRED on every user-interactive component root (Button, Input, Select, Dialog, Tabs, …) and optional on structural ones. It renders as a data-hook attribute. Naming: kebab-case {context}-{componentType} — "settings-save-button", "login-email-input"; lists include the item id ("user-{id}-row"). Never generic names like "test-button".
- Styling: semantic color tokens first (primary, secondary, muted, destructive, …); fall back to Tailwind color utilities (text-blue-600) only when no token fits; NEVER raw hex/rgb values.
- Use DS components, not raw HTML: <Button> not <button>, <Input> not <input>, Typography for text.
- Compose compound components from their provided sub-exports; don't rebuild patterns from primitives.
- Transitions: always name the property (transition-colors, transition-opacity); never transition-all.
- Focus styles: focus-visible: prefix only; never bare focus:.
- Icons come from @brightlocal/icons at their default 16px — no size/strokeWidth overrides.
- Forms: the canonical pattern is Field > FieldLabel + control + FieldDescription + FieldError.
- Branding: app chrome (sidebar headers, top bars) uses the <Logo /> component — the BrightLocal mark — not hand-rolled initial tiles or text logos.
- NEVER restyle a DS component's own chrome with utility classes. No border/background/rounded/padding/state overrides on TabsTrigger, TabsList, Button, Input, Card internals, etc. — render them BARE and let the design system paint them (e.g. <TabsTrigger value="overview" dataHook="tab-overview">Overview</TabsTrigger>, nothing more). Utility classes are for LAYOUT AROUND components only: spacing, width, grid/flex placement. If a component looks wrong bare, the fix is a variant or size prop, never className surgery.
- No celebration effects (canvas-confetti) in BrightLocal screens.
- Charts: always wrap in a container with an explicit fixed height (h-64, h-80) — never height="100%" inside an unsized parent (recharts logs width(-1) and renders nothing).`;

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
    // Their QA/testing attribute doubles as Studio's selection protocol;
    // AI_USAGE already forces the model to stamp it on interactive roots.
    partAttribute: "data-hook",
    // data-hook names INSTANCES ("settings-save-button"), not components
    // (finding #2 for the upstream report). Suffix convention → component.
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
    extraRules: BRIGHTLOCAL_EXTRA_RULES,
  },
  // Their composed patterns, harvested from the hidden blocks-* section
  // of their Storybook (story-store originalSource). Browsable in
  // Studio's Blocks area.
  blocks: BRIGHTLOCAL_BLOCKS,
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
