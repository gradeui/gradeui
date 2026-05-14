/**
 * Skill loader — turns a SKILL.md + sibling schema.ts directory into a runtime
 * `ComposeSkill` object.
 *
 * Why we don't auto-scan the filesystem at module load time:
 *   - Bundlers (Next.js / tsup) can't trace dynamic `await import()` against a
 *     glob unless they're given an explicit list. Static imports keep the
 *     dependency graph traceable.
 *   - Skills will eventually live across multiple packages (`@gradeui/skills`,
 *     `@gradeui/skills-acme`, etc.) — explicit registration scales better.
 *
 * So each skill exports a `loadXxxSkill()` helper from its directory, and
 * `index.ts` collects them into a registry. Authors only edit the SKILL.md
 * + schema.ts; the loader plumbing is symmetric and can be code-genned later
 * if hand-writing it gets tedious.
 */

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import type {
  ComposeSkill,
  SkillFrontmatter,
  SkillSchemaModule,
} from "./types";

/**
 * Build a ComposeSkill from a SKILL.md path + the imported schema module.
 * Called from each skill's `index.ts`.
 *
 * @param skillMdUrl `import.meta.url` from the skill's own index.ts (so we
 *                   resolve SKILL.md relative to the source file regardless
 *                   of build output).
 * @param schemaModule The sibling `./schema.ts` re-exported by the skill.
 */
export async function loadSkill<I, O>(
  skillMdUrl: string,
  schemaModule: SkillSchemaModule<I, O>,
): Promise<ComposeSkill<I, O>> {
  const dir = dirname(fileURLToPath(skillMdUrl));
  const path = join(dir, "SKILL.md");
  const raw = await readFile(path, "utf8");
  const parsed = matter(raw);

  const frontmatter = validateFrontmatter(parsed.data, path);
  const systemPrompt = parsed.content.trim();

  return {
    frontmatter,
    systemPrompt,
    inputSchema: schemaModule.inputSchema,
    outputSchema: schemaModule.outputSchema,
    formatInput: schemaModule.formatInput,
  };
}

function validateFrontmatter(
  raw: Record<string, unknown>,
  path: string,
): SkillFrontmatter {
  const required: Array<keyof SkillFrontmatter> = ["id", "name", "description"];
  for (const k of required) {
    if (!raw[k] || typeof raw[k] !== "string") {
      throw new Error(`[@gradeui/skills] ${path} is missing required frontmatter field: ${k}`);
    }
  }
  return raw as unknown as SkillFrontmatter;
}
