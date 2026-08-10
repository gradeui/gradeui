import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolve a project's app icon, the mark a share or embed wears when it
 * is installed to a phone/tablet home screen (STUDIO-STORAGE "Per-project
 * app icon").
 *
 * The icon is a normal STUDIO-STORAGE asset flagged
 * `enrichment.role = "app-icon"`, the role seam until a dedicated
 * projects column exists. Newest wins, so re-uploading replaces the icon
 * with no cleanup. Public bucket, so the returned URL is permanent and
 * safe inside a `<link>` tag. Returns null when the project has no icon;
 * callers fall back to the site defaults.
 *
 * Used by /s/<token> and /e/<token> generateMetadata. Keep both on this
 * helper so the conditional stays identical across surfaces.
 */
export async function resolveProjectAppIconUrl(
  supabase: SupabaseClient,
  projectId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("assets")
    .select("path")
    .eq("project_id", projectId)
    .eq("enrichment->>role", "app-icon")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const path = (data as { path: string } | null)?.path;
  if (!path) return null;
  return supabase.storage.from("user-assets").getPublicUrl(path).data.publicUrl;
}
