#!/usr/bin/env node
/**
 * Take the recordings on the Desktop and publish them into the app.
 *
 *   node apps/brightlocal/scripts/publish-videos.mjs [--only=the-gap]
 *
 * For each recording folder in ~/Desktop/brightlocal-videos/<flow>-<stamp>/
 * (the newest one per flow wins) this writes into
 * apps/brightlocal/public/videos/:
 *
 *   <slug>.mp4              1280 wide, faststart, the file the page plays
 *   <slug>.vtt              the subtitle track, straight from the recording
 *   <slug>.poster.jpg       the grid card's still
 *   <slug>.sprite.jpg       a 4-wide sheet of 160px stills, one every 2s
 *   <slug>.thumbs.vtt       maps each 2s window to a region of that sheet,
 *                           which is how a scrub-bar preview works
 *   thumbs/<chapter-id>.jpg one still per section, named by the section's
 *                           own id so it can be referenced from anywhere
 *
 * and regenerates lib/videos.generated.ts, which the /meta/videos pages read.
 *
 * WHY THE REPO AND NOT A BUCKET (Ali asked, 10 Sep). At 1280 and CRF 30 the
 * six cuts are about 25 MB together, which git carries without complaint and
 * Vercel serves from public/ with no credentials, no signed URLs and no extra
 * moving part. Move to Supabase Storage or Vercel Blob when this is dozens of
 * videos or when someone needs to upload one without a commit.
 */

import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = "/Users/alastairdriver/Development/2026/ramp-ds/gradeui";
const APP = path.join(ROOT, "apps/brightlocal");
const requireDocs = createRequire(`${ROOT}/apps/docs/package.json`);
const ffmpeg = requireDocs("ffmpeg-static");

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const SRC = path.join(os.homedir(), "Desktop", "brightlocal-videos");
const OUT = path.join(APP, "public/videos");
const THUMBS = path.join(OUT, "thumbs");
fs.mkdirSync(THUMBS, { recursive: true });

const ff = (a) => execFileSync(ffmpeg, ["-v", "error", "-y", ...a], { stdio: ["ignore", "pipe", "pipe"] });
/** `ffmpeg -i x` with no output always exits non-zero and prints what it
 *  found to stderr, so the useful answer arrives as a thrown error. */
const probe = (file) => {
  try {
    return execFileSync(ffmpeg, ["-i", file], { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
  } catch (e) {
    return String(e.stderr ?? "");
  }
};

/** The newest recording folder per flow name. */
function newestPerFlow() {
  const dirs = fs
    .readdirSync(SRC, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}$/.test(d.name))
    .map((d) => ({ dir: path.join(SRC, d.name), flow: d.name.replace(/-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}$/, ""), stamp: d.name.slice(-16) }))
    .filter((d) => fs.existsSync(path.join(d.dir, "chapters.json")));
  const best = new Map();
  for (const d of dirs) if (!best.has(d.flow) || best.get(d.flow).stamp < d.stamp) best.set(d.flow, d);
  return [...best.values()].sort((a, b) => a.flow.localeCompare(b.flow));
}

const clock = (sec) => {
  const s = Math.max(0, sec);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(Math.floor(s % 60)).padStart(2, "0");
  const ms = String(Math.round((s % 1) * 1000)).padStart(3, "0");
  return `${h}:${m}:${ss}.${ms}`;
};

/** Seconds of blank at the head of a file, measured. A blank frame is a FLAT
 *  one, so the first frame whose luma has any spread is the first frame with
 *  something on it. `metadata=print:file=-` writes to stdout, one
 *  "frame:N ... pts_time:T" header per frame followed by its keys. */
function headBlank(src) {
  let out = "";
  try {
    out = execFileSync(ffmpeg, ["-v", "error", "-t", "4", "-i", src, "-vf", "signalstats,metadata=print:file=-", "-f", "null", "-"],
      { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
  } catch (e) { out = String(e.stdout ?? "") || String(e.stderr ?? ""); }
  const re = /pts_time:([\d.]+)[\s\S]*?YMIN=(\d+)[\s\S]*?YMAX=(\d+)/g;
  const frames = [];
  let m;
  while ((m = re.exec(out))) frames.push({ t: Number(m[1]), spread: Number(m[3]) - Number(m[2]) });
  if (!frames.length) return 0;
  const first = frames.find((f) => f.spread > 40);
  if (!first || first.t < 0.05) return 0;
  // Land TWO FRAMES INSIDE the content, not exactly on its first frame: the
  // overview's blank ran to 3.07s, the old 3s cap trimmed to 3.00, and the
  // published file still opened on white. Six seconds of headroom, because a
  // cold dev server compiling /meta/capture is what produces these and it can
  // take that long. Nothing in this set opens on a genuinely flat card, so
  // there is nothing here to protect.
  return Math.min(6, first.t + 0.07);
}

const THUMB_EVERY = 2; // seconds
const THUMB_W = 240;
const SPRITE_COLS = 5;

const published = [];

for (const rec of newestPerFlow()) {
  if (args.only && args.only !== rec.flow) continue;
  const slug = rec.flow;
  const master = path.join(rec.dir, `${slug}.mp4`);
  if (!fs.existsSync(master)) { console.log(`skip ${slug}: no mp4`); continue; }
  const meta = JSON.parse(fs.readFileSync(path.join(rec.dir, "chapters.json"), "utf8"));
  console.log(`\n${slug}  ${meta.duration.toFixed(1)}s  ${meta.chapters.length} sections`);

  // 1. the web copy, with any blank head taken off. The recorder trims what
  //    it can measure, but a slow first paint can still leave a beat of white
  //    at the front, and it is the first thing anyone sees.
  const blank = headBlank(master);
  const duration = meta.duration - blank;
  if (blank) console.log(`  trimming ${blank.toFixed(2)}s of blank from the head`);
  ff([...(blank ? ["-ss", String(blank)] : []), "-i", master, "-vf", "scale=1280:-2", "-c:v", "libx264",
      "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p", "-r", "30", "-movflags", "+faststart", "-an",
      path.join(OUT, `${slug}.mp4`)]);

  // 2. the subtitle track, shifted by whatever came off the front so it stays
  //    on the frame it describes.
  const rawVtt = fs.readFileSync(path.join(rec.dir, "captions.vtt"), "utf8");
  const shifted = blank
    ? rawVtt.replace(/(\d\d):(\d\d):(\d\d)\.(\d\d\d)/g, (_, h, m2, sec, ms) =>
        clock(Number(h) * 3600 + Number(m2) * 60 + Number(sec) + Number(ms) / 1000 - blank))
    : rawVtt;
  fs.writeFileSync(path.join(OUT, `${slug}.vtt`), shifted);

  // 3. the grid poster: the first section's card, a beat in
  ff(["-ss", String(Math.min(2, duration / 2) + blank), "-i", master, "-frames:v", "1",
      "-vf", `scale=${THUMB_W * 3}:-2`, "-q:v", "4", path.join(OUT, `${slug}.poster.jpg`)]);

  // 4. one still per section, named by the section's own id
  const chapters = meta.chapters.map((c) => {
    // A beat past the cut so the card has landed, but inside the section.
    const at = Math.min(c.t + 1.2, Math.max(c.t, c.end - 0.4));
    ff(["-ss", String(at), "-i", master, "-frames:v", "1", "-vf", `scale=${THUMB_W * 2}:-2`, "-q:v", "4",
        path.join(THUMBS, `${c.id}.jpg`)]);
    // The stills come off the untrimmed master, so they use the original
    // times; the published times move with the trim.
    return { ...c, t: Math.max(0, c.t - blank), end: Math.max(0, c.end - blank), thumb: `/videos/thumbs/${c.id}.jpg` };
  });

  // 5. the scrub-bar sprite: a still every 2s, tiled, plus the VTT that says
  //    which tile belongs to which second.
  const count = Math.max(1, Math.ceil(duration / THUMB_EVERY));
  const rows = Math.ceil(count / SPRITE_COLS);
  ff([...(blank ? ["-ss", String(blank)] : []), "-i", master, "-vf", `fps=1/${THUMB_EVERY},scale=${THUMB_W}:-2,tile=${SPRITE_COLS}x${rows}`,
      "-frames:v", "1", "-q:v", "5", path.join(OUT, `${slug}.sprite.jpg`)]);
  // Every tile is the same size, and ffmpeg keeps the source aspect, so read
  // one tile's height off the sheet rather than assuming 16:9.
  const sheet = probe(path.join(OUT, `${slug}.sprite.jpg`));
  const dim = /, (\d+)x(\d+)/.exec(sheet) ?? [];
  const tileW = Math.round(Number(dim[1] ?? THUMB_W * SPRITE_COLS) / SPRITE_COLS);
  const tileH = Math.round(Number(dim[2] ?? 0) / rows);
  const cues = [];
  for (let i = 0; i < count; i += 1) {
    const from = i * THUMB_EVERY;
    const to = Math.min(duration, from + THUMB_EVERY);
    const x = (i % SPRITE_COLS) * tileW;
    const y = Math.floor(i / SPRITE_COLS) * tileH;
    cues.push(`${clock(from)} --> ${clock(to)}\n/videos/${slug}.sprite.jpg#xywh=${x},${y},${tileW},${tileH}\n`);
  }
  fs.writeFileSync(path.join(OUT, `${slug}.thumbs.vtt`), `WEBVTT\n\n${cues.join("\n")}`);

  // 6. the transcript, parsed back out of the subtitle track so the page can
  //    render it without shipping a VTT parser.
  const transcript = [...shifted.matchAll(/(\d\d):(\d\d):(\d\d)\.(\d\d\d) --> (\d\d):(\d\d):(\d\d)\.(\d\d\d)\n(.+)/g)].map((m) => ({
    t: Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]) / 1000,
    end: Number(m[5]) * 3600 + Number(m[6]) * 60 + Number(m[7]) + Number(m[8]) / 1000,
    text: m[9].trim(),
  }));

  published.push({ slug, duration, chapters, transcript, tileW, tileH });
  console.log(`  mp4 ${(fs.statSync(path.join(OUT, `${slug}.mp4`)).size / 1e6).toFixed(1)} MB, ${chapters.length} section stills, ${count} scrub thumbs`);
}

// ── the manifest ──────────────────────────────────────────────────────
const existing = path.join(APP, "lib/videos.generated.ts");
const prev = fs.existsSync(existing) ? fs.readFileSync(existing, "utf8") : "";
// Keep any flow we did not publish this run, so `--only=<flow>` refreshes one
// video without dropping the rest of the manifest. The array is written by
// JSON.stringify, so it parses as-is: the re-quoting this used to do turned
// `"slug":` into `""slug"":` and the catch silently returned nothing.
const keep = (() => {
  const m = /export const RECORDED: RecordedVideo\[\] = (\[[\s\S]*\]);\n$/.exec(prev.trimEnd() + "\n");
  if (!m) return [];
  try { return JSON.parse(m[1]); } catch (e) { console.log(`  (could not read the previous manifest: ${e.message})`); return []; }
})();
const bySlug = new Map(keep.map((v) => [v.slug, v]));
for (const v of published) bySlug.set(v.slug, v);

const body = JSON.stringify([...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug)), null, 2);
fs.writeFileSync(
  existing,
  `// GENERATED by scripts/publish-videos.mjs. Do not edit.
// The recorded facts about each video: how long it is, where its sections
// start and end, and every subtitle cue with its timing. The editorial parts
// (title, description, tags, order) live in lib/videos.ts and are keyed by
// slug, so re-publishing a recording never overwrites the writing.

export interface RecordedChapter {
  /** Stable, and also the thumbnail's filename: <flow>--<nn>-<card>. */
  id: string;
  card: string;
  title: string;
  description: string;
  t: number;
  end: number;
  thumb: string;
}

export interface RecordedCue { t: number; end: number; text: string }

export interface RecordedVideo {
  slug: string;
  duration: number;
  chapters: RecordedChapter[];
  transcript: RecordedCue[];
  /** One scrub-preview tile's size on the sprite sheet. */
  tileW: number;
  tileH: number;
}

export const RECORDED: RecordedVideo[] = ${body};
`,
);
console.log(`\nlib/videos.generated.ts: ${bySlug.size} video(s)`);
