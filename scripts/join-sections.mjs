// join-sections.mjs — tie a contiguous run of a tour's SECTIONS into one
// clip, cut losslessly-in-quality from the MASTER video (not by
// concatenating the section files, so there are no seam artefacts).
//
//   node scripts/join-sections.mjs --dir=<run folder> --join=3-5
//   node scripts/join-sections.mjs --dir=<run folder> --join=1-2,7-9
//
// <run folder> is a timestamped recorder output folder containing
// <base>.mp4 and <base>-sections/. Ranges are 1-based section numbers
// (the NN- prefixes on the section clips). Output lands next to the
// section clips as NN-MM-<firstslug>-to-<lastslug>.mp4.
//
// Section boundaries come from <base>-sections/sections.json (written
// by the recorders). For runs made before sections.json existed, the
// boundaries are derived from the section clips' own durations
// (cumulative — sections partition the master exactly, in order).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function resolveFfmpeg() {
  try { return require("ffmpeg-static"); } catch {}
  const pnpm = path.join(REPO, "node_modules/.pnpm");
  const dir = fs.readdirSync(pnpm).find((d) => d.startsWith("ffmpeg-static@"));
  if (dir) return path.join(pnpm, dir, "node_modules/ffmpeg-static/ffmpeg");
  return "ffmpeg";
}
const FFMPEG = resolveFfmpeg();

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true];
}));
if (!args.dir || !args.join) {
  console.error("Required: --dir=<run folder> --join=<a-b[,c-d]>  (1-based section numbers)");
  process.exit(1);
}
const DIR = path.resolve(String(args.dir));
const master = fs.readdirSync(DIR).find((f) => f.endsWith(".mp4"));
if (!master) { console.error(`No master .mp4 in ${DIR}`); process.exit(1); }
const base = master.replace(/\.mp4$/, "");
const secDir = path.join(DIR, `${base}-sections`);
if (!fs.existsSync(secDir)) { console.error(`No sections dir: ${secDir}`); process.exit(1); }

// ── section boundaries ────────────────────────────────────────────────
let sections; // [{ n, slug, start, end }]
const manifest = path.join(secDir, "sections.json");
if (fs.existsSync(manifest)) {
  sections = JSON.parse(fs.readFileSync(manifest, "utf8"));
} else {
  // Fallback: cumulative clip durations (pre-manifest runs).
  const clips = fs.readdirSync(secDir)
    .filter((f) => /^\d{2}-.*\.mp4$/.test(f))
    .sort();
  let t = 0;
  sections = clips.map((f) => {
    const probe = spawnSync(FFMPEG, ["-i", path.join(secDir, f)], { encoding: "utf8" });
    const m = (probe.stderr || "").match(/Duration: (\d+):(\d+):([\d.]+)/);
    const dur = m ? (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]) : 0;
    const start = t; t += dur;
    return { n: parseInt(f.slice(0, 2), 10), slug: f.slice(3).replace(/\.mp4$/, ""), start, end: t };
  });
  console.log(`(no sections.json — derived ${sections.length} boundaries from clip durations)`);
}

// ── cut each requested range from the master ──────────────────────────
for (const range of String(args.join).split(",")) {
  const m = range.trim().match(/^(\d+)\s*-\s*(\d+)$/);
  if (!m) { console.error(`Bad range "${range}" — use e.g. 3-5`); process.exit(1); }
  const [a, b] = [parseInt(m[1], 10), parseInt(m[2], 10)];
  const first = sections.find((s) => s.n === a);
  const last = sections.find((s) => s.n === b);
  if (!first || !last || b < a) { console.error(`Range ${range} not found (have 1-${sections.length})`); process.exit(1); }
  const p2 = (n) => String(n).padStart(2, "0");
  const out = path.join(secDir, `${p2(a)}-${p2(b)}-${first.slug}-to-${last.slug}.mp4`);
  const r = spawnSync(FFMPEG, [
    "-y", "-ss", first.start.toFixed(3), "-to", last.end.toFixed(3),
    "-i", path.join(DIR, master),
    "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    out,
  ], { stdio: ["ignore", "ignore", "pipe"] });
  if (r.status !== 0) { console.error(r.stderr?.toString().slice(-400)); process.exit(1); }
  console.log(`✅ ${out}  (${(last.end - first.start).toFixed(1)}s: sections ${a}-${b})`);
}
