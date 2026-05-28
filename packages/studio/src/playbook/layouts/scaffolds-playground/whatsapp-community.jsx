/**
 * @label       WhatsApp — community chat
 * @description Three-pane WhatsApp web layout: icon rail, chat list with filter chips + Meta AI search, and an active community chat with announcement banner, system messages, and the composer.
 * @tags        whatsapp messaging chat communication community meta mobbin
 * @source      Mobbin: WhatsApp — Product & UX Playground (Announcements)
 * @notes       Generated 2026-05-19 from screenshot. Skipped the signature
 *              WhatsApp doodle-pattern background in the chat pane — left it as a
 *              flat cream surface so the messages stay legible. Meta AI's rainbow
 *              circle is a CSS conic-gradient; the chat panel's "Welcome to your
 *              community" card matches the source's pale yellow-tinted surface.
 *              The Read-receipt double-check uses a custom lucide compose since
 *              CheckCheck reads as solid where WhatsApp's is two overlapping
 *              ticks — close enough at this fidelity.
 */
import {
  AppShell, AppShellNav, AppShellAside, AppShellMain,
  Stack, Row,
  Card,
  Button, Badge, Avatar, AvatarFallback, Input, Separator,
} from "@gradeui/ui";
import { useState } from "react";
import {
  Bell, Compass, Mic, Users, Settings, MessageCircle,
  Plus, MoreVertical, Search, Camera, Sparkles,
  Smile, Paperclip, CheckCheck, Megaphone, X, ChevronDown,
} from "lucide-react";

// WhatsApp brand surfaces — kept as raw hex so the playground matches
// the source even when Grade's theme picker rotates the palette.
const BG = "#f7f4ee";         // chat-pane cream
const ACCENT = "#00a884";     // WhatsApp green
const ACCENT_SOFT = "#d9fdd3"; // pale green filter chip + active list bg
const BANNER = "#fdf4d3";     // pale yellow encryption / community surface

export default function App() {
  // Chat list — every chat has a stable id, an avatar (emoji or text
  // fallback), a name, a preview, a timestamp, an optional unread
  // count, and optional inline media indicators.
  const chats = [
    {
      id: "sam-lee", name: "Sam Lee", time: "12:48 PM", unread: 1,
      preview: "Hi, Alex. I want to ask you something related to …",
      avatarFallback: "SL",
    },
    {
      id: "pux-1", name: "Product & UX Playground", emoji: "🎨", time: "12:29 PM",
      preview: "Group \"Review UI 🍁\" was added", active: true,
    },
    {
      id: "pux-2", name: "Product & UX Playground", emoji: "🌈", time: "12:29 PM",
      preview: "Review UI 🍁\nYou changed this group's icon", twoLine: true,
    },
    {
      id: "pux-3", name: "Product & UX Playground", emoji: "🎨", time: "12:27 PM",
      preview: "UI Design Inspiration 👷‍♀️\nSam: 📷 Photo", twoLine: true,
    },
    {
      id: "meta-ai", name: "Meta AI", time: "10:34 AM",
      preview: "No worries, mate! 🎄 Hope you find the perfect sp…",
      metaAI: true,
    },
    {
      id: "you", name: "+65 9036 6027", suffix: "(You)", time: "10:34 AM",
      preview: "Don't forget about this UX Case Study",
      read: true, avatarFallback: "AL",
    },
    {
      id: "john", name: "John Doe", time: "10:34 AM",
      preview: "https://whatsapp.com/channel/0029VbC2dsi1C…",
      read: true, avatarFallback: "JD",
    },
    {
      id: "wa-support", name: "WhatsApp Support", time: "Yesterday",
      preview: "I'm glad that we could help! If you have any more q…",
      brandAvatar: "wa",
    },
    {
      id: "money", name: "The Money Mindset", time: "10:34 AM",
      preview: "You assigned Sam Lee as the new owner.",
      groupIcon: true,
    },
  ];

  const FILTERS = ["All", "Unread", "Favorites", "Groups"];
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedChatId, setSelectedChatId] = useState("pux-1");
  const [bannerOpen, setBannerOpen] = useState(true);

  return (
    // Three-pane AppShell: rail (AppShellNav placement="side") + chat
    // list (AppShellAside) + active chat (AppShellMain). Aside width
    // overridden to 380px to match WhatsApp's wider chat list.
    <AppShell
      nav="three-pane"
      className="h-screen"
      style={{ "--gds-app-shell-aside": "380px" }}
    >
      {/* ─── Left: icon rail ─── */}
      <AppShellNav placement="side" className="bg-muted/40 border-r border-border">
        <Stack gap="none" justify="between" align="center" className="h-full py-3 w-[64px]">
        <Stack gap="md" align="center">
          <RailIcon icon={<MessageCircle className="h-5 w-5" style={{ color: ACCENT }} fill={ACCENT} />} badge={1} active />
          <RailIcon icon={<Compass />} />
          <RailIcon icon={<Mic />} />
          <RailIcon icon={<Users />} />
          {/* Meta AI — rainbow conic gradient ring */}
          <button
            type="button"
            className="h-9 w-9 rounded-full grid place-items-center"
            aria-label="Meta AI"
          >
            <span
              className="h-6 w-6 rounded-full"
              style={{
                background:
                  "conic-gradient(from 90deg, #2563eb, #16a34a, #facc15, #f97316, #dc2626, #a855f7, #2563eb)",
              }}
            />
          </button>
        </Stack>
        <Stack gap="md" align="center">
          <RailIcon icon={<Settings />} />
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-[10px]">AL</AvatarFallback>
          </Avatar>
        </Stack>
        </Stack>
      </AppShellNav>

      {/* ─── Middle: chat list ─── */}
      <AppShellAside className="border-r border-border h-screen overflow-hidden flex flex-col">
        <Row justify="between" align="center" className="px-4 pt-4 pb-3">
          <Row gap="xs" align="center">
            <h1 className="text-xl font-bold">WhatsApp</h1>
            <Badge className="h-4 px-1 text-[10px] text-white" style={{ backgroundColor: ACCENT }}>
              1
            </Badge>
          </Row>
          <Row gap="xs" align="center">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </Row>
        </Row>

        {/* Search with the Meta AI gradient swirl on the left */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Ask Meta AI or Search"
              className="pl-9 pr-9 h-9 rounded-full bg-muted/60 border-0"
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full"
              style={{
                background:
                  "conic-gradient(from 90deg, #2563eb, #16a34a, #facc15, #f97316, #dc2626, #a855f7, #2563eb)",
              }}
            />
          </div>
        </div>

        {/* Filter chips */}
        <Row gap="xs" align="center" className="px-4 pb-3">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeFilter === f
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              style={
                activeFilter === f ? { backgroundColor: ACCENT_SOFT } : undefined
              }
            >
              {f}
            </button>
          ))}
        </Row>

        <Separator />

        {/* Chat rows */}
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <ChatRow
              key={chat.id}
              chat={chat}
              selected={chat.id === selectedChatId}
              onSelect={() => setSelectedChatId(chat.id)}
            />
          ))}
        </div>

        {/* Get WhatsApp for Mac CTA */}
        <div className="border-t border-border p-3">
          <Button variant="outline" className="w-full justify-start gap-2 rounded-md font-medium">
            <span className="h-5 w-5 rounded-full grid place-items-center text-white" style={{ backgroundColor: ACCENT }}>
              <MessageCircle className="h-3 w-3" fill="white" />
            </span>
            Get WhatsApp for Mac
          </Button>
        </div>
      </AppShellAside>

      {/* ─── Right: active chat pane ─── */}
      <AppShellMain className="overflow-hidden" style={{ backgroundColor: BG }}>
        <Stack gap="none" className="h-screen overflow-hidden">
        {/* Header */}
        <Row justify="between" align="center" className="px-4 py-3 border-b border-border bg-card">
          <Row gap="sm" align="center">
            <span className="h-10 w-10 rounded-full grid place-items-center text-xl bg-amber-100">🎨</span>
            <Stack gap="none">
              <span className="text-sm font-semibold">Product &amp; UX Playground</span>
              <span className="text-xs text-muted-foreground">Announcements</span>
            </Stack>
          </Row>
          <Row gap="xs" align="center">
            <button
              type="button"
              className="flex items-center gap-1 h-8 px-2 rounded-md hover:bg-muted"
            >
              <span className="text-base">🎨</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </Row>
        </Row>

        {/* Announcement banner */}
        {bannerOpen && (
          <Row
            justify="between"
            align="center"
            className="px-4 py-2.5 border-b border-border"
            style={{ backgroundColor: BG }}
          >
            <Row gap="sm" align="center" className="text-sm">
              <Megaphone className="h-4 w-4 shrink-0" style={{ color: ACCENT }} />
              <span>Create events in announcement groups.</span>
              <a className="font-semibold cursor-pointer" style={{ color: ACCENT }}>
                Learn more
              </a>
            </Row>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setBannerOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </Row>
        )}

        {/* Message canvas */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Stack gap="md" align="center" className="max-w-2xl mx-auto">
            <DateDivider label="Yesterday" />
            <SystemNotice>
              🔒 Messages and calls are end-to-end encrypted. Only people in this chat can
              read, listen to, or share them. Click to learn more
            </SystemNotice>
            <SystemNotice>
              <span className="inline-flex items-center gap-1">
                <span className="h-3 w-3 rounded-sm grid place-items-center text-[8px]" style={{ backgroundColor: "#cbd5e1" }}>
                  ⋮
                </span>
                This chat has added privacy for your phone number. Click to learn more
              </span>
            </SystemNotice>

            {/* Welcome card */}
            <Card className="w-full max-w-md" style={{ backgroundColor: BANNER, borderColor: "rgba(0,0,0,0.05)" }}>
              <Stack gap="sm" align="center" className="p-5 text-center">
                <span className="h-12 w-12 rounded-full grid place-items-center text-2xl bg-amber-100">🎨</span>
                <h3 className="text-sm font-semibold">Welcome to your community!</h3>
                <p className="text-xs text-muted-foreground">
                  Send important admin updates to all your members at once.
                </p>
                <a
                  className="text-sm font-semibold cursor-pointer mt-1"
                  style={{ color: ACCENT }}
                >
                  Manage community
                </a>
              </Stack>
            </Card>

            <PillNotice>Group "UI Design Inspiration 👷‍♀️" was added</PillNotice>

            <DateDivider label="Today" />

            <PillNotice>Group "Review UI 🍁" was added</PillNotice>
          </Stack>
        </div>

        {/* Composer */}
        <Row gap="sm" align="center" className="px-4 py-3 border-t border-border bg-card">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Plus className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Smile className="h-5 w-5" />
          </Button>
          <Input
            placeholder="Type a message"
            className="flex-1 h-9 rounded-full bg-muted/40 border-0"
          />
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Mic className="h-5 w-5" />
          </Button>
        </Row>
        </Stack>
      </AppShellMain>
    </AppShell>
  );
}

// ────────────────────────────────────────────────────────────────────
// Pieces
// ────────────────────────────────────────────────────────────────────

function RailIcon({ icon, badge, active }) {
  return (
    <button
      type="button"
      className={`relative h-9 w-9 rounded-md grid place-items-center transition-colors ${
        active ? "bg-muted" : "hover:bg-muted/60"
      }`}
    >
      <span className="h-5 w-5 grid place-items-center text-muted-foreground">{icon}</span>
      {badge !== undefined && (
        <span
          className="absolute top-1 right-1 h-2 w-2 rounded-full"
          style={{ backgroundColor: ACCENT }}
        />
      )}
    </button>
  );
}

function ChatRow({ chat, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left px-3 py-3 flex gap-3 transition-colors border-b border-border/40 ${
        selected ? "" : "hover:bg-muted/40"
      }`}
      style={selected ? { backgroundColor: "rgba(0,0,0,0.04)" } : undefined}
    >
      {/* Avatar — emoji surface, Meta AI rainbow, group fallback, or initials */}
      <div className="shrink-0">
        {chat.emoji ? (
          <span
            className={`h-12 w-12 rounded-full grid place-items-center text-xl ${
              chat.emoji === "🌈" ? "" : "bg-amber-100"
            }`}
            style={
              chat.emoji === "🌈"
                ? {
                    background:
                      "conic-gradient(from 90deg, #2563eb, #16a34a, #facc15, #f97316, #dc2626, #a855f7, #2563eb)",
                  }
                : undefined
            }
          >
            {chat.emoji !== "🌈" && chat.emoji}
          </span>
        ) : chat.metaAI ? (
          <span
            className="h-12 w-12 rounded-full grid place-items-center"
            style={{
              background:
                "conic-gradient(from 90deg, #2563eb, #16a34a, #facc15, #f97316, #dc2626, #a855f7, #2563eb)",
            }}
          >
            <span className="h-7 w-7 rounded-full bg-card" />
          </span>
        ) : chat.brandAvatar === "wa" ? (
          <span
            className="h-12 w-12 rounded-full grid place-items-center text-white"
            style={{ backgroundColor: ACCENT }}
          >
            <MessageCircle className="h-6 w-6" fill="white" />
          </span>
        ) : chat.groupIcon ? (
          <span className="h-12 w-12 rounded-full grid place-items-center bg-muted">
            <Users className="h-5 w-5 text-muted-foreground" />
          </span>
        ) : (
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-sm">
              {chat.avatarFallback ?? chat.name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      <Stack gap="xs" className="flex-1 min-w-0">
        <Row justify="between" align="baseline" className="gap-2">
          <span className="text-sm font-semibold truncate">
            {chat.name}
            {chat.suffix && (
              <span className="ml-1 text-muted-foreground font-normal">{chat.suffix}</span>
            )}
          </span>
          <span
            className={`text-[11px] shrink-0 ${
              chat.unread ? "font-medium" : "text-muted-foreground"
            }`}
            style={chat.unread ? { color: ACCENT } : undefined}
          >
            {chat.time}
          </span>
        </Row>
        <Row justify="between" align="start" className="gap-2">
          <p
            className={`text-xs text-muted-foreground ${
              chat.twoLine ? "line-clamp-2 whitespace-pre-line" : "truncate"
            }`}
          >
            {chat.read && <CheckCheck className="inline h-3 w-3 mr-1" style={{ color: ACCENT }} />}
            {chat.preview.includes("📷") ? (
              <>
                {chat.preview.split("📷")[0]}
                <Camera className="inline h-3 w-3 mx-1" />
                Photo
              </>
            ) : (
              chat.preview
            )}
          </p>
          {chat.unread !== undefined && (
            <Badge
              className="h-4 min-w-[16px] px-1 text-[10px] text-white shrink-0"
              style={{ backgroundColor: ACCENT }}
            >
              {chat.unread}
            </Badge>
          )}
        </Row>
      </Stack>
    </button>
  );
}

function DateDivider({ label }) {
  return (
    <span className="rounded-md px-3 py-1 text-[11px] font-medium text-muted-foreground bg-card shadow-sm">
      {label}
    </span>
  );
}

function SystemNotice({ children }) {
  return (
    <div
      className="w-full max-w-md rounded-md px-4 py-2.5 text-[12px] text-center text-foreground/80 shadow-sm"
      style={{ backgroundColor: BANNER }}
    >
      {children}
    </div>
  );
}

function PillNotice({ children }) {
  return (
    <span className="rounded-md px-3 py-1 text-[11px] text-muted-foreground bg-card shadow-sm">
      {children}
    </span>
  );
}

// ────────────────────────────────────────────────────────────────────
// DS gaps surfaced by this scaffold
// ────────────────────────────────────────────────────────────────────
//
// Things this layout had to hand-roll because no Grade primitive covers
// them yet. Each entry is a candidate for a future component — when the
// next messaging-flavoured layout shows up and we hand-roll the same
// pattern again, that's the signal to graduate it into @gradeui/ui.
//
// • <ChatRow> — avatar + name + suffix + timestamp + two-line preview
//   + read-receipt indicator + unread badge. The ceremony is repeated
//   nine times here and would recur in any Slack / Discord / Telegram /
//   Linear-inbox clone. Slot pattern: <ChatRow leading={avatar}
//   trailing={badge} subtitle={preview} timestamp={time} />.
//
// • Non-person <Avatar> variants — the chat list shows half a dozen
//   non-person avatar shapes (emoji-on-tint, conic-gradient ring, brand
//   disc, group fallback). Hand-rolled here as inline spans + custom
//   gradients. Options: extend Avatar with variants, OR add a sibling
//   <ChatAvatar> / <ListAvatar> primitive purpose-built for it.
//
// • <SystemMessage> / <Pill> — the pale-yellow encryption notice, the
//   privacy-info notice, the "Group X was added" pills, and the date
//   dividers (Yesterday / Today) all share the same rounded-corners +
//   drop-shadow + centered-text treatment but with different surface
//   tints. A <SystemMessage tone="info|warn|neutral" align="center">
//   primitive would absorb all four uses.
//
// • Banner with dismiss — the "Create events in announcement groups"
//   bar is structurally identical to a Callout (icon + body + link +
//   close), but it spans the full pane width inside a chrome bar. A
//   Callout variant or a <Banner> primitive could cover it without the
//   manual Row + justify layout work.
