import { NextResponse } from "next/server";
import { screenById, screenByName } from "@/lib/screens";

/**
 * Stable Studio-identity links: /s/<designId> (or /s/<screen name>,
 * URL-encoded) redirects to the screen's real route. Lets existing
 * Studio-side references keep working against the locked app, and
 * gives demo links an id that survives any future slug rename.
 * Unknown ids land on the demo hub rather than a 404.
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const decoded = decodeURIComponent(id);
  const screen = screenById(decoded) ?? screenByName(decoded);
  return NextResponse.redirect(new URL(screen?.slug ?? "/", req.url), 307);
}
