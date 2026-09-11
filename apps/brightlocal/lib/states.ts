/**
 * THE STATE CATALOGUE.
 *
 * A screen is not one picture. Most of the work in Reviews lives in states
 * that only exist after a click: a dialog, a drawer, a wizard step, a
 * validation alert, an empty account. Those are the frames worth reviewing,
 * and the ones that used to be assembled by hand in Figma.
 *
 * Each entry says where the state is, how to get into it, and what it is for.
 * TWO THINGS READ IT, from this one definition:
 *
 *   - /meta/states drives a same-origin iframe through the steps, so tapping
 *     a thumbnail opens the real page in that interaction rather than a
 *     picture of it. This app serves both the browser and the screens, which
 *     is the whole reason it can reach into the frame at all.
 *   - scripts/capture-states.mts drives the same steps under Playwright and
 *     writes the thumbnail.
 *
 * The `note` is the explanation that used to be a Figma annotation. Write it
 * beside the state, never anywhere else, or the two drift.
 */

import type { Persona } from "@/lib/personas";

type PersonaId = Persona["id"];

export type StateSection =
  | "hub"
  | "manager"
  | "tracker"
  | "builder"
  | "showcase"
  | "insights"
  | "account"
  | "looks";

export interface StateStep {
  /** A selector inside the app. Pressed with a full pointer sequence. */
  click?: string;
  /** A key on the document, for Escape and the like. */
  key?: string;
  /** Scroll a selector into view before carrying on. */
  scrollTo?: string;
  /** Hold, in milliseconds. Every step waits a beat anyway. */
  wait?: number;
  /** Wait for this selector to exist before the next step. */
  waitFor?: string;
}

export interface ScreenState {
  /** Stable, and the thumbnail's filename: `<section>-<nn>-<slug>`. */
  id: string;
  section: StateSection;
  title: string;
  /** What this frame is for. The thing a reviewer needs told. */
  note: string;
  /** Path inside the app, location included. */
  path: string;
  /** Defaults to engaged: a single location, eight months in. */
  persona?: PersonaId;
  steps?: StateStep[];
  /** Wider or narrower than the default 1280, for a responsive frame. */
  width?: number;
  /** The insight layer's colour treatment. Neutral unless the state is about
   *  the tone itself. */
  tone?: "neutral" | "tinted" | "families" | "vivid";
  /** Force the contextual insight layer off for this one state. The page has
   *  a global switch for the same thing, which wins while it is set. */
  insights?: boolean;
}

const M = "/locations/minus-one-studios";
const HOVE = "/locations/harbour-co-hove";

export const SECTION_LABEL: Record<StateSection, string> = {
  hub: "Reviews hub",
  manager: "Review Manager",
  tracker: "Review Tracker",
  builder: "Review Builder",
  showcase: "Review Showcase",
  insights: "Insights & Actions",
  account: "Account",
  looks: "Tones, and without insights",
};

export const STATES: ScreenState[] = [
  // ── the hub ────────────────────────────────────────────────────────
  {
    id: "hub-01-at-rest",
    section: "hub",
    title: "The hub at rest",
    note: "Four cards, one per sub-tool, each with the number that matters and the one trend line under it. The insight band above them leads with a headline, one line, and the two things you can do about it.",
    path: `${M}/reviews`,
  },
  {
    id: "hub-02-summary-dialog",
    section: "hub",
    title: "Tell me more",
    note: "The summary dialog. The headline restates the finding, the left column holds the findings you can open one at a time, and the right column carries the six-month charts. Every number links back to the reviews behind it.",
    path: `${M}/reviews`,
    steps: [{ click: "[data-hook=review-summary-strip-open]", waitFor: "[data-hook=beacon-modal]", wait: 900 }],
  },
  {
    id: "hub-03-finding-open",
    section: "hub",
    title: "A finding, opened",
    note: "Progressive disclosure. A finding is a prompt you can open; inside it is the why, and under that the thing that fixes it, as a button into the tool that does it.",
    path: `${M}/reviews`,
    steps: [
      { click: "[data-hook=review-summary-strip-open]", waitFor: "[data-hook=beacon-modal]", wait: 700 },
      { click: "[data-hook=review-summary-more-0]", wait: 900 },
    ],
  },
  {
    id: "hub-04-empty",
    section: "hub",
    title: "Day one",
    note: "An account that has just signed up. Nothing connected, nothing in, every card honestly at zero, and the first-run band saying what to do first rather than summarising nothing.",
    path: `${M}/reviews`,
    persona: "empty",
  },
  {
    id: "hub-05-trial",
    section: "hub",
    title: "On a trial",
    note: "Three days left, four reviews in, none answered. The trial has to show its worth on numbers this small, so the band leads on what it has found rather than on a trend it cannot have yet.",
    path: `${M}/reviews`,
    persona: "starter",
  },
  {
    id: "hub-06-lapsed",
    section: "hub",
    title: "After the trial ended",
    note: "Nine days on. Reviews are still arriving and nobody is watching them. The win-back is the one thing on the page with any urgency to it.",
    path: `${M}/reviews`,
    persona: "lapsed",
  },
  {
    id: "hub-07-multi",
    section: "hub",
    title: "One branch of three",
    note: "Hove, where the lifetime rating hides what the last thirty days are saying. The insight is about this branch, not the brand, which is the point of the comparison.",
    path: `${HOVE}/reviews`,
    persona: "multi",
  },

  {
    id: "hub-08-trial-recap",
    section: "hub",
    title: "The trial recap",
    note: "What the trial opens with. A ledger of what it got you against what stops when it ends, with the price beside it. It is the one interruption in the product, so it earns its place by being specific about this account rather than about the plan.",
    path: `${M}/reviews`,
    persona: "starter",
    steps: [{ waitFor: "[data-hook=trial-recap]", wait: 900 }],
  },

  // ── the Manager ────────────────────────────────────────────────────
  {
    id: "manager-01-inbox",
    section: "manager",
    title: "The inbox",
    note: "Every review in one list, newest first, with the tabs carrying their own counts and a status badge per row. The plan band above it names the week's goal.",
    path: `${M}/reviews/manager`,
  },
  {
    id: "manager-02-plan-dialog",
    section: "manager",
    title: "Your plan for this week",
    note: "The plan dialog. The goal as a full sentence with the key phrase marked, the tactics under it as things you can open, and the right column showing the reply auto-reply would have written on one of this location's own reviews.",
    path: `${M}/reviews/manager`,
    steps: [{ click: "[data-hook=review-plan-strip-open]", waitFor: "[data-hook=beacon-modal]", wait: 900 }],
  },
  {
    id: "manager-03-facets",
    section: "manager",
    title: "Filtering by review site",
    note: "The facet menus. Each one is searchable, multi-select, and says how many are on. The count beside Clear filters is the number of facets in play, not the number of rows.",
    path: `${M}/reviews/manager`,
    steps: [{ click: "[data-hook=facet-sources]", wait: 800 }],
  },
  {
    id: "manager-04-mobile-filters",
    section: "manager",
    title: "Filters on a phone",
    note: "Below the breakpoint the facet row becomes one button and the filters open in a sheet, with Clear and Apply pinned at the bottom so a long list of review sites cannot bury them.",
    path: `${M}/reviews/manager`,
    width: 430,
    steps: [{ click: "[data-hook=open-mobile-filters]", waitFor: "[data-hook=filter-drawer]", wait: 900 }],
  },
  {
    id: "manager-05-empty",
    section: "manager",
    title: "An empty inbox",
    note: "Nothing has arrived yet. The page says what will fill it rather than showing an empty table with headers over nothing.",
    path: `${M}/reviews/manager`,
    persona: "empty",
  },

  // ── the Tracker ────────────────────────────────────────────────────
  {
    id: "tracker-01-charts",
    section: "tracker",
    title: "The trend",
    note: "Rating over time and volume by review site. The insight band leads on what moved and why, naming the campaign behind the spike, so the charts confirm a sentence rather than being left to speak for themselves.",
    path: `${M}/reviews/tracker`,
  },
  {
    id: "tracker-02-dialog",
    section: "tracker",
    title: "Tell me more, on the Tracker",
    note: "The same dialog anatomy as the hub, with the six-month charts and the sourced fact underneath. The charts only appear once there are three months of data; before that it is a list of the reviews so far.",
    path: `${M}/reviews/tracker`,
    steps: [{ click: "[data-hook=beacon-strip-tracker-open]", waitFor: "[data-hook=beacon-modal]", wait: 900 }],
  },
  {
    id: "tracker-03-sources",
    section: "tracker",
    title: "Where the reviews come from",
    note: "The donut. Its centre counts review sites, not reviews, because the number of reviews is already the headline above it, and everything below four is folded into Other with the detail on hover.",
    path: `${M}/reviews/tracker`,
    steps: [{ scrollTo: "[data-hook=sources-donut]", wait: 900 }],
  },
  {
    id: "tracker-04-sources-table",
    section: "tracker",
    title: "The same numbers as a table",
    note: "Chart and table are a real toggle, not two hand-rolled buttons, and it cannot end up with neither selected. The table is the same figures the donut draws, which is what anyone checking a number actually wants.",
    path: `${M}/reviews/tracker`,
    steps: [
      { scrollTo: "[data-hook=sources-donut]", wait: 600 },
      // BY ARIA LABEL, not by hook: ToggleGroupItem drops the dataHook prop,
      // the same way Button drops unknown data-* props, so the items inside
      // perf-view-toggle carry no hook of their own. Logged as a DS change.
      { click: '[data-hook=perf-view-toggle] [aria-label="Table view"]', waitFor: "[data-hook=sources-table]", wait: 800 },
    ],
  },
  {
    id: "tracker-05-connect-alert",
    section: "tracker",
    title: "A review site not connected",
    note: "The page states what it cannot see. An alert rather than a silent gap, because a chart that is missing a whole review site looks the same as a chart of a quiet month.",
    path: `${M}/reviews/tracker`,
    persona: "starter",
  },

  // ── the Builder ────────────────────────────────────────────────────
  {
    id: "builder-01-campaigns",
    section: "builder",
    title: "Campaigns",
    note: "Every campaign with its channel, its type, its status and what it brought in. The count in the header is read off the table rather than typed, so the two cannot disagree.",
    path: `${M}/reviews/builder`,
  },
  {
    id: "builder-02-dialog",
    section: "builder",
    title: "Tell me more, on the Builder",
    note: "Asking is the only thing that moves the count, so the dialog leads on the send that did it and what happened in the two days after.",
    path: `${M}/reviews/builder`,
    steps: [{ click: "[data-hook=beacon-strip-builder-open]", waitFor: "[data-hook=beacon-modal]", wait: 900 }],
  },
  {
    id: "builder-03-wizard-settings",
    section: "builder",
    title: "Campaign settings",
    note: "The first step: what to ask for, how it is sent, and which review sites it points at. Nothing here is a modal, so the whole campaign can be read before any of it is committed to.",
    path: `${M}/reviews/builder?view=wizard`,
  },
  {
    id: "builder-04-wizard-recipients",
    section: "builder",
    title: "Who to ask",
    note: "One person or a list. The step will not let you past without the thing it needs, and the alert sits in the card beside the choice it is about rather than in the shell, where it would be a long way from the control that clears it.",
    path: `${M}/reviews/builder?view=wizard`,
    steps: [
      { click: "[data-hook=setup-create]", waitFor: "[data-hook=send-rail]", wait: 700 },
      { click: "[data-hook=wizard-next]", wait: 900 },
    ],
  },
  {
    id: "builder-05-wizard-one-person",
    section: "builder",
    title: "Asking one person",
    note: "The other half of the same step. Choosing one person drops the upload and the column mapping entirely, because a single address has no rows to match, and the later steps say so rather than inventing a CSV that was never uploaded.",
    path: `${M}/reviews/builder?view=wizard`,
    steps: [
      { click: "[data-hook=setup-create]", waitFor: "[data-hook=send-rail]", wait: 700 },
      { click: "[data-hook=send-tab-recipients]", wait: 700 },
      // The label, not the radio: RadioGroupItem renders a button the size of
      // its dot, sitting under the card that describes it.
      { click: "[data-hook=audience-one-label]", wait: 900 },
    ],
  },
  {
    id: "builder-06-wizard-columns",
    section: "builder",
    title: "Matching the columns",
    note: "The uploaded file's own headings against the fields a send needs. The step exists because a CSV is somebody else's spreadsheet and its columns are never in the order anyone expects.",
    path: `${M}/reviews/builder?view=wizard`,
    steps: [
      { click: "[data-hook=setup-create]", waitFor: "[data-hook=send-rail]", wait: 700 },
      // The rail is READ-ONLY by design (a controlled Stepper with no
      // onValueChange), so the only way through is Next, satisfying each gate
      // on the way. Dropzone is a button, so pressing it is the upload.
      { click: "[data-hook=contacts-upload]", wait: 800 },
      { click: "[data-hook=wizard-next]", wait: 1000 },
    ],
  },
  {
    id: "builder-07-wizard-check",
    section: "builder",
    title: "Check your list",
    note: "Who is getting it and who was left out, with the reasons. The rows dropped as duplicates, blanks or unsubscribes are listed in full rather than summarised, because the number on its own is the thing nobody trusts.",
    path: `${M}/reviews/builder?view=wizard`,
    steps: [
      { click: "[data-hook=setup-create]", waitFor: "[data-hook=send-rail]", wait: 700 },
      // The rail is READ-ONLY by design (a controlled Stepper with no
      // onValueChange), so the only way through is Next, satisfying each gate
      // on the way. Dropzone is a button, so pressing it is the upload.
      { click: "[data-hook=contacts-upload]", wait: 800 },
      { click: "[data-hook=wizard-next]", wait: 900 },
      { click: "[data-hook=wizard-next]", wait: 1000 },
    ],
  },
  {
    id: "builder-08-wizard-excluded",
    section: "builder",
    title: "The rows we left out",
    note: "Opened. Every excluded row with its number, its value and why it went, so the eight in the summary can be counted rather than taken on trust. The two confirmations under it are what the step will not go past without.",
    path: `${M}/reviews/builder?view=wizard`,
    steps: [
      { click: "[data-hook=setup-create]", waitFor: "[data-hook=send-rail]", wait: 700 },
      { click: "[data-hook=contacts-upload]", wait: 800 },
      { click: "[data-hook=wizard-next]", wait: 900 },
      { click: "[data-hook=wizard-next]", wait: 900 },
      { click: "[data-hook=toggle-exclusions]", wait: 900 },
    ],
  },
  {
    id: "builder-09-wizard-send",
    section: "builder",
    title: "Ready to send",
    note: "The last step. Every page the recipient will see, as a preview you can open, and the count you are about to send to. The tiles are pictures of live pages, made inert so their own buttons stay out of the tab order.",
    path: `${M}/reviews/builder?view=wizard`,
    steps: [
      { click: "[data-hook=setup-create]", waitFor: "[data-hook=send-rail]", wait: 700 },
      // The rail is READ-ONLY by design (a controlled Stepper with no
      // onValueChange), so the only way through is Next, satisfying each gate
      // on the way. Dropzone is a button, so pressing it is the upload.
      { click: "[data-hook=contacts-upload]", wait: 800 },
      { click: "[data-hook=wizard-next]", wait: 800 },
      { click: "[data-hook=wizard-next]", wait: 800 },
      // Check will not go past until both confirmations are ticked.
      { click: "[data-hook=confirm-permission]", wait: 300 },
      { click: "[data-hook=confirm-privacy]", wait: 400 },
      { click: "[data-hook=wizard-next]", waitFor: "[data-hook^=preview-tile-]", wait: 1200 },
    ],
  },
  {
    id: "builder-10-wizard-success",
    section: "builder",
    title: "Sending",
    note: "What follows Send. It names the number it is going to and where the answers will appear, so the campaign does not simply vanish off the screen it was made on.",
    path: `${M}/reviews/builder?view=success`,
  },
  {
    id: "builder-11-qr",
    section: "builder",
    title: "The QR code",
    note: "Generated on the page, sized for the till, the table or the door, with the caption and the colour editable. The code is live and scannable; the line printed under it is Google's own review URL, which is what the customer's card would carry.",
    path: `${M}/reviews/builder`,
    steps: [{ click: "[data-hook=qr-banner-code]", waitFor: "[data-hook=qr-generator]", wait: 1000 }],
  },
  {
    id: "builder-12-empty",
    section: "builder",
    title: "No campaigns yet",
    note: "Nothing running, and the page says so rather than showing a table of somebody else's numbers. The first campaign is the only thing being asked for.",
    path: `${M}/reviews/builder`,
    persona: "empty",
  },

  // ── the Showcase ───────────────────────────────────────────────────
  {
    id: "showcase-01-widgets",
    section: "showcase",
    title: "Three showcases",
    note: "A list, a carousel and a JSON feed. Each card says how it chooses its reviews, how many it is showing, and how many the filter left out, so the difference between hand-picked and live feed is legible without opening anything.",
    path: `${M}/reviews/showcase`,
  },
  {
    id: "showcase-02-dialog",
    section: "showcase",
    title: "Tell me more, on the Showcase",
    note: "The people who read reviews on your own site never open Google, which is the argument this dialog makes, in this location's own numbers.",
    path: `${M}/reviews/showcase`,
    steps: [{ click: "[data-hook=beacon-strip-showcase-open]", waitFor: "[data-hook=beacon-modal]", wait: 900 }],
  },
  {
    id: "showcase-03-preview",
    section: "showcase",
    title: "The preview",
    note: "The widget as it would render on the customer's own website, with its own skin rather than the app's. The dedicated preview shows every review it holds; the card version is a thumbnail and caps at four.",
    path: `${M}/reviews/showcase`,
    steps: [{ click: "button:has-text('Preview')", wait: 1200 }],
  },
  {
    id: "showcase-04-empty",
    section: "showcase",
    title: "Nothing to show yet",
    note: "The showcases are set up but there is nothing to put in them. The page shows what it will look like and what the three sourced facts say about why it matters, rather than an empty widget.",
    path: `${M}/reviews/showcase`,
    persona: "empty",
  },

  // ── Insights & Actions ─────────────────────────────────────────────
  {
    id: "insights-01-roadmap",
    section: "insights",
    title: "The roadmap",
    note: "The next three months, one stage at a time, in the anatomy of BrightLocal's own twelve-month roadmap: a goal pill, an outcome-led headline with the key phrase marked, a coloured month rail, and Key tactics under it.",
    path: `${M}/ai-insights/reviews`,
  },
  {
    id: "insights-02-pdf",
    section: "insights",
    title: "As a PDF",
    note: "The same story rendered for print on the fly, at a standard page size, from the same libraries the screens read. No PDF library: the browser prints it.",
    path: `${M}/ai-insights/reviews`,
    steps: [{ scrollTo: "[data-hook=insights-pdf]", wait: 600 }],
  },

  // ── the account ────────────────────────────────────────────────────
  {
    id: "account-01-pricing",
    section: "account",
    title: "Subscription and pricing",
    note: "The site's three plans with the account's own state on top, and the upgrade path saying what each step adds in this location's numbers rather than in features.",
    path: "/account/subscription",
  },
  {
    id: "account-02-chosen",
    section: "account",
    title: "A plan chosen",
    note: "Choosing records the choice and says what it means: the date the trial ends, the reviews already in, the price. Not a checkout, because a prototype must never ask for card details.",
    path: "/account/subscription?chosen=grow",
    persona: "starter",
  },
  {
    id: "account-03-lapsed",
    section: "account",
    title: "The win-back",
    note: "The lapsed account's version of the same page. The half-price line is a proposal for discussion, not a BrightLocal offer.",
    path: "/account/subscription",
    persona: "lapsed",
  },
  {
    id: "account-04-settings",
    section: "account",
    title: "Prototype settings",
    note: "The seams the prototype exposes: the persona, the shell look, the layout engine, the insight tone, dark mode, and the switch that strips the contextual insight layer for a screenshot without it.",
    path: "/settings",
  },
];


// ── the looks ───────────────────────────────────────────────────────
const LOOKS: ScreenState[] = [
  {
    id: "looks-01-tinted",
    section: "looks",
    title: "Tinted",
    note: "The insight surfaces on a violet tint, with one ink: everything black, nothing muted, the badge transparent and the main button black rather than the brand green, which fights a tint. The borders go almost away, because the tint is already doing the lifting.",
    path: `${M}/reviews`,
    tone: "tinted",
  },
  {
    id: "looks-02-families",
    section: "looks",
    title: "Families",
    note: "The same rules with a colour per section, so the Manager, the Tracker and the Builder each carry their own, and a screenshot says which page it came from without the breadcrumb.",
    path: `${M}/reviews/tracker`,
    tone: "families",
  },
  {
    id: "looks-03-vivid",
    section: "looks",
    title: "Super bright",
    note: "Full strength rather than a tint. The tiles and inner panels step to a lighter shade of the same family instead of white, and it still measures above 8:1, which is the constraint that keeps it from being a poster.",
    path: `${M}/reviews`,
    tone: "vivid",
  },
  {
    id: "looks-04-tinted-dialog",
    section: "looks",
    title: "A dialog on a tint",
    note: "The popover is the one thing that never takes the colour. It stays white whatever the tone is set to, so the surface you read the detail on is the same every time.",
    path: `${M}/reviews`,
    tone: "tinted",
    steps: [{ click: "[data-hook=review-summary-strip-open]", waitFor: "[data-hook=beacon-modal]", wait: 900 }],
  },
  {
    id: "looks-05-no-insights",
    section: "looks",
    title: "Without insights",
    note: "The same hub with the contextual layer stripped out: no strips, no chips, no nuggets, no dialogs. It is what the product looks like on its own, and what a screenshot of it looks like when the AI layer is not the thing being shown.",
    path: `${M}/reviews`,
    insights: false,
  },
  {
    id: "looks-06-no-insights-manager",
    section: "looks",
    title: "The Manager, without insights",
    note: "The same again on the inbox. The plan band goes and the page is the table, the tabs and the facets, which is the product BrightLocal already has.",
    path: `${M}/reviews/manager`,
    insights: false,
  },
];

STATES.push(...LOOKS);

export const STATE_SECTIONS: StateSection[] = (() => {
  const seen: StateSection[] = [];
  for (const s of STATES) if (!seen.includes(s.section)) seen.push(s.section);
  return seen;
})();

export const stateById = (id: string) => STATES.find((s) => s.id === id) ?? null;

export const statesIn = (section: StateSection) => STATES.filter((s) => s.section === section);

/** Where the thumbnail for a state lives once captured. */
export const thumbFor = (id: string) => `/states/${id}.webp`;
