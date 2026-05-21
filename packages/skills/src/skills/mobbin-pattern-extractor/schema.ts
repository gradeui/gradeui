/**
 * Schema sidecar for the mobbin-pattern-extractor skill.
 *
 * One screen in, one structural-pattern description out. The Phase 0
 * orchestrator runs N of these in parallel via the Task tool against
 * Mobbin's MCP, then feeds the resulting `patterns[]` into a single
 * seed-corpus-generator invocation that converts them to JSX.
 *
 * Output shape is intentionally identical to `patternDescriptionSchema`
 * in seed-corpus-generator/schema.ts so the orchestrator pipes one to
 * the other without transformation.
 */

import { z } from "zod";
import type { FormatInput, SkillSchemaModule } from "../../types";

export const inputSchema = z.object({
  /** Mobbin screen URL. The runner is responsible for resolving this
   *  to an image (via Mobbin's MCP or by following the URL); the skill
   *  itself receives an image part via formatInput. */
  screenRef: z.string().url(),
  /** The image content as a URL the model can fetch. Populated by the
   *  orchestrator before invoking — keeps the skill itself agnostic to
   *  how Mobbin delivers screens. */
  imageUrl: z.string().url(),
  /** Category hint — helps the model orient (a settings screen vs a
   *  marketing landing carry different "what to describe" priorities).
   *  Pass through from the parent orchestrator's input. */
  domainHint: z
    .enum(["app", "website", "email", "doc", "embed"])
    .optional(),
  purposeHint: z.string().optional(),
});

export const outputSchema = z.object({
  /** Free-text structural description — see SKILL.md for the shape. */
  description: z.string().min(40),
  /** Inferred axis values from the screen. */
  axes: z.object({
    visualWeight: z.number().min(0).max(1),
    density: z.number().min(0).max(1),
    information: z.number().min(0).max(1),
  }),
  /** Provenance — Mobbin URL of the source screen. */
  screenRef: z.string().url(),
});

export type MobbinPatternExtractorInput = z.infer<typeof inputSchema>;
export type MobbinPatternExtractorOutput = z.infer<typeof outputSchema>;

export const formatInput: FormatInput<MobbinPatternExtractorInput> = (
  input,
) => {
  const text = [
    "Extract the structural pattern from this Mobbin screen.",
    "",
    input.domainHint ? `Domain hint: ${input.domainHint}` : "",
    input.purposeHint ? `Purpose hint: ${input.purposeHint}` : "",
    "",
    `screenRef (carry through unchanged): ${input.screenRef}`,
    "",
    "Remember: structure only. No brand names, no visual reproduction, no JSX.",
  ]
    .filter(Boolean)
    .join("\n");

  return [
    { type: "text", text },
    { type: "image", image: input.imageUrl },
  ];
};

const moduleExport: SkillSchemaModule<
  MobbinPatternExtractorInput,
  MobbinPatternExtractorOutput
> = {
  inputSchema,
  outputSchema,
  formatInput,
};

export default moduleExport;
