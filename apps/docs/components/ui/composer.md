---
name: Composer
import: "@gradeui/ui"
props:
  - placeholder?: string
  - initialText?: string — plain text content to seed on mount
  - initialJson?: string — Lexical state JSON (from a previous onSubmit round-trip)
  - formats?: ComposerFormat[] | false — available formats (defaults to bold/italic/underline/strikethrough/code/h1/h2/blockquote/ul/ol); pass false for plain text only
  - toolbar?: boolean | "top" — show the formatting toolbar above the editor; default false
  - triggers?: ComposerTriggerConfig[] — mention/slash configs, eg. `[{ char: "@", items: people }, { char: "/", items: commands }]`
  - attachments?: boolean | ComposerAttachmentConfig — enable image paste + paperclip when true/object; default off
  - onSubmit?: (content: ComposerContent, attachments?: ComposerAttachment[]) => void
  - isLoading?: boolean — disables editor, swaps default Send for Stop
  - onStop?: () => void
  - maxLength?: number
  - autoFocus?: boolean
  - submitOnEnter?: boolean — default true (Shift-Enter still inserts newline)
  - leftActions?: ReactNode — override the default paperclip
  - rightActions?: ReactNode — override the default Send/Stop
  - hideSend?: boolean — hide the default Send without replacing it
  - steps?: ComposerStep[] — scripted demo sequence
  - trigger?: DemoTrigger — "mount" | "inView" | "manual"; default "mount"
  - play?: boolean — for trigger="manual"
  - speed?: DemoSpeed — "slow" | "normal" | "fast"; default "normal"
  - loop?: boolean
  - loopDelay?: number — ms between loop iterations, default 2000
  - readOnly?: boolean — disables editing AND focusability; programmatic playback still works; use for marketing demos so the script doesn't steal focus
  - bare?: boolean — strip the card chrome
  - className?: string
when_to_use: |
  THE PRIMITIVE for any text composition surface — Slack / Discord /
  Teams chat input, AI chat / copilot prompt box, comment thread input,
  GitHub / Linear / Jira comment box, Reddit / Twitter reply box,
  Notion / Linear document body, email composer, post body, anywhere
  a user types text and submits.

  CONCRETE TEST — if you find yourself writing a `<textarea>` (or
  `<Input>` styled tall) with a row of `<Bold>` / `<Italic>` /
  `<Paperclip>` / `<Send>` buttons below or beside it, STOP. That is
  `<Composer>`. Use it.

  Common shapes:
    Chat input with formatting + attachments + send
      → <Composer formats={["bold","italic","code"]} toolbar attachments />
    AI prompt box with paperclip + send
      → <AIChatComposer />  (preset wrapping Composer)
    Comment / reply input
      → <ComposerReply triggers={[{char:"@", items: people}]} />
    Document body editor
      → <Composer toolbar formats={[...]} bare />

  Built on Lexical for rich text, mentions, slash commands. The
  `attachments` prop wires image paste + paperclip + chip preview row
  with object URL lifecycle handled internally — don't roll that
  plumbing yourself. The `triggers` prop wires @mentions and /slash
  commands with a typeahead popover. The `formats` array picks which
  toolbar buttons render when `toolbar` is on.

  Shares the lib/demo step vocabulary with <Code> so scripted
  typing/format/mention demos animate in the same rhythm as your
  terminal demos.
composes_with: [AIChatComposer (preset wrapping this with paperclip + send + attachments), ComposerReply (preset for comment threads), AIChat (uses AIChatComposer internally), Card (host above for reply boxes), Avatar (in leftActions slot for "your" avatar next to the input)]
aliases: [
  composer, message input, message bar, rich text editor, rich text input,
  mention input, slash input, text editor, prompt input, comment composer,
  comment input, reply input, reply box,
  chat input, chat box, chat input bar, chat composer, chat field,
  slack input, slack composer, slack message box, discord input,
  discord composer, teams chat input, message composer, post composer,
  textarea with toolbar, formatting input, formatted text input,
  message field, send message input, write a message, compose message
]
---

```jsx
// Plain text chat-style composer
<Composer
  placeholder="Ask anything…"
  onSubmit={(content) => send(content.text)}
  formats={false}
/>

// Comment composer with mentions
<Composer
  placeholder="Add a comment…"
  triggers={[{ char: "@", items: teamMembers }]}
  onSubmit={(content) => postComment(content.text, content.mentions)}
  submitOnEnter={false}
  formats={["bold", "italic", "code"]}
  toolbar
/>

// AI chat composer with attachments, mentions AND slash commands
<Composer
  placeholder="Describe a UI, or paste a screenshot…"
  triggers={[
    { char: "@", items: docs },
    { char: "/", items: commands, stripTrigger: true },
  ]}
  attachments
  onSubmit={(content, atts) => {
    sendToAssistant(content.text, content.mentions, atts?.map(a => a.file));
  }}
  isLoading={isStreaming}
  onStop={stop}
/>

// Marketing demo — scripted playback
<Composer
  placeholder="Type a message…"
  triggers={[{ char: "@", items: [{ id: "1", value: "alice" }] }]}
  steps={[
    { type: "type", text: "Hey " },
    { type: "mention", trigger: "@", value: "alice", query: "ali" },
    { type: "type", text: ", check out " },
    { type: "select", text: "check out" },
    { type: "format", format: "italic" },
    { type: "wait", ms: 800 },
    { type: "submit" },
  ]}
  trigger="inView"
  speed="normal"
  loop
/>
```

## Demo step vocabulary

Shares `type` / `wait` / `clear` with `<Code>` (driven by the same `useScriptedDemo` hook). Adds Composer-specific verbs:

- `{ type: "mention", trigger, value, query? }` — insert a mention/slash token. Pass `query` to show the typeahead in flight, then resolve to `value`.
- `{ type: "format", format }` — apply a format to the current selection.
- `{ type: "select", text }` — select a substring (precondition for `format`).
- `{ type: "newline" }` — insert a paragraph break.
- `{ type: "submit" }` — fire `onSubmit`.

## Imperative handle

```tsx
const ref = useRef<ComposerHandle>(null);
ref.current?.focus();
ref.current?.clear();
ref.current?.insert("…");
ref.current?.restart();       // replay scripted steps from the start
ref.current?.restart(3000);   // replay after a 3s delay
ref.current?.getContent();    // { text, json, mentions }
ref.current?.getEditor();     // underlying Lexical editor (escape hatch)
```

## Themes

All colours read from CSS variables (`--gds-composer-*` palette in `globals.css`). The mention pills, toolbar buttons, attachment chips, and editor surface all rebrand with the active gradeui theme without component changes.

## Anti-patterns

```jsx
// ❌ Rolling a chat / Slack / Discord input as <textarea> + manual
//    toolbar buttons + Send button. This is the EXACT shape Composer
//    exists to consolidate — caught in the wild on a "Slack clone"
//    generation where the model assembled this inline.
//    Loses: attachment intake + object URL lifecycle, mention popover,
//    slash commands, action-row slots, the Lexical state graph for
//    rich content round-trip, the scripted-demo step machine.
<div className="border rounded-xl bg-card">
  <textarea
    placeholder="Message #general"
    value={inputText}
    onChange={(e) => setInputText(e.target.value)}
    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSend(); }}
    rows={3}
    className="w-full bg-transparent p-3 resize-none focus:outline-none"
  />
  <Row justify="between" align="center" className="px-3 py-2 border-t">
    <Row gap="xs">
      <Button size="icon" variant="ghost"><Bold /></Button>
      <Button size="icon" variant="ghost"><Italic /></Button>
      <Button size="icon" variant="ghost"><List /></Button>
      <Button size="icon" variant="ghost"><Smile /></Button>
      <Button size="icon" variant="ghost"><Paperclip /></Button>
    </Row>
    <Button onClick={handleSend}>Send</Button>
  </Row>
</div>

// ✅ The Grade way. Same shape, every affordance free.
<Composer
  placeholder="Message #general"
  formats={["bold", "italic", "code", "ul"]}
  toolbar
  attachments
  triggers={[{ char: "@", items: teamMembers }]}
  onSubmit={(content, atts) => handleSend(content.text, atts)}
/>
```

```jsx
// ❌ Reaching for <Input> (single-line) for a multi-line chat / reply
//    surface. Input is for one-line text fields. Use Composer for any
//    surface where the user might type more than one line — chat,
//    comments, post bodies.
<Input
  placeholder="Reply to thread…"
  value={reply}
  onChange={(e) => setReply(e.target.value)}
/>
<Button onClick={postReply}>Reply</Button>

// ✅ ComposerReply preset has the right defaults for a reply box.
<ComposerReply
  placeholder="Reply to thread…"
  triggers={[{ char: "@", items: people }]}
  onSubmit={(content) => postReply(content.text)}
/>
```

```jsx
// ❌ Importing TipTap, Lexical, Slate, or any other editor framework
//    directly into a scaffold. Composer already wraps Lexical and
//    handles all the plumbing.
import { useEditor, EditorContent } from "@tiptap/react";
const editor = useEditor({ extensions: [StarterKit, ...] });
<EditorContent editor={editor} />

// ✅ Use Composer. Same capability, integrated with the design system.
<Composer toolbar formats={["bold", "italic", "h1", "h2", "blockquote", "ul", "ol"]} />
```
