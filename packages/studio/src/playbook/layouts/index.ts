/**
 * Reference layouts — hand-authored JSX scaffolds the model can be
 * seeded with for common app shapes. Unlike the prose-only entries in
 * `templates/`, these ship a full `<App>` implementation that the
 * model then *edits* rather than generating from zero. Less room for
 * the model to get the scaffold wrong; more room to focus on the
 * bits the user actually described.
 *
 * Authoring model: each scaffold lives in its own `.jsx` file under
 * `layouts/scaffolds/`. The build script `generate-scaffolds.mjs`
 * inlines every file into `scaffolds.generated.ts` as a plain string
 * keyed by the filename (sans extension). This module joins that
 * generated source map to metadata so the `ReferenceLayout` registry
 * looks like a normal TS array while the scaffolds themselves stay
 * editable as real JSX — proper syntax highlighting, no backtick or
 * ${} escaping, one file per layout.
 *
 * Zero runtime deps: the generated file holds the JSX as strings, so
 * this module (and anything that imports the playbook) never touches
 * `fs` or React. Sandpack (or, once #25 lands, the retrieval step
 * that pins a scaffold under a REFERENCE LAYOUT block) consumes the
 * strings directly.
 *
 * Retrieval plan (#25): `tags` are the soft-match tokens. A user
 * prompt is lower-cased and scanned for any tag; the best-scoring
 * scaffold (most tag hits, ties broken by scaffold brevity) gets
 * pinned. No fuzzy matching yet — exact substring is plenty at five
 * scaffolds. When the registry grows past ~15 we'll upgrade to a
 * stemmed-index approach.
 *
 * Authoring rules (keep these in mind when adding more):
 *   1. Use ONLY components from `components/allowlist.ts`. Anything
 *      else will fail in the Sandpack harness. If a layout genuinely
 *      wants a component that doesn't exist yet (DataTable, Scroller,
 *      Rating), flag it in MISSING_COMPONENTS below and hand-roll a
 *      plausible-looking stand-in — the whole point of a scaffold is
 *      to run on day one even if the ideal component lands later.
 *   2. Reach for layout primitives (Stack, Row, Grid, Flex, AppShell)
 *      over raw utility classes. These scaffolds are also training
 *      data — the model sees them and mimics the pattern.
 *   3. Semantic tokens only: `bg-background`, `bg-muted`, `bg-card`,
 *      `text-foreground`, `text-muted-foreground`, `border-border`,
 *      etc. Raw color classes (`bg-blue-500`) strand the layout
 *      outside the theme.
 *   4. Images: since the Sandpack sandbox has no asset pipeline, use
 *      tinted gradients on MediaSurface or Card as stand-ins
 *      (`bg-gradient-to-br from-primary/30 via-muted to-accent/20`).
 *      Easy for the user to swap for real `<img>` tags later.
 *   5. Keep scaffolds under ~120 lines. The goal is a runway, not a
 *      finished app — the model fills in the rest.
 *   6. **No arbitrary Tailwind values** — `md:grid-cols-[minmax(0,440px)_1fr]`,
 *      `h-[600px]`, `w-[440px]`, etc. They will silently NOT WORK. Tailwind
 *      JIT-generates arbitrary classes only when it scans the file using
 *      them, but `@gradeui/ui`'s Tailwind config (which produces the CSS
 *      Fast Frame loads) doesn't scan this directory. Result: the class
 *      is missing from the compiled CSS, the rule has no effect, and the
 *      layout silently falls back to the default (e.g. single-column
 *      grid). Use only built-in classes — `md:flex-row`, `md:w-1/3`,
 *      `md:col-span-2`. Verified the hard way during the airbnb-listings
 *      ship. (Eventual proper fix: add an `@source` for this directory
 *      in packages/ui/styles/globals.css — that's where source scanning
 *      lives since the v4 native-@theme migration.)
 *   7. **No magic numbers anywhere** — neither in arbitrary Tailwind
 *      classes nor in inline `style={{ height: 600 }}` escapes. Magic
 *      pixel constants pin a layout to one viewport assumption and
 *      strand it on every other (a fixed-height map looks fine at
 *      900px tall but leaves a dead band below at 1200px). Use flex
 *      with `flex-1` + `min-h-0` / `min-w-0` and let parent height
 *      constraints (`h-screen` / `h-full`) cascade. Pattern for a
 *      "fill the remaining space" pane:
 *
 *        <div className="h-full flex flex-col md:flex-row">
 *          <Stack className="flex-1 md:flex-initial md:w-1/3 ..." />
 *          <div className="flex-1 min-h-0 min-w-0">
 *            <ChildThatFills className="h-full w-full" />
 *          </div>
 *        </div>
 *
 *   8. **Separate preview chrome from feature content.** Scaffolds wrap
 *      themselves in `<AppShell>` so Fast Frame can render them as a
 *      standalone tree, but a real host app already has its own
 *      AppShell + nav. The inner "feature" block (the two-pane list +
 *      map, the data table, the form, etc.) should be designed so it
 *      fills its parent via `h-full` and makes no assumption about
 *      what wraps it. That way the same content lifts cleanly into a
 *      host app's `<AppShellMain>` slot without rework. Rule of thumb:
 *      `h-screen` only on the outer AppShell; everywhere inside, use
 *      `h-full` and let the constraint cascade.
 *
 * Adding a new layout:
 *   1. Drop a `kebab-case-id.jsx` file in `layouts/scaffolds/`.
 *   2. Run `pnpm -F @gradeui/studio generate:scaffolds`.
 *   3. Append an entry to `REFERENCE_LAYOUTS` below — `id` must match
 *      the filename sans `.jsx`.
 */

import { SCAFFOLDS } from "./scaffolds.generated";

// Playground scaffolds — siloed dev-only set. Re-exported here as
// `PLAYGROUND_SCAFFOLDS` + the `PlaygroundScaffold` type so the
// docs-site picker can import them from `@gradeui/studio/playbook`
// alongside `REFERENCE_LAYOUTS`. Separate export = tree-shaken away
// from anything that doesn't explicitly ask for it (the system prompt
// + retrieval + thumbnail pipeline all stay clean). See
// `layouts/scaffolds-playground/README.md` for the authoring loop.
export {
  PLAYGROUND_SCAFFOLDS,
  type PlaygroundScaffold,
} from "./scaffolds-playground.generated";

export interface ReferenceLayout {
  /** Stable id. Must match the scaffold's filename (sans `.jsx`) so
   *  `SCAFFOLDS[id]` resolves, and joins to a `StudioTemplate` by the
   *  same id when the launchpad wants to surface a prose+scaffold
   *  pair. */
  id: string;
  /** Short label for a picker. */
  label: string;
  /** One-line hook for tooltips / secondary text. */
  description: string;
  /** Lowercased soft-match tokens for #25's retrieval pass. Think
   *  "words the user would say when asking for this." */
  tags: readonly string[];
  /** Full JSX source, starting from the barrel import line. Resolved
   *  from `SCAFFOLDS[id]` at module-load time. Must be a self-contained
   *  component named `App` with `export default` — the Sandpack harness
   *  drops it into `/App.tsx` verbatim. */
  scaffold: string;
}

// Narrow + fail-loud helper: if someone adds a registry entry whose id
// doesn't have a matching .jsx file, throw at module-load time rather
// than shipping a silently-broken layout. Also keeps the registry
// definition declarative (no `SCAFFOLDS["foo"] ?? ""` noise inline).
function requireScaffold(id: string): string {
  const src = SCAFFOLDS[id];
  if (!src) {
    throw new Error(
      `[reference-layouts] missing scaffold source for id "${id}". ` +
      `Expected packages/studio/src/playbook/layouts/scaffolds/${id}.jsx. ` +
      `Did you forget to run \`pnpm -F @gradeui/studio generate:scaffolds\`?`,
    );
  }
  return src;
}

// ─────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────
//
// Order here is the order a picker would show them. `tags` are all
// lower-cased (retrieval lower-cases the user prompt before matching).

export const REFERENCE_LAYOUTS: readonly ReferenceLayout[] = [
  {
    // Category filter sidebar and a responsive product grid with cards,
    // ratings, and sort. Single most common ecommerce screen.
    id: "ecommerce-listing",
    label: "Ecommerce — product listing",
    description: "Category filter sidebar and a responsive product grid with cards, ratings, and sort.",
    tags: [
      "ecommerce", "shop", "store", "storefront", "product", "products",
      "catalog", "catalogue", "listing", "marketplace", "cart", "price",
      "retail", "shopping",
    ],
    scaffold: requireScaffold("ecommerce-listing"),
  },
  {
    // Admin master/detail: user list on the left, editable profile on
    // the right. Canonical SaaS admin shape.
    id: "saas-user-editor",
    label: "SaaS — user editor",
    description: "Admin master/detail: user list on the left, editable profile on the right.",
    tags: [
      "saas", "admin", "users", "user", "editor", "editing", "profile",
      "account", "settings", "crud", "detail", "master", "workspace",
      "team", "permissions", "role", "roles",
    ],
    scaffold: requireScaffold("saas-user-editor"),
  },
  {
    // Toolbar (search + plan/status selects), filter chips, sortable
    // Table, and pagination. Uses structural Table only — a real
    // DataTable (TanStack) would own this chrome; tracked in
    // MISSING_COMPONENTS.
    id: "data-table-filters",
    label: "Data table with filters",
    description: "Toolbar (search + plan/status selects), filter chips, sortable table, and pagination.",
    tags: [
      "table", "data table", "datatable", "tanstack", "grid",
      "listing", "records", "rows", "filter", "filters", "filtering",
      "search", "pagination", "sort", "sortable", "columns", "spreadsheet",
    ],
    scaffold: requireScaffold("data-table-filters"),
  },
  {
    // Master/detail: a TanStack table whose only job is to emit a
    // selected id, a `useSelection` hook resolving it, and a detail
    // panel built from PropertyList (read-only, with an edit toggle).
    // The standout pattern is ONE `renderValue(type, value)` feeding
    // both the table cells and the PropertyList rows — schema run
    // horizontally vs. vertically over the same field types
    // (select / status / priority / tags / date / user / users /
    // relation / number / currency / percent / url / boolean / longtext).
    id: "data-table-detail",
    label: "Data table with detail panel",
    description: "TanStack table + row-driven PropertyList detail panel; one value renderer feeds both cells and rows.",
    tags: [
      "table", "data table", "datatable", "tanstack", "master detail",
      "master-detail", "detail panel", "detail view", "inspector",
      "property list", "properties", "record", "row select", "selection",
      "crm", "list detail", "split view", "rows", "columns", "schema",
    ],
    scaffold: requireScaffold("data-table-detail"),
  },
  {
    // Spotify-shaped layout: persistent side library, main as a stack
    // of horizontal "shelves". Hand-rolls `overflow-x-auto` — begging
    // for a Scroller primitive.
    id: "music-app",
    label: "Music app",
    description: "Library side nav and horizontally scrolling shelves of album tiles.",
    tags: [
      "music", "spotify", "album", "albums", "playlist", "playlists",
      "library", "shelf", "shelves", "scroller", "carousel", "audio",
      "player", "artist", "track", "songs",
    ],
    scaffold: requireScaffold("music-app"),
  },
  {
    // Video-streaming layout: top nav, giant hero MediaSurface with
    // overlayed title + CTAs, then horizontal poster shelves
    // (aspect="portrait"). Same overflow-x trick as the music app.
    id: "tv-streaming",
    label: "TV / streaming (Apple TV-style)",
    description: "Top nav, hero feature, and horizontal rows of poster tiles.",
    tags: [
      "tv", "apple tv", "streaming", "video", "netflix", "disney",
      "movies", "shows", "poster", "posters", "hero", "shelf",
      "shelves", "scroller", "carousel", "entertainment",
    ],
    scaffold: requireScaffold("tv-streaming"),
  },
  {
    // canvas-confetti kitchen-sink demo. Four preset recipes, each
    // demonstrating a different shape-building technique:
    //   - `shapeFromPath` for the star / heart / bolt SVG paths
    //   - `shapeFromText` for the emoji variants
    //   - colours read from the active theme's CSS vars at fire time
    //   - recipes that demonstrate angle, origin, and sustained calls.
    // Doubles as the reference for how to wire canvas-confetti into any
    // Grade-themed success moment.
    id: "confetti-celebration",
    label: "Confetti celebration",
    description: "Four confetti recipes with custom SVG shapes and theme-aware colours.",
    tags: [
      "confetti", "celebrate", "celebration", "success", "win",
      "party", "hooray", "sparkle", "canvas-confetti",
      "checkout", "complete", "done", "launch",
    ],
    scaffold: requireScaffold("confetti-celebration"),
  },
  {
    // The canonical "two-way bound list ↔ map" pattern. Top filter bar
    // (search, dates via DateRangePicker, guests + type Selects), then a
    // two-pane main: scrollable Card listings on the left, full-bleed
    // <Map> on the right. Hover synchronises both directions through the
    // controlled `hoveredId` / `onHoveredIdChange` pair on Map — no refs,
    // no imperative flyTo. Demonstrates the Map component end-to-end.
    id: "airbnb-listings",
    label: "Stays — listings + map",
    description: "Two-pane stays app: scrollable listing cards on the left, hover-synced full-bleed map on the right.",
    tags: [
      "airbnb", "stays", "rental", "rentals", "listings", "listing",
      "real estate", "realestate", "real-estate", "property", "properties",
      "map", "maps", "geo", "location", "lodging", "hotel", "vacation",
      "fleet", "logistics", "delivery",
    ],
    scaffold: requireScaffold("airbnb-listings"),
  },
  {
    // 3-column kanban board (To Do / In Progress / Done). Each column
    // is its own <Sortable> instance so within-column reorder works
    // immediately. Cross-column drag isn't wired here (v1 limitation —
    // see Sortable.Group on the roadmap); the model can hand-roll
    // @dnd-kit/core for cross-container if needed. Linear-flavoured
    // chrome: status badges, priority pills, assignee avatars.
    id: "kanban-board",
    label: "Kanban board",
    description: "Three-column kanban (To Do / In Progress / Done) with within-column sortable issues.",
    tags: [
      "kanban", "board", "kanban board", "sprint", "sprint board",
      "issues", "tickets", "tasks", "todo", "trello", "asana", "jira",
      "linear board", "project board", "drag", "drag and drop",
      "sortable", "reorder",
    ],
    scaffold: requireScaffold("kanban-board"),
  },
  {
    // Linear-flavoured issue tracker: AppShell with Sidebar nav
    // (Inbox / My issues / Mentions + Workspace + Projects), a sortable
    // issue list on the left, and a detail pane on the right with a
    // TipTap-backed comment composer (StarterKit + Placeholder).
    // Pinned by tags like "linear", "issues", "tracker".
    id: "linear-clone",
    label: "Linear clone — issue tracker",
    description: "Sidebar + sortable issue list + detail pane with a TipTap comment composer.",
    tags: [
      "linear", "linear clone", "issue tracker", "issues", "tickets",
      "tracker", "comments", "tiptap", "rich text", "mentions",
      "project management", "pm", "shortcut", "github issues",
      "sprint planning", "backlog",
    ],
    scaffold: requireScaffold("linear-clone"),
  },
  {
    // Notion-flavoured doc workspace: AppShell with Sidebar workspace
    // header + nested page tree + favourites; main has a Notion-style
    // breadcrumb, big emoji + title block, and a TipTap editor as the
    // page body (StarterKit gives markdown shortcuts; Placeholder for
    // the "/" hint). Slash-menu / block-type picker is a follow-up.
    id: "notion-clone",
    label: "Notion clone — doc workspace",
    description: "Workspace sidebar with nested page tree + TipTap editor as the page body.",
    tags: [
      "notion", "notion clone", "docs", "documents", "wiki",
      "knowledge base", "kb", "page tree", "nested pages",
      "rich text", "tiptap", "editor", "writing", "obsidian",
      "evernote", "logseq", "workspace",
    ],
    scaffold: requireScaffold("notion-clone"),
  },
];

/**
 * Components these scaffolds reach for but that don't exist in
 * `@gradeui/ui` yet. Not used at runtime — authoring note. Drives the
 * roadmap for which components to ship next so the model can stop
 * hand-rolling them.
 *
 * Map (HIGH PRIORITY — blocks commercial demos)
 *   What: a provider-agnostic map primitive with pluggable backends
 *   (Google Maps, Apple MapKit JS, Mapbox GL, Felt). API surface: a
 *   <Map> container that accepts `provider`, `center`, `zoom`,
 *   `style`, `children`; a <MapMarker> for pinned locations; a
 *   programmatic ref exposing `flyTo(id)` / `panTo(coords)` so
 *   sibling components (e.g. a listing card in an Airbnb layout)
 *   can steer the viewport on hover or click. Unlocks the
 *   airbnb-listings reference layout (below) as well as any
 *   location-first SaaS demo (fleet, logistics, real estate).
 *   Stretch: "infographic" mode driven by d3 (choropleths, flow
 *   arrows, bubble overlays), and a 3D variant via Mapbox GL's
 *   extrusion layer or deck.gl.
 *
 * DataViz primitives (d3-backed)
 *   What: opinionated wrappers for the hard charts recharts doesn't
 *   cover well — Sankey, chord, hierarchical (treemap/sunburst),
 *   choropleth. Thin shells over d3 so they compose with the theme
 *   tokens. Same shape as the current recharts-based charting: the
 *   model imports them from "@gradeui/ui" and passes data.
 *
 * DataTable
 *   What: a TanStack Table wrapper with sorting, filtering, column
 *   visibility, row selection, and pagination. Today the `Table`
 *   component is structural-only — the data-table-filters scaffold
 *   hand-rolls the filter bar and pagination row. A DataTable would
 *   absorb that chrome and expose slots for bulk actions, column
 *   config, and density.
 *
 * Scroller / Carousel
 *   What: a horizontal overflow container with scroll-snap, optional
 *   arrow controls, and IntersectionObserver-driven "first/last"
 *   state for disabling those arrows. Used heavily by the music-app
 *   and tv-streaming scaffolds — right now they hand-roll
 *   `overflow-x-auto` which works but has no keyboard nav, no
 *   snapping, and no affordances.
 *
 * Rating
 *   What: a 5-star display (readonly + interactive variants) driven
 *   by a numeric value, with half-star precision and an optional
 *   count label. The ecommerce-listing scaffold hand-rolls stars
 *   from lucide `Star` + conditional fill — fine for now, but
 *   every ecommerce / review layout will want this.
 *
 * Slider
 *   What: single-thumb and range-thumb variants for price filters,
 *   volume, opacity, etc. The ecommerce filter sidebar above uses two
 *   number inputs as a stand-in because there's no slider primitive.
 *
 * Breadcrumb
 *   What: semantic breadcrumbs with a separator glyph. The ecommerce
 *   scaffold renders a raw "Home / Women / Running" string — works
 *   but isn't keyboard-navigable and has no truncation behaviour.
 *
 * Sheet / Drawer
 *   What: side-sliding panel (distinct from Dialog's centered modal).
 *   Mobile-friendly filter panels, user-editor side drawers, etc.
 *
 * Tooltip
 *   What: hover/focus tooltip. Useful on icon-only Buttons in the
 *   toolbars above.
 *
 * Toast
 *   What: transient notifications ("Added to cart", "Changes saved").
 *   Not required by these scaffolds but the next feature they'd
 *   sprout.
 */
export const MISSING_COMPONENTS = [
  // Map shipped in @gradeui/ui@0.9.0 — sidecar at sidecars/map.md, design
  // doc at packages/ui/MAP.md. The `airbnb-listings` reference layout below
  // is now unblocked and ships in a follow-up changeset.
  "DataViz", // d3-backed — choropleth, treemap, sankey; 3D map stretch goal
  "DataTable",
  "Scroller",
  "Rating",
  "Slider",
  "Breadcrumb",
  "Sheet",
  "Tooltip",
  "Toast",
] as const;

/**
 * Reference layouts we WANT to ship but that depend on a missing
 * component. Parked here so the moment a primitive lands the scaffold
 * is cheap to add.
 *
 * (Empty — `airbnb-listings` shipped in @gradeui/studio@<next> alongside
 * the Map component. Add new entries here whenever a layout idea blocks
 * on a MISSING_COMPONENTS entry above.)
 */
