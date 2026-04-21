"use client";

/**
 * ThemeBuilderProvider — the composable-primitive root for the theme builder.
 *
 * Modelled on Sandpack's provider-plus-primitives pattern: one provider owns
 * all the state (working ThemeInput, history, mode, binding target) and
 * exposes it via hooks; composable child components (Header, Controls,
 * Footer, Scope) consume that context and render their slice of the UI.
 *
 * This lets a host drop the theme builder anywhere — popover, modal, side
 * panel, full screen, partial pane — just by arranging the children:
 *
 *   <ThemeBuilderProvider initial={someInput} bindTo="site">
 *     <ThemeBuilderHeader />
 *     <ThemeBuilderControls />
 *     <ThemeBuilderFooter />
 *   </ThemeBuilderProvider>
 *
 * Three binding modes cover every surface we care about:
 *
 *   1. "site"   — the source of truth is the live site theme (via
 *                 useGradeTheme). Slider changes live-write the CSS vars on
 *                 :root so the whole docs site reflects the edit instantly.
 *                 `save()` calls `saveAndActivate` to persist the user
 *                 theme + switch the site over.
 *
 *   2. "scoped" — the working input stays internal; the generated CSS vars
 *                 are applied only inside a <ThemeBuilderScope> subtree the
 *                 host renders wherever it wants the preview to appear.
 *                 `save()` optionally calls the `onSave` callback for the
 *                 host to handle persistence.
 *
 *   3. "draft"  — the working input is purely local state; no side effects
 *                 on :root or any subtree. The host pulls the generated
 *                 theme via `useGeneratedTheme()` and renders a preview
 *                 however it wants (e.g. /studio pipes it into Sandpack).
 *                 `save()` calls `onSave` if provided.
 *
 * In all three modes the state machine is identical — a linear history
 * stack with undo / redo / reset / rebase via `useStudioHistory`.
 */

import * as React from "react";
import {
  generateTheme,
  applyThemeToRoot,
  downloadThemeMarkdown,
  type ThemeInput,
  type GeneratedTheme,
} from "@/lib/themes";
import { useStudioHistory, cloneInput } from "@/lib/studio-state";
import { useMaybeGradeTheme } from "@/components/grade-theme-provider";

/* ──────────────────────────────────────────────────────────────────────
   Context shape
   ────────────────────────────────────────────────────────────────────── */

export type ThemeBuilderBindTo = "site" | "scoped" | "draft";

export interface ThemeBuilderContextValue {
  /** The working ThemeInput — what every control reads + writes. */
  input: ThemeInput;
  /** The pre-computed GeneratedTheme from the current input. Kept on the
   *  context so multiple consumers (Scope, preview callbacks) don't each
   *  run the generator. */
  generated: GeneratedTheme;
  /** Replace the whole input with a new snapshot. Pushes onto history. */
  setInput: (next: ThemeInput) => void;
  /** Mutate a deep-cloned draft; the mutation is committed as a new
   *  history entry. The ergonomic API that matches the old `patch(fn)`. */
  patch: (fn: (draft: ThemeInput) => void) => void;

  /** Current preview mode — light or dark. Independent of site mode
   *  (except in bindTo="site" where we mirror the site mode so the CSS
   *  vars applied to :root stay in sync with the live page). */
  mode: "light" | "dark";
  setMode: (mode: "light" | "dark") => void;

  /** History controls. */
  undo: () => void;
  redo: () => void;
  reset: () => void;
  rebase: (next: ThemeInput) => void;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;

  /** Persist the current input. Semantics vary by bindTo — see provider
   *  docstring. Returns the id it persisted under (useful for the host
   *  to re-seed its baseline, etc.). */
  save: () => string | void;
  /** Download the generated theme as markdown. Same behaviour everywhere. */
  exportMarkdown: () => void;

  /** The binding mode this provider was constructed with. Consumers may
   *  key their behaviour off it — e.g. <ThemeBuilderScope> is a no-op in
   *  site + draft modes because nothing's scoped to its subtree. */
  bindTo: ThemeBuilderBindTo;
}

const ThemeBuilderContext =
  React.createContext<ThemeBuilderContextValue | null>(null);

/* ──────────────────────────────────────────────────────────────────────
   Provider
   ────────────────────────────────────────────────────────────────────── */

export interface ThemeBuilderProviderProps {
  children: React.ReactNode;
  /** Seed input. In "site" mode this is normally the live site theme's
   *  input (cloneInput(siteTheme.input)); in other modes it's whatever
   *  starting point the host wants. */
  initial: ThemeInput;
  /** Which surface the edits apply to — see the three modes in the file
   *  docstring. */
  bindTo?: ThemeBuilderBindTo;
  /** Initial preview mode. Defaults to "light" in scoped/draft; in "site"
   *  mode the site's own mode wins on mount. */
  defaultMode?: "light" | "dark";
  /** Callback fired by `save()` in scoped/draft modes. The host decides
   *  what to do with the input — persist to a DB, export a file, post to
   *  an API. Ignored in "site" mode which uses saveAndActivate directly.
   *
   *  If the callback returns a ThemeInput, that becomes the new history
   *  anchor (what `reset()` snaps back to, what `isDirty` compares
   *  against). Useful when the host mutates the input on save — e.g.
   *  stamping a new id or appending a "· Studio" suffix — and wants
   *  subsequent edits measured against that saved version. Returning
   *  void uses the pre-save input as the anchor. */
  onSave?: (
    input: ThemeInput,
    generated: GeneratedTheme
  ) => ThemeInput | void;
  /** Optional override for the export action. Defaults to
   *  downloadThemeMarkdown. */
  onExport?: (generated: GeneratedTheme) => void;
  /** In "site" mode, apply working input to :root live (on every
   *  keystroke / slider tick). Default true. Set false to preview-only
   *  until save — useful when the builder is in a sticky modal and you
   *  don't want the rest of the page flashing under the user. */
  liveApply?: boolean;
}

export function ThemeBuilderProvider({
  children,
  initial,
  bindTo = "draft",
  defaultMode = "light",
  onSave,
  onExport,
  liveApply = true,
}: ThemeBuilderProviderProps) {
  const siteTheme = useMaybeGradeTheme();

  // The provider assumes the caller's `initial` is already a safe clone
  // (StudioPage.baseline does this via cloneInput). If it isn't, the first
  // mutation will blow up the shared singleton. Defensive: we clone once
  // on mount anyway — cheap, and prevents a whole class of bugs.
  const seed = React.useMemo(() => cloneInput(initial), []); // eslint-disable-line react-hooks/exhaustive-deps

  const history = useStudioHistory(seed);

  // Mode: in site mode mirror the site's light/dark split; in others,
  // own local state. We don't try to mirror superLight/superDark — the
  // builder only cares about the binary split.
  const [localMode, setLocalMode] = React.useState<"light" | "dark">(
    defaultMode
  );
  const mode: "light" | "dark" =
    bindTo === "site" && siteTheme
      ? siteTheme.isDark
        ? "dark"
        : "light"
      : localMode;
  const setMode = React.useCallback(
    (next: "light" | "dark") => {
      if (bindTo === "site" && siteTheme) {
        siteTheme.setMode(next);
      } else {
        setLocalMode(next);
      }
    },
    [bindTo, siteTheme]
  );

  // Generated theme — derived once per history snapshot. The generator is
  // pure and cheap but the memo keeps reference identity stable for
  // downstream memoizers (e.g. Sandpack's file diff).
  const generated = React.useMemo(
    () => generateTheme(history.present),
    [history.present]
  );

  // Live-apply for "site" bind mode: on every working-input change, write
  // the CSS vars onto :root so the whole page reflects what's in the
  // builder. Undoing rolls it back the same way. The site's active theme
  // id is unaffected until the user clicks save — which means reload
  // reverts to whichever theme was stored. That's intentional: live
  // edits are a preview, not a commit.
  React.useEffect(() => {
    if (bindTo !== "site" || !liveApply) return;
    if (!siteTheme) return;
    // Apply under the site's full mode (light/dark or super*) so we don't
    // accidentally flip super-light → light on live edits.
    applyThemeToRoot(generated, siteTheme.mode);
  }, [bindTo, liveApply, generated, siteTheme?.mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore the site's actual active theme when the provider unmounts, so
  // closing a "preview" modal without saving doesn't leave :root stuck on
  // the unsaved working theme. We stash the live siteTheme in a ref so
  // the cleanup reads the *latest* value at unmount time (without
  // re-running on every siteTheme change).
  const siteThemeRef = React.useRef(siteTheme);
  React.useEffect(() => {
    siteThemeRef.current = siteTheme;
  }, [siteTheme]);
  React.useEffect(() => {
    if (bindTo !== "site" || !liveApply) return;
    return () => {
      const latest = siteThemeRef.current;
      if (latest) applyThemeToRoot(latest.theme, latest.mode);
    };
  }, [bindTo, liveApply]);

  const patch = React.useCallback(
    (fn: (draft: ThemeInput) => void) => {
      history.update((prev) => {
        const next = cloneInput(prev);
        fn(next);
        return next;
      });
    },
    [history]
  );

  const setInput = React.useCallback(
    (next: ThemeInput) => history.set(next),
    [history]
  );

  const save = React.useCallback((): string | void => {
    const current = history.present;

    if (bindTo === "site" && siteTheme) {
      // Persist as a user theme + switch the site over. If the input is
      // already flagged as a user theme, keep its id; otherwise mint a new
      // one so we don't clobber a built-in.
      const toSave: ThemeInput = {
        ...current,
        id: current.id.startsWith("user:")
          ? current.id
          : `user:${Date.now().toString(36)}`,
      };
      siteTheme.saveAndActivate(toSave);
      history.rebase(toSave);
      onSave?.(toSave, generateTheme(toSave));
      return toSave.id;
    }

    // scoped + draft modes delegate persistence to the host. We still
    // rebase the history so the "Save" button becomes quiet until the
    // next edit — that's the consistent UX across modes. If the host's
    // onSave returned a ThemeInput, prefer that as the rebase target
    // (e.g. after stamping a fresh user:xxx id).
    const result = onSave?.(current, generated);
    const anchor = result ?? current;
    history.rebase(anchor);
    return anchor.id;
  }, [bindTo, siteTheme, history, onSave, generated]);

  const exportMarkdown = React.useCallback(() => {
    if (onExport) {
      onExport(generated);
    } else {
      downloadThemeMarkdown(generated);
    }
  }, [onExport, generated]);

  const value = React.useMemo<ThemeBuilderContextValue>(
    () => ({
      input: history.present,
      generated,
      setInput,
      patch,
      mode,
      setMode,
      undo: history.undo,
      redo: history.redo,
      reset: history.reset,
      rebase: history.rebase,
      canUndo: history.canUndo,
      canRedo: history.canRedo,
      isDirty: history.isDirty,
      save,
      exportMarkdown,
      bindTo,
    }),
    [
      history.present,
      history.undo,
      history.redo,
      history.reset,
      history.rebase,
      history.canUndo,
      history.canRedo,
      history.isDirty,
      generated,
      setInput,
      patch,
      mode,
      setMode,
      save,
      exportMarkdown,
      bindTo,
    ]
  );

  return (
    <ThemeBuilderContext.Provider value={value}>
      {children}
    </ThemeBuilderContext.Provider>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Hooks
   ────────────────────────────────────────────────────────────────────── */

/** Read the theme builder context. Throws if not inside a provider —
 *  downstream primitives always assume a provider is present. */
export function useThemeBuilder(): ThemeBuilderContextValue {
  const ctx = React.useContext(ThemeBuilderContext);
  if (!ctx) {
    throw new Error(
      "useThemeBuilder must be used inside <ThemeBuilderProvider>."
    );
  }
  return ctx;
}

/** Safe variant — returns null outside a provider. Useful for
 *  components that render in both builder + non-builder contexts. */
export function useMaybeThemeBuilder(): ThemeBuilderContextValue | null {
  return React.useContext(ThemeBuilderContext);
}

/** Convenience: just the generated theme. Same reference as
 *  `useThemeBuilder().generated` — handy for hosts that pipe it into
 *  iframe previews. */
export function useGeneratedTheme(): GeneratedTheme {
  return useThemeBuilder().generated;
}

/** Convenience: [mode, setMode] for hosts that want a tuple. */
export function useThemeBuilderMode(): [
  "light" | "dark",
  (next: "light" | "dark") => void,
] {
  const ctx = useThemeBuilder();
  return [ctx.mode, ctx.setMode];
}
