/**
 * Fragment-shader presets.
 *
 * These are full-screen-quad GLSL scenes built via
 * `buildFragmentShaderScene`, so they get the standard uniform contract
 * (uTime, uResolution, uMouse, uPrimary/uSecondary/uAccent/uBackground)
 * — which means they're THEME-REACTIVE for free: ThreeScene's palette
 * observer re-resolves the CSS-var palette and pushes new colours into
 * these uniforms on theme change, no remount.
 *
 * Authoring against the palette uniforms (not hard-coded colours) is the
 * whole point — switch the page theme and every preset re-tints.
 */

import { buildFragmentShaderScene } from "../custom-fragment";

/** Mesh gradient — smooth moving blobs of primary/secondary/accent over
 *  the background. The "nice mesh shader" default. */
export const meshScene = buildFragmentShaderScene(/* glsl */ `
  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.15;

    vec2 p1 = vec2(0.5 + 0.36 * sin(t * 1.1),       0.5 + 0.30 * cos(t * 0.9));
    vec2 p2 = vec2(0.5 + 0.40 * cos(t * 0.7 + 1.0), 0.4 + 0.34 * sin(t * 1.3));
    vec2 p3 = vec2(0.45 + 0.32 * sin(t * 0.5 + 2.0),0.6 + 0.30 * cos(t * 1.7));

    float w1 = smoothstep(0.62, 0.0, distance(uv, p1));
    float w2 = smoothstep(0.62, 0.0, distance(uv, p2));
    float w3 = smoothstep(0.62, 0.0, distance(uv, p3));

    vec3 col = uBackground;
    col = mix(col, uPrimary,   w1);
    col = mix(col, uSecondary, w2 * 0.9);
    col = mix(col, uAccent,    w3 * 0.85);
    gl_FragColor = vec4(col, 1.0);
  }
`);

/** Undertones — original, in the soft-tonal-wash genre (low-saturation
 *  layered washes drifting very slowly), and MOUSE-REACTIVE: the field
 *  bends gently toward the cursor and a soft light follows it. Theme-
 *  reactive like every fragment preset (palette uniforms, not colours).
 *  Fine grain on top kills gradient banding. */
export const undertonesScene = buildFragmentShaderScene(/* glsl */ `
  float uHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float uNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = uHash(i);
    float b = uHash(i + vec2(1.0, 0.0));
    float c = uHash(i + vec2(0.0, 1.0));
    float d = uHash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float uFbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      v += amp * uNoise(p);
      p *= 2.03;
      amp *= 0.5;
    }
    return v;
  }
  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.06; // undertones move like weather, not water

    // The field bends gently toward the cursor…
    vec2 toMouse = uv - uMouse;
    float md = length(toMouse);
    vec2 warp = normalize(toMouse + 1e-4) * 0.12 * exp(-md * 2.2);

    vec2 p = uv * 1.6 + warp;
    float n1 = uFbm(p + vec2(t, -t * 0.6));
    float n2 = uFbm(p * 1.4 - vec2(t * 0.8, t * 0.4) + 3.7);
    float diag = uv.x * 0.55 + uv.y * 0.45;

    // Washes, not blobs — but the brand pops carry enough weight to read.
    vec3 col = uBackground;
    col = mix(col, uPrimary,   smoothstep(0.18, 0.92, n1) * 0.62);
    col = mix(col, uSecondary, smoothstep(0.28, 1.00, n2) * 0.50);
    col = mix(col, uAccent,    smoothstep(0.45, 1.00, n1 * n2 + diag * 0.2) * 0.38);

    // …and a soft light follows the cursor, in brand.
    col += (uPrimary - uBackground) * 0.22 * exp(-md * 3.0);

    // Fine grain to kill banding.
    col += (uNoise(uv * 900.0) - 0.5) * 0.012;

    gl_FragColor = vec4(col, 1.0);
  }
`);

/** Flowing dots — original, in the dot-matrix flow-field genre: a grid
 *  of dots whose size and tint ride a slowly flowing noise field, so
 *  waves of dots swell and fade as the field passes through. Mouse-
 *  reactive: dots swell and brighten near the cursor. */
export const flowingDotsScene = buildFragmentShaderScene(/* glsl */ `
  float dHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float dNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = dHash(i);
    float b = dHash(i + vec2(1.0, 0.0));
    float c = dHash(i + vec2(0.0, 1.0));
    float d = dHash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 uv = vec2(vUv.x * aspect, vUv.y);
    float t = uTime * 0.25;

    const float N = 26.0; // dots per unit height
    vec2 cell = fract(uv * N) - 0.5;
    vec2 id = floor(uv * N) / N;

    // The flow field — each dot samples it at its own cell.
    float flow = dNoise(id * 2.2 + vec2(t * 0.6, -t * 0.35));
    float flow2 = dNoise(id * 3.6 - vec2(t * 0.4, t * 0.5) + 7.3);

    // Mouse swell — cursor distance in the same aspect-corrected space.
    vec2 m = vec2(uMouse.x * aspect, uMouse.y);
    float md = length(id + 0.5 / N - m);
    float swell = exp(-md * 5.0);

    // Dot radius rides the field + the cursor.
    float r = 0.08 + 0.30 * smoothstep(0.35, 0.95, flow) + 0.22 * swell;
    float d = length(cell);
    float dot_ = smoothstep(r, r - 0.06, d);

    vec3 dotCol = mix(uPrimary, uAccent, smoothstep(0.3, 0.9, flow2));
    dotCol = mix(dotCol, uSecondary, swell * 0.6);

    // Dots read at near-full brand saturation (the grid was too dim).
    vec3 col = mix(uBackground, dotCol, dot_ * (0.78 + 0.22 * flow));
    gl_FragColor = vec4(col, 1.0);
  }
`);

/** Grain — a barely-moving tonal wash under HEAVY animated film grain.
 *  The wash is quiet on purpose (the grain is the texture); brand colours
 *  arrive as broad diagonal tints. Reads beautifully in light AND dark
 *  tones — the editorial/print-feeling backdrop. */
export const grainScene = buildFragmentShaderScene(/* glsl */ `
  float gHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float gNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = gHash(i);
    float b = gHash(i + vec2(1.0, 0.0));
    float c = gHash(i + vec2(0.0, 1.0));
    float d = gHash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.04; // glacial — the grain carries the motion

    // Broad diagonal wash — two slow tints crossing the frame.
    float w1 = gNoise(uv * 1.2 + vec2(t, -t * 0.7));
    float w2 = gNoise(uv * 0.9 - vec2(t * 0.6, t * 0.3) + 5.1);
    vec3 col = uBackground;
    col = mix(col, uPrimary, smoothstep(0.30, 1.00, w1 + (uv.x + uv.y) * 0.15) * 0.40);
    col = mix(col, uAccent,  smoothstep(0.45, 1.00, w2) * 0.25);

    // THE GRAIN — animated per-frame (time-salted hash), two scales:
    // fine print grain + a coarser fleck that catches the eye.
    float salt = fract(uTime * 7.0);
    float fine   = gHash(uv * uResolution.xy * 0.9 + salt * 113.0) - 0.5;
    float coarse = gHash(floor(uv * uResolution.xy * 0.22) + salt * 71.0) - 0.5;
    col += fine * 0.085 + coarse * 0.045;

    // Gentle vignette keeps edges from going flat.
    float vig = smoothstep(1.25, 0.45, length(uv - 0.5) * 1.6);
    col *= 0.92 + 0.08 * vig;

    gl_FragColor = vec4(col, 1.0);
  }
`);

/** Waves — flowing banded ribbons. */
export const wavesScene = buildFragmentShaderScene(/* glsl */ `
  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.4;
    float band = sin(uv.x * 6.2831 + sin(uv.y * 4.0 + t) * 1.5 + t);
    float m = 0.5 + 0.5 * band;
    vec3 col = mix(uBackground, uPrimary, smoothstep(0.3, 0.7, m));
    col = mix(col, uSecondary, smoothstep(0.6, 1.0, m));
    col = mix(col, uAccent, smoothstep(0.85, 1.0, m));
    gl_FragColor = vec4(col, 1.0);
  }
`);
