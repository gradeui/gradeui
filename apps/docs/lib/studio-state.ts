"use client";

/**
 * studio-state — undo/redo history for a ThemeInput being edited in /studio.
 *
 * A tiny, purpose-built history hook: it owns a linear stack of `ThemeInput`
 * snapshots plus a cursor, and exposes `present`, `set`, `undo`, `redo`,
 * `reset`, and derived boolean flags. Nothing here reaches into the theme
 * provider — /studio keeps its working theme isolated from the site-wide
 * theme so the user can play without polluting the rest of the app.
 *
 * State shape:
 *   stack = [initialInput, edit1, edit2, edit3]
 *                                           ^ cursor
 *
 * Every `set()` call truncates anything after the cursor (standard
 * undo-stack behaviour — redo history dies when you make a new edit).
 */

import { useCallback, useMemo, useState } from "react";
import type { ThemeInput } from "./themes";

export interface StudioHistory {
  /** The input currently applied to the preview. */
  present: ThemeInput;
  /** Replace `present` with a new input. Pushes to the stack + advances
   *  cursor; truncates any forward (redo) history. */
  set: (next: ThemeInput) => void;
  /** Convenience: call `fn(present)` and push the result. */
  update: (fn: (prev: ThemeInput) => ThemeInput) => void;
  /** Step cursor back one. No-op at the start of the stack. */
  undo: () => void;
  /** Step cursor forward one. No-op at the top of the stack. */
  redo: () => void;
  /** Snap back to the initial input the history was seeded with. Clears
   *  forward history and seeds a fresh stack. */
  reset: () => void;
  /** Replace the initial anchor + clear history — used when the user loads
   *  a different theme as the new baseline. */
  rebase: (next: ThemeInput) => void;
  /** True if undo() would do something. */
  canUndo: boolean;
  /** True if redo() would do something. */
  canRedo: boolean;
  /** True if the present input differs from the initial anchor. Cheap
   *  reference compare — we always push new objects so identity is stable. */
  isDirty: boolean;
}

/**
 * Seed a history with an initial ThemeInput. `initial` becomes both the
 * anchor (what reset() restores to) and the first element of the stack.
 */
export function useStudioHistory(initial: ThemeInput): StudioHistory {
  // Keep `initial` in state too so rebase() can change it without us having
  // to change component identity. A single atom holds the full history.
  const [state, setState] = useState<{
    initial: ThemeInput;
    stack: ThemeInput[];
    cursor: number;
  }>(() => ({
    initial,
    stack: [initial],
    cursor: 0,
  }));

  const present = state.stack[state.cursor];

  const set = useCallback((next: ThemeInput) => {
    setState((prev) => {
      // No-op if identical to current — avoids history pollution when
      // a control fires change events for the same value (range sliders
      // are notorious for this).
      if (prev.stack[prev.cursor] === next) return prev;
      const nextStack = prev.stack.slice(0, prev.cursor + 1);
      nextStack.push(next);
      return { ...prev, stack: nextStack, cursor: nextStack.length - 1 };
    });
  }, []);

  const update = useCallback(
    (fn: (prev: ThemeInput) => ThemeInput) => {
      setState((prev) => {
        const current = prev.stack[prev.cursor];
        const next = fn(current);
        if (next === current) return prev;
        const nextStack = prev.stack.slice(0, prev.cursor + 1);
        nextStack.push(next);
        return { ...prev, stack: nextStack, cursor: nextStack.length - 1 };
      });
    },
    []
  );

  const undo = useCallback(() => {
    setState((prev) =>
      prev.cursor > 0 ? { ...prev, cursor: prev.cursor - 1 } : prev
    );
  }, []);

  const redo = useCallback(() => {
    setState((prev) =>
      prev.cursor < prev.stack.length - 1
        ? { ...prev, cursor: prev.cursor + 1 }
        : prev
    );
  }, []);

  const reset = useCallback(() => {
    setState((prev) => ({
      initial: prev.initial,
      stack: [prev.initial],
      cursor: 0,
    }));
  }, []);

  const rebase = useCallback((next: ThemeInput) => {
    setState({ initial: next, stack: [next], cursor: 0 });
  }, []);

  return useMemo<StudioHistory>(
    () => ({
      present,
      set,
      update,
      undo,
      redo,
      reset,
      rebase,
      canUndo: state.cursor > 0,
      canRedo: state.cursor < state.stack.length - 1,
      isDirty: present !== state.initial,
    }),
    [present, set, update, undo, redo, reset, rebase, state.cursor, state.stack.length, state.initial]
  );
}

/**
 * Deep-clone a ThemeInput so updates don't mutate a shared built-in object.
 * Uses structuredClone when available, falls back to JSON round-trip.
 */
export function cloneInput(input: ThemeInput): ThemeInput {
  if (typeof structuredClone === "function") return structuredClone(input);
  return JSON.parse(JSON.stringify(input)) as ThemeInput;
}
