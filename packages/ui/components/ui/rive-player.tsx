"use client";

/**
 * RivePlayer — Rive runtime wrapped in a MediaSurface.
 *
 * The @rive-app/react-canvas dep is marked `optional` in package.json — this
 * component lazy-imports it so consumers who don't use Rive don't fail at
 * install time and don't pay the bundle cost unless they render one.
 *
 * Modes:
 *   controls={true}             — shows a small play/pause overlay
 *   controls={false} (default)  — bare viewer: zero chrome
 */

import * as React from "react";
import { Play, Pause } from "lucide-react";
import {
  MediaSurface,
  type BaseMediaProps,
  usePrefersReducedMotion,
} from "./media-surface";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface RivePlayerProps extends BaseMediaProps {
  /** State machine to run. */
  stateMachines?: string | string[];
  /** Artboard name — omit to use the default. */
  artboard?: string;
  /** Object-fit equivalent — how the art sits inside the surface. */
  fit?: "contain" | "cover" | "fill" | "fitWidth" | "fitHeight" | "none";
  /** Inputs to pass to the state machine. */
  stateMachineInputs?: Record<string, number | boolean | string>;
}

export const RivePlayer = React.forwardRef<HTMLDivElement, RivePlayerProps>(
  (
    {
      src,
      controls = false,
      autoPlay = true,
      loop = true,
      pauseOffscreen = true,
      aspect = "square",
      radius = "lg",
      border = false,
      poster,
      label,
      className,
      style,
      stateMachines,
      artboard,
      fit = "contain",
      stateMachineInputs,
    },
    ref,
  ) => {
    const reduced = usePrefersReducedMotion();
    const [Mod, setMod] = React.useState<
      typeof import("@rive-app/react-canvas") | null
    >(null);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
      let cancelled = false;
      import("@rive-app/react-canvas")
        .then((m) => {
          if (!cancelled) setMod(m);
        })
        .catch(() => {
          if (!cancelled)
            setError(
              "Rive runtime not installed. Run `npm install @rive-app/react-canvas`.",
            );
        });
      return () => {
        cancelled = true;
      };
    }, []);

    return (
      <MediaSurface
        ref={ref}
        aspect={aspect}
        radius={radius}
        border={border}
        aria-label={label}
        className={className}
        style={style}
      >
        {error ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-4 text-center">
            {error}
          </div>
        ) : Mod && src ? (
          <RiveInner
            Mod={Mod}
            src={src}
            stateMachines={stateMachines}
            artboard={artboard}
            fit={fit}
            stateMachineInputs={stateMachineInputs}
            autoPlay={autoPlay && !reduced}
            loop={loop}
            pauseOffscreen={pauseOffscreen}
            controls={controls}
            poster={poster}
          />
        ) : (
          poster && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={poster}
              alt=""
              className="w-full h-full object-contain"
            />
          )
        )}
      </MediaSurface>
    );
  },
);
RivePlayer.displayName = "RivePlayer";

interface InnerProps {
  Mod: typeof import("@rive-app/react-canvas");
  src: string;
  stateMachines?: string | string[];
  artboard?: string;
  fit: NonNullable<RivePlayerProps["fit"]>;
  stateMachineInputs?: Record<string, number | boolean | string>;
  autoPlay: boolean;
  loop: boolean;
  pauseOffscreen: boolean;
  controls: boolean;
  poster?: string;
}

function RiveInner({
  Mod,
  src,
  stateMachines,
  artboard,
  fit,
  autoPlay,
  loop,
  pauseOffscreen,
  controls,
  poster,
}: InnerProps) {
  const { useRive, Layout, Fit, Alignment, EventType } = Mod;

  const fitMap: Record<string, unknown> = {
    contain: Fit.Contain,
    cover: Fit.Cover,
    fill: Fit.Fill,
    fitWidth: Fit.FitWidth,
    fitHeight: Fit.FitHeight,
    none: Fit.None,
  };

  const { rive, RiveComponent } = useRive({
    src,
    stateMachines,
    artboard,
    autoplay: autoPlay,
    layout: new Layout({
      fit: fitMap[fit] as never,
      alignment: Alignment.Center,
    }),
  });

  const [playing, setPlaying] = React.useState(autoPlay);

  // The Rive instance has no `loop` setter — animations carry their loop mode
  // in the .riv file itself. To force-loop from a prop we listen for Stop and
  // replay. No-op if the file already loops (Stop never fires).
  React.useEffect(() => {
    if (!rive || !loop) return;
    const handler = () => {
      rive.play();
    };
    rive.on(EventType.Stop, handler);
    return () => {
      rive.off(EventType.Stop, handler);
    };
  }, [rive, loop, EventType]);

  // pause-when-offscreen
  React.useEffect(() => {
    if (!pauseOffscreen || !rive) return;
    const target = (rive as unknown as { canvas?: HTMLCanvasElement }).canvas;
    if (!target) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && autoPlay) rive.play();
        else rive.pause();
      },
      { threshold: 0.05 },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [rive, pauseOffscreen, autoPlay]);

  const togglePlay = () => {
    if (!rive) return;
    if (playing) {
      rive.pause();
      setPlaying(false);
    } else {
      rive.play();
      setPlaying(true);
    }
  };

  return (
    <>
      <RiveComponent className="w-full h-full" />
      {!rive && poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
      )}
      {controls && (
        <div
          className={cn(
            "absolute inset-0 flex items-end justify-end p-2",
            "opacity-0 hover:opacity-100 transition-opacity",
            "bg-gradient-to-t from-black/40 to-transparent",
          )}
        >
          <Button iconOnly variant="secondary" onClick={togglePlay}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </>
  );
}
