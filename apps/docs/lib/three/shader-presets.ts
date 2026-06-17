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
  grainScene,
  glassScene,
  holographicScene,
  fluidScene, fluidControls,
  auroraScene, auroraControls,
  causticsScene, causticsControls,
  ribbonScene, ribbonControls,
  concentricScene, concentricControls,
  vortexScene, vortexControls,
  spectralScene, spectralControls,
  halftoneScene, halftoneControls,
  digitalScene, digitalControls,
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
  grain: grainScene,
  glass: glassScene,
  holographic: holographicScene,
  fluid: fluidScene,
  aurora: auroraScene,
  caustics: causticsScene,
  ribbon: ribbonScene,
  concentric: concentricScene,
  vortex: vortexScene,
  spectral: spectralScene,
  halftone: halftoneScene,
  digital: digitalScene,
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
    id: "grain",
    label: "Grain",
    description:
      "A glacial tonal wash under heavy animated film grain — fine print grain plus a coarser fleck, with a gentle vignette. The editorial, print-feeling backdrop; lovely in light AND dark tones.",
    tags: ["grain", "film", "texture", "editorial", "print", "subtle", "hero", "background"],
    scene: "grain",
    defaultPostPreset: "none",
  },
  {
    id: "holographic",
    label: "Holographic foil",
    description:
      "Iridescent foil — a brushed diagonal grain (a diffraction grating) under a spectrum that sweeps across the sheet in dense shimmering bands, with metallic glints riding the grain. The spectrum cycles the brand colours (secondary → primary → accent) so it re-tints with the theme rather than being a fixed rainbow. The cursor acts as the view angle, sliding the whole spectrum like tilting a holographic card.",
    tags: ["holographic", "foil", "iridescent", "diffraction", "grain", "mouse", "hero", "background"],
    scene: "holographic",
    defaultPostPreset: "none",
  },
  {
    id: "glass",
    label: "Studio glass",
    description:
      "A brand-tinted wash seen through a sheet of frosted, slumped glass — chromatic refraction fringes the edges, anisotropic specular streaks catch a moving key light, and a faint caustic shimmer pools in the folds. The glass bulges toward the cursor like a lens and the highlight tracks it. The expensive, tactile backdrop; lovely in light AND dark tones.",
    tags: ["glass", "frosted", "refraction", "caustic", "mouse", "soft", "hero", "background"],
    scene: "glass",
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
  {
    id: "fluid",
    label: "Fluid",
    description:
      "Soft liquid metaballs — large slow blobs of palette colour merge and split like a lava lamp. The cursor warps the liquid around it.",
    tags: ["lava lamp", "liquid", "metaballs", "organic", "gradient", "ambient", "background"],
    scene: "fluid",
    defaultPostPreset: "none",
    controls: fluidControls,
  },
  {
    id: "aurora",
    label: "Aurora",
    description:
      "Vertical curtains of northern-light ribbons drift and shimmer over a dark sky, with a faint star field. Lovely on dark surfaces.",
    tags: ["aurora", "northern lights", "ribbons", "dark", "glow", "atmospheric", "background"],
    scene: "aurora",
    defaultPostPreset: "none",
    controls: auroraControls,
  },
  {
    id: "caustics",
    label: "Water caustics",
    description:
      "Animated underwater caustic light net — bright cellular veins ripple across a tinted water surface, with depth-graded colour and a pointer ripple.",
    tags: ["caustics", "water", "underwater", "ripple", "cellular", "light", "background"],
    scene: "caustics",
    defaultPostPreset: "none",
    controls: causticsControls,
  },
  {
    id: "ribbon",
    label: "Flowing ribbon",
    description:
      "A silky satin ribbon sweeps and folds across the frame, catching shifting palette colours with an iridescent specular sheen on a light ground.",
    tags: ["ribbon", "satin", "iridescent", "elegant", "light", "hero", "background"],
    scene: "ribbon",
    defaultPostPreset: "none",
    controls: ribbonControls,
  },
  {
    id: "concentric",
    label: "Concentric",
    description:
      "Concentric rings ripple outward from a centre with soft moiré interference and a gentle pulse. The centre can follow the cursor.",
    tags: ["rings", "ripple", "moire", "radial", "hypnotic", "background"],
    scene: "concentric",
    defaultPostPreset: "none",
    controls: concentricControls,
  },
  {
    id: "vortex",
    label: "Deep vortex",
    description:
      "A dark radial vortex of spiralling streaks pulling into a deep centre, dusted with starfield sparkle. Brooding and atmospheric.",
    tags: ["vortex", "spiral", "dark", "cosmic", "radial", "atmospheric", "background"],
    scene: "vortex",
    defaultPostPreset: "none",
    controls: vortexControls,
  },
  {
    id: "spectral",
    label: "Spectral bloom",
    description:
      "A kaleidoscopic radial spectrum burst — petals of shifting spectrum colour bloom from a cursor-driven centre over a dark ground.",
    tags: ["radial", "spectrum", "kaleidoscope", "bloom", "luminous", "background"],
    scene: "spectral",
    defaultPostPreset: "none",
    controls: spectralControls,
  },
  {
    id: "halftone",
    label: "Halftone pop",
    description:
      "A bold pop-art halftone field — a palette gradient resolved into a rotated grid of luminance-sized print dots, with a diagonal sweep and mouse swell.",
    tags: ["halftone", "pop-art", "retro", "print", "dots", "gradient", "background"],
    scene: "halftone",
    defaultPostPreset: "none",
    controls: halftoneControls,
  },
  {
    id: "digital",
    label: "Digital grid",
    description:
      "A techy data-activity field — a grid of cells lighting up in travelling waves with scanning pulses, a glowing ring, and a mouse spotlight on a near-black ground.",
    tags: ["grid", "digital", "data", "techy", "scanline", "glow", "background"],
    scene: "digital",
    defaultPostPreset: "none",
    controls: digitalControls,
  },
];

export const shaderPresetById = Object.fromEntries(
  shaderPresets.map((p) => [p.id, p]),
) as Record<string, ShaderPreset>;

export type ShaderPresetId = (typeof shaderPresets)[number]["id"];
