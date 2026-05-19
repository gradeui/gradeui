"use client";

/**
 * Per-design undo / redo history hook.
 *
 * Owns a bounded ring-buffer of state snapshots and the cursor that
 * points at the active entry. Three consumer-facing operations:
 *
 *   push(state, label?)   → committed a new edit. Snapshots the value
 *                            with a human-readable label ("Chat edit",
 *                            "Fill images", "Change hint to poster")
 *                            and discards any redo-future past the cursor.
 *   undo()                → move cursor back; returns the previous
 *                            snapshot for the caller to apply.
 *   redo()                → move cursor forward; returns the next
 *                            snapshot for the caller to apply.
 *
 * Persistence: every history change writes through to
 * `localStorage.studio:history:<designId>` so reload restores the
 * stack. Capped at MAX_SNAPSHOTS per design (default 50) to keep the
 * footprint bounded — older entries are dropped from the front.
 *
 * Why a hook (rather than a context provider): each design has its
 * own independent history, and the consumer (page.tsx) already owns
 * per-design state. The hook turns "track the history for this one
 * designId's appSource" into a one-liner without any context plumbing.
 *
 * Generic `T` lets callers track any serialisable shape — `string`
 * for the appSource case today, expandable to a bigger tuple
 * `{ appSource, mediaUrls, mediaOverrides }` when the full per-design
 * snapshot lands. JSON-serialisable values only; storage uses
 * `JSON.stringify`.
 */

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_SNAPSHOTS = 50;

/** One entry in the per-design history stack. */
export interface HistorySnapshot<T> {
  value: T;
  /** Human-readable label for the action that produced this state.
   *  Surfaces in the undo timeline + the undo button's tooltip
   *  ("Undo Fill images"). Optional — defaults to "Edit". */
  label?: string;
  /** Epoch ms — paired with the label for "13:42 Fill images"
   *  rendering in the timeline view. */
  at: number;
}

interface HistoryState<T> {
  /** Linear ordered stack — index 0 is the OLDEST, length-1 is the NEWEST. */
  snapshots: HistorySnapshot<T>[];
  /** Index of the snapshot that represents the CURRENT state of the
   *  consumer. Undo decrements this; redo increments it. New pushes
   *  always go to the cursor+1 position and lop off any redo-future. */
  cursor: number;
}

export interface UndoHistoryAPI<T> {
  /** True when there's an earlier snapshot we can revert to. */
  canUndo: boolean;
  /** True when there's a later snapshot in the redo-future. */
  canRedo: boolean;
  /** Label of the snapshot that `undo()` would restore. Used in tooltips. */
  undoLabel: string | null;
  /** Label of the snapshot that `redo()` would restore. */
  redoLabel: string | null;
  /** Commit a new state to the history. Drops any redo-future. */
  push: (value: T, label?: string) => void;
  /** Restore the previous snapshot. Returns the value (so the caller
   *  can apply it to its own state) or null if no-op. */
  undo: () => T | null;
  /** Restore the next snapshot. Returns the value or null. */
  redo: () => T | null;
  /** Clear the entire history (used on design close). */
  clear: () => void;
}

const STORAGE_PREFIX = "studio:history:";

function storageKey(designId: string): string {
  return STORAGE_PREFIX + designId;
}

function loadInitial<T>(designId: string | null): HistoryState<T> {
  if (!designId || typeof window === "undefined") {
    return { snapshots: [], cursor: -1 };
  }
  try {
    const raw = window.localStorage.getItem(storageKey(designId));
    if (!raw) return { snapshots: [], cursor: -1 };
    const parsed = JSON.parse(raw) as HistoryState<T>;
    if (
      parsed &&
      Array.isArray(parsed.snapshots) &&
      typeof parsed.cursor === "number"
    ) {
      return parsed;
    }
  } catch {
    /* malformed entry — fall through to empty */
  }
  return { snapshots: [], cursor: -1 };
}

/**
 * useUndoHistory — per-id snapshot stack.
 *
 * The hook seeds itself from localStorage on first mount, then writes
 * back on every change. The CURRENT value of the consumer's state is
 * NOT one of the snapshots — snapshots represent "states the user
 * could go back to". push() is called AFTER the consumer commits a
 * new value; the previous value gets recorded as the snapshot to
 * restore on undo.
 *
 * Wiring shape:
 *
 *     const history = useUndoHistory<string>(designId);
 *     // ... when the consumer's state changes:
 *     history.push(newAppSource, "Chat edit");
 *     // ... cmd-z handler:
 *     const previous = history.undo();
 *     if (previous != null) applyAppSource(previous);
 */
export function useUndoHistory<T>(
  designId: string | null,
): UndoHistoryAPI<T> {
  // Lazy initial — load the persisted state for this id ONCE, on
  // first mount. The effect below keeps localStorage in sync on every
  // subsequent change.
  const [state, setState] = useState<HistoryState<T>>(() =>
    loadInitial<T>(designId),
  );

  // When `designId` changes (user switches designs), reseed from
  // that design's stored history. The previous design's state was
  // already flushed to localStorage so nothing is lost.
  const lastDesignId = useRef(designId);
  useEffect(() => {
    if (lastDesignId.current === designId) return;
    lastDesignId.current = designId;
    setState(loadInitial<T>(designId));
  }, [designId]);

  // Persist on change. We write under the CURRENT designId — if that's
  // null (no design focused) we skip rather than scribble a key.
  useEffect(() => {
    if (!designId || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey(designId), JSON.stringify(state));
    } catch {
      /* quota / disabled — same trade-off as the other persistence
       * effects in the canvas; the history is recoverable from current
       * state on the next push */
    }
  }, [state, designId]);

  const push = useCallback((value: T, label?: string) => {
    setState((prev) => {
      // Drop redo-future past the cursor so the new edit becomes the
      // new tip of the timeline.
      const kept = prev.snapshots.slice(0, prev.cursor + 1);
      kept.push({ value, label: label ?? "Edit", at: Date.now() });
      // Ring-buffer cap. Drop oldest entries so the cursor stays at
      // the tip after a push.
      const overflow = kept.length - MAX_SNAPSHOTS;
      const trimmed = overflow > 0 ? kept.slice(overflow) : kept;
      return { snapshots: trimmed, cursor: trimmed.length - 1 };
    });
  }, []);

  // undo/redo need to RETURN the restored value synchronously, but
  // `setState` is async. We use a ref to mirror the latest state so
  // the call site reads the cursor + snapshots without an effect tick.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const undo = useCallback((): T | null => {
    const cur = stateRef.current;
    if (cur.cursor <= 0) return null;
    const targetIndex = cur.cursor - 1;
    const target = cur.snapshots[targetIndex];
    if (!target) return null;
    setState((prev) => ({ ...prev, cursor: targetIndex }));
    return target.value;
  }, []);

  const redo = useCallback((): T | null => {
    const cur = stateRef.current;
    if (cur.cursor >= cur.snapshots.length - 1) return null;
    const targetIndex = cur.cursor + 1;
    const target = cur.snapshots[targetIndex];
    if (!target) return null;
    setState((prev) => ({ ...prev, cursor: targetIndex }));
    return target.value;
  }, []);

  const clear = useCallback(() => {
    setState({ snapshots: [], cursor: -1 });
    if (designId && typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(storageKey(designId));
      } catch {
        /* ignore */
      }
    }
  }, [designId]);

  const undoLabel =
    state.cursor > 0 ? state.snapshots[state.cursor - 1]?.label ?? "Edit" : null;
  const redoLabel =
    state.cursor < state.snapshots.length - 1
      ? state.snapshots[state.cursor + 1]?.label ?? "Edit"
      : null;

  return {
    canUndo: state.cursor > 0,
    canRedo: state.cursor < state.snapshots.length - 1,
    undoLabel,
    redoLabel,
    push,
    undo,
    redo,
    clear,
  };
}

/**
 * Remove every per-design history key from localStorage that isn't in
 * the supplied liveIds set. Called from the canvas's cleanup effect
 * alongside the URL + override map cleanup, so closing a design also
 * drops its undo stack.
 */
export function pruneHistoryStorage(liveIds: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) keys.push(k);
    }
    for (const k of keys) {
      const designId = k.slice(STORAGE_PREFIX.length);
      if (!liveIds.has(designId)) {
        window.localStorage.removeItem(k);
      }
    }
  } catch {
    /* ignore */
  }
}
