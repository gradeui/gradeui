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

export const PROPOSAL_DATA = {
  account: { label: "Acme Local Agency" },
  user: { name: "Joe Bloggs", meta: "Trial: 14 days left", initials: "JB" },
  location: {
    name: "Blackberry Farm Park — Lewes, BN8 6JD",
    status: "Active",
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
  // DEFAULT nav wiring (nav model v2, 18 Jul): every top-level row
  // links to its landing screen out of the box — canonical names match
  // the "Top-Level Pages" tagged screens in the project. Per-project /
  // per-screen navLinks deep-merge OVER these, so overriding one row
  // never costs the rest.
  navLinks: {
    "ai-insights": "AI Insights",
    "setup-tasks": "Set-up Tasks",
    "location-profile": "Location Profile",
    rankings: "Rankings",
    "local-search-grid": "Local Search Grid",
    citations: "Citations",
    reviews: "Reviews",
    "gbp-manager": "GBP Manager",
    "website-seo": "Website SEO",
    "google-analytics": "Google Analytics",
    "agency-tools": "Agency Tools",
    "rankings-table": "Rankings Table",
  },
  // AI Insights — the headline featureset. A dataset section of its
  // own: `summary` is the one-liner surfaces quote (hero, hub);
  // `items` are "the three things to fix first" — area matches a nav
  // section id, severity drives any status treatment. Refine the shape
  // against the real product output when it lands; the JSON is the
  // contract and screens bind through useProposalData().aiInsights.
  aiInsights: {
    summary:
      "Your listings are strong, but reviews velocity dropped and two citations conflict.",
    items: [
      {
        id: "ins-1",
        area: "reviews",
        severity: "high",
        title: "Review replies are 9 days behind",
        action: "Respond to 6 unanswered reviews on Google and Yelp.",
      },
      {
        id: "ins-2",
        area: "citations",
        severity: "medium",
        title: "Conflicting opening hours on 2 citations",
        action: "Sync hours from the Location Profile to Bing and Apple.",
      },
      {
        id: "ins-3",
        area: "website-seo",
        severity: "low",
        title: "Location page is missing LocalBusiness schema",
        action: "Add structured data to lift map-pack eligibility.",
      },
    ],
  },
  metrics: {
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

const ProposalDataContext = React.createContext(PROPOSAL_DATA);

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
    return mergeProposalData(mergeProposalData(parent, named), data);
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
