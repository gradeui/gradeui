"use client";

/**
 * DisplaySection — the persistent "Display" block at the top of the
 * Studio right panel. Hosts the canvas-wide view controls that used
 * to live in the canvas toolbar:
 *
 *   - Viewport — Mobile / Tablet / Desktop / Responsive. A controlled
 *     value owned by the studio page (so it survives a refresh and so
 *     the canvas can read it for resolveArtboardSize); this section is
 *     just the picker surface.
 *   - Zoom — Fit + presets + step actions. The useArtboardZoom hook
 *     still lives in StudioCanvas (it measures the canvas DOM), so this
 *     section is driven by the bridged `zoomState` (live readout) and
 *     `zoomApi` (mutation gestures). When the API isn't ready yet the
 *     trigger renders disabled.
 *   - Mode — light/dark for the previewed screens (not the Studio
 *     chrome). Read straight from ThemeBuilderProvider context via
 *     useThemeBuilderMode() — no prop threading, since this section
 *     only ever mounts inside the provider. This control used to live
 *     in the Theme tab, which is currently hidden (SHOW_THEME_TAB in
 *     studio-right-tabs.tsx).
 *
 * Header treatment mirrors CollapsibleSection in selection-inspector.tsx
 * (text-xs / font-medium header, px-3 pt-2.5 pb-1.5, edge-to-edge top
 * border) so it reads as one of the inspector's sections. Field labels
 * use the same FIELD_LABEL density (text-2xs / font-medium).
 */

import * as React from "react";
import {
  Check,
  ChevronDown,
  Monitor,
  Moon,
  MoveHorizontal,
  Smartphone,
  Sun,
  Tablet,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ToggleGroup,
  ToggleGroupItem,
} from "@gradeui/ui";
import { cn } from "@/lib/utils";
import { useThemeBuilderMode } from "@/components/theme-builder";
import type { ViewportWidth } from "@/components/studio/sandpack-frame";

const FIELD_LABEL = "text-2xs font-medium text-foreground/80";

/** Viewport options — same glyphs the old toolbar dropdown used. */
const VIEWPORT_OPTIONS: {
  value: ViewportWidth;
  label: string;
  hint: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "mobile",
    label: "Mobile",
    hint: "390×844",
    icon: <Smartphone className="h-3.5 w-3.5 shrink-0" />,
  },
  {
    value: "tablet",
    label: "Tablet",
    hint: "768×1024",
    icon: <Tablet className="h-3.5 w-3.5 shrink-0" />,
  },
  {
    value: "desktop",
    label: "Desktop",
    hint: "1440×900",
    icon: <Monitor className="h-3.5 w-3.5 shrink-0" />,
  },
  {
    value: "responsive",
    label: "Responsive",
    hint: "fills column",
    icon: <MoveHorizontal className="h-3.5 w-3.5 shrink-0" />,
  },
];

/** Zoom presets surfaced in the menu. */
const ZOOM_MENU_PRESETS = [0.5, 1, 2];

interface ZoomState {
  effectiveZoom: number;
  fitMode: boolean;
}

interface ZoomApi {
  pickZoom: (z: number) => void;
  stepZoom: (dir: number) => void;
  fit: () => void;
}

/**
 * ZoomMenu — the compact zoom surface: one tabular percent trigger
 * opening Fit + presets + step actions. Moved out of the canvas
 * toolbar; driven by the bridged zoomState + zoomApi rather than the
 * live ArtboardZoom object (the hook stays in StudioCanvas). Disabled
 * until the API is wired.
 */
function ZoomMenu({
  zoomState,
  zoomApi,
}: {
  zoomState: ZoomState;
  zoomApi: ZoomApi | null;
}) {
  const pct = Math.round(zoomState.effectiveZoom * 100);
  const atPreset = (z: number) =>
    !zoomState.fitMode && pct === Math.round(z * 100);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Zoom"
          title="Zoom"
          disabled={!zoomApi}
          className={cn(
            "h-7 px-1.5 inline-flex items-center gap-0.5 rounded-md text-xs tabular-nums transition-colors",
            "border border-border/60",
            "text-foreground hover:bg-muted",
            "disabled:opacity-40 disabled:pointer-events-none",
          )}
        >
          {zoomState.fitMode ? "Fit" : `${pct}%`}
          <ChevronDown className="h-3 w-3 text-muted-foreground/70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onClick={() => zoomApi?.stepZoom(1)}
          className="gap-2 text-xs"
        >
          <span className="flex-1">Zoom in</span>
          <span className="text-2xs text-muted-foreground">=</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => zoomApi?.stepZoom(-1)}
          className="gap-2 text-xs"
        >
          <span className="flex-1">Zoom out</span>
          <span className="text-2xs text-muted-foreground">−</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => zoomApi?.fit()}
          className="gap-2 text-xs"
        >
          <span className="flex-1">Fit</span>
          <span className="text-2xs text-muted-foreground">0</span>
          {zoomState.fitMode && <Check className="h-3.5 w-3.5 shrink-0" />}
        </DropdownMenuItem>
        {ZOOM_MENU_PRESETS.map((z) => (
          <DropdownMenuItem
            key={z}
            onClick={() => zoomApi?.pickZoom(z)}
            className="gap-2 text-xs tabular-nums"
          >
            <span className="flex-1">{Math.round(z * 100)}%</span>
            {atPreset(z) && <Check className="h-3.5 w-3.5 shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface DisplaySectionProps {
  viewportWidth: ViewportWidth;
  onViewportChange: (v: ViewportWidth) => void;
  zoomState: ZoomState;
  zoomApi: ZoomApi | null;
}

export function DisplaySection({
  viewportWidth,
  onViewportChange,
  zoomState,
  zoomApi,
}: DisplaySectionProps) {
  const [mode, setMode] = useThemeBuilderMode();
  return (
    <section className="border-b border-border/60">
      <div className="flex w-full items-center gap-1.5 px-3 pt-2.5 pb-1.5">
        <span className="text-xs font-medium text-foreground">Display</span>
      </div>
      <div className="px-3 pb-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Viewport — segmented icon row. */}
          <div className="space-y-1">
            <span className={FIELD_LABEL}>Viewport</span>
            {/* Segmented, 2xs — the standard inspector toggle treatment
                (matches the Layout "Flex" Row/Stack group exactly). */}
            <ToggleGroup
              type="single"
              variant="segmented"
              size="2xs"
              value={viewportWidth}
              // Radix emits "" when the active item is re-clicked; ignore
              // it so a viewport is always selected.
              onValueChange={(v: string) => {
                if (v) onViewportChange(v as ViewportWidth);
              }}
              className="w-full"
            >
              {VIEWPORT_OPTIONS.map((o) => (
                <ToggleGroupItem
                  key={o.value}
                  value={o.value}
                  aria-label={o.label}
                  title={`${o.label} · ${o.hint}`}
                  className="flex-1 [&_svg]:size-3.5"
                >
                  {o.icon}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          {/* Zoom — Fit + presets + steppers menu. */}
          <div className="space-y-1">
            <span className={FIELD_LABEL}>Zoom</span>
            <div className="flex">
              <ZoomMenu zoomState={zoomState} zoomApi={zoomApi} />
            </div>
          </div>
          {/* Mode — light/dark preview toggle, same segmented icon
              treatment as Viewport. */}
          <div className="space-y-1">
            <span className={FIELD_LABEL}>Mode</span>
            <ToggleGroup
              type="single"
              variant="segmented"
              size="2xs"
              value={mode}
              // Radix emits "" when the active item is re-clicked;
              // ignore it so a mode is always selected.
              onValueChange={(v: string) => {
                if (v === "light" || v === "dark") setMode(v);
              }}
              className="w-full"
            >
              <ToggleGroupItem
                value="light"
                aria-label="Light mode"
                title="Light · previewed screens only"
                className="flex-1 [&_svg]:size-3.5"
              >
                <Sun className="h-3.5 w-3.5 shrink-0" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="dark"
                aria-label="Dark mode"
                title="Dark · previewed screens only"
                className="flex-1 [&_svg]:size-3.5"
              >
                <Moon className="h-3.5 w-3.5 shrink-0" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>
    </section>
  );
}
