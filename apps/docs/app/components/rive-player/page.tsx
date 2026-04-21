import { RivePlayer } from "@/components/ui/rive-player";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

const riveProps = [
  { name: "src", type: "string", default: "-", description: "URL or path to the .riv file." },
  { name: "stateMachines", type: "string | string[]", default: "-", description: "State machine(s) to run." },
  { name: "artboard", type: "string", default: "-", description: "Artboard name — omit to use the default." },
  { name: "controls", type: "boolean", default: "false", description: "Show a minimal play/pause overlay." },
  { name: "autoPlay", type: "boolean", default: "true", description: "Autoplay on mount. Respects reduced-motion." },
  { name: "loop", type: "boolean", default: "true", description: "Loop animation on end." },
  { name: "pauseOffscreen", type: "boolean", default: "true", description: "Pause when the surface leaves the viewport." },
  { name: "fit", type: '"contain" | "cover" | "fill" | "fitWidth" | "fitHeight" | "none"', default: '"contain"', description: "How the artboard sits inside the surface." },
  { name: "stateMachineInputs", type: "Record<string, number | boolean | string>", default: "-", description: "Inputs passed to the state machine at mount." },
  { name: "aspect", type: '"video" | "square" | "portrait" | "wide" | "auto"', default: '"square"', description: "Aspect ratio of the surface." },
  { name: "poster", type: "string", default: "-", description: "Image shown while the runtime loads." },
];

const DEMO_RIV = "https://cdn.rive.app/animations/vehicles.riv";

export default function RivePlayerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Rive Player</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Rive runtime wrapped in the shared media surface. Controls-off by
          default (bare viewer); set <code>controls</code> for a play/pause overlay.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Installation</h2>
        <div className="rounded-lg bg-muted border p-4 font-mono text-sm overflow-x-auto">
          <pre><code>{`import { RivePlayer } from "@ramp-ds/ui"`}</code></pre>
        </div>
        <p className="text-sm text-muted-foreground">
          The Rive runtime (<code>@rive-app/react-canvas</code>) is an{" "}
          <strong>optional dependency</strong> — it&apos;s installed by default
          with pnpm/npm, but consumers who don&apos;t use Rive can{" "}
          <code>--no-optional</code> to skip it. RivePlayer lazy-imports the
          runtime; if missing at runtime, it renders a friendly error.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Viewer mode (default)</h2>
        <ComponentPreview code={`<RivePlayer src="/animation.riv" aspect="square" />`}>
          <RivePlayer src={DEMO_RIV} aspect="square" radius="lg" />
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Player mode</h2>
        <ComponentPreview code={`<RivePlayer src="/animation.riv" controls />`}>
          <RivePlayer src={DEMO_RIV} controls aspect="square" radius="lg" />
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Props</h2>
        <PropsTable props={riveProps} />
      </div>
    </div>
  );
}
