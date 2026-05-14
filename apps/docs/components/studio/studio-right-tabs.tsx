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
 *   Layout — default. Hosts <StudioRightPanel>, which is itself
 *            stage-aware (A: starter picker, B: page structure
 *            placeholder, C/D: docked settings panel when a
 *            component is selected).
 *   Theme  — picker (registered themes) on top, then the inline
 *            theme builder controls (mode toggle, hue sliders,
 *            typography, shape, components). All wired to the
 *            page-level ThemeBuilderProvider so screen edits never
 *            touch the docs chrome.
 *   Notes  — per-design free-form text. Parent owns the state map.
 *
 * Each panel renders BARE — the bordered card chrome is owned by
 * this file's outer wrapper, not the panels themselves. That's the
 * "tabs inside the container" structure: one card, tabs at the top,
 * content below.
 */

import * as React from "react";
import { Layers, Palette, StickyNote, Sun, Moon } from "lucide-react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ToggleGroup,
  ToggleGroupItem,
} from "@gradeui/ui";

import type { StudioSelection } from "@/lib/chat-sandpack";
import { cn } from "@/lib/utils";
import {
  Section,
  Label,
  Segmented,
  HueRow,
  FontRow,
  useThemeBuilder,
} from "@/components/theme-builder";
import {
  type ThemeInput,
  type ColorIntensity,
  type RadiusStyle,
  type SpacingDensity,
  type ButtonShape,
  type InputStyle,
  type CardStyle,
  type ShadowIntensity,
} from "@/lib/themes";

import { StudioRightPanel } from "./studio-right-panel";
import { NotesPanel } from "./notes-panel";
import { ThemePickerSection } from "./theme-picker-section";

type TabId = "layout" | "theme" | "notes";

// SVG sizing is owned by the package — TabsTrigger applies
// `[&_svg]:size-3.5` to all icon children. No per-call sizes here.
const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "layout", label: "Layout", icon: <Layers /> },
  { id: "theme", label: "Theme", icon: <Palette /> },
  { id: "notes", label: "Notes", icon: <StickyNote /> },
];

export interface StudioRightTabsProps {
  appSource: string | null;
  selection: StudioSelection | null;
  onSourceChange: (next: string) => void;
  notes: string;
  onNotesChange: (next: string) => void;
  designName?: string;
  defaultTab?: TabId;
  className?: string;
}

export function StudioRightTabs({
  appSource,
  selection,
  onSourceChange,
  notes,
  onNotesChange,
  designName,
  defaultTab = "layout",
  className,
}: StudioRightTabsProps) {
  const [tab, setTab] = React.useState<TabId>(defaultTab);

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
      <div className="p-2 shrink-0">
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
        />
      </TabsContent>
      <TabsContent
        value="theme"
        className="flex-1 min-h-0 overflow-hidden"
      >
        <ThemeTabContent />
      </TabsContent>
      <TabsContent
        value="notes"
        className="flex-1 min-h-0 overflow-hidden"
      >
        <NotesPanel
          value={notes}
          onChange={onNotesChange}
          designName={designName}
        />
      </TabsContent>
    </Tabs>
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
