/**
 * Public types for @gradeui/skills.
 *
 * A "skill" in this package is a packaged unit of agent expertise — a
 * structured prompt + an input/output contract. Skills are authored as
 * SKILL.md directories (`SKILL.md` + sibling `schema.ts`), parsed by the
 * loader (./loader.ts), and executed by the runner (./runner.ts).
 *
 * Skills are intentionally not coupled to the compose pipeline — they can be
 * invoked from anywhere (Studio chat, a CI hook, an external tool) given the
 * same `runSkill()` runtime.
 */

import type { ZodSchema } from "zod";

/** Provider hint — the runner resolves this to a concrete model from env config. */
export type ProviderId = "anthropic" | "google" | "openai";

/**
 * Frontmatter parsed from a SKILL.md. Body of the .md becomes the system
 * prompt — kept separate so authoring stays prose-first.
 */
export interface SkillFrontmatter {
  /** Unique stable id, e.g. "image-describer". URL-safe. */
  id: string;
  /** Human label for diagnostics + UI. */
  name: string;
  /** One-line description — surfaced to the orchestrator + chat picker. */
  description: string;
  /**
   * Skill ids this skill needs to have run before it can produce useful output.
   * Used by the compose pipeline's topological sort.
   */
  dependsOn?: string[];
  /**
   * Provider preference. The runner can override based on capability (e.g. a
   * vision skill picks an anthropic/google vision model regardless).
   */
  defaultProvider?: ProviderId;
  /** Specific model id — only set if the skill *requires* a particular model. */
  defaultModel?: string;
  /**
   * If true, the skill expects to be called with image inputs and the runner
   * should pick a vision-capable model.
   */
  vision?: boolean;
  /** Tags for discovery — e.g. ["accessibility", "media"]. */
  tags?: string[];
}

/** Multimodal message part — text or image — for vision-capable skills. */
export type SkillInputPart =
  | { type: "text"; text: string }
  | { type: "image"; image: string };

/** Function that turns typed input into the parts handed to the model. */
export type FormatInput<I> = (input: I) => string | SkillInputPart[];

/**
 * Runtime skill object — the result of loading a SKILL.md folder. This is
 * what the runner consumes.
 */
export interface ComposeSkill<I = unknown, O = unknown> {
  frontmatter: SkillFrontmatter;
  /** System prompt — the body of the SKILL.md, with frontmatter stripped. */
  systemPrompt: string;
  /** Zod schema validating input. */
  inputSchema: ZodSchema<I>;
  /** Zod schema describing structured output. */
  outputSchema: ZodSchema<O>;
  /** Optional input formatter — defaults to JSON.stringify of the input. */
  formatInput?: FormatInput<I>;
}

/** Module shape that a skill's `schema.ts` must export. */
export interface SkillSchemaModule<I = unknown, O = unknown> {
  inputSchema: ZodSchema<I>;
  outputSchema: ZodSchema<O>;
  formatInput?: FormatInput<I>;
}
