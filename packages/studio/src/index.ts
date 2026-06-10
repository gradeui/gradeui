/**
 * @gradeui/studio — top-level barrel.
 *
 * Today this package contains only the `playbook/` subtree (model-facing
 * knowledge: sidecars, prompts, allowlist, templates). Future additions
 * (`ui/`, `runtime/`) land alongside it in their own subpath exports —
 * keep the top-level barrel thin so consumers can import what they need
 * without pulling unrelated surface area.
 *
 * Consumers typically import from the subpath for clarity:
 *   import { buildSystemPrompt } from "@gradeui/studio/playbook";
 *
 * …but the top-level re-export exists for quick one-off imports.
 */

export * from "./playbook";
export * from "./registry";
