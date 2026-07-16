# STUDIO-TAGS — typed tags, grouped views, and flows as a facet

**Status:** Draft (16 Jul 2026, evening session with Ali — captured for
pickup in a fresh session; nothing built). Siblings: STUDIO-FLOWS (flow
tags give its "share a flow" answer a first-class handle),
STUDIO-CANVAS (the scene graph will want the same facets),
STUDIO-AUDIT (tag writes are `logEvent` material), STUDIO-PERSISTENCE
(same dirty-tracking rules apply to tag writes).

## The problem

A proposal project accumulates screens fast — the BrightLocal project
went from 2 to 5 in one evening, and "I can see myself easily drowning
in 20 or more screens". The screens rail is a flat position-ordered
list with no way to see which sections are what, view as a list,
filter, or group.

## The decision — flat typed tags; hierarchy is a VIEW, not storage

Folders and tags are not competing features. A folder is a tag type
whose semantics are "single-valued per screen, and the list groups by
it". Store ONE mechanism — typed tags — and render many:

- **Faceted classification** (the Notion/Linear convergence): a screen
  carries `tags: [{ type, value }]` — `section: rankings`,
  `status: draft`, `client: acme`, `flow: proposal-walkthrough`.
- **Group by** any type → collapsible groups in the rail. That IS
  folders. Drag between groups rewrites the tag; ordering within a
  group stays the existing `position`.
- **Filter** is faceted: OR within a type, AND across types
  ("section:rankings AND status:draft").
- Single-parent folders break on cross-cutting screens (a screen is in
  "Rankings" AND "needs review" AND "the share flow" — folders force a
  choice, facets don't). If real nesting is ever needed, path VALUES
  ("rankings/settings") add it without changing storage.

## The taxonomy contract

**Tag** — `{ type: string, value: string }`. Both are project-scoped
strings; no global vocabulary.

**Tag registry** (per project) — what keeps 20 screens from growing 40
spellings of "ranking". Defines the types, their semantics, and value
metadata:

```ts
interface ProjectTagDef {
  type: string;              // "section" | "status" | "flow" | custom
  label: string;             // display name
  /** ONE value per screen (folder-like) or many (label-like). */
  cardinality: "single" | "multi";
  /** Known values, in display order, with optional color + description.
   *  Free entry is still allowed (registry autocompletes + normalises);
   *  `strict: true` locks a type to its defined values. */
  values: { value: string; color?: string; description?: string }[];
  strict?: boolean;
}
```

**Built-in types** (seeded per project, deletable, all just tags):

- `section` — single-valued, the folder facet. Default group-by.
- `status` — single-valued: draft / review / final. Renders a badge.
- `flow` — multi-valued, ordered (see below). The STUDIO-FLOWS facet.
- Anything else is a custom type via the registry.

## Flows as a facet (Ali's intriguing bit)

STUDIO-FLOWS F0 established: "a flow share IS a screen share whose
screen links onward" — the flow exists only implicitly in the
data-grade-goto graph. A `flow` tag makes it addressable:

- **Tagging a flow**: `flow: proposal-walkthrough` on each member
  screen. The tag's per-screen record carries two extras (stored in the
  same tag object): `entry: true` on the suggested starting screen, and
  `order: n` for the intended reading sequence (drives a flow list
  view; free navigation is still the goto graph, not the order).
- **Share a flow** = mint the share link against the flow's ENTRY
  screen (which already works today) and record the flow tag on the
  share row. The share view then scopes its flow map to the tagged
  member screens instead of the whole project — the F2 "flow bar" gets
  its member list for free, and unrelated WIP screens can't be reached
  from a client link even if a stray goto points at them.
- **Multiple flows through different screens — Screen A vs Screen B**:
  two flows can share most screens and diverge on variants:
  `flow: concept-a` tags "Rankings Table A", `flow: concept-b` tags
  "Rankings Table B", both flows tag the same hub + LSG screens. The
  interesting mechanic is **flow-scoped goto resolution**: when a share
  is scoped to a flow, name targets resolve against the flow's members
  FIRST, project-wide second. A `tagAlias` on the tag record
  (`tagAlias: "Rankings Table"`) lets both variant screens answer the
  SAME logical target — the hub's card says goto="Rankings Table" and
  each flow routes it to ITS variant. One hub screen, two shareable
  walkthroughs, A/B by link. No screen duplication beyond the variant
  itself.

## Storage

- `designs.tags` — jsonb array of
  `{ type, value, entry?, order?, tagAlias? }`. Same no-migration
  pattern as `projects.rules_files`; absent = untagged (every existing
  screen is valid).
- `projects.tag_defs` — jsonb array of `ProjectTagDef`. Seeded with the
  built-ins on first tag write.
- `share_links.flow` (nullable) — the flow a share is scoped to; null =
  today's whole-project map. Additive column, existing shares
  unaffected.
- Local-adapter mirrors for the self-host mode; tags ride the existing
  autosave signature (a tag change IS a content change — dirty-tracking
  rules from STUDIO-PERSISTENCE apply).

## Rail UI

- **View toggle**: current thumbnails ⇄ compact list (name, tags,
  status badge).
- **Group by**: none (position) | any single-cardinality type. Groups
  are collapsible; group headers show counts; drag between groups
  rewrites the tag; drag within keeps `position` semantics.
- **Filter bar**: type-ahead over the registry, chips for active
  facets; OR within type, AND across.
- **Tag editor**: screen context menu + a Tags section in the screen
  inspector; bulk-apply from a multi-select in list view.
- View state (view/group/filter) persists per project in localStorage
  under the `gds-*` namespace.

## MCP / agent surface

- `save_screen` / `create_screen` grow an optional `tags` param;
  `list_screens` returns tags and takes a filter. The agent files
  screens as it makes them ("tag this into the rankings section, flow
  proposal-walkthrough") — at the current creation rate the agent is
  the drowning-risk generator, so it must also be the filer.
- Generation harness: the ACTIVE flow (if the user is working within
  one) rides the prompt so new screens inherit the flow tag + get
  suggested goto wiring against flow members.

## Rollout

- **T0 — substrate**: `designs.tags` + `projects.tag_defs` +
  adapter/type plumbing + tag editor in the inspector. No rail changes.
- **T1 — the rail**: list view, group-by, filter bar, bulk tagging.
- **T2 — flows**: flow type with entry/order/tagAlias, share-a-flow
  (share_links.flow + scoped flow map in /s and /e), flow-scoped goto
  resolution.
- **T3 — agent**: MCP tag params + filters; harness flow context.
- **T4 — views**: saved filter/group presets per project; the F2 flow
  bar consuming flow membership.

## Open questions

- Does `section` group-by replace or compose with the canvas's spatial
  arrangement once STUDIO-CANVAS lands (a group could BE a canvas
  region)?
- Tag colors: per-value in the registry (proposed) vs per-type.
- Should flow `order` drive share-view "next" affordances (a subtle
  forward chip), or is that Director territory (STUDIO-DIRECTOR owns
  scripted sequences)?
- Rename propagation: registry value rename rewrites member tags in one
  transaction — needs the bulk-update path (and an audit event).
