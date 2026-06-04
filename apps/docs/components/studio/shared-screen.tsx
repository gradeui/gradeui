"use client";

/**
 * SharedScreen — the read-only render behind a /s/<token> share link.
 *
 * Reuses the exact same iframe renderer as Studio (FastIframeHost), so a
 * shared screen looks identical to the editor — same components, same
 * compile path, same theme.
 *
 * The Grade share toolbar carries the brand + a live theme / light-dark
 * switcher: the viewer can flip the SAME screen through different
 * treatments instantly (the renderer re-skins on a theme prop change,
 * no reload). Hide it all with `.` for a clean full-bleed view. This is
 * the "controls" shelf that'll grow more tweakers over time.
 */

import * as React from "react";
import {
  Sun,
  Moon,
  PanelTopClose,
  PanelTopOpen,
  ChevronDown,
  Check,
  MessageSquare,
  X,
  Send,
  Maximize,
  Smartphone,
  Tablet,
  Monitor,
  Play,
  Pause,
} from "lucide-react";
import { FastIframeHost } from "@/components/studio/fast-frame";
import { GradeLogo } from "@/components/grade-logo";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type {
  CommentThreadWithMessages,
  ShareViewport,
} from "@/lib/studio-storage";
import { getStudioStorage } from "@/lib/studio-storage";
import type { User } from "@/lib/studio-users";
import { useSupabaseAuth } from "@/components/supabase-provider";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@gradeui/ui";
import {
  generateTheme,
  builtInThemes,
  defaultThemeId,
  listThemes,
} from "@/lib/themes";
import type { ThemeInput, GeneratedTheme } from "@/lib/themes";
import { cn } from "@/lib/utils";
import {
  ARTBOARD_DEVICE_SIZES,
  ZOOM_LEVELS,
  useArtboardZoom,
} from "@/components/studio/use-artboard-zoom";

/** Zoom levels + device artboards now live in use-artboard-zoom.ts —
 *  the single implementation shared with the focused canvas (which
 *  ported this view's treatment). `responsive` still fills the canvas;
 *  device presets frame a fixed w×h artboard. Portrait only for now —
 *  an orientation switch (swap w/h) lands later. Part of the share
 *  contract: the creator's pick is persisted on the link. */
const DEVICE_SIZES = ARTBOARD_DEVICE_SIZES;
const DEVICE_OPTIONS: {
  id: ShareViewport;
  label: string;
  icon: typeof Maximize;
}[] = [
  { id: "responsive", label: "Responsive", icon: Maximize },
  { id: "mobile", label: "Mobile", icon: Smartphone },
  { id: "tablet", label: "Tablet", icon: Tablet },
  { id: "desktop", label: "Desktop", icon: Monitor },
];

/** Mini swatch for the theme menu. Shows the BRAND colours (primary +
 *  accent) and skips the neutral stop — including grey made every chip
 *  read muted regardless of how bold the theme actually is. */
function ThemeSwatch({ theme }: { theme: GeneratedTheme }) {
  return (
    <span
      className="flex h-4 shrink-0 items-center overflow-hidden rounded-sm border border-border/60"
      aria-hidden
    >
      <span className="h-full w-2.5" style={{ background: `oklch(${theme.ramps.primary[600]})` }} />
      <span className="h-full w-2.5" style={{ background: `oklch(${theme.ramps.accent[500]})` }} />
    </span>
  );
}

export function SharedScreen({
  appSource,
  themeDraftJson,
  mode: initialMode = "light",
  viewport: initialViewport = "responsive",
  screenName = "Screen",
  projectName = "Untitled project",
  canComment = false,
  commentThreads = [],
  commentUsers = [],
}: {
  appSource: string | null;
  themeDraftJson: string | null;
  mode?: "light" | "dark";
  viewport?: ShareViewport;
  screenName?: string;
  projectName?: string;
  canComment?: boolean;
  commentThreads?: CommentThreadWithMessages[];
  commentUsers?: User[];
}) {
  // The project's own theme — the default treatment the share opens on.
  const projectTheme = React.useMemo<GeneratedTheme>(() => {
    if (themeDraftJson) {
      try {
        return generateTheme(JSON.parse(themeDraftJson) as ThemeInput);
      } catch {
        /* fall through */
      }
    }
    return builtInThemes[defaultThemeId];
  }, [themeDraftJson]);

  // Switchable set: the project theme first, then the public bundle
  // (deduped by id). "Browse all" / curated A/B sets layer on later.
  const themes = React.useMemo<GeneratedTheme[]>(() => {
    const map = new Map<string, GeneratedTheme>();
    map.set(projectTheme.id, projectTheme);
    for (const t of listThemes()) if (!map.has(t.id)) map.set(t.id, t);
    return [...map.values()];
  }, [projectTheme]);

  const [activeThemeId, setActiveThemeId] = React.useState(projectTheme.id);
  const [mode, setMode] = React.useState<"light" | "dark">(initialMode);
  const [chromeVisible, setChromeVisible] = React.useState(true);
  // Motion toggle. true = animate (still respects the viewer's OS
  // reduced-motion, reduce-only); false = force still. Forwarded to
  // FastIframeHost as the `motion` prop → grade:set-motion.
  const [motionOn, setMotionOn] = React.useState(true);
  const [viewport, setViewport] = React.useState<ShareViewport>(
    initialViewport,
  );
  const isFixedDevice = viewport !== "responsive";
  const activeDevice =
    DEVICE_OPTIONS.find((d) => d.id === viewport) ?? DEVICE_OPTIONS[0];

  // Responsive content-height artboard — identical behaviour to the
  // focused canvas: the same-origin iframe reports its rendered
  // scrollHeight; a page meaningfully taller than the viewer's window
  // becomes a full-height artboard, so Fit frames the ENTIRE scrolling
  // page. Pages that fit keep the plain fill. Stale heights reset on
  // viewport flips (min-h-screen pages can't shrink their own
  // scrollHeight — re-probe from the fill state instead).
  const [contentH, setContentH] = React.useState<number | null>(null);
  React.useEffect(() => {
    setContentH(null);
  }, [viewport]);
  const resolveDeviceSize = React.useCallback(
    (canvas: { w: number; h: number }) => {
      if (viewport !== "responsive") return DEVICE_SIZES[viewport];
      if (
        contentH !== null &&
        canvas.w > 0 &&
        canvas.h > 0 &&
        contentH > canvas.h + 8
      ) {
        return { w: Math.max(320, canvas.w - 64), h: contentH };
      }
      return undefined;
    },
    [viewport, contentH],
  );

  // Zoom + Fit — the shared artboard-zoom implementation (also drives
  // the focused canvas). Owns canvas measurement, the fit math, and
  // the pick/step/fit gestures. The share opens at 100% (defaultFit
  // false) — the creator framed the screen; honour it.
  const {
    canvasRef: screenRef,
    deviceSize,
    zoom,
    fitMode,
    effectiveZoom,
    pickZoom,
    stepZoom,
    fit,
  } = useArtboardZoom({ deviceSize: resolveDeviceSize });
  // True whenever an artboard is framed — a fixed device preset OR the
  // responsive content-height artboard. Drives the card layout below.
  const framed = Boolean(deviceSize);

  // Comments — pins shown by default when the screen has any. Reading is
  // open to anyone with the link; replying requires a signed-in viewer.
  const { user: viewer } = useSupabaseAuth();
  const [threads, setThreads] = React.useState(commentThreads);
  const hasComments = threads.length > 0;
  const [showComments, setShowComments] = React.useState(true);
  const [activeThreadId, setActiveThreadId] = React.useState<string | null>(
    null,
  );
  const [replyText, setReplyText] = React.useState("");
  const [posting, setPosting] = React.useState(false);
  const getCommentUser = React.useCallback(
    (id: string) => commentUsers.find((u) => u.id === id),
    [commentUsers],
  );
  const activeThread =
    threads.find((t) => t.thread.id === activeThreadId) ?? null;

  const handlePostReply = React.useCallback(async () => {
    const t = threads.find((x) => x.thread.id === activeThreadId);
    if (!t || !replyText.trim() || !viewer) return;
    setPosting(true);
    try {
      const comment = await getStudioStorage().addComment({
        projectId: t.thread.projectId,
        designId: t.thread.designId,
        threadId: t.thread.id,
        authorId: viewer.id,
        body: replyText.trim(),
      });
      setThreads((prev) =>
        prev.map((x) =>
          x.thread.id === t.thread.id
            ? { ...x, comments: [...x.comments, comment] }
            : x,
        ),
      );
      setReplyText("");
    } catch (err) {
      toast.error("Couldn't post comment", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setPosting(false);
    }
  }, [threads, activeThreadId, replyText, viewer]);

  const activeTheme =
    themes.find((t) => t.id === activeThemeId) ?? projectTheme;

  // Keyboard shortcuts (parent-focus only — keys pressed while focus is
  // inside the rendered iframe stay in that realm). Figma-ish:
  //   .        hide / show the UI
  //   0        fit to screen
  //   1–4      jump to a zoom level (100 / 90 / 75 / 50)
  //   − / =    step zoom out / in through the levels
  //   C        toggle comments
  //   M        toggle motion (animate / hold still)
  React.useEffect(() => {
    const jump = pickZoom;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case ".":
          e.preventDefault();
          setChromeVisible((v) => !v);
          break;
        case "c":
        case "C":
          setShowComments((v) => !v);
          break;
        case "m":
        case "M":
          setMotionOn((v) => !v);
          break;
        case "0":
          fit();
          break;
        case "1":
          jump(1);
          break;
        case "2":
          jump(0.9);
          break;
        case "3":
          jump(0.75);
          break;
        case "4":
          jump(0.5);
          break;
        case "-":
        case "_":
          stepZoom(-1);
          break;
        case "=":
        case "+":
          stepZoom(1);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // pickZoom / stepZoom / fit are stable useCallbacks from the hook.
  }, [pickZoom, stepZoom, fit]);

  const iconBtn =
    "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground";
  const segBtn =
    "inline-flex h-5 w-6 items-center justify-center rounded-sm transition";

  return (
    <div
      className={cn(
        "flex h-screen w-screen flex-col overflow-hidden bg-background",
        mode === "dark" && "dark",
      )}
      data-mode={mode}
    >
      {/* ── Glass toolbar — in flow on top, so it never covers the
          screen at 100%. Reads as a floating glass bar via the margin
          + translucency. ── */}
      {chromeVisible ? (
        <header className="relative z-[70] m-2 flex h-11 shrink-0 items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/70 px-3 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/55">
          {/* Brand + name */}
          <div className="flex min-w-0 items-center gap-2.5">
            <GradeLogo size={20} className="shrink-0 text-foreground" />
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="truncate text-sm font-medium text-foreground">
                {screenName}
              </span>
              <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                {projectName}
              </span>
            </div>
          </div>

          {/* Controls shelf — theme menu, light/dark, zoom. Grows over
              time (more "tweakers"). */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Theme — glass dropdown with names */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  title="Theme"
                  className="flex h-7 items-center gap-1.5 rounded-md border border-border/60 px-2 text-xs text-foreground transition hover:bg-foreground/10"
                >
                  <ThemeSwatch theme={activeTheme} />
                  <span className="hidden max-w-[8rem] truncate sm:inline">
                    {activeTheme.name}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="z-[80] max-h-[60vh] w-52 overflow-y-auto border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/65"
              >
                {themes.map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => setActiveThemeId(t.id)}
                    className="gap-2"
                  >
                    <ThemeSwatch theme={t} />
                    <span className="flex-1 truncate">{t.name}</span>
                    {t.id === activeThemeId && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Light / dark */}
            <div className="flex items-center rounded-md border border-border/60 p-0.5">
              <button
                type="button"
                onClick={() => setMode("light")}
                aria-pressed={mode === "light"}
                title="Light"
                className={cn(
                  segBtn,
                  mode === "light"
                    ? "bg-foreground/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setMode("dark")}
                aria-pressed={mode === "dark"}
                title="Dark"
                className={cn(
                  segBtn,
                  mode === "dark"
                    ? "bg-foreground/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Device — fixed-size presets on a glass menu. Part of the
                share contract: the creator's pick travels on the link. */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  title="Device"
                  className="hidden h-7 items-center gap-1.5 rounded-md border border-border/60 px-2 text-xs text-foreground transition hover:bg-foreground/10 sm:flex"
                >
                  <activeDevice.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="hidden max-w-[6rem] truncate md:inline">
                    {activeDevice.label}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="z-[80] min-w-[10rem] border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/65"
              >
                {DEVICE_OPTIONS.map((d) => (
                  <DropdownMenuItem
                    key={d.id}
                    onClick={() => setViewport(d.id)}
                    className="gap-2"
                  >
                    <d.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="flex-1 truncate">{d.label}</span>
                    {d.id !== "responsive" && (
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        {(() => {
                          const s =
                            DEVICE_SIZES[
                              d.id as Exclude<ShareViewport, "responsive">
                            ];
                          return `${s.w}×${s.h}`;
                        })()}
                      </span>
                    )}
                    {d.id === viewport && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Zoom — discrete down-levels on a glass menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  title="Zoom"
                  className="hidden h-7 items-center gap-1 rounded-md border border-border/60 px-2 text-xs tabular-nums text-foreground transition hover:bg-foreground/10 sm:flex"
                >
                  {fitMode ? "Fit" : `${Math.round(effectiveZoom * 100)}%`}
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="z-[80] min-w-[6rem] border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/65"
              >
                {/* Fit — computed scale that frames the whole artboard.
                    Only meaningful with a fixed device (responsive already
                    fills); shown always for muscle-memory but it just maps
                    to 100% in responsive. */}
                <DropdownMenuItem
                  onClick={fit}
                  className="gap-2 tabular-nums"
                >
                  <span className="flex-1">Fit</span>
                  {fitMode && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                  )}
                </DropdownMenuItem>
                {ZOOM_LEVELS.map((z) => (
                  <DropdownMenuItem
                    key={z}
                    onClick={() => pickZoom(z)}
                    className="gap-2 tabular-nums"
                  >
                    <span className="flex-1">{Math.round(z * 100)}%</span>
                    {!fitMode && z === zoom && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Motion — pause/resume animation (shaders, ThreeScene, CSS).
                Mirrors ThreeScene's own play/pause vocabulary. Reduce-only:
                the viewer's OS reduced-motion is honoured regardless. */}
            <button
              type="button"
              onClick={() => setMotionOn((v) => !v)}
              aria-pressed={!motionOn}
              title={motionOn ? "Pause motion (press M)" : "Play motion (press M)"}
              aria-label={motionOn ? "Pause motion" : "Play motion"}
              className={cn(iconBtn, !motionOn && "bg-foreground/10 text-foreground")}
            >
              {motionOn ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>

            {hasComments && (
              <button
                type="button"
                onClick={() => setShowComments((v) => !v)}
                aria-pressed={showComments}
                title="Comments (press C)"
                className={cn(
                  iconBtn,
                  showComments && "bg-foreground/10 text-foreground",
                )}
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setChromeVisible(false)}
              title="Hide UI (press .)"
              aria-label="Hide UI"
              className={iconBtn}
            >
              <PanelTopClose className="h-4 w-4" />
            </button>
          </div>
        </header>
      ) : (
        <button
          type="button"
          onClick={() => setChromeVisible(true)}
          title="Show UI (press .)"
          aria-label="Show UI"
          className="absolute right-2 top-2 z-[70] inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-background/70 text-muted-foreground shadow-sm backdrop-blur-md hover:text-foreground"
        >
          <PanelTopOpen className="h-4 w-4" />
        </button>
      )}

      {/* ── Rendered screen — fills below the bar (never obscured). A
          studio-style dot grid shows on zoom-out so the screen reads as
          sitting in a constrained canvas; zoom scales from the centre. ── */}
      <div
        // Measured wrapper — stable (overflow hidden), so Fit never
        // couples to scrollbar appearance on the scroller below
        // (that feedback loop oscillates; see use-artboard-zoom.ts).
        ref={screenRef}
        className="relative min-h-0 flex-1 overflow-hidden"
      >
      <div
        className="h-full w-full bg-muted/15"
        style={{
          // Fit guarantees the artboard fits — overflow:hidden there so
          // a sub-pixel rounding overflow can't toggle the scrollbar and
          // shift the centred artboard sideways (the jiggle the canvas
          // had). stable both-edges keeps centring symmetric in the
          // manual-zoom modes where scrolling is legitimate.
          overflow: fitMode ? "hidden" : "auto",
          scrollbarGutter: fitMode ? undefined : "stable both-edges",
          backgroundImage:
            "radial-gradient(circle, color-mix(in oklab, var(--foreground) 22%, transparent) 1px, transparent 1.6px)",
          backgroundSize: "16px 16px",
        }}
      >
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <p className="animate-pulse text-sm text-muted-foreground">
            Loading preview…
          </p>
        </div>

        {/* Annotation — appears on zoom-out, labelling the screen as it
            sits in space. */}
        {effectiveZoom < 1 && (
          <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur-md">
              <span className="font-medium text-foreground">{screenName}</span>
              <span className="opacity-40">·</span>
              <span className="tabular-nums">
                {fitMode ? "Fit" : `${Math.round(effectiveZoom * 100)}%`}
              </span>
            </span>
          </div>
        )}

        {/* The zoom transform + device width go on the IFRAME itself.
            Inline comments (pins injected into the iframe's own DOM) mean
            there are no parent-realm fixed pins for a transformed ancestor
            to scale — so we're free to wrap + centre the artboard. `framed`
            covers a fixed device preset AND the responsive content-height
            artboard; plain responsive (page fits the window) fills as
            before. */}
        <div
          className={cn(
            framed
              ? // Top-aligned + padded so a tall device (e.g. mobile 844)
                // scrolls naturally from the top rather than being clipped
                // by vertical centring; short devices just sit near the top.
                "flex min-h-full w-full justify-center items-start p-8"
              : "h-full w-full",
          )}
        >
          <FastIframeHost
            appSource={appSource}
            theme={activeTheme}
            mode={mode}
            motion={motionOn}
            commentThreads={showComments ? threads : undefined}
            getCommentUser={getCommentUser}
            // Inline mode — pins are injected into the iframe's live DOM by
            // the sandbox, so they ride scroll + the zoom transform below
            // natively. No fade-on-zoom needed (that was a workaround for
            // the parent overlay chasing rects), and crucially they are
            // never written into appSource / the stored source.
            inlineComments
            activeCommentThreadId={activeThreadId}
            onCommentPinClick={(id) =>
              setActiveThreadId((cur) => (cur === id ? null : id))
            }
            // Responsive only — feeds the content-height artboard above.
            onContentHeight={
              viewport === "responsive" ? setContentH : undefined
            }
            className={cn(
              "block",
              framed ? "shrink-0" : "h-full w-full",
              // Card treatment when framed as an artboard, or sitting
              // "in space" (zoomed out).
              (framed || effectiveZoom < 1) &&
                "rounded-xl ring-1 ring-border/40",
            )}
            style={{
              width: deviceSize?.w,
              height: deviceSize?.h,
              transform: `scale(${effectiveZoom})`,
              transformOrigin: framed ? "top center" : "center center",
              // Gentle overshoot-and-settle on DELIBERATE zoom picks;
              // snapping back to 100% gets an even subtler curve. Fit
              // recomputes continuously during a browser resize —
              // animating those makes the artboard spring-chase the
              // window, so Fit tracks instantly.
              transition: fitMode
                ? "box-shadow 220ms ease"
                : `transform 340ms ${
                    effectiveZoom === 1
                      ? "cubic-bezier(0.33, 1.08, 0.68, 1)"
                      : "cubic-bezier(0.33, 1.25, 0.68, 1)"
                  }, box-shadow 220ms ease`,
              boxShadow:
                framed || effectiveZoom < 1
                  ? "0 25px 50px -12px rgb(0 0 0 / 0.35)"
                  : undefined,
            }}
          />
        </div>
      </div>
      </div>

      {/* Comment thread popover — opens when a pin is clicked. Read for
          anyone; reply for signed-in viewers. Sits above pins, below the
          toolbar. (Anchoring to the pin + masking come next.) */}
      {activeThread && (
        <div className="absolute right-2 top-16 z-[65] flex max-h-[70vh] w-80 flex-col overflow-hidden rounded-lg border border-border/60 bg-background/80 shadow-xl backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
          <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
            <span className="truncate text-xs font-medium text-foreground">
              {activeThread.thread.componentName ??
                activeThread.thread.elementLabel}
            </span>
            <button
              type="button"
              onClick={() => setActiveThreadId(null)}
              aria-label="Close"
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {activeThread.comments.map((c) => {
              const u = getCommentUser(c.authorId);
              return (
                <div key={c.id} className="flex gap-2">
                  <Avatar size="xs">
                    {u?.avatarUrl && (
                      <AvatarImage src={u.avatarUrl} alt={u?.name ?? ""} />
                    )}
                    <AvatarFallback className="text-[10px]">
                      {(u?.name ?? "?").slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-foreground">
                      {u?.name ?? "Someone"}
                    </div>
                    <div className="whitespace-pre-wrap break-words text-xs text-muted-foreground">
                      {c.body}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {viewer ? (
            <div className="border-t border-border/60 p-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Reply…"
                rows={2}
                className="w-full resize-none rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground/30"
              />
              <div className="mt-1.5 flex justify-end">
                <button
                  type="button"
                  onClick={handlePostReply}
                  disabled={posting || !replyText.trim()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  <Send className="h-3 w-3" />
                  {posting ? "Posting…" : "Reply"}
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
              Sign in to reply.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
