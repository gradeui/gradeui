/**
 * @gradeui/walker — public entry.
 *
 * Parses JSX/TSX source (or a runtime React tree, when walkElement lands)
 * into a Grade payload the code-to-figma Figma plugin can consume.
 */

export { walk, type WalkOptions, type RewriteRule } from "./walk";
export { toPayload, toPayloadString, type Payload, type PayloadNode, type PayloadFrame, type PayloadChild, type ToPayloadResult } from "./to-payload";
export { toJsx, type ToJsxOptions } from "./to-jsx";
export { useGradeSerialize, type UseGradeSerializeResult } from "./use-grade-serialize";
export { GradePayloadPanel, type GradePayloadPanelProps } from "./grade-payload-panel";
export { register, registerAll, isKnown, listKnown, clearRegistry } from "./registry";
export type {
  IRNode,
  IRFrame,
  IRExpression,
  IRChild,
  IRRoot,
  IRDiagnostic,
  PropValue,
} from "./ir";
