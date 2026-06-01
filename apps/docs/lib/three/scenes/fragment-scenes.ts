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
