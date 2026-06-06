/**
 * QA pass — validate model-emitted JSX against the live component contracts.
 *
 * The implementation moved to the shared core (`@gradeui/studio/core`) so
 * the docs product runtime and the MCP server adapter validate against ONE
 * walker — "the contract lives once" (grade-local-testing-and-eval.md).
 * This file is now a thin re-export to keep existing import paths
 * (`@/lib/qa/validate-jsx`) working unchanged.
 *
 * `validateJsx` is the historical name and stays exported; `validateAgainstContract`
 * is the same function under the doc's vocabulary.
 */

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
} from "@gradeui/studio/core";
