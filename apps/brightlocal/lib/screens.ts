/**
 * The screen registry: this app's single source of truth for what was
 * promoted from Studio and where it lives. Studio project: Brightlocal
 * Vision (47e40175-0d55-4d21-960b-26bdf6b01282).
 *
 * Every entry keeps its Studio identity (design id + screen name) next
 * to its app route, so `data-grade-goto="screen:<id>"` in promoted JSX
 * resolves through GotoBridge without rewriting the source, and
 * /s/<id> gives every screen a stable link that survives slug renames.
 *
 * `variantOf` marks an alternative treatment of another screen; the
 * settings panel lists variants beside the screen they vary.
 */

export interface ScreenEntry {
  slug: string;
  name: string;
  id: string;
  /** Short label for the settings panel and landing page. */
  label: string;
  /** Route slug of the screen this one is a variant of. */
  variantOf?: string;
  /** designs.updated_at (epoch ms) of the promoted source. */
  promotedAt: number;
  /** Signature of the promoted Studio source (see check-promotions). */
  sourceHash?: string;
}

export const SCREENS: ScreenEntry[] = [
  { slug: "/locations", label: "All Locations", name: "All Locations", id: "dmrotrgstba3l", promotedAt: 0 },
  { slug: "/location", label: "Location Hub", name: "UI Vision - Location Hub", id: "dmrurue2wmp9u", promotedAt: 0 },
  { slug: "/reviews", label: "Reviews", name: "Reviews", id: "dmrotrhbcxk66", promotedAt: 0 },
  { slug: "/reviews/trends", label: "Reviews (trends)", name: "RM — Reviews Hub — Trends", id: "dmtr3j2yrv897", variantOf: "/reviews", promotedAt: 0 },
  { slug: "/reviews/trends-b", label: "Reviews (trends, arrow only)", name: "RM — Reviews Hub — Trends B (arrow only)", id: "dmtr3ukx8k2ox", variantOf: "/reviews", promotedAt: 0 },
  { slug: "/reviews/trends-c", label: "Reviews (trends, range toggle)", name: "RM — Reviews Hub — Trends C (range toggle)", id: "dmtr41ua8pu3m", variantOf: "/reviews", promotedAt: 0 },
  { slug: "/reviews/manager", label: "Review Manager", name: "RM — Review Manager (DataTable)", id: "dmsxf5zjggd0n", promotedAt: 0 },
  { slug: "/reviews/manager/templates", label: "Reply Templates", name: "RM — Reply Templates", id: "dmtaq1rm9eok2", promotedAt: 0 },
  { slug: "/reviews/tracker", label: "Review Tracker", name: "RM — Review Tracker", id: "dmswb0i9c6oe5", promotedAt: 0 },
  { slug: "/reviews/tracker/settings", label: "Report Settings", name: "RM — Report Settings", id: "dmtkj124xagqa", promotedAt: 0 },
  { slug: "/reviews/builder", label: "Review Builder", name: "RM — Review Builder", id: "dmt094j963aye", promotedAt: 0 },
  { slug: "/reviews/builder/simplified", label: "Review Builder (simplified)", name: "RM — Review Builder — Simplified", id: "dmtr4odcbr52h", variantOf: "/reviews/builder", promotedAt: 0 },
  { slug: "/reviews/builder/gauge", label: "Get Reviews (gauge)", name: "RM — Get Reviews — Gauge (270°)", id: "dmtlozh4tb1wg", variantOf: "/reviews/builder", promotedAt: 0 },
  { slug: "/reviews/builder/hub-and-spoke", label: "Get Reviews (hub and spoke)", name: "RM — Get Reviews — Hub & spoke", id: "dmtltu2hf8x2y", variantOf: "/reviews/builder", promotedAt: 0 },
  { slug: "/reviews/showcase", label: "Review Showcase", name: "RM — Review Showcase", id: "dmt094lhmpwbs", promotedAt: 0 },
  { slug: "/reviews/showcase/rail", label: "Review Showcase (rail)", name: "RM — Review Showcase — Rail", id: "dmtrhiqukgqfb", variantOf: "/reviews/showcase", promotedAt: 0 },
];

/**
 * Areas the Location Hub and the sidebar link to that are NOT part of
 * this prototype. Each gets a skeleton page (app/[area]) so every link
 * lands somewhere honest instead of dying. Keyed by Studio design id;
 * the label is what the skeleton page announces.
 */
export const SKELETON_AREAS: { slug: string; id: string; label: string }[] = [
  { slug: "/ai-insights", id: "dmrotrgwxijez", label: "Insights & Actions" },
  { slug: "/ai-insights/website", id: "dmrouiz2ajnqw", label: "Insights & Actions: Website" },
  { slug: "/ai-insights/google-business-profile", id: "dmrouiz5q03hr", label: "Insights & Actions: Google Business Profile" },
  { slug: "/ai-insights/reviews", id: "dmrouizaw0c9u", label: "Insights & Actions: Reviews" },
  { slug: "/ai-insights/citations", id: "dmrouize7iinr", label: "Insights & Actions: Citations" },
  { slug: "/ai-insights/export", id: "dmrouizhd7lcw", label: "Insights & Actions: Export Report" },
  { slug: "/setup-tasks", id: "dmrotrh1eilb0", label: "Set-up Tasks" },
  { slug: "/location-profile", id: "dmrotrh3wgcq1", label: "Location Profile" },
  { slug: "/rankings", id: "dmrotrh6rulhk", label: "Rankings" },
  { slug: "/rankings/table", id: "dmrnyiy9g9f7o", label: "Rankings Table" },
  { slug: "/local-search-grid", id: "dmroutf7bsndb", label: "Local Search Grid" },
  { slug: "/citations", id: "dmrotrh931z64", label: "Citations" },
  { slug: "/gbp-manager", id: "dmrotrhwtj0wc", label: "GBP Manager" },
  { slug: "/website-seo", id: "dmrotrhz8gp49", label: "Website SEO" },
  { slug: "/google-analytics", id: "dmrotri1gb3rf", label: "Google Analytics" },
  { slug: "/agency-tools", id: "dmrotri3pxlio", label: "Agency Tools" },
];

const norm = (s: string) => s.trim().toLowerCase();

export function screenById(id: string): ScreenEntry | undefined {
  return SCREENS.find((s) => s.id === id);
}

export function screenByName(name: string): ScreenEntry | undefined {
  const n = norm(name);
  return SCREENS.find((s) => norm(s.name) === n);
}

export function screenBySlug(slug: string): ScreenEntry | undefined {
  return SCREENS.find((s) => s.slug === slug);
}

/** A goto value ("screen:<id>" or a screen name) to an app route. */
export function resolveGoto(value: string): string | undefined {
  const id = value.startsWith("screen:") ? value.slice("screen:".length) : null;
  if (id) {
    return screenById(id)?.slug ?? SKELETON_AREAS.find((a) => a.id === id)?.slug;
  }
  return screenByName(value)?.slug;
}
