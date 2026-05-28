"use client";

/**
 * ThemePicker — inline theme-switching control for the builder panel.
 *
 * Reads the `useMaybeGradeTheme()` registry (built-in + user themes) and
 * renders one swatch row per entry. Clicking a row does two things:
 *
 *   1. `setThemeId(t.id)` — activate that theme site-wide, same as the
 *      header GradeThemeSwitcher used to do. CSS custom properties on
 *      `:root` (`--gds-*`) rewrite, the entire docs chrome re-skins.
 *   2. `rebase(cloneInput(t.input))` — push the picked theme's
 *      ThemeInput as the new history anchor on the builder. The working
 *      draft now starts from the picked theme; undo/redo resets; the
 *      dirty dot goes back to clean.
 *
 * Both side effects fire together so the panel and the chrome can never
 * diverge on "which theme is active". This component renders nothing
 * outside a `<GradeThemeProvider>` — the panel works fine in scoped /
 * draft hosts that don't expose a theme registry, it just hides the
 * picker.
 *
 * Visual language mirrors the popover-based GradeThemeSwitcher (3-stop
 * swatch + theme name + active check + hover-revealed delete for user
 * themes) so users moving between the two surfaces don't relearn
 * anything — only the layout is different.
 */

import * as React from "react";
import { Check, Trash2 } from "lucide-react";

import { useMaybeGradeTheme } from "@/components/grade-theme-provider";
import { builtInThemes } from "@/lib/themes";
import { cloneInput } from "@/lib/studio-state";
import { cn } from "@/lib/utils";
import { useMaybeThemeBuilder } from "./theme-builder-provider";

export interface ThemePickerProps {
  className?: string;
}

export function ThemePicker({ className }: ThemePickerProps) {
  const grade = useMaybeGradeTheme();
  const builder = useMaybeThemeBuilder();

  // Nothing to switch between if the host hasn't wired up the registry.
  // (The panel still renders, the section just disappears.)
  if (!grade) return null;

  const { theme: active, themes, setThemeId, deleteTheme } = grade;

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {themes.map((t) => {
        const isActive = t.id === active.id;
        const isBuiltIn = t.id in builtInThemes;

        // Same 3-stop reading the GradeThemeSwitcher uses, so visual
        // parity is automatic. Step 500 is the "brand-strength" cell.
        const primary500 = t.ramps.primary[500];
        const accent500 = t.ramps.accent[500];
        const neutral500 = t.ramps.neutral[500];

        return (
          <div
            key={t.id}
            className={cn(
              "group flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
              "hover:bg-muted",
              isActive && "bg-muted"
            )}
          >
            <button
              type="button"
              onClick={() => {
                // 1. Site-wide activation. Fires the GradeThemeProvider's
                //    setThemeId, which writes --gds-* on :root + persists
                //    to localStorage under the `grade-theme` key.
                setThemeId(t.id);
                // 2. Reseed the builder draft. rebase clears history and
                //    sets a new initial; the dirty dot goes quiet until
                //    the next slider tick. `cloneInput` guards against
                //    accidental shared-singleton mutation.
                builder?.rebase(cloneInput(t.input));
              }}
              className="flex flex-1 items-center gap-2 min-w-0 text-left"
            >
              {/* 3-stop swatch: primary | accent | neutral, all at 500. */}
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
            </button>

            {isActive ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
            ) : !isBuiltIn ? (
              <button
                type="button"
                onClick={(e) => {
                  // Stop the row's primary click handler from firing the
                  // theme switch while we're deleting it.
                  e.stopPropagation();
                  deleteTheme(t.id);
                }}
                className={cn(
                  "shrink-0 rounded p-0.5 transition-opacity",
                  "opacity-0 group-hover:opacity-100",
                  "hover:bg-destructive/10 hover:text-destructive",
                  "text-muted-foreground"
                )}
                aria-label={`Delete theme ${t.name}`}
                title={`Delete ${t.name}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
