"use client";

/**
 * Browser-side Supabase client.
 *
 * Use this from client components only — server components must
 * import from `./server` instead so cookies are handled correctly.
 *
 * The client is created lazily and cached per-tab so React StrictMode
 * remounts don't spin up two clients. Returns null in local-only
 * mode (no env keys); every caller must handle the null branch and
 * fall back to local behaviour.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./env";

let cached: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient | null {
  if (cached) return cached;
  const url = supabaseUrl();
  const key = supabaseAnonKey();
  if (!url || !key) return null;
  cached = createBrowserClient(url, key);
  return cached;
}
