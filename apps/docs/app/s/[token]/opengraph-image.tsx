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
// Fresh render per scrape — the cover reflects LIVE state (rename a
// tag, add a member, the next unfurl shows it). Platform-side unfurl
// caches (Slack et al.) are theirs to expire; ours never goes stale.
export const dynamic = "force-dynamic";

// ─── Brand seam ───────────────────────────────────────────────────────
// Registry id → cover branding. `logo` is inline SVG (satori renders it
// natively; currentColor takes the ink colour) — registries without a
// mark fall back to the Poppins wordmark.
function BrightLocalMark({ height = 36 }: { height?: number }) {
  // Official wordmark (Ali, 17 Jul) — viewBox 128×24, camelCased for JSX.
  return (
    <svg
      aria-label="BrightLocal"
      fill="none"
      height={height}
      viewBox="0 0 128 24"
      width={(128 / 24) * height}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        clipRule="evenodd"
        fillRule="evenodd"
        fill="#161615"
        d="M45.283 4.22403C46.4897 4.22403 47.4227 3.29104 47.4227 2.1397C47.4227 0.988358 46.4907 0 45.283 0C44.186 0 43.1986 0.987313 43.1986 2.1397C43.1986 3.29209 44.1316 4.22403 45.283 4.22403ZM43.5821 6.19866V17.8824H47.0382V6.19866H43.5821ZM25.3163 7.62478C26.1939 6.52776 27.4006 5.97925 28.8821 5.97925C30.5276 5.97925 31.844 6.58209 32.8867 7.84418C33.9294 9.0509 34.4225 10.477 34.4225 12.0682C34.4225 13.6594 33.874 15.0855 32.8313 16.2922C31.7343 17.499 30.4179 18.1572 28.7724 18.1572C27.2366 18.1572 26.0298 17.6087 25.2066 16.5116H25.1512V17.9378H21.8048V0.357313H25.2055V7.62478H25.3163ZM26.0842 14.2069C26.6327 14.7554 27.3463 15.0302 28.1685 15.0302C28.9907 15.0302 29.7043 14.7554 30.2528 14.2069C30.8013 13.6584 31.0761 12.8904 31.0761 12.0128C31.0761 11.1352 30.8013 10.4216 30.1985 9.87314C29.65 9.32463 28.9364 9.04985 28.1142 9.04985C27.2919 9.04985 26.6327 9.32463 26.0842 9.87314C25.5357 10.4216 25.2619 11.1352 25.2619 12.0128C25.2066 12.8904 25.5357 13.604 26.0842 14.2069ZM42.6501 9.54508C42.6313 9.5409 42.6136 9.53776 42.5958 9.53463V6.19866C42.4307 6.08896 42.2113 6.08896 41.9376 6.08896C40.4018 6.08896 39.1397 6.91224 38.6466 8.00926V6.19866H35.2458V17.8824H38.6466V12.9458C38.6466 10.8615 39.6339 9.4897 41.8279 9.4897C42.0839 9.4897 42.3398 9.4897 42.5958 9.53463V9.54508H42.6501ZM51.0418 18.8143C51.7 20.1307 52.7427 20.789 54.1688 20.789C55.924 20.789 57.1307 19.856 57.1307 18.0464V16.2912H57.0754C56.2521 17.3328 55.1551 17.827 53.7289 17.827C52.0834 17.827 50.7116 17.2785 49.67 16.1261C48.6273 15.0291 48.0788 13.603 48.0788 11.9575C48.0788 10.4216 48.573 8.99552 49.6146 7.84313C50.6573 6.63642 51.9737 6.03254 53.6192 6.03254C55.1007 6.03254 56.2521 6.58105 57.1851 7.62373H57.2404V6.19761H60.5869V17.9357C60.5869 19.7463 59.984 21.1724 58.8316 22.214C57.6803 23.2567 56.1434 23.7499 54.2785 23.7499C51.3709 23.7499 49.3963 22.6528 48.3546 20.4034L51.0428 18.8122V18.8143H51.0418ZM54.3328 9.0509C52.7416 9.0509 51.4806 10.2576 51.4806 11.9031C51.4806 13.6584 52.6873 14.8107 54.3328 14.8107C55.9784 14.8107 57.1851 13.6594 57.1851 11.9031C57.1851 10.2576 55.9784 9.0509 54.3328 9.0509ZM69.3076 11.41V17.9378H72.654V10.6421C72.654 9.32567 72.2706 8.22866 71.557 7.35105C70.8434 6.41806 69.8018 5.97925 68.3757 5.97925C67.9369 5.97925 67.3884 6.08896 66.7301 6.30836C66.1273 6.52776 65.6331 6.96657 65.1943 7.57045V0.357313H61.7936V17.8824H65.1943V11.3546C65.1943 10.0925 65.9079 9.10522 67.2786 9.10522C68.6494 9.10522 69.3086 10.0925 69.3086 11.409L69.3076 11.41ZM81.5952 17.827C81.1021 17.991 80.5536 18.0464 80.004 18.0464C76.9324 18.0464 75.3422 16.4009 75.3422 13.6584V9.1606H73.2579V6.19866H75.3976V2.52313H78.7983V6.19866H81.706V9.1606H78.7983V13.2196C78.7983 14.536 79.5119 15.0845 80.8284 15.0845C81.1031 15.0845 81.3769 15.0845 81.5963 14.9748V17.827H81.5952ZM82.8009 17.8824H86.257V0.357313H82.8009V17.8824ZM89.1092 7.73448C90.3713 6.52776 91.9061 5.97925 93.6613 5.97925C95.4166 5.97925 96.9524 6.58314 98.1591 7.73448C99.3658 8.88582 100.024 10.313 100.024 12.0682C100.024 13.8234 99.4212 15.3049 98.1591 16.4563C96.8981 17.6076 95.4166 18.2115 93.607 18.2115C91.7975 18.2115 90.316 17.663 89.0539 16.4563C87.8472 15.3039 87.1889 13.8778 87.1889 12.1225C87.2433 10.3673 87.8472 8.88582 89.1082 7.73448H89.1092ZM91.5781 14.2069C92.1266 14.7554 92.8401 15.0302 93.6624 15.0302C95.3079 15.0302 96.5146 13.7681 96.5146 12.0128C96.5146 11.1352 96.2399 10.4216 95.6913 9.87314C95.1428 9.32463 94.4303 8.99552 93.607 8.99552C92.7837 8.99552 92.1266 9.2703 91.577 9.87314C91.0285 10.4216 90.7537 11.1352 90.7537 12.0128C90.6994 12.8904 91.0285 13.604 91.577 14.2069H91.5781ZM100.519 12.1225C100.519 13.8778 101.068 15.3039 102.274 16.4563C103.481 17.6076 104.962 18.1572 106.772 18.2115C109.405 18.2115 111.545 16.9494 112.422 14.5913L109.405 13.3293C108.912 14.536 108.033 15.0845 106.827 15.0845C105.181 15.0845 104.03 13.8778 104.03 12.1225C104.03 10.3673 105.236 9.1606 106.827 9.1606C107.979 9.1606 108.857 9.76448 109.35 10.9158L112.366 9.65373C111.598 7.35 109.458 6.03358 106.827 6.03358C105.126 6.03358 103.591 6.58209 102.383 7.78881C101.122 8.9412 100.518 10.3673 100.518 12.1225H100.519ZM113.957 17.1688C113.189 16.5106 112.805 15.6873 112.805 14.6457V14.5903C112.805 13.2185 113.463 12.1769 114.561 11.6827C115.658 11.1885 116.755 10.9691 118.016 10.9691H119.169C119.772 10.9691 120.101 10.6943 120.101 10.0915C120.101 9.26821 119.443 8.66537 118.237 8.66537C117.03 8.66537 116.207 9.21388 115.658 10.2566L113.025 8.72075C114.013 6.85582 115.822 5.92284 118.401 5.92284C121.472 5.92284 123.501 7.56836 123.501 10.64V17.8803H120.32V16.4542H120.266C119.498 17.5512 118.291 18.1551 116.755 18.1551C115.658 18.0997 114.725 17.826 113.957 17.1678V17.1688ZM120.101 13.3846V13.1099H118.017C117.03 13.1099 116.262 13.5487 116.262 14.4263C116.262 15.1942 116.865 15.633 117.743 15.633C119.224 15.633 120.101 14.6457 120.101 13.3836V13.3846ZM124.544 17.8824H128V0.357313H124.544V17.8824ZM4.85535 6.85582C5.51356 6.85582 6.04953 7.39179 6.04953 8.05C6.04953 8.70821 5.51356 9.24418 4.85535 9.24418C4.19714 9.24418 3.66118 8.70821 3.66118 8.05C3.66118 7.39179 4.19714 6.85582 4.85535 6.85582ZM4.85535 5.80269C3.61311 5.80269 2.60699 6.80881 2.60699 8.05105C2.60699 9.29328 3.61311 10.2994 4.85535 10.2994C6.09759 10.2994 7.10371 9.29328 7.10371 8.05105C7.10371 6.80881 6.09759 5.80269 4.85535 5.80269ZM14.7943 3.65358C12.5982 2.62761 10.1064 3.37776 8.78685 5.21134C7.87267 3.94403 6.40476 3.1897 4.85431 3.1897C4.18565 3.1897 3.50446 3.32866 2.84729 3.62433C0.781771 4.55627 -0.378975 6.88299 0.112069 9.09582C0.324159 10.0528 0.798487 10.8563 1.4264 11.4831L8.20804 18.2763C8.52983 18.5981 9.05222 18.5981 9.37506 18.2763L16.1567 11.4831C16.8609 10.781 17.3707 9.85537 17.5368 8.74164C17.8471 6.65 16.7115 4.54687 14.7964 3.65254L14.7943 3.65358ZM2.17237 10.734C1.77326 10.336 1.47446 9.87 1.28431 9.34866C0.937444 8.39582 0.982368 7.36358 1.41073 6.44314C1.83908 5.52373 2.60073 4.82687 3.55461 4.47896C3.97461 4.32642 4.41237 4.2491 4.85431 4.2491C6.27521 4.2491 7.60729 5.07761 8.24774 6.35955L8.26759 6.39925L8.25192 6.44105C8.01894 7.08881 7.93222 7.77 7.99282 8.46582L8.76177 17.3349L2.17132 10.734H2.17237ZM14.4454 8.05C14.4454 9.00075 13.6754 9.77075 12.7246 9.77075C11.7739 9.77075 11.0039 9.00075 11.0039 8.05C11.0039 7.09926 11.7739 6.32926 12.7246 6.32926C13.6754 6.32926 14.4454 7.09926 14.4454 8.05Z"
      />
    </svg>
  );
}
const OG_BRANDS: Record<
  string,
  { name: string; logo?: (height: number) => React.ReactNode }
> = {
  brightlocal: {
    name: "BrightLocal",
    logo: (height) => <BrightLocalMark height={height} />,
  },
};

// ─── Poppins (editorial weight pair) ─────────────────────────────────
// Google-subset trick: css2?text= returns a font subset for EXACTLY the
// glyphs we render, so the fetch is a few KB. Module-level cache keyed
// by text+weight (og lambdas stay warm). Any failure falls back to the
// default font — a plain cover beats a broken unfurl.
const FONT_CACHE = new Map<string, ArrayBuffer>();
async function poppins(
  text: string,
  weight: 500 | 700,
): Promise<ArrayBuffer | null> {
  const key = `${weight}:${text}`;
  const hit = FONT_CACHE.get(key);
  if (hit) return hit;
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Poppins:wght@${weight}&text=${encodeURIComponent(text)}`,
      // UA matters: without a browser UA Google serves legacy formats.
      { headers: { "User-Agent": "Mozilla/5.0 (Macintosh) Chrome/120" } },
    ).then((r) => r.text());
    const url = css.match(/src:\s*url\((.+?)\)/)?.[1];
    if (!url) return null;
    const data = await fetch(url).then((r) => r.arrayBuffer());
    if (FONT_CACHE.size > 64) FONT_CACHE.clear(); // unbounded titles, bounded memory
    FONT_CACHE.set(key, data);
    return data;
  } catch {
    return null;
  }
}

// Display-only glyph normalisation: tags render "exactly as typed"
// everywhere IN the product, but the cover's font subset can't cover
// all of Unicode — swap the usual suspects for well-covered twins
// (⋅ DOT OPERATOR → · MIDDLE DOT was a real tofu, 17 Jul screenshot).
// The stored tag value is untouched.
function displayText(s: string): string {
  return s
    .replace(/⋅/g, "·") // ⋅ → ·
    .replace(/[\u2000-\u200b\u202f\u205f\u3000]/g, " "); // exotic spaces
}

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
  let brandLogo: ((height: number) => React.ReactNode) | undefined;
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

      // Client-facing shares lead with the client (brand seam above).
      const brandEntry = OG_BRANDS[projectRow?.registry_id ?? ""];
      brand = brandEntry?.name ?? brand;
      brandLogo = brandEntry?.logo;
      footer = projectRow?.name ?? "";

      if (share.scope) {
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

  // Editorial type: Poppins 700 for the title, 500 for the furniture.
  // Subsets fetched per exact text (a few KB); null → default font.
  const displayTitle = displayText(title);
  const uiText = `${brand}${footer}0123456789 screensMade with Grade`;
  const [titleFont, uiFont] = await Promise.all([
    poppins(displayTitle, 700),
    poppins(uiText, 500),
  ]);
  const fonts = [
    ...(titleFont
      ? [{ name: "Poppins", data: titleFont, weight: 700 as const, style: "normal" as const }]
      : []),
    ...(uiFont
      ? [{ name: "Poppins", data: uiFont, weight: 500 as const, style: "normal" as const }]
      : []),
  ];

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
          fontFamily: fonts.length ? "Poppins, sans-serif" : "sans-serif",
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
              {/* Real mark when the registry has one; wordmark otherwise. */}
              {brandLogo ? brandLogo(36) : brand}
            </div>
            {/* Just the facet dot — the tag's colour as a quiet accent;
                the old SHARED SCREENS kicker labelled the obvious. */}
            <div
              style={{
                display: "flex",
                width: 14,
                height: 14,
                borderRadius: 99,
                backgroundColor: accent,
              }}
            />
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

        {/* Title block — the PROJECT as a proper eyebrow over the share
            title (it was whispering in the footer). */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {footer ? (
            <div
              style={{
                display: "flex",
                fontSize: 32,
                fontWeight: 500,
                color: "#6b6b67",
                letterSpacing: -0.5,
              }}
            >
              {footer}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              fontSize: displayTitle.length > 26 ? 64 : 84,
              fontWeight: 700,
              color: "#161615",
              letterSpacing: -2,
              lineHeight: 1.05,
              maxWidth: 1000,
            }}
          >
            {displayTitle}
          </div>
          {memberCount !== null && (
            <div style={{ display: "flex" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 18px",
                  borderRadius: 99,
                  border: "2px solid #e7e7e3",
                  backgroundColor: "#ffffff",
                  fontSize: 26,
                  color: "#6b6b67",
                }}
              >
                {memberCount} screen{memberCount === 1 ? "" : "s"}
              </div>
            </div>
          )}
        </div>

        {/* Footer: maker's mark only — the project moved up top. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            fontSize: 22,
            color: "#8a8a86",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            Made with Grade
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined },
  );
}
