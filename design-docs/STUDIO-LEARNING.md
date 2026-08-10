# Studio Learning

How Studio gets better with use, without fine-tuning the underlying LLM.

> Status: design doc. Drafted 2026-05-20.
> Companion to [`STUDIO.md`](../packages/studio/README.md) (the playbook), [`apps/docs/STUDIO.md`](../apps/docs/STUDIO.md) (the Studio app), and the skill-as-add-on architecture documented in `packages/skills/`.

**Terminology note** — "corpus" is the standard ML/IR term for the curated body of examples a retrieval system searches over. Throughout this doc, "the corpus" = the set of known-good layouts/sections/elements with their embeddings, metadata, and preference weights. Think of it as the system's memory of what good looks like for THIS audience.

---

## Problem

Today's Studio generates every layout via an LLM round-trip. That's:

- **Slow.** Even Flash-class models take seconds. Users wait.
- **Expensive.** Tokens per prompt scale with the playbook + ref injection. Memory has "route-level token optimization for chat speed (unbounded ref injection)" — this is the same wound from a different angle.
- **Forgetful.** The same prompt today and in six months returns equivalent quality. There's no mechanism by which the system improves at the things this specific audience cares about.

What we want is for Studio to feel faster, cheaper, AND more aligned with its users' taste the longer they use it. Without touching model weights.

## The shape of the solution

Three composable pieces, none of which require fine-tuning:

1. **Local-first retrieval** over a curated corpus of known-good layouts, sections, and patterns. The corpus is embedded at build time; the user's prompt is embedded at query time; cosine similarity surfaces matches.

2. **A user-facing toggle for Generation Source** — `LLM | Corpus | Compare`. Each mode trades off speed, flexibility, and learning rate. The toggle is visible (not hidden as a system optimization) because the user makes the cost/freshness tradeoff explicitly.

3. **A preference loop** — accept/reject signals plus *localized comments on specific nodes* feed back into the corpus. Comments are the unlock: one bit of signal per thumbs-vote, vs. structured negative-signal-on-a-specific-element per comment.

A fourth piece sits in front of all three: **intent triage** — a brief skill that runs BEFORE retrieval/generation, asks clarifying questions, and shapes the prompt into something the rest of the system can actually act on confidently. Without it, the loop above starts from impoverished prompts and fights to recover.

A fifth piece runs across all of the above: **generative UI in chat** — the chat surface itself becomes interactive, not just a text channel. Questions are clickable cards, layout comparisons are visual pickers, icon swaps are searchable galleries, voice input sits alongside typing. This is a deliberate product position, not just an implementation detail — see "Generative UI in chat" section below.

The LLM itself never changes. What changes is **what gets retrieved**, **what gets served**, **what context the LLM sees** when we do call it, and **how well-specified the user's intent is** by the time any generation happens.

## Intent triage — the App Brief skill

Most prompts are under-specified. "Build me a CRM" or "make a settings page" are starting points, not instructions. Today, the LLM fills the gaps by guessing — which is exactly the source of the "this doesn't feel right" gap that costs comments to repair.

The App Brief skill runs first. It:

1. **Triages the prompt.** Is there enough info to act? If yes, pass through unchanged. If no, what's missing?
2. **Asks the missing questions.** Specifically, the small set that disambiguates the most — typically 2-4 quick choices, not an interrogation. Same AskUserQuestion shape we already use elsewhere.
3. **Shows layout candidates inline.** When the corpus has plausible matches, surface 2-3 as part of the brief — "are you thinking something like one of these?" Same retrieval engine, mid-brief.
4. **Surfaces axis-style preferences** — see below.
5. **Emits a structured brief** that becomes the actual generation prompt: `{ intent, audience, density, dataShape, references, constraints }`.

The brief itself is corpus-eligible. A good prompt is reusable; a clarified brief even more so.

### Display axes — "visual weight" as a first-class control

Same data, very different presentations. A user list can be a table (dense, utilitarian) or an editorial card spread (light, narrative). The user often doesn't know they have a preference until shown the alternative. The brief surfaces these as named axes:

```
Visual weight    [ editorial ●───────────── spreadsheet ]
                   (cards, hero)             (dense table)

Density          [ sparse ●─────────────── packed ]
                   (lots of whitespace)     (info per pixel)

Information      [ at-a-glance ●────────── drillable ]
                   (summaries first)       (details first)
```

The same retrieval query with `visualWeight: 0.2` (editorial-leaning) and `visualWeight: 0.8` (spreadsheet-leaning) returns structurally different layouts even when the underlying data is identical. The corpus tags entries on these axes; the model gets the axis values in its context.

This isn't theoretical: visual-weight preference correlates strongly with audience (consumer apps lean editorial, B2B power tools lean spreadsheet) and brand. Capturing it as an explicit axis lets the corpus split cleanly along it, instead of trying to learn one "canonical" answer.

### Gaps capture as a brief byproduct

When the brief runs and the retrieval/generation can't produce something close to the asked-for shape — because the primitive doesn't exist, or the contract doesn't support a needed prop — that's a **design system gap** worth logging. The brief skill writes these to a sidecar gaps log:

```ts
type DSGap = {
  recordedAt: string;
  prompt: string;
  brief: AppBrief;
  what: string;              // "no Kanban primitive"
  workaround?: string;       // what got generated instead
  votes: number;             // bumped when re-encountered
};
```

The scaffold-playground views already prompted this kind of thinking — gaps in the DS surfaced as a separate concern. Making it a structured artifact means the gap list IS the design system roadmap, ranked by how often each gap actually blocks a real generation.

## Generative UI in chat

The chat surface itself goes from text channel to a rich interactive workspace — questions render as cards, layout comparisons as visual pickers, icon swaps as searchable galleries, voice sits alongside typing. This is a deliberate product position and a substantial body of work in its own right.

**The full design for this lives in [`STUDIO-CHAT.md`](./STUDIO-CHAT.md)** — protocol (AI SDK tool calls + custom UI parts), tool catalog (askQuestions, proposeLayouts, confirmGap, suggestRename, pickIcon, confirmDestructive, saveAsUserComponent, reviewLearnings), Vercel AI Elements adoption, voice input, inline artifacts vs canvas artifacts, rollout phases A–F.

**Why it's split out:** the learning architecture (this doc) is about *what the system learns and what it generates*; the chat doc is about *how it presents that to the user*. They cross-reference for individual features — `proposeLayouts` writes to the corpus (here) and renders as a chat-inline gallery (there).

## Architecture

### The corpus

A flat array of entries, each:

```ts
type CorpusEntry = {
  id: string;                          // stable, content-hashed
  kind: "layout" | "section" | "element";
  source: "seed" | "user-saved" | "generated-accepted";

  // Filters — categorical, narrow the search space BEFORE ranking.
  // Retrieval applies these as a where-clause; axes + similarity
  // rank within the filtered set. Apps and websites are
  // structurally different (sidebar navs vs hero sections); the
  // axes alone don't capture that, so we split categorically.
  domain:  "app" | "website" | "email" | "doc" | "embed";
  purpose: string;                     // "auth" | "settings" | "dashboard" |
                                       // "marketing-landing" | "pricing" |
                                       // "onboarding" | "checkout" | …
  surface: "page" | "modal" | "panel" | "section" | "card-block";

  // Axes — continuous, drive ranking within a filter set.
  axes: {
    visualWeight: number;              // 0=editorial, 1=spreadsheet
    density: number;                   // 0=sparse, 1=packed
    information: number;               // 0=at-a-glance, 1=drillable
  };

  // Display
  name: string;                        // "3-col dashboard, sidebar nav"
  description: string;                 // 3-5 line intent
  thumbnail?: string;                  // optional preview

  // Payload
  jsx: string;                         // the actual code
  manifest: Manifest;                  // what props it accepts

  // Retrieval
  embedding: number[];                 // 384 dims (all-MiniLM-L6-v2)
  promptSignals: string[];             // canonical phrasings that hit this entry

  // Preference data
  weight: number;                      // 1.0 default; nudged by feedback
  comments: NodeComment[];             // localized negative signals
  acceptedAt: string[];                // ISO timestamps of accepts
  rejectedAt: string[];
};
```

Built at compile time into `packages/studio/retrieval/corpus.generated.json` by a script that walks reference layouts + user-saved components + accepted-then-rated generations.

### The retrieval engine

`packages/studio/retrieval/` exposes a small interface:

```ts
embed(text: string): Promise<number[]>
findSimilar(query: string, corpus: CorpusEntry[], k?: number): CorpusEntry[]
weightedRank(matches: CorpusEntry[]): CorpusEntry[]
```

`embed` uses `@xenova/transformers` with `Xenova/all-MiniLM-L6-v2` (~22MB ONNX, cached in IndexedDB after first load). `weightedRank` blends cosine similarity with the entry's preference weight, so a slightly less semantically-similar layout that's been accepted 50× still beats a closer match that's been rejected 30×.

The engine knows nothing about layouts specifically. The same engine powers IconPicker semantic search (different corpus, same primitive).

### Generation Source

Studio settings gain a new section:

```
Generation source

  ( ) LLM only — always send to the model. Slow, fresh, flexible.
  ( ) Corpus only — retrieve from saved layouts. Instant, no model cost,
      bounded by what's been seen before. Falls back to LLM when no match
      passes the confidence threshold.
  (•) Compare — runs both, shows side-by-side, learns from your pick.
      (Recommended while the corpus is small.)
```

Plus a per-prompt override in the chat composer (small picker icon next to send) so the user can flip per-send without leaving the chat.

### The preference loop

Two signal sources, both routed through the same training skill:

**Accept signals (low information, high volume)**
- User kept the generation → +1 weight on the chosen entry
- "Save as User Component" → entry promoted into corpus (the strongest possible signal)
- User regenerated without keeping → −1 weight

**Comment signals (high information, low volume)**
- AI comment annotation on a specific node carries `{ sourceId, componentName, prompt, suggestion, layoutId }`
- Comments on the whole layout carry `{ prompt, suggestion, layoutId }`
- These attach to the corpus entry as structured negative signals localized to nodes the user found wanting

**The training skill (`packages/skills/src/skills/learn-from-session/`)**

Runs on session end OR via explicit "Save what I learned" button. Walks the session's prompts + outputs + signals + comments and updates the corpus:

```
for each accepted layout:
  if not in corpus: embed prompt+layout, add as entry with weight=1.0
  if in corpus:     bump weight, append acceptedAt

for each rejected:
  if in corpus: nudge weight down, append rejectedAt

for each comment:
  attach to entry; if the node has a sourceId, tag the affected sub-tree
  as "candidate for improvement" — surfaces in the auto-name and refactor
  skills later
```

### Mock data — the dependency

Corpus-retrieved layouts ship JSX with mock data baked in. A `<UserCard name="John Doe" email="john@example.com" />` retrieved from corpus and dumped onto canvas would feel broken in a way a fresh LLM output doesn't (the LLM would synthesize plausible-looking names from context).

Minimum viable fix: introduce a `<MockData kind="people" count={N}>{(items) => …}</MockData>` primitive that generates deterministic-but-plausible placeholder data at render time. The corpus stores the layout with `<MockData>` slots, not the rendered output.

Future fix: a `<DataSource>` primitive that connects to real data via MCP connectors. Big piece of work; out of scope for v0 but mentioned so the corpus shape doesn't bake itself into a corner.

## Constraints we're honest about

**Cold start.** The corpus needs initial mass before retrieval feels good. Existing reference layouts are a small starting point but nowhere near enough to span the app/website × purpose × axes grid. The realistic bootstrap is the **seed corpus generator skill** (Phase 0, below) in its Mobbin-fed mode — parallel agents fan out across the taxonomy, the user rates the keepers. A few sessions of rating gets you a usable seed; the slow path of LLM-imagination-then-rate is the fallback, not the primary plan.

**Diversity in Compare mode.** If the LLM picks a layout that's already close to the retrieved candidate, the comparison teaches nothing. So in Compare mode the LLM call gets a small system prompt nudge: "the user has already seen a layout structurally similar to <retrieved>; propose something different." Light touch; doesn't fight the model when it really wants to converge.

**Things this doesn't make better.** Truly novel asks — "build me a tool for visualizing quantum entanglement experiments" — get no benefit, because there's nothing relevant to retrieve. That's fine. Most users are asking for things in the long tail of common patterns.

**Privacy.** The corpus is per-deployment, not shared across users (unless the deployer chooses to). User-generated layouts that flow into the corpus stay local to that org. This needs an explicit policy at the corpus-write step.

## Rollout

Each phase is shippable on its own.

**Phase 0 — Seed corpus generator skill (Mobbin-fed)**

The seed corpus generator has two modes — pick per session:

*Mode A: Mobbin-fed fan-out (preferred)*

[Mobbin](https://mobbin.com) has thousands of curated screens from real production apps, plus an MCP server for programmatic access. Combined with parallel sub-agents, this turns Phase 0 from "user sits and rates LLM imaginations" into "agents fan out across the taxonomy, user rates the keepers."

Concretely:

1. User picks a category tuple to seed: `{ domain: "app", purpose: "settings", count: 20 }`.
2. The skill spawns N parallel sub-agents via the Task tool, each scoped to one category.
3. Each sub-agent:
   - Queries Mobbin's MCP for example screens in that category
   - Vision-extracts **structural pattern descriptions** from each screen (not JSX — see "Legal posture" below)
   - Prompts the LLM to generate JSX from the description, using `@gradeui/ui` primitives
   - Returns `{ description, generatedJsx, axes, screenRef }` to the parent
4. The parent collects results across agents and presents them in one rating UI: keep / discard / adjust axes / freeform note.
5. Accepted entries land in `corpus.generated.json` with the Mobbin screen URL captured in `source` metadata (for provenance, not for redistribution).

The fan-out is the unlock — twenty screens across four categories takes a minute or two of agent wall-clock, not a day of manual prompting. Mobbin's own taxonomy also informs your `purpose` filter values: their categorization is research-grade, better than inventing categories from scratch.

*Mode B: Synthesised (fallback)*

When Mobbin doesn't have what you need (novel internal-tool patterns, custom dashboards, anything not in their catalog), the skill falls back to LLM-only generation:

- Args: `{ domain, purpose, count: 5, axisSpread: true }`
- Prompts the LLM to generate `count` diverse layouts for the given domain/purpose, deliberately spread across the visualWeight axis
- Same rating UI; same `corpus.generated.json` destination

*Legal posture (read before building)*

What flows into the corpus is **original JSX in your own DS** generated from **structural descriptions** of patterns — not screenshots, not scraped code, not pixel-traced layouts. The Mobbin screen URL is captured only as provenance ("this entry was inspired by X") so we can re-examine sources later if quality issues emerge. We never store, redistribute, or display Mobbin's screenshots; we never run vision extraction to reproduce a screen's visual fidelity.

The principle: Mobbin is acting as a *taxonomy + prompt source*, not as a code source. A designer browsing Mobbin and then designing their own version against their own design system is fine; this skill is the automated version of that workflow, scaled across parallel agents.

If Mobbin's terms of service change to prohibit programmatic browsing (or if vision-extraction risks drift toward visual reproduction), Mode A is shut off and Mode B is the only path — the corpus design doesn't break.

**Phase 1 — Retrieval engine + v0 corpus**

- Build `packages/studio/retrieval/` with `embed`, `findSimilar`, `weightedRank`
- Build script: walk `packages/studio/src/playbook/layouts/` + scaffolds, embed, emit `corpus.generated.json`
- No UI yet. Validate the engine via a console-only `studio:retrieve` skill: type a prompt, see top-K matches.

**Phase 2 — Generation Source toggle**

- Add the setting in `studio-settings.tsx`
- "Corpus only" mode: retrieve, render directly into canvas. No LLM call.
- "Compare" mode: split the canvas. LLM on one side, retrieval on the other. User clicks one.
- Add the per-prompt override in chat composer

**Phase 3 — Mock data**

- `<MockData>` primitive in `@gradeui/ui`
- Migrate seed corpus entries to use it (find/replace static names → MockData slots)
- Inspector adds a "Regenerate mock data" affordance (re-rolls the deterministic seed)

**Phase 4 — Preference loop**

- AI comment annotations on canvas (already captured as task #93, now elevated)
- "Test & teach" skill — `packages/skills/src/skills/learn-from-session/`
- Wire accept/reject/comment signals into the corpus updater
- Persist the corpus diff back into the deployment's corpus file (or per-org store)

**Phase 5 — IconPicker as the second consumer**

- Reuses `packages/studio/retrieval/` with a different corpus (Lucide + Phosphor icon names + aliases + semantic descriptions)
- Proves the engine isn't layout-specific

**Phase 6 — App Brief skill + display axes**

- `packages/skills/src/skills/app-brief/` — triages prompts, asks the small set of disambiguating questions, surfaces 2-3 retrieved candidates mid-brief (skill is already written)
- Adds `visualWeight`, `density`, `information` as first-class axes on `CorpusEntry`
- Build script tags seed corpus entries on these axes (manual for now)
- Brief output is itself corpus-eligible — accepted briefs feed Phase 4's preference loop with much higher information density than raw prompts
- Gaps log: brief writes `gaps.generated.json` whenever retrieval/generation can't fulfill the intent. Becomes the DS roadmap input.

**Generative UI in chat (companion track)**

Runs in parallel with the learning rollout — see [`STUDIO-CHAT.md`](./STUDIO-CHAT.md) for its own phased plan. Several phases here block on or are accelerated by chat-side work:

- Phase 6's App Brief skill is just a server-side function until the chat can render `askQuestions` tool calls (Chat Phase A).
- Phase 2's Compare mode renders as `proposeLayouts` chat tool calls (Chat Phase B).
- Phase 4's preference loop captures session signals from tool-result events the chat tools fire when picked.

The two tracks land features together but evolve independently.

**Storage adapter note on gaps + corpus:** v0 is file-based — `corpus.generated.json` and `gaps.generated.json` live in the repo. Both files are loaded through a small `storage` adapter interface (`load()` / `save()` / `append()`), so the later swap to durable per-user or per-org storage (SQLite, cloud blob, whatever) is changing one adapter, not rewriting the consumers. Solo use today is fine on files; designing for the adapter from day one means you won't be doing surgery later.

Anything later is gravy: real-data connectors, fine-tuning a small model on accumulated preferences, cross-org corpus sharing with opt-in.

**Note on competitive context:** Google Antigravity (and similar) ship with massive trained-in priors over good UI patterns. We're not trying to out-prior them — we're building a system where the priors are *the user's audience's*, captured from real use, and visible/editable rather than baked into model weights. The Antigravity-style product is faster out of the gate; this approach gets better at YOUR users' work the longer they use it. Different bet.

## What this is and isn't

It IS:
- A retrieval-augmented generation layer with explicit user-driven curation
- A way to make Studio feel dramatically faster for common patterns
- A way to build a preference dataset that's valuable on its own (research-paper-grade)

It is NOT:
- Fine-tuning the LLM
- A replacement for the LLM (truly novel asks still go through it)
- Free of operational concerns — corpus quality is the new bottleneck; bad seed data poisons retrieval

## Open questions

- Where does the corpus live across deploys? File-based for v0 (lives in repo). Database-backed when multi-user.
- How aggressive is the auto-promote? Does every accepted output enter the corpus, or only those above a threshold? Initial answer: only those the user has actively saved or rated.
- What's the dedup story? Two near-identical entries shouldn't both rank. Cosine similarity threshold on insert + manual merge tooling later.
- Does the comparison surface ever show 3+ options, or strictly LLM-vs-corpus? Strictly 2 for v0; expanding is cheap if the data says it helps.
