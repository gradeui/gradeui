import { ShaderPresetPreview } from "@/components/ui/shader-preset-preview";
import { SidecarBlock } from "@/components/sidecar-block";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

const previewProps = [
  { name: "preset", type: "string", default: "-", description: "Shader preset id from the registry." },
  { name: "live", type: '"never" | "hover" | "always"', default: '"hover"', description: "When to run the live render. \"hover\" is recommended for galleries." },
  { name: "postPreset", type: "string", default: "preset default", description: "Override the preset's default post-FX." },
  { name: "palette", type: "Partial<Palette>", default: "-", description: "Palette overrides for the preview." },
  { name: "aspect", type: '"video" | "square" | "portrait" | "wide"', default: '"video"', description: "Thumbnail aspect ratio." },
  { name: "hideLabel", type: "boolean", default: "false", description: "Hide the label strip under the preview." },
  { name: "onClick", type: "() => void", default: "-", description: "Callback when the card is clicked." },
];

export default function ShaderPresetPreviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Shader Preset Preview</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Thumbnail-sized preview card for a shader preset. Defaults to a static
          poster until hovered, at which point the live WebGL render kicks in.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Installation</h2>
        <div className="rounded-lg bg-muted border p-4 font-mono text-sm overflow-x-auto">
          <pre><code>{`import { ShaderPresetPreview } from "@gradeui/ui"`}</code></pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Hover-to-live (default)</h2>
        <p className="text-sm text-muted-foreground">
          Cheap at rest — a poster or gradient placeholder — spins up a WebGL
          canvas when hovered, tears it down when you leave.
        </p>
        <ComponentPreview code={`<ShaderPresetPreview preset="space" live="hover" />`}>
          <div className="max-w-xs">
            <ShaderPresetPreview preset="space" live="hover" />
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Always-live</h2>
        <p className="text-sm text-muted-foreground">
          Use sparingly — one live WebGL context per preview, and Safari caps
          concurrent contexts at ~8. For big grids, prefer{" "}
          <code>live=&quot;hover&quot;</code>.
        </p>
        <ComponentPreview code={`<ShaderPresetPreview preset="space" live="always" />`}>
          <div className="max-w-xs">
            <ShaderPresetPreview preset="space" live="always" />
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Props</h2>
        <PropsTable props={previewProps} />
      </div>
      <SidecarBlock slug="shader-preset-preview" />
    </div>
  );
}
