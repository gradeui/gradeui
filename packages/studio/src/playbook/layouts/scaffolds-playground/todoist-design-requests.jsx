/**
 * @label       Todoist — Design Requests
 * @description Project kanban with left nav, three-column board, and a toggleable Insights BETA right-rail (health, at-risk, progress, completed-this-week chart, assigned bars).
 * @tags        todoist project kanban tasks productivity insights pm pipeline mobbin
 * @source      Mobbin: Todoist — Design Requests project view
 * @notes       Generated 2026-05-19 from screenshot. Uses Sortable.Group for cross-
 *              column drag and recharts for the sparkline + weekly bar chart. The
 *              Insights right-rail is toggleable via the Insights button in the top
 *              bar (state lives at the App root). Todoist's brand red is used for
 *              the primary Add-task button and the destructive accent on the
 *              critical-health card — kept as raw colour classes to match fidelity.
 *              Avatar gradients on the Assigned card are a faithful approximation,
 *              not a real metric.
 */
import {
  AppShell, AppShellNav, AppShellMain,
  Stack, Row,
  Card, CardContent,
  Button, Badge, Avatar, AvatarFallback, Input, Progress, Separator,
  Sidebar, SidebarHeader, SidebarContent, SidebarSection, SidebarItem, SidebarTreeItem,
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator,
  Sortable,
} from "@gradeui/ui";
import { useState } from "react";
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer } from "recharts";
import {
  Plus, Bell, PanelLeftClose, Search, Inbox, Calendar, ChevronUp,
  Tag, CheckCircle2, FolderClosed, Lock, Hash, FolderSearch, HelpCircle,
  Share2, Columns3, Zap, MoreHorizontal, MessageSquare, MapPin,
  Repeat, Clock, Users, X, AlertTriangle, TrendingUp, ArrowUpRight,
  CircleDashed, Circle,
} from "lucide-react";

// Brand accent — Todoist red. Kept as a raw hex so the playground card
// matches the screenshot faithfully even when the user rotates Grade's
// theme picker.
const BRAND = "#dc4c3e";

export default function App() {
  // Project state — three columns of tasks, each task has a title +
  // optional metadata (description, due, tag, assignee, comments).
  // Selected task drives the "current" state for the At-risk callout
  // (Make new visuals… is selected/highlighted in the source).
  const itemsById = {
    "t-1": { id: "t-1", title: "Send a redesign proposal", subtasks: "0/1", due: "Today 17:00", repeats: true, comments: 2, hasLocation: true, assignee: "SL" },
    "t-2": { id: "t-2", title: "Speed improvements" },
    "t-3": { id: "t-3", title: "Make new visuals for social pages", description: "Design and produce new visu…", due: "Saturday", date: "21 Feb", tag: "design-request", urgent: true },
    "t-4": { id: "t-4", title: "Better navigation with sidebar", assignee: "AS" },
    "t-5": { id: "t-5", title: "New onboarding flow", assignee: "SL" },
    "t-6": { id: "t-6", title: "Drag-and-drop reordering" },
  };

  const [columns, setColumns] = useState({
    todo: ["t-1", "t-2"],
    week: ["t-3", "t-4", "t-5"],
    review: ["t-6"],
  });

  const [selectedId, setSelectedId] = useState("t-3");
  const [insightsOpen, setInsightsOpen] = useState(true);

  const COLUMNS = [
    { key: "todo", title: "To Do" },
    { key: "week", title: "This Week" },
    { key: "review", title: "Review" },
  ];

  const reorder = (key) => (nextIds) =>
    setColumns((prev) => ({ ...prev, [key]: nextIds }));

  // Sparkline data for the Health card — synthetic trend going from
  // healthy → critical to match the curve shape in the source.
  const health = [
    { v: 30 }, { v: 38 }, { v: 35 }, { v: 50 }, { v: 62 },
    { v: 58 }, { v: 75 }, { v: 88 }, { v: 82 }, { v: 95 },
  ];

  // Weekly completion — Tuesday=2, Thursday=4 matches the source bars.
  const completedWeek = [
    { day: "M", v: 0 }, { day: "T", v: 0 }, { day: "W", v: 2 },
    { day: "T", v: 4 }, { day: "F", v: 0 }, { day: "S", v: 0 }, { day: "S", v: 0 },
  ];

  return (
    <AppShell nav="side" className="min-h-screen bg-background">
      <AppShellNav placement="side">
        <Sidebar collapsible={false} className="bg-muted/30">
          <SidebarHeader>
            <Row justify="between" align="center" className="w-full">
              <Row gap="sm" align="center">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px]">SL</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">Samlee</span>
                <ChevronUp className="h-3 w-3 text-muted-foreground rotate-180" />
              </Row>
              <Row gap="xs" align="center">
                <Button variant="ghost" size="icon" className="h-7 w-7 relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-orange-500" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </Row>
            </Row>
          </SidebarHeader>

          <SidebarContent>
            {/* Big Add-task CTA — Todoist's most distinctive nav element.
                Brand red, full width, bold. */}
            <div className="px-2 pt-1">
              <Button
                className="w-full justify-start gap-2 text-white hover:opacity-90"
                style={{ backgroundColor: BRAND }}
              >
                <Plus className="h-4 w-4" /> Add task
                <Zap className="h-3.5 w-3.5 ml-auto opacity-80" />
              </Button>
            </div>

            <SidebarSection collapsible={false}>
              <SidebarItem asButton icon={<Search />}>Search</SidebarItem>
              <SidebarItem asButton icon={<Inbox />} badge="1">Inbox</SidebarItem>
              <SidebarItem asButton icon={<Calendar />} badge="3">Today</SidebarItem>
              <SidebarItem asButton icon={<Calendar />}>Upcoming</SidebarItem>
              <SidebarItem asButton icon={<Tag />}>Filters &amp; Labels</SidebarItem>
              <SidebarItem asButton icon={<CheckCircle2 />}>Completed</SidebarItem>
            </SidebarSection>

            <SidebarSection title="My Projects" collapsible={false}>
              <SidebarItem asButton icon={<div className="h-4 w-4 rounded bg-foreground text-background text-[8px] font-bold flex items-center justify-center">SL</div>}>
                SLMobbin
              </SidebarItem>
              <SidebarItem asButton icon={<Hash />}>
                <span className="flex-1 truncate">Team Setup Guide</span>
                <Lock className="h-3 w-3 ml-1 text-muted-foreground shrink-0" />
              </SidebarItem>
              {/* Design Team — tree branch with one active child */}
              <SidebarTreeItem
                icon={<FolderClosed className="h-4 w-4" />}
                label="Design Team"
                defaultExpanded
              >
                <SidebarItem
                  asButton
                  icon={<Hash className="text-purple-500" />}
                  badge="7"
                  active
                >
                  Design Requests
                </SidebarItem>
              </SidebarTreeItem>
              <SidebarItem asButton icon={<FolderSearch />}>Browse all projects</SidebarItem>
            </SidebarSection>
          </SidebarContent>

          <div className="mt-auto px-2 py-3">
            <SidebarItem asButton icon={<HelpCircle />} className="text-muted-foreground">
              Help &amp; resources
            </SidebarItem>
          </div>
        </Sidebar>
      </AppShellNav>

      <AppShellMain>
        {/* Top bar — breadcrumb + page header on the left, share/insights
            actions on the right. The Insights button toggles the right
            rail; when off, the kanban gets the full width. */}
        <div
          className="grid h-screen"
          style={{ gridTemplateColumns: insightsOpen ? "1fr 360px" : "1fr" }}
        >
          {/* Centre column — header bar + kanban */}
          <Stack gap="none" className="h-screen overflow-hidden">
            <Row justify="between" align="center" className="px-8 py-3 border-b border-border">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink className="cursor-pointer text-xs text-muted-foreground">SLMobbin</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink className="cursor-pointer text-xs text-muted-foreground">Design Team</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </BreadcrumbList>
              </Breadcrumb>
              <Row gap="xs" align="center">
                <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                  <Users className="h-3.5 w-3.5" /> Share
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Columns3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={insightsOpen ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => setInsightsOpen((v) => !v)}
                >
                  <Zap className="h-3.5 w-3.5" /> Insights
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </Row>
            </Row>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              <h1 className="text-2xl font-bold mb-6">Design Requests</h1>

              {/* Kanban — Sortable.Group for cross-column drag. Three
                  columns; the source has small counts beside each title. */}
              <Sortable.Group className="grid grid-cols-3 gap-5 items-start">
                {COLUMNS.map(({ key, title }) => {
                  const ids = columns[key];
                  const items = ids.map((id) => itemsById[id]).filter(Boolean);
                  return (
                    <Stack gap="sm" key={key}>
                      <Row justify="between" align="center" className="px-1">
                        <Row gap="xs" align="baseline">
                          <span className="text-sm font-semibold">{title}</span>
                          <span className="text-sm text-muted-foreground">{items.length}</span>
                        </Row>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </Row>
                      <Sortable id={key} values={ids} onReorder={reorder(key)}>
                        <Stack gap="sm" className="min-h-[40px]">
                          {items.map((task) => (
                            <Sortable.Item key={task.id} value={task.id}>
                              <TaskCard
                                task={task}
                                selected={task.id === selectedId}
                                onSelect={() => setSelectedId(task.id)}
                              />
                            </Sortable.Item>
                          ))}
                        </Stack>
                      </Sortable>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start text-muted-foreground hover:text-foreground"
                        style={{ "--brand": BRAND }}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" style={{ color: BRAND }} />
                        Add task
                      </Button>
                    </Stack>
                  );
                })}
              </Sortable.Group>
            </div>
          </Stack>

          {insightsOpen && (
            <InsightsPanel
              onClose={() => setInsightsOpen(false)}
              health={health}
              completedWeek={completedWeek}
            />
          )}
        </div>
      </AppShellMain>
    </AppShell>
  );
}

// ────────────────────────────────────────────────────────────────────
// Task card
// ────────────────────────────────────────────────────────────────────

function TaskCard({ task, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="text-left"
    >
      <Card className={`bg-card transition-shadow hover:shadow-sm ${selected ? "ring-1 ring-border" : ""}`}>
        <CardContent className="p-3">
          <Stack gap="xs">
            <Row gap="sm" align="start">
              {/* Circle status — empty by default, red ring for the
                  selected/urgent task to match the source. */}
              {selected || task.urgent ? (
                <Circle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: BRAND }} />
              ) : (
                <CircleDashed className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              )}
              <Stack gap="xs" className="flex-1 min-w-0">
                <span className="text-sm leading-snug">{task.title}</span>
                {task.description && (
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {task.description}
                  </span>
                )}
              </Stack>
              {task.assignee && !task.urgent && (
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarFallback className="text-[9px] bg-sky-500 text-white">
                    {task.assignee}
                  </AvatarFallback>
                </Avatar>
              )}
            </Row>
            {(task.subtasks || task.due || task.repeats || task.comments || task.hasLocation || task.tag || task.date) && (
              <Row gap="sm" align="center" wrap className="text-[11px] text-muted-foreground pl-6">
                {task.subtasks && (
                  <Row gap="xs" align="center">
                    <Circle className="h-2.5 w-2.5" />
                    <span>{task.subtasks}</span>
                  </Row>
                )}
                {task.due && !task.date && (
                  <Row gap="xs" align="center" className="text-emerald-600">
                    <Calendar className="h-3 w-3" />
                    <span>{task.due}</span>
                  </Row>
                )}
                {task.repeats && <Repeat className="h-3 w-3" />}
                {task.comments && (
                  <Row gap="xs" align="center">
                    <Clock className="h-3 w-3" />
                    <span>{task.comments}</span>
                  </Row>
                )}
                {task.hasLocation && <MapPin className="h-3 w-3" />}
                {task.date && (
                  <Row gap="xs" align="center" className="text-purple-600">
                    <Calendar className="h-3 w-3" />
                    <span className="font-medium">{task.due}</span>
                    <Clock className="h-3 w-3 ml-1 text-emerald-600" />
                    <span className="text-emerald-600">{task.date}</span>
                  </Row>
                )}
                {task.tag && (
                  <Badge variant="outline" className="text-[10px] gap-1 font-normal px-1.5 py-0">
                    <Tag className="h-2.5 w-2.5" /> {task.tag}
                  </Badge>
                )}
              </Row>
            )}
          </Stack>
        </CardContent>
      </Card>
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────
// Insights right-rail
// ────────────────────────────────────────────────────────────────────

function InsightsPanel({ onClose, health, completedWeek }) {
  return (
    <Stack gap="md" className="h-screen overflow-y-auto border-l border-border bg-muted/20 p-4">
      <Row justify="between" align="center">
        <Row gap="sm" align="center">
          <h2 className="text-base font-semibold">Insights</h2>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">Beta</Badge>
        </Row>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </Row>

      {/* Health */}
      <Card className="bg-card">
        <CardContent className="p-4">
          <Stack gap="sm">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Health</span>
            <Row gap="xs" align="center">
              <Circle className="h-3.5 w-3.5 fill-current" style={{ color: BRAND }} />
              <span className="text-base font-semibold">Critical</span>
            </Row>
            <div className="h-12 -mx-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={health} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                  <defs>
                    <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={BRAND} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke={BRAND} strokeWidth={1.5} fill="url(#healthGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This project is in critical condition with no tasks completed and one
              overdue P1 item. Recent activity shows a surge in new requests,
              indicating potential scope creep without corresponding progress.
              Urgent focus is needed to address overdue items and manage incoming
              requests.
            </p>
            <Separator />
            <Row gap="xs" align="center" className="text-[11px] text-muted-foreground">
              <Repeat className="h-3 w-3" />
              <span>Updated 15 hours ago</span>
            </Row>
          </Stack>
        </CardContent>
      </Card>

      {/* At risk */}
      <Card className="bg-card">
        <CardContent className="p-4">
          <Stack gap="sm">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">At risk</span>
            <Row gap="xs" align="center">
              <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-sm font-medium">1 task</span>
            </Row>
            <Row gap="sm" align="center" className="pl-1">
              <Circle className="h-3.5 w-3.5 shrink-0" style={{ color: BRAND }} />
              <span className="text-sm">Make new visuals for social pages</span>
            </Row>
          </Stack>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card className="bg-card">
        <CardContent className="p-4">
          <Stack gap="sm">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Progress</span>
            <Row gap="xs" align="center">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span className="text-base font-semibold">46%</span>
            </Row>
            <Progress value={46} className="h-1.5" />
            <Row justify="between" className="text-[10px] text-muted-foreground tabular-nums">
              <span>00</span><span>25</span><span>50</span><span>75</span>
            </Row>
            <Row gap="md" align="center" className="text-xs">
              <Row gap="xs" align="center">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                <span>6 completed</span>
              </Row>
              <Row gap="xs" align="center">
                <CircleDashed className="h-3 w-3 text-muted-foreground" />
                <span>7 active</span>
              </Row>
            </Row>
          </Stack>
        </CardContent>
      </Card>

      {/* Completed this week */}
      <Card className="bg-card">
        <CardContent className="p-4">
          <Stack gap="sm">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Completed</span>
            <Row gap="xs" align="center">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span className="text-sm">This week: <span className="font-semibold">6</span></span>
            </Row>
            <div className="h-20 -mx-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completedWeek} margin={{ top: 12, right: 4, left: 4, bottom: 0 }}>
                  <Bar dataKey="v" fill={BRAND} radius={[2, 2, 0, 0]} maxBarSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Row justify="between" className="text-[10px] text-muted-foreground tabular-nums px-1 -mt-1">
              {completedWeek.map((d, i) => (
                <span key={i}>{d.day}</span>
              ))}
            </Row>
          </Stack>
        </CardContent>
      </Card>

      {/* Assigned */}
      <Card className="bg-card">
        <CardContent className="p-4">
          <Stack gap="sm">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assigned</span>
            <Row gap="xs" align="center">
              <Users className="h-3.5 w-3.5" />
              <span className="text-sm">2 people</span>
            </Row>
            <Stack gap="sm">
              <Row gap="sm" align="center">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[9px]">SL</AvatarFallback>
                </Avatar>
                <div
                  className="h-1.5 rounded-full flex-1"
                  style={{
                    background: "linear-gradient(90deg, #2563eb 0%, #16a34a 25%, #facc15 50%, #f97316 75%, #dc2626 100%)",
                    maxWidth: "85%",
                  }}
                />
                <span className="text-xs tabular-nums w-4 text-right">2</span>
              </Row>
              <Row gap="sm" align="center">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[9px] bg-sky-500 text-white">AS</AvatarFallback>
                </Avatar>
                <div
                  className="h-1.5 rounded-full flex-1"
                  style={{
                    background: "linear-gradient(90deg, #2563eb 0%, #16a34a 25%, #facc15 50%, #f97316 75%, #dc2626 100%)",
                    maxWidth: "55%",
                  }}
                />
                <span className="text-xs tabular-nums w-4 text-right">1</span>
              </Row>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

// ────────────────────────────────────────────────────────────────────
// DS gaps surfaced by this scaffold
// ────────────────────────────────────────────────────────────────────
//
// Things this layout had to hand-roll because no Grade primitive covers
// them yet. Each entry is a candidate for a future component — when the
// next dashboard / kanban / insights layout shows up and we hand-roll
// the same pattern again, that's the signal to graduate it into
// @gradeui/ui.
//
// • <Sparkline> — raw recharts AreaChart inside the Health card needs
//   a defs/linearGradient, margin tuning, and no axes. A theme-aware
//   <Sparkline data={...} tone="danger|warning|success" /> would
//   absorb the boilerplate AND let the brand colour come from CSS vars
//   instead of a hardcoded hex.
//
// • <StatCard> / <InsightCard> — every Insights card shares the same
//   shape: uppercase-muted label + headline value + chart-or-list +
//   optional meta footer. Health, At-risk, Progress, Completed, and
//   Assigned all follow it. <StatCard label="Progress" value="46%"
//   trend={<ArrowUpRight/>}>{chart}<StatCard.Footer>...</StatCard.Footer>
//   </StatCard> would standardise it.
//
// • <TaskCard> primitive — the kanban card composition (status circle
//   + title + description + meta row of subtasks / due / comments /
//   tag chips / assignee avatar) is the same pattern every project-
//   management layout reaches for. The kanban-board reference scaffold
//   hand-rolls a thinner version; consolidate when the third layout
//   asks for it.
//
// • Toggleable right-rail panel — Insights opens / closes via a
//   button in the top bar; the grid template-columns swaps between
//   "1fr 360px" and "1fr". This pattern recurs in Linear (issue
//   detail rail), Notion (page comments rail), Figma (properties).
//   A <DetailRail open={...} onClose={...} width={360}> primitive
//   with a built-in slide-in/out transition would cover all of them.
//
// • Brand-coloured Add-task pill — the big red "Add task" CTA needs
//   to opt out of theme rotation. Currently uses inline style with
//   a hex constant. A <Button variant="brand" brandColor={...}> or
//   theme-token override mechanism would make this declarative.
