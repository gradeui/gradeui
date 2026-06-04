import { createLucideIcon } from "lucide-react";

/**
 * Position: absolute — a solid element straddling the corner of its
 * (smaller, dashed) containing block: anchored to the container edge,
 * free to escape it.
 */
export const PositionAbsolute = createLucideIcon("PositionAbsolute", [
  ["rect", { x: "3", y: "3", width: "8", height: "8", rx: "2", key: "el" }],
  ["path", { d: "M15 9h1", key: "t" }],
  ["path", { d: "M19 9a2 2 0 0 1 2 2", key: "tr" }],
  ["path", { d: "M21 14.5v1", key: "r" }],
  ["path", { d: "M21 19a2 2 0 0 1-2 2", key: "br" }],
  ["path", { d: "M14.5 21h1", key: "b" }],
  ["path", { d: "M11 21a2 2 0 0 1-2-2", key: "bl" }],
  ["path", { d: "M9 14.5v1", key: "l" }],
]);
