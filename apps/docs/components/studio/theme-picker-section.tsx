"use client";

/**
 * ThemePickerSection — switch which registered theme the Theme tab is
 * editing. Lives at the top of the Theme tab, above the builder
 * controls.
 *
 * Reads the theme registry off `useMaybeGradeTheme()` (built-in + user
 * themes, same list the chrome popover shows) and the current draft
 * baseline off `useMaybeThemeBuilder()`. Clicking a swatch calls
 * `rebase(cloneInput(t.input))` on the builder's history — wipes
 * undo/redo, sets a fresh anchor, dirty dot goes quiet, the canvas
 * iframe re-skins immediately.
 *
 * Important: this picker is INDEPENDENT of the chrome popover. It only
 * mutates the draft (preview iframe) theme. The docs chrome stays on
 * whatever GradeThemeSwitcher set. That's by design — Studio is a tool
 * for designing screens, so the screens get their own theme.
 *
 * Renders nothing if either provider is missing — safe to drop into
 * any host.
 */

import * as React from "react";
import { Check } from "lucide-react";

import { useMaybeGradeTheme } from "@/components/grade-theme-provider";
import { useMaybeThemeBuilder } from "@/components/theme-builder";
import { cloneInput } from "@/lib/studio-state";
import { cn } from "@/lib/utils";

export interface ThemePickerSectionProps {
  className?: string;
}

export function ThemePickerSection({ className }: ThemePickerSectionProps) {
  const grade = useMaybeGradeTheme();
  const builder = useMaybeThemeBuilder();

  if (!grade || !builder) return null;

  const { themes } = grade;
  const activeBaselineId = builder.input.id;

  return (
    <div
      className={cn(
        "px-3 py-3 border-b border-border space-y-2",
        className,
      )}
    >
      {/* No "Theme" heading — the Theme tab trigger above already
          names the section. The "Applies to screens" hint is kept
          (and only kept) because it carries non-obvious behaviour:
          edits here don't touch the docs chrome. */}
      <p className="text-[10px] text-muted-foreground/60">
        Applies to screens
      </p>
      <div className="flex flex-col gap-0.5">
        {themes.map((t) => {
          const active = t.id === activeBaselineId;
          const primary500 = t.ramps.primary[500];
          const accent500 = t.ramps.accent[500];
          const neutral500 = t.ramps.neutral[500];
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => builder.rebase(cloneInput(t.input))}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                "hover:bg-muted",
                active && "bg-muted",
              )}
              aria-pressed={active}
            >
              <div
                className="flex shrink-0 overflow-hidden rounded-sm border border-border"
                aria-hidden
              >
                <div
                  className="h-4 w-2"
                  style={{ background: `oklch(${primary500})` }}
                />
                <div
                  className="h-4 w-2"
                  style={{ background: `oklch(${accent500})` }}
                />
                <div
                  className="h-4 w-2"
                  style={{ background: `oklch(${neutral500})` }}
                />
              </div>
              <span className="flex-1 min-w-0 truncate text-xs text-foreground">
                {t.name}
              </span>
              {active && (
                <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
