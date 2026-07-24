// record-both.mjs — one flow → the FAST lossy version (to riff on) AND
// the pristine LOSSLESS version. Both filenames are timestamped.
//   node scripts/record-both.mjs --flow=scripts/flows/brightlocal-tour.json --out=demo.mp4 [--fps=60]
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const rest = process.argv.slice(2);
const outIdx = rest.findIndex((a) => a.startsWith("--out="));
const baseOut = outIdx >= 0 ? rest[outIdx].slice(6) : "flow.mp4";
const argsFor = (suffix) => {
  const r = [...rest];
  const tagged = baseOut.replace(/(\.[^.]+)$/, `-${suffix}$1`);
  if (outIdx >= 0) r[outIdx] = `--out=${tagged}`; else r.push(`--out=${tagged}`);
  return r;
};
const run = (script, args) => new Promise((res, rej) => {
  const p = spawn("node", [path.join(here, script), ...args], { stdio: "inherit" });
  p.on("exit", (c) => (c === 0 ? res() : rej(new Error(`${script} exit ${c}`))));
});
console.log("→ lossy (fast, to riff on)…");
await run("record-flow.mjs", argsFor("lossy"));
console.log("\n→ lossless (pristine, final)…");
await run("record-flow-lossless.mjs", argsFor("lossless"));
console.log("\n✅ both produced (timestamped).");
