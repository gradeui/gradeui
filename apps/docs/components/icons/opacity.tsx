import { createLucideIcon, type IconNode } from "lucide-react";

/**
 * Opacity — the transparency checkerboard as a staggered dot dither
 * (5×5 grid, alternating cells), borderless. Dots use lucide's `h.01`
 * convention so round line caps render them.
 */

const POS = [3, 7.5, 12, 16.5, 21];

const dots: IconNode = [];
POS.forEach((x, i) =>
  POS.forEach((y, j) => {
    if ((i + j) % 2 === 0)
      dots.push(["path", { d: `M${x} ${y}h.01`, key: `d${i}${j}` }]);
  }),
);

export const Opacity = createLucideIcon("Opacity", dots);
