"use client";

/**
 * MarketingBackground — the marketing pages' three.js mesh-gradient background.
 *
 * Reusable on any marketing surface (homepage hero, /waitlist, future
 * landing sections): it reads the SCOPED theme vars from its mount
 * point and fills whatever relative parent it sits in.
 *
 * One fullscreen shader plane:
 *   - domain-warped fbm noise drives a slow "mesh gradient" blend from
 *     the page background colour up into a primary-tinted mid tone
 *   - noise veins pick up the ACCENT colour at low amplitude
 *   - the pointer carries an accent glow: moving the mouse spikes its
 *     strength (flashes), idling decays it away; the glow flickers
 *     through the same noise field so it feels like part of the cloth
 *   - a film-grain hash is added per fragment so nothing bands
 *
 * Colours are read from the SCOPED theme vars at mount (--background /
 * --primary / --accent on the MarketingLayout wrapper), resolved to RGB
 * through a 2D canvas, so the scene always matches the active Grade
 * Marketing theme. No hardcoded colour values.
 *
 * Behaviour:
 *   - three.js is dynamically imported; until it boots (or if WebGL is
 *     unavailable) the CSS radial-wash fallback below stays visible
 *   - rAF pauses when the hero scrolls offscreen or the tab hides
 *   - prefers-reduced-motion renders one static frame, no pointer glow
 *   - DPR capped at 1.5; renderer disposed on unmount
 */

import * as React from "react";

const VERT = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform vec2  uRes;
  uniform float uTime;
  uniform vec2  uPointer;   // uv space, y-up
  uniform float uStrength;  // pointer flash energy 0..1
  uniform vec3  uBase;      // page background
  uniform vec3  uMid;       // primary-tinted mid tone
  uniform vec3  uAccent;    // accent for veins + pointer flash

  // --- Tweaker-driven knobs (see BackgroundTweaker) ---
  uniform float uSpeed;     // time multiplier
  uniform float uScale;     // field zoom
  uniform float uFalloff;   // pointer influence falloff (higher = smaller)
  uniform float uPush;      // pointer displacement amount
  uniform float uSheen;     // oily sheen intensity
  uniform float uLift;      // accent additive lift in the disturbance
  uniform float uVein;      // accent vein intensity
  uniform float uGrain;     // film grain amplitude

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec2(11.7, 5.3);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    vec2 asp = vec2(uRes.x / uRes.y, 1.0);
    vec2 p = uv * asp * uScale;
    float t = uTime * uSpeed;

    // Pointer disturbance — refraction, not rotation. The cursor gently
    // pushes the field outward with a soft ripple ring riding on it,
    // like pressing on oily water: the surface bulges and relaxes, no
    // whirlpool. Tight falloff keeps the disturbance small.
    // No ring, no epicenter: a broad, weak lens. The gaussian is wider
    // and the push smaller, and there's no ripple term — concentric
    // rings + a bright focus read as a "point", which is exactly what
    // we don't want. The disturbance should be felt, not located.
    vec2 pp = uPointer * asp * uScale;
    vec2 toP = p - pp;
    float pd = length(toP);
    float infl = exp(-pd * pd * uFalloff) * uStrength;
    vec2 dir = normalize(toP + vec2(1e-4));
    p += dir * infl * uPush;

    // Domain warp — the classic two-pass warp gives the cloth-like
    // mesh-gradient drift. Runs on the pointer-warped p, so the swirl
    // propagates through every octave.
    vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
    vec2 r = vec2(
      fbm(p + 1.6 * q + vec2(1.7, 9.2) + 0.18 * t),
      fbm(p + 1.6 * q + vec2(8.3, 2.8) - 0.13 * t)
    );
    float v = fbm(p + 1.8 * r);

    // Base cloth: background -> primary-tinted mid.
    vec3 col = mix(uBase, uMid, smoothstep(0.2, 0.95, v));

    // Accent veins — thin bright threads where the warped field peaks.
    float vein = smoothstep(0.58, 0.78, fbm(p * 1.6 - r + t));
    col = mix(col, uAccent, vein * uVein);

    // Iridescent sheen inside the disturbance — banded interference
    // between the GRADE ACCENT and the mid tone (thin-film look), plus
    // the faintest accent lift so the swirl catches light.
    // Sheen follows the NOISE inside the influence zone rather than
    // the distance to the cursor, so the accent shows up in the folds
    // of the cloth, never as a spot pinned under the pointer.
    float sheen = fbm(p * 3.2 - r * 1.5 + t * 1.6);
    vec3 oil = mix(uAccent, uMid, smoothstep(0.15, 0.85, sheen));
    col = mix(col, oil, infl * uSheen * smoothstep(0.35, 0.75, sheen));
    col += uAccent * infl * uLift * sheen;

    // Post grain — proper visible film noise, not just anti-banding.
    // Two animated hash taps at different scales approximate blue-ish
    // noise; weighted toward the midtones so blacks stay clean.
    float g1 = hash(gl_FragCoord.xy + fract(uTime) * 61.0);
    float g2 = hash(gl_FragCoord.xy * 0.5 - fract(uTime * 1.7) * 47.0);
    float grain = (g1 * 0.7 + g2 * 0.3 - 0.5);
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col += grain * uGrain * (0.5 + smoothstep(0.0, 0.45, lum));

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ─────────────────────────── Tuning store ───────────────────────────
   Module-level singleton the render loop reads EVERY FRAME, so the
   BackgroundTweaker can turn knobs without re-rendering React or
   rebuilding the renderer. Final values get baked into DEFAULT_TUNING. */

export interface BackgroundTuning {
  /** Field drift speed (time multiplier). */
  speed: number;
  /** Field zoom — higher = busier cloth. */
  scale: number;
  /** Pointer influence falloff — higher = smaller area. */
  falloff: number;
  /** Pointer displacement amount. */
  push: number;
  /** Oily sheen intensity inside the disturbance. */
  sheen: number;
  /** Additive accent lift inside the disturbance. */
  lift: number;
  /** Accent vein intensity across the field. */
  vein: number;
  /** Film grain amplitude. */
  grain: number;
}

export const DEFAULT_TUNING: BackgroundTuning = {
  speed: 0.045,
  scale: 1.7,
  falloff: 2.5,
  // Cursor response tuned WAY down (June 2026): the disturbance should
  // be on the edge of perception, a faint shift in the cloth, not an
  // obvious flashlight. Raise via the tweaker if a page wants drama.
  push: 0.04,
  sheen: 0.25,
  lift: 0.025,
  vein: 0.18,
  grain: 0.05,
};

const tuning: BackgroundTuning = { ...DEFAULT_TUNING };

export function getBackgroundTuning(): BackgroundTuning {
  return { ...tuning };
}

export function setBackgroundTuning(partial: Partial<BackgroundTuning>): void {
  Object.assign(tuning, partial);
}

/** Resolve any CSS colour (incl. oklch(var(--x)) composites) to 0..1 RGB. */
function cssColorToRGB(css: string): [number, number, number] | null {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.fillStyle = "#000";
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

/** Mix two RGB triples. */
function mixRGB(
  a: [number, number, number],
  b: [number, number, number],
  amount: number,
): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * amount,
    a[1] + (b[1] - a[1]) * amount,
    a[2] + (b[2] - a[2]) * amount,
  ];
}

export function MarketingBackground() {
  const mountRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let raf = 0;
    let cleanup: (() => void) | undefined;

    void import("three").then((THREE) => {
      if (disposed || !mount) return;

      // ----- Theme colours, read from the scoped marketing theme vars.
      const styles = getComputedStyle(mount);
      const token = (name: string) => styles.getPropertyValue(name).trim();
      const base =
        cssColorToRGB(`oklch(${token("--background")})`) ?? [0.07, 0.07, 0.07];
      const primary =
        cssColorToRGB(`oklch(${token("--primary")})`) ?? [0.35, 0.5, 0.9];
      const accent =
        cssColorToRGB(`oklch(${token("--accent")})`) ?? [0.3, 0.7, 0.8];
      // Mid tone: background lifted toward primary — keeps the cloth
      // quiet; the accent does the talking.
      const mid = mixRGB(base, primary, 0.2);

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
      } catch {
        return; // No WebGL — the CSS wash below stays.
      }

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.domElement.style.position = "absolute";
      renderer.domElement.style.inset = "0";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.opacity = "0";
      renderer.domElement.style.transition = "opacity 0.8s ease";
      mount.appendChild(renderer.domElement);

      const uniforms = {
        uRes: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2(0.5, 0.55) },
        uStrength: { value: 0 },
        uBase: { value: new THREE.Vector3(...base) },
        uMid: { value: new THREE.Vector3(...mid) },
        uAccent: { value: new THREE.Vector3(...accent) },
        // Tweaker knobs — synced from the tuning store every frame.
        uSpeed: { value: tuning.speed },
        uScale: { value: tuning.scale },
        uFalloff: { value: tuning.falloff },
        uPush: { value: tuning.push },
        uSheen: { value: tuning.sheen },
        uLift: { value: tuning.lift },
        uVein: { value: tuning.vein },
        uGrain: { value: tuning.grain },
      };

      const syncTuning = () => {
        uniforms.uSpeed.value = tuning.speed;
        uniforms.uScale.value = tuning.scale;
        uniforms.uFalloff.value = tuning.falloff;
        uniforms.uPush.value = tuning.push;
        uniforms.uSheen.value = tuning.sheen;
        uniforms.uLift.value = tuning.lift;
        uniforms.uVein.value = tuning.vein;
        uniforms.uGrain.value = tuning.grain;
      };

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const material = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms,
        depthTest: false,
        depthWrite: false,
      });
      scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

      const resize = () => {
        const { width, height } = mount.getBoundingClientRect();
        if (width === 0 || height === 0) return;
        renderer.setSize(width, height, false);
        uniforms.uRes.value.set(
          width * renderer.getPixelRatio(),
          height * renderer.getPixelRatio(),
        );
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(mount);

      // ----- Pointer: target follows the mouse, render value eases to
      // it; movement injects energy, idleness decays it (the "flash").
      const target = new THREE.Vector2(0.5, 0.55);
      let energy = 0;
      const onPointerMove = (e: PointerEvent) => {
        const rect = mount.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const x = (e.clientX - rect.left) / rect.width;
        const y = 1 - (e.clientY - rect.top) / rect.height;
        // Only react while the pointer is over (or near) the hero.
        if (x < -0.2 || x > 1.2 || y < -0.2 || y > 1.2) return;
        target.set(x, y);
        // Gentle injection: caps lower, builds slower. Vigorous
        // mouse movement should murmur, not shout.
        energy = Math.min(0.7, energy + 0.06);
      };
      window.addEventListener("pointermove", onPointerMove, { passive: true });

      // ----- Visibility gating.
      let inView = true;
      const io = new IntersectionObserver(([entry]) => {
        inView = entry?.isIntersecting ?? true;
      });
      io.observe(mount);

      const clock = new THREE.Clock();
      let revealed = false;

      const frame = () => {
        raf = requestAnimationFrame(frame);
        if (!inView || document.hidden) return;
        syncTuning();
        uniforms.uTime.value = clock.getElapsedTime();
        uniforms.uPointer.value.lerp(target, 0.07);
        energy *= 0.96;
        uniforms.uStrength.value = energy;
        renderer.render(scene, camera);
        if (!revealed) {
          revealed = true;
          renderer.domElement.style.opacity = "1";
        }
      };

      if (reducedMotion) {
        // One static, pointerless frame.
        uniforms.uTime.value = 12;
        uniforms.uStrength.value = 0;
        renderer.render(scene, camera);
        renderer.domElement.style.opacity = "1";
      } else {
        raf = requestAnimationFrame(frame);
      }

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onPointerMove);
        ro.disconnect();
        io.disconnect();
        material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <div ref={mountRef} id="gds-home-canvas" className="absolute inset-0">
      {/* CSS wash — first paint + no-WebGL fallback. The canvas fades in
          over it once the shader is running. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 38%, oklch(var(--primary) / 0.16), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 45% 35% at 50% 42%, oklch(var(--accent) / 0.1), transparent 65%)",
        }}
      />
      {/* Fade into the page surface so content below reads cleanly.
          Sits ABOVE the canvas (later sibling), which is intentional. */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background z-10" />
    </div>
  );
}
