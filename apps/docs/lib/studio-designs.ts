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
  return {
    id: nextId(),
    name: name ?? `Screen ${index + 1}`,
    appSource: null,
  };
}

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
