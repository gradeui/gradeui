/**
 * Schema sidecar for the fidelity-grader skill.
 *
 * Output is a `RubricResult` — the shared review-skill shape from
 * ../../rubric.ts. Input is the pair of images plus optional context.
 */

import { z } from "zod";
import { rubricResultSchema } from "../../rubric";
import type { FormatInput, SkillSchemaModule } from "../../types";

export const inputSchema = z.object({
  /** What the page is *supposed* to look like — designer comp, mockup, prior screenshot. */
  referenceImage: z
    .string()
    .url()
    .describe("Public URL of the reference image"),
  /** Optional brief that accompanied the reference (e.g. the original chat prompt). */
  referenceDescription: z.string().optional(),
  /** Public URL of the rendered output (Playwright screenshot, etc.). */
  outputImage: z.string().url(),
  /** Optional markup snippet so the grader can attach selectors to issues. */
  outputMarkup: z.string().optional(),
  /** Pass bar 0-100. Defaults to 80. */
  threshold: z.number().min(0).max(100).default(80),
  /** Imagery / brand sections of design.md. Used for the `brand-consistency` dimension. */
  designGuidance: z.string().optional(),
});

export const outputSchema = rubricResultSchema;

export type FidelityGraderInput = z.infer<typeof inputSchema>;
export type FidelityGraderOutput = z.infer<typeof outputSchema>;

export const formatInput: FormatInput<FidelityGraderInput> = (input) => {
  const text = [
    `Grade the fidelity of the OUTPUT image against the REFERENCE image.`,
    "",
    `Threshold to pass: ${input.threshold}.`,
    input.referenceDescription
      ? `\nReference brief:\n${input.referenceDescription}`
      : "",
    input.designGuidance
      ? `\nBrand voice / imagery guidance:\n${input.designGuidance}`
      : "",
    input.outputMarkup
      ? `\nOutput markup snippet (use for selectors when you can):\n\`\`\`html\n${input.outputMarkup.slice(0, 4000)}\n\`\`\``
      : "",
    "",
    "Image 1 below is the REFERENCE.",
    "Image 2 below is the OUTPUT.",
  ]
    .filter(Boolean)
    .join("\n");

  return [
    { type: "text", text },
    { type: "image", image: input.referenceImage },
    { type: "image", image: input.outputImage },
  ];
};

const moduleExport: SkillSchemaModule<FidelityGraderInput, FidelityGraderOutput> = {
  inputSchema,
  outputSchema,
  formatInput,
};

export default moduleExport;
