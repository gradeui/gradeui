/**
 * @label       Reddit — Create post
 * @description Full Reddit web composer — top bar with chip-in-search, left rail with nav + Games featured card + collapsible sections, and the create-post form with tabbed media picker, title + char counter, tags, TipTap editor + toolbar, Save Draft / Post.
 * @tags        reddit social post create form editor tiptap subreddit community composer mobbin
 * @source      Mobbin: Reddit — Create Post (web)
 * @notes       Generated 2026-05-19 from screenshot. Pre-populated the editor
 *              with the source's body copy so the playground looks alive on
 *              first load. Reddit's brand orange + Reddit-blue Post button are
 *              hex constants — kept outside the theme so the playground
 *              matches the source under any Grade theme rotation. Toolbar
 *              icons are wired through TipTap's chain commands where
 *              StarterKit covers the mark (B/I/S, headings, lists, code,
 *              quote); decorative-only for image/video/table/etc.
 */
import {
  Stack, Row,
  Card,
  Button, Badge, Avatar, AvatarFallback, Input, Separator,
  Tabs, TabsList, TabsTrigger,
} from "@gradeui/ui";
import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Search, MessageSquare, Plus, Bell,
  Home, Compass, Sparkles, Telescope, Globe, Cog, Bot,
  ChevronDown, ChevronUp, Gamepad2,
  Bold, Italic, Strikethrough, Superscript, Type, Link as LinkIcon,
  Image as ImageIcon, Play, List, ListOrdered, AlertOctagon,
  Quote, Code, FileCode, Table as TableIcon, MoreHorizontal,
  Check, AlertCircle, Pencil, X,
} from "lucide-react";

// Brand surfaces — Reddit's orange + post-button blue. Outside the
// theme so they survive Grade's palette rotation in playgrounds.
const ORANGE = "#ff4500";
const BLUE = "#0079d3";

export default function App() {
  const [tab, setTab] = useState("text");
  const [title, setTitle] = useState("🎬 New here! Huge movie lover looking for must-join film communities");
  const [spoiler, setSpoiler] = useState(true);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Body (optional)",
      }),
    ],
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[280px] px-4 py-3",
      },
    },
    content: `
      <p>Hey everyone! 👋</p>
      <p>I'm new to Reddit (still figuring things out 😅), and I thought I'd start by sharing a bit about my favorite hobby which is watching movies!</p>
      <p>I've been a movie lover for as long as I can remember. Lately, I've been trying to expand my taste and explore more international films and underrated gems.</p>
      <p>Some of my all-time favorite movies are:</p>
      <p>Nobody Knows - The scene where the siblings get separated still haunts me</p>
      <p>Inception - I love how it blends logic and dreams so seamlessly!</p>
      <p>The Help - I adore Minny and her dynamic with Ms. Celia! also that pie! yeahh crazy</p>
      <p>I also keep track of what I watch on Letterboxd - honestly, one of my favorite platforms for discovering new films.</p>
      <p>Now I'm looking to get more involved here on Reddit and wanted to ask:<br/>👉 What are the best movie-related subreddits I must join?</p>
    `,
    immediatelyRender: false,
  });

  const titleMax = 300;
  const titleValid = title.length > 0 && title.length <= titleMax;

  return (
    // Top-level grid — full-width nav row, then sidebar + main below.
    // Reddit's chrome doesn't fit AppShell's single-nav model, so the
    // layout is composed from grid templates directly.
    <div
      className="min-h-screen grid bg-background"
      style={{ gridTemplateRows: "auto 1fr" }}
    >
      <TopBar />
      <div
        className="grid overflow-hidden"
        style={{ gridTemplateColumns: "270px 1fr" }}
      >
        <LeftRail />
        <main className="overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 py-6">
            <Row justify="between" align="center" className="mb-6">
              <h1 className="text-2xl font-bold">Create post</h1>
              <a className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">Drafts</a>
            </Row>

            {/* Community picker chip */}
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full pl-1 pr-3 py-1 mb-5 bg-muted/40 hover:bg-muted transition-colors"
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] bg-purple-200">u</AvatarFallback>
              </Avatar>
              <span className="text-sm">u/alexsmith-mbn</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {/* Media-type tabs — underlined variant matches Reddit's strip */}
            <Tabs value={tab} onValueChange={setTab} className="mb-5">
              <TabsList variant="underlined">
                <TabsTrigger value="text">Text</TabsTrigger>
                <TabsTrigger value="images">Images &amp; Video</TabsTrigger>
                <TabsTrigger value="link">Link</TabsTrigger>
                <TabsTrigger value="poll">Poll</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Spoiler + NSFW chips row */}
            <Row gap="sm" align="center" className="mb-5">
              <button
                type="button"
                onClick={() => setSpoiler((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold tracking-wide transition-colors ${
                  spoiler ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                }`}
              >
                <AlertCircle className="h-3 w-3" />
                SPOILER
              </button>
              <button
                type="button"
                className="h-6 w-6 rounded-full grid place-items-center bg-muted hover:bg-muted-foreground/20"
              >
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </button>
            </Row>

            {/* Title field with floating label, valid checkmark, char counter */}
            <div className="relative mb-2">
              <div className="absolute left-3 top-2 text-[10px] text-muted-foreground pointer-events-none">
                Title<span className="text-destructive">*</span>
              </div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-auto pt-7 pb-3 pr-10 rounded-2xl text-sm"
                placeholder=""
              />
              {titleValid && (
                <Check
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: "#22c55e" }}
                />
              )}
            </div>
            <Row justify="end" className="mb-5">
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {title.length}/{titleMax}
              </span>
            </Row>

            <button
              type="button"
              className="inline-flex items-center rounded-full px-3 py-1 mb-5 bg-muted/40 hover:bg-muted text-xs"
            >
              Add tags
            </button>

            {/* Editor surface — toolbar above, EditorContent below */}
            <Card className="rounded-2xl overflow-hidden">
              <EditorToolbar editor={editor} />
              <EditorContent editor={editor} />
            </Card>

            <Row justify="end" gap="sm" className="mt-5">
              <Button variant="outline" className="rounded-full px-5">
                Save Draft
              </Button>
              <Button className="rounded-full px-5 text-white" style={{ backgroundColor: BLUE }}>
                Post
              </Button>
            </Row>
          </div>
        </main>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Top bar
// ────────────────────────────────────────────────────────────────────

function TopBar() {
  return (
    <Row justify="between" align="center" className="px-4 py-2 border-b border-border bg-background">
      {/* Logo */}
      <Row gap="xs" align="center" className="w-[260px] shrink-0">
        <span
          className="h-7 w-7 rounded-full grid place-items-center text-white text-base font-bold"
          style={{ backgroundColor: ORANGE }}
        >
          r
        </span>
        <span className="text-2xl font-extrabold tracking-tight" style={{ color: ORANGE }}>
          reddit
        </span>
      </Row>

      {/* Search with embedded chip — chip is a removable u/alexsmith-mbn
          pill INSIDE the search input. Custom composition; no DS
          primitive captures this pattern yet. */}
      <div className="flex-1 max-w-3xl">
        <div className="flex items-center gap-2 h-10 rounded-full bg-muted/40 px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs shrink-0">
            <Avatar className="h-4 w-4">
              <AvatarFallback className="text-[8px] bg-purple-200">u</AvatarFallback>
            </Avatar>
            <span>u/alexsmith-mbn</span>
            <X className="h-3 w-3 text-muted-foreground cursor-pointer" />
          </span>
          <input
            type="text"
            placeholder="Search in u/alexsmith-mbn"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Right cluster */}
      <Row gap="xs" align="center" className="w-[260px] justify-end shrink-0">
        <Badge variant="outline" className="text-[10px] font-bold">AD</Badge>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <MessageSquare className="h-4 w-4" />
        </Button>
        <Button variant="ghost" className="h-9 gap-1.5 rounded-full">
          <Plus className="h-4 w-4" />
          <span className="text-sm">Create</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <Bell className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs bg-emerald-200">A</AvatarFallback>
        </Avatar>
      </Row>
    </Row>
  );
}

// ────────────────────────────────────────────────────────────────────
// Left rail
// ────────────────────────────────────────────────────────────────────

function LeftRail() {
  return (
    <Stack gap="none" className="border-r border-border h-full overflow-y-auto">
      {/* Primary nav */}
      <Stack gap="xs" className="p-3">
        <RailItem icon={<Home />} label="Home" />
        <RailItem icon={<Compass />} label="Popular" />
        <RailItem
          icon={<Sparkles />}
          label="Answers"
          trailing={<Badge className="text-[9px] font-bold tracking-wide" style={{ backgroundColor: ORANGE, color: "white" }}>BETA</Badge>}
        />
        <RailItem icon={<Telescope />} label="Explore" />
        <RailItem icon={<Globe />} label="All" />
        <Separator className="my-1" />
        <RailItem icon={<Plus />} label="Start a community" />
      </Stack>

      <Separator />

      {/* Games on Reddit — collapsible section with featured card */}
      <Stack gap="xs" className="p-3">
        <RailSectionHeader label="Games on Reddit" />
        <FeaturedGameCard />
        <RailItem
          icon={<span className="h-7 w-7 rounded-full bg-slate-800 grid place-items-center text-base">🐧</span>}
          label="Honk"
          dense
        />
        <RailItem
          icon={<span className="h-7 w-7 rounded-full bg-emerald-200 grid place-items-center text-base">🐮</span>}
          label="Farm Merge Valley"
          dense
        />
        <RailItem
          icon={<span className="h-7 w-7 rounded-full bg-purple-200 grid place-items-center text-base">🐱</span>}
          label="Jump Cat"
          dense
        />
        <RailItem icon={<Gamepad2 />} label="Discover More Games" />
      </Stack>

      <Separator />

      {/* Custom feeds, Communities, Resources — all collapsible */}
      <Stack gap="xs" className="p-3">
        <RailSectionHeader label="Custom Feeds" />
        <RailItem icon={<Plus />} label="Create Custom Feed" />
      </Stack>

      <Separator />

      <Stack gap="xs" className="p-3">
        <RailSectionHeader label="Communities" />
        <RailItem icon={<Cog />} label="Manage Communities" />
      </Stack>

      <Separator />

      <Stack gap="xs" className="p-3">
        <RailSectionHeader label="Resources" />
        <RailItem icon={<Bot />} label="About Reddit" />
      </Stack>
    </Stack>
  );
}

function RailItem({ icon, label, trailing, dense }) {
  return (
    <button
      type="button"
      className={`flex items-center gap-3 w-full rounded-md hover:bg-muted/60 text-left ${
        dense ? "px-2 py-1.5" : "px-3 py-2"
      }`}
    >
      <span className="h-5 w-5 grid place-items-center text-foreground/80">
        {icon}
      </span>
      <span className="text-sm flex-1 truncate">{label}</span>
      {trailing}
    </button>
  );
}

function RailSectionHeader({ label }) {
  return (
    <Row justify="between" align="center" className="px-3 py-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
    </Row>
  );
}

function FeaturedGameCard() {
  return (
    <button
      type="button"
      className="relative flex items-center gap-3 w-full p-2 rounded-lg text-left transition-shadow hover:shadow-sm"
      style={{
        background: "linear-gradient(135deg, #fff6c2 0%, #ffe88a 100%)",
      }}
    >
      <span
        className="h-10 w-10 rounded-md grid place-items-center text-white text-lg font-extrabold"
        style={{ backgroundColor: "#1e293b" }}
      >
        S
      </span>
      <Stack gap="none" className="flex-1 min-w-0">
        <Row gap="xs" align="center">
          <span className="text-sm font-bold">Syllo</span>
          <Badge
            className="text-[9px] font-bold tracking-wide text-white px-1.5"
            style={{ backgroundColor: ORANGE }}
          >
            NEW
          </Badge>
        </Row>
        <span className="text-[11px] text-foreground/70">Merge syllables fast</span>
        <span className="text-[10px] text-foreground/50 mt-0.5">334K monthly players</span>
      </Stack>
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────
// Editor toolbar
// ────────────────────────────────────────────────────────────────────

function EditorToolbar({ editor }) {
  // Group buttons by family — formatting, headings, media, structure,
  // overflow. Each ToolbarBtn wires through TipTap's chain commands
  // where StarterKit covers the mark; the rest are decorative.
  const isActive = (name, attrs) => editor?.isActive(name, attrs) ?? false;
  return (
    <Row gap="none" align="center" className="border-b border-border px-2 py-1.5 flex-wrap">
      <ToolbarBtn
        icon={<Bold className="h-4 w-4" />}
        onClick={() => editor?.chain().focus().toggleBold().run()}
        active={isActive("bold")}
      />
      <ToolbarBtn
        icon={<Italic className="h-4 w-4" />}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        active={isActive("italic")}
      />
      <ToolbarBtn
        icon={<Strikethrough className="h-4 w-4" />}
        onClick={() => editor?.chain().focus().toggleStrike().run()}
        active={isActive("strike")}
      />
      <ToolbarBtn icon={<Superscript className="h-4 w-4" />} />
      <ToolbarBtn icon={<Type className="h-4 w-4" />} />
      <ToolbarDivider />
      <ToolbarBtn icon={<LinkIcon className="h-4 w-4" />} />
      <ToolbarBtn icon={<ImageIcon className="h-4 w-4" />} />
      <ToolbarBtn icon={<Play className="h-4 w-4" />} />
      <ToolbarDivider />
      <ToolbarBtn
        icon={<List className="h-4 w-4" />}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        active={isActive("bulletList")}
      />
      <ToolbarBtn
        icon={<ListOrdered className="h-4 w-4" />}
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        active={isActive("orderedList")}
      />
      <ToolbarBtn icon={<AlertOctagon className="h-4 w-4" />} />
      <ToolbarBtn
        icon={<Quote className="h-4 w-4" />}
        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        active={isActive("blockquote")}
      />
      <ToolbarBtn
        icon={<Code className="h-4 w-4" />}
        onClick={() => editor?.chain().focus().toggleCode().run()}
        active={isActive("code")}
      />
      <ToolbarBtn
        icon={<FileCode className="h-4 w-4" />}
        onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
        active={isActive("codeBlock")}
      />
      <ToolbarBtn icon={<TableIcon className="h-4 w-4" />} />
      <div className="ml-auto">
        <ToolbarBtn icon={<MoreHorizontal className="h-4 w-4" />} />
      </div>
    </Row>
  );
}

function ToolbarBtn({ icon, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 w-8 rounded grid place-items-center transition-colors ${
        active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      }`}
    >
      {icon}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="h-5 w-px bg-border mx-1" />;
}

// ────────────────────────────────────────────────────────────────────
// DS gaps surfaced by this scaffold
// ────────────────────────────────────────────────────────────────────
//
// Things this layout had to hand-roll because no Grade primitive covers
// them yet. Each entry is a candidate for a future component — when the
// next composer / forum / messaging layout shows up and we hand-roll
// the same pattern again, that's the signal to graduate it into
// @gradeui/ui.
//
// • <EditorToolbar editor={editor} /> — every TipTap-powered scaffold
//   so far (linear-clone, notion-clone, this one) rebuilds the same
//   B / I / S / link / list / quote / code toolbar from scratch. A
//   <RichTextToolbar editor={editor} groups={["format","structure","media"]} />
//   would cover the 80% case and let scaffolds focus on body content.
//   Bonus: built-in active-state via editor.isActive(), keyboard
//   shortcut hints, and a slot for custom buttons.
//
// • Search-with-chip composition — Reddit's search bar embeds a
//   removable u/<user> pill INSIDE the input as a search-context
//   filter. <MultiSelect> already covers the trigger-with-badges
//   pattern (Linear filter bar, Slack channel picker, Notion
//   relation property) — values render as removable Badges inside
//   a Popover trigger. What's NOT covered today is a *freeform
//   text input next to the chips* (user types a query and chips
//   are scopes that commit alongside). Could land as a MultiSelect
//   variant or a separate <SearchWithFilters query value> primitive.
//
// • <Input maxLength={300} showCounter> — character counter under the
//   title field is hand-rolled (the X / max span + tabular-nums).
//   Recurs on every titled textarea (post titles, tweet composers,
//   bio fields). A counter prop on Input + Textarea would absorb it.
//
// • <Input.FloatingLabel> — the title input's "Title*" label floats
//   inside the field at small size. Pattern recurs on any Material-
//   style form. Currently composed from absolute-positioned div +
//   pt-7 padding hack.
//
// • <Sidebar.Promo> / <FeaturedCard> — the Syllo yellow-gradient card
//   with NEW badge is a "promoted slot" pattern. Reddit, Spotify
//   (sponsored playlist), Slack (workspace feature spotlights), and
//   most content platforms have an equivalent. A <Sidebar.Promo>
//   primitive with title / subtitle / meta / tone props would
//   standardise the surface (gradient bg, padding, hover state).
//
// ─── Gaps closed by this scaffold's iteration ───
//
// • Toolbar (shipped) — the three-region top nav (logo | center search
//   | right actions) is now <Toolbar leading center trailing /> per
//   Apple HIG. This scaffold's TopBar component should be retrofitted
//   to use it (TODO). See packages/ui/components/ui/toolbar.tsx.
//
// • SidebarSection already covers uppercase headers — the earlier
//   "<SidebarSectionHeader>" claim was a mirage. SidebarSection's
//   `title` prop gives uppercase + tracking-wide + muted styling +
//   chevron + collapse out of the box. This scaffold's left rail
//   hand-rolls the entire pattern with raw <Stack> + buttons because
//   it bypasses <Sidebar> entirely — the gap was "I didn't use the
//   primitive," not "the primitive is missing features." A retrofit
//   to use Sidebar / SidebarSection would shrink the file ~80 lines
//   and pick up consistent padding/spacing CSS vars.
//
// • New: trailing slot on SidebarSection (shipped) — sections now
//   accept `trailing={<Button>+</Button>}` for "+ Create custom feed"
//   / "+ New page" / similar inline actions. Reddit's "+ Start a
//   community" item below the primary nav could move into a section
//   trailing slot once this scaffold migrates to Sidebar.