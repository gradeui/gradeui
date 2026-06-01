/**
 * "plasma" scene — classic demoscene plasma field.
 *
 * Fullscreen-quad fragment shader. Overlapping sine waves modulate a palette
 * ramp, producing soft rolling colour clouds. Cheap on GPU — every pixel
 * runs a handful of sin() calls per frame, no geometry to speak of.
 *
 * Maps `background` → darkest end, `secondary` → midtone, `primary` → highlight,
 * `accent` → speckle tint. Works beautifully under Synthwave or Cinematic post-FX.
 */

import * as THREE from "three";
import type { SceneFactory, SceneHandle, Palette } from "../types";

const FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uBackground;
  uniform vec3 uPrimary;
  uniform vec3 uSecondary;
  uniform vec3 uAccent;

  // 3-stop palette ramp driven by a scalar in [0,1].
  vec3 palette(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 lo = mix(uBackground, uSecondary, smoothstep(0.0, 0.5, t));
    vec3 hi = mix(uSecondary, uPrimary, smoothstep(0.5, 1.0, t));
    return mix(lo, hi, step(0.5, t));
  }

  void main() {
    // Normalise to centre-origin coords, preserving aspect.
    vec2 uv = (vUv - 0.5) * (uResolution.xy / min(uResolution.x, uResolution.y)) * 4.0;

    float t = uTime * 0.35;
    float v = 0.0;
    v += sin(uv.x * 1.2 + t);
    v += sin(uv.y * 1.6 + t * 1.3);
    v += sin((uv.x + uv.y) * 1.1 + t * 0.7);
    v += sin(length(uv) * 2.4 - t * 0.9);
    v = v * 0.125 + 0.5;                    // remap from [-4,4] → [0,1]

    vec3 col = palette(v);

    // Subtle accent shimmer along diagonal.
    float shimmer = sin((uv.x - uv.y) * 3.0 + uTime * 1.5) * 0.5 + 0.5;
    col = mix(col, uAccent, shimmer * 0.08);

    gl_FragColor = vec4(col, 1.0);
  }
`;

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const plasmaScene: SceneFactory = ({ width, height, palette }) => {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(width, height) },
    uBackground: { value: new THREE.Color(palette.background) },
    uPrimary: { value: new THREE.Color(palette.primary) },
    uSecondary: { value: new THREE.Color(palette.secondary) },
    uAccent: { value: new THREE.Color(palette.accent) },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    depthTest: false,
    depthWrite: false,
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  const quad = new THREE.Mesh(geometry, material);
  scene.add(quad);

  const handle: SceneHandle = {
    scene,
    camera,
    update: (elapsed) => {
      uniforms.uTime.value = elapsed;
    },
    resize: (w, h) => {
      uniforms.uResolution.value.set(w, h);
    },
    setPalette: (p: Palette) => {
      uniforms.uBackground.value.set(p.background);
      uniforms.uPrimary.value.set(p.primary);
      uniforms.uSecondary.value.set(p.secondary);
      uniforms.uAccent.value.set(p.accent);
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };

  return handle;
};
