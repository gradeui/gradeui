"use client";

/**
 * HomeBackground — the hero background slot on the homepage.
 *
 * This is the mount point for the planned three.js scene. Until that
 * lands, it renders a quiet CSS-only treatment (radial brand glow +
 * fade-out) so the hero doesn't sit on a flat void.
 *
 * Wiring the real scene later:
 *   1. `pnpm -F @gradeui/docs add three`
 *   2. Lazy-init the renderer in the effect below against `mountRef`
 *      (dynamic import so three.js stays out of the main bundle)
 *   3. Size from the parent rect; dispose on unmount
 *
 * Keep everything inside this component — the hero only knows it has
 * a `background` slot.
 */

import * as React from "react";

export function HomeBackground() {
  const mountRef = React.useRef<HTMLDivElement>(null);

  // Placeholder for the three.js lifecycle:
  // React.useEffect(() => {
  //   let dispose: (() => void) | undefined;
  //   void import("three").then((THREE) => { /* build scene on mountRef */ });
  //   return () => dispose?.();
  // }, []);

  return (
    <div ref={mountRef} id="gds-home-canvas" className="absolute inset-0">
      {/* CSS stand-in until the three.js scene lands. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 38%, oklch(var(--primary) / 0.16), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 45% 35% at 50% 42%, oklch(var(--accent) / 0.1), transparent 65%)",
        }}
      />
      {/* Fade into the page surface so content below reads cleanly. */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
}
