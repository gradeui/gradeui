/**
 * The project's steering, in one place.
 *
 * A project's `rules_files` jsonb encodes TWO different things, and its
 * brief / dos / donts sit alongside them. Assembling all of that into a
 * prompt was never a function: the docs app did it inline in a `useMemo`
 * inside studio/page.tsx, and the MCP server did its own smaller version
 * in tools.ts. So "the project's rules" meant whatever each surface had
 * most recently been taught, and they drifted:
 *
 *   Jun 23  the MCP server learns project steering (context + dos/donts,
 *           migration 0019)
 *   Jul 13  the rules-files harness lands — Rules screen, per-file
 *           toggles, registry toggle records — in the docs app ONLY
 *
 * For a month after that, the same project generating the same screen got
 * a different rule set depending on whether you asked through Studio chat
 * or through MCP, with nothing in the code that could notice. This module
 * is the fix: both surfaces call it, so adding a steering input changes
 * one function and reaches everywhere at once.
 */

import { buildSystemPrompt } from "../playbook/prompts/system";
import { GRADE_REGISTRY } from "../registry/gradeui";
import type { DesignSystemRegistry } from "../registry/types";

/** One authored rules file that rides the prompt. */
export interface ProjectRuleFile {
  name: string;
  content: string;
}

/** What a project's `rules_files` jsonb actually encodes. */
export interface ProjectRules {
  /** Registry rules-file ids switched OFF for this project (the Rules
   *  screen writes these as `kind: "registry"` records). */
  disabledRuleIds: string[];
  /** The project's own authored files that ride the prompt. */
  files: ProjectRuleFile[];
}

/**
 * Read a project's `rules_files` jsonb. THE definition of what a record
 * in that column means, so no consumer has to keep its own copy:
 *
 *   - `kind: "registry"` records are toggle bookkeeping, not content.
 *     Their id is `"registry:<fileId>"` and their content is unused; with
 *     `enabled: false` they switch that registry rules file off.
 *   - every other record is an authored file whose content injects.
 *   - `enabled: false` keeps a file but stops it injecting. Undefined
 *     means ON, for rows written before the toggle existed.
 *   - `.css` files ride the PREVIEW, never the prompt.
 *
 * Tolerant of anything: the column is jsonb written by more than one
 * client, so a malformed record is skipped rather than thrown on.
 */
export function readProjectRules(raw: unknown): ProjectRules {
  const disabledRuleIds: string[] = [];
  const files: ProjectRuleFile[] = [];
  if (!Array.isArray(raw)) return { disabledRuleIds, files };
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const f = entry as {
      id?: unknown;
      name?: unknown;
      content?: unknown;
      kind?: unknown;
      enabled?: unknown;
    };
    if (f.kind === "registry") {
      if (f.enabled === false && typeof f.id === "string") {
        disabledRuleIds.push(f.id.replace(/^registry:/, ""));
      }
      continue;
    }
    if (f.enabled === false) continue;
    if (typeof f.name !== "string" || typeof f.content !== "string") continue;
    if (f.name.trim().toLowerCase().endsWith(".css")) continue;
    if (!f.content.trim()) continue;
    files.push({ name: f.name, content: f.content });
  }
  return { disabledRuleIds, files };
}

/** A project's owner-set steering, already read off the row. */
export interface ProjectSteering {
  type?: string | null;
  context?: string | null;
  dos?: readonly string[] | null;
  donts?: readonly string[] | null;
  files?: readonly ProjectRuleFile[] | null;
}

/**
 * Format a project's steering as a prompt stanza. Empty string when the
 * project sets none, so callers can append unconditionally.
 *
 * Ordered shortest-first: the terse always/never rules land before the
 * long authored files, because the model reads top-down and the terse
 * ones are the hard constraints.
 */
export function projectSteeringBlock(steering: ProjectSteering): string {
  const parts: string[] = [];
  if (steering.type) parts.push(`Project type: ${steering.type}`);
  if (steering.context?.trim())
    parts.push(`PROJECT BRIEF:\n${steering.context.trim()}`);
  if (steering.dos?.length)
    parts.push(
      `PROJECT RULES — ALWAYS:\n${steering.dos.map((d) => `  - ${d}`).join("\n")}`,
    );
  if (steering.donts?.length)
    parts.push(
      `PROJECT RULES — NEVER:\n${steering.donts.map((d) => `  - ${d}`).join("\n")}`,
    );
  for (const f of steering.files ?? []) {
    if (!f.content.trim()) continue;
    parts.push(`PROJECT RULES (${f.name}):\n${f.content.trim()}`);
  }
  if (!parts.length) return "";
  return [
    "─── PROJECT GUIDELINES (set by the project owner — follow these over generic defaults) ───",
    ...parts,
  ].join("\n");
}

/**
 * The full base prompt for a project: the registry's system prompt with
 * that project's disabled rules files excluded, plus its own steering.
 *
 * This is what both Studio chat and the MCP server should hand the model
 * as the base. Pass the result to `createScreenContext` as `basePrompt`
 * when you also want retrieved component refs.
 */
export function buildProjectSystemPrompt(
  registry: DesignSystemRegistry = GRADE_REGISTRY,
  steering: ProjectSteering = {},
  opts?: { disabledRuleIds?: readonly string[] },
): string {
  const base = opts?.disabledRuleIds?.length
    ? buildSystemPrompt(registry, { disabledRuleIds: opts.disabledRuleIds })
    : buildSystemPrompt(registry);
  const block = projectSteeringBlock(steering);
  return block ? `${base}\n\n${block}` : base;
}
