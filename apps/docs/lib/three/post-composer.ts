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
  GlitchMode,
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
  // Off by default. GlitchEffect self-triggers in SPORADIC mode regardless
  // of strength, so we kill it two ways: DISABLED mode + zero blend opacity
  // (it then contributes nothing), the same pattern noise/scanlines use.
  glitch.mode = GlitchMode.DISABLED;
  glitch.blendMode.opacity.value = 0;

  // Passes must separate convolution effects (Bloom) from UV-transforming
  // effects (Chromatic Aberration, Glitch). The library throws at construction
  // time if these mix. Four passes keeps everything happy.
  //
  // IMPORTANT: we NEVER disable a pass. The composer renders the literal
  // last pass to screen, so a disabled pass can blank the whole output
  // (that was the "nothing renders unless glitch>0" bug). Every pass stays
  // enabled; effects are turned off by zeroing their blend (opacity / mode
  // / offset), so rendering never depends on which effects are active.
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

    const glitchMax = e.glitch?.strength?.[1] ?? 0;
    if (e.glitch && glitchMax > 0) {
      glitch.mode = GlitchMode.SPORADIC;
      glitch.blendMode.opacity.value = 1;
      glitch.minStrength = e.glitch.strength?.[0] ?? 0;
      glitch.maxStrength = glitchMax;
    } else {
      // Off — never disable the pass (that can blank the composer's
      // screen output). DISABLED mode stops the self-trigger and zero
      // blend opacity makes it contribute nothing.
      glitch.mode = GlitchMode.DISABLED;
      glitch.blendMode.opacity.value = 0;
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
