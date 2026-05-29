/**
 * @label       Comments — thread with mention typeahead
 * @description Linear-style comment thread on an issue. Existing comments at the top, an inline ComposerReply at the bottom scripted to demonstrate @mention typeahead across two replies. Shows the Composer in its quietest shape via the ComposerReply preset. Refactored to use <Message> for comment rendering + a single long script with onLoopReset for the cycle.
 * @tags        comments thread reply mentions composer scripted issue tracker linear github
 * @notes       Generated 2026-05-29, refactored 2026-05-29 to use
 *              <Message>, <ComposerReply>, single long script, and
 *              Composer's onLoopReset. Companion to chat scaffold; both
 *              demonstrate the same Composer + onLoopReset pattern.
 */
import { useState } from "react";
import {
  AppShell, AppShellHeader, AppShellMain,
  Toolbar, ToolbarSlot,
  Stack, Row,
  Card, CardContent,
  Button, Badge, Separator,
  ComposerReply,
  Message,
  Avatar, AvatarFallback,
} from "@gradeui/ui";
import {
  CircleDot, MessageSquare, MoreHorizontal, Sparkles,
} from "lucide-react";

const TEAM = [
  { id: "u1", value: "alice" },
  { id: "u2", value: "ben" },
  { id: "u3", value: "carolina" },
  { id: "u4", value: "dimitri" },
];

const SEED_COMMENTS = [
  {
    id: "c1",
    author: "alice",
    initials: "A",
    tone: "violet",
    time: "2 hours ago",
    text: "I think we should split this into two PRs — the schema change is independent and easy to review.",
  },
  {
    id: "c2",
    author: "ben",
    initials: "B",
    tone: "amber",
    time: "1 hour ago",
    text: "+1 on splitting. The migration script is also worth pulling out separately so QA can run it against the staging dump first.",
  },
  {
    id: "c3",
    author: "carolina",
    initials: "C",
    tone: "emerald",
    time: "32 minutes ago",
    text: "Agreed on both. I'll take the schema PR if no one's started.",
  },
];

// Single long script: two replies typed back to back, with a wait
// between. loop + onLoopReset on the Composer handles the cycle.
const FULL_SCRIPT = [
  // Reply 1
  { type: "type", text: "Thanks " },
  { type: "mention", trigger: "@", value: "carolina", query: "car" },
  { type: "type", text: " — go for it. I'll pick up the migration script after." },
  { type: "wait", ms: 600 },
  { type: "submit" },
  { type: "wait", ms: 1800 },
  // Reply 2
  { type: "type", text: "Will need a review from " },
  { type: "mention", trigger: "@", value: "ben", query: "be" },
  { type: "type", text: " once it's up. Aiming for end of day." },
  { type: "wait", ms: 600 },
  { type: "submit" },
  { type: "wait", ms: 2000 },
];

export default function App() {
  const [comments, setComments] = useState(SEED_COMMENTS);

  const handleSend = (content) => {
    setComments((prev) => [
      ...prev,
      {
        id: `you-${Date.now()}`,
        author: "you",
        initials: "Y",
        tone: "sky",
        time: "just now",
        text: content.text,
      },
    ]);
  };

  return (
    <AppShell nav="none" className="min-h-screen bg-background">
      <AppShellHeader className="border-b border-border bg-background/80 backdrop-blur">
        <Toolbar size="md" className="max-w-4xl mx-auto px-6">
          <ToolbarSlot slot="leading">
            <Row gap="xs" align="center">
              <div className="h-6 w-6 rounded-md bg-foreground text-background grid place-items-center font-bold text-xs">L</div>
              <span className="font-semibold">linear</span>
              <span className="text-muted-foreground text-sm">/ Engineering / ENG-1284</span>
            </Row>
          </ToolbarSlot>
          <ToolbarSlot slot="trailing">
            <Button size="sm" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </ToolbarSlot>
        </Toolbar>
      </AppShellHeader>

      <AppShellMain className="max-w-4xl mx-auto px-6">
        <Stack gap="lg" className="py-10">
          {/* Issue header */}
          <Stack gap="sm">
            <Row gap="sm" align="center">
              <Badge variant="outline" className="text-xs">
                <CircleDot className="h-3 w-3 mr-1 text-amber-500" />
                In progress
              </Badge>
              <Badge variant="outline" className="text-xs">Backend</Badge>
              <Badge variant="outline" className="text-xs">P1</Badge>
            </Row>
            <h1 className="text-2xl font-semibold tracking-tight">
              Migrate workspaces table to scoped tenancy
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Workspaces currently share a flat ID space across all orgs. We need to scope them under the parent organization so future per-org features (billing, retention policies) can target the right rows.
            </p>
          </Stack>

          <Separator />

          {/* Comment thread — uses <Message> primitive. */}
          <Stack gap="md">
            {comments.map((c) => (
              <Message
                key={c.id}
                author={c.author}
                timestamp={c.time}
                avatar={
                  <Avatar size="sm">
                    <AvatarFallback tone={c.tone}>{c.initials}</AvatarFallback>
                  </Avatar>
                }
              >
                {c.text}
              </Message>
            ))}
          </Stack>

          {/* Reply via <ComposerReply> preset — no toolbar, no
              attachments, "Write a reply…" placeholder out of the box. */}
          <Card>
            <CardContent className="p-4">
              <Stack gap="sm">
                <Row gap="xs" align="center">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Reply</span>
                </Row>
                <ComposerReply
                  triggers={[{ char: "@", items: TEAM }]}
                  steps={FULL_SCRIPT}
                  trigger="mount"
                  speed="normal"
                  loop
                  loopDelay={3000}
                  readOnly
                  onSubmit={handleSend}
                  onLoopReset={() => setComments(SEED_COMMENTS)}
                />
              </Stack>
            </CardContent>
          </Card>

          <Row gap="xs" align="center" className="text-[11px] text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <span>
              Scripted reply box. Each submission appends to the thread
              above; after two replies the thread resets and the cycle
              continues.
            </span>
          </Row>
        </Stack>
      </AppShellMain>
    </AppShell>
  );
}
