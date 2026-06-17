"use client";

/**
 * ShaderCapture — the homepage "take a snapshot, watch it become a shader"
 * piece (the paper.design-style webcam interaction). It is also the clearest
 * proof of the composable layer model: the captured frame is just an IMAGE
 * BASE, and the Grade effect layers (gradient map, dots/halftone, dither)
 * post-process it exactly as they would a generative field.
 *
 * Pipeline: a fullscreen quad textured with the webcam video (or a fallback
 * test pattern when no camera) is rendered through an EffectComposer; the
 * selected layers are EffectPasses on top, toggled by zeroing their blend
 * opacity (so switching treatments never rebuilds the GL context).
 *
 * Verifiable without a camera: with no getUserMedia, a procedural test
 * pattern stands in, so the layers always have something to transform.
 */

import * as React from "react";
import * as THREE from "three";
import { Download } from "lucide-react";
import { EffectComposer, RenderPass, EffectPass } from "postprocessing";
import {
  effectLayerRegistry,
  orderedLayers,
  type LayerEffect,
} from "@/lib/three/effect-layers";
import type { Palette } from "@/lib/three/types";
import { ShaderControls } from "@/components/ui/shader-controls";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { defaultsOf, type DemoState } from "@/lib/three/schema";

// Vivid default palette for the treatments (the "asset accents"): bright,
// brand-adjacent, overridable later by the theme.
const PALETTE: Palette = {
  primary: "#6d5cff",
  secondary: "#22d3ee",
  accent: "#f0abfc",
  background: "#0b0b14",
};

// Which layers the capture offers, in pipeline order.
const LAYER_IDS = ["gradientMap", "dots", "dither"] as const;

function drawTestPattern(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // A soft radial face-ish blob over a gradient, so the layers have tonal
  // range to chew on when there is no camera.
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#2a2740");
  g.addColorStop(1, "#0c0c14");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const r = Math.min(w, h) * 0.32;
  const rg = ctx.createRadialGradient(w * 0.5, h * 0.45, r * 0.1, w * 0.5, h * 0.45, r);
  rg.addColorStop(0, "#f4eede");
  rg.addColorStop(0.6, "#b9a98f");
  rg.addColorStop(1, "rgba(120,110,95,0)");
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.45, r, 0, Math.PI * 2);
  ctx.fill();
}

export function ShaderCapture({
  title = "Shaders for design systems",
  caption = "Take a photo, watch Grade shade it live.",
}: { title?: string; caption?: string } = {}) {
  const mountRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const layerFxRef = React.useRef<Record<string, LayerEffect>>({});
  const [active, setActive] = React.useState<Record<string, boolean>>({
    gradientMap: false,
    dots: false,
    dither: true,
  });
  // Per-layer tweak state, seeded from each layer's contract defaults. Edits
  // flow straight into the live effect via setParams (no rebuild).
  const [layerState, setLayerState] = React.useState<Record<string, DemoState>>(
    () => {
      const o: Record<string, DemoState> = {};
      for (const def of orderedLayers([...LAYER_IDS])) {
        o[def.id] = defaultsOf(def.controls);
      }
      return o;
    },
  );
  const onParam = (
    layerId: string,
    key: string,
    value: number | string | boolean | string[],
  ) => {
    setLayerState((s) => ({ ...s, [layerId]: { ...s[layerId], [key]: value } }));
    layerFxRef.current[layerId]?.setParams({ [key]: value });
  };
  // Number readout format — percent kills the abstract 0.3753 values.
  const [numberFormat, setNumberFormat] = React.useState<"raw" | "percent">(
    "percent",
  );
  // idle = test pattern, camera not yet requested (no permission prompt on
  // load); live = webcam preview; captured = frozen still. The camera is
  // only requested when the user clicks, never before.
  const [phase, setPhase] = React.useState<"idle" | "live" | "captured">(
    "idle",
  );
  const requestCameraRef = React.useRef<(() => void) | null>(null);
  const captureFnRef = React.useRef<(() => void) | null>(null);
  const retakeFnRef = React.useRef<(() => void) | null>(null);
  const downloadRef = React.useRef<(() => void) | null>(null);

  // Keep the layer opacities in step with `active` without rebuilding.
  React.useEffect(() => {
    for (const id of LAYER_IDS) {
      const fx = layerFxRef.current[id];
      if (fx) fx.blendMode.opacity.value = active[id] ? 1 : 0;
    }
  }, [active]);

  React.useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;
    let raf = 0;

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      // Keep the drawing buffer so the composited result (layers baked in)
      // can be read to a PNG for download.
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    const size = () => ({
      w: mount.clientWidth || 1,
      h: mount.clientHeight || 1,
    });
    const { w, h } = size();
    renderer.setSize(w, h);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Fallback test-pattern texture (also the first frame before a camera
    // attaches, and the verification source when there is no camera).
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const cctx = canvas.getContext("2d")!;
    drawTestPattern(cctx, canvas.width, canvas.height);
    let texture: THREE.Texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.MeshBasicMaterial({ map: texture });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    // Build the layer effects once; toggle by opacity.
    const layerEffects: LayerEffect[] = orderedLayers([...LAYER_IDS]).map(
      (def) => {
        const fx = effectLayerRegistry[def.id].factory(PALETTE);
        fx.blendMode.opacity.value = active[def.id] ? 1 : 0;
        layerFxRef.current[def.id] = fx;
        return fx;
      },
    );

    const composer = new EffectComposer(renderer);
    composer.setSize(w, h);
    composer.addPass(new RenderPass(scene, camera));
    // All layers share one pass (none transform UV); order is pipeline order.
    composer.addPass(new EffectPass(camera, ...layerEffects));

    const ro = new ResizeObserver(() => {
      const { w, h } = size();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    });
    ro.observe(mount);

    // Pointer feeds the layers (some react to it).
    const onPointer = (e: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;
      for (const fx of layerEffects) fx.setMouse(x, y);
    };
    mount.addEventListener("pointermove", onPointer);

    const clock = new THREE.Clock();
    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (texture instanceof THREE.VideoTexture) texture.needsUpdate = true;
      composer.render(clock.getDelta());
    };
    frame();

    // The camera is requested ONLY when the user clicks (requestCameraRef),
    // never on mount — so no permission prompt appears unexpectedly. Until
    // then the test pattern stands in.
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    videoRef.current = video;

    const goLive = () => {
      const vt = new THREE.VideoTexture(video);
      vt.colorSpace = THREE.SRGBColorSpace;
      // Mirror for a selfie view.
      vt.wrapS = THREE.RepeatWrapping;
      vt.repeat.x = -1;
      vt.offset.x = 1;
      texture.dispose();
      texture = vt;
      material.map = vt;
      material.needsUpdate = true;
    };

    requestCameraRef.current = () => {
      // Already have a stream (e.g. retake after capture) — just go live.
      if (video.srcObject) {
        goLive();
        setPhase("live");
        return;
      }
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: "user" }, audio: false })
        .then((stream) => {
          if (disposed) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          video.srcObject = stream;
          void video.play();
          goLive();
          setPhase("live");
        })
        .catch(() => {
          /* denied — stay on the test pattern */
        });
    };

    // Freeze the current frame into a still on capture; restore live on retake.
    captureFnRef.current = () => {
      if (!(texture instanceof THREE.VideoTexture)) {
        setPhase("captured");
        return;
      }
      const still = document.createElement("canvas");
      still.width = video.videoWidth || 640;
      still.height = video.videoHeight || 480;
      const sctx = still.getContext("2d")!;
      // Mirror to match the preview.
      sctx.translate(still.width, 0);
      sctx.scale(-1, 1);
      sctx.drawImage(video, 0, 0, still.width, still.height);
      const ct = new THREE.CanvasTexture(still);
      ct.colorSpace = THREE.SRGBColorSpace;
      texture.dispose();
      texture = ct;
      material.map = ct;
      material.needsUpdate = true;
      setPhase("captured");
    };
    retakeFnRef.current = () => {
      goLive();
      setPhase("live");
    };
    // Read the composited canvas (layers baked in) to a PNG download.
    downloadRef.current = () => {
      try {
        const url = renderer.domElement.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = "grade-shader.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch {
        /* toDataURL can throw on a tainted canvas — no-op */
      }
    };

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      mount.removeEventListener("pointermove", onPointer);
      const stream = video.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
      composer.dispose();
      texture.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (id: string) =>
    setActive((a) => ({ ...a, [id]: !a[id] }));

  const activeDefs = orderedLayers([...LAYER_IDS]).filter((d) => active[d.id]);

  return (
    <div className="w-full overflow-hidden rounded-xl border bg-background">
      <div className="relative">
        <div ref={mountRef} className="aspect-[16/10] w-full" />

        {/* Capture ring / retake — sentence case, bold, with a blurred
            translucent fill so it stays legible over any shot. */}
        <button
          type="button"
          onClick={() => {
            if (phase === "idle") requestCameraRef.current?.();
            else if (phase === "live") captureFnRef.current?.();
            else retakeFnRef.current?.();
          }}
          className="group absolute right-8 top-1/2 flex h-40 w-40 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-white/10 text-sm font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:border-white/90 hover:bg-white/20"
          style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
        >
          <span className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
            {phase === "idle"
              ? "Click to capture"
              : phase === "live"
                ? "Capture"
                : "Retake"}
          </span>
        </button>

        {phase === "idle" && (
          <div className="absolute left-4 top-4 rounded-md bg-black/45 px-2 py-1 text-[11px] text-white/80 backdrop-blur-sm">
            Demo pattern · click to use your camera
          </div>
        )}

        {/* Download — only after a shot is taken; saves the composited PNG. */}
        {phase === "captured" && (
          <button
            type="button"
            onClick={() => downloadRef.current?.()}
            aria-label="Download image"
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white shadow-lg transition hover:border-white/90 hover:bg-white/20 [&_svg]:size-4"
            style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          >
            <Download />
          </button>
        )}

        {/* Lower third — caption / branding over the shot, with a scrim so
            it reads against any treatment. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-6 pt-20">
          <div className="max-w-md">
            <div className="text-2xl font-semibold leading-tight text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.65)]">
              {title}
            </div>
            <div className="mt-1 text-sm text-white/85 drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]">
              {caption}
            </div>
          </div>
        </div>
      </div>

      {/* Controls: layer toggles + live sliders for the active layers. */}
      <div className="space-y-4 border-t p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {orderedLayers([...LAYER_IDS]).map((def) => (
              <button
                key={def.id}
                type="button"
                onClick={() => toggle(def.id)}
                className={
                  "inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-medium transition " +
                  (active[def.id]
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/70")
                }
              >
                {def.label}
              </button>
            ))}
          </div>
          {/* Number format setting — raw values vs normalised percentages.
              Same DS segmented as the Shape control. */}
          <ToggleGroup
            type="single"
            variant="segmented"
            size="2xs"
            value={numberFormat}
            onValueChange={(v) => v && setNumberFormat(v as "raw" | "percent")}
          >
            <ToggleGroupItem value="percent" className="px-2.5 text-[11px] font-medium">
              %
            </ToggleGroupItem>
            <ToggleGroupItem value="raw" className="px-2.5 text-[11px] font-medium">
              0.0
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {activeDefs.length > 0 ? (
          <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
            {activeDefs.map((def) => (
              <div key={def.id} className="min-w-0">
                <div className="mb-1.5 text-[11px] font-semibold text-foreground/80">
                  {def.label}
                </div>
                <ShaderControls
                  controls={def.controls}
                  state={layerState[def.id]}
                  format={numberFormat}
                  onChange={(k, v) => onParam(def.id, k, v)}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Turn on a layer to tweak it.
          </p>
        )}
      </div>
    </div>
  );
}
