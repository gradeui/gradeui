/**
 * Schema sidecar for the responsive-reviewer skill.
 *
 * Input is N screenshots of the same page at different viewport widths,
 * each with optional console-error context. Output is a `RubricResult`
 * — the shared review-skill shape.
 *
 * The runner that produces the inputs is a Playwright wrapper (see
 * `apps/docs/scripts/check-layouts.mjs`) that navigates to a layout's
 * `/layout-preview/<id>` route at each requested width, waits for ready,
 * screenshots, captures console errors, and uploads the PNGs somewhere
 * fetchable. The skill itself doesn't run Playwright — it just grades
 * what the runner produced.
 */

import { z } from "zod";
import { rubricResultSchema } from "../../rubric";
import type { FormatInput, SkillSchemaModule, SkillInputPart } from "../../types";

/** One viewport's worth of evidence — width, image, optional console errors. */
export const viewportSnapshotSchema = z.object({
  /** Pixel width of the viewport this screenshot was captured at. */
  viewportWidth: z
    .number()
    .int()
    .min(200)
    .max(4000)
    .describe("Viewport pixel width — used to label the image in the prompt."),
  /** Public URL of the screenshot at this width. */
  imageUrl: z
    .string()
    .url()
    .describe("Public URL of the screenshot captured at viewportWidth."),
  /**
   * Console errors captured during the screenshot run, if any. Hydration
   * mismatches, thrown exceptions, missing-import errors all surface here.
   * Empty array means a clean run. Keep messages short — first ~200 chars
   * each is plenty for the model to spot a class of error.
   */
  consoleErrors: z.array(z.string().max(500)).default([]),
});

export type ViewportSnapshot = z.infer<typeof viewportSnapshotSchema>;

export const inputSchema = z.object({
  /**
   * The same page rendered at multiple widths. Order is irrelevant — the
   * skill labels each image with its width and reasons about them
   * collectively. Two snapshots minimum (otherwise it's not a responsive
   * review, it's a single-viewport review).
   */
  snapshots: z
    .array(viewportSnapshotSchema)
    .min(2)
    .max(8)
    .describe("Per-viewport screenshots. Two minimum, eight maximum."),
  /** Optional brief describing the page's intent (e.g. the chat prompt that produced it). */
  pageIntent: z.string().optional(),
  /** Optional name/title for the page or layout (e.g. "airbnb-listings reference layout"). */
  pageTitle: z.string().optional(),
  /** Pass bar 0-100. Defaults to 80. */
  threshold: z.number().min(0).max(100).default(80),
  /** Optional markup snippet so the grader can attach selectors. */
  outputMarkup: z.string().optional(),
});

export const outputSchema = rubricResultSchema;

export type ResponsiveReviewerInput = z.infer<typeof inputSchema>;
export type ResponsiveReviewerOutput = z.infer<typeof outputSchema>;

/**
 * Lay out the prompt: text intro + alternating (label, image) parts so
 * the model can reason about each width with explicit context. The label
 * comes BEFORE the image so multimodal models that don't get image
 * filenames still know which width they're looking at.
 */
export const formatInput: FormatInput<ResponsiveReviewerInput> = (input) => {
  const sorted = [...input.snapshots].sort(
    (a, b) => a.viewportWidth - b.viewportWidth,
  );

  const intro = [
    `Review responsiveness across ${sorted.length} viewport widths.`,
    "",
    `Threshold to pass: ${input.threshold}.`,
    input.pageTitle ? `\nPage: ${input.pageTitle}` : "",
    input.pageIntent ? `\nIntent:\n${input.pageIntent}` : "",
    input.outputMarkup
      ? `\nMarkup snippet (use for selectors when you can):\n\`\`\`html\n${input.outputMarkup.slice(0, 4000)}\n\`\`\``
      : "",
    "",
    `Widths in order: ${sorted.map((s) => `${s.viewportWidth}px`).join(", ")}.`,
    "Each image is preceded by its viewport label and any console errors captured at that width.",
  ]
    .filter(Boolean)
    .join("\n");

  const parts: SkillInputPart[] = [{ type: "text", text: intro }];

  for (const snap of sorted) {
    const label = [
      `\n--- viewport: ${snap.viewportWidth}px ---`,
      snap.consoleErrors.length > 0
        ? `Console errors at this width (${snap.consoleErrors.length}):\n${snap.consoleErrors
            .map((e, i) => `  ${i + 1}. ${e}`)
            .join("\n")}`
        : "Console errors at this width: none.",
    ].join("\n");

    parts.push({ type: "text", text: label });
    parts.push({ type: "image", image: snap.imageUrl });
  }

  return parts;
};

const moduleExport: SkillSchemaModule<
  ResponsiveReviewerInput,
  ResponsiveReviewerOutput
> = {
  inputSchema,
  outputSchema,
  formatInput,
};

export default moduleExport;
