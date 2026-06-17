/**
 * Custom fragment shader scene — runs a user-supplied GLSL fragment shader
 * on a fullscreen quad with a standardised uniform set.
 *
 * This is the "write me a shader from a prompt" surface. Instead of asking
 * an LLM to author a full three.js SceneFactory (imports, geometry, etc.),
 * it only has to write `void main()` against a known uniform contract.
 *
 * The uniforms ARE the design contract — mirror the same palette slots
 * that presets use, so custom shaders pick up theming for free.
 */

import * as THREE from "three";
import type { SceneFactory, SceneHandle, Palette } from "./types";
import type { ControlSpec } from "./schema";

/** Uniform name for a contract param key: `coolTone` → `uCoolTone`. The
 *  shader author references these directly (e.g. `uRefraction`, `uRamp`). */
export function paramUniformName(key: string): string {
  return "u" + key.charAt(0).toUpperCase() + key.slice(1);
}

/** Max swatches a colour-list param declares as a fixed-size GLSL array. */
const COLOR_LIST_CAP = 8;

/** GLSL uniform declarations generated from a control contract. Appended to
 *  FRAGMENT_HEADER so the author can read each param as a typed uniform:
 *    slider / toggle / select / segmented → `uniform float u<Key>;`
 *    color                                → `uniform vec3  u<Key>;`
 *    colorList                            → `uniform vec3  u<Key>[N];`
 *                                            `uniform int   u<Key>Count;`
 */
function paramUniformDeclarations(controls: readonly ControlSpec[]): string {
  const lines: string[] = [];
  for (const c of controls) {
    if (c.type === "divider") continue;
    const u = paramUniformName(c.key);
    if (c.type === "color") lines.push(`uniform vec3 ${u};`);
    else if (c.type === "colorList") {
      const n = Math.min(c.max ?? c.default.length, COLOR_LIST_CAP);
      lines.push(`uniform vec3 ${u}[${n}];`, `uniform int ${u}Count;`);
    } else {
      // slider / toggle / select / segmented all ride a float uniform.
      lines.push(`uniform float ${u};`);
    }
  }
  return lines.join("\n  ");
}

/** Safe THREE.Color from a string — falls back to mid-grey on a value
 *  THREE can't parse (e.g. an unresolved oklch()/var()). Hosts resolve
 *  colours to rgb() before calling setParams, so this is just a guard. */
function safeColor(value: string): THREE.Color {
  const c = new THREE.Color();
  try {
    c.set(value);
  } catch {
    c.setRGB(0.5, 0.5, 0.5);
  }
  return c;
}

/**
 * Auto-injected prelude — defines every uniform and varying the user's
 * fragment can reference. Users should NOT redeclare these. Their shader
 * source is appended verbatim to this header.
 *
 * Kept as glsl100 (varying / gl_FragColor) since that's the syntax
 * dominant in LLM training data; three.js auto-upgrades it for WebGL2.
 */
export const FRAGMENT_HEADER = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uMouse;
  uniform vec3  uPrimary;
  uniform vec3  uSecondary;
  uniform vec3  uAccent;
  uniform vec3  uBackground;
`;

const VERTEX_FULLSCREEN = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/**
 * Thrown when the user's fragment shader fails to compile. Carries both the
 * GL info log and the original source so callers can surface it or fall back.
 */
export class ShaderCompileError extends Error {
  readonly log: string;
  readonly source: string;
  constructor(log: string, source: string) {
    super(`Fragment shader failed to compile:\n${log.trim()}`);
    this.name = "ShaderCompileError";
    this.log = log;
    this.source = source;
  }
}

/**
 * Pre-compile a fragment shader against the renderer's live GL context so we
 * can surface errors BEFORE attaching the material to a scene. three.js's own
 * compile path logs to console and silently renders black — not what we want
 * when the user expects either a working shader or a clear fallback.
 */
function precompileFragment(renderer: THREE.WebGLRenderer, source: string): void {
  const gl = renderer.getContext() as WebGLRenderingContext | WebGL2RenderingContext;
  const shader = gl.createShader(gl.FRAGMENT_SHADER);
  if (!shader) throw new Error("Unable to allocate fragment shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const ok = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  const log = gl.getShaderInfoLog(shader) || "";
  gl.deleteShader(shader);
  if (!ok) throw new ShaderCompileError(log, source);
}

/**
 * Build a SceneFactory from a user-supplied fragment shader body.
 *
 * Throws `ShaderCompileError` synchronously (from the SceneContext call) if
 * the GLSL doesn't compile. ThreeScene catches this and falls back to
 * `preset="space"` so the UI stays populated.
 */
export function buildFragmentShaderScene(
  userFragment: string,
  /** Optional param contract — each non-divider control becomes a uniform
   *  the shader can read (see paramUniformName) and `setParams` can drive
   *  live without a remount. */
  controls?: readonly ControlSpec[],
): SceneFactory {
  return ({ renderer, width, height, palette }) => {
    const paramDecls = controls?.length
      ? paramUniformDeclarations(controls)
      : "";
    const combined = `${FRAGMENT_HEADER}\n  ${paramDecls}\n${userFragment}`;

    // Surfaces compile errors up to the caller with the GL info log attached.
    precompileFragment(renderer, combined);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms: Record<string, THREE.IUniform> = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(width, height) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uPrimary: { value: new THREE.Color(palette.primary) },
      uSecondary: { value: new THREE.Color(palette.secondary) },
      uAccent: { value: new THREE.Color(palette.accent) },
      uBackground: { value: new THREE.Color(palette.background) },
    };

    // Seed param uniforms from the contract defaults so the shader compiles
    // and paints sensibly before the host pushes resolved values via
    // setParams (which runs immediately after build).
    if (controls?.length) {
      for (const c of controls) {
        if (c.type === "divider") continue;
        const u = paramUniformName(c.key);
        if (c.type === "color") {
          uniforms[u] = { value: safeColor(c.default) };
        } else if (c.type === "colorList") {
          const n = Math.min(c.max ?? c.default.length, COLOR_LIST_CAP);
          const arr = Array.from({ length: n }, (_, i) =>
            safeColor(c.default[Math.min(i, c.default.length - 1)] ?? "#888"),
          );
          uniforms[u] = { value: arr };
          uniforms[`${u}Count`] = { value: Math.min(c.default.length, n) };
        } else if (c.type === "select" || c.type === "segmented") {
          const idx = c.options.findIndex((o) => o.value === c.default);
          uniforms[u] = { value: Math.max(0, idx) };
        } else if (c.type === "toggle") {
          uniforms[u] = { value: c.default ? 1 : 0 };
        } else {
          uniforms[u] = { value: c.default };
        }
      }
    }

    // Index the controls by key so setParams knows each param's type.
    const controlByKey = new Map<string, ControlSpec>();
    for (const c of controls ?? []) {
      if (c.type !== "divider") controlByKey.set(c.key, c);
    }

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_FULLSCREEN,
      fragmentShader: combined,
      depthTest: false,
      depthWrite: false,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const quad = new THREE.Mesh(geometry, material);
    scene.add(quad);

    const handle: SceneHandle & { setMouse?: (x: number, y: number) => void } = {
      scene,
      camera,
      update: (elapsed) => {
        uniforms.uTime.value = elapsed;
      },
      resize: (w, h) => {
        (uniforms.uResolution.value as THREE.Vector2).set(w, h);
      },
      setPalette: (p: Palette) => {
        (uniforms.uPrimary.value as THREE.Color).set(p.primary);
        (uniforms.uSecondary.value as THREE.Color).set(p.secondary);
        (uniforms.uAccent.value as THREE.Color).set(p.accent);
        (uniforms.uBackground.value as THREE.Color).set(p.background);
      },
      setMouse: (x, y) => {
        (uniforms.uMouse.value as THREE.Vector2).set(x, y);
      },
      setParams: (params) => {
        for (const [key, raw] of Object.entries(params)) {
          const c = controlByKey.get(key);
          if (!c) continue;
          const u = paramUniformName(key);
          const uni = uniforms[u];
          if (!uni) continue;
          if (c.type === "color") {
            (uni.value as THREE.Color).set(String(raw));
          } else if (c.type === "colorList") {
            const list = Array.isArray(raw) ? (raw as string[]) : [];
            const arr = uni.value as THREE.Color[];
            for (let i = 0; i < arr.length; i++) {
              const v = list[Math.min(i, list.length - 1)];
              if (v) arr[i].set(v);
            }
            const countUni = uniforms[`${u}Count`];
            if (countUni) countUni.value = Math.min(list.length, arr.length);
          } else if (c.type === "select" || c.type === "segmented") {
            const idx = c.options.findIndex((o) => o.value === raw);
            uni.value = Math.max(0, idx);
          } else if (c.type === "toggle") {
            uni.value = raw ? 1 : 0;
          } else {
            uni.value = Number(raw);
          }
        }
      },
      dispose: () => {
        geometry.dispose();
        material.dispose();
      },
    };

    return handle;
  };
}

/** Public handle type — ThreeScene uses the optional `setMouse` for pointer tracking. */
export interface FragmentSceneHandle extends SceneHandle {
  setMouse?: (x: number, y: number) => void;
}
