/**
 * Playbook — everything the model reads or is steered by.
 *
 * Folder layout:
 *   components/ — allowlist, per-component refs, retrieval, manifest
 *   prompts/    — system prompt composition
 *   templates/  — starter prompts for the Studio launchpad
 *   sidecars/   — raw .md knowledge files (authored here; `scripts/generate-sidecars.mjs`
 *                 inlines them into components/sidecars.generated.ts)
 *   layouts/    — reserved for #24 (reference layouts as prompt scaffolds)
 *
 * Zero runtime deps — no fs, no React, no Lucide. Pure TS + inlined strings.
 * Host app joins UI concerns (icon maps, rendering) to playbook data by id.
 */

export * from "./components";
export * from "./prompts";
export * from "./templates";
export * from "./layouts";
