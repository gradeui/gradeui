/**
 * Schema sidecar for the qa-reviewer skill.
 */

import { z } from "zod";
import { rubricResultSchema } from "../../rubric";
import type { FormatInput, SkillSchemaModule } from "../../types";

export const inputSchema = z.object({
  /** Rendered HTML/JSX. */
  markup: z.string().min(1),
  /** Optional screenshot — useful for catching obvious image mismatches. */
  outputImage: z.string().url().optional(),
  /** Optional one-line description of what the page is *supposed* to be. */
  pageBrief: z.string().optional(),
  /** Pass bar 0-100. Defaults to 90 — QA has a high bar. */
  threshold: z.number().min(0).max(100).default(90),
});

export const outputSchema = rubricResultSchema;

export type QaReviewerInput = z.infer<typeof inputSchema>;
export type QaReviewerOutput = z.infer<typeof outputSchema>;

export const formatInput: FormatInput<QaReviewerInput> = (input) => {
  const text = [
    "QA review this page. Look for placeholder leftovers, dead links, content incoherence, formatting mistakes, and image issues.",
    "",
    `Threshold to pass: ${input.threshold}.`,
    input.pageBrief ? `\nPage brief: ${input.pageBrief}` : "",
    "",
    "Markup:",
    "```html",
    input.markup.slice(0, 16000),
    "```",
    input.outputImage ? "\nA screenshot of the rendered output follows." : "",
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

const moduleExport: SkillSchemaModule<QaReviewerInput, QaReviewerOutput> = {
  inputSchema,
  outputSchema,
  formatInput,
};

export default moduleExport;
