# Studio Audit — the activity trail

Every meaningful action in Studio emits an event. The result is a per-screen, per-project timeline: *who did what, to what, when, and with which model.*

> Status: design doc. Drafted 2026-05-31.
> Companion to [`STUDIO-STORAGE.md`](./STUDIO-STORAGE.md) (assets), [`STUDIO-THEMES.md`](./STUDIO-THEMES.md) (the theme contract), [`STUDIO-LEARNING.md`](./STUDIO-LEARNING.md), and [`STUDIO-CHAT.md`](./STUDIO-CHAT.md). Unlike those, this isn't a feature pillar — it's a **cross-cutting substrate** every feature writes into.

**Terminology note** — "event" = one immutable record of an action: an actor, a verb, a target, a scope (project/screen), a timestamp, and a metadata bag. The audit trail is the ordered stream of events. It's append-only; nothing rewrites history.

---

## Problem

Studio is becoming multi-actor and multi-step. People invite collaborators, comment, generate images, save theme variants, share screens. Today none of that leaves a trace — there's no answer to "who changed this?", "when was this image made, and from what prompt?", or "which model produced this?".

That matters for three reasons:

- **Provenance.** A generated image without "made by this prompt, with this model, by this person, at this time" is a mystery the moment anyone else looks at it. For AI-produced content this is where the product feels alive — or feels like a black box.
- **Collaboration.** Once a project has guests (see invites), "Ali created an image on Pricing v2" is the difference between a shared space and a confusing one. Activity is how teams stay oriented.
- **Trust + debugging.** When something looks wrong, the trail tells you what happened. When a model misbehaves, the trail says which model and which prompt.

The key realisation: this can't be bolted onto one feature. An audit trail that only covers assets is useless the moment you ask "what happened on this screen?" and the answer omits comments, renames, theme changes, and shares. It has to be a substrate **every** action funnels through.

## The shape: one primitive, many callers

The whole design is one table and one function:

```ts
logEvent({
  projectId,            // RLS scope
  designId?,            // the screen/variant; omit for project-level events
  action,               // namespaced verb — "image.create", "comment.add", …
  targetKind?, targetId?, // what it acted on
  metadata?,            // { model, prompt, from, to, … }
});
```

Every feature calls `logEvent` after its action succeeds. Assets call it on upload/generate/update/delete; comments on add/resolve; themes on save/publish; sharing on create/revoke; invites on send/accept. The caller list grows; the primitive doesn't change. That's what makes the trail *complete* rather than *per-feature*.

**Logging never breaks the action.** `logEvent` is best-effort and swallows its own errors — a failed write to the trail must never fail the image generation or the comment that triggered it. The action is the product; the event is the footnote.

### The event record

```ts
interface StudioEvent {
  id: string;
  actorId: string;        // who did it (users.id) — the "Ali"
  projectId: string;      // RLS scope — the "{Project}"
  designId?: string;      // the screen/variant — the "{Screen Variant}"
  action: string;         // namespaced verb (taxonomy below)
  targetKind?: string;    // "asset" | "screen" | "comment" | "theme" | "share" | "invite"
  targetId?: string;
  metadata?: Record<string, unknown>; // { model, prompt, from, to, … }
  createdAt: number;      // the "{datetime}"
}
```

Rendered, that's literally the sentence you asked for: *"{actor} {verb} {target} on {designId} inside {projectId} at {createdAt}"* → **"Ali created an image on Pricing v2 inside Acme at 14:32."** The metadata expands it: *"…using gpt-image-1"* / *"…from prompt 'a calm dashboard hero'."*

### Action taxonomy

Namespaced `noun.verb`, so feeds can group and filter. Initial set (grows as features land):

```
asset.upload     asset.generate   asset.fill      asset.update    asset.delete    asset.tag
screen.create    screen.rename    screen.duplicate  screen.delete
comment.add      comment.reply    comment.resolve
theme.save       theme.apply      theme.publish
share.create     share.revoke
invite.send      invite.accept    invite.revoke
revision.seal
```

### Metadata conventions

Keep the bag small and consistent so feeds can render without bespoke code per verb:

- **AI actions** (`asset.generate`, `asset.fill`) — `{ model, prompt }`. This is the provenance that makes generated content legible. Pairs with the asset's own `origin` + `sourcePrompt` columns (the asset is the durable object; the event is the timeline entry).
- **Renames / moves** — `{ from, to }`.
- **Never** secrets, tokens, or full payloads. Metadata is human-facing context, not a data dump.

## Relationship to asset provenance

Assets already carry `origin` (`upload`/`generated`/`filled`/`stock`), `sourcePrompt`, and `createdBy` (= owner). That's the *object's* self-description — true forever, attached to the bytes. The event is the *timeline's* description — "this happened, here, then." They overlap deliberately: delete the asset and its provenance goes with it, but the event ("Ali created an image here on the 31st") survives as history. Don't collapse one into the other.

## Relationship to the revision spine

The same object-vs-timeline split applies to screen history. Each sealed change already persists an immutable **revision** (`screen_revisions`, migration `0009`) — the *snapshot* of the screen's source at that moment. The matching `revision.seal` event is the *narration* of it: "Ali regenerated Pricing v2 at 14:32." So a screen's history reads two ways from the same moments — the revisions are what you can roll back to or bind a comment against; the events are the human story of how it got here. A per-screen activity feed is therefore largely a render of the `revision.seal` events interleaved with the comments, images, and theme changes that happened between them.

## Views on shares

Opening a `/s/<token>` share emits a coarse `share.view` event — the "viewed by X, 2 days ago" signal traditional tools hide. Deliberate boundaries:

- **Load, not interaction.** One event per share open. No scroll/hover/zoom tracking — that's analytics, which this isn't. The one meaningful interaction (commenting) already logs via `comment.add`.
- **Server-side, anonymous actor.** Share viewers are anonymous or non-members, so they can't insert under the events policy. The `/s/<token>` route writes the event with the **service role** (bypassing RLS) and a **null `actor_id`** (hence the nullable column). A signed-in member viewing their own share also lands with a null actor for now; dedup + attribution (cookie/session, "viewed by you") is a later refinement.
- **No PII.** No IP, no fingerprint. Just "the share was opened, here, then." Attribution, when it comes, resolves a member id — never a denormalised identifier in metadata.

## Permissions + integrity

- **Scope = project.** An event belongs to a project; RLS mirrors `project_access` via the `user_can_read_project` resolver (migration `0008`). Project members see the project's trail.
- **Insert = anyone who can read the project.** Commenting is a read-level action (a viewer can comment), and a viewer's comment should be logged — so event insert is gated on `user_can_read_project`, not edit. The *action's own* permission is enforced by the action; the event just records that it happened.
- **Append-only.** No `update`/`delete` RLS policies on events. The trail is immutable by construction — you can't rewrite or quietly erase history. (Project deletion cascades; that's the only removal.)

## Surfaces

- **Per-screen activity** — a feed scoped to one `designId`, the natural place to answer "what happened on this screen?" (a tab or popover in Studio).
- **Per-project feed** — the firehose across all screens, for the project overview.
- **Inline provenance** — on a generated image, "made by Ali · gpt-image-1 · 'calm dashboard hero'" sourced from the `asset.generate` event + the asset row.
- **Shares** — a share could optionally surface a read-only activity excerpt ("last updated by … 2 days ago"). Off by default; opt-in per share.

## Rollout

**Phase A0 — Substrate.** `events` table + RLS + `logEvent`/`listEvents` on both adapters (local adapter: no-op log, empty list — there's no server). Emit from the asset actions already built (`asset.upload`, `asset.update`, `asset.delete`). Nothing visible yet, but the trail starts filling.

**Phase A1 — Backfill the callers.** Wire `logEvent` into the existing actions that should have always emitted: `screen.create/rename/duplicate/delete`, `comment.add/resolve`, `share.create/revoke`, `invite.send/accept`, `theme.save`. One-liners at each call site.

**Phase A2 — Per-screen activity feed.** The UI surface — render the human sentences, newest first, scoped to the focused screen.

**Phase A3 — Model + prompt capture.** As the generate/fill flows mature, pass `{ model, prompt }` into their events. Inline provenance on generated images.

**Phase A4 — Project feed + share excerpts.** The cross-screen firehose; optional read-only activity in shares.

## Constraints we're honest about

**Logging is best-effort.** `logEvent` never throws upward. A trail gap is acceptable; a broken user action because the trail write failed is not.

**Not an analytics pipeline.** This is a human-readable activity trail scoped to projects, not a metrics/telemetry system. Don't overload it with high-frequency machine events (every keystroke, every slider tick) — it records *meaningful actions*, the things a person would recount.

**Volume + retention.** Meaningful-actions-only keeps volume sane, but a busy project will still accumulate. Keep everything for v1; revisit partitioning/pruning if it ever bites. Index on `(project_id, created_at desc)` and `(design_id, created_at desc)` so feeds stay fast.

**Local mode has no trail.** Like sharing and assets, the trail needs the server. Local adapter no-ops the log and returns an empty feed — don't fake a local history.

**PII discipline.** Actor is a user id resolved to a name at render time, not a denormalised email in metadata. Metadata stays free of anything sensitive.

## See also

- [`STUDIO-STORAGE.md`](./STUDIO-STORAGE.md) — asset `origin`/`sourcePrompt` provenance the AI events pair with.
- `apps/docs/supabase/migrations/0008_role_based_access.sql` — the `user_can_read_project` resolver event RLS reuses.
- `CLAUDE.md` → the storage adapter pattern — `logEvent`/`listEvents` land alongside the other `StudioStorage` methods.
