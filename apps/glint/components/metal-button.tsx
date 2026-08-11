"use client";

/**
 * The metal action button: Buy Gold, Buy Silver, the trade Confirm.
 *
 * One component owns the whole brand treatment — the 45deg polished
 * face, the near-black label, and the hover GLINT (a bright band that
 * sweeps across the metal and snaps back). Call sites pass a metal and
 * nothing else, so the surface can be retuned in one place and no
 * screen hand-rolls a gradient.
 *
 * The glint is a background layer driven by React hover state rather
 * than a :hover rule or a pseudo-element, because the identical
 * component has to work inside Studio, where screens can only ship
 * inline styles. Keep in sync with the Studio MetalButton.
 */

import * as React from "react";
import { Button } from "@gradeui/ui";
import { metalGlint } from "@/components/wordmark";

type ButtonProps = React.ComponentProps<typeof Button>;

export interface MetalButtonProps extends Omit<ButtonProps, "style"> {
  metal: "gold" | "silver";
}

export function MetalButton({
  metal,
  className,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: MetalButtonProps) {
  const [lit, setLit] = React.useState(false);
  return (
    <Button
      {...props}
      className={`rounded-full border ${className ?? ""}`.trim()}
      style={metalGlint(metal, lit)}
      /* Keyboard focus lights it too — the glint is the affordance. */
      onMouseEnter={(e) => {
        setLit(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setLit(false);
        onMouseLeave?.(e);
      }}
      onFocus={(e) => {
        setLit(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setLit(false);
        onBlur?.(e);
      }}
    />
  );
}
