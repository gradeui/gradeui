"use client";

import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useRampTheme } from "@/components/ramp-theme-provider";

/**
 * Binary light/dark toggle — flips between `light` and `dark` modes.
 * For the full 4-way picker (including super-light / super-dark), use
 * <RampModeSwitcher /> instead.
 */
export function ThemeToggle() {
  const { isDark, setMode } = useRampTheme();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setMode(isDark ? "light" : "dark")}
      className="gap-2"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <>
          <Sun className="h-4 w-4" />
          <span className="hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4" />
          <span className="hidden sm:inline">Dark</span>
        </>
      )}
    </Button>
  );
}
