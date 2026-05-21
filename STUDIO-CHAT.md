# Studio Chat

How the Studio chat surface goes from text channel to a rich generative-UI workspace.

> Status: design doc. Drafted 2026-05-20.
> Companion to [`STUDIO-LEARNING.md`](./STUDIO-LEARNING.md) (the corpus + preference loop), [`STUDIO.md`](./STUDIO.md) (the playbook), [`apps/docs/STUDIO.md`](./apps/docs/STUDIO.md) (the Studio app). This doc covers the *presentation layer*; the learning doc covers the *data flow*. They reference each other for individual features (`proposeLayouts`, etc.) — what renders is here, what it does is there.

---

## Position

The Studio chat is the primary surface for user-LLM interaction. The traditional shape — type prompt, read text back, paste code somewhere — is the floor, not the ceiling. We're building the chat as a **rich interactive surface where the assistant returns components, not just words**, and the user can click, pick, listen, speak, or type as readily as any other.

This is a deliberate product position:

1. **Modern AI products communicate this way.** v0, Cursor, Claude artefacts, Antigravity — they all render inline interactive UI. A chat that only returns text reads as 2023 by 2026 standards.
2. **It compounds with Studio Learning.** Every interactive moment in chat is a structured signal we can attribute to a session — clicked option 2 of 4 from `proposeLayouts`, regenerated once, saved as User Component. Pure-text chats lose that granularity.
3. **It pairs with the design system positioning.** A DS that ships its own chat surface, where the chat itself is the showcase for what the DS can do, is a much sharper demo than "here are 50 components in a docs site." The chat *is* the docs.

## The protocol — AI SDK tool calls + custom UI parts

The [AI SDK](https://ai-sdk.dev) (v5+) already has the right primitive: **tool-invocation parts**. Every message has a `parts: Part[]` array. Parts can be `{ type: "text" }`, `{ type: "reasoning" }`, `{ type: "source" }`, or `{ type: "tool-invocation", toolName, args, state }`. The client maps tool names to custom React components and renders them inline in the message stream.

Concretely:

```ts
// Server-side (in /api/chat)
tools: {
  askQuestions: {
    description: "Ask the user clarifying questions before generation",
    inputSchema: askQuestionsSchema,
  },
  proposeLayouts: {
    description: "Show N layout candidates for the user to pick from",
    inputSchema: proposeLayoutsSchema,
  },
  // …
}

// Client-side (in AIChat)
function renderPart(part) {
  if (part.type === "tool-invocation" && part.toolName === "askQuestions") {
    return <QuestionsCard args={part.args} onSubmit={addToolResult} />;
  }
  if (part.type === "tool-invocation" && part.toolName === "proposeLayouts") {
    return <LayoutPicker args={part.args} onPick={addToolResult} />;
  }
  if (part.type === "text") return <Markdown>{part.text}</Markdown>;
}
```

The model picks tools based on its prompt context. We don't have to invent a parallel protocol per feature — every interactive moment in the system maps onto this one primitive.

## Tool catalog

These are the interactive moments we already know we want. Each one ships as a single tool + a custom React renderer:

| Tool | Trigger | Renderer | Notes |
|------|---------|----------|-------|
| `askQuestions` | App Brief skill returns `mode: "ask"` | Question card with option chips/radios/checkboxes | Cross-ref [`STUDIO-LEARNING.md`](./STUDIO-LEARNING.md#intent-triage--the-app-brief-skill) |
| `proposeLayouts` | Compare mode, or model-driven "want to see alternatives?" | Multi-up gallery with mini-canvas previews | Pick fires `learn-from-session` accept signal |
| `confirmGap` | App Brief detects no retrieval/gen path | Confirm dialog with optional notes input | Writes to `gaps.generated.json` |
| `suggestRename` | Auto-name layers skill | Per-layer name proposals with inline edit | Multi-row interactive form |
| `pickIcon` | User selects an icon, asks to swap | Searchable icon gallery across Lucide / Phosphor | Semantic search via embedding engine |
| `confirmDestructive` | Edit would overwrite non-trivial children | Inline diff + confirm/cancel buttons | Reuses the source mutator's diff |
| `saveAsUserComponent` | User accepts a layout, model offers to promote | "Save with this name?" prompt | Strongest positive corpus signal |
| `reviewLearnings` | Session end / "Save what I learned" trigger | Diff view of pending corpus updates | User can edit/reject before apply |

Build them as a coherent set, not piecemeal. Shared shell, shared theming, shared session-event capture. The chat becomes a tool catalog the user navigates, not a text box they fight with.

### Naming rule

**Tool name = shape of UI + minimal scope to make the shape unambiguous.**

- If two use cases need the SAME UI shape with different data → same tool (generic name OK). `askQuestions` is the canonical example: many different skills can invoke it because they all want the same picker UI, with different `questions[]` payloads.
- If two use cases need a DIFFERENT UI shape → different tools. `proposeLayouts` is layout-specific not because of the data but because the UI is a layout gallery (mini-canvas previews), structurally different from `askQuestions`'s option chips.
- When in doubt, prefer the more specific name. You can always *generalize later* by adding an alias; deprecating an over-generic name and moving consumers is harder.

## Inline artifacts vs canvas artifacts

Today's Studio has one kind of artifact: the **canvas** — a full React app rendered in a Sandpack/Fast Frame iframe. We're going to grow a second kind: **inline artifacts** that render inside chat message bubbles.

| Kind | Where | Size | Examples |
|------|-------|------|----------|
| Canvas artifact | Main editor area (existing) | Full-page React app | The primary generation; the thing the user is editing |
| Inline artifact | Inside chat bubble | Small / medium component | Mini-canvas preview from `proposeLayouts`, code diff from `confirmDestructive`, chart from a future stats tool |

Both render JSX, both use the same source-mutator pipeline. The difference is scope and lifecycle:

- **Canvas artifacts persist across the session.** They're what the user is building. Edits, mutations, selection state all live on them.
- **Inline artifacts are ephemeral.** They render as part of one message; once the user has interacted (or moved on), they're history. They don't have selection rings, can't be edited in place, don't carry source-mutation state.

Inline artifacts mostly come *from* tool calls. A `proposeLayouts` tool returns 3 candidate JSX strings; the inline artifact renderer renders each as a mini-canvas. When the user picks one, it gets promoted into the main canvas (and the inline previews stop being interactive).

### Promotion: inline → canvas

When a user picks a candidate from `proposeLayouts` (or accepts a `confirmDestructive` swap), the inline artifact's JSX is promoted to the canvas. The mechanics:

1. The tool result fires with the picked artifact's id
2. The chat host (`StudioChat`) translates that into a source mutation on the current design
3. The canvas re-renders with the new source
4. The inline artifact card collapses to a "✓ Applied" affordance — keeps the message history readable when scrolling back

This is the same pattern Cursor uses for edit suggestions: propose-in-chat, apply-to-document. Familiar mental model.

## AI Elements adoption

[Vercel AI Elements](https://github.com/vercel/ai-elements) is a shadcn/ui-based component library purpose-built for AI interfaces. 20+ components, integrated with `useChat`, designed around streaming + tool parts + reasoning + message-part rendering. Recent (May 2026) additions: Voice, Code, Attachments with Slots.

Built on shadcn/ui, so it lines up with `@gradeui/ui`'s flavour and our CSS variable theming pattern (`--studio-accent`, etc.) drops in without translation.

**Adoption plan:**

1. Keep our existing `AIChat` shell — its slot props (`composerSlot`, `assistantBubble`, `bare`) are too embedded to rip out without a refactor that doesn't pay for itself yet.
2. Use AI Elements selectively for new surfaces: tool UI renderers, Voice input, anything we'd otherwise build from scratch.
3. Migrate fully only when AI Elements proves mature in our stack AND we have enough consumers that the migration cost is justified.

Don't fork AI Elements — accept it evolves, depend on it via npm, theme it via our CSS variables.

## Voice as a first-class input mode

Typing a prompt is one of three valid ways to engage with Studio:

1. **Type** — the floor, already supported
2. **Paste / drag** — already supported (images, code snippets)
3. **Speak** — coming via Whisper-class transcription

For users who think faster than they type — designers describing what they want — voice closes the loop from "I can picture it" to "Studio renders it" in seconds.

**Options:**

| Option | Pros | Cons |
|--------|------|------|
| AI Elements Voice component | Already designed for this; integrated with chat | Newest API; less battle-tested |
| [OpenWhispr](https://openwhispr.com/) | Local Whisper, zero API cost, open source | Need to embed; larger bundle |
| [Wispr Flow](https://wisprflow.ai/) | Best-in-class UX | Desktop-app shaped, not embeddable |
| [ebycoco/WhisperFlow](https://github.com/ebycoco/WhisperFlow) | Dual local + cloud engines | Less polished UI primitives |
| Web Speech API direct | Zero bundle cost | Browser-dependent quality, no model control |

**Default plan:** AI Elements Voice for v1. If it doesn't fit, fall back to OpenWhispr with a custom mic button in `AIChatComposer`.

## Rollout

Each phase is shippable on its own. Phases overlap with the Studio Learning rollout — see cross-references.

**Phase A — Tool-call protocol in AIChat**

- Add `renderToolPart?: (part: ToolPart) => ReactNode` prop to `AIChat`
- Host (StudioChat) passes a renderer that maps tool names to components
- /api/chat exposes the first tool (`askQuestions`)
- Wire app-brief's "ask" output into the askQuestions tool's args
- Verify end-to-end on the brief flow

**Phase B — AI Elements adoption + tool catalog v1**

- Install `@vercel/ai-elements`
- Build `proposeLayouts`, `pickIcon`, `confirmDestructive` as custom tool renderers using AI Elements primitives where they fit
- Each tool has its own `*.tsx` in `apps/docs/components/studio/chat-tools/`
- Wire to /api/chat tools and to the session-event capture pipeline (so picks fire `learn-from-session` signals)

**Phase C — Inline artifacts as a primitive**

- Define `<InlineArtifact source={jsx} mode="preview" />` component
- Render via the same Sandpack/Fast Frame pipeline but at small fixed size, no interactivity
- Use inside `proposeLayouts`, `confirmDestructive` renderers — anywhere we want to show a mini-canvas inline

**Phase D — Voice input**

- AI Elements Voice or OpenWhispr in `AIChatComposer`
- Mic button in the action row; recording → transcribe → fill textarea → user edits → sends
- Add settings toggle for transcription provider when there's choice

**Phase E — Remaining tool catalog**

- `confirmGap`, `suggestRename`, `saveAsUserComponent`, `reviewLearnings`
- Each lands as its skill matures (auto-name layers, learn-from-session, etc.)

**Phase F — Inline → canvas promotion polish**

- The "✓ Applied" collapsed state for inline artifacts after promotion
- Undo affordance for "actually no, revert that"
- History rehydration that keeps applied state visible

## What this is and isn't

It IS:
- A protocol for the chat to return interactive UI, not just text
- A catalog of interactive moments we know we want
- A bet that "generative UI in chat" is a defensible product position in 2026

It is NOT:
- Replacing the canvas — the canvas stays the primary artifact
- Replacing typed prompts — they remain the floor; voice and chips are additions, not substitutions
- Custom infrastructure — every interactive surface should map onto the AI SDK's tool-call primitive

## Open questions

- **History persistence of tool results.** When a session resumes and the chat replays, do tool cards re-render as interactive (the user can still pick) or as historical (frozen at the picked state)? Strong opinion: historical. Once you've made the choice, the chat shows what you chose, not the option to pick again.
- **Streaming tool args.** AI SDK supports streaming partial tool args. Worth it for `askQuestions` and `proposeLayouts` where the args are big? Probably yes for `proposeLayouts` (3-4 JSX blobs, slow), no for `askQuestions` (small enough to wait for).
- **Voice in non-English.** Whisper is multilingual, but the model interpreting the prompt afterward may not be tuned for non-English inputs. Worth testing before claiming the feature is global.
- **Tool result schema versioning.** Once tool results are persisted into corpus signals, the schema is load-bearing. Plan for additive-only changes; never remove fields.
