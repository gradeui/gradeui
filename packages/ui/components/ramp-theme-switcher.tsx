"use client";

import * as React from "react";
import { Palette, Check, Trash2, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMaybeRampTheme } from "@/components/ramp-theme-provider";
import { cn } from "@/lib/utils";
import { builtInThemes, downloadThemeMarkdown } from "@/lib/themes";

/**
 * Theme switcher — iterates every registered theme (built-in + user) and
 * lets you pick one. User themes get a delete button on hover.
 *
 * Renders nothing when no <RampThemeProvider> is mounted, so it's safe to
 * drop into any layout.
 */
export function RampThemeSwitcher({ className }: { className?: string }) {
  const ctx = useMaybeRampTheme();
  if (!ctx) return null;

  const { theme, themes, setThemeId, deleteTheme } = ctx;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-2", className)}
          aria-label="Switch theme"
        >
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">{theme.name}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="end">
        <div className="flex items-start justify-between gap-2 px-2 py-1.5 mb-1">
          <div>
            <div className="text-xs font-medium text-muted-foreground">Theme</div>
            <div className="text-xs text-muted-foreground/80">
              Switch the skin applied site-wide.
            </div>
          </div>
          <button
            type="button"
            onClick={() => downloadThemeMarkdown(theme)}
            className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Download the active theme as a markdown spec — paste into a fresh LLM prompt"
          >
            <Download className="h-3 w-3" />
            .md
          </button>
        </div>
        <div className="flex flex-col gap-0.5">
          {themes.map((t) => {
            const active = t.id === theme.id;
            const isBuiltIn = t.id in builtInThemes;
            // Swatch previews the three ramps at step 500 — primary, accent, neutral.
            const primary500 = t.ramps.primary[500];
            const accent500 = t.ramps.accent[500];
            const neutral500 = t.ramps.neutral[500];
            return (
              <div
                key={t.id}
                className={cn(
                  // Subtle muted hover, no accent-color tint — avoids the
                  // problem where a strongly tinted background strands the
                  // muted-foreground description text inside as grey-on-tint.
                  "group flex items-start gap-3 rounded-md px-2 py-2 text-left transition-colors",
                  "hover:bg-muted",
                  active && "bg-muted"
                )}
              >
                <button
                  type="button"
                  onClick={() => setThemeId(t.id)}
                  className="flex items-start gap-3 flex-1 min-w-0 text-left"
                >
                  {/* 3-stop swatch: primary, accent, neutral (at step 500) */}
                  <div className="mt-0.5 flex shrink-0 overflow-hidden rounded-md border border-border">
                    <div
                      className="h-5 w-2.5"
                      style={{ background: `oklch(${primary500})` }}
                      aria-hidden
                    />
                    <div
                      className="h-5 w-2.5"
                      style={{ background: `oklch(${accent500})` }}
                      aria-hidden
                    />
                    <div
                      className="h-5 w-2.5"
                      style={{ background: `oklch(${neutral500})` }}
                      aria-hidden
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate text-foreground">
                        {t.name}
                      </span>
                      {t.tagline && (
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground shrink-0">
                          {t.tagline}
                        </span>
                      )}
                    </div>
                    {t.description && (
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {t.description}
                      </div>
                    )}
                  </div>
                </button>
                {active && (
                  <Check className="mt-2 h-4 w-4 shrink-0 text-primary" />
                )}
                {!isBuiltIn && !active && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTheme(t.id);
                    }}
                    className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity rounded p-1 hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Delete theme ${t.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
