import {
  AppShell, AppShellNav, AppShellMain,
  Stack, Row,
  Card,
  Button, Badge, Avatar, AvatarFallback,
  Separator, Input,
  Sidebar, SidebarHeader, SidebarContent, SidebarSection, SidebarItem,
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuCheckboxItem,
  Sortable,
  // New primitives that retired the inline comment-row + Tiptap composer.
  Message, ComposerReply,
} from "@gradeui/ui";
import { useState, useMemo } from "react";
import {
  Inbox, ListFilter, CircleDashed, CircleDot, CheckCircle2,
  CircleAlert, GripVertical, Plus, Search,
  AtSign, Settings,
} from "lucide-react";

// Tone palette for comment avatars — keyed by author initials so the
// same person gets the same colour across the activity feed.
const AVATAR_TONES = { MA: "violet", AL: "amber", JE: "emerald", SA: "sky" };
const toneFor = (initials) => AVATAR_TONES[initials] || "muted";

export default function App() {
  // Issue model — Linear-ish minimal shape: id + title + status +
  // priority + assignee + a tiny activity feed (latest comment).
  // The detail pane on the right opens for the currently-selected
  // issue and includes a TipTap comment composer.
  const initialIssues = [
    {
      id: "GDS-101", title: "Wire JSX validator into the Studio chip",
      status: "in-progress", priority: "high", assignee: "AL",
      project: "Studio",
      comments: [
        { id: "c1", author: "Marcus", at: "2h ago",
          body: "Logging works, surfacing into the message metadata next." },
      ],
    },
    {
      id: "GDS-102", title: "Sortable.Group — cross-container kanban",
      status: "todo", priority: "medium", assignee: "AL",
      project: "DS", comments: [],
    },
    {
      id: "GDS-103", title: "Notion-clone scaffold v1",
      status: "todo", priority: "medium", assignee: "MC",
      project: "Playbook", comments: [],
    },
    {
      id: "GDS-104", title: "Sweep components for HIG aliases",
      status: "done", priority: "low", assignee: "ZC",
      project: "DS",
      comments: [
        { id: "c2", author: "Priya", at: "1d ago",
          body: "All 41 sidecars updated. RN coverage too." },
      ],
    },
    {
      id: "GDS-105", title: "Rebrand Alert → Callout",
      status: "done", priority: "medium", assignee: "AL",
      project: "DS", comments: [],
    },
  ];

  const [issues, setIssues] = useState(initialIssues);
  // Live filter state — query is a substring match against id+title,
  // statusFilter is a Set so the dropdown can multi-select. Empty set
  // means "all statuses". We derive `visibleIssues` from these.
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => new Set());
  const [selectedId, setSelectedId] = useState(initialIssues[0].id);

  const STATUS = {
    "todo": { label: "Todo", icon: CircleDashed, tone: "text-muted-foreground" },
    "in-progress": { label: "In Progress", icon: CircleDot, tone: "text-primary" },
    "done": { label: "Done", icon: CheckCircle2, tone: "text-success" },
  };
  const PRIORITY = {
    high: { label: "High", tone: "bg-destructive-soft text-destructive-deep border-destructive/30" },
    medium: { label: "Medium", tone: "bg-warning-soft text-warning-deep border-warning/30" },
    low: { label: "Low", tone: "bg-muted text-muted-foreground border-border" },
  };

  // Filter pipeline: status set (empty = all) → query substring match.
  // Memoised so dragging within the list doesn't re-filter on every
  // pointermove (Sortable.onReorder rewrites `issues`).
  const visibleIssues = useMemo(() => {
    const q = query.trim().toLowerCase();
    return issues.filter((i) => {
      if (statusFilter.size > 0 && !statusFilter.has(i.status)) return false;
      if (!q) return true;
      return (
        i.title.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q)
      );
    });
  }, [issues, query, statusFilter]);

  const selected = issues.find((i) => i.id === selectedId);

  const toggleStatus = (key) =>
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // Mention items for the comment composer. Real Linear pulls these
  // from workspace membership; we hard-code a few to demo the typeahead.
  const teamMembers = [
    { id: "u1", value: "marcus" },
    { id: "u2", value: "alex" },
    { id: "u3", value: "jess" },
    { id: "u4", value: "sara" },
  ];

  // Reorder operates on the FULL issues list (not the filtered view).
  // Sortable still receives the filtered ids so visible rows are the
  // ones that move; we splice them back into the unfiltered order.
  const visibleIds = visibleIssues.map((i) => i.id);
  const reorderVisible = (nextVisibleIds) => {
    setIssues((prev) => {
      const visibleSet = new Set(visibleIds);
      const queue = [...nextVisibleIds];
      // Walk the original order; wherever we encounter a visible id,
      // replace it with the next id from the reordered queue.
      return prev.map((it) => {
        if (!visibleSet.has(it.id)) return it;
        const nextId = queue.shift();
        return prev.find((p) => p.id === nextId) || it;
      });
    });
  };

  return (
    <AppShell nav="side" className="min-h-screen bg-background">
      <AppShellNav placement="side">
        <Sidebar collapsible={false}>
          <SidebarHeader>
            <Row gap="xs" align="center" className="flex-1">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px]">G</AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold">Grade</span>
              <Badge variant="outline" className="ml-auto text-[10px]">Beta</Badge>
            </Row>
          </SidebarHeader>
          <SidebarContent>
            <SidebarSection collapsible={false}>
              <SidebarItem asButton icon={<Inbox />}>Inbox</SidebarItem>
              <SidebarItem asButton icon={<CircleDot />} active>My issues</SidebarItem>
              <SidebarItem asButton icon={<AtSign />} badge="3">Mentions</SidebarItem>
            </SidebarSection>
            <SidebarSection title="Workspace">
              <SidebarItem asButton icon={<CircleDashed />}>Backlog</SidebarItem>
              <SidebarItem asButton icon={<CircleDot />}>Active</SidebarItem>
              <SidebarItem asButton icon={<CheckCircle2 />}>Done</SidebarItem>
            </SidebarSection>
            <SidebarSection title="Projects">
              <SidebarItem asButton>Studio</SidebarItem>
              <SidebarItem asButton>DS</SidebarItem>
              <SidebarItem asButton>Playbook</SidebarItem>
            </SidebarSection>
          </SidebarContent>
        </Sidebar>
      </AppShellNav>

      <AppShellMain>
        <div className="grid h-screen" style={{ gridTemplateColumns: "1fr 440px" }}>
          {/* Left: issue list */}
          <Stack gap="none" className="border-r border-border h-screen overflow-hidden">
            <Row justify="between" align="center" className="px-4 py-3 border-b border-border">
              <Row gap="sm" align="center">
                <h1 className="text-base font-semibold">My issues</h1>
                <Badge variant="outline" className="text-xs">
                  {visibleIssues.length}
                  {visibleIssues.length !== issues.length && ` / ${issues.length}`}
                </Badge>
              </Row>
              <Row gap="xs" align="center">
                {/* Status filter — DropdownMenuCheckboxItem lets the
                    user multi-select; empty selection means "show all". */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={statusFilter.size > 0 ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7"
                    >
                      <ListFilter className="h-3.5 w-3.5 mr-1" />
                      Filter
                      {statusFilter.size > 0 && (
                        <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                          {statusFilter.size}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuLabel>Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {Object.entries(STATUS).map(([key, meta]) => (
                      <DropdownMenuCheckboxItem
                        key={key}
                        checked={statusFilter.has(key)}
                        onCheckedChange={() => toggleStatus(key)}
                      >
                        <meta.icon className={`h-3.5 w-3.5 mr-2 ${meta.tone}`} />
                        {meta.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5 mr-1" /> New
                </Button>
              </Row>
            </Row>
            {/* Search — controlled input bound to `query`; the
                visibleIssues memo re-derives on every keystroke. */}
            <div className="px-4 py-2 border-b border-border">
              <Row gap="sm" align="center" className="bg-muted/50 rounded-md px-2 py-1.5">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search issues by title or id…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="border-0 bg-transparent h-auto p-0 text-sm focus-visible:ring-0"
                />
              </Row>
            </div>
            <div className="flex-1 overflow-y-auto">
              {visibleIssues.length === 0 ? (
                <Stack gap="sm" align="center" className="py-12 text-center">
                  <Search className="h-6 w-6 text-muted-foreground/50" />
                  <span className="text-sm text-muted-foreground">No issues match</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setQuery(""); setStatusFilter(new Set()); }}
                  >
                    Clear filters
                  </Button>
                </Stack>
              ) : (
                <Sortable values={visibleIds} onReorder={reorderVisible}>
                  <Stack gap="none">
                    {visibleIssues.map((issue) => {
                      const StatusIcon = STATUS[issue.status].icon;
                      return (
                        <Sortable.Item key={issue.id} value={issue.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedId(issue.id)}
                            className={`group w-full text-left px-4 py-2.5 border-b border-border hover:bg-muted/40 transition-colors ${
                              issue.id === selectedId ? "bg-muted/60" : ""
                            }`}
                          >
                            <Row gap="sm" align="center">
                              <Sortable.Handle asChild>
                                <span className="opacity-0 group-hover:opacity-60 cursor-grab">
                                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                                </span>
                              </Sortable.Handle>
                              <StatusIcon className={`h-3.5 w-3.5 shrink-0 ${STATUS[issue.status].tone}`} />
                              <span className="text-xs text-muted-foreground font-mono shrink-0">
                                {issue.id}
                              </span>
                              <span className="text-sm flex-1 truncate">{issue.title}</span>
                              <Badge variant="outline" className={`text-[10px] shrink-0 ${PRIORITY[issue.priority].tone}`}>
                                {PRIORITY[issue.priority].label}
                              </Badge>
                              <Avatar className="h-5 w-5 shrink-0">
                                <AvatarFallback className="text-[10px]">
                                  {issue.assignee}
                                </AvatarFallback>
                              </Avatar>
                            </Row>
                          </button>
                        </Sortable.Item>
                      );
                    })}
                  </Stack>
                </Sortable>
              )}
            </div>
          </Stack>

          {/* Right: detail pane with TipTap comment composer */}
          {selected && (
            <Stack gap="none" className="h-screen overflow-hidden bg-card">
              {/* Detail-pane breadcrumb — DS Breadcrumb component instead
                  of an inline Row + ChevronRight. Final crumb is the
                  non-clickable BreadcrumbPage (current issue id). */}
              <Row justify="between" align="center" className="px-5 py-3 border-b border-border">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink className="cursor-pointer">{selected.project}</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="font-mono">{selected.id}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              </Row>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                <h2 className="text-xl font-semibold leading-snug">{selected.title}</h2>

                <Card className="bg-muted/30 border-border">
                  <Stack gap="sm" className="p-3 text-xs">
                    <Row justify="between">
                      <span className="text-muted-foreground">Status</span>
                      <Row gap="xs" align="center">
                        {(() => {
                          const Icon = STATUS[selected.status].icon;
                          return <Icon className={`h-3.5 w-3.5 ${STATUS[selected.status].tone}`} />;
                        })()}
                        <span>{STATUS[selected.status].label}</span>
                      </Row>
                    </Row>
                    <Row justify="between">
                      <span className="text-muted-foreground">Priority</span>
                      <Badge variant="outline" className={`text-[10px] ${PRIORITY[selected.priority].tone}`}>
                        {PRIORITY[selected.priority].label}
                      </Badge>
                    </Row>
                    <Row justify="between">
                      <span className="text-muted-foreground">Assignee</span>
                      <Row gap="xs" align="center">
                        <Avatar className="h-4 w-4">
                          <AvatarFallback className="text-[9px]">{selected.assignee}</AvatarFallback>
                        </Avatar>
                        <span>{selected.assignee}</span>
                      </Row>
                    </Row>
                  </Stack>
                </Card>

                <Separator />

                {/* Activity feed — existing comments + TipTap composer */}
                <Stack gap="md">
                  <Row gap="xs" align="center">
                    <CircleAlert className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Activity
                    </span>
                  </Row>
                  {selected.comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No comments yet.</p>
                  ) : (
                    selected.comments.map((c) => {
                      const initials = c.author.slice(0, 2).toUpperCase();
                      return (
                        <Message
                          key={c.id}
                          author={c.author}
                          timestamp={c.at}
                          avatar={
                            <Avatar size="sm">
                              <AvatarFallback tone={toneFor(initials)}>
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                          }
                        >
                          {c.body}
                        </Message>
                      );
                    })
                  )}
                </Stack>
              </div>

              {/* Comment composer — ComposerReply preset wraps Composer
                  with reply-friendly defaults (no toolbar, no attach,
                  multi-line by default). Mention trigger wired to the
                  team member list. */}
              <div className="border-t border-border bg-card p-3">
                <ComposerReply
                  placeholder="Leave a comment… use @ to mention"
                  triggers={[{ char: "@", items: teamMembers }]}
                  onSubmit={(content) => {
                    // In a real Linear, this would POST the comment +
                    // append it locally. The scaffold just demos the
                    // surface, no persistence.
                    console.log("comment submitted:", content.text);
                  }}
                />
              </div>
            </Stack>
          )}
        </div>
      </AppShellMain>
    </AppShell>
  );
}
