"use client";

/**
 * EmbedTweaker — the embed's opt-in theme playground.
 *
 * A small settings trigger in the embed's corner that opens a SHEET
 * overlay of theme controls. Everything is EMBED-LOCAL: changes
 * regenerate a theme client-side and flow into the sandbox via
 * FastIframeHost's existing `grade:fast-theme` push. Nothing persists,
 * nothing touches the project.
 *
 * Theme choices render as SWATCH ROWS — background, surface, primary,
 * accent shown as one strip per theme (same pattern as the old
 * GradeThemeSwitcher's 3-stop swatch, extended to 4) — because seeing
 * the palette relationships matters more than reading descriptions.
 *
 * Controls are gated by the embed URL's `?tweak=` param, and the theme
 * list can be curated via `?themes=` (parsed in app/e/[token]/page.tsx):
 *
 *   ?tweak=1                                — every control
 *   ?tweak=theme,mode                       — a subset
 *   ?themes=calm,candy-pop,forest-terminal  — curated picker
 *
 * This is the showcase mechanic: a Grade render that visitors can
 * re-theme live, anywhere it's embedded (see STUDIO-EMBED.md /
 * STUDIO-THEMES.md — remix energy, zero write access).
 */

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Settings2, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  BUILT_IN_INPUTS,
  builtInThemes,
  generateTheme,
} from "@/lib/themes";
import type { GeneratedTheme, ThemeInput } from "@/lib/themes";

export type EmbedTweakControl = "theme" | "hue" | "density" | "mode";

const DENSITIES = ["tight", "default", "roomy"] as const;

/** Background · surface · primary · accent as one strip — the palette
 *  relationship at a glance. Values are OKLCH triplets from the
 *  generated theme's resolved colour set for the active mode. */
function ThemeSwatch({
  theme,
  mode,
}: {
  theme: GeneratedTheme;
  mode: "light" | "dark";
}) {
  const c = theme.colors[mode];
  const stops = [c.background, c.card, c.primary, c.accent];
  return (
    <span className="flex items-center -space-x-1">
      {stops.map((v, i) => (
        <span
          key={i}
          className={cn(
            "h-4 w-4 rounded-full border",
            mode === "light" ? "border-black/20" : "border-white/25",
          )}
          style={{ background: `oklch(${v})`, zIndex: stops.length - i }}
        />
      ))}
    </span>
  );
}

export interface EmbedTweakerProps {
  /** The screen's own theme input (project draft or default). */
  baseInput: ThemeInput;
  /** The embed's initial colour mode. */
  baseMode: "light" | "dark";
  /** Which controls to show. */
  allow: EmbedTweakControl[];
  /** Curated built-in theme ids for the picker (?themes= on the embed
   *  URL). Null = every built-in. A tight set of 3-5 themes that sit
   *  far apart on different axes (type, spacing, shape, colour) shows
   *  the system better than the full catalogue. */
  themeIds?: string[] | null;
  /** Fires with a freshly generated theme + mode on every change. */
  onChange: (theme: GeneratedTheme, mode: "light" | "dark") => void;
}

export function EmbedTweaker({
  baseInput,
  baseMode,
  allow,
  themeIds,
  onChange,
}: EmbedTweakerProps) {
  // Curated subset when ?themes= is present; unknown ids drop silently.
  const themeList = React.useMemo(
    () =>
      themeIds && themeIds.length > 0
        ? BUILT_IN_INPUTS.filter((t) => themeIds.includes(t.id))
        : BUILT_IN_INPUTS,
    [themeIds],
  );
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = React.useState(false);
  // "project" = the screen's own theme; otherwise a built-in id.
  const [themeId, setThemeId] = React.useState<string>("project");
  const [hue, setHue] = React.useState<number | null>(null);
  const [density, setDensity] = React.useState<
    (typeof DENSITIES)[number] | null
  >(null);
  const [mode, setMode] = React.useState<"light" | "dark">(baseMode);

  const can = (c: EmbedTweakControl) => allow.includes(c);

  // The screen's own theme, generated once for the "Original" swatch.
  const projectTheme = React.useMemo(
    () => generateTheme(baseInput),
    [baseInput],
  );

  const recompute = React.useCallback(
    (next: {
      themeId?: string;
      hue?: number | null;
      density?: (typeof DENSITIES)[number] | null;
      mode?: "light" | "dark";
    }) => {
      const tid = next.themeId ?? themeId;
      const h = next.hue !== undefined ? next.hue : hue;
      const d = next.density !== undefined ? next.density : density;
      const m = next.mode ?? mode;

      const base =
        tid === "project" ? baseInput : builtInThemes[tid]?.input ?? baseInput;
      const input: ThemeInput = {
        ...base,
        hues: {
          ...base.hues,
          ...(h != null ? { primary: h } : {}),
        },
        spacing: {
          ...base.spacing,
          density: d ?? base.spacing.density,
        },
      };
      onChange(generateTheme(input), m);
    },
    [themeId, hue, density, mode, baseInput, onChange],
  );

  // The EFFECTIVE density: the explicit override when set, otherwise
  // whatever the active base theme declares. Keeps the segmented
  // control honest before the user touches it, and snaps it to each
  // theme's own density as you switch themes.
  const activeInput =
    themeId === "project"
      ? baseInput
      : builtInThemes[themeId]?.input ?? baseInput;
  const effDensity = density ?? activeInput.spacing.density ?? "default";

  // The sheet honours the playground's CURRENT mode: light glass over a
  // light render, dark glass over a dark one. All hardcoded — the embed
  // page has no theme provider, so these can't ride tokens.
  const light = mode === "light";
  const subtle = light ? "text-black/50" : "text-white/50";
  const segBtn = (selected: boolean) =>
    cn(
      "h-6 flex-1 inline-flex items-center justify-center rounded-md text-[11px] capitalize transition",
      selected
        ? light
          ? "bg-neutral-900 text-white"
          : "bg-white text-black"
        : light
          ? "bg-black/10 text-black/70 hover:bg-black/20"
          : "bg-white/10 text-white/80 hover:bg-white/20",
    );
  const rowClass = (selected: boolean) =>
    cn(
      "flex w-full items-center justify-between gap-3 rounded-lg border px-2.5 py-2 text-left text-xs transition",
      selected
        ? light
          ? "border-neutral-900 bg-black/10 text-neutral-900"
          : "border-white bg-white/15 text-white"
        : light
          ? "border-black/15 bg-black/5 text-black/70 hover:bg-black/10 hover:text-black"
          : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white",
    );

  return (
    <>
      {/* Corner trigger — fades while the sheet is open. */}
      <AnimatePresence initial={false}>
        {!open && (
          <motion.div
            key="trigger"
            className="absolute bottom-3 left-3 z-20"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={
              reducedMotion
                ? { duration: 0.15 }
                : { type: "spring", stiffness: 550, damping: 30 }
            }
          >
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Tweak this render"
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition",
                light
                  ? "border-black/15 bg-white/70 text-neutral-900 hover:bg-white/90"
                  : "border-white/20 bg-black/45 text-white hover:bg-black/60",
              )}
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          // No scrim: the entire point is watching the render re-theme
          // while you tweak. Click-outside-to-close still works.
          overlayClassName="bg-transparent"
          closeClassName={cn(
            "right-6 top-6 inline-flex h-6 w-6 items-center justify-center rounded-md opacity-100 transition",
            light
              ? "text-black/60 hover:bg-black/10 hover:text-black"
              : "text-white/70 hover:bg-white/10 hover:text-white",
          )}
          className={cn(
            "gds-tweak-panel w-72 overflow-y-auto backdrop-blur-xl",
            light
              ? "border-black/10 bg-white/85 text-neutral-900"
              : "dark border-white/15 bg-black/70 text-white",
          )}
        >
          <SheetHeader>
            <SheetTitle
              className={cn(
                "text-sm",
                light ? "text-neutral-900" : "text-white",
              )}
            >
              Theme playground
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 flex flex-col gap-4">
            {can("theme") && (
              <div>
                <span className={cn("block text-[11px] mb-1.5 leading-none", subtle)}>
                  Theme
                </span>
                <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Theme">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={themeId === "project"}
                    onClick={() => {
                      setThemeId("project");
                      setHue(null);
                      setDensity(null);
                      recompute({ themeId: "project", hue: null, density: null });
                    }}
                    className={rowClass(themeId === "project")}
                  >
                    Original
                    <ThemeSwatch theme={projectTheme} mode={mode} />
                  </button>
                  {themeList.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="radio"
                      aria-checked={themeId === t.id}
                      onClick={() => {
                        // Picking a theme resets the per-knob overrides so
                        // the theme arrives pure, not wearing the previous
                        // theme's hue and density edits.
                        setThemeId(t.id);
                        setHue(null);
                        setDensity(null);
                        recompute({ themeId: t.id, hue: null, density: null });
                      }}
                      className={rowClass(themeId === t.id)}
                    >
                      {t.name}
                      <ThemeSwatch theme={builtInThemes[t.id]} mode={mode} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {can("hue") && (
              <div>
                <span className={cn("flex items-center justify-between text-[11px] mb-1 leading-none", subtle)}>
                  Primary hue
                  <span className={cn("font-mono", light ? "text-black/70" : "text-white/70")}>
                    {hue != null ? `${Math.round(hue)}°` : "theme"}
                  </span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={hue ?? 250}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setHue(v);
                    recompute({ hue: v });
                  }}
                  aria-label="Primary hue"
                  className="block w-full h-1.5 cursor-pointer appearance-none rounded-full"
                  style={{
                    background:
                      "linear-gradient(to right, oklch(0.62 0.14 0), oklch(0.62 0.14 60), oklch(0.62 0.14 120), oklch(0.62 0.14 180), oklch(0.62 0.14 240), oklch(0.62 0.14 300), oklch(0.62 0.14 360))",
                  }}
                />
              </div>
            )}

            {can("density") && (
              <div>
                <span className={cn("block text-[11px] mb-1 leading-none", subtle)}>
                  Density
                </span>
                <div className="flex gap-1">
                  {DENSITIES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setDensity(d);
                        recompute({ density: d });
                      }}
                      className={segBtn(effDensity === d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {can("mode") && (
              <div>
                <span className={cn("block text-[11px] mb-1 leading-none", subtle)}>
                  Mode
                </span>
                <div className="flex gap-1">
                  {(["light", "dark"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setMode(m);
                        recompute({ mode: m });
                      }}
                      aria-label={m === "light" ? "Light mode" : "Dark mode"}
                      className={segBtn(mode === m)}
                    >
                      {m === "light" ? (
                        <Sun className="h-3 w-3" />
                      ) : (
                        <Moon className="h-3 w-3" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className={cn("mt-5 text-[11px] leading-relaxed", subtle)}>
            This is just a small subset of what you can do. Everything is
            possible… make it yours.
          </p>
        </SheetContent>
      </Sheet>
    </>
  );
}
