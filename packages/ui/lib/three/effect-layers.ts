/**
 * Composable effect LAYERS — screen-space overlays that stack on ANY base
 * (a generative field, an image, a webcam frame). Each layer is a
 * `postprocessing` Effect built from a `ControlSpec[]` contract, exactly
 * like a base shader is built from one: every non-divider control becomes a
 * uniform the layer body reads (key `size` -> `uSize`), plus the standard
 * `uTime` / `uResolution` / `uMouse` / palette uniforms. The base renders
 * untouched; layers post-process it in a fixed pipeline order.
 *
 * See STUDIO-SHADERS.md (the model) and STUDIO-SHADERS-PRD.md (this build).
 *
 * A layer author writes only `mainImage` plus a contract:
 *   void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) { ... }
 * `inputColor` is the colour from the layer beneath; `uv` is 0..1, y-up.
 */

import { Effect, BlendFunction } from "postprocessing";
import * as THREE from "three";
import type { ControlSpec } from "./schema";
import type { Palette } from "./types";
import { paramUniformName } from "./custom-fragment";

export type LayerGroup =
  | "coordinate"
  | "colour"
  | "treatment"
  | "light"
  | "finish";

/** Pipeline order: coordinate, then colour, then treatment, then light,
 *  then finish. A composition's layers are sorted by this before they run. */
const GROUP_ORDER: Record<LayerGroup, number> = {
  coordinate: 0,
  colour: 1,
  treatment: 2,
  light: 3,
  finish: 4,
};

/** A live layer effect with the same setParams / setPalette / setMouse
 *  surface a base scene handle exposes, so the host drives them uniformly. */
export interface LayerEffect extends Effect {
  setParams(params: Record<string, number | string | boolean | string[]>): void;
  setPalette(palette: Palette): void;
  setMouse(x: number, y: number): void;
}

export type LayerEffectFactory = (palette: Palette) => LayerEffect;

export interface EffectLayerDef {
  id: string;
  label: string;
  group: LayerGroup;
  description: string;
  controls: ControlSpec[];
  factory: LayerEffectFactory;
}

/** GLSL uniform declarations for a layer body. postprocessing does NOT
 *  auto-declare the uniforms passed in the Map (it only mangles references
 *  when merging effects), so we must declare them in the source ourselves,
 *  exactly like a base shader. postprocessing then prefixes both the
 *  declaration and the references together and binds the Map value by key.
 *  `uTime`/`uResolution`/`uMouse` are ours (not the postprocessing built-ins
 *  `time`/`resolution`), so there is no redeclaration clash. */
function layerUniformDeclarations(
  controls: readonly ControlSpec[] | undefined,
): string {
  const lines = [
    "uniform float uTime;",
    "uniform vec2 uResolution;",
    "uniform vec2 uMouse;",
    "uniform vec3 uPrimary;",
    "uniform vec3 uSecondary;",
    "uniform vec3 uAccent;",
    "uniform vec3 uBackground;",
  ];
  for (const c of controls ?? []) {
    if (c.type === "divider" || c.type === "colorList") continue;
    const u = paramUniformName(c.key);
    lines.push(c.type === "color" ? `uniform vec3 ${u};` : `uniform float ${u};`);
  }
  return lines.join("\n");
}

/** Seed the uniform Map: standard uniforms + one per non-divider control. */
function seedUniforms(
  controls: readonly ControlSpec[] | undefined,
  palette: Palette,
): Map<string, THREE.Uniform> {
  const m = new Map<string, THREE.Uniform>();
  m.set("uTime", new THREE.Uniform(0));
  m.set("uResolution", new THREE.Uniform(new THREE.Vector2(1, 1)));
  m.set("uMouse", new THREE.Uniform(new THREE.Vector2(0.5, 0.5)));
  m.set("uPrimary", new THREE.Uniform(new THREE.Color(palette.primary)));
  m.set("uSecondary", new THREE.Uniform(new THREE.Color(palette.secondary)));
  m.set("uAccent", new THREE.Uniform(new THREE.Color(palette.accent)));
  m.set("uBackground", new THREE.Uniform(new THREE.Color(palette.background)));
  for (const c of controls ?? []) {
    if (c.type === "divider") continue;
    const u = paramUniformName(c.key);
    if (c.type === "color") {
      m.set(u, new THREE.Uniform(new THREE.Color(c.default)));
    } else if (c.type === "select" || c.type === "segmented") {
      const idx = c.options.findIndex((o) => o.value === c.default);
      m.set(u, new THREE.Uniform(Math.max(0, idx)));
    } else if (c.type === "toggle") {
      m.set(u, new THREE.Uniform(c.default ? 1 : 0));
    } else if (c.type === "colorList") {
      // Layers v1 use individual colour stops, not arrays. Skip.
    } else {
      m.set(u, new THREE.Uniform(c.default));
    }
  }
  return m;
}

/**
 * Build a layer factory from a `mainImage` body + its contract. Returns a
 * function that instantiates the effect for a given palette. The effect
 * accumulates `uTime` each frame and tracks resolution on resize.
 */
export function buildEffectLayer(
  name: string,
  body: string,
  controls?: readonly ControlSpec[],
): LayerEffectFactory {
  const controlByKey = new Map<string, ControlSpec>();
  for (const c of controls ?? []) {
    if (c.type !== "divider") controlByKey.set(c.key, c);
  }

  return (palette: Palette) => {
    const uniforms = seedUniforms(controls, palette);

    const source = `${layerUniformDeclarations(controls)}\n${body}`;
    class GradeLayer extends Effect {
      constructor() {
        super(name, source, {
          blendFunction: BlendFunction.NORMAL,
          uniforms,
        });
      }
      // postprocessing calls this every frame with seconds since last frame.
      update(_renderer: unknown, _input: unknown, deltaTime: number) {
        const t = uniforms.get("uTime");
        if (t) t.value = (t.value as number) + deltaTime;
      }
      setSize(width: number, height: number) {
        (uniforms.get("uResolution")!.value as THREE.Vector2).set(
          width,
          height,
        );
      }
      setParams(
        params: Record<string, number | string | boolean | string[]>,
      ) {
        for (const [key, raw] of Object.entries(params)) {
          const c = controlByKey.get(key);
          if (!c) continue;
          const uni = uniforms.get(paramUniformName(key));
          if (!uni) continue;
          if (c.type === "color") {
            (uni.value as THREE.Color).set(String(raw));
          } else if (c.type === "select" || c.type === "segmented") {
            uni.value = Math.max(
              0,
              c.options.findIndex((o) => o.value === raw),
            );
          } else if (c.type === "toggle") {
            uni.value = raw ? 1 : 0;
          } else if (c.type !== "colorList") {
            uni.value = Number(raw);
          }
        }
      }
      setPalette(p: Palette) {
        (uniforms.get("uPrimary")!.value as THREE.Color).set(p.primary);
        (uniforms.get("uSecondary")!.value as THREE.Color).set(p.secondary);
        (uniforms.get("uAccent")!.value as THREE.Color).set(p.accent);
        (uniforms.get("uBackground")!.value as THREE.Color).set(p.background);
      }
      setMouse(x: number, y: number) {
        (uniforms.get("uMouse")!.value as THREE.Vector2).set(x, y);
      }
    }

    return new GradeLayer() as unknown as LayerEffect;
  };
}

// ── Layer catalog ──────────────────────────────────────────────────────

/** Dots / Halftone — render the input as a grid of luminance-sized dots.
 *  Subsumes flowing-dots (flow up) and halftone (flow 0, angled). */
export const dotsControls: ControlSpec[] = [
  { type: "segmented", key: "shape", label: "Shape", options: [
      { value: "round", label: "Round" },
      { value: "square", label: "Square" },
      { value: "line", label: "Line" },
    ], default: "round" },
  { type: "slider", key: "size", label: "Size", min: 4, max: 48, step: 1, default: 12, unit: "px" },
  { type: "slider", key: "angle", label: "Angle", min: 0, max: 90, step: 1, default: 27, unit: "deg" },
  { type: "slider", key: "flow", label: "Flow", min: 0, max: 1, step: 0.01, default: 0 },
  { type: "slider", key: "softness", label: "Softness", min: 0, max: 1, step: 0.01, default: 0.35 },
];
const dotsBody = /* glsl */ `
  float dHash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float dNoise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
    float a=dHash(i),b=dHash(i+vec2(1.0,0.0)),c=dHash(i+vec2(0.0,1.0)),d=dHash(i+vec2(1.0,1.0));
    return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }
  mat2 dRot(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
    float lum = dot(inputColor.rgb, vec3(0.299, 0.587, 0.114));
    vec2 frag = uv * uResolution;
    vec2 rg = dRot(radians(uAngle)) * frag;
    if (uFlow > 0.001) {
      float n = dNoise(uv * 4.0 + uTime * 0.3);
      rg += vec2(uTime * 22.0 + n * 34.0) * uFlow;
    }
    float cell = max(uSize, 2.0);
    vec2 gp = mod(rg, cell) - cell * 0.5;
    float dist;
    if (uShape < 0.5) dist = length(gp);
    else if (uShape < 1.5) dist = max(abs(gp.x), abs(gp.y));
    else dist = abs(gp.x);
    float radius = (cell * 0.5) * sqrt(clamp(lum, 0.0, 1.0));
    float soft = mix(0.5, cell * 0.45, clamp(uSoftness, 0.0, 1.0));
    float coverage = 1.0 - smoothstep(radius - soft, radius + soft, dist);
    vec3 col = inputColor.rgb * mix(0.10, 1.0, coverage);
    outputColor = vec4(col, inputColor.a);
  }
`;

/** Gradient map — remap the input's luminance through brand-bound stops
 *  (duotone / tritone). Makes any base theme-reactive. */
export const gradientMapControls: ControlSpec[] = [
  { type: "color", key: "low", label: "Low", slot: "background", default: "#0b0b14" },
  { type: "color", key: "mid", label: "Mid", slot: "primary", default: "#6d5cff" },
  { type: "color", key: "high", label: "High", slot: "accent", default: "#f0abfc" },
  { type: "slider", key: "contrast", label: "Contrast", min: 0.2, max: 3, step: 0.01, default: 1.1 },
  { type: "slider", key: "offset", label: "Offset", min: -0.5, max: 0.5, step: 0.01, default: 0 },
];
const gradientMapBody = /* glsl */ `
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
    float lum = dot(inputColor.rgb, vec3(0.299, 0.587, 0.114));
    float l = clamp((lum - 0.5) * uContrast + 0.5 + uOffset, 0.0, 1.0);
    vec3 c = (l < 0.5) ? mix(uLow, uMid, l * 2.0) : mix(uMid, uHigh, (l - 0.5) * 2.0);
    outputColor = vec4(c, inputColor.a);
  }
`;

/** Dither — ordered (Bayer 4x4) quantisation. The retro / pixel look,
 *  lovely on a photo. */
export const ditherControls: ControlSpec[] = [
  { type: "slider", key: "levels", label: "Levels", min: 2, max: 8, step: 1, default: 3 },
  { type: "slider", key: "scale", label: "Pixel scale", min: 1, max: 8, step: 1, default: 2 },
  { type: "slider", key: "strength", label: "Strength", min: 0, max: 1, step: 0.01, default: 1 },
];
const ditherBody = /* glsl */ `
  float bayer4(vec2 p){
    // 4x4 ordered dither matrix, returns 0..1
    int x = int(mod(p.x, 4.0));
    int y = int(mod(p.y, 4.0));
    int i = x + y * 4;
    float m[16];
    m[0]=0.0;  m[1]=8.0;  m[2]=2.0;  m[3]=10.0;
    m[4]=12.0; m[5]=4.0;  m[6]=14.0; m[7]=6.0;
    m[8]=3.0;  m[9]=11.0; m[10]=1.0; m[11]=9.0;
    m[12]=15.0;m[13]=7.0; m[14]=13.0;m[15]=5.0;
    float v = 0.0;
    for (int k = 0; k < 16; k++) { if (k == i) v = m[k]; }
    return (v + 0.5) / 16.0;
  }
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
    vec2 px = floor(uv * uResolution / max(uScale, 1.0));
    float threshold = bayer4(px) - 0.5;
    float levels = max(uLevels, 2.0);
    vec3 c = inputColor.rgb + threshold / levels;
    c = floor(c * (levels - 1.0) + 0.5) / (levels - 1.0);
    outputColor = vec4(mix(inputColor.rgb, c, clamp(uStrength, 0.0, 1.0)), inputColor.a);
  }
`;

/** Posterize — collapse to N flat colour bands. */
export const posterizeControls: ControlSpec[] = [
  { type: "slider", key: "levels", label: "Levels", min: 2, max: 8, step: 1, default: 4 },
  { type: "slider", key: "strength", label: "Strength", min: 0, max: 1, step: 0.01, default: 1 },
];
const posterizeBody = /* glsl */ `
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
    float levels = max(uLevels, 2.0);
    vec3 c = floor(inputColor.rgb * (levels - 1.0) + 0.5) / (levels - 1.0);
    outputColor = vec4(mix(inputColor.rgb, c, clamp(uStrength, 0.0, 1.0)), inputColor.a);
  }
`;

/** Scanlines — CRT horizontal lines with a slow roll. */
export const scanlinesControls: ControlSpec[] = [
  { type: "slider", key: "spacing", label: "Spacing", min: 2, max: 10, step: 1, default: 3, unit: "px" },
  { type: "slider", key: "intensity", label: "Intensity", min: 0, max: 1, step: 0.01, default: 0.4 },
  { type: "slider", key: "roll", label: "Roll", min: 0, max: 2, step: 0.01, default: 0.3 },
];
const scanlinesBody = /* glsl */ `
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
    float line = 0.5 + 0.5 * sin(uv.y * uResolution.y * (3.14159265 / max(uSpacing, 2.0)) - uTime * uRoll * 4.0);
    float darken = mix(1.0, line, clamp(uIntensity, 0.0, 1.0));
    outputColor = vec4(inputColor.rgb * darken, inputColor.a);
  }
`;

export const effectLayerRegistry: Record<string, EffectLayerDef> = {
  gradientMap: {
    id: "gradientMap",
    label: "Gradient map",
    group: "colour",
    description: "Remap luminance through brand-bound colour stops (duotone / tritone).",
    controls: gradientMapControls,
    factory: buildEffectLayer("GradeGradientMap", gradientMapBody, gradientMapControls),
  },
  dots: {
    id: "dots",
    label: "Dots",
    group: "treatment",
    description: "Render as a halftone dot grid; flow turns the static grid into flowing dots.",
    controls: dotsControls,
    factory: buildEffectLayer("GradeDots", dotsBody, dotsControls),
  },
  dither: {
    id: "dither",
    label: "Dither",
    group: "treatment",
    description: "Ordered Bayer dither / posterise. The retro pixel look.",
    controls: ditherControls,
    factory: buildEffectLayer("GradeDither", ditherBody, ditherControls),
  },
  posterize: {
    id: "posterize",
    label: "Posterize",
    group: "colour",
    description: "Collapse to N flat colour bands.",
    controls: posterizeControls,
    factory: buildEffectLayer("GradePosterize", posterizeBody, posterizeControls),
  },
  scanlines: {
    id: "scanlines",
    label: "Scanlines",
    group: "light",
    description: "CRT horizontal lines with a slow roll.",
    controls: scanlinesControls,
    factory: buildEffectLayer("GradeScanlines", scanlinesBody, scanlinesControls),
  },
};

/** Resolve a list of layer ids into defs, sorted into pipeline order. */
export function orderedLayers(ids: readonly string[]): EffectLayerDef[] {
  const defs = ids
    .map((id) => effectLayerRegistry[id])
    .filter((d): d is EffectLayerDef => Boolean(d));
  return defs
    .map((d, i) => ({ d, i }))
    .sort((a, b) => GROUP_ORDER[a.d.group] - GROUP_ORDER[b.d.group] || a.i - b.i)
    .map(({ d }) => d);
}
