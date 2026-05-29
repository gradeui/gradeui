/**
 * @label       Document editor — Composer with full toolbar
 * @description Notion-style doc page. Left sidebar with a fake page tree, main pane has a page header (icon + title + meta) and a Composer with the full formatting toolbar — bold/italic/underline/strike/code, headings, blockquote, lists. Empty by default so the visitor can actually try the toolbar, then a scripted demo at the top of the page shows formatting being applied in motion. Fourth scaffold completing the Composer surface tour.
 * @tags        document editor notion composer toolbar rich text formatting demo writing wiki
 * @notes       Generated 2026-05-29. Two Composers on the page:
 *
 *                1. Scripted demo at the top in readOnly mode — types text,
 *                   applies a few formats inline, shows the toolbar
 *                   activating as it goes. Loop with 4s breath.
 *                2. Fully editable Composer below for the visitor to play
 *                   with the toolbar themselves. No script, no readOnly,
 *                   autoFocus off.
 *
 *              The format-during-typing demo uses select+format. Today
 *              that leaves a non-collapsed selection that the next type
 *              step would replace (parked bug in Composer). Until that
 *              lands, the demo applies format AFTER all typing finishes,
 *              targeting whole substrings retroactively. Trade-off but
 *              demonstrates the format step is alive.
 */
import {
  AppShell, AppShellHeader, AppShellNav, AppShellMain,
  Toolbar, ToolbarSlot,
  Stack, Row,
  Card, CardContent,
  Button, Badge, Separator,
  Composer,
} from "@gradeui/ui";
import {
  FileText, Folder, ChevronRight, Star, Search, Plus,
  MoreHorizontal, Share2, Sparkles, Smile,
} from "lucide-react";

// Scripted format demo — types out a short doc, then retroactively
// applies bold + italic + h2 + blockquote to substrings to show the
// toolbar buttons firing. Note we apply format steps AFTER typing
// completes so the leftover-selection bug doesn't replace text.
const DOC_DEMO_SCRIPT = [
  { type: "type", text: "Launch week retro" },
  { type: "wait", ms: 300 },
  { type: "newline" },
  { type: "type", text: "What worked: the staged announce hit harder than the all-at-once approach we tried last cycle." },
  { type: "wait", ms: 400 },
  { type: "newline" },
  { type: "type", text: "What to change: the engineering RFC needs to land a week earlier so the docs team isn't writing copy against a moving target." },
  { type: "wait", ms: 800 },
  // Apply formats retroactively now that typing is done.
  { type: "select", text: "Launch week retro" },
  { type: "format", format: "h2" },
  { type: "wait", ms: 500 },
  { type: "select", text: "What worked" },
  { type: "format", format: "bold" },
  { type: "wait", ms: 400 },
  { type: "select", text: "What to change" },
  { type: "format", format: "bold" },
  { type: "wait", ms: 600 },
];

function PageRow({ icon: Icon = FileText, label, active, indent = 0 }) {
  return (
    <Row
      gap="xs"
      align="center"
      className={`px-2 py-1 rounded text-sm cursor-default ${active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
      style={{ paddingLeft: `${0.5 + indent * 0.75}rem` }}
    >
      <Icon className="h-3.5 w-3.5 opacity-60 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </Row>
  );
}

function FolderRow({ label, defaultOpen = true, children }) {
  return (
    <Stack gap="xs">
      <Row
        gap="xs"
        align="center"
        className="px-2 py-1 rounded text-xs uppercase tracking-wider text-muted-foreground cursor-default hover:bg-muted/50"
      >
        <ChevronRight
          className={`h-3 w-3 opacity-60 transition-transform ${defaultOpen ? "rotate-90" : ""}`}
        />
        <span>{label}</span>
      </Row>
      {defaultOpen && <Stack gap="none">{children}</Stack>}
    </Stack>
  );
}

export default function App() {
  return (
    <AppShell
      nav="side"
      className="min-h-screen bg-background"
      style={{ "--gds-app-shell-nav": "260px" }}
    >
      {/* Sidebar — fake page tree to set the Notion-shaped context. */}
      <AppShellNav placement="side">
        <Stack gap="md" className="h-screen p-3 border-r border-border w-[260px]">
          {/* Workspace switcher */}
          <Row align="center" justify="between">
            <Row gap="xs" align="center">
              <div className="h-5 w-5 rounded bg-foreground text-background grid place-items-center font-bold text-[10px]">G</div>
              <span className="text-sm font-semibold">Gradeui HQ</span>
            </Row>
            <Button size="icon" variant="ghost" className="h-6 w-6">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </Row>

          {/* Search */}
          <Row
            gap="xs"
            align="center"
            className="px-2 py-1 rounded bg-muted/40 text-xs text-muted-foreground cursor-default"
          >
            <Search className="h-3 w-3" />
            <span>Quick find…</span>
          </Row>

          <Separator />

          {/* Page tree */}
          <FolderRow label="Favorites">
            <PageRow icon={Star} label="Roadmap Q3" />
            <PageRow icon={FileText} label="Launch week retro" active />
          </FolderRow>

          <FolderRow label="Private">
            <PageRow icon={FileText} label="Inbox" />
            <PageRow icon={Folder} label="Personal" />
            <PageRow icon={FileText} label="Reading list" indent={1} />
          </FolderRow>

          <FolderRow label="Team">
            <PageRow icon={Folder} label="Engineering" />
            <PageRow icon={FileText} label="RFCs" indent={1} />
            <PageRow icon={FileText} label="On-call rota" indent={1} />
            <PageRow icon={Folder} label="Design" />
            <PageRow icon={FileText} label="Brand guidelines" indent={1} />
          </FolderRow>
        </Stack>
      </AppShellNav>

      <AppShellMain>
        <Stack gap="none" className="h-screen">
          {/* Doc header */}
          <Toolbar size="md" className="border-b border-border px-6">
            <ToolbarSlot slot="leading">
              <Row gap="sm" align="center">
                <span className="text-sm text-muted-foreground">
                  Private / Launch week retro
                </span>
              </Row>
            </ToolbarSlot>
            <ToolbarSlot slot="trailing">
              <Row gap="xs">
                <Button variant="ghost" size="sm" className="h-7">
                  <Share2 className="h-3.5 w-3.5 mr-1" />
                  Share
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Star className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </Row>
            </ToolbarSlot>
          </Toolbar>

          {/* Document body — centered column like Notion. */}
          <Stack gap="lg" className="flex-1 overflow-y-auto px-6 py-10">
            <div className="max-w-2xl mx-auto w-full">
              <Stack gap="xl">
                {/* Page header */}
                <Stack gap="md">
                  <Row gap="sm" align="center">
                    <div className="h-9 w-9 rounded-md bg-muted grid place-items-center text-lg">
                      📝
                    </div>
                    <Badge variant="outline" className="text-[10px]">Draft</Badge>
                  </Row>
                  <h1 className="text-4xl font-bold tracking-tight">
                    Launch week retro
                  </h1>
                  <Row gap="md" align="center" className="text-xs text-muted-foreground">
                    <span>Created today</span>
                    <span>·</span>
                    <span>3 contributors</span>
                  </Row>
                </Stack>

                <Separator />

                {/* Scripted demo — Composer in readOnly mode showing
                    the toolbar in action. Loops with a 4s breath. */}
                <Stack gap="sm">
                  <Row gap="xs" align="center">
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Scripted demo — watch the toolbar
                    </span>
                  </Row>
                  <Composer
                    placeholder="Watch the formatting toolbar in action…"
                    toolbar
                    formats={[
                      "bold",
                      "italic",
                      "underline",
                      "strikethrough",
                      "code",
                      "h2",
                      "h3",
                      "blockquote",
                      "ul",
                      "ol",
                    ]}
                    steps={DOC_DEMO_SCRIPT}
                    trigger="mount"
                    speed="normal"
                    loop
                    loopDelay={4000}
                    readOnly
                    onSubmit={() => {
                      // No-op; loop replays from the start.
                    }}
                  />
                </Stack>

                {/* Editable Composer — visitor can actually try the
                    toolbar themselves. */}
                <Stack gap="sm">
                  <Row gap="xs" align="center">
                    <span className="text-xs text-muted-foreground">
                      Or write your own — fully editable below
                    </span>
                  </Row>
                  <Composer
                    placeholder="Start writing… try the toolbar above, or use markdown shortcuts."
                    toolbar
                    formats={[
                      "bold",
                      "italic",
                      "underline",
                      "strikethrough",
                      "code",
                      "h1",
                      "h2",
                      "h3",
                      "blockquote",
                      "ul",
                      "ol",
                    ]}
                    submitOnEnter={false}
                    hideSend
                    onSubmit={() => {}}
                  />
                </Stack>
              </Stack>
            </div>
          </Stack>
        </Stack>
      </AppShellMain>
    </AppShell>
  );
}

// ────────────────────────────────────────────────────────────────────
// DS gaps surfaced by this scaffold
// ────────────────────────────────────────────────────────────────────
//
// • Composer's scripted format step needs to collapse selection after
//   applying a format so subsequent type steps don't replace text.
//   Same gap surfaced in the docs page demo. High-value follow-up.
//
// • Composer needs an `autoSave` hook for document use cases — every
//   keystroke should debounce-persist. Currently the host has to wire
//   onChange + their own debounce. A built-in `autoSave={fn, debounceMs}`
//   would tighten the document/page use case dramatically.
//
// • Composer's toolbar doesn't yet expose a markdown-shortcut hint
//   (e.g. typing `##` converts to H2). Lexical supports this via the
//   markdown plugin — would round out the "feels like Notion" pitch.
//
// • <PageRow> + <FolderRow> sidebar tree — third scaffold using a
//   variation of this. <SidebarTree items={...}> would be a clean
//   primitive for it.
