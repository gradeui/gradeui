/**
 * Post-FX as a tweakable schema.
 *
 * The DS already has a typed, `postprocessing`-package post stack
 * (`PostPreset` + `post-composer.ts`), but it's only addressable as
 * NAMED presets. This module exposes the same effects as a flat
 * `ControlSpec[]` so a controls panel can drive every knob live, and
 * `postStateToPreset()` converts that flat state back into the nested
 * `PostPreset` shape the composer consumes.
 *
 * Source-agnostic by design: this stack runs over whatever the composer
 * renders first — a generated shader scene, an <Image>/<Video> layer
 * (see overlay-layer), or a future HTML-element capture. The effects
 * don't care what produced the pixels, so "apply filters to video /
 * images / HTML" is the same code path.
 */

import type { ControlSpec, DemoState } from "./schema";
import { getNum } from "./schema";
import type { PostPreset } from "./types";

/**
 * Flat, panel-facing schema. Keys are flat (`bloomIntensity`) and fold
 * back into the nested `PostPreset.effects` via `postStateToPreset`.
 * Ordered with dividers into the same sections as the lab panel.
 */
export const POST_CONTROLS: readonly ControlSpec[] = [
  { type: "divider", key: "post-bloom", label: "Bloom" },
  { type: "slider", key: "bloomIntensity", label: "Strength", min: 0, max: 3, step: 0.05, default: 0 },
  { type: "slider", key: "bloomThreshold", label: "Threshold", min: 0, max: 1, step: 0.01, default: 0.5 },
  { type: "slider", key: "bloomRadius", label: "Radius", min: 0, max: 2, step: 0.01, default: 0.7 },

  { type: "divider", key: "post-film", label: "Film" },
  { type: "slider", key: "grain", label: "Grain", min: 0, max: 0.3, step: 0.005, default: 0 },
  { type: "slider", key: "scanlines", label: "Scanlines", min: 0, max: 1, step: 0.01, default: 0 },
  { type: "slider", key: "scanlineDensity", label: "Scanline density", min: 0.5, max: 4, step: 0.1, default: 1.5 },
  { type: "slider", key: "vignette", label: "Vignette", min: 0, max: 1, step: 0.01, default: 0 },
  { type: "slider", key: "vignetteOffset", label: "Vignette offset", min: 0, max: 1, step: 0.01, default: 0.5 },

  { type: "divider", key: "post-distort", label: "Distortion" },
  { type: "slider", key: "chromatic", label: "Chromatic", min: 0, max: 0.01, step: 0.0005, default: 0 },
  { type: "slider", key: "glitch", label: "Glitch", min: 0, max: 1, step: 0.01, default: 0 },
];

/** Default flat state for the post section. */
export const POST_DEFAULTS: DemoState = (() => {
  const out: DemoState = {};
  for (const c of POST_CONTROLS) {
    if (c.type === "divider") continue;
    out[c.key] = c.default;
  }
  return out;
})();

/**
 * Fold flat panel state into the nested `PostPreset` the composer reads.
 * Effects whose driving value is ~0 are omitted entirely so the
 * composer can skip the pass (perf + avoids a no-op tint).
 */
export function postStateToPreset(s: DemoState, id = "custom"): PostPreset {
  const effects: PostPreset["effects"] = {};

  const bloom = getNum(s, "bloomIntensity", 0);
  if (bloom > 0.001) {
    effects.bloom = {
      intensity: bloom,
      luminanceThreshold: getNum(s, "bloomThreshold", 0.5),
      radius: getNum(s, "bloomRadius", 0.7),
    };
  }

  const grain = getNum(s, "grain", 0);
  if (grain > 0.0001) effects.noise = { intensity: grain };

  const scan = getNum(s, "scanlines", 0);
  if (scan > 0.0001) {
    effects.scanlines = {
      density: getNum(s, "scanlineDensity", 1.5),
      opacity: scan,
    };
  }

  const vignette = getNum(s, "vignette", 0);
  if (vignette > 0.0001) {
    effects.vignette = {
      darkness: vignette,
      offset: getNum(s, "vignetteOffset", 0.5),
    };
  }

  const chromatic = getNum(s, "chromatic", 0);
  if (chromatic > 0.00001) effects.chromatic = { offset: chromatic };

  const glitch = getNum(s, "glitch", 0);
  if (glitch > 0.0001) {
    effects.glitch = { chromatic: true, strength: [glitch * 0.3, glitch] };
  }

  return { id, label: "Custom", effects };
}
