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
  PostPreset,
} from "@/lib/three/types";
import { createPostComposer } from "@/lib/three/post-composer";
import { sceneRegistry, shaderPresetById } from "@/lib/three/shader-presets";
import { postPresets, defaultPostPreset } from "@/lib/three/post-presets";
import {
  buildFragmentShaderScene,
  ShaderCompileError,
} from "@/lib/three/custom-fragment";

/**
 * Theme-friendly default palette — reads the BRAND POP slots
 * (`--brand-1..3`, vivid by construction) rather than primary/secondary,
 * which themes often deliberately mute. This is why an unconfigured shader
 * now pops AND tracks the project's brand: the pops are theme-derived (and
 * Branding-overridable, STUDIO-BRANDING.md). The hex fallbacks in the
 * var() cover the no-theme case. Consumers can still pass an explicit
 * `palette` per tile. */
const DEFAULT_PALETTE: Palette = {
  primary: "oklch(var(--brand-1, 0.62 0.20 20))",
  secondary: "oklch(var(--brand-2, 0.70 0.16 200))",
  accent: "oklch(var(--brand-3, 0.78 0.17 90))",
  background: "oklch(var(--background, 0.12 0.01 265))",
};

/**
 * Tone — pin the shader's canvas independently of the page theme.
 *
 * `"auto"` (default) follows `--background`, so a shader on a page
 * re-tints with light/dark mode. But a film frame or a hero with white
 * type wants a STABLE ground: in light mode `--background` is near-white
 * and every wash goes pastel under it. `tone="dark"` / `tone="light"`
 * pins just the background uniform (brand pops still flow through), and
 * an explicit `palette.background` always wins over both.
 */
export type SceneTone = "auto" | "dark" | "light";
const TONE_BACKGROUNDS: Record<Exclude<SceneTone, "auto">, string> = {
  dark: "oklch(0.13 0.015 265)",
  light: "oklch(0.97 0.005 265)",
};

// Shadcn / gradeui store their design tokens as bare channel triplets so the
// same custom property can be composed into `oklch()`, `hsl()`, or relative
// colour expressions at the use-site. But that means `var(--primary)` on its
// own expands to something like `"0.610 0.128 20"` which is NOT a valid CSS
// <color>, so the browser silently falls back to the inherited colour —
// usually black. We detect that pattern here and re-wrap before handing the
// value to the DOM probe.
const OKLCH_TRIPLET =
  /^[\d.]+\s+[\d.]+\s+[\d.]+(?:\s*\/\s*[\d.%]+)?$/; // "0.61 0.13 20" — no % signs
const HSL_TRIPLET =
  /^[\d.]+\s+[\d.]+%\s+[\d.]+%(?:\s*\/\s*[\d.%]+)?$/; // "20 90% 48%" — shadcn HSL
const VAR_REF = /^\s*var\(\s*(--[^,)\s]+)(?:\s*,[^)]*)?\s*\)\s*$/;

/**
 * Resolve any CSS-legal colour expression to a THREE-parseable string.
 *
 * Three-step resolution:
 *
 *   1. Design-token unwrap — if the input is a `var(--token)` reference,
 *      read the raw custom-property value off the host. If that value is a
 *      bare channel triplet (shadcn/gradeui convention), re-wrap it as
 *      `oklch(...)` / `hsl(...)` so the DOM probe gets a valid colour.
 *
 *   2. DOM probe — assign to a detached span's inline colour and read
 *      `getComputedStyle(probe).color`. Resolves remaining var() and
 *      validates syntax.
 *
 *   3. Canvas rasterisation — the computed form may be `oklch(...)`,
 *      `oklab(...)` or `color(srgb ...)`. `THREE.Color.setStyle()` only
 *      parses `rgb()`/`hsl()`/hex/named, so we paint the computed colour
 *      into a 1×1 canvas and read the rasterised sRGB bytes. Canvas is
 *      guaranteed to gamut-convert any CSS colour, so the round-trip
 *      always yields a THREE-parseable `rgb()`.
 */
function resolveCssColor(
  input: string,
  host: HTMLElement,
  fallback: string,
): string {
  if (typeof document === "undefined") return fallback;

  // Step 1: detect bare-triplet design tokens and re-wrap.
  let effectiveInput = input;
  const varRef = VAR_REF.exec(input);
  if (varRef) {
    const raw = getComputedStyle(host).getPropertyValue(varRef[1]).trim();
    if (raw) {
      if (OKLCH_TRIPLET.test(raw)) {
        effectiveInput = `oklch(${raw})`;
      } else if (HSL_TRIPLET.test(raw)) {
        effectiveInput = `hsl(${raw})`;
      }
    }
  }

  // Step 2: resolve remaining var() and validate via DOM probe.
  const probe = document.createElement("span");
  probe.style.color = "";
  probe.style.color = effectiveInput;
  if (probe.style.color === "") return fallback;
  probe.style.display = "none";
  host.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  host.removeChild(probe);
  if (!computed) return fallback;

  // Fast path: already in rgb()/rgba() form — skip canvas round-trip.
  if (computed.startsWith("rgb")) return computed;

  // Step 3: gamut-convert oklch()/oklab()/color(...) via canvas rasterisation.
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return computed;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = computed;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    // Bail gracefully — return whatever the DOM probe gave us and let
    // THREE.Color fall back to its own default on an unparseable input.
    return computed;
  }
}

function resolvePalette(palette: Palette, host: HTMLElement): Palette {
  return {
    primary: resolveCssColor(palette.primary, host, DEFAULT_PALETTE.primary),
    secondary: resolveCssColor(
      palette.secondary,
      host,
      DEFAULT_PALETTE.secondary,
    ),
    accent: resolveCssColor(palette.accent, host, DEFAULT_PALETTE.accent),
    background: resolveCssColor(
      palette.background,
      host,
      DEFAULT_PALETTE.background,
    ),
  };
}

export interface ThreeSceneProps
  extends Omit<BaseMediaProps, "src" | "poster">,
    Omit<React.HTMLAttributes<HTMLDivElement>, keyof BaseMediaProps> {
  /** Preset id from the shader preset registry. */
  preset?: string;
  /**
   * User-authored GLSL fragment shader body. Runs on a fullscreen quad with
   * a standardised uniform contract (uTime, uResolution, uMouse, uPrimary,
   * uSecondary, uAccent, uBackground + varying vUv). Header is auto-injected
   * — DO NOT redeclare the uniforms. Write `void main()` only.
   *
   * Precedence: `createScene` > `fragmentShader` > `preset`. On compile
   * failure the component falls back to `preset="space"` and fires
   * `onShaderError`.
   */
  fragmentShader?: string;
  /** Called when a supplied `fragmentShader` fails to compile. */
  onShaderError?: (error: ShaderCompileError) => void;
  /** Post-FX preset. Either a registry id (`"vhs"`) OR a full `PostPreset`
   *  object — pass an object (e.g. from `postStateToPreset`) to drive the
   *  stack live from a controls panel; changes are applied via the
   *  composer's `setPreset` WITHOUT remounting WebGL. Defaults to the
   *  base preset's `defaultPostPreset` or "vhs". */
  postPreset?: string | PostPreset;
  /** Palette overrides. Unset slots fall back to `DEFAULT_PALETTE`. */
  palette?: Partial<Palette>;
  /** Pin the canvas tone regardless of page theme (see `SceneTone`).
   *  An explicit `palette.background` wins over this. */
  tone?: SceneTone;
  /**
   * Custom scene factory. Takes precedence over `preset` and `fragmentShader`.
   * Use for bespoke three.js scenes that don't fit a preset or fullscreen quad.
   */
  createScene?: SceneFactory;
  /** Static poster to show while the GL context warms up. */
  poster?: string;
  /** Pixel-ratio cap. Defaults to `Math.min(window.devicePixelRatio, 2)`. */
  maxDpr?: number;
  /**
   * Controlled play/pause. When provided, pauses/resumes the render loop
   * WITHOUT remounting the WebGL context (unlike `autoPlay`, which only
   * sets the initial state and remounts on change). Use for "animate on
   * hover" thumbnails. Reduced-motion still forces paused.
   */
  play?: boolean;
  /**
   * Release the WebGL context entirely while the scene is scrolled out of
   * view (and rebuild it when it returns), instead of merely pausing the
   * render loop. A live `WebGLRenderer` holds a real GL context for its
   * whole lifetime, and browsers cap simultaneous contexts (~16 Chrome,
   * ~8 Safari) — so a gallery of many `ThreeScene`s blows the budget and
   * the browser silently evicts the OLDEST (those cards go blank with a
   * "Context Lost" log). Galleries / thumbnail grids should set this so
   * only the on-screen scenes hold a context; a global budget (below) caps
   * the live total. Default `false` — single hero shaders keep their context.
   */
  releaseOffscreen?: boolean;
}

// ── Global WebGL context budget ────────────────────────────────────────
// Browsers hard-cap the number of simultaneously-live WebGL contexts (~16
// Chrome, ~8 Safari) and, when exceeded, silently evict the OLDEST context
// (logging "THREE.WebGLRenderer: Context Lost") — which on a gallery page
// blanks whatever rendered first. A single page can stack several shader
// galleries whose on-screen cards together breach that cap (e.g. two preset
// pickers, each a full grid that fits in the viewport at once).
//
// So we run our own budget. Scenes with `releaseOffscreen` register when
// they enter the viewport; we grant a live context to the N most-recently-
// seen and deny the rest. Eviction is therefore deterministic — the least-
// recently-visible scene loses its context, never the card the user just
// scrolled to — and the live total never reaches the browser's hard limit,
// so the ungraceful browser-side eviction never fires. Kept comfortably
// under the Chrome cap to leave room for non-gallery scenes on the page.
const MAX_LIVE_CONTEXTS = 12;
type BudgetEntry = { touched: number; setGranted: (g: boolean) => void };
const budgetEntries = new Set<BudgetEntry>();
let budgetSeq = 0;
function enforceBudget() {
  const sorted = [...budgetEntries].sort((a, b) => b.touched - a.touched);
  sorted.forEach((e, i) => e.setGranted(i < MAX_LIVE_CONTEXTS));
}
function budgetAcquire(e: BudgetEntry) {
  e.touched = ++budgetSeq;
  budgetEntries.add(e);
  enforceBudget();
}
function budgetRelease(e: BudgetEntry) {
  if (budgetEntries.delete(e)) enforceBudget();
}

export const ThreeScene = React.forwardRef<HTMLDivElement, ThreeSceneProps>(
  (
    {
      preset,
      fragmentShader,
      onShaderError,
      postPreset,
      palette: paletteProp,
      tone = "auto",
      createScene: createSceneProp,
      controls = false,
      autoPlay = true,
      play,
      pauseOffscreen = true,
      releaseOffscreen = false,
      aspect = "video",
      radius = "lg",
      border = false,
      poster,
      label,
      className,
      style,
      maxDpr,
      ...rest
    },
    ref,
  ) => {
    const hostRef = React.useRef<HTMLDivElement | null>(null);
    const [playing, setPlaying] = React.useState(play ?? autoPlay);
    const [ready, setReady] = React.useState(false);
    const reduced = usePrefersReducedMotion();

    // Context-budget gate. When `releaseOffscreen` is on, the WebGL context
    // is only built while the host is on-screen AND granted by the global
    // budget (above). Scenes without `releaseOffscreen` are always in/granted.
    const [inView, setInView] = React.useState(!releaseOffscreen);
    const [granted, setGranted] = React.useState(!releaseOffscreen);
    const budgetRef = React.useRef<BudgetEntry | null>(null);
    React.useEffect(() => {
      if (!releaseOffscreen) {
        setGranted(true);
        return;
      }
      const entry: BudgetEntry = { touched: 0, setGranted };
      budgetRef.current = entry;
      return () => {
        budgetRelease(entry);
        budgetRef.current = null;
      };
    }, [releaseOffscreen]);
    // Acquire/release the budget slot as the scene enters/leaves the viewport.
    React.useEffect(() => {
      if (!releaseOffscreen) return;
      const entry = budgetRef.current;
      if (!entry) return;
      if (inView) budgetAcquire(entry);
      else budgetRelease(entry);
    }, [inView, releaseOffscreen]);

    React.useEffect(() => {
      if (!releaseOffscreen) {
        setInView(true);
        return;
      }
      const host = hostRef.current;
      if (!host) return;
      const io = new IntersectionObserver(
        ([entry]) => setInView(entry.isIntersecting),
        // No pre-warm margin: only scenes actually in the viewport hold a GL
        // context. A page can stack several galleries (e.g. two pickers), and
        // a pre-warm band lets the tail of one plus the head of the next both
        // stay live at the scroll boundary — enough to breach the browser's
        // simultaneous-context cap. Bounding the live set to what's truly
        // visible (plus the budget cap) keeps it under the cap everywhere.
        { rootMargin: "0px", threshold: 0 },
      );
      io.observe(host);
      return () => io.disconnect();
    }, [releaseOffscreen]);

    // Merge palette prop with defaults. Tone pins the background slot
    // unless the consumer set palette.background explicitly.
    const palette = React.useMemo<Palette>(() => {
      const merged = { ...DEFAULT_PALETTE, ...paletteProp };
      if (tone !== "auto" && !paletteProp?.background) {
        merged.background = TONE_BACKGROUNDS[tone];
      }
      return merged;
    }, [paletteProp, tone]);

    // Resolve scene factory.
    //   1. Explicit createScene wins (power-user escape hatch).
    //   2. fragmentShader — user wrote GLSL; build a fullscreen-quad scene.
    //      We wrap in an outer arrow so compile errors throw inside the effect
    //      and can be caught + surfaced, rather than bubbling out of useMemo.
    //   3. Preset id from the registry.
    const resolvedFactory: SceneFactory | null = React.useMemo(() => {
      if (createSceneProp) return createSceneProp;
      if (fragmentShader) return buildFragmentShaderScene(fragmentShader);
      if (preset && sceneRegistry[preset]) return sceneRegistry[preset];
      return null;
    }, [createSceneProp, fragmentShader, preset]);

    // Resolve the post-FX preset to a concrete PostPreset object. A
    // string is looked up in the registry; an object is used as-is (the
    // live-driven path). Falls back to the base preset's default, then
    // the global default.
    const resolvedPost = React.useMemo<PostPreset>(() => {
      if (postPreset && typeof postPreset === "object") return postPreset;
      const id =
        typeof postPreset === "string"
          ? postPreset
          : (preset ? shaderPresetById[preset]?.defaultPostPreset : undefined) ??
            defaultPostPreset;
      return postPresets[id] ?? postPresets[defaultPostPreset];
    }, [postPreset, preset]);

    // Ref mirror so the build effect reads the CURRENT post object for
    // its initial composer without depending on `resolvedPost` (which
    // would remount WebGL on every slider tweak). Ongoing changes flow
    // through the live effect below via the composer's `setPreset`.
    const resolvedPostRef = React.useRef(resolvedPost);
    resolvedPostRef.current = resolvedPost;

    // Palette identity guard — consumers (and especially model-generated
    // JSX) pass `palette={{ … }}` INLINE, a fresh object on every parent
    // render. With the raw object in the build effect's dep list, every
    // re-render of the host app remounted the ENTIRE WebGL pipeline
    // (renderer dispose + recreate = a visible black flash). A page with
    // a 3s setInterval flashed all of its shader fills every 3 seconds.
    // Key the effect on the palette's VALUE (serialized) and read the
    // live object through a ref; real palette changes still remount.
    // Same treatment for onShaderError — an inline callback identity
    // must not churn WebGL either.
    const paletteRef = React.useRef(palette);
    paletteRef.current = palette;
    const paletteSig = React.useMemo(
      () => JSON.stringify(palette ?? null),
      [palette],
    );
    const onShaderErrorRef = React.useRef(onShaderError);
    onShaderErrorRef.current = onShaderError;

    React.useEffect(() => {
      const host = hostRef.current;
      if (!host || !resolvedFactory) return;
      // Context budget: when releaseOffscreen is on, don't hold a GL context
      // while scrolled away or denied by the budget — the cleanup below
      // disposes it, and re-entering the viewport (and regaining a grant)
      // re-runs this effect to rebuild.
      if (releaseOffscreen && (!inView || !granted)) {
        setReady(false);
        return;
      }

      const width = host.clientWidth || 1;
      const height = host.clientHeight || 1;

      // Resolve palette CSS expressions (var(), oklch(), lab(), hex, rgb(),
      // named colours) into THREE-parseable rgb() strings via a DOM probe.
      // Done AFTER host is in the document so custom properties resolve.
      // Read via ref — the effect is keyed on paletteSig (value), not the
      // object identity. See the guard above the effect.
      const livePalette = resolvePalette(paletteRef.current, host);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
      const dpr = maxDpr ?? Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height);
      renderer.setClearColor(new THREE.Color(livePalette.background), 1);
      renderer.domElement.dataset.gdsPart = "shader-canvas";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";
      host.appendChild(renderer.domElement);

      // Instantiate the scene. A user-supplied fragment shader can fail to
      // compile here — we catch, fire onShaderError, and fall back to the
      // "space" preset so the surface is never left blank.
      let handle: SceneHandle;
      try {
        handle = resolvedFactory({
          renderer,
          width,
          height,
          palette: livePalette,
        });
      } catch (err) {
        if (err instanceof ShaderCompileError) {
          onShaderErrorRef.current?.(err);
          handle = sceneRegistry.space({
            renderer,
            width,
            height,
            palette: livePalette,
          });
        } else {
          // Unknown failure — tear down and re-throw so the app sees it.
          renderer.dispose();
          if (renderer.domElement.parentElement === host) {
            host.removeChild(renderer.domElement);
          }
          throw err;
        }
      }

      const postPresetObj = resolvedPostRef.current;

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
      let running = (play ?? autoPlay) && !reduced;
      let visible = true;

      const tick = () => {
        rafId = requestAnimationFrame(tick);
        if (!running || (pauseOffscreen && !visible)) return;
        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();
        handle.update?.(elapsed, delta);
        post.composer.render(delta);
      };
      // Always paint ONE frame, even when not auto-playing, so a paused
      // scene shows a static still (preset thumbnails rely on this) rather
      // than a blank surface. The raf loop only continues while `running`.
      handle.update?.(0, 0);
      post.composer.render(0);
      setReady(true);
      tick();

      // ResizeObserver for responsive canvas
      const ro = new ResizeObserver(([entry]) => {
        const w = Math.max(1, Math.floor(entry.contentRect.width));
        const h = Math.max(1, Math.floor(entry.contentRect.height));
        renderer.setSize(w, h);
        post.resize(w, h);
        handle.resize?.(w, h);
        // When PAUSED (thumbnail, autoPlay=false, or reduced-motion) the
        // raf loop isn't running, so the one-shot mount frame can land at
        // 0×0 before layout and stay blank. Re-paint the still frame on
        // every resize so a paused scene always shows correct content.
        if (!running) {
          handle.update?.(clock.getElapsedTime(), 0);
          post.composer.render(0);
        }
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

      // Theme-change observer — when a consumer flips the root class / data-theme
      // attr (GradeThemeProvider, dark-mode toggle, custom theme swap), re-resolve
      // any CSS-var-driven palette entries and push them into the live scene
      // without remounting WebGL.
      const themeObserver = new MutationObserver(() => {
        if (!hostRef.current) return;
        const next = resolvePalette(paletteRef.current, hostRef.current);
        renderer.setClearColor(new THREE.Color(next.background), 1);
        handle.setPalette?.(next);
      });
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: [
          "class",
          "style",
          "data-theme",
          "data-gds-theme",
          "data-grade-mode",
        ],
      });

      // Pointer tracking — only wired up if the scene exposes `setMouse`
      // (currently just fragment-shader scenes). Normalised to [0,1] with
      // y flipped so the coordinates match GLSL's origin-at-bottom-left.
      const sceneWithMouse = handle as SceneHandle & {
        setMouse?: (x: number, y: number) => void;
      };
      const onPointerMove = sceneWithMouse.setMouse
        ? (ev: PointerEvent) => {
            const rect = host.getBoundingClientRect();
            const x = (ev.clientX - rect.left) / rect.width;
            const y = 1 - (ev.clientY - rect.top) / rect.height;
            sceneWithMouse.setMouse!(x, y);
          }
        : null;
      if (onPointerMove) host.addEventListener("pointermove", onPointerMove);

      // Expose a live handle for the controls overlay + palette updates
      liveRef.current = {
        toggle: () => {
          running = !running;
          setPlaying(running);
        },
        setRunning: (next: boolean) => {
          // Pause/resume WITHOUT remounting (the raf loop stays alive and
          // just skips rendering while paused). Reduced-motion always wins.
          running = next && !reduced;
          setPlaying(running);
        },
        setPalette: (p: Palette) => {
          renderer.setClearColor(new THREE.Color(p.background), 1);
          handle.setPalette?.(p);
        },
        setPostPreset: (p: string | PostPreset) => {
          const next = typeof p === "string" ? postPresets[p] : p;
          if (next) post.setPreset(next);
        },
      };

      return () => {
        cancelAnimationFrame(rafId);
        ro.disconnect();
        io.disconnect();
        themeObserver.disconnect();
        if (onPointerMove) host.removeEventListener("pointermove", onPointerMove);
        post.dispose();
        handle.dispose?.();
        renderer.dispose();
        if (renderer.domElement.parentElement === host) {
          host.removeChild(renderer.domElement);
        }
        liveRef.current = null;
      };
      // Factory/palette-VALUE/post-preset changes remount the whole thing
      // (simpler than rebuilding in place, and real palette changes are
      // rare enough that it's fine). Identity-only churn must NOT remount
      // — see the paletteSig/onShaderErrorRef guard above the effect.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      resolvedFactory,
      paletteSig,
      autoPlay,
      reduced,
      pauseOffscreen,
      releaseOffscreen,
      inView,
      granted,
      maxDpr,
    ]);

    const liveRef = React.useRef<{
      toggle: () => void;
      setRunning: (next: boolean) => void;
      setPalette: (p: Palette) => void;
      setPostPreset: (p: string | PostPreset) => void;
    } | null>(null);

    // Live post-FX updates — push the resolved post object through the
    // composer's setPreset on change, no remount. No-op until the build
    // effect has wired liveRef.
    React.useEffect(() => {
      liveRef.current?.setPostPreset(resolvedPost);
    }, [resolvedPost]);

    // Controlled play/pause — pause/resume WITHOUT remounting (used by
    // preset thumbnails to animate on hover without a context churn). Only
    // active when `play` is explicitly controlled.
    React.useEffect(() => {
      if (play !== undefined) liveRef.current?.setRunning(play);
    }, [play]);

    const togglePlay = () => liveRef.current?.toggle();

    return (
      <MediaSurface
        {...rest}
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
            <Button iconOnly variant="secondary" onClick={togglePlay}>
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
