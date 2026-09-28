// Regenerates BOTH of BrightLocal's Studio preview stylesheets from the
// installed @brightlocal/tokens package:
//
//   src/registry/brightlocal/preview-css.generated.ts
//     BRIGHTLOCAL_PREVIEW_CSS: plain CSS, injected as an ordinary <style>.
//     The four core-token layers (_colors, _spacing, _typography, _motion)
//     plus the preset's semantic :root and .dark alias blocks, plus a small
//     block of compatibility aliases for names the DS renamed.
//
//   src/registry/brightlocal/preview-theme.generated.ts
//     BRIGHTLOCAL_PREVIEW_THEME: the preset's main @theme inline block.
//     BRIGHTLOCAL_PREVIEW_THEME_FULL: Tailwind v4 SOURCE, compiled in the
//     browser by externalTwCss() in apps/docs/lib/external-ds-preview.ts.
//     It is the preset from after its @import lines to the end (every
//     @theme inline block, @layer base/components, @utility, @keyframes,
//     the reduced-motion reset, the deprecated alias utilities), minus the
//     semantic :root/.dark blocks (they already ride in the plain CSS), plus
//     the Studio-only additions listed in STUDIO_THEME_COMPAT below.
//
// Why generated and not npm-imported: tailwind-preset.css is a Tailwind v4
// SOURCE file (@import "tailwindcss", @import "tw-animate-css", @theme).
// In-browser bundlers cannot resolve those imports (the Sandpack TIME_OUT),
// so the preview compiles an inlined copy instead. This script replaces
// the old hand extraction (tokens v0.8.0) and the old motion-only
// appender (scripts/generate-brightlocal-motion-css.mjs, now a shim).
//
// Rules the output must keep, all asserted below:
//   1. The theme string must not contain the text "@import" ANYWHERE, even
//      in a comment. The v4 browser build only prepends its own
//      `@import "tailwindcss"` when the source has no "@import" in it, and
//      it throws on any import it cannot serve.
//   2. No @source / @plugin / @config: the browser build cannot scan files
//      or load modules.
//   3. The dark variant comes from externalTwCss(), which already emits
//      `@custom-variant dark (&:is(.dark *))`. The preset's own identical
//      top-level `@variant dark` line is dropped so it is defined once.
//   4. Fonts are NOT taken from the package (its fonts.css points at local
//      woff2 files the preview cannot serve). The preview keeps loading
//      Inter / Poppins / Geist Mono from EXTERNAL_FONTS_URL and bridging
//      them with EXTERNAL_FONT_VARS_CSS, exactly as before.
//
// CSS comments from the package are stripped from both strings: they are
// about half the preset's bytes, and the payload is shipped into every
// preview iframe. The package itself is the commented reference.
//
// Usage (from packages/studio):
//   pnpm generate:brightlocal-preview-css
//   (or: node scripts/generate-brightlocal-preview-css.mjs)
//
// Bumping @brightlocal/tokens: update the devDependency in
// apps/docs/package.json, pnpm install, set EXPECTED_VERSION below, rerun,
// and review RENAMED_VARS against the package changelog.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const EXPECTED_VERSION = "1.0.0";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../../..");
const tokensDir = resolve(repo, "apps/docs/node_modules/@brightlocal/tokens");
const outDir = resolve(here, "../src/registry/brightlocal");
const cssTarget = resolve(outDir, "preview-css.generated.ts");
const themeTarget = resolve(outDir, "preview-theme.generated.ts");

// Variables the DS renamed since the version Studio screens were first
// written against (0.8.0). Screens stored in Supabase may still reference
// the old names, so each old name stays defined as an alias of the new one.
// Checked by grepping packages/studio/registries/brightlocal, apps/docs and
// apps/brightlocal for every --ds-* name the new package no longer defines.
const RENAMED_VARS = {
  "--ds-custom-brand-primary-foreground-light":
    "--ds-colors-brand-primary-foreground-light",
  "--ds-custom-brand-primary-foreground-dark":
    "--ds-colors-brand-primary-foreground-dark",
};

// Studio-only Tailwind source that the preset does NOT carry. The July 13
// hand extraction defined these two keyframes under their pre-DS-806 names;
// the preset now animates its deprecated animate-pop-in and
// animate-grid-pin-pulse aliases with ds-motion-* keyframes instead, so
// these are kept only for any saved screen that names the old keyframe in
// an inline style.
const STUDIO_THEME_COMPAT = `
/* Studio compat: pre-DS-806 keyframe names from the July 13 hand extraction. */
@keyframes grid-pin-pulse {
  0% { box-shadow: 0 0 0 0 color-mix(in oklch, var(--grid-pin-pulse-color) 30%, transparent); }
  40% { box-shadow: 0 0 0 15px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}
@keyframes pop-in {
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
`;

// ── read the package ────────────────────────────────────────────────────

const pkg = JSON.parse(readFileSync(resolve(tokensDir, "package.json"), "utf8"));
if (pkg.version !== EXPECTED_VERSION) {
  throw new Error(
    `@brightlocal/tokens is ${pkg.version}, this generator expects ${EXPECTED_VERSION}. ` +
      "Review the package changelog (renamed variables, new preset sections), " +
      "then update EXPECTED_VERSION and RENAMED_VARS in this script.",
  );
}

const read = (rel) => readFileSync(resolve(tokensDir, rel), "utf8");
const LAYERS = ["_colors.css", "_spacing.css", "_typography.css", "_motion.css"];
const layers = LAYERS.map((f) => read(`dist/core-tokens/css/${f}`));
const preset = read("dist/styles/tailwind-preset.css");

// ── split the preset ────────────────────────────────────────────────────

// Everything after the last @import line.
const importRe = /^@import\s+[^;]+;[^\n]*\n/gm;
let afterImports = 0;
for (const m of preset.matchAll(importRe)) afterImports = m.index + m[0].length;
if (!afterImports) throw new Error("no @import lines found in tailwind-preset.css");
let body = preset.slice(afterImports);

// Top-level blocks, in source order, with their [start, end) offsets.
const top = topLevelBlocks(body);

// The semantic alias blocks: the FIRST top-level `:root {` and `.dark {`.
// (A later :root bridges --motion-motif-spin-duration; it stays in the
// theme where the preset puts it.)
const rootBlock = top.find((b) => b.head === ":root");
const darkBlock = top.find((b) => b.head === ".dark");
if (!rootBlock || !darkBlock) throw new Error("semantic :root / .dark blocks not found");
const semanticRoot = body.slice(rootBlock.start, rootBlock.end);
const semanticDark = body.slice(darkBlock.start, darkBlock.end);

// The main @theme inline block: the big one that remaps the colour
// families. BRIGHTLOCAL_PREVIEW_THEME has always meant exactly this block.
const themeBlocks = top.filter((b) => b.head === "@theme inline");
if (!themeBlocks.length) throw new Error("no @theme inline block found");
const mainTheme = themeBlocks.reduce((a, b) => (b.end - b.start > a.end - a.start ? b : a));

// Cut out the semantic blocks, and split the rest around the main @theme.
const cut = (s, blocks) => {
  let out = "";
  let at = 0;
  for (const b of [...blocks].sort((x, y) => x.start - y.start)) {
    out += s.slice(at, b.start);
    at = b.end;
  }
  return out + s.slice(at);
};
const beforeTheme = cut(body.slice(0, mainTheme.start), [rootBlock, darkBlock].filter((b) => b.end <= mainTheme.start));
const themeText = body.slice(mainTheme.start, mainTheme.end);
const afterThemeBlocks = [rootBlock, darkBlock]
  .filter((b) => b.start >= mainTheme.end)
  .map((b) => ({ start: b.start - mainTheme.end, end: b.end - mainTheme.end }));
const afterTheme = cut(body.slice(mainTheme.end), afterThemeBlocks);

// Drop the dark variant line (externalTwCss owns it, see rule 3).
const dropVariant = (s) => {
  const re = /^@variant\s+dark\s*\(&:is\(\.dark \*\)\);\s*$/m;
  return s.replace(re, "");
};

const presetBefore = tidy(dropVariant(stripComments(beforeTheme)));
const presetTheme = tidy(stripComments(themeText));
const presetAfter = tidy(dropVariant(stripComments(afterTheme)));

if (/@variant\s+dark/.test(presetBefore + presetAfter)) {
  throw new Error("the preset's @variant dark line changed shape; update dropVariant()");
}

// ── build the plain CSS ─────────────────────────────────────────────────

const allDefined = new Set(
  [...layers, preset].join("\n").match(/--[A-Za-z0-9-]+(?=\s*:)/g),
);
const aliasLines = [];
for (const [oldName, newName] of Object.entries(RENAMED_VARS)) {
  if (!allDefined.has(newName)) {
    throw new Error(`rename target ${newName} is not defined in tokens ${pkg.version}`);
  }
  if (allDefined.has(oldName)) continue; // the DS defines it again; no alias needed
  aliasLines.push(`  ${oldName}: var(${newName});`);
}
const compatCss = aliasLines.length
  ? `/* Studio compat: variables renamed since tokens 0.8.0, aliased so saved
   screens that name the old variable keep their colour. */
:root {
${aliasLines.join("\n")}
}`
  : "";

const previewCss =
  [
    ...layers.map((l) => tidy(stripComments(l))),
    tidy(stripComments(semanticRoot)),
    tidy(stripComments(semanticDark)),
    compatCss,
  ]
    .filter(Boolean)
    .join("\n\n") + "\n";

// ── assertions ──────────────────────────────────────────────────────────

const themeFull = presetBefore + "\n\n" + presetTheme + "\n\n" + presetAfter + "\n" + STUDIO_THEME_COMPAT;
for (const bad of ["@import", "@source", "@plugin", "@config"]) {
  if (themeFull.includes(bad)) throw new Error(`theme output contains "${bad}"`);
}
if (previewCss.includes("@import")) throw new Error('plain CSS output contains "@import"');
for (const needle of [
  "@utility text-heading-page",
  "@utility animate-status-shimmer",
  "--color-skeleton",
]) {
  if (!themeFull.includes(needle)) throw new Error(`theme output is missing ${needle}`);
}
for (const needle of ["--skeleton:", "--ds-content-padding:"]) {
  if (!previewCss.includes(needle)) throw new Error(`plain CSS output is missing ${needle}`);
}
balanced(themeFull, "theme");
balanced(previewCss, "plain CSS");

// ── write ───────────────────────────────────────────────────────────────

const RERUN = "pnpm -F @gradeui/studio generate:brightlocal-preview-css";

writeFileSync(
  cssTarget,
  `/* eslint-disable */
// THIS FILE IS GENERATED, do not edit by hand.
// Source: @brightlocal/tokens v${pkg.version}, read from
// apps/docs/node_modules/@brightlocal/tokens:
//   dist/core-tokens/css/${LAYERS.join(", ")}
//   + the semantic :root and .dark alias blocks of dist/styles/tailwind-preset.css
//   + Studio compat aliases for renamed variables (${Object.keys(RENAMED_VARS).length} checked, ${aliasLines.length} emitted).
// CSS comments are stripped; the package is the commented reference.
// Plain CSS, injected as an ordinary <style> by every Studio renderer. The
// Tailwind half of the preset lives in preview-theme.generated.ts.
// Regenerate: ${RERUN}
// (scripts/generate-brightlocal-preview-css.mjs)

export const BRIGHTLOCAL_PREVIEW_CSS: string = ${JSON.stringify(previewCss)};
`,
);

writeFileSync(
  themeTarget,
  `/* eslint-disable */
// THIS FILE IS GENERATED, do not edit by hand.
// Source: @brightlocal/tokens v${pkg.version} dist/styles/tailwind-preset.css,
// everything after its @import lines, as Tailwind v4 SOURCE for the
// in-browser compiler (externalTwCss in apps/docs/lib/external-ds-preview.ts).
// Removed on the way: the @import lines, the semantic :root/.dark blocks
// (they ride in preview-css.generated.ts), the top-level dark @variant
// (externalTwCss defines it), and all CSS comments. Appended: the
// Studio-only compat keyframes in STUDIO_THEME_COMPAT of the generator.
// Regenerate: ${RERUN}
// (scripts/generate-brightlocal-preview-css.mjs)

/** The preset's main @theme inline block: the full Tailwind vocabulary
 *  (all colour families remapped onto --ds-tailwind-colors-*, semantic
 *  colours, fonts, the shifted weight ramp, radii). */
export const BRIGHTLOCAL_PREVIEW_THEME: string = ${JSON.stringify(presetTheme)};

const PRESET_BEFORE_THEME: string = ${JSON.stringify(presetBefore)};

const PRESET_AFTER_THEME: string = ${JSON.stringify(presetAfter)};

const STUDIO_THEME_COMPAT: string = ${JSON.stringify(STUDIO_THEME_COMPAT)};

/** Everything the preview's Tailwind v4 browser build compiles for BrightLocal. */
export const BRIGHTLOCAL_PREVIEW_THEME_FULL: string =
  PRESET_BEFORE_THEME +
  "\\n\\n" +
  BRIGHTLOCAL_PREVIEW_THEME +
  "\\n\\n" +
  PRESET_AFTER_THEME +
  "\\n" +
  STUDIO_THEME_COMPAT;
`,
);

const utilities = [...themeFull.matchAll(/@utility\s+([\w-]+)/g)].length;
const keyframes = [...themeFull.matchAll(/@keyframes\s+([\w-]+)/g)].length;
console.log(
  `[brightlocal-preview-css] tokens ${pkg.version}: css ${previewCss.length} bytes, ` +
    `theme ${themeFull.length} bytes (${utilities} @utility, ${keyframes} @keyframes), ` +
    `${aliasLines.length} rename aliases`,
);

// ── helpers ─────────────────────────────────────────────────────────────

// Removes /* */ comments, leaving quoted strings alone.
function stripComments(css) {
  let out = "";
  let i = 0;
  let quote = null;
  while (i < css.length) {
    const c = css[i];
    if (quote) {
      out += c;
      if (c === "\\") {
        out += css[i + 1] ?? "";
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      out += c;
      i += 1;
      continue;
    }
    if (c === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      if (end < 0) throw new Error("unterminated comment");
      i = end + 2;
      continue;
    }
    out += c;
    i += 1;
  }
  return out;
}

// Trailing whitespace off every line, runs of blank lines collapsed.
function tidy(css) {
  return css
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Top-level blocks of a stylesheet: { head, start, end }. Comments and
// strings are skipped while matching braces.
function topLevelBlocks(css) {
  const blocks = [];
  let depth = 0;
  let stmtStart = 0;
  let blockStart = -1;
  let quote = null;
  for (let i = 0; i < css.length; i += 1) {
    const c = css[i];
    if (quote) {
      if (c === "\\") i += 1;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (c === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      i = end + 1;
      if (depth === 0) stmtStart = i + 1;
      continue;
    }
    if (c === "{") {
      if (depth === 0) blockStart = stmtStart;
      depth += 1;
    } else if (c === "}") {
      depth -= 1;
      if (depth === 0) {
        const text = css.slice(blockStart, i + 1);
        const head = text.slice(0, text.indexOf("{")).trim();
        blocks.push({ head, start: blockStart, end: i + 1 });
        stmtStart = i + 1;
      }
    } else if (c === ";" && depth === 0) {
      stmtStart = i + 1;
    }
  }
  if (depth !== 0) throw new Error("unbalanced braces in tailwind-preset.css");
  return blocks;
}

function balanced(css, label) {
  let depth = 0;
  for (const c of stripComments(css)) {
    if (c === "{") depth += 1;
    else if (c === "}") depth -= 1;
    if (depth < 0) throw new Error(`${label}: unbalanced braces`);
  }
  if (depth !== 0) throw new Error(`${label}: unbalanced braces`);
}
