/**
 * POST /api/skills/run
 *
 * Executes a skill by id against a typed input. Returns the skill's structured
 * output (a `RubricResult` for review skills, domain-specific shapes for
 * generation skills like image-describer).
 *
 * Body shape:
 *   {
 *     skillId: string;          // e.g. "fidelity-grader"
 *     input: unknown;           // validated by the skill's inputSchema
 *     provider?: "anthropic" | "google" | "openai";  // optional override
 *   }
 *
 * Response:
 *   { skillId, output, durationMs }
 *
 * Auth-gated. Per-user rate limit is conservative (20/hr) since skill runs
 * call review/vision models that cost more per invocation than image
 * generation.
 *
 * Note on multi-mode architecture: today this route runs skills with
 * environment-side keys (the "in-app free tier" mode). When BYOT lands, the
 * provider+model resolution will read from the authed user's settings record
 * instead of process.env — same `runSkill()` call, different key source.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSkill, runSkill, type ProviderId } from "@gradeui/skills";
import { auth } from "@/lib/auth";

// Review skills with vision can take 4-12 seconds — give them headroom.
export const maxDuration = 60;

const VALID_PROVIDERS = new Set<ProviderId>(["anthropic", "google", "openai"]);

const HOURLY_LIMIT = 20;
const buckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(userId);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return { ok: true, remaining: HOURLY_LIMIT - 1 };
  }
  if (bucket.count >= HOURLY_LIMIT) {
    return { ok: false, remaining: 0 };
  }
  bucket.count++;
  return { ok: true, remaining: HOURLY_LIMIT - bucket.count };
}

export async function POST(request: NextRequest) {
  // 1. Auth.
  const session = await auth();
  if (!session?.user?.name) {
    return NextResponse.json(
      { error: "You must be signed in to run skills." },
      { status: 401 },
    );
  }

  // 2. Rate limit.
  const limit = checkRateLimit(session.user.name);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Hourly skill-run limit reached. Try again later." },
      { status: 429 },
    );
  }

  // 3. Parse body.
  let body: { skillId?: unknown; input?: unknown; provider?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.skillId || typeof body.skillId !== "string") {
    return NextResponse.json(
      { error: "`skillId` is required (string)." },
      { status: 400 },
    );
  }
  if (body.input === undefined) {
    return NextResponse.json(
      { error: "`input` is required." },
      { status: 400 },
    );
  }

  let provider: ProviderId | undefined;
  if (body.provider !== undefined) {
    if (typeof body.provider !== "string" || !VALID_PROVIDERS.has(body.provider as ProviderId)) {
      return NextResponse.json(
        { error: `\`provider\` must be one of ${[...VALID_PROVIDERS].join(", ")}.` },
        { status: 400 },
      );
    }
    provider = body.provider as ProviderId;
  }

  // 4. Resolve skill.
  let skill;
  try {
    skill = await getSkill(body.skillId);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : `Unknown skill: ${body.skillId}`,
      },
      { status: 404 },
    );
  }

  // 5. Run. The skill's inputSchema validates `input`; we let runSkill throw
  //    a ZodError if it's malformed and translate to 400.
  const startedAt = Date.now();
  try {
    const output = await runSkill(skill, {
      input: body.input as never,
      provider,
    });
    return NextResponse.json(
      {
        skillId: body.skillId,
        output,
        durationMs: Date.now() - startedAt,
      },
      {
        headers: {
          "X-RateLimit-Remaining": String(limit.remaining),
        },
      },
    );
  } catch (err) {
    console.error(`[/api/skills/run] ${body.skillId}`, err);

    // Zod validation error → 400.
    if (err && typeof err === "object" && "issues" in err) {
      return NextResponse.json(
        {
          error: "Invalid input for skill.",
          details: (err as { issues: unknown }).issues,
        },
        { status: 400 },
      );
    }

    const message = err instanceof Error ? err.message : "Skill run failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
