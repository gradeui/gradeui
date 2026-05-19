import {
  AppShell, AppShellNav, AppShellMain,
  Stack, Row,
  Button, Avatar, AvatarFallback, Separator, Input,
  Sidebar, SidebarHeader, SidebarContent, SidebarSection, SidebarItem, SidebarTreeItem,
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from "@gradeui/ui";
import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Plus, Search, Hash, FileText, ChevronRight,
  Settings, Star, Trash2, Share2, MoreHorizontal, Sparkles,
  Folder,
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

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Type '/' for commands, or just start writing…",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    editorProps: {
      attributes: {
        class: "prose prose-base dark:prose-invert max-w-none focus:outline-none min-h-[400px]",
      },
    },
    content: `<h2>Why we're building Grade as an AI-native DS</h2>
<p>Most design systems are documented for humans and then translated by hand into prompts whenever someone wants an LLM to use them. The translation is brittle — it drifts from the source, bloats every prompt with the full catalog, and never quite covers the 10% of generation where the model reaches for raw Tailwind instead of the DS.</p>
<p>Grade closes that gap by treating model-facing documentation as a <strong>first-class artefact colocated with the component</strong>. Four properties:</p>
<ol><li>Single source of truth</li><li>Lazy retrieval</li><li>Pinned structural grammar</li><li>Contract-validated output</li></ol>
<p>Cumulative effect: Studio generates a login form, a stat dashboard, or an app shell with correct DS components first-try.</p>`,
    immediatelyRender: false,
  });

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

          {/* Page body — TipTap editor under a Notion-style title block */}
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
                <EditorContent editor={editor} />
              </div>
              <div className="mt-12 pt-6 border-t border-border">
                <Row gap="sm" align="center" className="text-xs text-muted-foreground">
                  <Trash2 className="h-3 w-3" />
                  <span>Add a comment, page-level action, or footnote here.</span>
                </Row>
              </div>
            </div>
          </div>
        </Stack>
      </AppShellMain>
    </AppShell>
  );
}
