"use client";

/**
 * FlatScreen — the CAPTURE-GRADE embed render. `/e/<token>?flat=1`.
 *
 * Ali's cut-through on 2026-06-11, after a day of black posters: "why
 * don't you just capture a page that isn't inside an iframe?" Exactly.
 * The normal embed (EmbedScreen → FastIframeHost → fast-sandbox route)
 * nests the screen in an iframe for live-viewing reasons — isolation
 * and a virtual viewport. A Playwright capture needs neither: the REAL
 * browser viewport is set to the requested size, so breakpoints are
 * honest by construction, and there's no second page boot to race.
 *
 * This component is the whole pipeline, flat:
 *   appSource → heal → pre-resolve esm imports → compile (sucrase) →
 *   render inside RenderErrorBoundary, themed by inline vars.
 *
 * THE CONTRACT (the part every capture before this lacked): the root
 * div carries `data-grade-ready` — "0" while compiling, "1" two RAFs
 * after the compiled component mounts (first real frame committed),
 * "error" if compilation failed (the error panel still renders, so a
 * capture of a broken screen SHOWS the error instead of a void).
 * Playwright waits for the attribute, not for a heuristic.
 *
 * Theme vars are applied INLINE on the root (the desktop approach) —
 * immune to the stale-stylesheet cascade traps that bit the bundle
 * (see SCALED-PANEL-PLAN.md, "pink progress bar").
 */

import * as React from "react";
import {
  compile,
  healMissingLucideImports,
  preResolveUnknownImports,
  FailurePanel,
  PreviewWrap,
  RenderErrorBoundary,
} from "@/lib/studio-render-core";
import { generateTheme, themeToCSSVars, builtInThemes, defaultThemeId } from "@/lib/themes";
import type { GeneratedTheme, ThemeInput } from "@/lib/themes";

export function FlatScreen({
  appSource,
  themeDraftJson,
  mode = "light",
  motion,
}: {
  appSource: string | null;
  themeDraftJson: string | null;
  mode?: "light" | "dark";
  motion?: boolean;
}) {
  // Same theme resolution as EmbedScreen/SharedScreen: draft → generate,
  // missing or malformed → the generated default.
  const theme = React.useMemo<GeneratedTheme>(() => {
    if (themeDraftJson) {
      try {
        return generateTheme(JSON.parse(themeDraftJson) as ThemeInput);
      } catch {
        /* fall through */
      }
    }
    return builtInThemes[defaultThemeId];
  }, [themeDraftJson]);

  const themeVars = React.useMemo(
    () => themeToCSSVars(theme, mode) as React.CSSProperties,
    [theme, mode],
  );

  const [compiled, setCompiled] = React.useState<{
    Component: React.ComponentType | null;
    error: Error | null;
  }>({ Component: null, error: null });
  const [ready, setReady] = React.useState<"0" | "1" | "error">("0");

  React.useEffect(() => {
    if (!appSource) {
      setCompiled({
        Component: null,
        error: new Error("This screen has no source yet."),
      });
      return;
    }
    let cancelled = false;
    const src = healMissingLucideImports(appSource);
    void preResolveUnknownImports(src).then(() => {
      if (cancelled) return;
      setCompiled(compile(src));
    });
    return () => {
      cancelled = true;
    };
  }, [appSource]);

  // Stamp the ready contract two RAFs after the outcome renders — first
  // real frame committed, fonts/images may still settle (the capture
  // adds its own small settle on top).
  React.useEffect(() => {
    if (!compiled.Component && !compiled.error) return;
    const verdict = compiled.error ? "error" : "1";
    let raf1 = 0,
      raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setReady(verdict));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [compiled]);

  const Compiled = compiled.Component;

  return (
    <div
      className={
        "min-h-screen w-full overflow-hidden bg-background text-foreground" +
        (mode === "dark" ? " dark" : "")
      }
      data-mode={mode}
      data-grade-ready={ready}
      data-motion={motion === false ? "off" : undefined}
      style={themeVars}
    >
      {Compiled ? (
        <RenderErrorBoundary fallback={(e) => <FailurePanel error={e} />}>
          <PreviewWrap>
            <Compiled />
          </PreviewWrap>
        </RenderErrorBoundary>
      ) : compiled.error ? (
        <FailurePanel error={compiled.error} />
      ) : null}
    </div>
  );
}
