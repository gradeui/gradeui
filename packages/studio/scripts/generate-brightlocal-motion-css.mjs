// SUPERSEDED by scripts/generate-brightlocal-preview-css.mjs.
//
// This script used to append a hand-picked MOTION section (tokens v0.12.0)
// to the bottom of preview-css.generated.ts, rewriting the preset's
// @utility blocks as plain class rules. Since tokens 1.0.0 the whole
// preview stylesheet (every token layer, the semantic blocks, and the full
// preset including every motion @utility and @keyframes) is regenerated
// from the package in one pass, and the motion utilities are compiled by
// the preview's Tailwind build like every other utility. Appending the old
// motion section on top would duplicate them as unlayered rules that beat
// responsive variants, so this file now just runs the full generator.
//
// Usage: pnpm -F @gradeui/studio generate:brightlocal-preview-css

console.log(
  "[motion] superseded: running generate-brightlocal-preview-css.mjs instead",
);
await import("./generate-brightlocal-preview-css.mjs");
