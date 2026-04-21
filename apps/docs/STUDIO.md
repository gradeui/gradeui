# Studio — `/studio` orientation

Studio is the AI-driven page composer that lives at `gradeui.com/studio`. It lets you describe a UI in natural language, watch the model emit a JSX app block, and preview it live inside a Sandpack iframe. This doc is the map for anyone editing Studio internals.

## File layout

```
apps/docs/
├── app/studio/page.tsx              # The route. Owns the tabs, per-design state maps, chat↔preview wiring.
├── app/api/chat/route.ts            # Server route. Builds the system prompt (incl. refs + selection blocks) and streams the model.
├── components/studio/
│   ├── design-tabs.tsx              # The tab strip (new / rename / close / switch).
│   ├── studio-chat.tsx              # Left pane — message list, input, selection chip, useChat wiring.
│   └── studio-preview.tsx           # Right pane — Sandpack preview, error boundary, select-mode toggle.
└── lib/
    ├── chat-sandpack.ts             # ★ The rulebook. System prompt, Sandpack file shims, allow-list, agent script.
    ├── studio-designs.ts            # Design slot type + id generator. Pure / serialisable.
    ├── studio-state.ts              # Misc chat-settings persistence.
    └── studio-templates.ts          # Starter templates surfaced in the UI.
```

## Things you will want to find

### The allow-list

`apps/docs/lib/chat-sandpack.ts` — the `ALLOWED_COMPONENTS` array (around line 1573) is the single source of truth for what the model is told it may import from `@gradeui/ui`. Names in this array get embedded in the system prompt; anything not listed the model has been told to avoid.

A few feet below that (around line 1608) is the **GATED OFF** block — names that exist in the library's barrel but haven't shipped to npm yet. They sit there commented-out as a reminder to flip them back on after the next publish.

### The Sandpack shims

Same file. The `componentFiles` / `pageFiles` / `utilityFiles` objects are the virtual filesystem handed to Sandpack — stub re-exports from `@gradeui/ui` at paths the model is encouraged to use (`/components/ui/button.tsx`, `/lib/utils.ts`, etc.). If the model keeps inventing a path that doesn't resolve, a shim is usually the fix.

### The in-iframe agent

Also in `chat-sandpack.ts`: `PLAYGROUND_SELECTION_AGENT_TSX`. A TypeScript side-effect module that gets registered as `/selection-agent.ts` in the Sandpack files map and imported by `/index.tsx`. It owns the hover overlay, click capture, and postMessage protocol for the "select element" feature. The protocol is the small set of `grade:*` message types at the top of that constant — keep both sides of the bus (agent + `studio-preview.tsx`) in sync when you change it.

Historical note: this was originally an inline `<script>` baked into `/public/index.html`. Sandpack's CRA runtime dropped inline body-scripts silently (head-level `<script src=...>` worked, body IIFEs didn't), so the agent never executed and the select pill did nothing. Moving it into the bundle graph as a TS side-effect module fixed it. Don't move it back into the HTML without verifying it actually runs inside the remote iframe.

### The system prompt

`buildStudioSystemPrompt()` in `chat-sandpack.ts`. Takes the caller-supplied theme / reference context / selection block and stitches them into the base instructions. When the model starts hallucinating imports or ignoring rules, this is where you tighten the screws.

## The publish-lag gotcha (important)

**Symptom:** You add a new component to `packages/ui/lib/index.ts`, restart dev, type a Studio prompt that uses it, and Sandpack crashes with:

> Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined.

**Why it happens:** The Sandpack iframe is configured to install `@gradeui/ui@latest` from the npm registry — not from the workspace sibling. Adding an export to the barrel in this repo does **not** make that export available inside Studio until a changeset is cut, the publish workflow runs, and the new version is on npm. Until then, the model sees the name in `ALLOWED_COMPONENTS`, cheerfully emits `import { Thing } from "@gradeui/ui"`, the iframe's `node_modules` copy of the package has no `Thing` export, it resolves to `undefined`, and React blows up.

**What to do about it:**

1. **Simple fix (default):** keep `ALLOWED_COMPONENTS` additions in a **separate PR** that lands _after_ the publish. Merge the component itself + changeset first, wait for the release PR to publish, then open the follow-up PR that advertises the new names to the model.
2. **If you already merged it and now Studio is broken:** comment the offending names out of `ALLOWED_COMPONENTS` (see the `// GATED OFF` block for the pattern), ship a hotfix, flip them back on after the next publish.
3. **If this becomes a recurring pain:** introduce a `PUBLISHED_SINCE` gate — a flag in `chat-sandpack.ts` that the release commit flips, with `ALLOWED_COMPONENTS` filtering by it. Worth building the day this catches you a second time.

Rule of thumb: **whenever you touch the barrel, the Studio allow-list is one release behind you.** Treat them as coupled — changeset, release, _then_ allow-list bump.

## Per-design state model

`apps/docs/app/studio/page.tsx` holds a few `Record<designId, T>` maps:

- `messagesByDesign` — chat history per tab.
- `appSourceByDesign` — last emitted JSX block per tab.
- `selectionByDesign` — currently-captured element per tab (highlight-and-comment v1).

Chat _hooks_ (`useChat`) are keyed by `design.id`, so AI SDK internal state survives tab switches without us duplicating it.

When you add new per-design state, mirror the pattern:

1. Add a `Record<string, T>` map in `page.tsx`.
2. Clear the slot in `handleCloseDesign`.
3. Pass the current tab's value + a setter-callback down to whichever pane owns it.

Don't bolt new fields onto the `Design` type in `studio-designs.ts` — that type is deliberately minimal so it stays portable to a future persistence layer.

## Highlight-and-comment (a.k.a. "select mode")

### What it does for the user

Once the preview has rendered something, the header gets a **Select** pill next to the Preview/Code toggle. Flip it on, hover any element in the live preview, and the agent paints a primary-coloured outline around whatever you point at. Click once:

1. The outline freezes on that element.
2. A chip appears above the chat input showing `◎ <tag> "<text preview>" ×`.
3. Select mode auto-exits so you can keep interacting with the preview.

Type a follow-up prompt and send. The server attaches the element's outer HTML to the system prompt as a "TARGETED EDIT" stanza, so the model knows which part of the composition you want changed. The `×` on the chip drops the selection without sending.

The overlay is pointer-events-none and ignores `<body>`, `<html>`, and `#root` so you can't accidentally "select the whole frame". Outer HTML is truncated at ~500 chars before it leaves the iframe.

### Wire protocol (v1)

Parent → iframe:

- `{ type: "grade:select-mode", enabled: boolean }` — turn the hover overlay on/off.
- `{ type: "grade:clear-selection" }` — the parent no longer cares about the current pick; drop the outline.

Iframe → parent:

- `{ type: "grade:agent-ready" }` — fresh iframe boot; parent replays current state so a reload inherits the last select-mode + selection values.
- `{ type: "grade:selected", selection: { tag, text, outerHTML, rect } }` — user clicked something in select mode.

### Data flow

The captured selection flows **out-of-band** in the `/api/chat` request body (not inlined in the user message), which keeps it from polluting the history on follow-up turns. Server-side it's rendered into the system prompt as a "TARGETED EDIT" stanza — see `renderSelectionBlock()` in `app/api/chat/route.ts`. Selection state is per-design (`selectionByDesign` in `app/studio/page.tsx`) and cleared automatically after the message is sent.

## Future work / known limits

Things deliberately out of scope for v1 of highlight-and-comment, captured here so they don't get lost:

- **One element at a time.** The agent ignores multi-select (shift-click, drag-rect). If users start asking for "change these three buttons at once", model them as a `Selection[]` rather than a single slot.
- **Shallow context.** Only the clicked element's `outerHTML` is shipped. No parent, no siblings, no ancestor chain. If model edits start missing the surrounding layout intent, extend `PLAYGROUND_SELECTION_AGENT_TSX` + `renderSelectionBlock()` together.
- **Hard 500-char truncation.** Fine for buttons/chips; tight for cards or forms. Either raise the cap or swap for token-aware truncation before the block hits the system prompt.
- **Selection auto-clears after send.** There's no "pin" mode — pick again if you want to iterate on the same element over multiple turns. A chip-level padlock + an early-return on `onClearSelection` in `studio-chat.tsx` `handleSend` would cover it.
- **No visual confirmation in the chat stream.** The chip disappears on send and the assistant's reply doesn't quote the targeted element back. Fine for now; worth revisiting if users start losing track of what they aimed at.

## Dev workflow notes

- **You do not need to restart dev after editing `chat-sandpack.ts` or `app/api/chat/route.ts`.** Next's HMR re-reads the route module per request.
- **You do need to refresh the Studio tab (or "New design") after an error state** — Sandpack holds onto the crashed iframe until the provider remounts.
- Runtime errors inside the preview surface in `SandpackErrorBoundary`; the raw `@codesandbox/sandpack-react` error shape is unfriendly, so we normalise it there.

## See also

- `gradeui/CLAUDE.md` — monorepo orientation (tiering model, publish pipeline, repo-wide pitfalls)
- `packages/ui/CLAUDE.md` — component-layer reference (the model's prompt inherits a lot of its rules from this file's conventions)
