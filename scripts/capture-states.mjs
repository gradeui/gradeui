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
// --app (17 Sep 2026): shoot the BrightLocal APP (apps/brightlocal on
// localhost:3020) instead of the Studio /e/ embeds. The app is the Studio
// source plus scripts/promotion-patches.json, and most of the RM work now
// lands only there, so a Studio run shows stale screens. Same state list,
// same folder shape; the page is driven directly (no sandbox iframe), on the
// Engaged persona with insights off, which is what the Studio screens show.
const APP = process.argv.includes("--app");
const APP_BASE = arg("app-base", "http://localhost:3020");
const APP_LOCATION = arg("location", "minus-one-studios");
const APP_ROUTES = {
  reviewshub: "/reviews",
  manager: "/reviews/manager",
  insights: "/reviews/tracker",
  templates: "/reviews/manager/templates",
  widgets: "/reviews/showcase",
  getreviews: "/reviews/builder",
  settings: "/reviews/tracker/settings",
};
const APP_SETTINGS = {
  personaId: arg("persona", "engaged"),
  look: "authored",
  variants: {},
  engine: arg("engine", "native-fixed"),
  upsell: true,
  fixItForMe: true,
  beaconTone: "neutral",
  appearance: "light",
  insights: false,
};
// --only is a comma-separated list of SUBSTRINGS, any of which selects a
// state. A single name is the common case ("--only=inbox-04"); a list is
// what you want after a run to re-shoot just the frames that failed.
const ONLY = (arg("only", null) || "").split(",").map((x) => x.trim()).filter(Boolean);
// --section=reviewshub|manager|insights|templates|widgets|getreviews|settings (repeatable, comma
// separated). Sections are the unit Ali thinks in, and the unit a demo video
// is cut in, so the suite runs one section at a time by default rather than
// one giant pass.
const SECTIONS = (arg("section", null) || "").split(",").map((x) => x.trim()).filter(Boolean);
// NO VIDEO MODE HERE. scripts/record-flow-lossless.mjs is the recorder,
// driven by the flow JSON in scripts/flows/. See RM-VIDEO-SPEC.md. Two
// recorders with different step formats is worse than one.
// --full also writes a full-PAGE capture per state, so a long screen is
// available at its natural height as well as cropped to 1280x900. Figma
// takes both: the fixed frame for a board, the tall one for reading.
const FULL = process.argv.includes("--full");
// A ceiling on the tall captures. 12000 CSS px is 24000 device px at 2x,
// which Figma still imports; beyond that the file is unreadable as a page
// anyway and something has gone wrong with the measurement.
const MAX_FULL_HEIGHT = 12000;
// --by-page nests each section in a folder named after the FIGMA PAGE it
// belongs to, so a whole folder can be dragged onto the matching page and
// there is nothing to line up by hand. The flat layout stays the default,
// because the manifest and every downstream script index by bare state id.
// Ali, 28 Aug: "put each page that is in figma in a new folder then i cant
// get it wrong" — inbox-04 had gone missing from three consecutive drags out
// of one 36-file folder.
const BY_PAGE = process.argv.includes("--by-page");
// Section prefix -> Figma page name, VERBATIM. If a page is renamed in Figma,
// rename it here too: a folder that does not match a page is the one thing
// this flag exists to prevent.
// The SECTION KEYS are slugs, not labels: they name the walker and prefix
// every state file, so they survived the 6 Sep rename untouched. Only the
// Figma page names moved. Do not "tidy" inbox → manager here without
// renaming 79 files, every StateCard and every flow JSON with it.
const FIGMA_PAGE = {
  reviewshub: "Brightlocal - Review Hub",
  manager: "Brightlocal - Review Manager",
  insights: "Brightlocal - Review Tracker",
  widgets: "Brightlocal - Review Showcase",
  getreviews: "Brightlocal - Review Builder",
  templates: "Brightlocal - Review Manager - Reply Templates",
  settings: "Brightlocal - Report Settings",
};
const sectionOf = (name) => name.split("-")[0];
const dirFor = (name) => {
  if (!BY_PAGE) return DIR;
  const page = FIGMA_PAGE[sectionOf(name)];
  if (!page) throw new Error(`no Figma page mapped for section "${sectionOf(name)}" (state ${name})`);
  const d = path.join(DIR, page);
  fs.mkdirSync(d, { recursive: true });
  return d;
};
const OUT = arg("out", path.join(process.env.HOME, "Desktop", "brightlocal-screens"));
const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14).replace(/(\d{8})(\d{6})/, "$1-$2");
const DIR = path.join(OUT, `${APP ? "app-states" : "states"}-${stamp}`);
fs.mkdirSync(DIR, { recursive: true });

// Share tokens for the RM screens plus Reply Templates. widgets and
// getreviews resolve to the RAIL designs (dmt094lhmpwbs and dmt094j963aye),
// checked against share_links on 7 Sep 2026. The createwidget token went
// with its section: that screen is archived.
const SCREENS = {
  reviewshub: "dee5a983-be48-4f86-8c8f-e46f16b435dd",
  manager: "a616bfc5-1806-4af8-9a9a-74b6a9173fbf",
  insights: "38f64dc2-383c-42d1-83b6-456bf254a4b1",
  templates: "55dd020f-d660-48bd-9d2c-1d2542a8b19f",
  widgets: "0609abbe-f208-4d91-858e-e5335f8cecbe",
  getreviews: "782021bd-1332-48b8-a22b-5316b520fc20",
  // RM — Report Settings (dmtkj124xagqa), new 2 Sep. The configuration
  // surface behind Review Tracker' Settings button, which was a dead
  // control until it had somewhere to go. Minted with
  // apps/mcp-server/scripts/make-share.mts, which is now the way to get a
  // token for any screen added to this suite.
  settings: "49a8ae62-91bf-49a9-a008-f3bd26d34cde",
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
  // POINTER MOVE FIRST. Radix menu and select items only commit on
  // pointerup if the pointer has ENTERED them: SelectItem's onPointerMove
  // is what marks the item highlighted, and onPointerUp then selects the
  // highlighted one. Without these two events the whole sequence below
  // lands on the item and nothing happens — the menu just stays open,
  // which is exactly how settings-03 failed (2 Sep). Harmless on every
  // other target, so it lives in the shared helper rather than in one
  // state's setup.
  el.dispatchEvent(new PointerEvent('pointerover', o));
  el.dispatchEvent(new PointerEvent('pointermove', o));
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
  // In --app mode the screen IS the page.
  if (APP) return page.evaluate(fn, ...args);
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
// Scroll until a given hook is at the top of the scroller. Two settings
// frames came out BYTE-IDENTICAL because they asked for y=2100 and y=3000
// on a page barely 2600 tall, so both landed at the bottom — and both
// passed their assertions, because the assertion only asks whether the
// element EXISTS, not whether it is on screen. Pixel offsets are a guess
// about a page's height; this is not.
// Poll until a hook exists, rather than guessing a delay. A fixed wait is a
// bet on how long a chart takes to mount, and it is a bet that gets lost on
// a cold dev server.
async function waitForHook(page, hook, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const there = await inFrame(page, (sel) => !!document.querySelector(sel), hook);
    if (there) return true;
    await wait(250);
  }
  return false;
}

async function scrollToHook(page, hook, offset = 24) {
  const moved = await inFrame(page, ({ sel, off }) => {
    let best = null, most = 0;
    for (const el of document.querySelectorAll("*")) {
      const over = el.scrollHeight - el.clientHeight;
      if (over > most && el.clientHeight > 300) { best = el; most = over; }
    }
    const target = best || document.scrollingElement || document.documentElement;
    const node = document.querySelector(sel);
    if (!node) return { found: false };
    const top = node.getBoundingClientRect().top - target.getBoundingClientRect().top + target.scrollTop;
    target.scrollTop = Math.max(0, top - off);
    return { found: true, scrollTop: target.scrollTop, max: most };
  }, { sel: hook, off: offset });
  await wait(1000);
  return moved;
}

// Park a card at the top of the frame with the sticky band above it, and
// nothing else (20 Sep).
//
// Every card on a campaign page carries its OWN sticky CardHeader, pinned at
// top: var(--gds-page-header-height). Scroll to a card with room to spare
// above it and the card above is still in frame with its header pinned over
// its own chart, which reads as a chart whose line runs off the top. That is
// what "the NPS timeline runs off the top" was: the Timeline card's header
// sitting on the Timeline card's chart, in a frame that was not about the
// Timeline at all. Nothing is clipped and nothing is broken; the frame was
// showing half of the wrong card.
//
// So put the target's top edge just under the sticky band and let the card
// above leave the frame entirely. The band is MEASURED off the card itself,
// because that is where the sticky rule reads it: the 300 this replaces was
// written for the Studio screen's tall sticky page header, and the app shell
// reports 0px, so on the app 300 was simply a 300px window onto the card
// above.
async function parkCard(page, hook, gap = 16) {
  const moved = await inFrame(page, ({ sel, gap }) => {
    let best = null, most = 0;
    for (const el of document.querySelectorAll("*")) {
      const over = el.scrollHeight - el.clientHeight;
      if (over > most && el.clientHeight > 300) { best = el; most = over; }
    }
    const target = best || document.scrollingElement || document.documentElement;
    const node = document.querySelector(sel);
    if (!node) return { found: false };
    const band = parseFloat(getComputedStyle(node).getPropertyValue("--gds-page-header-height")) || 0;
    const top = node.getBoundingClientRect().top - target.getBoundingClientRect().top + target.scrollTop;
    target.scrollTop = Math.max(0, top - band - gap);
    return { found: true, scrollTop: target.scrollTop, band };
  }, { sel: hook, gap });
  await wait(1000);
  return moved;
}

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

// How much taller than the current viewport the frame would have to be to
// hold everything the screen is currently hiding below its own fold.
//
// GROWING THE VIEWPORT IS THE ONLY THING THAT WORKS. The screen scrolls in
// its own overflow container inside a fixed-height sandbox iframe, so
// `page.screenshot({ fullPage: true })` shoots the HOST and hands back the
// same 1280x900 under a different name. Resizing the viewport to swallow the
// overflow collapses that internal scroll instead, and the whole thing
// renders in one frame.
//
// Returns the OVERFLOW, not an absolute height: a wizard's middle band and a
// sheet's body are inset scrollers, so their scrollHeight is the content
// alone and using it as a viewport height loses the pinned header and footer
// that sit outside them. viewport + overflow is right for both those and for
// a plain page scroller.
async function measureOverflow(page) {
  return inFrame(page, () => {
    let most = 0;
    for (const el of document.querySelectorAll("*")) {
      const over = el.scrollHeight - el.clientHeight;
      if (over > most && el.clientHeight > 300) most = over;
    }
    return most;
  });
}

// Spend ONE AI draft on a row and close the panel. The quota decrements on
// a review's FIRST AI use only, so each quota state needs a different
// number of reviews used up, then a FRESH review opened to read the
// counter: a review that already used AI shows "AI suggestion" instead of
// the remaining count.
async function spendAi(page, row) {
  await openRow(page, row);
  await wait(800);
  await press(page, '[data-hook^="ai-"]');
  await wait(1500); // the generate beat is 900ms
  await press(page, '[data-hook="close-review"]');
  await wait(700);
}

// ── walkers for the two RAIL screens (7 Sep 2026) ──────────────────────
// Review Builder and Review Showcase both replaced their wizards with a
// settings page: a sticky left rail of sections, one card per section, and
// an Edit button that opens the section's controls in a right-hand sheet.
// Every state reloads the embed, so each walker starts from the list.

// Open a campaign's page from the hub, then optionally press one of its
// header actions. The page mounts a chart and a table before the header
// buttons are wired, so the walker waits for `insights-preview` (rendered
// in the same pass as the actions) rather than a fixed delay.
async function campaignPage(page, id, actionHook = null) {
  await press(page, `[data-hook="campaign-${id}-open"]`);
  await waitForHook(page, '[data-hook="insights-preview"]');
  await wait(600);
  if (actionHook) {
    await press(page, `[data-hook="${actionHook}"]`);
    await wait(1000);
  }
}

// Templates page, then the first seeded template ("How likely to
// recommend", t1) in the editor, on a named rail tab. t1 asks for feedback
// first, so its rail carries all five sections including Rating question.
async function templateEditor(page, tab = "general") {
  await press(page, '[data-hook="open-templates"]');
  await waitForHook(page, '[data-hook="template-t1-open"]');
  await wait(400);
  await press(page, '[data-hook="template-t1-open"]');
  await waitForHook(page, '[data-hook="template-rail"]');
  await wait(500);
  if (tab !== "general") {
    await press(page, `[data-hook="template-tab-${tab}"]`);
    await wait(600);
  }
}

// A showcase's settings page (Edit on its card) on a named rail section.
async function showcaseSettings(page, id, tab = "reviews") {
  await press(page, `[data-hook="widget-${id}-edit"]`);
  await waitForHook(page, '[data-hook="widget-rail"]');
  await wait(500);
  if (tab !== "reviews") {
    await press(page, `[data-hook="widget-tab-${tab}"]`);
    await wait(600);
  }
}

// The section sheet for a showcase section. Sheets slide in from the
// right, so the settle after the hook appears is what keeps the frame from
// catching it mid-slide.
async function showcaseSheet(page, id, tab) {
  await showcaseSettings(page, id, tab);
  await press(page, `[data-hook="widget-edit-${tab}"]`);
  await waitForHook(page, '[data-hook="section-sheet-panel"]');
  await wait(900);
}

// Close whatever Radix layer is open (a facet popover, a menu). Radix
// listens for Escape on the document, so a synthetic keydown there is
// enough; re-pressing the trigger would depend on how each menu toggles.
async function escape(page) {
  await inFrame(page, () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    return true;
  });
  await wait(500);
}

// Drop focus before the shutter. Synthetic pointer events leave the last
// target focused, and the sheet and the facet panel both draw a focus ring
// when that happens, which is not a state anyone designed.
async function blur(page) {
  await inFrame(page, () => { document.activeElement && document.activeElement.blur(); return true; });
  await wait(200);
}

// Scroll the sheet body that holds the Design controls to its bottom. The
// body is the scroller (min-h-0 grow overflow-y-auto), found by walking up
// from the controls to the first ancestor with real overflow.
async function scrollDesignSheet(page) {
  const moved = await inFrame(page, () => {
    let el = document.querySelector('[data-hook="design-controls"]');
    while (el && el.scrollHeight - el.clientHeight < 40) el = el.parentElement;
    if (!el) return false;
    el.scrollTop = el.scrollHeight;
    return el.scrollTop;
  });
  await wait(800);
  return moved;
}

// Scroll the Design sheet so a NAMED GROUP sits directly under the sticky
// preview. Every one of the five groups is open from the moment the sheet
// mounts (the Accordion's defaultValue carries all of them), so "on the
// Container group" is a scroll position rather than a click, and a pixel
// offset would be a guess at how tall the groups above it are. Takes the
// preview's own height off the top, because that block is sticky inside the
// same scroller and a group parked at the exact offset would sit under it.
async function scrollDesignSheetTo(page, selector) {
  const moved = await inFrame(page, (sel) => {
    let sc = document.querySelector('[data-hook="design-controls"]');
    while (sc && sc.scrollHeight - sc.clientHeight < 40) sc = sc.parentElement;
    const node = document.querySelector(sel);
    if (!sc || !node) return false;
    const preview = document.querySelector('[data-hook="design-live-preview"]');
    const head = preview ? preview.getBoundingClientRect().height : 0;
    const top = node.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop;
    sc.scrollTop = Math.max(0, top - head - 8);
    return sc.scrollTop;
  }, selector);
  await wait(900);
  return moved;
}

// The Select Reviews sheet with its Filter panel open. Four states start
// here. The panel re-seeds its draft from the showcase every time it opens,
// so each one gets the same four columns whatever the state before it did,
// and nothing it touches reaches the showcase until Apply Filters.
async function showcaseFilter(page, id) {
  await showcaseSheet(page, id, "reviews");
  await press(page, '[data-hook="picker-filter"]');
  await waitForHook(page, '[data-hook="picker-filter-panel"]');
  await wait(800);
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


// New campaign from the hub, walked down the SEND PATH to a named step:
// setup -> recipients -> columns -> check -> send -> confirm -> success.
// `channel` picks a mode on the settings page first (the Select's option
// label, read from CHANNELS: Email / SMS / Web link / Kiosk); a standing
// mode's primary action is Go live, which lands on `golive` instead.
async function newCampaignTo(page, step, { channel = null } = {}) {
  await press(page, '[data-hook="new-campaign"]');
  await waitForHook(page, '[data-hook="setup-card"]');
  await wait(500);
  if (channel) {
    await press(page, '[data-hook="setup-channel"]');
    await wait(600);
    await pressText(page, channel, '[role="option"]');
    await wait(600);
  }
  if (step === "setup") return;
  await press(page, '[data-hook="setup-create"]');
  await wait(1000);
  if (step === "recipients" || step === "golive") return;
  // The CSV dropzone simulates an upload on press; recipients will not
  // move without it ("Upload a CSV file to continue.").
  await press(page, '[data-hook="contacts-upload"]');
  await wait(900);
  await press(page, '[data-hook="wizard-next"]');
  await wait(1000);
  if (step === "columns") return;
  await press(page, '[data-hook="wizard-next"]');
  await wait(1000);
  if (step === "check") return;
  // Both confirmations default to off, and Next refuses without them.
  await press(page, '[data-hook="confirm-permission-label"]');
  await wait(250);
  await press(page, '[data-hook="confirm-privacy-label"]');
  await wait(250);
  await press(page, '[data-hook="wizard-next"]');
  // The send step mounts the whole contact sheet; wait for it rather than
  // pressing Next into a step that is not there yet (getreviews-45 failed
  // exactly this way on its first run).
  await waitForHook(page, '[data-hook="preview-as-customer"]');
  await wait(800);
  if (step === "send") return;
  await press(page, '[data-hook="wizard-next"]');
  await waitForHook(page, '[data-hook="send-confirm-title"]');
  await wait(700);
  if (step === "confirm") return;
  await pressText(page, "Send now", '[role="alertdialog"] button');
  await waitForHook(page, '[data-hook="wizard-success"]');
  await wait(800);
}

// The Draft campaign (c4, SMS) reopened on its settings page, then Review
// and send, which for SMS lands on the recipients step with the country
// and credits controls email never shows.
async function draftToRecipients(page) {
  await press(page, '[data-hook="campaign-c4-open"]');
  await waitForHook(page, '[data-hook="setup-card"]');
  await wait(500);
  await press(page, '[data-hook="setup-create"]');
  await waitForHook(page, '[data-hook="country-field"]');
  await wait(500);
}

// ── the states ────────────────────────────────────────────────────────
const expectDrawer = `!!document.querySelector('[role="dialog"]')`;
// "A panel opened" is not the same as "the REPLIABLE panel opened". Every
// row opens a dialog, including the already-replied and read-only ones,
// so expectDrawer alone let inbox-02 ship a read-only frame for a whole
// run (28 Aug). Assert the composer furniture the note actually promises.
const expectComposer = `(() => {
  const d = document.querySelector('[role="dialog"]');
  return !!d && !!d.querySelector("textarea")
    && !!d.querySelector('[data-hook^="ai-"]')
    && !!d.querySelector('[data-hook^="send-"]');
})()`;
// A DESIGN GROUP IS ONLY SHOT IF IT IS ON SCREEN. Existence is not enough
// here and asserting it would be the failure this suite exists to prevent:
// all five groups exist the moment the sheet mounts, so a state whose scroll
// went nowhere would pass and hand back a frame of the group above it. The
// check is geometric instead: the trigger sits below the sticky preview and
// inside the sheet's own scroller.
const expectDesignGroup = (hook) => `(() => {
  const preview = document.querySelector('[data-hook="design-live-preview"]');
  const node = document.querySelector('[data-hook="${hook}"]');
  if (!preview || !node) return false;
  let sc = document.querySelector('[data-hook="design-controls"]');
  while (sc && sc.scrollHeight - sc.clientHeight < 40) sc = sc.parentElement;
  if (!sc) return false;
  const p = preview.getBoundingClientRect();
  const n = node.getBoundingClientRect();
  const s = sc.getBoundingClientRect();
  return n.top >= p.bottom - 2 && n.bottom <= s.bottom;
})()`;
const expectFailure = (frag) =>
  `(() => { const d = document.querySelector('[role="dialog"]');
     return !!d && /${frag}/.test(d.innerText); })()`;

const STATES = [
  // ── Reviews (the section landing page) ──────────────────────────────
  // FIRST on purpose: it is the parent of the other four RM sections, so
  // it should read first on a Figma board. Ordering here is the only
  // ordering there is, because this script writes one FLAT folder of
  // <state-id>.png plus <section>-NOTES.md rather than numbered
  // per-section subfolders, so there was nothing to renumber.
  //
  // Section name is `reviewshub`, not `reviews-hub`: the section a state
  // belongs to is name.split("-")[0], so a two-word prefix would split at
  // the first dash and file the notes under "reviews".
  ["reviewshub-01-cards", "reviewshub", async () => {},
    `(() => {
       const hooks = ["reviews-hub-inbox", "reviews-hub-insights",
                      "reviews-hub-get", "reviews-hub-widgets"];
       const first = document.querySelector('[data-hook="reviews-hub-inbox"]');
       if (!first) return false;
       for (const h of hooks) if (!document.querySelector('[data-hook="' + h + '"]')) return false;
       return getComputedStyle(first.parentElement).gridTemplateColumns.trim().split(/\\s+/).length === 2;
     })()`,
    "The Reviews landing page: one card per sub-tool, two up, each a link into its own screen. Static, because the page's whole job is to route."],

  // ── Review Manager ────────────────────────────────────────────────────
  // ROW INDICES ARE NOT ARBITRARY and must not be guessed. The five
  // failure codes are pinned to the first five reviews that are both
  // repliable and still needing action, DERIVED in the screen from the
  // rows the inbox is built with. Guessing 6 and 8 once drove two of
  // these into reviews with no simulated failure, so the send SUCCEEDED,
  // the drawer closed, and the run captured a plain list that looked
  // almost right (27 Aug). Every one of these asserts on the failure copy
  // before the shutter fires, which is what caught the drift below.
  //
  // THEY MOVE WHEN THE SEED MOVES. The inbox now comes from
  // inboxRowsFor(location, persona) rather than the old SEED_REVIEWS, and
  // that put the five on rows 0..4 for the `engaged` persona this suite
  // shoots, where they used to sit on 0, 2, 4, 8, 10 (20 Sep). The list
  // is unsorted and unfiltered at rest, so the visible row index is the
  // seed index. Recompute rather than guess, from apps/brightlocal:
  //   npx tsx -e 'import {inboxRowsFor} from "./lib/reviews-data";
  //     const ok={google:1,facebook:1};
  //     console.log(inboxRowsFor("minus-1-studios",{engagement:"engaged"})
  //       .map(([s,,,,,st],i)=>({i,s,st}))
  //       .filter(r=>ok[r.s]&&r.st==="needs").slice(0,5))'
  ["manager-01-list", "manager", async () => {},
    null,
    "Review Manager at rest: the tabs with their counts, the facet triggers, and one status badge per row (status is the state the review is in, never the delivery outcome)."],
  // THE FOUR FACET MENUS OPEN (Ali, 8 Sep: "in Review Manager, can we also
  // expose the facet menus as we do in Builder"). Same FacetedFilterMenu as
  // every other page; each shot exists to show that menu's rows and counts.
  ["manager-02-sources-facet", "manager", async (p) => { await press(p, '[data-hook="facet-sources"]'); },
    `!!document.querySelector('[data-slot="command-item"]')`,
    "The sources facet open: All sources with its total, then each connected source with its mark and count."],
  ["manager-03-ratings-facet", "manager", async (p) => { await press(p, '[data-hook="facet-ratings"]'); },
    `!!document.querySelector('[data-slot="command-item"]')`,
    "The ratings facet open: All ratings, then each star rating and the Facebook recommendation rows with counts."],
  ["manager-04-period-facet", "manager", async (p) => { await press(p, '[data-hook="facet-period"]'); },
    `!!document.querySelector('[data-slot="command-item"]')`,
    "The period menu open: the single-select list with a tick on the chosen period."],
  ["manager-05-order-facet", "manager", async (p) => { await press(p, '[data-hook="facet-order"]'); },
    `!!document.querySelector('[data-slot="command-item"]')`,
    "The order menu open: Newest first ticked, the other orders below it."],
  // ROW 6, not row 3. Row 3 is Priya / Google / "Manually replied": it
  // opens a READ-ONLY panel with a Delete reply / Edit reply footer and
  // no composer at all, so this frame was showing the opposite of what
  // its note claims (28 Aug). Page one holds exactly six repliable rows,
  // 0, 2, 4, 6, 8 and 10; the other five are all spoken for by the
  // failure and AI-quota states, and reusing one of those would make this
  // frame a duplicate of inbox-10. That leaves 6.
  // ASSUMPTION worth knowing: row 6 arrives as "Reply skipped" rather
  // than "Needs action". It is fully repliable and shows the whole
  // composer, which is what the note is about, but the status badge in
  // this frame is not the first-time-through one.
  ["manager-06-reply-panel", "manager", async (p) => { await openRow(p, 6); }, expectComposer,
    "Reply panel for a repliable review. AI draft and template picker above the composer, Skip and Send in the footer."],
  ["manager-07-readonly-source", "manager", async (p) => { await openRow(p, 1); },
    expectFailure("cannot be sent from here"),
    "TripAdvisor cannot be replied to from here. No composer, no AI, no template picker, and no footer at all."],
  ["manager-08-fail-disconnected", "manager", async (p) => { await sendOn(p, 0); },
    expectFailure("connection has expired"),
    "BLOCKING failure. The connection expired, so the composer is hidden: a reply box you cannot submit is furniture that invites wasted typing."],
  ["manager-09-fail-rate-limited", "manager", async (p) => { await sendOn(p, 1); },
    expectFailure("limiting replies"),
    "RECOVERABLE failure. The composer stays and the draft is preserved, because waiting a few minutes genuinely fixes this one."],
  ["manager-10-fail-unknown", "manager", async (p) => { await sendOn(p, 2); },
    expectFailure("rejected this reply"),
    "RECOVERABLE failure. Even the generic case says what to do next; never a bare 'something went wrong'."],
  ["manager-11-fail-deleted-terminal", "manager", async (p) => { await sendOn(p, 3); },
    expectFailure("no longer on"),
    "TERMINAL failure. The review is gone, so the action is Skip reply, not Retry, and Send is disabled. A retry that 'worked' would be a lie."],
  ["manager-12-fail-permission-seeded", "manager", async (p) => { await openRow(p, 10); },
    expectFailure("cannot reply to"),
    "Arrives already failed on load, so the state is visible without sending anything. Blocking, because the fix is outside this screen."],
  // TRANSIENT. The pending beat lasts ~900ms, and the normal 1400ms
  // post-drive settle plus a polling assertion outlived it, so this came
  // out byte-identical to the resolved failure frame. Shot immediately,
  // with a single-shot check rather than a poll.
  ["manager-13-sending", "manager", async (p) => { await sendOn(p, 0, 250); },
    `!!document.querySelector('[role="dialog"] button[disabled]')`,
    "The pending beat. Send shows a spinner and both footer buttons are disabled so a second click cannot land."],

  // AI DRAFT QUOTA, all four steps. Rows 0, 2, 4 and 8 are all repliable
  // and still needing action, so each opens a composer. Row 10 is
  // deliberately NOT used: it arrives already failed, so its panel has no
  // composer and no AI button to read a counter from.
  // NOT ROWS 0..4: those five now carry the seeded send failures, and one of
  // them (the permission case) arrives already failed, so its row opens on a
  // blocked composer with no allowance line under it. The AI states want
  // ordinary repliable reviews, which start at row 5 (20 Sep).
  ["manager-14-ai-3-left", "manager", async (p) => { await openRow(p, 5); },
    `/3 of 3 AI drafts left/.test(document.body.innerText)`,
    "Full AI allowance. The count sits under the composer as quiet helper text, not as a warning."],
  ["manager-15-ai-2-left", "manager", async (p) => {
    await spendAi(p, 5); await openRow(p, 6);
  }, `/2 of 3 AI drafts left/.test(document.body.innerText)`,
    "One draft spent. The counter only moves on a review's first AI use, so re-inserting on the same review is free."],
  ["manager-16-ai-1-left", "manager", async (p) => {
    await spendAi(p, 5); await spendAi(p, 6); await openRow(p, 9);
  }, `/1 of 3 AI drafts left/.test(document.body.innerText)`,
    "Last draft. Still helper text: the state that needs explaining is running out, not being close to it."],
  ["manager-17-ai-used-up", "manager", async (p) => {
    await spendAi(p, 5); await spendAi(p, 6); await spendAi(p, 9); await openRow(p, 8);
  }, `/No AI drafts left today/.test(document.body.innerText)`,
    "Allowance gone. This is the one state a person will want explained, so it escalates to an AlertInfo that says when it resets and what you can still do."],

  // ── Review Tracker ─────────────────────────────────────────────────
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
    "Templates and auto-reply rules on one page, split out of Review Manager because the two are intertwined."],
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
    // Was a 6-tuple with a stray null in the note slot, so the runner's
    // [name, screen, , , note] destructure read null and this state was
    // the one row missing from templates-NOTES.md.
    `!!document.querySelector('[data-slot="collapsible-trigger"][aria-expanded="true"]')`,
    "Per-rule run history, including a failed send, so auto-reply failures have somewhere to live."],

  // ── Review Showcase ──────────────────────────────────────────────────
  // REWRITTEN 7 Sep 2026 for the RAIL version, widened the same day to EVERY
  // STATE (Ali: "capture every state ... and all copy used in the product"),
  // and rewritten again 20 Sep when the screen was rebuilt twice in a day to
  // match BrightLocal's real Widget Design screen.
  //
  // WHAT THE SCREEN IS NOW. Three fixed showcases (List, Carousel, JSON feed)
  // as cards; a settings page per showcase with a Reviews / Widget Design /
  // Embed rail (JSON: Reviews / Embed) and Save showcase / Close in the page
  // header; Reviews and Widget Design open a right-hand sheet.
  //   Widget Design is preset tiles over a DS Accordion of Layout, Container,
  //   Text and Reviews, plus Animation on a carousel. The old Display /
  //   Information / Animation grouping is gone, and so are light and dark mode
  //   (Ali, 20 Sep: "in showcase we won't have dark and light mode") and the
  //   "Reviews by brightlocal" line under a widget.
  //   Animation is the product's own five: Auto rotate slides, Transition
  //   style, Transition animation speed, Show slide arrows, Show slide dots,
  //   as Yes / No pairs. Loop, Autoplay and the Every select are gone.
  //   Reviews is the product's Select Reviews step: a dismissible Yelp notice,
  //   a Filter panel of four columns behind Apply Filters, Auto select
  //   reviews, a result count, and a table carrying a Position select and a
  //   Blacklist toggle per review. Hand-picked versus live feed is gone, and
  //   with it the mode cards, the four facet menus, the Limit select and the
  //   per-review tick boxes.
  ["widgets-01-list", "widgets", async () => {},
    `(() => {
       for (const id of ["list", "carousel", "json"]) {
         for (const h of ["", "-view", "-edit", "-menu-button"]) {
           if (!document.querySelector('[data-hook="widget-' + id + h + '"]')) return false;
         }
       }
       return !document.querySelector('[role="dialog"]');
     })()`,
    // THE NOTE SAYS WHERE THE THIRD FOOTER WENT. Two-up plus a page header
    // puts the JSON feed card's own footer just under 900px, so a caption
    // promising Preview, Edit and the overflow on all three was describing
    // two of them. widgets-03 scrolls down and shoots that third footer.
    "The three showcases as cards, two up: each carries the same title, caption and seven summary rows, over a footer with Preview, Edit and the overflow. The JSON feed wraps onto a second row, so its footer sits below the fold of this frame."],
  ["widgets-02-overflow-embed-code", "widgets", async (p) => {
    await press(p, '[data-hook="widget-carousel-menu-button"]');
    await wait(700);
    await blur(p);
  },
    `[...document.querySelectorAll('[role="menuitem"]')].some((m) => m.textContent.trim() === "Embed code")`,
    "A List or Carousel card's overflow holds one item, Embed code."],
  ["widgets-03-overflow-feed-url", "widgets", async (p) => {
    // The JSON card is the third of three and sits at the fold; its menu
    // opens downward, off the frame, unless the card is scrolled up first.
    await scrollToHook(p, '[data-hook="widget-json"]', 120);
    await press(p, '[data-hook="widget-json-menu-button"]');
    await wait(700);
    await blur(p);
  },
    `[...document.querySelectorAll('[role="menuitem"]')].some((m) => m.textContent.trim() === "Feed URL")`,
    "The JSON feed card's overflow says Feed URL instead."],
  ["widgets-04-preview-sheet-list", "widgets", async (p) => {
    await press(p, '[data-hook="widget-list-view"]');
    await waitForHook(p, '[data-hook="widget-preview-drawer"]');
    await wait(900);
  },
    // NOT THE DARK CHROME ANY MORE. This used to assert on a neutral-900
    // panel, because a showcase carried its own dark mode. Showcase lost
    // light and dark (Ali, 20 Sep: "in showcase we won't have dark and light
    // mode"), so the only honest check left is that the frame rendered
    // something rather than an empty box.
    `!!document.querySelector('[data-hook="widget-preview-drawer"][data-state="open"]')
     && (document.querySelector('[data-hook="preview-frame-sheet"]')?.innerText.trim().length ?? 0) > 40`,
    "The Preview sheet for the List: the showcase as the site shows it, with Edit showcase in the footer."],
  ["widgets-05-preview-sheet-carousel", "widgets", async (p) => {
    await press(p, '[data-hook="widget-carousel-view"]');
    await waitForHook(p, '[data-hook="widget-preview-drawer"]');
    await wait(900);
  },
    `!!document.querySelector('[data-hook="widget-preview-drawer"][data-state="open"]')
     && !!document.querySelector('[data-hook="widget-carousel-next"]')`,
    // NOTE CORRECTED 20 Sep: it used to promise a "Reviews by brightlocal"
    // line, which the rebuild dropped along with light and dark mode, so the
    // caption was describing furniture that is no longer drawn. It no longer
    // promises the arrows either: the showcase shows 25 reviews, so the dot
    // row is 25 dots wide and pushes both arrows off the panel. The hook is
    // still asserted, because they ARE rendered; they are just not readable
    // in this frame. Flagged rather than fixed, the screen is not ours.
    "The Preview sheet for the Carousel: one slide at a time, with a dot per review under it, and Edit showcase in the footer."],
  ["widgets-06-embed-sheet-list", "widgets", async (p) => {
    await press(p, '[data-hook="widget-list-menu-button"]');
    await wait(700);
    await pressText(p, "Embed code", '[role="menuitem"]');
    await waitForHook(p, '[data-hook="widget-embed-drawer"]');
    await wait(900);
    await blur(p);
  },
    `!!document.querySelector('[data-hook="widget-embed-drawer"][data-state="open"]')
     && !!document.querySelector('[data-hook="detail-embed-code-steps"]')`,
    "The Embed sheet: the script line, Copy code, and the three numbered steps for a page editor."],
  ["widgets-07-feed-url-sheet-json", "widgets", async (p) => {
    await press(p, '[data-hook="widget-json-menu-button"]');
    await wait(700);
    await pressText(p, "Feed URL", '[role="menuitem"]');
    await waitForHook(p, '[data-hook="widget-embed-drawer"]');
    await wait(900);
    await blur(p);
  },
    `(() => {
       const b = document.querySelector('[data-hook="detail-embed-code-copy"]');
       return !!b && b.textContent.trim() === "Copy URL";
     })()`,
    "The Feed URL sheet: the URL, Copy URL, and the three steps written for a developer."],

  // SETTINGS, every showcase on every rail section.
  ["widgets-08-list-reviews", "widgets", async (p) => { await showcaseSettings(p, "list", "reviews"); },
    `!!document.querySelector('[data-hook="widget-settings-layout"]')
     && !!document.querySelector('[data-hook="widget-tab-reviews"][aria-selected="true"]')
     && !!document.querySelector('[data-hook="widget-panel-reviews-rows"]')`,
    // NOTE CORRECTED 20 Sep: the rows under this card were "the hand-picked
    // rows" and hand-picking is gone. They are the Select Reviews model now.
    "List settings on Reviews: Review Showcase with List under it in the page header, Save showcase and Close beside them, the rail, and the rows that say which reviews this showcase publishes, over the widget itself."],
  ["widgets-09-list-design", "widgets", async (p) => { await showcaseSettings(p, "list", "design"); },
    // THE CARD READS THE SHEET BACK, GROUP FOR GROUP, and the sheet's groups
    // changed, so the hooks did: design-group-display and
    // design-group-information no longer exist anywhere on the screen.
    `!!document.querySelector('[data-hook="widget-tab-design"][aria-selected="true"]')
     && !!document.querySelector('[data-hook="widget-panel-design-group-preset"]')
     && !!document.querySelector('[data-hook="widget-panel-design-group-layout"]')
     && !!document.querySelector('[data-hook="widget-panel-design-group-container"]')
     && !!document.querySelector('[data-hook="widget-panel-design-group-text"]')
     && !!document.querySelector('[data-hook="widget-panel-design-group-reviews"]')
     && !document.querySelector('[data-hook="widget-panel-design-group-animation"]')`,
    "List settings on Widget Design: every control in the sheet read back as a row, under the sheet's own headings, Preset, Layout, Container, Text and Reviews. No Animation group for a list."],
  ["widgets-10-list-embed", "widgets", async (p) => { await showcaseSettings(p, "list", "embed"); },
    `!!document.querySelector('[data-hook="widget-tab-embed"][aria-selected="true"]')
     && !!document.querySelector('[data-hook="widget-panel-embed-code-pre"]')`,
    "List settings on Embed: the code, Copy code and the steps, on the card with no Edit."],
  ["widgets-11-carousel-reviews", "widgets", async (p) => { await showcaseSettings(p, "carousel", "reviews"); },
    `!!document.querySelector('[data-hook="widget-tab-reviews"][aria-selected="true"]')
     && !!document.querySelector('[data-hook="widget-carousel-preview"]')`,
    // NOTE CORRECTED 20 Sep: Ratings, Sources, Period, Limit and Left out were
    // the live-feed rows. Limit and Left out went with hand-picking.
    "Carousel settings on Reviews: the same rows as every other showcase, this one narrowed to Google over the last twelve months, over the live carousel."],
  ["widgets-12-carousel-design", "widgets", async (p) => { await showcaseSettings(p, "carousel", "design"); },
    `!!document.querySelector('[data-hook="widget-tab-design"][aria-selected="true"]')
     && !!document.querySelector('[data-hook="widget-panel-design-group-animation"]')`,
    // NOTE CORRECTED 20 Sep: Loop, Autoplay and Controls are gone from the
    // Animation group; the five below are the product's own.
    "Carousel settings on Widget Design: the same groups as a list, plus Animation, which reads back auto rotate, the transition style and its speed, and whether the arrows and the dots are drawn."],
  ["widgets-13-carousel-embed", "widgets", async (p) => { await showcaseSettings(p, "carousel", "embed"); },
    `!!document.querySelector('[data-hook="widget-tab-embed"][aria-selected="true"]')
     && !!document.querySelector('[data-hook="widget-panel-embed-code-pre"]')`,
    "Carousel settings on Embed."],
  ["widgets-14-json-reviews", "widgets", async (p) => { await showcaseSettings(p, "json", "reviews"); },
    `!!document.querySelector('[data-hook="widget-tab-reviews"][aria-selected="true"]')
     && !document.querySelector('[data-hook="widget-tab-design"]')`,
    "JSON feed settings: a two-item rail, Reviews and Embed, because a feed carries no design of its own. The same rows, and this is the one showcase with auto select off."],
  ["widgets-15-json-embed", "widgets", async (p) => { await showcaseSettings(p, "json", "embed"); },
    `(() => {
       const b = document.querySelector('[data-hook="widget-panel-embed-code-copy"]');
       return !!b && b.textContent.trim() === "Copy URL";
     })()`,
    "JSON feed settings on Embed: the URL with Copy URL and the developer steps."],

  // SELECT REVIEWS, the sheet and everything in it.
  // ALL TEN OF THESE ARE NEW OR REBUILT (20 Sep). What was here drove the
  // Hand-picked / Live feed pair, its four facet menus, the Limit select and
  // the tick box on each review card, and not one of those exists any more:
  //   16 reviews-sheet-handpicked  -> 16 select-reviews-sheet (the whole step)
  //   17 handpicked-sources-facet  -> 18 filter-panel (the four columns)
  //   18 handpicked-tooltip        -> 20 auto-select-tooltip
  //   19 feed-ratings-facet        -> 18, same panel
  //   20 feed-period-facet         -> 19 filter-custom-dates
  //   21 feed-limit-menu           -> 22 position-select, the one per-review
  //                                   number the product actually offers
  //   22 feed-unticked             -> 23 blacklist-on
  //   23 feed-tooltip              -> 24 yelp-unavailable
  //   24 no-reviews-chosen         -> gone. The two hand-picked save blocks
  //                                   (nothing chosen, more than fifty chosen)
  //                                   went with hand-picking; one check is
  //                                   left and 26 shoots it.
  ["widgets-16-select-reviews-sheet", "widgets", async (p) => { await showcaseSheet(p, "list", "reviews"); },
    `!!document.querySelector('[data-hook="reviews-yelp-notice"]')
     && !!document.querySelector('[data-hook="picker-filter"]')
     && !!document.querySelector('[data-hook="select-reviews-table"]')
     && !!document.querySelector('[data-hook^="select-position-"]')
     && !!document.querySelector('[data-hook^="select-blacklist-"]')
     && /results/.test(document.querySelector('[data-hook="picker-count"]').textContent)`,
    "Select Reviews for the List: the Yelp notice, the step's title and line, then the sticky bar with Filter, Auto select reviews and the result count, over a table of reviews carrying a Position and a Blacklist each."],
  ["widgets-17-select-reviews-notice-dismissed", "widgets", async (p) => {
    await showcaseSheet(p, "list", "reviews");
    await press(p, '[data-hook="reviews-yelp-notice-dismiss"]');
    await wait(700);
    await blur(p);
  },
    `!document.querySelector('[data-hook="reviews-yelp-notice"]')
     && !!document.querySelector('[data-hook="picker-heading"]')
     && !!document.querySelector('[data-hook="select-reviews-table"]')`,
    "The Yelp notice dismissed. It is a standing rule rather than an error, so it closes and the step reads from its own title down."],
  ["widgets-18-filter-panel", "widgets", async (p) => {
    await showcaseFilter(p, "list");
    await blur(p);
  },
    `(() => {
       const panel = document.querySelector('[data-hook="picker-filter-panel"]');
       if (!panel) return false;
       for (const h of ["filter-ratings-field", "filter-nps-field", "filter-date-field",
                        "filter-sources-field", "picker-filter-apply"]) {
         if (!panel.querySelector('[data-hook="' + h + '"]')) return false;
       }
       return true;
     })()`,
    "The Filter dropdown open: Star Rating, Feedback Score (NPS), Date and Review Sources in four columns, with Apply Filters at the foot. Nothing changes until that is pressed, so closing the panel is a cancel."],
  ["widgets-19-filter-custom-dates", "widgets", async (p) => {
    await showcaseFilter(p, "list");
    await press(p, '[data-hook="filter-date-custom-label"]');
    await wait(700);
    await blur(p);
  },
    `!!document.querySelector('[data-hook="filter-date-range"]')
     && !!document.querySelector('[data-hook="filter-date-start"]')
     && !!document.querySelector('[data-hook="filter-date-end"]')`,
    "Custom date range chosen: Start and End appear under the date options, one above the other so each gets the whole column."],
  ["widgets-20-auto-select-tooltip", "widgets", async (p) => {
    await showcaseSheet(p, "list", "reviews");
    await hover(p, '[data-hook="picker-auto-select-info"]');
  },
    `[...document.querySelectorAll('[role="tooltip"]')].some((t) => /joins this showcase on its own/.test(t.textContent))`,
    "The info beside Auto select reviews, hovered: leave it on and any new review matching the filters joins this showcase on its own."],
  ["widgets-21-auto-select-off", "widgets", async (p) => {
    await showcaseSheet(p, "list", "reviews");
    await press(p, '#picker-auto-select-switch');
    await wait(700);
    await blur(p);
  },
    `document.querySelector('#picker-auto-select-switch')?.getAttribute("data-state") === "unchecked"`,
    "Auto select reviews turned off: the showcase stays as it is today and stops taking new reviews on its own."],
  ["widgets-22-position-select", "widgets", async (p) => {
    await showcaseSheet(p, "list", "reviews");
    await press(p, '[data-hook^="select-position-"]');
    await wait(900);
  },
    `(() => {
       const opts = [...document.querySelectorAll('[role="option"]')];
       return opts.length > 3 && opts.some((o) => o.textContent.trim() === "-1");
     })()`,
    "The Position select on one review, open: minus one for no position, then one place per review, so a review can be pinned to the top of the widget."],
  ["widgets-23-blacklist-on", "widgets", async (p) => {
    await showcaseSheet(p, "list", "reviews");
    await press(p, '[data-hook^="select-blacklist-"]');
    await wait(700);
    await blur(p);
  },
    `!!document.querySelector('[data-hook^="select-blacklist-"][data-state="checked"]')`,
    "Blacklist turned on for one review: it stays in the table, and it is kept off the site."],
  ["widgets-24-yelp-unavailable", "widgets", async (p) => {
    // FILTERED TO YELP ALONE, rather than hunting a Yelp row in a table
    // sorted by date. Yelp is 61 of the 1,116 reviews in this pool, so which
    // page one of them lands on is luck; the source filter makes every row
    // one, which is also the clearest way to read the rule.
    await showcaseFilter(p, "list");
    await press(p, '[data-hook="filter-sources-all"]');
    await wait(400);
    await press(p, '[data-hook="filter-source-yelp"]');
    await wait(400);
    await press(p, '[data-hook="picker-filter-apply"]');
    await wait(1200);
    await hover(p, '[data-hook^="select-unavailable-"]');
  },
    `!!document.querySelector('[data-hook^="select-unavailable-"]')
     && !document.querySelector('[data-hook^="select-blacklist-"]')
     && [...document.querySelectorAll('[role="tooltip"]')].some((t) => /cannot go in a showcase/.test(t.textContent))`,
    "Filtered to Yelp alone: every row reads Unavailable where its Position would be, with no Blacklist beside it, and the tooltip repeats the notice's reason. Yelp does not allow its reviews to be republished."],
  ["widgets-25-no-reviews-in-filter", "widgets", async (p) => {
    // FEEDBACK SCORE: POSITIVE is the one filter in this data that is
    // guaranteed to match nothing. A score comes from a Get Reviews campaign
    // and this pool models none, which the table's own empty line says.
    await showcaseFilter(p, "list");
    await press(p, '[data-hook="filter-nps-positive-label"]');
    await wait(400);
    await press(p, '[data-hook="picker-filter-apply"]');
    await wait(1200);
    await blur(p);
  },
    `(() => {
       const list = document.querySelector('[data-hook="picker-list"]');
       return !!list && /A feedback score comes from a Get Reviews campaign/.test(list.textContent)
         && /of 0 results/.test(document.querySelector('[data-hook="picker-count"]').textContent);
     })()`,
    "A filter that matches nothing: Feedback Score set to Positive. The table says why in its own words, because a feedback score comes from a Get Reviews campaign and this location has none."],
  ["widgets-26-no-reviews-match", "widgets", async (p) => {
    await showcaseFilter(p, "list");
    await press(p, '[data-hook="filter-nps-positive-label"]');
    await wait(400);
    await press(p, '[data-hook="picker-filter-apply"]');
    await wait(1000);
    await press(p, '[data-hook="section-sheet-done"]');
    await wait(900);
    await press(p, '[data-hook="widget-save"]');
    await wait(900);
  },
    `!!document.querySelector('[data-hook="reviews-issue"]')
     && /No reviews match/.test(document.querySelector('[data-hook="reviews-issue"]').textContent)`,
    // Reachable in the app again. It used to be skipped here, because the old
    // way in was a Facebook-only carousel and that still matched reviews in
    // this location's data; a Positive feedback score matches nothing
    // anywhere, so the one save-blocking check finally has a shot.
    "Save with a filter that matches nothing: the rail jumps to Reviews and the No reviews match alert sits above the rows, naming what to widen."],

  // WIDGET DESIGN, the sheet.
  ["widgets-27-design-sheet-list", "widgets", async (p) => { await showcaseSheet(p, "list", "design"); },
    `!!document.querySelector('[data-hook="design-live-preview"]')
     && !!document.querySelector('[data-hook="design-intro"]')
     && !!document.querySelector('[data-hook="design-preset-field"]')
     && !!document.querySelector('[data-hook="design-group-layout"]')
     && !!document.querySelector('[data-hook="design-group-container"]')
     && !!document.querySelector('[data-hook="design-group-text"]')
     && !!document.querySelector('[data-hook="design-group-reviews"]')
     && !document.querySelector('[data-hook="design-group-animation"]')`,
    // THE NOTE DOES NOT PROMISE THE LIVE PREVIEW, and the sheet is meant to
    // have one. Measured on the running app: design-live-preview is 25px tall
    // with 675px of content in it, so the widget it exists to show is clipped
    // to a hairline strip above the controls. It is a flex item in a scrolling
    // column, it carries overflow-y auto, so its automatic minimum size is 0
    // and it is the one thing in the sheet that can be squashed. Flagged, not
    // fixed: the screen is not this file's to edit. Every Design state below
    // reads the same way, which is why none of their notes mention it either.
    "The Widget Design sheet for the List: the line about customizing, then the preset tiles, then Layout, Container, Text and Reviews as groups. No Animation on a list."],
  ["widgets-28-design-presets", "widgets", async (p) => {
    await showcaseSheet(p, "carousel", "design");
    await scrollDesignSheetTo(p, '[data-hook="design-preset-field"]');
  },
    `(() => {
       for (const id of ["modern", "classic", "bootstrap"]) {
         if (!document.querySelector('[data-hook="design-preset-' + id + '-tile"]')) return false;
       }
       if (document.querySelector('[data-hook="design-preset-custom-tile"]')) return false;
       return document.querySelector('#design-preset-modern')?.getAttribute("data-state") === "checked";
     })()`,
    "The preset tiles: Modern, Classic and Bootstrap, each showing what it does rather than naming it. Picking one sets every control below it."],
  ["widgets-29-design-preset-custom", "widgets", async (p) => {
    // The one control that turns a preset into Custom in a single press, and
    // it is down in Container, so the sheet scrolls there, presses, and comes
    // back up: the tile is the thing this frame is about.
    await showcaseSheet(p, "carousel", "design");
    await scrollDesignSheetTo(p, '[data-hook="design-group-container"]');
    await press(p, '[data-hook="design-border"]');
    await wait(700);
    await scrollDesignSheetTo(p, '[data-hook="design-preset-custom-tile"]');
    await blur(p);
  },
    `(() => {
       const tile = document.querySelector('[data-hook="design-preset-custom-tile"]');
       const preview = document.querySelector('[data-hook="design-live-preview"]');
       if (!tile || !preview) return false;
       if (document.querySelector('#design-preset-custom')?.getAttribute("data-state") !== "checked") return false;
       return tile.getBoundingClientRect().top >= preview.getBoundingClientRect().bottom - 2;
     })()`,
    // THE REPLACEMENT FOR THE OLD MODE / DARK FRAME. That state pressed
    // design-theme-dark-label and shot the preview repainting; showcase has no
    // modes any more (Ali, 20 Sep: "in showcase we won't have dark and light
    // mode"), so the nearest thing that matters is the other change a setting
    // makes at once, up in the tiles. Not the preview: see widgets-27 for why
    // nothing in this sheet can be shot against it.
    "One setting changed, and a Custom tile joins the three presets, already chosen. It is a readout rather than something to pick, and it goes again the moment a preset is chosen back."],
  ["widgets-30-design-group-layout", "widgets", async (p) => {
    await showcaseSheet(p, "list", "design");
    await scrollDesignSheetTo(p, '[data-hook="design-group-layout"]');
  }, expectDesignGroup("design-group-layout"),
    "The Layout group: widget max height, the three desktop layouts as glyphs, and how many reviews to show."],
  ["widgets-31-design-group-container", "widgets", async (p) => {
    await showcaseSheet(p, "list", "design");
    await scrollDesignSheetTo(p, '[data-hook="design-group-container"]');
  }, expectDesignGroup("design-group-container"),
    "The Container group: the widget's own background, corner radius, border and shadow, its title, and which review summary it carries."],
  ["widgets-32-design-group-text", "widgets", async (p) => {
    await showcaseSheet(p, "list", "design");
    await scrollDesignSheetTo(p, '[data-hook="design-group-text"]');
  }, expectDesignGroup("design-group-text"),
    "The Text group: the font, shown in its own face, then the text and link colours, the size, and the alignment."],
  ["widgets-33-design-group-reviews", "widgets", async (p) => {
    await showcaseSheet(p, "list", "design");
    await scrollDesignSheetTo(p, '[data-hook="design-group-reviews"]');
  }, expectDesignGroup("design-group-reviews"),
    "The Reviews group: what each review shows, the date format and the character count, then the review card's own background, radius, border and shadow."],
  ["widgets-34-design-group-animation", "widgets", async (p) => {
    await showcaseSheet(p, "carousel", "design");
    await scrollDesignSheetTo(p, '[data-hook="design-group-animation"]');
  }, expectDesignGroup("design-group-animation"),
    "The Animation group, on the Carousel only: auto rotate slides, transition style, transition animation speed, show slide arrows and show slide dots, every one of them a Yes and No pair."],
  ["widgets-35-design-transition-slide", "widgets", async (p) => {
    await showcaseSheet(p, "carousel", "design");
    await scrollDesignSheetTo(p, '[data-hook="design-group-animation"]');
    await press(p, '[data-hook="design-auto-rotate-yes-label"]');
    await wait(500);
    await press(p, '[data-hook="design-transition-slide-label"]');
    await wait(700);
    await blur(p);
  },
    `document.querySelector('#design-auto-rotate-yes')?.getAttribute("data-state") === "checked"
     && document.querySelector('#design-transition-slide')?.getAttribute("data-state") === "checked"`,
    // The old frame here switched Autoplay on to show the Every select come
    // alive; both controls are gone. The pair below is what the product asks
    // instead. Answering Yes is safe for a still: the run asks for reduced
    // motion and the screen refuses to start auto rotate under it, so nothing
    // is caught mid-slide.
    "Auto rotate slides answered Yes and the transition set to Slide: the answers the product asks for, on the pair of controls that were a switch and a seconds select before."],
  ["widgets-36-leave-dialog", "widgets", async (p) => {
    await showcaseSheet(p, "carousel", "design");
    await scrollDesignSheetTo(p, '[data-hook="design-preset-field"]');
    await press(p, '[data-hook="design-preset-bootstrap-label"]');
    await wait(700);
    await press(p, '[data-hook="section-sheet-done"]');
    await wait(900);
    await press(p, '[data-hook="widget-cancel"]');
    await wait(900);
  },
    `!!document.querySelector('[data-hook="leave-title"]') && !!document.querySelector('[data-hook="leave-confirm"]')`,
    "Close after a change: Leave without saving your changes, the sentence about what reverts, Keep editing and Discard and leave."],
  ["widgets-37-settings-narrow", "widgets", async (p) => { await showcaseSettings(p, "carousel", "reviews"); },
    `!!document.querySelector('[data-hook="widget-next-section"]')`,
    "Carousel settings at 390 wide: the rail stacks above the card and the footer carries Back and Next between sections.",
    { width: 390 }],

  // ── Report Settings ────────────────────────────────────────────────
  // NEW SCREEN, 2 Sep (design dmtkj124xagqa). Everything the RM Design
  // Brief lists under Monitor Reviews that previously had no home at all:
  // schedule and run day, the country-scoped directory picker doubling as
  // the profile-match panel, email alerts (the audit's own acknowledged
  // gap — "I have not included the 'set email notifications' feature
  // (yet)"), the public / white-label share link, and the run history
  // table. Reached from Review Tracker' Settings button, which until now
  // was a control that did nothing.
  ["settings-01-schedule", "settings", async () => {},
    `!!document.querySelector('[data-hook="schedule-card"]')
     && !!document.querySelector('[data-hook="frequency-select"]')
     && !!document.querySelector('[data-hook="run-now"]')`,
    "Report settings. Schedule first, because when the report runs is the setting everything else depends on. Run report now sits in the page header: it acts on the report, not on any one section, and it does not move the schedule."],
  ["settings-02-directories", "settings", async (p) => { await scrollToHook(p, '[data-hook="directories-card"]'); },
    `!!document.querySelector('[data-hook="directories-card"]')
     && !!document.querySelector('[data-hook="country-select"]')
     && !!document.querySelector('[data-hook="directory-google-matched"]')`,
    "Monitored directories, scoped by country: Yell and Thomson Local are United Kingdom sites and mean nothing to a US location. Matched / no profile found is a badge per row rather than a separate panel, because a directory you watch but have not matched is the case worth seeing."],
  ["settings-03-directories-uk", "settings", async (p) => {
    await scrollToHook(p, '[data-hook="directories-card"]');
    await press(p, '[data-hook="country-select"]');
    await wait(600);
    await pressText(p, "United Kingdom", '[role="option"]');
    await wait(600);
  },
    `!!document.querySelector('[data-hook="directory-yell"]')
     && !document.querySelector('[data-hook="directory-bbb"]')`,
    "Switching country switches which directories are even offered, and re-derives the selection. A US report silently monitoring Thomson Local is the kind of thing that makes a settings page untrustworthy."],
  ["settings-04-alerts", "settings", async (p) => { await scrollToHook(p, '[data-hook="alerts-card"]'); },
    `!!document.querySelector('[data-hook="alerts-card"]')
     && !!document.querySelector('[data-hook="cadence-radio-group"]')
     && !!document.querySelector('[data-hook="recipients-list"]')`,
    "Email alerts: on or off, as they arrive or once a day, only negative / only positive / everything, and up to five addresses on the DS InputList. This is the legacy feature the UX audit explicitly left out of its prototype."],
  ["settings-05-alerts-off", "settings", async (p) => {
    await scrollToHook(p, '[data-hook="alerts-card"]');
    await press(p, '[data-hook="alerts-switch"]');
    await wait(600);
  },
    `!!document.querySelector('[data-hook="alerts-off"]')
     && !document.querySelector('[data-hook="cadence-radio-group"]')`,
    "Off collapses the section to one sentence rather than leaving four disabled controls on screen. A disabled control still reads as a setting somebody has to understand."],
  ["settings-06-sharing", "settings", async (p) => { await scrollToHook(p, '[data-hook="sharing-card"]'); },
    `!!document.querySelector('[data-hook="sharing-card"]')
     && !!document.querySelector('[data-hook="share-url-input"]')
     && !!document.querySelector('[data-hook="white-label-switch"]')`,
    "The public share link and the white-label switch. Agencies send this to their clients, so removing BrightLocal's branding is off by default rather than on."],
  ["settings-07-history", "settings", async (p) => { await scrollToHook(p, '[data-hook="history-card"]'); },
    `!!document.querySelector('[data-hook="history-table"]')
     && !!document.querySelector('[data-hook="run-r4-state"]')
     && !!document.querySelector('[data-hook="history-note"]')`,
    "Run history, including the run that only partly succeeded. The brief names unexplained failures as the recurring support theme, so the one row that did not finish says what happened and offers the fix."],

  // ── Review Builder ─────────────────────────────────────────────────────
  // REWRITTEN 7 Sep 2026 for the RAIL version (dmt094j963aye), then widened
  // the same day to EVERY STATE (Ali: "capture every state, or at least as
  // many as we need to accurately represent each main screen and all copy
  // used in the product"). Built from the source: each state exists to put
  // one piece of copy on screen, and the caption says which.
  //
  // Seed ids, read not guessed: c2 kiosk (stars), c3 SMS (thumbs), c4 Draft
  // (SMS), c5 Ended (email), c6 Scheduled (email, stars), c7 Live (email,
  // review only), c9 Live (web link). c1 and c8 are the NPS campaigns and
  // their pages BLANK the sandbox with "ReferenceError: Badge is not
  // defined" (probed 7 Sep); so does the All feedback tab on any page. Those
  // surfaces (NPS gauge, feedback table, feedback drawer) have no state here
  // until the screen is fixed; see the capture report.
  ["getreviews-01-hub", "getreviews", async () => {},
    `(() => {
       if (!document.querySelector('[data-hook="campaign-c1-open"]')) return false;
       for (const h of ["campaign-status-filter", "campaign-type-filter", "campaign-mode-filter"]) {
         if (!document.querySelector('[data-hook="' + h + '"]')) return false;
       }
       if (document.querySelector('[data-hook="campaign-tabs"]')) return false;
       return document.querySelectorAll('tbody tr').length >= 9;
     })()`,
    "The hub: the campaigns table with every status pill, and the three facet triggers reading All statuses / All types / All modes. The pager under the table is the only count on the page, so it cannot disagree with the rows above it."],
  ["getreviews-02-hub-status-facet", "getreviews", async (p) => {
    await press(p, '[data-hook="campaign-status-filter"]');
    await wait(700);
    await blur(p);
  },
    `!!document.querySelector('[data-hook="campaign-status-filter-command"]')
     && ["Draft", "Scheduled", "Live", "Ended"].every((s) => !!document.querySelector('[data-hook="campaign-status-filter-' + s + '"]'))`,
    "The status facet open: All statuses plus the four status names."],
  ["getreviews-03-hub-type-facet", "getreviews", async (p) => {
    await press(p, '[data-hook="campaign-type-filter"]');
    await wait(700);
    await blur(p);
  },
    `!!document.querySelector('[data-hook="campaign-type-filter-command"]')
     && !!document.querySelector('[data-hook="campaign-type-filter-nps"]')`,
    "The type facet open: All types and the four ask types with their icons (NPS, Star rating, Thumbs up or down, Review only)."],
  ["getreviews-04-hub-mode-facet", "getreviews", async (p) => {
    await press(p, '[data-hook="campaign-mode-filter"]');
    await wait(700);
    await blur(p);
  },
    `!!document.querySelector('[data-hook="campaign-mode-filter-command"]')
     && !!document.querySelector('[data-hook="campaign-mode-filter-kiosk"]')`,
    "The mode facet open: All modes and the four modes with their icons (Email, SMS, Kiosk, Web link)."],
  ["getreviews-05-hub-filtered-ended", "getreviews", async (p) => {
    await press(p, '[data-hook="campaign-status-filter"]');
    await wait(700);
    await press(p, '[data-hook="campaign-status-filter-Ended"]');
    await wait(500);
    await escape(p);
    await blur(p);
  },
    `(() => {
       if (document.querySelector('[data-hook="campaign-status-filter-command"]')) return false;
       const t = document.querySelector('[data-hook="campaign-status-filter"]');
       if (!t || t.textContent.trim() !== "Ended") return false;
       const rows = [...document.querySelectorAll('tbody tr')];
       // No count by the title since 17 Sep (Ali: "we have pagination"), so
       // the two Ended rows are the check.
       return rows.length === 2;
     })()`,
    "Filtered to Ended: the trigger reads the chosen status and the table and its pager drop to the two Ended campaigns."],

  // THE ROW MENU, once per distinct item set. Rename, Re-use as new campaign
  // and Save as template are on every row; the rest depend on mode or status.
  ["getreviews-06-row-menu-live", "getreviews", async (p) => {
    await press(p, '[data-hook="campaign-c7-menu-button"]');
    await wait(700);
  },
    `["Rename", "Re-use as new campaign", "Save as template", "Stop campaign"].every((t) =>
       [...document.querySelectorAll('[role="menuitem"]')].some((m) => m.textContent.trim() === t))`,
    "A Live email row's overflow: Rename, Re-use as new campaign, Save as template, and Stop campaign below the rule."],
  ["getreviews-07-row-menu-kiosk", "getreviews", async (p) => {
    await press(p, '[data-hook="campaign-c2-menu-button"]');
    await wait(700);
  },
    `[...document.querySelectorAll('[role="menuitem"]')].some((m) => m.textContent.trim() === "Open kiosk")`,
    "A kiosk row's overflow adds Open kiosk at the top."],
  ["getreviews-08-row-menu-link", "getreviews", async (p) => {
    await press(p, '[data-hook="campaign-c9-menu-button"]');
    await wait(700);
  },
    `[...document.querySelectorAll('[role="menuitem"]')].some((m) => m.textContent.trim() === "Copy link")`,
    "A web link row's overflow adds Copy link at the top."],
  ["getreviews-09-row-menu-scheduled", "getreviews", async (p) => {
    await press(p, '[data-hook="campaign-c6-menu-button"]');
    await wait(700);
  },
    `[...document.querySelectorAll('[role="menuitem"]')].some((m) => m.textContent.trim() === "Cancel send")`,
    "A Scheduled row's overflow says Cancel send where a Live row says Stop campaign."],
  ["getreviews-10-row-menu-ended", "getreviews", async (p) => {
    await press(p, '[data-hook="campaign-c5-menu-button"]');
    await wait(700);
  },
    `[...document.querySelectorAll('[role="menuitem"]')].some((m) => m.textContent.trim() === "Restart campaign")`,
    "An Ended row's overflow offers Restart campaign and no Stop."],
  ["getreviews-11-row-menu-draft", "getreviews", async (p) => {
    await press(p, '[data-hook="campaign-c4-menu-button"]');
    await wait(700);
  },
    `[...document.querySelectorAll('[role="menuitem"]')].some((m) => m.textContent.trim() === "Delete draft")`,
    "A Draft row's overflow ends with Delete draft, the only row that can be deleted."],
  ["getreviews-12-delete-draft-confirm", "getreviews", async (p) => {
    await press(p, '[data-hook="campaign-c4-menu-button"]');
    await wait(700);
    await pressText(p, "Delete draft", '[role="menuitem"]');
    await wait(900);
  },
    `!!document.querySelector('[data-hook="delete-title"]')
     && /never been sent/.test(document.querySelector('[data-hook="delete-desc"]').textContent)`,
    "The delete-draft dialog: the quoted name, the sentence that nothing has been sent, Keep it and Delete draft."],

  // ONE PAGE PER STATUS, plus the two feedback summaries that render.
  ["getreviews-13-page-live", "getreviews", async (p) => { await campaignPage(p, "c7"); },
    `(() => {
       for (const h of ["insights-stop", "insights-preview", "insights-download", "insights-summary-card"]) {
         if (!document.querySelector('[data-hook="' + h + '"]')) return false;
       }
       return !document.querySelector('[data-hook="state-banner"]') && !document.querySelector('[role="dialog"]');
     })()`,
    "A Live email campaign: Stop campaign, Preview and Download in the header, the Results stat row and the funnel with its stage labels, and no banner."],
  ["getreviews-14-page-scheduled", "getreviews", async (p) => { await campaignPage(p, "c6"); },
    `(() => {
       const stop = document.querySelector('[data-hook="insights-stop"]');
       return !!document.querySelector('[data-hook="state-banner"]') && !!stop && stop.textContent.trim() === "Cancel send"
         && !!document.querySelector('[data-hook="insights-empty"]');
     })()`,
    "Scheduled: the info banner about nothing having been sent yet, Cancel send in the header, zeros in the stat row and the No activity yet card."],
  ["getreviews-15-page-ended", "getreviews", async (p) => { await campaignPage(p, "c5"); },
    `!!document.querySelector('[data-hook="state-banner"]')
     && !!document.querySelector('[data-hook="insights-restart"]')
     && !document.querySelector('[data-hook="insights-stop"]')`,
    "Ended: the banner saying the numbers are final and to re-use it, Restart in the header instead of Stop."],
  // SCROLLED TO THE FEEDBACK CARD: it sits below the 900px fold, and a
  // predicate that only asks whether it exists shot the funnel instead.
  ["getreviews-16-page-kiosk-stars", "getreviews", async (p) => {
    await campaignPage(p, "c2");
    await waitForHook(p, '[data-hook="insights-feedback-summary"]');
    // parkCard, not a pixel offset: it measures the sticky band off the card
    // and puts the card's top just under it, so the title and its "Only
    // visible to you" note clear the header (8 Sep sweep) without leaving a
    // strip of the Timeline card above, wearing its own pinned header.
    await parkCard(p, '[data-hook="insights-feedback-summary"]');
  },
    `!!document.querySelector('[data-hook="insights-feedback-summary"]')
     && !!document.querySelector('[data-hook="dist-5"]')
     && !!document.querySelector('[data-hook="insights-sessions"]')`,
    "A kiosk campaign asking for stars, scrolled to the Internal feedback card: the star distribution and its Only visible to you note, under a stat row that counts Sessions rather than Sent."],
  ["getreviews-17-page-sms-thumbs", "getreviews", async (p) => {
    await campaignPage(p, "c3");
    await waitForHook(p, '[data-hook="insights-feedback-summary"]');
    await parkCard(p, '[data-hook="insights-feedback-summary"]');
  },
    `!!document.querySelector('[data-hook="insights-feedback-summary"]')
     && !!document.querySelector('[data-hook="thumbs-up"]')
     && !!document.querySelector('[data-hook="insights-recent-feedback"]')`,
    "An SMS campaign asking thumbs up or down: the thumbs split in Internal feedback and the Recent feedback card with its View all button."],
  ["getreviews-18-stop-confirm", "getreviews", async (p) => { await campaignPage(p, "c7", "insights-stop"); },
    `!!document.querySelector('[data-hook="stop-title"]')`,
    "The stop dialog: the quoted name, the links-stop-working sentence, Keep it live and Stop campaign."],
  ["getreviews-19-restart-confirm", "getreviews", async (p) => { await campaignPage(p, "c5", "insights-restart"); },
    `!!document.querySelector('[data-hook="restart-title"]')`,
    "The restart dialog: nobody is sent anything, the links work again, Leave it stopped and Restart campaign."],
  ["getreviews-20-download-dialog", "getreviews", async (p) => { await campaignPage(p, "c7", "insights-download"); },
    `!!document.querySelector('[data-hook="download-title"]') && !!document.querySelector('[data-hook="download-pdf"]')`,
    "The Download dialog: what CSV and PDF each give you, the testimonials permission count, and the two buttons."],

  // THE CUSTOMER VIEW, every page it can open on.
  ["getreviews-21-customer-review-page", "getreviews", async (p) => {
    await campaignPage(p, "c7", "insights-preview");
    await waitForHook(p, '[data-hook="customer-preview-drawer"]');
    await wait(600);
  },
    `(() => {
       const t = document.querySelector('[data-hook="customer-preview-header-title"]');
       return !!t && t.textContent.trim() === "Customer view"
         && !!document.querySelector('[data-hook="customer-preview-drawer"] [data-hook^="customer-site-"]');
     })()`,
    "Customer view on a review-only campaign: the review page with its invitation wording and the Review us on Google button, and the footer line calling it a preview of what the customer sees."],
  // c3 (thumbs), NOT c6 or c2 (stars): the interactive star control in the
  // drawer throws "ReferenceError: Star is not defined" and blanks the
  // sandbox (probed 7 Sep 2026). Thumbs is the one feedback type whose
  // customer page renders, so it carries the feedback-page copy.
  ["getreviews-22-customer-feedback-page", "getreviews", async (p) => {
    await campaignPage(p, "c3", "insights-preview");
    await waitForHook(p, '[data-hook="customer-submit"]');
    await wait(600);
  },
    `!!document.querySelector('[data-hook="customer-preview-drawer"] [data-hook="customer-submit"]')
     && !!document.querySelector('[data-hook="customer-consent-label"]')`,
    "Customer view on a feedback-first campaign opens on the feedback page: the question, the thumbs choice, the follow-up question, the permission tick box and Send feedback."],
  ["getreviews-23-customer-review-invitation", "getreviews", async (p) => {
    await campaignPage(p, "c3", "insights-preview");
    await waitForHook(p, '[data-hook="customer-submit"]');
    await wait(400);
    await press(p, '[data-hook="customer-submit"]');
    await wait(800);
  },
    `!!document.querySelector('[data-hook="restart-customer-preview"]')
     && !document.querySelector('[data-hook="customer-submit"]')`,
    "After Send feedback the drawer moves to the review invitation page, and Start again appears in the footer."],
  ["getreviews-24-customer-expired", "getreviews", async (p) => {
    await campaignPage(p, "c5", "insights-preview");
    await waitForHook(p, '[data-hook="customer-preview-drawer"]');
    await wait(600);
  },
    `/This request has expired/.test(document.querySelector('[data-hook="customer-preview-drawer"]').innerText)`,
    "Preview on an Ended campaign opens on the expired-link page and its two sentences."],
  // 25 IS DELIBERATELY VACANT. Kiosk view (the drawer titled "Kiosk view"
  // with the tablet sentence in its footer) opens the star-rating feedback
  // page, and the only kiosk campaign (c2) asks for stars, so it hits the
  // "Star is not defined" crash above. Reinstate as campaignPage(p, "c2",
  // "insights-preview") asserting the header title once the screen is fixed.

  // THE CAMPAIGN SETTINGS PAGE AND THE SEND PATH.
  ["getreviews-26-draft-settings", "getreviews", async (p) => {
    await press(p, '[data-hook="campaign-c4-open"]');
    await waitForHook(p, '[data-hook="setup-card"]');
    await wait(600);
  },
    `!!document.querySelector('[data-hook="setup-card"]')
     && !!document.querySelector('[data-hook="setup-channel"]')
     && !document.querySelector('[data-hook="template-rail"]')`,
    "A Draft reopens on the campaign settings page: Review campaign as the header, the four settings rows, Review and send, and Start from a template underneath."],
  ["getreviews-27-new-campaign", "getreviews", async (p) => { await newCampaignTo(p, "setup"); },
    `!!document.querySelector('[data-hook="setup-card"]')
     && /Untitled campaign/.test(document.querySelector('[data-hook="campaign-page-header"]').innerText)`,
    "New campaign: the same settings page with Untitled campaign in the header and the rating-first switch on by default."],
  ["getreviews-28-pick-template", "getreviews", async (p) => {
    await newCampaignTo(p, "setup");
    await press(p, '[data-hook="setup-template"]');
    await wait(900);
  },
    `!!document.querySelector('[data-hook="template-t1"]')
     && /Pick a template/.test(document.querySelector('[data-hook="wizard-step-title"]').textContent)`,
    "Start from a template: the Pick a template step, its sub line, and one row per template with its ask type."],
  // 29 IS DELIBERATELY VACANT. Expanding a template row on the Pick a
  // template step (its summary rows and Use this template) throws
  // "TypeError: Cannot read properties of undefined (reading 'map')" in
  // campaignSummary and blanks the sandbox (probed 7 Sep 2026). Reinstate as
  // press template-t1 asserting template-t1-use once the screen is fixed.
  ["getreviews-30-leave-dialog", "getreviews", async (p) => {
    await newCampaignTo(p, "setup");
    await press(p, '[data-hook="setup-cancel"]');
    await wait(900);
  },
    `!!document.querySelector('[data-hook="leave-title"]') && !!document.querySelector('[data-hook="cancel-yes"]')`,
    "Close on the settings page: the leave dialog and its two buttons."],
  ["getreviews-31-recipients-email", "getreviews", async (p) => { await newCampaignTo(p, "recipients"); },
    `!!document.querySelector('[data-hook="audience-field"]')
     && !!document.querySelector('[data-hook="contacts-upload"]')
     && !document.querySelector('[data-hook="country-field"]')`,
    "Who should we send this to, for email: the One person / A list choice and the CSV dropzone with its wording."],
  ["getreviews-32-recipients-one-person", "getreviews", async (p) => {
    await newCampaignTo(p, "recipients");
    await press(p, '[data-hook="audience-one-label"]');
    await wait(600);
  },
    `!!document.querySelector('[data-hook="one-contact"]') && !document.querySelector('[data-hook="contacts-upload"]')`,
    "One person chosen: the single address field and its description replace the dropzone."],
  ["getreviews-33-recipients-error", "getreviews", async (p) => {
    await newCampaignTo(p, "recipients");
    await press(p, '[data-hook="wizard-next"]');
    await wait(700);
  },
    `/Upload a CSV file to continue/.test(document.querySelector('[data-hook="step-issue"]').textContent)`,
    "Next with nothing uploaded: the Upload a CSV file to continue error in the footer slot."],
  ["getreviews-34-recipients-sms", "getreviews", async (p) => { await draftToRecipients(p); },
    `!!document.querySelector('[data-hook="country-field"]') && !!document.querySelector('[data-hook="buy-credits"]')`,
    "The SMS version of recipients: the country choice with credits per text, the balance line and Buy credits."],
  ["getreviews-35-credits-packages", "getreviews", async (p) => {
    await draftToRecipients(p);
    await press(p, '[data-hook="buy-credits"]');
    await wait(900);
    await blur(p);
  },
    `!!document.querySelector('[data-hook="credits-title"]') && !!document.querySelector('[data-hook^="credits-buy-"]')`,
    "The credits dialog: the packages, each with its price and a Buy button."],
  ["getreviews-36-credits-checkout", "getreviews", async (p) => {
    await draftToRecipients(p);
    await press(p, '[data-hook="buy-credits"]');
    await wait(900);
    await press(p, '[data-hook^="credits-buy-"]');
    await wait(800);
    await blur(p);
  },
    `!!document.querySelector('[data-hook="checkout-title"]') && !!document.querySelector('[data-hook="checkout-pay"]')`,
    "Checkout: the card fields, Back and Pay."],
  ["getreviews-37-credits-paid", "getreviews", async (p) => {
    await draftToRecipients(p);
    await press(p, '[data-hook="buy-credits"]');
    await wait(900);
    await press(p, '[data-hook^="credits-buy-"]');
    await wait(800);
    await press(p, '[data-hook="checkout-pay"]');
    await wait(1200);
    await blur(p);
  },
    `!!document.querySelector('[data-hook="paid-title"]')`,
    "Paid: the confirmation copy and the new balance."],
  ["getreviews-38-columns", "getreviews", async (p) => { await newCampaignTo(p, "columns"); },
    `!!document.querySelector('[data-hook="csv-map-table"]') && !!document.querySelector('[data-hook="header-row"]')`,
    "Map your columns: the header row switch, the guessed mapping per column and Confirm as the footer action."],
  ["getreviews-39-check", "getreviews", async (p) => { await newCampaignTo(p, "check"); },
    `!!document.querySelector('[data-hook="toggle-exclusions"]') && !!document.querySelector('[data-hook="confirm-permission-label"]')`,
    "Check your list: rows in and people out, Show the rows we left out, and the two confirmations."],
  ["getreviews-40-check-exclusions", "getreviews", async (p) => {
    await newCampaignTo(p, "check");
    await press(p, '[data-hook="toggle-exclusions"]');
    await wait(600);
  },
    `/Hide the rows we left out/.test(document.querySelector('[data-hook="toggle-exclusions"]').textContent)`,
    "The left-out rows expanded, each with its reason, under Hide the rows we left out."],
  ["getreviews-41-check-error", "getreviews", async (p) => {
    await newCampaignTo(p, "check");
    await press(p, '[data-hook="wizard-next"]');
    await wait(700);
  },
    `/tick both confirmations/.test(document.querySelector('[data-hook="step-issue"]').textContent)`,
    "Next without the confirmations: Please tick both confirmations to continue."],
  ["getreviews-42-send", "getreviews", async (p) => { await newCampaignTo(p, "send"); },
    `!!document.querySelector('[data-hook="preview-as-customer"]') && !!document.querySelector('[data-hook="preview-tile-email"]')`,
    "Ready to send: the summary rows, the contact sheet of every customer page, Preview as a customer, and Send now in the footer."],
  ["getreviews-43-send-preview-full", "getreviews", async (p) => {
    await newCampaignTo(p, "send");
    await press(p, '[data-hook="preview-tile-email"]');
    await wait(900);
  },
    `(() => { const t = document.querySelector('[data-hook="preview-full-title"]'); return !!t && t.textContent.trim() === "Email"; })()`,
    "A contact-sheet tile opened full size: the Email dialog and its description line."],
  ["getreviews-44-send-confirm", "getreviews", async (p) => { await newCampaignTo(p, "confirm"); },
    `!!document.querySelector('[data-hook="send-confirm-title"]')`,
    "Send now asks once: the confirm dialog with the headcount and its two buttons."],
  // 45 IS DELIBERATELY VACANT. The email "sent" card cannot be shot: Send now
  // blanks the sandbox with "ReferenceError: sendCount is not defined"
  // (SuccessView reads a wizard-scope variable; probed 7 Sep 2026). The
  // kiosk success below survives because its branch never reaches that
  // read. Reinstate as `newCampaignTo(p, "success")` asserting
  // `wizard-success` + `success-insights` once the screen is fixed.
  ["getreviews-46-go-live-link", "getreviews", async (p) => { await newCampaignTo(p, "golive", { channel: "Web link" }); },
    `!!document.querySelector('[data-hook="link-note"]')
     && /Ready to go live/.test(document.querySelector('[data-hook="wizard-step-title"]').textContent)`,
    "A web link campaign skips the audience: Ready to go live, the link note, and Put live as the action."],
  ["getreviews-47-launch-kiosk", "getreviews", async (p) => { await newCampaignTo(p, "golive", { channel: "Kiosk" }); },
    `/Ready to launch the kiosk/.test(document.querySelector('[data-hook="wizard-step-title"]').textContent)`,
    "A kiosk campaign's last step is titled Ready to launch the kiosk, with Launch kiosk as the action."],
  ["getreviews-48-kiosk-live", "getreviews", async (p) => {
    await newCampaignTo(p, "golive", { channel: "Kiosk" });
    await press(p, '[data-hook="wizard-next"]');
    await wait(1400);
  },
    `!!document.querySelector('[data-hook="wizard-success"]') && !!document.querySelector('[data-hook="success-open-kiosk"]')`,
    "Your kiosk is live: the kiosk address and the Open kiosk button."],

  // TEMPLATES.
  ["getreviews-49-templates", "getreviews", async (p) => {
    await press(p, '[data-hook="open-templates"]');
    await waitForHook(p, '[data-hook="templates-table"]');
    await wait(500);
  },
    `!!document.querySelector('[data-hook="templates-table"]') && !!document.querySelector('[data-hook="new-template"]')`,
    "The Templates page: its header line, the table with Create campaign per row, and New template."],
  ["getreviews-50-template-row-menu", "getreviews", async (p) => {
    await press(p, '[data-hook="open-templates"]');
    await waitForHook(p, '[data-hook="template-t1-menu-button"]');
    await wait(400);
    await press(p, '[data-hook="template-t1-menu-button"]');
    await wait(700);
  },
    `["Edit template", "Duplicate", "Delete template"].every((t) =>
       [...document.querySelectorAll('[role="menuitem"]')].some((m) => m.textContent.trim() === t))`,
    "A template row's overflow: Edit template, Duplicate, and Delete template below the rule."],
  ["getreviews-51-delete-template-confirm", "getreviews", async (p) => {
    await press(p, '[data-hook="open-templates"]');
    await waitForHook(p, '[data-hook="template-t1-menu-button"]');
    await wait(400);
    await press(p, '[data-hook="template-t1-menu-button"]');
    await wait(700);
    await pressText(p, "Delete template", '[role="menuitem"]');
    await wait(900);
  },
    `!!document.querySelector('[data-hook="delete-title"]')
     && /cannot be recovered/.test(document.querySelector('[data-hook="delete-desc"]').textContent)`,
    "The delete-template dialog: campaigns already made are not affected, Keep it and Delete template."],
  ["getreviews-52-new-template", "getreviews", async (p) => {
    await press(p, '[data-hook="open-templates"]');
    await waitForHook(p, '[data-hook="new-template"]');
    await wait(400);
    await press(p, '[data-hook="new-template"]');
    await waitForHook(p, '[data-hook="template-rail"]');
    await wait(600);
  },
    `!!document.querySelector('[data-hook="template-rail"]')
     && /Untitled template/.test(document.querySelector('[data-hook="template-page-header"]').innerText)`,
    "New template: the editor with Untitled template in the header and Save template as the action."],
  ["getreviews-53-template-general", "getreviews", async (p) => { await templateEditor(p, "general"); },
    `!!document.querySelector('[data-hook="template-tab-general"][aria-selected="true"]')
     && !!document.querySelector('[data-hook="template-basics"]')
     && !document.querySelector('[data-hook="setup-channel"]')`,
    "Editing a template, General: the five rail items with their sub lines, the name, rating-first, rating type, logo and accent colour rows."],
  ["getreviews-54-template-message-email", "getreviews", async (p) => { await templateEditor(p, "invite"); },
    `!!document.querySelector('[data-hook="template-tab-invite"][aria-selected="true"]')
     && !!document.querySelector('[data-hook="preview-frame-invite"] [data-hook="email-preview-rule"]')`,
    // TALL: the previewed email runs past 900 and the legal footer, which is
    // the last line of it, fell off the bottom of the frame.
    "Message: the card hint, the Email / Text message toggle, and the email previewed with its subject, body, scale and legal footer.",
    { tall: true }],
  ["getreviews-55-template-message-sms", "getreviews", async (p) => {
    await templateEditor(p, "invite");
    await press(p, '[data-hook="preview-channel-sms"]');
    await wait(600);
  },
    `!!document.querySelector('[data-hook="preview-frame-invite"] [data-hook="sms-preview-bubble"]')`,
    "The same message as a text: one bubble with the short link and the Reply STOP line."],
  ["getreviews-56-template-message-sheet", "getreviews", async (p) => {
    await templateEditor(p, "invite");
    await press(p, '[data-hook="template-edit-invite"]');
    await waitForHook(p, '[data-hook="section-sheet"]');
    await wait(900);
  },
    `(() => {
       const t = document.querySelector('[data-hook="section-sheet-header-title"]');
       return !!t && t.textContent.trim() === "Message" && !!document.querySelector('[data-hook="field-subject"]');
     })()`,
    // TALL: the sheet's two groups are taller than the sheet at 900, so The
    // reminder's textarea and helper sat under the Done footer.
    "The Message sheet: The message and The reminder groups, each field with its helper sentence, and Done.",
    { tall: true }],
  ["getreviews-57-template-message-sheet-sms-override", "getreviews", async (p) => {
    await templateEditor(p, "invite");
    await press(p, '[data-hook="template-edit-invite"]');
    await waitForHook(p, '[data-hook="section-sheet"]');
    await wait(900);
    await press(p, '[data-hook="template-smsOverride"]');
    await wait(600);
  },
    `!!document.querySelector('[data-hook="field-smsText"]')`,
    // TALL: same sheet as 56 with one more field in it, so it overflows by
    // more, not less.
    "Word it differently in a text message switched on: the Text message wording field and its helper appear.",
    { tall: true }],
  ["getreviews-58-template-rating", "getreviews", async (p) => { await templateEditor(p, "rate"); },
    `!!document.querySelector('[data-hook="template-tab-rate"][aria-selected="true"]')
     && !!document.querySelector('[data-hook="preview-frame-rate"]')`,
    "Rating question: the card hint and the feedback page previewed with its question, scale, follow-up and permission box."],
  ["getreviews-59-template-rating-sheet", "getreviews", async (p) => {
    await templateEditor(p, "rate");
    await press(p, '[data-hook="template-edit-rate"]');
    await waitForHook(p, '[data-hook="section-sheet"]');
    await wait(900);
  },
    `(() => {
       const t = document.querySelector('[data-hook="section-sheet-header-title"]');
       return !!t && t.textContent.trim() === "Rating question" && !!document.querySelector('[data-hook="field-feedbackQuestion"]');
     })()`,
    "The Rating question sheet: Question and Follow-up question with their helper sentences."],
  ["getreviews-60-template-review", "getreviews", async (p) => { await templateEditor(p, "review"); },
    `!!document.querySelector('[data-hook="template-tab-review"][aria-selected="true"]')
     && !!document.querySelector('[data-hook="preview-note-review"]')`,
    "Public review: the card hint, the review page preview, and the note that review sites are chosen on the campaign."],
  ["getreviews-61-template-review-sheet", "getreviews", async (p) => {
    await templateEditor(p, "review");
    await press(p, '[data-hook="template-edit-review"]');
    await waitForHook(p, '[data-hook="section-sheet"]');
    await wait(900);
  },
    `(() => {
       const t = document.querySelector('[data-hook="section-sheet-header-title"]');
       return !!t && t.textContent.trim() === "Public review" && !!document.querySelector('[data-hook="field-invite"]');
     })()`,
    "The Public review sheet: Wording above the buttons and Button label with the {{site}} hint."],
  ["getreviews-62-template-contact", "getreviews", async (p) => { await templateEditor(p, "identify"); },
    `!!document.querySelector('[data-hook="template-tab-identify"][aria-selected="true"]')
     && !!document.querySelector('[data-hook="preview-frame-identify"]')`,
    "Contact details: the card hint about public links and the name / email / permission form previewed."],
  ["getreviews-63-template-contact-sheet", "getreviews", async (p) => {
    await templateEditor(p, "identify");
    await press(p, '[data-hook="template-edit-identify"]');
    await waitForHook(p, '[data-hook="section-sheet"]');
    await wait(900);
  },
    `(() => {
       const t = document.querySelector('[data-hook="section-sheet-header-title"]');
       return !!t && t.textContent.trim() === "Contact details" && !!document.querySelector('[data-hook="field-contactIntro"]');
     })()`,
    "The Contact details sheet: Wording above the form, Ask permission to quote them, and Permission wording."],
  ["getreviews-64-template-narrow", "getreviews", async (p) => { await templateEditor(p, "general"); },
    `!!document.querySelector('[data-hook="template-next-section"]')`,
    "The template editor at 390 wide: the rail stacks above the card and the footer carries Back and Next between sections.",
    { width: 390 }],
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

// ── APP-MODE STATE CHANGES (17 Sep 2026) ─────────────────────────────────
// The app has moved on from the Studio screens these states were written for.
// In --app mode a state named here is REPLACED (drive / expect / note / opts),
// SKIPPED with the reason printed, and APP_EXTRA states are added for surfaces
// only the app has. Studio mode ignores all of this.
const scrollToText = (page, text) =>
  inFrame(page, (t) => {
    const el = [...document.querySelectorAll("[data-slot=card-title], h2, p")].find((e) => e.textContent.trim() === t);
    if (!el) return false;
    el.scrollIntoView({ block: "start" });
    return true;
  }, text);
// Open the first row on page one whose drawer says `needle`. The app's
// persona data is not the Studio seed, so a row index from the Studio suite
// points at a different review there.
async function openRowWith(page, needle) {
  for (let i = 0; i < 20; i += 1) {
    await openRow(page, i);
    await wait(600);
    const hit = await inFrame(page, (n) => (document.querySelector('[role="dialog"]')?.textContent ?? "").includes(n), needle);
    if (hit) return true;
    await escape(page);
    await wait(400);
  }
  return false;
}
const APP_OVERRIDES = {
  "templates-05-rule-activity": {
    // Expanded, then scrolled so the failed send is in frame: the app's page
    // is taller than the Studio screen and the Failed row sat half under the
    // bottom edge (capture sweep, 17 Sep).
    drive: async (p) => {
      await press(p, '[data-slot="collapsible-trigger"]');
      await wait(900);
      await inFrame(p, () => {
        const failed = [...document.querySelectorAll('[data-hook^="run-outcome-"]')].find((b) => b.textContent.trim() === "Failed");
        if (!failed) return false;
        failed.scrollIntoView({ block: "center" });
        return true;
      });
    },
  },
  "manager-07-readonly-source": {
    drive: async (p) => { await openRowWith(p, "cannot be sent from here"); },
    note: "A review on a site that cannot be replied to from here (Apple Maps in this data): no composer, no AI, no template picker, and no footer at all.",
  },
  "getreviews-43-send-preview-full": {
    // The tile is a div with an overlay button in the app (Builder audit, 10
    // Sep: a button cannot contain the page's own buttons), so press the overlay.
    drive: async (p) => {
      await newCampaignTo(p, "send");
      await press(p, '[data-hook="preview-tile-email"] > button');
      await wait(900);
    },
  },
  "manager-12-fail-permission-seeded": {
    // Reachable again since the demo failures are picked from the rows the
    // app renders rather than the Studio seed (20 Sep). The row is found by
    // what its drawer says, because its position moves with the data.
    drive: async (p) => { await openRowWith(p, "cannot reply to"); },
  },
  // DESKTOP ONLY FOR NOW (Ali, 20 Sep: "we don't really need to show any
  // mobile screenshots right now, let's stick to desktop"). The three narrow
  // states are the only ones that shoot at 390, and each exists because its
  // control appears ONLY on a phone, so there is no desktop frame to take
  // instead: the Order menu folds into the column headers from sm up, and the
  // two wizard rails put Back and Next in a footer only while stacked. They
  // are skipped rather than deleted, so a mobile pass is one line away.
  "manager-05-order-facet": {
    skip: "desktop only for now (Ali, 20 Sep); the Order menu exists on phones only, because from sm up the column headers sort",
  },
  "settings-02-directories": {
    expect: `!!document.querySelector('[data-hook="directories-card"]')
     && !document.querySelector('[data-hook="country-select"]')
     && !document.querySelector('[data-hook="directory-google-matched"]')`,
    note: "Monitored directories for the location's own country (the card's line under the title), with no country dropdown and no Matched badges: the directory API sends a name and a URL, not a status. Read only on Yelp, and Connect or Add URL where a row needs one.",
  },
  "widgets-37-settings-narrow": { skip: "desktop only for now (Ali, 20 Sep); this state is the 390 wide rail" },
  "getreviews-64-template-narrow": { skip: "desktop only for now (Ali, 20 Sep); this state is the 390 wide rail" },
  "settings-03-directories-uk": { skip: "the country dropdown is gone; the list is the location's country" },
  "settings-06-sharing": {
    expect: `!!document.querySelector('[data-hook="sharing-card"]')
     && !!document.querySelector('[data-hook="share-url-input"]')
     && !document.querySelector('[data-hook="white-label-switch"]')`,
    note: "The public share link with Copy. No white-label switch: a new-platform customer has no logo to put on the report.",
  },
  "settings-07-history": { skip: "run history was cut; Last run stays in the header" },
  "getreviews-14-page-scheduled": {
    expect: `(() => {
       const stop = document.querySelector('[data-hook="insights-stop"]');
       return !!stop && stop.textContent.trim() === "Cancel send"
         && !!document.querySelector('[data-hook="insights-empty-state"]')
         && !document.querySelector('[data-hook="state-banner"]')
         && !document.querySelector('[data-hook="insights-summary-card"]');
     })()`,
    note: "Scheduled: Cancel send in the header and ONE empty state, Nothing has been sent yet, in place of the banner, the zero tiles and a second No activity card.",
  },
  "getreviews-16-page-kiosk-stars": {
    note: "A kiosk campaign asking for stars, scrolled to its score card, Feedback ratings: the star distribution in neutral bars, with the chart/table switch.",
  },
  "getreviews-17-page-sms-thumbs": {
    expect: `!!document.querySelector('[data-hook="insights-feedback-summary"]')
     && !!document.querySelector('[data-hook="thumbs-up"]')
     && !!document.querySelector('[data-hook="all-feedback-card"]')`,
    note: "An SMS campaign asking thumbs up or down: the Thumbs up or down card, with Internal feedback, the table of responses, below it.",
  },
};
const APP_EXTRA = [
  // ZERO STATES, ON A BRAND NEW ACCOUNT (Margarita: they "are the default view
  // for every new customer"). ?persona=empty is the app's own switch, so the
  // state drives it rather than the run's seeded persona.
  ["templates-06-empty", "templates", async (p) => {
    await p.goto(`${APP_BASE}/locations/${APP_LOCATION}/reviews/manager/templates?persona=empty`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await wait(3000);
  },
    `!!document.querySelector('[data-hook="templates-empty-state"]')
     && !!document.querySelector('[data-hook="rules-empty-state"]')`,
    "Reply templates on a new account: no templates and no auto-reply rules, each list saying what it is for, with New template and New rule still in their section headers."],
  ["settings-08-running", "settings", async (p) => { await press(p, '[data-hook="run-now"]'); await wait(900); },
    `document.querySelector('[data-hook="run-now"]')?.getAttribute('aria-busy') === 'true'`,
    "Run report now, pressed: the button spins and says Running until the run is done. Last run stays under it. The schedule sentence says manual runs come out of the plan's allowance, with a link to what the plan includes."],
  ["settings-09-no-runs-left", "settings", async (p) => { await press(p, '[data-hook="run-now"]'); await wait(7000); await press(p, '[data-hook="run-now"]'); await wait(900); },
    `!!document.querySelector('[data-hook="run-rejected"]')`,
    "Run report now with no manual runs left: the run does not start, the warning says the schedule still stands, and See plans is the way to more runs. Last run moved to the manual run that finished."],
  ["getreviews-80-review-performance", "getreviews", async (p) => { await campaignPage(p, "c1"); await waitForHook(p, '[data-hook="insights-performance"]'); await parkCard(p, '[data-hook="insights-performance"]'); },
    `!!document.querySelector('[data-hook="insights-performance-donut"]')`,
    "Review performance for one campaign, the Tracker's display: ratings in neutral bars with DS stars and the average, Facebook as recommendations, and the sources donut with provider logos. All sources, All ratings and the chart/table switch in its sticky header."],
  ["getreviews-81-review-performance-table", "getreviews", async (p) => { await campaignPage(p, "c1"); await waitForHook(p, '[data-hook="insights-performance"]'); await parkCard(p, '[data-hook="insights-performance"]'); await press(p, '[data-hook="insights-performance-view-toggle"] [aria-label="Table view"]'); await wait(700); },
    `!!document.querySelector('[data-hook="insights-performance-ratings-table"]')`,
    "The same card in table view: Rating and Source tables with totals."],
  ["getreviews-82-timeline-table", "getreviews", async (p) => { await campaignPage(p, "c1"); await waitForHook(p, '[data-hook="insights-timeline"]'); await parkCard(p, '[data-hook="insights-timeline"]'); await press(p, '[data-hook="timeline-view-toggle"] [aria-label="Table view"]'); await wait(700); },
    `!!document.querySelector('[data-hook="insights-timeline-table"]')`,
    "Timeline in table view: each period and its reviews."],
  ["getreviews-83-nps", "getreviews", async (p) => { await campaignPage(p, "c1"); await waitForHook(p, '[data-hook="insights-feedback-summary"]'); await parkCard(p, '[data-hook="insights-feedback-summary"]'); },
    `!!document.querySelector('[data-hook="insights-nps-gauge"]')`,
    "Net Promoter Score: the dial drawn like the donut, 36 with score under it, Good, from 14 responses, and Promoters 9 to 10 / Passives 7 to 8 / Detractors 0 to 6 as shares."],
  ["getreviews-84-nps-table", "getreviews", async (p) => { await campaignPage(p, "c1"); await waitForHook(p, '[data-hook="insights-feedback-summary"]'); await parkCard(p, '[data-hook="insights-feedback-summary"]'); await press(p, '[data-hook="feedback-view-toggle"] [aria-label="Table view"]'); await wait(700); },
    `!!document.querySelector('[data-hook="insights-feedback-table"]')`,
    "Net Promoter Score in table view: each answer with responses and share, the total and the score."],
  ["getreviews-85-internal-feedback", "getreviews", async (p) => { await campaignPage(p, "c1"); await waitForHook(p, '[data-hook="all-feedback-card"]'); await parkCard(p, '[data-hook="all-feedback-card"]'); },
    `!!document.querySelector('[data-hook="feedback-table"]')`,
    "Internal feedback: the responses table on the campaign page, feedback first, the customer's email muted and truncated, the filters in the sticky header and pagination pinned under it."],
  ["getreviews-86-feedback-drawer", "getreviews", async (p) => { await campaignPage(p, "c1"); await waitForHook(p, '[data-hook="all-feedback-card"]'); await parkCard(p, '[data-hook="all-feedback-card"]'); await press(p, '[data-hook="feedback-row-2"]'); await wait(900); },
    `!!document.querySelector('[data-hook="feedback-drawer"]')`,
    "One response in the Review Manager's drawer: up / down and a count, Rating, Received, Review site and Testimonial, then the email and the feedback. No reply: internal feedback cannot be replied to."],
  // No insights-10 table state: insights-03-table-view already shoots the
  // Review performance table, and the sweep found the two frames identical.
  // THE ZERO INBOX and THE MOMENT AFTER A REPLY (Ali, 20 Sep). Both are
  // reached on the app's own switches: ?persona=empty for an account with
  // nothing connected, and a send on a row past the five seeded demo
  // failures, which go through first time.
  ["manager-21-empty", "manager", async (p) => {
    await p.goto(`${APP_BASE}/locations/${APP_LOCATION}/reviews/manager?persona=empty`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await wait(3000);
  },
    `!!document.querySelector('[data-hook="inbox-empty-state"]')`,
    "The inbox with nothing in it: what lands here and the two ways to start, with the tabs, filters and pager standing down because there is nothing to count."],
  ["manager-22-reply-sent", "manager", async (p) => { await sendOn(p, 12, 3200); },
    `!!document.querySelector('[data-hook="reply-sent-title"]')`,
    "The moment after a reply goes: what happened, how many are still waiting, the reply that was sent, and the way to the next one."],
  ["manager-20-sorted-by-rating", "manager", async (p) => { await press(p, '[data-hook="col-rating"] button, [data-hook="col-rating"]'); await wait(700); },
    `[...document.querySelectorAll('[data-hook="reviews-table"] thead th')].some((th) => th.getAttribute('aria-sort') === 'ascending')`,
    "The column headers are the DS sortable headers: Rating sorted, its arrow showing the direction."],
];

const browser = await chromium.launch({ headless: true });
const results = [];

const ALL_STATES = APP
  ? [
      ...STATES.flatMap((st) => {
          const o = APP_OVERRIDES[st[0]];
          if (!o) return [st];
          if (o.skip) { console.log(`  - ${st[0]} skipped in --app: ${o.skip}`); return []; }
          return [[st[0], st[1], o.drive ?? st[2], o.expect ?? st[3], o.note ?? st[4], o.opts ?? st[5]]];
        }),
      ...APP_EXTRA,
    ]
  : STATES;
const wanted = ALL_STATES.filter(([name]) => {
  if (ONLY.length && !ONLY.some((o) => name.includes(o))) return false;
  if (SECTIONS.length && !SECTIONS.some((sec) => name.startsWith(sec))) return false;
  return true;
});

// --app has no motion=off param to lean on, so ask for reduced motion instead:
// the DS honours it, and entrance animations are not caught mid-flight.
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, ...(APP ? { reducedMotion: "reduce" } : {}) });
if (APP) {
  // Seed the demo settings before every navigation, so each state boots on
  // the same persona, engine and insights setting.
  await page.addInitScript((s) => {
    try { localStorage.setItem("grade-bl-demo-v3", JSON.stringify(s)); } catch {}
  }, APP_SETTINGS);
}

for (const [name, screen, drive, expect, , opts] of wanted) {
  // An optional sixth element `{ width }` shoots the state NARROW (7 Sep:
  // the settings pages grow a Back / Next footer below lg, and that footer
  // is copy). 1280 otherwise, and the viewport is reset every state.
  const width = (opts && opts.width) || 1280;
  // `{ tall: true }` shoots THIS ONE STATE at whatever height its content
  // needs, instead of cropping it to 900 (20 Sep).
  //
  // WHY IT EXISTS. A 900px crop at scrollTop 0 is the right frame for almost
  // every state, and the run must stay that shape. But a handful of states
  // are a tall body inside a pinned shell (the template editor's email
  // preview, the Message sheet's reminder field), and the crop lands
  // mid-sentence. The screens are fine: the frame is what cuts them. Someone
  // reading the drop cannot tell those two apart, and reads a good screen as
  // a broken one, so those states say so here and come out whole.
  //
  // This is NOT --full. --full writes a SECOND file per state into full/,
  // leaving the cut frame as the one anybody looks at, and it shoots every
  // state tall whether or not it needs it. This replaces the frame, for the
  // named states only.
  const tall = !!(opts && opts.tall);
  try {
    await page.setViewportSize({ width, height: 900 });
    const url = APP
      ? `${APP_BASE}/locations/${APP_LOCATION}${APP_ROUTES[screen]}`
      : `${BASE}/e/${SCREENS[screen]}?w=${width}&motion=off`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {});
    // The sandbox compiles the screen after boot; a fixed settle is more
    // reliable here than waiting on a selector that differs per screen.
    await wait(APP ? 3500 : 7000);
    if (APP) {
      // ONE REAL CLICK FIRST, on the page title. PRESS dispatches synthetic
      // events, and with no trusted pointer input Chrome counts the focus a
      // menu or drawer moves on open as keyboard focus, so it drew its own
      // blue ring round the whole panel (capture sweep, 17 Sep: manager-03
      // to 05, 08 to 11, getreviews-23). A mouse user never sees that ring.
      const title = page.locator("h1").first();
      const safe = await title.evaluate((h) => !h.closest("button, a, label, [contenteditable='true']")).catch(() => false);
      const box = safe ? await title.boundingBox().catch(() => null) : null;
      if (box) await page.mouse.click(box.x + 4, box.y + box.height / 2);
    }
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
      // 24 rather than 12 (28 Aug): the FIRST state of a run pays for the
      // dev server compiling the /e/ route, and 7s settle + 6s of polling
      // was not always enough for it. widgets-01-list failed on a cold
      // browser and passed on a warm one, which is a flaky suite, not a
      // broken screen. 12 seconds of polling costs nothing on the states
      // that were already fine, because the loop exits on first success.
      const tries = transient ? 1 : 24;
      for (let i = 0; i < tries && !ok; i += 1) {
        ok = await inFrame(page, (src) => {
          try { return !!eval(src); } catch { return false; }
        }, expect).catch(() => false);
        if (!ok) await wait(500);
      }
      if (!ok) throw new Error("EXPECT FAILED: " + expect.slice(0, 70));
    }
    await page.evaluate(() => document.querySelectorAll("nextjs-portal").forEach((n) => n.remove())).catch(() => {});
    if (tall) {
      // Measured AFTER driving, because the thing that overflows is usually
      // the thing the drive opened. Nothing to grow is said out loud rather
      // than silently shooting 900 again: a state that asked to be tall and
      // came back cropped is a state whose content moved.
      const over = await measureOverflow(page);
      if (over < 40) {
        console.log(`    (no tall frame: ${name} does not scroll)`);
      } else {
        const height = Math.min(MAX_FULL_HEIGHT, 900 + over + 24);
        await page.setViewportSize({ width, height });
        await wait(2200); // charts and sticky headers re-lay out
        console.log(`    ↕ ${height}px`);
      }
    }
    const file = path.join(dirFor(name), `${name}.png`);
    await page.screenshot({ path: file, type: "png" });
    try { setPngRetinaDpi(file); } catch {}
    // `{ tall: true }` already shot the whole thing as the state's own frame,
    // so a full/ copy of it would be the same picture under a second name.
    if (FULL && !tall) {
      // A TALL CAPTURE MEANS GROWING THE VIEWPORT, not fullPage. See
      // measureOverflow for why fullPage hands back a 1280x900 that looks
      // like it worked. That is the exact shape of failure this suite keeps
      // finding.
      const over = await measureOverflow(page);

      // NOTHING TO EXTEND IS NOT A FAILURE. The wizards are h-screen with
      // overflow-hidden — pinned header, pinned footer, a middle that
      // scrolls — so their natural height IS 900 and a "full" file would be
      // a byte-identical copy of the cropped one under a second name.
      // Skipped, and said out loud, rather than written.
      if (over < 40) {
        console.log(`    (no tall capture: ${name} does not scroll)`);
      } else {
        const height = Math.min(MAX_FULL_HEIGHT, 900 + over + 80);
        await page.setViewportSize({ width, height });
        await wait(2200); // charts and sticky headers re-lay out
        const fullDir = path.join(dirFor(name), "full");
        fs.mkdirSync(fullDir, { recursive: true });
        const ffile = path.join(fullDir, `${name}.png`);
        await page.screenshot({ path: ffile, type: "png" });
        try { setPngRetinaDpi(ffile); } catch {}
        await page.setViewportSize({ width, height: 900 });
        await wait(600);
        console.log(`    + full ${height}px`);
      }
    }
    results.push({ name, ok: true });
    console.log(`  ✓ ${name}`);
  } catch (e) {
    // In --app mode keep what was on screen when a state failed, so the
    // failure can be read rather than guessed at. Not part of the drop.
    if (APP) {
      const failDir = path.join(DIR, "_failed");
      fs.mkdirSync(failDir, { recursive: true });
      await page.screenshot({ path: path.join(failDir, `${name}.png`), type: "png" }).catch(() => {});
    }
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
  const sec = sectionOf(name);
  if (!notesBySection.has(sec)) notesBySection.set(sec, []);
  notesBySection.get(sec).push({ name, note });
}
for (const [sec, rows] of notesBySection) {
  const md = [`# ${sec} — captured states`, "",
    "Generated by `scripts/capture-states.mjs`. Edit the note beside the state",
    "definition in that file, not this file, or the two will drift.", ""];
  for (const r of rows) md.push(`### ${r.name}`, "", r.note, "");
  fs.writeFileSync(path.join(dirFor(rows[0].name), `${sec}-NOTES.md`), md.join("\n"));
}
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} states captured`);
console.log(DIR);
await browser.close();
