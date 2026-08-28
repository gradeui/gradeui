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

// Walk the CREATE WIDGET screen's wizard to a named step. Every state
// reloads the embed from scratch, so each one re-walks the chain rather
// than sharing a page. Driven by data-hook, never by pressText("Next"):
// the reviews step carries a DataTablePagination whose own control is
// also called Next, and a text lookup can pick the wrong one.
const WIDGET_WIZARD_STEPS = ["type", "reviews", "format", "design", "done"];
async function widgetWizardTo(page, step) {
  const stop = WIDGET_WIZARD_STEPS.indexOf(step);
  if (stop < 0) throw new Error("unknown widget wizard step: " + step);
  if (stop === 0) return;
  // Live feed rather than hand-picked. The feed branch is the one that
  // carries the explainer and the review picker, and it is the branch the
  // old in-page states captured, so the frames stay comparable.
  await press(page, '[data-hook="widget-mode-feed-label"]');
  await wait(600);
  for (let i = 0; i < stop - 1; i += 1) {
    await press(page, '[data-hook="widget-next"]');
    await wait(1000);
  }
  // The last step swaps Next for Save, and Save is what produces the done
  // state with the embed code.
  await press(page, `[data-hook="widget-${step === "done" ? "save" : "next"}"]`);
  await wait(1000);
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
  // Worth knowing: the list screen's own copy of the wizard still wears
  // the old "STEP 1 OF 4" eyebrow plus a Progress bar
  // (`[data-hook="widget-progress"]`), while the create screen has moved
  // to the DS Stepper. Not asserted on, because the two are expected to
  // converge, but that is why an edit frame and a create frame do not
  // look alike today.
  ["widgets-02-edit-wizard", "widgets", async (p) => { await press(p, '[data-hook="widget-w1-edit"]'); },
    `!!document.querySelector('[data-hook="widget-wizard-card"]')
     && !!document.querySelector('[data-hook="widget-mode-radio-group"]')`,
    "Editing an existing widget stays on the list screen: it is a change to something that already exists, not a new linear task, so it does not earn its own page."],
  // By hook, not by pressText("View"): every widget card carries a View
  // button, so the text lookup silently depended on DOM order.
  ["widgets-05-detail-embed", "widgets", async (p) => { await press(p, '[data-hook="widget-w1-view"]'); },
    `!!document.querySelector('[data-hook="widget-detail-drawer"][data-state="open"]')`,
    "The embed snippet with copy-to-clipboard. Opens automatically after saving, so the code is one step away, not two."],

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
       for (const h of ["insights-reuse", "insights-stop", "insights-preview", "insights-download"]) {
         if (!document.querySelector('[data-hook="' + h + '"]')) return false;
       }
       return !document.querySelector('[role="dialog"]');
     })()`,
    "Campaign detail as a FULL PAGE, entered from a card and left through the last breadcrumb crumb. Re-use, Stop campaign, Preview and Download sit beside the title, because they act on the whole campaign."],
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
