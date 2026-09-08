import { NextResponse } from "next/server";
import { DEFAULT_LOCATION, resolveGoto } from "@/lib/screens";

/** Stable Studio-identity links: /s/<designId> redirects to the route,
 *  in the default location (a share link carries no location). */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const decoded = decodeURIComponent(id);
  const href = resolveGoto(decoded.startsWith("screen:") ? decoded : `screen:${decoded}`, DEFAULT_LOCATION) ?? resolveGoto(decoded, DEFAULT_LOCATION);
  return NextResponse.redirect(new URL(href ?? "/", req.url), 307);
}
