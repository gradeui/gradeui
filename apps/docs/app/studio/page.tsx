"use client";

/**
 * /studio — three-column design + theming workbench.
 *
 * Layout:
 *   ┌──────────────┬────────────────────────┬────────────────┐
 *   │              │                        │                │
 *   │  Chat        │  Live preview (theme   │  Theme builder │
 *   │  (left)      │  applied inline)       │  (right)       │
 *   │              │                        │                │
 *   └──────────────┴────────────────────────┴────────────────┘
 *
 * Theme state is owned by a ThemeBuilderProvider wrapping the whole page
 * — the composable primitive set from components/theme-builder. We run
 * in `bindTo="draft"` so edits only affect the middle-column Sandpack
 * preview, not the docs site itself. The preview pulls the current
 * generated theme + mode from the provider's hooks, so slider drags
 * flow straight into the iframe.
 *
 * Saving (via the builder footer) is handled by `handleThemeSave` below
 * — it mints a `user:…` id + "· Studio" name suffix and pushes through
 * saveAndActivate, which persists + switches the whole site over. The
 * provider's history rebases to the saved version so the Save button
 * goes quiet until the next edit.
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
import { StudioSettingsPanel } from "@/components/studio/settings-panel";
import {
  ThemeBuilderProvider,
  ThemeBuilderPanel,
  useGeneratedTheme,
  useThemeBuilderMode,
} from "@/components/theme-builder";
import { useGradeTheme } from "@/components/grade-theme-provider";
import {
  calmInput,
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
import { GRADEUI_VERSION, STUDIO_VERSION } from "@/lib/versions";

// The system prompt now lives in `@gradeui/studio/playbook` — same text
// previously duplicated here and in `app/chat/page.tsx`. See `buildSystemPrompt`
// above in the import list.

export default function StudioPage() {
  const [settings, updateSettings] = useChatSettings();
  const { theme: siteTheme, saveAndActivate } = useGradeTheme();
  const systemPrompt = useMemo(() => buildSystemPrompt(), []);

  // The working ThemeInput — what the builder panel edits. Seeded from the
  // site's active theme so the user's baseline is whatever they already had.
  // We clone defensively since ThemeInput is structured and `input` on
  // built-in themes is a shared singleton. Memo key is `siteTheme.id` so
  // the baseline only re-seeds when the site theme identity changes — not
  // on every saveAndActivate revision bump (which would otherwise stomp
  // the user's in-progress edits).
  const baseline = useMemo<ThemeInput>(
    () => cloneInput(siteTheme.input ?? calmInput),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [siteTheme.id]
  );

  // handleThemeSave fires when the builder's save button is pressed. We
  // stamp a user: id + "· Studio" suffix (if the input isn't already
  // tagged that way) and persist via saveAndActivate — which both saves
  // the ThemeInput to localStorage AND switches the site-wide active
  // theme. Returning the mutated input lets the provider rebase history
  // to the saved version, so the isDirty dot + reset target follow along.
  const handleThemeSave = useCallback(
    (input: ThemeInput): ThemeInput => {
      const saved: ThemeInput = {
        ...input,
        id: input.id.startsWith("user:")
          ? input.id
          : `user:${Date.now().toString(36)}`,
        name: input.name.endsWith("· Studio")
          ? input.name
          : `${input.name} · Studio`,
      };
      saveAndActivate(saved);
      return saved;
    },
    [saveAndActivate]
  );

  // Multiple in-memory design slots. Switching between them changes which
  // chat + preview are active; the theme stays shared because a design
  // system's whole point is consistency across pages. Not persisted yet —
  // refreshing the page resets to one blank slot.
  const [designs, setDesigns] = useState<Design[]>(() => initialDesigns());
  const [activeId, setActiveId] = useState<string>(() => designs[0].id);
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

  // Per-design "has the user chosen to dock the settings panel in the right
  // column?" flag. Kept per-design (rather than global) so switching tabs
  // restores whichever layout the user had for that design — some designs
  // are all about tweaking a single hero component (panel wants to be big
  // and docked), others are mostly theme-editing (panel wants to stay
  // inline under the selection chip and leave the right column for the
  // theme builder).
  const [panelDockedByDesign, setPanelDockedByDesign] = useState<
    Record<string, boolean>
  >({});
  const panelDocked = Boolean(panelDockedByDesign[activeId]);

  const handleRequestPanelDock = useCallback(() => {
    setPanelDockedByDesign((m) => ({ ...m, [activeId]: true }));
  }, [activeId]);

  const handleRequestPanelUndock = useCallback(() => {
    setPanelDockedByDesign((m) => {
      if (!m[activeId]) return m;
      return { ...m, [activeId]: false };
    });
  }, [activeId]);

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
        ds.map((d) => (d.id === activeId ? { ...d, appSource: code } : d))
      );
    },
    [activeId]
  );

  // Source mutation that came from the settings panel (not the LLM). Same
  // write-through path as handleLatestCode — they both target the active
  // design's `appSource` slot — but intentionally kept as a separate
  // callback so it's obvious in a stack trace which surface produced the
  // change, and so we can later add provenance / undo scoped to
  // panel-originated edits.
  const handleSourceMutation = useCallback(
    (nextSource: string) => {
      setDesigns((ds) =>
        ds.map((d) =>
          d.id === activeId ? { ...d, appSource: nextSource } : d
        )
      );
    },
    [activeId]
  );

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
      setPanelDockedByDesign((m) => {
        if (!(id in m)) return m;
        const { [id]: _drop, ...rest } = m;
        return rest;
      });
    },
    [activeId, designs]
  );

  const handleRenameDesign = useCallback((id: string, name: string) => {
    setDesigns((ds) => ds.map((d) => (d.id === id ? { ...d, name } : d)));
  }, []);

  return (
    <ThemeBuilderProvider
      initial={baseline}
      bindTo="draft"
      defaultMode="light"
      onSave={handleThemeSave}
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
              {/* Dev toggles — visually demoted (mono, muted, 10px)
                  so it reads as developer-only scaffolding. Renderer
                  and User Tier are both state-holding controls without
                  full consumers yet:
                    - Renderer: both values currently mount Sandpack
                      inside StudioCanvas. The fast renderer lands in
                      step 5 and the default flips to "fast" then.
                    - User Tier: no consumer yet. Reserved for the day
                      pro/enterprise-only chrome appears (e.g. the
                      per-client export path). */}
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground select-none">
                <span className="uppercase tracking-wider opacity-70">
                  Dev
                </span>
                <div className="flex rounded-md border border-border overflow-hidden bg-background">
                  {(["fast", "sandpack"] as const).map((m, i) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={rendererMode === m}
                      onClick={() => setRendererMode(m)}
                      title={
                        m === "fast"
                          ? "Fast renderer (same-document, no bundler) — coming soon; currently falls back to Sandpack"
                          : "Sandpack renderer (iframe + bundler) — current default"
                      }
                      className={`px-2 py-0.5 capitalize transition-colors ${
                        i > 0 ? "border-l border-border" : ""
                      } ${
                        rendererMode === m
                          ? "bg-muted text-foreground"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <div className="flex rounded-md border border-border overflow-hidden bg-background">
                  {(["free", "pro", "enterprise"] as const).map((t, i) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={userTier === t}
                      onClick={() => setUserTier(t)}
                      className={`px-2 py-0.5 capitalize transition-colors ${
                        i > 0 ? "border-l border-border" : ""
                      } ${
                        userTier === t
                          ? "bg-muted text-foreground"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
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
              settingsPanelDocked={panelDocked}
              onRequestSettingsDock={handleRequestPanelDock}
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
              onAddDesign={handleAddDesign}
              onCloseDesign={handleCloseDesign}
              onRenameDesign={handleRenameDesign}
              onDuplicateDesign={handleDuplicateDesign}
              canAddMore={!atCap}
              rendererMode={rendererMode}
            />
            {/* Right column: normally the theme builder. When the user
                docks the settings panel AND has a DS component selected,
                show the settings panel here instead — it gets the full
                column height, all props render without scrolling, and the
                user can undock to swap the theme builder back in. */}
            {panelDocked && selectionByDesign[activeId]?.componentName ? (
              <StudioSettingsPanel
                variant="docked"
                selection={selectionByDesign[activeId] ?? null}
                appSource={activeDesign.appSource}
                onSourceChange={handleSourceMutation}
                onRequestUndock={handleRequestPanelUndock}
              />
            ) : (
              <ThemeBuilderPanel />
            )}
          </div>
        </main>
      </div>
    </ThemeBuilderProvider>
  );
}

/**
 * Small helper that reads the current builder theme + mode off the
 * ThemeBuilderProvider and forwards them into StudioCanvas. Existing
 * as a child of the provider is the whole point — hooks only work
 * inside it.
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
  onAddDesign,
  onCloseDesign,
  onRenameDesign,
  onDuplicateDesign,
  canAddMore,
  rendererMode,
}: {
  designs: Design[];
  focusedId: string;
  onFocus: (id: string) => void;
  view: "preview" | "code";
  onViewChange: (v: "preview" | "code") => void;
  isStreaming: boolean;
  selection: StudioSelection | null;
  onSelect: (selection: StudioSelection) => void;
  onAddDesign: (seed?: { source: string; name?: string }) => void;
  onCloseDesign: (id: string) => void;
  onRenameDesign: (id: string, name: string) => void;
  onDuplicateDesign?: (id: string) => void;
  canAddMore: boolean;
  rendererMode: "sandpack" | "fast";
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
      onAddDesign={onAddDesign}
      onCloseDesign={onCloseDesign}
      onRenameDesign={onRenameDesign}
      onDuplicateDesign={onDuplicateDesign}
      canAddMore={canAddMore}
      rendererMode={rendererMode}
    />
  );
}
