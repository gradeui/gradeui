"use client";

/**
 * EmbedScreen — the chrome-free render behind an /e/<token> embed.
 *
 * Same renderer as Studio and the share view (FastIframeHost), with the
 * editing + presentation chrome stripped: no toolbar, no theme switcher,
 * no zoom controls, no comment pins. An embed is read-or-tweak, not edit
 * and not annotate (see STUDIO-EMBED.md / STUDIO-CAPTURE.md consumer 3).
 *
 * Sizing follows the aspect-ratio default: this component fills 100% of
 * its host iframe; the embedding site controls the box (the snippet ships
 * an aspect-ratio wrapper). The screen renders responsive, so @media
 * breakpoints evaluate against the iframe's own width.
 *
 * The screen's stored colour mode is applied as the initial mode. Theme
 * comes from the project's themeDraftJson (same path as SharedScreen),
 * falling back to the default built-in theme.
 */

import * as React from "react";
import { FastIframeHost } from "@/components/studio/fast-frame";
import {
  generateTheme,
  builtInThemes,
  defaultThemeId,
} from "@/lib/themes";
import type { ThemeInput, GeneratedTheme } from "@/lib/themes";
import { cn } from "@/lib/utils";

export function EmbedScreen({
  appSource,
  themeDraftJson,
  mode = "light",
}: {
  appSource: string | null;
  themeDraftJson: string | null;
  mode?: "light" | "dark";
}) {
  // Project theme — same resolution as SharedScreen: parse the draft,
  // generate the ramp set, fall back to the default built-in on any
  // malformed input.
  const theme = React.useMemo<GeneratedTheme>(() => {
    if (themeDraftJson) {
      try {
        return generateTheme(JSON.parse(themeDraftJson) as ThemeInput);
      } catch {
        /* fall through to default */
      }
    }
    return builtInThemes[defaultThemeId];
  }, [themeDraftJson]);

  return (
    <div
      className={cn(
        "h-screen w-screen overflow-hidden bg-background",
        mode === "dark" && "dark",
      )}
      data-mode={mode}
    >
      <FastIframeHost
        appSource={appSource}
        theme={theme}
        mode={mode}
        className="block h-full w-full"
      />
    </div>
  );
}
