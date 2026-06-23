// Permanent fix for lexical-beautiful-mentions@0.1.48's broken exports map.
//
// The package ships TWO builds: an ESM build at its root (`index.js`, which does
// `import ... from "lexical"`) and a CJS build in `cjs/` (`require("lexical")`).
// Its package.json `exports` wrongly points BOTH the `import` and `require`
// conditions at `./cjs/index.js`. So a bundler that picks the `import` condition
// (Next/Turbopack, Vite) still loads the CJS build, which pulls the CJS copy of
// `lexical` — while `@lexical/react` (the editor) loads the ESM copy. Two
// `LexicalNode` classes, and Lexical throws:
//   "BeautifulMentionNode does not subclass LexicalNode ... multiple copies of
//    the same lexical module (esm and cjs)".
//
// We repoint the `import` condition at the package's real ESM entry (`./index.js`)
// so ESM importers share the one ESM `lexical` the editor uses. Idempotent, runs
// on `postinstall`, and patches every copy pnpm materialises. Delete this script
// (and the postinstall hook) once the upstream exports map is fixed or we move to
// a `pnpm patch`.
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const pnpmDir = join(process.cwd(), "node_modules", ".pnpm");
if (!existsSync(pnpmDir)) process.exit(0);

let patched = 0;
for (const entry of readdirSync(pnpmDir)) {
  if (!entry.startsWith("lexical-beautiful-mentions@")) continue;
  const pkgPath = join(
    pnpmDir,
    entry,
    "node_modules",
    "lexical-beautiful-mentions",
    "package.json",
  );
  if (!existsSync(pkgPath)) continue;
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  if (pkg.exports && typeof pkg.exports === "object" && pkg.exports.import !== "./index.js") {
    pkg.exports.import = "./index.js";
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    patched++;
  }
}
if (patched) {
  console.log(
    `[fix-lexical-mentions] repointed ESM export in ${patched} lexical-beautiful-mentions copy(ies)`,
  );
}
