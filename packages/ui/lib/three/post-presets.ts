/**
 * Post-FX preset registry.
 *
 * Each preset is a tunable description of the post-FX stack. Lives as data
 * so the same registry drives `<ThreeScene postPreset="vhs" />` and the
 * preset picker's preview thumbnails.
 */

import type { PostPreset } from "./types";

export const postPresets: Record<string, PostPreset> = {
  none: {
    id: "none",
    label: "Clean",
    effects: {},
  },
  vhs: {
    id: "vhs",
    label: "VHS",
    effects: {
      bloom: { intensity: 0.35, luminanceThreshold: 0.5, radius: 0.7 },
      noise: { intensity: 0.04 }, // dialled down per user feedback
      scanlines: { density: 1.5, opacity: 0.12 },
      vignette: { darkness: 0.4, offset: 0.45 },
      chromatic: { offset: 0.0015 },
    },
  },
  cinematic: {
    id: "cinematic",
    label: "Cinematic",
    effects: {
      bloom: { intensity: 0.5, luminanceThreshold: 0.55, radius: 0.8 },
      vignette: { darkness: 0.5, offset: 0.5 },
    },
  },
  synthwave: {
    id: "synthwave",
    label: "Synthwave",
    effects: {
      bloom: { intensity: 0.8, luminanceThreshold: 0.3, radius: 0.9 },
      chromatic: { offset: 0.002 },
      vignette: { darkness: 0.3, offset: 0.55 },
    },
  },
  crt: {
    id: "crt",
    label: "CRT",
    effects: {
      bloom: { intensity: 0.2, luminanceThreshold: 0.7, radius: 0.4 },
      scanlines: { density: 2.0, opacity: 0.25 },
      vignette: { darkness: 0.6, offset: 0.4 },
      chromatic: { offset: 0.0025 },
    },
  },
};

export type PostPresetId = keyof typeof postPresets;

export const defaultPostPreset: PostPresetId = "vhs";
