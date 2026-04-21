"use client";

/**
 * /chat — conversational design surface.
 *
 * The user describes a UI in natural language. The model replies with prose
 * plus one or more ```jsx code blocks that import from "./components/ui/…"
 * — each block renders live as a Sandpack preview inside the message bubble,
 * so the output is the actual Grade DS components, not a screenshot.
 *
 * Provider, model and (optional) BYOK key live in localStorage via the
 * ProviderPicker. Default is Gemini 2.5 Flash so the free tier carries you
 * through demo traffic without paying anything.
 */

import { useMemo } from "react";
import { SiteHeader } from "@/components/site-header";
import { DesignChat } from "@/components/ai-elements/design-chat";
import {
  ProviderPicker,
  useChatSettings,
} from "@/components/ai-elements/provider-picker";
import { ALLOWED_COMPONENTS } from "@/lib/chat-sandpack";

function buildSystemPrompt(): string {
  const list = ALLOWED_COMPONENTS.join(", ");
  return `You are an assistant that designs UIs using the Grade Design System.

OUTPUT RULES — follow these exactly:
1. Respond with a short sentence or two explaining what you built, then a single fenced code block tagged \`\`\`jsx that contains the component.
2. The code block MUST be a self-contained React component named \`App\` with \`export default\`.
3. Import ALL design-system components from the single barrel entry "@gradeui/ui" — one consolidated import statement, e.g. \`import { Button, Card, CardHeader, CardTitle, CardContent, Input, Checkbox, Label } from "@gradeui/ui"\`. Do NOT use subpath imports like "@gradeui/ui/button" or "@gradeui/ui/card" — the package does not export those paths and the preview will fail with "Could not find module". Do NOT import from local paths like "./components/ui/<name>". The iframe installs @gradeui/ui from npm so you get the real published components, not copies.
4. You may use these Grade DS components ONLY: ${list}.
5. You may import icons from "lucide-react" (e.g. \`import { Mail } from "lucide-react"\`).
6. For charts, you may import from "recharts" (e.g. \`import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from "recharts"\`). Style charts with the design-system tokens via \`stroke="oklch(var(--primary))"\` / \`fill="oklch(var(--primary))"\` so they follow the active theme.
7. Use Tailwind utility classes for layout and the design system's semantic tokens: bg-background, bg-card, bg-muted, bg-primary, text-foreground, text-muted-foreground, text-primary-foreground, border-border, border-input, etc. Do NOT use raw color classes like bg-blue-500.
8. Keep the preview small — target a single screen. Don't build entire pages.
9. Do not include explanations inside the code block — comments are fine but no chattiness.
10. When the user asks for iterations ("make it bigger", "red instead of green"), regenerate the FULL component so the preview updates in one go.

Example of a well-formed response:

Here's a login form with a remember-me checkbox.

\`\`\`jsx
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input, Label } from "@gradeui/ui"

export default function App() {
  return (
    <div className="p-8 flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[360px]">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Welcome back. Enter your details below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Sign in</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
\`\`\`
`;
}

export default function ChatPage() {
  const [settings, updateSettings] = useChatSettings();
  const systemPrompt = useMemo(() => buildSystemPrompt(), []);

  return (
    <div className="flex flex-col h-screen bg-background">
      <SiteHeader />

      <div className="border-b bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">AI Design Chat</h1>
            <p className="text-xs text-muted-foreground">
              Describe a UI — get a live preview rendered with real Grade
              components.
            </p>
          </div>
          <ProviderPicker settings={settings} onChange={updateSettings} />
        </div>
      </div>

      <main className="flex-1 overflow-hidden">
        <div className="max-w-5xl mx-auto h-full p-4 md:p-6">
          <DesignChat
            settings={settings}
            systemPrompt={systemPrompt}
            className="h-full"
          />
        </div>
      </main>
    </div>
  );
}
