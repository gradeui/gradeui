"use client";

import { useState } from "react";
import { Code2, Sparkles } from "lucide-react";
import { AIChat, type ChatMessage } from "@/components/ui/ai-chat";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { InstallBlock } from "@/components/install-block";

// ---------------------------------------------------------------------
// Sample data — a richer conversation with usage, refs, and actions
// stamped onto each assistant turn, so the playground toggles below
// have something concrete to show or hide. The session token total
// derived from these (sum of `total` across assistant turns) is what
// gets displayed when `headerTokens` is on.

const SAMPLE_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    role: "user",
    content: "What's the primary color in the Grade theme?",
    timestamp: new Date(Date.now() - 60_000),
  },
  {
    id: "2",
    role: "assistant",
    content:
      "The Grade theme uses **teal** as the primary color:\n\n- Light mode: `hsl(175 84% 32%)` — deep teal\n- Dark mode: `hsl(175 80% 45%)` — brighter teal\n\nYou can reference it in components with the `--primary` CSS variable or Tailwind's `text-primary` / `bg-primary` utilities. It's also used for focus rings, links, and the `default` button variant.",
    timestamp: new Date(Date.now() - 55_000),
    usage: { input: 1_240, output: 380, total: 1_620 },
    refs: ["Theme", "Button", "Palette"],
    // Completed turn — every step ends in `done`. The collapsed
    // disclosure reads "3 steps completed"; expanding it shows the
    // full timeline with checkmarks.
    steps: [
      { id: "s1", label: "Reading theme tokens", status: "done" },
      { id: "s2", label: "Looking up Tailwind utilities", status: "done" },
      { id: "s3", label: "Composing response", status: "done" },
    ],
    thinking:
      "User wants to know the primary color. Grade's theme tokens live in lib/themes — the studio preset uses teal. Light: hsl(175 84% 32%), dark: hsl(175 80% 45%). I should give both values, name the CSS variable, and mention where else `--primary` shows up so the answer's useful beyond just the colour pair.",
    actions: [
      {
        id: "preview",
        label: "Rendered in preview →",
        icon: <Code2 className="h-3 w-3" />,
      },
    ],
  },
  {
    id: "3",
    role: "user",
    content: "How do I make a button pill-shaped across the whole site?",
    timestamp: new Date(Date.now() - 30_000),
  },
  {
    id: "4",
    role: "assistant",
    content:
      "Two options:\n\n1. **Set it per-theme** — Add `buttonShape: \"pill\"` to your theme's `components` object. The `Paper` preset already does this.\n2. **Override on one button** — Pass `className=\"rounded-full\"` to `<Button>`.\n\nThe theme-level approach is preferred because it keeps the shape consistent across every `<Button>` without touching call sites.",
    timestamp: new Date(Date.now() - 25_000),
    usage: { input: 1_820, output: 480, total: 2_300 },
    refs: ["Button", "GradeThemeProvider", "Theme"],
    // Mid-stream turn — one step running, one pending. The collapsed
    // disclosure shows the running step ("Composing response") with
    // its spinner; expanding shows the full state. Realistic for a
    // streamed pipeline that hasn't finished yet.
    steps: [
      { id: "s1", label: "Reading Button + GradeThemeProvider refs", status: "done" },
      { id: "s2", label: "Identifying theme-level vs override paths", status: "done" },
      { id: "s3", label: "Composing response", status: "running" },
      { id: "s4", label: "Reviewing draft", status: "pending" },
    ],
    thinking:
      "Two paths here: theme-level (one switch, affects every button) vs className override (scoped to one call site). User said 'across the whole site' — that's the theme-level signal. Mention both so they know the override exists for one-off cases, but lead with the theme answer.",
  },
];

const SESSION_TOKEN_TOTAL = SAMPLE_MESSAGES.reduce(
  (sum, m) => sum + (m.usage?.total ?? 0),
  0
);

// ---------------------------------------------------------------------
// Toggle row — `<Label>` + `<Switch>` paired horizontally. Lifted
// into its own small component so the playground reads as a grid of
// named knobs rather than a wall of Radix.

interface ToggleRowProps {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}

function ToggleRow({ id, label, hint, checked, onCheckedChange }: ToggleRowProps) {
  return (
    <div className="flex items-start gap-3">
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-0.5 shrink-0"
      />
      <div className="min-w-0">
        <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
          {label}
        </Label>
        {hint && (
          <p className="text-xs text-muted-foreground leading-snug mt-0.5">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Page

export default function AIChatPage() {
  // Playground state — one boolean per visual option exposed by AIChat.
  // Defaults are chosen so the first paint shows the busiest version
  // (every strip visible, header tokens on, default chrome), making
  // it obvious what's available before the user starts unticking
  // things to see how the chat shrinks back.
  const [bare, setBare] = useState(false);
  const [assistantBubble, setAssistantBubble] = useState(true);
  const [showUsage, setShowUsage] = useState(true);
  const [showRefs, setShowRefs] = useState(true);
  const [showActions, setShowActions] = useState(true);
  // Default ON in the playground so the disclosures are immediately
  // visible. Studio defaults them OFF — the chat is for users, not
  // developers, and the chat-route doesn't yet emit either signal.
  const [showThinking, setShowThinking] = useState(true);
  const [showSteps, setShowSteps] = useState(true);
  const [showHeaderTokens, setShowHeaderTokens] = useState(true);
  const [showTitleIcon, setShowTitleIcon] = useState(false);

  // Live interactive panel — separate from the playground above so
  // unticking "show refs" on the playground doesn't also affect the
  // interactive demo, and vice versa.
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (message: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "user",
        content: message,
        timestamp: new Date(),
      },
    ]);

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I received your message: "${message}"\n\nThis is a demo response. In a real implementation, this would connect to an AI backend to answer questions about the design system — components, tokens, themes, or usage patterns.`,
        timestamp: new Date(),
      },
    ]);
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

      {/* Visual Options Playground — every AIChat visual knob fronted by
          a Switch, with the chat rendering live below. Reach for this
          first to see what's available. */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Visual Options Playground
        </h2>
        <p className="text-muted-foreground">
          Flip each knob to see how it changes the chat. The same set of toggles is
          what Studio (or any host) would expose in a settings panel.
        </p>

        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 rounded-lg border border-gds-gray-200 dark:border-gds-gray-800 p-4 bg-gds-gray-50 dark:bg-gds-gray-900/40">
          <ToggleRow
            id="opt-bare"
            label="bare"
            hint="Strip the outer card chrome (bg / border / rounded). Use when embedding in a column."
            checked={bare}
            onCheckedChange={setBare}
          />
          <ToggleRow
            id="opt-assistant-bubble"
            label="assistantBubble"
            hint="Assistant turns wear a bubble (bg / border / padding). Turn off for a Claude.ai-style transcript."
            checked={assistantBubble}
            onCheckedChange={setAssistantBubble}
          />
          <ToggleRow
            id="opt-show-usage"
            label="showUsage"
            hint="Render the per-turn token strip (in / out / total) below each assistant message."
            checked={showUsage}
            onCheckedChange={setShowUsage}
          />
          <ToggleRow
            id="opt-show-refs"
            label="showRefs"
            hint="Render the per-turn refs strip (which component .md files were read) below each assistant message."
            checked={showRefs}
            onCheckedChange={setShowRefs}
          />
          <ToggleRow
            id="opt-show-actions"
            label="showActions"
            hint="Render per-turn action chips (e.g. 'Rendered in preview →') inside the assistant bubble."
            checked={showActions}
            onCheckedChange={setShowActions}
          />
          <ToggleRow
            id="opt-show-thinking"
            label="showThinking"
            hint="Collapsible 'Thoughts' disclosure above the assistant prose. Shows reasoning content emitted by thinking models (Claude w/ extended thinking, o-series, DeepSeek R1)."
            checked={showThinking}
            onCheckedChange={setShowThinking}
          />
          <ToggleRow
            id="opt-show-steps"
            label="showSteps"
            hint="Step timeline above the assistant prose. Collapsed shows the current running step; expand for the full vertical timeline."
            checked={showSteps}
            onCheckedChange={setShowSteps}
          />
          <ToggleRow
            id="opt-header-tokens"
            label="headerTokens"
            hint="Show the session-level token total on the right of the header."
            checked={showHeaderTokens}
            onCheckedChange={setShowHeaderTokens}
          />
          <ToggleRow
            id="opt-title-icon"
            label="titleIcon"
            hint="Render an icon before the title (here, a Sparkles glyph). Off by default."
            checked={showTitleIcon}
            onCheckedChange={setShowTitleIcon}
          />
        </div>

        <AIChat
          title="AI Assistant"
          titleIcon={showTitleIcon ? <Sparkles className="h-3 w-3" /> : undefined}
          headerTokens={showHeaderTokens ? SESSION_TOKEN_TOTAL : undefined}
          messages={SAMPLE_MESSAGES}
          showUsage={showUsage}
          showRefs={showRefs}
          showActions={showActions}
          showThinking={showThinking}
          showSteps={showSteps}
          bare={bare}
          assistantBubble={assistantBubble}
          onSendMessage={() => {}}
          placeholder="This playground is read-only…"
          className="min-h-[500px]"
        />
      </div>

      {/* Interactive Demo — actually accepts input so you can feel the
          composer (paperclip, paste, send/stop) without the playground
          knobs muddying the picture. */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Interactive Demo
        </h2>
        <p className="text-muted-foreground">
          Send a message — the composer supports paperclip attach and clipboard
          paste of images.
        </p>
        <AIChat
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          className="min-h-[400px]"
        />
      </div>

      {/* Custom Prompts */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Custom Suggested Prompts
        </h2>
        <p className="text-muted-foreground">
          The empty state surfaces a configurable set of chip prompts. Clicking
          one seeds the composer with that prompt's text.
        </p>
        <AIChat
          messages={[]}
          onSendMessage={() => {}}
          suggestedPrompts={[
            { text: "Show me the color tokens" },
            { text: "List all form components" },
            { text: "Create a new theme preset" },
            { text: "How do I install the package?" },
          ]}
          className="min-h-[350px]"
        />
      </div>

      {/* Features — kept brief; the playground above is the authoritative
          discovery surface. */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Features
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Markdown rendering for AI responses (bold, lists, code blocks)</li>
          <li>Per-turn usage, refs, and actions strips (opt-in)</li>
          <li>Per-turn thinking disclosure for reasoning-capable models (opt-in)</li>
          <li>Per-turn step timeline — collapsible, status-aware (opt-in)</li>
          <li>Session-level token total in the header (opt-in)</li>
          <li>Composer with paperclip attach and clipboard-paste images</li>
          <li>Auto-scrolling with scroll-up detection</li>
          <li>Thinking indicator with customisable phrase</li>
          <li>Slot props for empty state, error banner, composer above/below/full override</li>
          <li>Bareback mode for column-embedded use (Studio's left column)</li>
          <li>Dark mode support</li>
        </ul>
      </div>

      {/* Usage */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <InstallBlock>{`import { AIChat, type ChatMessage } from "@/components/ui/ai-chat";

const [messages, setMessages] = useState<ChatMessage[]>([]);
const [isLoading, setIsLoading] = useState(false);

<AIChat
  title="Ask Grade AI"
  headerTokens={sessionTotal}        // optional; "N tokens" in header
  messages={messages}
  isLoading={isLoading}
  onSendMessage={handleSendMessage}
  // Developer-transparency strips — opt in via your settings UI.
  showUsage
  showRefs
  showActions
/>`}</InstallBlock>
      </div>

      {/* Message Type */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          ChatMessage Type
        </h2>
        <InstallBlock>{`interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;            // Supports Markdown on assistant turns
  timestamp: Date;
  // Optional per-turn extras — rendered only when the matching
  // \`show*\` prop on <AIChat> is on:
  thinking?: string;          // Reasoning / "Thoughts" disclosure
  steps?: ChatMessageStep[];  // Pipeline step timeline
  usage?: { input?: number; output?: number; total?: number };
  refs?: string[];
  actions?: { id: string; label: string; icon?: ReactNode; onClick?: () => void }[];
}

interface ChatMessageStep {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
}`}</InstallBlock>
      </div>

      {/* Dependencies */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Dependencies
        </h2>
        <InstallBlock>{`npm install framer-motion react-markdown remark-gfm lucide-react`}</InstallBlock>
      </div>

      <SidecarBlock slug="ai-chat" />

      <ComponentNav currentHref="/components/ai-chat" />
    </div>
  );
}
