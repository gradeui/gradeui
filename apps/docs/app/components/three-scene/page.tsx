import { ThreeScene } from "@/components/ui/three-scene";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

const threeSceneProps = [
  { name: "preset", type: "string", default: "-", description: "Shader preset id from the registry (e.g. \"space\")." },
  { name: "postPreset", type: "string", default: "preset default or \"vhs\"", description: "Post-FX preset id: \"none\" | \"vhs\" | \"cinematic\" | \"synthwave\" | \"crt\"." },
  { name: "palette", type: "Partial<{ primary; secondary; accent; background }>", default: "-", description: "Palette overrides — unset slots fall back to default." },
  { name: "createScene", type: "(ctx) => SceneHandle", default: "-", description: "Custom scene factory. Takes precedence over preset." },
  { name: "controls", type: "boolean", default: "false", description: "Show a minimal play/pause overlay." },
  { name: "autoPlay", type: "boolean", default: "true", description: "Start the render loop on mount. Respects reduced-motion." },
  { name: "pauseOffscreen", type: "boolean", default: "true", description: "Stop rendering when offscreen — big win for WebGL battery life." },
  { name: "aspect", type: '"video" | "square" | "portrait" | "wide" | "auto"', default: '"video"', description: "Aspect ratio of the surface." },
  { name: "maxDpr", type: "number", default: "min(devicePixelRatio, 2)", description: "Pixel-ratio cap. Lower for thumbnails / low-end devices." },
];

export default function ThreeScenePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Three Scene</h1>
        <p className="text-lg text-muted-foreground mt-2">
          WebGL primitive for shader backgrounds, generative visuals, and custom
          three.js scenes. Preset-driven or bring-your-own-scene.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Installation</h2>
        <div className="rounded-lg bg-muted border p-4 font-mono text-sm overflow-x-auto">
          <pre><code>{`import { ThreeScene } from "@gradeui/ui"`}</code></pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Preset: space + VHS</h2>
        <ComponentPreview code={`<ThreeScene preset="space" postPreset="vhs" aspect="wide" />`}>
          <ThreeScene preset="space" postPreset="vhs" aspect="wide" radius="lg" />
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Hero background</h2>
        <p className="text-sm text-muted-foreground">
          Set as a chromeless background and compose foreground content on top.
          Pattern for the prompt &ldquo;hero header with a space themed shader behind it&rdquo;.
        </p>
        <ComponentPreview
          code={`<div className="relative overflow-hidden">
  <ThreeScene preset="space" postPreset="vhs" aspect="wide" className="absolute inset-0" />
  <div className="relative z-10 py-16 px-6 text-center text-white">
    <h1 className="text-5xl font-bold">Build at the speed of thought</h1>
  </div>
</div>`}
        >
          <div className="relative overflow-hidden rounded-lg">
            <ThreeScene
              preset="space"
              postPreset="vhs"
              aspect="wide"
              radius="none"
              className="absolute inset-0 w-full h-full"
            />
            <div className="relative z-10 py-16 px-6 text-center text-white">
              <h1 className="text-4xl md:text-5xl font-bold">Build at the speed of thought</h1>
              <p className="text-white/80 mt-4">A design system that cooperates with AI.</p>
            </div>
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Palette override</h2>
        <ComponentPreview
          code={`<ThreeScene
  preset="space"
  postPreset="cinematic"
  palette={{ primary: "#8b5cf6", accent: "#06b6d4", background: "#0a0a20" }}
/>`}
        >
          <ThreeScene
            preset="space"
            postPreset="cinematic"
            aspect="video"
            radius="lg"
            palette={{ primary: "#8b5cf6", accent: "#06b6d4", background: "#0a0a20" }}
          />
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Props</h2>
        <PropsTable props={threeSceneProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Currently available presets</h2>
        <p className="text-sm text-muted-foreground">
          Phase 1 ships with <code>&quot;space&quot;</code>. More presets (synthwave-terrain,
          voronoi, icosa, oscilloscope, retro-sunset) land in phase 2 — see the{" "}
          <a href="/components/shader-preset-picker" className="underline">
            preset picker
          </a>{" "}
          to browse what&apos;s live.
        </p>
      </div>
    </div>
  );
}
