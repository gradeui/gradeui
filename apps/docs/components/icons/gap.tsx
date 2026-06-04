import { createLucideIcon } from "lucide-react";

/**
 * Gap family — two items with space between. `Gap` marks the space
 * itself with a solid divider; `GapColumn` / `GapRow` show the
 * orientation (columns side by side / rows stacked).
 */

export const Gap = createLucideIcon("Gap", [
  ["rect", { x: "3", y: "5", width: "6", height: "14", rx: "2", key: "a" }],
  ["rect", { x: "15", y: "5", width: "6", height: "14", rx: "2", key: "b" }],
  ["path", { d: "M12 7v10", key: "divider" }],
]);

export const GapColumn = createLucideIcon("GapColumn", [
  ["rect", { x: "3", y: "5", width: "7", height: "14", rx: "2", key: "a" }],
  ["rect", { x: "14", y: "5", width: "7", height: "14", rx: "2", key: "b" }],
]);

export const GapRow = createLucideIcon("GapRow", [
  ["rect", { x: "5", y: "3", width: "14", height: "7", rx: "2", key: "a" }],
  ["rect", { x: "5", y: "14", width: "14", height: "7", rx: "2", key: "b" }],
]);
