"use client";

/**
 * ThreeScene — the WebGL media primitive.
 *
 * Supports two modes:
 *   1. Preset mode:  <ThreeScene preset="space" postPreset="vhs" />
 *   2. Custom mode:  <ThreeScene createScene={({ renderer, width, height, palette }) => ({ scene, camera, update, dispose })} />
 *
 * Post-FX composer is always applied; use postPreset="none" for a clean render.
 *
 * Zero-chrome viewer mode: the default. Pass `controls` to show a minimal
 * play/pause overlay. Scene pauses when offscreen (pauseOffscreen default `true`).
 */

import * as React from "react";
import * as THREE from "three";
import { Play, Pause } from "lucide-react";
import {
  MediaSurface,
  type BaseMediaProps,
  usePrefersReducedMotion,
} from "./media-surface";
import { Button } from "./button";
import { cn } from "@/lib/utils";

import type {
  SceneFactory,
  SceneHandle,
  Palette,
} from "@/lib/three/types";
import { createPostComposer } from "@/lib/three/post-composer";
import { sceneRegistry, shaderPresetById } from "@/lib/three/shader-presets";
import { postPresets, defaultPostPreset } from "@/lib/three/post-presets";

/** Theme-friendly default palette. Consumers override per-tile if they want. */
const DEFAULT_PALETTE: Palette = {
  primary: "#ff5fb9",
  secondary: "#9fe8ff",
  accent: "#ffc857",
  background: "#0a0a14",
};

export interface ThreeSceneProps
  extends Omit<BaseMediaProps, "src" | "poster"> {
  /** Preset id from the shader preset registry. */
  preset?: string;
  /** Post-FX preset id. Defaults to the preset's `defaultPostPreset` or "vhs". */
  postPreset?: string;
  /** Palette overrides. Unset slots fall back to `DEFAULT_PALETTE`. */
  palette?: Partial<Palette>;
  /**
   * Custom scene factory. Takes precedence over `preset`.
   * Use for bespoke three.js scenes that don't fit a preset.
   */
  createScene?: SceneFactory;
  /** Static poster to show while the GL context warms up. */
  poster?: string;
  /** Pixel-ratio cap. Defaults to `Math.min(window.devicePixelRatio, 2)`. */
  maxDpr?: number;
}

export const ThreeScene = React.forwardRef<HTMLDivElement, ThreeSceneProps>(
  (
    {
      preset,
      postPreset,
      palette: paletteProp,
      createScene: createSceneProp,
      controls = false,
      autoPlay = true,
      pauseOffscreen = true,
      aspect = "video",
      radius = "lg",
      border = false,
      poster,
      label,
      className,
      style,
      maxDpr,
    },
    ref,
  ) => {
    const hostRef = React.useRef<HTMLDivElement | null>(null);
    const [playing, setPlaying] = React.useState(autoPlay);
    const [ready, setReady] = React.useState(false);
    const reduced = usePrefersReducedMotion();

    // Merge palette prop with defaults
    const palette = React.useMemo<Palette>(
      () => ({ ...DEFAULT_PALETTE, ...paletteProp }),
      [paletteProp],
    );

    // Resolve scene factory: explicit createScene wins, otherwise look up preset.
    const resolvedFactory: SceneFactory | null = React.useMemo(() => {
      if (createSceneProp) return createSceneProp;
      if (preset && sceneRegistry[preset]) return sceneRegistry[preset];
      return null;
    }, [createSceneProp, preset]);

    // Resolve post preset id
    const resolvedPostPresetId = React.useMemo(() => {
      if (postPreset) return postPreset;
      if (preset) {
        const p = shaderPresetById[preset];
        if (p?.defaultPostPreset) return p.defaultPostPreset;
      }
      return defaultPostPreset;
    }, [postPreset, preset]);

    React.useEffect(() => {
      const host = hostRef.current;
      if (!host || !resolvedFactory) return;

      const width = host.clientWidth || 1;
      const height = host.clientHeight || 1;

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
      const dpr = maxDpr ?? Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height);
      renderer.setClearColor(new THREE.Color(palette.background), 1);
      renderer.domElement.dataset.gdsPart = "shader-canvas";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";
      host.appendChild(renderer.domElement);

      const handle: SceneHandle = resolvedFactory({
        renderer,
        width,
        height,
        palette,
      });

      const postPresetObj =
        postPresets[resolvedPostPresetId] ?? postPresets[defaultPostPreset];

      const post = createPostComposer({
        renderer,
        scene: handle.scene,
        camera: handle.camera,
        preset: postPresetObj,
        width,
        height,
      });

      const clock = new THREE.Clock();
      let rafId = 0;
      let running = autoPlay && !reduced;
      let visible = true;

      const tick = () => {
        rafId = requestAnimationFrame(tick);
        if (!running || (pauseOffscreen && !visible)) return;
        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();
        handle.update?.(elapsed, delta);
        post.composer.render(delta);
      };
      tick();
      if (running) setReady(true);

      // ResizeObserver for responsive canvas
      const ro = new ResizeObserver(([entry]) => {
        const w = Math.max(1, Math.floor(entry.contentRect.width));
        const h = Math.max(1, Math.floor(entry.contentRect.height));
        renderer.setSize(w, h);
        post.resize(w, h);
        handle.resize?.(w, h);
      });
      ro.observe(host);

      // Visibility — intersection observer
      const io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
        },
        { threshold: 0.05 },
      );
      io.observe(host);

      // Expose a live handle for the controls overlay + palette updates
      liveRef.current = {
        toggle: () => {
          running = !running;
          setPlaying(running);
        },
        setPalette: (p: Palette) => {
          renderer.setClearColor(new THREE.Color(p.background), 1);
          handle.setPalette?.(p);
        },
        setPostPreset: (id: string) => {
          const next = postPresets[id];
          if (next) post.setPreset(next);
        },
      };

      return () => {
        cancelAnimationFrame(rafId);
        ro.disconnect();
        io.disconnect();
        post.dispose();
        handle.dispose?.();
        renderer.dispose();
        if (renderer.domElement.parentElement === host) {
          host.removeChild(renderer.domElement);
        }
        liveRef.current = null;
      };
      // Factory/palette/post-preset changes remount the whole thing (simpler than
      // rebuilding in place, and palette changes are rare enough that it's fine).
    }, [
      resolvedFactory,
      resolvedPostPresetId,
      palette,
      autoPlay,
      reduced,
      pauseOffscreen,
      maxDpr,
    ]);

    const liveRef = React.useRef<{
      toggle: () => void;
      setPalette: (p: Palette) => void;
      setPostPreset: (id: string) => void;
    } | null>(null);

    const togglePlay = () => liveRef.current?.toggle();

    return (
      <MediaSurface
        ref={(node) => {
          hostRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        aspect={aspect}
        radius={radius}
        border={border}
        aria-label={label}
        className={className}
        style={style}
        data-gds-part="three-scene"
      >
        {!ready && poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            data-gds-part="scene-poster"
          />
        )}
        {controls && (
          <div
            data-gds-part="scene-controls"
            className={cn(
              "absolute inset-0 flex items-end justify-end p-2",
              "opacity-0 hover:opacity-100 transition-opacity",
              "bg-gradient-to-t from-black/30 to-transparent",
            )}
          >
            <Button size="icon" variant="secondary" onClick={togglePlay}>
              {playing ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </MediaSurface>
    );
  },
);
ThreeScene.displayName = "ThreeScene";
