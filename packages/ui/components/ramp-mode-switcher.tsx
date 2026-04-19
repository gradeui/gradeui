"use client";

import * as React from "react";
import { Sun, SunDim, Moon, MoonStar } from "lucide-react";

import { useMaybeRampTheme } from "@/components/ramp-theme-provider";
import { cn } from "@/lib/utils";
import type { ModeName } from "@/lib/themes";

/**
 * 4-way mode switcher. Segmented control: super-light / light / dark / super-dark.
 *
 * Renders nothing without a RampThemeProvider. Default layout is a compact
 * 4-icon row suitable for a header; the `variant="labeled"` form adds
 * text labels for settings pages.
 */
export interface RampModeSwitcherProps {
  className?: string;
  variant?: "icons" | "labeled";
}

const MODES: Array<{
  mode: ModeName;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tooltip: string;
}> = [
  { mode: "superLight", label: "Super light", icon: SunDim, tooltip: "Super light — airy, low contrast" },
  { mode: "light", label: "Light", icon: Sun, tooltip: "Light" },
  { mode: "dark", label: "Dark", icon: Moon, tooltip: "Dark" },
  { mode: "superDark", label: "Super dark", icon: MoonStar, tooltip: "Super dark — OLED, high contrast" },
];

export function RampModeSwitcher({ className, variant = "icons" }: RampModeSwitcherProps) {
  const ctx = useMaybeRampTheme();
  if (!ctx) return null;
  const { mode, setMode } = ctx;

  if (variant === "labeled") {
    return (
      <div
        role="radiogroup"
        aria-label="Brightness mode"
        className={cn(
          "inline-flex flex-wrap gap-1 rounded-md border border-border bg-background p-1",
          className
        )}
      >
        {MODES.map(({ mode: m, label, icon: Icon }) => {
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setMode(m)}
              className={cn(
                "flex items-center gap-2 rounded px-3 py-1.5 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Brightness mode"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-border bg-background p-0.5",
        className
      )}
    >
      {MODES.map(({ mode: m, icon: Icon, tooltip }) => {
        const active = mode === m;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={tooltip}
            title={tooltip}
            onClick={() => setMode(m)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
