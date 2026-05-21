/**
 * Schema sidecar for the learn-from-session skill.
 *
 * The skill is intentionally a pure function over session signals — it
 * reads events, returns a structured corpus diff. The actual write to
 * corpus.generated.json / gaps.generated.json happens in the Studio
 * orchestrator via the storage adapter, NOT in this skill. That keeps
 * the skill testable in isolation and lets the orchestrator gate writes
 * behind a "review changes before applying" UI later.
 */

import { z } from "zod";
import type { FormatInput, SkillSchemaModule } from "../../types";

const axisSchema = z.object({
  visualWeight: z.number().min(0).max(1),
  density: z.number().min(0).max(1),
  information: z.number().min(0).max(1),
});

const briefShape = z.object({
  intent: z.string(),
  audience: z.string(),
  domain: z.enum(["app", "website", "email", "doc", "embed"]),
  purpose: z.string(),
  surface: z.enum(["page", "modal", "panel", "section", "card-block"]),
  defaultAxes: axisSchema,
});

const eventBase = z.object({
  promptId: z.string(),
  at: z.string(),
});

const acceptedEvent = eventBase.extend({
  kind: z.literal("accepted"),
  entryId: z.string(),
  jsx: z.string().optional(),
  brief: briefShape,
  rating: z.number().min(1).max(5).optional(),
});

const rejectedEvent = eventBase.extend({
  kind: z.literal("rejected"),
  entryId: z.string(),
  reason: z.string().optional(),
});

const commentedEvent = eventBase.extend({
  kind: z.literal("commented"),
  entryId: z.string(),
  sourceId: z.string().optional(),
  componentName: z.string().optional(),
  suggestion: z.string().min(2),
  scope: z.enum(["node", "layout"]),
});

const savedAsUserComponentEvent = eventBase.extend({
  kind: z.literal("saved-as-user-component"),
  entryId: z.string(),
  name: z.string(),
});

const gapEncounteredEvent = eventBase.extend({
  kind: z.literal("gap-encountered"),
  brief: briefShape,
  what: z.string(),
  workaround: z.string().optional(),
});

export const sessionEventSchema = z.discriminatedUnion("kind", [
  acceptedEvent,
  rejectedEvent,
  commentedEvent,
  savedAsUserComponentEvent,
  gapEncounteredEvent,
]);

const existingEntrySummary = z.object({
  id: z.string(),
  domain: z.enum(["app", "website", "email", "doc", "embed"]),
  purpose: z.string(),
  surface: z.enum(["page", "modal", "panel", "section", "card-block"]),
  name: z.string(),
  description: z.string(),
  axes: axisSchema,
  weight: z.number(),
});

const existingGap = z.object({
  what: z.string(),
  votes: z.number(),
});

export const inputSchema = z.object({
  session: z.object({
    /** Stable session id — surfaced in audit trails if a corpus update
     *  later turns out to be wrong, so we can find what session caused it. */
    id: z.string(),
    events: z.array(sessionEventSchema),
  }),
  /** Existing corpus snapshot (read-only) — used for dedup and weight lookup.
   *  Only minimal summary fields; full entries don't need to round-trip. */
  corpus: z.object({
    entries: z.array(existingEntrySummary),
    gaps: z.array(existingGap),
  }),
});

const newEntrySchema = z.object({
  /** Suggested id — orchestrator may rewrite to its content-hash scheme. */
  suggestedId: z.string(),
  domain: z.enum(["app", "website", "email", "doc", "embed"]),
  purpose: z.string(),
  surface: z.enum(["page", "modal", "panel", "section", "card-block"]),
  name: z.string(),
  description: z.string(),
  jsx: z.string().min(20),
  axes: axisSchema,
  promptSignals: z.array(z.string()).min(1),
  /** Initial weight — typically 1.0 for accepts, 1.5 for save-as-user-component. */
  initialWeight: z.number().min(0.5).max(3),
  /** Provenance: which session event produced this entry. */
  providedBy: z.object({
    sessionId: z.string(),
    promptId: z.string(),
  }),
});

const weightUpdateSchema = z.object({
  entryId: z.string(),
  deltaWeight: z.number().min(-2).max(2),
  reason: z.string(),
});

const commentAttachmentSchema = z.object({
  entryId: z.string(),
  sourceId: z.string().optional(),
  componentName: z.string().optional(),
  suggestion: z.string(),
  scope: z.enum(["node", "layout"]),
});

const gapEntrySchema = z.object({
  what: z.string(),
  prompt: z.string(),
  brief: briefShape,
  workaround: z.string().optional(),
  /** Use this when matching a gap that already exists in corpus.gaps; the
   *  orchestrator will increment votes rather than create a duplicate. */
  voteIncrement: z.boolean().default(false),
});

export const outputSchema = z.object({
  newEntries: z.array(newEntrySchema),
  weightUpdates: z.array(weightUpdateSchema),
  commentAttachments: z.array(commentAttachmentSchema),
  gapEntries: z.array(gapEntrySchema),
  /** One-line summary for diagnostics / user-facing "what I learned" toast. */
  summary: z.string(),
});

export type LearnFromSessionInput = z.infer<typeof inputSchema>;
export type LearnFromSessionOutput = z.infer<typeof outputSchema>;
export type SessionEvent = z.infer<typeof sessionEventSchema>;

export const formatInput: FormatInput<LearnFromSessionInput> = (input) => {
  const counts = input.session.events.reduce<Record<string, number>>(
    (acc, ev) => {
      acc[ev.kind] = (acc[ev.kind] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return [
    `Session ${input.session.id} — ${input.session.events.length} events:`,
    Object.entries(counts)
      .map(([k, n]) => `  ${k}: ${n}`)
      .join("\n"),
    "",
    "Events (chronological):",
    "```json",
    JSON.stringify(input.session.events, null, 2),
    "```",
    "",
    `Corpus snapshot: ${input.corpus.entries.length} entries, ${input.corpus.gaps.length} gaps.`,
    "```json",
    JSON.stringify(input.corpus, null, 2),
    "```",
    "",
    "Emit a CorpusUpdate per the rules in your system prompt. Conservative weight magnitudes; explicit accept/save signals only for newEntries; dedup before suggesting new ones.",
  ].join("\n");
};

const moduleExport: SkillSchemaModule<
  LearnFromSessionInput,
  LearnFromSessionOutput
> = {
  inputSchema,
  outputSchema,
  formatInput,
};

export default moduleExport;
