---
name: AIChat
import: "@gradeui/ui"
props:
  - messages?: ChatMessage[] — `{ id, role: "user" | "assistant", content, timestamp, thinking?, steps?, usage?, refs?, actions?, duration? }`; defaults to empty
  - onSendMessage?: (message: string, attachments?: ChatAttachment[]) => void — fires when the user submits via the default composer; ignored if `composerSlot` is set
  - isLoading?: boolean — shows a typing indicator at the bottom of the message list
  - placeholder?: string — composer placeholder text (ignored if `composerSlot` is set)
  - title?: string — header title; defaults to "AI Assistant"
  - titleIcon?: React.ReactNode — optional icon rendered before the title (e.g. `<Sparkles />`)
  - headerTokens?: number — optional session-level token total shown on the right of the header; rendered as "N tokens" with a small gauge icon when set
  - headerEnd?: React.ReactNode — optional arbitrary content appended after `headerTokens` on the right of the header
  - showUsage?: boolean — show the per-turn `usage` strip below the assistant bubble; default false
  - showRefs?: boolean — show the per-turn `refs` strip below the assistant bubble; default false
  - showActions?: boolean — render per-turn `actions` chips when a message has them; default true
  - showDuration?: boolean — render the per-turn wall-clock duration ("2.3s") below the assistant bubble when a message carries `duration`; default false
  - showThinking?: boolean — render the per-turn reasoning ("Thoughts") disclosure above the assistant prose when a message carries `thinking`; collapsed by default, click to expand; default false
  - showSteps?: boolean — render the per-turn step timeline above the assistant prose when a message carries `steps`; collapsed view shows the current running step (or "N steps completed"), click to expand the vertical timeline with status glyphs; default false
  - thinkingPhrase?: string — override the "Thinking" label in the loading indicator
  - suggestedPrompts?: { icon?: React.ReactNode; text: string }[] — empty-state quick prompts (ignored if `emptyStateSlot` is set)
  - emptyStateSlot?: React.ReactNode — replaces the default empty state entirely
  - errorSlot?: React.ReactNode — rendered after the messages list (typically an error banner)
  - composerAboveSlot?: React.ReactNode — rendered between the messages and the composer (selection chip, settings panel)
  - composerBelowSlot?: React.ReactNode — rendered below the composer (disclaimer, char counter)
  - composerSlot?: React.ReactNode — full override of the composer; when provided, `onSendMessage` + `placeholder` are unused
  - bare?: boolean — strip the outer card chrome (background, border, rounded corners) so the chat takes the surface of its container; default false (keeps the canned card look)
  - assistantBubble?: boolean — whether assistant messages render with a bubble (background + border + padding + rounded corners); default true. Set false for a Claude.ai-style chromeless transcript where assistant text sits on the surface and only user turns wear a bubble.
  - className?: string
when_to_use: A flexible chat block — header + scrollable message list + composer. Out of the box it looks like a polished "AI panel"; under it, every region is a slot so hosts can compose richer chat surfaces (e.g. Studio's left column with selection chip + settings panel above the composer, an error banner inline, per-message usage / refs / actions). Per-turn token usage, refs, and actions are optional and gated by `showUsage` / `showRefs` / `showActions` — leave them off for product-facing chats, turn them on for developer-facing ones where transparency matters. Composes with [[AIChatComposer]] (rendered internally; can be slotted in with custom props via `composerSlot`).
composes_with: [Card (host in a sidebar panel), Sheet (mobile drawer), Stack (place above other content), AIChatComposer (internal composer; slot to override)]
aliases: [ai chat, chat panel, chat block, llm chat, assistant panel, copilot chat, ai assistant]
---

```jsx
// Canned use — no slots, no metadata. Matches the original API.
<AIChat
  messages={messages}
  isLoading={loading}
  onSendMessage={(text, attachments) => send(text, attachments)}
/>
```

```jsx
// Developer-facing chat with per-turn usage + refs + a "Rendered in
// preview →" action on assistant turns. `headerTokens` shows a session
// running total. All optional — flip them via your own settings UI.
<AIChat
  title="Ask Grade AI"
  titleIcon={<Sparkles className="h-3 w-3" />}
  headerTokens={sessionTokenTotal}
  showUsage
  showRefs
  messages={messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: textFromParts(m.parts),
    timestamp: new Date(),
    usage: usageFromMetadata(m.metadata),
    refs: refsFromMetadata(m.metadata),
    actions: hasJsxBlock(m)
      ? [{ id: "preview", label: "Rendered in preview →", icon: <Code2 className="h-3 w-3" />, onClick: () => focusPreview() }]
      : undefined,
  }))}
  isLoading={isStreaming}
  thinkingPhrase={rotatingPhrase}
  composerAboveSlot={<><SelectionChip /><SettingsPanel /></>}
  composerBelowSlot={<InputFooter charCount={input.length} limit={1000} />}
  composerSlot={
    <AIChatComposer
      value={input}
      onChange={setInput}
      onSend={handleSend}
      isLoading={isStreaming}
      onStop={stop}
      maxLength={1000}
      showHint={false}
    />
  }
  errorSlot={error && <ErrorBanner error={error} />}
/>
```
