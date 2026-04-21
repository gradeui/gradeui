"use client";

/**
 * VideoPlayer — native HTML5 video wrapped in a MediaSurface.
 *
 * Modes:
 *   controls={true}  (default) — shows native video controls
 *   controls={false}           — bare viewer: hides chrome, muted autoplay/loop
 */

import * as React from "react";
import {
  MediaSurface,
  type BaseMediaProps,
  usePrefersReducedMotion,
} from "./media-surface";
import { cn } from "@/lib/utils";

export interface VideoPlayerProps extends BaseMediaProps {
  /** Mute audio. Required `true` if `autoPlay` (browser restriction). */
  muted?: boolean;
  /** Playback rate. Defaults to 1. */
  playbackRate?: number;
  /** Object-fit. Defaults to "cover" — matches typical hero/background use. */
  objectFit?: "cover" | "contain" | "fill";
}

export const VideoPlayer = React.forwardRef<
  HTMLVideoElement,
  VideoPlayerProps
>(
  (
    {
      src,
      controls = true,
      autoPlay = false,
      loop = false,
      muted,
      pauseOffscreen = true,
      aspect = "video",
      radius = "lg",
      border = false,
      poster,
      label,
      className,
      style,
      playbackRate = 1,
      objectFit = "cover",
    },
    ref,
  ) => {
    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    const reduced = usePrefersReducedMotion();

    React.useImperativeHandle(ref, () => videoRef.current as HTMLVideoElement);

    // autoplay must be muted unless consumer explicitly opted out
    const effectiveMuted = muted ?? autoPlay;
    const effectiveAutoPlay = autoPlay && !reduced;

    React.useEffect(() => {
      if (videoRef.current) videoRef.current.playbackRate = playbackRate;
    }, [playbackRate]);

    const handleVisibilityChange = React.useCallback(
      (visible: boolean) => {
        if (!pauseOffscreen || !videoRef.current) return;
        if (visible && effectiveAutoPlay) {
          videoRef.current.play().catch(() => {
            // autoplay blocked — leave paused
          });
        } else {
          videoRef.current.pause();
        }
      },
      [pauseOffscreen, effectiveAutoPlay],
    );

    return (
      <MediaSurface
        aspect={aspect}
        radius={radius}
        border={border}
        aria-label={label}
        className={className}
        style={style}
        onVisibilityChange={pauseOffscreen ? handleVisibilityChange : undefined}
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          controls={controls}
          autoPlay={effectiveAutoPlay}
          loop={loop}
          muted={effectiveMuted}
          playsInline
          className={cn(
            "w-full h-full",
            objectFit === "cover" && "object-cover",
            objectFit === "contain" && "object-contain",
            objectFit === "fill" && "object-fill",
          )}
        >
          Your browser does not support the video tag.
        </video>
      </MediaSurface>
    );
  },
);
VideoPlayer.displayName = "VideoPlayer";
