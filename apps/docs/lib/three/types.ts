/**
 * Shared types for the three.js layer of the design system.
 *
 * Presets are structured data so the same registry can drive both the
 * runtime `<ThreeScene preset="..." />` and the `<ShaderPresetPicker />`
 * preview gallery without duplicating shaders.
 */

import type * as THREE from "three";
import type { EffectComposer } from "postprocessing";

/** Minimal context passed to a scene factory. */
export interface SceneContext {
  renderer: THREE.WebGLRenderer;
  width: number;
  height: number;
  /** Palette to drive the scene — all presets map their colors onto these slots. */
  palette: Palette;
}

/** The four palette slots every preset opts into. */
export interface Palette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

/** A scene factory returns everything needed to run and tear down a scene. */
export interface SceneHandle {
  scene: THREE.Scene;
  camera: THREE.Camera;
  /** Called every frame with elapsed seconds + delta seconds. */
  update?: (elapsed: number, delta: number) => void;
  /** Called on container resize. */
  resize?: (width: number, height: number) => void;
  /** Called when palette changes at runtime. */
  setPalette?: (palette: Palette) => void;
  /** Release GPU + CPU resources. */
  dispose?: () => void;
}

export type SceneFactory = (ctx: SceneContext) => SceneHandle;

/** Declarative description of a post-FX stack. Specific pass types are strings
 *  so consumers can author presets without importing postprocessing types. */
export interface PostPreset {
  id: string;
  label: string;
  /** Per-pass options keyed by effect name (bloom, noise, scanlines, vignette, chromatic, glitch). */
  effects: {
    bloom?: { intensity?: number; luminanceThreshold?: number; radius?: number };
    noise?: { intensity?: number };
    scanlines?: { density?: number; opacity?: number };
    vignette?: { darkness?: number; offset?: number };
    chromatic?: { offset?: number };
    glitch?: { chromatic?: boolean; strength?: [number, number] };
  };
}

// The tweakable-parameter schema is the canonical `ControlSpec` in
// `./schema` (slider / color / colorList / toggle / select / segmented /
// divider) + `DemoState` + `defaultsOf` / typed getters. It lives in its
// own file so renderers (post-stack etc.) can import it without a
// circular dependency. Re-exported here for convenience.
export type {
  ControlSpec,
  DemoState,
  PaletteSlot,
  NumberControl,
  ColorControl,
  ColorListControl,
  ToggleControl,
  SelectControl,
  SegmentedControl,
  DividerControl,
} from "./schema";
import type { ControlSpec } from "./schema";

/**
 * A composable EFFECT layer — the generalisation of the post-FX model.
 * Grain, dither, vignette, chromatic, etc. are effect layers that stack
 * ON TOP of any base scene (mix-and-match), each carrying its own
 * control schema. This is the "grain should apply to all" contract: an
 * effect is independent of which base shader it sits over.
 */
export interface EffectLayerSpec {
  /** Stable id — also the effect's key in the composer stack. */
  id: string;
  label: string;
  /** One-line description for the picker / LLM. */
  description?: string;
  /** Tweakable controls for this layer. */
  controls?: ControlSpec[];
}

/** A shader preset is the data needed to instantiate one of the canned scenes. */
export interface ShaderPreset {
  id: string;
  /** Short human label for picker cards. */
  label: string;
  /** One-line description an LLM can use to pick this preset. */
  description: string;
  /** Semantic tags — consumer filters ("space", "retro", "abstract") and LLM hints. */
  tags: string[];
  /** Name of the scene factory in the scene registry. */
  scene: string;
  /** Default post-FX preset id for this preset. */
  defaultPostPreset?: string;
  /** Optional palette overrides — otherwise uses the theme palette. */
  defaultPalette?: Partial<Palette>;
  /** Static poster image path for non-hover previews. Served from /public. */
  poster?: string;
  /** Tweakable controls for this base shader (drives the controls panel
   *  + maps to uniforms). Effect layers (grain etc.) carry their own
   *  controls separately via EffectLayerSpec. */
  controls?: ControlSpec[];
}

/** Composer factory signature — wraps a scene with a post-FX chain. */
export type PostComposerFactory = (args: {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  preset: PostPreset;
  width: number;
  height: number;
}) => {
  composer: EffectComposer;
  /** Updates effect parameters live when the preset changes. */
  setPreset: (preset: PostPreset) => void;
  resize: (width: number, height: number) => void;
  dispose: () => void;
};
