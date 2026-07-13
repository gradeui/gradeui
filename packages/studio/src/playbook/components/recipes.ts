/**
 * Recipe retrieval — the pattern-level sibling of the sidecar refs loader.
 *
 * Registry BLOCKS in group "Recipes" are worked page-level compositions
 * (harvested from a DS's MCP or hand-authored) whose source headers carry
 * a `// keywords:` line — ready-made retrieval vocabulary. This module
 * turns those keywords into prompt context: "add a stats row" pulls the
 * StatsGrid recipe into the request the same way a "button" mention pulls
 * the Button sidecar ref.
 *
 * Same rules as refs.ts: no fs, no network, no React. Pure string-in →
 * object-out over the registry's serialisable blocks, cached per registry
 * id. Recipes are BIG (whole JSX sources, ~0.5–2KB each), so retrieval is
 * deliberately stingy: phrase-anchored matches only, ranked by hit count,
 * capped at MAX_RECIPES per request. An unmatched request pays zero.
 */

import { GRADE_REGISTRY } from "../../registry/gradeui";
import type {
  DesignSystemRegistry,
  RegistryBlock,
} from "../../registry/types";

/** Parsed retrieval view of one recipe block. */
export interface RecipeRef {
  id: string;
  name: string;
  description?: string;
  /** Retrieval vocabulary from the source's `// keywords:` header line. */
  keywords: string[];
  /** Kebab-case component families from `// components:` — reserved for
   *  pinning those components' sidecar refs alongside the recipe. */
  components: string[];
  /** The full block source (imports + JSX), shipped verbatim. */
  source: string;
}

/** Max recipes folded into one request — each is a whole JSX pattern, so
 *  two is already ~600–1000 tokens. Raise only with evidence. */
const MAX_RECIPES = 2;

// ─── Parsing ──────────────────────────────────────────────────────────────

/** Pull a `// key: a, b, c` header line out of a recipe source. */
function headerList(source: string, key: string): string[] {
  const m = source.match(new RegExp(`^//\\s*${key}:\\s*(.+)$`, "m"));
  if (!m) return [];
  return m[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toRecipeRef(block: RegistryBlock): RecipeRef {
  return {
    id: block.id,
    name: block.name,
    description: block.description,
    keywords: headerList(block.source, "keywords"),
    components: headerList(block.source, "components"),
    source: block.source,
  };
}

// Per-registry cache keyed by registry.id — blocks are static generated
// modules, so parsing once per process is safe (HMR replaces the module
// and the cache with it).
const RECIPE_CACHE = new Map<string, RecipeRef[]>();

function getRecipes(
  registry: DesignSystemRegistry = GRADE_REGISTRY,
): RecipeRef[] {
  let recipes = RECIPE_CACHE.get(registry.id);
  if (!recipes) {
    recipes = Object.values(registry.blocks ?? {})
      .filter((b) => b.group === "Recipes")
      .map(toRecipeRef)
      .filter((r) => r.keywords.length > 0);
    RECIPE_CACHE.set(registry.id, recipes);
  }
  return recipes;
}

// ─── Retrieval ────────────────────────────────────────────────────────────

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Score recipes against a free-form text blob (the user's ask + running
 * conversation) and return the winners, best first, capped at MAX_RECIPES.
 *
 * A keyword phrase matches when every word appears in sequence with
 * flexible whitespace between them ("stats grid" matches "a stats  grid
 * of KPIs"), word-boundary-anchored with optional plural on the last word
 * ("stat cards" ← "stat card"). The recipe NAME also counts as a phrase
 * ("StatsGrid" matches literally; its space-split form "stats grid" rides
 * via keywords). Rank = number of distinct matched phrases — a recipe
 * whose vocabulary the request hits three times beats a one-hit wonder.
 */
export function relevantRecipes(
  text: string,
  registry?: DesignSystemRegistry,
  opts?: { max?: number },
): RecipeRef[] {
  const recipes = getRecipes(registry);
  if (!text || !recipes.length) return [];
  const max = opts?.max ?? MAX_RECIPES;

  const scored: { recipe: RecipeRef; score: number }[] = [];
  for (const recipe of recipes) {
    const phrases = [recipe.name, ...recipe.keywords];
    let score = 0;
    for (const phrase of phrases) {
      const words = phrase.trim().split(/\s+/).map(escapeRe);
      if (!words.length) continue;
      // Optional plural on the LAST word only ("stat card(s)"), matching
      // the refs loader's `(?:es|s)?` behaviour. `(?<!\.)` rejects the
      // method-call shape, same false-positive guard as refs.ts.
      const last = words.length - 1;
      words[last] = `${words[last]}(?:es|s)?`;
      const re = new RegExp(
        `(?<!\\.)\\b${words.join("\\s+")}\\b`,
        "i",
      );
      if (re.test(text)) score++;
    }
    if (score > 0) scored.push({ recipe, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((s) => s.recipe);
}

// ─── Rendering ────────────────────────────────────────────────────────────

/**
 * Format retrieved recipes as a system-prompt stanza. Sources ship
 * verbatim (imports + header comments included — the `// Name — desc`
 * line doubles as labelling inside the fence). Returns "" for an empty
 * list so callers can join unconditionally.
 */
export function renderRecipesBlock(recipes: readonly RecipeRef[]): string {
  if (!recipes.length) return "";
  const body = recipes
    .map(
      (r) =>
        `### ${r.name}${r.description ? ` — ${r.description}` : ""}\n` +
        "```jsx\n" +
        `${r.source}\n` +
        "```",
    )
    .join("\n\n");
  return [
    "COMPOSITION RECIPES — worked patterns from this design system that match the request.",
    "Use the matching recipe as the STRUCTURAL BASIS for that part of the screen: same compound components, same nesting, same dataHook style. Adapt names, copy, and data to the request; do NOT rebuild the pattern from primitives or restyle its components.",
    "",
    body,
  ].join("\n");
}

/** Introspection for debugging — not used by the prompt pipeline. */
export function listRecipeRefs(
  registry?: DesignSystemRegistry,
): ReadonlyArray<RecipeRef> {
  return getRecipes(registry);
}
