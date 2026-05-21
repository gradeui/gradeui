/**
 * Round-trip verification for the per-side margin/padding parsers
 * and writers. Self-contained — no test framework needed; run with
 *
 *   cd apps/docs && npx tsx lib/tailwind-classes.roundtrip.ts
 *
 * Exits 0 if every case passes, 1 if any fails. Prints a concise
 * PASS/FAIL line per case plus a summary at the bottom.
 *
 * What's covered:
 *   1. Parse: known per-side and axis variants land in the right
 *      sides; later tokens override earlier ones (Tailwind
 *      "shadows-later" semantics).
 *   2. Serialise: the writer collapses to the minimal token set —
 *      all-equal → `m-N`, axis-paired → `mx-X my-Y`, mixed →
 *      per-side tokens.
 *   3. Round-trip stability: parse → serialise → parse returns the
 *      same SideValues. This is the property that gives the
 *      structured control authority over the className.
 *   4. Idempotence: writing the same value twice produces the same
 *      string (modulo whitespace).
 *
 * Add cases below as new edge conditions show up in the wild.
 */

import {
  parseFontSize,
  parseFontWeight,
  parseMarginSides,
  parseOpacity,
  parsePaddingSides,
  setFontSize,
  setFontWeight,
  setMarginSides,
  setOpacity,
  setPaddingSides,
  type SideValues,
} from "./tailwind-classes";

// ─── Tiny assert harness ──────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail?: string) {
  if (ok) {
    passed += 1;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } else {
    failed += 1;
    failures.push(name + (detail ? ` — ${detail}` : ""));
    console.log(`  \x1b[31m✗\x1b[0m ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function eqSides(a: SideValues, b: SideValues): boolean {
  return a.t === b.t && a.r === b.r && a.b === b.b && a.l === b.l;
}

function fmtSides(s: SideValues): string {
  const v = (n: number | null) => (n === null ? "·" : String(n));
  return `{t:${v(s.t)} r:${v(s.r)} b:${v(s.b)} l:${v(s.l)}}`;
}

function section(title: string) {
  console.log(`\n\x1b[1m${title}\x1b[0m`);
}

// ─── Parse cases ──────────────────────────────────────────────────────

section("parseMarginSides — coverage");

check(
  "empty className → all null",
  eqSides(parseMarginSides(""), { t: null, r: null, b: null, l: null }),
);

check(
  "single per-side `mb-6` → only bottom set",
  eqSides(parseMarginSides("mb-6"), { t: null, r: null, b: 6, l: null }),
);

check(
  "all-sides `m-4` → every side 4",
  eqSides(parseMarginSides("m-4"), { t: 4, r: 4, b: 4, l: 4 }),
);

check(
  "axis `my-2` → top + bottom 2",
  eqSides(parseMarginSides("my-2"), { t: 2, r: null, b: 2, l: null }),
);

check(
  "axis `mx-3` → left + right 3",
  eqSides(parseMarginSides("mx-3"), { t: null, r: 3, b: null, l: 3 }),
);

check(
  "all-sides + per-side `m-4 mb-6` → bottom shadows to 6",
  eqSides(parseMarginSides("m-4 mb-6"), { t: 4, r: 4, b: 6, l: 4 }),
);

check(
  "axis + per-side `mx-2 ml-5` → left shadows to 5",
  eqSides(parseMarginSides("mx-2 ml-5"), { t: null, r: 2, b: null, l: 5 }),
);

check(
  "non-margin tokens ignored `text-2xl font-bold mb-6`",
  eqSides(parseMarginSides("text-2xl font-bold mb-6"), {
    t: null,
    r: null,
    b: 6,
    l: null,
  }),
);

check(
  "padding tokens don't bleed into margin parser",
  eqSides(parseMarginSides("p-4 mx-2"), { t: null, r: 2, b: null, l: 2 }),
);

section("parsePaddingSides — sanity");

check(
  "`p-3` → every side 3",
  eqSides(parsePaddingSides("p-3"), { t: 3, r: 3, b: 3, l: 3 }),
);

check(
  "`pt-1 pr-2 pb-3 pl-4` → distinct sides",
  eqSides(parsePaddingSides("pt-1 pr-2 pb-3 pl-4"), {
    t: 1,
    r: 2,
    b: 3,
    l: 4,
  }),
);

check(
  "`px-2 py-4` → axis pair",
  eqSides(parsePaddingSides("px-2 py-4"), { t: 4, r: 2, b: 4, l: 2 }),
);

// ─── Serialise cases ──────────────────────────────────────────────────

section("setMarginSides — minimal-token writer");

check(
  "all-null → strips family entirely",
  setMarginSides("text-2xl mb-6", { t: null, r: null, b: null, l: null }) ===
    "text-2xl",
);

check(
  "all-equal collapses to `m-N`",
  setMarginSides("", { t: 4, r: 4, b: 4, l: 4 }) === "m-4",
  `got: ${JSON.stringify(setMarginSides("", { t: 4, r: 4, b: 4, l: 4 }))}`,
);

check(
  "axis-paired collapses to `mx-X my-Y`",
  setMarginSides("", { t: 2, r: 4, b: 2, l: 4 }) === "my-2 mx-4",
  `got: ${JSON.stringify(setMarginSides("", { t: 2, r: 4, b: 2, l: 4 }))}`,
);

check(
  "mixed → per-side tokens in clockwise order (T R B L)",
  setMarginSides("", { t: 1, r: 2, b: 3, l: 4 }) === "mt-1 mr-2 mb-3 ml-4",
  `got: ${JSON.stringify(setMarginSides("", { t: 1, r: 2, b: 3, l: 4 }))}`,
);

check(
  "single side → one token",
  setMarginSides("", { t: null, r: null, b: 6, l: null }) === "mb-6",
  `got: ${JSON.stringify(setMarginSides("", { t: null, r: null, b: 6, l: null }))}`,
);

check(
  "vertical pair, no horizontal → `my-N`",
  setMarginSides("", { t: 4, r: null, b: 4, l: null }) === "my-4",
);

check(
  "horizontal pair, no vertical → `mx-N`",
  setMarginSides("", { t: null, r: 2, b: null, l: 2 }) === "mx-2",
);

check(
  "preserves non-margin tokens",
  (() => {
    const out = setMarginSides("text-2xl font-bold mb-6", {
      t: 4,
      r: 4,
      b: 4,
      l: 4,
    });
    // Order: stripped className first, then new tokens appended.
    return out === "text-2xl font-bold m-4";
  })(),
);

check(
  "doesn't touch padding tokens when writing margin",
  setMarginSides("p-4 mb-6", { t: 2, r: 2, b: 2, l: 2 }) === "p-4 m-2",
);

// ─── Round-trip stability ─────────────────────────────────────────────

section("Round-trip stability — parse → serialise → parse");

const roundTripCases: { name: string; sides: SideValues }[] = [
  { name: "all null", sides: { t: null, r: null, b: null, l: null } },
  { name: "all-equal 4", sides: { t: 4, r: 4, b: 4, l: 4 } },
  { name: "axis pair (2,4,2,4)", sides: { t: 2, r: 4, b: 2, l: 4 } },
  { name: "all distinct", sides: { t: 1, r: 2, b: 3, l: 4 } },
  { name: "single bottom 6", sides: { t: null, r: null, b: 6, l: null } },
  { name: "horizontal only 3", sides: { t: null, r: 3, b: null, l: 3 } },
  { name: "vertical only 5", sides: { t: 5, r: null, b: 5, l: null } },
  { name: "asymmetric (4,2,null,2)", sides: { t: 4, r: 2, b: null, l: 2 } },
];

for (const { name, sides } of roundTripCases) {
  const written = setMarginSides("", sides);
  const re = parseMarginSides(written);
  check(
    `${name} survives round-trip`,
    eqSides(re, sides),
    `wrote "${written}", parsed back ${fmtSides(re)} (expected ${fmtSides(sides)})`,
  );
}

// ─── Idempotence ──────────────────────────────────────────────────────

section("Idempotence — writing the same value twice");

for (const { name, sides } of roundTripCases) {
  const a = setMarginSides("foo bar", sides);
  const b = setMarginSides(a, sides);
  check(`${name} — second write equals first`, a === b, `a:"${a}" b:"${b}"`);
}

// ─── Padding mirror tests (smaller — same code path under the hood) ──

section("setPaddingSides — mirror");

check(
  "padding all-equal collapses to `p-N`",
  setPaddingSides("", { t: 4, r: 4, b: 4, l: 4 }) === "p-4",
);

check(
  "padding round-trip (axis pair)",
  (() => {
    const sides: SideValues = { t: 3, r: 1, b: 3, l: 1 };
    const out = setPaddingSides("", sides);
    return eqSides(parsePaddingSides(out), sides);
  })(),
);

// ─── Opacity ──────────────────────────────────────────────────────────

section("Opacity — parse, set, round-trip");

check(
  "parse `opacity-10` → 10",
  parseOpacity("text-2xl opacity-10 font-bold") === 10,
);
check(
  "parse `opacity-50 hover:opacity-100` → 50 (state variants invisible)",
  parseOpacity("opacity-50 hover:opacity-100") === 50,
);
check(
  "set strips existing + appends new",
  setOpacity("text-2xl opacity-50", 10) === "text-2xl opacity-10",
);
check(
  "set null strips entirely",
  setOpacity("text-2xl opacity-50 font-bold", null) === "text-2xl font-bold",
);
for (const v of [0, 10, 50, 90, 100]) {
  check(
    `opacity ${v} survives round-trip`,
    parseOpacity(setOpacity("text-2xl", v)) === v,
  );
}

// ─── Font weight ──────────────────────────────────────────────────────

section("Font weight — parse, set, round-trip");

check(
  "parse `font-bold` → bold",
  parseFontWeight("text-2xl font-bold mb-6") === "bold",
);
check(
  "doesn't bait on font-mono / font-sans / font-serif",
  parseFontWeight("font-mono text-sm") === null,
);
check(
  "later weight shadows earlier",
  parseFontWeight("font-light font-bold") === "bold",
);
check(
  "set strips existing + appends new",
  setFontWeight("text-2xl font-bold", "semibold") ===
    "text-2xl font-semibold",
);
check(
  "set null strips entirely",
  setFontWeight("text-2xl font-bold mb-6", null) === "text-2xl mb-6",
);
for (const w of ["thin", "normal", "medium", "bold", "black"] as const) {
  check(
    `font weight ${w} survives round-trip`,
    parseFontWeight(setFontWeight("text-base", w)) === w,
  );
}

// ─── Font size ────────────────────────────────────────────────────────

section("Font size — parse, set, round-trip");

check(
  "parse `text-2xl` → 2xl",
  parseFontSize("text-2xl font-bold mb-6") === "2xl",
);
check(
  "doesn't bait on text-foreground / text-primary / text-balance / text-left",
  parseFontSize("text-foreground text-primary text-balance text-left") === null,
);
check(
  "parses around colour tokens — `text-foreground text-lg` → lg",
  parseFontSize("text-foreground text-lg") === "lg",
);
check(
  "later size shadows earlier",
  parseFontSize("text-sm text-2xl") === "2xl",
);
check(
  "set strips existing + appends new",
  setFontSize("text-foreground text-sm font-bold", "2xl") ===
    "text-foreground font-bold text-2xl",
);
check(
  "set null strips entirely; preserves colour token",
  setFontSize("text-foreground text-sm font-bold", null) ===
    "text-foreground font-bold",
);
check(
  "set null with no size token is a no-op (modulo whitespace)",
  setFontSize("text-foreground font-bold", null) === "text-foreground font-bold",
);
for (const s of ["xs", "base", "lg", "2xl", "5xl"] as const) {
  check(
    `font size ${s} survives round-trip`,
    parseFontSize(setFontSize("text-foreground", s)) === s,
  );
}

// ─── Summary ──────────────────────────────────────────────────────────

console.log(
  `\n${passed + failed} cases — \x1b[32m${passed} passed\x1b[0m, ${
    failed > 0 ? `\x1b[31m${failed} failed\x1b[0m` : `${failed} failed`
  }`,
);
if (failed > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  - ${f}`);
}
process.exit(failed > 0 ? 1 : 0);
