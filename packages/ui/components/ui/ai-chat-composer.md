---
name: AIChatComposer
import: "@gradeui/ui"
props:
  - value: string — controlled textarea value
  - onChange: (next: string) => void — fires for every textarea change
  - onSend: (text: string, attachments?: ChatAttachment[]) => void — fires when the user submits (Enter or click Send); composer validates that text or attachments exist before firing
  - isLoading?: boolean — disables the textarea + paperclip and swaps Send for Stop
  - onStop?: () => void — fires when the user clicks Stop; without this, Stop renders disabled
  - placeholder?: string
  - maxLength?: number — hard cap passed to the underlying `<textarea>`
  - showHint?: boolean — show the "Press Enter… · Paste images" hint below the card; default true, set false when the host renders its own footer
  - className?: string
when_to_use: The reusable "input card" for any chat surface — auto-growing textarea, image attachments via paperclip and clipboard paste, attachment chips with previews, Send/Stop toggle, controlled value. Drop in below any messages list. Use this when you want the input affordances of `<AIChat>` but you're rendering your own messages list / scrollarea / header (e.g. Studio's left-column chat, where SelectionChip and SettingsPanel sit between messages and composer). For the full canned chat block, use `<AIChat>` instead.
composes_with: [AIChat (uses this internally), Card (host above), ScrollArea (place messages above)]
aliases: [chat composer, chat input, prompt composer, message input]
---

```jsx
const [value, setValue] = useState("");

<AIChatComposer
  value={value}
  onChange={setValue}
  onSend={(text, attachments) => {
    // text is already trimmed; attachments is undefined when none.
    // The composer owns each attachment's previewUrl — don't revoke
    // it yourself, just hand the File objects off (e.g. upload, or
    // build multimodal message parts).
    sendToAssistant(text, attachments?.map((a) => a.file));
    setValue("");
  }}
  isLoading={isStreaming}
  onStop={() => stop()}
  placeholder="Describe a UI…"
/>
```
