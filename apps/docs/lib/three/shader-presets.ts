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

export const sceneRegistry: Record<string, SceneFactory> = {
  space: spaceScene,
  // Phase 2 additions: synthwave, voronoi, icosa, oscilloscope, retro-sunset, sdf, plasma
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
  // Phase 2 additions will append here
];

export const shaderPresetById = Object.fromEntries(
  shaderPresets.map((p) => [p.id, p]),
) as Record<string, ShaderPreset>;

export type ShaderPresetId = (typeof shaderPresets)[number]["id"];
