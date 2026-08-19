// Appends BrightLocal's MOTION layer to the registry's inlined preview CSS.
//
// Why this script exists: preview-css.generated.ts said "Regenerate:
// extraction snippet in BYODS-BRIGHTLOCAL-PLAN.md when @brightlocal/tokens
// bumps" — and that snippet is not in that document. The file was made by
// hand once, from tokens v0.8.0, and there was no way to redo it. This is
// that missing step, for the motion layer specifically.
//
// What it takes, and from where:
//   dist/core-tokens/css/_motion.css   the --ds-motion-* custom properties
//   dist/styles/tailwind-preset.css    @keyframes ds-motion-* + the @utility
//                                      blocks that consume them
//
// The preset is a Tailwind v4 SOURCE file: `@utility x { … }` is a build-time
// directive, not CSS. The preview never runs that build (see the note at the
// top of preview-css.generated.ts), so each block is rewritten as a plain
// `.x { … }` rule here. Unlayered on purpose: wrapping them in
// `@layer utilities` would make THIS file the first thing to name that layer,
// and layer order is fixed by first mention — which would quietly reorder
// every Tailwind layer in the sandbox.
//
// APPEND-ONLY. It never rewrites the colour, spacing or typography blocks
// that are already in the generated file, so a motion bump cannot move a
// single existing value. Re-running replaces only the marked motion section.
//
// Usage: node scripts/generate-brightlocal-motion-css.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../../..");
const tokens = resolve(repo, "apps/docs/node_modules/@brightlocal/tokens");
const target = resolve(here, "../src/registry/brightlocal/preview-css.generated.ts");

const START = "/* ─── MOTION (generated: do not edit between the markers) ─── */";
const END = "/* ─── END MOTION ─── */";

const pkg = JSON.parse(readFileSync(resolve(tokens, "package.json"), "utf8"));
const motionVars = readFileSync(
  resolve(tokens, "dist/core-tokens/css/_motion.css"),
  "utf8",
);
const preset = readFileSync(resolve(tokens, "dist/styles/tailwind-preset.css"), "utf8");

// Every ds-motion keyframe, verbatim.
const keyframes = [...preset.matchAll(/@keyframes\s+(ds-motion-[\w-]+)\s*\{/g)].map((m) =>
  block(preset, m.index),
);

// The utilities that drive them, rewritten as plain class rules.
const WANTED = [
  "duration-fast", "duration-base", "duration-slow",
  "animate-entrance-fade", "animate-entrance-rise",
  "entrance-delay-1", "entrance-delay-2", "entrance-delay-3",
  "animate-ambient-spin", "animate-ambient-pulse",
  "animate-emphasis-pop", "animate-emphasis-strikethrough",
  // deprecated aliases, kept so existing screens keep animating
  "animate-motif-spin", "animate-grid-pin-pulse", "animate-pop-in",
];
const utilities = WANTED.map((name) => {
  const at = preset.indexOf(`@utility ${name} {`);
  if (at < 0) throw new Error(`@utility ${name} not found in tailwind-preset.css`);
  return block(preset, at).replace(`@utility ${name}`, `.${name}`);
});

// The easing tokens reach Tailwind through @theme (--ease-emphasized), which
// the preview cannot read either, so they get the same treatment. --tw-ease
// alongside, so tw-animate-css picks them up like a numeric duration.
const easings = ["emphasized", "overshoot"].map(
  (n) =>
    `.ease-${n} {\n  --tw-ease: var(--ds-motion-ease-${n});\n  transition-timing-function: var(--ds-motion-ease-${n});\n}`,
);

const section = [
  START,
  `/* @brightlocal/tokens ${pkg.version} — _motion.css + the motion blocks of`,
  `   tailwind-preset.css. Regenerate with`,
  `   scripts/generate-brightlocal-motion-css.mjs */`,
  motionVars.replace(/\/\*\*[\s\S]*?\*\/\s*/, "").trim(),
  ...keyframes,
  ...utilities,
  ...easings,
  END,
].join("\n\n");

const current = readFileSync(target, "utf8");
// One escaped payload, used by BOTH paths. Escaping once is what makes a
// re-run byte-identical: the first version escaped "\n\n" + section for the
// append and a .trim()ed variant for the replace, so every other run flipped
// the leading newlines and the file never settled.
const escaped = JSON.stringify(section).slice(1, -1);

let next;
if (current.includes(START)) {
  const from = current.indexOf(START);
  const to = current.indexOf(END) + END.length;
  next = current.slice(0, from) + escaped + current.slice(to);
} else {
  // append inside the exported string, before its closing quote
  const close = current.lastIndexOf('";');
  if (close < 0) throw new Error("could not find the end of BRIGHTLOCAL_PREVIEW_CSS");
  next = current.slice(0, close) + "\\n\\n" + escaped + "\\n" + current.slice(close);
}

writeFileSync(target, next);
console.log(
  `[motion] tokens ${pkg.version} → ${keyframes.length} keyframes, ${utilities.length} utilities, ${easings.length} easings appended`,
);

// Reads a balanced { … } block starting at the first brace after `from`.
function block(css, from) {
  const open = css.indexOf("{", from);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    else if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(from, i + 1);
    }
  }
  throw new Error("unbalanced block in tailwind-preset.css");
}
