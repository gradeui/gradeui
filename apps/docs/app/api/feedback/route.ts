/**
 * Feedback endpoint — REMOVED.
 *
 * Whole feature was retired during the Supabase cutover. Returns
 * 410 Gone so anyone who still hits this (a stale tab, the old
 * dialog re-mounted, etc.) gets a clear signal rather than a
 * vague 404 or 500.
 */

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Feedback submission has been removed." },
    { status: 410 },
  );
}
