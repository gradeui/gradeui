/**
 * "voronoi" scene — animated Voronoi cells.
 *
 * Fullscreen-quad fragment shader. A jittered grid where each cell's seed
 * point orbits slowly over time; pixels colour by their distance to the
 * nearest seed and by which cell they fall inside. Cell edges pulse in the
 * accent colour.
 *
 * Maps `background` → cell interiors, `primary` → cell fills, `secondary` → depth tint,
 * `accent` → edge glow. Looks great under CRT or VHS post-FX.
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
  uniform vec2 uResolution;
  uniform vec3 uBackground;
  uniform vec3 uPrimary;
  uniform vec3 uSecondary;
  uniform vec3 uAccent;

  // Cheap 2D hash → vec2 in [0,1].
  vec2 hash2(vec2 p) {
    p = vec2(
      dot(p, vec2(127.1, 311.7)),
      dot(p, vec2(269.5, 183.3))
    );
    return fract(sin(p) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv * (uResolution.xy / min(uResolution.x, uResolution.y)) * 6.0;

    vec2 ipos = floor(uv);
    vec2 fpos = fract(uv);

    float minDist = 1e9;
    float secondDist = 1e9;
    vec2 closestCell = vec2(0.0);

    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 neighbour = vec2(float(x), float(y));
        vec2 seed = hash2(ipos + neighbour);
        // Orbit each seed around its cell centre for gentle motion.
        vec2 offset = 0.5 + 0.5 * sin(uTime * 0.5 + seed * 6.283);
        vec2 diff = neighbour + offset - fpos;
        float d = dot(diff, diff);
        if (d < minDist) {
          secondDist = minDist;
          minDist = d;
          closestCell = ipos + neighbour;
        } else if (d < secondDist) {
          secondDist = d;
        }
      }
    }

    float cellShade = hash2(closestCell).x;           // per-cell random 0..1
    float edge = sqrt(secondDist) - sqrt(minDist);    // 0 at borders, grows inward
    float edgeGlow = 1.0 - smoothstep(0.0, 0.08, edge);

    vec3 fill = mix(uBackground, uPrimary, cellShade);
    fill = mix(fill, uSecondary, 0.25 * sin(uTime * 0.3 + cellShade * 6.28) + 0.25);
    vec3 col = mix(fill, uAccent, edgeGlow);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export const voronoiScene: SceneFactory = ({ width, height, palette }) => {
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
