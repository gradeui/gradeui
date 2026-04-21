/**
 * Post-FX composer factory.
 *
 * Wraps a three.js scene in an EffectComposer with a configurable stack
 * of effects: bloom, film grain, scanlines, vignette, chromatic aberration,
 * glitch. Effects are toggled in/out based on what the preset declares.
 */

import * as THREE from "three";
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BloomEffect,
  NoiseEffect,
  ScanlineEffect,
  VignetteEffect,
  ChromaticAberrationEffect,
  GlitchEffect,
  BlendFunction,
  KernelSize,
} from "postprocessing";
import type { PostPreset, PostComposerFactory } from "./types";

export const createPostComposer: PostComposerFactory = ({
  renderer,
  scene,
  camera,
  preset,
  width,
  height,
}) => {
  const composer = new EffectComposer(renderer);
  composer.setSize(width, height);
  composer.addPass(new RenderPass(scene, camera));

  // Effects are instantiated once; `setPreset` mutates their params.
  const bloom = new BloomEffect({
    intensity: 0,
    luminanceThreshold: 0.6,
    radius: 0.6,
    kernelSize: KernelSize.MEDIUM,
  });
  const noise = new NoiseEffect({
    blendFunction: BlendFunction.OVERLAY,
  });
  noise.blendMode.opacity.value = 0;

  const scanlines = new ScanlineEffect({
    blendFunction: BlendFunction.OVERLAY,
    density: 1.25,
  });
  scanlines.blendMode.opacity.value = 0;

  const vignette = new VignetteEffect({
    darkness: 0,
    offset: 0.5,
  });

  const chromatic = new ChromaticAberrationEffect({
    offset: new THREE.Vector2(0, 0),
    radialModulation: false,
    modulationOffset: 0.15,
  });

  const glitch = new GlitchEffect({
    chromaticAberrationOffset: new THREE.Vector2(0, 0),
    columns: 0.05,
  });
  glitch.minStrength = 0;
  glitch.maxStrength = 0;

  // Passes must separate convolution effects (Bloom) from UV-transforming
  // effects (Chromatic Aberration, Glitch). The library throws at construction
  // time if these mix. Four passes keeps everything happy.
  composer.addPass(new EffectPass(camera, bloom));
  composer.addPass(new EffectPass(camera, noise, scanlines, vignette));
  composer.addPass(new EffectPass(camera, chromatic));
  composer.addPass(new EffectPass(camera, glitch));

  function applyPreset(p: PostPreset) {
    const e = p.effects;

    bloom.intensity = e.bloom?.intensity ?? 0;
    if (bloom.luminanceMaterial && e.bloom?.luminanceThreshold !== undefined) {
      bloom.luminanceMaterial.threshold = e.bloom.luminanceThreshold;
    }

    noise.blendMode.opacity.value = e.noise?.intensity ?? 0;

    scanlines.density = e.scanlines?.density ?? 1.25;
    scanlines.blendMode.opacity.value = e.scanlines?.opacity ?? 0;

    vignette.darkness = e.vignette?.darkness ?? 0;
    vignette.offset = e.vignette?.offset ?? 0.5;

    const chromaOffset = e.chromatic?.offset ?? 0;
    chromatic.offset?.set(chromaOffset, chromaOffset);

    if (e.glitch) {
      glitch.minStrength = e.glitch.strength?.[0] ?? 0;
      glitch.maxStrength = e.glitch.strength?.[1] ?? 0;
    } else {
      glitch.minStrength = 0;
      glitch.maxStrength = 0;
    }
  }

  applyPreset(preset);

  return {
    composer,
    setPreset: applyPreset,
    resize: (w, h) => composer.setSize(w, h),
    dispose: () => {
      composer.dispose();
    },
  };
};
