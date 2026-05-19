import {
  AppShell, AppShellNav, AppShellMain,
  Stack, Row,
  Card, CardContent,
  Button, Badge, Avatar, AvatarFallback,
  Sidebar, SidebarHeader, SidebarContent, SidebarSection, SidebarItem,
  Sortable,
} from "@gradeui/ui";
import { useState } from "react";
import {
  Home, Inbox, Layers, Settings, Plus, MoreHorizontal,
  GripVertical, CircleDot, CircleDashed, CheckCircle2,
} from "lucide-react";

export default function App() {
  // Kanban model: every issue lives in `itemsById` (the single source
  // of truth for issue data); each column owns just an ordered array
  // of ids. Cross-column drag fires onReorder on BOTH the source and
  // destination columns — the source loses the id, the destination
  // gains it. Within-column drag fires onReorder on one column only.
  // Sortable.Group routes the drag-end event between the two cases.
  const initial = {
    todo: [
      { id: "iss-1", title: "Audit the kanban board UX",
        priority: "Medium", assignee: "AL" },
      { id: "iss-2", title: "Wire JSX validator into Studio chip",
        priority: "High", assignee: "MC" },
      { id: "iss-3", title: "Sortable.Group for cross-container",
        priority: "Low", assignee: "PB" },
    ],
    doing: [
      { id: "iss-4", title: "Ship the contracts subpath",
        priority: "Medium", assignee: "AL" },
      { id: "iss-5", title: "Sweep components for HIG aliases",
        priority: "Low", assignee: "ZC" },
    ],
    done: [
      { id: "iss-6", title: "Rename SideMenu → Sidebar",
        priority: "Medium", assignee: "AL" },
      { id: "iss-7", title: "Fix MediaSurface selection refresh",
        priority: "High", assignee: "MC" },
    ],
  };

  // Build the items-by-id map once from the initial seed. Reorders
  // never need to touch this; only the per-column id arrays change.
  const itemsById = {};
  Object.values(initial).flat().forEach((it) => { itemsById[it.id] = it; });

  const [columns, setColumns] = useState({
    todo: initial.todo.map((i) => i.id),
    doing: initial.doing.map((i) => i.id),
    done: initial.done.map((i) => i.id),
  });

  const PRIORITY_TONE = {
    High: "bg-destructive-soft text-destructive-deep border-destructive/30",
    Medium: "bg-warning-soft text-warning-deep border-warning/30",
    Low: "bg-muted text-muted-foreground border-border",
  };

  const COLUMN_META = [
    { key: "todo", title: "To do", icon: CircleDashed, tone: "text-muted-foreground" },
    { key: "doing", title: "In progress", icon: CircleDot, tone: "text-primary" },
    { key: "done", title: "Done", icon: CheckCircle2, tone: "text-success" },
  ];

  const reorder = (key) => (nextIds) =>
    setColumns((prev) => ({ ...prev, [key]: nextIds }));

  return (
    <AppShell nav="side" className="min-h-screen bg-background">
      <AppShellNav placement="side">
        <Sidebar collapsible={false}>
          <SidebarHeader>
            <Row gap="xs" align="center">
              <Layers className="h-5 w-5 text-primary" />
              <span className="text-base font-semibold">Grade</span>
            </Row>
          </SidebarHeader>
          <SidebarContent>
            <SidebarSection collapsible={false}>
              <SidebarItem asButton icon={<Inbox />}>Inbox</SidebarItem>
              <SidebarItem asButton icon={<Home />}>My issues</SidebarItem>
            </SidebarSection>
            <SidebarSection title="Workspace" collapsible={false}>
              <SidebarItem asButton icon={<Layers />} active>Sprint board</SidebarItem>
              <SidebarItem asButton icon={<Settings />}>Settings</SidebarItem>
            </SidebarSection>
          </SidebarContent>
        </Sidebar>
      </AppShellNav>

      <AppShellMain>
        <Stack gap="lg" className="p-6">
          <Row justify="between" align="center">
            <Stack gap="xs">
              <h1 className="text-2xl font-semibold">Sprint board</h1>
              <span className="text-sm text-muted-foreground">
                {Object.values(columns).reduce((n, c) => n + c.length, 0)} issues across {COLUMN_META.length} columns
              </span>
            </Stack>
            <Button>
              <Plus className="h-4 w-4 mr-1" /> New issue
            </Button>
          </Row>

          {/* The board itself — three columns wrapped in a
              <Sortable.Group> so cards can drag BETWEEN columns
              (not just within). Each column passes a stable `id`
              to its <Sortable> so the Group's drag-end routing
              can find source + destination. */}
          <Sortable.Group className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {COLUMN_META.map(({ key, title, icon: Icon, tone }) => {
              const ids = columns[key];
              const issues = ids.map((id) => itemsById[id]).filter(Boolean);
              return (
                <Card key={key} className="bg-muted/30">
                  <Stack gap="none" className="p-3">
                    <Row justify="between" align="center" className="pb-3">
                      <Row gap="sm" align="center">
                        <Icon className={`h-4 w-4 ${tone}`} />
                        <span className="text-sm font-semibold">{title}</span>
                        <Badge variant="outline" className="text-xs">
                          {issues.length}
                        </Badge>
                      </Row>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </Row>
                    <Sortable id={key} values={ids} onReorder={reorder(key)}>
                      <Stack gap="sm" className="min-h-[40px]">
                        {issues.map((issue) => (
                          <Sortable.Item key={issue.id} value={issue.id}>
                            <Card className="bg-card hover:bg-card/80 transition-colors">
                              <CardContent className="p-3">
                                <Stack gap="sm">
                                  <Row gap="xs" align="start" justify="between">
                                    <Sortable.Handle asChild>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 -ml-1 mt-[-2px] text-muted-foreground">
                                        <GripVertical className="h-3.5 w-3.5" />
                                      </Button>
                                    </Sortable.Handle>
                                    <span className="text-sm flex-1 leading-snug">
                                      {issue.title}
                                    </span>
                                  </Row>
                                  <Row justify="between" align="center" className="pt-1">
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] ${PRIORITY_TONE[issue.priority]}`}
                                    >
                                      {issue.priority}
                                    </Badge>
                                    <Avatar className="h-5 w-5">
                                      <AvatarFallback className="text-[10px]">
                                        {issue.assignee}
                                      </AvatarFallback>
                                    </Avatar>
                                  </Row>
                                </Stack>
                              </CardContent>
                            </Card>
                          </Sortable.Item>
                        ))}
                      </Stack>
                    </Sortable>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full justify-start text-muted-foreground"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add issue
                    </Button>
                  </Stack>
                </Card>
              );
            })}
          </Sortable.Group>
        </Stack>
      </AppShellMain>
    </AppShell>
  );
}
