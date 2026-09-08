/**
 * The screen registry: this app's single source of truth for what was
 * promoted from Studio and where it lives. Studio project: Brightlocal
 * Vision (47e40175-0d55-4d21-960b-26bdf6b01282).
 *
 * URL STRUCTURE (Ali, 8 Sep): every location-scoped page lives under
 * /locations/<location>/..., where <location> is a dataset key
 * (ds/data/<location>.json). The URL carries the location, so the
 * breadcrumb trail (All Locations > location > area > page) is the
 * route itself and every crumb resolves. `path` is relative to that
 * scope; `scope: "root"` entries sit at the top.
 *
 * Every entry keeps its Studio identity (design id + screen name), so
 * `data-grade-goto="screen:<id>"` in promoted JSX resolves through
 * GotoBridge without rewriting the source, and /s/<id> gives every
 * screen a stable link that survives slug renames.
 */

export const DEFAULT_LOCATION = "minus-one-studios";
export const LOCATIONS = ["minus-one-studios", "harbour-co", "northside-dental"] as const;

export interface ScreenEntry {
  /** Route path relative to the scope ("" for the scope root). */
  path: string;
  scope: "root" | "location";
  name: string;
  id: string;
  /** Short label for the settings panel and landing page. */
  label: string;
  /** Relative path of the screen this one is a variant of. */
  variantOf?: string;
  /** designs.updated_at (epoch ms) of the promoted source. */
  promotedAt: number;
}

export const SCREENS: ScreenEntry[] = [
  { path: "locations", scope: "root", label: "All Locations", name: "All Locations", id: "dmrotrgstba3l", promotedAt: 0 },
  { path: "", scope: "location", label: "Location Hub", name: "UI Vision - Location Hub", id: "dmrurue2wmp9u", promotedAt: 0 },
  { path: "reviews", scope: "location", label: "Reviews", name: "Reviews", id: "dmrotrhbcxk66", promotedAt: 0 },
  { path: "reviews/trends", scope: "location", label: "Reviews (trends)", name: "RM — Reviews Hub — Trends", id: "dmtr3j2yrv897", variantOf: "reviews", promotedAt: 0 },
  { path: "reviews/trends-b", scope: "location", label: "Reviews (trends, arrow only)", name: "RM — Reviews Hub — Trends B (arrow only)", id: "dmtr3ukx8k2ox", variantOf: "reviews", promotedAt: 0 },
  { path: "reviews/trends-c", scope: "location", label: "Reviews (trends, range toggle)", name: "RM — Reviews Hub — Trends C (range toggle)", id: "dmtr41ua8pu3m", variantOf: "reviews", promotedAt: 0 },
  { path: "reviews/manager", scope: "location", label: "Review Manager", name: "RM — Review Manager (DataTable)", id: "dmsxf5zjggd0n", promotedAt: 0 },
  { path: "reviews/manager/templates", scope: "location", label: "Reply Templates", name: "RM — Reply Templates", id: "dmtaq1rm9eok2", promotedAt: 0 },
  { path: "reviews/tracker", scope: "location", label: "Review Tracker", name: "RM — Review Tracker", id: "dmswb0i9c6oe5", promotedAt: 0 },
  { path: "reviews/tracker/settings", scope: "location", label: "Report Settings", name: "RM — Report Settings", id: "dmtkj124xagqa", promotedAt: 0 },
  { path: "reviews/builder", scope: "location", label: "Review Builder", name: "RM — Review Builder", id: "dmt094j963aye", promotedAt: 0 },
  { path: "reviews/builder/simplified", scope: "location", label: "Review Builder (simplified)", name: "RM — Review Builder — Simplified", id: "dmtr4odcbr52h", variantOf: "reviews/builder", promotedAt: 0 },
  { path: "reviews/builder/gauge", scope: "location", label: "Get Reviews (gauge)", name: "RM — Get Reviews — Gauge (270°)", id: "dmtlozh4tb1wg", variantOf: "reviews/builder", promotedAt: 0 },
  { path: "reviews/builder/hub-and-spoke", scope: "location", label: "Get Reviews (hub and spoke)", name: "RM — Get Reviews — Hub & spoke", id: "dmtltu2hf8x2y", variantOf: "reviews/builder", promotedAt: 0 },
  { path: "reviews/showcase", scope: "location", label: "Review Showcase", name: "RM — Review Showcase", id: "dmt094lhmpwbs", promotedAt: 0 },
  { path: "reviews/showcase/rail", scope: "location", label: "Review Showcase (rail)", name: "RM — Review Showcase — Rail", id: "dmtrhiqukgqfb", variantOf: "reviews/showcase", promotedAt: 0 },
];

/**
 * Areas the Location Hub and the sidebar link to that are NOT part of
 * this prototype. Each gets a skeleton page under the location so every
 * link lands somewhere honest. Keyed by Studio design id.
 */
export const SKELETON_AREAS: { path: string; id: string; label: string }[] = [
  { path: "ai-insights", id: "dmrotrgwxijez", label: "Insights & Actions" },
  { path: "ai-insights/website", id: "dmrouiz2ajnqw", label: "Insights & Actions: Website" },
  { path: "ai-insights/google-business-profile", id: "dmrouiz5q03hr", label: "Insights & Actions: Google Business Profile" },
  { path: "ai-insights/reviews", id: "dmrouizaw0c9u", label: "Insights & Actions: Reviews" },
  { path: "ai-insights/citations", id: "dmrouize7iinr", label: "Insights & Actions: Citations" },
  { path: "ai-insights/export", id: "dmrouizhd7lcw", label: "Insights & Actions: Export Report" },
  { path: "setup-tasks", id: "dmrotrh1eilb0", label: "Set-up Tasks" },
  { path: "location-profile", id: "dmrotrh3wgcq1", label: "Location Profile" },
  { path: "rankings", id: "dmrotrh6rulhk", label: "Rankings" },
  { path: "rankings/table", id: "dmrnyiy9g9f7o", label: "Rankings Table" },
  { path: "local-search-grid", id: "dmroutf7bsndb", label: "Local Search Grid" },
  { path: "citations", id: "dmrotrh931z64", label: "Citations" },
  { path: "gbp-manager", id: "dmrotrhwtj0wc", label: "GBP Manager" },
  { path: "website-seo", id: "dmrotrhz8gp49", label: "Website SEO" },
  { path: "google-analytics", id: "dmrotri1gb3rf", label: "Google Analytics" },
  { path: "agency-tools", id: "dmrotri3pxlio", label: "Agency Tools" },
];

const norm = (s: string) => s.trim().toLowerCase();

export function isLocation(value: string | null | undefined): value is (typeof LOCATIONS)[number] {
  return !!value && (LOCATIONS as readonly string[]).includes(value);
}

/** The location segment of a pathname, if it has one. */
export function locationFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/locations\/([^/?#]+)/);
  return m && isLocation(m[1]) ? m[1] : null;
}

/** The relative path of a pathname within its location scope
 *  ("/locations/x/reviews/tracker" to "reviews/tracker"). */
export function relativePath(pathname: string): string {
  const m = pathname.match(/^\/locations\/[^/]+\/?(.*)$/);
  return (m ? m[1] : pathname.replace(/^\//, "")).replace(/\/$/, "");
}

/** The href for a screen or skeleton path in a location. */
export function hrefFor(entry: { path: string; scope?: "root" | "location" }, location: string): string {
  if (entry.scope === "root") return `/${entry.path}`;
  return entry.path ? `/locations/${location}/${entry.path}` : `/locations/${location}`;
}

export function screenById(id: string): ScreenEntry | undefined {
  return SCREENS.find((s) => s.id === id);
}

export function screenByName(name: string): ScreenEntry | undefined {
  const n = norm(name);
  return SCREENS.find((s) => norm(s.name) === n);
}

/** A goto value ("screen:<id>" or a screen name) to an app href. */
export function resolveGoto(value: string, location: string): string | undefined {
  const id = value.startsWith("screen:") ? value.slice("screen:".length) : null;
  if (id) {
    const screen = screenById(id);
    if (screen) return hrefFor(screen, location);
    const area = SKELETON_AREAS.find((a) => a.id === id);
    return area ? hrefFor({ path: area.path, scope: "location" }, location) : undefined;
  }
  const screen = screenByName(value);
  return screen ? hrefFor(screen, location) : undefined;
}

/** Every screen href for one location (prefetch). */
export function allHrefs(location: string): string[] {
  return SCREENS.map((s) => hrefFor(s, location));
}
