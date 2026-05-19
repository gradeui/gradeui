"use client";

/**
 * Sortable — compound drag-to-reorder primitive built on dnd-kit.
 *
 * The orchestrator (`<Sortable>`) owns the DndContext + SortableContext;
 * items (`<Sortable.Item>`) attach the `useSortable` hook + transform
 * styles to whatever you put inside them. An optional `<Sortable.Handle>`
 * scopes the drag activation to a specific child element (drag-by-grip
 * instead of drag-by-whole-row).
 *
 * Design choices that may surprise you:
 *
 *   - Layout primitives (Stack, Row, Grid) stay PURE — they don't grow
 *     a `sortable` prop. The reorder behaviour lives on its own
 *     primitive that composes with any layout:
 *     `<Sortable><Stack>...</Stack></Sortable>` works.
 *     `<Sortable strategy="grid"><Grid cols={3}>...</Grid></Sortable>`
 *     too. This matches the dnd-kit / framer Reorder pattern and
 *     keeps each component's contract tight.
 *
 *   - `values` is the source of truth, not the children. The model is
 *     `state -> children`, so reorder fires `onReorder(newValues)` and
 *     the consumer updates state; React re-renders children in the
 *     new order. Trying to read children's keys + mutate them is
 *     fighting React's data-flow.
 *
 *   - Item identity is `value`, NOT `key`. Items must have a unique
 *     `value` prop that matches one entry in `values`. We deliberately
 *     don't auto-derive from `key` because React lifts keys out of
 *     children before we can read them, AND because the value carries
 *     more semantic weight than a render-time key.
 *
 *   - Cross-container drag (the "drag from To Do to Done" kanban case)
 *     is NOT covered by v1. That needs one DndContext above multiple
 *     SortableContexts — planned as `<Sortable.Group>` follow-up. For
 *     now, each `<Sortable>` is its own world. Single-list reorder,
 *     single-grid reorder, single-horizontal-row reorder all work.
 *
 *   - Theming: no new tokens. dnd-kit handles the transform CSS;
 *     visual treatment (drop shadow on the active item, slight
 *     scale, etc.) is applied via opt-in className on the item.
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  type SortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";

// ─── Context ──────────────────────────────────────────────────────────

type SortableStrategy = "vertical" | "horizontal" | "grid";

const STRATEGY_BY_NAME: Record<SortableStrategy, SortingStrategy> = {
  vertical: verticalListSortingStrategy,
  horizontal: horizontalListSortingStrategy,
  grid: rectSortingStrategy,
};

interface SortableContextValue {
  /** Whether the parent Sortable is currently disabled — propagated to
   *  Item so its drag handlers no-op without us reaching into props on
   *  every item. */
  disabled: boolean;
}

const SortableRootContext = React.createContext<SortableContextValue | null>(null);

// ─── Group (cross-container) ──────────────────────────────────────────
//
// dnd-kit's standard pattern for kanban-style cross-container drag uses
// ONE DndContext above MULTIPLE SortableContexts. Each container
// registers its `values` + `onReorder` with the Group via context; on
// drag-end the Group routes the event:
//
//   same container  → that container's onReorder(new order)
//   cross container → source.onReorder(without id) + dest.onReorder(with id inserted)
//
// Sortable auto-detects whether it's inside a Group via context — when
// it is, it skips its own DndContext mount and registers with the Group
// instead. Standalone Sortable (no Group) keeps working exactly as
// before. No breaking change for the kanban-board scaffold (which used
// 3 independent Sortables); migrating to Sortable.Group is opt-in for
// cross-column drag.

interface RegisteredContainer<T extends UniqueIdentifier = UniqueIdentifier> {
  id: string;
  values: T[];
  onReorder?: (next: T[]) => void;
}

interface SortableGroupContextValue {
  registerContainer: <T extends UniqueIdentifier>(
    container: RegisteredContainer<T>,
  ) => () => void;
}

const SortableGroupContext = React.createContext<SortableGroupContextValue | null>(
  null,
);

export interface SortableGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Disable drag for every container inside the Group. */
  disabled?: boolean;
}

export const SortableGroup = React.forwardRef<HTMLDivElement, SortableGroupProps>(
  function SortableGroup({ disabled = false, className, children, ...rest }, ref) {
    // Registry of child containers. Each Sortable inside the Group
    // self-registers via the context's registerContainer helper. Stored
    // in a ref so the registry mutations don't trigger Group re-renders
    // on every Sortable mount; we read the live snapshot inside the
    // drag handlers.
    const registryRef = React.useRef<Map<string, RegisteredContainer>>(
      new Map(),
    );

    const registerContainer = React.useCallback(
      <T extends UniqueIdentifier>(container: RegisteredContainer<T>): (() => void) => {
        registryRef.current.set(
          container.id,
          container as unknown as RegisteredContainer,
        );
        return () => {
          registryRef.current.delete(container.id);
        };
      },
      [],
    );

    const sensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
      useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    // Find which container an id lives in. Containers can also be drop
    // targets themselves (when a column is empty, the `over.id` IS the
    // column's id, not an item id) — handle both cases.
    const findContainerForId = (id: UniqueIdentifier): RegisteredContainer | null => {
      const registry = registryRef.current;
      // Direct hit: the id IS a container id.
      const direct = registry.get(String(id));
      if (direct) return direct;
      // Otherwise it's an item id — find the container whose values
      // array contains it.
      for (const container of registry.values()) {
        if (container.values.some((v) => v === id)) return container;
      }
      return null;
    };

    const handleDragEnd = React.useCallback((event: DragEndEvent) => {
      if (disabled) return;
      const { active, over } = event;
      if (!over) return;
      const source = findContainerForId(active.id);
      const dest = findContainerForId(over.id);
      if (!source || !dest) return;

      if (source.id === dest.id) {
        // Same-container reorder. Same shape as standalone Sortable.
        if (active.id === over.id) return;
        const oldIndex = source.values.findIndex((v) => v === active.id);
        const newIndex = source.values.findIndex((v) => v === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        source.onReorder?.(arrayMove(source.values, oldIndex, newIndex));
        return;
      }

      // Cross-container move. Remove from source, insert into dest at
      // the index of the over.id (or at the end if dropped on the
      // container itself).
      const sourceNext = source.values.filter((v) => v !== active.id);
      const destIndex =
        over.id === dest.id
          ? dest.values.length
          : Math.max(0, dest.values.findIndex((v) => v === over.id));
      const destNext = [
        ...dest.values.slice(0, destIndex),
        active.id,
        ...dest.values.slice(destIndex),
      ];
      source.onReorder?.(sourceNext);
      dest.onReorder?.(destNext);
    }, [disabled]);

    // `closestCorners` is the recommended collision detector for
    // multi-container sortable — it works better than `closestCenter`
    // when an item is dragged near the edge of one container into
    // another. The Sortable-without-Group path keeps closestCenter.
    return (
      <SortableGroupContext.Provider value={{ registerContainer }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <div
            ref={ref}
            data-gds-part="sortable-group"
            data-disabled={disabled || undefined}
            className={cn(className)}
            {...rest}
          >
            {children}
          </div>
        </DndContext>
      </SortableGroupContext.Provider>
    );
  },
);
SortableGroup.displayName = "Sortable.Group";

// ─── Root ─────────────────────────────────────────────────────────────

export interface SortableProps<T extends UniqueIdentifier = UniqueIdentifier>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "id"> {
  /** Ordered list of unique ids — strings or numbers. Source of truth
   *  for the order; reorder fires `onReorder(newValues)` and the
   *  consumer updates their state. */
  values: T[];
  /** Fired with the full new order after a drag-end that changed it.
   *  Drags that snap back (drop on origin) DON'T fire — only real
   *  reorders. */
  onReorder?: (next: T[]) => void;
  /** Layout direction the sort strategy assumes.
   *    `vertical` (default) — stacked column of items, drag up/down.
   *    `horizontal`         — row of items, drag left/right.
   *    `grid`               — 2D wrap, drag in any direction.
   *  Match this to the layout your items render in. */
  strategy?: SortableStrategy;
  /** Disable drag on every item without rebuilding the tree. */
  disabled?: boolean;
  /** Stable container id — required when this Sortable is nested
   *  inside a `Sortable.Group` for cross-container drag (the Group
   *  routes drag-end events by container id). Optional for standalone
   *  Sortable; auto-generated via React.useId when omitted. */
  id?: string;
}

// Compound-component type pattern matched against the other roots in
// this codebase (Carousel, Sidebar). Non-generic on the callable
// signature — TS still infers `values: string[]` at the call site,
// we lose only the rare "values: SymbolicId[]" inference, which no
// real consumer needs.
interface SortableRootComponent
  extends React.ForwardRefExoticComponent<
    SortableProps & React.RefAttributes<HTMLDivElement>
  > {
  Item: typeof SortableItem;
  Handle: typeof SortableHandle;
  Group: typeof SortableGroup;
}

const SortableImpl = React.forwardRef<HTMLDivElement, SortableProps>(
  function Sortable(
    {
      values,
      onReorder,
      strategy = "vertical",
      disabled = false,
      id,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    // Auto-detect Sortable.Group enclosure. Inside a Group we skip
    // our own DndContext + sensors (the Group owns them) and register
    // ourselves so cross-container drag-end routing works. Standalone
    // Sortable keeps its old behaviour unchanged.
    const group = React.useContext(SortableGroupContext);
    const inGroup = group !== null;

    // Container id — required for Group registration AND for the
    // useDroppable wrapper that makes the container itself a drop
    // target for empty columns. Auto-generated when not passed; pass
    // a stable id explicitly in cross-container setups for legibility.
    const fallbackId = React.useId();
    const containerId = id ?? fallbackId;

    // Register with the Group on every values/onReorder change so its
    // drag-end handler sees the live snapshot.
    React.useEffect(() => {
      if (!inGroup) return;
      return group!.registerContainer({
        id: containerId,
        values,
        onReorder,
      });
    }, [inGroup, group, containerId, values, onReorder]);

    const sensors = useSensors(
      // PointerSensor with activation distance — drag doesn't fire on
      // a click, only after a few pixels of pointer movement. Keeps
      // clickable items (a Card with an onClick, a Button inside the
      // row) working without every press immediately stealing as drag.
      useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
      useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleStandaloneDragEnd = React.useCallback(
      (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = values.findIndex((v) => v === active.id);
        const newIndex = values.findIndex((v) => v === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        onReorder?.(arrayMove(values, oldIndex, newIndex) as typeof values);
      },
      [values, onReorder],
    );

    const ctx = React.useMemo<SortableContextValue>(
      () => ({ disabled }),
      [disabled],
    );

    // Shared body — SortableContext + the (possibly-droppable) container.
    const body = (
      <SortableContext items={values} strategy={STRATEGY_BY_NAME[strategy]}>
        <ContainerDroppable
          id={containerId}
          enabled={inGroup}
          forwardedRef={ref}
          strategy={strategy}
          disabled={disabled}
          className={className}
          {...rest}
        >
          {children}
        </ContainerDroppable>
      </SortableContext>
    );

    // In-Group: skip the DndContext (Group has it).
    if (inGroup) {
      return (
        <SortableRootContext.Provider value={ctx}>
          {body}
        </SortableRootContext.Provider>
      );
    }

    // Standalone — original behaviour.
    return (
      <SortableRootContext.Provider value={ctx}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleStandaloneDragEnd}
        >
          {body}
        </DndContext>
      </SortableRootContext.Provider>
    );
  },
) as unknown as SortableRootComponent;
SortableImpl.displayName = "Sortable";

/**
 * Inner wrapper that registers the container itself as a droppable
 * target when inside a Group — empty columns need this so the user
 * can drop an item into an otherwise-empty container. Outside a
 * Group, useDroppable is a no-op for collision purposes (dnd-kit's
 * collision detection only considers the items inside).
 */
function ContainerDroppable({
  id,
  enabled,
  forwardedRef,
  strategy,
  disabled,
  className,
  children,
  ...rest
}: {
  id: string;
  enabled: boolean;
  forwardedRef: React.ForwardedRef<HTMLDivElement>;
  strategy: SortableStrategy;
  disabled: boolean;
  className?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const droppable = useDroppable({ id, disabled: !enabled });
  const composedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (enabled) droppable.setNodeRef(node);
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [enabled, droppable, forwardedRef],
  );
  return (
    <div
      ref={composedRef}
      data-gds-part="sortable"
      data-strategy={strategy}
      data-disabled={disabled || undefined}
      className={cn(className)}
      {...rest}
    >
      {children}
    </div>
  );
}

// ─── Item ─────────────────────────────────────────────────────────────

/** Context passed from Item down to a (potentially nested) Handle so it
 *  can attach the drag listeners only to that specific child element. */
interface SortableItemContextValue {
  listeners: ReturnType<typeof useSortable>["listeners"];
  setActivatorNodeRef: ReturnType<typeof useSortable>["setActivatorNodeRef"];
  /** True when the consumer used <Sortable.Handle> inside the Item —
   *  flips the Item's own listeners off so the handle has exclusive
   *  drag activation. Tracked via a sentinel set by Handle on mount. */
  hasHandle: React.MutableRefObject<boolean>;
  disabled: boolean;
}

const SortableItemInternalContext =
  React.createContext<SortableItemContextValue | null>(null);

export interface SortableItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Must match one of the parent `<Sortable values>` entries.
   *  Identity, not React key. */
  value: UniqueIdentifier;
  /** Render the item as its child element via Radix Slot — useful when
   *  the wrapping div would mess with your layout (e.g. inside Table
   *  rows). */
  asChild?: boolean;
  /** Disable drag for THIS item without disabling the whole Sortable. */
  disabled?: boolean;
}

const SortableItem = React.forwardRef<HTMLDivElement, SortableItemProps>(
  function SortableItem(
    { value, asChild = false, disabled: itemDisabled, className, style, children, ...rest },
    forwardedRef,
  ) {
    const root = React.useContext(SortableRootContext);
    if (!root) {
      throw new Error("<Sortable.Item> must be rendered inside <Sortable>.");
    }
    const disabled = root.disabled || itemDisabled || false;

    const {
      attributes,
      listeners,
      setNodeRef,
      setActivatorNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: value, disabled });

    // Track whether the consumer mounted a Handle inside this Item.
    // When they DID, the Item's own listeners get dropped (the handle
    // has exclusive drag activation). When they didn't, the whole
    // Item is the drag activator. Tracked via ref + useEffect to
    // avoid a re-render dance.
    const hasHandleRef = React.useRef(false);

    // Compose forwarded ref with dnd-kit's setNodeRef.
    const composedRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        setNodeRef(node);
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [setNodeRef, forwardedRef],
    );

    const itemCtx = React.useMemo<SortableItemContextValue>(
      () => ({
        listeners,
        setActivatorNodeRef,
        hasHandle: hasHandleRef,
        disabled,
      }),
      [listeners, setActivatorNodeRef, disabled],
    );

    const composedStyle: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      // Subtle lift while dragging — opt-out via className override.
      zIndex: isDragging ? 1 : undefined,
      cursor: disabled
        ? "default"
        : hasHandleRef.current
          ? undefined
          : "grab",
      ...style,
    };

    const Comp = asChild ? Slot : "div";

    // We attach the activation listeners to the WHOLE item by default,
    // but when a Handle is mounted later, useEffect inside the Handle
    // flips the hasHandle ref AND the Handle attaches the same
    // listeners to itself. The Item-level listeners stay attached but
    // dnd-kit's activator-node-ref (set by Handle) wins for collision
    // origin purposes — net effect: only the handle activates drag.
    return (
      <SortableItemInternalContext.Provider value={itemCtx}>
        <Comp
          ref={composedRef}
          data-gds-part="sortable-item"
          data-value={String(value)}
          data-dragging={isDragging || undefined}
          className={cn(className)}
          style={composedStyle}
          {...attributes}
          {...(hasHandleRef.current ? {} : listeners)}
          {...rest}
        >
          {children}
        </Comp>
      </SortableItemInternalContext.Provider>
    );
  },
);
SortableItem.displayName = "Sortable.Item";

// ─── Handle ───────────────────────────────────────────────────────────

export interface SortableHandleProps extends React.HTMLAttributes<HTMLElement> {
  /** Render as the child element via Slot — typical pattern is
   *  `<Sortable.Handle asChild><Button variant="ghost" size="icon">…</Button></Sortable.Handle>`. */
  asChild?: boolean;
}

const SortableHandle = React.forwardRef<HTMLElement, SortableHandleProps>(
  function SortableHandle({ asChild = false, className, children, ...rest }, ref) {
    const itemCtx = React.useContext(SortableItemInternalContext);
    if (!itemCtx) {
      throw new Error(
        "<Sortable.Handle> must be rendered inside <Sortable.Item>.",
      );
    }

    // Flip the sentinel on mount so the Item drops its own listeners.
    // Done in a layout effect so it runs before paint and the cursor
    // doesn't briefly show "grab" on the whole item.
    React.useLayoutEffect(() => {
      itemCtx.hasHandle.current = true;
      return () => {
        itemCtx.hasHandle.current = false;
      };
    }, [itemCtx.hasHandle]);

    const composedRef = React.useCallback(
      (node: HTMLElement | null) => {
        itemCtx.setActivatorNodeRef(node);
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [itemCtx, ref],
    );

    const sharedProps = {
      "data-gds-part": "sortable-handle",
      "aria-label": "Drag to reorder" as string,
      className: cn(
        "cursor-grab touch-none select-none",
        itemCtx.disabled && "cursor-default opacity-50",
        className,
      ),
      ...(itemCtx.disabled ? {} : itemCtx.listeners),
      ...rest,
    };

    // Two branches with the proper ref types — Slot wants
    // Ref<HTMLElement>, button wants Ref<HTMLButtonElement>. The
    // polymorphic single-Comp variant would require an `as any` cast
    // to satisfy both; splitting is uglier source but cleaner types.
    if (asChild) {
      return (
        <Slot
          ref={composedRef as React.Ref<HTMLElement>}
          {...sharedProps}
        >
          {children}
        </Slot>
      );
    }
    return (
      <button
        type="button"
        ref={composedRef as React.Ref<HTMLButtonElement>}
        {...sharedProps}
      >
        {children}
      </button>
    );
  },
);
SortableHandle.displayName = "Sortable.Handle";

// ─── Compose + export ─────────────────────────────────────────────────

SortableImpl.Item = SortableItem;
SortableImpl.Handle = SortableHandle;
SortableImpl.Group = SortableGroup;

export const Sortable = SortableImpl as SortableRootComponent;
// SortableGroup is already exported inline at its declaration above.
export { SortableItem, SortableHandle };
