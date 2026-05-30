/**
 * Supabase + auth env detection.
 *
 * Single source of truth for "is auth configured?" and "which
 * sign-in methods are enabled?". Imported by both the sign-in page
 * and the middleware gate; keeping the predicate in one place
 * means the two surfaces can never disagree about whether Grade
 * is running in local-only mode.
 *
 * Local-first contract: with NEXT_PUBLIC_SUPABASE_URL absent,
 * `isAuthConfigured()` returns false, Studio bypasses the sign-in
 * gate, and the storage factory returns the local adapter. A fresh
 * clone runs `pnpm dev` with zero auth setup.
 */

export type AuthProvider = "google" | "email";

const DEFAULT_PROVIDERS: AuthProvider[] = ["google", "email"];

/** True when Supabase keys are present in env — i.e. the deploy is
 *  cloud-backed and sign-in is required. False = local-only mode. */
export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** Which sign-in buttons to render on the sign-in page. Driven by
 *  `NEXT_PUBLIC_GRADE_AUTH_PROVIDERS` (comma-separated). Unknown
 *  values are dropped silently. Empty string falls back to the
 *  default set — never returns an empty array so the sign-in page
 *  always has something to render when auth is configured. */
export function enabledAuthProviders(): AuthProvider[] {
  const raw = process.env.NEXT_PUBLIC_GRADE_AUTH_PROVIDERS?.trim();
  if (!raw) return DEFAULT_PROVIDERS;
  const parsed = raw
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter((p): p is AuthProvider => p === "google" || p === "email");
  return parsed.length > 0 ? parsed : DEFAULT_PROVIDERS;
}

/** Public URL of the Supabase project. Returns null when
 *  unconfigured so callers can fast-path the local mode. */
export function supabaseUrl(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
}

/** Public anon key — safe in the browser bundle. */
export function supabaseAnonKey(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null;
}
