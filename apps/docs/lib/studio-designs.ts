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

export interface Design {
  id: string;
  name: string;
  /** The last sealed JSX block from the assistant for this design. */
  appSource: string | null;
}

/** Id generator scoped to this module — avoids pulling in a uuid dep. */
function nextId(): string {
  return "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Fresh design for a new slot. Name defaults are just numbering — users
 *  can rename inline via the tab's double-click. */
export function createDesign(index: number, name?: string): Design {
  return {
    id: nextId(),
    name: name ?? `Untitled ${index + 1}`,
    appSource: null,
  };
}

/** Initial state: one blank design, ready to go. */
export function initialDesigns(): Design[] {
  return [createDesign(0)];
}
