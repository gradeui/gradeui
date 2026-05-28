/**
 * @label       Plane — work item detail
 * @description Plane work-item detail screen: icon rail + projects sidebar (tree of pages under ASMobbin), main detail (parent ref card, body, action row, activity timeline), and right-rail properties panel (state, assignees, priority, dates, parent, labels).
 * @tags        plane project management pm linear-clone issues work-items asana mobbin
 * @source      Mobbin: Plane — work item detail (ASMOB-8)
 * @notes       Generated 2026-05-19. Built on AppShell nav="three-pane" — rail
 *              (AppShellNav placement="side") + projects column (AppShellAside)
 *              + work item area (AppShellMain). The right properties pane is a
 *              grid column inside Main since AppShell only exposes one Aside
 *              slot. Aside width overridden via --gds-app-shell-aside so the
 *              projects column matches the source's ~245px rather than the
 *              default 320px. SidebarTreeItem handles the ASMobbin page tree.
 */
import {
  AppShell, AppShellNav, AppShellAside, AppShellMain,
  Stack, Row,
  Card,
  Button, Badge, Avatar, AvatarFallback, Separator,
  Sidebar, SidebarHeader, SidebarContent, SidebarSection, SidebarItem, SidebarTreeItem,
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
  Toolbar,
} from "@gradeui/ui";
import { useState } from "react";
import {
  Layers, Diamond, Square, Settings, HelpCircle,
  Search, Edit, Home, Inbox, User, MoreHorizontal,
  Box, Activity as ActivityIcon, Repeat, Layers as LayersIcon, Eye, FileText,
  ChevronRight, BellOff, Link as LinkIcon,
  Plus, GitBranch, Paperclip, FilePlus, SmilePlus,
  Clock, Calendar, Flag, UserCircle2, Tag, Hash,
  CheckCircle2, X,
} from "lucide-react";

export default function App() {
  const [activeView, setActiveView] = useState("work-items");

  return (
    <AppShell
      nav="three-pane"
      className="h-screen"
      // Tighten the Aside column from the default 320px to match
      // Plane's narrower projects pane. Set via the CSS var the
      // three-pane grid template reads.
      style={{ "--gds-app-shell-aside": "245px" }}
    >
      {/* ─── Icon rail ─── */}
      <AppShellNav placement="side" className="border-r border-border">
        <Stack gap="none" justify="between" align="center" className="h-full py-3 px-2 w-[60px]">
          <Stack gap="sm" align="center">
            {/* Workspace identity */}
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-foreground text-background font-bold">A</AvatarFallback>
            </Avatar>
            <RailButton icon={<Box />} label="Projects" active />
            <RailButton icon={<Diamond />} label="Wiki" />
            <RailButton icon={<Square />} label="Pi" />
          </Stack>
          <Stack gap="sm" align="center">
            <RailButton icon={<Settings />} label="Settings" muted />
            <RailButton icon={<HelpCircle />} label="Help" muted />
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-[10px] bg-emerald-200">SL</AvatarFallback>
            </Avatar>
          </Stack>
        </Stack>
      </AppShellNav>

      {/* ─── Projects sidebar (the AppShellAside slot) ─── */}
      <AppShellAside className="bg-muted/20 border-r border-border overflow-y-auto">
        <Sidebar collapsible={false} className="border-0 bg-transparent">
          <SidebarHeader>
            <Row justify="between" align="center" className="w-full px-1">
              <span className="text-sm font-semibold">Projects</span>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Square className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </Row>
          </SidebarHeader>

          <SidebarContent>
            {/* Search-with-prefix-button input */}
            <div className="px-2 pb-2">
              <Row gap="xs" align="center" className="rounded-md bg-card border border-border px-2 py-1.5">
                <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs flex-1">New work item</span>
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
              </Row>
            </div>

            <SidebarSection collapsible={false}>
              <SidebarItem asButton icon={<Home />}>Home</SidebarItem>
              <SidebarItem asButton icon={<Inbox />}>Inbox</SidebarItem>
              <SidebarItem asButton icon={<User />}>Your work</SidebarItem>
            </SidebarSection>

            <SidebarSection title="Workspace" collapsible={false}>
              <SidebarItem asButton icon={<Box />}>Projects</SidebarItem>
              <SidebarItem asButton icon={<MoreHorizontal />}>More</SidebarItem>
            </SidebarSection>

            <SidebarSection title="Projects" collapsible={false}>
              {/* ASMobbin — branch with a flat list of sub-pages.
                  Plane's tree is single-level deep, so SidebarTreeItem
                  expanded with SidebarItem children is the right shape. */}
              <SidebarTreeItem
                icon={<span aria-hidden>🐤</span>}
                label="ASMobbin"
                defaultExpanded
              >
                <SidebarItem
                  asButton
                  icon={<ActivityIcon />}
                  active={activeView === "overview"}
                  onClick={() => setActiveView("overview")}
                >
                  Overview
                </SidebarItem>
                <SidebarItem
                  asButton
                  icon={<Box />}
                  active={activeView === "work-items"}
                  onClick={() => setActiveView("work-items")}
                >
                  Work items
                </SidebarItem>
                <SidebarItem asButton icon={<Repeat />}>Cycles</SidebarItem>
                <SidebarItem asButton icon={<LayersIcon />}>Modules</SidebarItem>
                <SidebarItem asButton icon={<Eye />}>Views</SidebarItem>
                <SidebarItem asButton icon={<FileText />}>Pages</SidebarItem>
              </SidebarTreeItem>
            </SidebarSection>
          </SidebarContent>

          {/* Trial pill — sticks to the bottom of the projects pane */}
          <div className="mt-auto px-3 py-3">
            <Badge
              variant="outline"
              className="text-[11px] font-medium bg-pink-50 text-pink-700 border-pink-200"
            >
              Business trial ends in 13d
            </Badge>
          </div>
        </Sidebar>
      </AppShellAside>

      {/* ─── Main area: work item view + properties rail ─── */}
      <AppShellMain>
        <div
          className="grid h-screen"
          style={{ gridTemplateColumns: "1fr 320px" }}
        >
          {/* Work item view */}
          <Stack gap="none" className="h-screen overflow-hidden">
            <WorkItemTopBar />
            <WorkItemBody />
          </Stack>

          {/* Right-rail properties panel */}
          <PropertiesPanel />
        </div>
      </AppShellMain>
    </AppShell>
  );
}

// ────────────────────────────────────────────────────────────────────
// Icon rail button — same shape across the rail.
// ────────────────────────────────────────────────────────────────────

function RailButton({ icon, label, active, muted }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`h-9 w-9 rounded-md grid place-items-center transition-colors ${
        active
          ? "bg-muted text-foreground"
          : muted
            ? "text-muted-foreground hover:bg-muted/60"
            : "text-foreground/80 hover:bg-muted/60"
      }`}
    >
      <span className="h-4 w-4 grid place-items-center">{icon}</span>
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────
// Work item — top bar (breadcrumb + actions)
// ────────────────────────────────────────────────────────────────────

function WorkItemTopBar() {
  // <Toolbar> with leading = breadcrumb, trailing = action cluster.
  // Replaces the inline <Row justify="between"> + manual border, gets
  // the canonical auto/1fr/auto grid, role="toolbar", and consistent
  // size/padding from the DS.
  return (
    <Toolbar
      size="sm"
      aria-label="Work item actions"
      leading={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink className="cursor-pointer inline-flex items-center gap-1.5">
                <span aria-hidden>🐤</span>
                <span>ASMobbin</span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink className="cursor-pointer inline-flex items-center gap-1.5">
                <Box className="h-3.5 w-3.5" />
                <span>Work items</span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-mono text-sm">ASMOB-8</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
      trailing={
        <Row gap="xs" align="center">
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <BellOff className="h-3.5 w-3.5" />
            Unsubscribe
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <Square className="h-3.5 w-3.5" />
          </Button>
        </Row>
      }
    />
  );
}

// ────────────────────────────────────────────────────────────────────
// Work item body — parent ref + heading + description + actions + activity
// ────────────────────────────────────────────────────────────────────

function WorkItemBody() {
  return (
    <div className="flex-1 overflow-y-auto px-10 py-6">
      <Stack gap="lg" className="max-w-3xl">
        {/* Parent reference card */}
        <Card className="bg-muted/30">
          <Row justify="between" align="center" className="px-3 py-2 gap-2">
            <Row gap="sm" align="center">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
              <span className="text-xs font-mono text-muted-foreground">ASMOB-5</span>
              <span className="text-sm">4. Visualize your work 🎨</span>
            </Row>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </Row>
        </Card>

        <Stack gap="xs">
          <span className="text-xs text-muted-foreground font-mono">ASMOB-8</span>
          <h1 className="text-3xl font-bold underline decoration-foreground/60 decoration-1 underline-offset-4 w-fit">
            ASMobbin
          </h1>
        </Stack>

        <Stack gap="md">
          <p className="text-base leading-relaxed">
            This work draft has been prepared for the{" "}
            <span className="underline decoration-dotted">ASMobbin</span>{" "}
            team as an initial reference document. It outlines the key ideas,
            directions, and preliminary content that will serve as a foundation
            for further discussion, refinement, and finalization. The draft is
            subject to change and may be updated as new inputs and feedback are
            gathered.
          </p>
          <p className="text-base leading-relaxed">
            This is a work draft for the{" "}
            <span className="underline decoration-dotted">ASMobbin</span> team.
          </p>
        </Stack>

        <Row justify="between" align="center">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/50">
            <SmilePlus className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Row gap="xs" align="center" className="text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              Last edited by <span className="font-medium text-foreground">samlee.mobbin+1</span> 2 minutes ago
            </span>
            <ChevronRight className="h-3 w-3 rotate-90" />
          </Row>
        </Row>

        {/* Action buttons row */}
        <Row gap="sm" align="center" wrap>
          <ActionButton icon={<Box />} label="Add sub-work item" />
          <ActionButton icon={<GitBranch />} label="Add relation" />
          <ActionButton icon={<LinkIcon />} label="Add link" />
          <ActionButton icon={<Paperclip />} label="Attach" />
          <ActionButton icon={<FilePlus />} label="Link pages" />
        </Row>

        <Separator />

        {/* Activity timeline */}
        <Stack gap="md">
          <Row justify="between" align="center">
            <h2 className="text-base font-semibold">Activity</h2>
            <Row gap="xs">
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ActivityIcon className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                <ActivityIcon className="h-3 w-3" /> Filters
              </Button>
            </Row>
          </Row>
          <Stack gap="md">
            <ActivityItem icon={<Box />} actor="samlee.mobbin+1" verb="created the work item." ago="about 1 hour ago" />
            <ActivityItem icon={<UserCircle2 />} actor="samlee.mobbin+1" verb={<>added a new assignee <span className="font-medium text-foreground">Samlee.Mobbin+1</span>.</>} ago="about 1 hour ago" />
            <ActivityItem icon={<Hash />} actor="samlee.mobbin+1" verb={<>set the name to <span className="font-medium text-foreground">ASMobbin Work Drafts</span>.</>} ago="24 minutes ago" />
            <ActivityItem icon={<Hash />} actor="samlee.mobbin+1" verb={<>set the name to <span className="font-medium text-foreground">ASMobbin Work Draft</span>.</>} ago="25 minutes ago" />
            <ActivityItem icon={<Calendar />} actor="samlee.mobbin+1" verb={<>set the due date to <span className="font-medium text-foreground">Aug 25, 2025</span>.</>} ago="less than a minute ago" />
            <ActivityItem icon={<Calendar />} actor="samlee.mobbin+1" verb={<>set the due date to <span className="font-medium text-foreground">Aug 26, 2025</span>.</>} ago="1 minute ago" />
            <ActivityItem icon={<Calendar />} actor="samlee.mobbin+1" verb={<>set the due date to <span className="font-medium text-foreground">Aug 28, 2025</span>.</>} ago="1 minute ago" />
            <ActivityItem icon={<Hash />} actor="samlee.mobbin+1" verb={<>set the name to <span className="font-medium text-foreground">ASMobbin</span>.</>} ago="less than a minute ago" />
            <ActivityItem icon={<Hash />} actor="samlee.mobbin+1" verb={<>set the name to <span className="font-medium text-foreground">ASMobbin Work Draft</span>.</>} ago="less than a minute ago" />
          </Stack>
        </Stack>
      </Stack>
    </div>
  );
}

function ActionButton({ icon, label }) {
  return (
    <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-md text-xs">
      <span className="h-3.5 w-3.5 text-muted-foreground">{icon}</span>
      {label}
    </Button>
  );
}

function ActivityItem({ icon, actor, verb, ago }) {
  return (
    <Row gap="sm" align="start">
      <span className="h-7 w-7 rounded-full bg-muted grid place-items-center text-muted-foreground shrink-0">
        <span className="h-3.5 w-3.5 grid place-items-center">{icon}</span>
      </span>
      <Row gap="xs" align="baseline" wrap className="flex-1 text-sm">
        <span className="font-medium">{actor}</span>
        <span className="text-muted-foreground">{verb}</span>
        <span className="text-xs text-muted-foreground">{ago}</span>
      </Row>
    </Row>
  );
}

// ────────────────────────────────────────────────────────────────────
// Properties panel — right rail of the work item view
// ────────────────────────────────────────────────────────────────────

function PropertiesPanel() {
  return (
    <Stack gap="md" className="border-l border-border h-screen overflow-y-auto p-5">
      <h2 className="text-sm font-semibold">Properties</h2>
      <Stack gap="sm">
        <PropertyRow
          icon={<CheckCircle2 />}
          label="State"
          value={
            <Row gap="xs" align="center">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="text-sm">In Progress</span>
            </Row>
          }
        />
        <PropertyRow
          icon={<UserCircle2 />}
          label="Assignees"
          value={
            <Row gap="xs" align="center">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[9px] bg-emerald-200">SL</AvatarFallback>
              </Avatar>
              <span className="text-sm">samlee.mobbin+1</span>
            </Row>
          }
        />
        <PropertyRow
          icon={<Flag />}
          label="Priority"
          value={
            <Badge className="text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
              <span className="mr-1">▎▍▌</span>
              High
            </Badge>
          }
        />
        <PropertyRow
          icon={<UserCircle2 />}
          label="Created by"
          value={
            <Row gap="xs" align="center">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[9px] bg-emerald-200">SL</AvatarFallback>
              </Avatar>
              <span className="text-sm">samlee.mobbin+1</span>
            </Row>
          }
        />
        <PropertyRow
          icon={<Calendar />}
          label="Start date"
          value={<span className="text-sm">Aug 14, 2025</span>}
        />
        <PropertyRow
          icon={<Calendar />}
          label="Due date"
          value={<span className="text-sm">Aug 28, 2025</span>}
        />
        <PropertyRow
          icon={<LayersIcon />}
          label="Modules"
          value={<span className="text-sm text-muted-foreground">No module</span>}
        />
        <PropertyRow
          icon={<Repeat />}
          label="Cycle"
          value={<span className="text-sm text-muted-foreground">No cycle</span>}
        />
        <PropertyRow
          icon={<Box />}
          label="Parent"
          value={
            <Badge className="text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
              ASMOB-5
              <X className="h-3 w-3 ml-1 cursor-pointer" />
            </Badge>
          }
        />
        <PropertyRow
          icon={<Tag />}
          label="Labels"
          value={
            <Row gap="xs" align="center" wrap>
              <Badge variant="outline" className="text-xs gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                admin
                <X className="h-3 w-3 cursor-pointer" />
              </Badge>
              <button type="button" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
                <Tag className="h-3 w-3" />
                Select label
              </button>
            </Row>
          }
        />
      </Stack>
    </Stack>
  );
}

function PropertyRow({ icon, label, value }) {
  return (
    <Row gap="sm" align="center" className="min-h-[28px]">
      <Row gap="xs" align="center" className="w-32 shrink-0 text-muted-foreground text-sm">
        <span className="h-3.5 w-3.5 grid place-items-center">{icon}</span>
        <span>{label}</span>
      </Row>
      <div className="flex-1 min-w-0">{value}</div>
    </Row>
  );
}

// ────────────────────────────────────────────────────────────────────
// DS gaps surfaced by this scaffold
// ────────────────────────────────────────────────────────────────────
//
// Things this layout had to hand-roll because no Grade primitive covers
// them yet. Each entry is a candidate for a future component — when the
// next project-management / ticket-tracker layout shows up and we hand-
// roll the same pattern again, that's the signal to graduate it into
// @gradeui/ui.
//
// • <PropertyList> / <PropertyRow> — the right-rail properties panel
//   uses a uniform shape: icon + label + value, with the value being
//   a chip, date, avatar, status dot, or empty-state placeholder.
//   Recurs in EVERY ticket tracker (Linear, Jira, Asana, GitHub
//   issues) and in any "details panel" pattern (Figma properties,
//   Notion page metadata, Stripe object details). API sketch:
//   <PropertyList>
//     <PropertyRow icon={<Calendar/>} label="Due date" value="Aug 28" />
//     <PropertyRow icon={<Tag/>} label="Labels"><LabelChips ... /></PropertyRow>
//   </PropertyList>
//
// • <ActivityTimeline> / <ActivityItem> — actor avatar/icon + actor
//   name + verb + diff + timestamp. Hand-rolled here, also showed up
//   in the linear-clone curated scaffold. Two scaffolds → ship it.
//   API: <ActivityTimeline items={[{ icon, actor, verb, at }]} />.
//
// • <LinkedItemCard> — the parent-reference card at the top ("ASMOB-5
//   4. Visualize your work 🎨" + ... menu) is a uniform pattern for
//   "this thing references that thing." Every PM tool has it (parent
//   epic, related issues, blocking tickets); GitHub has it for linked
//   PRs / issues. Slot pattern with id + title + actions menu.
//
// • Right-rail panel inside Main — AppShell only exposes ONE Aside
//   slot. The properties panel here lives inside AppShellMain as a
//   1fr/320px grid because there's no AppShellAside placement="end"
//   today. Options: extend AppShellAside with `placement="start"|"end"`,
//   OR add a <DetailRail open onClose width> primitive that handles
//   the toggleable case (showed up in the Todoist Insights playground
//   too — two scaffolds is the cue).
//
// • <Sidebar.Footnote> — the "Business trial ends in 13d" pink-pill
//   is anchored to the bottom of the projects pane but isn't really
//   nav chrome (SidebarFooter's intent). A dedicated "footnote" slot
//   for trial pills, version stamps, build numbers, support links
//   would absorb the inline mt-auto positioning this scaffold uses.
//
// ─── Gaps closed by this scaffold's iteration ───
//
// • Toolbar (shipped) — the inline top-bar pattern is now <Toolbar
//   leading={...} trailing={...} /> per Apple HIG, with role="toolbar"
//   and the canonical auto/1fr/auto grid. See packages/ui/components/
//   ui/toolbar.tsx and the docs page at /components/toolbar.
//
// • SidebarSection trailing slot (shipped) — sections accept
//   `trailing={<Button>+</Button>}` for the "+ add to this group"
//   pattern that recurs in Notion / Linear / Slack. Pointer events
//   are isolated from the collapse toggle.
//
// • MultiSelect covers chip-in-input — earlier playgrounds flagged a
//   "<ChipInput>" gap (Reddit search with embedded user pill, etc.).
//   MultiSelect's trigger-with-badges-inside is the answer. The
//   remaining delta — typed text NEXT TO commit-on-enter chips — is
//   a smaller variant question, not a new primitive.
