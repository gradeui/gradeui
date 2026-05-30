/**
 * In-memory design-slot state for /studio.
 *
 * Each "design" is a separate page the user is composing. Within a single
 * Studio session the user can juggle several (e.g. Dashboard + Settings +
 * Auth), all sharing the same working theme — the whole point of a design
 * system is that every page looks consistent.
 *
 * State held here:
 *   - id: stable per-slot key; also used as the `useChat` id so chat state
 *         persists internally even when the component remounts on switch.
 *   - name: user-editable label (defaults to "Untitled N").
 *   - appSource: the latest JSX emitted for this design, or null.
 *
 * Chat history itself lives inside the AI SDK's internal `Chat` store,
 * keyed by `id`. We don't duplicate it here — that would be two sources of
 * truth for the same data.
 *
 * This module is deliberately pure/serialisable so the shape is portable
 * to a future persistence layer (localStorage or a "saved sessions" API).
 */

/**
 * Lifecycle status for a screen — surfaced in the right-panel
 * metadata view (Stage B). Maps to a small fixed vocab so the chip /
 * select reads consistently across surfaces; we deliberately avoid
 * "todo / doing / done" Jira-isms here in favour of softer screen
 * design language.
 *
 * Optional on the type for backwards compatibility — undefined
 * normalises to "draft" in the UI.
 */
export type DesignStatus = "draft" | "in_progress" | "in_review" | "done";

export interface Design {
  id: string;
  name: string;
  /** The last sealed JSX block from the assistant for this design. */
  appSource: string | null;
  /** When this design was first created, in epoch ms. Set once at
   *  creation. Used in the tab tooltip + the future "designs list"
   *  view to surface "Created 3 days ago". Optional in the schema
   *  for backwards compatibility with persisted designs from before
   *  the field was added — they'll get the timestamp filled in the
   *  next time they're mutated. */
  createdAt?: number;
  /** Most recent mutation timestamp, in epoch ms. Bumped on every
   *  appSource change, prop edit, chat completion, fill / regenerate
   *  action — anything that produces a new state. Drives "Last
   *  edited Nm ago" affordances; the undo timeline (task #42) will
   *  use the same field per-snapshot. */
  updatedAt?: number;
  /** Lifecycle status. Optional — undefined means "draft" for legacy
   *  persisted designs that pre-date this field. New designs default
   *  to "draft" via `createDesign()`. */
  status?: DesignStatus;
}

/**
 * Id generator scoped to this module — avoids pulling in a uuid dep.
 *
 * ⚠ Client-only. Reads `Date.now()` + `Math.random()`, so calling this
 * during SSR (including inside a `useState` initializer) causes a React
 * hydration mismatch: server mints one id, client mints a different one,
 * and React screams about the tree differing. `initialDesigns()` uses a
 * deterministic seed id to keep the first render stable across SSR and
 * hydration; user-triggered `createDesign()` calls happen in click
 * handlers, so they're already client-only.
 */
function nextId(): string {
  return "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Fresh design for a new slot. Name defaults are just numbering — users
 *  can rename inline via the tab's double-click. "Screen" rather than
 *  "Untitled" because each slot is a page/view in the prototype, and
 *  "Screen N" reads more obviously as part of a multi-screen flow.
 *
 *  Client-only — `nextId()` is not SSR-safe. See `initialDesigns()` for the
 *  SSR-safe seed. */
export function createDesign(index: number, name?: string): Design {
  const now = Date.now();
  return {
    id: nextId(),
    name: name ?? `Screen ${index + 1}`,
    appSource: null,
    createdAt: now,
    updatedAt: now,
    status: "draft",
  };
}

/** Human-readable label for a DesignStatus. Sentence case, no Jira. */
export function designStatusLabel(status: DesignStatus | undefined): string {
  switch (status ?? "draft") {
    case "draft":
      return "Draft";
    case "in_progress":
      return "In progress";
    case "in_review":
      return "In review";
    case "done":
      return "Done";
  }
}

/** Stable ordering for status select / segmented controls. */
export const DESIGN_STATUSES: DesignStatus[] = [
  "draft",
  "in_progress",
  "in_review",
  "done",
];

/**
 * Initial state: one blank design, ready to go.
 *
 * Returns a deterministic seed (id `"d0"`, name `"Screen 1"`) rather than
 * calling `createDesign(0)` — the studio page feeds this into a `useState`
 * initializer, which runs during SSR AND again during client hydration.
 * A random `nextId()` on each side would produce mismatched tree props
 * (seen in the wild as a hydration error complaining about differing
 * `chatId` values on the screen-count badge). The fixed id is only used
 * for the very first slot; any design the user adds afterwards goes
 * through `createDesign()` in a click handler, which is client-only and
 * can happily use `nextId()`.
 */
export function initialDesigns(): Design[] {
  return [
    {
      id: "d0",
      name: "Screen 1",
      appSource: null,
    },
  ];
}
