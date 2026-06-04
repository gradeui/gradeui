import { createLucideIcon } from "lucide-react";

/**
 * Padding family — solid 18×18 container, solid inset marks showing
 * the space *inside* the wall. Mirrors the Figma masters 1:1.
 */

const box = { x: "3", y: "3", width: "18", height: "18", rx: "2", key: "box" };

export const Padding = createLucideIcon("Padding", [
  ["rect", box],
  ["rect", { x: "8", y: "8", width: "8", height: "8", rx: "2", key: "inner" }],
]);

export const PaddingTop = createLucideIcon("PaddingTop", [
  ["rect", box],
  ["path", { d: "M8 8h8", key: "t" }],
]);

export const PaddingBottom = createLucideIcon("PaddingBottom", [
  ["rect", box],
  ["path", { d: "M8 16h8", key: "b" }],
]);

export const PaddingLeft = createLucideIcon("PaddingLeft", [
  ["rect", box],
  ["path", { d: "M8 8v8", key: "l" }],
]);

export const PaddingRight = createLucideIcon("PaddingRight", [
  ["rect", box],
  ["path", { d: "M16 8v8", key: "r" }],
]);

export const PaddingVertical = createLucideIcon("PaddingVertical", [
  ["rect", box],
  ["path", { d: "M8 8h8", key: "t" }],
  ["path", { d: "M8 16h8", key: "b" }],
]);

export const PaddingHorizontal = createLucideIcon("PaddingHorizontal", [
  ["rect", box],
  ["path", { d: "M8 8v8", key: "l" }],
  ["path", { d: "M16 8v8", key: "r" }],
]);
