import { createLucideIcon, type IconNode } from "lucide-react";

/**
 * Margin family — constant solid 10×10 element, dashed marks at the
 * frame edge showing the space *outside* the container. Mirrors the
 * Figma masters 1:1 (dashes are real geometry, not dash patterns, so
 * they scale exactly like the masters).
 */

const box: IconNode[number] = [
  "rect",
  { x: "7", y: "7", width: "10", height: "10", rx: "2", key: "box" },
];

/** Dashed full square (the `square-dashed` rhythm from lucide). */
const dashedSquare: IconNode = [
  ["path", { d: "M5 3a2 2 0 0 0-2 2", key: "tl" }],
  ["path", { d: "M9 3h1", key: "t1" }],
  ["path", { d: "M14 3h1", key: "t2" }],
  ["path", { d: "M19 3a2 2 0 0 1 2 2", key: "tr" }],
  ["path", { d: "M21 9v1", key: "r1" }],
  ["path", { d: "M21 14v1", key: "r2" }],
  ["path", { d: "M21 19a2 2 0 0 1-2 2", key: "br" }],
  ["path", { d: "M14 21h1", key: "b1" }],
  ["path", { d: "M9 21h1", key: "b2" }],
  ["path", { d: "M5 21a2 2 0 0 1-2-2", key: "bl" }],
  ["path", { d: "M3 14v1", key: "l1" }],
  ["path", { d: "M3 9v1", key: "l2" }],
];

const hDash = (y: number, key: string): IconNode => [
  ["path", { d: `M3 ${y}h3.5`, key: `${key}1` }],
  ["path", { d: `M10.25 ${y}h3.5`, key: `${key}2` }],
  ["path", { d: `M17.5 ${y}h3.5`, key: `${key}3` }],
];

const vDash = (x: number, key: string): IconNode => [
  ["path", { d: `M${x} 3v3.5`, key: `${key}1` }],
  ["path", { d: `M${x} 10.25v3.5`, key: `${key}2` }],
  ["path", { d: `M${x} 17.5v3.5`, key: `${key}3` }],
];

export const Margin = createLucideIcon("Margin", [...dashedSquare, box]);

export const MarginTop = createLucideIcon("MarginTop", [...hDash(3, "t"), box]);

export const MarginBottom = createLucideIcon("MarginBottom", [
  box,
  ...hDash(21, "b"),
]);

export const MarginLeft = createLucideIcon("MarginLeft", [
  ...vDash(3, "l"),
  box,
]);

export const MarginRight = createLucideIcon("MarginRight", [
  box,
  ...vDash(21, "r"),
]);

export const MarginVertical = createLucideIcon("MarginVertical", [
  ...hDash(3, "t"),
  box,
  ...hDash(21, "b"),
]);

export const MarginHorizontal = createLucideIcon("MarginHorizontal", [
  ...vDash(3, "l"),
  box,
  ...vDash(21, "r"),
]);
