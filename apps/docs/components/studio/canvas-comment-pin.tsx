"use client";

/**
 * CanvasCommentPin — Figma-style anchored comment pin.
 *
 * Visual: a circular badge with the bottom-left corner squared off
 * (Figma teardrop pattern) so it reads as "I'm pointing at the
 * element below me". The pin's 28×28 rim is slightly larger than the
 * 24px Avatar that sits inside it, so the teardrop's pointer corner
 * stays visible behind the round avatar shape — that pointer is the
 * affordance that tells the eye which element the pin is anchored to.
 *
 * The pin renders an `Avatar` (image + initials fallback with a toned
 * background) for the thread's originator. When no author is wired,
 * it falls back to the legacy numeric `label` text so the pin still
 * renders meaningfully (e.g. tests, future label modes).
 *
 * Style is intentionally inline (no Tailwind utilities on the rim)
 * because pins are positioned with `position: fixed` against viewport
 * coords — they share a stylesheet with the host page but want to
 * compose cleanly even if rendered into a portal scope where the
 * chrome's CSS isn't available (e.g. across iframe realms in a
 * future Sandpack-mode adapter).
 */

import * as React from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  type AvatarTone,
} from "@gradeui/ui";

interface CanvasCommentPinProps {
  /** Top-left of the pin in viewport coords. The pin's own size
   *  is constant; the parent computes positions from the anchored
   *  element's rect. */
  top: number;
  left: number;
  /** Whether the pin is in the "active" state — usually means the
   *  matching thread is focused / open in the Comments tab.
   *  Drives a slightly enlarged + outlined treatment. */
  active?: boolean;
  /** Click handler. Wires to "scroll the matching thread into
   *  view" in the Comments tab (or open the inline panel later). */
  onClick: () => void;
  /** Display name of the thread originator. Used both for the
   *  Avatar's alt text and to compute initials when no avatar
   *  image is available. Preferred over `label`. */
  authorName?: string;
  /** Avatar image URL for the thread originator. Falls back to
   *  toned initials when missing. */
  avatarUrl?: string;
  /** Stable per-author tone for the AvatarFallback. Compute from
   *  the user id via `toneForUserId` so the same author always
   *  reads the same colour across surfaces. */
  avatarTone?: AvatarTone;
  /** Legacy text label (sequential number, single letter). Only
   *  used as a fallback when no `authorName` is provided. */
  label?: string;
}

const PIN_SIZE = 28; // px — 24px avatar + 4px teardrop pointer

export function CanvasCommentPin({
  top,
  left,
  active = false,
  onClick,
  authorName,
  avatarUrl,
  avatarTone,
  label,
}: CanvasCommentPinProps) {
  const initials = React.useMemo(() => {
    const source = authorName ?? label ?? "";
    const parts = source.trim().split(/\s+/).slice(0, 2);
    const joined = parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
    return joined || "?";
  }, [authorName, label]);

  const ariaLabel = authorName
    ? `Open comment thread by ${authorName}`
    : `Open comment thread ${label ?? ""}`.trim();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        position: "fixed",
        top,
        left,
        zIndex: 60,
        width: PIN_SIZE,
        height: PIN_SIZE,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        // Three rounded corners + a squared bottom-left, so the
        // "point" of the teardrop sits on the anchored element's
        // top-left corner. Mirrors Figma's comment pin shape.
        borderRadius: "9999px 9999px 9999px 0",
        // Focus-blue rim — stub colour; will swap to var(--selected)
        // in the same pass as the pin design refresh + cursor work.
        background: "#3b82f6",
        padding: 0,
        border: active ? "2px solid white" : "none",
        boxShadow: active
          ? "0 0 0 2px #3b82f6, 0 4px 12px rgba(59, 130, 246, 0.5)"
          : "0 2px 6px rgba(0, 0, 0, 0.25)",
        cursor: "pointer",
        transition:
          "transform 120ms ease-out, box-shadow 120ms ease-out",
        // Translate so the squared bottom-left corner sits on the
        // anchored point — i.e. the pin "hangs off" the element's
        // top-left corner, like Figma.
        transform: "translate(0, -100%)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform =
          "translate(0, -100%) scale(1.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translate(0, -100%)";
      }}
    >
      {authorName ? (
        <Avatar size="xs">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={authorName} />}
          <AvatarFallback tone={avatarTone} className="text-[10px]">
            {initials}
          </AvatarFallback>
        </Avatar>
      ) : (
        // Legacy numeric label — kept for back-compat / future
        // label modes. Rendered with the same typography as the
        // initials fallback so the two render paths feel related.
        <span
          style={{
            color: "white",
            fontSize: 11,
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          {label ?? "?"}
        </span>
      )}
    </button>
  );
}

export const CANVAS_COMMENT_PIN_SIZE = PIN_SIZE;
