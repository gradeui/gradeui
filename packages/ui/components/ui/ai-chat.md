---
name: AIChat
import: "@gradeui/ui"
props:
  - messages?: ChatMessage[] — `{ id, role: "user" | "assistant", content, timestamp }`; defaults to empty
  - onSendMessage?: (message: string) => void — fires when the user submits a query
  - isLoading?: boolean — shows a typing indicator on the last assistant turn
  - placeholder?: string — input placeholder text
  - suggestedPrompts?: { icon?: React.ReactNode; text: string }[] — empty-state quick prompts
  - className?: string
when_to_use: A pre-built chat block — paste it in to get a working LLM chat surface without composing the message list, autoscroll, suggested prompts, and submit input yourself. Reach for it as the "AI panel" in an admin/support tool, or to demo an LLM-driven feature inside a marketing page. For Studio-grade chat with file refs and streaming structured output, you'll outgrow this and want a custom composition built on Textarea + Card + ScrollArea.
composes_with: [Card (host in a sidebar panel), Sheet (mobile drawer), Stack (place above other content)]
aliases: [ai chat, chat panel, chat block, llm chat, assistant panel, copilot chat]
---

```jsx
const [messages, setMessages] = useState([]);
const [loading, setLoading] = useState(false);

<AIChat
  messages={messages}
  isLoading={loading}
  onSendMessage={async (text) => {
    setMessages((m) => [...m, { id: uid(), role: "user", content: text, timestamp: new Date() }]);
    setLoading(true);
    const reply = await fetchAssistant(text);
    setMessages((m) => [...m, { id: uid(), role: "assistant", content: reply, timestamp: new Date() }]);
    setLoading(false);
  }}
  suggestedPrompts={[
    { icon: <Sparkles />, text: "Summarise this page" },
    { icon: <Lightbulb />, text: "Suggest next steps" },
  ]}
/>
```
