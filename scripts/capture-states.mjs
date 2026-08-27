// capture-states.mjs — 1280x900 @2x stills of INTERACTION STATES, not just
// screens. capture-screens.mjs renders a screen as it first loads; the RM
// work is mostly in states that only exist after a click (a reply panel, a
// failure alert, a wizard step, a drawer). Those are the frames the API team
// needs to see, so this drives each screen into a named state and shoots it.
//
//   node scripts/capture-states.mjs [--out=<dir>] [--only=<substring>]
//
// Renders through the /e/ embed with ?w=1280, so the sandbox iframe is the
// thing being driven. Each state is independent: a broken selector fails
// that ONE frame and the run carries on, because a 20-state run that dies
// on state 3 is worse than one with a gap.
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

// Same resolution trick capture-screens.mjs uses: playwright is a devdep of
// apps/mcp-server, not of the repo root, so a bare import fails when this is
// run from the root the way the sibling script is.
const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, "..");
const require = createRequire(path.join(REPO, "apps/mcp-server/package.json"));
const { chromium } = require("playwright");

// Tag PNGs 144 DPI so Figma places them as crisp 2x assets rather than
// oversized and soft. Lifted from capture-screens.mjs, same reasoning.
import zlib from "node:zlib";
function setPngRetinaDpi(file) {
  const ppm = Math.round(144 / 0.0254);
  const data = Buffer.alloc(9);
  data.writeUInt32BE(ppm, 0); data.writeUInt32BE(ppm, 4); data.writeUInt8(1, 8);
  const type = Buffer.from("pHYs");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32 ? zlib.crc32(Buffer.concat([type, data])) >>> 0 : 0, 0);
  const len = Buffer.alloc(4); len.writeUInt32BE(9, 0);
  const phys = Buffer.concat([len, type, data, crc]);
  const buf = fs.readFileSync(file);
  const sig = buf.subarray(0, 8);
  let off = 8; const chunks = [];
  while (off < buf.length) {
    const l = buf.readUInt32BE(off);
    const t = buf.toString("ascii", off + 4, off + 8);
    const chunk = buf.subarray(off, off + 12 + l);
    if (t !== "pHYs") chunks.push(chunk);
    off += 12 + l;
  }
  fs.writeFileSync(file, Buffer.concat([sig, chunks[0], phys, ...chunks.slice(1)]));
}

const arg = (k, d) => {
  const m = process.argv.find((a) => a.startsWith(`--${k}=`));
  return m ? m.slice(k.length + 3) : d;
};
const BASE = arg("base", "http://localhost:3000");
const ONLY = arg("only", null);
// --section=inbox|insights|templates|widgets|getreviews (repeatable, comma
// separated). Sections are the unit Ali thinks in, and the unit a demo video
// is cut in, so the suite runs one section at a time by default rather than
// one giant pass.
const SECTIONS = (arg("section", null) || "").split(",").map((x) => x.trim()).filter(Boolean);
// --video records a WEBM per section: the same states, driven in ONE page
// session so the section plays as a continuous flow rather than a slideshow.
const VIDEO = process.argv.includes("--video");
// --full also writes a full-PAGE capture per state, so a long screen is
// available at its natural height as well as cropped to 1280x900. Figma
// takes both: the fixed frame for a board, the tall one for reading.
const FULL = process.argv.includes("--full");
const OUT = arg("out", path.join(process.env.HOME, "Desktop", "brightlocal-screens"));
const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15).replace(/(\d{8})(\d{6})/, "$1-$2");
const DIR = path.join(OUT, `states-${stamp}`);
fs.mkdirSync(DIR, { recursive: true });

// Share tokens for the four RM screens plus Reply Templates.
const SCREENS = {
  inbox: "a616bfc5-1806-4af8-9a9a-74b6a9173fbf",
  insights: "38f64dc2-383c-42d1-83b6-456bf254a4b1",
  templates: "55dd020f-d660-48bd-9d2c-1d2542a8b19f",
  widgets: "0609abbe-f208-4d91-858e-e5335f8cecbe",
  getreviews: "782021bd-1332-48b8-a22b-5316b520fc20",
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Radix and vaul listen for a real pointer sequence; a bare .click() is
// swallowed by tabs, tooltips and drawer triggers (learned the hard way,
// 27 Aug). Every interaction goes through this.
const PRESS = `(el) => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  const o = { bubbles:true, cancelable:true, composed:true, pointerType:'mouse',
              isPrimary:true, clientX:r.left+r.width/2, clientY:r.top+r.height/2, button:0 };
  el.dispatchEvent(new PointerEvent('pointerdown', o));
  el.dispatchEvent(new MouseEvent('mousedown', o));
  el.dispatchEvent(new PointerEvent('pointerup', o));
  el.dispatchEvent(new MouseEvent('mouseup', o));
  el.dispatchEvent(new MouseEvent('click', o));
  return true;
}`;

// Run code inside the SANDBOX document. The embed nests the screen in an
// iframe, so page-level selectors never see it.
async function inFrame(page, fn, ...args) {
  const frame = page.frames().find((f) => f !== page.mainFrame() && f.url().includes("sandbox"))
    || page.frames().find((f) => f !== page.mainFrame());
  if (!frame) throw new Error("sandbox frame not found");
  return frame.evaluate(fn, ...args);
}

const press = (page, selector) =>
  inFrame(page, ({ sel, src }) => {
    const el = document.querySelector(sel);
    return el ? eval(src)(el) : false;
  }, { sel: selector, src: PRESS });

const pressText = (page, text, tag = "button") =>
  inFrame(page, ({ text, tag, src }) => {
    const el = [...document.querySelectorAll(tag)].find((b) => b.textContent.trim() === text);
    return el ? eval(src)(el) : false;
  }, { text, tag, src: PRESS });

const openRow = (page, index) =>
  inFrame(page, ({ i, src }) => {
    const rows = [...document.querySelectorAll("tbody tr")];
    const cell = rows[i] && rows[i].querySelector("td div");
    return cell ? eval(src)(cell) : false;
  }, { i: index, src: PRESS });

const typeDraft = (page, text) =>
  inFrame(page, (t) => {
    const ta = document.querySelector('[role="dialog"] textarea');
    if (!ta) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
    setter.call(ta, t);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }, text);

// Open a review, type a draft, press Send. `settle` shorter than the
// screen's ~900ms simulated latency captures the PENDING state instead.
async function sendOn(page, row, settle = 1800) {
  await openRow(page, row);
  await wait(700);
  await typeDraft(page, "Thanks very much for this.");
  await wait(300);
  await press(page, '[data-hook^="send-"]:not([data-hook^="send-failed"])');
  await wait(settle);
}

// Scroll the SANDBOX document, not the host page. The screen lives in an
// iframe, so window.scrollTo on the outer page moves nothing.
// Scroll the element that ACTUALLY scrolls. The shell puts the page in its
// own overflow container, so document.scrollingElement.scrollTop moves
// nothing and the "scrolled" frame came out byte-identical to the top of
// the page (27 Aug). Find the deepest element with real overflow instead.
async function scrollTo(page, y) {
  const scrolled = await inFrame(page, (top) => {
    let best = null;
    let most = 0;
    for (const el of document.querySelectorAll("*")) {
      const over = el.scrollHeight - el.clientHeight;
      if (over > most && el.clientHeight > 300) { best = el; most = over; }
    }
    const target = best || document.scrollingElement || document.documentElement;
    target.scrollTop = top;
    window.scrollTo(0, top);
    return { moved: target.scrollTop, max: most };
  }, y);
  await wait(1200);
  return scrolled;
}

async function hover(page, selector) {
  await inFrame(page, (sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const o = { bubbles: true, cancelable: true, pointerType: "mouse",
                clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
    el.dispatchEvent(new PointerEvent("pointerenter", o));
    el.dispatchEvent(new PointerEvent("pointerover", o));
    el.dispatchEvent(new PointerEvent("pointermove", o));
    return true;
  }, selector);
  await wait(900);
}

// ── the states ────────────────────────────────────────────────────────
const expectDrawer = `!!document.querySelector('[role="dialog"]')`;
const expectFailure = (frag) =>
  `(() => { const d = document.querySelector('[role="dialog"]');
     return !!d && /${frag}/.test(d.innerText); })()`;

const STATES = [
  // ── Review Inbox ────────────────────────────────────────────────────
  // ROW INDICES ARE NOT ARBITRARY and must not be guessed. The five
  // failure codes are pinned to the first five reviews that are both
  // repliable and still needing action, DERIVED in the screen from
  // SEED_REVIEWS. That lands them on rows 0, 2, 4, 8, 10 — not 0..4 —
  // because TripAdvisor rows and already-replied rows fall in between.
  // Guessing 6 and 8 drove two of these into reviews with no simulated
  // failure, so the send SUCCEEDED, the drawer closed, and the run
  // captured a plain list that looked almost right (27 Aug). Every one
  // of these now asserts on the failure copy before the shutter fires.
  ["inbox-01-list", "inbox", async () => {},
    null,
    "The inbox at rest. One status badge per row: status is the state the review is in, never the delivery outcome."],
  ["inbox-02-reply-panel", "inbox", async (p) => { await openRow(p, 3); }, expectDrawer,
    "Reply panel for a repliable review. AI draft and template picker above the composer, Skip and Send in the footer."],
  ["inbox-03-readonly-source", "inbox", async (p) => { await openRow(p, 1); },
    expectFailure("cannot be sent from here"),
    "TripAdvisor cannot be replied to from here. No composer, no AI, no template picker, and no footer at all."],
  ["inbox-04-fail-disconnected", "inbox", async (p) => { await sendOn(p, 0); },
    expectFailure("connection has expired"),
    "BLOCKING failure. The connection expired, so the composer is hidden: a reply box you cannot submit is furniture that invites wasted typing."],
  ["inbox-05-fail-rate-limited", "inbox", async (p) => { await sendOn(p, 2); },
    expectFailure("limiting replies"),
    "RECOVERABLE failure. The composer stays and the draft is preserved, because waiting a few minutes genuinely fixes this one."],
  ["inbox-06-fail-unknown", "inbox", async (p) => { await sendOn(p, 4); },
    expectFailure("rejected this reply"),
    "RECOVERABLE failure. Even the generic case says what to do next; never a bare 'something went wrong'."],
  ["inbox-07-fail-deleted-terminal", "inbox", async (p) => { await sendOn(p, 8); },
    expectFailure("no longer on"),
    "TERMINAL failure. The review is gone, so the action is Skip reply, not Retry, and Send is disabled. A retry that 'worked' would be a lie."],
  ["inbox-08-fail-permission-seeded", "inbox", async (p) => { await openRow(p, 10); },
    expectFailure("cannot reply to"),
    "Arrives already failed on load, so the state is visible without sending anything. Blocking, because the fix is outside this screen."],
  // TRANSIENT. The pending beat lasts ~900ms, and the normal 1400ms
  // post-drive settle plus a polling assertion outlived it, so this came
  // out byte-identical to the resolved failure frame. Shot immediately,
  // with a single-shot check rather than a poll.
  ["inbox-09-sending", "inbox", async (p) => { await sendOn(p, 0, 250); },
    `!!document.querySelector('[role="dialog"] button[disabled]')`,
    "The pending beat. Send shows a spinner and both footer buttons are disabled so a second click cannot land."],

  // ── Review Insights ─────────────────────────────────────────────────
  ["insights-01-charts", "insights", async () => {},
    `!!document.querySelector('[data-hook="sources-donut"]')`,
    "Sources donut grouped to five slices max, which is the number of chart tokens the DS defines. Legend carries every source at full count."],
  ["insights-02-other-tooltip", "insights", async (p) => { await hover(p, '[data-hook="sources-other-row"]'); },
    `!!document.querySelector('[data-hook="sources-other-tooltip"], [role="tooltip"]')`,
    "Hovering Other reveals what is inside it. The grouping tidies the graphic, it does not hide data."],

  // Targeted by aria-label, NOT by data-hook. A ToggleGroupItem inside
  // TooltipTrigger asChild loses its data-hook on the way to the DOM (the
  // DS finding already logged as 3.2 in the RM report), so the hook the
  // source sets never exists to click. The accessible name survives.
  ["insights-03-table-view", "insights",
    async (p) => { await press(p, '[data-hook="perf-view-toggle"] [aria-label="Table view"]'); },
    `!!document.querySelector('[data-hook="sources-table"]')`,
    "The same Review Performance data as a table. Every source at full count, including the ones the donut groups."],
  ["insights-04-timeline-table", "insights", async (p) => {
    await scrollTo(p, 900);
    await press(p, '[data-hook="time-view-toggle"] [aria-label="Table view"]');
  }, `!!document.querySelector('[data-hook="review-timeline"] table')`,
    "Timeline as a table, scrolled to it. The chart and table toggles are per card, not per page."],
  ["insights-05-scrolled", "insights", async (p) => { await scrollTo(p, 1400); }, null,
    "Scrolled down the Insights page: the timeline chart and what sits under it."],

  // ── Reply Templates ─────────────────────────────────────────────────
  ["templates-01-list", "templates", async () => {},
    null,
    "Templates and auto-reply rules on one page, split out of the inbox because the two are intertwined."],
  ["templates-02-template-drawer", "templates", async (p) => { await press(p, '[data-hook^="edit-tpl-"]'); },
    `!!document.querySelector('[data-hook="template-drawer"][data-state="open"]')`,
    "Editing a template. Rating scope decides which reviews it is offered for, and the tokens insert at the cursor."],
  ["templates-03-rule-drawer", "templates", async (p) => { await press(p, '[data-hook="new-rule"]'); },
    `!!document.querySelector('[data-hook="rule-drawer"][data-state="open"]')`,
    "New auto-reply rule. Ratings offer stars only, because auto-reply is Google-only and Google does not do recommendations."],
  ["templates-04-delete-blocked", "templates", async (p) => { await press(p, '[data-hook^="del-tpl-"]'); },
    `!!document.querySelector('[data-hook="delete-template-inuse"]')`,
    "A template a rule depends on CANNOT be deleted. The dialog names the rule and says what to do first."],
  // By slot, not by data-hook: a Button inside CollapsibleTrigger asChild
  // loses its hook the same way the tooltip and toggle ones do. Third
  // instance of DS finding 3.2, and the reason this frame came out
  // byte-identical to the plain list.
  ["templates-05-rule-activity", "templates",
    async (p) => { await press(p, '[data-slot="collapsible-trigger"]'); },
    `!!document.querySelector('[data-slot="collapsible-trigger"][aria-expanded="true"]')`,
    null,
    "Per-rule run history, including a failed send, so auto-reply failures have somewhere to live."],

  // ── Review Widgets ──────────────────────────────────────────────────
  ["widgets-01-list", "widgets", async () => {},
    null,
    "Widget dashboard. Yelp is excluded from widgets, stated once on the page rather than in every filter menu."],
  ["widgets-02-wizard-type", "widgets", async (p) => { await press(p, '[data-hook="new-widget"]'); },
    null,
    "Step one asks hand-picked or live feed first, because that choice changes every later step."],
  ["widgets-03-wizard-filters", "widgets", async (p) => {
    await press(p, '[data-hook="new-widget"]'); await wait(800);
    await pressText(p, "Live feed", "*"); await wait(500); await pressText(p, "Next");
  }, null,
    "Live feed filters. New matching reviews are added automatically; individual ones can still be excluded by hand."],
  ["widgets-04-wizard-format", "widgets", async (p) => {
    await press(p, '[data-hook="new-widget"]'); await wait(800);
    await pressText(p, "Live feed", "*"); await wait(500); await pressText(p, "Next"); await wait(700);
    await pressText(p, "Next");
  }, null,
    "List, carousel or JSON feed. These three are the only widget types either source document evidences."],
  ["widgets-05-detail-embed", "widgets", async (p) => { await pressText(p, "View"); },
    `!!document.querySelector('[data-hook="widget-detail-drawer"][data-state="open"]')`,
    "The embed snippet with copy-to-clipboard. Opens automatically after saving, so the code is one step away, not two."],

  // ── Get Reviews ─────────────────────────────────────────────────────
  ["getreviews-01-hub", "getreviews", async () => {},
    null,
    "Campaign list with live, draft and stopped states."],
  ["getreviews-02-campaign-summary", "getreviews", async (p) => { await pressText(p, "View insights"); },
    `!!document.querySelector('[data-hook="campaign-drawer"][data-state="open"]')`,
    "Campaign detail as a wide drawer over the hub. The five campaign actions sit in the drawer footer."],
  ["getreviews-03-campaign-feedback", "getreviews", async (p) => {
    await pressText(p, "View insights"); await wait(1400);
    await press(p, '[data-hook="campaign-tab-feedback"]');
  }, `(() => { const el = document.querySelector('[data-hook="campaign-feedback-panel"]');
        return !!el && el.getAttribute("data-state") === "active"; })()`,
    "Private feedback as a TAB, not a nested page. That is what removed the second level of back links."],
  ["getreviews-04-wizard", "getreviews", async (p) => { await pressText(p, "New campaign"); },
    null,
    "Campaign wizard. Cancel is a plain button with no arrow, because cancelling is an action, not a move up the hierarchy."],
];

// --dump-states prints name/section/note as JSON and exits. Anything that
// needs the catalogue (the Figma board builder, a caption track) reads it
// from here rather than re-parsing this file, which is how the notes got
// confused with selector fragments the first time.
if (process.argv.includes("--dump-states")) {
  console.log(JSON.stringify(
    STATES.map(([name, screen, , , note]) => ({ name, section: name.split("-")[0], screen, note: note ?? null })),
    null, 1,
  ));
  process.exit(0);
}

const browser = await chromium.launch({ headless: true });
const results = [];

const wanted = STATES.filter(([name]) => {
  if (ONLY && !name.includes(ONLY)) return false;
  if (SECTIONS.length && !SECTIONS.some((sec) => name.startsWith(sec))) return false;
  return true;
});

// ── video mode ────────────────────────────────────────────────────────
// One context per section with recordVideo on, driving that section's
// states back to back. Playwright writes the file on context.close(), so
// each section closes before the next opens.
if (VIDEO) {
  const bySection = new Map();
  for (const st of wanted) {
    const sec = st[0].split("-")[0];
    if (!bySection.has(sec)) bySection.set(sec, []);
    bySection.get(sec).push(st);
  }
  for (const [sec, states] of bySection) {
    const dir = path.join(DIR, "video", sec);
    fs.mkdirSync(dir, { recursive: true });
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      recordVideo: { dir, size: { width: 1280, height: 900 } },
    });
    const vp = await ctx.newPage();
    try {
      await vp.goto(`${BASE}/e/${SCREENS[states[0][1]]}?w=1280`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await vp.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {});
      await wait(7000);
      for (const [name, , drive] of states) {
        try { await drive(vp); } catch (e) { console.log(`    (skipped ${name} in video: ${String(e).slice(0, 60)})`); }
        // Hold each state long enough to read before moving on.
        await wait(2600);
        // Return to a known base so the next state drives from the top.
        await vp.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
        await wait(6000);
      }
      console.log(`  🎬 ${sec} video`);
    } catch (e) {
      console.log(`  ✗ ${sec} video — ${String(e).slice(0, 100)}`);
    }
    await ctx.close();
  }
  console.log(`\nvideos in ${path.join(DIR, "video")}`);
  await browser.close();
  process.exit(0);
}

const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });

for (const [name, screen, drive, expect] of wanted) {
  try {
    await page.goto(`${BASE}/e/${SCREENS[screen]}?w=1280&motion=off`, {
      waitUntil: "domcontentloaded", timeout: 60000,
    });
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {});
    // The sandbox compiles the screen after boot; a fixed settle is more
    // reliable here than waiting on a selector that differs per screen.
    await wait(7000);
    await drive(page);
    const transient = name.endsWith("-sending");
    if (!transient) await wait(1400);
    if (expect) {
      // POLL, do not check once. Recharts and the drawers mount
      // asynchronously, so a single check a fixed delay after driving
      // reports a false failure on a frame that is actually fine (the
      // sources donut did exactly this, 27 Aug). Retry until the deadline,
      // then fail for real.
      let ok = false;
      const tries = transient ? 1 : 12;
      for (let i = 0; i < tries && !ok; i += 1) {
        ok = await inFrame(page, (src) => {
          try { return !!eval(src); } catch { return false; }
        }, expect).catch(() => false);
        if (!ok) await wait(500);
      }
      if (!ok) throw new Error("EXPECT FAILED: " + expect.slice(0, 70));
    }
    await page.evaluate(() => document.querySelectorAll("nextjs-portal").forEach((n) => n.remove())).catch(() => {});
    const file = path.join(DIR, `${name}.png`);
    await page.screenshot({ path: file, type: "png" });
    try { setPngRetinaDpi(file); } catch {}
    if (FULL) {
      const fullDir = path.join(DIR, "full");
      fs.mkdirSync(fullDir, { recursive: true });
      const ffile = path.join(fullDir, `${name}.png`);
      await page.screenshot({ path: ffile, type: "png", fullPage: true });
      try { setPngRetinaDpi(ffile); } catch {}
    }
    results.push({ name, ok: true });
    console.log(`  ✓ ${name}`);
  } catch (e) {
    results.push({ name, ok: false, error: String(e).slice(0, 120) });
    console.log(`  ✗ ${name} — ${String(e).slice(0, 120)}`);
  }
}

fs.writeFileSync(path.join(DIR, "manifest.json"), JSON.stringify({ dir: DIR, results }, null, 2));

// ONE markdown per section, generated from the note that sits beside each
// state definition. Notes live WITH the step that produces the frame, so a
// renamed or deleted state cannot leave an orphaned note behind, and the
// caption is written once rather than once per surface it appears on.
const notesBySection = new Map();
for (const [name, screen, , , note] of wanted) {
  if (!note) continue;
  const sec = name.split("-")[0];
  if (!notesBySection.has(sec)) notesBySection.set(sec, []);
  notesBySection.get(sec).push({ name, note });
}
for (const [sec, rows] of notesBySection) {
  const md = [`# ${sec} — captured states`, "",
    "Generated by `scripts/capture-states.mjs`. Edit the note beside the state",
    "definition in that file, not this file, or the two will drift.", ""];
  for (const r of rows) md.push(`### ${r.name}`, "", r.note, "");
  fs.writeFileSync(path.join(DIR, `${sec}-NOTES.md`), md.join("\n"));
}
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} states captured`);
console.log(DIR);
await browser.close();
