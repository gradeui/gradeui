/**
 * Regenerate app/theme.css from theme/glint.theme.json.
 *
 * The JSON is the Studio project's ThemeInput (the deterministic theme
 * contract); the CSS is the full generated var set for light + dark,
 * produced by the SAME generator the Studio preview uses, so the app
 * renders byte-identical colour to the prototype.
 *
 * Dev-time tooling only: it imports the generator from apps/docs
 * across the workspace, which is fine for a checked-in build artefact
 * but is exactly why the app itself must never import docs code at
 * runtime. If this app is extracted from the monorepo, keep editing
 * theme.css by regenerating it here first, or vendor the generator.
 *
 * Run from the repo:  pnpm -F @gradeui/glint gen:theme
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateTheme } from "../../docs/lib/themes/generator";
import { themeToPortableCss } from "../../docs/lib/themes/apply";
import type { ThemeInput } from "../../docs/lib/themes/types";

const here = dirname(fileURLToPath(import.meta.url));
const inputPath = join(here, "../theme/glint.theme.json");
const outPath = join(here, "../app/theme.css");

const input = JSON.parse(readFileSync(inputPath, "utf8")) as ThemeInput;
const theme = generateTheme(input);

const css = [
  "/* GENERATED FILE, do not edit by hand.",
  " * Source: theme/glint.theme.json (the Studio project's ThemeInput).",
  " * Regenerate: pnpm -F @gradeui/glint gen:theme",
  " */",
  "",
  themeToPortableCss(theme),
  "",
].join("\n");

writeFileSync(outPath, css);
console.log(
  `wrote ${outPath} (${css.length} bytes) for theme "${input.name}" (${input.id})`,
);
