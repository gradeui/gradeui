#!/usr/bin/env node
/**
 * check-registry-contracts.mjs — CI guard for the generated registry
 * contracts.
 *
 *   cd packages/studio && node scripts/check-registry-contracts.mjs
 *
 * Exit 0 = committed contracts match a fresh extraction and hold every
 * invariant. Exit 1 = drift; the message says what to run.
 *
 * Why this exists: the BrightLocal contracts drifted silently from the
 * shipped package for months. `save_screen` rejected props that genuinely
 * existed (`Checkbox.checked`, `TabsTrigger.value`, `DataTablePagination.
 * table`), authors concluded the design system couldn't do those things,
 * and hand-rolled replacements for working components — including three
 * keyboard-inaccessible ones. Nothing failed loudly, so nothing got fixed.
 * A version bump with no regeneration reintroduces exactly that, which is
 * what check 1 below is for.
 *
 * Three checks:
 *   1. DRIFT (fails) — regenerate in memory, byte-compare with the
 *      committed file.
 *   2. INVARIANTS (fails) — structural properties that encode the two
 *      historical bugs, so a future refactor can't quietly restore them.
 *   3. CROSS-REGISTRY COLLISIONS (reports, never fails) — see the note on
 *      that section for why this one can't be a hard gate.
 */

import { readFileSync } from "node:fs";
import {
  buildContracts,
  OUT_FILE_PATH,
  ALLOWLIST_FILE_PATH,
} from "./generate-brightlocal-contracts.mjs";

const problems = [];


// ─── 1. Drift ─────────────────────────────────────────────────────────
const { specs, text, allowlistText, allowed, stats } = buildContracts();

/** Registry-local components (registries/brightlocal/lib/*.jsx) have
 *  contracts but are deliberately absent from the PACKAGE allowlist —
 *  screens reach them through `runtime.libModules`, not the npm barrel. */
const SIDECAR_LOCAL = new Set(stats.localNames);

let committed = "";
try {
  committed = readFileSync(OUT_FILE_PATH, "utf-8");
} catch {
  problems.push(
    "contracts.generated.ts is missing entirely — run `pnpm -F @gradeui/studio generate:brightlocal-contracts`.",
  );
}

if (committed && committed !== text) {
  problems.push(
    [
      `Committed contracts do not match a fresh extraction from @brightlocal/ui-components@${stats.version}.`,
      "This is what silent contract drift looks like: the validator would reject props the package really has (or accept ones it doesn't).",
      "Fix: pnpm -F @gradeui/studio generate:brightlocal-contracts && commit the result.",
    ].join("\n    "),
  );
}

let committedAllowlist = "";
try {
  committedAllowlist = readFileSync(ALLOWLIST_FILE_PATH, "utf-8");
} catch {
  problems.push("allowlist.generated.ts is missing entirely.");
}
if (committedAllowlist && committedAllowlist !== allowlistText) {
  problems.push(
    [
      `Committed allowlist does not match @brightlocal/ui-components@${stats.version}'s barrel.`,
      "list_components answers from this file, so a stale one hides components that save_screen would happily accept.",
      "Fix: pnpm -F @gradeui/studio generate:brightlocal-contracts && commit the result.",
    ].join("\n    "),
  );
}

/** Anything with a contract must also be emittable, or the model is told
 *  about a component it is then forbidden to write. (The reverse is fine:
 *  props-less components are allowlisted with no contract.) */
const contractedNotAllowed = Object.keys(specs).filter(
  (n) => !allowed.includes(n) && !SIDECAR_LOCAL.has(n),
);
if (contractedNotAllowed.length) {
  problems.push(
    `${contractedNotAllowed.length} component(s) have a contract but are not on the allowlist, so list_components hides them: ${contractedNotAllowed.join(", ")}`,
  );
}

// ─── 2. Invariants ────────────────────────────────────────────────────
//
// Each of these failed in production before the d.ts rewrite. They are
// asserted by shape, not by exact prop list, so a legitimate upstream API
// change doesn't trip them but a regression in the EXTRACTOR does.

/** A contract with no props and no host element can only ever answer
 *  "every prop is invalid" — the `Valid props: .` failure. The generator
 *  omits those names so the validator leaves the tag unchecked instead. */
const rejectOnly = Object.entries(specs)
  .filter(([, s]) => Object.keys(s.props).length === 0 && !s.element)
  .map(([n]) => n);
if (rejectOnly.length) {
  problems.push(
    `${rejectOnly.length} contract(s) have no props AND no element, so they reject every prop written on them: ${rejectOnly.join(", ")}`,
  );
}

/** Props that are only reachable through `extends` / `Omit<>` /
 *  `ComponentProps<>` — i.e. the ones the sidecar-derived generator lost.
 *  If these go missing, the checker walk has broken. */
const INHERITED_PROP_CHECKS = [
  ["Checkbox", "checked"],
  ["Checkbox", "onCheckedChange"],
  ["TabsList", "dataHook"],
  ["TabsTrigger", "value"],
  ["SelectItem", "value"],
  ["DropdownMenuTrigger", "asChild"],
  ["Progress", "value"],
];
for (const [component, prop] of INHERITED_PROP_CHECKS) {
  const spec = specs[component];
  if (!spec) {
    problems.push(`<${component}> has no contract at all.`);
  } else if (!spec.props[prop]) {
    problems.push(
      `<${component}> is missing \`${prop}\` — an inherited prop the type checker should resolve. The extractor has stopped following extends/Omit/ComponentProps.`,
    );
  }
}

/** `TabsTrigger.value` is REQUIRED in source. Requiredness surviving
 *  extraction is a separate property from the prop existing. */
if (specs.TabsTrigger?.props?.value?.optional) {
  problems.push(
    "<TabsTrigger> `value` is marked optional; the declaration makes it required.",
  );
}

/** Components spreading a native surface must declare `element`, which is
 *  how the validator accepts `onClick` and friends without the contract
 *  restating @types/react. */
const NEEDS_ELEMENT = ["Button", "Input", "TabsTrigger", "Checkbox"];
for (const name of NEEDS_ELEMENT) {
  if (specs[name] && !specs[name].element) {
    problems.push(
      `<${name}> declares no \`element\`, so native attributes and on* handlers will be rejected on it.`,
    );
  }
}

/** The registry's `package.version` is what the PREVIEW loads from
 *  esm.sh. If it lags the version the contracts were extracted from, a
 *  screen can pass the contract check and still die at runtime with
 *  "has no export X" — which is exactly what happened when the contracts
 *  moved to 2.25.0 and this pin stayed on 2.20.0 (17 Aug 2026). Validated
 *  against the SHIPPED source, not a copy, so the two cannot disagree. */
try {
  const registrySrc = readFileSync(
    new URL("../src/registry/brightlocal.ts", import.meta.url),
    "utf-8",
  );
  const pinned = registrySrc.match(/version:\s*"([^"]+)"/)?.[1];
  if (!pinned) {
    problems.push(
      "could not read `package.version` out of src/registry/brightlocal.ts",
    );
  } else if (pinned !== stats.version) {
    problems.push(
      [
        `Registry pins @brightlocal/ui-components@${pinned} for the preview, but contracts were extracted from ${stats.version}.`,
        "The preview would render a different library than save_screen validates against.",
        "Fix: set `package.version` in src/registry/brightlocal.ts to " + stats.version + ".",
      ].join("\n    "),
    );
  }
} catch (err) {
  problems.push(`could not check the registry version pin: ${err.message}`);
}

/** A prop typed as a mixed union or opaque object must be `unknown`, not
 *  coerced to `string` — a string schema rejects `<Checkbox checked />`. */
if (specs.Checkbox?.props?.checked?.kind === "string") {
  problems.push(
    "<Checkbox> `checked` is typed `string`; its real type is Radix's CheckedState (boolean | \"indeterminate\") and a string schema rejects the boolean shorthand.",
  );
}

// ─── 3. Cross-registry collisions (report only) ───────────────────────
//
// The brief for this script asked that CI also fail when "the two
// registries disagree about a component present in both". It is reported
// but NOT failed, because for gradeui vs brightlocal disagreement is the
// expected state, not a defect: they are different design systems that
// happen to share component NAMES. Grade's Button is
// variant=default|destructive|… size=md; BrightLocal's is
// variant=primary|… size=default. Failing on that would put CI in a state
// no correct change could clear. The check that catches the real bug —
// contracts disagreeing with the SHIPPED PACKAGE — is check 1.
//
// The listing is still worth printing: a name in both registries is a name
// a screen author can get wrong, and it's the input to any future
// per-name reconciliation.
let collisionNote = "";
try {
  const gradeSrc = readFileSync(
    new URL("../../ui/lib/contracts.ts", import.meta.url),
    "utf-8",
  );
  // The barrel is `{ Button: buttonContract, … }` — read the KEYS.
  const gradeNames = [
    ...gradeSrc
      .slice(gradeSrc.indexOf("COMPONENT_CONTRACTS"))
      .matchAll(/^\s{2}([A-Z][A-Za-z0-9]*):/gm),
  ].map((m) => m[1]);
  const shared = gradeNames.filter((n) => specs[n]);
  collisionNote = `${shared.length} component name(s) exist in both the gradeui and brightlocal registries — they are validated per-project, never merged.`;
} catch {
  collisionNote =
    "(skipped cross-registry listing — gradeui's generated contracts weren't readable from here)";
}

// ─── Report ───────────────────────────────────────────────────────────
console.log(
  `brightlocal: ${stats.total} contracts (${stats.fromDts} from @brightlocal/ui-components@${stats.version}, ${stats.fromSidecars} registry-local)`,
);
console.log(collisionNote);

if (problems.length === 0) {
  console.log("\n✓ registry contracts are in sync and hold every invariant.");
  process.exit(0);
}
console.error(`\n✗ ${problems.length} problem(s):\n`);
for (const p of problems) console.error(`  - ${p}\n`);
process.exit(1);
