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
// --only is a comma-separated list of SUBSTRINGS, any of which selects a
// state. A single name is the common case ("--only=inbox-04"); a list is
// what you want after a run to re-shoot just the frames that failed.
const ONLY = (arg("only", null) || "").split(",").map((x) => x.trim()).filter(Boolean);
// --section=reviewshub|inbox|insights|templates|widgets|getreviews|createwidget (repeatable, comma
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
const FIGMA_PAGE = {
  reviewshub: "Brightlocal - Review Hub",
  inbox: "Brightlocal - Review Inbox",
  insights: "Brightlocal - Review Insights",
  widgets: "Brightlocal - Review Widgets",
  createwidget: "Brightlocal - Review Widgets - Create Widgets",
  getreviews: "Brightlocal - Get Reviews",
  templates: "Brightlocal - Review Inbox - Reply Templates",
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
const DIR = path.join(OUT, `states-${stamp}`);
fs.mkdirSync(DIR, { recursive: true });

// Share tokens for the four RM screens plus Reply Templates.
// createwidget is the newest of them: widget CREATION left Review Widgets
// on 28 Aug and became its own screen (design dmtctjykv0feb) on the DS
// CentredLayout, so it needs its own token and its own section.
const SCREENS = {
  reviewshub: "dee5a983-be48-4f86-8c8f-e46f16b435dd",
  inbox: "a616bfc5-1806-4af8-9a9a-74b6a9173fbf",
  insights: "38f64dc2-383c-42d1-83b6-456bf254a4b1",
  templates: "55dd020f-d660-48bd-9d2c-1d2542a8b19f",
  widgets: "0609abbe-f208-4d91-858e-e5335f8cecbe",
  getreviews: "782021bd-1332-48b8-a22b-5316b520fc20",
  createwidget: "35af1f77-ff09-43ea-b86e-534568cfeb8f",
  // RM — Report Settings (dmtkj124xagqa), new 2 Sep. The configuration
  // surface behind Review Insights' Settings button, which was a dead
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

// Walk the GET REVIEWS campaign wizard to a named step, down a named
// BRANCH. The flow is DERIVED from two answers (ask and channel), so a
// step list is meaningless without them: the email branch is twelve
// steps, the link branch is five, and `sites` sits at a different index
// in each. `buildFlow` in the screen source is the authority; this
// mirrors it, and `CAMPAIGN_FLOWS` below must be kept in step with it.
//
// Ali, 2 Sep: "Wizards can be captured as one flow for each branch." One
// still per step per branch is what makes an incomplete wizard visible —
// a single frame of step one looked finished and was not.
const CAMPAIGN_FLOWS = {
  // feedback-first, email, with the reminder turned on
  email: {
    ask: "feedback",
    channel: "email",
    reminder: "yes",
    steps: ["name", "ask", "feedback", "channel", "email", "reminder", "reminder-design",
            "sites", "recipients", "columns", "check", "send"],
  },
  // straight to a public review, by text, no reminder
  sms: {
    ask: "review",
    channel: "sms",
    reminder: "no",
    steps: ["name", "ask", "channel", "sms", "reminder", "sites", "recipients",
            "columns", "check", "send"],
  },
  // feedback-first, web link. No message, no audience, no send.
  link: {
    ask: "feedback",
    channel: "link",
    steps: ["name", "ask", "feedback", "channel", "sites", "golive"],
  },
};

// A step is proved by a hook that exists ONLY on that step. `email` and
// `reminder-design` both render the email editor, so the reminder step is
// identified by `reminder-timing`, which the first email does not have.
const CAMPAIGN_PROOF = {
  name: '[data-hook="campaign-name-input"]',
  ask: '[data-hook="ask-radio-group"]',
  feedback: '[data-hook="feedback-type-field"]',
  channel: '[data-hook="channel-radio-group"]',
  email: '[data-hook="email-subject-input"]',
  sms: '[data-hook="sms-body-input"]',
  reminder: '[data-hook="reminder-radio-group"]',
  "reminder-design": '[data-hook="reminder-timing"]',
  sites: '[data-hook="site-add"]',
  recipients: '[data-hook="contacts-upload"]',
  columns: '[data-hook="csv-map-table"]',
  check: '[data-hook="toggle-exclusions"]',
  send: '[data-hook="preview-as-customer"]',
  golive: '[data-hook="link-note"]',
};

async function campaignWizardTo(page, branch, step) {
  const flow = CAMPAIGN_FLOWS[branch];
  if (!flow) throw new Error("unknown campaign branch: " + branch);
  const stop = flow.steps.indexOf(step);
  if (stop < 0) throw new Error(`step ${step} is not on the ${branch} branch`);

  await press(page, '[data-hook="new-campaign"]');
  await wait(900);
  // The start step advances from the footer, but only once an option is
  // picked: Next with nothing chosen sets an error and stays put.
  await press(page, '[data-hook="start-fresh-label"]');
  await wait(400);
  await press(page, '[data-hook="wizard-next"]');
  await wait(900);

  // A BRANCHING STEP MUST SHOW ITS ANSWER. Walking to `channel` stops
  // BEFORE the option is pressed, so the email branch's channel frame and
  // the link branch's channel frame were the same untouched radio group —
  // byte-identical files, both passing an assertion that only asks whether
  // the group exists. The frame is captioned as the branch, so it has to
  // show the branch: press this branch's answer on arrival.
  const answerFor = { ask: flow.ask, channel: flow.channel, reminder: flow.reminder };

  for (let i = 0; i < stop; i += 1) {
    const here = flow.steps[i];
    // The branching answers, and the two steps that need an input before
    // Next will move. Everything else is prefilled by the seed.
    if (here === "ask") await press(page, `[data-hook="ask-${flow.ask}-label"]`);
    if (here === "channel") await press(page, `[data-hook="channel-${flow.channel}-label"]`);
    if (here === "reminder") await press(page, `[data-hook="reminder-${flow.reminder}-label"]`);
    if (here === "recipients") {
      // SMS blocks on the country before it will look at the CSV: the
      // country sets the credit rate, so `validate()` refuses to move
      // without it ("Choose the country of your contacts first"). The
      // email branch has no country control at all.
      if (flow.channel === "sms") {
        await press(page, '[data-hook="country-USA-label"]');
        await wait(300);
      }
      await press(page, '[data-hook="contacts-upload"]');
    }
    // The last gate before Send: two confirmations that both default to
    // false, so Next on this step sets an error and stays put unless
    // they are ticked. This is why the two `send` frames failed on the
    // first run while every step before them passed.
    if (here === "check") {
      await press(page, '[data-hook="confirm-permission-label"]');
      await wait(250);
      await press(page, '[data-hook="confirm-privacy-label"]');
    }
    await wait(400);
    await press(page, '[data-hook="wizard-next"]');
    await wait(1000);
  }

  if (answerFor[step]) {
    await press(page, `[data-hook="${step}-${answerFor[step]}-label"]`);
    await wait(500);
  }
}

// Walk the CREATE WIDGET screen's wizard to a named step. Every state
// reloads the embed from scratch, so each one re-walks the chain rather
// than sharing a page. Driven by data-hook, never by pressText("Next"):
// the reviews step carries a DataTablePagination whose own control is
// also called Next, and a text lookup can pick the wrong one.
const WIDGET_WIZARD_STEPS = ["type", "reviews", "format", "design", "done"];
// `mode` is the branch: "feed" is a filter that keeps itself current,
// "picked" is a fixed set chosen by hand. They share four step ids but
// not their contents — the reviews step is an explainer plus filters on
// one and a selection table on the other — so both branches need frames
// (Ali, 2 Sep: "wizards can be captured as one flow for each branch").
async function widgetWizardTo(page, step, mode = "feed") {
  const stop = WIDGET_WIZARD_STEPS.indexOf(step);
  if (stop < 0) throw new Error("unknown widget wizard step: " + step);
  if (stop === 0) return;
  await press(page, `[data-hook="widget-mode-${mode}-label"]`);
  await wait(600);
  // ONE PRESS PER STEP CROSSED, and the gate for the step we are ON is
  // satisfied BEFORE that step's press — not on the one before it. The
  // first version guarded inside a `stop - 1` loop, so the last press
  // never got its gate: `format` (stop 2) tried to leave the reviews step
  // with nothing selected and stayed put, while `done` (stop 4) happened
  // to pass through the guard on an earlier iteration and worked. Two
  // states from the same walker disagreeing about whether the walker
  // works is exactly the failure this comment exists to prevent.
  for (let i = 0; i < stop; i += 1) {
    const here = WIDGET_WIZARD_STEPS[i];
    // HAND-PICKED BLOCKS ON AN EMPTY SELECTION: next() refuses with
    // "Choose at least one review to continue." The live-feed branch has
    // no such gate, because a filter matching nothing is still a valid
    // filter.
    if (here === "reviews" && mode === "picked") {
      const hooks = await inFrame(page, () =>
        [...document.querySelectorAll('[data-hook^="picker-select-"]')]
          .map((el) => el.getAttribute("data-hook"))
          .filter((h) => h !== "picker-select-all")
          .slice(0, 3),
      );
      for (const hook of hooks) {
        await press(page, `[data-hook="${hook}"]`);
        await wait(250);
      }
      await wait(400);
    }
    // The last step swaps Next for Save, and Save is what produces the
    // done state with the embed code.
    const last = i === stop - 1 && step === "done";
    await press(page, `[data-hook="widget-${last ? "save" : "next"}"]`);
    await wait(1000);
  }
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
  ["inbox-02-reply-panel", "inbox", async (p) => { await openRow(p, 6); }, expectComposer,
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

  // AI DRAFT QUOTA, all four steps. Rows 0, 2, 4 and 8 are all repliable
  // and still needing action, so each opens a composer. Row 10 is
  // deliberately NOT used: it arrives already failed, so its panel has no
  // composer and no AI button to read a counter from.
  ["inbox-10-ai-3-left", "inbox", async (p) => { await openRow(p, 0); },
    `/3 of 3 AI drafts left/.test(document.body.innerText)`,
    "Full AI allowance. The count sits under the composer as quiet helper text, not as a warning."],
  ["inbox-11-ai-2-left", "inbox", async (p) => {
    await spendAi(p, 0); await openRow(p, 2);
  }, `/2 of 3 AI drafts left/.test(document.body.innerText)`,
    "One draft spent. The counter only moves on a review's first AI use, so re-inserting on the same review is free."],
  ["inbox-12-ai-1-left", "inbox", async (p) => {
    await spendAi(p, 0); await spendAi(p, 2); await openRow(p, 4);
  }, `/1 of 3 AI drafts left/.test(document.body.innerText)`,
    "Last draft. Still helper text: the state that needs explaining is running out, not being close to it."],
  ["inbox-13-ai-used-up", "inbox", async (p) => {
    await spendAi(p, 0); await spendAi(p, 2); await spendAi(p, 4); await openRow(p, 8);
  }, `/No AI drafts left today/.test(document.body.innerText)`,
    "Allowance gone. This is the one state a person will want explained, so it escalates to an AlertInfo that says when it resets and what you can still do."],

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
    // Was a 6-tuple with a stray null in the note slot, so the runner's
    // [name, screen, , , note] destructure read null and this state was
    // the one row missing from templates-NOTES.md.
    `!!document.querySelector('[data-slot="collapsible-trigger"][aria-expanded="true"]')`,
    "Per-rule run history, including a failed send, so auto-reply failures have somewhere to live."],

  // ── Review Widgets ──────────────────────────────────────────────────
  // The dashed "create a new widget" tile at the end of the grid was
  // DELETED on 28 Aug alongside its Get Reviews twin, and the card grid
  // went from three columns to two. Nothing here reached for
  // `create-widget-tile`, so there was no selector to repoint, but the
  // list state now asserts the two-track grid so a silent revert to three
  // fails the run instead of shipping a wrong frame.
  ["widgets-01-list", "widgets", async () => {},
    `(() => {
       const card = document.querySelector('[data-hook="widget-w1"]');
       const grid = card && card.parentElement;
       if (!grid) return false;
       if (document.querySelector('[data-hook="create-widget-tile"]')) return false;
       return getComputedStyle(grid).gridTemplateColumns.trim().split(/\\s+/).length === 2;
     })()`,
    "Widget dashboard. Two columns of cards and no dashed create tile: New widget lives in the page header. Yelp is excluded from widgets, stated once on the page rather than in every filter menu."],
  // NUMBERS 03 AND 04 ARE DELIBERATELY VACANT. They used to be the two
  // later steps of the in-page CREATE wizard; creation moved to its own
  // screen on 28 Aug and those frames now live in the createwidget
  // section below. 05 keeps its number so widgets-05-detail-embed.png is
  // still the same filename it has always been.
  //
  // "New widget" no longer changes view in place: it is a Button inside a
  // span carrying data-grade-goto, so a click NAVIGATES to the create
  // screen. Driving the wizard from here would just be a slow way of
  // loading a different screen, so the wizard states point at that screen
  // directly instead.
  //
  // EDITING is still in page, and that is what this state covers.
  // The two wizards HAVE now converged (2 Sep): both render
  // `WizardShell` from `@brightlocal/wizard-shell`, so the edit frame and
  // the create frame differ only in their title and their entry point.
  // The old "STEP 1 OF 4" eyebrow and `[data-hook="widget-progress"]` are
  // gone from both, which is why the assertion below can require the
  // stepper and forbid the progress bar on this screen too.
  ["widgets-02-edit-wizard", "widgets", async (p) => { await press(p, '[data-hook="widget-w1-edit"]'); },
    `!!document.querySelector('[data-hook="widget-wizard-card"]')
     && !!document.querySelector('[data-hook="widget-mode-radio-group"]')
     && !!document.querySelector('[data-hook="widget-wizard-stepper"]')
     && !document.querySelector('[data-hook="widget-progress"]')`,
    "Editing an existing widget stays on the list screen: it is a change to something that already exists, not a new linear task, so it does not earn its own page."],
  // By hook, not by pressText("View"): every widget card carries a View
  // button, so the text lookup silently depended on DOM order.
  // THE DRAWER SPLIT IN TWO (3 Sep). `widget-detail-drawer` no longer
  // exists: preview and embed are separate sheets, because with both
  // stacked the LENGTH OF THE PREVIEW decided whether you could see the
  // code — a list widget showing ten reviews pushed the payoff below the
  // fold of a 640px panel.
  ["widgets-05-detail-embed", "widgets", async (p) => {
    await press(p, '[data-hook="widget-w1-menu-button"]');
    await wait(700);
    await pressText(p, "Get embed code", '[role="menuitem"]');
    await wait(900);
  },
    `!!document.querySelector('[data-hook="widget-embed-drawer"][data-state="open"]')
     && !!document.querySelector('[data-hook="embed-instructions"]')`,
    "The embed code on its own sheet, with the instructions the single sheet had no room for. The last step is the one nobody documents: the script line is needed once per page, not once per widget."],
  ["widgets-07-preview-sheet", "widgets", async (p) => {
    await press(p, '[data-hook="widget-w1-view"]');
    await wait(900);
  },
    `!!document.querySelector('[data-hook="widget-preview-drawer"][data-state="open"]')
     && !!document.querySelector('[data-hook="detail-preview-card"]')`,
    "Preview on its own sheet. The card button says Preview now rather than View: it used to open one sheet holding two things, so the label had to be vague enough to cover both."],

  // EVERY DESTRUCTIVE CONFIRMATION GETS A FRAME (Ali, 2 Sep: "I want a
  // capture of all deletion messages"). They are the screens nobody
  // photographs and everybody reads under pressure, and RM now has five of
  // them across four screens. Shot together so the wording can be compared
  // side by side rather than found one at a time.
  ["widgets-06-delete-confirm", "widgets", async (p) => {
    // Delete moved into the card's overflow (3 Sep), so it is two steps now.
    // The bare bin icon in the footer is gone: a destructive action sitting
    // in the row of everyday buttons is one slip from the one it cannot undo.
    await press(p, '[data-hook="widget-w1-menu-button"]');
    await wait(700);
    await pressText(p, "Delete widget", '[role="menuitem"]');
    await wait(800);
  },
    `!!document.querySelector('[data-hook="widget-w1-delete-title"]')`,
    "Deleting a widget. The name is quoted, and the consequence leads: a widget already embedded stops appearing on a website this screen cannot see, and the code on those pages stops working."],

  // ── Create Widget ───────────────────────────────────────────────────
  // Its own SCREEN since 28 Aug (design dmtctjykv0feb), on the DS
  // CentredLayout: no sidebar, no breadcrumbs, a Logo header and a
  // centred wizard. The step rail is the DS Stepper family
  // (`widget-wizard-stepper`); the old uppercase "STEP 1 OF 4" eyebrow
  // and its Progress bar are gone, so nothing here may reach for
  // `widget-progress`.
  //
  // Every step asserts on a hook UNIQUE to that step. Four frames driven
  // by repeated Next with no assertion is exactly the shape that produced
  // byte-identical captures before: a Next that does not land leaves the
  // previous step on screen and the shutter fires anyway.
  ["createwidget-01-type", "createwidget", async () => {},
    `!!document.querySelector('[data-hook="widget-mode-radio-group"]')
     && !!document.querySelector('[data-hook="widget-wizard-stepper"]')
     && !document.querySelector('[data-hook="widget-progress"]')`,
    "Step one asks hand-picked or live feed first, because that choice changes every later step. Out of the app shell on purpose: creating a widget is a focused linear task with its own way out."],
  ["createwidget-02-reviews", "createwidget", async (p) => { await widgetWizardTo(p, "reviews"); },
    `!!document.querySelector('[data-hook="picker-table"]')
     && !!document.querySelector('[data-hook="feed-explainer"]')`,
    "Live feed filters. New matching reviews are added automatically; individual ones can still be excluded by hand."],
  ["createwidget-03-format", "createwidget", async (p) => { await widgetWizardTo(p, "format"); },
    `!!document.querySelector('[data-hook="widget-format-radio-group"]')`,
    "List, carousel or JSON feed. These three are the only widget types either source document evidences."],
  ["createwidget-04-design", "createwidget", async (p) => { await widgetWizardTo(p, "design"); },
    `!!document.querySelector('[data-hook="design-theme-radio-group"]')`,
    "The design step, which the in-page wizard never had a frame for. JSON feeds skip it entirely, because there is nothing to paint."],
  ["createwidget-05-done", "createwidget", async (p) => { await widgetWizardTo(p, "done"); },
    `!!document.querySelector('[data-hook="create-widget-done"]')`,
    "The payoff. Saving hands over the embed code on the spot rather than sending you back to the list to go and find it, and the only way on is the button back to Review Widgets."],

  // THE OTHER BRANCH. Hand-picked and live feed diverge at step two and
  // never rejoin in content, so a set of frames from one branch is not a
  // record of the wizard. 06-08 shoot the picked branch's own steps; the
  // type step is shared and is already 01.
  ["createwidget-06-picked-reviews", "createwidget", async (p) => { await widgetWizardTo(p, "reviews", "picked"); },
    `!!document.querySelector('[data-hook="picker-table"]')
     && !document.querySelector('[data-hook="feed-explainer"]')`,
    "Hand-picked: a fixed set, chosen row by row on the DS DataTable, so selection, select-all, search and paging behave exactly as they do in Review Inbox. No explainer, because nothing changes on its own after this."],
  ["createwidget-07-picked-format", "createwidget", async (p) => { await widgetWizardTo(p, "format", "picked"); },
    `!!document.querySelector('[data-hook="widget-format-radio-group"]')`,
    "The layout step is the same on both branches: what was chosen does not change how it is drawn."],
  ["createwidget-08-picked-done", "createwidget", async (p) => { await widgetWizardTo(p, "done", "picked"); },
    `!!document.querySelector('[data-hook="create-widget-done"]')`,
    "Both branches end in the same place, holding the embed code."],

  // ── Report Settings ────────────────────────────────────────────────
  // NEW SCREEN, 2 Sep (design dmtkj124xagqa). Everything the RM Design
  // Brief lists under Monitor Reviews that previously had no home at all:
  // schedule and run day, the country-scoped directory picker doubling as
  // the profile-match panel, email alerts (the audit's own acknowledged
  // gap — "I have not included the 'set email notifications' feature
  // (yet)"), the public / white-label share link, and the run history
  // table. Reached from Review Insights' Settings button, which until now
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

  ["createwidget-09-leave-confirm", "createwidget", async (p) => {
    await press(p, '[data-hook="widget-cancel"]');
    await wait(800);
  },
    `!!document.querySelector('[data-hook="leave-title"]')`,
    "Leaving the wizard without saving. Cancel sits next to Next, one mis-click from the button people press a dozen times, so it asks first and says exactly what is lost."],

  // ── Get Reviews ─────────────────────────────────────────────────────
  // THE CAMPAIGN IS A PAGE, NOT A DRAWER (28 Aug). `campaign-drawer` and
  // `close-campaign` no longer exist, so the old assertion on
  // `[data-hook="campaign-drawer"][data-state="open"]` could only ever
  // fail. Entry is a campaign card's CTA; the way out is the last
  // breadcrumb crumb, which is not needed here because every state
  // reloads the embed from scratch.
  //
  // Driven by data-hook, NOT by pressText("View insights"). Every Live
  // and Stopped card carries that same label, so the text lookup took
  // whichever card the DOM happened to order first and the frame silently
  // depended on the sort. `campaign-c1-cta` names the campaign the note
  // describes (Summer Visitors, the email campaign with the full funnel).
  ["getreviews-01-hub", "getreviews", async () => {},
    // Assert the NEW hub shape, not merely "the page rendered": key/value
    // stat rows present, tabs absent (so this is not the campaign page),
    // and the card grid actually resolving to two tracks rather than the
    // three it used to be.
    `(() => {
       const card = document.querySelector('[data-hook="campaign-c1"]');
       const grid = card && card.parentElement;
       if (!grid || !document.querySelector('[data-hook="campaign-c1-stat-sent"]')) return false;
       if (document.querySelector('[data-hook="campaign-tabs"]')) return false;
       return getComputedStyle(grid).gridTemplateColumns.trim().split(/\\s+/).length === 2;
     })()`,
    "Campaign list with live, draft and stopped states. Two columns of cards, and each card's three numbers are key/value rows with hairlines rather than nested stat tiles."],
  ["getreviews-02-campaign-summary", "getreviews", async (p) => {
    await press(p, '[data-hook="campaign-c1-cta"]');
  },
    // Full page, so: the summary tab panel is the active one, the campaign
    // actions are up in the page header, and NOTHING is overlaying the
    // page. The last of those three is what catches a regression back to
    // a drawer.
    `(() => {
       const sum = document.querySelector('[data-hook="campaign-summary-panel"]');
       if (!sum || sum.getAttribute("data-state") !== "active") return false;
       for (const h of ["insights-stop", "insights-preview", "insights-download"]) {
         if (!document.querySelector('[data-hook="' + h + '"]')) return false;
       }
       // Re-use left the header on 3 Sep. Asserting on its ABSENCE is the
       // only way this catches it coming back.
       if (document.querySelector('[data-hook="insights-reuse"]')) return false;
       return !document.querySelector('[role="dialog"]');
     })()`,
    "Campaign detail as a FULL PAGE. Stop, Preview and Download: the things you do to this campaign. Re-use is not here, because starting a new campaign from an old one is a choice you make on the list, where you can see the others."],
  ["getreviews-03-campaign-feedback", "getreviews", async (p) => {
    await press(p, '[data-hook="campaign-c1-cta"]'); await wait(1400);
    await press(p, '[data-hook="campaign-tab-feedback"]');
  }, `(() => {
        const fb = document.querySelector('[data-hook="campaign-feedback-panel"]');
        if (!fb || fb.getAttribute("data-state") !== "active") return false;
        const sum = document.querySelector('[data-hook="campaign-summary-panel"]');
        if (sum && sum.getAttribute("data-state") === "active") return false;
        return document.querySelectorAll('[data-hook^="feedback-row-"]').length > 0;
      })()`,
    "Private feedback as a TAB on that page, not a nested screen. That is what removed the second level of back links."],
  ["getreviews-04-wizard", "getreviews", async (p) => { await press(p, '[data-hook="new-campaign"]'); },
    `!!document.querySelector('[data-hook="wizard-card"]')
     && !!document.querySelector('[data-hook="wizard-cancel"]')`,
    "Campaign wizard, first step. Cancel is a plain button with no arrow, because cancelling is an action, not a move up the hierarchy."],

  // ── Get Reviews: the wizard, one still per step per BRANCH ──────────
  // Ali, 2 Sep: "this is incomplete????" — and it was. A fourteen-step
  // wizard had exactly ONE frame, of step one, which is indistinguishable
  // from a wizard that has only one step. `campaignWizardTo` walks a named
  // branch to a named step, and every state below asserts on a hook that
  // exists on THAT step alone, so a Next that fails to land cannot be
  // photographed as the step it was aiming at.
  //
  // Numbering is branch-major: 05-16 email, 17-19 SMS, 20-21 link. The SMS
  // and link branches only get frames for the steps that DIFFER from the
  // email branch; the shared ones are already above and re-shooting them
  // would just be the same picture with a different filename.
  ["getreviews-05-email-name", "getreviews", async (p) => { await campaignWizardTo(p, "email", "name"); },
    `!!document.querySelector('[data-hook="campaign-name-input"]')
     && !!document.querySelector('[data-hook="wizard-card"]')`,
    "Email branch, step one of twelve. No verb in the header: creating, re-using and resuming a draft are one flow, so the title names the campaign rather than the task."],
  ["getreviews-06-email-ask", "getreviews", async (p) => { await campaignWizardTo(p, "email", "ask"); },
    `!!document.querySelector('[data-hook="ask-radio-group"]')
     && !!document.querySelector('[data-hook="wizard-card"]')`,
    "Internal feedback first, or straight to a public review. Whichever is picked, every respondent reaches the same review page, and the note says so: there is no setting here that can turn this into a review gate."],
  ["getreviews-07-email-feedback", "getreviews", async (p) => { await campaignWizardTo(p, "email", "feedback"); },
    `!!document.querySelector('[data-hook="feedback-type-field"]')
     && !!document.querySelector('[data-hook="wizard-card"]')`,
    "The likert scale. NPS 0 to 10, thumbs, or stars, with the customer's own view of it beside the choice. The legacy product had this buried inside the email template editor."],
  ["getreviews-08-email-channel", "getreviews", async (p) => { await campaignWizardTo(p, "email", "channel"); },
    `!!document.querySelector('[data-hook="channel-radio-group"]')
     && !!document.querySelector('[data-hook="wizard-card"]')`,
    "Email, SMS, or a web link you put wherever your customers already are. This answer and the last one decide how many steps the flow has, which is why the rail counts six named phases rather than twelve steps."],
  ["getreviews-09-email-email", "getreviews", async (p) => { await campaignWizardTo(p, "email", "email"); },
    `!!document.querySelector('[data-hook="email-subject-input"]')
     && !!document.querySelector('[data-hook="wizard-card"]')`,
    "The email, edited on the left and previewed on the right. The feedback-form token renders as the real scale in the preview, so the email is not something anyone has to imagine."],
  ["getreviews-10-email-reminder", "getreviews", async (p) => { await campaignWizardTo(p, "email", "reminder"); },
    `!!document.querySelector('[data-hook="reminder-radio-group"]')
     && !!document.querySelector('[data-hook="wizard-card"]')`,
    "One reminder, 48 hours later, and only to people who have not responded."],
  ["getreviews-11-email-reminder-design", "getreviews", async (p) => { await campaignWizardTo(p, "email", "reminder-design"); },
    `!!document.querySelector('[data-hook="reminder-timing"]')
     && !!document.querySelector('[data-hook="wizard-card"]')`,
    "The reminder, prefilled from the first email so it is an edit rather than a second authoring job. The legal footer is editable once, on the first email, and noted here."],
  ["getreviews-12-email-sites", "getreviews", async (p) => { await campaignWizardTo(p, "email", "sites"); },
    `!!document.querySelector('[data-hook="site-add"]')
     && !!document.querySelector('[data-hook="wizard-card"]')`,
    "The review sites customers are sent to, in order. The same page for everyone, whatever they scored."],
  ["getreviews-13-email-recipients", "getreviews", async (p) => { await campaignWizardTo(p, "email", "recipients"); },
    `!!document.querySelector('[data-hook="contacts-upload"]')
     && !!document.querySelector('[data-hook="wizard-card"]')
     && !document.querySelector('[data-hook=\"country-field\"]')`,
    "A CSV of the people to ask, uploaded and read back with its row count."],
  ["getreviews-14-email-columns", "getreviews", async (p) => { await campaignWizardTo(p, "email", "columns"); },
    `!!document.querySelector('[data-hook="csv-map-table"]')
     && !!document.querySelector('[data-hook="wizard-card"]')`,
    "Their header row mapped against our fields, with a preview row underneath so a wrong mapping is visible before it is confirmed."],
  ["getreviews-15-email-check", "getreviews", async (p) => { await campaignWizardTo(p, "email", "check"); },
    `!!document.querySelector('[data-hook="toggle-exclusions"]')
     && !!document.querySelector('[data-hook="wizard-card"]')`,
    "120 rows in, 112 people out. The 8 that were dropped are itemised by reason rather than silently removed."],
  ["getreviews-16-email-send", "getreviews", async (p) => { await campaignWizardTo(p, "email", "send"); },
    `!!document.querySelector('[data-hook="preview-as-customer"]')
     && !!document.querySelector('[data-hook="wizard-card"]')
     && !document.querySelector('[data-hook=\"link-note\"]')`,
    "The whole campaign as a key-value list, with the customer's own view one click away. Send now is the only step that cannot be undone, so it is the only one that confirms."],
  ["getreviews-17-sms-sms", "getreviews", async (p) => { await campaignWizardTo(p, "sms", "sms"); },
    `!!document.querySelector('[data-hook="sms-body-input"]')
     && !!document.querySelector('[data-hook="wizard-card"]')`,
    "SMS branch. Written against a real phone, with the tracked link and the opt-out line shown as the customer receives them."],
  ["getreviews-18-sms-recipients", "getreviews", async (p) => { await campaignWizardTo(p, "sms", "recipients"); },
    `!!document.querySelector('[data-hook="contacts-upload"]')
     && !!document.querySelector('[data-hook="wizard-card"]')
     && !!document.querySelector('[data-hook=\"country-field\"]')`,
    "Texts cost money, so the SMS branch asks where the contacts are before it asks who they are: the country sets the credit rate, and the balance sits beside it rather than in billing."],
  ["getreviews-19-sms-send", "getreviews", async (p) => { await campaignWizardTo(p, "sms", "send"); },
    `!!document.querySelector('[data-hook="preview-as-customer"]')
     && !!document.querySelector('[data-hook="wizard-card"]')
     && !document.querySelector('[data-hook=\"link-note\"]')`,
    "The SMS confirm names the credit cost, not just the headcount, because that is the part that cannot be undone."],
  // ── The expanded preview (Ali, 2 Sep: "I'll also need a screenshot of
  // each one open as a preview or expanded view, like when pressing on the
  // expander"). The send step's contact sheet shows every customer-facing
  // page at half size; clicking a tile opens it full size in a dialog.
  // Driven off the EMAIL branch because it is the only one carrying all
  // three pages — the link branch has no email, and a straight-to-review
  // campaign has no feedback page.
  // ── One page per campaign STATE (Ali, 3 Sep: "put all the states in,
  // then we can have a page in each of these states… we will need to
  // capture each drill down for each state as well").
  //
  // Six states, six drill-downs, because each one renders a different
  // banner and a different set of header actions — Scheduled can be
  // cancelled but not re-used yet, Sending says its numbers are still
  // moving, Finished offers Re-use and nothing to stop, Stopped offers
  // Restart. A grid shot proves the badges; only the page proves the rest.
  // ── What a campaign looks like the moment it exists (Ali, 3 Sep:
  // "capture the campaign created state, and what happens after that").
  // Two frames nobody had shot, and they are the two every real user sees
  // first: the confirmation, and the results page before there are any
  // results.
  ["getreviews-33-created", "getreviews", async (p) => {
    await campaignWizardTo(p, "email", "send");
    await press(p, '[data-hook="wizard-next"]');
    await wait(900);
    await pressText(p, "Send now", '[role="alertdialog"] button');
    await wait(1200);
  },
    `!!document.querySelector('[data-hook="wizard-success"]')`,
    "Sent. The way on is the campaign's own insights page, because the next thing anyone wants to know is whether it landed."],
  ["getreviews-34-no-activity-yet", "getreviews", async (p) => {
    await campaignWizardTo(p, "email", "send");
    await press(p, '[data-hook="wizard-next"]');
    await wait(900);
    await pressText(p, "Send now", '[role="alertdialog"] button');
    await wait(1200);
    await press(p, '[data-hook="success-insights"]');
    await wait(1400);
  },
    `!!document.querySelector('[data-hook="insights-empty"]')`,
    "A campaign with nothing back yet: sent counts, everything else is zero, and the card says so rather than drawing an empty funnel and a flat chart. This is the state a real user stares at for the first hour, and it is the one a demo never shows."],

  ["getreviews-27-states-grid", "getreviews", async (p) => { await scrollTo(p, 400); },
    `(() => {
       const want = ["Live","Draft","Stopped","Scheduled","Sending","Finished"];
       const seen = [...document.querySelectorAll('[data-hook^="campaign-c"][data-hook$="-status"]')]
         .map((e) => e.textContent.trim());
       return want.every((w) => seen.includes(w));
     })()`,
    "All six campaign states in one grid. Nothing specifies these — not the brief, not the audit, not the legacy screens — so the set is a proposal: Live was doing two jobs, because a standing web link is live and an email campaign sent in July is not."],
  ["getreviews-28-page-scheduled", "getreviews", async (p) => { await press(p, '[data-hook="campaign-c6-cta"]'); },
    `!!document.querySelector('[data-hook="state-banner"]')
     && !!document.querySelector('[data-hook="insights-stop"]')`,
    "Scheduled. Nothing has been sent, so the banner says the messages can still be changed, and the action reads Cancel send rather than Stop campaign."],
  ["getreviews-29-page-sending", "getreviews", async (p) => { await press(p, '[data-hook="campaign-c7-cta"]'); },
    `!!document.querySelector('[data-hook="state-banner"]')`,
    "Sending. The numbers are real but not final, which is the whole reason this state needs a banner: a half-finished funnel read as a finished one is a wrong conclusion, not a missing number."],
  ["getreviews-30-page-finished", "getreviews", async (p) => { await press(p, '[data-hook="campaign-c8-cta"]'); },
    `!!document.querySelector('[data-hook="state-banner"]')
     && !document.querySelector('[data-hook="insights-stop"]')`,
    "Finished. Every message sent, the reminder gone, nothing left to stop — so Stop is absent and Re-use is the way to run the same ask again."],
  ["getreviews-31-page-stopped", "getreviews", async (p) => { await press(p, '[data-hook="campaign-c5-cta"]'); },
    `!!document.querySelector('[data-hook="insights-restart"]')`,
    "Stopped. The one state with a warning rather than an info banner, and the only one offering Restart — which lives in the overflow now, with Re-use, since the header is down to two CTAs."],
  ["getreviews-32-restart-confirm", "getreviews", async (p) => {
    await press(p, '[data-hook="campaign-c5-cta"]');
    // 1400ms was not enough: the campaign page mounts a chart and a table
    // before its header actions are interactive, so the press landed on a
    // button that was there but not yet wired. Wait for the state banner,
    // which renders in the same pass as the actions.
    await waitForHook(p, '[data-hook="insights-restart"]');
    await wait(600);
    await press(p, '[data-hook="insights-restart"]');
    await wait(1000);
  },
    `!!document.querySelector('[data-hook="restart-title"]')`,
    "Restarting explains itself. It is easy to assume restart means send it again, which for a 480-person campaign is an expensive thing to assume wrongly — it reopens the links already out there, and nobody receives anything."],

  ["getreviews-25-delete-draft", "getreviews", async (p) => {
    await press(p, '[data-hook="campaign-c4-menu-button"]');
    await wait(700);
    await pressText(p, "Delete draft", '[role="menuitem"]');
    await wait(800);
  },
    `!!document.querySelector('[data-hook="campaign-c4-delete-title"]')`,
    "Deleting a draft campaign. Nothing has been sent, so nothing breaks — the copy says that rather than borrowing the alarm of a delete that does break something."],
  ["getreviews-26-stop-campaign", "getreviews", async (p) => {
    await press(p, '[data-hook="campaign-c1-menu-button"]');
    await wait(700);
    await pressText(p, "Stop campaign", '[role="menuitem"]');
    await wait(800);
  },
    `!!document.querySelector('[data-hook="stop-title"]')`,
    "Stopping a live campaign. Not a delete: the links stop working and the numbers stop counting, and it can be restarted, so the dialog says so instead of sounding final."],

  ["getreviews-22-preview-email", "getreviews", async (p) => {
    await campaignWizardTo(p, "email", "send");
    await press(p, '[data-hook="preview-tile-email"]');
    await wait(900);
  },
    `(() => {
       const t = document.querySelector('[data-hook="preview-full-title"]');
       return !!t && t.textContent.trim() === "Email";
     })()`,
    "The email at full size, opened from its tile. Nothing in here is clickable: this is a picture of the message, and the working version is behind Preview as a customer."],
  ["getreviews-23-preview-feedback", "getreviews", async (p) => {
    await campaignWizardTo(p, "email", "send");
    await press(p, '[data-hook="preview-tile-feedback"]');
    await wait(900);
  },
    `(() => {
       const t = document.querySelector('[data-hook="preview-full-title"]');
       return !!t && t.textContent.trim() === "Feedback page";
     })()`,
    "The feedback page full size. This is the page the whole review-gating question turns on, so it is worth seeing at the size a customer sees it."],
  ["getreviews-24-preview-review", "getreviews", async (p) => {
    await campaignWizardTo(p, "email", "send");
    await press(p, '[data-hook="preview-tile-review"]');
    await wait(900);
  },
    `(() => {
       const t = document.querySelector('[data-hook="preview-full-title"]');
       return !!t && t.textContent.trim() === "Review page";
     })()`,
    "The review page full size. Every respondent reaches this one whatever they scored, which is the decision that keeps the feature the right side of the FTC rule."],
  ["getreviews-20-link-channel", "getreviews", async (p) => { await campaignWizardTo(p, "link", "channel"); },
    `!!document.querySelector('[data-hook="channel-radio-group"]')
     && !!document.querySelector('[data-hook="wizard-card"]')`,
    "Web link branch. A link has no audience and no send, so the flow drops from twelve steps to five and the rail loses two whole phases."],
  ["getreviews-21-link-golive", "getreviews", async (p) => { await campaignWizardTo(p, "link", "golive"); },
    `!!document.querySelector('[data-hook="link-note"]')
     && !!document.querySelector('[data-hook="wizard-card"]')`,
    "The last step is Put live, not Send now. The link is created at that moment rather than sitting unused beforehand."],
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
  if (ONLY.length && !ONLY.some((o) => name.includes(o))) return false;
  if (SECTIONS.length && !SECTIONS.some((sec) => name.startsWith(sec))) return false;
  return true;
});

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
    const file = path.join(dirFor(name), `${name}.png`);
    await page.screenshot({ path: file, type: "png" });
    try { setPngRetinaDpi(file); } catch {}
    if (FULL) {
      // A TALL CAPTURE MEANS GROWING THE VIEWPORT, not fullPage.
      //
      // `page.screenshot({ fullPage: true })` shoots the HOST page, and the
      // screen does not live there — it is inside a fixed-height sandbox
      // iframe, scrolling in its own overflow container. fullPage therefore
      // returned the same 1280x900 as the cropped frame, with a different
      // filename. That is the exact shape of failure this suite keeps
      // finding: an output that looks like it worked.
      //
      // Measuring the real scroller and resizing the viewport to its
      // scrollHeight collapses the internal scroll (verified: overflow goes
      // to 0) and the whole page renders in one frame.
      const need = await inFrame(page, () => {
        let best = null, most = 0;
        for (const el of document.querySelectorAll("*")) {
          const over = el.scrollHeight - el.clientHeight;
          if (over > most && el.clientHeight > 300) { best = el; most = over; }
        }
        return { over: most, height: best ? best.scrollHeight : document.body.scrollHeight };
      });

      // NOTHING TO EXTEND IS NOT A FAILURE. The wizards are h-screen with
      // overflow-hidden — pinned header, pinned footer, a middle that
      // scrolls — so their natural height IS 900 and a "full" file would be
      // a byte-identical copy of the cropped one under a second name.
      // Skipped, and said out loud, rather than written.
      if (need.over < 40) {
        console.log(`    (no tall capture: ${name} does not scroll)`);
      } else {
        const tall = Math.min(MAX_FULL_HEIGHT, need.height + 80);
        await page.setViewportSize({ width: 1280, height: tall });
        await wait(2200); // charts and sticky headers re-lay out
        const fullDir = path.join(dirFor(name), "full");
        fs.mkdirSync(fullDir, { recursive: true });
        const ffile = path.join(fullDir, `${name}.png`);
        await page.screenshot({ path: ffile, type: "png" });
        try { setPngRetinaDpi(ffile); } catch {}
        await page.setViewportSize({ width: 1280, height: 900 });
        await wait(600);
        console.log(`    + full ${tall}px`);
      }
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
