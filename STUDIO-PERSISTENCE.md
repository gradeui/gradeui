# STUDIO-PERSISTENCE.md — when and how Studio saves

The rules for getting a user's work durable without hammering Supabase. Written because the current behaviour (save the entire project on every keystroke-level edit) is both a load problem and, when it fails, a silent data-loss problem.

> Status: design doc + current-state audit. Drafted 2026-06-02 after manual edits were found not to persist while agent edits did. **Implemented 2026-06-03** — P0–P4 below are now built; this section describes the live behaviour.

## Current behaviour (as built — 2026-06-03)

- **Autosave effect** (`app/studio/page.tsx`): a `useEffect` keyed on `designs`, `activeId`, `messagesByDesign`, `notesByDesign`, `projects`, `themeDraftJsonByProject` now does **two-tier dirty tracking** and a **~1.5s trailing debounce**:
  - `structSig` — screen membership/order, active pointer, message counts, notes, theme draft. A change routes to the whole-project `saveProject`.
  - `bodyById` — each screen's `name` / `status` / `appSource`. A change to one screen routes to a single-row `saveScreen(projectId, design)`. This is the common path (padding tweak, code edit, chat regen) and now costs one row upsert.
- **`saveProject`** (both adapters) remains the whole-project write — used only for structural change now, not every keystroke.
- **`saveScreen`** (both adapters) upserts one `designs` row; the autosave routes body-only edits here.
- **Errors surface**: every save sets `saveStatus` (`idle`/`saving`/`saved`/`error`). A failure parks the toolbar chip on `error`, `console.error`s the real cause, and does NOT advance the dirty refs — so the next edit retries. The pre-fix `.catch(() => {})` that ate manual edits is gone.
- **`persistRevision`** still writes a `designs` revision row (append-only history) on each edit — separate from the screen's live `state`.
- **Flush triggers**: unmount, tab-hide (`visibilitychange`), `beforeunload`, and project switch all flush the pending debounce (the flush is `silent` re: React state).

## The three problems

1. **Hammering.** No debounce + a 5-table rewrite per edit means a burst of edits is a burst of heavy writes. This is the same load that 504'd the site earlier (`MIDDLEWARE_INVOCATION_TIMEOUT` under Supabase pressure). We must not write on every tiny change.

2. **Silent failure.** The screens upsert dropped its error (no `if (error) throw`), so a failed screen write looked like success and edits vanished on reload. Now fixed to throw, but the lesson stands: **every write checks its error**.

3. **Agent-vs-manual asymmetry.** Agent (chat) edits persist because the `/api/chat` route writes the screen **server-side via the service role** (bypasses RLS). Manual edits (code editor, labels, visual tools) only go through the **client** autosave, so if the browser's RLS context can't write the `designs` row, manual edits silently die while agent edits survive. The likely root cause is an RLS policy that allows the client to read/insert screens but not **update** them. Fix is either the RLS policy (let project editors update their own screens) or routing the client save through an authed server endpoint like chat does.

## Target save policy

**Principle: dirty-tracking + bounded flushing.** Track how far the in-memory state has drifted from what's durable, and flush at sensible boundaries — never on every edit.

### Dirty tracking — "current vs saved" marker

Per screen, keep two markers:

- **`currentRev`** — bumped on every local edit (a counter, or the latest local revision id).
- **`savedRev`** — the marker value that was last successfully written to Supabase.

The screen is **dirty** when `currentRev !== savedRev`. This is the "supabase history id vs current page history id" comparison: persistence is needed exactly when they diverge, and a successful `saveScreen` sets `savedRev = currentRev`.

### When to save

Save a dirty screen when **any** of these fire (whichever comes first):

- **Idle debounce** — ~1.5–2s after the last edit (a trailing debounce, so a burst collapses to one write).
- **Edit-count threshold** — every N edits (e.g. N=10) even if the user keeps typing, so long sessions still checkpoint.
- **Screen switch** — flush the outgoing screen before showing another.
- **Project switch** — already flushed; keep it.
- **Unmount / route-away** — flush on component unmount.
- **Tab hidden / `beforeunload`** — `visibilitychange → hidden` and `beforeunload` flush, since reloads and tab-closes are where the tail edit is lost. (Use `keepalive`/`sendBeacon` where a normal async write won't finish before unload.)

Bound the worst case: at most N edits (or one debounce window) of work is ever at risk, and the flush triggers catch the tail.

### What to write — granular, not whole-project

A manual edit should write **one screen row**, not rewrite the whole project. Add a granular `saveScreen(projectId, design)` to `StudioStorage` (sibling to the existing `addScreen` / `deleteScreen`) that upserts a single `designs` row. The whole-project `saveProject` stays for coarse, infrequent moments (project create, explicit save). This cuts the common path from a 5-table write to a 1-row upsert.

### Errors surface

Every write checks `{ error }` and throws/reports. A failed save must be visible (a toast, a "couldn't save" indicator) — never swallowed. Pair with the dirty marker: if a save fails, `savedRev` is NOT advanced, so the next flush retries.

## Rollout

- **P0 — Stop the bleeding.** ✅ Surface the screens-upsert error. _Note (2026-06-03):_ the suspected RLS denial turned out **not** to be the cause — `designs_update` (migration `0008`) already grants UPDATE to project editors, and `appSource` round-trips correctly through the `state` JSONB column. The real bleed was that the only durable path for a manual edit was the debounced whole-project `saveProject`, **and its failure was swallowed** (`.catch(() => {})` / `console.warn`). So a failure for *any* reason (not just RLS) lost the edit invisibly. Fixed by P1 + P4 below.
- **P1 — Granular `saveScreen`.** ✅ `saveScreen` exists on both adapters; the autosave now routes a **body-only** change (one screen's `name` / `status` / `appSource` — i.e. visual edits, code-editor edits, chat regenerations) to a single-row `saveScreen(projectId, design)`. Whole-project `saveProject` is reserved for **structural** change (screen membership/order, active pointer, messages, notes, theme). See the two-tier `structSig` / `bodyById` tracking in `app/studio/page.tsx`.
- **P2 — Dirty tracking + debounce.** ✅ Content-signature dirty check + ~1.5s trailing debounce (split into the two tiers above). (Edit-count threshold not yet needed at single-user scale.)
- **P3 — Flush triggers.** ✅ Unmount, `visibilitychange → hidden`, `beforeunload`, and project switch all flush the pending write. (The flush path is `silent` — it doesn't touch React state from an unmounting tree.)
- **P4 — Save status UI.** ✅ A `saveStatus` machine (`idle` / `saving` / `saved` / `error`) drives a subtle chip in the canvas toolbar. **`error` parks until the next successful write** and the real error is `console.error`'d — a save can never fail silently again. On failure the dirty refs are NOT advanced, so the next edit retries.

## See also

- `app/studio/page.tsx` — the autosave effect + `handleSourceMutation` / `handleLatestCode` (manual vs agent edit paths).
- `lib/studio-storage/supabase-adapter.ts` — `saveProject`, `addRevision`, `addScreen` / `deleteScreen`.
- `STUDIO-STORAGE.md` — asset persistence (separate pillar; same "surface errors, don't swallow" discipline).
- Supabase `designs` RLS policy (the suspected root cause of the manual-edit failure).
