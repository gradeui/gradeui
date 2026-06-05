/**
 * Shader preset registry — maps semantic preset ids to scene factories
 * plus metadata for the picker UI.
 *
 * Adding a new preset:
 *   1. Write a SceneFactory in `./scenes/<name>.ts`
 *   2. Register it in `sceneRegistry` below
 *   3. Add a `ShaderPreset` entry in `shaderPresets`
 *
 * Both `<ThreeScene preset="space" />` and `<ShaderPresetPicker />` read
 * from this registry so they stay in lockstep.
 */

import type { ShaderPreset, SceneFactory } from "./types";
import { spaceScene } from "./scenes/space";
import { plasmaScene } from "./scenes/plasma";
import { voronoiScene } from "./scenes/voronoi";
import { synthwaveScene } from "./scenes/synthwave";
import {
  meshScene,
  wavesScene,
  undertonesScene,
  flowingDotsScene,
} from "./scenes/fragment-scenes";

export const sceneRegistry: Record<string, SceneFactory> = {
  space: spaceScene,
  plasma: plasmaScene,
  voronoi: voronoiScene,
  synthwave: synthwaveScene,
  mesh: meshScene,
  waves: wavesScene,
  undertones: undertonesScene,
  "flowing-dots": flowingDotsScene,
  // Further candidates: icosa, oscilloscope, retro-sunset, sdf
};

export const shaderPresets: ShaderPreset[] = [
  {
    id: "mesh",
    label: "Mesh gradient",
    description:
      "Smooth moving blobs of the primary / secondary / accent colours over the background — the go-to soft, theme-reactive background.",
    tags: ["gradient", "mesh", "abstract", "hero", "background"],
    scene: "mesh",
    defaultPostPreset: "none",
  },
  {
    id: "waves",
    label: "Waves",
    description:
      "Flowing banded ribbons that ripple across the surface. Clean motion for headers and hero backdrops.",
    tags: ["waves", "motion", "abstract", "hero"],
    scene: "waves",
    defaultPostPreset: "none",
  },
  {
    id: "undertones",
    label: "Undertones",
    description:
      "Soft low-saturation tonal washes drifting like weather — the field bends gently toward the cursor and a faint light follows it. The calm, expensive-feeling backdrop.",
    tags: ["gradient", "soft", "subtle", "mouse", "hero", "background", "calm"],
    scene: "undertones",
    defaultPostPreset: "none",
  },
  {
    id: "flowing-dots",
    label: "Flowing dots",
    description:
      "A dot-matrix grid where waves of dots swell and tint as a flow field passes through — and swell toward the cursor. Playful, technical, great behind type.",
    tags: ["dots", "grid", "halftone", "mouse", "motion", "background", "playful"],
    scene: "flowing-dots",
    defaultPostPreset: "none",
  },
  {
    id: "space",
    label: "Hyperspace",
    description:
      "Classic 'jump to hyperspace' — streaking stars flying past camera. Pairs well with VHS or Cinematic post-FX.",
    tags: ["space", "retro", "motion", "hero", "background"],
    scene: "space",
    defaultPostPreset: "vhs",
  },
  {
    id: "plasma",
    label: "Plasma",
    description:
      "Soft rolling colour clouds — overlapping sines warping a palette ramp. Classic demoscene vibe. Pairs well with Synthwave or Cinematic.",
    tags: ["abstract", "soft", "ambient", "hero", "background", "gradient"],
    scene: "plasma",
    defaultPostPreset: "synthwave",
  },
  {
    id: "voronoi",
    label: "Voronoi",
    description:
      "Jittered cellular grid — orbiting seed points form animated cells with glowing edges. Great for data / organic / network moods. Pairs well with CRT or VHS.",
    tags: ["abstract", "cells", "organic", "network", "hero", "background"],
    scene: "voronoi",
    defaultPostPreset: "crt",
  },
  {
    id: "synthwave",
    label: "Synthwave Grid",
    description:
      "Retro-future perspective grid receding to a banded sun disc on the horizon. Pairs beautifully with the Synthwave post preset (its namesake).",
    tags: ["retro", "synthwave", "80s", "hero", "background", "grid", "sun"],
    scene: "synthwave",
    defaultPostPreset: "synthwave",
  },
];

export const shaderPresetById = Object.fromEntries(
  shaderPresets.map((p) => [p.id, p]),
) as Record<string, ShaderPreset>;

export type ShaderPresetId = (typeof shaderPresets)[number]["id"];
