/**
 * typescale-figma.mjs — emit per-musical-scale type ladders for Figma.
 *
 * For EVERY musical modular scale id in GDS_MODULAR_SCALES this:
 *   1. takes the `studio` ThemeInput as a base,
 *   2. overrides `typography.scale` = the scale id,
 *   3. runs the real `generateTheme`,
 *   4. reads `typography.namedScale` (2xs…7xl {size,lineHeight}) and
 *      `typography.scale` (display/h1…h6/body/bodySm),
 *   5. converts every rem string → px (×16) as a plain number,
 *   6. emits `typescale-figma.json` next to this script:
 *      { "<scaleId>": { "ladder": {...}, "roles": {...} } }
 *
 * Run (Linux): node --experimental-strip-types \
 *                --loader ./scripts/_ts-resolve-hook.mjs \
 *                scripts/typescale-figma.mjs   (from apps/docs)
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { studioInput } from "../lib/themes/inputs.ts";
import { generateTheme } from "../lib/themes/generator.ts";
import { GDS_MODULAR_SCALES, GDS_TYPE_SIZE_NAMES } from "@gradeui/core";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** "1.250rem" → 20 (px, ×16, rounded to 3 decimals). */
function remToPx(remStr) {
  const n = parseFloat(String(remStr).replace("rem", ""));
  return Math.round(n * 16 * 1000) / 1000;
}

const out = {};
const missingNamed = [];

for (const scale of GDS_MODULAR_SCALES) {
  const input = {
    ...studioInput,
    typography: { ...studioInput.typography, scale: scale.id },
  };
  const theme = generateTheme(input);
  const { namedScale, scale: roleScale } = theme.typography;

  if (!namedScale) {
    missingNamed.push(scale.id);
    continue;
  }

  const ladder = {};
  for (const name of GDS_TYPE_SIZE_NAMES) {
    ladder[name] = remToPx(namedScale[name].size);
  }

  const roles = {
    display: remToPx(roleScale.display),
    h1: remToPx(roleScale.h1),
    h2: remToPx(roleScale.h2),
    h3: remToPx(roleScale.h3),
    h4: remToPx(roleScale.h4),
    h5: remToPx(roleScale.h5),
    h6: remToPx(roleScale.h6),
    body: remToPx(roleScale.body),
    "body-sm": remToPx(roleScale.bodySm),
  };

  out[scale.id] = { ladder, roles };
}

const outPath = join(__dirname, "typescale-figma.json");
writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");

console.log(`Wrote ${outPath}`);
console.log(`Scales: ${Object.keys(out).join(", ")}`);
if (missingNamed.length) {
  console.log(`MISSING namedScale: ${missingNamed.join(", ")}`);
} else {
  console.log("All scales produced a namedScale.");
}

// Eyeball one ladder + its roles.
const sample = "golden-ratio";
console.log(`\nSample ladder (${sample}):`);
console.log(JSON.stringify(out[sample].ladder, null, 2));
console.log(`Sample roles (${sample}):`);
console.log(JSON.stringify(out[sample].roles, null, 2));
