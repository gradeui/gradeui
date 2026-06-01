"use client";

import * as React from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { ThreeScene } from "@/components/ui/three-scene";
import { ShaderControls } from "@/components/ui/shader-controls";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  POST_CONTROLS,
  POST_DEFAULTS,
  postStateToPreset,
} from "@/lib/three/post-controls";
import { shaderPresets } from "@/lib/three/shader-presets";
import type { DemoState } from "@/lib/three/schema";

// Theme-reactive palette: every value reads a theme token (wrapped in
// oklch() per the gradeui contract), so switching the page theme
// re-tints the running shader with no remount. secondary→--accent and
// background→--foreground per the ThreeScene palette guidance.
const THEME_PALETTE = {
  primary: "oklch(var(--primary))",
  secondary: "oklch(var(--accent))",
  accent: "oklch(var(--primary))",
  background: "oklch(var(--foreground))",
};

/**
 * Live shader playground — a full-bleed shader with a floating glass
 * control panel (collapsible to a settings icon). Switch shaders from
 * the dropdown; drag any post control to update live; flip the page
 * theme to watch every shader re-tint.
 */
export function PostPlayground() {
  const [preset, setPreset] = React.useState("mesh");
  const [open, setOpen] = React.useState(true);
  const [state, setState] = React.useState<DemoState>(() => ({
    ...POST_DEFAULTS,
    bloomIntensity: 0.5,
    grain: 0.03,
    vignette: 0.35,
  }));

  const post = React.useMemo(() => postStateToPreset(state), [state]);
  const onChange = React.useCallback(
    (key: string, value: number | string | boolean | string[]) =>
      setState((s) => ({ ...s, [key]: value })),
    [],
  );

  return (
    <div className="relative">
      <ThreeScene
        key={preset}
        preset={preset}
        postPreset={post}
        palette={THEME_PALETTE}
        aspect="standard"
        radius="lg"
      />

      {/* `dark` forces the panel to the dark token set regardless of the
          page theme — one consistent dark glass material (matching the
          shared dropdown), readable over any shader. */}
      <div className="dark absolute right-3 top-3 z-10 text-foreground">
        {open ? (
          <Card
            surface="glass"
            className="w-[248px] overflow-hidden p-0 text-foreground shadow-elevation-4"
          >
            <div className="flex items-center gap-1.5 border-b border-border/40 p-2">
              <Select value={preset} onValueChange={setPreset}>
                <SelectTrigger size="xs" className="min-w-0 flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent size="xs">
                  {shaderPresets.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Hide controls"
                title="Hide controls"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-3.5"
              >
                <X />
              </button>
            </div>
            {/* One consistent glass surface — no separate scrim. The forced
                `dark` context + glass blur keeps light text readable over a
                bright shader, same material as the shared dropdown. */}
            <div
              className="max-h-[300px] overflow-y-auto p-2.5"
              data-lenis-prevent
            >
              <ShaderControls
                controls={POST_CONTROLS}
                state={state}
                onChange={onChange}
              />
            </div>
          </Card>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Show controls"
            title="Show controls"
          >
            <Card
              surface="glass"
              className="flex h-9 w-9 items-center justify-center p-0 text-foreground shadow-elevation-4"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Card>
          </button>
        )}
      </div>
    </div>
  );
}
