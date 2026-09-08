"use client";

// Promoted from Studio screen "RM — Review Showcase"
// (design dmt094lhmpwbs, version 1788892759000). Registry: lib/screens.ts;
// re-promotion workflow: apps/brightlocal/README.md.
// source-hash: ec9c6f2c393f

// RM — Review Showcase — Rail (7 Sep). A spin-off of "RM — Review Showcase"
// whose create and edit flow is a SETTINGS PAGE WITH A LEFT RAIL instead of a
// four-step wizard. Ali, 7 Sep: "I'm thinking we should switch our Review
// Showcase creation/editing to a similar workflow that we have for the Review
// builder, can you spin off another page so we can work on that, so a left
// rail, I think it works better."
//
// WHAT CHANGED, AND ONLY THIS:
//   The wizard (Type > Reviews > Layout > Design, with Next and Back) is gone.
//   In its place is the shape the Review Builder's template editor already
//   uses: a PageHeader up top, a rail of four sections on the left (icon,
//   label, subtext), one card on the right, and a pinned footer with Cancel
//   and Save. General is a list of setting rows; Reviews, Layout and Design
//   lead with the widget preview and open their controls in a sheet that
//   slides in from the right, with Review Manager's drawer overrides.
//   Creating and editing both run through this page, in this screen, so the
//   New widget button no longer leaves for the separate Create Widget screen.
//   See the "settings page" section below for the decisions.
// EVERYTHING ELSE (data, the widget preview, the cards, the preview and embed
// sheets) is byte-for-byte the original so the two screens can be compared
// like for like. The original screen is untouched.
//
// SECOND PASS, 7 SEP (Ali, on the rail version):
//   "On sources, can we include the logo?" Every place a source is named
//   carries its mark from @brightlocal/proposal's SourceMark: the Sources
//   row on the cards and every source option and trigger in the facets.
//   "Have it much more like an actual list, like what would be displayed."
//   The DataTable picker is gone; see ReviewList.
//   "The filters should stick." The picker's bar is sticky inside the
//   sheet's scroller.
// FOURTH PASS, 7 SEP: three fixed showcases (List, Carousel, JSON feed), no
//   create / name / delete; the review pool is built to Review Tracker's
//   split and star mix (1,116 reviews, 4.7); stars are the DS Rating; each
//   card shows its own embed code. The "SOURCES ARE Google / Facebook /
//   Trustpilot" assumption below is superseded: the pool carries the
//   Tracker's seven sources.
// THIRD PASS, 7 SEP: the picker checkbox sits inside each review card;
//   the mode label is gone (sr-only legend); ratings are three OR'd options
//   (5 stars, 4 stars and above, Recommended) drawn with FeedbackScore
//   glyphs; the search addon gets a gutter; a "Reviews by BrightLocal" line
//   inside the widget, switchable in Design. The Layout section folded into
//   General (name and format, edited in place). See the comments at each site.
//
// RM — Review Showcase. First pass from Harry Brignull's UX audit (11 Aug 2026)
// and the "Review Showcase.dc.html" clickthrough in the newer ZIP.
//
// ─── WHAT THIS PAGE IS ───
// Build an embeddable widget that publishes chosen reviews on the customer's
// own website, as a list, a carousel, or a raw JSON feed. Two ways to choose
// the reviews, and the choice is the FIRST thing the wizard asks because it
// changes every later step:
//
//   HAND-PICKED  a fixed set, chosen by hand, that never changes on its own.
//   LIVE FEED    a filter; new reviews that match are added automatically.
//                Individual reviews can still be excluded by hand.
//
// ─── VIEWS IN THIS ONE SCREEN ───
// list → wizard → list, plus a widget detail page carrying the embed code.
// Same in-screen view model as RM — Review Manager and RM — Review Builder: the
// shell and PageHeader stay mounted, only the body swaps.
//
// WHY THE PICKER IS A LIST (7 Sep)
// It was a DataTable, borrowed from Review Manager. Ali found it clumsy for
// this job: choosing what goes on your website wants to look like the
// website, so the picker is now the widget's own review cards with a box
// beside each. See the review picker section.
//
//
// ─── FINDINGS AND OPEN QUESTIONS LIVE IN A REPORT ───
// packages/studio/registries/brightlocal/reports/RM-GET-REVIEWS-AND-WIDGETS-REPORT.md
//
// That file carries the DS findings, the assumptions to check and the known
// gaps in this first pass. Add to it rather than to this header, which goes
// stale the moment something is fixed.
// ─── ASSUMPTIONS, FOR ALI TO CHECK ───
// 1. SOURCES ARE Google / Facebook / Trustpilot, with Yelp excluded from
//    widgets. CONFIRMED by Ali, 27 Aug: Trustpilot is a real source and
//    stays. Note this list therefore differs from Review Manager and Review
//    Insights, which carry TripAdvisor and not Trustpilot. That is a data
//    difference across the section, not an oversight in this screen.
//    The Yelp exclusion is still the researcher's prototype, stated there
//    as a policy limit, and still needs confirming.
// 2. FACEBOOK HAS NO STARS. Per the audit (section 3.1.1) Facebook returns
//    "Recommended" and "Not recommended", not a 1 to 5 score, so those rows
//    show a thumb rather than stars and the rating facet offers both.
// 3. WIDGETS ARE NAMED BY THE USER. The prototype auto-named them by format,
//    which gives you three widgets called "List widget". A name field with a
//    sensible default costs one input and makes the dashboard readable.
// 4. THE 50-REVIEW CAP on a hand-picked widget is the prototype's number.
//
// ─── HOUSE RULES OBSERVED ───
// Cards get max-w-none. Badge has no success variant. Card-to-card spacing is
// gap-4 on GlobalLayoutContentBody, never space-y-*. The widget preview's DARK
// setting is the one place this screen uses raw Tailwind palette utilities
// rather than semantic tokens: it is painting the CUSTOMER's website
// background, not a Grade surface, so no semantic token applies.

import { useEffect, useMemo, useState } from "react";
import { BeaconPageStrip } from "@/components/review-summary";
import { BeaconNugget } from "@/components/beacon-nugget";
import {
  SidebarProvider,
  SidebarTrigger,
  GlobalLayoutContentBody,
  Logo,
} from "@brightlocal/ui-components";
import {
  useDataTable,
  DataTable,
  DataTableSearch,
  DataTablePagination,
  DataTableSelectAllCheckbox,
  DataTableSelectRowCheckbox,
} from "@brightlocal/ui-components/data-table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
  CardFooter,
  CardDescription,
} from "@brightlocal/ui-components/card";
import { Button } from "@brightlocal/ui-components/button";
import { Badge } from "@brightlocal/ui-components/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@brightlocal/ui-components/dropdown-menu";
import { Input } from "@brightlocal/ui-components/input";
import { Checkbox } from "@brightlocal/ui-components/checkbox";
import { Switch } from "@brightlocal/ui-components/switch";
import { Separator } from "@brightlocal/ui-components/separator";
import { Progress } from "@brightlocal/ui-components/progress";
import { Rating } from "@brightlocal/ui-components/rating";
import { RadioGroup, RadioGroupItem } from "@brightlocal/ui-components/radio-group";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldDescription,
} from "@brightlocal/ui-components/field";
import { Tabs, TabsList, TabsTrigger } from "@brightlocal/ui-components/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "@brightlocal/ui-components/popover";
import {
  Command,
  CommandList,
  CommandGroup,
  CommandItem,
} from "@brightlocal/ui-components/command";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerFooter,
  DrawerClose,
} from "@brightlocal/ui-components/drawer";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselDots,
} from "@brightlocal/ui-components/carousel";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@brightlocal/ui-components/tooltip";
import { AlertInfo, AlertWarning } from "@brightlocal/ui-components/alert";
import {
  Menu,
  Plus,
  Check,
  Copy,
  Trash2,
  Pencil,
  Eye,
  ThumbsUp,
  ThumbsDown,
  X,
  ChevronDown,
  Ban,
  RotateCcw,
  SlidersHorizontal,
  LayoutList,
  GalleryHorizontal,
  Braces,
  Code,
  MoreHorizontal,
  Star,
  FileText,
  ListChecks,
  Palette,
  GoogleOriginal,
  FacebookOriginal,
  TrustpilotOriginal,
} from "@brightlocal/icons";
import { AppLayoutShell, ProposalSidebar, PageHeader, DateStamp, formatDate, SourceMark, FeedbackScore, PreviewFrame, REVIEW_SOURCES } from "@brightlocal/proposal";
// SideSheetHeader, not SheetHeader: the DS barrel already exports a SheetHeader
// (the Sheet family), and the contract check keys on the JSX name.
import { SideSheetHeader } from "@brightlocal/side-sheet-header";
import { FacetedFilterMenu, FacetPopover, FacetOptions, SingleSelectMenu } from "@brightlocal/facet-menu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@brightlocal/ui-components/select";
import { WizardShell } from "@brightlocal/wizard-shell";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@brightlocal/ui-components/alert-dialog";

/* ================================ reference =============================== */

// THE TRACKER'S SEVEN SOURCES, in the Tracker's order, names from the
// registry's REVIEW_SOURCES so every RM screen spells them the same. The
// old three (Google, Facebook, Trustpilot) were this screen's own guess;
// the pool below is built to the Tracker's split, and Trustpilot is not in
// it, so it goes. Facebook is recommendations, not stars (ratingKind).
const SOURCE_IDS = ["google", "facebook", "yelp", "tripadvisor", "yahoo", "apple", "bing"];
const SOURCES = Object.fromEntries(
  SOURCE_IDS.map((id) => [
    id,
    { id, label: REVIEW_SOURCES[id].name, stars: REVIEW_SOURCES[id].ratingKind === "star" },
  ]),
);
const SOURCE_LIST = Object.values(SOURCES);

// THREE RATING OPTIONS, NOT SEVEN (Ali, 7 Sep: "we should only have 4 stars
// and above, 5 stars and above, recommended, and if it is 'all ratings' it
// should be selecting these items"). A widget can therefore never carry a 1
// to 3 star review or a Not recommended, and that is the point: nobody wants
// those on their homepage. The options OR together. "All ratings" ticks all
// three, and an empty list means all three too, so there is no state in which
// nothing matches on ratings alone.
// ASSUMPTION: "4 stars and above" includes 5 stars. Ticking it alone shows 4
// and 5 star reviews, and the card row omits "5 stars" when it is on, since
// it is implied. A legacy "4" (the old per-star id) reads as "4plus".
const RATING_OPTIONS = [
  { id: "5", label: "5 stars" },
  { id: "4plus", label: "4 stars and above" },
  { id: "rec", label: "Recommended (Facebook)" },
];
const ALL_RATINGS = RATING_OPTIONS.map((o) => o.id);

// The ticked options, in menu order, with the two rules above applied:
// "4" becomes "4plus", ids that no longer exist drop, empty means all.
function normaliseRatings(list) {
  const on = ALL_RATINGS.filter((id) =>
    (list ?? []).some((x) => x === id || (id === "4plus" && x === "4")),
  );
  return on.length ? on : ALL_RATINGS;
}

// Does one review pass the ratings filter? OR across the ticked options.
function ratingMatches(review, ratings) {
  const on = normaliseRatings(ratings);
  if (review.source === "facebook") return !!review.recommended && on.includes("rec");
  if (typeof review.rating !== "number") return false;
  return (on.includes("5") && review.rating === 5) || (on.includes("4plus") && review.rating >= 4);
}

// Labels for the card row: ticked options, minus "5 stars" when "4 stars and
// above" already implies it.
function ratingLabels(ratings) {
  const on = normaliseRatings(ratings);
  return RATING_OPTIONS.filter((o) => on.includes(o.id) && !(o.id === "5" && on.includes("4plus"))).map(
    (o) => o.label,
  );
}

const PERIODS = [
  { id: "all", label: "All time", days: null },
  { id: "30", label: "Last 30 days", days: 30 },
  { id: "90", label: "Last 90 days", days: 90 },
  { id: "365", label: "Last 12 months", days: 365 },
];

// THREE SHOWCASES, FIXED (Ali, 7 Sep: "drop create new, and just call them
// three things, this keeps the scope tight and easier to port"). Matches the
// live product: List, Carousel and JSON feed exist once each, are never
// created, named or deleted, and their format is what they are. `caption`
// is the live product's card copy, TRIMMED: the live lines are longer and
// clumsy ("Display your reviews in an ordered, customizable list on your
// website" and so on), so these keep the verb and the noun and drop the rest.
// `heading` is the settings page title and the sheet titles: the card's
// own title, verbatim (Ali, 7 Sep: "each showcase should have a title, even
// if it's just in the page header, it should come from the homepage").
const FORMATS = {
  list: {
    id: "list",
    label: "List",
    heading: "List",
    caption: "Display reviews in an ordered, customizable list",
    Icon: LayoutList,
  },
  carousel: {
    id: "carousel",
    label: "Carousel",
    heading: "Carousel",
    caption: "Display reviews in a compact animated carousel",
    Icon: GalleryHorizontal,
  },
  json: {
    id: "json",
    label: "JSON feed",
    heading: "JSON feed",
    caption: "Use the review data to build your own layout",
    Icon: Braces,
  },
};
const FORMAT_ORDER = ["list", "carousel", "json"];

const MAX_HAND_PICKED = 50;

// Same three sizes as the review panel in Review Manager and the editors in
// Reply Templates, so every per-item overlay on RM is the same surface.
//   phone  (< 640) bottom sheet, full width, none of this applies
//   tablet (640 to 1023) 65%, no sidebar competing below lg
//   desktop (1024+) 50%, the sidebar is back
// Floor 24rem (the DS's own 384), cap 40rem so line length stays readable.
const DRAWER_WIDTH =
  "data-[vaul-drawer-direction=right]:sm:w-[clamp(24rem,65vw,40rem)] " +
  "data-[vaul-drawer-direction=right]:lg:w-[clamp(24rem,50vw,40rem)] " +
  "data-[vaul-drawer-direction=right]:sm:max-w-[40rem]";

// THE SAME POOL AS REVIEW TRACKER, BY CONSTRUCTION (coordinator, 7 Sep:
// "Thirty reviews at 3.8 does not demonstrate a showcase, and the Tracker's
// headline is 1,116 reviews at 4.7 for the same location"). This generator
// copies the Tracker's model exactly: its SOURCE SPLIT (Google 862, Facebook
// 106 recommended and 14 not, Yelp 61, TripAdvisor 38, Yahoo! Local 17,
// Apple Maps 12, Bing Places 6, total 1,116), its STAR MIX over the 996 star
// reviews (836 / 93 / 21 / 13 / 33 from five stars down to one), its
// mulberry32 PRNG with the same fixed seed, and its date spread. So the
// total is 1,116 and the star average 4.7 because the inputs are the same
// numbers, not because two generators happened to land together.
//
// TEXTS AND NAMES ARE NOT NEW. The hand-written review texts are cycled by
// rating band (five stars from HIGH, four from MID, three and below from
// LOW; a Facebook recommendation reads as HIGH, a not-recommended as LOW), so
// a five-star text never sits under a two-star review. Names cycle the
// thirty existing first names, keeping their original initial for the first
// thirty and rotating the same set of initials after that. Nothing here is
// written for this screen.
const TRACKER_SPLIT = [
  { id: "google", stars: 862 },
  { id: "facebook", up: 106, down: 14 },
  { id: "yelp", stars: 61 },
  { id: "tripadvisor", stars: 38 },
  { id: "yahoo", stars: 17 },
  { id: "apple", stars: 12 },
  { id: "bing", stars: 6 },
];
// MUST sum to the star total across TRACKER_SPLIT (996), as in the Tracker.
const STAR_MIX = { 5: 836, 4: 93, 3: 21, 2: 13, 1: 33 };
const SEED_SPAN_DAYS = 1095;

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildReviews() {
  const NAMES = [
    "Sophie H.", "Dan P.", "Priya N.", "Megan F.", "Tom B.", "Rachel W.",
    "Gemma L.", "Ollie S.", "Hannah K.", "Ben C.", "Laura M.", "Chris D.",
    "Amira S.", "Jack T.", "Katie R.", "Steve N.", "Nadia P.", "Pete G.",
    "Ellie V.", "Mark A.", "Charlotte B.", "Josh W.", "Debbie F.", "Fiona R.",
    "Greg H.", "Isla M.", "Noah J.", "Carys E.", "Emma T.", "Fraser D.",
  ];
  const HIGH = [
    "Wonderful day out with the kids. The animal handlers were brilliant and everything felt well looked after.",
    "Fantastic from start to finish. The tractor ride and goat feeding were the highlights for our two.",
    "Best farm park in the area by a mile. Clean, friendly and great value for a family ticket.",
    "The children loved every minute. Lamb feeding, the sandpit and the maize maze. Staff could not have been more helpful.",
    "Lovely setting and really happy animals. The owl encounter made my daughter's whole week.",
    "Great day with the grandchildren. Plenty of shade, good picnic spots and the pig racing is very funny.",
  ];
  const MID = [
    "Really good day out. Only small gripe was the queue at the cafe around lunchtime.",
    "Lots to do and lovely staff. The car park fills up fast on weekends so arrive early.",
    "The kids had a great time. Would be five stars if the ice cream kiosk took card.",
    "Good honest family attraction with well kept animals. Bring wellies after rain.",
  ];
  const LOW = [
    "The animals were lovely but a couple of the advertised attractions were closed on the day.",
    "Decent visit overall, though the cafe had run out of most of the kids' menu by early afternoon.",
    "Disappointing visit. Two attractions closed and the tractor ride cancelled with no notice.",
  ];
  const FIRST = NAMES.map((n) => n.split(" ")[0]);
  const INITIALS = NAMES.map((n) => n.split(" ")[1].replace(".", ""));
  const nameFor = (i) => `${FIRST[i % FIRST.length]} ${INITIALS[(i + Math.floor(i / FIRST.length)) % INITIALS.length]}.`;

  const rand = mulberry32(20260816);
  // One star bucket per star review, shuffled once (Fisher-Yates), then
  // dealt out source by source, as the Tracker does.
  const pool = [];
  Object.entries(STAR_MIX).forEach(([bucket, n]) => {
    for (let i = 0; i < n; i += 1) pool.push(Number(bucket));
  });
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const raw = [];
  let cursor = 0;
  TRACKER_SPLIT.forEach((source) => {
    if (source.stars) {
      for (let i = 0; i < source.stars; i += 1) {
        raw.push({ source: source.id, rating: pool[cursor], recommended: null });
        cursor += 1;
      }
    } else {
      for (let i = 0; i < source.up; i += 1) raw.push({ source: source.id, rating: null, recommended: true });
      for (let i = 0; i < source.down; i += 1) raw.push({ source: source.id, rating: null, recommended: false });
    }
  });
  const bandOf = (r) => (r.rating === 5 || r.recommended === true ? HIGH : r.rating === 4 ? MID : LOW);
  const counters = new Map();
  const textFor = (r) => {
    const band = bandOf(r);
    const k = counters.get(band) ?? 0;
    counters.set(band, k + 1);
    return band[k % band.length];
  };
  const dated = raw.map((r, i) => ({
    ...r,
    name: nameFor(i),
    text: textFor(r),
    daysAgo: Math.floor(SEED_SPAN_DAYS * Math.pow(rand(), 1.3)),
    order: i,
  }));
  // NEWEST FIRST, which every consumer on this screen assumes (the list
  // format, the cap, the picker's "newest 100"). Ties keep deal order.
  dated.sort((a, b) => a.daysAgo - b.daysAgo || a.order - b.order);
  return dated.map((r, i) => ({
    id: `r${i + 1}`,
    name: r.name,
    source: r.source,
    rating: r.rating,
    recommended: r.recommended,
    daysAgo: r.daysAgo,
    date: shortDate(r.daysAgo),
    text: r.text,
  }));
}

function isoDate(daysAgo) {
  const d = new Date(Date.UTC(2026, 7, 19));
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}
function shortDate(daysAgo) {
  return formatDate(isoDate(daysAgo));
}

const REVIEWS = buildReviews();

function blankWidget() {
  return {
    id: null,
    // ABSOLUTE DATES ONLY (Ali, 2 Sep: "not sure things such as '5 days
    // ago' are relevant — let's just display the actual date everywhere,
    // formatted as per the 'last updated' string"). Stored as ISO and put
    // through `formatDate` from @brightlocal/proposal at the point of
    // display, which is the same function the page header's Last updated
    // line uses, so RM has ONE date format instead of one per screen.
    updated: "2026-08-27T10:15",
    // SENSIBLE DEFAULTS (Ali, 7 Sep: "NOT Any rating, just 4 and 5 stars,
    // something like 4 stars and above. I dont see a case where anyone will
    // want to show 1 star reviews. A limit by default of 5. Live by default
    // as it has the least friction"). So a new widget is a live feed of the
    // location's 4 star and above reviews, capped at five, and renders a
    // real widget before anything is touched. Every one of these is one
    // click away from different.
    // ASSUMPTION: the default pairs "4 stars and above" with Facebook's
    // Recommended. It is that source's only positive rating, so leaving it
    // out would silently drop every Facebook review from the default feed.
    mode: "feed",
    format: "list",
    picked: [],
    sources: [],
    ratings: ["4plus", "rec"],
    period: "all",
    // A CAP BY DEFAULT (Ali, 2 Sep: "if it's live reviews, this could be a
    // VERY large list"). It was "all", which on a live feed means a widget
    // that grows without bound: a business collecting four reviews a week
    // has two hundred on its homepage inside a year, and nobody chose that.
    //
    // FIVE, not ten (Ali, 3 Sep). Five is the right default for the two
    // formats this actually renders as: a carousel shows one at a time, so
    // the cap is how long the loop is before it repeats, and five is a loop
    // somebody might watch to the end; a list of five fits a homepage
    // section without pushing the rest of the page down. Ten was a round
    // number rather than an argument. "No limit" is still one select away.
    limit: 5,
    // Reviews a LIVE FEED leaves out by hand (the live product's per-review
    // Blacklist toggle). Ids; honoured by resolveReviews so the preview and
    // every count follow. Unused by a hand-picked set.
    excluded: [],
    design: {
      theme: "light",
      corners: "rounded",
      length: "full",
      showName: true,
      showSource: true,
      showDate: true,
      // See WidgetBranding. Every seed inherits this through {...base.design}.
      branding: true,
      // See WidgetHeader. The title the live widgets carry, and the stats
      // block on by default: standard on review widgets.
      title: "Customer Reviews",
      summary: true,
      // See CarouselWidget. Loop on, autoplay off, both controls on: the
      // carousel looks exactly as it did before these existed.
      carousel: { loop: true, autoplay: false, every: 4, arrows: true, dots: true },
    },
  };
}

// The three showcases, one per format, ids equal to the format. The old
// seeds' settings map straight across: "Best of the year" is the List
// (hand-picked five-star reviews, dark, square, snippets), "Homepage
// carousel" is the Carousel (live feed, Google and Trustpilot, four stars and
// up, last 12 months), "Site feed" is the JSON feed (live feed, defaults).
function seedWidgets() {
  const base = blankWidget();
  return [
    {
      ...base,
      id: "list",
      updated: "2026-07-04T09:25",
      mode: "picked",
      format: "list",
      picked: REVIEWS.filter((r) => r.rating === 5).slice(0, 5).map((r) => r.id),
      design: { ...base.design, theme: "dark", corners: "square", length: "snippet" },
    },
    {
      ...base,
      id: "carousel",
      updated: "2026-08-21T16:40",
      mode: "feed",
      format: "carousel",
      // "google" and "trustpilot" before the pool moved to the Tracker's
      // split; Trustpilot is not in that split, so it drops rather than being
      // swapped for a source nobody chose.
      sources: ["google"],
      ratings: ["4plus", "rec"],
      period: "365",
      design: { ...base.design, theme: "light", corners: "rounded", length: "full" },
    },
    {
      ...base,
      id: "json",
      mode: "feed",
      format: "json",
      ratings: ["4plus", "rec"],
    },
  ];
}

/* ================================= helpers ================================ */

// The set of reviews a widget resolves to. Hand-picked widgets are their own
// list; live feeds are the filter, minus anything excluded by hand.
// Does a review pass a live feed's FILTERS (sources, ratings, period)? The
// hand exclusions are applied on top, separately, so the card can say how
// many matching reviews were left out.
function feedMatches(widget, r) {
  const period = PERIODS.find((p) => p.id === widget.period);
  if (widget.sources.length && !widget.sources.includes(r.source)) return false;
  if (!ratingMatches(r, widget.ratings)) return false;
  if (period?.days && r.daysAgo > period.days) return false;
  return true;
}
const excludedOf = (widget) => widget.excluded ?? [];

function resolveReviews(widget) {
  if (widget.mode === "picked") return REVIEWS.filter((r) => widget.picked.includes(r.id));
  // The cap is applied LAST, after every filter, and the list is already in
  // newest-first order, so "Newest 5" is the five most recent reviews that
  // match rather than five arbitrary ones. See the limit control on the
  // reviews step.
  const capped = (list) =>
    typeof widget.limit === "number" ? list.slice(0, widget.limit) : list;
  return capped(REVIEWS.filter((r) => feedMatches(widget, r) && !excludedOf(widget).includes(r.id)));
}

// KEY/VALUE ROWS, NOT AN INTERPUNCT STRING (Ali, 2 Sep: "having all the
// options in a row with interpuncts is not very visual at all — I'd
// probably have them as key value pairs").
//
// "Live feed: 5 star, 4 star, recommended · Google, Trustpilot · last 12
// months" is three different facts glued into one sentence, and the reader
// has to work out where each one starts. It also wrapped to two lines on
// every card, which is where the illegibility became obvious. As rows the
// three facts are three rows, scannable down the left, and the card matches
// the campaign cards on Review Builder, which already read this way.
//
// Returns rows, not a string. The one-line form is gone from every caller.
function widgetRows(widget) {
  if (widget.mode === "picked") {
    return [
      { k: "Reviews", v: `${widget.picked.length} chosen by hand` },
    ];
  }
  return [
    // The ticked rating options by label; see ratingLabels for why "5 stars"
    // drops out when "4 stars and above" is on.
    { k: "Ratings", v: ratingLabels(widget.ratings).join(", ") },
    {
      k: "Sources",
      // MARKS BESIDE NAMES (Ali, 7 Sep: "on sources, can we include the
      // logo?"). Chosen sources show mark and name each, in the fixed source
      // order rather than click order; "Any source" shows the marks of every
      // source on offer and then the words, so the row says which sites
      // "any" means. SourceMark is the registry's, not a local drawing.
      v: (
        <span className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
          {widget.sources.length ? (
            SOURCE_LIST.filter((s) => widget.sources.includes(s.id)).map((s) => (
              <span key={s.id} className="flex items-center gap-1.5">
                <SourceMark source={s.id} />
                {s.label}
              </span>
            ))
          ) : (
            // Words only (Ali, 7 Sep: "on any sources not sure why we show 3
            // icons"). Marks stand for chosen sources; "any" is the absence of
            // a choice, so it gets no marks.
            <span>Any source</span>
          )}
        </span>
      ),
    },
    { k: "Period", v: PERIODS.find((x) => x.id === widget.period)?.label ?? "All time" },
    // The cap belongs on the card: "Showing now" says how many there are
    // TODAY, which on a live feed is not the same as how many there can be.
    // "5 reviews", not "Newest 5" (Ali, 7 Sep: "easier to read"). Newest
    // first is still how the cap is applied; it is just not in the label.
    { k: "Limit", v: typeof widget.limit === "number" ? `${widget.limit} reviews` : "No limit" },
    // Always rendered, "Left out: 0" included, so the row count never
    // changes as reviews are unticked and re-ticked.
    {
      k: "Left out",
      v: String(REVIEWS.filter((r) => excludedOf(widget).includes(r.id) && feedMatches(widget, r)).length),
    },
  ];
}

// THE LIVE PRODUCT'S EMBED, SAME SHAPE (Ali, 7 Sep, pasted from the live
// site):
//   <div data-embed-placeholder="18436"><script defer src="https://www.
//   local-marketing-reports.com/external/showcase-reviews/embed/<40 hex>
//   ?id=18436"></script></div>
// The numeric id and the 40-character hex key are ILLUSTRATIVE OF THE
// SHAPE: both derived deterministically from the showcase id by a small
// FNV-style hash, so they never change between renders and each seed
// showcase gets its own. In reality both are issued by the API.
function hash32(seed, salt) {
  let h = (0x811c9dc5 ^ salt) >>> 0;
  for (let i = 0; i < seed.length; i += 1) h = Math.imul(h ^ seed.charCodeAt(i), 0x01000193) >>> 0;
  return h;
}
const embedId = (widget) => 10000 + (hash32(`showcase:${widget.id ?? "new"}`, 0) % 90000);
const embedKey = (widget) =>
  [1, 2, 3, 4, 5].map((salt) => hash32(`showcase:${widget.id ?? "new"}`, salt).toString(16).padStart(8, "0")).join("");
const EMBED_BASE = "https://www.local-marketing-reports.com/external/showcase-reviews/embed";
const embedSrc = (widget) => `${EMBED_BASE}/${embedKey(widget)}?id=${embedId(widget)}`;
// The JSON feed URL, shape from a real feed Ali supplied (7 Sep): the
// widgets path with the same 40-hex showcase key, no id, no format parameter.
const FEED_BASE = "https://www.local-marketing-reports.com/external/showcase-reviews/widgets";
const feedUrl = (widget) => `${FEED_BASE}/${embedKey(widget)}`;

// The List / Carousel snippet: Ali's comment line naming the showcase, then
// the live product's one line, `defer` as it ships.
function embedSnippet(widget) {
  const open = String.fromCharCode(60);
  const close = String.fromCharCode(62);
  // The comment names the TYPE, since showcases have no names of their own.
  const name = FORMATS[widget.format].label;
  const id = embedId(widget);
  return [
    `${open}!-- BrightLocal review showcase: ${name} --${close}`,
    `${open}div data-embed-placeholder="${id}"${close}${open}script defer src="${embedSrc(widget)}"${close}${open}/script${close}${open}/div${close}`,
  ].join("\n");
}

/* ============================== small pieces ============================== */

function ChoiceCards({ name, value, onChange, options, columns = 1, labelledBy }) {
  return (
    <RadioGroup
      dataHook={`${name}-radio-group`}
      variant="box"
      value={value ?? ""}
      onValueChange={onChange}
      aria-labelledby={labelledBy}
    >
      <div
        className={
          columns === 3
            ? "grid gap-3 sm:grid-cols-3"
            : columns === 2
              ? "grid gap-3 sm:grid-cols-2"
              : "grid gap-3"
        }
      >
        {options.map((o) => (
          <Field key={o.id} orientation="horizontal" variant="box">
            <RadioGroupItem id={`${name}-${o.id}`} value={o.id} />
            <FieldContent>
              <FieldLabel htmlFor={`${name}-${o.id}`} dataHook={`${name}-${o.id}-label`}>
                {o.label}
              </FieldLabel>
              {o.caption ? (
                <FieldDescription dataHook={`${name}-${o.id}-desc`}>{o.caption}</FieldDescription>
              ) : null}
            </FieldContent>
          </Field>
        ))}
      </div>
    </RadioGroup>
  );
}

// BackRow is gone. It rendered "← Review Showcase" above the widget detail,
// which is a back link doing a breadcrumb's job in a worse place: it sat
// INSIDE the page body, below a header that already carries the trail, and
// duplicated a route the crumb row states properly (Ali, 27 Aug: "I dont
// want weird back links like this"). The detail view now adds a real fourth
// crumb instead, which is what widening the clamp to four was for.
//
// The wizard's Cancel kept a plain button with no arrow: cancelling a draft
// is an ACTION, not a move up the hierarchy, and a back arrow claimed
// otherwise.

/* ============================= widget preview ============================= */

// The one place the customer's own website is being painted rather than a
// Grade surface, so the dark setting uses Tailwind neutrals directly. Every
// other colour on this screen is a semantic token.
function previewSkin(design) {
  const dark = design.theme === "dark";
  return {
    shell: dark ? "bg-neutral-900" : "bg-neutral-50",
    card: dark
      ? "bg-neutral-800 border-neutral-700 text-neutral-100"
      : "bg-white border-neutral-200 text-neutral-800",
    meta: dark ? "text-neutral-400" : "text-neutral-500",
    name: dark ? "text-white" : "text-neutral-900",
    radius: design.corners === "rounded" ? "rounded-lg" : "rounded-none",
  };
}

// THE DS Rating, NOT HAND-DRAWN STARS (Ali, 7 Sep: "we need to use our
// Reviews star rating"). Rating fills each star by percentage (checked in
// its dist: a width-clipped overlay per star), so the header's 4.7 shows
// four full stars and a seven-tenths fifth, and a review row shows whole
// stars. It is what FeedbackScore draws on Review Manager and Review
// Builder, so a star now looks the same on every RM screen. KNOWN DS
// FINDING (19 Aug, still open): its empty star is `fill-muted`, a near-white
// surface token, so on the dark theme the empty stars read pale; logged
// upstream, not worked around here.

function PreviewReview({ review, design, skin, leading = null, contentClassName = "" }) {
  // SNIPPET MODE ENDS IN "Read more" (coordinator, 7 Sep, from the live
  // widgets): about 140 characters, then an underlined anchor, not a button,
  // because on the customer's site it opens the review at its source. Here
  // it goes nowhere. Full mode is the whole text.
  const clipped = design.length === "snippet" && review.text.length > 140;
  const text = clipped ? `${review.text.slice(0, 137).trimEnd()}…` : review.text;
  const sourceName = SOURCES[review.source].label;
  const body = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {review.source === "facebook" ? (
          review.recommended ? (
            <span className="flex items-center gap-1 text-sm">
              <ThumbsUp className="size-4" /> Recommended
            </span>
          ) : (
            <span className="flex items-center gap-1 text-sm">
              <ThumbsDown className="size-4" /> Not recommended
            </span>
          )
        ) : (
          <Rating value={review.rating} dataHook={`review-rating-${review.id}`} />
        )}
        {design.showName ? (
          <span className={`text-sm font-semibold ${skin.name}`}>{review.name}</span>
        ) : null}
        {design.showDate ? <span className={`text-xs ${skin.meta}`}>{review.date}</span> : null}
        {/* THE SOURCE AS ITS MARK, at the right of the line, as the live
            widgets draw it (coordinator, 7 Sep). This is the one place we had
            said the published widget would not change; the live product does
            it, so now we follow it. The name survives for assistive tech and
            as a hover title. */}
        {design.showSource ? (
          <span className="ml-auto flex" role="img" aria-label={sourceName} title={sourceName} data-hook="review-source-mark">
            <SourceMark source={review.source} />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-relaxed">
        {text}
        {clipped ? (
          <>
            {" "}
            <a
              href="#"
              className="underline underline-offset-2"
              onClick={(e) => e.preventDefault()}
              data-hook="review-read-more"
            >
              Read more
            </a>
          </>
        ) : null}
      </p>
    </>
  );
  return (
    <div className={`border p-4 ${skin.card} ${skin.radius}`}>
      {leading ? (
        <div className="flex items-center gap-3">
          {leading}
          <div className={`min-w-0 flex-1 ${contentClassName}`}>{body}</div>
        </div>
      ) : (
        body
      )}
    </div>
  );
}

// 7. BRANDING (Ali, 7 Sep). One muted line inside the widget's own box,
// "Reviews by" and the BrightLocal wordmark, the same Logo the app shell
// draws, sized to the line. The wordmark is currentColor, so it takes the
// widget's muted text colour and stays legible on the dark theme. Ungated:
// on for everyone by default and switchable in Design; whether a plan may
// hide it is a later business decision, not a UI one.
// 7. HEADER ROW, as the LIVE widgets have it (coordinator, 7 Sep, from
// screenshots): a title on the left ("Customer Reviews"), and on the right a
// small "{total} Total Reviews" line above stars and the bold average.
// ASSUMPTION: both numbers come from the location's FULL review pool on this
// screen (REVIEWS, every review the screen knows about), never the filtered
// subset: a summary of five reviews means nothing. The average is over star
// ratings only, since Facebook recommendations carry no score; the total
// counts every review. Both agree with Review Tracker's headline because the
// pool is built to the Tracker's split and star mix (see buildReviews).
// An empty title hides the title and keeps the stats; the switch off keeps
// the title alone; both gone and the row is not drawn at all.
const POOL_TOTAL = REVIEWS.length;
const fmtCount = (n) => n.toLocaleString("en-GB");
const POOL_AVERAGE = (() => {
  const stars = REVIEWS.filter((r) => typeof r.rating === "number").map((r) => r.rating);
  return stars.length ? stars.reduce((a, b) => a + b, 0) / stars.length : 0;
})();
const headerTitle = (design) => (design.title ?? "").trim();
const hasHeader = (design) => design.summary !== false || headerTitle(design).length > 0;
function WidgetHeader({ design, skin }) {
  const title = headerTitle(design);
  const stats = design.summary !== false;
  if (!title && !stats) return null;
  return (
    // flex-wrap with a nowrap title: on a narrow widget the stats block drops
    // under the title rather than the title breaking mid-word beside it.
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1" data-hook="widget-header">
      {title ? (
        <span className={`text-base font-semibold whitespace-nowrap ${skin.name}`} data-hook="widget-header-title">
          {title}
        </span>
      ) : (
        <span />
      )}
      {stats ? (
        <div className="flex flex-col items-end gap-0.5 text-right" data-hook="widget-header-stats">
          <span className={`text-xs ${skin.meta}`}>{fmtCount(POOL_TOTAL)} Total Reviews</span>
          <span className="flex items-center gap-1.5">
            <Rating value={Number(POOL_AVERAGE.toFixed(1))} dataHook="widget-header-rating" />
            <span className={`text-sm font-semibold ${skin.name}`}>{POOL_AVERAGE.toFixed(1)}</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}

function WidgetBranding({ skin }) {
  return (
    <div className={`flex items-center justify-center gap-1.5 text-xs leading-4 ${skin.meta}`} data-hook="widget-branding">
      <span>Reviews by</span>
      {/* CENTRED TO THE PIXEL (Ali, 7 Sep: "they need centrally aligning").
          The DS Logo's svg carries width=128 height=24 attributes and ignored
          the h-3.5 on its wrapper, so it drew 24px tall inside a 14px box and
          sat 5px low. [&_svg]:h-full makes the mark fit the wrapper; h-3
          was the first size; h-4 (16px) now, a touch bigger (Ali, 7 Sep:
          "increase the logo size in the Reviews by area, just a touch"), with
          the text still text-xs; items-center keeps the mark's centre on the
          text line's centre (re-measured). */}
      <Logo
        className="h-4 w-auto [&_svg]:h-full [&_svg]:w-auto"
        dataHook="widget-branding-logo"
        ariaLabel="BrightLocal"
      />
    </div>
  );
}

// 6. CAROUSEL SETTINGS (Ali, 7 Sep). Read through carouselOf so a record
// saved before these existed behaves as the defaults.
// 4 seconds is embla-carousel-autoplay's default delay (4000 ms), so the
// interval choices start there and the default matches the plugin.
const CAROUSEL_DEFAULTS = { loop: true, autoplay: false, every: 4, arrows: true, dots: true };
const AUTOPLAY_EVERY = [4, 6, 8, 10];
const carouselOf = (design) => {
  const c = { ...CAROUSEL_DEFAULTS, ...(design.carousel ?? {}) };
  // A stored interval that is no longer offered (an older draft's 5) snaps
  // to the default rather than leaving the select blank.
  return AUTOPLAY_EVERY.includes(c.every) ? c : { ...c, every: CAROUSEL_DEFAULTS.every };
};

// DOTS WITH A HIT AREA APART FROM THE DOT (Ali, 7 Sep: "the dots will need a
// hit area that is separate"). The DS CarouselDots draws each dot AS the
// button (size-3, a w-9 active pill, in a bordered white capsule) and has no
// size prop, so this scoped sheet restyles it: each button becomes a 24px
// square, edge to edge, and the 6px dot (16px pill when current) is drawn by
// its ::before, centred. Tokens only: input for a dot, muted-foreground at
// reduced opacity for the current one, as the DS itself does.
const CAROUSEL_DOTS_STYLE = `
[data-hook="widget-carousel-dots"] { gap: 0; border: 0; background: transparent; padding: 0; }
[data-hook="widget-carousel-dots"] [data-slot="carousel-dot"] {
  width: 1.5rem; height: 1.5rem; display: flex; align-items: center; justify-content: center;
  background: transparent; border-radius: 9999px;
}
[data-hook="widget-carousel-dots"] [data-slot="carousel-dot"]::before {
  content: ""; display: block; width: 0.375rem; height: 0.375rem; border-radius: 9999px;
  background: var(--color-input, var(--input)); transition: width 200ms ease-in-out;
}
[data-hook="widget-carousel-dots"] [data-slot="carousel-dot"]:hover::before {
  background: var(--color-muted-foreground, var(--muted-foreground)); opacity: 0.3;
}
[data-hook="widget-carousel-dots"] [data-slot="carousel-dot"][aria-current="step"]::before {
  width: 1rem; background: var(--color-muted-foreground, var(--muted-foreground)); opacity: 0.5;
}
`;

// The carousel format of the widget. Its own component because autoplay
// needs the Embla api and a little state, and WidgetPreview is the ONE place
// the widget renders, so the settings card, the Preview sheet and the picker
// all get the same behaviour.
//
// AUTOPLAY BY HAND. The DS ships embla-carousel-react but not the autoplay
// plugin, so this is the plugin's behaviour in an effect: scrollNext on an
// interval, paused while the pointer or focus is inside, stopped for good
// once the user takes the wheel (a drag, an arrow, a dot), and never started
// under prefers-reduced-motion. Swapping in embla-carousel-autoplay via the
// Carousel's `plugins` prop is the production route.
function CarouselWidget({ widget, reviews, skin, branded }) {
  const c = carouselOf(widget.design);
  const [api, setApi] = useState(null);
  const [paused, setPaused] = useState(false);
  const [stopped, setStopped] = useState(false);
  useEffect(() => {
    if (!api) return;
    const stop = () => setStopped(true);
    api.on("pointerDown", stop);
    return () => api.off("pointerDown", stop);
  }, [api]);
  // Switching autoplay (or its interval) on again is a fresh start.
  useEffect(() => {
    setStopped(false);
  }, [c.autoplay, c.every]);
  useEffect(() => {
    if (!api || !c.autoplay || paused || stopped) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => api.scrollNext(), c.every * 1000);
    return () => clearInterval(t);
  }, [api, c.autoplay, c.every, paused, stopped]);
  const controls = c.arrows || c.dots;
  return (
    <div
      className={`min-w-0 rounded-lg p-4 ${skin.shell}`}
      // "-shell": the dashboard card for the Carousel showcase is
      // data-hook="widget-carousel" (widget-<id>), so the box needs its own.
      data-hook="widget-carousel-shell"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <style>{CAROUSEL_DOTS_STYLE}</style>
      {hasHeader(widget.design) ? (
        <div className="mb-3">
          <WidgetHeader design={widget.design} skin={skin} />
        </div>
      ) : null}
      <Carousel dataHook="widget-carousel-preview" opts={{ loop: c.loop }} setApi={setApi}>
        <CarouselContent>
          {/* EVERY SLIDE THE HEIGHT OF THE TALLEST (Ali, 7 Sep: "move the
              pagination much closer to the review"). The track is as tall
              as its tallest slide, so a short review left up to 70px of
              air under its card before the arrows. The item is a flex box
              and the card its stretched child, so the card always reaches
              the bottom of the track and the controls sit one gap below. */}
          {reviews.slice(0, 8).map((r) => (
            <CarouselItem key={r.id} className="flex">
              <PreviewReview review={r} design={widget.design} skin={skin} />
            </CarouselItem>
          ))}
        </CarouselContent>
        {/* Arrows and dots each switchable; with both off the row is not
            drawn and the branding line moves up, which is the user's choice.
            Pressing either stops autoplay, as the plugin would. */}
        {controls ? (
          <div
            className="mt-3 flex items-center justify-center gap-3"
            data-hook="widget-carousel-controls"
            onPointerDownCapture={() => setStopped(true)}
          >
            {c.arrows ? (
              <CarouselPrevious size="sm" dataHook="widget-carousel-prev" className="static translate-x-0 translate-y-0" />
            ) : null}
            {c.dots ? (
              <CarouselDots dataHook="widget-carousel-dots" slideAriaLabel="Go to review {slide}" />
            ) : null}
            {c.arrows ? (
              <CarouselNext size="sm" dataHook="widget-carousel-next" className="static translate-x-0 translate-y-0" />
            ) : null}
          </div>
        ) : null}
      </Carousel>
      {branded ? (
        <div className="mt-3">
          <WidgetBranding skin={skin} />
        </div>
      ) : null}
    </div>
  );
}

function WidgetPreview({ widget, reviews }) {
  const skin = previewSkin(widget.design);
  const branded = widget.design.branding !== false;

  if (reviews.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
        No reviews match yet. Widen the filter, or pick some reviews.
      </div>
    );
  }

  if (widget.format === "json") {
    // A JSON SHOWCASE IS A URL, NOT A BLOCK OF JSON (Ali, 7 Sep: "Currently
    // the embed or JSON payload is a URL, not a block of JSON"; the live
    // product never renders the payload). So wherever the widget would be
    // previewed, a JSON showcase shows the same EmbedCode the Embed card
    // uses, feed URL and Copy, nothing else. Faded with Copy disabled until
    // the showcase is saved, as on the Embed card.
    return <EmbedCode widget={widget} disabled={!widget.id} steps={false} hook="widget-feed-url" />;
  }

  if (widget.format === "carousel") {
    return <CarouselWidget widget={widget} reviews={reviews} skin={skin} branded={branded} />;
  }

  return (
    <div className={`flex min-w-0 flex-col gap-3 rounded-lg p-4 ${skin.shell}`}>
      <WidgetHeader design={widget.design} skin={skin} />
      {reviews.slice(0, 4).map((r) => (
        <PreviewReview key={r.id} review={r} design={widget.design} skin={skin} />
      ))}
      {reviews.length > 4 ? (
        <span className={`text-center text-xs ${skin.meta}`}>
          and {reviews.length - 4} more review{reviews.length - 4 === 1 ? "" : "s"}
        </span>
      ) : null}
      {branded ? <WidgetBranding skin={skin} /> : null}
    </div>
  );
}

/* ============================== review picker ============================= */

// A LIST OF THE REVIEWS THEMSELVES, NOT A TABLE (Ali, 7 Sep: "when we choose
// the reviews for the widget, have it much more like an actual list, like
// what would be displayed. So more like the preview. Feels clumsy right
// now"). Every row is PreviewReview, the SAME component the widget preview
// draws, in the widget's own design and on the widget's own shell, so a
// review looks identical in the picker and in the preview. A DS Checkbox at
// the left edge is the one control: hand-picked, ticking adds it to
// `picked`; live feed, unticking leaves it out (`removed`). Nothing leaves
// the list when its box changes, a left-out review only fades, so ticking
// never moves anything else.
//
// THE BAR STICKS (Ali, 7 Sep: "the filters should stick"). The facets
// and the running count sit in one bar pinned to the top of the
// sheet's scroller while the list scrolls under it. It is a DIRECT CHILD of
// the DrawerBody (the scroller) because a sticky element cannot travel
// outside its parent's box, which is the bug the Builder hit today. That is
// also why ReviewList returns a fragment and the reviews sheet drops
// DrawerBody's padding: the bar and the list carry their own.
//
// The count opens the bar's second row, so it is in the same place whatever
// the mode and it never moves when a box is ticked.

// The trigger label for a facet: the value when one is chosen, with its mark
// when that value is a source, and a count when several are.
function sourceFacetLabel(sources) {
  if (sources.length === 0) return "All sources";
  if (sources.length === 1) {
    return (
      <span className="flex items-center gap-1.5">
        <SourceMark source={sources[0]} />
        {SOURCES[sources[0]].label}
      </span>
    );
  }
  return `${sources.length} sources`;
}

function ratingFacetLabel(ratings) {
  const on = normaliseRatings(ratings);
  if (on.length === ALL_RATINGS.length) return "All ratings";
  if (on.length === 1) return RATING_OPTIONS.find((o) => o.id === on[0]).label;
  return `${on.length} ratings`;
}

// The glyph beside each rating option, as Review Manager's rating menu draws
// them: FeedbackScore from the registry. Stars take a score out of ten (the
// component halves it), Recommended is the thumbs-up.
function ratingGlyph(id) {
  if (id === "rec") return <FeedbackScore type="thumbs" score={10} />;
  return <FeedbackScore type="stars" score={id === "5" ? 10 : 8} />;
}

// "5 reviews", not "Newest 5" (Ali, 7 Sep: "easier to read"), and "No
// limit" rather than the old select's "All matching reviews", because that is
// what the Limit row on the card already calls it.
const LIMIT_OPTIONS = [
  { id: "all", label: "No limit" },
  { id: "3", label: "3 reviews" },
  { id: "5", label: "5 reviews" },
  { id: "10", label: "10 reviews" },
  { id: "20", label: "20 reviews" },
];

// One review in the picker: the review card with a DS Checkbox INSIDE it, at
// the left edge and centred on the card (PreviewReview's `leading` slot), so
// the box is attached to the thing it controls. The whole card is the click
// target; clicks that start on the box itself are left to the box, or one
// click would toggle twice.
//
// BOTH MODES SELECT (Ali, 7 Sep: "in the live feed we would select to
// exclude"; the live product has a per-review Blacklist toggle). Hand-picked:
// tick to include. Live feed: every match is ticked, untick to leave it out
// (`excluded`). An unselected review's CONTENT is knocked back to half
// opacity while the box keeps full contrast (Ali: "lower opacity, but not on
// the checkbox"); nothing else changes, so a tick never moves a card. The
// DS Tooltip on the box says which behaviour it has; the box is focusable,
// so the tooltip is reachable by keyboard too.
const PICK_TIP = {
  feed: "Included in the feed. Untick to leave this review out.",
  picked: "Tick to include this review.",
};
function PickerRow({ review, design, skin, checked, disabled, mode, onChange }) {
  // DS Checkbox ships `self-start mt-0.5` (right for a label row, where the
  // box tops the first line), which beat the card row's items-center and
  // left the box 14px above centre. self-center and mt-0 put it where the
  // row asks. Measured, not guessed. The Tooltip trigger is a span round the
  // box, not the box itself: a Slot merge drops a Button's data-hook (DS
  // finding, 19 Aug) and the same risk applies here, and React's onFocus
  // bubbles from the box to the span, so focus still opens the tip.
  const box = (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex self-center" data-hook={`picker-check-wrap-${review.id}`}>
          <Checkbox
            id={`pick-${review.id}`}
            dataHook={`picker-check-${review.id}`}
            className="mt-0 self-center"
            checked={checked}
            disabled={disabled}
            onCheckedChange={(v) => onChange(!!v)}
            aria-label={`${checked ? "Leave out" : "Include"} the review from ${review.name}`}
          />
        </span>
      </TooltipTrigger>
      <TooltipContent>{PICK_TIP[mode] ?? PICK_TIP.picked}</TooltipContent>
    </Tooltip>
  );
  return (
    <div
      role="presentation"
      data-hook={`picker-row-${review.id}`}
      data-selected={checked ? "true" : "false"}
      onClick={
        disabled
          ? undefined
          : (e) => {
              if (e.target.closest('[role="checkbox"]')) return;
              onChange(!checked);
            }
      }
      className={disabled ? "cursor-not-allowed" : "cursor-pointer"}
    >
      <PreviewReview
        review={review}
        design={design}
        skin={skin}
        leading={box}
        contentClassName={`transition-opacity ${checked ? "" : "opacity-50"}`}
      />
    </div>
  );
}

// Returns a FRAGMENT: [sticky bar, list]. Mount it directly inside the
// scroller; see the note at the top of this section.
function ReviewList({ widget, setWidget }) {
  const picked = widget.mode === "picked";
  // In feed mode the facets ARE the widget; in picked mode they only narrow
  // the browsing list, so they live in local state and never touch the widget.
  const [browseSources, setBrowseSources] = useState([]);
  const [browseRatings, setBrowseRatings] = useState([]);
  const sources = picked ? browseSources : widget.sources;
  const ratings = picked ? browseRatings : widget.ratings;
  const toggleIn = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const onSource = (id) =>
    picked
      ? setBrowseSources((s) => toggleIn(s, id))
      : setWidget((w) => ({ ...w, sources: toggleIn(w.sources, id) }));
  // Ratings toggle against the NORMALISED list, so unticking one of an
  // implicit "all three" leaves the other two on rather than flipping the
  // list from empty to one. Unticking the last one lands on empty, which
  // reads as all three again; that is the stated rule, not a bug.
  const onRating = (id) =>
    picked
      ? setBrowseRatings((s) => toggleIn(normaliseRatings(s), id))
      : setWidget((w) => ({ ...w, ratings: toggleIn(normaliseRatings(w.ratings), id) }));
  const clearSources = () => (picked ? setBrowseSources([]) : setWidget((w) => ({ ...w, sources: [] })));
  // "All ratings" TICKS all three (Ali, 7 Sep), it does not clear.
  const clearRatings = () =>
    picked ? setBrowseRatings(ALL_RATINGS) : setWidget((w) => ({ ...w, ratings: ALL_RATINGS }));
  const ratingsOn = normaliseRatings(ratings);
  const period = PERIODS.find((p) => p.id === widget.period);

  const matching = useMemo(
    () =>
      REVIEWS.filter((r) => {
        if (sources.length && !sources.includes(r.source)) return false;
        if (!ratingMatches(r, ratings)) return false;
        if (!picked && period?.days && r.daysAgo > period.days) return false;
        return true;
      }),
    [sources, ratings, period, picked],
  );
  // THE NEWEST 100, not 1,116 cards (coordinator, 7 Sep). The facets are the
  // only way to narrow the list; when more than 100 still match, the list
  // holds the newest 100 and the count line says so, in its fixed place.
  const PICKER_LIMIT = 100;
  const shown = matching.slice(0, PICKER_LIMIT);
  const truncNote = matching.length > PICKER_LIMIT ? `, showing the newest ${PICKER_LIMIT}` : "";

  const skin = previewSkin(widget.design);
  const chosen = widget.picked.length;
  const atCap = picked && chosen >= MAX_HAND_PICKED;
  // Feed: "17 match, 2 left out, 5 shown". "left out" only when there are
  // any; the cap note only when it bites (fifteen can match and five be on
  // the site, and both numbers are true).
  const leftOut = matching.filter((r) => excludedOf(widget).includes(r.id)).length;
  const inWidget = matching.length - leftOut;
  // "on your site", not "shown", now that the line also says how many are
  // listed.
  const capNote =
    typeof widget.limit === "number" && widget.limit < inWidget ? `, ${widget.limit} on your site` : "";
  const count = picked
    ? chosen > MAX_HAND_PICKED
      ? `${chosen} of ${MAX_HAND_PICKED} chosen. Remove ${chosen - MAX_HAND_PICKED} before you save.`
      : atCap
        ? `${chosen} of ${MAX_HAND_PICKED} chosen, the maximum. Untick one to swap in another.`
        : `${chosen} of ${MAX_HAND_PICKED} chosen${truncNote}`
    : `${fmtCount(matching.length)} ${matching.length === 1 ? "matches" : "match"}${leftOut ? `, ${leftOut} left out` : ""}${truncNote}${capNote}`;

  return (
    <>
      {/* HOW THE REVIEWS ARE CHOSEN, FIRST (Ali, 7 Sep: "hand picked or live
          are kind of just part of the Which reviews appear"). It was the
          second row of General. Above the bar, in the scroller, so the bar
          takes the top the moment it reaches it. Switching keeps whatever
          was picked or excluded, as the wizard did. */}
      <div className="px-4 pt-4 pb-3" data-hook="picker-mode">
        {/* NO VISIBLE LABEL (Ali, 7 Sep: "'Reviews chosen by' is a really
            annoying label, is there a better way to explain this?"). The two
            cards explain themselves once their captions say what happens:
            "Select individual reviews" against "Updated automatically". A
            label naming the axis was a third thing to read that added no
            meaning. Assistive tech still gets a name for the group from the
            sr-only legend below. */}
        <p id="widget-mode-legend" className="sr-only">
          How reviews are chosen
        </p>
        <ChoiceCards
          name="widget-mode"
          value={widget.mode}
          onChange={(v) => setWidget((w) => ({ ...w, mode: v }))}
          columns={2}
          labelledBy="widget-mode-legend"
          options={[
            { id: "picked", label: "Hand-picked", caption: "Select individual reviews" },
            { id: "feed", label: "Live feed", caption: "Updated automatically" },
          ]}
        />
      </div>

      {/* ONE ROW OF DROPDOWNS, then the count (Ali, 7 Sep: "just have the
          dropdowns all in a row"). Sources and Ratings in both modes; Period
          and Limit join the row for a live feed. The count keeps its own
          fixed line under the row in both modes. The row may wrap on a
          phone, but never because a box was ticked. */}
      <div
        className="bg-background sticky top-0 z-10 flex flex-col gap-2 border-b px-4 py-3"
        data-hook="picker-bar"
      >
        <div className="flex flex-wrap items-center gap-2" data-hook="picker-facets">
          {/* ONE facet component across RM (@brightlocal/facet-menu), with the
              source's own mark on each row (Ali, 7 Sep: "on sources, can we
              include the logo?"). */}
          <FacetedFilterMenu
            label={sourceFacetLabel(sources)}
            dataHook="picker-facet-sources"
            options={SOURCE_LIST.map((s) => ({
              id: s.id,
              label: s.label,
              leading: <SourceMark source={s.id} />,
              count: REVIEWS.filter((r) => r.source === s.id).length,
            }))}
            isChecked={(id) => sources.includes(id)}
            isAllSelected={sources.length === 0}
            onAll={clearSources}
            onOption={onSource}
            allLabel="All sources"
            allCount={REVIEWS.length}
          />
          {/* SAME FACET AS SOURCES (Ali, 7 Sep: "the ratings dropdown looks
              different to our other facets"), with a rating glyph per row
              as Review Manager draws them. w-80, not w-72: beside five
              stars, "4 stars and above" wrapped at 72 (measured). The
              counts are per option and overlap by design: "4 stars and
              above" counts the 5 star reviews too. */}
          <FacetedFilterMenu
            label={ratingFacetLabel(ratings)}
            dataHook="picker-facet-ratings"
            panelWidth="w-80"
            options={RATING_OPTIONS.map((o) => ({
              id: o.id,
              label: o.label,
              leading: ratingGlyph(o.id),
              count: REVIEWS.filter((r) => ratingMatches(r, [o.id])).length,
            }))}
            isChecked={(id) => ratingsOn.includes(id)}
            isAllSelected={ratingsOn.length === ALL_RATINGS.length}
            onAll={clearRatings}
            onOption={onRating}
            allLabel="All ratings"
            allCount={REVIEWS.filter((r) => ratingMatches(r, ALL_RATINGS)).length}
          />
          {/* Period and limit belong to the FEED: a hand-picked set has no
              window and its limit is the number of reviews picked.
              FacetPopover + FacetOptions select="single" for the period,
              because FacetedFilterMenu does not forward `select`. */}
          {picked ? null : (
            <FacetPopover label={period?.label ?? "All time"} dataHook="picker-facet-period" panelWidth="w-48">
              <FacetOptions
                select="single"
                dataHook="picker-facet-period"
                options={PERIODS.map((p) => ({
                  id: p.id,
                  label: p.label,
                  count: REVIEWS.filter((r) => !p.days || r.daysAgo <= p.days).length,
                }))}
                isChecked={(id) => widget.period === id}
                onOption={(id) => setWidget((w) => ({ ...w, period: id }))}
              />
            </FacetPopover>
          )}
          {picked ? null : (
            <SingleSelectMenu
              label={LIMIT_OPTIONS.find((o) => o.id === String(widget.limit ?? "all"))?.label ?? "No limit"}
              dataHook="picker-limit"
              options={LIMIT_OPTIONS}
              value={String(widget.limit ?? "all")}
              onSelect={(id) => setWidget((w) => ({ ...w, limit: id === "all" ? "all" : Number(id) }))}
            />
          )}
        </div>
        <p className="text-muted-foreground h-5 text-sm tabular-nums" data-hook="picker-count" aria-live="polite">
          {count}
        </p>
      </div>

      {/* The list sits on the widget's own shell (same classes as the list
          format of WidgetPreview), so the cards are on the ground they will
          be published on. */}
      <div className="px-4 py-4" data-hook="picker-list">
        {shown.length === 0 ? (
          <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
            No reviews match.
          </div>
        ) : (
          <TooltipProvider>
          <div className={`flex flex-col gap-3 rounded-lg p-4 ${skin.shell}`}>
            {shown.map((r) =>
              picked ? (
                <PickerRow
                  key={r.id}
                  review={r}
                  design={widget.design}
                  skin={skin}
                  mode="picked"
                  checked={widget.picked.includes(r.id)}
                  disabled={atCap && !widget.picked.includes(r.id)}
                  onChange={(on) =>
                    setWidget((w) => ({
                      ...w,
                      picked: on ? [...w.picked, r.id] : w.picked.filter((x) => x !== r.id),
                    }))
                  }
                />
              ) : (
                <PickerRow
                  key={r.id}
                  review={r}
                  design={widget.design}
                  skin={skin}
                  mode="feed"
                  checked={!excludedOf(widget).includes(r.id)}
                  onChange={(on) =>
                    setWidget((w) => ({
                      ...w,
                      excluded: on ? excludedOf(w).filter((x) => x !== r.id) : [...excludedOf(w), r.id],
                    }))
                  }
                />
              ),
            )}
          </div>
          </TooltipProvider>
        )}
      </div>
    </>
  );
}

/* ================================ dashboard =============================== */

// ONE CARD PER SHOWCASE, FIXED (Ali, 7 Sep). Title is the type, caption the
// live product's line, then the same key / value rows the settings page
// shows, then the footer: Preview and Edit visible, and an overflow menu
// holding Embed code (Ali's standing rule: at most two CTAs visible, the
// rest in the overflow). Nothing to name, nothing to delete, so the menu
// carries the one item.
//
// NO CODE ON THE CARD (Ali, 7 Sep, reversing the same morning: "I don't need
// to display the code on the actual cards on the Showcase homepage, opening
// in a drawer/sheet is fine, as we might want the instructions we had
// already"). Embed code opens the Embed sheet, which keeps the code box,
// Copy and the numbered steps.
function WidgetCard({ widget, onView, onEdit, onEmbed }) {
  const count = resolveReviews(widget).length;
  const format = FORMATS[widget.format];
  return (
    // gap-4, matching the campaign cards (Ali, 3 Sep: "gaps in the cards
    // between header, content, footer are too big, reduce a smidge").
    <Card dataHook={`widget-${widget.id}`} className="h-full max-w-none gap-4">
      <CardHeader>
        <CardTitle size="small" dataHook={`widget-${widget.id}-title`}>
          {/* CLICKABLE, like a campaign name (Ali, 3 Sep): opens the preview
              sheet. data-bl-link picks up the shell's one link rule. */}
          <button
            type="button"
            data-bl-link=""
            data-hook={`widget-${widget.id}-open`}
            onClick={onView}
            className="text-left"
          >
            {format.label}
          </button>
        </CardTitle>
        <CardDescription dataHook={`widget-${widget.id}-desc`}>{format.caption}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* One fact per row, hairline between, value right-aligned. The
            same rows as the settings page's Reviews card. See widgetRows. */}
        <dl className="divide-border flex flex-col divide-y text-sm">
          {[
            { k: "Chosen by", v: widget.mode === "picked" ? "Hand-picked" : "Live feed" },
            ...widgetRows(widget),
            { k: "Showing now", v: `${count} review${count === 1 ? "" : "s"}` },
          ].map((row) => (
            <div key={row.k} className="flex items-baseline justify-between gap-3 py-1.5">
              <dt className="text-muted-foreground shrink-0">{row.k}</dt>
              <dd className="text-right">{row.v}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
      {/* Preview is what most people want from a list, so it is the outline
          button; Edit is a ghost; the overflow (DS DropdownMenu, the
          MoreHorizontal trigger the cards had before) holds Embed code, or
          Feed URL for the JSON feed, which opens the Embed sheet. */}
      <CardFooter className="mt-auto justify-start gap-1.5">
        <Button variant="outline" size="sm" dataHook={`widget-${widget.id}-view`} onClick={onView}>
          Preview
        </Button>
        <Button variant="ghost" size="sm" dataHook={`widget-${widget.id}-edit`} onClick={onEdit}>
          Edit
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              dataHook={`widget-${widget.id}-menu-button`}
              aria-label="More actions"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={onEmbed} data-hook={`widget-${widget.id}-embed`}>
              <Code className="size-4" /> {widget.format === "json" ? "Feed URL" : "Embed code"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}

// THREE CARDS, ALWAYS (Ali, 7 Sep). No empty state: the showcases exist
// whether or not anything is configured. Two-up stays (Ali, 28 Aug: "only
// 2-up grids"), so the third card wraps; flag if three-up is wanted now that
// the count is fixed.
function WidgetsDashboard({ widgets, onView, onEdit, onEmbed }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {FORMAT_ORDER.map((id) => widgets.find((w) => w.id === id))
        .filter(Boolean)
        .map((w) => (
          <WidgetCard key={w.id} widget={w} onView={() => onView(w)} onEdit={() => onEdit(w)} onEmbed={() => onEmbed(w)} />
        ))}
    </div>
  );
}

/* ============================== settings page ============================= */

// A SETTINGS PAGE WITH A RAIL, NOT A WIZARD (Ali, 7 Sep: "switch our Review
// Showcase creation/editing to a similar workflow that we have for the Review
// builder ... so a left rail, I think it works better"). The four wizard
// steps become four rail sections. Nothing is sequenced and nothing gates
// anything: every setting already holds a working value, so Save is enabled
// from the first render, and only the two things that can genuinely be wrong
// (a hand-picked set with nothing in it, a filter that matches nothing) are
// checked when it is pressed.
//
// COPIED FROM THE REVIEW BUILDER'S TEMPLATE EDITOR, not re-derived: the rail
// (plain buttons with tablist semantics: icon, label, subtext, active state),
// the General card (now DS Field primitives), the preview-led cards with one
// Edit button each, and the right-hand sheet carrying Review Manager's drawer
// overrides. If a third screen needs this shape, lift it into
// @brightlocal/wizard-shell rather than copying it a third time.
//
// `rail` is the rail label, `sub` the line under it, `hint` the line under
// the sheet's title. Three different lengths for three different places.
const SECTIONS = [
  {
    id: "reviews",
    rail: "Reviews",
    sub: "Which reviews appear",
    Icon: ListChecks,
    hint: "The reviews this showcase publishes on your site",
  },
  {
    id: "design",
    rail: "Design",
    sub: "Display, information, animation",
    Icon: Palette,
    hint: "How each review looks on your site",
  },
  // EMBED ON THE RAIL (Ali, 7 Sep: "we will also need a tab on the left rail
  // for the embed preview and code itself", then "or just the code maybe?").
  // Code only: the other cards already show the widget. Code, not Code2,
  // because the icon bundle carries no Code2 and Code is what the dashboard
  // already uses for embed.
  {
    id: "embed",
    rail: "Embed",
    sub: "Code for your site",
    Icon: Code,
    hint: "The lines that put this showcase on your site",
  },
];
// A PER-TYPE RAIL, NOT A TOGGLE. A JSON feed has no design, so its rail is
// Reviews and Embed; List and Carousel get Design between them. The set is
// fixed by the showcase's type, so nothing appears or disappears while you
// work.
const sectionsFor = (widget) =>
  SECTIONS.filter((s) => s.id !== "design" || widget.format !== "json");

// PLAIN BUTTONS, NOT THE DS SIDEBAR. Same reasoning as the Review Builder:
// SidebarMenuButton needs a SidebarProvider whose wrapper ships min-h-svh and
// fixed positioning meant for app chrome, which fights a page that already
// scrolls. This keeps the icon, label, subtext and active state and carries
// tablist semantics so it is keyboard-navigable.
function SettingsRail({ sections, value, onChange }) {
  // STICKY (Ali, 7 Sep: "left rail should be sticky"). The shell's content
  // area is the scroller and the header sits outside it, so top-0 pins the
  // rail flush under the header while the cards scroll past. self-start stops
  // the grid stretching it to the card's height, which would leave nothing for
  // sticky to do. md only: below that the rail stacks above the card and
  // should scroll away with it.
  return (
    <div
      role="tablist"
      aria-orientation="vertical"
      aria-label="Showcase settings"
      className="flex flex-col gap-1 md:sticky md:top-0 md:self-start"
      data-hook="widget-rail"
    >
      {sections.map((x) => {
        const on = x.id === value;
        return (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={on}
            data-hook={`widget-tab-${x.id}`}
            onClick={() => onChange(x.id)}
            className={`flex items-start gap-2.5 rounded-md px-3 py-2.5 text-left transition-colors ${
              on ? "bg-muted" : "hover:bg-muted/50"
            }`}
          >
            <x.Icon className={`mt-0.5 size-4 shrink-0 ${on ? "" : "text-muted-foreground"}`} />
            <span className="flex min-w-0 flex-col">
              <span className={`truncate text-sm ${on ? "font-medium" : ""}`}>{x.rail}</span>
              <span className="text-muted-foreground truncate text-xs">{x.sub}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

// The one-line description under each card's title. Says what is currently
// chosen, so the card reads as a summary before you open the sheet.
function sectionSummary(id, widget, reviews) {
  // NO CAPTIONS THAT RESTATE THE ROWS (Ali, 7 Sep: "Why are we adding yet
  // more descriptions? Remove."). Reviews and a saved Embed say nothing
  // under their title; the rows and the code carry the facts. The two lines
  // that survive explain a DISABLED state (a JSON feed has no design; an
  // unsaved showcase has no code yet), which the rows cannot.
  if (id === "reviews") return null;
  if (id === "embed") {
    // AN UNSAVED WIDGET HAS NO ID, and the code carries the id, so the code
    // is shown faded with this sentence rather than the section hiding
    // (no rail items appearing or disappearing).
    return widget.id ? null : "The code becomes available once the showcase is saved.";
  }
  if (id === "design" && widget.format === "json") {
    return "A JSON feed carries no design. Your own front end decides how it looks.";
  }
  // Layout and Design say it in rows (sectionRows), not a sentence.
  return null;
}

// ONE SHAPE FOR EVERY SETTINGS CARD (Ali, 7 Sep: "we have key value pairs
// here, but then we comma separate them in the design tab? annoying"). The
// Reviews card had rows and Design had a sentence stitched from the same
// facts. Every section now lists its settings as key / value rows, in the
// order the sheet edits them, so a card reads like the sheet behind it.
// The one look for a group heading, on the card and in the sheet alike.
const GROUP_HEADING_CLASS = "text-muted-foreground text-xs font-medium tracking-wide uppercase";
// Rows come flat (Reviews) or grouped (Design); the card renders both as
// groups, a flat list being one group with no heading.
const asGroups = (rows) => (rows.length && rows[0].rows ? rows : [{ id: "all", heading: null, rows }]);

function sectionRows(id, widget, reviews) {
  if (id === "reviews") {
    const count = reviews.length;
    return [
      { k: "Chosen by", v: widget.mode === "picked" ? "Hand-picked" : "Live feed" },
      ...widgetRows(widget),
      { k: "Showing now", v: `${count} review${count === 1 ? "" : "s"}` },
    ];
  }
  if (id === "design") {
    if (widget.format === "json") return null;
    const d = widget.design;
    const shown = [
      d.showName ? "Reviewer's name" : null,
      d.showSource ? "Review source" : null,
      d.showDate ? "Review date" : null,
    ].filter(Boolean);
    // THREE GROUPS, SAME ORDER AS THE SHEET (Ali, 7 Sep: "In Design we need
    // sub headers to break up all those key values, there are a lot, so some
    // kind of grouping: Display, Information, Animation"). Animation only for
    // a carousel: format-driven, so no group ever flickers, and a heading
    // never renders without rows. Every row is always present within its
    // group, so toggling never moves a row above the widget.
    const groups = [
      {
        id: "display",
        heading: "Display",
        rows: [
          { k: "Mode", v: d.theme === "dark" ? "Dark" : "Light" },
          { k: "Corners", v: d.corners === "square" ? "Square" : "Rounded" },
          { k: "Branding", v: d.branding !== false ? "Shown" : "Hidden" },
        ],
      },
      {
        id: "information",
        heading: "Information",
        rows: [
          { k: "Title", v: headerTitle(d) || "None" },
          { k: "Summary", v: d.summary !== false ? "Shown" : "Hidden" },
          { k: "Review text", v: d.length === "full" ? "In full" : "Short snippet" },
          { k: "Show on each review", v: shown.length ? shown.join(", ") : "Nothing extra" },
        ],
      },
    ];
    if (widget.format === "carousel") {
      const c = carouselOf(d);
      groups.push({
        id: "animation",
        heading: "Animation",
        rows: [
          { k: "Loop", v: c.loop ? "On" : "Off" },
          { k: "Autoplay", v: c.autoplay ? `Every ${c.every} seconds` : "Off" },
          {
            k: "Controls",
            v: c.arrows && c.dots ? "Arrows and dots" : c.arrows ? "Arrows" : c.dots ? "Dots" : "None",
          },
        ],
      });
    }
    return groups;
  }
  return null;
}

// THE EMBED CODE, ONE COMPONENT (Ali, 7 Sep: "needs work"). Used by the
// Embed rail card and by the list view's Embed sheet, so there is one layout,
// not two. What it holds, and only this: a Copy button in its own row above
// the code (never over it: the old absolute button sat on the text), the code
// in a box that wraps or scrolls on its own, and three short steps. No card
// round it, no Format / Chosen by / Showing rows; the card the reader came
// from already says those. `disabled` is the unsaved state: the shape of the
// code is visible, nothing can be copied.
// What Copy copies, for a showcase: the feed URL for JSON (one line, no
// markup), the snippet for List and Carousel. Used by EmbedCode and by the
// dashboard cards' Copy code button, so both copy the same text.
const embedText = (widget) => (widget.format === "json" ? feedUrl(widget) : embedSnippet(widget));

// A SHORT "Copied" STATE ON THE BUTTON, NO TOAST (Ali, 7 Sep). Two seconds,
// then the label comes back, so the button can be pressed again and read
// as a button. Clipboard access is best effort: the state is the proof.
function useCopy(text) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);
  const copy = () => {
    try {
      navigator.clipboard?.writeText(text);
    } catch {
      /* see above */
    }
    setCopied(true);
  };
  return [copied, copy];
}

function EmbedCode({ widget, disabled = false, steps = true, hook = "embed-code" }) {
  const json = widget.format === "json";
  const text = embedText(widget);
  const [copied, copy] = useCopy(text);
  return (
    <div className="flex flex-col gap-3" data-hook={hook}>
      <div className="flex items-center justify-end">
        <Button variant="outline" size="sm" dataHook={`${hook}-copy`} disabled={disabled} onClick={copy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : json ? "Copy URL" : "Copy code"}
        </Button>
      </div>
      {/* A real pre, so the text selects and pastes by hand. 13px on a full
          muted ground: the one thing on the page read character by
          character (Ali, 3 Sep). */}
      <pre
        className={`bg-muted overflow-x-auto rounded-lg border p-4 text-[13px] break-all whitespace-pre-wrap ${
          disabled ? "opacity-50" : ""
        }`}
        aria-disabled={disabled}
        data-hook={`${hook}-pre`}
      >
        {text}
      </pre>
      {steps ? (
      <ol className="text-muted-foreground flex list-decimal flex-col gap-1 pl-5 text-sm" data-hook={`${hook}-steps`}>
        {json ? (
          <>
            <li>Copy the URL.</li>
            <li>Request it from your own front end. It returns this showcase's reviews as JSON.</li>
            <li>Render them however you like. The feed updates as the showcase does.</li>
          </>
        ) : (
          <>
            <li>Copy the code.</li>
            <li>Paste it into the page's HTML where the reviews should appear. In most site builders that is an "Embed" or "Custom HTML" block.</li>
            <li>Publish the page. Each showcase is one line; add one per showcase you want on the page.</li>
          </>
        )}
      </ol>
      ) : null}
    </div>
  );
}

// PREVIEW FIRST, EDIT IN A SHEET, one choice per card (Ali, 7 Sep, on the
// Review Builder: "lead with preview for each section, and have an edit which
// opens up a sheet"). The card shows what the customer will see, directly on
// the card (see the no-frame note above); the controls are a deliberate act
// in a side panel with the preview still visible behind. The Embed card is
// the exception: nothing to edit, so no Edit button, and the code instead of
// the widget.
// WHAT STOPS A SAVE, and what the card says about it (Ali, 7 Sep: "Error
// message is a bit LAME"). One kind at a time, checked in this order. It
// renders as the DS warning Alert INSIDE the Reviews card, above its rows,
// with a title and one specific sentence, where the rail has already jumped;
// not as a bare line under the page. See App for when it clears.
function issueFor(widget, reviews) {
  if (widget.mode === "picked" && widget.picked.length === 0) return "none";
  if (widget.mode === "picked" && widget.picked.length > MAX_HAND_PICKED) return "cap";
  if (widget.mode === "feed" && reviews.length === 0) return "match";
  return null;
}
const ISSUE_COPY = {
  none: { title: "No reviews chosen", body: () => "Tick at least one review below, or switch to Live feed." },
  cap: {
    title: "Too many reviews",
    body: (w) =>
      `A hand-picked showcase holds up to ${MAX_HAND_PICKED} reviews. Untick ${w.picked.length - MAX_HAND_PICKED} to save.`,
  },
  match: {
    title: "No reviews match",
    body: () => "Widen the ratings, sources or period so at least one review matches.",
  },
};

function SectionCard({ section, widget, reviews, onEdit, issue = null }) {
  // THE DESIGN SECTION STAYS ON THE RAIL FOR A JSON FEED. The wizard dropped
  // the Design step when the format was JSON. Here a rail item that came and
  // went as you changed the layout would be the layout jump Ali does not want,
  // so the section stays and its Edit is disabled, with the description
  // saying why. ASSUMPTION: Ali may prefer the section to hide as the
  // Builder's rating section does.
  const noDesign = section.id === "design" && widget.format === "json";
  const embed = section.id === "embed";
  return (
    <Card className="min-w-0 max-w-none" dataHook={`widget-panel-${section.id}`}>
      <CardHeader>
        <CardTitle size="small" dataHook={`widget-panel-${section.id}-title`}>
          {section.rail}
        </CardTitle>
        {sectionSummary(section.id, widget, reviews) ? (
          <CardDescription dataHook={`widget-panel-${section.id}-desc`}>
            {sectionSummary(section.id, widget, reviews)}
          </CardDescription>
        ) : null}
        {embed ? null : (
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              dataHook={`widget-edit-${section.id}`}
              onClick={onEdit}
              disabled={noDesign}
            >
              Edit
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {section.id === "reviews" && issue ? (
          <AlertWarning
            dataHook="reviews-issue"
            title={ISSUE_COPY[issue].title}
            description={ISSUE_COPY[issue].body(widget)}
          />
        ) : null}
        {sectionRows(section.id, widget, reviews) ? (
          /* Flat rows (Reviews) or grouped rows (Design) through one dl: a
             group heading is a small muted line inside the list, so the
             rows' hairlines run on beneath it. */
          <dl
            className="divide-border flex flex-col divide-y text-sm"
            data-hook={`widget-panel-${section.id}-rows`}
          >
            {asGroups(sectionRows(section.id, widget, reviews)).flatMap((group) => [
              group.heading ? (
                <div
                  key={`heading-${group.id}`}
                  className={`pt-4 pb-1 first:pt-0 ${GROUP_HEADING_CLASS}`}
                  data-hook={`widget-panel-${section.id}-group-${group.id}`}
                >
                  {group.heading}
                </div>
              ) : null,
              ...group.rows.map((row) => (
                <div key={row.k} className="flex items-baseline justify-between gap-3 py-1.5">
                  <dt className="text-muted-foreground shrink-0">{row.k}</dt>
                  <dd className="text-right">{row.v}</dd>
                </div>
              )),
            ])}
          </dl>
        ) : null}
        {embed ? (
          <EmbedCode widget={widget} disabled={!widget.id} hook="widget-panel-embed-code" />
        ) : (
          /* THE REGISTRY'S PreviewFrame IS THE ONE WRAPPER around every showcase
             render (Ali, 7 Sep: "I want this preview frame to be used, I think
             it's good"): under the rows here, and in the Preview sheet.
             surface="none" because the showcase paints its own ground. Code
             never gets a frame (Ali: "we don't need it when we show things
             like code"), so the Embed card above stays bare. */
          <PreviewFrame surface="none" dataHook={`preview-frame-${section.id}`}>
            <WidgetPreview widget={widget} reviews={reviews} />
          </PreviewFrame>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------ sheet bodies ------------------------------ */

// The controls that used to be the wizard's step bodies, one component per
// sheet. Module scope, not inner declarations: a component declared inside
// another remounts on every render and drops input focus. The reviews sheet
// has no body component of its own: ReviewList mounts straight into the
// DrawerBody so its bar can stick (see the review picker section).
// One write path for the carousel settings, merging over the defaults.
function patchCarousel(setWidget, patch) {
  setWidget((w) => ({ ...w, design: { ...w.design, carousel: { ...carouselOf(w.design), ...patch } } }));
}

// ONE SWITCH ROW FOR EVERY SWITCH (Ali, 7 Sep: "these labels next to the
// switches aren't lined up"). The DS horizontal Field aligns its cells to
// the start, which tops a 14px leading-none label against a 20px switch.
// self-center on both cells puts the two on one centre line; every switch on
// the screen goes through here so there are no per-row differences.
function SwitchRow({ id, label, checked, onChange }) {
  return (
    <Field orientation="horizontal" dataHook={`${id}-field`}>
      <Switch
        id={id}
        dataHook={id}
        className="mt-0 self-center"
        checked={checked}
        onCheckedChange={(v) => onChange(!!v)}
      />
      {/* Measured: the horizontal Field is a GRID with align-items start, so
          its 14px content cell sat at the top of the 20px switch row, 3px
          above centre, and items-center on the Field lost to the DS's own
          orientation variant. self-center on the two grid items is what
          actually lines them up. */}
      <FieldContent className="self-center">
        <FieldLabel htmlFor={id} dataHook={`${id}-label`}>
          {label}
        </FieldLabel>
      </FieldContent>
    </Field>
  );
}

// Returns a FRAGMENT: [sticky live preview, controls]. Mounted directly in
// the sheet's scroller so the preview can stick (see ReviewList for the
// same rule).
function DesignSheetBody({ widget, setWidget }) {
  const c = carouselOf(widget.design);
  // LIVE PREVIEW AT THE TOP OF THE SHEET (Ali, 7 Sep: "the problem here is
  // that we can't actually see the changes live; maybe we would have one
  // item shown as a preview?"). The sheet covers the card's preview, so a
  // compact one rides here: the SAME WidgetPreview in the registry
  // PreviewFrame, fed the first review for a list and the first three for a
  // carousel so arrows and dots have something to do. Sticky, a direct
  // child of the DrawerBody, so the controls scroll under it.
  const sample = resolveReviews(widget).slice(0, widget.format === "carousel" ? 3 : 1);
  return (
    <>
      <div className="bg-background sticky top-0 z-10 border-b px-4 py-3" data-hook="design-live-preview">
        <PreviewFrame surface="none" dataHook="preview-frame-design-sheet">
          <WidgetPreview widget={widget} reviews={sample} />
        </PreviewFrame>
      </div>
    <div className="flex flex-col gap-5 px-4 py-4" data-hook="design-controls">
      {/* THE SAME THREE GROUPS AS THE CARD, in the same order (Ali, 7 Sep):
          Display, Information, and Animation for a carousel only. A heading
          above each group's fields, a Separator between groups; the old
          single "Carousel" label is gone. Animation is format-driven, so
          nothing here appears or disappears while you toggle. */}
      <p className={GROUP_HEADING_CLASS} data-hook="design-group-display">
        Display
      </p>
      <Field dataHook="design-theme-field">
        {/* "Mode", not "Background" (coordinator, 7 Sep): Light / Dark is the
            colour mode of the whole showcase, not one surface. The data key
            stays design.theme. */}
        <FieldLabel htmlFor="design-theme-light" dataHook="design-theme-label">
          Mode
        </FieldLabel>
        <ChoiceCards
          name="design-theme"
          value={widget.design.theme}
          onChange={(v) => setWidget((w) => ({ ...w, design: { ...w.design, theme: v } }))}
          columns={2}
          options={[
            { id: "light", label: "Light" },
            { id: "dark", label: "Dark" },
          ]}
        />
      </Field>
      <Field dataHook="design-corners-field">
        <FieldLabel htmlFor="design-corners-rounded" dataHook="design-corners-label">
          Corners
        </FieldLabel>
        <ChoiceCards
          name="design-corners"
          value={widget.design.corners}
          onChange={(v) => setWidget((w) => ({ ...w, design: { ...w.design, corners: v } }))}
          columns={2}
          options={[
            { id: "rounded", label: "Rounded" },
            { id: "square", label: "Square" },
          ]}
        />
      </Field>
      <SwitchRow
        id="design-branding"
        label="Show BrightLocal branding"
        checked={widget.design.branding !== false}
        onChange={(v) => setWidget((w) => ({ ...w, design: { ...w.design, branding: v } }))}
      />
      <Separator dataHook="design-group-rule-information" />
      <p className={GROUP_HEADING_CLASS} data-hook="design-group-information">
        Information
      </p>
      <Field dataHook="design-title-field">
        <FieldLabel htmlFor="design-title" dataHook="design-title-label">
          Title
        </FieldLabel>
        <Input
          id="design-title"
          dataHook="design-title"
          value={widget.design.title ?? ""}
          placeholder="Customer Reviews"
          onChange={(e) => setWidget((w) => ({ ...w, design: { ...w.design, title: e.target.value } }))}
        />
        <FieldDescription dataHook="design-title-desc">Leave empty for no title.</FieldDescription>
      </Field>
      <SwitchRow
        id="design-summary"
        label="Show total reviews and average"
        checked={widget.design.summary !== false}
        onChange={(v) => setWidget((w) => ({ ...w, design: { ...w.design, summary: v } }))}
      />
      <Field dataHook="design-length-field">
        <FieldLabel htmlFor="design-length-full" dataHook="design-length-label">
          Review text
        </FieldLabel>
        <ChoiceCards
          name="design-length"
          value={widget.design.length}
          onChange={(v) => setWidget((w) => ({ ...w, design: { ...w.design, length: v } }))}
          columns={2}
          options={[
            { id: "full", label: "In full" },
            { id: "snippet", label: "Short snippet" },
          ]}
        />
      </Field>
      <Field dataHook="design-show-field">
        <FieldLabel htmlFor="design-showname" dataHook="design-show-label">
          Show on each review
        </FieldLabel>
        <div className="flex flex-col gap-2">
          {[
            { key: "showName", label: "Reviewer's name" },
            { key: "showSource", label: "Review source" },
            { key: "showDate", label: "Review date" },
          ].map((o) => (
            <Field key={o.key} orientation="horizontal">
              <Checkbox
                id={`design-${o.key.toLowerCase()}`}
                dataHook={`design-${o.key.toLowerCase()}`}
                checked={widget.design[o.key]}
                onCheckedChange={(v) =>
                  setWidget((w) => ({ ...w, design: { ...w.design, [o.key]: !!v } }))
                }
              />
              <FieldLabel htmlFor={`design-${o.key.toLowerCase()}`} dataHook={`design-${o.key.toLowerCase()}-label`}>
                {o.label}
              </FieldLabel>
            </Field>
          ))}
        </div>
      </Field>
      {widget.format === "carousel" ? (
        <>
          <Separator dataHook="design-group-rule-animation" />
          <p className={GROUP_HEADING_CLASS} data-hook="design-group-animation">
            Animation
          </p>
          <SwitchRow id="design-loop" label="Loop" checked={c.loop} onChange={(v) => patchCarousel(setWidget, { loop: v })} />
          <SwitchRow
            id="design-autoplay"
            label="Autoplay"
            checked={c.autoplay}
            onChange={(v) => patchCarousel(setWidget, { autoplay: v })}
          />
          {/* The "Every" select is always drawn and merely disabled while
              Autoplay is off, so switching Autoplay changes an emphasis rather
              than reflowing the sheet. */}
          <Field dataHook="design-every-field">
            <FieldLabel htmlFor="design-every" dataHook="design-every-label">
              Every
            </FieldLabel>
            {/* 8rem (the w-32 step) and left-aligned under its label. The DS
                trigger is full width inside a Field, so the width lives on a
                wrapper; as an inline style because the preview's precompiled
                stylesheet carries no w-32 (measured: the class computed to the
                full 607px), and an unavailable utility is worse than a value. */}
            <div style={{ width: "8rem" }}>
              <Select
                value={String(c.every)}
                disabled={!c.autoplay}
                onValueChange={(v) => patchCarousel(setWidget, { every: Number(v) })}
              >
                <SelectTrigger id="design-every" dataHook="design-every" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUTOPLAY_EVERY.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s} seconds
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Field>
          <SwitchRow id="design-arrows" label="Show arrows" checked={c.arrows} onChange={(v) => patchCarousel(setWidget, { arrows: v })} />
          <SwitchRow id="design-dots" label="Show dots" checked={c.dots} onChange={(v) => patchCarousel(setWidget, { dots: v })} />
        </>
      ) : null}
    </div>
    </>
  );
}

// THE SHEET IS A PORTAL, so it renders on document.body, outside the wizard
// layout where WIZARD_TYPE_SCALE sets inputs to 13px. Same rule, re-scoped to
// the sheet, so its fields match the ones on the page (copied from the Review
// Builder, which hit the same thing).
const SHEET_TYPE_SCALE = `
[data-hook="section-sheet-panel"] [data-slot="input"],
[data-hook="section-sheet-panel"] [data-slot="textarea"],
[data-hook="section-sheet-panel"] [data-slot="select-trigger"],
[data-hook="section-sheet-panel"] [data-slot="select-value"] {
  font-size: 0.8125rem;
  line-height: 1.125rem;
}
`;

// ONE SHEET, DRIVEN BY WHICH SECTION IS OPEN. A drawer per section would be
// three copies of the same chrome.
//
// COPIED FROM REVIEW MANAGER'S DRAWER via the Review Builder, not re-derived:
// DrawerHeader, DrawerBody and DrawerFooter all ship `mx-auto w-full max-w-sm`
// and phone-shaped padding, so all three carry the same overrides, and the
// body additionally needs `min-h-0 grow overflow-y-auto` or the header and
// footer do not pin. Right-hand from sm up, bottom on a phone where a side
// panel would leave no room to read, and the same width clamp as the preview
// and embed sheets on this screen (DRAWER_WIDTH), so every panel on RM reads
// as the same object.
//
// THE REVIEWS SHEET DROPS THE BODY PADDING. ReviewList's bar is `sticky
// top-0` and has to be a direct child of this scroller with nothing between
// it and the edge, so the bar and the list carry their own padding there.
function SectionSheet({ section, widget, setWidget, narrow, onClose }) {
  if (!section) return null;
  return (
    <Drawer open onOpenChange={(o) => (o ? null : onClose())} direction={narrow ? "bottom" : "right"}>
      <style>{SHEET_TYPE_SCALE}</style>
      <DrawerContent
        dataHook="section-sheet-panel"
        className={`flex flex-col ${narrow ? "" : "h-full"} ${DRAWER_WIDTH}`}
        style={narrow ? { marginTop: 0, maxHeight: "92svh" } : undefined}
      >
        {/* ONE SHEET HEADER ACROSS RM: SideSheetHeader from the registry
            (Ali, 7 Sep: "the sheet headers also dont seem to cope with
            descriptions very well"). Title alone here; the hint already sits
            under the section name in the rail and on the card. closeHook
            keeps the close button at "section-sheet-close"; the header takes
            the "section-sheet" hook, so the panel is "section-sheet-panel". */}
        <SideSheetHeader title={section.rail} dataHook="section-sheet" closeHook="section-sheet-close" />
        <DrawerBody
          // No padding of its own: both sheet bodies start with a sticky bar
          // that must be a direct child of this scroller, so they carry
          // their own gutters.
          className="mx-0 mt-0 flex min-h-0 max-w-none grow flex-col gap-0 overflow-y-auto p-0"
          style={{ scrollbarWidth: "thin", scrollbarColor: "var(--border) transparent" }}
        >
          {section.id === "reviews" ? (
            <ReviewList widget={widget} setWidget={setWidget} />
          ) : (
            <DesignSheetBody widget={widget} setWidget={setWidget} />
          )}
        </DrawerBody>
        {/* Edits are live, so this only dismisses. The preview behind has
            already moved. */}
        <DrawerFooter className="mx-0 max-w-none flex-row items-center justify-end gap-2 border-t p-4">
          <Button variant="primary" dataHook="section-sheet-done" onClick={onClose}>
            Done
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

/* =============================== detail view ============================== */

// TWO SHEETS, NOT ONE (Ali, 3 Sep: "the only problem with the preview and
// embed code in the same place is if the preview is a list, you don't
// actually see the embed code immediately. Maybe the embed code gets its own
// sheet. Also then allows for instructions on how to use it").
//
// Both were stacked in one drawer with the preview first, so a list widget
// showing ten reviews pushed the code — the thing the whole feature exists to
// hand over — below the fold of a 640px panel. The length of the preview
// decided whether you could see the payoff, which is the wrong thing to
// depend on.
//
// Splitting them also fixes what the single sheet could not afford: the code
// on its own has room for what to DO with it, and "paste this into your site"
// was the entire instruction for a person who has never edited a page's HTML.
function WidgetPreviewSheet({ widget }) {
  // THE SHOWCASE ALONE (Ali, 7 Sep: "Why are we adding yet more descriptions?
  // Remove."). The header names it; nothing else is said.
  return (
    <div data-hook="detail-preview">
      <PreviewFrame surface="none" dataHook="preview-frame-sheet">
        <WidgetPreview widget={widget} reviews={resolveReviews(widget)} />
      </PreviewFrame>
    </div>
  );
}

// The Embed sheet body is EmbedCode and nothing else.
function WidgetEmbedSheet({ widget }) {
  return <EmbedCode widget={widget} hook="detail-embed-code" />;
}

/* =================================== app ================================== */

// THE SETTINGS PAGE WEARS WizardShell WITH NO RAIL OF STEPS (steps={null}),
// as the Review Builder's template editor does: a rail counts steps, and
// there are no steps to count. The shell still gives the pinned header, the
// scrolling middle, the pinned footer and the error slot. The header is the
// real PageHeader (Ali, 7 Sep, on the Builder: "we could probably use our page
// header, so we can show our date in the top right, and make this a proper
// page header").
export default function RMReviewShowcasePage() {
  const [widgets, setWidgets] = useState(seedWidgets);
  const [view, setView] = useState("list");
  const [draft, setDraft] = useState(() => seedWidgets()[0]);
  const [activeId, setActiveId] = useState(null);
  // Which sheet the list view's drawer is showing: "preview" or "embed".
  const [sheet, setSheet] = useState("preview");
  // Which save-blocking issue the Reviews card is showing. Set by Save,
  // cleared the moment the condition stops holding (see the effect below).
  const [issue, setIssue] = useState(null);
  // 12. The draft as it was when the page opened, for Cancel to compare
  // against (Ali, 7 Sep: "if we haven't changed anything, we don't need an
  // alert"). A JSON snapshot: the draft is a plain record with a fixed set
  // of keys, written by spreads that keep key order, so equal strings mean
  // equal drafts.
  const [opened, setOpened] = useState(null);
  const [leaving, setLeaving] = useState(false);
  // Which rail section the settings page is showing.
  const [sectionId, setSectionId] = useState("reviews");
  // Which section's controls are open in the sheet. null = none.
  const [editingId, setEditingId] = useState(null);
  // Below sm a right-hand panel leaves nothing to read beside it, so the sheet
  // comes up from the bottom instead. Same breakpoint as Review Manager.
  const [sheetNarrow, setSheetNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setSheetNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  // Below md the rail stacks above the card, so a footer with Back / Next
  // walks the sections (Ali, 7 Sep: "we might have a footer for forward and
  // back on tablets and mobiles"). From lg up there is no footer at all.
  // "Tablets and mobiles" is below lg (1023px and under), not below md: a
  // 768px tablet keeps the rail beside the card but still gets the footer,
  // as asked. Desktop (lg and up) has no footer.
  const [narrowShell, setNarrowShell] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setNarrowShell(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const active = widgets.find((w) => w.id === activeId) ?? null;
  const draftReviews = resolveReviews(draft);
  const sections = sectionsFor(draft);
  const section = sections.find((s) => s.id === sectionId) ?? sections[0];
  const editing = sections.find((s) => s.id === editingId) ?? null;

  // Edits go straight to the draft; the save-blocking alert clears itself below.
  const patchDraft = (next) => setDraft(next);
  // The alert clears as soon as its condition is fixed and stays cleared
  // until the next press of Save, so ticking and unticking while it is up
  // cannot make it flicker.
  useEffect(() => {
    if (issue && issueFor(draft, draftReviews) !== issue) setIssue(null);
  }, [issue, draft, draftReviews]);

  function openSettings(w) {
    const d = { ...w };
    setDraft(d);
    setOpened(JSON.stringify(d));
    setSectionId("reviews");
    setEditingId(null);
    setIssue(null);
    setView("build");
  }
  const startEdit = (w) => openSettings(w);

  // VALIDATED ON SAVE, NOT ON NEXT. The wizard checked each step as you left
  // it; a settings page has no leaving, so the same three checks run when you
  // press Save, and the rail jumps to the Reviews section, which is where all
  // three are put right.
  function saveDraft() {
    const kind = issueFor(draft, draftReviews);
    if (kind) {
      setIssue(kind);
      setSectionId("reviews");
      return;
    }
    // Always an existing showcase: the three are fixed, so Save replaces.
    // NO DRAWER AFTER SAVE (Ali, 7 Sep: "when you save the showcase, can we
    // stop the drawer appearing when you go back to the hub page"). It used
    // to set activeId to the saved showcase, which opened whichever sheet was
    // last used over the list. Save now lands on the plain list.
    const record = { ...draft };
    setWidgets((ws) => ws.map((w) => (w.id === record.id ? record : w)));
    setActiveId(null);
    setIssue(null);
    setView("list");
  }

  // Cancel asks only when there is something to lose. Untouched, it leaves
  // at once, for an existing showcase and for a fresh one alike.
  function cancelSettings() {
    if (JSON.stringify(draft) === opened) leaveSettings();
    else setLeaving(true);
  }

  function leaveSettings() {
    setLeaving(false);
    setIssue(null);
    setView("list");
  }

  // THREE crumbs. Editing has its own chrome and no breadcrumb trail, the
  // same as creating. A goto carries a screen id and nothing else, so it
  // cannot say WHICH widget to open, which is why per-item detail is an
  // overlay on the list.
  const crumbs = [
    { label: "All Locations", goto: "screen:dmrotrgstba3l" },
    { bind: "location", goto: "screen:dmrurue2wmp9u" },
    { label: "Reviews", goto: "screen:dmrotrhbcxk66" },
  ];

  const headerByView = {
    title: "Review Showcase",
    // A NUMBER, NOT A SENTENCE (Ali, 7 Sep: "our page description can be used
    // to display some information rather than yet more boring text"), and the
    // number is the count of showcases (Ali, later the same day: "in the page
    // header, we would just say '3 showcases' for now"). The review total and
    // average were tried here and reversed; they live in each widget's header
    // row instead.
    description: (
      <span data-hook="page-stat">
        <span className="text-foreground font-medium tabular-nums">{widgets.length}</span> showcases
      </span>
    ),
  };

  if (view === "build") {
    // SAVE AND CLOSE LIVE IN THE PAGE HEADER (Ali, 7 Sep: "reuse the page
    // header component entirely, and put our Save button in the top right,
    // as well as a cancel or close button icon, therefore stopping the need
    // for a footer and reducing the overall page height"). Two controls:
    // the primary Save, and an icon-only secondary Close (Ali: "can we make
    // the close button secondary?") that does exactly what
    // Cancel did (silent when nothing changed, the leave check otherwise).
    // No size passed: PageHeader sizes its actions itself. Save is enabled
    // from the first render because every setting already holds a working
    // value; the checks in saveDraft catch the two that cannot.
    const headerActions = (
      <>
        <Button variant="primary" dataHook="widget-save" onClick={saveDraft}>
          Save showcase
        </Button>
        <Button variant="secondary" iconOnly dataHook="widget-cancel" aria-label="Close" onClick={cancelSettings}>
          <X className="size-4" />
        </Button>
      </>
    );
    // BELOW lg ONLY: Back and Next step through the rail sections, disabled
    // at the ends, nothing else. From lg up the footer is not rendered, so
    // the content scroller takes the height back.
    const sectionIndex = sections.findIndex((s) => s.id === section.id);
    const footer = narrowShell ? (
      <>
        <Button
          variant="outline"
          dataHook="widget-prev-section"
          disabled={sectionIndex <= 0}
          onClick={() => setSectionId(sections[sectionIndex - 1].id)}
        >
          Back
        </Button>
        <span className="grow" />
        <Button
          variant="ghost"
          dataHook="widget-next-section"
          disabled={sectionIndex >= sections.length - 1}
          onClick={() => setSectionId(sections[sectionIndex + 1].id)}
        >
          Next
        </Button>
      </>
    ) : undefined;
    const heading = FORMATS[draft.format].heading;
    return (
      <WizardShell
        dataHook="widget-settings"
        title={heading}
        header={
          // THE SECTION IS THE TITLE, THE TYPE IS THE DESCRIPTION (Ali, 7 Sep:
          // "the Page header should be 'Review Showcase' and the description
          // should say list, carousel etc."). Same H1 as the list page, so
          // the page does not change identity when you step into a showcase;
          // the card's own title under it says which one. Date on the right.
          <PageHeader
            dataHook="widget-page-header"
            // The SAME header as every other page (Ali, 8 Sep: "it doesn't
            // look like it is the correct page header"): trail and help on,
            // so stepping into a showcase does not change the page's chrome.
            breadcrumbs={crumbs}
            title="Review Showcase"
            description={heading}
            lastUpdated="auto"
            actions={headerActions}
          />
        }
        steps={null}
        footer={footer}
        contentClassName="pt-6!"
      >
        {/* minmax(0,1fr) BELOW md TOO (Ali, 7 Sep: "Preview seems to be pushing
            the mobile view to horizontally scroll"). Measured at 390: the
            single implicit `auto` column took the card's MIN-CONTENT width,
            and a carousel's min-content is the sum of its five slides (the
            overflow-hidden track still reports its contents), so the column
            came out 706px wide and the page scrolled sideways. A 0-minimum
            column lets the card shrink to the viewport and the track clip as
            it should. */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-[16rem_minmax(0,1fr)]">
          <SettingsRail sections={sections} value={section.id} onChange={setSectionId} />
          <SectionCard
            issue={issue}
            section={section}
            widget={draft}
            reviews={draftReviews}
            onEdit={() => setEditingId(section.id)}
          />
        </div>

        <SectionSheet
          section={editing}
          widget={draft}
          setWidget={patchDraft}
          narrow={sheetNarrow}
          onClose={() => setEditingId(null)}
        />

        <AlertDialog dataHook="leave-wizard" open={leaving} onOpenChange={setLeaving}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle dataHook="leave-title">Leave without saving your changes?</AlertDialogTitle>
              <AlertDialogDescription dataHook="leave-desc">
                Nothing is saved. The reviews, layout and design you have changed will go back to
                how the showcase was before you opened it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep editing</AlertDialogCancel>
              <Button variant="destructive" dataHook="leave-confirm" onClick={leaveSettings}>
                Discard and leave
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </WizardShell>
    );
  }

  return (
    <SidebarProvider>
      <AppLayoutShell
        preset="live-site"
        // Live Site ships the expansive nav. Too loud at this density of
        // page, so the nav steps back one.
        navDensity="comfortable"
        // Live Site drops the sticky band. These screens keep it: their
        // card furniture pins below it off --gds-page-header-height.
        stickyHeader
        flush
        pinnedSidebar
        dataHook="review-widgets-app-layout"
        sidebar={<ProposalSidebar dataHook="review-widgets-sidebar" activeId="reviews-widgets" />}
        mobileBar={
          <div className="flex items-center gap-3 border-b px-4 py-3 lg:hidden">
            <SidebarTrigger>
              <Menu className="size-5" />
            </SidebarTrigger>
            <Logo className="h-5" dataHook="mobile-logo" />
          </div>
        }
        header={
          <PageHeader
            dataHook="review-widgets-page-header"
            breadcrumbs={crumbs}
            title={headerByView.title}
            description={headerByView.description}
          />
        }
      >
        <GlobalLayoutContentBody className="gap-4">
          <BeaconPageStrip page="showcase" />
          <WidgetsDashboard
            widgets={widgets}
            onEdit={startEdit}
            onView={(w) => { setSheet("preview"); setActiveId(w.id); }}
            onEmbed={(w) => { setSheet("embed"); setActiveId(w.id); }}
          />
          {/* Stated once, on the page it constrains, rather than inside
              every filter menu where it would repeat three times. */}

          {/* THE WIDGET DETAIL IS A DRAWER, not a view (Ali, 27 Aug). Closing
              it puts you back where you were with the list still behind. Same
              treatment a review gets in Review Manager and a template gets in
              Reply Templates. */}
          <Drawer open={active !== null} onOpenChange={(o) => (o ? null : setActiveId(null))} direction="right">
            <DrawerContent dataHook={sheet === "embed" ? "widget-embed-drawer" : "widget-preview-drawer"} className={DRAWER_WIDTH}>
              {/* SideSheetHeader, with the description under the title and the
                  close level with the title line. This is the header Ali
                  screenshotted. One dataHook per sheet; closeHook keeps the
                  close button at "close-widget", the hook it always had. */}
              {/* No description (Ali, 7 Sep: "lose the descriptions from the
                  drawer / sheets"). The title names the widget; the body
                  shows what the sheet is for. */}
              <SideSheetHeader
                title={active ? FORMATS[active.format].heading : "Showcase"}
                dataHook={sheet === "embed" ? "widget-embed-sheet" : "widget-preview-sheet"}
                closeHook="close-widget"
              />
              <DrawerBody className="mt-0 flex max-w-none flex-col gap-4 overflow-y-auto py-4">
                {active ? (
                  sheet === "embed" ? (
                    <WidgetEmbedSheet widget={active} />
                  ) : (
                    <WidgetPreviewSheet widget={active} />
                  )
                ) : null}
              </DrawerBody>
              <DrawerFooter className="max-w-none flex-row items-center border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <div className="grow" />
                <Button
                  variant="outline"
                  size="sm"
                  dataHook="detail-edit"
                  onClick={() => {
                    const w = active;
                    setActiveId(null);
                    startEdit(w);
                  }}
                >
                  Edit showcase
                </Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
          <BeaconNugget page="showcase" />
        </GlobalLayoutContentBody>
      </AppLayoutShell>
    </SidebarProvider>
  );
}
