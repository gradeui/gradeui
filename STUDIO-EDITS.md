# STUDIO-EDITS — streamed AI edits (true diffs)

**Status:** design doc, no code yet. Phases X0–X4 at the bottom.
**Owner surfaces:** `apps/docs/components/studio/studio-chat.tsx` (parser + apply), `packages/studio/src/playbook/prompts/system.ts` (the contract), `apps/docs/app/api/chat/route.ts` (QA), `apps/docs/lib/` (new `studio-edit-blocks.ts`).
**Siblings:** [STUDIO.md](./apps/docs/STUDIO.md) (system prompt, fence parsing), [STUDIO-CHAT.md](./STUDIO-CHAT.md) (per-turn chat surfaces), [STUDIO-LEARNING.md](./STUDIO-LEARNING.md) (the preference loop these edits feed), [STUDIO-TOKENFIELD.md](./STUDIO-TOKENFIELD.md) + `lib/studio-source-mutator.ts` (the existing no-LLM mutation path this generalises).

## The problem

Every chat turn today regenerates the **full component**. That's the right
contract for "build me a kanban board" and the wrong one for "make that
button red":

- **Latency.** A 300-line screen is ~4–6k output tokens. On the free-tier
  Gemini path that's 20–60 seconds of streaming for a one-line change. The
  actual edit the user asked for is ~30 output tokens.
- **Cost.** Output tokens are the expensive side of every provider's price
  card. Full regen scales the bill with page size, not with change size.
- **Disruption.** A regenerating page can't be live-rendered (we gate the
  speculative draft renderer to fresh builds for exactly this reason — an
  iteration draft visibly collapses the finished page to a half-page
  partial). So iterations sit behind a long hold-then-snap.
- **Drift.** Full regen re-rolls the dice on every line. The model
  occasionally "improves" parts of the page nobody asked it to touch.
  Edits that only carry the change can't drift the rest.

The fix is the approach every serious code-editing agent has converged on
(Aider's SEARCH/REPLACE blocks, Claude Code's Edit tool, Cursor's apply
path): the model emits **anchored search/replace edit blocks**, the client
applies them to the source it already holds, and the preview recompiles
locally. Output tokens shrink from O(page) to O(change); apply is
milliseconds; Fast Frame recompiles in milliseconds; the double-buffered
swap makes the morph invisible except for the changed pixels.

## The wire contract (what the model emits)

An **edit turn** responds with a short sentence of prose plus one or more
fenced blocks tagged `jsx-edit`:

````
Made the CTA primary and bumped it to large.

```jsx-edit
<<<<<<< SEARCH
<Button variant="outline" size="sm">
  Get Started
</Button>
=======
<Button variant="raised" size="lg">
  Get Started
</Button>
>>>>>>> REPLACE
```
````

Rules baked into the system prompt (EDIT MODE stanza):

1. `SEARCH` text must be copied **verbatim** from the current source —
   every character, including indentation. No ellipses, no paraphrase.
2. `SEARCH` must match **exactly one** location. If the target appears
   multiple times (three identical pricing-card buttons), include enough
   surrounding lines to disambiguate.
3. One logical change per block; multiple blocks per turn are fine and
   apply top-to-bottom.
4. Deletion = empty REPLACE side. Insertion = SEARCH the anchor line(s),
   REPLACE with anchor + new content.
5. **Escape hatch stays open:** for restructures the model may still
   answer with a single full ```jsx fence (the existing contract). Rule of
   thumb in the prompt: more than ~8 blocks or a layout-level rework →
   regenerate instead. The client handles both shapes on every turn, so
   the model choosing "wrong" degrades to today's behaviour, never to a
   broken state.

Why this shape and not alternatives considered:

- **Unified diffs / line numbers** — brittle under streaming (line numbers
  shift as earlier hunks apply; models miscount lines notoriously).
  Content anchors self-locate.
- **AST patch ops** (`updateProp`, `insertChild`…) — we already have a
  taste of this in `studio-source-mutator.ts` and its known limits page;
  a full op vocabulary is a bigger lift than text anchors and constrains
  what the model can express. Text blocks subsume it.
- **`str_replace` tool calls** — the right long-term home once Studio
  adopts the AI SDK tool-call protocol (STUDIO-CHAT Phase C); the fenced
  block is the same payload in fence clothing, chosen because today's
  pipeline is fence-oriented. The parser below is deliberately transport-
  agnostic so the move to tool calls swaps the extraction layer only.

## When edit mode engages (mode selection)

The client decides, not the model — the signal already exists:

- `handleSend` in `studio-chat.tsx` already branches on `currentCode`:
  iterations inline the current source with a "modify it" preamble. That
  same branch now *also* flips the request into edit mode.
- Edit mode is communicated to the server as `editMode: true` in the chat
  body (alongside `provider`/`model`/`selection`). The route appends the
  EDIT MODE stanza to the system prompt only for those turns — fresh
  builds never see it, so the build path keeps its single-fence contract
  with zero prompt-tokens overhead.
- A **selection** (the Select tool's targeted-edit stanza) composes
  naturally: the stanza already tells the model *what* to change; edit
  mode tells it *how to answer*. Selection + edit mode is the surgical
  path and should be the most common iteration shape.

## The client pipeline

New module: `apps/docs/lib/studio-edit-blocks.ts` — pure, unit-testable,
zero React. Three exports:

### 1. `extractEditBlocks(text, { sealedOnly })`

Streaming-aware scanner, same contract as `latestJsxBlock`: finds
` ```jsx-edit ` fences; a block is **sealed** when its closing
` ``` ` has arrived AND it contains the full
`<<<<<<< SEARCH / ======= / >>>>>>> REPLACE` skeleton. Returns
`{ blocks: EditBlock[], sawEditFence: boolean }` where each block carries
`{ search, replace, raw, index }`. `sawEditFence` lets the chat
distinguish "edit turn in progress" from "full-fence turn" while tokens
are still arriving.

### 2. `applyEditBlock(source, block)`

The apply engine, strictest-first:

1. **Exact** — `source.indexOf(search)`. Must match exactly once;
   zero matches → try tier 2; two-plus → ambiguity failure (no guessing).
2. **Whitespace-relaxed** — re-scan with each line's leading/trailing
   whitespace normalised (models love re-indenting). Same uniqueness rule.
3. **Anchor-trimmed** — drop the first and last line of the SEARCH and
   retry tiers 1–2 with the core (recovers blocks whose edge lines the
   model paraphrased). Applied replace re-includes the dropped edge lines
   from the *source*, not the block.

Returns `{ ok: true, next }` or
`{ ok: false, reason: "not-found" | "ambiguous" }`. **No fuzzy similarity
scoring** in v1 — a wrong-place apply is strictly worse than a failed one.

### 3. `applyEditTurn(source, blocks)`

Sequential fold with per-block results. Blocks apply in emission order
against the *running* result (block 2 may legitimately match text block 1
just created). The return carries `{ next, applied, failed }` so the UI
can be honest about partial success.

### Streaming apply (the "fairly instant" part)

In the existing streaming effect in `studio-chat.tsx` (the one that owns
`latestJsxBlock` + the draft channel):

- Each time a **new block seals** mid-stream, apply it immediately to the
  current working source and push the result through the **draft
  channel** (`onDraftCode`) — NOT through `onLatestCode`. The preview
  morphs within ~100ms of the block sealing; because the rest of the
  source is byte-identical, the double-buffered swap repaints only the
  changed region's pixels. The first edit lands while the model is still
  composing the second.
- When the **turn settles**, the full fold (`applyEditTurn` from the
  turn's original source) runs once and the result goes through
  `onLatestCode` → ONE undo snapshot, labelled from the turn ("AI edit ×3
  — Get Started button"), ONE persistence write (STUDIO-PERSISTENCE
  dirty-signature already dedupes). Drafts never touch undo/persistence —
  same rule the build-path drafts follow.
- The original source for the fold is snapshotted on the turn's rising
  edge (`turnStartedWithCodeRef` already stamps that moment) so a user's
  manual edit racing the stream can't make block 3 apply against a
  different document than blocks 1–2. If the user DOES manually edit
  mid-turn (composer is disabled but the Code view isn't), last-write-wins
  on settle and the activity trail records both — revisit under
  STUDIO-AUDIT if it bites.

### Failure policy

- **Some blocks applied, some failed:** apply the survivors, and surface
  a per-turn chip in the chat (STUDIO-CHAT's per-turn action slot):
  `2 of 3 edits applied — 1 couldn't find its target · Retry as full
  regenerate`. The retry button re-sends the same user text with
  `editMode: false`. No silent partial states.
- **All blocks failed:** keep the source untouched, same chip with
  stronger copy, same retry affordance.
- **Model ignored edit mode and sent a full fence:** the existing
  `latestJsxBlock` path handles it — today's behaviour, no special case.
- **Server QA:** the route's `onFinish` validator currently parses the
  full fence. Extend it: in edit mode, extract blocks, fold them against
  the `currentCode` the client already ships in the body, and run
  `validateJsx` on the RESULT — logs catch both malformed blocks and
  edits that produce invalid component usage. Client stays authoritative
  for apply; the server pass is observability (same posture as today).

## Chat presentation

- The prose streams as normal. Edit fences are stripped from the bubble
  the same way ```jsx fences are (extend `stripCodeBlocks`' regex to all
  fences — it already matches generically).
- Per-turn chip: `⚡ 3 edits · 1.4s` (the lightning differentiates an
  edit turn from a build turn at a glance). Expandable later into a
  per-block list with the SEARCH snippet as the row label — pairs with
  the revision spine when STUDIO-AUDIT's object-vs-timeline view lands.
- The thinking disclosure, usage strip, duration pill all behave
  unchanged.

## What this does NOT change

- **Input tokens are not reduced** — the current source still rides the
  user turn as context (the model can't anchor against text it can't
  see). The win is output tokens + wall-clock + stability. Trimming input
  via retrieval-windowed context is a separate, later idea and probably
  unnecessary at Studio screen sizes (~120 lines median).
- **Fast Frame still recompiles the whole module** per apply. Compile is
  single-digit milliseconds with pre-stamped imports; not worth a
  partial-eval scheme.
- **The settings panel / TokenField mutator path** stays as-is — it's
  the zero-LLM fast lane; edit blocks are the LLM lane. They converge on
  the same `onSourceMutation` write-through, undo, and persistence
  machinery, which is the point.

## Gotchas to carry into implementation

- `data-gds-source-id` stamping: `prepareAppSource` / `injectSourceIds`
  rewrite the source before compile. Edits anchor against the **stored**
  source (pre-injection), so SEARCH text from the model — which saw the
  stored source in its context — matches. Never anchor against the
  prepared/compiled text.
- The streaming draft gate (`turnStartedWithCodeRef`) currently suppresses
  ALL drafts on iteration turns. Edit mode reopens the draft channel for
  iteration turns **only for applied-edit results** (which are full valid
  documents), not for auto-closed partials. The gate becomes: fresh build
  → partial-completion drafts; edit turn → applied-edit drafts; full-regen
  iteration → hold-and-snap. Three lanes, one channel.
- Sealed-block detection must tolerate the model fencing edits as
  ```jsx by mistake — if a fence's body starts with `<<<<<<< SEARCH`,
  treat it as an edit block regardless of tag.
- Undo granularity decision (one snapshot per TURN, not per block) is
  deliberate: "undo" should revert what the user asked for, which was the
  sentence, not the mechanical sub-steps. Revisit only if users ask.
- CRLF: normalise `\r\n` → `\n` on both sides before matching (BYOK
  models occasionally emit CRLF).

## Rollout

- **X0 — protocol + parser + settle-apply.** EDIT MODE stanza (gated on
  `editMode`), `studio-edit-blocks.ts` with unit tests over the apply
  tiers, settle-time fold → `onLatestCode`, full-fence fallback, failure
  chip with retry-as-regen. No streaming apply yet — turns are already
  10–30× faster because output is tiny.
- **X1 — streaming per-block apply.** Sealed blocks morph the preview
  live via the draft channel; the three-lane draft gate. The "fairly
  instant" milestone.
- **X2 — server QA + telemetry.** Route-side fold + `validateJsx` on the
  result; log apply-tier hit rates and block failure rates per
  provider/model (Gemini vs Claude vs gpt-oss will differ — this data
  decides whether tier-3 anchor-trimming earns its keep or a prompt fix
  is cheaper). Feeds the STUDIO-LEARNING gaps log.
- **X3 — tool-call transport.** When STUDIO-CHAT Phase C lands the AI SDK
  tool protocol, move blocks from fences to a `str_replace` tool; the
  parser's extraction layer swaps, apply engine untouched. Streaming
  apply maps to streamed tool-call deltas.
- **X4 — morph polish.** Diff the pre/post source to identify the changed
  region, map it to `data-gds-source-id`s, and re-arm the (currently
  dormant) `data-gds-streaming` entrance treatment for JUST those nodes —
  the edited card eases in while the rest of the page sits perfectly
  still. Also the hook for a "flash the changed element" affordance that
  shows the user what the AI touched.
