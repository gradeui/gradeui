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

import { useCallback, useMemo, useState } from "react";
import type { UIMessage } from "ai";
import { SiteHeader } from "@/components/site-header";
import {
  ProviderPicker,
  useChatSettings,
} from "@/components/ai-elements/provider-picker";
import { StudioChat } from "@/components/studio/studio-chat";
import { StudioPreview } from "@/components/studio/studio-preview";
import { StudioSettingsPanel } from "@/components/studio/settings-panel";
import {
  ThemeBuilderProvider,
  ThemeBuilderPanel,
  useGeneratedTheme,
  useThemeBuilderMode,
} from "@/components/theme-builder";
import { DesignTabs } from "@/components/studio/design-tabs";
import { useGradeTheme } from "@/components/grade-theme-provider";
import {
  calmInput,
  type GeneratedTheme,
  type ThemeInput,
} from "@/lib/themes";
import { cloneInput } from "@/lib/studio-state";
import {
  ALLOWED_COMPONENTS,
  type StudioSelection,
} from "@/lib/chat-sandpack";
import {
  createDesign,
  initialDesigns,
  type Design,
} from "@/lib/studio-designs";

/**
 * The same system prompt we use on /chat — keeps the model producing code
 * shaped for our Sandpack harness. Duplicated verbatim because the rules are
 * about the Sandpack harness, not the page, and exporting this as a shared
 * module would be premature given how likely each surface is to diverge.
 */
function buildSystemPrompt(): string {
  const list = ALLOWED_COMPONENTS.join(", ");
  return `You are an assistant that designs UIs using the Grade Design System.

OUTPUT RULES — follow these exactly:
1. Respond with a short sentence or two explaining what you built, then a single fenced code block tagged \`\`\`jsx that contains the component.
2. The code block MUST be a self-contained React component named \`App\` with \`export default\`.
3. Import ALL design-system components from the single barrel entry "@gradeui/ui" — one consolidated import statement, e.g. \`import { Button, Card, CardHeader, CardTitle, CardContent, Input, Checkbox, Label } from "@gradeui/ui"\`. Do NOT use subpath imports like "@gradeui/ui/button" or "@gradeui/ui/card" — the package does not export those paths and the preview will fail with "Could not find module". Do NOT import from local paths like "./components/ui/<name>". The iframe installs @gradeui/ui from npm so you get the real published components, not copies.
4. You may use these Grade DS components ONLY: ${list}.
5. You may import icons from "lucide-react" (e.g. \`import { Mail } from "lucide-react"\`).
6. For charts, you may import from "recharts" (e.g. \`import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from "recharts"\`). Style charts with the design-system tokens via \`stroke="oklch(var(--primary))"\` / \`fill="oklch(var(--primary))"\` so they follow the active theme.
7. Use Tailwind utility classes for styling and the design system's semantic tokens: bg-background, bg-card, bg-muted, bg-primary, text-foreground, text-muted-foreground, text-primary-foreground, border-border, border-input, etc. Do NOT use raw color classes like bg-blue-500.
8. Keep the preview small — target a single screen. Don't build entire pages.
9. Do not include explanations inside the code block — comments are fine but no chattiness.
10. When the user asks for iterations ("make it bigger", "red instead of green"), regenerate the FULL component so the preview updates in one go.

LAYOUT PRIMITIVES — prefer these over hand-rolled flex/grid utility classes where they fit. Using the primitives keeps structure editable via the settings panel and keeps vertical/horizontal rhythm consistent. Raw Tailwind is still fine for one-offs and anything the primitives don't express — this is a suggestion, not a ban.
  - <Stack gap="…"> instead of \`flex flex-col gap-…\` or \`space-y-…\` (vertical cluster — form fields, content columns).
  - <Row gap="…" justify="…"> instead of \`flex items-center gap-…\` (horizontal cluster — button bars, inline fields; inside CardFooter this is usually <Row justify="end" gap="sm">).
  - <Grid cols="…" gap="…"> instead of \`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-…\` (2D tile grids, stat cards). The \`cols\` prop bakes in the responsive ladder so you pick the desktop column count.
  - <Flex direction="…" gap="…"> when you need reverse direction, baseline alignment, or CSS defaults rather than Row's \`items-center gap-md\` starting point.`;
}

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
  const activeDesign = designs.find((d) => d.id === activeId) ?? designs[0];

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

  const handleAddDesign = useCallback(() => {
    setDesigns((ds) => {
      const next = createDesign(ds.length);
      setActiveId(next.id);
      return [...ds, next];
    });
  }, []);

  const handleCloseDesign = useCallback(
    (id: string) => {
      setDesigns((ds) => {
        if (ds.length <= 1) return ds; // Guardrail — never close the last one.
        const idx = ds.findIndex((d) => d.id === id);
        const next = ds.filter((d) => d.id !== id);
        // If we just closed the active tab, fall onto the neighbour to the
        // left (or first) so the user isn't looking at a ghost tab.
        if (id === activeId) {
          const fallback = next[Math.max(0, idx - 1)];
          if (fallback) setActiveId(fallback.id);
        }
        return next;
      });
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
    [activeId]
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
        <SiteHeader />

        <div className="border-b bg-muted/30 shrink-0">
          <div className="max-w-[1800px] mx-auto px-4 md:px-6 py-2.5 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-base font-semibold leading-tight">Studio</h1>
              <p className="text-[11px] text-muted-foreground">
                Chat a design into life, then restyle it live.
              </p>
            </div>
            <ProviderPicker settings={settings} onChange={updateSettings} />
          </div>
        </div>

        <DesignTabs
          designs={designs}
          activeId={activeId}
          onActivate={setActiveId}
          onAdd={handleAddDesign}
          onClose={handleCloseDesign}
          onRename={handleRenameDesign}
          className="shrink-0"
        />

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
            <StudioThemedPreview
              previewKey={`preview-${activeId}`}
              appSource={activeDesign.appSource}
              view={view}
              onViewChange={setView}
              isStreaming={Boolean(streamingByDesign[activeId])}
              selection={selectionByDesign[activeId] ?? null}
              onSelect={handleSelect}
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
 * ThemeBuilderProvider and forwards them into StudioPreview. Existing as
 * a child of the provider is the whole point — hooks only work inside it.
 *
 * Wraps StudioPreview as-is rather than refactoring its props to use the
 * hooks directly; StudioPreview is also used elsewhere (e.g. could be
 * embedded in a static card later) so keeping it a pure prop-driven
 * component preserves that flexibility.
 */
function StudioThemedPreview({
  previewKey,
  appSource,
  view,
  onViewChange,
  isStreaming,
  selection,
  onSelect,
}: {
  previewKey: string;
  appSource: string | null;
  view: "preview" | "code";
  onViewChange: (v: "preview" | "code") => void;
  isStreaming: boolean;
  selection: StudioSelection | null;
  onSelect: (selection: StudioSelection) => void;
}) {
  const theme: GeneratedTheme = useGeneratedTheme();
  const [mode] = useThemeBuilderMode();
  return (
    <StudioPreview
      key={previewKey}
      appSource={appSource}
      theme={theme}
      mode={mode}
      view={view}
      onViewChange={onViewChange}
      isStreaming={isStreaming}
      selection={selection}
      onSelect={onSelect}
    />
  );
}
