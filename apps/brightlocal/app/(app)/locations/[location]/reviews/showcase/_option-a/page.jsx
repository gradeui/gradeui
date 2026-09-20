"use client";

// Promoted from Studio screen "RM — Review Showcase"
// (design dmt094lhmpwbs, version 1788892759000). Registry: lib/screens.ts;
// re-promotion workflow: apps/brightlocal/README.md.
// source-hash: ec9c6f2c393f

// NOTE, 20 SEP: this file is still named for the rail it was spun off to try,
// and the rail is gone. The editor is two full-bleed pages now, Select reviews
// and Widget design, each entered from a showcase card, with embed reachable
// from the card's overflow as it always was. See the "settings page" section
// for the decisions and Ali's words. Everything below this line is the 7 Sep
// history, kept because it is how the screen got here.
//
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
//   The DataTable picker is gone; superseded on 20 Sep, when Select Reviews
//   was rebuilt to the product's own model and became a DataTable again.
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
// own website, as a list, a carousel, or a raw JSON feed.
//
// HOW THE REVIEWS ARE CHOSEN, AS THE PRODUCT DOES IT (Ali, 20 Sep, on a
// screenshot of BrightLocal's Select Reviews step: match the product). One
// model, not two:
//
//   FILTERS      Star Rating, Feedback Score, Date and Review Sources, set in
//                one wide dropdown panel that does nothing until Apply
//                Filters is pressed.
//   AUTO SELECT  on by default: a new review that matches the filters joins
//                the showcase on its own.
//   PER REVIEW   Position orders a review inside the widget (-1 is no
//                position); Blacklist keeps one out.
//
// The Hand-picked / Live feed pair this screen used to ask about was its own
// invention and is gone, with the facet menus, the per-card tick box and the
// Limit select. Yelp reviews are listed and cannot be used; the banner at the
// top of the step says why.
//
// ─── VIEWS IN THIS ONE SCREEN ───
// list → wizard → list, plus a widget detail page carrying the embed code.
// Same in-screen view model as RM — Review Manager and RM — Review Builder: the
// shell and PageHeader stay mounted, only the body swaps.
//
// WHY THE PICKER IS A TABLE AGAIN (20 Sep)
// It was a DataTable, then a list of the widget's own review cards with a box
// beside each (7 Sep: "have it much more like an actual list, like what would
// be displayed"). That was the right answer to the question this screen was
// asking then, which was "which of these do you want?". The product asks a
// different one: every review carries a Position and a Blacklist, and a row
// with two controls on it is a table. So it is a DataTable again, the same one
// Review Manager uses, sortable headers and all. See the select reviews
// section.
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
//    stays. SUPERSEDED on the source list (the pool carries the Tracker's
//    seven), and the Yelp half is now CONFIRMED by the product itself: the
//    banner on Select Reviews is BrightLocal's own wording for it.
// 2. FACEBOOK HAS NO STARS. Per the audit (section 3.1.1) Facebook returns
//    "Recommended" and "Not recommended", not a 1 to 5 score, so those rows
//    show a thumb rather than stars. The product's Star Rating filter offers
//    Recommended and NOT its opposite, so a "Not recommended" review can be
//    read in the table and can never reach a showcase.
// 3. WIDGETS ARE NAMED BY THE USER. The prototype auto-named them by format,
//    which gives you three widgets called "List widget". A name field with a
//    sensible default costs one input and makes the dashboard readable.
// 4. THE 50-REVIEW CAP is gone with hand-picking. How many reviews reach the
//    page is Widget Design's "Number of reviews to show" and nothing else,
//    which is the one cap the real product has.
//
// ─── HOUSE RULES OBSERVED ───
// Cards get max-w-none. Badge has no success variant. Card-to-card spacing is
// gap-4 on GlobalLayoutContentBody, never space-y-*. The widget preview's DARK
// setting is the one place this screen uses raw Tailwind palette utilities
// rather than semantic tokens: it is painting the CUSTOMER's website
// background, not a Grade surface, so no semantic token applies.

import { useEffect, useMemo, useState } from "react";
import { BeaconPageStrip } from "@/components/review-summary";
import { usePersona } from "@/lib/demo";
import { useLocationKey } from "@/lib/location";
import { reviewsFor } from "@/lib/reviews-data";
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
  DataTableColumnHeader,
  DataTablePagination,
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
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@brightlocal/ui-components/input-group";
import { Checkbox } from "@brightlocal/ui-components/checkbox";
import { Progress } from "@brightlocal/ui-components/progress";
import { Rating } from "@brightlocal/ui-components/rating";
import { RadioGroup, RadioGroupItem } from "@brightlocal/ui-components/radio-group";
import { Slider } from "@brightlocal/ui-components/slider";
// THE SWITCH IS BACK, for the two controls the product genuinely draws as
// toggles: Auto select reviews in the toolbar, and Blacklist on every row. The
// Widget Design panel still asks its questions as Yes / No radio pairs, which
// is why SwitchRow did not come back with it.
import { Switch } from "@brightlocal/ui-components/switch";
import { ToggleGroup, ToggleGroupItem } from "@brightlocal/ui-components/toggle-group";
// NO ACCORDION ANY MORE. The five design groups were items in one; they are
// cards with their own Edit now (Ali, 20 Sep: "I'd make each section header
// more prominent, I can hardly see that there are sections"), so the import
// went with them.
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
  Ban,
  RotateCcw,
  LayoutList,
  GalleryHorizontal,
  Braces,
  Code,
  MoreHorizontal,
  Star,
  FileText,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Square,
  Columns2,
  Columns3,
  Info,
  GoogleOriginal,
  FacebookOriginal,
  TrustpilotOriginal,
} from "@brightlocal/icons";
import { AppLayoutShell, ProposalSidebar, PageHeader, DateStamp, formatDate, formatDateShort, SourceMark, FeedbackScore, PreviewFrame, REVIEW_SOURCES } from "@brightlocal/proposal";
// THE REGISTRY'S FACET MENUS, not a fifth hand-built filter (Ali, 7 Sep:
// "we now HAVE 2 different ways to choose filters. WHY"). Review Manager and
// the campaigns table both filter through these two, so the ratings menu on
// this page is the same object as the ratings menu on the inbox.
import { FacetedFilterMenu, SingleSelectMenu } from "@brightlocal/facet-menu";
// SideSheetHeader, not SheetHeader: the DS barrel already exports a SheetHeader
// (the Sheet family), and the contract check keys on the JSX name.
import { SideSheetHeader } from "@brightlocal/side-sheet-header";
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

// THE PRODUCT'S OWN STAR RATING FILTER, OPTION FOR OPTION (Ali, 20 Sep, on a
// screenshot of BrightLocal's Select Reviews step: "match the product"). Five
// checkboxes under a Toggle All, and the list STOPS AT THREE STARS: the real
// screen offers no two or one star option, so those reviews sit in the pool
// and can never be filtered into a showcase. That is the same conclusion the
// old three options reached ("nobody wants those on their homepage"), said
// the way the product says it.
//
// ASSUMPTION: "No rating" is a review carrying neither stars nor a
// recommendation, which is what a Get Reviews campaign answer looks like
// before a customer marks it for public sharing. This location's pool has
// none, so ticking it alone empties the table. Faithful to the screen, and
// worth knowing before anyone reads that as a bug.
// ASSUMPTION: Facebook's "Not recommended" matches NOTHING, because the panel
// offers no option for it, exactly as a two star review matches nothing.
const RATING_OPTIONS = [
  { id: "5", label: "5 Stars", score: 10 },
  { id: "4", label: "4 Stars", score: 8 },
  { id: "3", label: "3 Stars", score: 6 },
  { id: "rec", label: "Recommended" },
  { id: "none", label: "No rating" },
];
const ALL_RATINGS = RATING_OPTIONS.map((o) => o.id);

// The ticked options, in panel order. A record written before this pass
// carries the old ids, so "4plus" reads as 4 AND 5 stars and anything the
// panel no longer offers drops.
//
// AN EMPTY LIST NOW MEANS NOTHING MATCHES, not everything. The old facet had
// no way to show "none ticked", so empty had to stand for all; the panel has
// a Toggle All checkbox sitting right above the five, and treating an empty
// list as all would make that box lie about what it just did.
function normaliseRatings(list) {
  const on = new Set();
  (list ?? []).forEach((x) => {
    if (x === "4plus") {
      on.add("4");
      on.add("5");
      return;
    }
    if (ALL_RATINGS.includes(x)) on.add(x);
  });
  return ALL_RATINGS.filter((id) => on.has(id));
}

// Does one review pass the Star Rating filter? OR across the ticked options.
function ratingMatches(review, ratings) {
  const on = normaliseRatings(ratings);
  if (typeof review.rating === "number") return on.includes(String(review.rating));
  if (review.recommended === true) return on.includes("rec");
  if (review.recommended === false) return false;
  return on.includes("none");
}

// The card's Ratings row: the words, not the count. All five ticked is the
// state a reader should not have to decode from a list of five labels.
function ratingLabel(ratings) {
  const on = normaliseRatings(ratings);
  if (on.length === ALL_RATINGS.length) return "All ratings";
  if (on.length === 0) return "None";
  return RATING_OPTIONS.filter((o) => on.includes(o.id))
    .map((o) => o.label)
    .join(", ");
}

// FEEDBACK SCORE (NPS): three radios, the product's own words.
//
// ASSUMPTION, AND IT IS A BIG ONE: no review in this prototype's pool carries
// a feedback score. They come from Get Reviews campaigns, which this data set
// does not model. So All and None both show every review and Positive shows
// none, and the table's empty line says so rather than reading as a bug. The
// alternative was inventing a score per review, which would be a product enum
// we have never seen a real value of.
const NPS_OPTIONS = [
  { id: "all", label: "All" },
  { id: "none", label: "None" },
  { id: "positive", label: "Positive" },
];
const npsOf = (widget) => (NPS_OPTIONS.some((o) => o.id === widget.nps) ? widget.nps : "all");
function npsMatches(review, nps) {
  if (nps === "all") return true;
  const score = typeof review.nps === "number" ? review.nps : null;
  if (nps === "none") return score === null;
  return score !== null && score >= 9;
}

// THE PRODUCT'S DATE LIST. "Last month" is the previous CALENDAR month, which
// is the only reading that leaves it saying something "Last 30 days" does not.
// A legacy "90" reads as All time, since the panel no longer offers it.
const DATE_OPTIONS = [
  { id: "all", label: "All time" },
  { id: "7", label: "Last 7 days", days: 7 },
  { id: "30", label: "Last 30 days", days: 30 },
  { id: "lastmonth", label: "Last month" },
  { id: "182", label: "Last 6 months", days: 182 },
  { id: "365", label: "Last 12 months", days: 365 },
  { id: "custom", label: "Custom date range" },
];
const dateOptionOf = (widget) =>
  DATE_OPTIONS.find((o) => o.id === widget.period) ?? DATE_OPTIONS[0];

// The pool's own today, not the machine's clock: every row carries both its
// ISO day and how many days ago it was, so the two together name the day this
// data set was generated against. Windows are measured from that, or a
// prototype frozen at 9 Sep 2026 would drift out of "Last 7 days" overnight.
let POOL_TODAY = "2026-09-09";
function shiftIso(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
const isoOf = (review) => review.iso || shiftIso(POOL_TODAY, -review.daysAgo);

// First and last day of the calendar month before the pool's today.
function lastMonthRange() {
  const d = new Date(`${POOL_TODAY}T00:00:00Z`);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  return [
    new Date(Date.UTC(y, m - 1, 1)).toISOString().slice(0, 10),
    new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10),
  ];
}

function dateMatches(widget, review) {
  const option = dateOptionOf(widget);
  if (option.id === "all") return true;
  if (option.id === "custom") {
    const day = isoOf(review);
    if (widget.dateStart && day < widget.dateStart) return false;
    if (widget.dateEnd && day > widget.dateEnd) return false;
    return true;
  }
  if (option.id === "lastmonth") {
    const [from, to] = lastMonthRange();
    const day = isoOf(review);
    return day >= from && day <= to;
  }
  return review.daysAgo <= option.days;
}

// The card's Date row. A custom range says the range, because "Custom date
// range" on its own is the name of a control rather than a fact.
function dateLabel(widget) {
  const option = dateOptionOf(widget);
  if (option.id !== "custom") return option.label;
  const from = widget.dateStart ? formatDate(widget.dateStart) : "the start";
  const to = widget.dateEnd ? formatDate(widget.dateEnd) : "today";
  return `${from} to ${to}`;
}

// REVIEW SOURCES ARE AN EXPLICIT LIST, same rule as the ratings above: the
// panel has a Toggle All box, so the record holds what is ticked. An absent
// list (a record written before this pass) reads as all of them; an empty one
// is a choice, and matches nothing.
const sourcesOf = (widget) => (Array.isArray(widget.sources) ? widget.sources : SOURCE_IDS);

// YELP IS IN THE DATA AND CANNOT BE USED. Their terms forbid reusing reviews
// off-site, so a Yelp review is listed in Select Reviews, with its date, stars
// and text, and carries no Position and no Blacklist: there is no choice to
// make about it. The banner at the top of the step is where that is explained,
// which is why the rows are shown rather than quietly filtered away.
const UNAVAILABLE_SOURCES = ["yelp"];
const isUsable = (review) => !UNAVAILABLE_SOURCES.includes(review.source);
const UNAVAILABLE_TIP =
  "Yelp does not allow its reviews to be republished, so this one cannot go in a showcase.";

// THREE SHOWCASES, FIXED (Ali, 7 Sep: "drop create new, and just call them
// three things, this keeps the scope tight and easier to port"). Matches the
// live product: List, Carousel and JSON feed exist once each, are never
// created, named or deleted, and their format is what they are. `caption`
// is the live product's card copy, TRIMMED: the live lines are longer and
// clumsy ("Display your reviews in an ordered, customisable list on your
// website" and so on), so these keep the verb and the noun and drop the rest.
// `heading` is the settings page title and the sheet titles: the card's
// own title, verbatim (Ali, 7 Sep: "each showcase should have a title, even
// if it's just in the page header, it should come from the homepage").
const FORMATS = {
  list: {
    id: "list",
    label: "List",
    heading: "List",
    caption: "Display reviews in an ordered, customisable list",
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

// There used to be a second, wider clamp here for the Select Reviews sheet.
// Select reviews is a full-bleed page now, so the wide clamp went with it and
// this is the one clamp left. Three sheets wear it: the preview and embed
// drawers on the showcase list, and the design part sheet in the editor.

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
  // FIVE OF THESE RUN LONG ON PURPOSE (Ali, 20 Sep: "make it functionally the
  // same"). "Reviews character count" offers 140 or 280, and a control that
  // cannot cut anything is a control nobody can judge: every line here used to
  // stop around 118 characters, so the cut never fired, the "Read More" tail
  // never drew, and Link color had no surface anywhere in the widget. Three
  // HIGH lines, one MID and one LOW now run past 280, and one HIGH and one MID
  // sit in the band between 140 and 280, mixed in among the short ones. So a
  // preview shows clipped and unclipped cards side by side, and moving the
  // radio from 280 to 140 both shortens the long cards AND clips cards that
  // were whole, which is the only way to see what the setting does.
  const HIGH = [
    "Wonderful day out with the kids. The animal handlers were brilliant and everything felt well looked after, right down to the hand washing points by the barn door. We arrived at ten and did not leave until closing, and the children still wanted one more go on the tractor ride before we went. Parking was easy, the picnic benches were clean, and nobody rushed us at any point in the day.",
    "Fantastic from start to finish. The tractor ride and goat feeding were the highlights for our two.",
    "Best farm park in the area by a mile. Clean, friendly and great value for a family ticket, and the staff actually seem pleased to see you. We have tried three others this year and keep coming back to this one.",
    "The children loved every minute. Lamb feeding, the sandpit and the maize maze kept all three of them busy from the moment we walked in. Staff could not have been more helpful when our youngest lost a shoe in the straw bales, and one of them walked the whole barn with us until we found it. We have already booked to come back at half term.",
    "Lovely setting and really happy animals. The owl encounter made my daughter's whole week.",
    "Great day with the grandchildren. Plenty of shade, good picnic spots and the pig racing is very funny, even for the adults standing at the back. The cafe does a proper pot of tea and one of the girls carried it out to us so we did not lose our table. Three generations of us had a lovely afternoon and not one of us wanted to leave early.",
  ];
  const MID = [
    "Really good day out. Only small gripe was the queue at the cafe around lunchtime.",
    "Lots to do and lovely staff. The car park fills up fast on weekends so arrive early, and if you can come on a weekday you will have the run of the place. We lost about half an hour queueing for the tractor ride, which the children did not mind but I did, and the cafe had a long wait at lunchtime. Still good value for a family ticket.",
    "The kids had a great time and we would happily come again. It would be five stars if the ice cream kiosk took card, because we had to walk back to the car for change and lost our place in the queue twice.",
    "Good honest family attraction with well kept animals. Bring wellies after rain.",
  ];
  const LOW = [
    "The animals were lovely but a couple of the advertised attractions were closed on the day, with nothing on the website or at the gate to warn us. We had promised the children the owl encounter and the soft play, and both were shut, so the afternoon turned into a long walk round the paddocks. A note at the ticket desk would have saved a lot of disappointment.",
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
    // THE ISO DAY, KEPT (Ali, 20 Sep). The date format is a setting now
    // (MMDDYYYY, DDMMYYYY or hidden), so the three parts have to survive to
    // the point of display; `date` stays as the long form every other RM
    // screen prints, for anything that still wants it.
    iso: isoDate(r.daysAgo),
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

// THE POOL IS THE LOCATION'S OWN REVIEWS (Showcase audit, 10 Sep).
// buildReviews() is the farm park's 1,116 rows and nothing else: every
// location showed "1,116 Total Reviews / 4.7" over reviews about owl
// encounters and the maize maze, while the insight strip directly above
// said 130 and 68 five-star, and the Manager for the same location showed
// completely different rows. lib/reviews-data is the one pool the rest of
// the app reads, so the showcase reads it too and the farm-park builder
// becomes the fallback for a location with no profile.
//
// Selected ONCE per render, before any widget reads it, the same way the
// Tracker selects its sources. Module-level so the memoised consumers keep
// their shape; the app remounts the page when the persona changes.
const FALLBACK_REVIEWS = buildReviews();
let REVIEWS = FALLBACK_REVIEWS;

/** A lib/reviews-data row in the shape this screen's widgets expect: a
 *  numeric rating OR a Facebook recommendation, and a formatted date. */
function asShowcaseReview(r) {
  return {
    id: r.id,
    name: r.name,
    source: r.source,
    rating: typeof r.rating === "number" ? r.rating : null,
    recommended: r.rating === "up" ? true : r.rating === "down" ? false : null,
    daysAgo: r.daysAgo,
    // The pool row's own ISO day, for the date-format setting; see the same
    // field on the fallback builder above.
    iso: typeof r.date === "string" ? r.date : "",
    date: formatDate(r.date),
    text: r.text,
  };
}

function selectShowcaseReviews(location, persona) {
  const rows = reviewsFor(location, persona);
  REVIEWS = rows.length ? rows.map(asShowcaseReview) : [];
  POOL_TOTAL = REVIEWS.length;
  const stars = REVIEWS.filter((r) => typeof r.rating === "number").map((r) => r.rating);
  POOL_AVERAGE = stars.length ? stars.reduce((a, b) => a + b, 0) / stars.length : 0;
  // The day this pool was generated against, recovered from any one row: its
  // own ISO day plus how many days ago it was. The date filter measures every
  // window from here rather than from the clock. See POOL_TODAY.
  const first = REVIEWS[0];
  if (first?.iso) POOL_TODAY = shiftIso(first.iso, first.daysAgo);
}

/* ============================== widget design ============================= */

// THE REAL PRODUCT'S WIDGET DESIGN SCREEN, CONTROL FOR CONTROL (Ali, 20 Sep:
// "I've been told to make it functionally the same", with screenshots of
// BrightLocal's own Widget Design screen). Everything that screen can set has
// a key here. The record is FLAT on purpose: a preset is then one value per
// key, and "is this still a preset?" is one === per key rather than a walk
// over nested objects.
//
// DESIGN_DEFAULTS is what each field falls back to, the numbers the
// screenshots show. Each preset is those defaults with the handful of
// differences that make it look like itself, so the three looks read as data
// and no branch in the JSX has to know what "Classic" means.
const DESIGN_DEFAULTS = {
  // Layout
  maxHeight: 960,
  // A STRING, because a ToggleGroup's value is a string. Kept as one all the
  // way through so a preset comparison never has to coerce.
  columns: "1",
  count: 25,
  // Container
  bg: "#FFFFFF",
  radius: 5,
  borderOn: false,
  borderWidth: 1,
  borderColor: "#DDDDDD",
  shadowOn: false,
  shadowX: 0,
  shadowY: 2,
  shadowBlur: 6,
  shadowSpread: 0,
  shadowColor: "#E0E0E0",
  titleOn: true,
  title: "Customer Reviews",
  summary: "all",
  // Text
  font: "Roboto",
  color: "#212529",
  linkColor: "#007BFF",
  size: 16,
  align: "left",
  // Reviews
  showName: true,
  showSource: true,
  schema: true,
  dateFormat: "mdy",
  chars: 280,
  reviewBg: "#FFFFFF",
  reviewRadius: 4,
  reviewBorderOn: false,
  reviewBorderWidth: 1,
  reviewBorderColor: "#DDDDDD",
  reviewShadowOn: false,
  reviewShadowX: 0,
  reviewShadowY: 1,
  reviewShadowBlur: 3,
  reviewShadowSpread: 0,
  reviewShadowColor: "#E0E0E0",
};

// THE PRODUCT'S OWN THUMBNAILS (Ali, 20 Sep, saved out of BrightLocal's
// Widget Design screen into apps/brightlocal/public/widget-presets/). Each is
// a square crop of that preset's review card, so the tiles are the real
// artwork rather than a drawing of it. "classical.jpg" is their filename for
// the preset this file calls Classic; the map is here so that one mismatch
// sits in a single place.
const PRESET_THUMBS = {
  modern: "/widget-presets/modern.jpg",
  classic: "/widget-presets/classical.jpg",
  bootstrap: "/widget-presets/bootstrap.jpg",
  custom: "/widget-presets/custom.jpg",
};

const DESIGN_PRESETS = {
  modern: {
    id: "modern",
    label: "Modern",
    // The look the showcase already had: rounded corners, a soft shadow, no
    // borders. Every other value is the field default, so a showcase sitting
    // on Modern shows the numbers the screenshots show.
    values: { ...DESIGN_DEFAULTS, shadowOn: true, reviewShadowOn: true },
  },
  classic: {
    id: "classic",
    label: "Classic",
    // Squarer, hairline borders, cards on a slightly grey ground, and the
    // slab face carrying the heavier title. There is no separate title-font
    // control on the real screen, so "serif-ish heavier title" has to come
    // out of the one Font select, which is the job Slabo 27px is doing here.
    values: {
      ...DESIGN_DEFAULTS,
      radius: 0,
      reviewRadius: 0,
      borderOn: true,
      reviewBorderOn: true,
      bg: "#F7F7F7",
      font: "Slabo 27px",
      linkColor: "#0056B3",
      chars: 140,
    },
  },
  bootstrap: {
    id: "bootstrap",
    label: "Bootstrap",
    // The plainest of the three: square, 1px #DDDDDD everywhere, no shadow,
    // and Bootstrap's own body colour and link blue, which the field defaults
    // already carry.
    values: {
      ...DESIGN_DEFAULTS,
      radius: 0,
      reviewRadius: 0,
      borderOn: true,
      reviewBorderOn: true,
      font: "Open Sans",
    },
  },
};
const PRESET_ORDER = ["modern", "classic", "bootstrap"];
// EVERY SETTING BUT THE WORDS YOU TYPED. `title` is the one design key whose
// value is the user's own copy rather than a setting, and all three presets
// carry the same default title, so including it could only ever destroy: type
// "What our customers say" and the tile would flip to Custom although nothing
// about the look had changed, then picking Modern back to recover the look
// would silently wipe the sentence. So the title is out of preset identity and
// out of what a preset writes; everything else is in.
const PRESET_KEYS = Object.keys(DESIGN_DEFAULTS).filter((k) => k !== "title");

// WHICH TILE IS LIT. A preset is still chosen while every one of its values is
// in place; the moment one differs the answer is "custom", which is how the
// Custom tile earns its place rather than being a fourth thing on offer.
// ASSUMPTION (Ali, 20 Sep: "picking a preset sets every control below to that
// preset's values"): that is read literally, so a preset owns EVERY control in
// the four groups, not just the styling. Worth saying out loud, because three
// of those are not really a look:
//   Layout    maxHeight, columns, count. Moving to two columns reads as
//             Custom, and picking Modern again puts you back to one column.
//   Reviews   showName, showSource, schema, dateFormat. So picking Classic
//             re-ticks "Add business details to Schema" and resets the date
//             format. Schema is an SEO decision rather than a look, and
//             nobody would expect a look to switch it back on.
// Both readings are defensible and this one is Ali's words taken at face
// value. Flag if a preset should carry the styling alone and leave the layout
// numbers and the Reviews content toggles where they were.
const presetOf = (design) =>
  PRESET_ORDER.find((id) => PRESET_KEYS.every((k) => design[k] === DESIGN_PRESETS[id].values[k])) ??
  "custom";

// The seven faces the real screen offers. They are Google fonts and nothing in
// this prototype loads them, so each carries a stack that falls back to
// something of the same character on a machine without it. The published
// widget would load the face itself.
const FONTS = [
  { id: "Roboto", stack: '"Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif' },
  { id: "Open Sans", stack: '"Open Sans", "Segoe UI", Arial, sans-serif' },
  { id: "Lato", stack: '"Lato", "Trebuchet MS", Arial, sans-serif' },
  { id: "Slabo 27px", stack: '"Slabo 27px", Rockwell, Georgia, serif' },
  { id: "Roboto Condensed", stack: '"Roboto Condensed", "Arial Narrow", Arial, sans-serif' },
  { id: "Oswald", stack: '"Oswald", "Arial Narrow", Impact, sans-serif' },
  { id: "Montserrat", stack: '"Montserrat", "Gill Sans", Arial, sans-serif' },
];
const fontStack = (id) => (FONTS.find((f) => f.id === id) ?? FONTS[0]).stack;

// The option lists the controls and the summary rows both read, so a label is
// written once and a card can never disagree with the sheet.
const COLUMN_OPTIONS = [
  { id: "1", label: "One column", Icon: Square },
  { id: "2", label: "Two columns", Icon: Columns2 },
  { id: "3", label: "Three columns", Icon: Columns3 },
];
const ALIGN_OPTIONS = [
  { id: "left", label: "Left", Icon: AlignLeft },
  { id: "center", label: "Center", Icon: AlignCenter },
  { id: "right", label: "Right", Icon: AlignRight },
];
const SUMMARY_OPTIONS = [
  { id: "none", label: "None" },
  { id: "all", label: "All" },
  { id: "selected", label: "Selected" },
];
const DATE_FORMATS = [
  { id: "mdy", label: "MMDDYYYY" },
  { id: "dmy", label: "DDMMYYYY" },
  { id: "hidden", label: "Hidden" },
];
const CHAR_COUNTS = [
  { id: 140, label: "140 characters" },
  { id: 280, label: "280 characters" },
];
const REVIEW_TOGGLES = [
  { key: "showName", label: "Display reviewer's name" },
  { key: "showSource", label: "Display review site icon" },
  // Schema is markup on the published widget, not something a preview can
  // draw, so it shows as a row on the settings card and nowhere else.
  { key: "schema", label: "Add business details to Schema" },
];
// The four numbers a CSS shadow takes, in CSS order, so the fields read the
// way the value reads. `key` builds the design key: "shadow" + "X" is
// shadowX, "reviewShadow" + "Blur" is reviewShadowBlur.
const SHADOW_PARTS = [
  { id: "x", key: "X", label: "X" },
  { id: "y", key: "Y", label: "Y" },
  { id: "blur", key: "Blur", label: "Blur" },
  { id: "spread", key: "Spread", label: "Spread" },
];

// A half-typed hex ("#21", "#2125") is not a colour yet, so the preview keeps
// the field's default until it is one. Typing never blanks the widget.
const HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const hex = (v, fallback) => (typeof v === "string" && HEX_RE.test(v.trim()) ? v.trim() : fallback);
// The browser's own colour input only takes six digits, so a three-digit hex
// is doubled out for it.
const hex6 = (v, fallback) => {
  const h = hex(v, fallback);
  return h.length === 4 ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h;
};
const shadowCss = (on, x, y, blur, spread, color, fallbackColor) =>
  on ? `${x}px ${y}px ${blur}px ${spread}px ${hex(color, fallbackColor)}` : "none";
// The shadow said in words used to feed the settings card's rows. Those rows
// went when Embed left the rail and the Design summary card with it; the line
// under each design block names the two or three settings that change the
// look most, and a four-number shadow is not one of them.
// A flex row cannot inherit text-align, so alignment has to be handed to it
// as a justify-content. One map, used wherever a row sits inside the widget.
const JUSTIFY = { left: "flex-start", center: "center", right: "flex-end" };

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
    format: "list",
    // ONE MODEL, THE PRODUCT'S (Ali, 20 Sep: "match the product", on a
    // screenshot of Select Reviews). Hand-picked versus Live feed is gone,
    // and with it `mode`, `picked` and the Limit select: the real screen has
    // no such choice. Every showcase is a filter, a per-review Position and a
    // per-review Blacklist, and how many of them reach the page is Widget
    // Design's "Number of reviews to show" and nothing else. That also
    // settles the two-controls-for-one-fact assumption WidgetPreview used to
    // carry: there is one cap now, and it is the one the product has.
    //
    // EVERYTHING TICKED TO START, which is what the panel's two Toggle All
    // boxes show on a showcase nobody has filtered yet. The old default
    // ("4 stars and above" plus Recommended) was this screen's own opinion
    // about what belongs on a homepage; the product's default is everything
    // it is allowed to offer, and three stars is as low as that goes.
    ratings: ALL_RATINGS,
    nps: "all",
    period: "all",
    dateStart: "",
    dateEnd: "",
    sources: SOURCE_IDS,
    // ON BY DEFAULT, as the real toolbar has it: a review that arrives
    // tomorrow and matches these filters joins the showcase on its own.
    autoSelect: true,
    // Reviews kept out by hand, by id (the product's per-review Blacklist
    // toggle). Honoured by resolveReviews, so the preview and every count on
    // the card follow it.
    blacklist: [],
    // Where a review sits in the widget, by id. -1 is the product's "no
    // position", and that is simply the absence of a key here; 1 is first.
    positions: {},
    design: {
      // MODERN IS THE STARTING LOOK, and Modern is DESIGN_DEFAULTS with the
      // soft shadow on, so a new showcase carries exactly the values the
      // Widget Design fields show as their defaults.
      ...DESIGN_PRESETS.modern.values,
      // See CarouselWidget. The real screen's own defaults: no auto rotate, a
      // two-second fade, arrows and dots both on. Not part of a preset, so
      // picking one never disturbs it.
      carousel: { autoRotate: false, transition: "fade", speed: 2, arrows: true, dots: true },
    },
  };
}

// The three showcases, one per format, ids equal to the format. Each keeps
// the character it always had, said in the product's model: the List is the
// five-star one (it used to be a hand-picked set of five-star reviews, and
// there is no hand-picking any more, so the filter says it instead), the
// Carousel is Google over the last twelve months, the JSON feed is the
// defaults. Two of the three also carry a Position and a Blacklist, because a
// screen where every row reads -1 and Off never shows what those columns do.
function seedWidgets() {
  const base = blankWidget();
  const fiveStar = REVIEWS.filter((r) => r.rating === 5 && isUsable(r)).slice(0, 3);
  return [
    {
      ...base,
      id: "list",
      updated: "2026-07-04T09:25",
      format: "list",
      ratings: ["5"],
      // Three reviews pinned to the top of the widget, in the order someone
      // chose rather than the order they arrived in.
      positions: Object.fromEntries(fiveStar.map((r, i) => [r.id, i + 1])),
      // Square, hairline-bordered, snippets: the look this seed always had,
      // said as a preset now rather than as three loose keys.
      design: { ...base.design, ...DESIGN_PRESETS.classic.values },
    },
    {
      ...base,
      id: "carousel",
      updated: "2026-08-21T16:40",
      format: "carousel",
      // "google" and "trustpilot" before the pool moved to the Tracker's
      // split; Trustpilot is not in that split, so it drops rather than being
      // swapped for a source nobody chose.
      sources: ["google"],
      ratings: ["5", "4", "rec"],
      period: "365",
      // One review kept off the site by hand, so the Blacklist row on the
      // card has a number other than nought to report.
      blacklist: REVIEWS.filter((r) => r.source === "google" && r.rating === 4)
        .slice(0, 1)
        .map((r) => r.id),
      design: { ...base.design, ...DESIGN_PRESETS.modern.values },
    },
    {
      ...base,
      id: "json",
      format: "json",
      // A feed nobody is watching arrive: the one showcase with auto select
      // off, so the toolbar's toggle has both states on the screen.
      autoSelect: false,
    },
  ];
}

/* ================================= helpers ================================ */

// Does one review pass the SELECT REVIEWS FILTERS? The four the panel holds,
// AND'd: Star Rating, Feedback Score, Date, Review Sources. The Blacklist and
// the Yelp rule are applied on top, separately, so the card can say how many
// reviews a person kept out by hand.
function filterMatches(widget, r) {
  if (!ratingMatches(r, widget.ratings)) return false;
  if (!npsMatches(r, npsOf(widget))) return false;
  if (!dateMatches(widget, r)) return false;
  if (!sourcesOf(widget).includes(r.source)) return false;
  return true;
}
const blacklistOf = (widget) => widget.blacklist ?? [];
const positionsOf = (widget) => widget.positions ?? {};

// THE ROWS SELECT REVIEWS LISTS: everything the filters leave, Yelp included,
// because a Yelp review is shown as unavailable rather than hidden. The
// widget itself takes a narrower set; see resolveReviews.
const filteredReviews = (widget) => REVIEWS.filter((r) => filterMatches(widget, r));

// POSITION DECIDES THE ORDER (the product's per-review select, -1 by
// default). A review with a position sits at that place, lowest first; every
// other review keeps the pool's newest-first order behind them. Two reviews
// given the same number keep their pool order relative to each other, since
// Array.prototype.sort is stable.
// ASSUMPTION: a position beyond the number of reviews the widget shows simply
// sorts last among the positioned ones rather than being rejected. The real
// screen offers a plain select and says nothing about the out-of-range case.
function orderByPosition(list, widget) {
  const pos = positionsOf(widget);
  const placed = list.filter((r) => pos[r.id] > 0).sort((a, b) => pos[a.id] - pos[b.id]);
  const rest = list.filter((r) => !(pos[r.id] > 0));
  return [...placed, ...rest];
}

// The set of reviews a widget publishes: what the filters leave, minus Yelp,
// minus the blacklist, in Position order, capped by Widget Design's own
// "Number of reviews to show". That cap is applied LAST, after the ordering,
// so a review pinned to position 1 is in the widget whatever its date.
function resolveReviews(widget) {
  const usable = filteredReviews(widget).filter(
    (r) => isUsable(r) && !blacklistOf(widget).includes(r.id),
  );
  return orderByPosition(usable, widget).slice(0, widget.design.count);
}

// KEY/VALUE ROWS, NOT AN INTERPUNCT STRING (Ali, 2 Sep: "having all the
// options in a row with interpuncts is not very visual at all, I'd
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
//
// THE SAME ROWS ON EVERY CARD (Ali, 20 Sep: "each one of these cards should
// basically be the same"). Seven rows in one order, whatever the showcase is,
// so the three cards line up row for row and the eye can run straight down a
// column instead of re-reading each card's shape.
//
// WHAT THE ROWS SAY NOW is the Select Reviews model and only that: the four
// filters, whether auto select is on, how many reviews were blacklisted, and
// how many are on the site today. "Chosen by", "Limit" and "Left out" went
// with hand-picking. `reviews` is the resolved set, passed in where the
// caller already has it so a card and its settings page cannot disagree.
function widgetRows(widget, reviews = resolveReviews(widget)) {
  const sources = sourcesOf(widget);
  const blacklisted = blacklistOf(widget).length;
  return [
    { k: "Ratings", v: ratingLabel(widget.ratings) },
    {
      k: "Feedback score",
      v: NPS_OPTIONS.find((o) => o.id === npsOf(widget)).label,
    },
    { k: "Date", v: dateLabel(widget) },
    {
      k: "Sources",
      // MARKS BESIDE NAMES (Ali, 7 Sep: "on sources, can we include the
      // logo?"). Ticked sources show mark and name each, in the fixed source
      // order rather than click order; "All sources" shows the words alone,
      // because marks stand for a choice and "all of them" is the absence of
      // one. SourceMark is the registry's, not a local drawing.
      v:
        sources.length === SOURCE_IDS.length ? (
          <span>All sources</span>
        ) : sources.length === 0 ? (
          <span>None</span>
        ) : (
          <span className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
            {SOURCE_LIST.filter((s) => sources.includes(s.id)).map((s) => (
              <span key={s.id} className="flex items-center gap-1.5">
                <SourceMark source={s.id} />
                {s.label}
              </span>
            ))}
          </span>
        ),
    },
    { k: "Auto select", v: widget.autoSelect === false ? "Off" : "On" },
    // Always rendered, "Blacklisted 0" included, so the row count never
    // changes as reviews are kept out and let back in.
    {
      k: "Blacklisted",
      v: `${blacklisted} review${blacklisted === 1 ? "" : "s"}`,
    },
    // "Showing now" says how many are on the site TODAY, which is not the
    // same as how many the filters allow: the Widget Design count caps it.
    { k: "Showing now", v: `${reviews.length} review${reviews.length === 1 ? "" : "s"}` },
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

// ChoiceCards is gone with the Hand-picked / Live feed pair it drew. Select
// Reviews has one model now, so there is no axis left to offer as two cards
// (Ali, 20 Sep: match the product).

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

// THE SKIN IS STYLE NOW, NOT CLASS NAMES (Ali, 20 Sep). The widget's colours,
// radii, borders, shadows, face and size are numbers and hex the customer
// types, so none of them can be a Tailwind utility: every one is an inline
// style, built here, once, and read by every preview on the screen. This is
// still the one surface that paints the CUSTOMER's website rather than a Grade
// surface, which is why raw hex is right here and nowhere else on the page.
//
// SIZES ARE em, NOT text-sm. The Size control sets the widget's font-size in
// pixels on the shell and everything inside is a multiple of it, so moving the
// slider moves the whole widget instead of just the paragraph.
function previewSkin(design) {
  const d = design;
  const text = hex(d.color, DESIGN_DEFAULTS.color);
  return {
    align: d.align,
    columns: Number(d.columns) || 1,
    shell: {
      background: hex(d.bg, DESIGN_DEFAULTS.bg),
      borderRadius: `${d.radius}px`,
      // A transparent border while the border is off, so ticking the box
      // paints a line instead of shifting the whole widget by a pixel.
      border: d.borderOn
        ? `${d.borderWidth}px solid ${hex(d.borderColor, DESIGN_DEFAULTS.borderColor)}`
        : "1px solid transparent",
      boxShadow: shadowCss(
        d.shadowOn,
        d.shadowX,
        d.shadowY,
        d.shadowBlur,
        d.shadowSpread,
        d.shadowColor,
        DESIGN_DEFAULTS.shadowColor,
      ),
      fontFamily: fontStack(d.font),
      fontSize: `${d.size}px`,
      color: text,
      textAlign: d.align,
    },
    card: {
      background: hex(d.reviewBg, DESIGN_DEFAULTS.reviewBg),
      borderRadius: `${d.reviewRadius}px`,
      border: d.reviewBorderOn
        ? `${d.reviewBorderWidth}px solid ${hex(d.reviewBorderColor, DESIGN_DEFAULTS.reviewBorderColor)}`
        : "1px solid transparent",
      boxShadow: shadowCss(
        d.reviewShadowOn,
        d.reviewShadowX,
        d.reviewShadowY,
        d.reviewShadowBlur,
        d.reviewShadowSpread,
        d.reviewShadowColor,
        DESIGN_DEFAULTS.reviewShadowColor,
      ),
    },
    // The name, the meta line and the title are the TEXT colour, not colours
    // of their own: the real screen has one Color field, so inventing a
    // second would be a value nobody could reach. The meta line is the same
    // ink, knocked back.
    name: { color: text, fontSize: "0.9375em", fontWeight: 600 },
    rating: { color: text, fontSize: "0.875em" },
    meta: { color: text, fontSize: "0.8125em", opacity: 0.65 },
    title: { color: text, fontSize: "1.125em", fontWeight: 600 },
    link: { color: hex(d.linkColor, DESIGN_DEFAULTS.linkColor) },
    // THE REVIEWS SCROLL, NOT THE WHOLE BOX. "Widget max height" caps the
    // list so the title and the summary stay put while the reviews move
    // under them. ASSUMPTION: the real screen may cap the outer box instead,
    // header and all.
    scroller: { maxHeight: `${d.maxHeight}px`, overflowY: "auto" },
  };
}

// THE DATE IN THE CHOSEN FORMAT (Ali, 20 Sep). Every review carries an ISO
// day, so MMDDYYYY and DDMMYYYY are two orderings of the same three parts and
// Hidden draws nothing at all. A row with no ISO day falls back to the long
// form it already had rather than showing a gap.
function reviewDate(review, format) {
  if (format === "hidden") return null;
  const [y, m, day] = (typeof review.iso === "string" ? review.iso : "").split("-");
  if (!y || !m || !day) return review.date ?? null;
  return format === "dmy" ? `${day}/${m}/${y}` : `${m}/${day}/${y}`;
}

// THE DS Rating, NOT HAND-DRAWN STARS (Ali, 7 Sep: "we need to use our
// Reviews star rating"). Rating fills each star by percentage (checked in
// its dist: a width-clipped overlay per star), so the header's 4.7 shows
// four full stars and a seven-tenths fifth, and a review row shows whole
// stars. It is what FeedbackScore draws on Review Manager and Review
// Builder, so a star now looks the same on every RM screen. The stars are the
// one thing in the widget the colour settings do not reach: they are the DS
// component as it ships.

function PreviewReview({ review, design, skin }) {
  // TRUNCATION IS A NUMBER NOW (Ali, 20 Sep): the real screen offers 140 or
  // 280 characters, so the cut is design.chars and the tail is a "Read More"
  // anchor, not a button, because on the customer's site it opens the review
  // at its source. Here it goes nowhere. It is drawn in the LINK colour,
  // which is the one place that setting shows.
  const clipped = review.text.length > design.chars;
  const text = clipped ? `${review.text.slice(0, design.chars - 3).trimEnd()}…` : review.text;
  const sourceName = SOURCES[review.source].label;
  const stamp = reviewDate(review, design.dateFormat);
  return (
    <div className="p-4" style={skin.card}>
      {/* A flex row cannot inherit text-align, so the alignment setting is
          handed to it as a justify-content. */}
      <div
        className="flex flex-wrap items-center gap-2"
        style={{ justifyContent: JUSTIFY[skin.align] ?? "flex-start" }}
      >
        {review.source === "facebook" ? (
          review.recommended ? (
            <span className="flex items-center gap-1" style={skin.rating}>
              <ThumbsUp className="size-4" /> Recommended
            </span>
          ) : (
            <span className="flex items-center gap-1" style={skin.rating}>
              <ThumbsDown className="size-4" /> Not recommended
            </span>
          )
        ) : (
          <Rating value={review.rating} dataHook={`review-rating-${review.id}`} />
        )}
        {design.showName ? <span style={skin.name}>{review.name}</span> : null}
        {stamp ? (
          <span style={skin.meta} data-hook="review-date">
            {stamp}
          </span>
        ) : null}
        {/* THE SOURCE AS ITS MARK, at the right of the line, as the live
            widgets draw it (coordinator, 7 Sep). On a left-aligned widget it
            still hugs the right edge; on a centred or right-aligned one it
            joins the line rather than fighting the alignment it was given. */}
        {design.showSource ? (
          <span
            className="flex"
            style={skin.align === "left" ? { marginLeft: "auto" } : undefined}
            role="img"
            aria-label={sourceName}
            title={sourceName}
            data-hook="review-source-mark"
          >
            <SourceMark source={review.source} />
          </span>
        ) : null}
      </div>
      <p className="mt-2" style={{ fontSize: "1em", lineHeight: 1.55 }}>
        {text}
        {clipped ? (
          <>
            {" "}
            <a
              href="#"
              className="underline underline-offset-2"
              style={skin.link}
              onClick={(e) => e.preventDefault()}
              data-hook="review-read-more"
            >
              Read More
            </a>
          </>
        ) : null}
      </p>
    </div>
  );
}

// 7. HEADER ROW, as the LIVE widgets have it (coordinator, 7 Sep, from
// screenshots): a title on the left ("Customer Reviews"), and on the right a
// small "{total} Total Reviews" line above stars and the bold average.
// The title is behind its own "Customize widget title" checkbox now, as the
// real screen has it, and the summary is a three-way choice rather than a
// switch. Title off and summary None and the row is not drawn at all.
// `let`, because selectShowcaseReviews above rewrites all three together.
let POOL_TOTAL = REVIEWS.length;
const fmtCount = (n) => n.toLocaleString("en-GB");
let POOL_AVERAGE = (() => {
  const stars = REVIEWS.filter((r) => typeof r.rating === "number").map((r) => r.rating);
  return stars.length ? stars.reduce((a, b) => a + b, 0) / stars.length : 0;
})();
const headerTitle = (design) => (design.titleOn === false ? "" : (design.title ?? "").trim());
const hasHeader = (design) => design.summary !== "none" || headerTitle(design).length > 0;

// THREE ANSWERS, NOT TWO (Ali, 20 Sep): "Review summary" is None, All or
// Selected. ALL is the location's whole pool, which is what a summary on a
// website normally means, and is what this row always said before. SELECTED
// is the reviews this showcase actually publishes, which is the honest number
// for a narrow filter, where the pool's average would be a different claim.
// The average is over star ratings only, since Facebook recommendations carry
// no score; the total counts every review.
function summaryOf(design, reviews) {
  if (design.summary === "none") return null;
  if (design.summary === "selected") {
    const stars = reviews.filter((r) => typeof r.rating === "number").map((r) => r.rating);
    return {
      total: reviews.length,
      average: stars.length ? stars.reduce((a, b) => a + b, 0) / stars.length : 0,
    };
  }
  return { total: POOL_TOTAL, average: POOL_AVERAGE };
}

function WidgetHeader({ design, skin, reviews }) {
  const title = headerTitle(design);
  const stats = summaryOf(design, reviews);
  if (!title && !stats) return null;
  return (
    // flex-wrap with a nowrap title: on a narrow widget the stats block drops
    // under the title rather than the title breaking mid-word beside it.
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1" data-hook="widget-header">
      {title ? (
        <span className="whitespace-nowrap" style={skin.title} data-hook="widget-header-title">
          {title}
        </span>
      ) : (
        <span />
      )}
      {stats ? (
        <div className="flex flex-col items-end gap-0.5 text-right" data-hook="widget-header-stats">
          <span style={skin.meta}>{fmtCount(stats.total)} Total Reviews</span>
          <span className="flex items-center gap-1.5">
            <Rating value={Number(stats.average.toFixed(1))} dataHook="widget-header-rating" />
            <span style={skin.name}>{stats.average.toFixed(1)}</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}

// 6. CAROUSEL SETTINGS, THE PRODUCT'S FIVE (Ali, 20 Sep, from a screenshot of
// the real product's carousel settings). Auto rotate, transition style,
// transition animation speed, slide arrows, slide dots, in that order and
// with those defaults. Read through carouselOf so a record saved before this
// pass (loop / autoplay / every) behaves as the new defaults rather than
// carrying settings nothing offers any more.
//
// THERE IS NO LOOP CONTROL. The real screen does not offer one, so the
// carousel simply always wraps: reaching the last slide and stopping dead is
// not a behaviour anyone can now ask for.
// ASSUMPTION: always-wrap is our reading of a screen with no such control.
const CAROUSEL_DEFAULTS = { autoRotate: false, transition: "fade", speed: 2, arrows: true, dots: true };
const TRANSITION_OPTIONS = [
  { id: "fade", label: "Fade" },
  { id: "slide", label: "Slide" },
];
// The slider's ends, named once so the control, the clamp and the summary
// row cannot disagree.
const SPEED_MIN = 1;
const SPEED_MAX = 10;
const carouselOf = (design) => {
  const c = { ...CAROUSEL_DEFAULTS, ...(design.carousel ?? {}) };
  // A speed from outside the slider's range (an older draft's 4 is fine, its
  // absence is not) comes back inside it, so the thumb always has somewhere
  // to sit.
  const speed = Number.isFinite(c.speed)
    ? Math.min(SPEED_MAX, Math.max(SPEED_MIN, Math.round(c.speed)))
    : CAROUSEL_DEFAULTS.speed;
  const transition = TRANSITION_OPTIONS.some((o) => o.id === c.transition)
    ? c.transition
    : CAROUSEL_DEFAULTS.transition;
  return { ...c, speed, transition };
};

// DOTS WITH A HIT AREA APART FROM THE DOT (Ali, 7 Sep: "the dots will need a
// hit area that is separate"). The DS CarouselDots draws each dot AS the
// button (size-3, a w-9 active pill, in a bordered white capsule) and has no
// size prop, so this scoped sheet restyles it: each button becomes a 24px
// square, edge to edge, and the 6px dot (16px pill when current) is drawn by
// its ::before, centred. Tokens only: input for a dot, muted-foreground at
// reduced opacity for the current one, as the DS itself does.
const CAROUSEL_DOTS_STYLE = `
[data-hook="widget-carousel-dots"] {
  gap: 0; border: 0; background: transparent; padding: 0;
  /* ONE DOT PER REVIEW, AND A SHOWCASE CAN HOLD 25 (20 Sep). At 24px each
     that is a 600px row, which pushed the arrows off the card on the
     settings page and off the panel in the Preview sheet. Wrapping keeps
     every dot reachable and keeps the arrows where they belong. */
  flex-wrap: wrap; justify-content: center; max-width: 100%;
}
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

// FADE, ALSO BY HAND (Ali, 20 Sep: "Transition style: Fade / Slide"). Embla
// ships a fade plugin and the DS does not bundle it, so this is that plugin's
// trick written out in CSS: freeze the track, stack every page on top of the
// first, and cross-fade whichever page is selected.
//
// EVERY TRANSFORM HERE IS !important, AND HAS TO BE. Embla writes transforms
// inline on two elements: the track, as it scrolls, and INDIVIDUAL SLIDES, as
// the loop wraps them from one end to the other. Both would fight a transform
// we set from React, and embla writes last, so the stack would come apart the
// first time the carousel wrapped. An important rule in a stylesheet beats a
// plain inline style, which is what makes this stable; it is also the only
// way to reach the track, which is DS internals with no hook of its own.
// Opacity is safe inline, because embla never touches it.
const CAROUSEL_FADE_SCOPE = '[data-hook="widget-carousel-shell"][data-transition="fade"]';
const CAROUSEL_FADE_STYLE = `
${CAROUSEL_FADE_SCOPE} [data-slot="carousel-content"] > div {
  transform: none !important;
}
${CAROUSEL_FADE_SCOPE} [data-slot="carousel-item"] {
  transition: opacity 400ms ease-in-out;
}
@media (prefers-reduced-motion: reduce) {
  ${CAROUSEL_FADE_SCOPE} [data-slot="carousel-item"] {
    transition: none;
  }
}
`;

// Where each slide stacks: page 1 back over page 0, page 2 over that, so every
// page sits in the same place and only opacity separates them. Each slide
// keeps its own column within its page, so two and three columns fade as a
// set. One rule per slide rather than one inline style per slide, for the
// !important reason above; the count is the Layout group's own cap, so this is
// fifty rules at the very most and five in the ordinary case.
const carouselFadeRules = (count, columns) =>
  Array.from({ length: count }, (_, i) => {
    const offset = -100 * columns * Math.floor(i / columns);
    return `${CAROUSEL_FADE_SCOPE} [data-slot="carousel-item"]:nth-child(${i + 1}) { transform: translateX(${offset}%) !important; }`;
  }).join("\n");

// The carousel format of the widget. Its own component because auto rotate
// needs the Embla api and a little state, and WidgetPreview is the ONE place
// the widget renders, so the settings card, the Preview sheet and the picker
// all get the same behaviour.
//
// AUTO ROTATE BY HAND. The DS ships embla-carousel-react but not the autoplay
// plugin, so this is the plugin's behaviour in an effect: scrollNext on an
// interval, paused while the pointer or focus is inside, stopped for good
// once the user takes the wheel (a drag, an arrow, a dot), and never started
// under prefers-reduced-motion. Swapping in embla-carousel-autoplay via the
// Carousel's `plugins` prop is the production route.
//
// THE SPEED IS THE GAP BETWEEN SLIDES, not the length of the animation
// (Ali, 20 Sep: "auto rotate advances at the chosen speed"). The label says
// "Transition animation speed", which could as easily mean how long the fade
// itself takes, so this is worth saying out loud.
// ASSUMPTION: seconds between advances. If it is the animation's own
// duration, the interval below and the 400ms in CAROUSEL_FADE_STYLE swap
// jobs. The fade is a fixed 400ms either way for now.
//
// IT HONOURS THE LAYOUT GROUP TOO. "Widget max height" and "Desktop layout
// display" are offered in the panel for a Carousel and stated on its settings
// card, so the carousel has to act on them or they are two rows asserting a
// fact nothing obeys. Taken as: max height caps the SLIDES, the same reading
// the list takes (the title and the controls stay put while the reviews move
// under them), and the column count is how many slides stand side by side, the
// ordinary meaning of a multi-slide carousel. ASSUMPTION, and our own call:
// the real Widget Design screen has no carousel format at all, so there is no
// product behaviour to copy here. Flag if a Carousel should simply not be
// offered the two controls.
function CarouselWidget({ widget, reviews, skin }) {
  const c = carouselOf(widget.design);
  const fade = c.transition === "fade";
  const [api, setApi] = useState(null);
  const [paused, setPaused] = useState(false);
  const [stopped, setStopped] = useState(false);
  // WHICH PAGE IS SHOWING. Only the fade needs it: with the track frozen
  // nothing moves, so the slides themselves have to be told which of them is
  // the current one. Embla's snap index IS the page index here, because a
  // fade scrolls a whole column set at a time (see `opts` below).
  const [snap, setSnap] = useState(0);
  useEffect(() => {
    if (!api) return;
    const sync = () => setSnap(api.selectedScrollSnap());
    sync();
    api.on("select", sync);
    api.on("reInit", sync);
    return () => {
      api.off("select", sync);
      api.off("reInit", sync);
    };
  }, [api]);
  useEffect(() => {
    if (!api) return;
    const stop = () => setStopped(true);
    api.on("pointerDown", stop);
    return () => api.off("pointerDown", stop);
  }, [api]);
  // Switching auto rotate (or its speed) on again is a fresh start.
  useEffect(() => {
    setStopped(false);
  }, [c.autoRotate, c.speed]);
  useEffect(() => {
    if (!api || !c.autoRotate || paused || stopped) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => api.scrollNext(), c.speed * 1000);
    return () => clearInterval(t);
  }, [api, c.autoRotate, c.speed, paused, stopped]);
  const controls = c.arrows || c.dots;
  return (
    <div
      className="min-w-0 p-4"
      style={skin.shell}
      // "-shell": the dashboard card for the Carousel showcase is
      // data-hook="widget-carousel" (widget-<id>), so the box needs its own.
      data-hook="widget-carousel-shell"
      // The transition hangs on this plain div rather than on the DS
      // Carousel, so CAROUSEL_FADE_STYLE has a hook it owns to scope from.
      data-transition={c.transition}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <style>
        {`${CAROUSEL_DOTS_STYLE}${CAROUSEL_FADE_STYLE}${fade ? carouselFadeRules(reviews.length, skin.columns) : ""}`}
      </style>
      {hasHeader(widget.design) ? (
        <div className="mb-3">
          <WidgetHeader design={widget.design} skin={skin} reviews={reviews} />
        </div>
      ) : null}
      {/* ALWAYS LOOPING, because the real screen has no Loop control to say
          otherwise. A fade scrolls a whole page at a time (slidesToScroll),
          which is what makes the stacked pages below line up and what makes
          one dot mean one page; a slide keeps the shipped one-at-a-time
          stepping. */}
      <Carousel
        dataHook="widget-carousel-preview"
        opts={{ loop: true, slidesToScroll: fade ? skin.columns : 1 }}
        setApi={setApi}
      >
        {/* The cap wraps the SLIDES, not the shell: the header above and the
            arrows and dots below stay where they are while only the reviews
            move, which is the same reading the list takes of this setting. It
            has to sit inside <Carousel> because the controls read that
            context, and around CarouselContent rather than on it because
            CarouselContent spreads its props onto the inner flex track. */}
        <div style={skin.scroller} data-hook="widget-carousel-scroller">
          <CarouselContent>
            {/* EVERY REVIEW IT WAS GIVEN, not the first eight: how many a
                showcase shows is the Layout group's own control now, and
                WidgetPreview has already applied it. A second cap here would
                be a number nobody set. */}
            {reviews.map((r, i) => {
              // The page this slide belongs to, and so where it stacks and
              // whether it is the visible one. Both are only read while
              // fading; a slide keeps embla's own layout untouched.
              const page = Math.floor(i / skin.columns);
              return (
                <CarouselItem
                  key={r.id}
                  className="flex"
                  // Overrides the DS item's own basis-full. One column is 100%,
                  // which is the shipped behaviour untouched; two and three
                  // stand that many slides side by side, and on a slide embla
                  // still advances one at a time.
                  style={{
                    flexBasis: `${100 / skin.columns}%`,
                    // Where it stacks is in the stylesheet; which page is lit
                    // is here, because it changes with every advance. The
                    // pages underneath are still there, so a link on one of
                    // them must not be clickable through the one on top.
                    ...(fade
                      ? {
                          opacity: page === snap ? 1 : 0,
                          pointerEvents: page === snap ? "auto" : "none",
                        }
                      : null),
                  }}
                >
                  <PreviewReview review={r} design={widget.design} skin={skin} />
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </div>
        {/* Arrows and dots each answer their own Yes / No; with both No the
            row is not drawn at all, which is the user's choice. Pressing
            either stops auto rotate, as the plugin would. */}
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
              <div className="flex min-w-0 flex-1 justify-center">
                <CarouselDots dataHook="widget-carousel-dots" slideAriaLabel="Go to review {slide}" />
              </div>
            ) : null}
            {c.arrows ? (
              <CarouselNext size="sm" dataHook="widget-carousel-next" className="static translate-x-0 translate-y-0" />
            ) : null}
          </div>
        ) : null}
      </Carousel>
    </div>
  );
}

// `full` shows every review (Showcase audit, 10 Sep). The cap makes sense on
// the card, where the preview is a thumbnail; in the dedicated preview sheet
// it truncated at four and appended "and 1 more review" with about 450px of
// empty drawer below it.
function WidgetPreview({ widget, reviews, full }) {
  const skin = previewSkin(widget.design);
  // HOW MANY REVIEWS, from the Layout group's own control (Ali, 20 Sep), and
  // it is now the ONLY cap: the Reviews section's Limit select went with the
  // Hand-picked / Live feed pair, because the product's Select Reviews step
  // has no such control. resolveReviews already applies this number, so the
  // slice here only matters for the few callers that hand this component a
  // list of their own.
  const shown = reviews.slice(0, widget.design.count);

  if (shown.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
        No reviews match yet. Widen the filters in Select Reviews.
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
    return <CarouselWidget widget={widget} reviews={shown} skin={skin} />;
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 p-4" style={skin.shell}>
      <WidgetHeader design={widget.design} skin={skin} reviews={shown} />
      {/* THE COLUMN COUNT AND THE MAX HEIGHT, both on this one box: a grid of
          one, two or three, capped in height and scrolling inside.
          minmax(0, 1fr) rather than 1fr because a review card's min-content
          width is its longest word plus the stars, and three auto columns of
          that overflowed a phone (the same bug the settings grid hit in
          September).
          ASSUMPTION: the real control is called "Desktop layout display", so
          it presumably drops to one column on a phone. An inline style
          carries no media query, so the count applies at every width here;
          the 0-minimum columns keep it from overflowing. */}
      <div
        className="grid gap-3"
        data-hook="widget-reviews"
        style={{
          ...skin.scroller,
          gridTemplateColumns: `repeat(${skin.columns}, minmax(0, 1fr))`,
        }}
      >
        {(full ? shown : shown.slice(0, 4)).map((r) => (
          <PreviewReview key={r.id} review={r} design={widget.design} skin={skin} />
        ))}
      </div>
      {!full && shown.length > 4 ? (
        <span style={{ ...skin.meta, textAlign: "center" }}>
          and {shown.length - 4} more review{shown.length - 4 === 1 ? "" : "s"}
        </span>
      ) : null}
    </div>
  );
}

/* ============================== select reviews ============================ */

// THE PRODUCT'S SELECT REVIEWS STEP, NOT OURS (Ali, 20 Sep, with a screenshot
// of the real screen: "match the product"). What was here was this screen's
// own invention: a Hand-picked / Live feed pair, four facet menus and a tick
// box on each review card. BrightLocal has one model and it is simpler to
// explain: a filter panel says which reviews are eligible, Auto select decides
// whether new matching reviews join on their own, and every review in the
// resulting table carries a Position and a Blacklist toggle. So the cards are
// a DataTable, like every other list of reviews in this prototype, and the
// mode cards, the facets, the Limit select and the 50-review cap are gone.
//
// THE BANNER IS THE PRODUCT'S OWN WORDS, verbatim, and it earns its place:
// it is the only thing on the screen that explains why Yelp reviews are
// listed and cannot be chosen. Dismissible, because it is a standing rule
// rather than an error, and it goes through the DS AlertInfo's `action` slot
// so the close button is the one the DS ships.
const YELP_NOTICE =
  "Due to Yelp's strict rules on review reuse, reviews from Yelp are not available for use in Showcase Reviews widgets and feeds. In addition to this, any feedback gathered via a 'Get Reviews' campaign that has not been marked for public sharing by a customer will not be available.";

// "in your list widget", "in your carousel widget", "in your feed widget".
// The JSON feed is "feed" here rather than "JSON feed", because the sentence
// already says widget and "your JSON feed widget" is two nouns for one thing.
const TYPE_WORD = { list: "list", carousel: "carousel", json: "feed" };

// The tooltip on Auto select, saying what the toggle does rather than what it
// is. The product's own promise: leave it on and the showcase keeps itself up
// to date.
const AUTO_SELECT_TIP =
  "Leave this on and any new review matching the filters joins this showcase on its own. Turn it off and the showcase stays as it is today.";

// The glyph beside each Star Rating option, as Review Manager's rating menu
// draws them: FeedbackScore from the registry. Stars take a score out of ten
// (the component halves it), Recommended is the thumbs-up, and "No rating"
// has nothing to draw, which is the point of it.
function ratingGlyph(id) {
  if (id === "rec") return <FeedbackScore type="thumbs" score={10} />;
  const option = RATING_OPTIONS.find((o) => o.id === id);
  return option?.score ? <FeedbackScore type="stars" score={option.score} /> : null;
}

// HOW FAR THE POSITION SELECT COUNTS. The real screen offers one option per
// result; with 1,116 reviews in this location's pool that is a select nobody
// can use, so it stops at fifty.
// ASSUMPTION: fifty is ours, not the product's. It is also the top of Widget
// Design's "Number of reviews to show", so every position the select offers
// is one a widget could actually reach.
const POSITION_MAX = 50;
// AND THE NUMBER ALREADY ON THE ROW IS ALWAYS ONE OF THEM. The list counts
// what the CURRENT filters leave, while the number on a row was set under
// whatever filter was in force at the time, so narrowing the filters can
// leave a row carrying a position the list no longer offers. Radix draws
// nothing at all for a value with no matching item and there is no
// placeholder behind it, so the trigger would go blank: the number is then
// unreadable and unrecoverable except by picking a different one. One extra
// option in a case nobody will hit, and the product's one-option-per-result
// rule holds everywhere else.
const positionValues = (count, current) => {
  const n = Math.min(Math.max(count, 1), POSITION_MAX);
  const values = Array.from({ length: n }, (_, i) => i + 1);
  if (current > n) values.push(current);
  return [-1, ...values];
};

// THE TABLE'S DATE, SHORT (Ali, 20 Sep: "Can we change the date to the
// shorter date format (so Sep)?"). formatDateShort is the registry's one
// short form, and it is Ali's own wording for it (proposal-page.jsx: "we
// maybe also need a short version for using in tables, so that would be
// Aug 18, 2026"), so this column now reads "Sep 9, 2026", exactly as Review
// Manager's Date column does. ASSUMPTION: month first, because one product
// should not print two short dates; the brief's "day, short month, year"
// and this differ only in order.
//
// The row's own `date` stays LONG. The widget preview falls back to it when
// a row carries no ISO day, and that is the customer's site, not this table.
const tableDate = (review) => (review.iso ? formatDateShort(review.iso) : review.date);

// FOUR TRIGGERS IN A ROW, NOT ONE PANEL BEHIND A BUTTON (Ali, 20 Sep: "the
// filter should be at the top of a card ... The filters would also be
// individual, so rating, date, sources"). The wide four-column dropdown and
// its Apply Filters button are gone; these are the registry's facet menus,
// the same ones Review Manager and the campaigns table use, and they apply
// as you pick rather than staging a draft.
//
// ONE DIFFERENCE FROM THOSE TWO, AND IT IS DELIBERATE. There an empty list
// means "all", because nothing ticked and everything ticked look the same in
// a menu with no All row. Here the record stores exactly what is ticked, so
// an empty list means nothing matches and the "All ratings" row is a real
// toggle-all, which is what the panel's Toggle All checkbox was.
const facetLabel = (on, total, all, none, one, many) =>
  on.length === total
    ? all
    : on.length === 0
      ? none
      : on.length === 1
        ? one(on[0])
        : `${on.length} ${many}`;

// FEEDBACK SCORE KEEPS A MENU OF ITS OWN. Ali named three filters and the
// panel carried four; dropping the fourth would drop a filter the product
// ships. A facet trigger has no field label above it, so the values have to
// carry the noun themselves, the same way "All sources" does on Review
// Manager. The ids are untouched, because npsMatches reads them.
const NPS_FACET_LABEL = {
  all: "All feedback scores",
  none: "No feedback score",
  positive: "Positive feedback",
};
const NPS_FACET_OPTIONS = NPS_OPTIONS.map((o) => ({ id: o.id, label: NPS_FACET_LABEL[o.id] }));

// The campaigns table's look, minus its two sticky-header lines. Those need
// `overflow-visible` on the DS table's own wrapper, and that wrapper is the
// horizontal scroll region the table falls back on below about 800px wide.
// At 1280 nothing scrolls sideways any more (the rail went, see the settings
// page section), but the region has to stay for the phone, so the sticky
// header lines stay out. The cell insets stay, so the first column lines up
// with the header's px-4 instead of sitting 8px short of it.
// WHY THE TWO STICKY EDGES ARE PULLED OUT BY 24px. The shell's content
// scroller carries 24px of padding on every side (p-section-sm, with the
// showcase's own `contentClassName="pt-6!"` landing on the same 24 at the
// top), and a sticky child is inset by that padding while the scroller still
// CLIPS at its border box. Measured at 1280: a band at top-0 pinned at 169
// against a scroller whose top edge is 145, so table rows scrolled through
// the 24px strip between the page header's rule and the card, in plain sight
// and outside the card's own clip. Same story under the pager. Pulling each
// edge out by the padding pins the band flush to the header's rule and the
// pager flush to the foot of the scroller, which is where Review Manager and
// the campaigns table put theirs.
// ONLY THE TOP EDGES READ THIS CONSTANT NOW. 24px is what the content wrapper
// forces above a card at every width, so a hard number is honest there. The
// padding BELOW the card is the token --ds-section-padding-y-sm, which is 16
// under 1280, so the pager reads that token instead; see the pager itself.
const SHELL_PAD = "-1.5rem";

const SELECT_TABLE_LOOK =
  "rounded-none border-0 " +
  "[&_thead_th:first-child]:pl-4 [&_tbody_td:first-child]:pl-4 " +
  "[&_thead_th:last-child]:pr-4 [&_tbody_td:last-child]:pr-4";

// A YELP ROW'S ONE CELL. It sits where the Position select would be, because
// the absence of a choice belongs where the choice would have been; the
// Blacklist cell next to it is empty, since keeping out a review that can
// never go in is not a thing to ask anyone. The tooltip repeats the banner's
// reason for anyone who dismissed it.
function UnavailableChip({ id }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex" data-hook={`select-unavailable-${id}`}>
          <Badge variant="outline">Unavailable</Badge>
        </span>
      </TooltipTrigger>
      <TooltipContent>{UNAVAILABLE_TIP}</TooltipContent>
    </Tooltip>
  );
}

// A YELP ROW IS KNOCKED BACK CELL BY CELL, NOT ROW BY ROW. DataTable's own
// getRowClassName says it in one line and DOES NOTHING IN STUDIO: the sandbox
// loads @brightlocal/ui-components@2.25.0 from esm.sh (the pin in the
// registry, `version: "2.25.0"`) while the app runs 2.27.0, and 2.25.0's
// DataTable has no such prop, so not one row carried the class there. Worth
// knowing well past this one line: ANY prop the DS shipped after 2.25.0 works
// in the app and is silently dropped in Studio, which is where this screen is
// reviewed. The cells carry it instead, which both versions render.
// Position and Blacklist are left alone: those two cells hold the Unavailable
// chip and nothing at all, and dimming a chip whose whole job is to be read
// would be working against it.
const dimmed = (review) => (isUsable(review) ? undefined : { opacity: 0.5 });

// SELECT REVIEWS IS A PAGE NOW (Ali, 20 Sep: "That drawer seems awfully large
// with the table in it. I think we would have to select reviews on its own
// page, and then do the design stuff on its own page"), AND IT IS FULL BLEED
// (Ali, the same night: "yeah, no rail for select reviews"). Edit reviews on
// a showcase card opens straight onto this, under the showcase's own header
// with Save showcase and Close still on it. No rail, no drawer, no Done
// button and no key/value rows: the filters at the top of the card say what
// is chosen and the table under them says what that leaves, which is what the
// rows were reading back. Losing the rail is also what let the table stop
// scrolling sideways: see the DataTable below for the two measurements.
//
// A PROPER TABLE (Ali, same morning: "I think we would have to set our table
// up properly on the review selection, like we have on other sections, so we
// need pagination"). Same DataTable, now in the card treatment the campaigns
// and Review Manager tables use: a sticky band carrying the title and the
// filters, the table full-bleed under it, and the DS pager pinned to the
// bottom of the card doing the counting.
function SelectReviews({ widget, setWidget, issue = null }) {
  const [notice, setNotice] = useState(true);
  const [sorting, setSorting] = useState([{ id: "date", desc: true }]);
  // ONE MENU STATE FOR THE WHOLE ROW, so only one panel is ever open. Review
  // Manager's shape, spread into each menu.
  const [menu, setMenu] = useState(null);
  const menuState = (id) => ({ open: menu === id, onOpenChange: (o) => setMenu(o ? id : null) });

  const ratings = normaliseRatings(widget.ratings);
  const sources = sourcesOf(widget);
  const dateOption = dateOptionOf(widget);
  const nps = npsOf(widget);
  const patch = (p) => setWidget((w) => ({ ...w, ...p }));
  const toggleIn = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  // Everything the filters leave, Yelp included: a Yelp review is listed and
  // marked unavailable rather than quietly dropped, which is what the banner
  // is there to explain.
  //
  // THE FILTER FIELDS ARE THE DEPENDENCIES, not the whole showcase. Setting a
  // Position rewrites the record, and a memo keyed on the record would rebuild
  // this list, which would send the page reset below back to page one every
  // time somebody ordered a review on page three. Every menu hands over a new
  // array or a new id, so identity is exactly the right test here.
  const rows = useMemo(
    () => filteredReviews(widget),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [widget.ratings, widget.nps, widget.period, widget.dateStart, widget.dateEnd, widget.sources],
  );
  const usableCount = useMemo(() => rows.filter(isUsable).length, [rows]);
  const positions = positionsOf(widget);
  const blacklist = blacklistOf(widget);

  const setPosition = (id, value) =>
    setWidget((w) => {
      const next = { ...positionsOf(w) };
      // -1 is the product's "no position", and here that is the absence of a
      // key rather than a stored -1, so a record only carries the positions
      // somebody actually set.
      if (value > 0) next[id] = value;
      else delete next[id];
      return { ...w, positions: next };
    });
  const setBlacklisted = (id, on) =>
    setWidget((w) => ({
      ...w,
      blacklist: on ? [...blacklistOf(w), id] : blacklistOf(w).filter((x) => x !== id),
    }));

  // A recommendation sorts among the stars, Recommended as 5 and Not
  // recommended as 1, the same rank Review Manager uses, so Rating puts
  // praise at one end either way.
  const ratingRank = (r) => (typeof r.rating === "number" ? r.rating : r.recommended ? 5 : 1);
  // An unpositioned review sorts after every positioned one. A large number
  // rather than Infinity: two of those subtract to NaN and the sort collapses.
  const positionRank = (r) => (positions[r.id] > 0 ? positions[r.id] : 9999);

  const columns = useMemo(
    () => [
      {
        id: "date",
        accessorFn: (r) => r.date,
        enableGlobalFilter: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date" dataHook="col-date" />,
        // daysAgo counts back from the pool's today, so a smaller number is newer.
        sortingFn: (a, b) => b.original.daysAgo - a.original.daysAgo,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm whitespace-nowrap" style={dimmed(row.original)}>
            {tableDate(row.original)}
          </span>
        ),
      },
      {
        accessorKey: "source",
        enableGlobalFilter: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Source" dataHook="col-source" />,
        sortingFn: (a, b) => SOURCES[a.original.source].label.localeCompare(SOURCES[b.original.source].label),
        cell: ({ row }) => (
          <span className="flex items-center gap-2" style={dimmed(row.original)}>
            <SourceMark source={row.original.source} />
            <span className="text-sm whitespace-nowrap">{SOURCES[row.original.source].label}</span>
          </span>
        ),
      },
      {
        accessorKey: "rating",
        enableGlobalFilter: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Rating" dataHook="col-rating" />,
        sortingFn: (a, b) => ratingRank(a.original) - ratingRank(b.original),
        cell: ({ row }) =>
          typeof row.original.rating === "number" ? (
            <span className="flex items-center gap-2" style={dimmed(row.original)}>
              <Rating value={row.original.rating} dataHook={`select-rating-${row.original.id}`} />
              <span className="text-sm tabular-nums">{row.original.rating}</span>
            </span>
          ) : (
            // Facebook carries a recommendation rather than a score, so the
            // number a star row shows is the word instead.
            <span className="flex items-center gap-1.5 text-sm whitespace-nowrap" style={dimmed(row.original)}>
              {row.original.recommended ? (
                <ThumbsUp className="text-primary size-4" />
              ) : (
                <ThumbsDown className="text-muted-foreground size-4" />
              )}
              {row.original.recommended ? "Recommended" : "Not recommended"}
            </span>
          ),
      },
      {
        id: "text",
        // name + text, so the reviewer stays searchable if a search is ever
        // added here: the name is only drawn inside this cell.
        accessorFn: (r) => `${r.name} ${r.text}`,
        header: () => "Review",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-1 py-1" style={dimmed(row.original)}>
            <span className="line-clamp-2 text-sm">{row.original.text}</span>
            <span className="text-muted-foreground text-xs">Reviewer: {row.original.name}</span>
          </div>
        ),
      },
      {
        id: "position",
        // AN ACCESSOR, ALTHOUGH THE CELL NEVER READS IT. TanStack only lets a
        // column sort when it has one (getCanSort ANDs on `!!accessorFn`), so
        // a display column with a sortingFn would have drawn a plain header
        // and swallowed the click. Same reason on Blacklist below.
        accessorFn: (r) => positionRank(r),
        enableGlobalFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Position" dataHook="col-position" />
        ),
        sortingFn: (a, b) => positionRank(a.original) - positionRank(b.original),
        cell: ({ row }) =>
          isUsable(row.original) ? (
            <Select
              value={String(positions[row.original.id] ?? -1)}
              onValueChange={(v) => setPosition(row.original.id, Number(v))}
            >
              <SelectTrigger
                dataHook={`select-position-${row.original.id}`}
                aria-label={`Position of the review from ${row.original.name}`}
                style={{ width: "5.5rem" }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {positionValues(usableCount, positions[row.original.id] ?? -1).map((v) => (
                  <SelectItem key={v} value={String(v)}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <UnavailableChip id={row.original.id} />
          ),
      },
      {
        id: "blacklist",
        accessorFn: (r) => (blacklist.includes(r.id) ? 1 : 0),
        enableGlobalFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Blacklist" dataHook="col-blacklist" />
        ),
        sortingFn: (a, b) =>
          (blacklist.includes(a.original.id) ? 1 : 0) - (blacklist.includes(b.original.id) ? 1 : 0),
        cell: ({ row }) =>
          isUsable(row.original) ? (
            <Switch
              dataHook={`select-blacklist-${row.original.id}`}
              aria-label={`Keep the review from ${row.original.name} out of this showcase`}
              checked={blacklist.includes(row.original.id)}
              onCheckedChange={(v) => setBlacklisted(row.original.id, !!v)}
            />
          ) : null,
      },
    ],
    [positions, blacklist, usableCount],
  );

  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    sorting,
    onSortingChange: setSorting,
    enablePagination: true,
    // TWENTY, the same page as Review Manager's table, so a page of reviews
    // is the same length wherever you read one.
    pageSize: 20,
  });

  // A NEW FILTER STARTS AT PAGE ONE. Applying one that leaves three reviews
  // while you are on page four otherwise shows an empty table under a pager
  // reading "61 to 3 of 3".
  useEffect(() => {
    table.setPageIndex(0);
  }, [rows, table]);

  const allRatings = ratings.length === ALL_RATINGS.length;
  const allSources = sources.length === SOURCE_IDS.length;
  const ratingsLabel = facetLabel(
    ratings,
    ALL_RATINGS.length,
    "All ratings",
    "No ratings",
    (id) => RATING_OPTIONS.find((o) => o.id === id)?.label ?? id,
    "ratings",
  );
  const sourcesLabel = facetLabel(
    sources,
    SOURCE_IDS.length,
    "All sources",
    "No sources",
    (id) => SOURCES[id]?.label ?? id,
    "sources",
  );

  return (
    <TooltipProvider>
      <div className="flex min-w-0 flex-col gap-4">
        {notice ? (
          <AlertInfo
            dataHook="reviews-yelp-notice"
            description={YELP_NOTICE}
            action={
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                dataHook="reviews-yelp-notice-dismiss"
                aria-label="Dismiss"
                onClick={() => setNotice(false)}
              >
                <X className="size-4" />
              </Button>
            }
          />
        ) : null}

        {/* THE SAVE-BLOCKING ALERT MOVED WITH THE STEP. Save still sends you
            to Select reviews when the filters match nothing, from the design
            page as readily as from this one, and this is what it lands on,
            sitting above the filters it names. */}
        {issue ? (
          <AlertWarning
            dataHook="reviews-issue"
            title={ISSUE_COPY[issue].title}
            description={ISSUE_COPY[issue].body(widget)}
          />
        ) : null}

        {/* THE WIDGET ITSELF, OVER THE ROWS THAT CHOOSE WHAT GOES IN IT. The
            step lost its preview when the sheet became a page, and choosing
            reviews with nothing to choose FOR is the one thing this card was
            doing: it shows the resolved set, so a filter, a Position or a
            Blacklist switch is answered in the widget a beat later.
            NOT STICKY, and neither is the design page's preview any more.
            The work here is a long table that already spends the top of the
            fold on its own sticky band and the bottom on its pager, and a
            third pinned block would leave a strip of rows between them. This
            one scrolls away once you are reading the table.
            CAPPED AND SCROLLING, because the widget is not bounded: a list of
            ten reviews is taller than the page. The cap is what keeps the
            table's header and its first rows above the fold at 1280x900,
            which is the whole reason the preview sits here and not in the
            middle of the step. */}
        <Card
          dataHook="reviews-preview-card"
          className="max-w-none gap-0 p-0"
          density="condensed"
        >
          <div className="px-4 py-3" style={{ maxHeight: "16rem", overflowY: "auto" }}>
            {/* THE REGISTRY'S PreviewFrame, the same wrapper the card, the
                Design preview and the preview sheet all put round a showcase,
                so one widget is not drawn four subtly different ways. A list,
                a carousel and a JSON feed each render whatever WidgetPreview
                renders for them, which is how the feed URL turns up here too
                rather than a widget the JSON step does not have. */}
            <PreviewFrame surface="none" dataHook="preview-frame-reviews">
              <WidgetPreview widget={widget} reviews={resolveReviews(widget)} />
            </PreviewFrame>
          </div>
        </Card>

        <Card
          dataHook="select-reviews-card"
          className="max-w-none gap-0 overflow-clip p-0"
          density="condensed"
        >
          {/* THE BAND STICKS, NOT THE CARDHEADER INSIDE IT (the campaigns
              table learned this the hard way: a sticky element cannot travel
              outside its parent's box, so a wrapper exactly one CardHeader
              tall has nowhere to go). The filters stick because Ali asked for
              it on 7 Sep ("the filters should stick"). Nothing is subtracted
              for a page header the way Review Manager and the campaigns table
              have to: WizardShell pins its header OUTSIDE the scroller, so
              the top of the scroller is already under it. See SHELL_PAD for
              why the offset is negative rather than zero. */}
          <div className="bg-card sticky z-30 rounded-t-[inherit] border-b" style={{ top: SHELL_PAD }}>
            <CardHeader dataHook="picker-heading" className="px-4 pt-4 pb-3">
              {/* NO COUNT BY THE TITLE (Ali, 17 Sep: "we have pagination").
                  The pager at the foot of the card counts the filtered rows,
                  which is what the old "Showing 1-20 of 836 results" line in
                  the toolbar was doing. */}
              <CardTitle size="small" dataHook="select-reviews-title">
                Select reviews
              </CardTitle>
              <CardDescription>
                Select the reviews you would like to showcase in your {TYPE_WORD[widget.format]}{" "}
                widget.
              </CardDescription>
            </CardHeader>

            {/* RATING, DATE, SOURCES, in Ali's own order, with Feedback Score
                after them, then Auto select pushed to the far end.
                gap-1.5 and the default left align: the row starts at the
                card's left edge, so every panel hangs from the trigger it
                belongs to.
                AUTO SELECT IS IN THIS ROW, NOT THE HEADER'S ACTION SLOT.
                CardHeader's action column is max-content, and at 390 the
                switch, its label and the info dot took 200 of the card's 294,
                leaving the title two lines and the description one word a
                line. It sat in the old sheet's toolbar beside Filter anyway,
                so this is where it was. The spacer keeps it off the filters:
                it is a standing setting, not a filter. */}
            <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3" data-hook="picker-bar">
              <FacetedFilterMenu
                label={ratingsLabel}
                {...menuState("ratings")}
                options={RATING_OPTIONS.map((o) => ({
                  id: o.id,
                  label: o.label,
                  leading: ratingGlyph(o.id),
                }))}
                isAllSelected={allRatings}
                isChecked={(id) => ratings.includes(id)}
                onAll={() => patch({ ratings: allRatings ? [] : ALL_RATINGS })}
                onOption={(id) => patch({ ratings: toggleIn(ratings, id) })}
                allLabel="All ratings"
                panelWidth="w-56"
                dataHook="filter-ratings"
              />
              <SingleSelectMenu
                label={dateOption.label}
                {...menuState("date")}
                options={DATE_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
                value={dateOption.id}
                onSelect={(id) => {
                  patch({ period: id });
                  setMenu(null);
                }}
                panelWidth="w-52"
                dataHook="filter-date"
              />
              {/* THE RANGE SITS BESIDE ITS OWN MENU, not inside it: a facet
                  panel is a list of options and two date fields are not
                  options. Native date inputs, the same two the old panel
                  carried and for the same reason (the DS ships a Calendar but
                  no field that pairs with it, and two hand-built popover
                  calendars is a lot of machinery for a filter nobody has
                  asked to demonstrate). */}
              {dateOption.id === "custom" ? (
                <div className="flex items-center gap-1.5" data-hook="filter-date-range">
                  <Input
                    id="filter-date-start"
                    dataHook="filter-date-start"
                    type="date"
                    aria-label="Start of the date range"
                    style={{ width: "9.5rem" }}
                    value={widget.dateStart ?? ""}
                    onChange={(e) => patch({ dateStart: e.target.value })}
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <Input
                    id="filter-date-end"
                    dataHook="filter-date-end"
                    type="date"
                    aria-label="End of the date range"
                    style={{ width: "9.5rem" }}
                    value={widget.dateEnd ?? ""}
                    onChange={(e) => patch({ dateEnd: e.target.value })}
                  />
                </div>
              ) : null}
              {/* OUR SOURCES, NOT THE PRODUCT'S EIGHTY. The real panel lists
                  every site BrightLocal tracks; this prototype has data for
                  the Tracker's seven, so those are what is offered, each with
                  its mark beside the name (Ali, 7 Sep: "on sources, can we
                  include the logo?"). No search box: Review Manager gates one
                  at eight options and there are seven. */}
              <FacetedFilterMenu
                label={sourcesLabel}
                {...menuState("sources")}
                options={SOURCE_LIST.map((s) => ({
                  id: s.id,
                  label: s.label,
                  leading: <SourceMark source={s.id} />,
                }))}
                isAllSelected={allSources}
                isChecked={(id) => sources.includes(id)}
                onAll={() => patch({ sources: allSources ? [] : SOURCE_IDS })}
                onOption={(id) => patch({ sources: toggleIn(sources, id) })}
                allLabel="All sources"
                panelWidth="w-56"
                dataHook="filter-sources"
              />
              <SingleSelectMenu
                label={NPS_FACET_LABEL[nps]}
                {...menuState("nps")}
                options={NPS_FACET_OPTIONS}
                value={nps}
                onSelect={(id) => {
                  patch({ nps: id });
                  setMenu(null);
                }}
                panelWidth="w-56"
                dataHook="filter-nps"
              />
              <span className="grow" />
              <div className="flex items-center gap-2" data-hook="picker-auto-select">
                <Switch
                  id="picker-auto-select-switch"
                  dataHook="picker-auto-select-switch"
                  checked={widget.autoSelect !== false}
                  onCheckedChange={(v) => setWidget((w) => ({ ...w, autoSelect: !!v }))}
                />
                <FieldLabel htmlFor="picker-auto-select-switch" dataHook="picker-auto-select-label">
                  Auto select reviews
                </FieldLabel>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="What auto select does"
                      data-hook="picker-auto-select-info"
                      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex cursor-pointer items-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <Info className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{AUTO_SELECT_TIP}</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* NO HORIZONTAL SCROLL AT 1280, WHICH IS WHY THE RAIL WENT (Ali,
              20 Sep: "I dont want scrolling tables"). Measured before: the
              settings column is 896px, the rail took 256 of it and the card
              was left with 568 against six columns that need 736, so Position
              and Blacklist sat behind a scroll region and the column labels
              scrolled away with the rows. Measured after, with the page full
              bleed: the card is 848 and the table lays out at 848, 112 more
              than it asks for.
              minWidth STAYS at 46rem, and it is not the desktop's problem: it
              is the floor that keeps the review text from compressing to a
              word a line on a phone, where the DS wrapper becomes a labelled
              scroll region as it should. Below about 800px wide the table
              scrolls inside its own region and the page does not. */}
          <div data-hook="picker-list">
            <DataTable
              table={table}
              dataHook="select-reviews-table"
              className={SELECT_TABLE_LOOK}
              minWidth="46rem"
              scrollRegionLabel="Reviews to choose from"
              noResultsMessage={
                npsOf(widget) === "positive"
                  ? "No reviews match these filters. A feedback score comes from a Get Reviews campaign, and this location has none."
                  : "No reviews match these filters."
              }
            />
          </div>

          {/* ALWAYS SHOWN, even at one page (Ali, 6 Sep, on the campaigns
              pager: "just leave it there! as filtering might add or remove
              it"). Same wording as every other pager in the product: the DS
              default is "1-20 of 836", and two tables in one product should
              not count rows differently. */}
          {/* THE BOTTOM PULL IS THE TOKEN, NOT SHELL_PAD. Both edges are
              pulled out by the scroller's own padding, but only the top one
              is a constant: the content wrapper forces 24px above the card at
              every width, while the scroller's padding below it is
              --ds-section-padding-y-sm, 16px under 1280 and 24 from there up.
              A hard -1.5rem therefore hung the pager 8px past the clip on
              tablet and phone, trimming its own bottom padding and the card's
              bottom edge. Reading the token instead makes the pull whatever
              the padding actually is, at any width. */}
          <div
            className="bg-card sticky z-10 border-t px-4 py-2"
            style={{ bottom: "calc(-1 * var(--ds-section-padding-y-sm))" }}
          >
            <DataTablePagination
              table={table}
              dataHook="select-reviews-pagination"
              className="w-auto"
              ariaLabel="Review pagination"
              renderRowCount={({ startRow, endRow, totalRows }) =>
                `${startRow} to ${endRow} of ${totalRows}`
              }
            />
          </div>
        </Card>
      </div>
    </TooltipProvider>
  );
}

/* ================================ dashboard =============================== */

// ONE CARD PER SHOWCASE, FIXED (Ali, 7 Sep). Title is the type, caption the
// live product's line, then the same key / value rows the settings page
// shows, then the footer: Preview, Edit reviews and Edit design visible, and
// an overflow menu holding Embed code. Nothing to name, nothing to delete, so
// the menu carries the one item. Ali's standing rule is at most two CTAs
// visible with the rest in the overflow, and this is three: see the footer
// for why, and for the one that could move.
//
// NO CODE ON THE CARD (Ali, 7 Sep, reversing the same morning: "I don't need
// to display the code on the actual cards on the Showcase homepage, opening
// in a drawer/sheet is fine, as we might want the instructions we had
// already"). Embed code opens the Embed sheet, which keeps the code box,
// Copy and the numbered steps.
function WidgetCard({ widget, onView, onEditReviews, onEditDesign, onEmbed }) {
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
          {widgetRows(widget).map((row) => (
            <div key={row.k} className="flex items-baseline justify-between gap-3 py-1.5">
              <dt className="text-muted-foreground shrink-0">{row.k}</dt>
              <dd className="text-right">{row.v}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
{/* THE CARD IS THE WAY IN TO BOTH EDITORS (Ali, 20 Sep). The editor's
          three-item rail is gone, so one Edit button would have reached Select
          reviews and left Widget design with no door at all. Two named buttons
          say which page they open, which the single "Edit" never did.
          Preview stays the outline button, the two Edits are ghosts, and the
          overflow (DS DropdownMenu, the MoreHorizontal trigger the cards had
          before) still holds Embed code, or Feed URL for the JSON feed.
          NOTE, three visible controls against Ali's usual two: Preview, Edit
          reviews and Edit design. Preview could go in the overflow, since the
          card's title already opens it, and that is his call rather than one
          to take here. Flagged in the report.
          NO EDIT DESIGN ON A JSON FEED: a feed carries no design, and the
          rail item for it was already filtered out for the same reason. */}
      <CardFooter className="mt-auto flex-wrap justify-start gap-1.5">
        <Button variant="outline" size="sm" dataHook={`widget-${widget.id}-view`} onClick={onView}>
          Preview
        </Button>
        <Button variant="ghost" size="sm" dataHook={`widget-${widget.id}-edit`} onClick={onEditReviews}>
          Edit reviews
        </Button>
        {widget.format === "json" ? null : (
          <Button
            variant="ghost"
            size="sm"
            dataHook={`widget-${widget.id}-edit-design`}
            onClick={onEditDesign}
          >
            Edit design
          </Button>
        )}
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
// items-start, so a three-row List card is its own height instead of being
// stretched to the seven-row Carousel and leaving ~180px of white (Showcase
// audit, 10 Sep).
function WidgetsDashboard({ widgets, onView, onEditReviews, onEditDesign, onEmbed }) {
  return (
    <div className="grid items-start gap-4 md:grid-cols-2">
      {FORMAT_ORDER.map((id) => widgets.find((w) => w.id === id))
        .filter(Boolean)
        .map((w) => (
          <WidgetCard
            key={w.id}
            widget={w}
            onView={() => onView(w)}
            onEditReviews={() => onEditReviews(w)}
            onEditDesign={() => onEditDesign(w)}
            onEmbed={() => onEmbed(w)}
          />
        ))}
    </div>
  );
}

/* ============================== settings page ============================= */

// TWO PAGES, AND NO RAIL ON EITHER (Ali, 20 Sep, in order: "I think we would
// have to select reviews on its own page, and then do the design stuff on its
// own page", then "yeah, no rail for select reviews", then, on the design
// page, "So, we are leaning into preview, and you can edit each part, just
// like we had preview and edit in Review Builder").
//
// The three-item rail (Reviews / Widget Design / Embed) is gone.
//
//   Select reviews is full bleed, because the table it exists for could not
//   fit beside a 256px rail: measured at 1280 the table needs 736 and the
//   card was 566, so Position and Blacklist sat behind a horizontal scroll
//   (Ali, the same night: "I dont want scrolling tables"). Without the rail
//   the card is 848 and the table fits whole.
//
//   Widget design is preview-led, in the shape the Review Builder's template
//   editor already uses: the widget itself at the top, then one block per
//   part, each with a heading, a line saying what that part is set to, and an
//   Edit that opens a sheet holding just that part's fields. The headings are
//   the point (Ali, the same night: "I'd actually edit each section, and I'd
//   make each section header more prominent, I can hardly see that there are
//   sections"). They are card titles now, not accordion triggers inside one
//   long card. A sheet holding one group is small: what Ali objected to was a
//   drawer with a whole review table in it, not sheets.
//
//   Embed left the editor altogether. Every showcase card on the list page
//   already carries Embed code, or Feed URL for the JSON feed, in its
//   overflow, so the section had nothing the card did not have. The card that
//   read a section back, and the Design rows it read, went with it.
//
// Getting between the two pages is the CARD, not the editor: each card
// carries Edit reviews and Edit design, and Close in the header goes back to
// them. The header says which of the two you are on, so neither page is a
// room with no name.

// THE DESIGN PARTS ARE THE FORM'S OWN GROUPS, in the form's order: the preset
// tiles, then the four groups the panel already had, then Animation for a
// carousel. No group is invented here and none is renamed. Each is a block on
// the page with its own Edit, and `label` is both the block's heading and its
// sheet's title, so the thing you press and the thing that opens carry one
// name.
const DESIGN_GROUPS = [
  { id: "preset", label: "Preset" },
  { id: "layout", label: "Layout" },
  { id: "container", label: "Container" },
  { id: "text", label: "Text" },
  { id: "reviews", label: "Reviews" },
  { id: "animation", label: "Animation" },
];
// A carousel has an Animation block and nothing else does, the same rule the
// old Animation accordion item carried. Format-driven, so no block appears or
// disappears while you work.
const designGroupsFor = (widget) =>
  DESIGN_GROUPS.filter((g) => g.id !== "animation" || widget.format === "carousel");

// THE LINE UNDER EACH HEADING SAYS WHAT THAT PART IS SET TO RIGHT NOW, which
// is what makes a block worth reading before you open it. One line, the
// settings that change the look most, in the order the sheet edits them. It
// is deliberately not every field: the old cards listed all eight Container
// values as key and value rows, and Ali's complaint about that screen was
// that he could not see where one section ended and the next began.
function designGroupSummary(id, widget) {
  const d = widget.design;
  if (id === "preset") {
    const preset = presetOf(d);
    return preset === "custom" ? "Custom" : DESIGN_PRESETS[preset].label;
  }
  if (id === "layout") {
    const cols = COLUMN_OPTIONS.find((o) => o.id === d.columns)?.label ?? "One column";
    return `${cols}, ${d.count} review${d.count === 1 ? "" : "s"}, max height ${d.maxHeight}px`;
  }
  if (id === "container") {
    const title = headerTitle(d);
    return `${d.bg}, ${d.radius}px corners, ${
      d.borderOn ? `${d.borderWidth}px border` : "no border"
    }${title ? `, titled ${title}` : ""}`;
  }
  if (id === "text") {
    const align = ALIGN_OPTIONS.find((o) => o.id === d.align)?.label ?? "Left";
    return `${d.font}, ${d.size}px, ${align.toLowerCase()} aligned, ${d.color}`;
  }
  if (id === "reviews") {
    const shown = [
      d.showName !== false ? "name" : null,
      d.showSource !== false ? "site icon" : null,
      d.dateFormat !== "hidden" ? "date" : null,
    ].filter(Boolean);
    return `${d.chars} characters, ${shown.length ? `showing ${shown.join(", ")}` : "nothing extra shown"}`;
  }
  if (id === "animation") {
    const c = carouselOf(d);
    const t = TRANSITION_OPTIONS.find((o) => o.id === c.transition)?.label ?? "Fade";
    return `${c.autoRotate ? "Auto rotating" : "Manual"}, ${t.toLowerCase()} over ${c.speed} second${
      c.speed === 1 ? "" : "s"
    }`;
  }
  return null;
}

// A PHONE GETS THE BOTTOM SHEET, everything else the right-hand one. Review
// Manager's rule, and the Review Builder's template editor copies it too; a
// side panel on a 390px screen leaves nothing to read the preview in.
function useNarrowSheet() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return narrow;
}

// THE EMBED CODE, ONE COMPONENT (Ali, 7 Sep: "needs work"). Used by the list
// view's Embed sheet and by the JSON feed's own preview, so there is one
// layout, not two. The editor's Embed section used it too until 20 Sep, when
// embed came off the rail; the component is untouched by that. What it holds,
// and only this: a Copy button in its own row above
// the code (never over it: the old absolute button sat on the text), the code
// in a box that wraps or scrolls on its own, and three short steps. No card
// round it, no Format or Showing rows; the card the reader came from already
// says those. `disabled` is the unsaved state: the shape of the code is
// visible, nothing can be copied.
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
            <li>Publish the page. Each showcase is one line. Add one per showcase you want on the page.</li>
          </>
        )}
      </ol>
      ) : null}
    </div>
  );
}

// WHAT STOPS A SAVE, and what the card says about it (Ali, 7 Sep: "Error
// message is a bit LAME"). One kind at a time, checked in this order. It
// renders as the DS warning Alert at the top of the Select reviews page,
// above the filters it names, where Save has already sent you; not as a bare
// line under the page. See App for when it clears.
// ONE CHECK LEFT. The two hand-picked ones (nothing chosen, more than fifty
// chosen) went with hand-picking itself; a showcase whose filters match
// nothing is the only state left that cannot be saved into something useful.
function issueFor(widget, reviews) {
  if (reviews.length === 0) return "match";
  return null;
}
const ISSUE_COPY = {
  match: {
    title: "No reviews match",
    // IT NAMES THE FILTERS ABOVE IT NOW. It used to say "Open Select
    // Reviews", which was the way in when this was a card with an Edit
    // button; Save lands you on the filters themselves.
    body: () =>
      "Widen the ratings, sources or dates above so at least one review matches.",
  },
};

/* ---------------------------- widget design ------------------------------- */

// The controls that were the wizard's Design step, then the Design sheet's
// body, and are now the Widget Design page. Module scope, not inner
// declarations: a component declared inside another remounts on every render
// and drops input focus.
// One write path for the carousel settings, merging over the defaults.
function patchCarousel(setWidget, patch) {
  setWidget((w) => ({ ...w, design: { ...w.design, carousel: { ...carouselOf(w.design), ...patch } } }));
}

// NO SWITCH ROW ANY MORE. The animation group was the last switch on the
// screen and the real product asks those five as Yes / No pairs, so SwitchRow
// (and the DS Switch with it) went out with the Loop and Autoplay controls.
// The alignment fix it carried lives on in CheckRow below, which hit the same
// thing: the DS horizontal Field is a grid with align-items start, so both
// cells need self-center or a 14px label sits above a 20px control.

/* ---------------------------- design field kit ---------------------------- */

// FOUR SMALL FIELDS CARRY EVERY REPEAT in the Widget Design panel: a number
// with a unit, a slider with its readout, a checkbox row, and a colour. There
// are seven colours and nine numbers on that panel, so writing each one out
// would be the "repeated JSX" this file keeps out of its way, and it is what
// guarantees the Border colour behaves exactly like the Shadow colour.

// A NUMBER THAT CAN BE CLEARED WHILE YOU TYPE. The value on the record is
// always a number, but the field keeps the text you actually typed, so
// clearing it to retype does not slam a 0 onto the widget and fight you. The
// text resyncs only when the value moved somewhere else (a preset), which is
// why the guard compares the PARSED text rather than the string: typing "007"
// leaves "007" alone while the record holds 7.
//
// THE FLOOR IS CLAMPED ON WRITE, THE CEILING ON BLUR. Waiting for blur on both
// was the wrong half: select all in "Widget max height" and retype it and the
// record passed through 1, then 12, then 120, so the preview directly above
// collapsed to a one-pixel sliver and sprang back under the cursor. Holding the
// floor on write stops that; the typed text is left exactly as typed, so the
// field still reads what you are in the middle of writing. The ceiling can
// wait, because an in-flight 4000 in a field that maxes at 64 only makes the
// preview look extreme for a keystroke, not broken.
function NumberField({ id, label, value, min, max, suffix = "px", onChange }) {
  const [text, setText] = useState(String(value));
  useEffect(() => {
    setText((t) => (Number(t) === value ? t : String(value)));
  }, [value]);
  return (
    <Field dataHook={`${id}-field`}>
      <FieldLabel htmlFor={id} dataHook={`${id}-label`}>
        {label}
      </FieldLabel>
      <InputGroup dataHook={`${id}-group`}>
        <InputGroupInput
          id={id}
          dataHook={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (e.target.value.trim() === "") return;
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange(Math.max(min, n));
          }}
          onBlur={() => {
            const n = Number(text);
            const next = Math.min(max, Math.max(min, Number.isFinite(n) ? n : value));
            setText(String(next));
            if (next !== value) onChange(next);
          }}
        />
        <InputGroupAddon align="inline-end" className="text-muted-foreground pr-3">
          {suffix}
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}

// A SLIDER WITH ITS NUMBER BESIDE IT, as the real screen shows it. The slider
// is the control; the figure is a readout, not a second input, so there is
// only ever one way to set the value.
//
// THE ONE FIELD WHOSE LABEL CANNOT USE htmlFor ALONE. Checked in the DS dist:
// Slider spreads `id` onto the Radix Root, which renders a <span>, and a span
// is not a labelable element, so the label/control pair never forms and the
// visible text is doing nothing. Every other field in this kit resolves to a
// real input, so the sliders were the odd two out. FieldLabel requires
// htmlFor, so it stays, and the working link is the label's own id read back
// by aria-labelledby. The thumb keeps its aria-label through thumbLabels, so
// the accessible name was always right; this is about the visible text being
// tied to the control it names.
function SliderField({ id, label, value, min, max, suffix = "", onChange }) {
  return (
    <Field dataHook={`${id}-field`}>
      <FieldLabel id={`${id}-label`} htmlFor={id} dataHook={`${id}-label`}>
        {label}
      </FieldLabel>
      <div className="flex items-center gap-3">
        <Slider
          id={id}
          dataHook={id}
          aria-labelledby={`${id}-label`}
          className="grow"
          min={min}
          max={max}
          step={1}
          value={[value]}
          onValueChange={(v) => onChange(v[0])}
          thumbLabels={[label]}
        />
        <span
          className="text-muted-foreground w-12 shrink-0 text-right text-sm tabular-nums"
          data-hook={`${id}-value`}
        >
          {value}
          {suffix}
        </span>
      </div>
    </Field>
  );
}

// ONE CHECKBOX ROW, with the alignment fix SwitchRow used to carry for the
// same measured reason (the horizontal Field is a grid with align-items
// start, so both cells need self-center). Checkboxes rather than switches because on the
// real screen these REVEAL a group of fields rather than turning a thing on.
function CheckRow({ id, label, checked, onChange }) {
  return (
    <Field orientation="horizontal" dataHook={`${id}-field`}>
      <Checkbox
        id={id}
        dataHook={id}
        className="mt-0 self-center"
        checked={checked}
        onCheckedChange={(v) => onChange(!!v)}
      />
      <FieldContent className="self-center">
        <FieldLabel htmlFor={id} dataHook={`${id}-label`}>
          {label}
        </FieldLabel>
      </FieldContent>
    </Field>
  );
}

// ONE COLOUR FIELD, USED BY ALL SEVEN COLOURS. The DS has no colour picker, so
// this is the DS Input carrying the hex, plus a square swatch button in the
// group's end addon that opens a DS Popover holding the browser's own
// <input type="color">. Typing and picking write the same value; the preview
// ignores a half-typed hex until it is one (see `hex`), so the widget never
// blanks mid-keystroke.
function ColorField({ id, label, value, onChange }) {
  return (
    <Field dataHook={`${id}-field`}>
      <FieldLabel htmlFor={id} dataHook={`${id}-label`}>
        {label}
      </FieldLabel>
      <InputGroup dataHook={`${id}-group`}>
        <InputGroupInput
          id={id}
          dataHook={id}
          value={value}
          spellCheck={false}
          placeholder="#FFFFFF"
          onChange={(e) => onChange(e.target.value)}
        />
        <InputGroupAddon align="inline-end" className="pr-2">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                data-hook={`${id}-swatch`}
                aria-label={`${label}: pick a colour`}
                className="border-input size-5 shrink-0 rounded-sm border"
                style={{ background: hex(value, "#FFFFFF") }}
              />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-2" dataHook={`${id}-picker-popover`}>
              <input
                type="color"
                data-hook={`${id}-picker`}
                aria-label={`${label} colour`}
                className="h-28 w-32 cursor-pointer border-0 bg-transparent p-0"
                value={hex6(value, "#FFFFFF")}
                onChange={(e) => onChange(e.target.value.toUpperCase())}
              />
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}

// A LABELLED RADIO GROUP, for the two settings the real screen puts on radios
// rather than a select: the date format and the character count.
function RadioField({ id, label, value, options, onChange }) {
  return (
    <Field dataHook={`${id}-field`}>
      <FieldLabel htmlFor={`${id}-${options[0].id}`} dataHook={`${id}-label`}>
        {label}
      </FieldLabel>
      <RadioGroup
        dataHook={`${id}-radio-group`}
        value={String(value)}
        onValueChange={onChange}
        aria-label={label}
      >
        <div className="flex flex-col gap-2">
          {options.map((o) => (
            <Field key={o.id} orientation="horizontal">
              <RadioGroupItem id={`${id}-${o.id}`} value={String(o.id)} />
              <FieldLabel htmlFor={`${id}-${o.id}`} dataHook={`${id}-${o.id}-label`}>
                {o.label}
              </FieldLabel>
            </Field>
          ))}
        </div>
      </RadioGroup>
    </Field>
  );
}

// YES AND NO, NOT A SWITCH (Ali, 20 Sep: the product "uses Yes/No radio
// pairs here, not switches"). A switch states one thing and lets you turn it
// off; the real screen asks a question and puts both answers on the page, so
// these go through the same RadioField as the date format and the character
// count above and stack the way those do. The record still holds a boolean,
// so nothing downstream has to know which control set it.
const YES_NO_OPTIONS = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
];
function YesNoField({ id, label, value, onChange }) {
  return (
    <RadioField
      id={id}
      label={label}
      value={value ? "yes" : "no"}
      options={YES_NO_OPTIONS}
      onChange={(v) => onChange(v === "yes")}
    />
  );
}

// THE FOUR SHADOW NUMBERS AND ITS COLOUR, once, for the container's shadow and
// the review card's alike. `prefix` picks which set of keys it writes:
// "shadow" or "reviewShadow". Two-up rather than four-up because "Spread" in
// a quarter of a 24rem drawer is a truncated word with a number under it.
function ShadowFields({ hook, prefix, design, set }) {
  return (
    <div className="flex flex-col gap-3 pl-6" data-hook={`${hook}-fields`}>
      <div className="grid grid-cols-2 gap-3">
        {SHADOW_PARTS.map((p) => (
          <NumberField
            key={p.id}
            id={`${hook}-${p.id}`}
            label={p.label}
            value={design[`${prefix}${p.key}`]}
            min={-64}
            max={64}
            onChange={(n) => set({ [`${prefix}${p.key}`]: n })}
          />
        ))}
      </div>
      <ColorField
        id={`${hook}-color`}
        label="Color"
        value={design[`${prefix}Color`]}
        onChange={(v) => set({ [`${prefix}Color`]: v })}
      />
    </div>
  );
}

// A PRESET TILE'S THUMBNAIL: BrightLocal's own artwork for that preset, not a
// drawing of it (Ali, 20 Sep, having saved the four images out of the real
// product). A hand-drawn miniature could only ever be our idea of what Modern
// looks like; theirs is what their customers already recognise, down to the
// dashed outline that stands for Custom.
//
// alt="", because the image repeats what the tile's name says underneath and
// the radio is what is being chosen. A plain <img>: this screen renders in
// Studio as well as in the app, and next/image exists in only one of those.
//
// The size is an inline style rather than aspect-square and object-cover: the
// preview's precompiled stylesheet only carries the utilities these screens
// already use, and a class that is missing from it does nothing at all rather
// than failing loudly (measured on the old Every select, where w-32 computed
// to the full 607px). The images are square, so "cover" crops nothing.
function PresetThumb({ id, src }) {
  return (
    <img
      src={src}
      alt=""
      data-hook={`design-preset-${id}-thumb`}
      className="block w-full"
      // CAPPED, BECAUSE THE SHEET IS WIDER THAN THE PANEL (20 Sep). The
      // artwork is square, so two-up in a 960px sheet drew a 460px tall tile
      // and the crop landed in the middle of somebody's review. A thumbnail
      // reads as a thumbnail at any width, and the top of the artwork is the
      // part that says which look this is.
      style={{
        aspectRatio: "1 / 1",
        maxHeight: "10rem",
        objectFit: "cover",
        objectPosition: "top center",
        borderRadius: "0.25rem",
      }}
    />
  );
}

// THE PRESET TILES (Ali, 20 Sep, from the real Widget Design screen). Three
// named looks at the top of the panel, outside the groups, each showing what
// it does rather than naming it. CUSTOM IS NOT SOMETHING YOU PICK: it appears,
// already chosen, the moment one setting differs from the preset you were on,
// and it goes again the moment you pick a preset back. Its tile carries the
// product's dashed-outline artwork, which is exactly what it means: a look
// that is yours rather than one of theirs.
//
// A DS RadioGroup, not a row of buttons: one of these is always true, which is
// what a radio group is for, and it comes with the arrow-key behaviour.
function PresetTiles({ design, value, onChange }) {
  const tiles = [
    ...PRESET_ORDER.map((id) => ({ id, label: DESIGN_PRESETS[id].label })),
    ...(value === "custom" ? [{ id: "custom", label: "Custom" }] : []),
  ];
  return (
    <Field dataHook="design-preset-field">
      <FieldLabel htmlFor="design-preset-modern" dataHook="design-preset-label">
        Design preset
      </FieldLabel>
      <RadioGroup
        dataHook="design-preset-radio-group"
        value={value}
        // Custom is a readout, so picking it does nothing; picking a real
        // preset writes every field it owns.
        onValueChange={(v) => (v && v !== "custom" ? onChange(v) : null)}
        aria-label="Design preset"
      >
        {/* Two-up, whether there are three tiles or four: the panel is 24rem
            at its narrowest, and four across there is a 70px thumbnail. */}
        <div className="grid grid-cols-2 gap-3">
          {tiles.map((t) => (
            <Field key={t.id} variant="box" dataHook={`design-preset-${t.id}-tile`}>
              <PresetThumb id={t.id} src={PRESET_THUMBS[t.id]} />
              <div className="flex items-center gap-2">
                <RadioGroupItem id={`design-preset-${t.id}`} value={t.id} />
                <FieldLabel htmlFor={`design-preset-${t.id}`} dataHook={`design-preset-${t.id}-label`}>
                  {t.label}
                </FieldLabel>
              </div>
            </Field>
          ))}
        </div>
      </RadioGroup>
    </Field>
  );
}

// ONE GROUP'S FIELDS, FOR THE SHEET THAT OPENS ON IT. The field markup is
// exactly what the accordion groups held, data-hooks and all; only the box
// around it changed, from an item in one long card to a sheet of its own.
// Module scope, not inner declarations: a component declared inside another
// remounts on every render and drops input focus.
function DesignGroupFields({ id, widget, setWidget }) {
  const d = widget.design;
  const c = carouselOf(d);
  const preset = presetOf(d);
  // ONE WRITE PATH for every design field, so no control carries its own
  // spread and nothing can forget a key.
  const set = (patch) => setWidget((w) => ({ ...w, design: { ...w.design, ...patch } }));
  // A preset writes every field it owns in one go (Ali, 20 Sep: picking a
  // preset "sets every control below to that preset's values"). The carousel
  // settings are not a preset's business, so they survive it, and neither is
  // the widget title: see PRESET_KEYS for why the words someone typed are the
  // one thing a look is not allowed to overwrite. What a preset DOES rewrite
  // beyond the styling (the Layout numbers, and the Reviews group's Schema,
  // name, icon and date-format settings) is spelled out in the same comment.
  const applyPreset = (pid) => {
    const { title: _title, ...look } = DESIGN_PRESETS[pid].values;
    set(look);
  };

  if (id === "preset") return <PresetTiles design={d} value={preset} onChange={applyPreset} />;
  if (id === "layout")
    return (
      <>
      <NumberField
        id="design-max-height"
        label="Widget max height"
        value={d.maxHeight}
        min={200}
        max={4000}
        onChange={(n) => set({ maxHeight: n })}
      />
      <Field dataHook="design-columns-field">
        <FieldLabel htmlFor="design-columns-1" dataHook="design-columns-label">
          Desktop layout display
        </FieldLabel>
        {/* GLYPHS, NAMED. The real screen draws three grid glyphs and
            no words, so each item carries its name as its accessible
            label instead of as visible text. The guard on the change
            keeps one column always chosen: a ToggleGroup sends an
            empty value when you press the item that is already on. */}
        <ToggleGroup
          type="single"
          variant="outline"
          dataHook="design-columns"
          value={d.columns}
          onValueChange={(v) => (v ? set({ columns: v }) : null)}
          aria-label="Desktop layout display"
        >
          {COLUMN_OPTIONS.map((o) => (
            <ToggleGroupItem
              key={o.id}
              id={`design-columns-${o.id}`}
              value={o.id}
              dataHook={`design-columns-${o.id}`}
              aria-label={o.label}
            >
              <o.Icon className="size-4" />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>
      <SliderField
        id="design-count"
        label="Number of reviews to show"
        value={d.count}
        min={1}
        max={50}
        onChange={(n) => set({ count: n })}
      />
      </>
    );
  if (id === "container")
    return (
      <>
      <ColorField id="design-bg" label="Background" value={d.bg} onChange={(v) => set({ bg: v })} />
      <NumberField
        id="design-radius"
        label="Corner radius"
        value={d.radius}
        min={0}
        max={64}
        onChange={(n) => set({ radius: n })}
      />
      {/* A CHECKBOX THAT REVEALS ITS FIELDS, as the real screen has
          it. The values stay on the record while the box is off, so
          unticking and reticking gives back what was set rather than
          the default. */}
      <CheckRow
        id="design-border"
        label="Customize border"
        checked={d.borderOn}
        onChange={(v) => set({ borderOn: v })}
      />
      {d.borderOn ? (
        <div className="grid grid-cols-2 gap-3 pl-6" data-hook="design-border-fields">
          <NumberField
            id="design-border-width"
            label="Width"
            value={d.borderWidth}
            min={0}
            max={20}
            onChange={(n) => set({ borderWidth: n })}
          />
          <ColorField
            id="design-border-color"
            label="Color"
            value={d.borderColor}
            onChange={(v) => set({ borderColor: v })}
          />
        </div>
      ) : null}
      <CheckRow
        id="design-shadow"
        label="Customize shadow"
        checked={d.shadowOn}
        onChange={(v) => set({ shadowOn: v })}
      />
      {d.shadowOn ? (
        <ShadowFields hook="design-shadow" prefix="shadow" design={d} set={set} />
      ) : null}
      <CheckRow
        id="design-title-on"
        label="Customize widget title"
        checked={d.titleOn}
        onChange={(v) => set({ titleOn: v })}
      />
      {d.titleOn ? (
        <Field dataHook="design-title-field" className="pl-6">
          <FieldLabel htmlFor="design-title" dataHook="design-title-label">
            Title text
          </FieldLabel>
          <Input
            id="design-title"
            dataHook="design-title"
            value={d.title ?? ""}
            placeholder="Customer Reviews"
            onChange={(e) => set({ title: e.target.value })}
          />
        </Field>
      ) : null}
      <Field dataHook="design-summary-field">
        <FieldLabel htmlFor="design-summary" dataHook="design-summary-label">
          Review summary
        </FieldLabel>
        {/* 10rem and left-aligned under its label, as an inline style
            for the reason the Every select carries one: the preview's
            precompiled stylesheet does not always carry a w-* step,
            and an unavailable utility is worse than a value. */}
        <div style={{ width: "10rem" }}>
          <Select value={d.summary} onValueChange={(v) => set({ summary: v })}>
            <SelectTrigger id="design-summary" dataHook="design-summary" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUMMARY_OPTIONS.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <FieldDescription dataHook="design-summary-desc">
          All counts every review this location has. Selected counts only the reviews this
          showcase publishes.
        </FieldDescription>
      </Field>
      </>
    );
  if (id === "text")
    return (
      <>
      <Field dataHook="design-font-field">
        <FieldLabel htmlFor="design-font" dataHook="design-font-label">
          Font
        </FieldLabel>
        {/* Each option is drawn in its own face, so the list shows the
            difference rather than naming it. */}
        <Select value={d.font} onValueChange={(v) => set({ font: v })}>
          <SelectTrigger id="design-font" dataHook="design-font" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONTS.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                <span style={{ fontFamily: f.stack }}>{f.id}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <ColorField id="design-color" label="Color" value={d.color} onChange={(v) => set({ color: v })} />
      <ColorField
        id="design-link-color"
        label="Link color"
        value={d.linkColor}
        onChange={(v) => set({ linkColor: v })}
      />
      <SliderField
        id="design-size"
        label="Size"
        value={d.size}
        min={14}
        max={20}
        suffix="px"
        onChange={(n) => set({ size: n })}
      />
      <Field dataHook="design-align-field">
        <FieldLabel htmlFor="design-align-left" dataHook="design-align-label">
          Alignment
        </FieldLabel>
        <ToggleGroup
          type="single"
          variant="outline"
          dataHook="design-align"
          value={d.align}
          onValueChange={(v) => (v ? set({ align: v }) : null)}
          aria-label="Alignment"
        >
          {ALIGN_OPTIONS.map((o) => (
            <ToggleGroupItem
              key={o.id}
              id={`design-align-${o.id}`}
              value={o.id}
              dataHook={`design-align-${o.id}`}
              aria-label={o.label}
            >
              <o.Icon className="size-4" />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>
      </>
    );
  if (id === "reviews")
    return (
      <>
      {/* The three on-by-default checkboxes as data, one row each, so
          they read as one set and a fourth costs a line. */}
      <div className="flex flex-col gap-3">
        {REVIEW_TOGGLES.map((o) => (
          <CheckRow
            key={o.key}
            id={`design-${o.key.toLowerCase()}`}
            label={o.label}
            checked={d[o.key] !== false}
            onChange={(v) => set({ [o.key]: v })}
          />
        ))}
      </div>
      <RadioField
        id="design-date-format"
        label="Date format"
        value={d.dateFormat}
        options={DATE_FORMATS}
        onChange={(v) => set({ dateFormat: v })}
      />
      {/* The count is what the preview actually cuts at, and the tail
          is a "Read More" link in the link colour. */}
      <RadioField
        id="design-chars"
        label="Reviews character count"
        value={d.chars}
        options={CHAR_COUNTS}
        onChange={(v) => set({ chars: Number(v) })}
      />
      <ColorField
        id="design-review-bg"
        label="Background"
        value={d.reviewBg}
        onChange={(v) => set({ reviewBg: v })}
      />
      <NumberField
        id="design-review-radius"
        label="Corner radius"
        value={d.reviewRadius}
        min={0}
        max={64}
        onChange={(n) => set({ reviewRadius: n })}
      />
      <CheckRow
        id="design-review-border"
        label="Customize border"
        checked={d.reviewBorderOn}
        onChange={(v) => set({ reviewBorderOn: v })}
      />
      {d.reviewBorderOn ? (
        <div className="grid grid-cols-2 gap-3 pl-6" data-hook="design-review-border-fields">
          <NumberField
            id="design-review-border-width"
            label="Width"
            value={d.reviewBorderWidth}
            min={0}
            max={20}
            onChange={(n) => set({ reviewBorderWidth: n })}
          />
          <ColorField
            id="design-review-border-color"
            label="Color"
            value={d.reviewBorderColor}
            onChange={(v) => set({ reviewBorderColor: v })}
          />
        </div>
      ) : null}
      <CheckRow
        id="design-review-shadow"
        label="Customize shadow"
        checked={d.reviewShadowOn}
        onChange={(v) => set({ reviewShadowOn: v })}
      />
      {d.reviewShadowOn ? (
        <ShadowFields hook="design-review-shadow" prefix="reviewShadow" design={d} set={set} />
      ) : null}
      </>
    );
  if (id === "animation")
    return (
      <>
        {/* THE PRODUCT'S OWN FIVE, IN ITS ORDER (Ali, 20 Sep, from a
            screenshot of the real product's carousel settings). Loop
            and the Every select are gone: neither exists on that
            screen, and a control nobody can reach is worse than a
            default. What replaced them all answers in the preview
            above, which is the point of this group sitting under it.

            THE LABELS CARRY THE SCREEN'S COLONS, and the four groups
            above carry none, so this group reads differently beside
            them.
            ASSUMPTION: the colon is the product's, quoted rather than
            tidied away. If it came from the note and not the screen,
            dropping it is five edits and nothing else moves. */}
        <YesNoField
          id="design-auto-rotate"
          label="Auto rotate slides:"
          value={c.autoRotate}
          onChange={(v) => patchCarousel(setWidget, { autoRotate: v })}
        />
        <RadioField
          id="design-transition"
          label="Transition style:"
          value={c.transition}
          options={TRANSITION_OPTIONS}
          onChange={(v) => patchCarousel(setWidget, { transition: v })}
        />
        {/* NOT DISABLED WHILE AUTO ROTATE IS NO, which is what the old
            Every select did. The real screen offers five plain
            controls, and greying one out would be a rule we invented;
            it also reads as the animation's own duration to anyone who
            takes the label at its word (see CarouselWidget). */}
        <SliderField
          id="design-transition-speed"
          label="Transition animation speed (seconds):"
          value={c.speed}
          min={SPEED_MIN}
          max={SPEED_MAX}
          onChange={(n) => patchCarousel(setWidget, { speed: n })}
        />
        <YesNoField
          id="design-arrows"
          label="Show slide arrows:"
          value={c.arrows}
          onChange={(v) => patchCarousel(setWidget, { arrows: v })}
        />
        <YesNoField
          id="design-dots"
          label="Show slide dots:"
          value={c.dots}
          onChange={(v) => patchCarousel(setWidget, { dots: v })}
        />
      </>
    );
  return null;
}

// WIDGET DESIGN IS A PREVIEW-LED PAGE (Ali, 20 Sep: "So, we are leaning into
// preview, and you can edit each part, just like we had preview and edit in
// Review Builder"). Copied from that editor rather than re-derived: the thing
// being made is shown, each part is a block with a heading and a line saying
// what it is set to, and Edit opens a sheet holding only that part's fields.
//
// THE PREVIEW IS THE BIGGEST THING ON THE PAGE and it leads it, which is the
// whole point of the change. It is no longer sticky: it used to ride the top
// of a long scrolling form, explaining the control under your cursor, and
// there is no long form here any more. The blocks under it are six short
// cards, and while a sheet is open the preview behind is what moves as you
// type.
//
// FULL WIDTH, BECAUSE THE RAIL IS GONE. WizardShell's column is a hard
// max-w-4xl, 896 on a 1280 viewport, and the body gutter leaves 848. The
// design page used to hand 256 of that to a rail and draw the widget in 568.
// Widening the shell is one line in ds/wizard-shell.jsx, where it also widens
// the Review Builder's template editor, and Ali reversed two attempts at that
// on 7 Sep ("the width of both was completely fine before"), so 848 is the
// number and it is his call, not this file's.
function WidgetDesign({ widget, setWidget }) {
  const groups = designGroupsFor(widget);
  // WHICH PART'S SHEET IS OPEN, and nothing else. Edits are live, so the
  // sheet has no draft of its own and Done only dismisses.
  const [editing, setEditing] = useState(null);
  const open = groups.find((g) => g.id === editing) ?? null;
  const narrow = useNarrowSheet();
  // THE SHOWCASE'S REAL SET, NOT A SAMPLE. It used to be a hard two reviews
  // (three for a carousel), which quietly made three controls unjudgeable at
  // the moment you were setting them: "Number of reviews to show" changed
  // nothing, "Widget max height" had nothing to cap, and "Review summary:
  // Selected" read "2 Total Reviews" with the average of those two, a figure
  // that was an artefact of the sample size rather than anything the showcase
  // would publish. Handing over the resolved set lets WidgetPreview apply the
  // count itself, so every one of the three now answers.
  const sample = resolveReviews(widget);
  return (
    <div className="flex min-w-0 flex-col gap-4" data-hook="design-page">
      <Card dataHook="design-preview-card" className="max-w-none gap-0 p-0" density="condensed">
        <CardHeader className="px-4 pt-4 pb-3">
          {/* SENTENCE CASE. "Widget Design" is the product's name for the
              step; a card title is a heading, so it reads "Widget design". */}
          <CardTitle dataHook="design-card-title">Widget design</CardTitle>
          {/* The real screen's own line. */}
          <CardDescription dataHook="design-intro">
            Customize your widget so it displays your reviews how you want your customers to see them.
          </CardDescription>
        </CardHeader>
        {/* BOUNDED, because the widget is not. The preview holds the real set,
            so it can run to fifty cards of 280-character reviews, and a block
            that tall would leave no room for the parts it exists to explain.
            An inline style rather than a utility class so it survives wherever
            this screen renders. The widget's own "Widget max height" still
            bites first at anything under this, which is where that setting is
            worth watching anyway. 60vh, up from the 45 it had as a sticky
            strip: it is the subject of the page now, not a band above a
            form. */}
        <div className="px-4 pb-4" style={{ maxHeight: "60vh", overflowY: "auto" }} data-hook="design-live-preview">
          <PreviewFrame surface="none" dataHook="preview-frame-design">
            <WidgetPreview widget={widget} reviews={sample} />
          </PreviewFrame>
        </div>
      </Card>

      {/* ONE BLOCK PER PART. The heading is a CardTitle at the card's own
          size, not the small one and not an accordion trigger, because not
          being able to see where a section starts was the complaint. The line
          under it says what the part is set to, so the block is worth reading
          before you open it, and Edit is the DS outline button in CardAction,
          exactly as the Review Builder draws it.
          data-hook="design-group-<id>" is the hook the accordion trigger used
          to carry, kept on the block that replaced it. */}
      {groups.map((group) => (
        <Card key={group.id} className="max-w-none" dataHook={`design-group-${group.id}`}>
          <CardHeader>
            <CardTitle dataHook={`design-group-${group.id}-title`}>{group.label}</CardTitle>
            <CardDescription dataHook={`design-group-${group.id}-summary`}>
              {designGroupSummary(group.id, widget)}
            </CardDescription>
            <CardAction>
              <Button
                variant="outline"
                size="sm"
                dataHook={`design-edit-${group.id}`}
                onClick={() => setEditing(group.id)}
              >
                Edit
              </Button>
            </CardAction>
          </CardHeader>
        </Card>
      ))}

      {/* ONE SHEET, DRIVEN BY WHICH PART IS OPEN. A drawer per group would be
          six copies of the same furniture. Right-hand from sm up, bottom on a
          phone: Review Manager's rule, copied rather than reinvented, and the
          same DRAWER_WIDTH clamp the preview and embed sheets on the list
          page use, so every overlay on this screen is the same object. */}
      <Drawer
        open={open !== null}
        onOpenChange={(o) => (o ? null : setEditing(null))}
        direction={narrow ? "bottom" : "right"}
      >
        {/* THE SHEET IS A PORTAL, so it renders on document.body, OUTSIDE
            [data-hook="widget-settings-layout"] where WIZARD_TYPE_SCALE sets
            the form controls to 13px. Without this the same fields come out a
            size larger in the sheet than they did on the page (Ali, 7 Sep, on
            the Builder: "the size of the text inputs varies"). Same rule,
            re-scoped to the sheet. */}
        <style>{`
          [data-hook="design-sheet"] [data-slot="input"],
          [data-hook="design-sheet"] [data-slot="textarea"],
          [data-hook="design-sheet"] [data-slot="select-trigger"],
          [data-hook="design-sheet"] [data-slot="select-value"] {
            font-size: 0.8125rem;
            line-height: 1.125rem;
          }
        `}</style>
        <DrawerContent
          dataHook="design-sheet"
          className={`flex flex-col ${narrow ? "" : "h-full"} ${DRAWER_WIDTH}`}
          style={narrow ? { marginTop: 0, maxHeight: "92svh" } : undefined}
        >
          {/* Title only, no hint (Ali, 7 Sep: "drop the descriptions in the
              review template drawers, looks crap"). The block you pressed
              already said what this part is set to. */}
          <SideSheetHeader
            title={open ? open.label : "Design"}
            dataHook="design-sheet-panel"
            closeHook="design-sheet-close"
          />
          <DrawerBody
            className="mx-0 mt-0 flex min-h-0 max-w-none grow flex-col gap-5 overflow-y-auto px-4 py-4"
            style={{ scrollbarWidth: "thin", scrollbarColor: "var(--border) transparent" }}
            data-hook="design-controls"
          >
            {open ? <DesignGroupFields id={open.id} widget={widget} setWidget={setWidget} /> : null}
          </DrawerBody>
          {/* THE DS FOOTER IS BUILT FOR A BOTTOM DRAWER: it ships
              `mx-auto mt-auto w-full max-w-sm flex-col`, which centres itself
              at 384px and stretches its children full width, so in a
              right-hand sheet it draws a 352px slab in the middle of an empty
              column. Review Manager and the Builder both override the same
              three things; this copies them rather than inventing a fourth
              idea. */}
          <DrawerFooter className="mx-0 max-w-none flex-row items-center justify-end gap-2 border-t p-4">
            {/* Edits are live, so this only dismisses. The preview behind has
                already moved. */}
            <Button variant="primary" dataHook="design-sheet-done" onClick={() => setEditing(null)}>
              Done
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

// THE SECTION SHEET IS GONE; THE PART SHEET REPLACED IT. The old one carried
// a whole Select Reviews table (Ali, 20 Sep: "That drawer seems awfully large
// with the table in it"), and that is a page now. What opens in a drawer on
// the editor is one design part at a time, which is a short list of fields:
// see WidgetDesign. Its width is DRAWER_WIDTH, the same clamp the preview and
// embed drawers on the showcase LIST use. The 13px form scale each sheet has
// to re-declare lives with the sheet that needs it, because a portal renders
// outside the layout hook WIZARD_TYPE_SCALE is scoped to.

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
        <WidgetPreview widget={widget} reviews={resolveReviews(widget)} full />
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
  const persona = usePersona();
  const locationKey = useLocationKey();
  // Before useState runs its initialisers, so seedWidgets picks from this
  // location's own reviews.
  selectShowcaseReviews(locationKey, persona);
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
  // WHICH OF THE TWO EDITOR PAGES IS OPEN, "reviews" or "design". It used to
  // be which of three rail sections was showing; the rail is gone and the
  // card picks the page now, so this is set on the way in and by Save when a
  // filter set matches nothing.
  const [editorPage, setEditorPage] = useState("reviews");

  const active = widgets.find((w) => w.id === activeId) ?? null;
  const draftReviews = resolveReviews(draft);
  // A JSON feed has no design, so there is no design page to be on even if
  // something asked for one.
  const onDesign = editorPage === "design" && draft.format !== "json";

  // Edits go straight to the draft; the save-blocking alert clears itself below.
  const patchDraft = (next) => setDraft(next);
  // The alert clears as soon as its condition is fixed and stays cleared
  // until the next press of Save, so ticking and unticking while it is up
  // cannot make it flicker.
  useEffect(() => {
    if (issue && issueFor(draft, draftReviews) !== issue) setIssue(null);
  }, [issue, draft, draftReviews]);

  // THE CARD SAYS WHICH PAGE TO OPEN. Edit reviews and Edit design are the
  // same editor on the same draft; only the page differs.
  function openSettings(w, page = "reviews") {
    const d = { ...w };
    setDraft(d);
    setOpened(JSON.stringify(d));
    setEditorPage(page === "design" && w.format !== "json" ? "design" : "reviews");
    setIssue(null);
    setView("build");
  }
  const startEdit = (w) => openSettings(w, "reviews");

  // VALIDATED ON SAVE, NOT ON NEXT. The wizard checked each step as you left
  // it; a settings page has no leaving, so the check runs when you press
  // Save. It can only be put right on Select reviews, so Save sends you
  // there, from the design page as readily as from the reviews one.
  function saveDraft() {
    const kind = issueFor(draft, draftReviews);
    if (kind) {
      setIssue(kind);
      setEditorPage("reviews");
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
    // NO FOOTER AT ALL NOW. Back and Next used to walk the three rail
    // sections below lg (Ali, 7 Sep: "we might have a footer for forward and
    // back on tablets and mobiles"). There are no sections left to walk: the
    // editor is two pages reached from the card, and a footer that stepped
    // between Select reviews and Widget design would be a second way in
    // disagreeing with the first. Save showcase and Close are in the header
    // at every width, which is what the footer was traded for on 7 Sep.
    // THE BODY WEARS THE HEADER'S GUTTER (Ali, 20 Sep). The shell hands the
    // header and the body the same max-w-4xl column, but the DS page header
    // insets its own contents and the body had none, so the body sat a gutter
    // left of the breadcrumb. The test is the one PageHeader makes itself:
    // the DS header engines carry the gutter, the proposal shell's does not.
    let nativeHeader = false;
    try {
      nativeHeader = window.__gdsLayoutEngine === "native" || window.__gdsLayoutEngine === "native-fixed";
    } catch {}
    const bodyGutter = nativeHeader ? "px-4 md:px-6 lg:px-section-xs" : "";
    const heading = FORMATS[draft.format].heading;
    return (
      <WizardShell
        dataHook="widget-settings"
        title={heading}
        header={
          // THE TYPE IS THE DESCRIPTION (Ali, 7 Sep: "the Page header should
          // be 'Review Showcase' and the description should say list, carousel
          // etc."), AND SO IS THE PAGE. Same H1 as the list page, so the page
          // does not change identity when you step into a showcase, and the
          // line under it now says both which showcase and which of the two
          // editor pages you are on. That line is the only thing left that
          // names the page, the rail having gone, so it is not decoration.
          <PageHeader
            dataHook="widget-page-header"
            // The SAME header as every other page (Ali, 8 Sep: "it doesn't
            // look like it is the correct page header"): trail and help on,
            // so stepping into a showcase does not change the page's chrome.
            breadcrumbs={crumbs}
            title="Review Showcase"
            description={`${heading}: ${onDesign ? "Widget design" : "Select reviews"}`}
            // THIS SHOWCASE'S DATE (Showcase audit, 10 Sep). "auto" binds the
            // account's own refresh date, so the header said "Last updated
            // August 18, 2026" while each showcase carried a real `updated`
            // value that nothing ever read.
            lastUpdated={draft?.updated ?? undefined}
            actions={headerActions}
          />
        }
        steps={null}
        contentClassName="pt-6!"
      >
        {/* ONE FULL-WIDTH COLUMN, NO GRID. It was a two-column grid with a
            256px rail on the left, and the note that used to live here about
            minmax(0,1fr) below md was about that grid: a single implicit
            `auto` column took the card's MIN-CONTENT width at 390, and a
            carousel's min-content is the sum of its slides, so the column came
            out 706px and the page scrolled sideways. A plain block cannot do
            that, and min-w-0 on the two pages' own wrappers keeps the same
            promise. Both pages are as wide as the shell allows, which is the
            848 the table needed and the widget deserved. */}
        <div className={`flex min-w-0 flex-col ${bodyGutter}`}>
          {/* TWO PAGES, PICKED ON THE WAY IN (Ali, 20 Sep: "I think we would
              have to select reviews on its own page, and then do the design
              stuff on its own page"). The card on the list page says which,
              Save sends you to Select reviews when a filter set matches
              nothing, and the header says where you are. A JSON feed has no
              design, so `onDesign` already refused it. */}
          {onDesign ? (
            <WidgetDesign widget={draft} setWidget={patchDraft} />
          ) : (
            <SelectReviews widget={draft} setWidget={patchDraft} issue={issue} />
          )}
        </div>

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
            onEditReviews={(w) => openSettings(w, "reviews")}
            onEditDesign={(w) => openSettings(w, "design")}
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
