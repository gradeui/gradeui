"use client";

/**
 * /studio — three-column design workbench.
 *
 * Layout:
 *   ┌──────────────┬────────────────────────┬────────────────┐
 *   │              │                        │                │
 *   │  Chat        │  Live preview (screen  │  Tabbed panel  │
 *   │  (left)      │  theme applied)        │  (Layout/Theme │
 *   │              │                        │  /Notes)       │
 *   └──────────────┴────────────────────────┴────────────────┘
 *
 * Two themes are in play, deliberately decoupled:
 *
 *   - **Chrome theme** — owned by GradeThemeProvider higher up the
 *     tree. Drives the docs site's CSS variables on `:root`. Switched
 *     via the chrome popover (GradeThemeSwitcher) + the chrome's
 *     ThemeToggle.
 *   - **Screen theme** — owned by a page-level ThemeBuilderProvider
 *     (`bindTo="draft"`). Drives the preview iframes only — no
 *     `:root` mutation. The Theme tab in the right column is the
 *     editor for this; the canvas reads `useGeneratedTheme()` and
 *     `useThemeBuilderMode()` to pipe theme + mode into the iframe.
 *
 * The screen theme seeds once from whatever chrome theme is active
 * when Studio mounts. After that, the two diverge — chrome changes
 * don't reseed the screens, and screen edits don't touch the chrome.
 *
 * The right column is a tabbed shell (`StudioRightTabs`):
 *
 *   - Layout (default) — stage-aware: reference-layout starter picker
 *     when the design is empty, page-structure placeholder when not,
 *     the StudioSettingsPanel when a DS component is selected in the
 *     preview.
 *   - Theme — picker (registered themes) + the full builder controls
 *     (mode, hue sliders, typography, shape, components). All wired
 *     to the page-level ThemeBuilderProvider.
 *   - Notes — per-design free-form text, owned by `notesByDesign`
 *     here and threaded down.
 *
 * Dev-only toggles (renderer, user tier) live behind a gear-icon
 * popover in the chrome (`StudioSettingsPopover`).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { UIMessage } from "ai";
import {
  ProviderPicker,
  useChatSettings,
} from "@/components/ai-elements/provider-picker";
import { ThemeToggle } from "@/components/theme-toggle";
import { GradeThemeSwitcher } from "@/components/grade-theme-switcher";
import { StudioChat } from "@/components/studio/studio-chat";
import { StudioCanvas } from "@/components/studio/studio-canvas";
import { StudioRightTabs } from "@/components/studio/studio-right-tabs";
import { StudioSettingsPopover } from "@/components/studio/studio-settings-popover";
import { useGradeTheme } from "@/components/grade-theme-provider";
import {
  ThemeBuilderProvider,
  useGeneratedTheme,
  useThemeBuilderMode,
} from "@/components/theme-builder";
import {
  studioInput,
  type GeneratedTheme,
  type ThemeInput,
} from "@/lib/themes";
import { cloneInput } from "@/lib/studio-state";
import {
  type StudioSelection,
} from "@/lib/chat-sandpack";
import { buildSystemPrompt } from "@gradeui/studio/playbook";
import {
  createDesign,
  initialDesigns,
  type Design,
} from "@/lib/studio-designs";
import { useUndoHistory, pruneHistoryStorage } from "@/lib/use-undo-history";
import { GRADEUI_VERSION, STUDIO_VERSION } from "@/lib/versions";

// The system prompt now lives in `@gradeui/studio/playbook` — same text
// previously duplicated here and in `app/chat/page.tsx`. See `buildSystemPrompt`
// above in the import list.

export default function StudioPage() {
  const [settings, updateSettings] = useChatSettings();
  const { theme: siteTheme, isDark: chromeIsDark } = useGradeTheme();
  const systemPrompt = useMemo(() => buildSystemPrompt(), []);

  // The screen-level draft theme — seeded once from whatever chrome
  // theme is active when Studio mounts. After that, the Theme tab in
  // the right column owns it independently (see ThemePickerSection +
  // ThemeBuilderControls). bindTo="draft" so slider edits don't
  // mutate `:root` — the canvas reads useGeneratedTheme() and applies
  // the result inside the preview iframe only. Switching the chrome
  // theme via GradeThemeSwitcher does NOT reseed the draft, by
  // design — chrome and screens are deliberately decoupled here.
  //
  // Defensive `?? studioInput`: while `siteTheme.input` is typed as
  // required, the first render before GradeThemeProvider hydrates
  // could in principle return a value without it. Studio is the
  // chrome default so it's also the safest screen-baseline fallback.
  const screenThemeBaseline = useMemo<ThemeInput>(
    () => cloneInput(siteTheme.input ?? studioInput),
    // Intentional single-shot seed — see comment block above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Multiple in-memory design slots. Switching between them changes which
  // chat + preview are active; the theme stays shared because a design
  // system's whole point is consistency across pages. Not persisted yet —
  // refreshing the page resets to one blank slot.
  const [designs, setDesigns] = useState<Design[]>(() => initialDesigns());
  const [activeId, setActiveId] = useState<string>(() => designs[0].id);

  // Per-design undo / redo for `appSource` (JSX). The hook is
  // self-persisting via localStorage keyed by `designId`, and reseeds
  // automatically when the user switches designs. We push to the
  // history every time appSource changes (chat output, panel edit,
  // fill, etc.) with a label describing the action — the label shows
  // in the undo button's tooltip and the future timeline view.
  //
  // Why appSource-only for v1: it's where 90% of meaningful state
  // lives. Per-design URL maps + overrides are a follow-on snapshot
  // dimension; including them is the natural next step once this
  // path is verified. For today, undoing the JSX is the right
  // primary surface.
  const undoHistory = useUndoHistory<string | null>(activeId);
  // Silent fallback to the first design if activeId goes stale. The
  // useEffect below logs this in dev so we can spot it instead of it
  // hiding a desync between the canvas, the chat, and the tab strip.
  const activeDesign = designs.find((d) => d.id === activeId) ?? designs[0];

  // Dev-only drift warning. If activeId ever points to a design that no
  // longer exists in the list, the fallback above renders designs[0]'s
  // data under a stale id — which is exactly the symptom that shows up
  // as "header says Screen 1, chat says empty, tile grid looks fine".
  // Logging loudly gives us a signal in the console the moment it
  // happens, so we don't have to guess. Production gets no-op.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!designs.some((d) => d.id === activeId)) {
      // eslint-disable-next-line no-console
      console.warn(
        "[studio] activeId points to a missing design — falling back to designs[0].",
        { activeId, designIds: designs.map((d) => d.id) }
      );
    }
  }, [activeId, designs]);

  // Live-broadcast each design's source AND name to localStorage
  // under a stable key so any open "Open preview" tab can re-render
  // via the `storage` event and set its own document.title. JSON
  // shape is { source, name } so the preview can show the screen
  // name in the browser tab too.
  //
  // Cleanup happens in handleCloseDesign so closed designs don't
  // leave orphan entries.
  useEffect(() => {
    if (typeof window === "undefined") return;
    for (const d of designs) {
      const key = `grade:screen:${d.id}`;
      try {
        if (d.appSource) {
          const next = JSON.stringify({ source: d.appSource, name: d.name });
          // Only write when the serialized payload actually changed.
          // `storage` events don't fire in the writer's own tab but
          // they DO fire in every other same-origin tab, so a noisy
          // write would re-render every open preview unnecessarily.
          if (window.localStorage.getItem(key) !== next) {
            window.localStorage.setItem(key, next);
          }
        } else {
          window.localStorage.removeItem(key);
        }
      } catch {
        // storage disabled / quota — silent fallback; the snapshot
        // already in the preview tab stays valid.
      }
    }
  }, [designs]);

  // Per-design chat history. `useChat` from @ai-sdk/react@2 doesn't persist
  // messages by id across remounts — it builds a fresh `Chat` every time.
  // So when the user flips between design tabs (which remounts StudioChat
  // via its `key`), we'd lose the conversation unless we kept a copy up
  // here and replayed it as `initialMessages`.
  //
  // Keyed by designId; value is the latest UIMessage[] the chat has emitted.
  const [messagesByDesign, setMessagesByDesign] = useState<
    Record<string, UIMessage[]>
  >({});

  // Which designs are currently generating. Shown as a spinner overlay on
  // the preview column whenever the active design is streaming — the design
  // tabs could also grow a pulsing dot later if it ever becomes useful.
  const [streamingByDesign, setStreamingByDesign] = useState<
    Record<string, boolean>
  >({});

  // Per-design preview selection — the element the user picked via the
  // "Select" tool in the preview header. Lives up here (rather than inside
  // StudioPreview or StudioChat) because BOTH columns need it:
  //   - StudioPreview drives the in-iframe overlay state from it.
  //   - StudioChat renders the selection chip + snapshots it into the
  //     outgoing request body.
  // Clearing happens on chip-×, on preview-toggle-off, and implicitly after
  // send (StudioChat calls onClearSelection in handleSend).
  const [selectionByDesign, setSelectionByDesign] = useState<
    Record<string, StudioSelection | null>
  >({});

  // Per-design free-form notes — the "Notes" tab in the right column
  // is bound to `notesByDesign[activeId]`. Plain string per design;
  // not persisted across page reloads yet (same model as the other
  // per-design state maps). Cleaned up alongside the others in
  // handleCloseDesign so closed designs don't leak.
  const [notesByDesign, setNotesByDesign] = useState<Record<string, string>>(
    {},
  );

  const handleNotesChange = useCallback(
    (next: string) => {
      setNotesByDesign((m) => ({ ...m, [activeId]: next }));
    },
    [activeId],
  );

  // Session resume — persist the working session (designs, active
  // tab, per-design chat history and notes) so a page refresh
  // doesn't wipe the user's work. Mirrors what a "logged-in
  // product" feels like, minus the server.
  //
  // Two effects:
  //   1. On mount, hydrate from localStorage. Runs once.
  //   2. On every change, write the snapshot back to localStorage.
  //
  // Ephemeral state (streamingByDesign, selectionByDesign) is NOT
  // persisted — those should start fresh on every load.
  //
  // Lives below all the relevant `useState` declarations so the
  // setters are in scope when this effect's dep array evaluates.
  // Once a real persistence layer lands this becomes the fallback
  // for offline / signed-out states.
  const STUDIO_SESSION_KEY = "grade:studio:session";
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STUDIO_SESSION_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        designs?: Design[];
        activeId?: string;
        messagesByDesign?: Record<string, UIMessage[]>;
        notesByDesign?: Record<string, string>;
      };
      if (
        parsed &&
        Array.isArray(parsed.designs) &&
        parsed.designs.length > 0
      ) {
        setDesigns(parsed.designs);
        if (
          parsed.activeId &&
          parsed.designs.some((d) => d.id === parsed.activeId)
        ) {
          setActiveId(parsed.activeId);
        }
        if (
          parsed.messagesByDesign &&
          typeof parsed.messagesByDesign === "object"
        ) {
          setMessagesByDesign(parsed.messagesByDesign);
        }
        if (
          parsed.notesByDesign &&
          typeof parsed.notesByDesign === "object"
        ) {
          setNotesByDesign(parsed.notesByDesign);
        }
      }
    } catch {
      // Corrupt / unparseable session blob — keep the default seed.
    }
    // Intentional empty deps — hydrate exactly once on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STUDIO_SESSION_KEY,
        JSON.stringify({
          designs,
          activeId,
          messagesByDesign,
          notesByDesign,
        }),
      );
    } catch {
      /* storage disabled / quota — accept the loss silently */
    }
  }, [designs, activeId, messagesByDesign, notesByDesign]);

  const [view, setView] = useState<"preview" | "code">("preview");

  // Dev toggles in the header chrome. Scaffolding for the upcoming
  // renderer split + tier gating — surfaced now so the controls exist
  // before the features they drive.
  //
  // rendererMode: currently forwarded to StudioCanvas but only acted on
  // once the fast renderer lands (step 5 of the renderer rollout). Until
  // then both values render Sandpack — the toggle is visible but
  // effectively a no-op. Default stays "sandpack" to preserve today's
  // behavior; it flips to "fast" the day FocusedFastMount ships.
  //
  // userTier: placeholder for visibility-gated UI. No consumer yet —
  // when pro/enterprise-only chrome lands (e.g. exporting to a per-
  // client starter, hiding the npm path for free), read this state.
  const [rendererMode, setRendererMode] =
    useState<"sandpack" | "fast">("fast");
  const [userTier, setUserTier] =
    useState<"free" | "pro" | "enterprise">("free");

  const handleLatestCode = useCallback(
    (code: string | null) => {
      // Scope the update to whichever design produced the code. The chat
      // component fires this on every `setMessages` including the
      // post-switch hydration — we write through either way; it's idempotent
      // if the code is unchanged.
      setDesigns((ds) =>
        ds.map((d) => {
          if (d.id !== activeId) return d;
          // Prose-only replies (no JSX fence) come through as null /
          // empty. Don't let those wipe an existing preview — the
          // user just asked a clarifying question or got a "no code
          // changes needed" explanation; the previous render should
          // stay on screen.
          const isEmpty = code == null || code.trim() === "";
          if (isEmpty && d.appSource) return d;
          // Push the OLD value to history before committing the new
          // one — undo restores to the previous state. We only push
          // when the value actually changed (no-op chats from the
          // model don't litter the undo stack).
          if (d.appSource !== code) {
            undoHistory.push(d.appSource ?? null, "Chat edit");
          }
          return { ...d, appSource: code, updatedAt: Date.now() };
        })
      );
    },
    [activeId]
  );

  // Source mutation that came from the settings panel, the Fill button,
  // or any other in-canvas tool (not the LLM). Pushes the previous
  // appSource to the undo history before writing the new one — every
  // non-chat edit becomes its own undo step. Same write-through path as
  // handleLatestCode otherwise.
  //
  // The optional `label` parameter lets callers attach a human-readable
  // tag ("Fill images", "Change hint to poster") to the snapshot so the
  // undo button's tooltip can show "Undo Fill images" rather than a
  // generic "Undo". Callers that don't care can omit it — the hook
  // defaults to "Edit".
  const handleSourceMutation = useCallback(
    (nextSource: string, label?: string) => {
      setDesigns((ds) =>
        ds.map((d) => {
          if (d.id !== activeId) return d;
          if (d.appSource === nextSource) return d;
          undoHistory.push(d.appSource ?? null, label ?? "Edit");
          return { ...d, appSource: nextSource, updatedAt: Date.now() };
        })
      );
    },
    [activeId, undoHistory]
  );

  // Undo / redo — restore the previous (or next) snapshot from the
  // per-design history into the active design's appSource. The hook
  // returns the snapshot value synchronously, so we wire it straight to
  // setDesigns. We DO NOT push the current state to history before
  // restoring — the redo direction is what makes the current state
  // recoverable (the hook keeps the redo-future intact until the next
  // push() displaces it).
  const handleUndo = useCallback(() => {
    const previous = undoHistory.undo();
    if (previous === null) return;
    setDesigns((ds) =>
      ds.map((d) =>
        d.id === activeId
          ? { ...d, appSource: previous ?? undefined, updatedAt: Date.now() }
          : d,
      ),
    );
  }, [activeId, undoHistory]);

  const handleRedo = useCallback(() => {
    const next = undoHistory.redo();
    if (next === null) return;
    setDesigns((ds) =>
      ds.map((d) =>
        d.id === activeId
          ? { ...d, appSource: next ?? undefined, updatedAt: Date.now() }
          : d,
      ),
    );
  }, [activeId, undoHistory]);

  // Global keyboard shortcuts — Cmd/Ctrl-Z to undo, Cmd/Ctrl-Shift-Z
  // (and Cmd/Ctrl-Y on non-mac) to redo. Lives at the page level so the
  // shortcuts work from anywhere in /studio — even when focus is in
  // the chat input or the settings panel. We skip when the target is a
  // contentEditable / form element with its own undo stack (input,
  // textarea) to avoid hijacking the browser's native text-undo.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      // Native form fields have their own per-field undo. Honour that
      // for plain text inputs; for the canvas-level undo, the user can
      // click the buttons or focus a non-input first.
      const tag = target?.tagName;
      const editable = !!(
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        target?.isContentEditable
      );
      const cmd = e.metaKey || e.ctrlKey;
      if (!cmd) return;
      const key = e.key.toLowerCase();
      // Redo: cmd+shift+z OR cmd+y. Both are common bindings; supporting
      // both means muscle memory from either platform works.
      const isRedo =
        (key === "z" && e.shiftKey) || (key === "y" && !e.shiftKey);
      const isUndo = key === "z" && !e.shiftKey;
      if (!isUndo && !isRedo) return;
      if (editable) return; // let the field handle its own undo
      e.preventDefault();
      if (isUndo) handleUndo();
      else handleRedo();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleUndo, handleRedo]);

  const handleMessagesChange = useCallback(
    (next: UIMessage[]) => {
      // Cache this design's conversation so the tab remembers it on remount.
      // Cheap because UIMessage[] identity changes on every useful update —
      // we just swap the reference into the map.
      setMessagesByDesign((cache) => ({ ...cache, [activeId]: next }));
    },
    [activeId]
  );

  const handleStreamingChange = useCallback(
    (isStreaming: boolean) => {
      setStreamingByDesign((s) => {
        // Bail early if nothing changed — avoids needless re-renders while
        // the chat status flips around (`ready` → `submitted` → `streaming`
        // → `ready` fires a few times).
        if (Boolean(s[activeId]) === isStreaming) return s;
        return { ...s, [activeId]: isStreaming };
      });
    },
    [activeId]
  );

  const handleSelect = useCallback(
    (selection: StudioSelection) => {
      setSelectionByDesign((m) => ({ ...m, [activeId]: selection }));
    },
    [activeId]
  );

  const handleClearSelection = useCallback(() => {
    setSelectionByDesign((m) => {
      if (m[activeId] == null) return m; // already clear — no new ref needed
      return { ...m, [activeId]: null };
    });
  }, [activeId]);

  // Canvas scope cap — the "All" zoom mounts one Sandpack per design in
  // parallel, so we cap the count rather than let the user degrade their
  // own session. Empirically 8 is the point where boot latency of a
  // cold "All" flip starts to feel laggy on a mid-range laptop.
  const MAX_DESIGNS = 8;
  const atCap = designs.length >= MAX_DESIGNS;

  // Add a blank design and focus it. Previously this called setActiveId
  // from INSIDE a setDesigns updater — which React's strict-mode runs
  // twice, and because createDesign uses Date.now() + Math.random()
  // each pass mints a different id. The activeId + the id in state
  // *usually* coincide because React batches the last-wins setter, but
  // setState-inside-an-updater is a documented anti-pattern and it's
  // the exact shape of bug that produces "added a screen, nothing's
  // focused" drift. Now we compute the new design once, queue both
  // setters at the top level, and React batches them into one render.
  //
  // Optional `seed` lets the StarterPicker (#45/#46) spawn a screen
  // pre-filled with a reference-layout scaffold or pasted JSX. Keeping
  // the "blank screen" shape as the default — `handleAddDesign()` with
  // no args still works — so the DesignTabs "+ New" button stays
  // one-click frictionless.
  const handleAddDesign = useCallback(
    (seed?: { source: string; name?: string }) => {
      if (designs.length >= MAX_DESIGNS) return;
      const fresh = createDesign(designs.length, seed?.name);
      const next: Design = seed?.source
        ? { ...fresh, appSource: seed.source }
        : fresh;
      setDesigns((ds) => (ds.length >= MAX_DESIGNS ? ds : [...ds, next]));
      setActiveId(next.id);
    },
    [designs.length]
  );

  // Clone an existing design's JSX into a fresh slot. Copies the
  // appSource but NOT the chat history — for a wizard/flow-step
  // workflow you almost always want the new page to start from a fresh
  // conversation (the chat targets "this screen" so cross-pollinating
  // history is more confusing than helpful). Insertion order: the
  // duplicate lands immediately after its source so the flow reads left
  // to right in the canvas grid.
  //
  // Same refactor as handleAddDesign — setActiveId lives outside the
  // setDesigns updater now. The source lookup + fresh id minting
  // happen against the current render's `designs`; that's fine because
  // the user is clicking an affordance they can see, so the array is
  // already up to date by the time this fires.
  const handleDuplicateDesign = useCallback(
    (id: string) => {
      if (designs.length >= MAX_DESIGNS) return;
      const source = designs.find((d) => d.id === id);
      if (!source) return;
      const fresh = createDesign(designs.length, `${source.name} copy`);
      const duplicate: Design = { ...fresh, appSource: source.appSource };
      const srcIdx = designs.findIndex((d) => d.id === id);
      setDesigns((ds) => {
        if (ds.length >= MAX_DESIGNS) return ds;
        const out = [...ds];
        // Recompute the insertion index against the *freshest* array
        // inside the updater — guards against a concurrent add having
        // shifted positions between render and commit.
        const liveIdx = ds.findIndex((d) => d.id === id);
        out.splice(liveIdx >= 0 ? liveIdx + 1 : srcIdx + 1, 0, duplicate);
        return out;
      });
      setActiveId(duplicate.id);
    },
    [designs]
  );

  const handleCloseDesign = useCallback(
    (id: string) => {
      if (designs.length <= 1) return; // Guardrail — never close the last one.
      // Precompute the fallback activeId against the CURRENT designs so
      // we don't call setActiveId from inside the setDesigns updater
      // (strict-mode runs updaters twice; side-effects inside them are
      // a React anti-pattern that bit us once already).
      const idx = designs.findIndex((d) => d.id === id);
      const remaining = designs.filter((d) => d.id !== id);
      const nextActiveId =
        id === activeId
          ? remaining[Math.max(0, idx - 1)]?.id ?? remaining[0]?.id
          : activeId;

      setDesigns((ds) =>
        ds.length <= 1 ? ds : ds.filter((d) => d.id !== id)
      );
      if (nextActiveId && nextActiveId !== activeId) {
        setActiveId(nextActiveId);
      }
      // Release the cached conversation for the closed design. If we ever
      // add "reopen tab" this is the line to revisit.
      setMessagesByDesign((cache) => {
        if (!(id in cache)) return cache;
        const { [id]: _drop, ...rest } = cache;
        return rest;
      });
      setStreamingByDesign((s) => {
        if (!(id in s)) return s;
        const { [id]: _drop, ...rest } = s;
        return rest;
      });
      setSelectionByDesign((m) => {
        if (!(id in m)) return m;
        const { [id]: _drop, ...rest } = m;
        return rest;
      });
      setNotesByDesign((m) => {
        if (!(id in m)) return m;
        const { [id]: _drop, ...rest } = m;
        return rest;
      });
      // Clear the live-preview localStorage key for this design so
      // orphan entries don't pile up across sessions. Any open
      // preview tab pointed at this design will fire a `storage`
      // event with `newValue: null` and clear itself.
      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(`grade:screen:${id}`);
        } catch {
          /* storage disabled — nothing to clean */
        }
      }
      // Drop the per-design undo history too. `pruneHistoryStorage`
      // takes the SET of designs that should remain — we pass every
      // remaining id (minus the closing one). The hook persistence
      // effect won't re-write the closed design's key after this
      // because the consumer state-slot is gone.
      pruneHistoryStorage(new Set(remaining.map((d) => d.id)));
    },
    [activeId, designs]
  );

  const handleRenameDesign = useCallback((id: string, name: string) => {
    setDesigns((ds) =>
      ds.map((d) =>
        d.id === id ? { ...d, name, updatedAt: Date.now() } : d,
      ),
    );
  }, []);

  return (
    <ThemeBuilderProvider
      initial={screenThemeBaseline}
      bindTo="draft"
      defaultMode={chromeIsDark ? "dark" : "light"}
    >
      <div className="flex flex-col h-screen bg-background overflow-hidden">
        <div className="border-b bg-muted/30 shrink-0">
          {/* Full-bleed — no max-width wrapper. Studio is a tool, not a
              marketing page, so the chrome stretches edge-to-edge. */}
          <div className="px-4 md:px-6 py-2.5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-base font-semibold leading-tight">
                Grade Studio
              </h1>
              {/* Versions — deliberately technical copy. This is a
                  pre-release tool and we want bug reports to carry the
                  exact revision. @gradeui/studio is still 0.0.0 while
                  the package is being carved out; it'll start bumping
                  once the Studio shell stabilises. */}
              <p className="text-[11px] text-muted-foreground font-mono leading-tight">
                <span>@gradeui/ui v{GRADEUI_VERSION}</span>
                <span className="mx-1.5 opacity-50">·</span>
                <span>@gradeui/studio v{STUDIO_VERSION}</span>
              </p>
            </div>
            {/* Right-hand chrome cluster. Order mirrors how often a
                designer reaches for each: model picker > theme > mode.
                Mode/theme both flip the CHROME (site-wide theme), not
                the preview iframe — the preview's mode + draft theme
                are owned by the builder panel on the right of the page. */}
            <div className="flex items-center gap-1">
              <ProviderPicker settings={settings} onChange={updateSettings} />
              <div className="mx-1 h-5 w-px bg-border" aria-hidden />
              <GradeThemeSwitcher />
              <ThemeToggle />
              <div className="mx-1 h-5 w-px bg-border" aria-hidden />
              {/* Dev-only toggles (renderer + user tier) live behind
                  the gear icon now — they were crowding the chrome row
                  and they're session-local, so the popover is the
                  right home. See `StudioSettingsPopover` for the
                  shape; both pieces of state still live on this page
                  so other parts of the tree can read them. */}
              <StudioSettingsPopover
                rendererMode={rendererMode}
                onRendererModeChange={setRendererMode}
                userTier={userTier}
                onUserTierChange={setUserTier}
              />
            </div>
          </div>
        </div>

        {/* Design tabs used to live here as a separate strip above the
            three-column main area. They were an artifact of the pre-
            Fit/All world where there was only one preview at a time, so
            the page owned screen navigation. Now the canvas owns it —
            tabs render inside StudioCanvas in Fit mode, and the tile
            grid takes over in All mode. The page just forwards the
            design-management callbacks down. */}

        <main className="flex-1 min-h-0 p-3 md:p-4">
          <div
            className="grid h-full gap-3 md:gap-4"
            style={{
              // CSS-grid-based three-column shell. Chat and builder are fixed-
              // ish sidebars; the preview grabs the rest. The `minmax(0, 1fr)`
              // is crucial — without the 0 minimum, Sandpack's iframe refuses
              // to shrink below its intrinsic width on narrower laptops.
              gridTemplateColumns:
                "minmax(280px, 340px) minmax(0, 1fr) minmax(280px, 360px)",
              // Pin the single row to 1fr with a 0 min so tall children
              // (Sandpack layout, chat column) can actually fill the row
              // instead of the row collapsing to content height.
              gridTemplateRows: "minmax(0, 1fr)",
            }}
          >
            {/* `key` keyed to activeId so chat + preview remount cleanly on
                switch. On remount the chat is re-seeded with the cached
                `UIMessage[]` for this design (see `messagesByDesign`), so the
                conversation survives round-trips between designs even though
                `useChat` itself does not persist by id. */}
            <StudioChat
              key={`chat-${activeId}`}
              chatId={activeId}
              settings={settings}
              systemPrompt={systemPrompt}
              initialMessages={messagesByDesign[activeId]}
              onMessagesChange={handleMessagesChange}
              onStreamingChange={handleStreamingChange}
              onLatestCode={handleLatestCode}
              currentCode={activeDesign.appSource}
              selection={selectionByDesign[activeId] ?? null}
              onClearSelection={handleClearSelection}
              onSourceMutation={handleSourceMutation}
              // Settings panel always lives on the right (inside the
              // Layout tab) under the new tabbed shell. Force `docked`
              // so the chat column never duplicates it.
              settingsPanelDocked
            />
            {/* Canvas replaces the single-iframe StudioPreview. It owns
                its own header (zoom toggle + preview/code + select +
                npm) and renders either the focused design full-size or
                a grid of tiles, per the canvas zoom mode. */}
            <StudioThemedCanvas
              designs={designs}
              focusedId={activeId}
              onFocus={setActiveId}
              view={view}
              onViewChange={setView}
              isStreaming={Boolean(streamingByDesign[activeId])}
              selection={selectionByDesign[activeId] ?? null}
              onSelect={handleSelect}
              onClearSelection={handleClearSelection}
              onAddDesign={handleAddDesign}
              onCloseDesign={handleCloseDesign}
              onRenameDesign={handleRenameDesign}
              onDuplicateDesign={handleDuplicateDesign}
              canAddMore={!atCap}
              onSourceMutation={handleSourceMutation}
              rendererMode={rendererMode}
              canUndo={undoHistory.canUndo}
              canRedo={undoHistory.canRedo}
              undoLabel={undoHistory.undoLabel}
              redoLabel={undoHistory.redoLabel}
              onUndo={handleUndo}
              onRedo={handleRedo}
            />
            {/* Right column: tabbed shell. Layout (stage-aware) by
                default, Theme (existing builder, scoped to its own
                provider), Notes (per-design free-form text). */}
            <StudioRightTabs
              appSource={activeDesign.appSource}
              selection={selectionByDesign[activeId] ?? null}
              onSourceChange={handleSourceMutation}
              notes={notesByDesign[activeId] ?? ""}
              onNotesChange={handleNotesChange}
              designName={activeDesign.name}
            />
          </div>
        </main>
      </div>
    </ThemeBuilderProvider>
  );
}

/**
 * Small helper that reads the SCREEN draft theme + mode off the
 * ThemeBuilderProvider and forwards them into StudioCanvas. The draft
 * is independent of the chrome theme — the Theme tab in the right
 * column drives this exclusively, so the canvas re-skins on slider
 * drag, mode flip, and theme-picker rebase but the docs chrome stays
 * untouched.
 *
 * Unlike its StudioThemedPreview predecessor we do NOT key on activeId
 * here: the canvas spans every design and only shifts its focus when
 * activeId changes, so remounting would thrash every mounted iframe.
 */
function StudioThemedCanvas({
  designs,
  focusedId,
  onFocus,
  view,
  onViewChange,
  isStreaming,
  selection,
  onSelect,
  onClearSelection,
  onAddDesign,
  onCloseDesign,
  onRenameDesign,
  onDuplicateDesign,
  canAddMore,
  onSourceMutation,
  rendererMode,
  canUndo,
  canRedo,
  undoLabel,
  redoLabel,
  onUndo,
  onRedo,
}: {
  designs: Design[];
  focusedId: string;
  onFocus: (id: string) => void;
  view: "preview" | "code";
  onViewChange: (v: "preview" | "code") => void;
  isStreaming: boolean;
  selection: StudioSelection | null;
  onSelect: (selection: StudioSelection) => void;
  onClearSelection: () => void;
  onAddDesign: (seed?: { source: string; name?: string }) => void;
  onCloseDesign: (id: string) => void;
  onRenameDesign: (id: string, name: string) => void;
  onDuplicateDesign?: (id: string) => void;
  canAddMore: boolean;
  onSourceMutation: (next: string) => void;
  rendererMode: "sandpack" | "fast";
  canUndo: boolean;
  canRedo: boolean;
  undoLabel: string | null;
  redoLabel: string | null;
  onUndo: () => void;
  onRedo: () => void;
}) {
  const theme: GeneratedTheme = useGeneratedTheme();
  const [mode] = useThemeBuilderMode();
  return (
    <StudioCanvas
      designs={designs}
      focusedId={focusedId}
      onFocus={onFocus}
      theme={theme}
      mode={mode}
      view={view}
      onViewChange={onViewChange}
      isStreaming={isStreaming}
      selection={selection}
      onSelect={onSelect}
      onClearSelection={onClearSelection}
      onAddDesign={onAddDesign}
      onCloseDesign={onCloseDesign}
      onRenameDesign={onRenameDesign}
      onDuplicateDesign={onDuplicateDesign}
      canAddMore={canAddMore}
      onSourceMutation={onSourceMutation}
      rendererMode={rendererMode}
      canUndo={canUndo}
      canRedo={canRedo}
      undoLabel={undoLabel}
      redoLabel={redoLabel}
      onUndo={onUndo}
      onRedo={onRedo}
    />
  );
}
