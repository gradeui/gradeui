"use client";

import { useState } from "react";
import { AIChat, type ChatMessage } from "@/components/ui/ai-chat";
import { ComponentNav } from "@/components/component-nav";
import { Palette, Sparkles, Component, BookOpen } from "lucide-react";

// Sample conversation — a designer exploring the DS
const sampleMessages: ChatMessage[] = [
  {
    id: "1",
    role: "user",
    content: "What's the primary color in the Ramp theme?",
    timestamp: new Date(Date.now() - 60000),
  },
  {
    id: "2",
    role: "assistant",
    content: "The Ramp theme uses **teal** as the primary color:\n\n- Light mode: `hsl(175 84% 32%)` — deep teal\n- Dark mode: `hsl(175 80% 45%)` — brighter teal\n\nYou can reference it in components with the `--primary` CSS variable or Tailwind's `text-primary` / `bg-primary` utilities. It's also used for focus rings, links, and the `default` button variant.",
    timestamp: new Date(Date.now() - 55000),
  },
  {
    id: "3",
    role: "user",
    content: "How do I make a button pill-shaped across the whole site?",
    timestamp: new Date(Date.now() - 30000),
  },
  {
    id: "4",
    role: "assistant",
    content: "Two options:\n\n1. **Set it per-theme** — Add `buttonShape: \"pill\"` to your theme's `components` object. The `Paper` preset already does this.\n2. **Override on one button** — Pass `className=\"rounded-full\"` to `<Button>`.\n\nThe theme-level approach is preferred because it keeps the shape consistent across every `<Button>` without touching call sites. The `RampThemeProvider` sets `data-button-shape` on the root, and `globals.css` reads it to override the `rds-button` class's radius.",
    timestamp: new Date(Date.now() - 25000),
  },
];

export default function AIChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (message: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Simulate AI response
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: `I received your message: "${message}"\n\nThis is a demo response. In a real implementation, this would connect to an AI backend to answer questions about the design system — components, tokens, themes, or usage patterns.`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMessage]);
    setIsLoading(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">AI Chat</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Conversational AI interface for exploring and building with the design system.
        </p>
      </div>

      {/* Interactive Demo */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Interactive Demo
        </h2>
        <p className="text-muted-foreground">
          Try sending a message to see the chat interface in action.
        </p>
        <AIChat
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          className="min-h-[400px]"
        />
      </div>

      {/* With Sample Conversation */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Sample Conversation
        </h2>
        <AIChat
          messages={sampleMessages}
          onSendMessage={() => {}}
          placeholder="This demo is read-only..."
          className="min-h-[400px]"
        />
      </div>

      {/* Custom Prompts */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Custom Suggested Prompts
        </h2>
        <AIChat
          messages={[]}
          onSendMessage={() => {}}
          suggestedPrompts={[
            { icon: <Palette className="w-4 h-4" />, text: "Show me the color tokens" },
            { icon: <Component className="w-4 h-4" />, text: "List all form components" },
            { icon: <Sparkles className="w-4 h-4" />, text: "Create a new theme preset" },
            { icon: <BookOpen className="w-4 h-4" />, text: "How do I install the package?" },
          ]}
          className="min-h-[350px]"
        />
      </div>

      {/* Features */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Features
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Markdown rendering for AI responses (bold, lists, code blocks)</li>
          <li>Animated message bubbles with spring physics</li>
          <li>Auto-scrolling with scroll-up detection</li>
          <li>Thinking indicator with animated dots</li>
          <li>Customizable suggested prompts with icons</li>
          <li>Auto-resizing textarea (up to 200px)</li>
          <li>Keyboard shortcuts (Enter to send, Shift+Enter for newline)</li>
          <li>Loading state with cancel button</li>
          <li>Empty state with welcome message</li>
          <li>Dark mode support</li>
        </ul>
      </div>

      {/* Usage */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import { AIChat, type ChatMessage } from "@/components/ui/ai-chat"

const [messages, setMessages] = useState<ChatMessage[]>([])
const [isLoading, setIsLoading] = useState(false)

const handleSendMessage = async (message: string) => {
  // Add user message
  setMessages(prev => [...prev, {
    id: Date.now().toString(),
    role: "user",
    content: message,
    timestamp: new Date(),
  }])

  // Call your AI backend
  setIsLoading(true)
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  })
  const data = await response.json()

  // Add AI response
  setMessages(prev => [...prev, {
    id: (Date.now() + 1).toString(),
    role: "assistant",
    content: data.response,
    timestamp: new Date(),
  }])
  setIsLoading(false)
}

<AIChat
  messages={messages}
  onSendMessage={handleSendMessage}
  isLoading={isLoading}
  placeholder="Ask about components, tokens, or themes..."
  suggestedPrompts={[
    { icon: <Palette />, text: "Color tokens" },
    { icon: <Component />, text: "Form components" },
  ]}
/>`}</code>
          </pre>
        </div>
      </div>

      {/* Message Type */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          ChatMessage Type
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string         // Supports Markdown
  timestamp: Date
}`}</code>
          </pre>
        </div>
      </div>

      {/* Dependencies */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Dependencies
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`npm install framer-motion react-markdown remark-gfm`}</code>
          </pre>
        </div>
      </div>

      <ComponentNav currentHref="/components/ai-chat" />
    </div>
  );
}
