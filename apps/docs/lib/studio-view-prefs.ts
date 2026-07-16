/**
 * Screens-rail view preferences + tag-facet helpers (STUDIO-TAGS T1).
 *
 * One serialisable prefs object per project: which presentation the
 * screens surface uses (thumbnail grid ⇄ compact list), which
 * single-cardinality tag type it groups by ("folders"), and the active
 * filter facets (OR within a type, AND across types).
 *
 * Persistence is two-tier:
 *   - localStorage (`grade-studio-view:<projectId>`) — instant, offline,
 *     the local-adapter mirror. Same hydrate/write pattern as
 *     `grade-ds-section` in app/studio/page.tsx.
 *   - `projects.view_prefs` jsonb (migration 0022) — cloud, so the
 *     organisation follows the user across devices. Cloud wins on load
 *     when present.
 *
 * Pure module — no React. The page owns the state; this owns the shape,
 * the (de)serialisation, and the pure design-list transforms.
 */

import type { Design, DesignTag } from "@/lib/studio-designs";

export interface ViewFilter {
  type: string;
  value: string;
}

export interface ProjectViewPrefs {
  /** Screens-surface presentation. "grid" = thumbnail tiles (today's
   *  view); "list" = compact text rows — no live iframes, which is
   *  also the many-screens memory fix. */
  view: "grid" | "list";
  /** Tag TYPE the list groups by (folder semantics — only offered for
   *  single-cardinality types), or null = flat position order. */
  groupBy: string | null;
  /** Active facets. OR within a type, AND across types
   *  ("section:rankings AND status:draft"). */
  filters: ViewFilter[];
}

export const DEFAULT_VIEW_PREFS: ProjectViewPrefs = {
  view: "grid",
  groupBy: null,
  filters: [],
};

/** localStorage key — per project, grade-* namespace (Ali's spec). */
export function viewPrefsStorageKey(projectId: string): string {
  return `grade-studio-view:${projectId}`;
}

/** Validating parse for anything untrusted (localStorage, jsonb).
 *  Unknown shapes fall back to defaults field-by-field, so a prefs
 *  blob written by a future version never breaks an older client. */
export function normalizeViewPrefs(raw: unknown): ProjectViewPrefs {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_VIEW_PREFS, filters: [] };
  const o = raw as Record<string, unknown>;
  const view = o.view === "list" ? "list" : "grid";
  const groupBy =
    typeof o.groupBy === "string" && o.groupBy.trim() ? o.groupBy : null;
  const filters = Array.isArray(o.filters)
    ? o.filters.filter(
        (f): f is ViewFilter =>
          !!f &&
          typeof f === "object" &&
          typeof (f as ViewFilter).type === "string" &&
          typeof (f as ViewFilter).value === "string",
      )
    : [];
  return { view, groupBy, filters };
}

/** SSR-safe localStorage read. Null when absent/unavailable — callers
 *  fall back to the cloud value or DEFAULT_VIEW_PREFS. */
export function loadLocalViewPrefs(projectId: string): ProjectViewPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(viewPrefsStorageKey(projectId));
    return raw ? normalizeViewPrefs(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/** SSR-safe localStorage write. Best-effort — a full quota is not an
 *  error worth surfacing for a view preference. */
export function saveLocalViewPrefs(
  projectId: string,
  prefs: ProjectViewPrefs,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      viewPrefsStorageKey(projectId),
      JSON.stringify(prefs),
    );
  } catch {
    // ignore — non-persistent is fine.
  }
}

// ─── Tag facets ────────────────────────────────────────────────────────

export interface TagFacet {
  type: string;
  /** Distinct values in first-seen order, with member counts. */
  values: { value: string; count: number }[];
  /** ONE value per screen (folder-like) → offered for group-by.
   *  Inferred from usage, with built-in overrides (section/status are
   *  single by contract, flow/label multi — STUDIO-TAGS taxonomy). */
  single: boolean;
}

const BUILTIN_SINGLE: Record<string, boolean> = {
  section: true,
  status: true,
  flow: false,
  label: false,
};

/** Observed facets across the project's designs. This is the T1 stand-in
 *  for the per-project tag registry (`projects.tag_defs`, T2+): types and
 *  values are whatever's in use, cardinality is inferred. */
export function collectTagFacets(designs: readonly Design[]): TagFacet[] {
  const byType = new Map<
    string,
    { values: Map<string, number>; maxPerDesign: number }
  >();
  for (const d of designs) {
    const perDesign = new Map<string, number>();
    for (const t of d.tags ?? []) {
      let f = byType.get(t.type);
      if (!f) {
        f = { values: new Map(), maxPerDesign: 0 };
        byType.set(t.type, f);
      }
      f.values.set(t.value, (f.values.get(t.value) ?? 0) + 1);
      perDesign.set(t.type, (perDesign.get(t.type) ?? 0) + 1);
    }
    for (const [type, n] of perDesign) {
      const f = byType.get(type)!;
      if (n > f.maxPerDesign) f.maxPerDesign = n;
    }
  }
  return [...byType.entries()].map(([type, f]) => ({
    type,
    values: [...f.values.entries()].map(([value, count]) => ({ value, count })),
    single: BUILTIN_SINGLE[type] ?? f.maxPerDesign <= 1,
  }));
}

/** OR within a type, AND across types. No filters = everything. */
export function filterDesigns<T extends Pick<Design, "tags">>(
  designs: readonly T[],
  filters: readonly ViewFilter[],
): T[] {
  if (!filters.length) return [...designs];
  const byType = new Map<string, Set<string>>();
  for (const f of filters) {
    let s = byType.get(f.type);
    if (!s) byType.set(f.type, (s = new Set()));
    s.add(f.value);
  }
  return designs.filter((d) => {
    const tags = d.tags ?? [];
    for (const [type, values] of byType) {
      if (!tags.some((t) => t.type === type && values.has(t.value))) {
        return false;
      }
    }
    return true;
  });
}

export interface DesignGroup {
  /** Tag value the group represents, or null for the trailing
   *  "untagged" bucket. */
  value: string | null;
  label: string;
  designs: Design[];
}

/** Collapsible groups for the list view — hierarchy as a VIEW. Groups
 *  appear in first-seen tag-value order (stable against reorders that
 *  don't touch tags); untagged screens trail. groupBy null = one
 *  unlabeled group in position order. */
export function groupDesigns(
  designs: readonly Design[],
  groupBy: string | null,
): DesignGroup[] {
  if (!groupBy) return [{ value: null, label: "", designs: [...designs] }];
  const groups = new Map<string, Design[]>();
  const untagged: Design[] = [];
  for (const d of designs) {
    const tag = (d.tags ?? []).find((t) => t.type === groupBy);
    if (!tag) {
      untagged.push(d);
      continue;
    }
    const arr = groups.get(tag.value);
    if (arr) arr.push(d);
    else groups.set(tag.value, [d]);
  }
  const out: DesignGroup[] = [...groups.entries()].map(([value, ds]) => ({
    value,
    label: value,
    designs: ds,
  }));
  if (untagged.length) {
    out.push({ value: null, label: "Untagged", designs: untagged });
  }
  return out;
}

/** Bulk-apply a tag: single-cardinality types REPLACE the design's
 *  existing tag of that type (folder semantics — you move a screen, you
 *  don't add a second folder); multi types append when absent. */
export function applyTagToSet(
  tags: DesignTag[] | undefined,
  tag: DesignTag,
  single: boolean,
): DesignTag[] {
  const cur = tags ?? [];
  if (cur.some((t) => t.type === tag.type && t.value === tag.value)) {
    return cur;
  }
  return single
    ? [...cur.filter((t) => t.type !== tag.type), tag]
    : [...cur, tag];
}
