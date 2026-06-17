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
import type { ControlSpec } from "../schema";

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

/** Glass — frosted, refractive "studio glass". A soft brand-tinted wash
 *  seen THROUGH a sheet of slumped glass: an fbm height-field refracts the
 *  backdrop (chromatically — the three channels sample at slightly offset
 *  positions, so bright edges fringe), anisotropic specular streaks catch
 *  a moving key light, and a faint caustic shimmer pools in the troughs.
 *  Mouse-reactive: the glass bulges toward the cursor like a lens, and the
 *  highlight tracks it. Theme-reactive like every fragment preset — the
 *  wash and the light are brand colours, never hard-coded. Fine grain on
 *  top reads as the frost and kills banding. */
export const glassScene = buildFragmentShaderScene(/* glsl */ `
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
  float gFbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
      v += amp * gNoise(p);
      p = p * 2.02 + 11.3;
      amp *= 0.5;
    }
    return v;
  }

  // The backdrop seen through the glass — a slow brand-tinted wash. This is
  // what the glass refracts, so it's sampled at the displaced coordinate.
  vec3 backdrop(vec2 uv, float t) {
    float w1 = gFbm(uv * 1.7 + vec2(t, -t * 0.6));
    float w2 = gFbm(uv * 1.2 - vec2(t * 0.7, t * 0.35) + 4.2);
    float diag = uv.x * 0.55 + uv.y * 0.45;
    vec3 col = uBackground;
    col = mix(col, uPrimary,   smoothstep(0.20, 0.95, w1) * 0.60);
    col = mix(col, uSecondary, smoothstep(0.30, 1.00, w2) * 0.48);
    col = mix(col, uAccent,    smoothstep(0.45, 1.00, w1 * w2 + diag * 0.2) * 0.40);
    return col;
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 uv = vUv;
    float t = uTime * 0.05; // slumped glass moves like weather, slowly

    // Glass height-field — large slow ripples (the slump) over finer ridges.
    vec2 hp = vec2(uv.x * aspect, uv.y);
    float h = gFbm(hp * 2.4 + vec2(t * 1.2, -t))
            + 0.5 * gFbm(hp * 5.5 - vec2(t * 0.6, t * 0.9) + 9.0);

    // Cursor lens — the sheet bulges toward the pointer.
    vec2 m = vec2(uMouse.x * aspect, uMouse.y);
    vec2 toM = vec2(uv.x * aspect, uv.y) - m;
    float md = length(toM);
    float bulge = exp(-md * md * 6.0);
    h += bulge * 1.1;

    // Surface normal from the height-field gradient → refraction vector.
    float e = 0.0018;
    float hx = gFbm((hp + vec2(e, 0.0)) * 2.4 + vec2(t * 1.2, -t))
             - gFbm((hp - vec2(e, 0.0)) * 2.4 + vec2(t * 1.2, -t));
    float hy = gFbm((hp + vec2(0.0, e)) * 2.4 + vec2(t * 1.2, -t))
             - gFbm((hp - vec2(0.0, e)) * 2.4 + vec2(t * 1.2, -t));
    vec2 grad = vec2(hx, hy) / (2.0 * e);
    vec2 refr = grad * 0.045 - normalize(toM + 1e-4) * bulge * 0.06;

    // Chromatic refraction — sample the backdrop per-channel at offset
    // coordinates so the glass fringes red↔blue at steep slopes.
    float disp = 0.012 + bulge * 0.02;
    vec3 col;
    col.r = backdrop(uv + refr * (1.0 + disp), t).r;
    col.g = backdrop(uv + refr, t).g;
    col.b = backdrop(uv + refr * (1.0 - disp), t).b;

    // Caustic shimmer — bright thin lines where the height-field folds.
    float caustic = pow(1.0 - abs(fract(h) - 0.5) * 2.0, 8.0);
    col += (uAccent * 0.6 + 0.4) * caustic * 0.10;

    // Anisotropic specular — a soft key light streaks across the ridges and
    // pools under the cursor. Brightens toward white, tinted by primary.
    vec2 lightDir = normalize(vec2(0.6, 1.0));
    float spec = pow(max(dot(normalize(grad + 1e-4), lightDir) * 0.5 + 0.5, 0.0), 6.0);
    spec *= 0.18 + 0.5 * bulge;
    col += mix(vec3(1.0), uPrimary, 0.35) * spec;

    // Fresnel rim — edges of the sheet read brighter, the glassy lift.
    float rim = pow(smoothstep(0.0, 1.0, length(uv - 0.5) * 1.4), 2.0);
    col += (uPrimary - uBackground) * rim * 0.06;

    // Frost — fine grain reads as the etched surface and kills banding.
    col += (gNoise(uv * uResolution.xy * 0.8) - 0.5) * 0.022;

    gl_FragColor = vec4(col, 1.0);
  }
`);

/** Holographic — iridescent foil: a brushed anisotropic grain (a diffraction
 *  grating) running on the diagonal, with the spectrum sweeping ALONG the
 *  sheet so dense rainbow-ish bands shimmer across it. Unlike a fixed-rainbow
 *  holo, the spectrum is built by cycling the BRAND colours
 *  (secondary→primary→accent), so it's theme-reactive like every fragment
 *  preset — mirrors the cool/warm/blob colour stops of the reference. Mouse-
 *  reactive: the cursor acts as the view angle, sliding the whole spectrum
 *  the way a holographic card shifts as you tilt it. Sharp glints ride the
 *  grain peaks for the metallic-foil sparkle; fine grain reads as the foil
 *  surface and kills banding. */
export const holographicScene = buildFragmentShaderScene(/* glsl */ `
  float hHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float hNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hHash(i);
    float b = hHash(i + vec2(1.0, 0.0));
    float c = hHash(i + vec2(0.0, 1.0));
    float d = hHash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float hFbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      v += amp * hNoise(p);
      p = p * 2.03 + 7.1;
      amp *= 0.5;
    }
    return v;
  }
  // Cyclic iridescent ramp through the brand colours — the spectrum is
  // theme-reactive (mirrors the reference's cool/warm/blob colour stops).
  vec3 hRamp(float t) {
    t = fract(t) * 3.0;
    if (t < 1.0) return mix(uSecondary, uPrimary, smoothstep(0.0, 1.0, t));
    if (t < 2.0) return mix(uPrimary, uAccent, smoothstep(0.0, 1.0, t - 1.0));
    return mix(uAccent, uSecondary, smoothstep(0.0, 1.0, t - 2.0));
  }
  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 uv = vec2(vUv.x * aspect, vUv.y);
    float t = uTime * 0.05;

    // Cursor = view angle: tilting the foil slides the whole spectrum.
    vec2 m = vec2(uMouse.x * aspect, uMouse.y);
    float view = ((uv.x - m.x) - (uv.y - m.y)) * 0.5;

    // Slow flow so the sheet ripples like bent foil.
    float flow = hFbm(uv * 1.3 + vec2(t, -t * 0.6));

    // Diagonal axes — colour runs ALONG, the grain runs ACROSS.
    float along  = (uv.x + uv.y) * 0.5 + flow * 0.30;
    float across = (uv.x - uv.y);

    // Dense anisotropic grain — the brushed-foil striping / diffraction grating.
    float gph = across * 90.0 + flow * 7.0 + t * 2.0;
    float grain = 0.5 + 0.5 * sin(gph);

    // Diffraction: the spectrum advances with position, grain phase, flow, view.
    float phase = along * 1.6 + grain * 0.5 + flow * 0.5 + view * 1.2 + t * 0.35;
    vec3 col = hRamp(phase);

    // Brushed anisotropy — brightness rides the grain stripes.
    col *= 0.62 + 0.45 * grain;

    // Sharp glints where stripe peaks align — the metallic-foil sparkle.
    col += pow(grain, 14.0) * 0.28;

    // Fine surface grain reads as the foil texture + kills banding.
    col += (hNoise(uv * uResolution.xy * 0.7) - 0.5) * 0.03;

    gl_FragColor = vec4(col, 1.0);
  }
`);

// ── Standard-set presets (June 2026) ───────────────────────────────────
// Each ships a param CONTRACT (ControlSpec[]) — colours are slot-bound so
// they re-theme, numbers expose meaningful ranges. The contract both builds
// the scene's uniforms (via buildFragmentShaderScene) AND drives the auto
// tweak panel; shader-presets.ts re-exports the same arrays as preset.controls.

/** Fluid — soft liquid metaballs / lava lamp. */
export const fluidControls: ControlSpec[] = [
  { type: "slider", key: "speed", label: "Speed", min: 0, max: 3, step: 0.01, default: 1 },
  { type: "slider", key: "scale", label: "Scale", min: 0.4, max: 2.5, step: 0.01, default: 1 },
  { type: "slider", key: "viscosity", label: "Viscosity", min: 0, max: 1, step: 0.01, default: 0.55 },
  { type: "slider", key: "contrast", label: "Contrast", min: 0, max: 1, step: 0.01, default: 0.45 },
  { type: "divider", key: "palette", label: "Colours" },
  { type: "color", key: "colorA", label: "Liquid A", slot: "secondary", default: "#6d5cff" },
  { type: "color", key: "colorB", label: "Liquid B", slot: "primary", default: "#22d3ee" },
  { type: "color", key: "colorC", label: "Core", slot: "accent", default: "#f0abfc" },
  { type: "divider", key: "interact", label: "Interaction" },
  { type: "slider", key: "mouseWarp", label: "Pointer warp", min: 0, max: 2, step: 0.01, default: 0.8 },
  { type: "slider", key: "grain", label: "Grain", min: 0, max: 1.5, step: 0.01, default: 1 },
];
export const fluidScene = buildFragmentShaderScene(/* glsl */ `
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p){
    vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
    return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
  }
  float ball(vec2 p, vec2 c, float r){ float d=length(p-c); return r/max(d*d,1e-4); }
  void main(){
    vec2 uv = vUv;
    float asp = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = (uv - 0.5) * vec2(asp, 1.0);
    p *= (3.5 / max(uScale, 0.2));
    float t = uTime * uSpeed * 0.4;
    vec2 mp = (uMouse - 0.5) * vec2(asp, 1.0) * (3.5 / max(uScale, 0.2));
    vec2 toM = p - mp;
    float md = length(toM);
    float warp = uMouseWarp * exp(-md*md*0.6);
    p += normalize(toM + 1e-4) * warp;
    float field = 0.0;
    const int N = 6;
    for(int i=0;i<N;i++){
      float fi = float(i);
      float a = fi * 2.39996;
      float sp = 0.6 + fract(fi*0.41)*0.9;
      vec2 c = vec2(
        sin(t*sp + a*1.7) * 1.3 + cos(t*0.7 + fi)*0.4,
        cos(t*sp*0.9 + a) * 1.1 + sin(t*0.5 + fi*1.3)*0.4
      );
      float r = mix(0.22, 0.5, fract(fi*0.73));
      field += ball(p, c, r);
    }
    float thresh = mix(2.2, 5.5, clamp(uViscosity,0.0,1.0));
    float m = smoothstep(thresh*0.55, thresh, field);
    float inner = smoothstep(thresh*0.9, thresh*1.8, field);
    float swirl = noise(p*0.8 + t*0.3);
    vec3 liquid = mix(uColorA, uColorB, smoothstep(0.2,0.8,m + swirl*0.25 - 0.1));
    liquid = mix(liquid, uColorC, inner*0.85);
    liquid = (liquid - 0.5) * mix(0.85, 1.6, clamp(uContrast,0.0,1.0)) + 0.5;
    vec3 col = mix(uBackground, liquid, m);
    col += vec3(0.06) * pow(inner, 2.0);
    col += (hash(uv*uResolution.xy + t) - 0.5) * 0.02 * uGrain;
    col = clamp(col, 0.0, 1.0);
    gl_FragColor = vec4(col, 1.0);
  }
`, fluidControls);

/** Aurora — northern-lights curtains over a dark sky. */
export const auroraControls: ControlSpec[] = [
  { type: "slider", key: "speed", label: "Speed", min: 0, max: 3, step: 0.01, default: 1 },
  { type: "slider", key: "bandCount", label: "Curtains", min: 1, max: 5, step: 1, default: 3 },
  { type: "slider", key: "waviness", label: "Waviness", min: 0, max: 2, step: 0.01, default: 1 },
  { type: "slider", key: "height", label: "Height", min: 0.2, max: 0.9, step: 0.01, default: 0.5 },
  { type: "slider", key: "glow", label: "Glow", min: 0.2, max: 2.5, step: 0.01, default: 1.2 },
  { type: "divider", key: "palette", label: "Aurora colours" },
  { type: "color", key: "colorLow", label: "Low (ground)", slot: "primary", default: "#22e0a3" },
  { type: "color", key: "colorMid", label: "Mid", slot: "secondary", default: "#19c2d6" },
  { type: "color", key: "colorHigh", label: "High (sky)", slot: "accent", default: "#9b5cff" },
  { type: "divider", key: "interact", label: "Interaction" },
  { type: "slider", key: "mouseSway", label: "Pointer sway", min: 0, max: 1, step: 0.01, default: 0.35 },
  { type: "slider", key: "grain", label: "Grain", min: 0, max: 1.5, step: 0.01, default: 1 },
];
export const auroraScene = buildFragmentShaderScene(/* glsl */ `
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p){
    vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
    return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
  }
  float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.03+7.1; a*=0.5; } return v; }
  void main(){
    vec2 uv = vUv;
    float t = uTime * uSpeed * 0.25;
    float sway = (uMouse.x - 0.5) * uMouseSway;
    vec3 col = uBackground * (0.5 + 0.5*uv.y);
    float stars = pow(hash(floor(uv*vec2(220.0,360.0))), 60.0);
    col += stars * smoothstep(0.45, 1.0, uv.y) * 0.6;
    float bands = clamp(uBandCount, 1.0, 5.0);
    vec3 auroraAccum = vec3(0.0);
    for(int i=0;i<5;i++){
      if(float(i) >= bands) break;
      float fi = float(i);
      float turb = fbm(vec2(uv.x*3.0 + fi*5.1, t + fi*1.7)) * uWaviness;
      float ridge = uv.x + sway + turb*0.35 + 0.12*sin(uv.y*4.0 + t*2.0 + fi*2.1);
      float centre = 0.5 + 0.32*sin(t*0.7 + fi*1.9);
      float dd = (ridge - centre) / 0.14;
      float sheet = exp(-dd*dd);
      float base = 0.05 + 0.18*fi/bands;
      float h = smoothstep(base, base + uHeight, uv.y) * (1.0 - smoothstep(base + uHeight, base + uHeight + 0.5, uv.y));
      float shimmer = 0.6 + 0.4*sin(uv.y*22.0 - t*6.0 + turb*4.0 + fi*3.0);
      float intensity = sheet * h * shimmer;
      vec3 lo = mix(uColorLow, uColorMid, smoothstep(base, base+uHeight*0.6, uv.y));
      vec3 ribbon = mix(lo, uColorHigh, smoothstep(base+uHeight*0.4, base+uHeight, uv.y));
      auroraAccum += ribbon * intensity;
    }
    col += auroraAccum * uGlow;
    col += auroraAccum * auroraAccum * uGlow * 0.4;
    col += (hash(uv*uResolution.xy + t) - 0.5) * 0.02 * uGrain;
    col = clamp(col, 0.0, 1.0);
    gl_FragColor = vec4(col, 1.0);
  }
`, auroraControls);

/** Water caustics — animated underwater light net. */
export const causticsControls: ControlSpec[] = [
  { type: "slider", key: "speed", label: "Speed", min: 0, max: 3, step: 0.01, default: 1 },
  { type: "slider", key: "scale", label: "Scale", min: 0.4, max: 3, step: 0.01, default: 1 },
  { type: "slider", key: "sharpness", label: "Sharpness", min: 0, max: 1, step: 0.01, default: 0.5 },
  { type: "slider", key: "brightness", label: "Brightness", min: 0.2, max: 2.5, step: 0.01, default: 1.1 },
  { type: "divider", key: "palette", label: "Water tint" },
  { type: "color", key: "deep", label: "Deep", slot: "secondary", default: "#0b2a4a" },
  { type: "color", key: "shallow", label: "Shallow", slot: "primary", default: "#2bb0c9" },
  { type: "divider", key: "interact", label: "Interaction" },
  { type: "slider", key: "chroma", label: "Chromatic split", min: 0, max: 2, step: 0.01, default: 0.6 },
  { type: "slider", key: "mouseRipple", label: "Pointer ripple", min: 0, max: 2, step: 0.01, default: 0.8 },
  { type: "slider", key: "grain", label: "Grain", min: 0, max: 1.5, step: 0.01, default: 1 },
];
export const causticsScene = buildFragmentShaderScene(/* glsl */ `
  vec2 hash2(vec2 p){
    p = vec2(dot(p, vec2(127.1,311.7)), dot(p, vec2(269.5,183.3)));
    return fract(sin(p)*43758.5453);
  }
  float worley(vec2 p, float t){
    vec2 ip = floor(p), fp = fract(p);
    float d = 1.0;
    for(int y=-1;y<=1;y++){
      for(int x=-1;x<=1;x++){
        vec2 g = vec2(float(x), float(y));
        vec2 o = hash2(ip + g);
        o = 0.5 + 0.5*sin(t + 6.2831*o);
        vec2 r = g + o - fp;
        d = min(d, dot(r, r));
      }
    }
    return sqrt(d);
  }
  float causticAt(vec2 p, float t, float sharp){
    float w1 = worley(p, t);
    float w2 = worley(p*1.9 + 4.3, t*1.3);
    float veins = w1*0.65 + w2*0.35;
    float c = 1.0 - veins;
    c = pow(clamp(c,0.0,1.0), mix(2.0, 9.0, clamp(sharp,0.0,1.0)));
    return c;
  }
  void main(){
    vec2 uv = vUv;
    float asp = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = vec2(uv.x*asp, uv.y) * (4.0 * uScale);
    float t = uTime * uSpeed * 0.5;
    vec2 m = vec2(uMouse.x*asp, uMouse.y) * (4.0 * uScale);
    vec2 toM = p - m;
    float md = length(toM);
    float ripple = sin(md*3.0 - uTime*4.0) * exp(-md*0.8) * uMouseRipple;
    p += normalize(toM + 1e-4) * ripple;
    p += vec2(t*0.15, t*0.1);
    float off = uChroma * 0.06;
    float cr = causticAt(p + vec2( off, 0.0), t, uSharpness);
    float cg = causticAt(p, t, uSharpness);
    float cb = causticAt(p + vec2(-off, 0.0), t, uSharpness);
    vec3 water = mix(uDeep, uShallow, smoothstep(0.0, 1.0, uv.y));
    vec3 light = vec3(cr, cg, cb) * uBrightness;
    vec3 col = water + light * (0.6 + 0.4*uv.y);
    col += uShallow * pow(uv.y, 3.0) * 0.15;
    col += (hash2(uv*uResolution.xy + t).x - 0.5) * 0.02 * uGrain;
    col = clamp(col, 0.0, 1.0);
    gl_FragColor = vec4(col, 1.0);
  }
`, causticsControls);

/** Flowing ribbon — silky iridescent satin sweep. */
export const ribbonControls: ControlSpec[] = [
  { type: "divider", key: "motion", label: "Motion" },
  { type: "slider", key: "speed", label: "Speed", min: 0, max: 3, step: 0.01, default: 0.6 },
  { type: "slider", key: "mouseSway", label: "Mouse sway", min: 0, max: 1, step: 0.01, default: 0.3 },
  { type: "divider", key: "form", label: "Ribbon" },
  { type: "slider", key: "ribbonWidth", label: "Ribbon width", min: 0.08, max: 0.6, step: 0.01, default: 0.26 },
  { type: "slider", key: "twist", label: "Twist", min: 0, max: 2.5, step: 0.01, default: 1.0 },
  { type: "slider", key: "sheen", label: "Sheen", min: 0, max: 1, step: 0.01, default: 0.7 },
  { type: "divider", key: "palette", label: "Palette" },
  { type: "color", key: "ribbonA", label: "Ribbon A", default: "#f7a8c4", slot: "primary" },
  { type: "color", key: "ribbonB", label: "Ribbon B", default: "#8fe3d8", slot: "secondary" },
  { type: "color", key: "ribbonC", label: "Ribbon C", default: "#c9b8ff", slot: "accent" },
  { type: "color", key: "bg", label: "Background", default: "#f4f1ec", slot: "background" },
  { type: "divider", key: "finish", label: "Finish" },
  { type: "slider", key: "grain", label: "Grain", min: 0, max: 0.08, step: 0.001, default: 0.02 },
];
export const ribbonScene = buildFragmentShaderScene(/* glsl */ `
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float vnoise(vec2 p){
    vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    float a=hash(i), b=hash(i+vec2(1.0,0.0));
    float c=hash(i+vec2(0.0,1.0)), d=hash(i+vec2(1.0,1.0));
    return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
  }
  float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*vnoise(p); p*=2.02; a*=0.5; } return v; }
  void main(){
    vec2 uv = vUv;
    float t = uTime * uSpeed;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = uv - 0.5;
    p.x *= aspect;
    float mouseY = (uMouse.y - 0.5) * uMouseSway;
    float curve = sin(p.x*2.3 + t*0.9)*0.18*uTwist + sin(p.x*4.7 - t*1.3)*0.07*uTwist + sin(p.x*1.1 + t*0.5)*0.10;
    float centre = curve + mouseY;
    float d = p.y - centre;
    float taper = mix(0.55, 1.0, 0.5 + 0.5*sin(p.x*1.7 - t*0.7));
    float halfW = uRibbonWidth * 0.5 * taper;
    float edge = 0.06 + 0.02*uRibbonWidth;
    float mask = smoothstep(halfW + edge, halfW - edge, abs(d));
    float slope = cos(p.x*2.3 + t*0.9)*2.3*0.18*uTwist + cos(p.x*4.7 - t*1.3)*4.7*0.07*uTwist + cos(p.x*1.1 + t*0.5)*1.1*0.10;
    float across = clamp(d / max(halfW, 0.001) * 0.5 + 0.5, 0.0, 1.0);
    float folds = fbm(vec2(p.x*3.0 - t*0.6, across*2.5));
    float fold = sin(across*6.2831*2.0 + slope*2.5 + folds*3.0 - t);
    float shade = 0.5 + 0.5*fold;
    float irid = fract(across + fold*0.25 + p.x*0.4 + t*0.05);
    vec3 col3a = mix(uRibbonA, uRibbonB, smoothstep(0.0, 0.5, irid));
    vec3 ribCol = mix(col3a, uRibbonC, smoothstep(0.5, 1.0, irid));
    vec3 ribbon = ribCol * mix(0.55, 1.15, shade);
    float spec = pow(clamp(shade, 0.0, 1.0), mix(40.0, 4.0, 1.0 - uSheen));
    float specBand = smoothstep(0.0, 0.4, across) * smoothstep(1.0, 0.6, across);
    ribbon += vec3(1.0) * spec * specBand * uSheen * 0.9;
    float rim = smoothstep(halfW, halfW - edge*1.5, abs(d)) - smoothstep(halfW - edge*1.5, halfW - edge*3.0, abs(d));
    ribbon += uRibbonC * max(rim, 0.0) * 0.6 * uSheen;
    vec3 ground = mix(uBg, mix(uBg, uRibbonA, 0.06), smoothstep(0.0, 1.0, uv.y));
    float bloom = smoothstep(halfW*3.0, 0.0, abs(d)) * 0.18;
    ground += uRibbonB * bloom;
    vec3 col = mix(ground, ribbon, mask);
    col += (hash(uv*uResolution.xy + t) - 0.5) * uGrain;
    col = clamp(col, 0.0, 1.0);
    gl_FragColor = vec4(col, 1.0);
  }
`, ribbonControls);

/** Concentric — rings rippling from a centre with moiré. */
export const concentricControls: ControlSpec[] = [
  { type: "divider", key: "motion", label: "Motion" },
  { type: "slider", key: "speed", label: "Speed", min: 0, max: 3, step: 0.01, default: 0.7 },
  { type: "divider", key: "rings", label: "Rings" },
  { type: "slider", key: "ringCount", label: "Ring count", min: 2, max: 40, step: 0.5, default: 14 },
  { type: "slider", key: "ringSharpness", label: "Ring sharpness", min: 0, max: 1, step: 0.01, default: 0.45 },
  { type: "slider", key: "moire", label: "Moiré", min: 0, max: 1, step: 0.01, default: 0.5 },
  { type: "slider", key: "glow", label: "Centre glow", min: 0, max: 1, step: 0.01, default: 0.5 },
  { type: "divider", key: "center", label: "Centre" },
  { type: "toggle", key: "followMouse", label: "Follow cursor", default: true },
  { type: "slider", key: "centerX", label: "Centre X", min: 0, max: 1, step: 0.01, default: 0.5 },
  { type: "slider", key: "centerY", label: "Centre Y", min: 0, max: 1, step: 0.01, default: 0.5 },
  { type: "divider", key: "palette", label: "Palette" },
  { type: "color", key: "colorA", label: "Colour A", default: "#b45cff", slot: "primary" },
  { type: "color", key: "colorB", label: "Colour B", default: "#ff4fd8", slot: "secondary" },
  { type: "color", key: "colorC", label: "Colour C", default: "#6a2fb0", slot: "accent" },
  { type: "color", key: "bg", label: "Background", default: "#1a0e2a", slot: "background" },
  { type: "divider", key: "finish", label: "Finish" },
  { type: "slider", key: "grain", label: "Grain", min: 0, max: 0.08, step: 0.001, default: 0.02 },
];
export const concentricScene = buildFragmentShaderScene(/* glsl */ `
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  void main(){
    vec2 uv = vUv;
    float t = uTime * uSpeed;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 centre = vec2(uCenterX, uCenterY);
    centre = mix(centre, uMouse, step(0.5, uFollowMouse));
    vec2 p = uv - centre;
    p.x *= aspect;
    float r = length(p);
    float ang = atan(p.y, p.x);
    float pulse = 1.0 + 0.06*sin(t*1.5);
    float rr = r * pulse;
    float phase = rr * uRingCount * 6.2831 - t*3.0;
    float rings = pow(0.5 + 0.5*sin(phase), mix(1.0, 6.0, uRingSharpness));
    float phase2 = rr * uRingCount * 6.2831 * 1.07 - t*2.3 + ang*0.5;
    float rings2 = pow(0.5 + 0.5*sin(phase2), mix(1.0, 6.0, uRingSharpness));
    float moire = mix(rings, rings * rings2, uMoire);
    float radialMix = fract(rr*1.2 - t*0.1);
    vec3 base = mix(uColorA, uColorB, smoothstep(0.0, 0.6, radialMix));
    base = mix(base, uColorC, smoothstep(0.6, 1.0, radialMix));
    vec3 col = mix(uBg, base, moire);
    float glow = exp(-rr * mix(6.0, 1.5, uGlow)) * uGlow;
    col += uColorA * glow;
    float vig = smoothstep(1.3, 0.2, r);
    col = mix(uBg * 0.85, col, vig);
    col += (hash(uv*uResolution.xy + t) - 0.5) * uGrain;
    col = clamp(col, 0.0, 1.0);
    gl_FragColor = vec4(col, 1.0);
  }
`, concentricControls);

/** Deep vortex — dark spiralling streaks with starfield. */
export const vortexControls: ControlSpec[] = [
  { type: "divider", key: "motion", label: "Motion" },
  { type: "slider", key: "speed", label: "Speed", min: 0, max: 3, step: 0.01, default: 0.7 },
  { type: "slider", key: "mousePull", label: "Mouse pull", min: 0, max: 1, step: 0.01, default: 0.35 },
  { type: "divider", key: "swirl", label: "Swirl" },
  { type: "slider", key: "spin", label: "Spin", min: -6, max: 6, step: 0.1, default: 3.0 },
  { type: "slider", key: "armCount", label: "Arms", min: 1, max: 16, step: 1, default: 5 },
  { type: "slider", key: "depth", label: "Depth", min: 0, max: 1, step: 0.01, default: 0.6 },
  { type: "divider", key: "palette", label: "Palette" },
  { type: "color", key: "colorA", label: "Colour A", default: "#3a1d6e", slot: "primary" },
  { type: "color", key: "colorB", label: "Colour B", default: "#a24be0", slot: "secondary" },
  { type: "color", key: "bg", label: "Background", default: "#0a0612", slot: "background" },
  { type: "divider", key: "finish", label: "Finish" },
  { type: "slider", key: "sparkle", label: "Sparkle", min: 0, max: 1, step: 0.01, default: 0.4 },
  { type: "slider", key: "grain", label: "Grain", min: 0, max: 0.08, step: 0.001, default: 0.02 },
];
export const vortexScene = buildFragmentShaderScene(/* glsl */ `
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float vnoise(vec2 p){
    vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    float a=hash(i), b=hash(i+vec2(1.0,0.0));
    float c=hash(i+vec2(0.0,1.0)), d=hash(i+vec2(1.0,1.0));
    return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
  }
  void main(){
    vec2 uv = vUv;
    float t = uTime * uSpeed;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 centre = mix(vec2(0.5), uMouse, uMousePull);
    vec2 p = uv - centre;
    p.x *= aspect;
    float r = length(p);
    float ang = atan(p.y, p.x);
    float twist = uSpin * log(r*3.0 + 0.18);
    float spiralAng = ang + twist + t*0.6;
    float arms = pow(0.5 + 0.5*sin(spiralAng * uArmCount), 2.2);
    float flow = vnoise(vec2(spiralAng * uArmCount * 0.5, r*8.0 - t*1.5));
    arms = mix(arms, arms * (0.5 + flow), 0.6);
    float depth = pow(clamp(r * mix(2.4, 1.1, uDepth), 0.0, 1.0), mix(0.6, 2.5, uDepth));
    vec3 streakCol = mix(uColorA, uColorB, smoothstep(0.0, 0.7, r));
    float intensity = arms * depth;
    vec3 col = mix(uBg, streakCol, clamp(intensity, 0.0, 1.0));
    float throat = exp(-r*5.0);
    col += uColorB * throat * 0.5 * depth;
    col = mix(uBg * 0.4, col, smoothstep(0.0, 0.12, r));
    vec2 sgrid = floor(uv * uResolution / 2.5);
    float star = hash(sgrid);
    float spark = step(0.992, star);
    float twinkle = 0.5 + 0.5*sin(t*3.0 + star*100.0);
    col += vec3(1.0) * spark * twinkle * uSparkle * smoothstep(0.1, 0.9, r);
    col += (hash(uv*uResolution.xy + t) - 0.5) * uGrain;
    col = clamp(col, 0.0, 1.0);
    gl_FragColor = vec4(col, 1.0);
  }
`, vortexControls);

/** Spectral bloom — kaleidoscopic radial spectrum burst. */
export const spectralControls: ControlSpec[] = [
  { type: "slider", key: "speed", label: "Speed", min: 0, max: 3, step: 0.01, default: 0.6 },
  { type: "slider", key: "petalCount", label: "Petals", min: 3, max: 24, step: 1, default: 8 },
  { type: "slider", key: "bloomRadius", label: "Bloom radius", min: 0.1, max: 1.2, step: 0.01, default: 0.5 },
  { type: "slider", key: "spread", label: "Spectrum spread", min: 0.1, max: 1.5, step: 0.01, default: 0.7 },
  { type: "slider", key: "cycle", label: "Spectral cycling", min: 0, max: 2, step: 0.01, default: 0.6 },
  { type: "slider", key: "glow", label: "Glow", min: 0, max: 1.5, step: 0.01, default: 0.6 },
  { type: "divider", key: "palette", label: "Palette" },
  { type: "color", key: "colorA", label: "Colour A", default: "#2dd4bf", slot: "primary" },
  { type: "color", key: "colorB", label: "Colour B", default: "#3b82f6", slot: "secondary" },
  { type: "color", key: "colorC", label: "Colour C", default: "#a855f7", slot: "accent" },
  { type: "color", key: "bg", label: "Background", default: "#05060a", slot: "background" },
  { type: "divider", key: "interaction", label: "Interaction" },
  { type: "slider", key: "mouseInfluence", label: "Mouse pull", min: 0, max: 1, step: 0.01, default: 0.6 },
];
export const spectralScene = buildFragmentShaderScene(/* glsl */ `
  #define PI 3.14159265359
  #define TAU 6.28318530718
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  vec3 spectralShift(vec3 base, float h){
    const vec3 k = vec3(0.57735);
    float c = cos(h), s = sin(h);
    return base*c + cross(k, base)*s + k*dot(k, base)*(1.0-c);
  }
  void main(){
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 mc = mix(vec2(0.5), uMouse, uMouseInfluence);
    vec2 p = uv - mc;
    p.x *= aspect;
    float t = uTime * uSpeed;
    float r = length(p);
    float a = atan(p.y, p.x);
    float sym = max(uPetalCount, 1.0);
    float seg = TAU / sym;
    float af = mod(a, seg);
    af = abs(af - seg*0.5);
    float ang = af / (seg*0.5);
    float petalShape = pow(cos(ang*PI - PI*0.5), 2.0 + uSpread*6.0);
    float bloom = uBloomRadius * (0.8 + 0.2*sin(t*1.3));
    float ray = petalShape / (1.0 + pow(r/bloom, 2.2));
    float subA = a*sym + t*1.2;
    float ripple = 0.5 + 0.5*sin(subA*1.0 - r*14.0 + t*2.0);
    ray *= mix(0.6, 1.0, ripple);
    float spec = r*uSpread*4.0 - t*uCycle + ang*0.4;
    vec3 c1 = mix(uColorA, uColorB, 0.5 + 0.5*sin(spec*TAU));
    vec3 c2 = mix(uColorB, uColorC, 0.5 + 0.5*sin(spec*TAU + 2.094));
    vec3 petalCol = mix(c1, c2, 0.5 + 0.5*sin(spec*TAU + 4.188));
    petalCol = spectralShift(petalCol, (r*2.0 - t*0.6)*uSpread);
    float core = uGlow / (1.0 + r*r*60.0);
    vec3 col = uBg;
    col += petalCol * ray * (1.2 + uGlow*1.5);
    col += petalCol * core * 1.5;
    col += (uColorA + uColorB) * core * 0.4;
    col *= 1.0 - 0.35*smoothstep(0.4, 1.1, r);
    col += hash(uv*uResolution.xy + t)*0.02 - 0.01;
    col = max(col, 0.0);
    gl_FragColor = vec4(col, 1.0);
  }
`, spectralControls);

/** Halftone pop — pop-art print-dot field over a palette gradient. */
export const halftoneControls: ControlSpec[] = [
  { type: "slider", key: "speed", label: "Speed", min: 0, max: 3, step: 0.01, default: 0.7 },
  { type: "slider", key: "dotSize", label: "Dot size", min: 6, max: 48, step: 1, default: 18, unit: "px" },
  { type: "slider", key: "gridAngle", label: "Grid angle", min: 0, max: 90, step: 1, default: 27, unit: "deg" },
  { type: "slider", key: "contrast", label: "Contrast", min: 0.5, max: 4, step: 0.01, default: 1.6 },
  { type: "slider", key: "dotSoftness", label: "Dot softness", min: 0, max: 1, step: 0.01, default: 0.35 },
  { type: "divider", key: "palette", label: "Palette" },
  { type: "color", key: "colorA", label: "Ink A", default: "#f97316", slot: "primary" },
  { type: "color", key: "colorB", label: "Ink B", default: "#fb7185", slot: "secondary" },
  { type: "color", key: "colorC", label: "Ink C", default: "#fbbf24", slot: "accent" },
  { type: "color", key: "bg", label: "Paper", default: "#0b0b0f", slot: "background" },
  { type: "divider", key: "interaction", label: "Interaction" },
  { type: "slider", key: "mouseInfluence", label: "Mouse swell", min: 0, max: 2, step: 0.01, default: 0.8 },
];
export const halftoneScene = buildFragmentShaderScene(/* glsl */ `
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
    float a=hash(i),b=hash(i+vec2(1,0)),c=hash(i+vec2(0,1)),d=hash(i+vec2(1,1));
    return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }
  mat2 rot(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
  void main(){
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    float t = uTime * uSpeed;
    vec2 g = uv; g.x *= aspect;
    float diag = (g.x + g.y) * 0.7;
    float wave = sin(diag*3.0 - t*1.4) * 0.5 + 0.5;
    float n = noise(g*2.2 + vec2(t*0.3, -t*0.2));
    float field = mix(wave, n, 0.35);
    vec2 mp = uMouse; mp.x *= aspect;
    float md = distance(g, mp);
    field += uMouseInfluence * (0.6 / (1.0 + md*md*18.0));
    field = clamp((field - 0.5) * uContrast + 0.5, 0.0, 1.0);
    vec3 grad = mix(uColorA, uColorB, smoothstep(0.0, 0.7, field));
    grad = mix(grad, uColorC, smoothstep(0.55, 1.0, field));
    vec2 frag = gl_FragCoord.xy;
    float ga = radians(uGridAngle);
    vec2 rg = rot(ga) * frag;
    rg += vec2(t * 30.0);
    float cell = max(uDotSize, 2.0);
    vec2 gp = mod(rg, cell) - cell*0.5;
    float dist = length(gp);
    float radius = (cell*0.5) * sqrt(clamp(field, 0.0, 1.0));
    float soft = mix(0.5, cell*0.45, clamp(uDotSoftness, 0.0, 1.0));
    float dot = 1.0 - smoothstep(radius - soft, radius + soft, dist);
    vec3 col = mix(uBg, grad, dot);
    float halo = smoothstep(radius + soft, radius - soft*2.0, dist);
    col += grad * halo * 0.06;
    col += hash(uv*uResolution.xy + t)*0.02 - 0.01;
    col = clamp(col, 0.0, 1.0);
    gl_FragColor = vec4(col, 1.0);
  }
`, halftoneControls);

/** Digital grid — data-activity cells, pulses, ring + spotlight. */
export const digitalControls: ControlSpec[] = [
  { type: "slider", key: "speed", label: "Speed", min: 0, max: 3, step: 0.01, default: 0.8 },
  { type: "slider", key: "gridDensity", label: "Grid density", min: 6, max: 60, step: 1, default: 26 },
  { type: "slider", key: "pulseSpeed", label: "Pulse speed", min: 0, max: 4, step: 0.01, default: 1.2 },
  { type: "slider", key: "glow", label: "Glow / intensity", min: 0, max: 2, step: 0.01, default: 0.9 },
  { type: "slider", key: "ringRadius", label: "Ring radius", min: 0.1, max: 0.6, step: 0.01, default: 0.32 },
  { type: "slider", key: "scanline", label: "Scanline mix", min: 0, max: 1, step: 0.01, default: 0.3 },
  { type: "divider", key: "palette", label: "Palette" },
  { type: "color", key: "colorA", label: "Accent", default: "#22c55e", slot: "primary" },
  { type: "color", key: "colorB", label: "Rim", default: "#4ade80", slot: "accent" },
  { type: "color", key: "bg", label: "Background", default: "#03060a", slot: "background" },
  { type: "divider", key: "interaction", label: "Interaction" },
  { type: "slider", key: "mouseInfluence", label: "Mouse spotlight", min: 0, max: 2, step: 0.01, default: 1.0 },
];
export const digitalScene = buildFragmentShaderScene(/* glsl */ `
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float hash1(float n){ return fract(sin(n)*43758.5453); }
  void main(){
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    float t = uTime * uSpeed;
    vec2 cc = uv - 0.5; cc.x *= aspect;
    float r = length(cc);
    vec2 g = uv; g.x *= aspect;
    float dens = max(uGridDensity, 2.0);
    vec2 cellId = floor(g * dens);
    vec2 cellUv = fract(g * dens);
    float perCell = hash(cellId);
    float pt = uTime * uPulseSpeed;
    float wavePos = (cellId.x + cellId.y) * 0.18;
    float wave = sin(wavePos - pt*2.0);
    float flick = step(0.55, hash1(perCell*37.0 + floor(pt + perCell*4.0)));
    float activity = smoothstep(0.4, 1.0, wave) * mix(0.4, 1.0, flick);
    activity = max(activity, 0.12);
    vec2 d = abs(cellUv - 0.5);
    float pad = max(d.x, d.y);
    float cellMask = 1.0 - smoothstep(0.30, 0.46, pad);
    float line = smoothstep(0.46, 0.5, pad);
    float ring = abs(r - uRingRadius);
    float ringGlow = uGlow * 0.02 / (ring + 0.005);
    float disc = smoothstep(uRingRadius - 0.02, uRingRadius + 0.02, r);
    vec2 mp = uMouse; mp.x *= aspect;
    float md = distance(g, mp);
    float spot = uMouseInfluence * (0.5 / (1.0 + md*md*10.0));
    float scan = mix(1.0, 0.5 + 0.5*sin(uv.y*uResolution.y*0.6 - t*8.0), uScanline);
    vec3 accent = uColorA;
    float lit = activity * cellMask;
    lit *= disc;
    lit += spot * cellMask;
    vec3 col = uBg;
    col += accent * lit * (1.0 + uGlow) * scan;
    col += mix(uColorA, uColorB, 0.5) * line * 0.06 * disc;
    col += uColorB * ringGlow;
    col += accent * spot * 0.5;
    col += hash(uv*uResolution.xy + t)*0.02 - 0.01;
    col = max(col, 0.0);
    gl_FragColor = vec4(col, 1.0);
  }
`, digitalControls);
