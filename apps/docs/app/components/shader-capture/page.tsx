"use client";

import { ShaderCapture } from "@/components/marketing/shader-capture";

export default function ShaderCapturePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
          Shader Capture
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Take a snapshot and watch the Grade effect layers treat it. The
          captured frame is an image base; gradient map, dots, and dither are
          composable layers on top.
        </p>
      </div>
      <ShaderCapture />
    </div>
  );
}
