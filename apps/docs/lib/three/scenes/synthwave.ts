/**
 * "synthwave" scene — retro-future grid with sun.
 *
 * Fullscreen-quad fragment shader that paints a perspective grid receding
 * to a horizon, a banded sun disc above it, and a soft sky gradient.
 * Chose fragment-only over real perspective geometry so the aspect ratio
 * adapts cleanly and there's nothing to dispose on resize.
 *
 * Maps `background` → sky base, `primary` → grid lines + sun bands,
 * `secondary` → sky fade, `accent` → horizon glow. Shines under Synthwave
 * or VHS post-FX.
 */

import * as THREE from "three";
import type { SceneFactory, SceneHandle, Palette } from "../types";

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uBackground;
  uniform vec3 uPrimary;
  uniform vec3 uSecondary;
  uniform vec3 uAccent;

  // Horizon at y = 0.45 (upper band for sky + sun, lower band for grid).
  const float HORIZON = 0.45;

  // Perspective-projected grid in the lower half.
  // Returns grid intensity in [0,1].
  float grid(vec2 uv) {
    // Perspective: nearer rows get larger spacing. z grows as we go toward horizon.
    float z = 1.0 / max(uv.y, 0.001);                   // uv.y ∈ (0, HORIZON]
    vec2 gpos = vec2(uv.x * z, z - uTime * 2.0);        // scroll lines toward camera

    vec2 g = fract(gpos * vec2(1.0, 0.25));
    vec2 lw = fwidth(gpos * vec2(1.0, 0.25)) * 1.5;     // anti-aliased line width
    vec2 lines = smoothstep(vec2(0.0), lw, g)
               - smoothstep(1.0 - lw, vec2(1.0), g);
    // "lines" is ~1 between lines, ~0 on a line → invert.
    float l = 1.0 - min(lines.x, lines.y);

    // Fade grid as it approaches horizon (z → ∞ means very far).
    float fade = clamp(1.0 - z * 0.02, 0.0, 1.0);
    return l * fade;
  }

  void main() {
    vec2 uv = vUv - vec2(0.5, HORIZON);

    vec3 col;

    if (vUv.y >= HORIZON) {
      // Sky half.
      float skyT = (vUv.y - HORIZON) / (1.0 - HORIZON);
      col = mix(uBackground, uSecondary, skyT);

      // Sun disc — centred above horizon with horizontal bands.
      vec2 sunUv = uv;
      sunUv.y -= 0.05;
      float d = length(sunUv * vec2(1.0, 1.2));
      float disc = smoothstep(0.22, 0.21, d);
      // Horizontal bands across the lower half of the sun.
      float bandY = (sunUv.y - 0.05) * 25.0;
      float bands = step(0.0, sin(bandY));
      float bandMask = smoothstep(0.05, -0.05, sunUv.y);       // only bands below sun centre
      disc *= mix(1.0, bands, bandMask);
      col = mix(col, uPrimary, disc);

      // Horizon glow.
      float glow = smoothstep(0.08, 0.0, vUv.y - HORIZON);
      col = mix(col, uAccent, glow * 0.6);
    } else {
      // Ground half.
      float floorUv = HORIZON - vUv.y;                         // 0 at horizon, grows down
      float g = grid(vec2(uv.x, floorUv));
      vec3 ground = mix(uBackground * 0.3, uBackground * 0.7, floorUv / HORIZON);
      col = mix(ground, uPrimary, g);

      // Horizon glow bleeding into ground.
      float glow = smoothstep(0.06, 0.0, floorUv);
      col = mix(col, uAccent, glow * 0.8);
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

export const synthwaveScene: SceneFactory = ({ palette }) => {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    uTime: { value: 0 },
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
