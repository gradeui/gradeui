"use client";

/**
 * StudioRightTabs — tabbed shell for the Studio right column.
 *
 * Dogfoods the canonical `Tabs` from `@gradeui/ui` (Radix-backed) so
 * the right-side tab strip uses the same primitive any consumer of
 * the design system would reach for. The whole shell — strip + tab
 * panels — lives inside a single bordered card so it reads as one
 * container, not "a tab bar floating above a separate card".
 *
 * Three tabs:
 *
 *   Layout   — default. Hosts <StudioRightPanel>, which is itself
 *              stage-aware (A: starter picker, B: page structure
 *              placeholder, C/D: docked settings panel when a
 *              component is selected).
 *   Theme    — picker (registered themes) on top, then the inline
 *              theme builder controls (mode toggle, hue sliders,
 *              typography, shape, components). All wired to the
 *              page-level ThemeBuilderProvider so screen edits never
 *              touch the docs chrome.
 *   Comments — per-design comment threads, assembled by the parent
 *              and passed in as `commentsContent`.
 *
 * Each panel renders BARE — the bordered card chrome is owned by
 * this file's outer wrapper, not the panels themselves. That's the
 * "tabs inside the container" structure: one card, tabs at the top,
 * content below.
 */

import * as React from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Layers,
  MessageSquare,
  Palette,
  Pencil,
  Plus,
  Share2,
  Sun,
  Moon,
  Trash2,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Callout,
  CalloutDescription,
  CalloutTitle,
  Card,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Label as UiLabel,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Slider,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
} from "@gradeui/ui";

import type { StudioSelection } from "@/lib/chat-sandpack";
import type { DesignStatus } from "@/lib/studio-designs";
import { cn } from "@/lib/utils";
import { useMaybeGradeTheme } from "@/components/grade-theme-provider";
import { cloneInput } from "@/lib/studio-state";
import {
  Section,
  Label,
  Segmented,
  HueRow,
  FontRow,
  ThemeBuilderControls,
  useThemeBuilder,
  useMaybeThemeBuilder,
} from "@/components/theme-builder";
import {
  generateTheme,
  themeToCSSVars,
  themeToPortableCss,
  injectFontFaces,
  type GeneratedTheme,
  type ThemeInput,
  type ThemeVariant,
  type ColorIntensity,
  type RadiusStyle,
  type SpacingDensity,
  type ButtonShape,
  type InputStyle,
  type CardStyle,
  type ShadowIntensity,
  type TypeScale,
} from "@/lib/themes";
import { GDS_MODULAR_SCALES } from "@gradeui/core";

import { StudioRightPanel } from "./studio-right-panel";
import { ThemePickerSection } from "./theme-picker-section";
import type { StylesSection } from "./projects-menu";
import { TypographyEditor } from "./typography-editor";
import { HeadingMiniEditor } from "./heading-mini-editor";

export type TabId = "layout" | "styles" | "theme" | "comments";

/**
 * INTERIM: the full Theme tab (picker list + builder controls) is
 * hidden — the experience isn't demo-quality yet (see "Theme selector
 * — interim state" in STUDIO.md). In its place, a compact dropdown
 * (same treatment as the share view's theme menu in shared-screen.tsx)
 * sits at the top of the panel. Flip this flag to bring the full tab
 * back while it's being redesigned.
 */
const SHOW_THEME_TAB = false;

// SVG sizing is owned by the package — TabsTrigger applies
// `[&_svg]:size-3.5` to all icon children. No per-call sizes here.
const ALL_TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "layout", label: "Layout", icon: <Layers /> },
  // Design System ("styles") moved OUT of the right column to a
  // project-level page (the Design System section in ProjectsMenu —
  // it's per-project theme authoring, not per-screen). See
  // `StylesTabContent`, now rendered by `app/studio/page.tsx`.
  { id: "theme", label: "Theme", icon: <Palette /> },
  { id: "comments", label: "Comments", icon: <MessageSquare /> },
];

const TABS = SHOW_THEME_TAB
  ? ALL_TABS
  : ALL_TABS.filter((t) => t.id !== "theme");

export interface StudioRightTabsProps {
  appSource: string | null;
  selection: StudioSelection | null;
  onSourceChange: (next: string) => void;
  designName?: string;
  // Stage B metadata — forwarded straight through to the
  // screen-info panel. Optional on this surface so the few non-
  // studio consumers of the tabs (if any) don't have to thread
  // through what they don't have; the screen-info panel falls back
  // to sensible defaults on undefined.
  designCreatedAt?: number;
  designUpdatedAt?: number;
  designStatus?: DesignStatus;
  revisions?: number;
  projectName?: string;
  onStatusChange?: (status: DesignStatus) => void;
  defaultTab?: TabId;
  /** Controlled active tab. When provided, the tab state is owned
   *  upstream — used so other parts of the chrome (e.g. canvas
   *  comment-mode pick) can jump the user to a specific tab. */
  tab?: TabId;
  onTabChange?: (next: TabId) => void;
  /** Content for the Comments tab — fully assembled by the
   *  parent. The right-tabs file doesn't know about storage or
   *  selection mutations; it just hosts the pane. */
  commentsContent?: React.ReactNode;
  className?: string;
}

export function StudioRightTabs({
  appSource,
  selection,
  onSourceChange,
  designName,
  designCreatedAt,
  designUpdatedAt,
  designStatus,
  revisions = 0,
  projectName = "—",
  onStatusChange,
  defaultTab = "layout",
  tab: controlledTab,
  onTabChange,
  commentsContent,
  className,
}: StudioRightTabsProps) {
  const [internalTab, setInternalTab] = React.useState<TabId>(defaultTab);
  const tab = controlledTab ?? internalTab;
  const setTab = React.useCallback(
    (next: TabId) => {
      if (controlledTab === undefined) setInternalTab(next);
      onTabChange?.(next);
    },
    [controlledTab, onTabChange],
  );

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as TabId)}
      // Outer container — single bordered card around the whole
      // shell. The Tabs primitive itself just needs to be a
      // flex-col so the active TabsContent can fill the remaining
      // height; everything else is left to the canonical defaults
      // (TabsList is a bg-muted pill, TabsTrigger uses the package
      // styling). No per-call overrides on the Tabs primitives.
      className={cn(
        "flex flex-col h-full min-h-0 bg-background border border-border rounded-lg overflow-hidden",
        className,
      )}
    >
      {/* Small padding around the TabsList pill so it breathes
          inside the card edge. `w-full` on the list + `flex-1` on
          each trigger spreads them across the column rather than
          letting the pill auto-size to its content. */}
      <div className="p-2 shrink-0 space-y-2">
        {/* INTERIM theme selector — the share view's compact dropdown,
            sitting above the tabs while the full Theme tab is hidden.
            See the SHOW_THEME_TAB note above. */}
        {!SHOW_THEME_TAB && <ThemeDropdown />}
        <TabsList className="w-full">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="flex-1">
              {t.icon}
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* `flex-1 min-h-0 overflow-hidden` is the only override here
          — it's a layout concern (the panel needs to fill the
          remaining height in the flex column), not a visual
          concern, so it doesn't fight the canonical look. */}
      <TabsContent
        value="layout"
        className="flex-1 min-h-0 overflow-hidden"
      >
        <StudioRightPanel
          appSource={appSource}
          selection={selection}
          onSourceChange={onSourceChange}
          designName={designName ?? "Untitled"}
          designCreatedAt={designCreatedAt}
          designUpdatedAt={designUpdatedAt}
          designStatus={designStatus}
          revisions={revisions}
          projectName={projectName}
          onStatusChange={onStatusChange ?? (() => {})}
        />
      </TabsContent>
      {SHOW_THEME_TAB && (
        <TabsContent
          value="theme"
          className="flex-1 min-h-0 overflow-hidden"
        >
          <ThemeTabContent />
        </TabsContent>
      )}
      <TabsContent
        value="comments"
        className="flex-1 min-h-0 overflow-hidden"
      >
        {commentsContent}
      </TabsContent>
    </Tabs>
  );
}

/** Mini swatch for the theme dropdown — same treatment as the share
 *  view's menu (shared-screen.tsx): BRAND colours only (primary +
 *  accent), no neutral stop, which made every chip read muted. */
function ThemeSwatch({ theme }: { theme: GeneratedTheme }) {
  return (
    <span
      className="flex h-4 shrink-0 items-center overflow-hidden rounded-sm border border-border/60"
      aria-hidden
    >
      <span
        className="h-full w-2.5"
        style={{ background: `oklch(${theme.ramps.primary[600]})` }}
      />
      <span
        className="h-full w-2.5"
        style={{ background: `oklch(${theme.ramps.accent[500]})` }}
      />
    </span>
  );
}

/**
 * ThemeDropdown — the INTERIM screen-theme selector. A direct port of
 * the share view's compact theme menu, wired to the page-level
 * ThemeBuilderProvider the same way ThemePickerSection is: picking a
 * theme rebases the builder draft, so only the previewed screens
 * re-skin — the docs chrome stays put.
 *
 * Renders nothing if either provider is missing — safe in any host.
 * This replaces the hidden Theme tab until the theme experience gets
 * its proper design pass (see SHOW_THEME_TAB above + STUDIO.md).
 *
 * Exported: ProjectHome (the grid view's right pane) mounts the same
 * dropdown so the project theme is pickable from the homepage too, not
 * only once a screen is focused.
 */
export function ThemeDropdown() {
  const grade = useMaybeGradeTheme();
  const builder = useMaybeThemeBuilder();

  if (!grade || !builder) return null;

  const { themes } = grade;
  const activeBaselineId = builder.input.id;
  const activeTheme =
    themes.find((t) => t.id === activeBaselineId) ?? themes[0];
  if (!activeTheme) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="Screen theme — applies to screens, not the docs chrome"
          className="flex h-7 w-full items-center gap-1.5 rounded-md border border-border/60 px-2 text-xs text-foreground transition hover:bg-foreground/10"
        >
          <Palette className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <ThemeSwatch theme={activeTheme} />
          <span className="flex-1 min-w-0 truncate text-left">
            {activeTheme.name}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="z-[80] max-h-[60vh] w-52 overflow-y-auto"
      >
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => builder.rebase(cloneInput(t.input))}
            className="gap-2"
          >
            <ThemeSwatch theme={t} />
            <span className="flex-1 truncate">{t.name}</span>
            {t.id === activeBaselineId && (
              <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Theme tab content — picker on top + full controls (mode toggle,
 * hue sliders, typography, shape, components). All hooks come off
 * the page-level ThemeBuilderProvider so the canvas re-skins in
 * lockstep with anything the user touches in here.
 *
 * Renders bare (no card chrome) — the parent TabsContent in this
 * file already provides the bordered container.
 */
// The type scale, shown as a specimen in the Typography sub-section.
// Sizes are the Tailwind `text-*` steps, which the theme's modular scale
// re-pitches via the --text-* ladder (THEME-MIGRATION Phase B), so the
// specimen tracks the live theme when rendered inside a ThemeBuilderScope.
// Display rows use the display font, the rest the body font (var fallbacks
// degrade to the ambient font if a slot isn't set).
const TYPE_SPECIMEN: {
  label: string;
  size: string;
  weight: string;
  display: boolean;
}[] = [
  { label: "Display", size: "text-5xl", weight: "font-semibold", display: true },
  { label: "Heading 1", size: "text-4xl", weight: "font-semibold", display: true },
  { label: "Heading 2", size: "text-3xl", weight: "font-semibold", display: true },
  { label: "Heading 3", size: "text-2xl", weight: "font-semibold", display: true },
  { label: "Heading 4", size: "text-xl", weight: "font-medium", display: true },
  { label: "Heading 5", size: "text-lg", weight: "font-medium", display: true },
  { label: "Body", size: "text-base", weight: "font-normal", display: false },
  { label: "Small", size: "text-sm", weight: "font-normal", display: false },
  { label: "Caption", size: "text-xs", weight: "font-normal", display: false },
];

function TypeSpecimen() {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground">
        Type scale
      </h3>
      <div className="divide-y divide-border/60">
        {TYPE_SPECIMEN.map((r) => (
          <div key={r.label} className="flex items-baseline gap-3 py-2.5">
            <span className="w-16 shrink-0 text-[10px] text-muted-foreground">
              {r.label}
            </span>
            <div
              className={cn("min-w-0 flex-1 truncate leading-tight", r.size, r.weight)}
              style={{
                fontFamily: r.display
                  ? "var(--font-display, var(--font-sans, inherit))"
                  : "var(--font-sans, inherit)",
              }}
            >
              <span>Aa</span>{" "}
              <span className="text-muted-foreground">
                The quick brown fox jumps over the lazy dog
              </span>
            </div>
            <span className="shrink-0 self-center font-mono text-[10px] tabular-nums text-muted-foreground">
              {r.size}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// The themed preview island's DOM node, shared with portaled menus so they
// render INSIDE the scope (and inherit its theme vars) instead of on
// document.body (where they'd pick up the docs app's default accent — that's
// why the Select highlight came out teal).
const PreviewPortalContext = React.createContext<HTMLElement | null>(null);

// A SelectContent that portals into the preview island. Use this instead of
// SelectContent for any Select rendered inside a ThemePreviewScope.
function ThemedSelectContent(
  props: React.ComponentProps<typeof SelectContent>,
) {
  const container = React.useContext(PreviewPortalContext);
  return <SelectContent container={container} {...props} />;
}

// The page-level ThemeBuilderProvider runs in `draft` mode (it drives the
// preview iframes, not a DOM scope), and ThemeBuilderScope is a deliberate
// no-op in draft mode — which is why the inline preview wasn't re-skinning.
// ThemePreviewScope writes the working theme's CSS vars straight onto the
// wrapper, so the preview tracks every edit regardless of bindTo.
function ThemePreviewScope({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const builder = useMaybeThemeBuilder();
  const fontFaces = builder?.generated.typography.fontFaces;
  React.useEffect(() => {
    if (fontFaces) injectFontFaces(fontFaces);
  }, [fontFaces]);
  // The themed div, captured so portaled menus can render inside it.
  const [node, setNode] = React.useState<HTMLElement | null>(null);

  if (!builder) return <div className={className}>{children}</div>;
  const { generated, mode, setMode } = builder;
  const vars = themeToCSSVars(generated, mode) as React.CSSProperties;
  return (
    <div className="space-y-2">
      {/* Preview the theme in light or dark without leaving the tab. Drives
          the builder mode, so it stays in sync with the Colors > Mode
          control and the screen previews. */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          Preview
        </span>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => v && setMode(v as "light" | "dark")}
        >
          <ToggleGroupItem value="light" aria-label="Light mode">
            <Sun className="h-3.5 w-3.5" />
          </ToggleGroupItem>
          <ToggleGroupItem value="dark" aria-label="Dark mode">
            <Moon className="h-3.5 w-3.5" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div
        className={cn(
          // Establish the themed baseline ON the island: globals.css applies
          // background/color to <body> from these vars, but a nested scope
          // only redefines the vars, it doesn't re-apply them. Without this,
          // children inherit the OUTER page's colour, so in dark mode the
          // box stays light and any variant that relies on inherited colour
          // (outline / ghost buttons, outline badges) renders invisible.
          "bg-background text-foreground",
          mode === "dark" && "dark",
          className,
        )}
        style={vars}
        data-mode={mode}
        data-grade-theme={generated.id}
        data-button-shape={generated.components.buttonShape ?? "default"}
        data-input-style={generated.components.inputStyle ?? "outlined"}
        data-card-style={generated.components.cardStyle ?? "flat"}
        ref={setNode}
      >
        <PreviewPortalContext.Provider value={node}>
          {children}
        </PreviewPortalContext.Provider>
      </div>
    </div>
  );
}

// A compact live preview — real @gradeui/ui components inside a
// ThemePreviewScope, so they wear the project's working theme. Sits in the
// right column of the Design System sub-tabs (everywhere except Typography,
// which shows the type specimen instead).
function ExampleComponents() {
  return (
    <ThemePreviewScope className="rounded-lg border border-border/60 p-5">
      <div className="space-y-4">
        <div className="space-y-1">
          <h4 className="text-base font-semibold leading-tight">Live preview</h4>
          <p className="text-sm text-muted-foreground">
            Components wear this project&apos;s theme.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm">Primary</Button>
          <Button size="sm" variant="secondary">Secondary</Button>
          <Button size="sm" variant="outline">Outline</Button>
          <Button size="sm" variant="ghost">Ghost</Button>
          <Button size="sm" variant="destructive">Delete</Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success-soft">Success</Badge>
          <Badge variant="warning-soft">Warning</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup type="single" defaultValue="grid" size="sm">
            <ToggleGroupItem value="list">List</ToggleGroupItem>
            <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
            <ToggleGroupItem value="board">Board</ToggleGroupItem>
          </ToggleGroup>
          <Select defaultValue="recent">
            <SelectTrigger size="sm" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <ThemedSelectContent>
              <SelectItem value="recent">Most recent</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </ThemedSelectContent>
          </Select>
        </div>
        <Input placeholder="Input field" />
        <Card className="p-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">Card title</div>
            <div className="text-sm text-muted-foreground">
              Cards, inputs, and buttons all pick up the theme tokens.
            </div>
          </div>
        </Card>
      </div>
    </ThemePreviewScope>
  );
}

// ── Components gallery ─────────────────────────────────────────────────────
// The Design System > Components page: a curated (not exhaustive) board of the
// components most sensitive to a theme, so you can eyeball the whole system in
// light AND dark from one place. This is the surface that catches regressions
// like the dark-mode outline/ghost contrast bug.

function GalleryGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-lg border border-border/60 p-4">
      <h5 className="text-xs font-medium text-muted-foreground">{title}</h5>
      {children}
    </section>
  );
}

function ComponentsGallery() {
  // Demo state for the headline mini-editor (the styled-span playground).
  const [headline, setHeadline] = React.useState(
    'Your AI, <span className="font-accent">your rules</span>',
  );
  return (
    <ThemePreviewScope className="rounded-xl border border-border/60 p-5">
      <div className="space-y-4">
        <div className="space-y-1">
          <h4 className="text-base font-semibold leading-tight">Components</h4>
          <p className="text-sm text-muted-foreground">
            A cross-section of the system on this theme. Flip the preview to dark
            to check contrast.
          </p>
        </div>

        <GalleryGroup title="Headline — select a word, then click Accent">
          <HeadingMiniEditor
            value={headline}
            onChange={setHeadline}
            className="text-3xl font-semibold leading-tight"
          />
          <pre className="mt-1 overflow-x-auto rounded bg-foreground/5 p-2 font-mono text-2xs text-muted-foreground">
            {headline}
          </pre>
        </GalleryGroup>

        <div className="grid gap-3 lg:grid-cols-2">
          <GalleryGroup title="Buttons">
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Primary</Button>
              <Button size="sm" variant="secondary">Secondary</Button>
              <Button size="sm" variant="outline">Outline</Button>
              <Button size="sm" variant="ghost">Ghost</Button>
              <Button size="sm" variant="destructive">Destructive</Button>
              <Button size="sm" variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="xs">xs</Button>
              <Button size="sm">sm</Button>
              <Button size="md">md</Button>
              <Button size="lg">lg</Button>
              <Button size="sm" disabled>Disabled</Button>
            </div>
          </GalleryGroup>

          <GalleryGroup title="Badges">
            <div className="flex flex-wrap gap-1.5">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
            {/* Semantic — solid. Track --success / --warning / --info /
                --highlight / --destructive, so they re-tone with the theme. */}
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="highlight">Highlight</Badge>
            </div>
            {/* Semantic — soft (deep text on a tinted surface) */}
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="success-soft">Success</Badge>
              <Badge variant="warning-soft">Warning</Badge>
              <Badge variant="destructive-soft">Destructive</Badge>
              <Badge variant="info-soft">Info</Badge>
              <Badge variant="highlight-soft">Highlight</Badge>
            </div>
          </GalleryGroup>

          <GalleryGroup title="Form">
            <div className="space-y-1.5">
              <UiLabel htmlFor="g-input">Input</UiLabel>
              <Input id="g-input" placeholder="Type something" />
            </div>
            <div className="space-y-1.5">
              <UiLabel htmlFor="g-select">Select</UiLabel>
              <Select defaultValue="one">
                <SelectTrigger id="g-select">
                  <SelectValue />
                </SelectTrigger>
                <ThemedSelectContent>
                  <SelectItem value="one">Option one</SelectItem>
                  <SelectItem value="two">Option two</SelectItem>
                  <SelectItem value="three">Option three</SelectItem>
                </ThemedSelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <UiLabel htmlFor="g-textarea">Textarea</UiLabel>
              <Textarea id="g-textarea" placeholder="A few lines…" rows={2} />
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox defaultChecked /> Checkbox
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch defaultChecked /> Switch
              </label>
            </div>
            <RadioGroup defaultValue="a" className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="a" /> One
              </label>
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="b" /> Two
              </label>
            </RadioGroup>
            <div className="space-y-1.5 pt-1">
              <UiLabel>Slider</UiLabel>
              <Slider defaultValue={[60]} max={100} step={1} />
            </div>
          </GalleryGroup>

          <GalleryGroup title="Feedback">
            <Callout variant="success">
              <CalloutTitle>Saved</CalloutTitle>
              <CalloutDescription>Your changes are live.</CalloutDescription>
            </Callout>
            <Callout variant="warning">
              <CalloutTitle>Heads up</CalloutTitle>
              <CalloutDescription>Double-check before publishing.</CalloutDescription>
            </Callout>
            <Callout variant="info">
              <CalloutTitle>Good to know</CalloutTitle>
              <CalloutDescription>Drafts autosave every few seconds.</CalloutDescription>
            </Callout>
            <Callout variant="destructive">
              <CalloutTitle>Something went wrong</CalloutTitle>
              <CalloutDescription>We couldn’t reach the server.</CalloutDescription>
            </Callout>
            <div className="space-y-1.5 pt-1">
              <UiLabel>Progress</UiLabel>
              <Progress value={64} />
            </div>
          </GalleryGroup>

          <GalleryGroup title="Display">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>GR</AvatarFallback>
              </Avatar>
              <Separator orientation="vertical" className="h-8" />
              <span className="text-sm text-muted-foreground">Avatar + separator</span>
            </div>
            <Card className="p-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">Card title</div>
                <div className="text-sm text-muted-foreground">
                  Surfaces, borders, and text all track the theme tokens.
                </div>
              </div>
            </Card>
          </GalleryGroup>
        </div>
      </div>
    </ThemePreviewScope>
  );
}

/**
 * StylesTabContent — the per-project Styles tab: theme variant authoring
 * (STUDIO-THEMES.md Phase T1). Save the current screen theme as a named
 * variant, apply a saved variant back to the canvas (NON-DESTRUCTIVE —
 * rebases the builder draft, identical to the theme dropdown above, so the
 * preview re-skins without committing anything elsewhere), rename, delete,
 * and flag which ones travel with a share (`includeInShare` → the curated
 * share set, T2). Variants persist as ThemeInput JSON on the project
 * (`theme_variants_json`, migration 0013); because `generateTheme` is
 * deterministic, the stored input reproduces the exact theme forever.
 *
 * Set a base with the theme menu above the tabs, tweak, then save.
 */
export function StylesTabContent({
  variants,
  onVariantsChange,
  section,
}: {
  variants: ThemeVariant[];
  onVariantsChange: (next: ThemeVariant[]) => void;
  /** Focus the panel on one group of controls — driven by the Design
   *  System sub-nav (Colors / Typography / Spacing). Undefined shows the
   *  full set (the old single-panel behaviour). */
  section?: StylesSection;
}) {
  const builder = useMaybeThemeBuilder();
  const [newName, setNewName] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  // No builder in scope (host without a ThemeBuilderProvider) — nothing to
  // author against. Render nothing rather than a dead panel.
  if (!builder) return null;

  // Copy the whole generated theme as a self-contained, paste-anywhere CSS
  // block (@font-face + :root light + .dark). Drops onto any site running
  // @gradeui/ui to wear this exact theme.
  const copyThemeCss = async () => {
    try {
      await navigator.clipboard.writeText(themeToPortableCss(builder.generated));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  const saveCurrent = () => {
    const name = newName.trim() || `Variant ${variants.length + 1}`;
    const variant: ThemeVariant = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `v-${Date.now()}`,
      name,
      input: cloneInput(builder.input),
      includeInShare: false,
      createdAt: Date.now(),
    };
    onVariantsChange([...variants, variant]);
    setNewName("");
  };

  const apply = (v: ThemeVariant) => builder.rebase(cloneInput(v.input));
  const remove = (id: string) =>
    onVariantsChange(variants.filter((v) => v.id !== id));
  const patchVariant = (id: string, patch: Partial<ThemeVariant>) =>
    onVariantsChange(
      variants.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    );

  // Which control groups show, driven by the Design System sub-section
  // picked in the sidebar. Undefined section = the full set (back-compat).
  const controlSections =
    section === "typography"
      ? { mode: false, colour: false, shape: false, components: false }
      : section === "spacing"
        ? { mode: false, colour: false, typography: false, components: false }
        : section === "colours"
          ? { typography: false, shape: false, components: false }
          : { components: false };
  const hideMode = section === "typography" || section === "spacing";

  const isControls =
    section === "colours" || section === "typography" || section === "spacing";

  return (
    <div
      className="flex h-full flex-col overflow-y-auto overscroll-contain p-4"
      data-lenis-prevent
    >
      {section === "components" ? (
        <div className="mx-auto w-full max-w-4xl">
          <ComponentsGallery />
        </div>
      ) : section === "typography" ? (
        <div className="mx-auto w-full max-w-2xl">
          <TypographyEditor />
        </div>
      ) : (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 md:flex-row md:items-start">
        {/* Left column — the editor for this sub-section, kept at its
            natural ~320px width so the inputs don't stretch across the
            page. General owns theme-variant authoring; the control sub-tabs
            each show a single, flat (non-collapsible) group. */}
        <div className="w-full space-y-3 md:w-80 md:shrink-0">
          {isControls ? (
            <div className="rounded-md border border-border/60">
        {/* Drift header — visible the moment any control departs from
            the base theme. Freeform play needs a way home: Reset snaps
            the draft back to the base (the history anchor), and the
            per-control dots in the form show exactly which knobs moved. */}
        {builder.isDirty && (
          <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-studio-accent/5 px-3 py-1.5">
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-studio-accent" />
              Edited from base
            </span>
            <button
              type="button"
              onClick={builder.reset}
              className="rounded px-1.5 py-0.5 text-[11px] font-medium text-studio-accent transition hover:bg-studio-accent/10"
            >
              Reset to base
            </button>
          </div>
        )}
        {/* Mode section ON — the provider's light/dark drives the SCREEN
            preview vars (independent of the docs-site mode), and the tab
            is its natural home. */}
        <ThemeBuilderControls
                hideMode={hideMode}
                sections={controlSections}
                collapsibleSections={false}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-muted-foreground">
                  Theme variants
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Save the current theme as a named variant. Tweak it in the
                  Colors, Typography, and Spacing tabs, then save. Applying a
                  variant re-skins the preview without overwriting your working
                  draft.
                </p>
              </div>
              <div className="flex gap-1.5">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveCurrent();
                  }}
                  placeholder={`Variant ${variants.length + 1}`}
                  aria-label="New variant name"
                  className="h-7 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={saveCurrent}
                  title="Save the current theme as a variant"
                  className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground transition hover:opacity-90 [&_svg]:size-3.5"
                >
                  <Plus /> Save
                </button>
              </div>
              {variants.length === 0 ? (
                <p className="rounded-md border border-dashed border-border px-2 py-6 text-center text-xs text-muted-foreground">
                  No variants yet. Save the current theme to start a set.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {variants.map((v) => (
                    <VariantRow
                      key={v.id}
                      variant={v}
                      onApply={() => apply(v)}
                      onRename={(name) => patchVariant(v.id, { name })}
                      onToggleShare={() =>
                        patchVariant(v.id, { includeInShare: !v.includeInShare })
                      }
                      onDelete={() => remove(v.id)}
                    />
                  ))}
                </div>
              )}
              <div className="space-y-1 border-t border-border/60 pt-3">
                <button
                  type="button"
                  onClick={copyThemeCss}
                  title="Copy this theme as portable CSS"
                  className="inline-flex h-7 w-full items-center justify-center gap-1.5 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground transition hover:bg-muted [&_svg]:size-3.5"
                >
                  {copied ? <Check /> : <Copy />}
                  {copied ? "Copied" : "Copy theme CSS"}
                </button>
                <p className="text-2xs leading-snug text-muted-foreground">
                  Self-contained @font-face + :root and .dark blocks. Paste onto
                  any site running @gradeui/ui to wear this theme.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right column — a live preview on the project's theme. The type
            specimen for Typography; real components everywhere else. */}
        <div className="min-w-0 flex-1">
          <ExampleComponents />
        </div>
      </div>
      )}
    </div>
  );
}

/** One variant row — swatch + name (click to apply), with rename, a
 *  share-set toggle, and delete. The swatch derives from the variant's
 *  own ThemeInput via the deterministic generator. */
function VariantRow({
  variant,
  onApply,
  onRename,
  onToggleShare,
  onDelete,
}: {
  variant: ThemeVariant;
  onApply: () => void;
  onRename: (name: string) => void;
  onToggleShare: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(variant.name);
  const generated = React.useMemo(
    () => generateTheme(variant.input),
    [variant.input],
  );

  React.useEffect(() => setName(variant.name), [variant.name]);

  const commit = () => {
    const next = name.trim();
    if (next && next !== variant.name) onRename(next);
    else setName(variant.name);
    setEditing(false);
  };

  return (
    <div className="group flex items-center gap-2 rounded-md border border-border px-2 py-1.5">
      <ThemeSwatch theme={generated} />
      {editing ? (
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setName(variant.name);
              setEditing(false);
            }
          }}
          aria-label="Rename variant"
          className="h-6 min-w-0 flex-1 rounded border border-input bg-background px-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      ) : (
        <button
          type="button"
          onClick={onApply}
          title="Apply to preview"
          className="min-w-0 flex-1 truncate text-left text-xs text-foreground transition hover:text-primary"
        >
          {variant.name}
        </button>
      )}

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={onToggleShare}
          aria-pressed={variant.includeInShare}
          title={
            variant.includeInShare
              ? "In the share set — viewers can switch to it"
              : "Add to the share set"
          }
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded transition [&_svg]:size-3.5",
            variant.includeInShare
              ? "text-primary"
              : "text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100",
          )}
        >
          <Share2 />
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Rename"
          className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground opacity-0 transition hover:text-foreground group-hover:opacity-100 [&_svg]:size-3.5"
        >
          <Pencil />
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Delete variant"
          className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100 [&_svg]:size-3.5"
        >
          <Trash2 />
        </button>
      </div>
    </div>
  );
}

function ThemeTabContent() {
  const { input, patch, mode, setMode } = useThemeBuilder();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto" data-lenis-prevent>
        <ThemePickerSection />

        <Section title="Mode">
          {/* Canonical ToggleGroup from @gradeui/ui — mutually-
              exclusive 2-state pick is the natural fit. `type="single"`
              + a guard against an empty value keep light/dark
              required (no neither). */}
          <ToggleGroup
            type="single"
            value={mode}
            // Explicit param type because Radix's single-vs-multi
            // overload only narrows once the dist is rebuilt — be
            // safe so the call site reads cleanly either way. The
            // empty-string case is what Radix emits when the user
            // clicks the already-active item; we ignore it so mode
            // is always one of "light" / "dark".
            onValueChange={(v: string) => {
              if (v === "light" || v === "dark") setMode(v);
            }}
          >
            <ToggleGroupItem value="light" aria-label="Light mode">
              {/* SVG sizing is owned by the toggleVariants
                  `[&_svg]:size-4` rule — don't override here. */}
              <Sun />
              Light
            </ToggleGroupItem>
            <ToggleGroupItem value="dark" aria-label="Dark mode">
              <Moon />
              Dark
            </ToggleGroupItem>
          </ToggleGroup>
          <p className="mt-1.5 text-[10px] text-muted-foreground/70">
            Light/dark for the previewed screens only.
          </p>
        </Section>

        <Section title="Colour" subtitle="Hues drive the full OKLCH ramps.">
          <HueRow
            label="Primary"
            hue={input.hues.primary}
            chroma={input.chroma?.primary ?? 1.0}
            onChange={(h) =>
              patch((d) => {
                d.hues.primary = h;
              })
            }
          />
          <HueRow
            label="Accent"
            hue={input.hues.accent}
            chroma={input.chroma?.accent ?? 1.0}
            onChange={(h) =>
              patch((d) => {
                d.hues.accent = h;
              })
            }
          />
          <HueRow
            label="Neutral"
            hue={input.hues.neutral}
            chroma={input.chroma?.neutral ?? 0.08}
            onChange={(h) =>
              patch((d) => {
                d.hues.neutral = h;
              })
            }
          />

          <div className="pt-2 space-y-2">
            <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(input.neutralPureGray)}
                onChange={(e) =>
                  patch((d) => {
                    d.neutralPureGray = e.target.checked;
                  })
                }
                className="accent-primary"
              />
              Pure-gray neutral (zero chroma)
            </label>

            <div>
              <Label>Intensity</Label>
              <Segmented
                value={input.intensity ?? "default"}
                options={INTENSITIES}
                onChange={(v) =>
                  patch((d: ThemeInput) => {
                    d.intensity = v;
                  })
                }
              />
            </div>
          </div>
        </Section>

        <Section title="Typography">
          <FontRow
            label="Display"
            value={input.typography.display}
            onChange={(v) =>
              patch((d) => {
                d.typography.display = v;
              })
            }
            filter={(cat) => cat !== "mono"}
          />
          <FontRow
            label="Body"
            value={input.typography.body}
            onChange={(v) =>
              patch((d) => {
                d.typography.body = v;
              })
            }
            filter={(cat) => cat !== "mono"}
          />
          <FontRow
            label="Mono"
            value={input.typography.mono}
            onChange={(v) =>
              patch((d) => {
                d.typography.mono = v;
              })
            }
            filter={(cat) => cat === "mono"}
          />

          {/* Type scale — flat presets + the modular (musical) ratios.
              Modular ids generate the ladder middle-out (Utopia model).
              Mirrors the Scale row in ThemeBuilderControls. */}
          <div>
            <Label>Scale</Label>
            <select
              value={input.typography.scale}
              onChange={(e) =>
                patch((d) => {
                  d.typography.scale = e.target.value as TypeScale;
                })
              }
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
            >
              <optgroup label="Presets">
                <option value="compact">Compact</option>
                <option value="default">Default</option>
                <option value="spacious">Spacious</option>
              </optgroup>
              <optgroup label="Modular (musical)">
                {GDS_MODULAR_SCALES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} · {s.ratio}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="pt-1">
            <Label>Heading weight</Label>
            <Segmented
              value={String(input.typography.headingWeight ?? 600)}
              options={WEIGHTS}
              onChange={(v) =>
                patch((d) => {
                  d.typography.headingWeight = Number(v);
                })
              }
            />
          </div>
        </Section>

        <Section title="Shape &amp; feel">
          <div>
            <Label>Radius</Label>
            <Segmented
              value={input.radius.style}
              options={RADII}
              onChange={(v) =>
                patch((d) => {
                  d.radius.style = v;
                })
              }
            />
          </div>
          <div>
            <Label>Density</Label>
            <Segmented
              value={input.spacing.density}
              options={DENSITIES}
              onChange={(v) =>
                patch((d) => {
                  d.spacing.density = v;
                })
              }
            />
          </div>
          <div>
            <Label>Shadows</Label>
            <Segmented
              value={input.effects?.shadows ?? "default"}
              options={SHADOWS}
              onChange={(v) =>
                patch((d) => {
                  d.effects = { ...(d.effects ?? {}), shadows: v };
                })
              }
            />
          </div>
        </Section>

        <Section title="Components">
          <div>
            <Label>Button shape</Label>
            <Segmented
              value={input.components?.buttonShape ?? "default"}
              options={BUTTON_SHAPES}
              onChange={(v) =>
                patch((d) => {
                  d.components = { ...(d.components ?? {}), buttonShape: v };
                })
              }
            />
          </div>
          <div>
            <Label>Input style</Label>
            <Segmented
              value={input.components?.inputStyle ?? "outlined"}
              options={INPUT_STYLES}
              onChange={(v) =>
                patch((d) => {
                  d.components = { ...(d.components ?? {}), inputStyle: v };
                })
              }
            />
          </div>
          <div>
            <Label>Card style</Label>
            <Segmented
              value={input.components?.cardStyle ?? "flat"}
              options={CARD_STYLES}
              onChange={(v) =>
                patch((d) => {
                  d.components = { ...(d.components ?? {}), cardStyle: v };
                })
              }
            />
          </div>
        </Section>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Option tables — mirror of the source-of-truth tables in the
   theme-builder package's internal Controls component. Kept here
   because the Theme tab interleaves these with the picker section
   and the panel composite was harder to splice in two pieces.
   ────────────────────────────────────────────────────────────────────── */

const INTENSITIES: { value: ColorIntensity; label: string }[] = [
  { value: "muted", label: "Muted" },
  { value: "default", label: "Default" },
  { value: "vibrant", label: "Vibrant" },
];

const RADII: { value: RadiusStyle; label: string }[] = [
  { value: "sharp", label: "Sharp" },
  { value: "subtle", label: "Subtle" },
  { value: "soft", label: "Soft" },
  { value: "round", label: "Round" },
  { value: "pill", label: "Pill" },
];

const DENSITIES: { value: SpacingDensity; label: string }[] = [
  { value: "tight", label: "Tight" },
  { value: "default", label: "Default" },
  { value: "roomy", label: "Roomy" },
];

const SHADOWS: { value: ShadowIntensity; label: string }[] = [
  { value: "none", label: "None" },
  { value: "subtle", label: "Subtle" },
  { value: "default", label: "Default" },
  { value: "dramatic", label: "Dramatic" },
];

const BUTTON_SHAPES: { value: ButtonShape; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "pill", label: "Pill" },
  { value: "square", label: "Square" },
];

const INPUT_STYLES: { value: InputStyle; label: string }[] = [
  { value: "outlined", label: "Outlined" },
  { value: "filled", label: "Filled" },
  { value: "underline", label: "Underline" },
];

const CARD_STYLES: { value: CardStyle; label: string }[] = [
  { value: "flat", label: "Flat" },
  { value: "outlined", label: "Outlined" },
  { value: "elevated", label: "Elevated" },
  { value: "glass", label: "Glass" },
];

const WEIGHTS = [
  { value: "400", label: "400" },
  { value: "500", label: "500" },
  { value: "600", label: "600" },
  { value: "700", label: "700" },
  { value: "800", label: "800" },
];
