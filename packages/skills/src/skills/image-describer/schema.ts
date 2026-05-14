/**
 * Schema sidecar for the image-describer skill.
 *
 * Lives next to SKILL.md so the prompt and the contract stay in lockstep.
 * The loader (../../loader.ts) imports this and pairs it with the parsed
 * SKILL.md to produce a runtime ComposeSkill.
 */

import { z } from "zod";
import type { FormatInput, SkillSchemaModule } from "../../types";

export const inputSchema = z.object({
  /** Public URL of the image to describe (Vercel Blob CDN, /api/media/..., etc). */
  imageUrl: z.string().url(),
  /** The prompt that produced the image — used as a hint, not as truth. */
  prompt: z.string(),
  /** Surrounding page context: heading text, neighbouring copy, role of the image. */
  context: z.string().optional(),
  /** The `## imagery` (or related) section of the project's design.md. */
  designGuidance: z.string().optional(),
  /** Set false to skip caption generation (e.g. decorative images). */
  needCaption: z.boolean().default(true),
});

export const outputSchema = z.object({
  alt: z
    .string()
    .max(125, "alt must be ≤ 125 chars")
    .describe("Visual description for screen readers. Empty string if purely decorative."),
  ariaDescription: z
    .string()
    .max(300, "ariaDescription must be ≤ 300 chars")
    .optional()
    .describe("Longer description when alt cannot carry the full information."),
  caption: z
    .string()
    .optional()
    .describe("Brand-voiced headline caption. Omitted when needCaption=false."),
});

export type ImageDescriberInput = z.infer<typeof inputSchema>;
export type ImageDescriberOutput = z.infer<typeof outputSchema>;

export const formatInput: FormatInput<ImageDescriberInput> = (input) => {
  const text = [
    "Describe this image for accessibility.",
    "",
    `Original generation prompt: ${input.prompt}`,
    input.context ? `\nSurrounding page context:\n${input.context}` : "",
    input.designGuidance
      ? `\nBrand voice / imagery guidance:\n${input.designGuidance}`
      : "",
    "",
    input.needCaption
      ? "Provide all three fields (alt, optional ariaDescription, caption)."
      : "Provide alt and optional ariaDescription. Do not return a caption.",
  ]
    .filter(Boolean)
    .join("\n");

  return [
    { type: "text", text },
    { type: "image", image: input.imageUrl },
  ];
};

const moduleExport: SkillSchemaModule<ImageDescriberInput, ImageDescriberOutput> = {
  inputSchema,
  outputSchema,
  formatInput,
};

export default moduleExport;
