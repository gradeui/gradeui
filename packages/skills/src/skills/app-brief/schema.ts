/**
 * Schema sidecar for the app-brief skill.
 *
 * Two output modes: "ask" returns clarifying questions in the
 * AskUserQuestion shape the Studio chat already speaks; "act" returns
 * a structured brief that downstream retrieval + generation consume.
 * The Studio orchestrator decides what to do with each: render questions
 * inline in chat, or proceed to retrieval/gen with the brief.
 */

import { z } from "zod";
import type { FormatInput, SkillSchemaModule } from "../../types";

const axisSchema = z.object({
  visualWeight: z.number().min(0).max(1),
  density: z.number().min(0).max(1),
  information: z.number().min(0).max(1),
});

const corpusCandidateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  axes: axisSchema,
});

const askQuestionSchema = z.object({
  question: z.string().min(5),
  header: z.string().max(12),
  multiSelect: z.boolean().default(false),
  options: z
    .array(
      z.object({
        label: z.string().min(1),
        description: z.string().min(1),
      }),
    )
    .min(2)
    .max(4),
});

export const briefSchema = z.object({
  intent: z.string().min(5),
  audience: z.string().min(2),
  domain: z.enum(["app", "website", "email", "doc", "embed"]),
  purpose: z.string().min(2),
  surface: z.enum(["page", "modal", "panel", "section", "card-block"]),
  defaultAxes: axisSchema,
  dataShape: z.string().optional(),
  references: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
});

export const inputSchema = z.object({
  /** The user's raw prompt. */
  prompt: z.string().min(2),
  /**
   * Optional: corpus entries the orchestrator pre-retrieved against the
   * raw prompt. The skill picks up to 3 to include as `suggested` in
   * its output when in "act" mode. Empty / omitted = no suggestions.
   */
  corpusMatches: z.array(corpusCandidateSchema).optional(),
  /**
   * Conversation context — if the user is iterating on a previous brief
   * the skill should NOT re-ask things already established. Pass the
   * prior brief here when continuing a conversation.
   */
  priorBrief: briefSchema.optional(),
});

export const outputSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("ask"),
    questions: z.array(askQuestionSchema).min(1).max(4),
    /** Optional partial brief — what the skill already inferred. Helps
     *  the orchestrator pre-fill answers and shrink the question set
     *  the user actually sees. */
    partial: briefSchema.partial().optional(),
  }),
  z.object({
    mode: z.literal("act"),
    brief: briefSchema,
    /** Up to 3 retrieved candidates the user can pick as-is. */
    suggested: z.array(corpusCandidateSchema).max(3).optional(),
    /** One-line reasoning for downstream debugging / studio UI surfacing.
     *  Not shown to the user verbatim; for diagnostics. */
    rationale: z.string().optional(),
  }),
]);

export type AppBriefInput = z.infer<typeof inputSchema>;
export type AppBriefOutput = z.infer<typeof outputSchema>;
export type AppBrief = z.infer<typeof briefSchema>;

export const formatInput: FormatInput<AppBriefInput> = (input) => {
  const parts: string[] = [
    `User prompt: ${JSON.stringify(input.prompt)}`,
  ];

  if (input.priorBrief) {
    parts.push("");
    parts.push("Prior brief in this conversation (do not re-ask anything covered):");
    parts.push("```json");
    parts.push(JSON.stringify(input.priorBrief, null, 2));
    parts.push("```");
  }

  if (input.corpusMatches?.length) {
    parts.push("");
    parts.push(
      `Pre-retrieved corpus candidates (${input.corpusMatches.length}). In "act" mode, include up to 3 of the most structurally distinct as \`suggested\`.`,
    );
    parts.push("```json");
    parts.push(JSON.stringify(input.corpusMatches, null, 2));
    parts.push("```");
  } else {
    parts.push("");
    parts.push("No corpus candidates pre-retrieved.");
  }

  parts.push("");
  parts.push("Decide: ask (with up to 4 questions) or act (emit a brief).");
  parts.push("Default to acting when domain + purpose are clear or confidently inferable.");

  return parts.join("\n");
};

const moduleExport: SkillSchemaModule<AppBriefInput, AppBriefOutput> = {
  inputSchema,
  outputSchema,
  formatInput,
};

export default moduleExport;
