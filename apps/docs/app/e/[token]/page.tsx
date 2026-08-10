/**
 * Public embed route — /e/<token>.
 *
 * Server component, sibling to /s/<token>. Validates a share token with
 * the SERVICE-ROLE client (no user session), then returns ONLY the one
 * screen the token points at: its source (latest revision, or a pinned
 * revision) plus the project's theme. Renders chrome-free via EmbedScreen
 * so it can be dropped into any site inside a sandboxed iframe.
 *
 * Reuses the share-link record — an embed IS a share link with a leaner
 * presentation shell. Comments are NOT fetched: an embed is read-or-tweak,
 * never annotate. See STUDIO-CAPTURE.md (consumer 3) + STUDIO-EMBED.md.
 */

import { notFound } from "next/navigation";
import { getServiceSupabase } from "@/lib/supabase/service";
import { resolveProjectAppIconUrl } from "@/lib/project-app-icon";
import { EmbedScreen, type CameraShot } from "@/components/studio/embed-screen";
import { FlatScreen } from "@/components/studio/flat-screen";

/**
 * Parse the human-readable `camera` param into a shot list. Shots are
 * separated by `;`; each is `zoom,cx,cy,hold,trans` where hold/trans are in
 * SECONDS and cx/cy/hold/trans are optional. Whitespace is tolerated.
 *
 *   camera=1 ; 2,0.3,0.2,2.5 ; 1,0.5,0.5,1.5
 *   → full view (hold 2s default), glide to 2× on (0.3,0.2) hold 2.5s,
 *     glide back to full, loop.
 */
function parseCameraParam(raw: string | undefined): CameraShot[] | undefined {
  if (!raw) return undefined;
  const n = (v: string | undefined, d: number): number => {
    const x = Number((v ?? "").trim());
    return Number.isFinite(x) ? x : d;
  };
  const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
  const shots = raw
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const p = s.split(",");
      return {
        zoom: Math.max(0.01, n(p[0], 1)),
        cx: clamp01(n(p[1], 0.5)),
        cy: clamp01(n(p[2], 0.5)),
        holdMs: Math.max(0, n(p[3], 2)) * 1000,
        transMs: Math.max(0, n(p[4], 0.8)) * 1000,
      };
    });
  return shots.length > 0 ? shots : undefined;
}

export const dynamic = "force-dynamic";

/** Tab title — kept in lockstep with the share view (/s/<token>):
 *  "Screen — Project · Grade". Light second query; the page itself
 *  re-validates the token, this only names the tab. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = getServiceSupabase();
  if (!supabase) return { title: "Shared screen · Grade" };
  const { data: link } = await supabase
    .from("share_links")
    .select("project_id, design_id, revoked")
    .eq("token", token)
    .maybeSingle();
  if (!link || link.revoked || !link.design_id)
    return { title: "Shared screen · Grade" };
  const [{ data: design }, { data: project }, appIconUrl] = await Promise.all([
    supabase.from("designs").select("name").eq("id", link.design_id).maybeSingle(),
    supabase.from("projects").select("name").eq("id", link.project_id).maybeSingle(),
    // Same conditional app icon as the share view: when the project has
    // an app-icon asset, an embed opened directly (or added to a home
    // screen) wears the client's mark; otherwise site defaults.
    resolveProjectAppIconUrl(supabase, link.project_id),
  ]);
  const screen = (design as { name: string } | null)?.name ?? "Screen";
  const proj = (project as { name: string } | null)?.name ?? "Grade";
  return {
    title: `${screen} — ${proj} · Grade`,
    appleWebApp: { capable: true, title: screen, statusBarStyle: "default" },
    other: { "mobile-web-app-capable": "yes" },
    ...(appIconUrl
      ? { icons: { apple: [{ url: appIconUrl, sizes: "512x512" }] } }
      : {}),
  };
}

interface ShareLinkRow {
  token: string;
  project_id: string;
  design_id: string | null;
  revision_id: string | null;
  mode: "view" | "comment";
  color_mode: "light" | "dark";
  revoked: boolean;
  expires_at: number | null;
}

export default async function EmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { token } = await params;

  // Optional fixed-resolution sizing. `?w=1280` renders the screen at that
  // virtual width (breakpoints fire at 1280) and scales it to fill the box;
  // adding `&h=800` switches to an exact contain-fit artboard. Width alone
  // is enough — no `w` means the embed renders responsive (reflows to the
  // iframe width). Values must be positive finite numbers.
  const sp = await searchParams;
  const toDim = (v: string | string[] | undefined): number | undefined => {
    const n = Number(Array.isArray(v) ? v[0] : v);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  const renderWidth = toDim(sp.w);
  const renderHeight = toDim(sp.h);

  // Optional motion toggle: ?motion=off suppresses animation (ThreeScene
  // pauses, CSS animation stills); ?motion=on removes the suppression
  // (still respects the viewer's OS reduced-motion). Absent = leave the
  // iframe to its own OS default. Reduce-only.
  const motionRaw = Array.isArray(sp.motion) ? sp.motion[0] : sp.motion;
  const motion =
    motionRaw === "off" ? false : motionRaw === "on" ? true : undefined;

  // Optional color-mode override: ?mode=dark|light wins over the share
  // link's stored color_mode. Lets one share link serve both a dark
  // marketing page and a light docs page without minting twice.
  const modeRaw = Array.isArray(sp.mode) ? sp.mode[0] : sp.mode;
  const colorModeOverride =
    modeRaw === "dark" || modeRaw === "light" ? modeRaw : undefined;

  // Embed-local theme playground: ?tweak=1 exposes every control,
  // ?tweak=theme,mode a subset. Renders a small settings overlay (see
  // EmbedTweaker); all changes stay inside the embed.
  const tweakRaw = Array.isArray(sp.tweak) ? sp.tweak[0] : sp.tweak;
  const TWEAKS = ["theme", "hue", "density", "mode"] as const;
  const tweak =
    tweakRaw === "1" || tweakRaw === "all"
      ? [...TWEAKS]
      : typeof tweakRaw === "string" && tweakRaw.length > 0
        ? tweakRaw
            .split(",")
            .map((t) => t.trim())
            .filter((t): t is (typeof TWEAKS)[number] =>
              (TWEAKS as readonly string[]).includes(t),
            )
        : null;

  // Start the playground OPEN: ?tweakopen=1. An already-open panel is
  // a louder invitation than a corner button (it still closes and
  // reopens normally). Only meaningful alongside ?tweak=.
  const tweakOpenRaw = Array.isArray(sp.tweakopen)
    ? sp.tweakopen[0]
    : sp.tweakopen;
  const tweakOpen = tweakOpenRaw === "1" || tweakOpenRaw === "true";

  // Click-to-interact shield: ?shield=1 guards clicks until the
  // visitor opts in, rendered inside the embed so every host gets it
  // without any host-side code. Page scroll over the frame still works
  // (the embed forwards unconsumed wheel deltas to its parent).
  const shieldRaw = Array.isArray(sp.shield) ? sp.shield[0] : sp.shield;
  const shield = shieldRaw === "1" || shieldRaw === "true";

  // Curated theme set for the playground's picker: ?themes=calm,candy-pop
  // limits the choices to a deliberate, contrasting selection. Unknown
  // ids are dropped client-side.
  const themesRaw = Array.isArray(sp.themes) ? sp.themes[0] : sp.themes;
  const tweakThemes =
    typeof themesRaw === "string" && themesRaw.length > 0
      ? themesRaw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : null;

  // Render fidelity: ?fidelity=wireframe starts the embed with imagery
  // cross-faded out and MediaSurface's tiered placeholders showing — the
  // "structure, not pictures" view. ?fidelitytoggle=1 adds a corner chip
  // so the visitor can flip sides themselves (the param above picks the
  // starting side). The swap is pure CSS inside the sandbox (the
  // "MediaSurface fidelity" rules in @gradeui/ui globals.css), so it
  // costs nothing when unused.
  const fidelityRaw = Array.isArray(sp.fidelity) ? sp.fidelity[0] : sp.fidelity;
  const fidelity = fidelityRaw === "wireframe" ? "wireframe" : "full";
  const fidelityToggleRaw = Array.isArray(sp.fidelitytoggle)
    ? sp.fidelitytoggle[0]
    : sp.fidelitytoggle;
  const fidelityToggle =
    fidelityToggleRaw === "1" || fidelityToggleRaw === "true";

  // Hover-measure inspector: ?inspect=1 starts the embed with the
  // read-only measure overlay on (hover any element → outline + part
  // name + size in virtual px). ?inspecttoggle=1 adds the "Measure"
  // chip so visitors can flip it themselves. The "show my workings"
  // mode for portfolio embeds.
  const inspectRaw = Array.isArray(sp.inspect) ? sp.inspect[0] : sp.inspect;
  const inspect = inspectRaw === "1" || inspectRaw === "true";
  const inspectToggleRaw = Array.isArray(sp.inspecttoggle)
    ? sp.inspecttoggle[0]
    : sp.inspecttoggle;
  const inspectToggle =
    inspectToggleRaw === "1" || inspectToggleRaw === "true";

  // Transparent embed: ?bg=transparent strips the page backdrop, the
  // letterbox fill, and the sandbox document's background, so the host
  // page shows through wherever the screen doesn't paint.
  const bgRaw = Array.isArray(sp.bg) ? sp.bg[0] : sp.bg;
  const transparent = bgRaw === "transparent";

  // Canvas colour: any ?bg= value other than "transparent" is the
  // canvas/letterbox fill behind the screen (hex sent url-encoded, e.g.
  // bg=%23e8743c, or an oklch()/rgb() string). Empty → the DS token.
  const canvasColor =
    !transparent && typeof bgRaw === "string" && bgRaw.length > 0
      ? bgRaw
      : undefined;

  // ?pad=24 insets the screen from the canvas edge (the screen floats with
  // that much canvas fill around it); ?radius=16 rounds the viewport corners.
  // Both in px; only meaningful in fixed (w[/h]) mode.
  const pad = toDim(sp.pad);
  const radius = toDim(sp.radius);

  // Viewport switcher: ?viewports=desktop,tablet,mobile renders a control
  // that swaps the virtual width/height at runtime (real breakpoints fire).
  // Tokens are named presets or raw `WxH`. ?viewportsauto=1 auto-cycles them.
  const VIEWPORT_PRESETS: Record<
    string,
    { label: string; w: number; h: number }
  > = {
    desktop: { label: "Desktop", w: 1280, h: 832 },
    laptop: { label: "Laptop", w: 1024, h: 720 },
    tablet: { label: "Tablet", w: 834, h: 1112 },
    mobile: { label: "Mobile", w: 390, h: 844 },
  };
  const viewportsRaw = Array.isArray(sp.viewports)
    ? sp.viewports[0]
    : sp.viewports;
  const viewports =
    typeof viewportsRaw === "string" && viewportsRaw.length > 0
      ? viewportsRaw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .map((t) => {
            const preset = VIEWPORT_PRESETS[t.toLowerCase()];
            if (preset) return { id: t, ...preset };
            const m = t.match(/^(\d+)x(\d+)$/i);
            if (m)
              return {
                id: t,
                label: `${m[1]}×${m[2]}`,
                w: Number(m[1]),
                h: Number(m[2]),
              };
            return null;
          })
          .filter(
            (v): v is { id: string; label: string; w: number; h: number } =>
              v !== null,
          )
      : null;
  const viewportsAutoRaw = Array.isArray(sp.viewportsauto)
    ? sp.viewportsauto[0]
    : sp.viewportsauto;
  const viewportsAuto =
    viewportsAutoRaw === "1" || viewportsAutoRaw === "true";
  // ?viewportsdelay= ms held per viewport; ?viewportsloops= full passes
  // before the auto-cycle settles and stops (0/absent = until interaction).
  const viewportsDelay = toDim(sp.viewportsdelay);
  const viewportsLoopsRaw = Array.isArray(sp.viewportsloops)
    ? sp.viewportsloops[0]
    : sp.viewportsloops;
  const viewportsMaxLoops = (() => {
    const n = Number(viewportsLoopsRaw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
  })();

  // ?flat=1 — the "live URL": the screen rendered DIRECTLY in the page,
  // no FastIframeHost, no nested page boot. Breakpoints come from the
  // real viewport (the capturer sets it; a browser window just is one).
  // Exists for Playwright captures (posters, preview_image) — the
  // iframe-nested render raced every capture heuristic we ever wrote;
  // this one stamps `data-grade-ready` instead. See flat-screen.tsx.
  const flatRaw = Array.isArray(sp.flat) ? sp.flat[0] : sp.flat;
  const flat = flatRaw === "1" || flatRaw === "true";

  // Optional zoom + focal point: ?zoom=2&cx=0.5&cy=0.3 magnifies the screen
  // and centres that point (fractions of the screen) in the box — so you can
  // spotlight a detail and let the host box crop to it. Defaults: no zoom,
  // centred.
  const num = (
    v: string | string[] | undefined,
    fallback: number,
  ): number => {
    const n = Number(Array.isArray(v) ? v[0] : v);
    return Number.isFinite(n) ? n : fallback;
  };
  const zoom = num(sp.zoom, 1);
  const focusX = num(sp.cx, 0.5);
  const focusY = num(sp.cy, 0.5);
  const camera = parseCameraParam(
    Array.isArray(sp.camera) ? sp.camera[0] : sp.camera,
  );

  const supabase = getServiceSupabase();
  if (!supabase) notFound();

  // NOTE: select stays in lockstep with the live schema — migration 0017
  // dropped the singular `viewport` column (the embed sizes via ?w/?h
  // instead, and the spec-model `viewports` doc is a share-view concern).
  // Selecting a dropped column errors, and a swallowed error here reads
  // as "no such share" → 404 for every embed. That exact bug shipped
  // June 2026 (caught by the MCP preview_screen loop); surface the error
  // so the next schema drift is a log line, not a silent global 404.
  const { data: link, error: linkError } = await supabase
    .from("share_links")
    .select(
      "token, project_id, design_id, revision_id, mode, color_mode, revoked, expires_at, scope",
    )
    .eq("token", token)
    .maybeSingle();
  if (linkError) {
    // eslint-disable-next-line no-console
    console.error("[embed] share_links lookup failed:", linkError.message);
  }

  const share = link as ShareLinkRow | null;
  if (!share || share.revoked) notFound();
  if (share.expires_at && share.expires_at < Date.now()) notFound();
  if (!share.design_id) notFound();

  // Trail entry — coarse "embed viewed". Anonymous viewers have no user,
  // so this writes with the service role and a null actor. Best-effort:
  // a failed log must never break the render.
  try {
    await supabase.from("events").insert({
      actor_id: null,
      project_id: share.project_id,
      design_id: share.design_id,
      action: "embed.view",
      target_kind: "share",
      target_id: share.token,
    });
  } catch {
    /* trail gaps are acceptable; broken embeds are not */
  }

  // Source: a pinned revision if set, else the screen's current state.
  let appSource: string | null = null;
  if (share.revision_id) {
    const { data: rev } = await supabase
      .from("screen_revisions")
      .select("app_source")
      .eq("id", share.revision_id)
      .maybeSingle();
    appSource = (rev as { app_source: string | null } | null)?.app_source ?? null;
  } else {
    const { data: design } = await supabase
      .from("designs")
      .select("state")
      .eq("id", share.design_id)
      .maybeSingle();
    const state = (design as { state: { appSource?: string | null } | null } | null)
      ?.state;
    appSource = state?.appSource ?? null;
  }

  // Project theme + registry — the treatment the embed renders in, and
  // WHICH renderer renders it (external registries take the ext:*
  // kernel inside EmbedScreen, same contract as the share view).
  const { data: project } = await supabase
    .from("projects")
    .select("theme_draft_json, registry_id")
    .eq("id", share.project_id)
    .maybeSingle();
  const projectRow = project as {
    theme_draft_json: string | null;
    registry_id: string | null;
  } | null;
  const themeDraftJson = projectRow?.theme_draft_json ?? null;
  const registryId = projectRow?.registry_id ?? null;

  // Flow map — ALL screens in the share's project, in canvas order
  // (STUDIO-FLOWS, same fetch as /s/[token]). The token still NAMES one
  // screen (the entry); siblings are traversable only via author-wired
  // data-grade-goto links inside the rendered JSX.
  const { data: flowRows } = await supabase
    .from("designs")
    .select("id, name, state")
    .eq("project_id", share.project_id)
    .order("position", { ascending: true });
  // Scope (STUDIO-TAGS T2) — same member filter as /s/[token]: a
  // scoped share's embed exposes only member screens (tag resolved at
  // view time, explicit ids frozen, entry always included).
  const scope = (share as unknown as {
    scope: { tag?: { type: string; value: string }; screens?: string[] } | null;
  }).scope;
  const inScope = (r: { id: string; state: unknown }): boolean => {
    if (!scope) return true;
    if (r.id === share.design_id) return true;
    if (scope.screens?.includes(r.id)) return true;
    if (scope.tag) {
      const tags = (r.state as {
        tags?: { type: string; value: string }[] | null;
      } | null)?.tags;
      return (tags ?? []).some(
        (t) => t.type === scope.tag!.type && t.value === scope.tag!.value,
      );
    }
    return false;
  };
  const flowScreens = ((flowRows ?? []) as {
    id: string;
    name: string;
    state: unknown;
  }[])
    .filter(inScope)
    .map((r) => ({
      id: r.id,
      name: r.name,
      appSource:
        ((r.state as { appSource?: string | null } | null)?.appSource ?? null),
    }));
  const isExternalRegistry = Boolean(registryId) && registryId !== "gradeui";

  // Project shared components (shared_components table, migration 0025)
  // — screens import them via "@project/components"; both renderers
  // (FlatScreen direct-compile and the FastIframeHost inside
  // EmbedScreen) need the sources. Table-missing (migration not yet
  // applied) degrades to none rather than breaking every embed.
  let sharedModules: Record<string, string> | null = null;
  {
    const { data: componentRows, error: componentsError } = await supabase
      .from("shared_components")
      .select("name, source")
      .eq("project_id", share.project_id)
      .is("deleted_at", null);
    if (!componentsError && componentRows && componentRows.length > 0) {
      sharedModules = {};
      for (const r of componentRows as { name: string; source: string }[]) {
        sharedModules[r.name] = r.source;
      }
    }
  }

  // The "live URL" / capture variant — flat render, no iframe, explicit
  // data-grade-ready contract. Zoom/camera don't apply: a capture wants
  // the screen, not the presentation rig.
  const resolvedMode = colorModeOverride ?? share.color_mode;
  // Pre-paint backdrop: the document background is styled BEFORE any
  // client JS runs, so a dark embed never flashes the default light
  // body while the screen theme boots. color-scheme keeps scrollbars /
  // form chrome in step. Rendered as a plain <style> tag because the
  // embed route uses the bare layout (no providers, no theme script).
  const backdrop = (
    <style>{`html, body { background: ${
      transparent
        ? "transparent"
        : canvasColor
          ? canvasColor
          : resolvedMode === "dark"
            ? "oklch(0.16 0.01 250.94)"
            : "oklch(0.985 0.0015 85)"
    }; color-scheme: ${resolvedMode}; }`}</style>
  );

  // FlatScreen compiles against gradeui's vocabulary (vendored Tailwind
  // + Grade theme) — an external-registry screen would render wrong or
  // not at all. Until the capture path grows a registry seam
  // (STUDIO-CAPTURE), external flat requests fall through to the LIVE
  // embed below; preview.ts's readiness check already handles non-flat
  // pages via its visible-text fallback.
  if (flat && !isExternalRegistry) {
    return (
      <>
        {backdrop}
        {/* Runtime Tailwind JIT — keeps the CAPTURE renderer's CSS
            vocabulary identical to the live sandbox. FlatScreen renders
            against the app's precompiled stylesheet, so without this an
            arbitrary class (bottom-[100px]) paints in the live embed but
            silently no-ops in every poster/screenshot — the renderers
            disagree and the posters lie. Same vendored build + same
            theme/utilities (no preflight) block as fast-sandbox. */}
        <style
          type="text/tailwindcss"
        >{`@layer theme, utilities; @import "tailwindcss/theme" layer(theme); @import "tailwindcss/utilities" layer(utilities);`}</style>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/vendor/tailwindcss-browser-4.3.0.js" />
        <FlatScreen
          appSource={appSource}
          sharedModules={sharedModules}
          themeDraftJson={themeDraftJson}
          mode={resolvedMode}
          motion={motion}
        />
      </>
    );
  }

  return (
    <>
      {backdrop}
      <EmbedScreen
        appSource={appSource}
        sharedModules={sharedModules}
        themeDraftJson={themeDraftJson}
        registryId={registryId}
        flowScreens={flowScreens}
        mode={resolvedMode}
        renderWidth={renderWidth}
        renderHeight={renderHeight}
        motion={motion}
        zoom={zoom}
        focusX={focusX}
        focusY={focusY}
        camera={camera}
        tweak={tweak}
        tweakThemes={tweakThemes}
        tweakOpen={tweakOpen}
        shield={shield}
        transparent={transparent}
        fidelity={fidelity}
        fidelityToggle={fidelityToggle}
        inspect={inspect}
        inspectToggle={inspectToggle}
        pad={pad}
        radius={radius}
        canvasColor={canvasColor}
        viewports={viewports ?? undefined}
        viewportsAuto={viewportsAuto}
        viewportsDelay={viewportsDelay}
        viewportsMaxLoops={viewportsMaxLoops}
      />
    </>
  );
}
