/**
 * @gradeui/studio/core — the transport-agnostic contract core.
 *
 * "The contract lives once." Everything else is transport. This subtree
 * owns the two pure functions the MCP server adapter and the product
 * runtime both wrap:
 *
 *   createScreenContext(brief, options) -> { system, refs }
 *     Injects the vocabulary + contract per request — the payload a model
 *     is handed.
 *
 *   validateAgainstContract(output, { contracts }) -> ViolationReport
 *     Walks emitted JSX against the contract registry — the structured
 *     violation report that seeds the token-free eval ladder.
 *
 * Kept on its own subpath (not the playbook barrel) so importing the
 * playbook stays free of the validator's `typescript` + `zod` runtime
 * deps. See grade-local-testing-and-eval.md for the architecture.
 */

export {
  createScreenContext,
  renderSelectionBlock,
  type ScreenContext,
  type ScreenContextOptions,
  type ScreenSelection,
} from "./screen-context";

export {
  readProjectRules,
  projectSteeringBlock,
  buildProjectSystemPrompt,
  type ProjectRules,
  type ProjectRuleFile,
  type ProjectSteering,
} from "./project-rules";

export {
  validateAgainstContract,
  validateJsx,
  formatViolations,
  extractFencedJsxBlock,
  type ViolationReport,
  type ValidationResult,
  type ValidationViolation,
  type ValidateOptions,
  type ViolationKind,
  type Severity,
} from "./validation";
