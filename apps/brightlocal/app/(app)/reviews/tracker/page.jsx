"use client";

// Promoted from Studio screen "RM — Review Tracker"
// (design dmswb0i9c6oe5, version 1788892759000). Registry: lib/screens.ts;
// re-promotion workflow: apps/brightlocal/README.md.
// source-hash: b497c37df4f2

// RM — Review Tracker. Audit §3.1.3 page furniture: last-updated line,
// Settings/Download actions, Connect Facebook alert.
//
// SUBTITLE RESTORED (Ali, 18 Aug, later the same day). It was cut earlier
// for costing 22px of vertical space that pushed every sticky card header
// down the page. That cost is gone: PageHeader's status row is RESERVED now,
// so it holds its height whether or not a description fills it, and the
// sticky offset is the shell's MEASURED --gds-page-header-height rather than
// a number anyone has to keep in step. Leaving the row empty saved nothing
// and lost the line. The copy is the audit wireframe's, verbatim.
//
// CHART/TABLE IS A REAL ToggleGroup, not two hand-rolled buttons painting
// their own selected state. type="single" with a guarded onValueChange so the
// group can never end up with NOTHING selected (Radix single-select allows
// deselecting the active item, which would blank the card). variant="outline"
// size="sm" lines it up with the facet triggers. Each item is wrapped in a
// Tooltip — they're icon-only. ariaLabel stays ON the item as well: a tooltip
// is a DESCRIPTION (aria-describedby), not an accessible NAME, so dropping it
// would leave a screen reader announcing an unnamed button. TooltipProvider
// wraps the screen once — the DS's docs say mount it at the top of the tree.
//
// ALERT: AlertInfo is PROP-BASED (title / description / action), NOT
// composable. It ignores children entirely — the first attempt composed
// <AlertTitle>/<AlertDescription> inside it (which is what the house rules
// tell you to do, and both ARE exported) and rendered an empty blue bar: no
// error, no validator complaint, just a silent no-op. Logged for the brief.
//
// STICKY CARD HEADERS. The charts are tall enough that the filters scroll out
// of reach, so each card's header pins under the page header. Three things:
//   1. AN OFFSET. The page header is sticky at top-0, so card headers stick
//      BELOW it, via --rm-sticky-top on the body. This used to be a hardcoded
//      128px measured off a render, which is a number that goes stale the
//      moment the header changes: losing the "Last updated" line left a gap
//      with page content scrolling through it. AppLayoutShell now MEASURES the
//      band with a ResizeObserver and republishes it as
//      --gds-page-header-height, so the offset is always the real header
//      height, at every viewport and for every header composition. The 128px
//      is only a first-paint fallback for the frame before the observer runs.
//   2. AN OPAQUE BACKGROUND TO THE CARD'S TOP EDGE. The card's py leaves a
//      gap above the header that content would scroll through, so the header
//      takes -mt-3 pt-3, plus rounded-t-[inherit] for the corners.
//   3. ITS OWN BOTTOM EDGE. The <Separator> under each header was a SIBLING,
//      so it scrolled away and left the header floating on the chart.
//      Replaced with border-b on the header. That IS a className on DS
//      chrome — deviation logged; the DS has no sticky affordance on Card.
//   z-[5] keeps them under the page header's z-10 and over card content.
//
// DENSITY, NOT PADDING OVERRIDES. Card's default is gap-8 + py-section-md /
// px-section-md — CUSTOM spacing utilities tailwind-merge cannot see as
// conflicting with p-*, so they can't be overridden at all. density="condensed"
// is gap-3 py-3 px-3, all STANDARD utilities, which px-4 then displaces
// cleanly. Never fight default density — switch to condensed and dial up.
//
// px-6 SINCE 3 SEP (Ali: "the padding — we might even in the actual content
// of these cards have a bit more room"). This reverses the 18 Aug call
// below, deliberately and with its reason: at px-4 these cards matched the
// Review Manager's 16px gutter, but the inbox's gutter is a TABLE's, where
// rows want to reach the edge. These cards hold charts, which need air
// around them or the bars read as running out of the card. The pairing with
// the inbox is the thing being given up, and it is the right thing to give
// up — a table and a chart are not the same object.
//
// The 18 Aug reasoning, kept because it is still true of the inbox:
// px-4, NOT px-6 (Ali, 18 Aug: "can we take insights to px-4"). These cards
// were 24px while the Review Manager's bands are 16px, so the same furniture
// sat 8px further from the card edge on one screen than the other. 16px is
// also where the Inbox's table puts its first column, so the two screens
// now share one gutter. The DS's own condensed default is 12px; 16 is the
// pair's number, not the DS's.
//
// Y AXIS: the cumulative series ("All reviews") fits the axis to the data
// (domain dataMin→dataMax) rather than baselining at zero — a zero baseline
// wastes half the plot when the line never approaches it. "New reviews" IS
// zero-based: per-bucket counts are a magnitude, so zero is meaningful.
//
// TIMELINE (audit §3.1.2): two charts, ONE set of controls. Bucket size IS
// the zoom (Weekly→Yearly); panning is separate, via arrows. Both charts'
// arrows drive one offset. "All reviews" = cumulative; "New" = per-bucket.
//
// RECHARTS PROPS ARE NOT IN THE CONTRACTS: <Pie stroke> and <Bar fill> both
// rejected — and <Pie stroke="none"> was in a PREVIOUSLY SAVED version of
// this screen, so the contracts have CHANGED since. Series colour goes
// through <Cell> children instead.
//
// Button's `iconOnly` DOES exist — it even auto-detects a single icon child,
// but detection reads children.props.children, so an asChild wrapper defeats
// it. Pass it explicitly (see TimelinePeriodBar).
//
// Card's own max-width is the ~650px cap (max-w-none). ChartCenterLabel
// white-screens here (token overlay instead). ChartContainer OWNS its
// ResponsiveContainer and the WRAPPER needs a fixed height (h-64).
// Body is gap-4, not space-y-6 — the DS body is already flex flex-col gap-6.

import { Fragment, useMemo, useRef, useState } from "react";
import {
  SidebarProvider,
  SidebarTrigger,
  GlobalLayoutContentBody,
  Logo,
} from "@brightlocal/ui-components";
// CARD TITLES ARE CardTitle, NOT A HAND-ROLLED h3 (Ali, 2 Sep: "change the
// weight of the card titles to match the Review Builder and Review Showcase
// pages"). These two were `<h3 className="text-base font-semibold">`, which
// differs from the DS in TWO ways, not one:
//
//   CardTitle size="small"   font-display font-medium text-base   (500)
//   the hand-rolled h3       font-semibold text-base              (600, body font)
//
// So the weight was one step heavy AND the family was wrong, on the one
// screen out of three that was not using the component. Matching the classes
// by hand would fix today's render and drift again the next time the DS
// moves its type; using the component cannot. It also restores
// data-slot="card-title", which is what the sticky-header CSS and any future
// theming select on.
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@brightlocal/ui-components/card";
// AlertInfo import kept OUT while the Connect Facebook banner is pulled: it
// was this file's only user. Restore it with the banner (see the parked block
// in the page body).
import { Separator } from "@brightlocal/ui-components/separator";
import { Progress } from "@brightlocal/ui-components/progress";
import { Button } from "@brightlocal/ui-components/button";
import { ToggleGroup, ToggleGroupItem } from "@brightlocal/ui-components/toggle-group";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@brightlocal/ui-components/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@brightlocal/ui-components/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@brightlocal/ui-components/command";
import { Rating } from "@brightlocal/ui-components/rating";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "@brightlocal/ui-components/chart";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@brightlocal/ui-components/table";
import {
  Menu,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Star,
  ThumbsUp,
  ThumbsDown,
  ChartColumn,
  Table2,
  Check,
  Settings,
  Download,
} from "@brightlocal/icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@brightlocal/ui-components/dialog";
import { AppLayoutShell, ProposalSidebar, PageHeader, SourceMark } from "@brightlocal/proposal";
import {
  FACET_COMMAND_CLASS,
  FacetOptions,
  FacetPopover,
  FacetedFilterMenu,
  SingleSelectMenu,
} from "@brightlocal/facet-menu";

// The ONE number to tune when the page header's height changes.
const STICKY_TOP = "var(--gds-page-header-height, 128px)";

// Minimum space between a chart tooltip's series label and its value. The
// DS lays that row out with justify-between and no gap, which reads fine
// until a label is wide enough to leave no free space — then the name and
// the number touch. Targets the row by its own flex-1, the one stable
// handle the component gives from the outside.
const TOOLTIP_ROW_GAP = "[&_.flex-1]:gap-4";

// Shared sticky-header recipe — see the note at the top of the file.
// py-2, NOT py-3: the Review Manager sets the rhythm for this pair of
// screens and every band there is px-4 py-2 (49px around a 32px control
// row). These headers were py-3, so the same furniture stood 8px taller on
// Insights than on the Inbox (Ali, 18 Aug: "still have some height
// discrepancies", with the two screens side by side). 8px here makes them
// the same height. -mt-3 is unchanged and unrelated: it cancels the CARD's
// own py-3, which is 12px whatever this header's padding is.
const STICKY_HEADER =
  // px-6 to match CardContent — a sticky header at px-4 over content at
  // px-6 puts the card's title 8px left of everything it labels.
  // pt-4 pb-4 (Ali, 7 Sep: "I'd actually do a pb-4 to balance it"), from the
  // earlier pt-4 pb-3, itself from pt-2 pb-2 (Ali, 3 Sep: "a little more on
  // top, and a bit extra on the bottom"). Even now, because Review Builder
  // carries the same header and the two have to be interchangeable. The -mt-3 pulls this header up over the card's
  // own top padding so it sits flush, which the sticky behaviour needs but
  // which left it tighter to the card edge than an ordinary CardHeader.
  //
  // Top gets two steps and bottom one, on purpose: the top is fighting the
  // -mt-3 and has ground to make up, while the bottom only has to separate
  // the title from the content, which the border already half does. Equal
  // padding would leave the header still reading high in its own band.
  "bg-card sticky top-[var(--rm-sticky-top)] z-[5] -mt-3 rounded-t-[inherit] border-b px-6 pt-4 pb-4";

// The DS CardHeader is a TWO-ROW grid (grid-rows-[auto_auto] + gap-1.5),
// shaped for a title over a description. These headers have ONE child, so
// the second row is 0px tall — but its 6px row-gap is still rendered, and
// it lands under the content. Measured on the live render: 12px above the
// content, 19px below it, which is the uneven top/bottom Ali spotted
// (18 Aug). Collapsing the template to the one row that exists evens it up.
//
// An inline style, not a grid-rows-* class: ours and the DS's would have
// identical specificity, so which one won would come down to stylesheet
// order rather than anything either file states.
const STICKY_HEADER_STYLE = { gridTemplateRows: "auto", rowGap: 0 };

const TODAY = new Date(2026, 7, 17);
const DAY_MS = 86400000;

// Names are all directories already used elsewhere in this project (the
// inbox's SOURCES and UNCONNECTED_SOURCES). None
// are invented: a made-up directory on a chart is the kind of thing that
// gets read back as a real integration.
//
// NO `colour` FIELD ANY MORE. Colour is assigned by rank at render time, in
// groupSources() — see the note there. The design system defines exactly
// five chart tokens (--chart-1..5), so a fixed colour per source stops
// working the moment there are six, and the sixth would either repeat a
// hue or invent one off-system.
const SOURCES = [
  { id: "google", name: "Google", stars: 862 },
  { id: "facebook", name: "Facebook", up: 106, down: 14 },
  { id: "yelp", name: "Yelp", stars: 61 },
  { id: "tripadvisor", name: "TripAdvisor", stars: 38 },
  { id: "yahoo", name: "Yahoo! Local", stars: 17 },
  { id: "apple", name: "Apple Maps", stars: 12 },
  { id: "bing", name: "Bing Places", stars: 6 },
];

// MUST sum to the total `stars` across SOURCES (996). buildReviews draws
// one bucket per star review out of this pool by index, so a pool shorter
// than the star count walks off the end and yields undefined buckets.
const STAR_MIX = { 5: 836, 4: 93, 3: 21, 2: 13, 1: 33 };

const PERIODS = [
  { id: "all", label: "All time" },
  { id: "12m", label: "Last 12 months", days: 365 },
  { id: "6m", label: "Last 6 months", days: 183 },
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "7d", label: "Last 7 days", days: 7 },
];

const matchesPeriod = (option, daysAgo) =>
  !option || option.days === undefined || daysAgo <= option.days;

const BUCKETS = [
  { id: "5", label: "5 star", kind: "star" },
  { id: "4", label: "4 star", kind: "star" },
  { id: "3", label: "3 star", kind: "star" },
  { id: "2", label: "2 star", kind: "star" },
  { id: "1", label: "1 star", kind: "star" },
  { id: "up", label: "Recommended", kind: "up" },
  { id: "down", label: "Not recommended", kind: "down" },
];

/* ------------------------------ timeline model ---------------------------- */

const TIMELINE_SCOPES = [
  { id: "all", label: "All reviews" },
  { id: "new", label: "New reviews" },
];

const TIME_BUCKETS = [
  { id: "weekly", label: "Weekly", span: 7, window: 12 },
  { id: "monthly", label: "Monthly", span: 30, window: 12 },
  { id: "quarterly", label: "Quarterly", span: 91, window: 8 },
  { id: "yearly", label: "Yearly", span: 365, window: 3 },
];

const SEED_SPAN_DAYS = 1095;

function bucketTick(bucket, index) {
  const at = new Date(TODAY.getTime() - index * bucket.span * DAY_MS);
  if (bucket.id === "yearly") return String(at.getFullYear());
  if (bucket.id === "quarterly")
    return `Q${Math.floor(at.getMonth() / 3) + 1} ${String(at.getFullYear()).slice(2)}`;
  if (bucket.id === "weekly")
    return at.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return at.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

// index 0 = most recent bucket; larger index = further back. "new" counts
// reviews INSIDE the bucket; "all" is cumulative — everything that had arrived
// by the end of that bucket.
function buildSeries(reviews, bucket, offset, scope) {
  const points = [];
  for (let k = bucket.window - 1; k >= 0; k -= 1) {
    const index = offset + k;
    const start = index * bucket.span;
    const rows =
      scope === "new"
        ? reviews.filter((r) => r.daysAgo >= start && r.daysAgo < start + bucket.span)
        : reviews.filter((r) => r.daysAgo >= start);
    const point = { label: bucketTick(bucket, index), total: rows.length };
    SOURCES.forEach((source) => {
      point[source.id] = rows.filter((r) => r.source === source.id).length;
    });
    points.push(point);
  }
  return points;
}

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
  const rand = mulberry32(20260816);
  const pool = [];
  Object.entries(STAR_MIX).forEach(([bucket, n]) => {
    for (let i = 0; i < n; i += 1) pool.push(bucket);
  });
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const reviews = [];
  let cursor = 0;
  SOURCES.forEach((source) => {
    if (source.stars) {
      for (let i = 0; i < source.stars; i += 1) {
        reviews.push({ source: source.id, bucket: pool[cursor] });
        cursor += 1;
      }
    } else {
      for (let i = 0; i < source.up; i += 1) reviews.push({ source: source.id, bucket: "up" });
      for (let i = 0; i < source.down; i += 1) reviews.push({ source: source.id, bucket: "down" });
    }
  });

  return reviews.map((review) => ({
    ...review,
    daysAgo: Math.floor(SEED_SPAN_DAYS * Math.pow(rand(), 1.3)),
  }));
}

// ── Donut grouping rules ────────────────────────────────────────────
// A donut stops being readable somewhere around five slices, and this data
// is heavily skewed (Google alone is roughly three quarters), so the tail
// renders as hairlines nobody can compare. Up to 14 directories can be
// monitored, so the tail is the normal case, not the exception.
//
// THE RULES, in order:
//   1. Zero-count sources never appear. They are listed separately as
//      monitored-with-no-reviews.
//   2. Five or fewer sources with reviews: show them all, named. There is
//      nothing to tidy, and grouping here would hide a real source for no
//      readability gain.
//   3. More than five: name at most MAX_SLICES by count, and additionally
//      fold anything under MIN_SHARE of the total into Other, even if it
//      would have made the top five. A rank cap alone buckets a healthy
//      source for placing sixth; a threshold alone can still leave nine
//      slices. Both, whichever bites first.
//   4. Other is always last, whatever its size, and takes a NEUTRAL colour.
//      It is not a directory, and a chart hue would let it compete with
//      one.
//   5. Nothing is hidden. The legend beside the donut lists every source
//      with its exact count, and the table view is the full breakdown. The
//      grouping tidies the GRAPHIC, not the data.
//
// MAX_SLICES is 5 because the DS defines exactly --chart-1..5. It is a
// palette ceiling, not a taste call.
const MAX_SLICES = 5;
const MIN_SHARE = 0.02;
const SLICE_COLOURS = [
  "var(--chart-1, var(--chart-1-light))",
  "var(--chart-2, var(--chart-2-light))",
  "var(--chart-3, var(--chart-3-light))",
  "var(--chart-4)",
  "var(--chart-5, var(--chart-5-light))",
];
const OTHER_COLOUR = "var(--muted-foreground)";
const OTHER_ID = "__other";

function groupSources(activeSources, bySource) {
  const withCounts = activeSources
    .map((source) => ({ id: source.id, name: source.name, value: bySource[source.id] ?? 0 }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);

  const total = withCounts.reduce((n, row) => n + row.value, 0);
  const keepAll = withCounts.length <= MAX_SLICES;
  const named = keepAll
    ? withCounts
    : withCounts
        .slice(0, MAX_SLICES)
        .filter((row) => total === 0 || row.value / total >= MIN_SHARE);

  const namedIds = new Set(named.map((row) => row.id));
  const grouped = withCounts.filter((row) => !namedIds.has(row.id));
  const otherValue = grouped.reduce((n, row) => n + row.value, 0);

  // Colour follows RANK, not identity, so the palette is never exceeded and
  // the top slice is always --chart-1. A grouped source takes the Other
  // colour everywhere it appears, including its legend swatch, so the
  // legend never shows a hue the chart does not use.
  // Every active source gets an entry, including the zero-count ones that
  // never reach the donut, so every CONSUMER can do a bare `colourById[id]`
  // lookup. That is not tidiness: the sandbox's injectSourceIds is a regex
  // scanner, and a function CALL inside a JSX attribute
  // (style={{ background: colourOf[source.id] }}) throws it off badly
  // enough to corrupt the tag and fail the whole screen to compile
  // (27 Aug). A property access is the same shape as the `source.colour`
  // this replaced, and is safe.
  const colourById = {};
  activeSources.forEach((source) => {
    colourById[source.id] = OTHER_COLOUR;
  });
  named.forEach((row, i) => {
    colourById[row.id] = SLICE_COLOURS[i % SLICE_COLOURS.length];
  });
  grouped.forEach((row) => {
    colourById[row.id] = OTHER_COLOUR;
  });

  const slices = named.map((row) => ({ ...row, colour: colourById[row.id] }));
  if (otherValue > 0) {
    slices.push({ id: OTHER_ID, name: "Other", value: otherValue, colour: OTHER_COLOUR });
  }
  return { slices, named, grouped, otherValue, colourById, total };
}

function tally(reviews) {
  const byBucket = {};
  const bySource = {};
  BUCKETS.forEach((bucket) => {
    byBucket[bucket.id] = 0;
  });
  SOURCES.forEach((source) => {
    bySource[source.id] = 0;
  });
  reviews.forEach((review) => {
    byBucket[review.bucket] += 1;
    bySource[review.source] += 1;
  });
  return { byBucket, bySource };
}

// Chart/table switch. The guard in onValueChange is load-bearing: Radix's
// single-select group lets you deselect the ACTIVE item, which would hand
// back "" and blank the card body.
function ViewToggle({ view, onChange, idPrefix }) {
  return (
    <>
      <div className="bg-border mx-1 h-6 w-px" />
      <ToggleGroup
        type="single"
        value={view}
        onValueChange={(next) => {
          if (next) onChange(next);
        }}
        variant="outline"
        size="sm"
        dataHook={`${idPrefix}-view-toggle`}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              value="chart"
              ariaLabel="Chart view"
              dataHook={`${idPrefix}-chart-view`}
            >
              <ChartColumn />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent dataHook={`${idPrefix}-chart-view-tooltip`}>Chart</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              value="table"
              ariaLabel="Table view"
              dataHook={`${idPrefix}-table-view`}
            >
              <Table2 />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent dataHook={`${idPrefix}-table-view-tooltip`}>Table</TooltipContent>
        </Tooltip>
      </ToggleGroup>
    </>
  );
}

const bucketLeading = (bucket) => {
  if (bucket.kind === "star")
    return <Rating value={Number(bucket.id)} dataHook={`bucket-stars-${bucket.id}`} />;
  if (bucket.kind === "up") return <ThumbsUp className="text-muted-foreground size-3.5" />;
  return <ThumbsDown className="text-muted-foreground size-3.5" />;
};

/* ---------------------------- review performance -------------------------- */

function ReviewPerformance() {
  const reviews = useMemo(buildReviews, []);
  const [period, setPeriod] = useState("all");
  const [sources, setSources] = useState(SOURCES.map((source) => source.id));
  const [buckets, setBuckets] = useState(BUCKETS.map((bucket) => bucket.id));
  const [view, setView] = useState("chart");
  const [menu, setMenu] = useState(null);

  const periodOption = PERIODS.find((option) => option.id === period);
  const inPeriod = useMemo(
    () => reviews.filter((review) => matchesPeriod(periodOption, review.daysAgo)),
    [reviews, periodOption],
  );
  const visible = useMemo(
    () =>
      inPeriod.filter(
        (review) => sources.includes(review.source) && buckets.includes(review.bucket),
      ),
    [inPeriod, sources, buckets],
  );

  const { byBucket, bySource } = useMemo(() => tally(visible), [visible]);
  const sourceMenuCounts = useMemo(
    () => tally(inPeriod.filter((review) => buckets.includes(review.bucket))).bySource,
    [inPeriod, buckets],
  );
  const bucketMenuCounts = useMemo(
    () => tally(inPeriod.filter((review) => sources.includes(review.source))).byBucket,
    [inPeriod, sources],
  );

  const total = visible.length;
  const starSum = visible.reduce(
    (sum, review) => (Number(review.bucket) ? sum + Number(review.bucket) : sum),
    0,
  );
  const starCount = visible.filter((review) => Number(review.bucket)).length;
  const average = starCount ? (starSum / starCount).toFixed(1) : "0.0";

  const activeBuckets = BUCKETS.filter((bucket) => buckets.includes(bucket.id));
  const peak = Math.max(1, ...activeBuckets.map((bucket) => byBucket[bucket.id]));
  const activeSources = SOURCES.filter((source) => sources.includes(source.id));
  // ONE derivation, feeding the donut, the legend swatches, the filter
  // menu and the source timeline. Two charts disagreeing about which
  // sources are named would be worse than either grouping on its own.
  const grouping = groupSources(activeSources, bySource);
  // Named slices plus the ones folded into Other: the number of places
  // these reviews actually came from.
  const sourceCount = grouping.named.length + grouping.grouped.length;
  const donut = grouping.slices;
  const sourceColour = (id) => grouping.colourById[id] ?? OTHER_COLOUR;
  const colourOf = grouping.colourById;
  const groupedIds = grouping.grouped.map((row) => row.id);
  // Built here, not inline in the JSX: see the note at the <p> that renders
  // it. Single-line concatenation, no multi-line template.
  // Just the grouping rule. The "Top N shown separately" half was saying
  // what the legend directly above it already shows (Ali, 27 Aug).
  const groupingNote =
    grouping.grouped.length +
    (grouping.grouped.length === 1 ? " source" : " sources") +
    " under " +
    Math.round(MIN_SHARE * 100) +
    "% of the total are grouped as Other.";

  const periodLabel = PERIODS.find((option) => option.id === period).label;
  const sourceLabel =
    sources.length === SOURCES.length
      ? "All sources"
      : sources.length === 1
        ? SOURCES.find((source) => source.id === sources[0]).name
        : `${sources.length} sources`;
  const ratingLabel =
    buckets.length === BUCKETS.length
      ? "All ratings"
      : buckets.length === 1
        ? BUCKETS.find((bucket) => bucket.id === buckets[0]).label
        : `${buckets.length} ratings`;

  const toggle = (list, setList, id) =>
    setList(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  const openMenu = (id) => setMenu(menu === id ? null : id);

  const chartConfig = Object.fromEntries(
    SOURCES.map((source) => [source.id, { label: source.name, color: sourceColour(source.id) }]).concat([
      [OTHER_ID, { label: "Other", color: OTHER_COLOUR }],
    ]),
  );

  const glyph = (bucket) => {
    if (bucket.kind === "up") return <ThumbsUp className="text-muted-foreground size-3.5" />;
    if (bucket.kind === "down") return <ThumbsDown className="text-muted-foreground size-3.5" />;
    return (
      <>
        <span className="text-sm">{bucket.id}</span>
        <Star className="text-muted-foreground size-3.5 fill-current" />
      </>
    );
  };

  return (
    <Card dataHook="review-performance" density="condensed" className="max-w-none">
      <CardHeader className={STICKY_HEADER} style={STICKY_HEADER_STYLE}>
        <div className="flex flex-wrap items-center justify-between gap-5">
          <CardTitle size="small" dataHook="performance-title">Review Performance</CardTitle>

          <div className="flex flex-wrap items-center gap-1.5">
            <FacetedFilterMenu
              label={sourceLabel}
              open={menu === "sources"}
              onOpenChange={() => openMenu("sources")}
              options={SOURCES.map((source) => ({
                id: source.id,
                label: source.name,
                count: sourceMenuCounts[source.id],
                // BRAND MARKS, NOT CHART SWATCHES (Ali, 7 Sep: "these dropdowns
                // have horrible coloured blocks, they should match Review
                // Manager and be icons"). The colours belong to the donut,
                // where they map a slice to a legend row; in a source list
                // they were decoration standing in for the thing itself.
                // Review Manager is the defacto model, so this now reads from
                // the same @brightlocal/review-sources map it does.
                leading: <SourceMark source={source.id} />,
              }))}
              isAllSelected={sources.length === SOURCES.length}
              isChecked={(id) => sources.includes(id)}
              onAll={() =>
                setSources(
                  sources.length === SOURCES.length ? [] : SOURCES.map((source) => source.id),
                )
              }
              onOption={(id) => toggle(sources, setSources, id)}
              allLabel="All sources"
              allCount={inPeriod.length}
              search
              searchPlaceholder="Find a source"
              panelWidth="w-72"
              align="right"
              dataHook="facet-perf-sources"
            />

            <FacetedFilterMenu
              label={ratingLabel}
              open={menu === "ratings"}
              onOpenChange={() => openMenu("ratings")}
              options={BUCKETS.map((bucket) => ({
                id: bucket.id,
                label: bucket.label,
                count: bucketMenuCounts[bucket.id],
                leading: bucketLeading(bucket),
              }))}
              isAllSelected={buckets.length === BUCKETS.length}
              isChecked={(id) => buckets.includes(id)}
              onAll={() =>
                setBuckets(
                  buckets.length === BUCKETS.length ? [] : BUCKETS.map((bucket) => bucket.id),
                )
              }
              onOption={(id) => toggle(buckets, setBuckets, id)}
              allLabel="All ratings"
              allCount={inPeriod.filter((review) => sources.includes(review.source)).length}
              panelWidth="w-72"
              align="right"
              dataHook="facet-perf-ratings"
            />

            <SingleSelectMenu
              dataHook="facet-period"
              label={periodLabel}
              open={menu === "period"}
              onOpenChange={() => openMenu("period")}
              options={PERIODS}
              value={period}
              onSelect={(id) => {
                setPeriod(id);
                setMenu(null);
              }}
            />

            <ViewToggle view={view} onChange={setView} idPrefix="perf" />
          </div>
        </div>
      </CardHeader>

      {/* pt-0, not pt-4: the sticky header ends in pb-2 and the card's own
          row-gap already puts 12px under it, so a content pt-4 was a third
          helping of the same space, 40px of dead air under a pinned header
          (Ali, 18 Aug: "those card headers are still getting some extra bottom
          margin somewhere"). The gap belongs to the card, once. */}
      {/* py-6 TO MATCH px-6 (Ali, 3 Sep: "I'd actually give the content in
          both cards py-6 to match the px-6, just for the content — I think
          it needs a bit more room"). Note this reopens the 18 Aug pt-0 call
          deliberately: that existed because a pt-4 landed on top of the
          card's own row-gap and made 40px of dead air under a pinned header.
          pt-2 pb-6 is the settlement: the bottom gets the room Ali asked
          for, the top keeps the tight offset the sticky header needs,
          because the space above the content is already being paid for by
          the header's own pb-2 plus the card's row-gap. Symmetry would be
          wrong here — the two edges are not doing the same job. */}
      <CardContent className="px-6 pt-2 pb-6">
        {/* A BIGGER GAP BETWEEN THE HALVES (Ali, 3 Sep: "on the top card
            with the bar charts and the donut chart, I'd say a larger gap
            between them"). 32px was not enough to separate two charts that
            share no axis and no scale: the bars' value labels ended up close
            enough to the donut to read as part of it. 56px from lg, where
            the two sit side by side; below lg they stack and 32px is right,
            because a vertical gap between stacked blocks does different work
            from a horizontal one between columns. */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-14">
          <div className="min-w-0 flex-1">
            {/* THE SUMMARY SITS WITH WHAT IT SUMMARISES (Ali, 3 Sep: "the
                Ratings title and the Sources title could have the average
                rating next to them, thus removing them from the bottom of
                this card"). It was one line under both halves, which made
                the reader carry a number back up the card to the half it
                belonged to — and the average describes the ratings
                distribution ONLY, not the source split it was sitting under.
                Both stay reactive to the filters: they are derived from
                `visible`, the same filtered set the bars are. */}
            <p className="mb-3 flex items-baseline gap-2 text-sm font-medium">
              Ratings
              <span className="text-muted-foreground font-normal" data-hook="ratings-summary">
                {average} average
              </span>
            </p>
            {view === "chart" ? (
              <div className="flex flex-col gap-2">
                {activeBuckets.map((bucket, i) => (
                  <Fragment key={bucket.id}>
                  {/* SAY WHOSE THUMBS THESE ARE (Ali, 7 Sep: "we need to add a
                      title above the thumbs up down to show its facebook
                      related"). The list ran 5 star down to 1 star and then two
                      thumb rows with nothing between them, so 106 and 14 read
                      as a sixth and seventh rating on the same scale. They are
                      not: Facebook has no stars, it has recommendations, which
                      is why they cannot be added to the star distribution or
                      averaged with it.
                      The heading appears at the FIRST non-star row rather than
                      at a fixed index, so filtering the star rows away does not
                      leave it stranded or drop it. Review Manager's rating
                      menu already groups them this way; this is the same
                      grouping in the chart. */}
                  {bucket.kind !== "star" && activeBuckets[i - 1]?.kind === "star" ? (
                    <p
                      // No brand mark (Ali, 7 Sep: "drop the facebook icon on
                      // here, just the subtitle is fine"). The word does the job.
                      className="text-muted-foreground mt-2 text-xs font-medium"
                      data-hook="ratings-facebook-heading"
                    >
                      Facebook recommendations
                    </p>
                  ) : null}
                  <div className="flex items-center gap-3">
                    {/* LEFT-ALIGNED, every row (Ali, 7 Sep: first the thumbs
                        read as indented, then "stars rating are also
                        indented?"). Right-aligning the label column pushed
                        "5 ★" in from the card edge; the labels are all one
                        digit or one glyph wide, so nothing needs the column
                        to right-align. Flush with the Ratings heading. */}
                    <span className="flex w-9 shrink-0 items-center justify-start gap-1">
                      {glyph(bucket)}
                    </span>
                    {/* h-2 is the DS default; the h-4 here was an override I
                        added and it made a magnitude bar heavier than the
                        number beside it (Ali, 28 Aug: "a bit overkill in
                        their saturation, and also maybe a bit too fat").
                        indicatorClassName moves the fill off the neon band of
                        the ramp. green-400 IS --primary (#2ae855) and 300 is
                        brighter still (#59f77d); 600 (#03a829) is the first
                        step that stops shouting while keeping a one-review bar
                        visible, which a pale 200 would not. These bars count
                        reviews, they do not report good or bad, so
                        full-strength brand green was claiming a meaning the
                        data does not carry. A ramp step, not an opacity mix,
                        per the house rule on colour. */}
                    <Progress
                      dataHook={`rating-bar-${bucket.id}`}
                      value={byBucket[bucket.id]}
                      max={peak}
                      color="green"
                      indicatorClassName="bg-green-600"
                      ariaLabel={`${byBucket[bucket.id]} reviews`}
                      className="h-2 flex-1"
                    />
                    <span className="w-10 shrink-0 text-right text-sm tabular-nums">
                      {byBucket[bucket.id]}
                    </span>
                  </div>
                  </Fragment>
                ))}
              </div>
            ) : (
              <Table dataHook="ratings-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Rating</TableHead>
                    <TableHead align="right">Reviews</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeBuckets.map((bucket) => (
                    <TableRow key={bucket.id}>
                      <TableCell>{bucket.label}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {byBucket[bucket.id]}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-medium">Total</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{total.toLocaleString("en-GB")}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </div>

          <div className="min-w-0 flex-1">
            {/* "7 sources", NOT "254 reviews". The donut's own centre
                already reads 254 reviews, and putting the same number a
                hundred pixels to its left is the kind of duplication that
                reads as a bug. The count of sources is the fact this half
                carries that is not already on screen.
                EVERY source with reviews, including the ones folded into
                Other (Ali, 3 Sep). It counted only the named slices, so a
                location collecting reviews on seven sites was told it had
                four — the grouping is a drawing decision about the donut,
                not a claim about where the reviews came from. */}
            <p className="mb-3 flex items-baseline gap-2 text-sm font-medium">
              Sources
              <span className="text-muted-foreground font-normal" data-hook="sources-summary">
                {sourceCount} {sourceCount === 1 ? "source" : "sources"}
              </span>
            </p>
            {view === "chart" ? (
              <div className="flex flex-wrap items-center gap-8">
                <div className="relative size-[190px] shrink-0">
                  <ChartContainer
                    config={chartConfig}
                    dataHook="sources-donut"
                    width="100%"
                    height="100%"
                    className="aspect-square"
                  >
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Pie
                        data={donut}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={92}
                        paddingAngle={1}
                        isAnimationActive={false}
                      >
                        {donut.map((slice) => (
                          <Cell key={slice.name} fill={slice.colour} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-semibold tabular-nums">{total.toLocaleString("en-GB")}</span>
                    <span className="text-muted-foreground text-xs">reviews</span>
                  </div>
                </div>
                <div className="flex min-w-[180px] flex-1 flex-col gap-2">
                  {/* THE LEGEND IS THE FULL LIST, not a key to the arcs.
                      At this skew the arcs cannot be compared by eye, so
                      the numbers here are what people actually read. Every
                      source with reviews is listed at its real count,
                      including the ones folded into Other, which is why
                      grouping the graphic hides nothing. Grouped rows carry
                      the Other swatch so the legend never shows a colour
                      the donut does not use. */}
                  {grouping.named.map((row) => (
                    <div key={row.id} className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-[2px]"
                          style={{ background: colourOf[row.id] }}
                        />
                        <span className="text-sm">{row.name}</span>
                      </span>
                      <span className="text-muted-foreground text-sm tabular-nums">
                        {row.value}
                      </span>
                    </div>
                  ))}

                  {grouping.grouped.length > 0 ? (
                    <>
                      {/* Members on HOVER, not as a permanent indented list
                          (Ali, 27 Aug). The list was three more rows of
                          legend for 3% of the reviews, which gave the
                          smallest sources the most vertical space on the
                          card. The tooltip keeps the answer to "which ones?"
                          one gesture away instead of always on screen.
                          The trigger is a real <button>, so this is reachable
                          by keyboard as well as mouse; Radix opens the
                          tooltip on focus. Nothing depends on hover alone
                          either way, because the table view beside the chart
                          lists every source at full count. */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            data-hook="sources-other-row"
                            className="flex w-full cursor-help items-center justify-between gap-4 rounded-sm text-left"
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className="size-2.5 rounded-[2px]"
                                style={{ background: OTHER_COLOUR }}
                              />
                              <span className="text-sm font-medium underline decoration-dotted underline-offset-4">
                                Other
                              </span>
                            </span>
                            <span className="text-muted-foreground text-sm tabular-nums">
                              {grouping.otherValue}
                            </span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent dataHook="sources-other-tooltip" side="left">
                          <span className="flex flex-col gap-1">
                            {grouping.grouped.map((row) => (
                              <span key={row.id} className="flex items-center justify-between gap-4">
                                <span>{row.name}</span>
                                <span className="tabular-nums">{row.value}</span>
                              </span>
                            ))}
                          </span>
                        </TooltipContent>
                      </Tooltip>
                      <p
                        className="text-muted-foreground mt-1 text-xs"
                        data-hook="sources-grouping-note"
                      >
                        {groupingNote}
                      </p>
                    </>
                  ) : null}
                </div>
              </div>
            ) : (
              <Table dataHook="sources-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead align="right">Reviews</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeSources.map((source) => (
                    <TableRow key={source.id}>
                      <TableCell>{source.name}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {bySource[source.id]}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-medium">Total</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{total.toLocaleString("en-GB")}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </CardContent>

    </Card>
  );
}

/* -------------------------------- timeline -------------------------------- */

// The two timeline graphs were never independent, they only LOOKED it: one
// `offset` in ReviewTimeline drove one `series`, and the old two-in-one header
// was rendered twice with the same range and the same panBack/panForward
// handlers. So there were two identical controls over one window, and clicking
// either moved both charts. That is what "weirdly linked" was (Ali, 18 Aug).
//
// Split in two now: PanTitle just names its graph, and ONE TimelinePeriodBar
// owns the window for both, on its own row.
function PanTitle({ title }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm font-medium">{title}</p>
    </div>
  );
}

// The period control as its OWN row (Ali, 18 Aug: "move the arrows and months
// into its own row, similar to what we have in the inbox. This pagination
// should work for BOTH timeline graphs"). Deliberately shaped like the Review
// Inbox's pagination bar: a bordered bar, the bucket menu and the count
// summary on the left, the range and the step arrows on the right. It bleeds to the card edges with
// -mx-4 so it reads as a bar across the card rather than a floating row inside
// the padded content, which is how the inbox's reads.
function TimelinePeriodBar({
  // The bucket menu ("Monthly"), rendered LEADING the summary it governs
  // (Ali, 18 Aug: it "essentially is display rather than filter"). It sits
  // here rather than in the header row because this bar is the DISPLAY row:
  // bucket, then what that bucket yields ("Showing 12 of 37 months"), then
  // the window you are looking at. The header row above stays filters only
  // — including scope, which reads like a display control and is not one
  // ("All reviews is a filter, not a period", Ali).
  //
  // Passed as a NODE, not as value+onChange: the menu's open state and the
  // offset reset it triggers live with the rest of the card's state at the
  // call site, and threading four more props through here to rebuild it
  // would buy nothing.
  bucketControl,
  range,
  shown,
  total,
  unit,
  onBack,
  onForward,
  canBack,
  canForward,
}) {
  return (
    // Rendered INSIDE the sticky CardHeader, as its second row (Ali, 18 Aug:
    // "these need to be sticky together. In the Review inbox we did this so the
    // filters and the pagination are sticky"). Same shape as the inbox, which
    // wraps its tabs, filters and pagination in ONE sticky element so they pin
    // as a unit instead of sliding past each other.
    //
    // border-t, not border-b: the divider between this row and the filter row
    // above it. The sticky header's own border-b is the bottom edge of the
    // whole unit, so a border-b here would double it up. -mx-6 with px-6 back
    // on bleeds the row to the card's edges, so it reads as a bar across the
    // card rather than a floating row inside the padding.
    //
    // THIS BAND LIVES INSIDE THE CardHeader, which is the thing to hold onto
    // when touching it (Ali, 7 Sep: "too much padding at the bottom, whats
    // going wrong over there").
    // Two traps, both hit today:
    //   1. CardHeader already draws its own border-b. Give the band a border
    //      as well and you get a rule above it AND below it: the double line.
    //      It needs spacing, not a second divider.
    //   2. CardHeader already applies pb-4. Give the band py-4 and the bottom
    //      padding is applied TWICE, 32px under the last row, which is why
    //      this header stood 125px tall against Review Performance's 49.
    // So: pt-4 only. The top spacing is the band's because the header grid
    // sets rowGap 0; the bottom is the header's, as it is on every other card.
    <div
      data-hook="timeline-period-bar"
      className="-mx-6 flex flex-wrap items-center gap-2 px-6 pt-4"
    >
      {bucketControl}
      <span
        className="text-muted-foreground text-sm tabular-nums"
        data-hook="timeline-period-summary"
        role="status"
      >
        Showing {shown.toLocaleString("en-GB")} of {total.toLocaleString("en-GB")} {unit}
      </span>
      <div className="grow" />
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          iconOnly
          size="sm"
          dataHook="timeline-pan-back"
          onClick={onBack}
          disabled={!canBack}
          ariaLabel="Earlier"
        >
          <ChevronLeft className="size-4" />
        </Button>
        {/* min-w so the arrows do not shift as the label changes width while
            you pan, but sized to the WIDEST label the four buckets can
            actually produce, which measures 118.9px in this face and size
            ("28 Sept – 21 Sept" and "Sept 25 – Sept 26" tie for it). It was
            130, so every label floated in up to 15px of dead space and the
            arrows read as pushed away from it (Ali, 18 Aug: the pagination
            gap "seems a little large"). 120 holds every case with nothing
            to spare. */}
        <span className="text-muted-foreground min-w-[120px] text-center text-sm tabular-nums">
          {range}
        </span>
        <Button
          variant="ghost"
          iconOnly
          size="sm"
          dataHook="timeline-pan-forward"
          onClick={onForward}
          disabled={!canForward}
          ariaLabel="Later"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function ReviewTimeline() {
  const reviews = useMemo(buildReviews, []);
  const [scope, setScope] = useState("all");
  const [bucketId, setBucketId] = useState("monthly");
  const [sources, setSources] = useState(SOURCES.map((source) => source.id));
  const [ratings, setRatings] = useState(BUCKETS.map((bucket) => bucket.id));
  const [offset, setOffset] = useState(0);
  const [view, setView] = useState("chart");
  const [menu, setMenu] = useState(null);

  const bucket = TIME_BUCKETS.find((option) => option.id === bucketId);

  const filtered = useMemo(
    () =>
      reviews.filter(
        (review) => sources.includes(review.source) && ratings.includes(review.bucket),
      ),
    [reviews, sources, ratings],
  );

  const series = useMemo(
    () => buildSeries(filtered, bucket, offset, scope),
    [filtered, bucket, offset, scope],
  );

  const maxOffset = Math.max(0, Math.ceil(SEED_SPAN_DAYS / bucket.span) - bucket.window);
  // The pagination analogue for the bar: how much of the seeded span the
  // current window covers. Floored at series.length so it can never read
  // "showing 12 of 8".
  const totalPeriods = Math.max(series.length, Math.ceil(SEED_SPAN_DAYS / bucket.span));
  const periodUnit =
    bucket.id === "yearly"
      ? "years"
      : bucket.id === "quarterly"
        ? "quarters"
        : bucket.id === "weekly"
          ? "weeks"
          : "months";
  const range = series.length ? `${series[0].label} to ${series[series.length - 1].label}` : "";

  const activeSources = SOURCES.filter((source) => sources.includes(source.id));
  // The stacked bar has the SAME problem as the donut and the same fix: one
  // series per source runs out of chart tokens at six, and the tail stacks
  // into slivers a pixel high. Grouped from the same helper so the two
  // charts on this page never disagree about which sources are named
  // (Ali, 27 Aug: "we'd have to have other in the timeline chart as well").
  // Counts come from the FILTERED set, so grouping follows the facets.
  const timelineCounts = useMemo(() => tally(filtered).bySource, [filtered]);
  const grouping = groupSources(activeSources, timelineCounts);
  const sourceColour = (id) => grouping.colourById[id] ?? OTHER_COLOUR;
  const colourOf = grouping.colourById;
  const groupedKey = grouping.grouped.map((row) => row.id).join(",");
  // One extra stacked series holding every grouped source, added to the
  // points buildSeries already produced rather than taught to buildSeries,
  // which has no idea what is named on any given render.
  const seriesWithOther = useMemo(() => {
    const ids = groupedKey ? groupedKey.split(",") : [];
    return series.map((point) => ({
      ...point,
      [OTHER_ID]: ids.reduce((n, id) => n + (point[id] ?? 0), 0),
    }));
  }, [series, groupedKey]);
  const chartConfig = Object.fromEntries(
    SOURCES.map((source) => [source.id, { label: source.name, color: sourceColour(source.id) }]).concat([
      ["total", { label: "Reviews", color: "var(--chart-1, var(--chart-1-light))" }],
      [OTHER_ID, { label: "Other", color: OTHER_COLOUR }],
    ]),
  );

  const scopeLabel = TIMELINE_SCOPES.find((option) => option.id === scope).label;
  const sourceLabel =
    sources.length === SOURCES.length
      ? "All sources"
      : sources.length === 1
        ? SOURCES.find((source) => source.id === sources[0]).name
        : `${sources.length} sources`;
  const ratingLabel =
    ratings.length === BUCKETS.length
      ? "All ratings"
      : ratings.length === 1
        ? BUCKETS.find((b) => b.id === ratings[0]).label
        : `${ratings.length} ratings`;

  const toggle = (list, setList, id) =>
    setList(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  const openMenu = (id) => setMenu(menu === id ? null : id);

  const panBack = () => setOffset((o) => Math.min(maxOffset, o + 1));
  const panForward = () => setOffset((o) => Math.max(0, o - 1));

  // Cumulative fits the axis to the data; per-bucket counts stay zero-based.
  const lineDomain = scope === "all" ? ["dataMin", "dataMax"] : [0, "dataMax"];

  return (
    <Card dataHook="review-timeline" density="condensed" className="max-w-none">
      <CardHeader className={STICKY_HEADER} style={STICKY_HEADER_STYLE}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle size="small" dataHook="timeline-title">Timeline</CardTitle>

          <div className="flex flex-wrap items-center gap-1.5">
            <FacetedFilterMenu
              label={sourceLabel}
              open={menu === "sources"}
              onOpenChange={() => openMenu("sources")}
              options={SOURCES.map((source) => ({
                id: source.id,
                label: source.name,
                leading: <SourceMark source={source.id} />,
              }))}
              isAllSelected={sources.length === SOURCES.length}
              isChecked={(id) => sources.includes(id)}
              onAll={() =>
                setSources(
                  sources.length === SOURCES.length ? [] : SOURCES.map((source) => source.id),
                )
              }
              onOption={(id) => toggle(sources, setSources, id)}
              allLabel="All sources"
              search
              searchPlaceholder="Find a source"
              panelWidth="w-72"
              align="right"
              dataHook="facet-time-sources"
            />

            <FacetedFilterMenu
              label={ratingLabel}
              open={menu === "ratings"}
              onOpenChange={() => openMenu("ratings")}
              options={BUCKETS.map((b) => ({
                id: b.id,
                label: b.label,
                leading: bucketLeading(b),
              }))}
              isAllSelected={ratings.length === BUCKETS.length}
              isChecked={(id) => ratings.includes(id)}
              onAll={() =>
                setRatings(ratings.length === BUCKETS.length ? [] : BUCKETS.map((b) => b.id))
              }
              onOption={(id) => toggle(ratings, setRatings, id)}
              allLabel="All ratings"
              panelWidth="w-72"
              align="right"
              dataHook="facet-time-ratings"
            />

            <SingleSelectMenu
              dataHook="facet-scope"
              label={scopeLabel}
              open={menu === "scope"}
              onOpenChange={() => openMenu("scope")}
              options={TIMELINE_SCOPES}
              value={scope}
              onSelect={(id) => {
                setScope(id);
                setMenu(null);
              }}
            />

            <ViewToggle view={view} onChange={setView} idPrefix="time" />
          </div>
        </div>

        {/* ONE window control for BOTH graphs, and it lives in the sticky
            header so it stays reachable while you scroll the charts, exactly
            like the inbox's pagination row. */}
        <TimelinePeriodBar
          bucketControl={
            <SingleSelectMenu
              dataHook="facet-bucket"
              label={bucket.label}
              open={menu === "bucket"}
              onOpenChange={() => openMenu("bucket")}
              options={TIME_BUCKETS}
              value={bucketId}
              onSelect={(id) => {
                setBucketId(id);
                setOffset(0);
                setMenu(null);
              }}
            />
          }
          range={range}
          shown={series.length}
          total={totalPeriods}
          unit={periodUnit}
          onBack={panBack}
          onForward={panForward}
          canBack={offset < maxOffset}
          canForward={offset > 0}
        />
      </CardHeader>

      {/* pt-0, not pt-4: the sticky header ends in pb-2 and the card's own
          row-gap already puts 12px under it, so a content pt-4 was a third
          helping of the same space, 40px of dead air under a pinned header
          (Ali, 18 Aug: "those card headers are still getting some extra bottom
          margin somewhere"). The gap belongs to the card, once. */}
      <CardContent className="flex flex-col gap-6 px-6 pt-2 pb-6">
        <div>
          <PanTitle title="Review timeline" />
          {view === "chart" ? (
            // Fixed-height WRAPPER per the DS chart rule; aspect-auto displaces
            // ChartContainer's baked aspect-video.
            <div className="h-64 w-full">
              <ChartContainer
                config={chartConfig}
                dataHook="review-timeline-chart"
                width="100%"
                height="100%"
                className="aspect-auto h-full w-full"
              >
                <LineChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis
                    // Separators here too, or the axis prints 1116 beside a
                    // donut centre reading 1,116 (6 Sep). Widened to fit the
                    // extra glyph without clipping the tick.
                    width={52}
                    domain={lineDomain}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(v) => Number(v).toLocaleString("en-GB")}
                  />
                  {/* TOOLTIP_ROW_GAP: the DS's tooltip row is
                      "flex flex-1 justify-between" with NO gap, so a long
                      series name touches its number ("Yahoo! Local17" —
                      Ali, 18 Aug). justify-between only spaces what is
                      left over, and at the widest label there is nothing
                      left over. Logged as a DS finding; this is the local
                      floor until it is fixed upstream. */}
                  <ChartTooltip
                    content={<ChartTooltipContent className={TOOLTIP_ROW_GAP} />}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="var(--chart-1, var(--chart-1-light))"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          ) : (
            <Table dataHook="review-timeline-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead align="right">Reviews</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {series.map((point) => (
                  <TableRow key={point.label}>
                    <TableCell>{point.label}</TableCell>
                    <TableCell className="text-right tabular-nums">{point.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <Separator dataHook="timeline-split" />

        <div>
          <PanTitle title="Source timeline" />
          {view === "chart" ? (
            <div className="h-64 w-full">
              <ChartContainer
                config={chartConfig}
                dataHook="source-timeline-chart"
                width="100%"
                height="100%"
                className="aspect-auto h-full w-full"
              >
                <BarChart data={seriesWithOther} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis
                    width={52}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(v) => Number(v).toLocaleString("en-GB")}
                  />
                  {/* TOOLTIP_ROW_GAP: the DS's tooltip row is
                      "flex flex-1 justify-between" with NO gap, so a long
                      series name touches its number ("Yahoo! Local17" —
                      Ali, 18 Aug). justify-between only spaces what is
                      left over, and at the widest label there is nothing
                      left over. Logged as a DS finding; this is the local
                      floor until it is fixed upstream. */}
                  <ChartTooltip
                    content={<ChartTooltipContent className={TOOLTIP_ROW_GAP} />}
                  />
                  {/* Series colour via Cell children — Bar has no `fill` in the
                      registry contracts. */}
                  {grouping.named.map((row) => (
                    <Bar
                      key={row.id}
                      dataKey={row.id}
                      stackId="sources"
                      isAnimationActive={false}
                    >
                      {seriesWithOther.map((point) => (
                        <Cell key={`${row.id}-${point.label}`} fill={colourOf[row.id]} />
                      ))}
                    </Bar>
                  ))}
                  {/* Other rides at the TOP of the stack, so the named
                      sources keep a common baseline across every bar and
                      stay comparable period to period. */}
                  {grouping.grouped.length > 0 ? (
                    <Bar
                      key={OTHER_ID}
                      dataKey={OTHER_ID}
                      stackId="sources"
                      isAnimationActive={false}
                    >
                      {seriesWithOther.map((point) => (
                        <Cell key={`other-${point.label}`} fill={OTHER_COLOUR} />
                      ))}
                    </Bar>
                  ) : null}
                </BarChart>
              </ChartContainer>
            </div>
          ) : (
            <Table dataHook="source-timeline-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  {activeSources.map((source) => (
                    <TableHead key={source.id} align="right">
                      {source.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {series.map((point) => (
                  <TableRow key={point.label}>
                    <TableCell>{point.label}</TableCell>
                    {activeSources.map((source) => (
                      <TableCell key={source.id} className="text-right tabular-nums">
                        {point[source.id]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// buildReviews is seeded, so one module-level call agrees with every card.
const HEADLINE_RATING = (() => {
  const stars = buildReviews().map((review) => Number(review.bucket)).filter(Boolean);
  return stars.length ? (stars.reduce((sum, n) => sum + n, 0) / stars.length).toFixed(1) : "0.0";
})();

export default function RMReviewTrackerPage() {
  // The Download dialog's open state. The only piece of state App itself
  // owns — everything else on this page is owned by the card that draws it.
  const [downloadOpen, setDownloadOpen] = useState(false);
  return (
    <TooltipProvider delayDuration={300}>
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
          dataHook="reviews-app-layout"
          sidebar={<ProposalSidebar dataHook="reviews-sidebar" activeId="reviews-insights" />}
          mobileBar={
            <div className="flex items-center gap-3 border-b px-4 py-3 lg:hidden">
              <SidebarTrigger>
                <Menu className="size-5" />
              </SidebarTrigger>
              <Logo className="h-5" dataHook="mobile-logo" />
            </div>
          }
          header={
            /* The "Last updated: 1 Jul 2026. Update now" line is GONE for now
               (Ali, 18 Aug: "get rid completely of the Last updated line for
               now, I need somewhere for this to sit properly"). It was riding
               the meta slot, which puts a data-freshness control inside the
               page title block, where it reads as part of the heading rather
               than as a control over the data below. Parked until it has a
               proper home: the likely one is beside the Timeline period
               control, next to the data it actually describes. PageHeader's
               dedicated lastUpdated slot is untouched and still used by the AI
               Insights pages. */
            <PageHeader
              dataHook="reviews-page-header"
              breadcrumbs={[
                { label: "All Locations", goto: "screen:dmrotrgstba3l" },
                { bind: "location", goto: "screen:dmrurue2wmp9u" },
                { label: "Reviews", goto: "screen:dmrotrhbcxk66" },
              ]}
              title="Review Tracker"
              // Rewritten 3 Sep (Ali: "that summary is not so insightful"). The old
              // line — "Charts and tables showing how customers rate this
              // location" — described the FURNITURE the page is built from
              // rather than what it is for. This names the three questions the
              // page answers, in the order the cards answer them. The Reviews
              // hub carries the same sentence verbatim, so changing one means
              // changing both.
              //
              // The third clause is gone (Ali, 3 Sep: "not needed, it is
              // fluff") — it named no object, so it would have fitted any
              // page in the tool, which is what made it fluff.
              // A NUMBER, NOT A SENTENCE (Ali, 7 Sep: "for each page header directly off
              // the hub page, our page description can be used to display some information
              // rather than yet more boring text"). The figure is read from the same data
              // the page renders, never typed in, so it moves when the data does.
              // All time, all sources: the same star-only average the Ratings
              // card shows before any filter is applied.
              description={(
                <span data-hook="page-stat">
                  <span className="text-foreground font-medium tabular-nums">{HEADLINE_RATING}</span> average rating
                </span>
              )}
              // "auto" binds data.aiInsights.lastUpdated, so the line follows
              // a dataset switch instead of hardcoding a date into the screen.
              lastUpdated="auto"
              actions={
                <>
                  {/* No size: PageHeader sizes its own CTAs and its cluster
                      owns the wrap + gap.

                      THE SPAN IS LOad-BEARING. Button drops data-* on its
                      way to the DOM, so `data-grade-goto` on the Button
                      itself never reaches the element the navigation handler
                      looks for (it walks up from the click target with
                      closest('[data-grade-goto]')). The wrapper carries it
                      instead. Same trick as "New widget" on Review Showcase.

                      Settings USED TO BE A DEAD CONTROL — a button that
                      looked like the way to the report's configuration and
                      did nothing when pressed. It now goes to RM — Report
                      Settings (dmtkj124xagqa), which holds the schedule,
                      the monitored directories, the email alerts, the share
                      link and the run history: everything the RM Design
                      Brief lists under Monitor Reviews that had no home. */}
                  <span data-grade-goto="screen:dmtkj124xagqa">
                    <Button variant="outline" dataHook="insights-settings-button">
                      <Settings className="size-4" />
                      Settings
                    </Button>
                  </span>
                  {/* DOWNLOAD IS A DIALOG, NOT A DROPDOWN. A
                      DropdownMenuTrigger asChild around this Button crashed
                      the whole screen with "Primitive.button failed to slot
                      onto its children" (2 Sep) — the page rendered blank,
                      not just the button. The Review Builder campaign page had
                      already solved the same problem with a Dialog, which
                      also has room to say what each format is FOR, so this
                      matches it rather than inventing a second answer. */}
                  <Button
                    variant="outline"
                    dataHook="insights-download-button"
                    onClick={() => setDownloadOpen(true)}
                  >
                    <Download className="size-4" />
                    Download
                  </Button>
                </>
              }
            />
          }
        >
          {/* --rm-sticky-top: the page header's height, in ONE place — every
              sticky card header reads it. gap-4, NOT space-y-6: the DS body is
              already flex flex-col gap-6. */}
          <GlobalLayoutContentBody
            className="gap-4 pb-10"
            style={{ "--rm-sticky-top": STICKY_TOP }}
          >
            {/* CONNECT FACEBOOK BANNER: PULLED for now (Ali, 18 Aug: "get rid
                of the facebook connect banner for now it's getting in my way").
                Not a decision that it should not exist, so here is what it was
                and what it needs to be when it returns.

                The audit (§3.1.3) requires it: the Facebook API only returns
                reviews once the user has completed oAuth, so an unconnected
                account needs a call to action or its reviews silently never
                arrive. The audit proposes a blue bar "containing concise copy
                to make it clearer and less cluttered", noting "the brevity of
                the content".

                It was rebuilt to that spec immediately before being pulled, so
                restore this, do not restore the two-line original:

                  <AlertInfo
                    dataHook="connect-facebook-alert"
                    description="Connect Facebook to include its reviews here."
                    action={
                      <Button variant="ghost" size="sm" dataHook="connect-facebook-button">
                        Connect
                      </Button>
                    }
                  />

                Two things worth keeping from that pass: AlertInfo's whole API is
                title? / description / action? / dataHook, so there is no quieter
                variant, the only lever is saying less. And the action must not be
                `outline`: it paints a neutral border that clashes with the blue
                surface. Of the contract's variants (destructive / warning /
                outline / primary / secondary / ghost) ghost is the only one that
                adds neither a border nor a competing fill on a tinted bar. */}

            <ReviewPerformance />
            <ReviewTimeline />
          </GlobalLayoutContentBody>

          {/* PDF AND CSV ARE TWO DIFFERENT ASKS — a report you send someone,
              and data you work on — and the brief lists both under Monitor
              Reviews. A single Download button had to pick one silently, so
              it asks. Same shape as the Review Builder campaign page's dialog,
              deliberately: two downloads that behave differently on two
              pages of the same tool is a worse answer than one that repeats.
              Both actions sit in DialogClose, because choosing a format IS
              dismissing the question. */}
          <Dialog open={downloadOpen} onOpenChange={setDownloadOpen}>
            <DialogContent dataHook="download-content">
              <DialogHeader>
                <DialogTitle dataHook="download-title">Download</DialogTitle>
                <DialogDescription dataHook="download-desc">
                  PDF gives you a formatted report, with these charts, ready to send to a client.
                  CSV gives you every review as raw rows for a spreadsheet.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" dataHook="download-csv">
                    <Download className="size-4" /> Reviews as CSV
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="primary" dataHook="download-pdf">
                    <Download className="size-4" /> Report as PDF
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </AppLayoutShell>
      </SidebarProvider>
    </TooltipProvider>
  );
}