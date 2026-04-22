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

export const sceneRegistry: Record<string, SceneFactory> = {
  space: spaceScene,
  plasma: plasmaScene,
  voronoi: voronoiScene,
  synthwave: synthwaveScene,
  // Further candidates: icosa, oscilloscope, retro-sunset, sdf
};

export const shaderPresets: ShaderPreset[] = [
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
