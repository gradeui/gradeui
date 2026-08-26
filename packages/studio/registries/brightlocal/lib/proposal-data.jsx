// @brightlocal/proposal-data — the proposal DATA SEAM: demo defaults,
// named datasets, the provider/hook pair, and the account list.
// Split out of proposal.jsx (18 Jul) for editability; the barrel
// (proposal.jsx) re-exports everything, so screens keep importing
// "@brightlocal/proposal". Shared import block is intentionally the
// full set — prune per-file at leisure, unused names cost nothing.
import * as React from "react";
import {
  Avatar,
  AvatarFallback,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  GlobalLayout,
  GlobalLayoutContent,
  GlobalLayoutContentHeader,
  GlobalLayoutSidebar,
  Logo,
  Sidebar,
  SidebarAccountDropdown,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuSubVariant,
  SidebarPopoverMenu,
  SidebarSwitcher,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  TypographyH2,
  TypographyH3,
  TypographyMuted,
} from "@brightlocal/ui-components";
import {
  BarChart3,
  Briefcase,
  Building,
  ChevronRight,
  Globe,
  Grid3x3,
  Info,
  Link,
  ListChecks,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  TrendingUp,
} from "@brightlocal/icons";
// Named datasets — generated from registries/brightlocal/lib/data/*.json
// (raw hand-editable JSON; filename = dataset name). Lib-to-lib import,
// resolved through the same libModules seam as this file itself.
import { DATASETS } from "@brightlocal/data";

export const PROPOSAL_ACCOUNTS = [
  { label: "Acme Local Agency", icon: <Building className="size-4" /> },
  { label: "Harbour & Co", icon: <Building className="size-4" /> },
  { label: "Northside Dental Group", icon: <Building className="size-4" /> },
];


// ─── Proposal data layer (lightweight data binding — Ali/Harry) ───────
// "You could just switch the data and it would be magic": ONE data
// object drives the interface. The context's DEFAULT value is the demo
// data below, so screens need zero setup — mount nothing and every
// component renders the Acme/Blackberry demo. To re-skin a whole screen
// (client name, location, metrics), wrap it once:
//
//   <ProposalDataProvider data={{ account: { label: "Harbour & Co" } }}>
//
// Partial objects deep-merge over the defaults (two levels — enough for
// this shape, cheap enough to read). Components resolve props first,
// then context: an explicit prop always wins, so per-instance overrides
// stay possible. This is deliberately NOT a fetching layer — it's a
// binding seam; real data arrives by swapping the object.

// ─── Dataset-derived locations ───────────────────────────────────────
// The All Locations grid LOOPS THROUGH THE DATASETS (Ali, 22 Jul): one
// entry per lib/data/*.json, so every dataset-backed location is
// clickable-with-data BY CONSTRUCTION and adding a dataset file adds a
// location. The entry carries `dataset: <name>` — LocationCard stashes
// it on click (see selectSessionDataset). Address "Town, POSTCODE"
// splits on the last comma.
function splitAddress(addr = "") {
  const i = addr.lastIndexOf(",");
  return i > 0
    ? { city: addr.slice(0, i).trim(), postcode: addr.slice(i + 1).trim() }
    : { city: addr, postcode: "" };
}
export function datasetLocations() {
  return Object.entries(DATASETS).map(([key, d]) => {
    const loc = d.location ?? {};
    return {
      id: key,
      name: loc.name,
      reference: loc.reference,
      ...splitAddress(loc.address),
      category: loc.category,
      phone: loc.phone,
      photo: loc.photo,
      status: loc.status,
      dataset: key,
    };
  });
}

export const PROPOSAL_DATA = {
  account: { label: "Acme Local Agency" },
  user: { name: "Joe Bloggs", meta: "Trial: 14 days left", initials: "JB" },
  // NAP discipline (Ali, 18 Jul): `name` is the NAME ONLY — address
  // and phone are separate fields. Breadcrumbs bind name; the header
  // meta composes name + address; never mash address into name.
  location: {
    name: "Blackberry Farm Park",
    address: "Lewes, BN8 6JD",
    phone: "01273 400 123",
    status: "Active",
    // Header rating chip (real summary page: "★ 5.0 (12 reviews)").
    rating: { value: 4.3, count: 128 },
  },
  // Tracked keywords — feed the Local Search Grid nav sub-items (via
  // buildProposalSections) and any keyword table/grid a screen renders.
  // Arrays replace WHOLESALE on merge, so a dataset swaps the whole
  // list (Harry's point: keywords should come from the JSON).
  keywords: [
    "campsite lewes",
    "holiday park east sussex",
    "family camping near me",
    "glamping south downs",
    "caravan park brighton",
  ],
  // Nav goto links BY ROW ID — per-project wiring, stable per project
  // but editable over time without touching the IA structure. Value:
  // screen name, or { goto, transition }. Applied by
  // buildProposalSections; authored per project via ProposalDataProvider
  // data or a dataset JSON.
  // ALL LOCATIONS (the account's location list — feeds the All
  // Locations page's LocationCard grid). Deliberately carries the
  // client's REAL dirty-data comedy from their live screenshot
  // (duplicate cafés categorised as dog walkers, a roofing company
  // that's a beach volleyball club) — great for demoing data-quality
  // stories. photo optional → the card's No-photo placeholder.
  locations: [
    // ONLY dataset-backed locations (Ali, 22 Jul): this is potentially
    // the first screen a client sees — every card must open a fully
    // populated hub. One entry per lib/data/*.json; to add a location,
    // add a dataset (the capture workflow: browse the live product and
    // scrape the location's data into a JSON, as with minus-one-studios).
    ...datasetLocations(),
  ],
  // DEFAULT nav wiring (nav model v2, 18 Jul): every top-level row
  // links to its landing screen out of the box — canonical names match
  // the "Top-Level Pages" tagged screens in the project. Per-project /
  // per-screen navLinks deep-merge OVER these, so overriding one row
  // never costs the rest.
  // GOTO BY ID (Ali, 18 Jul): "screen:<id>" pins the exact screen — ids
  // survive renames (a name-keyed link broke the day Local Search Grid
  // was renamed). Names still resolve as a fallback for hand-authored
  // links, but DEFAULT wiring is ids. The name rides alongside as a
  // comment — update both if a landing is ever re-minted.
  navLinks: {
    "ai-insights": "screen:dmrotrgwxijez", // AI Insights
    "setup-tasks": "screen:dmrotrh1eilb0", // Set-up Tasks
    "location-profile": "screen:dmrotrh3wgcq1", // Location Profile
    rankings: "screen:dmrotrh6rulhk", // Rankings
    "local-search-grid": "screen:dmroutf7bsndb", // Local Search Grid
    citations: "screen:dmrotrh931z64", // Citations
    reviews: "screen:dmrotrhbcxk66", // Reviews
    "gbp-manager": "screen:dmrotrhwtj0wc", // GBP Manager
    "website-seo": "screen:dmrotrhz8gp49", // Website SEO
    "google-analytics": "screen:dmrotri1gb3rf", // Google Analytics
    "agency-tools": "screen:dmrotri3pxlio", // Agency Tools
    "rankings-table": "screen:dmrnyiy9g9f7o", // Rankings Table
    // Reviews sub pages (24 Aug). The Inbox target is the DataTable
    // build, not the earlier "RM — Review Inbox" prototype.
    "reviews-insights": "screen:dmswb0i9c6oe5", // RM — Review Insights
    "reviews-inbox": "screen:dmsxf5zjggd0n", // RM — Review Inbox (DataTable)
    // AI Insights sub pages — screen names carry the section prefix so
    // they never clash with the top-level Reviews/Citations landings.
    "ai-insights-website-content": "screen:dmrouiz2ajnqw", // AI Insights - Website and Content
    "ai-insights-google-business-profile": "screen:dmrouiz5q03hr", // AI Insights - Google Business Profile
    "ai-insights-reviews": "screen:dmrouizaw0c9u", // AI Insights - Reviews
    "ai-insights-citations": "screen:dmrouize7iinr", // AI Insights - Citations
    "ai-insights-export": "screen:dmrouizhd7lcw", // AI Insights - Export Report
  },
  // ─── AI Insights (shape matched to the LIVE summary page, 17 Jul) ──
  // The hero: greeting + prose summary + counts + Location Score donut.
  // TEXT VARIES, NUMBERS DON'T (Ali): `summaries` holds the prose in
  // multiple tones/verbosities, `tone` picks one, and the provider
  // surfaces the resolved string at `summary` — so screens bind ONE key
  // and switching version is a one-key patch:
  //   <ProposalDataProvider data={{ aiInsights: { tone: "concise" } }}>
  // `summary` is DERIVED — author text in `summaries`, never here.
  // `items` match the FULL old-platform AI Insights page (which also
  // backs the new summary page's per-card sidebar): title is
  // outcome-phrased; `area` is the nav row id the card drills through
  // to (via navLinks); `areaLabel` is the old-platform label ("Web
  // Performance" ↔ the "Website and content" card — the interim
  // old/new naming is modelled, not fudged); `insight` is the long
  // diagnostic paragraph, `recommendation` the summary paragraph;
  // `actions` is the "Show all N actions" list — each action is
  // { text, links?: [{ label, area? }] } because DEEP LINKS BELONG TO
  // ACTIONS (the live page attaches "Go to Active Sync" etc. per
  // action, sometimes two). The sidebar card's single CTA = the first
  // link found across actions. `action` mirrors actions[0].text for
  // existing screens. `atAGlance` is the 3-bullet executive summary;
  // `counts` feeds "5 insights · 26 recommendations" (recommendations
  // = total actions); `updatesLeft` is the regeneration quota chip.
  aiInsights: {
    lastUpdated: "14/07/26",
    updatesLeft: 3,
    counts: { insights: 3, recommendations: 8 },
    tone: "standard",
    atAGlance: [
      "Catch up the six unanswered reviews — reply speed is the fastest visibility win available.",
      "Sync opening hours to the two conflicting citations so Google stops seeing mixed signals.",
      "Add LocalBusiness schema to the location page to unlock map-pack eligibility.",
    ],
    summaries: {
      concise:
        "Your listings are strong, but reviews velocity dropped and two citations conflict.",
      standard:
        "Your Google Business Profile is complete and your listings are in good shape, which gives you a solid base. The fastest wins now are catching up review replies, fixing the two citations with conflicting hours, and adding LocalBusiness schema so you can push into the map pack for “campsite lewes” searches across Lewes and the South Downs.",
      detailed:
        "Your Google Business Profile is complete, NAP details are consistent across 86 live listings, and rankings climbed three places this month — a solid base. Reviews are the soft spot: velocity dropped and six reviews sit unanswered, which Google reads as fading engagement. Two citations still show conflicting opening hours, and your location page is missing LocalBusiness schema. Work through those in order — replies first, then citations, then schema — and you should push into the map pack for “campsite lewes” searches across Lewes and the South Downs.",
    },
    items: [
      {
        id: "ins-1",
        area: "reviews",
        areaLabel: "Reviews",
        severity: "high",
        title: "Catch up review replies to protect your rating",
        insight:
          "Review signals matter for both rankings and conversions. Six reviews across Google and Yelp have sat unanswered for nine days, and your reply rate this quarter is down to 60 percent. Google reads slowing engagement as declining quality, and prospective guests read silence as indifference — while nearby parks with faster reply times are appearing more often across local results.",
        recommendation:
          "Clear the backlog, then put replies on a 48-hour clock: templates for the common cases, a follow-up email that asks recent guests for a review while their stay is fresh.",
        action: "Respond to 6 unanswered reviews on Google and Yelp.",
        actions: [
          {
            text: "Respond to 6 unanswered reviews on Google and Yelp.",
            links: [{ label: "Go to Reviews", area: "reviews" }],
          },
          {
            text: "Turn on reply templates so new reviews get answered within 48 hours.",
          },
          {
            text: "Send a follow-up email to recent guests asking for a review.",
          },
        ],
      },
      {
        id: "ins-2",
        area: "citations",
        areaLabel: "Citations",
        severity: "medium",
        title: "Fix conflicting opening hours on 2 citations",
        insight:
          "Citations are consistent listings of your name, address and phone across directories — and two of yours (Bing and Apple) currently show last season's opening hours. Conflicting details dilute the trust signals your 86 consistent listings have earned, and guests who arrive to a closed gate leave reviews you don't want.",
        recommendation:
          "Sync hours from the Location Profile to the two conflicting citations, then re-run tracking to confirm the fix has propagated everywhere.",
        action: "Sync hours from the Location Profile to Bing and Apple.",
        actions: [
          {
            text: "Sync hours from the Location Profile to Bing and Apple.",
            links: [{ label: "Go to Citations", area: "citations" }],
          },
          {
            text: "Re-run Citation Tracker to confirm the fixes have propagated.",
          },
        ],
      },
      {
        id: "ins-3",
        area: "website-seo",
        areaLabel: "Web Performance",
        severity: "low",
        title: "Add LocalBusiness schema to lift map-pack eligibility",
        insight:
          "Your location page has no LocalBusiness JSON-LD, so Google is inferring your name, address and opening hours instead of being told them. Structured data is a core local signal that helps Google confirm who and where you are — parks that carry it are more eligible for map-pack placement and richer results.",
        recommendation:
          "Add LocalBusiness schema (name, address, phone, geo, openingHours) to the location page, validate it, and extend to FAQPage schema while you're in the markup.",
        action: "Add structured data to the location page.",
        actions: [
          {
            text: "Add structured data to the location page.",
            links: [{ label: "Go to Website SEO", area: "website-seo" }],
          },
          {
            text: "Validate the markup in Google's Rich Results test.",
          },
          {
            text: "Add the campsite FAQ as FAQPage schema while you're in there.",
          },
        ],
      },
    ],
  },
  // ─── Location Score model (from the live "How your location score is
  // calculated" popover): overall = 50% foundation + 50% visibility;
  // foundation = Website 30% + GBP 30% + Reviews 20% + Citations 20%;
  // visibility = Google Maps 60% + Organic 40%. The ONLY authored
  // numbers are the module scores below — foundation/visibility/overall
  // come from computeLocationScore(data), so a dataset can never ship
  // an incoherent donut. Keys here mirror foundation/visibility keys.
  scoreModel: {
    locationScore: { foundation: 0.5, visibility: 0.5 },
    foundation: {
      websiteContent: 0.3,
      gbp: 0.3,
      reviews: 0.2,
      citations: 0.2,
    },
    visibility: { googleMaps: 0.6, organic: 0.4 },
  },
  // ─── "Build your foundation" — the four module cards. Each: /100
  // score + ordered sub-metric bars (labels straight from the live
  // page). `label` is the NEW summary-page card name, `insightsLabel`
  // the OLD AI-Insights sidebar name, `area` the nav row the card
  // links through to (Reviews, Citations… pages) via navLinks.
  foundation: {
    websiteContent: {
      label: "Website and content",
      insightsLabel: "Web Performance",
      area: "website-seo",
      // summary — the one-line "what this category is / how it's doing"
      // shown under the title on the AI Insights sub-page's score strip.
      // These defaults are category-descriptive (dataset-agnostic); a
      // dataset overrides with location-specific, score-aware copy.
      summary:
        "How well your site is built for search and conversion — technical health, page optimisation and the on-site signals that help you rank and convert.",
      score: 78,
      subMetrics: [
        { label: "Conversion UX", score: 70 },
        { label: "Keyword coverage", score: 72 },
        { label: "Page optimization", score: 82 },
        { label: "Technical health", score: 85 },
        { label: "Local intent & linking", score: 68 },
      ],
    },
    gbp: {
      label: "Google Business Profile",
      insightsLabel: "GBP",
      area: "gbp-manager",
      summary:
        "The strength of your Google Business Profile — completeness, accuracy and the freshness signals that drive Map Pack visibility.",
      score: 74,
      subMetrics: [
        { label: "Activity & freshness", score: 60 },
        { label: "Conversion tracking", score: 65 },
        { label: "Profile completeness", score: 92 },
        { label: "NAP alignment", score: 85 },
        { label: "Category & service accuracy", score: 70 },
      ],
    },
    reviews: {
      label: "Reviews",
      insightsLabel: "Reviews",
      area: "reviews",
      summary:
        "Your review footprint — volume, rating and how steadily new reviews arrive to build trust and win Local Pack clicks.",
      score: 72,
      subMetrics: [
        { label: "Review volume", score: 68 },
        { label: "Average rating", score: 86 },
        { label: "Recency & velocity", score: 55 },
      ],
    },
    citations: {
      label: "Citations",
      insightsLabel: "Citations",
      area: "citations",
      summary:
        "Where your business is listed across the web, and how consistent your name, address and phone are across those listings.",
      score: 81,
      subMetrics: [
        { label: "Core coverage", score: 79 },
        { label: "NAP consistency", score: 83 },
      ],
    },
  },
  // ─── "Your visibility" — the two channel scores + the map block's
  // stat strip (per selected keyword). Deltas are signed numbers;
  // render direction from the sign (live page: "↗ 1.2" chip, "— 0").
  visibility: {
    keyword: "campsite lewes",
    googleMaps: {
      label: "Google Maps",
      score: 58,
      avgRank: 12.0,
      avgRankDelta: 3.0,
      topThreeShare: 24,
      topThreeShareDelta: 6,
    },
    organic: { label: "Organic", score: 47 },
  },
  // ─── Competitors table (live page columns: avg rank, business
  // name + rating + review count, categories, links, authority).
  // `self: true` marks the location's own row for highlight.
  competitors: [
    {
      avgRank: 3.2,
      name: "Heathfield Meadows Holiday Park",
      rating: 4.6,
      reviewCount: 210,
      categories: ["Holiday park"],
      links: 1240,
      authority: 38,
    },
    {
      avgRank: 4.8,
      name: "South Downs Glamping Co",
      rating: 4.9,
      reviewCount: 156,
      categories: ["Glampsite", "Campsite"],
      links: 620,
      authority: 29,
    },
    {
      avgRank: 6.1,
      name: "Ouse Valley Caravan Club Site",
      rating: 4.4,
      reviewCount: 402,
      categories: ["Caravan park"],
      links: 3100,
      authority: 44,
    },
    {
      avgRank: 9.7,
      name: "Firle Camping Fields",
      rating: 4.7,
      reviewCount: 88,
      categories: ["Campsite"],
      links: 140,
      authority: 17,
    },
    {
      avgRank: 12.0,
      name: "Blackberry Farm Park",
      rating: 4.3,
      reviewCount: 128,
      categories: ["Holiday park"],
      links: 310,
      authority: 22,
      self: true,
    },
  ],
  metrics: {
    // AI Insights home — one stat per sub page (Export Report is an
    // action, not a stat). SAME DATA POINTS as the summary page (Ali,
    // 17 Jul): metric = foundation.<module>.score, description = the
    // weakest sub-metric. Every dataset MUST patch these four alongside
    // foundation so the landing and the drill-downs never disagree.
    aiWebsiteContent: {
      metric: "78",
      delta: "/100",
      description: "Weakest: Local intent & linking (68/100)",
    },
    aiGoogleBusinessProfile: {
      metric: "74",
      delta: "/100",
      description: "Weakest: Activity & freshness (60/100)",
    },
    aiReviews: {
      metric: "72",
      delta: "/100",
      description: "Weakest: Recency & velocity (55/100)",
    },
    aiCitations: {
      metric: "81",
      delta: "/100",
      description: "Weakest: Core coverage (79/100)",
    },
    reviews: {
      metric: "4.3",
      delta: "+0.2 this month",
      description: "Monitor and respond across 30+ sites",
    },
    rankings: {
      metric: "12",
      delta: "↑ 3 places",
      description: "Local search positions for tracked keywords",
    },
    citations: {
      metric: "86",
      description: "Live listings across the citation network",
    },
    localSearchGrid: {
      metric: "5",
      delta: "keywords tracked",
      description: "Map-grid visibility for your keywords",
    },
    gbpManager: {
      metric: "3",
      delta: "pending posts",
      description: "Posts, Q&A and profile updates",
    },
    websiteSeo: {
      metric: "78",
      delta: "site score",
      description: "On-site health and optimisation",
    },
  },
};

// ─── Location Score rollup ───────────────────────────────────────────
// The donut + its two sub-scores are ARITHMETIC, never authored: the
// weights live in data.scoreModel (captured from the live "How your
// location score is calculated" popover) and the only authored numbers
// are the module scores. Verified against the live product: -1 Studios
// (.3×25 + .3×38 + .2×32 + .2×59 → 37; .6×2 + .4×0 → 1; midpoint 19).
export function computeLocationScore(data = PROPOSAL_DATA) {
  const w = data.scoreModel ?? PROPOSAL_DATA.scoreModel;
  const weigh = (weights, source) =>
    Math.round(
      Object.entries(weights).reduce(
        (acc, [key, wt]) => acc + (source?.[key]?.score ?? 0) * wt,
        0,
      ),
    );
  const foundation = weigh(w.foundation, data.foundation);
  const visibility = weigh(w.visibility, data.visibility);
  const overall = Math.round(
    foundation * w.locationScore.foundation +
      visibility * w.locationScore.visibility,
  );
  return { overall, foundation, visibility };
}

// Tone/verbosity resolution — TEXT VARIES, NUMBERS DON'T. The provider
// surfaces summaries[tone] at aiInsights.summary after every merge, so
// screens bind one key and a one-key tone patch re-voices the page.
// To change the TEXT of a variant, patch `summaries.<tone>` — summary
// itself is derived and never authored.
function resolveProposalData(d) {
  const ai = d.aiInsights;
  const resolved = ai?.summaries?.[ai?.tone];
  if (resolved == null || resolved === ai.summary) return d;
  return { ...d, aiInsights: { ...ai, summary: resolved } };
}

const ProposalDataContext = React.createContext(
  resolveProposalData(PROPOSAL_DATA),
);

/** Recursive merge: plain objects merge key-by-key over the defaults,
 *  so `{ metrics: { reviews: { metric: "4.9" } } }` patches ONE value
 *  and keeps the sibling description/delta. Anything non-object —
 *  including arrays and ReactNodes — replaces wholesale. */
function mergeProposalData(base, patch) {
  if (!patch) return base;
  const isPlain = (v) =>
    v && typeof v === "object" && !Array.isArray(v) && !React.isValidElement(v);
  const out = { ...base };
  for (const key of Object.keys(patch)) {
    const b = base[key];
    const p = patch[key];
    out[key] = isPlain(b) && isPlain(p) ? mergeProposalData(b, p) : p;
  }
  return out;
}

// Named datasets (raw JSON in lib/data/*.json, folded into the
// "@brightlocal/data" module at generation time). Re-exported so
// screens/chrome can enumerate the options.
export const PROPOSAL_DATASETS = DATASETS;

export function ProposalDataProvider({ dataset, data, children }) {
  // Merge order: PARENT context → named dataset patch → the `data`
  // prop. Base is the parent (not PROPOSAL_DATA directly — though with
  // no outer provider the parent IS the defaults), so nested providers
  // STACK: a screen-level provider carrying project navLinks survives
  // the shell/tweaker mounting a dataset provider inside it.
  const parent = React.useContext(ProposalDataContext);
  const merged = React.useMemo(() => {
    const named = dataset && dataset !== "default" ? DATASETS[dataset] : undefined;
    if (dataset && dataset !== "default" && !named) {
      // eslint-disable-next-line no-console
      console.warn(`[proposal] unknown dataset "${dataset}" — using defaults`);
    }
    return resolveProposalData(
      mergeProposalData(mergeProposalData(parent, named), data),
    );
  }, [parent, dataset, data]);
  return (
    <ProposalDataContext.Provider value={merged}>
      {children}
    </ProposalDataContext.Provider>
  );
}

export function useProposalData() {
  return React.useContext(ProposalDataContext);
}
