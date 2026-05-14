/**
 * /media — image generation surface.
 *
 * v0 surfaces `@gradeui/media`'s `generateImage()` as a prompt-and-see UI.
 * Uses the Gemini Flash Image free-tier provider already wired into the
 * package, the same content-hash cache so identical prompts return instantly,
 * and the existing `/api/media/generate` route under the hood.
 *
 * Currently un-gated — see the NOTE block below for the auth re-add plan
 * before this surface is publicly deployed.
 *
 * Video generation is deferred. The architecture in `@gradeui/media` is
 * format-agnostic enough to extend cleanly when Veo (or another free-tier
 * video provider) is wired up; it lives in this same /media surface so
 * users have one place for "describe what you want, see the result".
 */

import { getActiveProviderId } from "@gradeui/media";
import { MediaExplorer } from "@/components/media/media-explorer";

export const metadata = {
  title: "Media — Grade",
  description:
    "Generate images for marketing pages and product layouts using Grade's free-tier media pipeline.",
};

export default function MediaPage() {
  // Resolve the active provider on the server so the page header shows it
  // before the user runs anything. If the package can't pick a provider
  // (e.g. MEDIA_PROVIDER=gemini but no key), surface that as a banner
  // instead of a 500.
  let activeProviderId: string;
  let providerError: string | null = null;
  try {
    activeProviderId = getActiveProviderId();
  } catch (err) {
    activeProviderId = "(unavailable)";
    providerError = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Media</h1>
            <p className="text-sm text-muted-foreground">
              Generate images. Cached by content hash — identical prompts
              return instantly.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Provider
            </span>
            <code className="rounded-full border bg-card px-2.5 py-1 font-mono text-xs">
              {activeProviderId}
            </code>
          </div>
        </div>
      </header>
      {providerError && (
        <div className="mx-auto max-w-5xl px-4 pt-4 md:px-6">
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            <strong>Provider not available:</strong> {providerError}
          </div>
        </div>
      )}
      <MediaExplorer />
    </div>
  );
}
