"use client";

/**
 * EmbedScreen — the chrome-free render behind an /e/<token> embed.
 *
 * Same renderer as Studio and the share view (FastIframeHost), with the
 * editing + presentation chrome stripped: no toolbar, no theme switcher,
 * no zoom controls, no comment pins. An embed is read-or-tweak, not edit
 * and not annotate (see STUDIO-EMBED.md / STUDIO-CAPTURE.md consumer 3).
 *
 * Two sizing modes:
 *
 *   - Responsive (default) — the screen fills the host iframe and reflows
 *     to its width, so @media breakpoints evaluate against the iframe's
 *     own viewport. A narrow box shows the mobile layout.
 *
 *   - Fixed resolution (renderWidth set) — the screen renders at that
 *     virtual WIDTH and is scaled to fit the iframe via CSS transform.
 *     Breakpoints fire at the fixed width, so you get a faithful,
 *     proportionally-shrunk render (a desktop layout miniaturised) rather
 *     than a reflow. Width is the meaningful knob — it pins the
 *     breakpoints. Height is optional:
 *       - width only → the render fills the iframe box; its virtual height
 *         is derived from the box so it always fills (the common case).
 *       - width + height → exact contain-fit into a width×height artboard,
 *         centred and letterboxed (a precise thumbnail). Same model the
 *         Studio grid tiles and the share view's fixed-device frame use.
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

/**
 * Renders `children` at a fixed virtual `width` and scales the box to fit
 * the parent via CSS transform. A ResizeObserver keeps the scale live as
 * the host iframe resizes. Two behaviours:
 *
 *   - height given → contain-fit: the largest scale that keeps a
 *     width×height artboard inside the container on both axes, centred and
 *     letterboxed. A precise thumbnail. Mirrors the fitZoom math in
 *     shared-screen.tsx and the tile scaling in studio-canvas.tsx.
 *   - height omitted → width-fit: scale = containerWidth / width, and the
 *     artboard's virtual height is derived from the container so the
 *     scaled box fills the iframe edge-to-edge from the top-left. Width
 *     still pins the breakpoints; the box just fills whatever shape it is
 *     given.
 *
 * The inner box is sized here and `children` fills it (h-full w-full), so
 * the iframe always has an explicit pixel height (it can't auto-size to
 * content cross-origin — that's the future auto-height handshake).
 */
function ScaledRender({
  width,
  height,
  children,
}: {
  width: number;
  height?: number;
  children: React.ReactNode;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [box, setBox] = React.useState<{ w: number; h: number; scale: number }>(
    { w: width, h: height ?? 0, scale: 1 },
  );

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (height) {
        // Contain-fit into a fixed width×height artboard.
        const scale = Math.min(cw / width, ch / height);
        setBox({
          w: width,
          h: height,
          scale: Number.isFinite(scale) && scale > 0 ? scale : 1,
        });
      } else {
        // Width-fit: scale by width, derive the virtual height so the
        // scaled box exactly fills the container height.
        const scale = cw / width;
        const ok = Number.isFinite(scale) && scale > 0;
        setBox({ w: width, h: ok ? ch / scale : ch, scale: ok ? scale : 1 });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height]);

  // Contain-fit centres + letterboxes; width-fit fills from the top-left.
  const centered = typeof height === "number" && height > 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 overflow-hidden",
        centered && "flex items-center justify-center",
      )}
    >
      <div
        style={{
          width: box.w,
          height: box.h,
          transform: `scale(${box.scale})`,
          transformOrigin: centered ? "center" : "top left",
          flexShrink: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function EmbedScreen({
  appSource,
  themeDraftJson,
  mode = "light",
  renderWidth,
  renderHeight,
  motion,
}: {
  appSource: string | null;
  themeDraftJson: string | null;
  mode?: "light" | "dark";
  /** Fixed virtual resolution. `renderWidth` alone engages fixed mode
   *  (width pins the breakpoints; the box fills); add `renderHeight` for an
   *  exact contain-fit artboard. No width = responsive. */
  renderWidth?: number;
  renderHeight?: number;
  /** Global motion toggle, forwarded to the iframe. `false` suppresses
   *  animation (ThreeScene pauses, CSS animation stills); `undefined` leaves
   *  the iframe to honour the viewer's OS reduced-motion preference.
   *  Reduce-only. */
  motion?: boolean;
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

  // Fixed mode needs only a width. Height is an optional refinement.
  const fixed = typeof renderWidth === "number" && renderWidth > 0;

  return (
    <div
      className={cn(
        "relative h-screen w-screen overflow-hidden bg-background",
        mode === "dark" && "dark",
      )}
      data-mode={mode}
    >
      {fixed ? (
        <ScaledRender
          width={renderWidth!}
          height={
            typeof renderHeight === "number" && renderHeight > 0
              ? renderHeight
              : undefined
          }
        >
          {/* The ScaledRender box owns the pixel size; the iframe fills it. */}
          <FastIframeHost
            appSource={appSource}
            theme={theme}
            mode={mode}
            motion={motion}
            className="block h-full w-full"
          />
        </ScaledRender>
      ) : (
        <FastIframeHost
          appSource={appSource}
          theme={theme}
          mode={mode}
          motion={motion}
          className="block h-full w-full"
        />
      )}
    </div>
  );
}
