/**
 * Share cover sheet — the og:image for /s/<token> (Ali: "like a cover
 * sheet"). A DESIGNED tile, not a screenshot: rendered at request time
 * with next/og ImageResponse (no browser, no storage, fast enough for
 * scrapers), so the link unfurl in Slack/Teams/iMessage reads as a
 * deliberate deliverable — wordmark, share title, tag pill, member
 * count — instead of the generic site card.
 *
 * Branding comes from the share's PROJECT registry (BrightLocal shares
 * lead with the client's name); the tag accent replicates the in-app
 * facet colour INDEX (same hash as tagTypeColor) over fixed hexes,
 * since CSS variables don't exist out here.
 *
 * The queued Playwright OG capture (BRIGHTLOCAL-SIDENAV.md) remains
 * the right answer for SCREENSHOT unfurls; this is the typographic
 * cover that ships today and never renders a half-loaded screen.
 */
import { ImageResponse } from "next/og";
import { getServiceSupabase } from "@/lib/supabase/service";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Shared prototype cover";

// Fixed hexes standing in for --chart-1..5 (same index the app derives
// via tagTypeColor's hash, so a facet keeps "its" colour on the tile).
const CHART_HEX = ["#5b8def", "#3ba974", "#e2a336", "#d96e6e", "#8b77d9"];
function tagHex(type: string): string {
  let h = 0;
  for (let i = 0; i < type.length; i++) h = (h * 31 + type.charCodeAt(i)) >>> 0;
  return CHART_HEX[h % 5];
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = getServiceSupabase();

  // Everything below degrades to a plain branded card — a broken OG
  // must never be the reason a share link looks unprofessional.
  let title = "Shared prototype";
  let brand = "Grade";
  let kicker = "PROTOTYPE";
  let footer = "";
  let accent = CHART_HEX[0];
  let memberCount: number | null = null;

  if (supabase) {
    const { data: link } = await supabase
      .from("share_links")
      .select("project_id, design_id, scope, revoked")
      .eq("token", token)
      .maybeSingle();
    const share = link as {
      project_id: string;
      design_id: string | null;
      scope: {
        tag?: { type: string; value: string };
        screens?: string[];
      } | null;
      revoked: boolean;
    } | null;

    if (share && !share.revoked) {
      const [{ data: project }, { data: design }] = await Promise.all([
        supabase
          .from("projects")
          .select("name, registry_id")
          .eq("id", share.project_id)
          .maybeSingle(),
        share.design_id
          ? supabase
              .from("designs")
              .select("name")
              .eq("id", share.design_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      const projectRow = project as {
        name: string;
        registry_id: string | null;
      } | null;
      const designRow = design as { name: string } | null;

      // Client-facing shares lead with the client. Keep this a plain
      // registry-id map — the registry module itself can't load in the
      // og runtime, and two entries don't need a seam yet.
      if (projectRow?.registry_id === "brightlocal") brand = "BrightLocal";
      footer = projectRow?.name ?? "";

      if (share.scope) {
        kicker = "SHARED SCREENS";
        if (share.scope.tag) {
          title = share.scope.tag.value; // human string, exactly as typed
          accent = tagHex(share.scope.tag.type);
          // Count members: tag scopes resolve live.
          const { data: rows } = await supabase
            .from("designs")
            .select("id, state")
            .eq("project_id", share.project_id);
          memberCount = ((rows ?? []) as { id: string; state: unknown }[]).filter(
            (r) =>
              r.id === share.design_id ||
              ((r.state as { tags?: { type: string; value: string }[] | null } | null)
                ?.tags ?? []).some(
                (t) =>
                  t.type === share.scope!.tag!.type &&
                  t.value === share.scope!.tag!.value,
              ),
          ).length;
        } else if (share.scope.screens) {
          memberCount = new Set(
            [...share.scope.screens, share.design_id].filter(Boolean),
          ).size;
          title = designRow?.name ?? "Shared screens";
        }
      } else {
        title = designRow?.name ?? "Shared prototype";
      }
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#fbfbfa",
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top rule + wordmark row */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 34,
                fontWeight: 700,
                color: "#161615",
                letterSpacing: -0.5,
              }}
            >
              {brand}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 20,
                color: "#8a8a86",
                letterSpacing: 3,
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 12,
                  height: 12,
                  borderRadius: 99,
                  backgroundColor: accent,
                }}
              />
              {kicker}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              height: 2,
              width: "100%",
              backgroundColor: "#e7e7e3",
            }}
          />
        </div>

        {/* Title block */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              fontSize: title.length > 26 ? 64 : 84,
              fontWeight: 700,
              color: "#161615",
              letterSpacing: -2,
              lineHeight: 1.05,
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          {memberCount !== null && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 26,
                color: "#6b6b67",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 18px",
                  borderRadius: 99,
                  border: "2px solid #e7e7e3",
                  backgroundColor: "#ffffff",
                }}
              >
                {memberCount} screen{memberCount === 1 ? "" : "s"}
              </div>
              <div style={{ display: "flex" }}>live prototype</div>
            </div>
          )}
        </div>

        {/* Footer: project + maker's mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 22,
            color: "#8a8a86",
          }}
        >
          <div style={{ display: "flex" }}>{footer}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            Made with Grade
          </div>
        </div>
      </div>
    ),
    size,
  );
}
