import {
  AppShell, AppShellNav, AppShellMain,
  Stack, Row,
  Button, Avatar, AvatarFallback, Separator, Input,
  Sidebar, SidebarHeader, SidebarContent, SidebarSection, SidebarItem, SidebarTreeItem,
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
  // Lexical-backed editor + Message replaced the Tiptap composer and
  // the inline "comment row" pattern this scaffold used to ship with.
  Composer, Message,
} from "@gradeui/ui";
import { useState } from "react";
import {
  Plus, Search, Hash, FileText, ChevronRight,
  Settings, Star, Trash2, Share2, MoreHorizontal, Sparkles,
  Folder, MessageSquare,
} from "lucide-react";

export default function App() {
  // Page tree — a flat structure of nodes the SidebarTreeItem
  // composition will render recursively. Each node has an id, an
  // emoji + title, and (optionally) child page ids. State for
  // "currently-selected page" lives at the app root so the main
  // pane reacts.
  const pages = {
    "p-home": { id: "p-home", emoji: "🏠", title: "Home", children: [] },
    "p-workspace": { id: "p-workspace", emoji: "🗂", title: "Workspace",
      children: ["p-projects", "p-meetings", "p-okrs"] },
    "p-projects": { id: "p-projects", emoji: "📌", title: "Projects",
      children: ["p-grade-ds", "p-studio"] },
    "p-grade-ds": { id: "p-grade-ds", emoji: "🟢", title: "Grade DS roadmap", children: [] },
    "p-studio": { id: "p-studio", emoji: "🎨", title: "Studio playbook", children: [] },
    "p-meetings": { id: "p-meetings", emoji: "📅", title: "Meeting notes", children: [] },
    "p-okrs": { id: "p-okrs", emoji: "🎯", title: "OKRs Q3", children: [] },
    "p-personal": { id: "p-personal", emoji: "👤", title: "Personal",
      children: ["p-reading", "p-recipes"] },
    "p-reading": { id: "p-reading", emoji: "📚", title: "Reading list", children: [] },
    "p-recipes": { id: "p-recipes", emoji: "🍳", title: "Recipes", children: [] },
  };
  const roots = ["p-home", "p-workspace", "p-personal"];

  const [selectedId, setSelectedId] = useState("p-grade-ds");

  // Recursive renderer — leaf pages get <SidebarItem>, branch pages
  // get <SidebarTreeItem> with children rendered inside. The Tree
  // primitive handles the chevron + auto-indent via context, so we
  // don't pass `depth` ourselves.
  const renderNode = (id) => {
    const node = pages[id];
    if (!node) return null;
    const hasChildren = node.children.length > 0;
    if (hasChildren) {
      return (
        <SidebarTreeItem
          key={id}
          icon={<span aria-hidden>{node.emoji}</span>}
          label={node.title}
          defaultExpanded={id === "p-workspace" || id === "p-projects"}
          active={selectedId === id}
          onClick={() => setSelectedId(id)}
        >
          {node.children.map(renderNode)}
        </SidebarTreeItem>
      );
    }
    return (
      <SidebarItem
        key={id}
        asButton
        icon={<span aria-hidden>{node.emoji}</span>}
        active={selectedId === id}
        onClick={() => setSelectedId(id)}
      >
        {node.title}
      </SidebarItem>
    );
  };

  // Walk from a leaf back to its root via parent inference (which
  // node lists this id as a child). Cheap on a small tree; replace
  // with an explicit parent map if it grows.
  const ancestors = (id) => {
    const chain = [];
    let current = id;
    while (current) {
      const node = pages[current];
      if (!node) break;
      chain.unshift(node);
      const parentEntry = Object.values(pages).find((p) =>
        p.children.includes(current),
      );
      current = parentEntry ? parentEntry.id : null;
    }
    return chain;
  };
  const breadcrumb = ancestors(selectedId);
  const current = breadcrumb[breadcrumb.length - 1];

  // Slash commands the Composer surfaces when the user types "/".
  // Hard-coded for the demo; real Notion pulls these from a command
  // registry.
  const slashCommands = [
    { id: "cmd1", value: "heading" },
    { id: "cmd2", value: "todo" },
    { id: "cmd3", value: "image" },
    { id: "cmd4", value: "table" },
    { id: "cmd5", value: "code" },
  ];

  // Pre-baked comments on the page (Notion-style page comments shown
  // in the footer). Rendered via <Message>.
  const pageComments = [
    {
      id: "pc1", author: "Marcus", initials: "MA", tone: "violet",
      at: "2 hours ago",
      body: "The 'lazy retrieval' point is the one I'd lead with — it's the part designers and engineers both feel the pain of.",
    },
    {
      id: "pc2", author: "Sara", initials: "SA", tone: "sky",
      at: "32 minutes ago",
      body: "Agreed. Also worth showing a side-by-side of a raw prompt vs. a retrieval-augmented one.",
    },
  ];

  return (
    <AppShell nav="side" className="min-h-screen bg-background">
      <AppShellNav placement="side">
        <Sidebar collapsible={false}>
          <SidebarHeader>
            <Row gap="sm" align="center" className="flex-1">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px]">A</AvatarFallback>
              </Avatar>
              <Stack gap="none" className="flex-1 min-w-0">
                <span className="text-sm font-medium truncate">Ali&apos;s Workspace</span>
                <span className="text-[10px] text-muted-foreground">Free plan</span>
              </Stack>
            </Row>
          </SidebarHeader>
          <SidebarContent>
            <SidebarSection collapsible={false}>
              <SidebarItem asButton icon={<Search />}>Search</SidebarItem>
              <SidebarItem asButton icon={<Sparkles />}>AI</SidebarItem>
              <SidebarItem asButton icon={<Settings />}>Settings</SidebarItem>
            </SidebarSection>
            <SidebarSection title="Favourites">
              <SidebarItem asButton icon={<Star />}>Pinned page</SidebarItem>
            </SidebarSection>
            {/* Tree — recursive render via the SidebarTreeItem primitive.
                Auto-indents children one level per nesting depth. */}
            <SidebarSection title="Pages" collapsible={false}>
              {roots.map(renderNode)}
              <SidebarItem asButton icon={<Plus />}>New page</SidebarItem>
            </SidebarSection>
          </SidebarContent>
        </Sidebar>
      </AppShellNav>

      <AppShellMain>
        <Stack gap="none" className="h-screen">
          {/* Top strip — DS Breadcrumb for the path + page actions */}
          <Row justify="between" align="center" className="px-6 py-2 border-b border-border">
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumb.map((node, i) => {
                  const isLast = i === breadcrumb.length - 1;
                  return (
                    <BreadcrumbItem key={node.id}>
                      {isLast ? (
                        <BreadcrumbPage>
                          <span className="mr-1" aria-hidden>{node.emoji}</span>
                          {node.title}
                        </BreadcrumbPage>
                      ) : (
                        <>
                          <BreadcrumbLink onClick={() => setSelectedId(node.id)} className="cursor-pointer">
                            <span className="mr-1" aria-hidden>{node.emoji}</span>
                            {node.title}
                          </BreadcrumbLink>
                          <BreadcrumbSeparator />
                        </>
                      )}
                    </BreadcrumbItem>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
            <Row gap="xs" align="center">
              <Button variant="ghost" size="sm">
                <Share2 className="h-3.5 w-3.5 mr-1" /> Share
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Star className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </Row>
          </Row>

          {/* Page body — Composer with full formatting toolbar under
              a Notion-style title block. The Composer's `bare` prop
              strips the card chrome so it sits in the document like
              an editable text area rather than a form control. */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-6 py-12">
              {current && (
                <Stack gap="md">
                  <span className="text-6xl leading-none">{current.emoji}</span>
                  <h1 className="text-4xl font-bold tracking-tight">
                    {current.title}
                  </h1>
                  <Row gap="sm" align="center" className="text-xs text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    <span>Add property</span>
                    <Separator orientation="vertical" className="h-3" />
                    <span>Last edited 2h ago</span>
                  </Row>
                </Stack>
              )}
              <div className="mt-8">
                <Composer
                  placeholder="Type '/' for commands, or just start writing…"
                  toolbar
                  formats={[
                    "bold", "italic", "underline", "strikethrough", "code",
                    "h2", "h3", "blockquote", "ul", "ol",
                  ]}
                  triggers={[{ char: "/", items: slashCommands, stripTrigger: true }]}
                  initialText="Most design systems are documented for humans and then translated by hand into prompts whenever someone wants an LLM to use them. Grade closes that gap by treating model-facing documentation as a first-class artefact colocated with the component."
                  submitOnEnter={false}
                  hideSend
                  bare
                  className="min-h-[400px]"
                />
              </div>

              {/* Page comments — Notion-style footer thread, rendered
                  via <Message> instead of an inline row pattern. */}
              <div className="mt-12 pt-6 border-t border-border space-y-4">
                <Row gap="xs" align="center" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  <span>Page comments</span>
                </Row>
                <Stack gap="md">
                  {pageComments.map((c) => (
                    <Message
                      key={c.id}
                      author={c.author}
                      timestamp={c.at}
                      avatar={
                        <Avatar size="sm">
                          <AvatarFallback tone={c.tone}>{c.initials}</AvatarFallback>
                        </Avatar>
                      }
                    >
                      {c.body}
                    </Message>
                  ))}
                </Stack>
                <Composer
                  placeholder="Add a comment…"
                  formats={false}
                  triggers={[{ char: "@", items: [
                    { id: "u1", value: "marcus" },
                    { id: "u2", value: "sara" },
                  ]}]}
                  submitOnEnter={false}
                />
              </div>
            </div>
          </div>
        </Stack>
      </AppShellMain>
    </AppShell>
  );
}
