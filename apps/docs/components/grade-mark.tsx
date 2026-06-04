import * as React from "react";

/**
 * GradeMark — the Grade "G" brand mark.
 *
 * Paints with `currentColor` so it inherits the surrounding text colour
 * (set `text-foreground` / `text-primary` on a parent or via className).
 * Size with className (`h-6 w-6`) — the viewBox keeps it square.
 *
 * Decorative by default (`aria-hidden`); pass a `label` when the mark
 * stands alone (e.g. as the only content of a home link).
 */
export function GradeMark({
  label,
  className,
  ...props
}: React.SVGProps<SVGSVGElement> & { label?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...(label
        ? { role: "img", "aria-label": label }
        : { "aria-hidden": true })}
      {...props}
    >
      <path
        d="M28 0L32 4V10L26 4H6L4 6V26L6 28H16L26 18V24L18 32H4L0 28V4L4 0H28ZM32 32H28V18H16V14H32V32Z"
        fill="currentColor"
      />
    </svg>
  );
}
