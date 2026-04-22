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
export function buildFragmentShaderScene(userFragment: string): SceneFactory {
  return ({ renderer, width, height, palette }) => {
    const combined = `${FRAGMENT_HEADER}\n${userFragment}`;

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
