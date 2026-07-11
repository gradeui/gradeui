/**
 * Studio walker registration — side-effect module.
 *
 * Imported once at /studio mount. Seeds the @gradeui/walker registry
 * with every PascalCase name in the playbook's ALLOWED_COMPONENTS, so
 * unknown-component diagnostics only fire on actual typos (not on
 * legitimate Grade components the model has emitted).
 *
 * Why a side-effect module rather than calling registerAll inside the
 * Studio page component:
 *   - registerAll mutates a module-level Set; it doesn't belong inside
 *     a React render path.
 *   - Top-level imports run once per session by Next's HMR boundary;
 *     re-registering the same names is a cheap idempotent operation
 *     but keeping the call here makes the boot timing obvious.
 *
 * Currently called from app/studio/page.tsx via a static side-effect
 * import. If the walker gets used elsewhere (e.g. consume-app's own
 * code-to-figma flow), move this into apps/docs/app/layout.tsx so the
 * registry is primed everywhere instead of just under /studio.
 */

import { registerAll, type RewriteRule } from "@gradeui/walker";
import { getActiveRegistry } from "@/lib/active-registry";
import * as LucideReact from "lucide-react";

// The active registry's `components.allowed` is a string[] of PascalCase
// component names (B1 — registry-fed instead of the gradeui constant).
// registerAll expects a `Record<string, unknown>` (the module's named
// exports). Bridge it: build a synthetic object whose KEYS are the
// component names. registerAll only inspects keys to populate the
// known-names set, so the values can be anything.
const registry: Record<string, true> = {};
for (const name of getActiveRegistry().components.allowed) {
  registry[name] = true;
}
registerAll(registry);

// ─── Lucide icon name format ────────────────────────────────────────────
//
// Every lucide-react icon exports as PascalCase (`<Settings/>`,
// `<Trash2/>`, `<UserCircle/>`) but the Figma file names its icon
// components in kebab-case (`settings`, `trash-2`, `user-circle`) —
// matching lucide.dev's own manifest. Without renaming, the plugin
// would look up "Settings" and fail.
//
// This is a many-to-many rename (each icon stays as its own Figma
// component, just under a different name), NOT a many-to-one collapse,
// so the rule uses the function form of `to`.
//
// Lucide-react exports every icon as a PascalCase named export, plus a
// few non-icon helpers (`createLucideIcon`, `Icon`, etc.) — filter
// those out so we only rename actual icons.
const LUCIDE_NON_ICON_EXPORTS = new Set([
  "createLucideIcon",
  "Icon",
  "icons",
  "default",
]);

const LUCIDE_ICON_NAMES = new Set<string>();
for (const key of Object.keys(LucideReact)) {
  if (!/^[A-Z]/.test(key)) continue;
  if (LUCIDE_NON_ICON_EXPORTS.has(key)) continue;
  LUCIDE_ICON_NAMES.add(key);
}

/**
 * Convert lucide's PascalCase export name into the kebab-case name
 * lucide.dev itself uses. `UserCircle` → `user-circle`, `Trash2` →
 * `trash-2`, `ArrowRightLeft` → `arrow-right-left`.
 *
 * If the Figma file uses different casing (snake_case, PascalCase, a
 * shared `Icon` component with a `name` variant), swap this transform
 * — or replace this rule with a many-to-one collapse using the string
 * form of `RewriteRule.to`.
 */
function pascalToKebab(name: string): string {
  return name
    // Split lowercase→Upper boundaries (UserCircle → User-Circle)
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    // Split letter→digit boundaries (Trash2 → Trash-2)
    .replace(/([A-Za-z])(\d)/g, "$1-$2")
    .toLowerCase();
}

/**
 * Walker rewrite rules exposed for the Studio Code tab. fast-frame.tsx
 * threads these into `<GradePayloadPanel walkerOptions.rewriteTypes>`.
 *
 * Currently one rule: rename lucide PascalCase icons to kebab-case so
 * they resolve against the Figma file's icon library.
 */
export const STUDIO_REWRITE_RULES: RewriteRule[] = [
  {
    match: (name) => LUCIDE_ICON_NAMES.has(name),
    to: pascalToKebab,
  },
];

// ─── Unwrap rules ────────────────────────────────────────────────────────
//
// React-only convenience components that don't exist as Figma primitives.
// Their wrapper gets dropped from the IR; their children land inline in
// the parent slot. CardTitle / CardDescription are the canonical case:
// the React API uses them for typography wrapping; Figma's Card / CardHeader
// just takes the text directly.
//
// As the design system expands, every "this is a styled string wrapper
// with no Figma counterpart" component goes in this list.
export const STUDIO_UNWRAP_TYPES: (string | RegExp)[] = [
  "CardTitle",
  "CardDescription",
];
