import { NextResponse } from "next/server";
import { screenById, screenByName, SKELETON_AREAS } from "@/lib/screens";

/** Stable Studio-identity links: /s/<designId> redirects to the route. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const decoded = decodeURIComponent(id);
  const screen = screenById(decoded) ?? screenByName(decoded);
  const area = SKELETON_AREAS.find((a) => a.id === decoded);
  return NextResponse.redirect(new URL(screen?.slug ?? area?.slug ?? "/", req.url), 307);
}
