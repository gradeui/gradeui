"use client";

/**
 * Compatibility re-export — `AuthProvider` is now `SupabaseProvider`.
 *
 * Kept as a thin re-export so any leftover importer keeps working
 * during the transition. New code should import from
 * `@/components/supabase-provider` directly. Safe to delete this
 * file once no callers reference it.
 */

export { SupabaseProvider as AuthProvider } from "./supabase-provider";
