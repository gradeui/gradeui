"use client";

import * as React from "react";
import { GripVertical } from "lucide-react";
import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

import { Sortable } from "@/components/ui/sortable";
import { Card, CardContent } from "@/components/ui/card";
import { Stack } from "@/components/ui/stack";
import { Row } from "@/components/ui/row";
import { Grid } from "@/components/ui/grid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MediaSurface } from "@/components/ui/media-surface";

const sortableProps = [
  {
    name: "values",
    type: "(string | number)[]",
    default: "—",
    description: "Required. Ordered list of unique ids; source of truth for the order.",
  },
  {
    name: "onReorder",
    type: "(next: (string | number)[]) => void",
    default: "—",
    description: "Fires with the full new order after a drag that changed it.",
  },
  {
    name: "strategy",
    type: '"vertical" | "horizontal" | "grid"',
    default: '"vertical"',
    description: "Match the layout your items render in. Drives dnd-kit's sort strategy.",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "Disable drag on every item without rebuilding the tree.",
  },
];

const itemProps = [
  {
    name: "value",
    type: "string | number",
    default: "—",
    description: "Must match one of the parent values. Identity, not React key.",
  },
  {
    name: "asChild",
    type: "boolean",
    default: "false",
    description: "Render as the child element via Slot.",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "Disable drag for this item only.",
  },
];

const handleProps = [
  {
    name: "asChild",
    type: "boolean",
    default: "false",
    description: "Render as the child element via Slot. Common pattern: wrap a ghost icon Button.",
  },
];

export default function SortablePage() {
  // Demo state — five tasks in a list, reorderable.
  const [tasks, setTasks] = React.useState([
    { id: "t1", title: "Audit the kanban board" },
    { id: "t2", title: "Migrate scaffolds to Sidebar" },
    { id: "t3", title: "Wire JSX validator into Studio UI" },
    { id: "t4", title: "Publish the next changeset" },
    { id: "t5", title: "Ship the MCP server" },
  ]);
  const tasksById = React.useMemo(
    () => Object.fromEntries(tasks.map((t) => [t.id, t])),
    [tasks],
  );
  const taskIds = tasks.map((t) => t.id);
  const reorderTasks = (next: (string | number)[]) =>
    setTasks(next.map((id) => tasksById[String(id)]).filter(Boolean));

  // Horizontal tabs example
  const [tabIds, setTabIds] = React.useState<string[]>(["Inbox", "Sent", "Drafts", "Trash"]);
  // Grid of media tiles
  const [photoIds, setPhotoIds] = React.useState<string[]>([
    "ph-1", "ph-2", "ph-3", "ph-4", "ph-5", "ph-6",
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Sortable</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Drag-to-reorder primitive built on <code className="font-mono">@dnd-kit/sortable</code>.
          Compound API — orchestrator + per-item wrapper + optional drag
          handle. Composes with any layout primitive.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <div className="rounded-lg bg-gds-gray-100 dark:bg-gds-gray-800 border border-gds-gray-200 dark:border-transparent p-4 font-mono text-sm text-gds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import { Sortable } from "@gradeui/ui"`}</code>
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage — vertical list
        </h2>
        <p className="text-sm text-muted-foreground">
          Wrap a Stack of items. Drag any row to reorder; live preview below.
        </p>
        <ComponentPreview
          code={`<Sortable values={tasks.map(t => t.id)} onReorder={(ids) => {
  setTasks(ids.map(id => tasks.find(t => t.id === id)));
}}>
  <Stack gap="sm">
    {tasks.map((t) => (
      <Sortable.Item key={t.id} value={t.id}>
        <Card>
          <CardContent className="p-3">{t.title}</CardContent>
        </Card>
      </Sortable.Item>
    ))}
  </Stack>
</Sortable>`}
        >
          <div className="w-full max-w-md">
            <Sortable values={taskIds} onReorder={reorderTasks}>
              <Stack gap="sm">
                {tasks.map((task) => (
                  <Sortable.Item key={task.id} value={task.id}>
                    <Card>
                      <CardContent className="p-3 text-sm">{task.title}</CardContent>
                    </Card>
                  </Sortable.Item>
                ))}
              </Stack>
            </Sortable>
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          With a drag handle
        </h2>
        <p className="text-sm text-muted-foreground">
          When the row body needs to stay clickable (an inner button, a link,
          a checkbox), scope drag activation to a <code className="font-mono">Sortable.Handle</code>{" "}
          grip. Click the handle to drag; click the row Body for normal interaction.
        </p>
        <ComponentPreview
          code={`<Sortable.Item value={item.id}>
  <Card>
    <Row gap="sm" align="center" className="p-3">
      <Sortable.Handle asChild>
        <Button variant="ghost" size="icon">
          <GripVertical className="h-4 w-4" />
        </Button>
      </Sortable.Handle>
      <span className="flex-1">{item.title}</span>
      <Button size="sm">Edit</Button>
    </Row>
  </Card>
</Sortable.Item>`}
        >
          <div className="w-full max-w-md">
            <Sortable values={taskIds} onReorder={reorderTasks}>
              <Stack gap="sm">
                {tasks.map((task) => (
                  <Sortable.Item key={task.id} value={task.id}>
                    <Card>
                      <Row gap="sm" align="center" className="p-2 pl-1">
                        <Sortable.Handle asChild>
                          <Button variant="ghost" size="icon">
                            <GripVertical className="h-4 w-4" />
                          </Button>
                        </Sortable.Handle>
                        <span className="flex-1 text-sm">{task.title}</span>
                        <Button size="sm" variant="outline">Edit</Button>
                      </Row>
                    </Card>
                  </Sortable.Item>
                ))}
              </Stack>
            </Sortable>
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Horizontal strip
        </h2>
        <p className="text-sm text-muted-foreground">
          For tab reordering and similar single-row arrangements use{" "}
          <code className="font-mono">strategy=&quot;horizontal&quot;</code> + a Row.
        </p>
        <ComponentPreview
          code={`<Sortable values={tabIds} onReorder={setTabIds} strategy="horizontal">
  <Row gap="xs">
    {tabIds.map((tab) => (
      <Sortable.Item key={tab} value={tab}>
        <Badge variant="secondary">{tab}</Badge>
      </Sortable.Item>
    ))}
  </Row>
</Sortable>`}
        >
          <div className="w-full max-w-md">
            <Sortable values={tabIds} onReorder={(next) => setTabIds(next.map(String))} strategy="horizontal">
              <Row gap="xs">
                {tabIds.map((tab) => (
                  <Sortable.Item key={tab} value={tab}>
                    <Badge variant="secondary" className="cursor-grab px-3 py-1.5 text-sm">
                      {tab}
                    </Badge>
                  </Sortable.Item>
                ))}
              </Row>
            </Sortable>
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          2D grid
        </h2>
        <p className="text-sm text-muted-foreground">
          Photo grids, asset libraries, dashboard tiles — anything 2D wraps with{" "}
          <code className="font-mono">strategy=&quot;grid&quot;</code>.
        </p>
        <ComponentPreview
          code={`<Sortable values={photoIds} onReorder={setPhotoIds} strategy="grid">
  <Grid cols="3" gap="md">
    {photoIds.map((id) => (
      <Sortable.Item key={id} value={id}>
        <MediaSurface aspect="square" alt={id} />
      </Sortable.Item>
    ))}
  </Grid>
</Sortable>`}
        >
          <div className="w-full max-w-md">
            <Sortable values={photoIds} onReorder={(next) => setPhotoIds(next.map(String))} strategy="grid">
              <Grid cols="3" gap="md">
                {photoIds.map((id) => (
                  <Sortable.Item key={id} value={id}>
                    {/* alt/hint deliberately omitted — the docs copy
                        of MediaSurfaceProps doesn't surface them; the
                        defaults render the generic placeholder which
                        is all this demo needs. */}
                    <MediaSurface aspect="square" />
                  </Sortable.Item>
                ))}
              </Grid>
            </Sortable>
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Sortable props
        </h2>
        <PropsTable props={sortableProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Sortable.Item props
        </h2>
        <PropsTable props={itemProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Sortable.Handle props
        </h2>
        <PropsTable props={handleProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Accessibility
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Keyboard-driven via dnd-kit's KeyboardSensor — Tab to focus an item, Space to lift, arrows to move, Space to drop, Esc to cancel.</li>
          <li>Sortable.Handle renders as a <code className="font-mono">role=&quot;button&quot;</code> with <code className="font-mono">aria-label=&quot;Drag to reorder&quot;</code>.</li>
          <li>PointerSensor activation distance is 4px so single-click interactions inside items pass through to their handlers.</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          When NOT to use
        </h2>
        <p className="text-muted-foreground">
          Cross-container drag (e.g. kanban &ldquo;drag from To Do to Done&rdquo;)
          isn&apos;t covered by v1 — a planned <code className="font-mono">Sortable.Group</code>{" "}
          will wire one DndContext above multiple Sortable columns. Until then,
          hand-roll with raw <code className="font-mono">@dnd-kit/core</code>{" "}
          for cross-container cases. For non-reorder drag scenarios (drag onto
          a target, drag-and-drop file zones, draggable canvas nodes), use the
          raw library too — Sortable specifically models the &ldquo;rearrange
          a list&rdquo; case.
        </p>
      </div>

      <SidecarBlock slug="sortable" />

      <ComponentNav currentHref="/components/sortable" />
    </div>
  );
}
