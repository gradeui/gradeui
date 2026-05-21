/**
 * Schema sidecar for the seed-corpus-generator skill.
 *
 * This skill is the worker that produces candidate corpus entries for the
 * user to rate. The Studio-side orchestrator that drives parallel sub-agents
 * (Mode A: one mobbin-pattern-extractor per Mobbin screen, then this skill
 * to convert the patterns to JSX; Mode B: this skill directly with no
 * extracted patterns) lives outside the skills package — see
 * STUDIO-LEARNING.md.
 */

import { z } from "zod";
import type { FormatInput, SkillSchemaModule } from "../../types";

/** Structural pattern description handed in by the Mobbin extractor (Mode A only). */
export const patternDescriptionSchema = z.object({
  /** Free-text description of structure — NOT visual reproduction. */
  description: z.string().min(20),
  /** Axes the extractor inferred from the screen. */
  axes: z.object({
    visualWeight: z.number().min(0).max(1),
    density: z.number().min(0).max(1),
    information: z.number().min(0).max(1),
  }),
  /** Mobbin URL for provenance — captured, never displayed/redistributed. */
  screenRef: z.string().url(),
});

export const inputSchema = z.object({
  /** Top-level category. App vs website is structural, not stylistic. */
  domain: z.enum(["app", "website", "email", "doc", "embed"]),
  /** From the project's purpose taxonomy — see Mobbin/your own list. */
  purpose: z.string().min(2),
  /** Where this layout sits in the surface hierarchy. */
  surface: z.enum(["page", "modal", "panel", "section", "card-block"]),
  /** How many candidates to produce in this batch (typically 3-8). */
  count: z.number().int().min(1).max(20).default(5),
  /**
   * Deliberately distribute candidates across the visualWeight axis so the
   * user sees structurally different options, not minor restyles.
   */
  axisSpread: z.boolean().default(true),
  /**
   * Mode A inputs — pattern descriptions from sibling sub-agents that
   * looked at Mobbin screens. Empty / omitted = Mode B (LLM-only).
   */
  patterns: z.array(patternDescriptionSchema).optional(),
  /**
   * Primitives the candidate JSX is allowed to use. Passed in by the
   * orchestrator from the @gradeui/studio playbook allowlist so the skill
   * can't drift into inventing components.
   */
  usePrimitives: z.array(z.string()).min(1),
});

export const outputSchema = z.object({
  candidates: z.array(
    z.object({
      name: z.string().min(2),
      description: z.string().min(10),
      jsx: z.string().min(20),
      axes: z.object({
        visualWeight: z.number().min(0).max(1),
        density: z.number().min(0).max(1),
        information: z.number().min(0).max(1),
      }),
      promptSignals: z.array(z.string().min(2)).min(1),
      /** Mode A only — Mobbin screen ref carried through from the pattern. */
      inspiredBy: z.string().url().optional(),
    })
  ),
});

export type SeedCorpusGeneratorInput = z.infer<typeof inputSchema>;
export type SeedCorpusGeneratorOutput = z.infer<typeof outputSchema>;

export const formatInput: FormatInput<SeedCorpusGeneratorInput> = (input) => {
  const mode = input.patterns?.length ? "A" : "B";
  const parts: string[] = [
    `Mode: ${mode} (${mode === "A" ? "Mobbin-fed pattern descriptions" : "LLM-only synthesis"})`,
    "",
    `Generate ${input.count} candidate seed corpus entries for:`,
    `  domain  = ${input.domain}`,
    `  purpose = ${input.purpose}`,
    `  surface = ${input.surface}`,
    `  axisSpread = ${input.axisSpread}`,
    "",
    "Allowed primitives (use ONLY these + plain intrinsics):",
    input.usePrimitives.map((p) => `  - ${p}`).join("\n"),
    "",
  ];

  if (mode === "A" && input.patterns) {
    parts.push("Pattern descriptions extracted from Mobbin screens:");
    input.patterns.forEach((p, i) => {
      parts.push("");
      parts.push(`[Pattern ${i + 1}] (ref: ${p.screenRef})`);
      parts.push(p.description);
      parts.push(
        `  axes: visualWeight=${p.axes.visualWeight}, density=${p.axes.density}, information=${p.axes.information}`,
      );
    });
    parts.push("");
    parts.push(
      "Use these as composition guidance. Write fresh JSX against the listed primitives. Never reproduce the screen's visual fidelity — these are structural hints, not visual targets.",
    );
  } else {
    parts.push(
      "No reference patterns supplied — synthesise from your own knowledge of the category. Lean toward genuinely distinct layout strategies, not five-variants-of-the-same-idea.",
    );
  }

  if (input.axisSpread) {
    parts.push("");
    parts.push(
      `Spread candidates roughly evenly across visualWeight ∈ [0, 1]. With count=${input.count}, target stops near ${spreadStops(input.count).join(", ")}.`,
    );
  }

  return parts.join("\n");
};

function spreadStops(n: number): string[] {
  if (n <= 1) return ["0.5"];
  const stops: string[] = [];
  for (let i = 0; i < n; i++) {
    stops.push(((i + 0.5) / n).toFixed(2));
  }
  return stops;
}

const moduleExport: SkillSchemaModule<
  SeedCorpusGeneratorInput,
  SeedCorpusGeneratorOutput
> = {
  inputSchema,
  outputSchema,
  formatInput,
};

export default moduleExport;
