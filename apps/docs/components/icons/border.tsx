import { createLucideIcon, type IconNode } from "lucide-react";

/**
 * Border family — two sub-families sharing one language:
 *
 * border-stroke-*: a closed square where the border side is SOLID
 * (with its two corners) and the other three sides are hinted with a
 * sparse dash + corner rhythm.
 *
 * border-radius-*: the corner alone — a big radius-12 sweep with short
 * straight arms (per-corner), or four radius-5 sweeps (all corners).
 */

// Dashed corner arcs (the `square-dashed` corner pieces).
const cTL: IconNode[number] = ["path", { d: "M5 3a2 2 0 0 0-2 2", key: "ctl" }];
const cTR: IconNode[number] = ["path", { d: "M19 3a2 2 0 0 1 2 2", key: "ctr" }];
const cBL: IconNode[number] = ["path", { d: "M5 21a2 2 0 0 1-2-2", key: "cbl" }];
const cBR: IconNode[number] = ["path", { d: "M21 19a2 2 0 0 1-2 2", key: "cbr" }];

export const BorderStrokeTop = createLucideIcon("BorderStrokeTop", [
  ["path", { d: "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2", key: "stroke" }],
  ["path", { d: "M3 12.25v1.5", key: "l" }],
  ["path", { d: "M21 12.25v1.5", key: "r" }],
  cBL,
  ["path", { d: "M10.75 21h2.5", key: "b" }],
  cBR,
]);

export const BorderStrokeBottom = createLucideIcon("BorderStrokeBottom", [
  ["path", { d: "M3 19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2", key: "stroke" }],
  ["path", { d: "M3 10.25v1.5", key: "l" }],
  ["path", { d: "M21 10.25v1.5", key: "r" }],
  cTL,
  ["path", { d: "M10.75 3h2.5", key: "t" }],
  cTR,
]);

export const BorderStrokeLeft = createLucideIcon("BorderStrokeLeft", [
  ["path", { d: "M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2", key: "stroke" }],
  ["path", { d: "M12.25 3h1.5", key: "t" }],
  ["path", { d: "M12.25 21h1.5", key: "b" }],
  cTR,
  ["path", { d: "M21 10.75v2.5", key: "r" }],
  cBR,
]);

export const BorderStrokeRight = createLucideIcon("BorderStrokeRight", [
  ["path", { d: "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2", key: "stroke" }],
  ["path", { d: "M10.25 3h1.5", key: "t" }],
  ["path", { d: "M10.25 21h1.5", key: "b" }],
  cTL,
  ["path", { d: "M3 10.75v2.5", key: "l" }],
  cBL,
]);

/** All four corners: radius-5 sweeps with short flat arms. */
export const BorderRadius = createLucideIcon("BorderRadius", [
  ["path", { d: "M3 9.5V8a5 5 0 0 1 5-5h1.5", key: "tl" }],
  ["path", { d: "M14.5 3H16a5 5 0 0 1 5 5v1.5", key: "tr" }],
  ["path", { d: "M21 14.5V16a5 5 0 0 1-5 5h-1.5", key: "br" }],
  ["path", { d: "M9.5 21H8a5 5 0 0 1-5-5v-1.5", key: "bl" }],
]);

/** Single corner: one radius-12 sweep with straight arms. */
export const BorderRadiusTopRight = createLucideIcon("BorderRadiusTopRight", [
  ["path", { d: "M21 19v-4A12 12 0 0 0 9 3H5", key: "sweep" }],
]);

export const BorderRadiusTopLeft = createLucideIcon("BorderRadiusTopLeft", [
  ["path", { d: "M3 19v-4A12 12 0 0 1 15 3h4", key: "sweep" }],
]);

export const BorderRadiusBottomRight = createLucideIcon(
  "BorderRadiusBottomRight",
  [["path", { d: "M21 5v4a12 12 0 0 1-12 12H5", key: "sweep" }]],
);

export const BorderRadiusBottomLeft = createLucideIcon(
  "BorderRadiusBottomLeft",
  [["path", { d: "M3 5v4a12 12 0 0 0 12 12h4", key: "sweep" }]],
);
