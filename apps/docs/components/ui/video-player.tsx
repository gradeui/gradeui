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
    // Poster is rendered as a lazy-loaded <img> overlay rather than using the
    // native `poster` attribute, which fetches eagerly even when the video is
    // offscreen. We hide it once the video starts playing.
    const [posterVisible, setPosterVisible] = React.useState<boolean>(!!poster);

    React.useImperativeHandle(ref, () => videoRef.current as HTMLVideoElement);

    // autoplay must be muted unless consumer explicitly opted out
    const effectiveMuted = muted ?? autoPlay;
    const effectiveAutoPlay = autoPlay && !reduced;

    React.useEffect(() => {
      if (videoRef.current) videoRef.current.playbackRate = playbackRate;
    }, [playbackRate]);

    React.useEffect(() => {
      setPosterVisible(!!poster);
    }, [poster]);

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
          controls={controls}
          autoPlay={effectiveAutoPlay}
          loop={loop}
          muted={effectiveMuted}
          playsInline
          preload={effectiveAutoPlay ? "auto" : "metadata"}
          onPlaying={() => setPosterVisible(false)}
          className={cn(
            "w-full h-full",
            objectFit === "cover" && "object-cover",
            objectFit === "contain" && "object-contain",
            objectFit === "fill" && "object-fill",
          )}
        >
          Your browser does not support the video tag.
        </video>
        {poster && posterVisible && (
          // Always lazy-loaded — the native `poster` attribute fetches
          // eagerly, which undoes the rest of our offscreen-pause work.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            data-gds-part="video-poster"
            className={cn(
              "absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-200",
              objectFit === "cover" && "object-cover",
              objectFit === "contain" && "object-contain",
              objectFit === "fill" && "object-fill",
            )}
          />
        )}
      </MediaSurface>
    );
  },
);
VideoPlayer.displayName = "VideoPlayer";
