/**
 * GET /api/skills/list
 *
 * Returns frontmatter for every built-in skill — id, name, description,
 * dependsOn, defaultProvider, vision flag, tags. Used by the Studio Skills
 * tab to populate the inventory.
 *
 * The body of each SKILL.md (the system prompt) is intentionally NOT included
 * — it's an internal authoring concern, not user-facing, and it can be large.
 *
 * Auth-gated to match the rest of the gradeui.com surface.
 */

import { NextResponse } from "next/server";
import { listSkills } from "@gradeui/skills";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.name) {
    return NextResponse.json(
      { error: "You must be signed in to list skills." },
      { status: 401 },
    );
  }

  try {
    const skills = await listSkills();
    return NextResponse.json({ skills });
  } catch (err) {
    console.error("[/api/skills/list]", err);
    const message = err instanceof Error ? err.message : "Failed to list skills.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
