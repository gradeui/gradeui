"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * BlinkingCursor — the shared caret used by every scripted-demo
 * surface in gradeui. Styled via CSS variables so each host (Code's
 * terminal, Composer's inline caret, future surfaces) can tweak
 * dimensions and colour without forking the component.
 *
 * Tokens read from the cascade:
 *   --gds-demo-cursor-color   defaults to currentColor
 *   --gds-demo-cursor-width   defaults to 0.55ch (a hair narrower than
 *                             a monospace char so it reads as a caret
 *                             rather than a block)
 *   --gds-demo-cursor-height  defaults to 1.1em
 *
 * The animation lives in `styles/globals.css` as `.gds-demo-cursor`
 * (alongside the other demo primitives). Keeping it in CSS rather
 * than motion / framer keeps the cursor available in environments
 * that disable JS animation but still render the page.
 */

export interface BlinkingCursorProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /**
   * Visual variant. `inline` (default) is for caret-in-text demos
   * (Code, Composer). `block` is for terminal-style square cursors
   * that fill a character cell.
   */
  variant?: "inline" | "block";
}

export const BlinkingCursor = React.forwardRef<
  HTMLSpanElement,
  BlinkingCursorProps
>(function BlinkingCursor({ variant = "inline", className, ...rest }, ref) {
  return (
    <span
      ref={ref}
      data-gds-part="demo-cursor"
      data-gds-variant={variant}
      aria-hidden
      className={cn("gds-demo-cursor", className)}
      {...rest}
    />
  );
});
