/**
 * Schema sidecar for the a11y-reviewer skill.
 *
 * Output is a `RubricResult`. Input is the page markup plus an optional
 * screenshot (for the color/contrast dimension — text-only review can't catch
 * those). Setting `vision: true` in SKILL.md is reserved for skills that
 * *require* an image; this one is opportunistically vision-aware.
 */

import { z } from "zod";
import { rubricResultSchema } from "../../rubric";
import type { FormatInput, SkillSchemaModule } from "../../types";

export const inputSchema = z.object({
  /** The rendered or about-to-render markup. HTML or JSX, both accepted. */
  markup: z.string().min(1),
  /**
   * Optional screenshot. Required for accurate `color-and-contrast` scoring;
   * the skill should still run without it but flag contrast as un-graded.
   */
  outputImage: z.string().url().optional(),
  /** Pass bar 0-100. Defaults to 85 — accessibility has a higher bar than fidelity. */
  threshold: z.number().min(0).max(100).default(85),
  /**
   * Optional list of WCAG criteria to skip (e.g. ["2.4.7"] if focus styling
   * is intentionally custom-handled elsewhere). Use sparingly.
   */
  waivers: z.array(z.string()).optional(),
});

export const outputSchema = rubricResultSchema;

export type A11yReviewerInput = z.infer<typeof inputSchema>;
export type A11yReviewerOutput = z.infer<typeof outputSchema>;

export const formatInput: FormatInput<A11yReviewerInput> = (input) => {
  const text = [
    "Review this page for WCAG 2.2 AA compliance.",
    "",
    `Threshold to pass: ${input.threshold}.`,
    input.waivers?.length
      ? `\nWaived criteria (do not penalize): ${input.waivers.join(", ")}`
      : "",
    "",
    "Markup:",
    "```html",
    input.markup.slice(0, 16000),
    "```",
    input.outputImage
      ? "\nA screenshot of the rendered output follows — use it for color/contrast scoring."
      : "\nNo screenshot provided. Score `color-and-contrast` as 'un-graded' with score 70 and a polish-severity issue requesting a screenshot.",
  ]
    .filter(Boolean)
    .join("\n");

  if (input.outputImage) {
    return [
      { type: "text", text },
      { type: "image", image: input.outputImage },
    ];
  }
  return text;
};

const moduleExport: SkillSchemaModule<A11yReviewerInput, A11yReviewerOutput> = {
  inputSchema,
  outputSchema,
  formatInput,
};

export default moduleExport;
