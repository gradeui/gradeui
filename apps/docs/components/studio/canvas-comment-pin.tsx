"use client";

/**
 * CanvasCommentPin — Figma-style anchored comment pin.
 *
 * Visual: a small circle with the bottom-left corner squared off
 * (Figma teardrop pattern) so it reads as "I'm pointing at the
 * element below me". Focus-blue background, white numeral inside,
 * subtle drop shadow.
 *
 * Style is intentionally inline (no Tailwind utilities) because
 * pins are positioned with `position: fixed` against viewport
 * coords — they share a stylesheet with the host page but want
 * to compose cleanly even if rendered into a portal scope where
 * the chrome's CSS isn't available (e.g. across iframe realms in
 * a future Sandpack-mode adapter).
 *
 * Visual is deliberately stub-quality — the user flagged "use the
 * same color as the focus blue for now as a background. Will have
 * to design it eventually". Refine when the design intent is
 * settled; the shape is the key contract.
 */

import * as React from "react";

interface CanvasCommentPinProps {
  /** What to render inside the pin. v1 uses a sequential number;
   *  future: letter (A/B/C) or initials of the comment author. */
  label: string;
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
}

const PIN_SIZE = 24; // px

export function CanvasCommentPin({
  label,
  top,
  left,
  active = false,
  onClick,
}: CanvasCommentPinProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open comment thread ${label}`}
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
        background: "#3b82f6", // focus-blue stub; design pass later
        color: "white",
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1,
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
        transform: "translate(-50%, -100%)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform =
          "translate(-50%, -100%) scale(1.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translate(-50%, -100%)";
      }}
    >
      {label}
    </button>
  );
}

export const CANVAS_COMMENT_PIN_SIZE = PIN_SIZE;
