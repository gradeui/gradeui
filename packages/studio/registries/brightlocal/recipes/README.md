# Recipes — worked composition patterns the agent can retrieve

A **recipe** is a small, hand-editable JSX file showing how this design
system composes a page-level pattern the RIGHT way — a stats grid, a
login page, a data-table page. They exist because component references
(sidecars) teach the model individual APIs, but not how a DS expects
them to be *assembled*. Recipes fill that gap with worked examples.

## Where recipes surface

1. **The Blocks browser** — every recipe renders as a browsable card in
   Design System → Blocks, under the "Recipes" group.
2. **Generation retrieval** (the important one) — when a chat request
   matches a recipe's keywords, the recipe's full source rides into the
   model's prompt as a "COMPOSITION RECIPES" stanza, with instructions
   to use it as the structural basis rather than rebuilding the pattern
   from primitives. "Add a stats row" pulls in StatsGrid; "make a login
   page" pulls in LoginPage. A request that matches nothing pays zero
   tokens.

Retrieval lives in `packages/studio/src/playbook/components/recipes.ts`:
keyword phrases are matched case-insensitively with word boundaries and
plural tolerance ("stat cards" matches "stat card"), recipes are ranked
by how many distinct phrases hit, and at most **2** recipes ride per
request (each is a whole JSX source, ~300–500 tokens). Retrieved recipes
show in the chat's refs chip suffixed "(recipe)".

## File format

```jsx
// StatsGrid — A grid of statistic cards showing key metrics with labels and values.
// keywords: stats grid, statistics, metrics, dashboard cards, KPI cards, stat cards
// components: card, typography

<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  ...
</div>
```

- **Line 1** — `// Name — description`. Drives the Blocks card and the
  prompt stanza heading. The Name also counts as a retrieval phrase.
- **`// keywords:`** — comma-separated retrieval vocabulary. This is the
  part worth curating: write the phrases a *lazy prompt* would actually
  use ("stats row", "KPI cards"), not internal jargon. More specific
  multi-word phrases beat single common words (a keyword like "page"
  would match almost every request).
- **`// components:`** — kebab-case component families the recipe uses.
  Reserved for pinning those components' sidecar refs alongside the
  recipe.
- **Body** — imports (optional) + one JSX tree. `{/* slot */}` comments
  render as dashed placeholders in the Blocks preview. Identifiers that
  exist only in the original story file are declared in the generated
  block's `freeIds` and shimmed in previews.

## Adding or editing a recipe

1. Add/edit the `.jsx` file in this directory.
2. Re-run `node scripts/generate-registry-recipes.mjs` (from
   `packages/studio/`) — it rebuilds `recipes.generated.ts`.
3. Restart/reload dev. Both the Blocks browser and retrieval pick the
   change up from the regenerated module.

⚠️ The MCP **harvester** (`harvest-brightlocal-mcp.mjs` recipes pass)
OVERWRITES files it re-harvests. If you've hand-curated a recipe, rename
the file so the harvester's name no longer matches — renamed files are
yours.

## Rules vs recipes (vs templates)

- **Rules** (`../rules/*.md`) ride on EVERY prompt — terse, universal
  constraints (house style, glossary, voice). Toggleable per project in
  the Rules screen.
- **Recipes** (here) load ON DEMAND via keyword retrieval — one pattern,
  fetched only when asked for.
- **Templates** (`../templates/*.jsx`) are full-page scaffolds applied
  directly as a new screen's source from the Starters picker — no model
  involved at all.

When knowledge is about *everything*, make it a rule. When it's about
*one pattern*, make it a recipe. When it's a *whole starting screen*,
make it a template.
