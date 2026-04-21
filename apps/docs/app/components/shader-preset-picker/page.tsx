"use client";

import * as React from "react";
import { ShaderPresetPicker } from "@/components/ui/shader-preset-picker";
import { ThreeScene } from "@/components/ui/three-scene";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

const pickerProps = [
  { name: "value", type: "string", default: "-", description: "Currently selected preset id (controlled)." },
  { name: "onChange", type: "(id: string) => void", default: "-", description: "Called when the user clicks a preset card." },
  { name: "filterTags", type: "string[]", default: "-", description: "Only show presets that match at least one tag." },
  { name: "live", type: '"never" | "hover" | "always"', default: '"hover"', description: "Thumbnail render mode — see Shader Preset Preview." },
  { name: "postPreset", type: "string", default: "-", description: "Shared post-FX preset applied to every thumbnail." },
  { name: "palette", type: "Partial<Palette>", default: "-", description: "Shared palette applied to every thumbnail." },
  { name: "columns", type: "2 | 3 | 4", default: "3", description: "Grid columns at md+ breakpoint." },
];

export default function ShaderPresetPickerPage() {
  const [preset, setPreset] = React.useState<string>("space");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Shader Preset Picker</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Runtime gallery of shader presets — click to select. Powered by the
          same preset registry as <code>&lt;ThreeScene&gt;</code>.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Installation</h2>
        <div className="rounded-lg bg-muted border p-4 font-mono text-sm overflow-x-auto">
          <pre><code>{`import { ShaderPresetPicker } from "@gradeui/ui"`}</code></pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Picker + live preview</h2>
        <ComponentPreview
          code={`const [preset, setPreset] = useState("space");

<ShaderPresetPicker value={preset} onChange={setPreset} />
<ThreeScene preset={preset} postPreset="vhs" aspect="wide" />`}
        >
          <div className="flex flex-col gap-4 w-full">
            <ThreeScene
              preset={preset}
              postPreset="vhs"
              aspect="wide"
              radius="lg"
            />
            <ShaderPresetPicker
              value={preset}
              onChange={setPreset}
              live="hover"
              columns={3}
            />
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Filter by tag</h2>
        <p className="text-sm text-muted-foreground">
          Every preset declares semantic tags (<code>&quot;space&quot;</code>,{" "}
          <code>&quot;retro&quot;</code>, <code>&quot;motion&quot;</code>,{" "}
          <code>&quot;hero&quot;</code>, etc.) — filter to a subset for
          specialised pickers.
        </p>
        <ComponentPreview code={`<ShaderPresetPicker filterTags={["hero"]} />`}>
          <ShaderPresetPicker filterTags={["hero"]} columns={3} />
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Props</h2>
        <PropsTable props={pickerProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">TODO (phase 2)</h2>
        <p className="text-sm text-muted-foreground">
          A static docs-site catalogue page — the shadcn-blocks model, listing
          every preset with copy-paste code — is planned separately from this
          runtime picker.
        </p>
      </div>
    </div>
  );
}
