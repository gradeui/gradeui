/**
 * Legacy NextAuth route — Grade no longer uses NextAuth (the OAuth
 * provider is Supabase Auth now). This handler exists so anyone
 * who still hits the old callback URL (bookmarked OAuth app, stale
 * GitHub OAuth app pointing here) gets redirected to the new
 * sign-in page rather than a 500.
 *
 * Safe to delete once no external systems still point here.
 */

import { NextResponse, type NextRequest } from "next/server";

function redirectToSignIn(req: NextRequest) {
  const url = new URL("/sign-in", req.url);
  return NextResponse.redirect(url, { status: 308 });
}

export const GET = (req: NextRequest) => redirectToSignIn(req);
export const POST = (req: NextRequest) => redirectToSignIn(req);
