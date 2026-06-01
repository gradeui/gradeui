"use client";

import * as React from "react";

import {
  BackgroundFill,
} from "@/components/ui/background-fill";
import { FillPicker, type FillValue } from "@/components/ui/fill-picker";
import { THEME_REACTIVE_PALETTE } from "@/lib/three/theme-palette";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SidecarBlock } from "@/components/sidecar-block";
import { shaderPresetById } from "@/lib/three/shader-presets";

function fillSummary(v: FillValue): string {
  if (v.type === "none") return "No fill";
  if (v.type === "solid") return `Solid · ${v.color ?? "primary"}`;
  if (v.type === "gradient") return "Gradient";
  if (v.type === "image") return v.repeat ? "Pattern" : "Image";
  if (v.type === "video") return "Video";
  if (v.type === "shader")
    return `Shader · ${shaderPresetById[v.preset ?? ""]?.label ?? v.preset ?? "mesh"}`;
  return v.type;
}

export default function BackgroundFillPage() {
  const [fill, setFill] = React.useState<FillValue>({
    type: "shader",
    preset: "mesh",
    palette: THEME_REACTIVE_PALETTE,
    opacity: 0.35,
  });
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
          Background Fill
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          A frame&apos;s background is a <strong>fill</strong>, not a node you
          select — a shader, image, video, gradient, or solid token painted as
          a layer behind the frame&apos;s content. Pick the paint with{" "}
          <code>FillPicker</code>; render it with <code>BackgroundFill</code>.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <div className="rounded-lg bg-muted border p-4 font-mono text-sm overflow-x-auto">
          <pre><code>{`import { BackgroundFill, FillPicker } from "@gradeui/ui"`}</code></pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Live frame + paint picker
        </h2>

        {/* The frame: relative + overflow-hidden, fill behind, content above */}
        <div className="relative overflow-hidden rounded-xl border min-h-[300px]">
          <BackgroundFill
            type={fill.type}
            color={fill.color}
            gradient={fill.gradient}
            src={fill.src}
            fit={fill.fit}
            repeat={fill.repeat}
            tileSize={fill.tileSize}
            preset={fill.preset}
            palette={fill.palette}
            postPreset={fill.postPreset}
            opacity={fill.opacity}
          />
          <div className="relative z-10 p-10 flex flex-col items-start gap-3">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-background/70 px-3 py-1.5 text-sm font-medium backdrop-blur-md hover:bg-background/90"
                >
                  <span className="h-4 w-4 rounded-sm border border-border/60 bg-gradient-to-br from-primary to-accent" />
                  {fillSummary(fill)}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-3" align="start">
                <div className="mb-2 text-xs font-semibold">Fill</div>
                <FillPicker value={fill} onChange={setFill} />
              </PopoverContent>
            </Popover>

            <h3 className="text-3xl font-semibold tracking-tight">
              Build at the speed of thought
            </h3>
            <p className="max-w-md text-muted-foreground">
              The picker mirrors Figma&apos;s paint popover: choose the fill
              type from the icon row, then its controls appear below.
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          The solid + gradient tabs lead with theme-token swatches (Grade is
          token-led). A freeform custom-colour square and recent-colours strip
          are a later pass; gradient stop pickers reuse the same token swatches.
        </p>
      </div>

      <SidecarBlock slug="background-fill" />
    </div>
  );
}
