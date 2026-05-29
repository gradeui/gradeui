/**
 * @label       Chat — Composer drives the message list
 * @description Slack-style three-pane chat where the bottom Composer types messages, mentions teammates, submits — and each submission appends to the visible message list above. After both scripted messages send, the loop resets the list and replays. Demonstrates the scripted demo isn't a screenshot; it's the real component driving real state.
 * @tags        chat slack discord composer scripted mentions threads showcase animation messaging
 * @notes       Generated 2026-05-29, refactored 2026-05-29 to use <Message>
 *              + a single long step array + Composer's onLoopReset hook.
 *              The previous useEffect+ref+setTimeout queue dance collapsed
 *              to one declarative script — multiple type+submit cycles in
 *              the same `steps` prop, loop handles the cadence,
 *              onLoopReset resets the messages list before each replay.
 */
import { useState } from "react";
import {
  AppShell, AppShellHeader, AppShellNav, AppShellAside, AppShellMain,
  Toolbar, ToolbarSlot,
  Stack, Row,
  Button, Badge,
  Composer,
  Message,
  Avatar, AvatarFallback,
} from "@gradeui/ui";
import {
  Hash, Bell, Search, Pin, Settings, Plus, Inbox, Home, Compass,
  Sparkles,
} from "lucide-react";

const TEAM = [
  { id: "u1", value: "alice" },
  { id: "u2", value: "ben" },
  { id: "u3", value: "carolina" },
  { id: "u4", value: "dimitri" },
];

const SEED_MESSAGES = [
  {
    id: "m1",
    author: "alice",
    initials: "A",
    tone: "violet",
    time: "11:24",
    text: "Post copy is in the doc — punchier than v1, lands the BYOT angle better.",
  },
  {
    id: "m2",
    author: "ben",
    initials: "B",
    tone: "amber",
    time: "11:26",
    text: "Agreed. Just need the launch image and we're good to schedule.",
  },
];

// Single long script: types message 1, submits, waits, types message 2,
// submits, waits. Composer's `loop` replays the whole thing; onLoopReset
// fires between iterations to wipe the messages list back to the seed.
// Collapses the previous useEffect+ref+setTimeout queue dance.
const FULL_SCRIPT = [
  // Message 1
  { type: "type", text: "On the image now. " },
  { type: "mention", trigger: "@", value: "carolina", query: "car" },
  { type: "type", text: " do we have a final on the hero render?" },
  { type: "wait", ms: 700 },
  { type: "submit" },
  { type: "wait", ms: 1500 },
  // Message 2
  { type: "type", text: "Also, " },
  { type: "mention", trigger: "@", value: "alice", query: "ali" },
  { type: "type", text: " — want to sync at 2pm to lock the schedule?" },
  { type: "wait", ms: 700 },
  { type: "submit" },
  { type: "wait", ms: 2000 },
];

function ChannelRow({ label, active, hash = true }) {
  return (
    <Row
      gap="xs"
      align="center"
      className={`px-2 py-1 rounded text-sm cursor-default ${active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
    >
      {hash && <Hash className="h-3.5 w-3.5 opacity-60" />}
      <span>{label}</span>
    </Row>
  );
}

function RailButton({ icon: Icon, active }) {
  return (
    <button
      type="button"
      className={`h-9 w-9 rounded-md grid place-items-center transition-colors ${active ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:bg-foreground/5"}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export default function App() {
  const [messages, setMessages] = useState(SEED_MESSAGES);

  const handleSend = (content) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `you-${Date.now()}`,
        author: "you",
        initials: "Y",
        tone: "emerald",
        time: "11:28",
        text: content.text,
      },
    ]);
  };

  return (
    <AppShell
      nav="three-pane"
      className="min-h-screen bg-background"
      style={{ "--gds-app-shell-aside": "240px" }}
    >
      {/* Icon rail */}
      <AppShellNav placement="side">
        <Stack gap="sm" align="center" className="w-[56px] py-3 border-r border-border h-screen">
          <RailButton icon={Home} active />
          <RailButton icon={Inbox} />
          <RailButton icon={Compass} />
          <div className="mt-auto" />
          <RailButton icon={Settings} />
        </Stack>
      </AppShellNav>

      {/* Channel list */}
      <AppShellAside>
        <Stack gap="md" className="h-screen p-3 border-r border-border">
          <Row align="center" justify="between">
            <span className="text-sm font-semibold">Workspace</span>
            <Button size="icon" variant="ghost" className="h-6 w-6">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </Row>
          <Stack gap="xs">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-2">
              Channels
            </span>
            <ChannelRow label="general" />
            <ChannelRow label="launch-week" active />
            <ChannelRow label="design" />
            <ChannelRow label="eng" />
            <ChannelRow label="random" />
          </Stack>
          <Stack gap="xs">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-2">
              Direct messages
            </span>
            <ChannelRow label="alice" hash={false} />
            <ChannelRow label="ben" hash={false} />
            <ChannelRow label="carolina" hash={false} />
          </Stack>
        </Stack>
      </AppShellAside>

      {/* Main pane */}
      <AppShellMain>
        <Stack gap="none" className="h-screen">
          <Toolbar size="md" className="border-b border-border px-4">
            <ToolbarSlot slot="leading">
              <Row gap="sm" align="center">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">launch-week</span>
                <Badge variant="outline" className="text-[10px]">live</Badge>
              </Row>
            </ToolbarSlot>
            <ToolbarSlot slot="trailing">
              <Row gap="xs">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Pin className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Search className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Bell className="h-3.5 w-3.5" />
                </Button>
              </Row>
            </ToolbarSlot>
          </Toolbar>

          {/* Messages list — uses <Message> primitive now. */}
          <Stack gap="md" className="flex-1 overflow-y-auto px-4 py-4">
            {messages.map((m) => (
              <Message
                key={m.id}
                author={m.author}
                timestamp={m.time}
                avatar={
                  <Avatar size="sm">
                    <AvatarFallback tone={m.tone}>{m.initials}</AvatarFallback>
                  </Avatar>
                }
              >
                {m.text}
              </Message>
            ))}
          </Stack>

          {/* Composer — single long script + onLoopReset replaces the
              previous useEffect+ref+setTimeout queue dance. */}
          <div className="border-t border-border p-3 bg-muted/20">
            <Composer
              placeholder="Message #launch-week"
              formats={false}
              triggers={[{ char: "@", items: TEAM }]}
              steps={FULL_SCRIPT}
              trigger="mount"
              speed="normal"
              loop
              loopDelay={3000}
              readOnly
              onSubmit={handleSend}
              onLoopReset={() => setMessages(SEED_MESSAGES)}
            />
          </div>

          <Row
            gap="xs"
            align="center"
            className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground"
          >
            <Sparkles className="h-3 w-3" />
            <span>
              The Composer below is scripted. Each "send" actually appends
              to the message list above. After the script completes, the
              list resets and the cycle replays.
            </span>
          </Row>
        </Stack>
      </AppShellMain>
    </AppShell>
  );
}

// ────────────────────────────────────────────────────────────────────
// Notes — refactor 2026-05-29
// ────────────────────────────────────────────────────────────────────
//
// Lines saved by collapsing the queue dance + adopting <Message>:
//   - Removed: useEffect + scriptIndex state + useRef + 2x setTimeout
//   - Removed: SCRIPTED_MESSAGES array-of-arrays + currentScript pick
//   - Removed: AuthorDot helper (replaced by Avatar + AvatarFallback tone)
//
// The Composer's onLoopReset hook is doing the work the manual
// queue dance was doing. Less stateful scaffold, more declarative.
