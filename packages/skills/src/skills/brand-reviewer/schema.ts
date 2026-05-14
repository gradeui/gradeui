/**
 * Schema sidecar for the brand-reviewer skill.
 */

import { z } from "zod";
import { rubricResultSchema } from "../../rubric";
import type { FormatInput, SkillSchemaModule } from "../../types";

export const inputSchema = z.object({
  /** Rendered HTML/JSX of the page being reviewed. */
  markup: z.string().min(1),
  /** Screenshot of the rendered output. */
  outputImage: z.string().url(),
  /**
   * The project's design.md content. Authoritative — every brand judgement is
   * grounded against this. If empty/missing, scores cap at 80 with a polish
   * issue requesting clearer guidance.
   */
  designMd: z.string(),
  /** Pass bar 0-100. Defaults to 80. */
  threshold: z.number().min(0).max(100).default(80),
});

export const outputSchema = rubricResultSchema;

export type BrandReviewerInput = z.infer<typeof inputSchema>;
export type BrandReviewerOutput = z.infer<typeof outputSchema>;

export const formatInput: FormatInput<BrandReviewerInput> = (input) => {
  const text = [
    "Review this page for brand consistency.",
    "",
    `Threshold to pass: ${input.threshold}.`,
    "",
    "design.md (authoritative brand guidance):",
    "```markdown",
    input.designMd.slice(0, 12000) || "(empty — score caps at 80)",
    "```",
    "",
    "Page markup:",
    "```html",
    input.markup.slice(0, 8000),
    "```",
    "",
    "A screenshot of the rendered output follows.",
  ].join("\n");

  return [
    { type: "text", text },
    { type: "image", image: input.outputImage },
  ];
};

const moduleExport: SkillSchemaModule<BrandReviewerInput, BrandReviewerOutput> = {
  inputSchema,
  outputSchema,
  formatInput,
};

export default moduleExport;
