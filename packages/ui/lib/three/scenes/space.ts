/**
 * "space" scene — hyperspace starfield.
 *
 * Thousands of point-lines streaking past the camera in perspective.
 * Maps `primary` → core, `accent` → streak tail, `background` → clear color.
 * Shines under the VHS + Cinematic post presets (bloom + afterimage).
 */

import * as THREE from "three";
import type { SceneFactory, Palette } from "../types";

const STAR_COUNT = 3000;
const FIELD_DEPTH = 400;
const FIELD_RADIUS = 80;

export const spaceScene: SceneFactory = ({ width, height, palette }) => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(palette.background);

  const camera = new THREE.PerspectiveCamera(
    70,
    width / height,
    0.1,
    FIELD_DEPTH * 2,
  );
  camera.position.z = 0;

  // Each star is a short line-segment from tail to head along +Z.
  const positions = new Float32Array(STAR_COUNT * 6); // 2 points per segment
  const colors = new Float32Array(STAR_COUNT * 6);
  const zOffsets = new Float32Array(STAR_COUNT);

  const primaryColor = new THREE.Color(palette.primary);
  const accentColor = new THREE.Color(palette.accent);

  function resetStar(i: number, randomZ: boolean) {
    // Radial distribution — denser near centre for a tunnel feel.
    const theta = Math.random() * Math.PI * 2;
    const r = FIELD_RADIUS * Math.pow(Math.random(), 0.6);
    const x = Math.cos(theta) * r;
    const y = Math.sin(theta) * r;
    const z = randomZ
      ? -Math.random() * FIELD_DEPTH
      : -FIELD_DEPTH;

    zOffsets[i] = z;

    // head
    positions[i * 6 + 0] = x;
    positions[i * 6 + 1] = y;
    positions[i * 6 + 2] = z;
    // tail — short streak, will grow at runtime based on speed
    positions[i * 6 + 3] = x;
    positions[i * 6 + 4] = y;
    positions[i * 6 + 5] = z - 2;

    // head = primary (bright core), tail = accent fading
    colors[i * 6 + 0] = primaryColor.r;
    colors[i * 6 + 1] = primaryColor.g;
    colors[i * 6 + 2] = primaryColor.b;
    colors[i * 6 + 3] = accentColor.r;
    colors[i * 6 + 4] = accentColor.g;
    colors[i * 6 + 5] = accentColor.b;
  }

  for (let i = 0; i < STAR_COUNT; i++) resetStar(i, true);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
  });

  const stars = new THREE.LineSegments(geometry, material);
  scene.add(stars);

  const SPEED = 60; // units per second
  const STREAK_LEN = 6;

  return {
    scene,
    camera,
    update: (_elapsed, delta) => {
      const pos = geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < STAR_COUNT; i++) {
        const baseIdx = i * 6;
        // advance head Z
        pos[baseIdx + 2] += SPEED * delta;
        // keep tail behind the head by STREAK_LEN
        pos[baseIdx + 5] = pos[baseIdx + 2] - STREAK_LEN;

        // recycle past the camera
        if (pos[baseIdx + 2] > 5) {
          resetStar(i, false);
        }
      }

      geometry.attributes.position.needsUpdate = true;
    },
    resize: (w, h) => {
      const cam = camera as THREE.PerspectiveCamera;
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    },
    setPalette: (palette: Palette) => {
      scene.background = new THREE.Color(palette.background);
      const primary = new THREE.Color(palette.primary);
      const accent = new THREE.Color(palette.accent);
      const col = geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < STAR_COUNT; i++) {
        col[i * 6 + 0] = primary.r;
        col[i * 6 + 1] = primary.g;
        col[i * 6 + 2] = primary.b;
        col[i * 6 + 3] = accent.r;
        col[i * 6 + 4] = accent.g;
        col[i * 6 + 5] = accent.b;
      }
      geometry.attributes.color.needsUpdate = true;
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
};
