"use client";

/**
 * The capture stage (Ali, 12 Sep: "another page with a scaled iframe in
 * called capture, capture a 1920x1080 video with a 1280x900 page").
 *
 * A full-bleed canvas at whatever the recorder's viewport is, with the app
 * loaded in an iframe at a fixed logical size and scaled to fit. The video
 * is then 1080p with the product sitting on a coloured stage, and the page
 * inside never has to know it is being filmed.
 *
 *   /meta/capture?url=/locations/harbour-co-hove/reviews&w=1280&h=900
 *                &bg=green&pad=96&radius=20&caption=Hove%20vs%20Brighton
 *
 * Everything is a query param so a flow file can drive it. The recorder
 * clicks inside with a frame locator; localStorage seeding reaches the
 * iframe because it is the same origin.
 */

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Logo } from "@brightlocal/ui-components";

const STAGES: Record<string, { bg: string; ink: string }> = {
  neutral: { bg: "var(--ds-tailwind-colors-neutral-100)", ink: "var(--ds-tailwind-colors-neutral-950)" },
  green: { bg: "var(--ds-tailwind-colors-green-500)", ink: "var(--ds-tailwind-colors-neutral-950)" },
  sky: { bg: "var(--ds-tailwind-colors-sky-400)", ink: "var(--ds-tailwind-colors-neutral-950)" },
  violet: { bg: "var(--ds-tailwind-colors-violet-400)", ink: "var(--ds-tailwind-colors-neutral-950)" },
  yellow: { bg: "var(--ds-tailwind-colors-yellow-400)", ink: "var(--ds-tailwind-colors-neutral-950)" },
  black: { bg: "var(--ds-tailwind-colors-neutral-950)", ink: "var(--ds-tailwind-colors-base-white)" },
  white: { bg: "var(--ds-tailwind-colors-base-white)", ink: "var(--ds-tailwind-colors-neutral-950)" },
};

function CaptureStage() {
  const params = useSearchParams();
  const url = params.get("url") ?? "/locations/minus-one-studios/reviews";
  const w = Number(params.get("w") ?? 1280);
  const h = Number(params.get("h") ?? 900);
  const pad = Number(params.get("pad") ?? 88);
  const radius = Number(params.get("radius") ?? 20);
  const caption = params.get("caption");
  const stage = STAGES[params.get("bg") ?? "neutral"] ?? STAGES.neutral;
  const [scale, setScale] = React.useState(1);
  const [size, setSize] = React.useState<{ w: number; h: number } | null>(null);

  React.useEffect(() => {
    const fit = () => {
      const availW = window.innerWidth - pad * 2;
      const availH = window.innerHeight - pad * 2 - (caption ? 96 : 0);
      setScale(Math.min(availW / w, availH / h));
      setSize({ w: window.innerWidth, h: window.innerHeight });
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [w, h, pad, caption]);

  return (
    <main
      data-hook="capture-stage"
      data-ready={size ? "true" : "false"}
      className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden"
      style={{ background: stage.bg, color: stage.ink, gap: caption ? 40 : 0 }}
    >
      <div
        // The frame keeps the page's real pixel size and scales as a whole,
        // so type, spacing and the DS breakpoints are exactly what a user
        // at 1280 sees, not a squashed 1920 layout.
        style={{
          width: w,
          height: h,
          transform: `scale(${scale})`,
          transformOrigin: "center",
          borderRadius: radius / (scale || 1),
          overflow: "hidden",
          boxShadow: "0 40px 120px rgba(0,0,0,0.25)",
          background: "var(--ds-tailwind-colors-base-white)",
          flex: "0 0 auto",
        }}
      >
        <iframe
          data-hook="capture-frame"
          title="capture"
          src={url}
          width={w}
          height={h}
          style={{ border: 0, display: "block" }}
        />
      </div>
      {caption ? (
        <p data-hook="capture-caption" className="text-stage-caption max-w-[32ch] text-center text-balance">
          {caption}
        </p>
      ) : null}
      {/* The mono logotype, bottom left, so every frame is branded without
          competing with the product inside the frame. */}
      <Logo
        dataHook="stage-logo"
        data-ink={stage.ink === "var(--ds-tailwind-colors-base-white)" ? "white" : "black"}
        className="absolute bottom-10 left-12 h-9 w-auto"
      />
    </main>
  );
}

export default function CapturePage() {
  return (
    <React.Suspense fallback={null}>
      <CaptureStage />
    </React.Suspense>
  );
}
