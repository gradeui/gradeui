---
name: Sortable
import: "@gradeui/ui"
subcomponents: [Sortable.Item, Sortable.Handle]
props:
  - Sortable: values: (string | number)[] — ordered list of unique ids; the source of truth for the order
  - Sortable: onReorder?: (next: (string | number)[]) => void — fires with the new order after a drag that changed it
  - Sortable: strategy?: "vertical" | "horizontal" | "grid" (default "vertical") — match the layout your items render in
  - Sortable: disabled?: boolean — disable drag on every item
  - Sortable.Item: value: string | number — must match one entry in the parent `values` array (identity, not React key)
  - Sortable.Item: asChild?: boolean — render as the child element via Radix Slot
  - Sortable.Item: disabled?: boolean — disable drag for this item only
  - Sortable.Handle: asChild?: boolean — wrap a Button / icon as the drag grip
when_to_use: Drag-to-reorder lists, kanban-column reordering, sortable shelves, tab strips the user can rearrange. Pairs with any layout primitive — Stack for vertical lists, Row for horizontal strips, Grid for 2D card walls. For cross-container drag (drag a card from one column to another) hand-roll DndContext at the page level — Sortable v1 covers single-list reorder; Sortable.Group for cross-container is a planned follow-up. Reach for raw `@dnd-kit/core` if you need custom collision detection, drag overlays with arbitrary chrome, or non-list use cases (kanban swimlanes, draggable canvas nodes).
composes_with: [Stack (vertical lists), Row (horizontal strips), Grid (2D card walls), Card (typical item content), Button (as Sortable.Handle asChild)]
aliases: [sortable, reorder, drag and drop, dnd, draggable list, sortable list, kanban, drag to reorder, drag-drop, dragdroplist, drag handle, react native draggable flatlist]
---

```jsx
const [items, setItems] = React.useState([
  { id: "a", title: "First" },
  { id: "b", title: "Second" },
  { id: "c", title: "Third" },
]);

<Sortable values={items.map(i => i.id)} onReorder={(ids) => {
  setItems(ids.map(id => items.find(i => i.id === id)!));
}}>
  <Stack gap="sm">
    {items.map((item) => (
      <Sortable.Item key={item.id} value={item.id}>
        <Card>
          <CardContent className="p-3">{item.title}</CardContent>
        </Card>
      </Sortable.Item>
    ))}
  </Stack>
</Sortable>
```

```jsx
// With a drag handle — only the grip activates drag; the rest of the
// row stays clickable for child Buttons / links.
<Sortable values={ids} onReorder={setIds} strategy="vertical">
  <Stack gap="sm">
    {items.map((item) => (
      <Sortable.Item key={item.id} value={item.id}>
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
      </Sortable.Item>
    ))}
  </Stack>
</Sortable>
```

```jsx
// Horizontal tab strip — strategy="horizontal" + Row instead of Stack.
<Sortable values={tabIds} onReorder={setTabIds} strategy="horizontal">
  <Row gap="xs">
    {tabs.map((tab) => (
      <Sortable.Item key={tab.id} value={tab.id}>
        <Badge>{tab.label}</Badge>
      </Sortable.Item>
    ))}
  </Row>
</Sortable>
```

```jsx
// 2D card grid — strategy="grid".
<Sortable values={photoIds} onReorder={setPhotoIds} strategy="grid">
  <Grid cols="3" gap="md">
    {photos.map((p) => (
      <Sortable.Item key={p.id} value={p.id}>
        <MediaSurface aspect="square" alt={p.alt} />
      </Sortable.Item>
    ))}
  </Grid>
</Sortable>
```

### Anti-patterns

DO NOT add a `sortable` prop to Stack / Row / Grid — those primitives stay pure. Wrap them in `<Sortable>` to mark a collection sortable. Mixing layout and reorder concerns into one component balloons each primitive's contract for a feature 95% of stacks don't use, and loses you cross-layout consistency (one Sortable wrapping a Grid works exactly like one wrapping a Stack).

DO NOT use `key` as the sortable identity. `<Sortable.Item value={item.id}>` is the source of truth — `key={item.id}` is also fine for React's reconciler but `value` is what dnd-kit reads. They usually match; if they don't, drag-end will operate on the wrong row.

DO NOT try to mutate children directly to reorder. Sortable's data model is `state → children`. Reorder fires `onReorder(newValues)`; you update state; React re-renders children in the new order. Trying to read children's keys + reorder them imperatively fights React.

DO NOT wrap clickable items (Card with onClick, Button-bearing rows) without thinking about drag-vs-click conflict. The PointerSensor has a 4px activation distance so single clicks pass through, but if the row's primary affordance is "click to open detail," consider a `<Sortable.Handle>` so the user clicks the body for detail and drags only the grip.

DO NOT use Sortable for cross-container drag in v1. A single `<Sortable>` is one DndContext; the kanban "drag from To Do to Done" case needs one DndContext above multiple SortableContexts. Until `<Sortable.Group>` lands, that pattern needs hand-rolled `@dnd-kit/core` at the page level. Single-list, single-grid, single-strip reorder all work.
