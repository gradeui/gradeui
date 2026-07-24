// brand-video.mjs — composite a tour video onto the branded slide
// background (dark-green "Platform UI Vision" board): the app sits in a
// rounded-corner panel offset to the right, title + logo come from the
// background PNG itself.
//
//   node scripts/brand-video.mjs --bg=<slide.png> --in=<video.mp4> [--out=<file.mp4>]
//   node scripts/brand-video.mjs --bg=<slide.png> --dir=<run folder>   # master + every section clip
//
// Panel geometry is derived from Ali's example slide (fractions of the
// slide): x 28.46%, y 11.29%, w 66.53% — height follows the video's
// aspect. Corner radius ~1.65% of panel width. Output matches the
// background's size (e.g. 3840x2160 for the 2x board), h264 crf 18.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
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
if (!args.bg || (!args.in && !args.dir)) {
  console.error("Required: --bg=<slide.png> and --in=<video.mp4> OR --dir=<run folder>");
  process.exit(1);
}

// ── background size ───────────────────────────────────────────────────
const bgBuf = fs.readFileSync(String(args.bg));
const BW = bgBuf.readUInt32BE(16);
const BH = bgBuf.readUInt32BE(20);

// Panel geometry (Ali's spec): the slide is designed at 1920x1080 with
// the video panel 96px from the RIGHT edge and vertically centred, at
// the video's native 1x size (1280x834 for the tour). The background is
// that design at 2x (3840x2160), so a 2x-captured video (2560x1668)
// drops in at NATIVE size — zero scaling, pixel-perfect. Radius 16px@1x.
const S = BW / 1920; // design-scale (2 on the 2x board)

// ── rounded-rect mask PNG (pure zlib, no PIL) ─────────────────────────
function writeMask(file, w, h, r) {
  const rows = [];
  const inside = (x, y) => {
    if (x >= r && x < w - r) return y >= 0 && y < h;
    if (y >= r && y < h - r) return x >= 0 && x < w;
    const cx = x < r ? r - 0.5 : w - r - 0.5;
    const cy = y < r ? r - 0.5 : h - r - 0.5;
    const dx = x - cx, dy = y - cy;
    return dx * dx + dy * dy <= r * r;
  };
  for (let y = 0; y < h; y++) {
    const row = Buffer.alloc(1 + w); // filter byte + grayscale
    for (let x = 0; x < w; x++) row[1 + x] = inside(x, y) ? 255 : 0;
    rows.push(row);
  }
  const raw = zlib.deflateSync(Buffer.concat(rows), { level: 9 });
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const t = Buffer.from(type);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(Buffer.concat([t, data])) >>> 0);
    return Buffer.concat([len, t, data, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 0; // 8-bit grayscale
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), chunk("IDAT", raw), chunk("IEND", Buffer.alloc(0)),
  ]));
}

function probeSize(file) {
  const r = spawnSync(FFMPEG, ["-i", file], { encoding: "utf8" });
  const m = (r.stderr || "").match(/, (\d{3,5})x(\d{3,5})[,\s]/);
  return m ? [+m[1], +m[2]] : null;
}

function brand(input, output) {
  const [vw, vh] = probeSize(input) ?? [2560, 1668];
  // Composite ENTIRELY in the 1x design space (1920x1080): overlaying
  // at the background's native 4K was the bottleneck (~2fps through the
  // software filter graph). The 2x video downscales to its design size
  // (1280x834) — output is the 1080p board Ali posts.
  const PW = Math.round(vw / 2) & ~1;
  const ph = Math.round(vh / 2) & ~1;
  const PX = 1920 - 96 - PW;
  const PY = Math.round((1080 - ph) / 2);
  const RADIUS = 16;
  const mask = path.join(path.dirname(output), `.mask-${PW}x${ph}.png`);
  if (!fs.existsSync(mask)) writeMask(mask, PW, ph, RADIUS);
  const r = spawnSync(FFMPEG, [
    "-y",
    "-loop", "1", "-i", String(args.bg),
    "-i", input,
    "-loop", "1", "-i", mask,
    "-filter_complex",
    `[0:v]scale=1920:1080:flags=lanczos[bg];` +
      `[1:v]scale=${PW}:${ph}:flags=lanczos[v];[2:v]format=gray,loop=-1:1[a];[v][a]alphamerge[va];` +
      `[bg][va]overlay=${PX}:${PY}:shortest=1,format=yuv420p[out]`,
    "-map", "[out]",
    // Hardware encode (VideoToolbox) — 4K composites in near-realtime
    // instead of ~10 min of x264; 25Mbps is transparent for a posted
    // demo (and far above what any platform re-encode keeps).
    "-c:v", "h264_videotoolbox", "-b:v", "12M", "-r", "30", "-movflags", "+faststart",
    output,
  ], { stdio: ["ignore", "ignore", "pipe"] });
  if (r.status !== 0) { console.error(r.stderr?.toString().slice(-500)); process.exit(1); }
  console.log(`✅ ${output}`);
  return mask;
}

let masks = new Set();
if (args.in) {
  const out = args.out && args.out !== true
    ? String(args.out)
    : String(args.in).replace(/\.mp4$/, "-branded.mp4");
  masks.add(brand(String(args.in), out));
} else {
  // --dir: master + every section clip → a "branded/" folder in the run
  const DIR = path.resolve(String(args.dir));
  const master = fs.readdirSync(DIR).find((f) => f.endsWith(".mp4"));
  const secDir = fs.readdirSync(DIR).find((f) => f.endsWith("-sections"));
  const outDir = path.join(DIR, "branded");
  fs.mkdirSync(outDir, { recursive: true });
  masks.add(brand(path.join(DIR, master), path.join(outDir, master)));
  if (secDir) {
    for (const f of fs.readdirSync(path.join(DIR, secDir)).filter((f) => f.endsWith(".mp4")).sort()) {
      masks.add(brand(path.join(DIR, secDir, f), path.join(outDir, f)));
    }
  }
}
for (const m of masks) fs.rmSync(m, { force: true });
