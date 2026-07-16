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

### Flow-share presentation — prototype vs MAP (Ali, later same night)

Sharing a flow (or any tag facet) is really sharing a SET of screens.
Two presentation modes on the same share record:

- **Prototype** (default, exists today): the entry screen, walkable via
  the goto graph — the current share flow, scoped to members.
- **Map**: the member screens ARRANGED on a canvas — auto-laid-out
  tiles with arrows drawn from the data-grade-goto edges (the flow map
  is already computed server-side; the edges are just parsed goto
  targets). Click a tile → zoom into it and continue as the prototype.
  Rendering many screens = STUDIO-CAPTURE posters with
  promote-to-live-on-focus (the grid policy), NOT n live iframes; the
  arrows + auto-layout are STUDIO-CANVAS vocabulary (a flow map is a
  read-only canvas scene). A `?view=map` param on /s/<token> picks the
  mode; the share chrome gets a Prototype ⇄ Map toggle.

This makes the flow share double as the STAKEHOLDER OVERVIEW ("here's
the whole journey at a glance") and the walkthrough, from one link.

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
  SHIPPED f60db6b (tags only; tag_defs registry still open).
- **T1 — the rail**: list view, group-by, filter bar, bulk tagging.
  SHIPPED 17 Jul (33dec48 + follow-ups): grid ⇄ list toggle, group-by
  single-cardinality types, faceted filter chips, bulk type:value bar,
  datalist autocomplete of the project vocabulary, chart-ramp tag
  colours (per-TYPE via tagTypeColor), view prefs persisted per project
  (projects.view_prefs, migration 0022 + localStorage mirror).
  Still open from the T1 spec: drag-between-groups rewrites the tag.
- **T2 — flows**: flow type with entry/order/tagAlias, share-a-flow,
  flow-scoped goto resolution. FIRST SLICE SHIPPED 17 Jul:
  `share_links.scope` jsonb (migration 0023) — { tag } (members resolve
  at view time — re-tagging updates the link) or { screens } (explicit
  ad-hoc set, "share these two", no tag ceremony); /s AND /e filter
  their flow maps to members (entry always included; out-of-scope goto
  targets don't resolve). Mint from the list view: Share on a group
  header (entry = the tag's entry:true member, else first) or Share on
  the multi-select bar. Still open: tagAlias flow-scoped goto
  resolution, stable-URL-per-tag (mint-once + regenerate), map view.
- **T3 — agent**: MCP tag params + filters; harness flow context.
- **T4 — views**: saved filter/group presets per project; the F2 flow
  bar consuming flow membership.

## Comparisons as a tag-scoped share (Ali, 16 Jul — T2 material)

The A/B use case, concrete: duplicate a screen, hard-code different
shell tweaks in the source (`<AppLayoutShell sidebarTone="brand">` vs
`"white"` — already works, the presets are props), tag both into a
2-member set ("Nav White vs Nav Brand"), share the TAG. Tags travel
with the share; because a share points at screens (not snapshots), the
shared set live-updates as screens change. Great for: a flow, a few
screens, A-vs-B decisions.

Tag-proliferation worry (Ali: "what I don't want is so many tags") —
the decision points, deliberately NOT decided yet:
- (a) built-in `compare` type — single purpose, keeps `section` clean;
- (b) reuse `flow` mechanics — a comparison IS a small ordered set
  with variants (tagAlias already covers A/B answering one target);
  share chrome renders "A vs B" instead of a walkthrough when the set
  is small — one mechanism, presentation-level distinction;
- (c) comparisons as their own rail section (a VIEW over (a) or (b)).
Current lean: (b) + display hint. Decide at T2 kickoff.

Also from the same riff (Ali): tags read technical — bare values ("White
VS Black", "General Layout Variants and Options") already work via the
`label` facet, but a real TAG EDITOR (the ProjectTagDef registry — it
already carries `description` per value) is where human-friendly naming
+ descriptions live. And: a comparison tag could trigger a Playwright
CAPTURE of its share canvas ("IMAGINE THAT") — that's the share-OG
pipeline (BRIGHTLOCAL-SIDENAV.md "QUEUED — share-link OG images")
pointed at a scoped share's map view: fourth consumer of the
STUDIO-CAPTURE primitive.

Implication for `share_links.flow`: name the column `share_links.tag`
(type+value) from the start — flow is just the first tag type shares
scope to.

STABLE URL PER TAG (Ali, same night): a tag's share link should be the
"one consistent share-screens place" — mint AT MOST ONE live share per
(project, tag); re-sharing the tag returns the SAME url (with an
explicit "regenerate" to rotate the token when you actually want to
revoke). List the share url against the tag wherever the tag renders
(rail group header, filter chip menu, tag editor) so "where do I send
people for the nav comparison?" is answered by the tag itself. Members
update live because the share resolves the tag at view time — sending
the link once and re-tagging screens IS the publish action.

## Tag groups + viewer-side choice (Ali, 17 Jul — T2/T4 material)

"Here are some layout and color options" / "Here are some Animation
page transitions": share SEVERAL tags at once and let the VIEWER pick
which set to look at — the share chrome grows a facet switcher (chips /
menu over the scoped tags). The insight: canvas tools show everything
at once; a tag-scoped share gives LESS distraction, and viewer-side
facet choice gives back the breadth without the noise.

Shape that falls out (no new storage concept needed):
- `scope.tags: [{type,value}, …]` — the scope generalises from one tag
  to a SET (OR membership). Viewer chrome renders the tags as a
  switcher; picking one filters the flow map / member list live.
- A NAMED set — Ali's "tag-group: Visual and Animation choices" — is
  exactly T4's saved preset: a preset IS a named tag group. Share the
  preset = share its tag set with a title. So tag-group isn't a new
  taxonomy layer; it's a name over scope.tags, stored with the presets.
- Pairs with the Prototype ⇄ Map toggle: the map view PARTITIONED by
  the chosen facet is the "here are your options" stakeholder screen.
- MEMBER TAGS RIDE THE SHARE (Ali, 17 Jul: "do other tags go with it?
  could you order by other tags inside the share?"): today /s strips
  members to {id, name, appSource}; include `tags` and the compare-row
  chrome can offer viewer-side ORDER BY / GROUP BY over any facet the
  members carry — e.g. a flow share ordered by `section`, or clustered
  into labelled runs along the row (wider gap between groups, group
  name pill above each run). Same registry-less facet inference as the
  rail (collectTagFacets). This is the 1D-row sibling of the map view's
  partitioning; one control, two presentations.

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
