"use client";

/**
 * SharedScreen — the read-only render behind a /s/<token> share link.
 *
 * Reuses the exact same iframe renderer as Studio (FastIframeHost), so a
 * shared screen looks identical to the editor — same components, same
 * compile path, same theme.
 *
 * The Grade share toolbar carries the brand + a live theme / light-dark
 * switcher: the viewer can flip the SAME screen through different
 * treatments instantly (the renderer re-skins on a theme prop change,
 * no reload). Hide it all with `.` for a clean full-bleed view. This is
 * the "controls" shelf that'll grow more tweakers over time.
 */

import * as React from "react";
import {
  Sun,
  Moon,
  PanelTopClose,
  PanelTopOpen,
  ChevronDown,
  Check,
} from "lucide-react";
import { FastIframeHost } from "@/components/studio/fast-frame";
import { GradeLogo } from "@/components/grade-logo";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  generateTheme,
  builtInThemes,
  defaultThemeId,
  listThemes,
} from "@/lib/themes";
import type { ThemeInput, GeneratedTheme } from "@/lib/themes";
import { cn } from "@/lib/utils";

/** Mini swatch for the theme menu. Shows the BRAND colours (primary +
 *  accent) and skips the neutral stop — including grey made every chip
 *  read muted regardless of how bold the theme actually is. */
function ThemeSwatch({ theme }: { theme: GeneratedTheme }) {
  return (
    <span
      className="flex h-4 shrink-0 items-center overflow-hidden rounded-sm border border-border/60"
      aria-hidden
    >
      <span className="h-full w-2.5" style={{ background: `oklch(${theme.ramps.primary[600]})` }} />
      <span className="h-full w-2.5" style={{ background: `oklch(${theme.ramps.accent[500]})` }} />
    </span>
  );
}

export function SharedScreen({
  appSource,
  themeDraftJson,
  mode: initialMode = "light",
  screenName = "Screen",
  projectName = "Untitled project",
  canComment = false,
}: {
  appSource: string | null;
  themeDraftJson: string | null;
  mode?: "light" | "dark";
  screenName?: string;
  projectName?: string;
  canComment?: boolean;
}) {
  // The project's own theme — the default treatment the share opens on.
  const projectTheme = React.useMemo<GeneratedTheme>(() => {
    if (themeDraftJson) {
      try {
        return generateTheme(JSON.parse(themeDraftJson) as ThemeInput);
      } catch {
        /* fall through */
      }
    }
    return builtInThemes[defaultThemeId];
  }, [themeDraftJson]);

  // Switchable set: the project theme first, then the public bundle
  // (deduped by id). "Browse all" / curated A/B sets layer on later.
  const themes = React.useMemo<GeneratedTheme[]>(() => {
    const map = new Map<string, GeneratedTheme>();
    map.set(projectTheme.id, projectTheme);
    for (const t of listThemes()) if (!map.has(t.id)) map.set(t.id, t);
    return [...map.values()];
  }, [projectTheme]);

  const [activeThemeId, setActiveThemeId] = React.useState(projectTheme.id);
  const [mode, setMode] = React.useState<"light" | "dark">(initialMode);
  const [chromeVisible, setChromeVisible] = React.useState(true);
  // Discrete zoom levels — down-only (never past 100%, where scaling up
  // just looks broken). "Fit" is reserved for when the iframe reports
  // its content height.
  const ZOOM_LEVELS = [1, 0.9, 0.8, 0.5];
  const [zoom, setZoom] = React.useState(1);

  const activeTheme =
    themes.find((t) => t.id === activeThemeId) ?? projectTheme;

  // `.` toggles the toolbar for a clean full-bleed view.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.key === ".") {
        e.preventDefault();
        setChromeVisible((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const iconBtn =
    "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground";
  const segBtn =
    "inline-flex h-5 w-6 items-center justify-center rounded-sm transition";

  return (
    <div
      className={cn(
        "flex h-screen w-screen flex-col overflow-hidden bg-background",
        mode === "dark" && "dark",
      )}
      data-mode={mode}
    >
      {/* ── Glass toolbar — in flow on top, so it never covers the
          screen at 100%. Reads as a floating glass bar via the margin
          + translucency. ── */}
      {chromeVisible ? (
        <header className="m-2 flex h-11 shrink-0 items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/70 px-3 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/55">
          {/* Brand + name */}
          <div className="flex min-w-0 items-center gap-2.5">
            <GradeLogo size={20} className="shrink-0 text-foreground" />
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="truncate text-sm font-medium text-foreground">
                {screenName}
              </span>
              <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                {projectName}
              </span>
            </div>
          </div>

          {/* Controls shelf — theme menu, light/dark, zoom. Grows over
              time (more "tweakers"). */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Theme — glass dropdown with names */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  title="Theme"
                  className="flex h-7 items-center gap-1.5 rounded-md border border-border/60 px-2 text-xs text-foreground transition hover:bg-foreground/10"
                >
                  <ThemeSwatch theme={activeTheme} />
                  <span className="hidden max-w-[8rem] truncate sm:inline">
                    {activeTheme.name}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="max-h-[60vh] w-52 overflow-y-auto border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/65"
              >
                {themes.map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => setActiveThemeId(t.id)}
                    className="gap-2"
                  >
                    <ThemeSwatch theme={t} />
                    <span className="flex-1 truncate">{t.name}</span>
                    {t.id === activeThemeId && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Light / dark */}
            <div className="flex items-center rounded-md border border-border/60 p-0.5">
              <button
                type="button"
                onClick={() => setMode("light")}
                aria-pressed={mode === "light"}
                title="Light"
                className={cn(
                  segBtn,
                  mode === "light"
                    ? "bg-foreground/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setMode("dark")}
                aria-pressed={mode === "dark"}
                title="Dark"
                className={cn(
                  segBtn,
                  mode === "dark"
                    ? "bg-foreground/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Zoom — discrete down-levels on a glass menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  title="Zoom"
                  className="hidden h-7 items-center gap-1 rounded-md border border-border/60 px-2 text-xs tabular-nums text-foreground transition hover:bg-foreground/10 sm:flex"
                >
                  {Math.round(zoom * 100)}%
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-[6rem] border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/65"
              >
                {ZOOM_LEVELS.map((z) => (
                  <DropdownMenuItem
                    key={z}
                    onClick={() => setZoom(z)}
                    className="gap-2 tabular-nums"
                  >
                    <span className="flex-1">{Math.round(z * 100)}%</span>
                    {z === zoom && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              type="button"
              onClick={() => setChromeVisible(false)}
              title="Hide UI (press .)"
              aria-label="Hide UI"
              className={iconBtn}
            >
              <PanelTopClose className="h-4 w-4" />
            </button>
          </div>
        </header>
      ) : (
        <button
          type="button"
          onClick={() => setChromeVisible(true)}
          title="Show UI (press .)"
          aria-label="Show UI"
          className="absolute right-2 top-2 z-20 inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-background/70 text-muted-foreground shadow-sm backdrop-blur-md hover:text-foreground"
        >
          <PanelTopOpen className="h-4 w-4" />
        </button>
      )}

      {/* ── Rendered screen — fills below the bar (never obscured). A
          studio-style dot grid shows on zoom-out so the screen reads as
          sitting in a constrained canvas; zoom scales from the centre. ── */}
      <div
        className="relative min-h-0 flex-1 overflow-auto bg-muted/15"
        style={{
          backgroundImage:
            "radial-gradient(circle, color-mix(in oklab, var(--foreground) 22%, transparent) 1px, transparent 1.6px)",
          backgroundSize: "16px 16px",
        }}
      >
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <p className="animate-pulse text-sm text-muted-foreground">
            Loading preview…
          </p>
        </div>

        {/* Annotation — appears on zoom-out, labelling the screen as it
            sits in space. */}
        {zoom < 1 && (
          <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur-md">
              <span className="font-medium text-foreground">{screenName}</span>
              <span className="opacity-40">·</span>
              <span className="tabular-nums">{Math.round(zoom * 100)}%</span>
            </span>
          </div>
        )}

        <div
          className={cn(
            "relative z-10 h-full w-full transition-shadow",
            // Card treatment only when it's sitting "in space" (zoomed
            // out). At 100% it's full-bleed, so no shadow / rounding.
            zoom < 1 &&
              "overflow-hidden rounded-xl shadow-2xl ring-1 ring-border/40",
          )}
          style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
        >
          <FastIframeHost
            appSource={appSource}
            theme={activeTheme}
            mode={mode}
            className="h-full w-full"
          />
        </div>
      </div>
    </div>
  );
}
