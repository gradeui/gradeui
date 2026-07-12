"use client";

/**
 * /studio — three-column design workbench.
 *
 * Layout:
 *   ┌──────────────┬────────────────────────┬────────────────┐
 *   │              │                        │                │
 *   │  Chat        │  Live preview (screen  │  Tabbed panel  │
 *   │  (left)      │  theme applied)        │  (Layout/Theme │
 *   │              │                        │  /Notes)       │
 *   └──────────────┴────────────────────────┴────────────────┘
 *
 * Two themes are in play, deliberately decoupled:
 *
 *   - **Chrome theme** — owned by GradeThemeProvider higher up the
 *     tree. Drives the docs site's CSS variables on `:root`. Switched
 *     via the chrome popover (GradeThemeSwitcher) + the chrome's
 *     ThemeToggle.
 *   - **Screen theme** — owned by a page-level ThemeBuilderProvider
 *     (`bindTo="draft"`). Drives the preview iframes only — no
 *     `:root` mutation. The Theme tab in the right column is the
 *     editor for this; the canvas reads `useGeneratedTheme()` and
 *     `useThemeBuilderMode()` to pipe theme + mode into the iframe.
 *
 * The screen theme seeds once from whatever chrome theme is active
 * when Studio mounts. After that, the two diverge — chrome changes
 * don't reseed the screens, and screen edits don't touch the chrome.
 *
 * The right column is a tabbed shell (`StudioRightTabs`):
 *
 *   - Layout (default) — stage-aware: reference-layout starter picker
 *     when the design is empty, page-structure placeholder when not,
 *     the StudioSettingsPanel when a DS component is selected in the
 *     preview.
 *   - Theme — picker (registered themes) + the full builder controls
 *     (mode, hue sliders, typography, shape, components). All wired
 *     to the page-level ThemeBuilderProvider.
 *   - Comments — per-design comment threads.
 *
 * Session-level settings (provider/model picker, theme + light/dark
 * mode, AI chat display toggles, dev toggles, version line) live
 * behind a gear icon in the topbar that opens `<StudioSettings>` —
 * a right-side Sheet. The topbar itself is intentionally near-empty;
 * everything else has been pulled out of the chrome.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { UIMessage } from "ai";
import * as React from "react";
import {
  LogOut,
  Loader2,
  Settings as SettingsIcon,
  ShieldCheck,
  Users as UsersIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AppShell,
  AppShellMain,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  CheckboxCard,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@gradeui/ui";
import { useChatSettings } from "@/components/ai-elements/provider-picker";
import { StudioChat } from "@/components/studio/studio-chat";
import { StudioCanvas } from "@/components/studio/studio-canvas";
import { StudioRightTabs, StylesTabContent } from "@/components/studio/studio-right-tabs";
import type { ViewportWidth } from "@/components/studio/sandpack-frame";
import {
  StudioSettings,
  StudioSettingsTrigger,
  type RendererMode,
} from "@/components/studio/studio-settings";
import { useGradeTheme } from "@/components/grade-theme-provider";
import { GradeMark } from "@/components/grade-mark";
import {
  ThemeBuilderProvider,
  useGeneratedTheme,
  useThemeBuilderMode,
} from "@/components/theme-builder";
import {
  studioInput,
  type GeneratedTheme,
  type ThemeInput,
  type ThemeVariant,
} from "@/lib/themes";
import { cloneInput } from "@/lib/studio-state";
import {
  stripSourceIds,
  type StudioSelection,
} from "@/lib/chat-sandpack";
import { buildSystemPrompt } from "@gradeui/studio/playbook";
import { setActiveProjectRegistry } from "@/lib/active-registry";
import { useActiveRegistry } from "@/lib/use-active-registry";
import {
  createDesign,
  designKind,
  initialDesigns,
  starterMotionSource,
  type Design,
  type DesignKind,
} from "@/lib/studio-designs";
import {
  useUndoHistory,
  pruneHistoryStorage,
  readRevisionCount,
} from "@/lib/use-undo-history";
import { GRADEUI_VERSION, STUDIO_VERSION } from "@/lib/versions";
import {
  getStudioStorage,
  type CommentThreadWithMessages,
  type Membership,
  type OrgMembership,
  type Organisation,
  type Project,
  type ProjectSnapshot,
  type ShareViewport,
  type ShareViewportSpec,
  SHARE_VIEWPORT_PRESETS,
  type Team,
  type User as StoredUser,
} from "@/lib/studio-storage";
import { VersionConflictError } from "@/lib/studio-storage/types";
import {
  ProjectsMenu,
  type ProjectSection,
  type StylesSection,
} from "@/components/studio/projects-menu";
import { AssetBrowser } from "@/components/studio/asset-browser";
import { GradeLoader } from "@/components/ui/grade-loader";
import { ProjectHome } from "@/components/studio/project-home";
import { NewProjectDialog } from "@/components/studio/new-project-dialog";
import { ConfirmDeleteDialog } from "@/components/studio/confirm-delete-dialog";
import {
  InvitePeopleDialog,
  type InviteRole,
} from "@/components/studio/invite-people-dialog";
import { SuperAdminSheet } from "@/components/studio/super-admin-sheet";
import { ThemeDraftPersister } from "@/components/studio/theme-draft-persister";
import {
  LOCAL_ORG_ID,
  LOCAL_USER_ID,
  UserSessionProvider,
  useCanAccess,
  useCurrentOrg,
  useCurrentUser,
  useImpersonation,
} from "@/lib/studio-users";
import { CommentsTab } from "@/components/studio/comments-tab";
import { useSupabaseAuth } from "@/components/supabase-provider";
import { toast } from "sonner";
// Side-effect import: seeds the @gradeui/walker registry with the
// playbook's ALLOWED_COMPONENTS so the Send-to-Figma JSON is built
// with the right known-names set. See lib/studio-walker-register.ts.
import "@/lib/studio-walker-register";

// The system prompt now lives in `@gradeui/studio/playbook` — same text
// previously duplicated here and in `app/chat/page.tsx`. See `buildSystemPrompt`
// above in the import list.

export default function StudioPage() {
  const [settings, updateSettings] = useChatSettings();
  const { theme: siteTheme, isDark: chromeIsDark } = useGradeTheme();
  // Per-project registry: the memo depends on the ACTIVE registry (the
  // project-registry effect below flips the override when the active
  // project changes), so switching to a BrightLocal project rebuilds
  // the prompt with BL's package/allowlist/rules.
  const activeRegistry = useActiveRegistry();
  const systemPrompt = useMemo(
    () => buildSystemPrompt(activeRegistry),
    [activeRegistry],
  );

  // The screen-level draft theme — seeded once from whatever chrome
  // theme is active when Studio mounts. After that, the Theme tab in
  // the right column owns it independently (see ThemePickerSection +
  // ThemeBuilderControls). bindTo="draft" so slider edits don't
  // mutate `:root` — the canvas reads useGeneratedTheme() and applies
  // the result inside the preview iframe only. Switching the chrome
  // theme via GradeThemeSwitcher does NOT reseed the draft, by
  // design — chrome and screens are deliberately decoupled here.
  //
  // Defensive `?? studioInput`: while `siteTheme.input` is typed as
  // required, the first render before GradeThemeProvider hydrates
  // could in principle return a value without it. Studio is the
  // chrome default so it's also the safest screen-baseline fallback.
  const screenThemeBaseline = useMemo<ThemeInput>(
    () => cloneInput(siteTheme.input ?? studioInput),
    // Intentional single-shot seed — see comment block above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Multiple in-memory design slots. Switching between them changes which
  // chat + preview are active; the theme stays shared because a design
  // system's whole point is consistency across pages. Not persisted yet —
  // refreshing the page resets to one blank slot.
  const [designs, setDesigns] = useState<Design[]>(() => initialDesigns());
  const [activeId, setActiveId] = useState<string>(() => designs[0].id);

  // Canvas focus. Declared up here (above the URL-sync and bootstrap
  // effects that read it) to stay out of the temporal dead zone. "all" =
  // project home / no screen focused (the default landing); "fit" =
  // zoomed into a screen. The left + right panels and the URL's ?screen
  // param all follow this. Bootstrap flips it to "fit" only when the URL
  // carries a ?screen.
  const [zoom, setZoom] = useState<"fit" | "all">("all");

  // ─── Display section state (lifted out of the canvas) ────────────
  // Viewport width for the focused frame. Owned here so the right
  // panel's Display section can render the device selector while the
  // canvas reads the value (resolveArtboardSize / focused-frame
  // width). Persisted to localStorage (key "studio:viewport-width") —
  // SSR-deterministic default, hydrate-after-mount, skip-first-persist
  // — verbatim from where it used to live in StudioCanvas.
  const [viewportWidth, setViewportWidth] =
    useState<ViewportWidth>("responsive");
  const viewportHydratedRef = useRef(false);
  useEffect(() => {
    if (viewportHydratedRef.current) return;
    viewportHydratedRef.current = true;
    try {
      const stored = window.localStorage.getItem("studio:viewport-width");
      if (
        stored === "mobile" ||
        stored === "tablet" ||
        stored === "desktop" ||
        stored === "responsive"
      ) {
        setViewportWidth(stored);
      }
    } catch {
      // storage unavailable — keep the responsive default
    }
  }, []);
  const viewportPersistArmedRef = useRef(false);
  useEffect(() => {
    if (!viewportPersistArmedRef.current) {
      viewportPersistArmedRef.current = true;
      return;
    }
    try {
      window.localStorage.setItem("studio:viewport-width", viewportWidth);
    } catch {
      // storage unavailable (private mode etc.) — viewport just won't stick
    }
  }, [viewportWidth]);

  // Bridged artboard-zoom state + gestures. The useArtboardZoom hook
  // stays inside StudioCanvas (it measures the canvas DOM); the canvas
  // mirrors its live state up via onZoomStateChange and exposes the
  // mutation gestures via onZoomApiReady so the Display section can
  // render the zoom menu.
  const [zoomState, setZoomState] = useState<{
    effectiveZoom: number;
    fitMode: boolean;
  }>({ effectiveZoom: 1, fitMode: true });
  const [zoomApi, setZoomApi] = useState<{
    pickZoom: (z: number) => void;
    stepZoom: (d: number) => void;
    fit: () => void;
  } | null>(null);

  // Which section of the active project the grid is showing — the left
  // nav's Screens / Flows (tbd) / Motions / Styles rows. Filters the
  // "all" grid by design kind; "styles" routes to the theme tab and
  // leaves the grid on screens. Resets on project switch (effect below,
  // keyed on activeProjectId).
  const [projectSection, setProjectSection] = useState<ProjectSection>(
    "screens",
  );
  // Active Design System sub-section (Colors / Typography / Spacing). Only
  // meaningful while projectSection === "styles"; drives the sidebar sub-rows
  // and the project-level Design System page.
  const [stylesSection, setStylesSection] = useState<StylesSection>("general");
  // Persist the Design System sub-section across reloads (localStorage,
  // grade-* namespace). SSR-safe: default "general", hydrate in an effect to
  // avoid a hydration mismatch (see "localStorage in useState init" note).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("grade-ds-section");
      if (
        saved === "general" ||
        saved === "colours" ||
        saved === "typography" ||
        saved === "spacing" ||
        saved === "components"
      ) {
        setStylesSection(saved);
      }
    } catch {
      // localStorage unavailable — keep the default.
    }
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem("grade-ds-section", stylesSection);
    } catch {
      // ignore — non-persistent is fine.
    }
  }, [stylesSection]);

  // Per-design undo / redo for `appSource` (JSX). The hook is
  // self-persisting via localStorage keyed by `designId`, and reseeds
  // automatically when the user switches designs. We push to the
  // history every time appSource changes (chat output, panel edit,
  // fill, etc.) with a label describing the action — the label shows
  // in the undo button's tooltip and the future timeline view.
  //
  // Why appSource-only for v1: it's where 90% of meaningful state
  // lives. Per-design URL maps + overrides are a follow-on snapshot
  // dimension; including them is the natural next step once this
  // path is verified. For today, undoing the JSX is the right
  // primary surface.
  const undoHistory = useUndoHistory<string | null>(activeId);
  // Silent fallback to the first design if activeId goes stale. The
  // useEffect below logs this in dev so we can spot it instead of it
  // hiding a desync between the canvas, the chat, and the tab strip.
  const activeDesign = designs.find((d) => d.id === activeId) ?? designs[0];

  // Dev-only drift warning. If activeId ever points to a design that no
  // longer exists in the list, the fallback above renders designs[0]'s
  // data under a stale id — which is exactly the symptom that shows up
  // as "header says Screen 1, chat says empty, tile grid looks fine".
  // Logging loudly gives us a signal in the console the moment it
  // happens, so we don't have to guess. Production gets no-op.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!designs.some((d) => d.id === activeId)) {
      // eslint-disable-next-line no-console
      console.warn(
        "[studio] activeId points to a missing design — falling back to designs[0].",
        { activeId, designIds: designs.map((d) => d.id) }
      );
    }
  }, [activeId, designs]);

  // Live-broadcast each design's source AND name to localStorage
  // under a stable key so any open "Open preview" tab can re-render
  // via the `storage` event and set its own document.title. JSON
  // shape is { source, name } so the preview can show the screen
  // name in the browser tab too.
  //
  // Cleanup happens in handleCloseDesign so closed designs don't
  // leave orphan entries.
  useEffect(() => {
    if (typeof window === "undefined") return;
    for (const d of designs) {
      const key = `grade:screen:${d.id}`;
      try {
        if (d.appSource) {
          const next = JSON.stringify({ source: d.appSource, name: d.name });
          // Only write when the serialized payload actually changed.
          // `storage` events don't fire in the writer's own tab but
          // they DO fire in every other same-origin tab, so a noisy
          // write would re-render every open preview unnecessarily.
          if (window.localStorage.getItem(key) !== next) {
            window.localStorage.setItem(key, next);
          }
        } else {
          window.localStorage.removeItem(key);
        }
      } catch {
        // storage disabled / quota — silent fallback; the snapshot
        // already in the preview tab stays valid.
      }
    }
  }, [designs]);

  // Per-design chat history. `useChat` from @ai-sdk/react@2 doesn't persist
  // messages by id across remounts — it builds a fresh `Chat` every time.
  // So when the user flips between design tabs (which remounts StudioChat
  // via its `key`), we'd lose the conversation unless we kept a copy up
  // here and replayed it as `initialMessages`.
  //
  // Keyed by designId; value is the latest UIMessage[] the chat has emitted.
  const [messagesByDesign, setMessagesByDesign] = useState<
    Record<string, UIMessage[]>
  >({});

  // Which designs are currently generating. Shown as a spinner overlay on
  // the preview column whenever the active design is streaming — the design
  // tabs could also grow a pulsing dot later if it ever becomes useful.
  const [streamingByDesign, setStreamingByDesign] = useState<
    Record<string, boolean>
  >({});

  // Speculative mid-stream drafts, per design. Render-only — never
  // persisted, never in undo history. StudioChat emits an auto-closed
  // partial of the still-open ```jsx fence while streaming (when the
  // "Stream response text" toggle is on); Fast Frame compiles it
  // silently so the app draws as tokens arrive. Cleared (null) when
  // the stream settles and the sealed source lands via appSource.
  const [draftByDesign, setDraftByDesign] = useState<
    Record<string, string | null>
  >({});

  // Per-design preview selection — the element the user picked via the
  // "Select" tool in the preview header. Lives up here (rather than inside
  // StudioPreview or StudioChat) because BOTH columns need it:
  //   - StudioPreview drives the in-iframe overlay state from it.
  //   - StudioChat renders the selection chip + snapshots it into the
  //     outgoing request body.
  // Clearing happens on chip-×, on preview-toggle-off, and implicitly after
  // send (StudioChat calls onClearSelection in handleSend).
  const [selectionByDesign, setSelectionByDesign] = useState<
    Record<string, StudioSelection | null>
  >({});

  // Per-design free-form notes — the "Notes" tab in the right column
  // is bound to `notesByDesign[activeId]`. Plain string per design;
  // not persisted across page reloads yet (same model as the other
  // per-design state maps). Cleaned up alongside the others in
  // handleCloseDesign so closed designs don't leak.
  // Retained for snapshot persistence/undo compatibility even though
  // the Notes tab has been removed from the right column — closed
  // designs are still cleaned out of this map and snapshots still
  // round-trip it. No UI writes to it anymore.
  const [notesByDesign, setNotesByDesign] = useState<Record<string, string>>(
    {},
  );

  // Projects — the layer above designs. A Project owns a set of
  // screens (designs), each with its own chat history + notes, plus
  // (in the future) its own theme draft. The page holds the project
  // index and the currently-loaded project; everything else flows
  // through the StudioStorage adapter so swapping localStorage for
  // Supabase later is a one-file change.
  const storage = useMemo(() => getStudioStorage(), []);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Point the module-level registry override at the active project's
  // registryId (null = deployment default). This is THE per-project
  // registry switch: everything that reads getActiveRegistry() /
  // useActiveRegistry() — prompt, renderer pick, contracts, selection
  // attributes, exporters — follows the active project from here.
  const activeProjectRegistryId =
    projects.find((p) => p.id === activeProjectId)?.registryId ?? null;
  useEffect(() => {
    setActiveProjectRegistry(activeProjectRegistryId);
  }, [activeProjectRegistryId]);

  // Author id for comments/threads. In cloud mode this MUST be the
  // signed-in Supabase user id — `created_by` / `author_id` /
  // `resolved_by` are uuid columns, so the local seed id "u-local"
  // would be rejected (22P02). Falls back to the local stub only when
  // signed out (local-only mode).
  const { user: commentAuthUser } = useSupabaseAuth();
  const commentAuthorId = commentAuthUser?.id ?? LOCAL_USER_ID;

  // Persist an immutable revision snapshot when a screen change seals
  // (a generation or an in-canvas edit). This is the durable spine:
  // comments bind to the latest revision, so they survive
  // regeneration. Fire-and-forget — never block the edit on the write.
  const persistRevision = useCallback(
    (designId: string, source: string | null, label: string) => {
      if (!activeProjectId || !source) return;
      void storage
        .addRevision({
          projectId: activeProjectId,
          designId,
          appSource: source,
          label,
          authorId: commentAuthorId,
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.warn("[studio] addRevision failed:", err);
        });
    },
    [activeProjectId, storage, commentAuthorId],
  );

  // Teams + memberships are the collaboration substrate. Loaded
  // once on bootstrap from the storage adapter — today that's the
  // local Personal team + a single admin membership row for the
  // local user; tomorrow Supabase returns the user's full team
  // graph. The permission resolver (resolveEffectiveRole / canAccess)
  // walks BOTH lists to figure out what the current user can do on
  // a given project, so any UI that gates write actions takes
  // these as inputs.
  const [teams, setTeams] = useState<Team[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  // Users + orgs + org memberships are loaded alongside teams. The
  // SuperAdminSheet enumerates from these; UserSessionProvider
  // resolves impersonation against them.
  const [allUsers, setAllUsers] = useState<StoredUser[]>([]);
  const [allOrgs, setAllOrgs] = useState<Organisation[]>([]);
  const [orgMemberships, setOrgMemberships] = useState<OrgMembership[]>([]);

  // Per-project theme draft, serialised as JSON. Loaded from
  // snapshots on bootstrap, updated by ThemeDraftPersister
  // (which lives inside ThemeBuilderProvider and reports input
  // changes upward), persisted on every saveProject. The active
  // project's entry is used as `initial` for the
  // ThemeBuilderProvider; switching projects keys the provider on
  // activeProjectId so it remounts with the new initial.
  const [themeDraftJsonByProject, setThemeDraftJsonByProject] = useState<
    Record<string, string>
  >({});

  // Per-project saved theme variants, serialised as a ThemeVariant[]
  // JSON array (migration 0013). Loaded from snapshots on bootstrap,
  // edited via the Styles tab, persisted on saveProject — the exact
  // themeDraftJson path one tier up (a set of named themes rather than
  // the single working draft). See STUDIO-THEMES.md T1.
  const [themeVariantsJsonByProject, setThemeVariantsJsonByProject] = useState<
    Record<string, string>
  >({});

  // Comment threads for the active screen. Loaded on
  // (activeProjectId, activeId) change via the storage adapter;
  // mutated through the handlers below which always re-read after
  // a write so the UI mirrors persisted state. Empty array while
  // loading or for screens with no comments.
  const [commentThreads, setCommentThreads] = useState<
    CommentThreadWithMessages[]
  >([]);
  React.useEffect(() => {
    if (!activeProjectId || !activeId) {
      setCommentThreads([]);
      return;
    }
    let cancelled = false;
    storage
      .listThreads(activeProjectId, activeId)
      .then((rows) => {
        if (!cancelled) setCommentThreads(rows);
      })
      .catch(() => {
        if (!cancelled) setCommentThreads([]);
      });
    return () => {
      cancelled = true;
    };
  }, [activeProjectId, activeId, storage]);

  const refreshCommentThreads = useCallback(async () => {
    if (!activeProjectId || !activeId) return;
    const rows = await storage.listThreads(activeProjectId, activeId);
    setCommentThreads(rows);
  }, [activeProjectId, activeId, storage]);

  const handleCreateThread = useCallback(
    async (input: {
      anchorId: string;
      anchorKind: "source" | "instance";
      elementLabel: string;
      componentName?: string;
      body: string;
    }) => {
      if (!activeProjectId || !activeId) return;
      await storage.createThread({
        ...input,
        projectId: activeProjectId,
        designId: activeId,
        authorId: commentAuthorId,
      });
      await refreshCommentThreads();
    },
    [storage, activeProjectId, activeId, commentAuthorId, refreshCommentThreads],
  );

  const handleAddReply = useCallback(
    async (
      threadId: string,
      parentCommentId: string | undefined,
      body: string,
    ) => {
      if (!activeProjectId || !activeId) return;
      await storage.addComment({
        projectId: activeProjectId,
        designId: activeId,
        threadId,
        parentCommentId,
        authorId: commentAuthorId,
        body,
      });
      await refreshCommentThreads();
    },
    [storage, activeProjectId, activeId, commentAuthorId, refreshCommentThreads],
  );

  // Share a screen — opens the share-options dialog (viewport specs)
  // instead of minting immediately. The dialog's Create button calls
  // confirmShareScreen below, which mints the link and copies
  // /s/<token>. Cloud-only — the local adapter throws a clear message
  // at create time.
  //
  // `pendingShare.specs` are the viewport rows the share will EXPOSE:
  // the four presets plus any custom sizes the creator adds (named,
  // arbitrary W×H, orientation). The viewport the creator is on can't
  // be toggled off (a share must open on something they were looking
  // at). Per-share THEME assignment will slot into this same dialog
  // (see STUDIO-THEMES.md).
  type ShareSpecRow = ShareViewportSpec & { enabled: boolean };
  const [pendingShare, setPendingShare] = useState<{
    designId: string;
    initialId: string;
    specs: ShareSpecRow[];
  } | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [customDraft, setCustomDraft] = useState({ label: "", w: "", h: "" });
  // The minted link, kept on screen so the creator can copy it again.
  // `stale` flips when options change AFTER minting — the footer then
  // offers Regenerate (which revokes the old token and mints a fresh
  // one, so a locked-down link can't be widened after the fact).
  const [createdShare, setCreatedShare] = useState<{
    token: string;
    url: string;
    stale: boolean;
  } | null>(null);
  const markShareStale = useCallback(
    () => setCreatedShare((c) => (c && !c.stale ? { ...c, stale: true } : c)),
    [],
  );
  const handleShareScreen = useCallback(
    (designId: string, viewport?: ShareViewport) => {
      if (!activeProjectId) return;
      setCustomDraft({ label: "", w: "", h: "" });
      setCreatedShare(null);
      setPendingShare({
        designId,
        initialId: viewport ?? "responsive",
        specs: SHARE_VIEWPORT_PRESETS.map((s) => ({ ...s, enabled: true })),
      });
    },
    [activeProjectId],
  );
  const confirmShareScreen = useCallback(async () => {
    if (!pendingShare || !activeProjectId) return;
    setShareBusy(true);
    try {
      // Regenerating? Kill the old link first — otherwise a recipient
      // keeps the wider/older viewport set forever.
      if (createdShare) {
        try {
          await storage.revokeShareLink(createdShare.token);
        } catch {
          /* best-effort — a dangling revoked-anyway link is harmless */
        }
      }
      const specs = pendingShare.specs
        .filter((s) => s.enabled)
        .map(({ enabled: _enabled, ...spec }) => spec);
      const link = await storage.createShareLink({
        projectId: activeProjectId,
        designId: pendingShare.designId,
        colorMode: chromeIsDark ? "dark" : "light",
        viewports: { initialId: pendingShare.initialId, specs },
      });
      const url = `${window.location.origin}/s/${link.token}`;
      await navigator.clipboard.writeText(url);
      setCreatedShare({ token: link.token, url, stale: false });
      toast.success("Share link copied", { description: url });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error("Couldn't create share link", { description: message });
    } finally {
      setShareBusy(false);
    }
  }, [pendingShare, storage, activeProjectId, chromeIsDark, createdShare]);

  // Invite someone to the active project. POSTs to /api/invitations,
  // which creates the invite event + emails a tokenised /accept-invite
  // link. On accept, the recipient gets a project_access grant (see
  // accept-invite/actions) and the project surfaces under "Shared with
  // you" in their Projects menu. When Resend isn't configured (local
  // dev), the API still mints the token — we copy the accept link to
  // the clipboard so the flow is testable without email.
  const [inviteOpen, setInviteOpen] = useState(false);
  const handleInvite = useCallback(
    async ({ email, role }: { email: string; role: InviteRole }) => {
      if (!activeProjectId) {
        toast.error("Open a project before inviting people");
        throw new Error("no active project");
      }
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: activeProjectId, email, role }),
      });
      const data = (await res.json().catch(() => null)) as
        | {
            ok?: boolean;
            token?: string;
            emailStatus?: string;
            emailError?: string;
            error?: string;
          }
        | null;
      if (!res.ok || !data?.ok) {
        const message = data?.error ?? `Invite failed (${res.status})`;
        toast.error("Couldn't send invite", { description: message });
        throw new Error(message);
      }
      // Email wired + sent → just confirm. Otherwise hand over the
      // accept link so the owner can share it manually.
      if (data.emailStatus === "sent") {
        toast.success("Invite sent", { description: email });
      } else {
        const acceptUrl = data.token
          ? `${window.location.origin}/accept-invite/${data.token}`
          : undefined;
        if (acceptUrl) {
          try {
            await navigator.clipboard.writeText(acceptUrl);
          } catch {
            /* clipboard may be blocked — toast still shows the URL */
          }
        }
        toast.success("Invite created — link copied", {
          description:
            acceptUrl ?? "Email isn't configured, but the invite was created.",
        });
      }
    },
    [activeProjectId],
  );

  const handleResolveThread = useCallback(
    async (threadId: string) => {
      if (!activeProjectId || !activeId) return;
      await storage.resolveThread({
        projectId: activeProjectId,
        designId: activeId,
        threadId,
        userId: commentAuthorId,
      });
      await refreshCommentThreads();
    },
    [storage, activeProjectId, activeId, commentAuthorId, refreshCommentThreads],
  );

  const handleReopenThread = useCallback(
    async (threadId: string) => {
      if (!activeProjectId || !activeId) return;
      await storage.reopenThread({
        projectId: activeProjectId,
        designId: activeId,
        threadId,
      });
      await refreshCommentThreads();
    },
    [storage, activeProjectId, activeId, refreshCommentThreads],
  );

  const handleDeleteThread = useCallback(
    async (threadId: string) => {
      if (!activeProjectId || !activeId) return;
      await storage.deleteThread({
        projectId: activeProjectId,
        designId: activeId,
        threadId,
      });
      await refreshCommentThreads();
    },
    [storage, activeProjectId, activeId, refreshCommentThreads],
  );

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (!activeProjectId || !activeId) return;
      await storage.deleteComment({
        projectId: activeProjectId,
        designId: activeId,
        commentId,
      });
      await refreshCommentThreads();
    },
    [storage, activeProjectId, activeId, refreshCommentThreads],
  );
  // Mirrors the project id whose state is reflected in the
  // designs/messages/notes maps right now. While a switch is in
  // flight, this lags behind activeProjectId — the persistence
  // effect uses the lag as a "don't save yet" signal.
  const [loadedProjectId, setLoadedProjectId] = useState<string | null>(null);
  // First-load gate. Stays false until bootstrap has resolved the active
  // project AND applied its snapshot, so we can cover the un-hydrated chrome
  // with a clean loader instead of flashing the empty, broken-looking shell
  // (composer + "All screens" header over a blank canvas) on refresh.
  const [booted, setBooted] = useState(false);

  // ── Persistence guard ───────────────────────────────────────────────
  // `lastSavedSig` is the content signature of what's currently durable in
  // storage. The autosave only writes when the live signature differs, so
  // (a) loading a project never re-saves the just-loaded state (which is
  // what was overwriting newer edits), and (b) we stop hammering storage on
  // every keystroke. Reset to `null` on load/switch so the first settle
  // records the baseline without writing. `saveTimer` debounces the write;
  // `flushFn` holds the latest "save now if dirty" closure for unmount /
  // tab-hide.
  // `lastSavedStructSig` covers the COARSE, multi-row shape: which
  // screens exist + their order, active screen pointer, message counts,
  // notes, theme draft. A change here routes to the whole-project
  // `saveProject`. `lastSavedBodyById` covers each screen's editable
  // BODY (name / status / appSource) — a change to one screen routes to a
  // single-row `saveScreen(projectId, design)` so a padding tweak writes
  // one row, not a 5-table rewrite (STUDIO-PERSISTENCE.md, P1). Both are
  // reset on load/switch so the first settle records the baseline without
  // writing.
  const lastSavedStructSigRef = useRef<string | null>(null);
  const lastSavedBodyByIdRef = useRef<Record<string, string>>({});
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushSaveRef = useRef<() => void>(() => {});
  // Drives the saved/saving/error chip in the canvas toolbar. A failed
  // write parks on "error" until the next success — never silent (P4).
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const savedFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cross-project metadata for the Projects menu — design list
  // (names only, not appSource) plus per-design turn + revision
  // counts. Lets every project surface its expanded children
  // without forcing the active project's full state to balloon
  // out into all projects. Maintained two ways:
  //   1. On bootstrap, loaded from storage for every project.
  //   2. For the ACTIVE project, derived live from the in-memory
  //      designs / messagesByDesign so the user sees fresh counts
  //      as soon as a turn lands or a screen is added.
  type ProjectSummary = {
    designs: { id: string; name: string; kind?: DesignKind }[];
    /** User-message count per design id. */
    turnsByDesign: Record<string, number>;
    /** Undo-history snapshot count per design id. */
    revisionsByDesign: Record<string, number>;
  };
  const [projectSummaries, setProjectSummaries] = useState<
    Record<string, ProjectSummary>
  >({});

  // Bootstrap — pull the project index, resolve the active project,
  // hydrate designs/messages/notes from its snapshot. Runs once on
  // mount; the storage adapter's own migration step seeds the
  // "Default project" if there's no v2 data yet.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await storage.listProjects();
      if (cancelled) return;
      // Empty index shouldn't happen — the adapter's migration
      // guarantees at least the Default project. Belt-and-braces
      // guard so a corrupted index doesn't leave Studio blank.
      if (list.length === 0) {
        const seeded = await storage.createProject({
          name: "Default project",
        });
        if (cancelled) return;
        setProjects([seeded]);
        await storage.setActiveProjectId(seeded.id);
        setActiveProjectId(seeded.id);
        const snap = await storage.loadProject(seeded.id);
        if (cancelled || !snap) return;
        applySnapshot(snap);
        setLoadedProjectId(seeded.id);
        setBooted(true);
        return;
      }
      setProjects(list);
      const stored = await storage.getActiveProjectId();
      // URL takes precedence over storage-pointer — so a shared
      // link or a back/forward landing on this page lands on the
      // referenced project + screen, not on whatever was open last.
      const urlParams =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search)
          : null;
      const urlProject = urlParams?.get("project");
      const urlScreen = urlParams?.get("screen");
      // ?section=motions|styles — restore the left-nav section on
      // refresh ("screens" is the unwritten default).
      const urlSection = urlParams?.get("section");
      if (
        urlSection === "motions" ||
        urlSection === "styles" ||
        urlSection === "assets"
      ) {
        setProjectSection(urlSection);
      }
      const targetId =
        (urlProject && list.some((p) => p.id === urlProject) && urlProject) ||
        (stored && list.some((p) => p.id === stored) && stored) ||
        list[0].id;
      const snap = await storage.loadProject(targetId);
      if (cancelled || !snap) return;
      // Override the loaded project's persisted activeDesignId with
      // the URL's screen param when it resolves to a real design —
      // same precedence rule applies one level down.
      const focusFromUrl = Boolean(
        urlScreen && snap.designs.some((d) => d.id === urlScreen),
      );
      const initialDesignId = focusFromUrl ? urlScreen! : snap.activeDesignId;
      // A ?screen in the URL means "open focused on this screen"; no
      // screen param means "land on the project home" (no focus). This
      // is what lets removing ?screen keep you on the home rather than
      // bouncing back into a screen.
      setZoom(focusFromUrl ? "fit" : "all");
      // Seed the active project's theme draft BEFORE flipping
      // activeProjectId — these batch into one render, so the keyed
      // ThemeBuilderProvider mounts with the saved theme on its FIRST
      // render. It ignores later `initial` changes, so without this a
      // refresh reverts to the baseline theme (the saved draft loaded
      // a tick too late to be picked up).
      if (snap.themeDraftJson) {
        const draft = snap.themeDraftJson;
        setThemeDraftJsonByProject((cur) =>
          cur[targetId] === draft ? cur : { ...cur, [targetId]: draft },
        );
      }
      if (snap.themeVariantsJson) {
        const variants = snap.themeVariantsJson;
        setThemeVariantsJsonByProject((cur) =>
          cur[targetId] === variants ? cur : { ...cur, [targetId]: variants },
        );
      }
      setActiveProjectId(targetId);
      applySnapshot({ ...snap, activeDesignId: initialDesignId });
      setLoadedProjectId(targetId);
      setBooted(true);
      // Load every project's snapshot once on bootstrap to seed
      // the Projects menu summaries. The active project's entry
      // is then kept fresh by the live-update effect below.
      // Sequential awaits would serialise reads needlessly —
      // Promise.all parallelises the localStorage hits.
      const allSnaps = await Promise.all(
        list.map((p) => storage.loadProject(p.id)),
      );
      if (cancelled) return;
      const summaries: Record<string, ProjectSummary> = {};
      const themeDrafts: Record<string, string> = {};
      const themeVariants: Record<string, string> = {};
      list.forEach((p, i) => {
        const s = allSnaps[i];
        if (s) {
          summaries[p.id] = computeSummary(s);
          // Pre-seed every project's theme draft from its
          // persisted snapshot. The active project's entry feeds
          // the ThemeBuilderProvider on its first mount; inactive
          // entries hang here until the user switches into them.
          if (s.themeDraftJson) themeDrafts[p.id] = s.themeDraftJson;
          // Same for saved variants — the Styles tab reads the active
          // project's entry; the rest hang here until switched into.
          if (s.themeVariantsJson) themeVariants[p.id] = s.themeVariantsJson;
        }
      });
      setProjectSummaries(summaries);
      setThemeDraftJsonByProject(themeDrafts);
      setThemeVariantsJsonByProject(themeVariants);

      // Teams + memberships + users + orgs + org memberships —
      // pulled in parallel so a slow read doesn't gate the first
      // paint. Bootstrap is one round-trip's worth of localStorage
      // hits regardless; Supabase later does this as one
      // joined query.
      const [
        teamList,
        membershipList,
        userList,
        orgList,
        orgMembershipList,
      ] = await Promise.all([
        storage.listTeams(),
        storage.listMemberships(),
        storage.listUsers(),
        storage.listOrgs(),
        storage.listOrgMemberships(),
      ]);
      if (cancelled) return;
      setTeams(teamList);
      setMemberships(membershipList);
      setAllUsers(userList);
      setAllOrgs(orgList);
      setOrgMemberships(orgMembershipList);
    })();
    return () => {
      cancelled = true;
    };
    // Effect intentionally runs once; `storage` is a stable
    // singleton.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply a snapshot's design/chat/notes payload to the in-memory
  // page state. Pulled into a named function so both the bootstrap
  // and project-switching code paths use the same atomic setter
  // ordering — chat history and active design id must land in the
  // same React batch as the design list, otherwise the chat panel
  // would briefly key off the wrong activeId.
  const applySnapshot = useCallback((snap: ProjectSnapshot) => {
    setDesigns(snap.designs.length > 0 ? snap.designs : initialDesigns());
    setActiveId(
      snap.designs.some((d) => d.id === snap.activeDesignId)
        ? snap.activeDesignId
        : snap.designs[0]?.id ?? initialDesigns()[0].id,
    );
    setMessagesByDesign(snap.messagesByDesign);
    setNotesByDesign(snap.notesByDesign);
    // Loaded a fresh project state — make the autosave re-baseline on its
    // next run (record the loaded sig, write nothing) so we never re-save
    // what we just read over a newer edit.
    lastSavedStructSigRef.current = null;
    lastSavedBodyByIdRef.current = {};
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  // Compute the ambient counts a project surfaces in the menu —
  // screen list + turns + revisions. Pulled into a helper so the
  // bootstrap loop and the active-project live updater build the
  // shape identically.
  const computeSummary = useCallback(
    (snap: ProjectSnapshot): ProjectSummary => {
      const turnsByDesign: Record<string, number> = {};
      const revisionsByDesign: Record<string, number> = {};
      for (const d of snap.designs) {
        const msgs = snap.messagesByDesign[d.id] ?? [];
        turnsByDesign[d.id] = msgs.filter(
          (m) => m.role === "user",
        ).length;
        revisionsByDesign[d.id] = readRevisionCount(d.id);
      }
      return {
        designs: snap.designs.map((d) => ({
          id: d.id,
          name: d.name,
          kind: d.kind,
        })),
        turnsByDesign,
        revisionsByDesign,
      };
    },
    [],
  );

  // Persistence — write the current project's snapshot back to
  // storage whenever any of its tracked fields change. Skips while
  // the project switch is mid-flight (loadedProjectId !== active)
  // so we don't save the OLD project's state under the NEW key.
  useEffect(() => {
    if (!activeProjectId) return;
    // Don't save while a project switch is mid-flight (the loaded state
    // hasn't caught up to the active id yet).
    if (loadedProjectId !== activeProjectId) return;
    const project = projects.find((p) => p.id === activeProjectId);
    if (!project) return;

    const themeDraftJson = themeDraftJsonByProject[activeProjectId];
    const themeVariantsJson = themeVariantsJsonByProject[activeProjectId];

    // Two-tier dirty tracking (STUDIO-PERSISTENCE.md, P1 + P2):
    //
    //   structSig — the COARSE shape that a single-row write can't
    //   express: which screens exist + their order, the active-screen
    //   pointer, per-screen message counts, notes, and the theme draft.
    //   A change here routes to the whole-project `saveProject`.
    //
    //   bodyById — each screen's editable BODY (name / status /
    //   appSource). A change to ONE screen routes to a single-row
    //   `saveScreen(projectId, design)`. This is the common path: a
    //   padding tweak, a code-editor change, a chat regeneration — all
    //   mutate one screen's appSource and now cost one row upsert, not a
    //   five-table project rewrite.
    const structSig = JSON.stringify({
      d: designs.map((d) => d.id), // membership + order only
      a: activeId,
      m: Object.keys(messagesByDesign)
        .sort()
        .map((k) => [k, messagesByDesign[k]?.length ?? 0]),
      n: notesByDesign,
      t: themeDraftJson ?? "",
      v: themeVariantsJson ?? "",
    });
    const bodyById: Record<string, string> = {};
    for (const d of designs) {
      bodyById[d.id] = JSON.stringify([
        d.name,
        d.status ?? "",
        d.appSource ?? "",
      ]);
    }

    const flashSaved = () => {
      setSaveStatus("saved");
      if (savedFlashTimerRef.current) clearTimeout(savedFlashTimerRef.current);
      savedFlashTimerRef.current = setTimeout(() => {
        // Only fade the "saved" flash — never stomp a later "saving" /
        // "error" the next edit may have set in the meantime.
        setSaveStatus((s) => (s === "saved" ? "idle" : s));
      }, 1500);
    };

    // The actual write. `silent` (flush-on-leave) skips the status
    // setters so we don't touch React state from an unmounting tree.
    const doSave = (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;
      const structDirty = structSig !== lastSavedStructSigRef.current;
      const dirtyBodies = designs.filter(
        (d) => bodyById[d.id] !== lastSavedBodyByIdRef.current[d.id],
      );
      if (!structDirty && dirtyBodies.length === 0) return;

      if (!silent) setSaveStatus("saving");

      // Structural change → whole-project write. It re-upserts every
      // screen row too, so a successful saveProject also clears the body
      // dirty flags for ALL screens.
      const work: Promise<unknown> = structDirty
        ? storage
            .saveProject({
              project,
              designs,
              activeDesignId: activeId,
              messagesByDesign,
              notesByDesign,
              themeDraftJson,
              themeVariantsJson,
            })
            .then(() => {
              lastSavedStructSigRef.current = structSig;
              lastSavedBodyByIdRef.current = { ...bodyById };
            })
        : // Body-only change(s) → one row per dirty screen. Usually just
          // the active screen; the filter keeps it correct if more than
          // one drifted (e.g. an undo across screens).
          Promise.all(
            dirtyBodies.map((d) =>
              storage
                .saveScreen(activeProjectId, d, designs.indexOf(d))
                .then(() => {
                  lastSavedBodyByIdRef.current = {
                    ...lastSavedBodyByIdRef.current,
                    [d.id]: bodyById[d.id],
                  };
                }),
            ),
          );

      void work
        .then(() => {
          if (!silent) flashSaved();
        })
        .catch((err) => {
          // SURFACE the failure — the old code swallowed this, which is
          // exactly how manual edits vanished without a trace. Park the
          // chip on "error" (it stays until the next success) and log the
          // real Supabase error. The dirty refs are NOT advanced, so the
          // next edit retries this write.
          // eslint-disable-next-line no-console
          console.error("[studio] save failed:", err);
          if (!silent) setSaveStatus("error");
          // …and tell the user, so a failed save never passes unnoticed. A
          // version conflict (another tab / the AI saved a newer version)
          // gets its own message; everything else is a generic save error.
          if (err instanceof VersionConflictError) {
            toast.error("This page changed elsewhere", {
              description:
                "A newer version was saved by another tab or the AI. Reload to pick it up before editing further.",
            });
          } else if (!silent) {
            toast.error("Couldn’t save your changes", {
              description:
                "We’ll retry on your next edit; reload if it keeps failing.",
            });
          }
        });
    };

    // Rebuild the flush closure off the latest state each render so the
    // unmount / tab-hide listeners write the newest values.
    flushSaveRef.current = () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      if (lastSavedStructSigRef.current === null) return;
      doSave({ silent: true });
    };

    // First settle after a load/switch records the baseline WITHOUT
    // writing. The loaded state is already durable; re-saving it is what
    // was overwriting newer edits with the just-read snapshot.
    if (lastSavedStructSigRef.current === null) {
      lastSavedStructSigRef.current = structSig;
      lastSavedBodyByIdRef.current = { ...bodyById };
      return;
    }

    // Nothing drifted since the last successful write → no hammer.
    const anyDirty =
      structSig !== lastSavedStructSigRef.current ||
      designs.some(
        (d) => bodyById[d.id] !== lastSavedBodyByIdRef.current[d.id],
      );
    if (!anyDirty) return;

    // Debounced write — a burst of edits collapses into one save.
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      doSave();
    }, 1500); // ~1.5s trailing debounce
  }, [
    activeProjectId,
    loadedProjectId,
    projects,
    designs,
    activeId,
    messagesByDesign,
    notesByDesign,
    themeDraftJsonByProject,
    themeVariantsJsonByProject,
    storage,
  ]);

  // Flush a pending save when the user leaves — tab hidden, page unload, or
  // this component unmounting — so the last edit isn't stuck in the debounce
  // window. Mount-once; reads the latest state via flushSaveRef.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushSaveRef.current();
    };
    const onBeforeUnload = () => flushSaveRef.current();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      flushSaveRef.current();
    };
  }, []);

  // Keep the active project's Projects-menu summary in sync with
  // the in-memory designs / messages. Inactive projects rely on
  // their bootstrap-loaded entries until the user switches into
  // them; that flips this project to the active one and the loop
  // here takes over. Same gate as the persistence effect so an
  // in-flight switch doesn't write stale counts to the new key.
  useEffect(() => {
    if (!activeProjectId || loadedProjectId !== activeProjectId) return;
    const turnsByDesign: Record<string, number> = {};
    const revisionsByDesign: Record<string, number> = {};
    for (const d of designs) {
      turnsByDesign[d.id] = (messagesByDesign[d.id] ?? []).filter(
        (m) => m.role === "user",
      ).length;
      revisionsByDesign[d.id] = readRevisionCount(d.id);
    }
    setProjectSummaries((cur) => ({
      ...cur,
      [activeProjectId]: {
        // Carry `kind` — the nav's Motion Studio count reads it. (Same
        // shape as computeSummary; keep the two in lockstep.)
        designs: designs.map((d) => ({ id: d.id, name: d.name, kind: d.kind })),
        turnsByDesign,
        revisionsByDesign,
      },
    }));
  }, [
    activeProjectId,
    loadedProjectId,
    designs,
    messagesByDesign,
  ]);

  // URL history sync — keeps `?project=…&screen=…` in lockstep
  // with the in-memory state so back/forward navigates between
  // projects + screens, and shared links open to the right place.
  //
  // First write per session is a `replaceState` (no extra history
  // entry — the initial URL was either already correct from a
  // shared link or empty), every subsequent write is `pushState`
  // so undo via back-button works. The `current === target` short-
  // circuit also catches popstate-driven state updates (the
  // listener mutated the URL already; our effect would otherwise
  // push a redundant entry).
  const urlInitializedRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!activeProjectId || loadedProjectId !== activeProjectId) return;
    const url = new URL(window.location.href);
    url.searchParams.set("project", activeProjectId);
    // The screen param tracks FOCUS, not just "which screen is active":
    // present when zoomed into a screen, absent at the project home. So
    // a no-screen URL is a first-class state (the home), and removing the
    // param doesn't get silently re-added.
    if (zoom === "fit") {
      url.searchParams.set("screen", activeId);
    } else {
      url.searchParams.delete("screen");
    }
    // The section param tracks the left nav's project section. "screens"
    // is the default and stays unwritten, so existing URLs don't churn;
    // ?section=motions (Motion Studio) and ?section=styles survive a
    // refresh.
    if (projectSection !== "screens") {
      url.searchParams.set("section", projectSection);
    } else {
      url.searchParams.delete("section");
    }
    const target = url.pathname + url.search;
    const current = window.location.pathname + window.location.search;
    if (current === target) {
      urlInitializedRef.current = true;
      return;
    }
    if (!urlInitializedRef.current) {
      window.history.replaceState({}, "", target);
      urlInitializedRef.current = true;
    } else {
      window.history.pushState({}, "", target);
    }
  }, [activeProjectId, loadedProjectId, activeId, zoom, projectSection]);

  // popstate listener — when the user hits back/forward, read the
  // URL params and sync state. We compare against the live state
  // refs so we don't fight the URL push effect above (its
  // `current === target` guard handles the no-op write).
  const popstateLatestRef = useRef({
    activeProjectId,
    activeId,
    handleSwitchProject: (_id: string) => Promise.resolve(),
  });
  // Keep refs in sync with the latest closures — the popstate
  // listener is installed once and would otherwise close over
  // stale callbacks.
  useEffect(() => {
    popstateLatestRef.current.activeProjectId = activeProjectId;
    popstateLatestRef.current.activeId = activeId;
  }, [activeProjectId, activeId]);

  // Project switching — flush the current state under the OUTGOING
  // project, load the incoming one, apply its snapshot. Saved with
  // `await` so the outgoing project's most-recent state is durable
  // before we replace in-memory state.
  const handleSwitchProject = useCallback(
    async (id: string) => {
      if (id === activeProjectId) return;
      const current = projects.find((p) => p.id === activeProjectId);
      if (current && loadedProjectId === activeProjectId) {
        try {
          await storage.saveProject({
            project: current,
            designs,
            activeDesignId: activeId,
            messagesByDesign,
            notesByDesign,
          });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn("[studio] save-on-switch failed:", err);
        }
      }
      const snap = await storage.loadProject(id);
      if (!snap) return;
      setActiveProjectId(id);
      await storage.setActiveProjectId(id);
      applySnapshot(snap);
      setLoadedProjectId(id);
      // Switching projects lands back on Screens — sections are a lens
      // on the project you switched INTO, not sticky workspace state.
      setProjectSection("screens");
      // Switching a project lands on its home — not whatever focus state
      // the previous project was in. (The URL-sync effect then drops the
      // ?screen param to match.)
      setZoom("all");
    },
    [
      storage,
      activeProjectId,
      loadedProjectId,
      projects,
      designs,
      activeId,
      messagesByDesign,
      notesByDesign,
      applySnapshot,
    ],
  );

  // Two-step create flow:
  //   - handleOpenCreateProject — invoked by the "+" affordance in
  //     ProjectsMenu's section header. Just opens the dialog;
  //     keeps the menu's prop contract unchanged (no input).
  //   - handleSubmitCreateProject — invoked by NewProjectDialog
  //     once the user fills in Name + (optional) Description.
  //     Does the storage write + the switch.
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const handleOpenCreateProject = useCallback(() => {
    setNewProjectOpen(true);
  }, []);

  const handleSubmitCreateProject = useCallback(
    async (input: { name: string; description?: string }) => {
      const created = await storage.createProject(input);
      const list = await storage.listProjects();
      setProjects(list);
      // Seed an empty-ish summary for the new project so the menu
      // renders its row immediately without waiting for the
      // switch to land. The live-update effect replaces this with
      // real counts once it becomes the active project.
      const newSnap = await storage.loadProject(created.id);
      if (newSnap) {
        setProjectSummaries((cur) => ({
          ...cur,
          [created.id]: computeSummary(newSnap),
        }));
      }
      await handleSwitchProject(created.id);
    },
    [storage, handleSwitchProject, computeSummary],
  );

  const handleRenameProject = useCallback(
    async (id: string, name: string) => {
      await storage.renameProject(id, name);
      const list = await storage.listProjects();
      setProjects(list);
    },
    [storage],
  );

  // Patch a project — name and/or description in a single call.
  // ProjectSettingsSheet uses this; ProjectsMenu's inline rename
  // can keep using handleRenameProject (still works since rename
  // is now a thin wrapper around update).
  const handleUpdateProject = useCallback(
    async (
      id: string,
      patch: {
        name?: string;
        description?: string;
        context?: string;
        dos?: string[];
        donts?: string[];
        registryId?: string;
      },
    ) => {
      await storage.updateProject(id, patch);
      const list = await storage.listProjects();
      // Refreshing `projects` also re-derives activeProjectRegistryId,
      // so a registry change here flips the override immediately.
      setProjects(list);
    },
    [storage],
  );

  // Click a screen inside ANY project from the Projects menu.
  // If the screen belongs to the active project, just set it
  // active and zoom in. Otherwise switch projects first (which
  // saves the outgoing project + loads the incoming snapshot),
  // then override activeId to the clicked screen before zooming.
  const handleSelectScreenInProject = useCallback(
    async (projectId: string, designId: string) => {
      if (projectId !== activeProjectId) {
        await handleSwitchProject(projectId);
        // applySnapshot has already set activeId to the incoming
        // project's persisted activeDesignId — override here so
        // the user lands on the screen they actually clicked, not
        // whatever was open last in that project.
      }
      setActiveId(designId);
      setZoom("fit");
    },
    [activeProjectId, handleSwitchProject],
  );

  // Keep the popstate ref pointing at the latest handler — the
  // listener installs once with a stable closure, so without this
  // mirror it would call a stale switch.
  useEffect(() => {
    popstateLatestRef.current.handleSwitchProject = (id: string) =>
      handleSwitchProject(id);
  }, [handleSwitchProject]);

  // popstate listener — back/forward in browser navigates between
  // projects + screens. Installed once on mount; reads latest
  // callbacks via the ref so it always sees the current
  // handleSwitchProject.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPop = () => {
      const url = new URL(window.location.href);
      const p = url.searchParams.get("project");
      const s = url.searchParams.get("screen");
      const cur = popstateLatestRef.current;
      // Screen present → focus it; absent → land on the project home.
      const applyFocus = () => {
        if (s) {
          setActiveId(s);
          setZoom("fit");
        } else {
          setZoom("all");
        }
      };
      if (p && p !== cur.activeProjectId) {
        cur.handleSwitchProject(p).then(applyFocus);
      } else {
        applyFocus();
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Image-action trail. Fill / asset-pick / library-upload sites dispatch
  // a `grade:image-action` window event (they lack project+screen
  // context); the page has it, so it logs here. Keeps those call sites
  // free of context plumbing. `logEvent` is best-effort + broadcasts
  // grade:event-logged, so the project-home activity feed refreshes live.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onImageAction = (ev: Event) => {
      const d = (ev as CustomEvent).detail as
        | {
            action?: string;
            designId?: string;
            name?: string;
            model?: string;
            prompt?: string;
          }
        | undefined;
      if (!d?.action || !activeProjectId) return;
      void storage.logEvent({
        projectId: activeProjectId,
        designId: d.designId ?? activeId,
        action: d.action,
        targetKind: "asset",
        metadata: {
          ...(d.name ? { name: d.name } : {}),
          ...(d.model ? { model: d.model } : {}),
          ...(d.prompt ? { prompt: d.prompt } : {}),
        },
      });
    };
    window.addEventListener("grade:image-action", onImageAction);
    return () => window.removeEventListener("grade:image-action", onImageAction);
  }, [storage, activeProjectId, activeId]);

  const performDeleteProject = useCallback(
    async (id: string) => {
      await storage.deleteProject(id);
      const list = await storage.listProjects();
      setProjects(list);
      // Drop the deleted project's summary so the Projects menu
      // doesn't render a phantom row.
      setProjectSummaries((cur) => {
        if (!(id in cur)) return cur;
        const { [id]: _drop, ...rest } = cur;
        return rest;
      });
      // If we just deleted the active project, switch to whatever's
      // left (or a fresh default if we deleted the only one — but
      // ProjectsMenu blocks that path by hiding the trash button
      // when projects.length === 1).
      if (id === activeProjectId) {
        const next = list[0];
        if (next) {
          await handleSwitchProject(next.id);
        } else {
          // Should never happen given the menu guard, but rebuild a
          // default if it somehow does.
          const seeded = await storage.createProject({
            name: "Default project",
          });
          const refreshed = await storage.listProjects();
          setProjects(refreshed);
          await handleSwitchProject(seeded.id);
        }
      }
    },
    [storage, activeProjectId, handleSwitchProject],
  );

  const [view, setView] = useState<"preview" | "code" | "timeline">("preview");

  // Renderer for the preview. The settings-sheet control was removed
  // (Fast Frame won the rollout); the constant stays so StudioCanvas
  // can still flip to Sandpack programmatically for parity checks.
  const rendererMode: RendererMode = "fast";

  // Settings sheet — controlled. Default closed; the topbar gear opens
  // it. State lives here (not in StudioSettings) so the same sheet
  // can be opened from anywhere else later (left rail, keyboard
  // shortcut, etc.) without each entry point owning its own copy.
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Super admin sheet open state — toggled by the shield button in
  // the topbar (only rendered for users with superAdmin=true) and
  // by the ⌘⇧⌥A global shortcut.
  const [superAdminOpen, setSuperAdminOpen] = useState(false);

  // Side-panel visibility — left = chat, right = settings/tabs. Both
  // default open so first-paint shows the familiar three-column layout
  // and SSR markup matches the client. We rehydrate from localStorage
  // in a one-shot effect (gated by a ref so React 18's StrictMode
  // double-invoke doesn't undo the user's choice on second render).
  //
  // The same boolean drives two surfaces: on desktop (≥ md) it
  // collapses the inline column inside AppShellMain; on mobile (< md)
  // it opens a slide-in Sheet over the canvas. One state, two
  // renderings — keeps keyboard shortcuts working identically across
  // breakpoints.
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const panelHydratedRef = useRef(false);
  useEffect(() => {
    if (panelHydratedRef.current) return;
    panelHydratedRef.current = true;
    try {
      const l = window.localStorage.getItem("studio:left-panel-open");
      if (l === "false") setLeftPanelOpen(false);
      const r = window.localStorage.getItem("studio:right-panel-open");
      if (r === "false") setRightPanelOpen(false);
    } catch {
      /* storage disabled — fall back to default-open */
    }
    // Hand control back to React: the pre-hydration script in
    // app/studio/layout.tsx stamped these attrs so CSS could collapse
    // the panes BEFORE first paint (no default-open flash). Now that
    // state carries the same values, drop the attrs so the CSS
    // override can never fight a later user toggle.
    document.documentElement.removeAttribute("data-studio-left-closed");
    document.documentElement.removeAttribute("data-studio-right-closed");
  }, []);
  useEffect(() => {
    if (!panelHydratedRef.current) return;
    try {
      window.localStorage.setItem(
        "studio:left-panel-open",
        String(leftPanelOpen),
      );
    } catch {
      /* storage disabled — visibility just won't survive reload */
    }
  }, [leftPanelOpen]);
  useEffect(() => {
    if (!panelHydratedRef.current) return;
    try {
      window.localStorage.setItem(
        "studio:right-panel-open",
        String(rightPanelOpen),
      );
    } catch {
      /* see leftPanelOpen persist effect — same trade-off */
    }
  }, [rightPanelOpen]);

  // Wrap the toggles in stable callbacks so they can be passed to both
  // the canvas toolbar buttons and the keyboard-shortcut effect below
  // without forcing a re-bind on every render.
  const toggleLeftPanel = useCallback(
    () => setLeftPanelOpen((v) => !v),
    [],
  );
  const toggleRightPanel = useCallback(
    () => setRightPanelOpen((v) => !v),
    [],
  );

  // Keyboard shortcuts — match VS Code conventions so the muscle memory
  // transfers:
  //   ⌘\        — Toggle (primary) Sidebar    → left panel (chat)
  //   ⌘⇧\       — Toggle Secondary Sidebar    → right panel (settings)
  // The handler ignores key events fired while focus is in an input,
  // textarea, or contenteditable — otherwise ⌘\ inside the chat
  // composer would toggle the panel mid-typing. The check is broad
  // (any editable element, not just inputs) so embedded Monaco /
  // CodeMirror inside Sandpack panels also pass through.
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // ⌘⇧⌥A — open the SuperAdminSheet. Deliberately a four-modifier
      // chord so it can't be hit by accident. Open even from inputs
      // since it's a chrome action, not an editing action.
      if (
        e.key.toLowerCase() === "a" &&
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.altKey
      ) {
        e.preventDefault();
        setSuperAdminOpen((v) => !v);
        return;
      }

      // § — Figma-style "hide UI": toggles BOTH side panels at once.
      // One unmodified key (top-left on ISO/UK keyboards, where Figma
      // puts backtick) so flipping between full-canvas and full-chrome
      // is a single tap. Both-open or split states collapse to
      // both-closed; both-closed restores both.
      if (e.key === "§") {
        const target = e.target as HTMLElement | null;
        if (target) {
          const tag = target.tagName;
          const editable =
            tag === "INPUT" ||
            tag === "TEXTAREA" ||
            target.isContentEditable;
          if (editable) return;
        }
        e.preventDefault();
        const anyOpen = leftPanelOpen || rightPanelOpen;
        setLeftPanelOpen(!anyOpen);
        setRightPanelOpen(!anyOpen);
        return;
      }

      // ⌘\ / ⌘⇧\ — panel toggles.
      if (e.key !== "\\") return;
      if (!(e.metaKey || e.ctrlKey)) return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        const editable =
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          target.isContentEditable;
        if (editable) return;
      }
      e.preventDefault();
      if (e.shiftKey) {
        toggleRightPanel();
      } else {
        toggleLeftPanel();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleLeftPanel, toggleRightPanel, leftPanelOpen, rightPanelOpen]);

  // Browser pinch-zoom guard — a trackpad pinch arrives as ctrl+wheel,
  // and anywhere we don't handle it (chat, panels, toolbars) the
  // browser zooms the ENTIRE app. Studio is a canvas tool: pinch means
  // "zoom the canvas", never "zoom the chrome" (same policy as Figma).
  // The canvas + sandbox handlers run on their own elements first and
  // do their zoom; this window-level catch-all only suppresses the
  // browser default everywhere else. Non-passive on purpose. Keyboard
  // page-zoom (⌘+/⌘−) still works for accessibility.
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  // Canvas zoom — lifted out of StudioCanvas so the page can route
  // the left panel based on view: "fit" → StudioChat for the focused
  // screen, "all" → ProjectsMenu for the workspace. Default "fit"
  // matches the pre-projects behaviour (user lands on their focused
  // screen). Studio's "Eat your own dogfood" target: the chrome
  // reacts to canvas state without the canvas reaching up.

  // Responsive mode — < md gets Sheet overlays instead of inline
  // panels. SSR-safe: default false so server markup matches; the
  // one-shot effect below flips it once we can read window.matchMedia.
  // We subscribe to the MediaQueryList so a viewport resize during
  // the session (devtools, window drag, rotate) keeps the layout in
  // sync.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // AI chat display toggles — owned at the page level so the settings
  // sheet writes them and StudioChat / AIChat read them. Defaults
  // match the previous always-on behavior so flipping them off is
  // an explicit user choice rather than an unexpected regression.
  const [showUsage, setShowUsage] = useState(true);
  const [showRefs, setShowRefs] = useState(true);
  const [showActions, setShowActions] = useState(true);
  const [showDuration, setShowDuration] = useState(true);
  // Layer 1 of the thinking/steps work: the UI surface exists and the
  // toggles flip, but Studio's /api/chat doesn't yet emit reasoning
  // parts or step events. Flip these on, you'll see no chips until
  // Layer 2 lands. Default off so the chat stays clean for users on
  // providers that can't emit either signal anyway (e.g. the
  // free-tier Gemini default).
  const [showThinking, setShowThinking] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  // Default OFF for streaming text → response is held until the
  // preview is ready, then revealed in one snap. The user can flip
  // this on from the Settings Sheet if they prefer to watch tokens
  // arrive.
  const [streamResponseText, setStreamResponseText] = useState(false);
  const [assistantBubble, setAssistantBubble] = useState(true);

  // Live elapsed counter for the topbar "Generating…" indicator.
  // Rising edge of `streamingByDesign[activeId]` captures the start
  // timestamp; an interval re-renders the counter every 100ms.
  // Cleared on falling edge so the indicator vanishes the moment
  // the turn completes (the per-message duration takes over in the
  // chat from there). `liveElapsedMs` is intentionally NOT used as
  // the final per-message duration — that's tracked in StudioChat,
  // which has access to the just-completed message id.
  const activeStreaming = Boolean(streamingByDesign[activeId]);
  const [streamStartedAt, setStreamStartedAt] = useState<number | null>(
    null
  );
  const [liveElapsedMs, setLiveElapsedMs] = useState(0);
  useEffect(() => {
    if (activeStreaming) {
      setStreamStartedAt((prev) => prev ?? Date.now());
    } else {
      setStreamStartedAt(null);
      setLiveElapsedMs(0);
    }
  }, [activeStreaming]);
  useEffect(() => {
    if (streamStartedAt === null) return;
    const id = window.setInterval(() => {
      setLiveElapsedMs(Date.now() - streamStartedAt);
    }, 100);
    return () => window.clearInterval(id);
  }, [streamStartedAt]);

  // Speculative-draft write-through. Same-value guard keeps the
  // repeated `null` clears from minting fresh map objects (and
  // re-rendering the canvas) on every post-stream settle.
  const handleDraftCode = useCallback(
    (code: string | null) => {
      setDraftByDesign((prev) =>
        (prev[activeId] ?? null) === code
          ? prev
          : { ...prev, [activeId]: code },
      );
    },
    [activeId],
  );

  const handleLatestCode = useCallback(
    (rawCode: string | null) => {
      // Write-boundary scrub: `data-gds-source-id` is a compile-time
      // runtime artifact (injectSourceIds re-mints it per render) and
      // must never persist in appSource — the model copies the ids
      // back from context, renumbers them on edit turns (shearing the
      // SEARCH anchors), and they bloat every request. Legacy screens
      // self-clean on their next chat write.
      const code = rawCode ? stripSourceIds(rawCode) : rawCode;
      // Scope the update to whichever design produced the code. The chat
      // component fires this on every `setMessages` including the
      // post-switch hydration — we write through either way; it's idempotent
      // if the code is unchanged.
      setDesigns((ds) =>
        ds.map((d) => {
          if (d.id !== activeId) return d;
          // Prose-only replies (no JSX fence) come through as null /
          // empty. Don't let those wipe an existing preview — the
          // user just asked a clarifying question or got a "no code
          // changes needed" explanation; the previous render should
          // stay on screen.
          const isEmpty = code == null || code.trim() === "";
          if (isEmpty && d.appSource) return d;
          // Push the OLD value to history before committing the new
          // one — undo restores to the previous state. We only push
          // when the value actually changed (no-op chats from the
          // model don't litter the undo stack).
          if (d.appSource !== code) {
            undoHistory.push(d.appSource ?? null, "Chat edit");
          }
          return { ...d, appSource: code, updatedAt: Date.now() };
        })
      );
      // Seal a revision for the new generation (skip prose-only / empty
      // replies). Runs outside the updater so it fires once, not twice
      // under StrictMode.
      if (code && code.trim()) {
        persistRevision(activeId, code, "Chat edit");
      }
    },
    [activeId, persistRevision]
  );

  // Source mutation that came from the settings panel, the Fill button,
  // or any other in-canvas tool (not the LLM). Pushes the previous
  // appSource to the undo history before writing the new one — every
  // non-chat edit becomes its own undo step. Same write-through path as
  // handleLatestCode otherwise.
  //
  // The optional `label` parameter lets callers attach a human-readable
  // tag ("Fill images", "Change hint to poster") to the snapshot so the
  // undo button's tooltip can show "Undo Fill images" rather than a
  // generic "Undo". Callers that don't care can omit it — the hook
  // defaults to "Edit".
  const handleSourceMutation = useCallback(
    (nextSource: string, label?: string) => {
      setDesigns((ds) =>
        ds.map((d) => {
          if (d.id !== activeId) return d;
          if (d.appSource === nextSource) return d;
          undoHistory.push(d.appSource ?? null, label ?? "Edit");
          return { ...d, appSource: nextSource, updatedAt: Date.now() };
        })
      );
      persistRevision(activeId, nextSource, label ?? "Edit");
    },
    [activeId, undoHistory, persistRevision]
  );

  // Undo / redo — restore the previous (or next) snapshot from the
  // per-design history into the active design's appSource. The hook
  // returns the snapshot value synchronously, so we wire it straight to
  // setDesigns. We DO NOT push the current state to history before
  // restoring — the redo direction is what makes the current state
  // recoverable (the hook keeps the redo-future intact until the next
  // push() displaces it).
  const handleUndo = useCallback(() => {
    const previous = undoHistory.undo();
    if (previous === null) return;
    setDesigns((ds) =>
      ds.map((d) =>
        d.id === activeId
          ? { ...d, appSource: previous ?? undefined, updatedAt: Date.now() }
          : d,
      ),
    );
  }, [activeId, undoHistory]);

  const handleRedo = useCallback(() => {
    const next = undoHistory.redo();
    if (next === null) return;
    setDesigns((ds) =>
      ds.map((d) =>
        d.id === activeId
          ? { ...d, appSource: next ?? undefined, updatedAt: Date.now() }
          : d,
      ),
    );
  }, [activeId, undoHistory]);

  // Global keyboard shortcuts — Cmd/Ctrl-Z to undo, Cmd/Ctrl-Shift-Z
  // (and Cmd/Ctrl-Y on non-mac) to redo. Lives at the page level so the
  // shortcuts work from anywhere in /studio — even when focus is in
  // the chat input or the settings panel. We skip when the target is a
  // contentEditable / form element with its own undo stack (input,
  // textarea) to avoid hijacking the browser's native text-undo.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      // Native form fields have their own per-field undo. Honour that
      // for plain text inputs; for the canvas-level undo, the user can
      // click the buttons or focus a non-input first.
      const tag = target?.tagName;
      const editable = !!(
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        target?.isContentEditable
      );
      const cmd = e.metaKey || e.ctrlKey;
      if (!cmd) return;
      const key = e.key.toLowerCase();
      // Redo: cmd+shift+z OR cmd+y. Both are common bindings; supporting
      // both means muscle memory from either platform works.
      const isRedo =
        (key === "z" && e.shiftKey) || (key === "y" && !e.shiftKey);
      const isUndo = key === "z" && !e.shiftKey;
      if (!isUndo && !isRedo) return;
      if (editable) return; // let the field handle its own undo
      e.preventDefault();
      if (isUndo) handleUndo();
      else handleRedo();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleUndo, handleRedo]);

  const handleMessagesChange = useCallback(
    (next: UIMessage[]) => {
      // Cache this design's conversation so the tab remembers it on remount.
      // Cheap because UIMessage[] identity changes on every useful update —
      // we just swap the reference into the map.
      setMessagesByDesign((cache) => ({ ...cache, [activeId]: next }));
    },
    [activeId]
  );

  const handleStreamingChange = useCallback(
    (isStreaming: boolean) => {
      setStreamingByDesign((s) => {
        // Bail early if nothing changed — avoids needless re-renders while
        // the chat status flips around (`ready` → `submitted` → `streaming`
        // → `ready` fires a few times).
        if (Boolean(s[activeId]) === isStreaming) return s;
        return { ...s, [activeId]: isStreaming };
      });
    },
    [activeId]
  );

  const handleSelect = useCallback(
    (selection: StudioSelection) => {
      setSelectionByDesign((m) => ({ ...m, [activeId]: selection }));
    },
    [activeId]
  );

  const handleClearSelection = useCallback(() => {
    setSelectionByDesign((m) => {
      if (m[activeId] == null) return m; // already clear — no new ref needed
      return { ...m, [activeId]: null };
    });
  }, [activeId]);

  // Right-panel tab is lifted to the page so comment mode can
  // auto-switch the user to the Comments tab when they pick an
  // element. Defaults to "layout" — the existing landing tab.
  const [rightTab, setRightTab] = useState<
    "layout" | "styles" | "theme" | "comments"
  >("layout");

  // A monotonic counter incremented every time a Comment-mode
  // pick lands. CommentsTab watches this; each tick means
  // "auto-open the composer for the current selection". Using a
  // counter (not a boolean) lets a second pick in a row re-open
  // the composer without the consumer having to reset state.
  const [composerOpenTrigger, setComposerOpenTrigger] = useState(0);

  // Comment-mode pick handler. Stores the selection (so the
  // composer can read it), jumps the right panel to the Comments
  // tab, bumps the trigger so the tab opens its composer, AND
  // force-opens the right panel — the composer is invisible if
  // the user has collapsed the panel, so a comment-mode pick
  // implies "I want to see the comment surface right now".
  const handleCommentSelect = useCallback(
    (selection: StudioSelection) => {
      setSelectionByDesign((m) => ({ ...m, [activeId]: selection }));
      setRightTab("comments");
      setRightPanelOpen(true);
      setComposerOpenTrigger((n) => n + 1);
    },
    [activeId],
  );

  // Canvas-mode choice handler. Fires the moment the user CHOOSES a
  // toolbar mode (before any pick lands) so the right panel keeps up:
  // choosing Comment jumps to the Comments tab, choosing Select jumps
  // back to Layout (where the docked settings panel lives). Leaving a
  // mode (null) doesn't switch — the user may still be reading the
  // panel they landed on.
  const handleCanvasModeChange = useCallback(
    (mode: "select" | "comment" | null) => {
      if (mode === "comment") {
        setRightTab("comments");
        setRightPanelOpen(true);
      } else if (mode === "select") {
        setRightTab("layout");
      }
    },
    [],
  );

  // Cmd/Ctrl+Shift+Up — "select parent". Walks one step up the chain
  // captured in the current selection, posting `grade:select-by-source-id`
  // at the focused iframe so the in-iframe agent re-runs its standard
  // resolve heuristics + emits a fresh selection back. Mirrors the
  // breadcrumb's parent-segment click as a power-user shortcut so users
  // don't have to mouse to the right panel just to step up one Stack.
  // Skipped when focus is in an input/textarea so it doesn't fight with
  // line-cursor movement in the chat composer or other text fields.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "ArrowUp") return;
      if (!e.shiftKey) return;
      if (!(e.metaKey || e.ctrlKey)) return;
      const active = document.activeElement as HTMLElement | null;
      if (active) {
        const tag = active.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          active.isContentEditable
        ) {
          return;
        }
      }
      const sel = selectionByDesign[activeId];
      const chain = sel?.chain;
      if (!chain || chain.length < 2) return;
      const parent = chain[chain.length - 2];
      e.preventDefault();
      const container = document.querySelector<HTMLElement>(
        "[data-grade-focused-frame]"
      );
      const win = container?.querySelector("iframe")?.contentWindow;
      if (!win) return;
      try {
        win.postMessage(
          { type: "grade:select-by-source-id", id: parent.sourceId },
          "*"
        );
      } catch {
        /* iframe gone */
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeId, selectionByDesign]);

  // Canvas scope cap — the "All" zoom mounts one Sandpack per design in
  // parallel, so we cap the count rather than let the user degrade their
  // own session. Empirically 8 is the point where boot latency of a
  // cold "All" flip starts to feel laggy on a mid-range laptop.
  const MAX_DESIGNS = 20;
  const atCap = designs.length >= MAX_DESIGNS;

  // Add a blank design and focus it. Previously this called setActiveId
  // from INSIDE a setDesigns updater — which React's strict-mode runs
  // twice, and because createDesign uses Date.now() + Math.random()
  // each pass mints a different id. The activeId + the id in state
  // *usually* coincide because React batches the last-wins setter, but
  // setState-inside-an-updater is a documented anti-pattern and it's
  // the exact shape of bug that produces "added a screen, nothing's
  // focused" drift. Now we compute the new design once, queue both
  // setters at the top level, and React batches them into one render.
  //
  // Optional `seed` lets the StarterPicker (#45/#46) spawn a screen
  // pre-filled with a reference-layout scaffold or pasted JSX. Keeping
  // the "blank screen" shape as the default — `handleAddDesign()` with
  // no args still works — so the DesignTabs "+ New" button stays
  // one-click frictionless.
  const handleAddDesign = useCallback(
    (seed?: { source?: string; name?: string; kind?: DesignKind }) => {
      if (designs.length >= MAX_DESIGNS) return;
      // Infer kind from the seed when not given explicitly — a starter
      // whose source is a <Motion> reel (e.g. the motion-showcase
      // playground scaffold) lands in Motion Studio, not Screens.
      const kind =
        seed?.kind ??
        (seed?.source && /<Motion[\s>]/.test(seed.source)
          ? ("motion" as const)
          : undefined);
      // Motions number among themselves ("Motion 2"), not among all slots.
      const kindCount =
        kind === "motion"
          ? designs.filter((d) => designKind(d) === "motion").length
          : designs.length;
      const fresh = createDesign(kindCount, seed?.name, kind);
      const next: Design = seed?.source
        ? { ...fresh, appSource: seed.source }
        : fresh;
      setDesigns((ds) => (ds.length >= MAX_DESIGNS ? ds : [...ds, next]));
      setActiveId(next.id);
      // Persist the new screen as its own row immediately (the
      // reconciling autosave below would catch it anyway, but the
      // discrete add is the contract). Append position = current
      // length.
      if (activeProjectId) {
        void storage
          .addScreen(activeProjectId, next, designs.length)
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.warn("[studio] addScreen failed:", err);
          });
      }
    },
    [designs, activeProjectId, storage]
  );

  // New Motion — a Design with kind "motion", seeded with the starter
  // sequence (title → screen-with-camera → section break) so the play
  // view and the timeline dock read immediately. See STUDIO-DIRECTOR.md
  // ("Grade Motion").
  const handleAddMotion = useCallback(() => {
    handleAddDesign({ source: starterMotionSource(), kind: "motion" });
    // Land in the Motions section so the new Motion is visible in the grid.
    setProjectSection("motions");
  }, [handleAddDesign]);

  // Clone an existing design's JSX into a fresh slot. Copies the
  // appSource but NOT the chat history — for a wizard/flow-step
  // workflow you almost always want the new page to start from a fresh
  // conversation (the chat targets "this screen" so cross-pollinating
  // history is more confusing than helpful). Insertion order: the
  // duplicate lands immediately after its source so the flow reads left
  // to right in the canvas grid.
  //
  // Same refactor as handleAddDesign — setActiveId lives outside the
  // setDesigns updater now. The source lookup + fresh id minting
  // happen against the current render's `designs`; that's fine because
  // the user is clicking an affordance they can see, so the array is
  // already up to date by the time this fires.
  const handleDuplicateDesign = useCallback(
    (id: string) => {
      if (designs.length >= MAX_DESIGNS) return;
      const source = designs.find((d) => d.id === id);
      if (!source) return;
      const fresh = createDesign(designs.length, `${source.name} copy`);
      const duplicate: Design = { ...fresh, appSource: source.appSource };
      const srcIdx = designs.findIndex((d) => d.id === id);
      setDesigns((ds) => {
        if (ds.length >= MAX_DESIGNS) return ds;
        const out = [...ds];
        // Recompute the insertion index against the *freshest* array
        // inside the updater — guards against a concurrent add having
        // shifted positions between render and commit.
        const liveIdx = ds.findIndex((d) => d.id === id);
        out.splice(liveIdx >= 0 ? liveIdx + 1 : srcIdx + 1, 0, duplicate);
        return out;
      });
      setActiveId(duplicate.id);
      if (activeProjectId) {
        void storage
          .addScreen(activeProjectId, duplicate, srcIdx + 1, {
            id: source.id,
            name: source.name,
          })
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.warn("[studio] addScreen (duplicate) failed:", err);
          });
      }
    },
    [designs, activeProjectId, storage]
  );

  const performCloseDesign = useCallback(
    (id: string) => {
      if (designs.length <= 1) return; // Guardrail — never close the last one.
      // Precompute the fallback activeId against the CURRENT designs so
      // we don't call setActiveId from inside the setDesigns updater
      // (strict-mode runs updaters twice; side-effects inside them are
      // a React anti-pattern that bit us once already).
      const idx = designs.findIndex((d) => d.id === id);
      const remaining = designs.filter((d) => d.id !== id);
      const nextActiveId =
        id === activeId
          ? remaining[Math.max(0, idx - 1)]?.id ?? remaining[0]?.id
          : activeId;

      setDesigns((ds) =>
        ds.length <= 1 ? ds : ds.filter((d) => d.id !== id)
      );
      if (nextActiveId && nextActiveId !== activeId) {
        setActiveId(nextActiveId);
      }
      // Release the cached conversation for the closed design. If we ever
      // add "reopen tab" this is the line to revisit.
      setMessagesByDesign((cache) => {
        if (!(id in cache)) return cache;
        const { [id]: _drop, ...rest } = cache;
        return rest;
      });
      setStreamingByDesign((s) => {
        if (!(id in s)) return s;
        const { [id]: _drop, ...rest } = s;
        return rest;
      });
      setDraftByDesign((m) => {
        if (!(id in m)) return m;
        const { [id]: _drop, ...rest } = m;
        return rest;
      });
      setSelectionByDesign((m) => {
        if (!(id in m)) return m;
        const { [id]: _drop, ...rest } = m;
        return rest;
      });
      setNotesByDesign((m) => {
        if (!(id in m)) return m;
        const { [id]: _drop, ...rest } = m;
        return rest;
      });
      // Clear the live-preview localStorage key for this design so
      // orphan entries don't pile up across sessions. Any open
      // preview tab pointed at this design will fire a `storage`
      // event with `newValue: null` and clear itself.
      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(`grade:screen:${id}`);
        } catch {
          /* storage disabled — nothing to clean */
        }
      }
      // Drop the per-design undo history too. `pruneHistoryStorage`
      // takes the SET of designs that should remain — we pass every
      // remaining id (minus the closing one). The hook persistence
      // effect won't re-write the closed design's key after this
      // because the consumer state-slot is gone.
      pruneHistoryStorage(new Set(remaining.map((d) => d.id)));
      // Delete the screen's row — FK cascade drops its messages,
      // note, and comment threads server-side.
      if (activeProjectId) {
        void storage.deleteScreen(activeProjectId, id).catch((err) => {
          // eslint-disable-next-line no-console
          console.warn("[studio] deleteScreen failed:", err);
        });
      }
    },
    [activeId, designs, activeProjectId, storage]
  );

  // ── Delete confirmation ─────────────────────────────────────────────
  // Deletions route through a confirm dialog so nothing is removed on a
  // stray click. We also look up whether the target is shared — deleting
  // a shared screen breaks its /s/ link + any /e/ embeds — and surface
  // that as a louder warning. Share lookup is best-effort: local-only
  // mode has no shares, so a failure just means "no warning". The actual
  // deletion work lives in performDeleteProject / performCloseDesign; the
  // handlers below only open the dialog, and confirmDelete commits.
  const [pendingDelete, setPendingDelete] = useState<
    | { kind: "project"; id: string; name: string; sharedCount: number }
    | { kind: "screen"; id: string; name: string; shared: boolean }
    | null
  >(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const handleDeleteProject = useCallback(
    async (id: string) => {
      const name = projects.find((p) => p.id === id)?.name ?? "this project";
      let sharedCount = 0;
      try {
        const links = await storage.listShareLinks(id);
        const now = Date.now();
        const sharedDesignIds = new Set(
          links
            .filter((l) => !l.revoked && (!l.expiresAt || l.expiresAt > now))
            .map((l) => l.designId)
            .filter((d): d is string => Boolean(d)),
        );
        sharedCount = sharedDesignIds.size;
      } catch {
        /* local-only / no shares — no warning */
      }
      setPendingDelete({ kind: "project", id, name, sharedCount });
    },
    [projects, storage],
  );

  const handleCloseDesign = useCallback(
    async (id: string) => {
      if (designs.length <= 1) return; // never delete the last screen
      const name = designs.find((d) => d.id === id)?.name ?? "this screen";
      let shared = false;
      try {
        if (activeProjectId) {
          const links = await storage.listShareLinks(activeProjectId);
          const now = Date.now();
          shared = links.some(
            (l) =>
              l.designId === id &&
              !l.revoked &&
              (!l.expiresAt || l.expiresAt > now),
          );
        }
      } catch {
        /* local-only / no shares — no warning */
      }
      setPendingDelete({ kind: "screen", id, name, shared });
    },
    [designs, activeProjectId, storage],
  );

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleteBusy(true);
    try {
      if (pendingDelete.kind === "project") {
        await performDeleteProject(pendingDelete.id);
      } else {
        performCloseDesign(pendingDelete.id);
      }
      setPendingDelete(null);
    } finally {
      setDeleteBusy(false);
    }
  }, [pendingDelete, performDeleteProject, performCloseDesign]);

  const handleRenameDesign = useCallback((id: string, name: string) => {
    setDesigns((ds) =>
      ds.map((d) =>
        d.id === id ? { ...d, name, updatedAt: Date.now() } : d,
      ),
    );
  }, []);

  // Pre-build the left-panel + right-tabs subtrees. Each is
  // referenced twice (once in the inline desktop body, once inside a
  // Sheet for mobile), and we want the props (selection, notes,
  // etc.) lined up identically in both spots — extracting to a const
  // stops the two call sites drifting. Note: at any given breakpoint
  // only ONE of the two render paths is mounted, so state lives in
  // the active instance — flipping breakpoints will remount, but the
  // page-level stores (messagesByDesign, notesByDesign,
  // ThemeBuilderProvider) preserve the conversation, notes, and
  // theme draft across the remount.
  //
  // Section routing for the left nav's Screens / Flows / Motions /
  // Styles rows. Screens + Motions filter the "all" grid by design
  // kind; Styles routes to the theme tab in the right panel; Flows is
  // disabled until FlowCanvas (D8).
  const handleSelectSection = useCallback(
    (section: ProjectSection) => {
      if (section === "flows") return;
      // screens / motions filter the grid; assets + Design System ("styles")
      // each take over the canvas as a full-screen project page. All of them
      // live at the "all" zoom. (Design System used to pop the right panel —
      // it's per-PROJECT theme authoring, not per-screen, so it's a page now.)
      setProjectSection(section);
      setZoom("all");
    },
    [],
  );

  // (Section reset on project switch lives in handleSwitchProject — an
  // effect keyed on activeProjectId would also fire at bootstrap and
  // clobber a ?section= read from the URL.)

  // What the "all" grid shows — designs filtered by the active section's
  // kind. Fit mode always sees the full list (the focused design might
  // be either kind), and "styles" leaves the grid on screens.
  const visibleDesigns = useMemo(() => {
    if (zoom !== "all") return designs;
    if (projectSection === "motions")
      return designs.filter((d) => designKind(d) === "motion");
    return designs.filter((d) => designKind(d) === "screen");
  }, [designs, zoom, projectSection]);

  // The left pane is context-aware: ProjectsMenu when the canvas is
  // in "all screens" mode (chat is screen-scoped — it makes no sense
  // at the grid view); StudioChat when zoomed into a focused screen.
  // The page owns `zoom` (lifted from StudioCanvas), so the swap is
  // controlled here.
  const leftPane = zoom === "all" && activeProjectId ? (
    <ProjectsMenu
      projects={projects}
      teams={teams}
      currentUserId={commentAuthUser?.id}
      activeProjectId={activeProjectId}
      summaries={projectSummaries}
      onSelectProject={handleSwitchProject}
      onCreateProject={handleOpenCreateProject}
      onUpdateProject={handleUpdateProject}
      onRenameProject={handleRenameProject}
      onDeleteProject={handleDeleteProject}
      activeSection={projectSection}
      onSelectSection={handleSelectSection}
      activeStylesSection={stylesSection}
      onSelectStylesSection={setStylesSection}
      onAddMotion={handleAddMotion}
    />
  ) : (
    <StudioChat
      key={`chat-${activeId}`}
      chatId={activeId}
      settings={settings}
      systemPrompt={systemPrompt}
      initialMessages={messagesByDesign[activeId]}
      onMessagesChange={handleMessagesChange}
      onStreamingChange={handleStreamingChange}
      onLatestCode={handleLatestCode}
      onDraftCode={handleDraftCode}
      currentCode={activeDesign.appSource}
      selection={selectionByDesign[activeId] ?? null}
      onClearSelection={handleClearSelection}
      onSourceMutation={handleSourceMutation}
      settingsPanelDocked
      showUsage={showUsage}
      showRefs={showRefs}
      showActions={showActions}
      showThinking={showThinking}
      showSteps={showSteps}
      showDuration={showDuration}
      assistantBubble={assistantBubble}
      holdResponseUntilReady={!streamResponseText}
    />
  );

  // The active project (full row from the index) — used to gate
  // comment write actions on access list + ownership.
  const activeProject = projects.find((p) => p.id === activeProjectId);

  // The active project's saved theme variants, parsed. ThemeVariant[] is
  // plain JSON; a corrupt/missing entry yields an empty list so the
  // Styles tab still renders. (STUDIO-THEMES.md T1.)
  const projectThemeVariants: ThemeVariant[] = React.useMemo(() => {
    const raw = activeProjectId
      ? themeVariantsJsonByProject[activeProjectId]
      : undefined;
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as ThemeVariant[]) : [];
    } catch {
      return [];
    }
  }, [activeProjectId, themeVariantsJsonByProject]);

  // Persist a new variant list for the active project. Serialises to the
  // themeVariantsJson entry the save effect writes onto the project
  // snapshot — mirrors handleThemeDraftChange one tier up.
  const handleThemeVariantsChange = React.useCallback(
    (next: ThemeVariant[]) => {
      if (!activeProjectId) return;
      const json = JSON.stringify(next);
      setThemeVariantsJsonByProject((cur) => {
        if (cur[activeProjectId] === json) return cur;
        return { ...cur, [activeProjectId]: json };
      });
    },
    [activeProjectId],
  );

  const rightTabsPane = (
    <StudioRightTabs
      // Flat full-height column — the page shell owns the surface;
      // the card border/rounding would double up against the canvas's.
      className="border-0 rounded-none bg-transparent"
      appSource={activeDesign.appSource}
      selection={selectionByDesign[activeId] ?? null}
      onSourceChange={handleSourceMutation}
      designName={activeDesign.name}
      designCreatedAt={activeDesign.createdAt}
      designUpdatedAt={activeDesign.updatedAt}
      designStatus={activeDesign.status}
      revisions={undoHistory.snapshotCount}
      projectName={activeProject?.name ?? "Untitled project"}
      onStatusChange={(status) =>
        setDesigns((ds) =>
          ds.map((d) =>
            d.id === activeId ? { ...d, status, updatedAt: Date.now() } : d,
          ),
        )
      }
      tab={rightTab}
      onTabChange={setRightTab}
      viewportWidth={viewportWidth}
      onViewportChange={setViewportWidth}
      zoomState={zoomState}
      zoomApi={zoomApi}
      commentsContent={
        <CommentsTabHost
          threads={commentThreads}
          appSource={activeDesign.appSource}
          selection={selectionByDesign[activeId] ?? null}
          allUsers={allUsers}
          memberships={memberships}
          project={activeProject ?? null}
          composerOpenTrigger={composerOpenTrigger}
          onCreateThread={handleCreateThread}
          onReply={handleAddReply}
          onResolve={handleResolveThread}
          onReopen={handleReopenThread}
          onDeleteThread={handleDeleteThread}
          onDeleteComment={handleDeleteComment}
        />
      }
    />
  );

  // Right pane follows canvas focus: the project home at the all-screens
  // view (no screen focused), the focused screen's settings tabs when
  // zoomed into one. No manual toggle — focus is the single source of
  // truth, so it lines up with the left panel + the URL's screen param.
  const rightPane =
    zoom === "all" && activeProjectId ? (
      <ProjectHome
        projectId={activeProjectId}
        projectName={activeProject?.name ?? "Untitled project"}
        createdAt={activeProject?.createdAt}
        screens={designs.map((d) => ({ id: d.id, name: d.name }))}
        activeScreenId={activeId}
        onSelectScreen={(id) => handleSelectScreenInProject(activeProjectId, id)}
        onInvite={() => setInviteOpen(true)}
        memberCount={activeProject?.access?.length ?? 0}
        currentUserId={commentAuthUser?.id}
      />
    ) : (
      rightTabsPane
    );

  // On desktop the inline panels read their width from CSS variables.
  // Pulling them out of Tailwind into `--gds-studio-chat-width` /
  // `--gds-studio-settings-width` lets a downstream theme tweak the
  // chrome without forking the page, and matches the broader DS
  // pattern (--gds-app-shell-aside etc.). Closed → 0; open → the
  // var. The structure is intentionally shaped like a future
  // ResizablePanelGroup (three siblings, side panes are shrink-0
  // fixed-basis, canvas is flex-1) so swapping the wrapper to
  // <ResizablePanelGroup> and the side panes to <ResizablePanel> is
  // a small diff when drag-resize lands.
  const inlineLeftStyle: React.CSSProperties = {
    flexBasis: leftPanelOpen ? "var(--gds-studio-chat-width, 320px)" : 0,
  };
  const inlineRightStyle: React.CSSProperties = {
    flexBasis: rightPanelOpen ? "var(--gds-studio-settings-width, 340px)" : 0,
  };

  // Pick the org the local user is "in" right now — first matching
  // OrgMembership, falling back to LOCAL_ORG_ID for the very first
  // session before the migration has run. UserSessionProvider uses
  // this as the real-user org; impersonation overrides it.
  const realOrgId =
    orgMemberships.find((m) => m.userId === LOCAL_USER_ID)?.orgId ??
    LOCAL_ORG_ID;

  // Resolve the active project's saved theme draft. ThemeInput is
  // plain JSON so JSON.parse round-trips it; on a parse miss
  // (corrupt entry, future schema bump) we fall back to the global
  // baseline so the page still renders.
  const projectThemeSeed: ThemeInput = React.useMemo(() => {
    const raw = activeProjectId
      ? themeDraftJsonByProject[activeProjectId]
      : undefined;
    if (!raw) return screenThemeBaseline;
    try {
      return JSON.parse(raw) as ThemeInput;
    } catch {
      return screenThemeBaseline;
    }
  }, [activeProjectId, themeDraftJsonByProject, screenThemeBaseline]);

  // Callback for ThemeDraftPersister — invoked (debounced) whenever
  // the active provider's input changes. Stamps the json against
  // the active project's id so switching projects later finds the
  // saved entry. The next persistence effect run picks it up and
  // writes to storage.
  const handleThemeDraftChange = React.useCallback(
    (json: string) => {
      if (!activeProjectId) return;
      setThemeDraftJsonByProject((cur) => {
        if (cur[activeProjectId] === json) return cur;
        return { ...cur, [activeProjectId]: json };
      });
    },
    [activeProjectId],
  );

  return (
    <UserSessionProvider
      users={allUsers}
      orgs={allOrgs}
      realOrgId={realOrgId}
    >
    <ThemeBuilderProvider
      // Keying on activeProjectId forces a remount when the user
      // switches projects, picking up the new project's saved
      // draft as the seed. ThemeBuilderProvider ignores subsequent
      // `initial` changes (line 160 in its source memoises the
      // seed), so the remount is the only way to reseed.
      key={`theme-${activeProjectId ?? "none"}`}
      initial={projectThemeSeed}
      bindTo="draft"
      defaultMode={chromeIsDark ? "dark" : "light"}
    >
      {/* Persister bridges the provider's internal input state
          back to the page so we can save it on the project's
          snapshot. Mounted as a sibling of the rest of the
          provider's children. */}
      <ThemeDraftPersister onChange={handleThemeDraftChange} />

      {/* First-load gate — cover the un-hydrated chrome with a clean branded
          loader until bootstrap has the active project + its snapshot applied.
          Kills the empty/broken flash (composer over a blank canvas) on
          refresh. Doesn't re-trigger on project switches (those keep `booted`
          true and have their own mid-flight handling). */}
      {!booted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <GradeLoader size={56} showLabel />
        </div>
      )}

      {/* Delete confirmation — gates screen + project deletion so nothing
          goes on a stray click, with a louder warning when the target is
          shared (deleting breaks the live /s/ share + /e/ embeds). */}
      {pendingDelete && (
        <ConfirmDeleteDialog
          open
          onOpenChange={(o) => {
            if (!o) setPendingDelete(null);
          }}
          busy={deleteBusy}
          title={`Delete "${pendingDelete.name}"?`}
          confirmLabel={
            pendingDelete.kind === "project"
              ? "Delete project"
              : "Delete screen"
          }
          description={
            pendingDelete.kind === "project"
              ? "This deletes the project and all of its screens."
              : "This deletes this screen."
          }
          warning={
            pendingDelete.kind === "project" && pendingDelete.sharedCount > 0 ? (
              pendingDelete.sharedCount === 1 ? (
                <>
                  1 screen in this project is shared. Deleting the project will
                  break its live share link and any embeds.
                </>
              ) : (
                <>
                  {pendingDelete.sharedCount} screens in this project are
                  shared. Deleting the project will break their live share
                  links and any embeds.
                </>
              )
            ) : pendingDelete.kind === "screen" && pendingDelete.shared ? (
              <>
                This screen is shared. Deleting it will break its live share
                link and any embeds pointing at it.
              </>
            ) : undefined
          }
          onConfirm={confirmDelete}
        />
      )}
      {/* Share-options dialog — viewport-lock toggles for the link
          about to be minted. Each row enables/disables one device
          option in the recipient's share toolbar; the viewport the
          creator is currently on stays locked on (the share has to
          open on something). Theme assignment joins this dialog when
          per-share themes land (STUDIO-THEMES.md). */}
      {pendingShare && (
        <Dialog
          open
          onOpenChange={(o) => {
            if (!o && !shareBusy) setPendingShare(null);
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Share screen</DialogTitle>
              <DialogDescription>
                Choose which viewports the link exposes. Anything off is
                hidden from the recipient&apos;s device menu — useful when a
                viewport isn&apos;t designed yet.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              {pendingShare.specs.map((s) => {
                const isInitial = pendingShare.initialId === s.id;
                const fixed = !s.responsive && s.w && s.h;
                const landscape = s.orientation === "landscape";
                const dims = fixed
                  ? landscape
                    ? `${s.h}×${s.w}`
                    : `${s.w}×${s.h}`
                  : "fills the window";
                return (
                  <div key={s.id} className="flex items-center gap-1.5">
                    {/* DS CheckboxCard — whole card toggles, big hit
                        target. The orientation flip sits OUTSIDE the
                        card (cards must not nest interactive
                        controls). */}
                    <CheckboxCard
                      className="min-w-0 flex-1"
                      checked={s.enabled}
                      disabled={isInitial}
                      onCheckedChange={(next: boolean) => {
                        markShareStale();
                        setPendingShare((cur) =>
                          cur
                            ? {
                                ...cur,
                                specs: cur.specs.map((row) =>
                                  row.id === s.id
                                    ? { ...row, enabled: next }
                                    : row,
                                ),
                              }
                            : cur,
                        );
                      }}
                      label={
                        isInitial ? `${s.label} · opens here` : s.label
                      }
                      aside={
                        <span className="text-[11px] tabular-nums text-muted-foreground">
                          {dims}
                        </span>
                      }
                    />
                    {fixed && (
                      <button
                        type="button"
                        title={
                          landscape
                            ? "Landscape — click for portrait"
                            : "Portrait — click for landscape"
                        }
                        aria-label="Flip orientation"
                        onClick={() => {
                          markShareStale();
                          setPendingShare((cur) =>
                            cur
                              ? {
                                  ...cur,
                                  specs: cur.specs.map((row) =>
                                    row.id === s.id
                                      ? {
                                          ...row,
                                          orientation: landscape
                                            ? "portrait"
                                            : "landscape",
                                        }
                                      : row,
                                  ),
                                }
                              : cur,
                          );
                        }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground"
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "block rounded-[3px] border-[1.5px] border-current",
                            landscape ? "h-2.5 w-3.5" : "h-3.5 w-2.5",
                          )}
                        />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Custom size — name + W×H appends another spec row.
                  The model carries any number of these; orientation
                  flips on the row once added. */}
              <div className="mt-1 flex min-w-0 items-center gap-1.5">
                <input
                  type="text"
                  value={customDraft.label}
                  onChange={(e) =>
                    setCustomDraft((d) => ({ ...d, label: e.target.value }))
                  }
                  placeholder="Custom (e.g. Kiosk)"
                  // size={1} + min-w-0: text inputs default to a ~20ch
                  // intrinsic width that flex refuses to shrink below.
                  size={1}
                  className="h-8 min-w-0 flex-1 rounded-md border border-border/60 bg-transparent px-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground/30"
                />
                <input
                  type="number"
                  value={customDraft.w}
                  onChange={(e) =>
                    setCustomDraft((d) => ({ ...d, w: e.target.value }))
                  }
                  placeholder="W"
                  min={120}
                  // min-w-0 + shrink-0: number inputs have a LARGE
                  // intrinsic min-width (spin buttons + ~size chars);
                  // without min-w-0 the flex item refuses to shrink to
                  // w-16, blowing the row — and the whole dialog grid
                  // column — past the card edge (the overflow bug).
                  className="h-8 w-16 min-w-0 shrink-0 rounded-md border border-border/60 bg-transparent px-2 text-xs tabular-nums text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground/30"
                />
                <span className="shrink-0 text-xs text-muted-foreground">×</span>
                <input
                  type="number"
                  value={customDraft.h}
                  onChange={(e) =>
                    setCustomDraft((d) => ({ ...d, h: e.target.value }))
                  }
                  placeholder="H"
                  min={120}
                  className="h-8 w-16 min-w-0 shrink-0 rounded-md border border-border/60 bg-transparent px-2 text-xs tabular-nums text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground/30"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={
                    !(Number(customDraft.w) >= 120) ||
                    !(Number(customDraft.h) >= 120)
                  }
                  onClick={() => {
                    const w = Math.round(Number(customDraft.w));
                    const h = Math.round(Number(customDraft.h));
                    if (!(w >= 120) || !(h >= 120)) return;
                    markShareStale();
                    setPendingShare((cur) => {
                      if (!cur) return cur;
                      const n =
                        cur.specs.filter((row) =>
                          row.id.startsWith("custom-"),
                        ).length + 1;
                      return {
                        ...cur,
                        specs: [
                          ...cur.specs,
                          {
                            id: `custom-${n}`,
                            label:
                              customDraft.label.trim() || `Custom ${w}×${h}`,
                            w,
                            h,
                            enabled: true,
                          },
                        ],
                      };
                    });
                    setCustomDraft({ label: "", w: "", h: "" });
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
            {/* The minted link — shown in place so it can be re-copied,
                with a stale warning once options diverge from what the
                link was minted with. */}
            {createdShare && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <input
                    readOnly
                    value={createdShare.url}
                    onFocus={(e) => e.currentTarget.select()}
                    size={1}
                    className={cn(
                      "h-8 min-w-0 flex-1 rounded-md border border-border/60 bg-muted/30 px-2 text-xs text-foreground outline-none",
                      createdShare.stale && "opacity-50 line-through",
                    )}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    disabled={createdShare.stale}
                    onClick={async () => {
                      await navigator.clipboard.writeText(createdShare.url);
                      toast.success("Share link copied");
                    }}
                  >
                    Copy
                  </Button>
                </div>
                {createdShare.stale && (
                  <p className="text-[11px] text-muted-foreground">
                    Options changed since this link was created — regenerate
                    to apply them (the old link is revoked).
                  </p>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="ghost"
                disabled={shareBusy}
                onClick={() => setPendingShare(null)}
              >
                {createdShare && !createdShare.stale ? "Done" : "Cancel"}
              </Button>
              <Button
                onClick={confirmShareScreen}
                disabled={shareBusy || (createdShare !== null && !createdShare.stale)}
              >
                {shareBusy ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {createdShare ? "Regenerating…" : "Creating…"}
                  </>
                ) : createdShare ? (
                  createdShare.stale ? "Regenerate link" : "Link created"
                ) : (
                  "Create link"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {/* AppShell takes over from the hand-rolled flex column.
          `nav="none"` gives us Header + Main + (unused) Footer stacked
          vertically — exactly the Studio shape. Studio is a tool that
          fills the viewport, so we constrain to `h-screen` here
          rather than the marketing-flavoured `min-h-screen` default
          AppShell ships with. */}
      <AppShell nav="none" className="h-screen min-h-0 overflow-hidden">
        {/* The old AppShellHeader ("Grade Studio" title bar) is gone —
            its contents (settings gear, account menu, super-admin
            shield, streaming indicator) live in the left app rail.
            The canvas keeps its own toolbar + breadcrumb in the
            central column; the side panels run full height. */}
        <AppShellMain className="min-h-0 overflow-hidden p-0">
          {/* Body row — app rail | chat | canvas | detail. Side panes
              use flex-basis from CSS vars so a downstream theme can
              tweak widths without touching this file. Toggle closes a
              pane by animating basis → 0 + adding `hidden` on the
              inner div so its content is fully removed from layout
              (otherwise padding/border would still occupy ~1px). The
              canvas's own card border is the only separator between
              the columns — the side panels are deliberately flat.
              Panel toggles are INSTANT (no flex-basis transition):
              the 150ms ease looked nice in isolation, but the chat
              column reflows during the tween — bubbles shrink and
              slide on every toggle. A hard cut is calmer and matches
              Figma's hide-UI behaviour. */}
          <div className="flex h-full min-h-0">
            <StudioRail
              streaming={activeStreaming}
              elapsedMs={liveElapsedMs}
              users={allUsers}
              orgs={allOrgs}
              orgMemberships={orgMemberships}
              onOpenSettings={() => setSettingsOpen(true)}
              onOpenSuperAdmin={() => setSuperAdminOpen(true)}
            />
            {!isMobile && (
              <div
                data-gds-part="studio-left-pane"
                className="min-w-0 shrink-0 overflow-hidden bg-muted/30"
                style={inlineLeftStyle}
                aria-hidden={!leftPanelOpen}
              >
                <div className={leftPanelOpen ? "h-full" : "hidden"}>
                  {leftPane}
                </div>
              </div>
            )}
            <div className="min-w-0 flex-1 relative">
              {/* Assets page — takes over the canvas full-screen when the
                  Assets section is active. The canvas stays MOUNTED (just
                  hidden) so tiles/iframes don't reboot on the way back. */}
              {projectSection === "assets" && zoom === "all" && (
                <div className="absolute inset-0 z-10 overflow-y-auto bg-muted/20 p-8">
                  <div className="mx-auto max-w-5xl">
                    <h2 className="text-lg font-semibold text-foreground">
                      Assets
                    </h2>
                    <p className="mb-6 mt-1 text-sm text-muted-foreground">
                      Your project&apos;s media, fonts, and documents — used
                      by screens and Motions across this project.
                    </p>
                    <AssetBrowser projectId={activeProjectId} />
                  </div>
                </div>
              )}
              {/* Design System page — the project's theme (colours, type,
                  shape, saved variants), one level up from any screen. Takes
                  over the canvas like Assets; the canvas stays mounted below
                  so screens don't reboot on the way back. Per-project, not
                  per-screen (STUDIO-THEMES.md T1). */}
              {projectSection === "styles" && zoom === "all" && (
                <div className="absolute inset-0 z-10 flex flex-col bg-background">
                  <div className="shrink-0 border-b border-border px-8 py-4">
                    <h2 className="text-lg font-semibold text-foreground">
                      Design System
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      The theme for this project — colours, type, shape, and
                      saved variants. Applies to every screen.
                    </p>
                  </div>
                  <div className="min-h-0 flex-1">
                    <div className="mx-auto h-full max-w-3xl">
                      <StylesTabContent
                        section={stylesSection}
                        variants={projectThemeVariants}
                        onVariantsChange={handleThemeVariantsChange}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div
                className={cn(
                  "h-full",
                  (projectSection === "assets" || projectSection === "styles") &&
                    zoom === "all" &&
                    "invisible",
                )}
              >
              <StudioThemedCanvas
                designs={visibleDesigns}
                focusedId={activeId}
                onFocus={setActiveId}
                view={view}
                onViewChange={setView}
                isStreaming={Boolean(streamingByDesign[activeId])}
                draftSource={draftByDesign[activeId] ?? null}
                selection={selectionByDesign[activeId] ?? null}
                onSelect={handleSelect}
                onClearSelection={handleClearSelection}
                onCommentSelect={handleCommentSelect}
                onCanvasModeChange={handleCanvasModeChange}
                onAddDesign={handleAddDesign}
                gridAddTile={
                  atCap
                    ? undefined
                    : projectSection === "motions"
                      ? {
                          title: "New Motion",
                          description:
                            "A directed sequence of scenes — title cards, screens with cameras, video. Starts from a starter you can reshape.",
                          onClick: handleAddMotion,
                        }
                      : {
                          title: "New screen",
                          description:
                            "Start blank and describe it in chat — or use Starters in the toolbar for reference layouts.",
                          onClick: () => handleAddDesign(),
                        }
                }
                onCloseDesign={handleCloseDesign}
                onRenameDesign={handleRenameDesign}
                onDuplicateDesign={handleDuplicateDesign}
                onShareScreen={handleShareScreen}
                onInviteToProject={() => setInviteOpen(true)}
                canAddMore={!atCap}
                onSourceMutation={handleSourceMutation}
                rendererMode={rendererMode}
                canUndo={undoHistory.canUndo}
                canRedo={undoHistory.canRedo}
                undoLabel={undoHistory.undoLabel}
                redoLabel={undoHistory.redoLabel}
                onUndo={handleUndo}
                onRedo={handleRedo}
                leftPanelOpen={leftPanelOpen}
                rightPanelOpen={rightPanelOpen}
                onToggleLeftPanel={toggleLeftPanel}
                onToggleRightPanel={toggleRightPanel}
                zoom={zoom}
                onZoomChange={setZoom}
                viewportWidth={viewportWidth}
                onViewportChange={setViewportWidth}
                onZoomStateChange={setZoomState}
                onZoomApiReady={setZoomApi}
                projectName={
                  projects.find((p) => p.id === activeProjectId)?.name
                }
                sectionLabel={
                  projectSection === "motions" ? "Motion Studio" : "All screens"
                }
                saveStatus={saveStatus}
                commentThreads={commentThreads}
                onCommentPinClick={(threadId) => {
                  // Click a pin → make sure the right panel is
                  // open + the Comments tab is active. The thread
                  // will be visible in the list there. Scrolling
                  // the specific thread into focus is a refinement
                  // (sticky-target inside CommentsTab keyed off a
                  // focused-thread state) — for now this gets the
                  // user to the right surface.
                  setRightPanelOpen(true);
                  setRightTab("comments");
                  void threadId;
                }}
                getCommentUser={(id) => allUsers.find((u) => u.id === id)}
              />
              </div>
            </div>
            {!isMobile && (
              <div
                data-gds-part="studio-right-pane"
                className="min-w-0 shrink-0 overflow-hidden bg-muted/30"
                style={inlineRightStyle}
                aria-hidden={!rightPanelOpen}
              >
                <div className={rightPanelOpen ? "h-full" : "hidden"}>
                  {rightPane}
                </div>
              </div>
            )}
          </div>
        </AppShellMain>
      </AppShell>

      {/* Mobile overlay path — below md the inline panes disappear and
          chat + settings come in as Sheets driven by the same open
          state. Keyboard shortcuts and toolbar buttons keep working
          identically on either side of the breakpoint. */}
      {isMobile && (
        <>
          <Sheet open={leftPanelOpen} onOpenChange={setLeftPanelOpen}>
            <SheetContent
              side="left"
              className="w-[88vw] max-w-md p-0 flex flex-col"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>
                  {zoom === "all" ? "Projects" : "Chat"}
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 min-h-0 overflow-hidden">
                {leftPane}
              </div>
            </SheetContent>
          </Sheet>
          <Sheet open={rightPanelOpen} onOpenChange={setRightPanelOpen}>
            <SheetContent
              side="right"
              className="w-[88vw] max-w-md p-0 flex flex-col"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Layout, Theme &amp; Notes</SheetTitle>
              </SheetHeader>
              <div className="flex-1 min-h-0 overflow-hidden">
                {rightPane}
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}

      <StudioSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSettingsChange={updateSettings}
        showUsage={showUsage}
        onShowUsageChange={setShowUsage}
        showRefs={showRefs}
        onShowRefsChange={setShowRefs}
        showActions={showActions}
        onShowActionsChange={setShowActions}
        showThinking={showThinking}
        onShowThinkingChange={setShowThinking}
        showSteps={showSteps}
        onShowStepsChange={setShowSteps}
        showDuration={showDuration}
        onShowDurationChange={setShowDuration}
        streamResponseText={streamResponseText}
        onStreamResponseTextChange={setStreamResponseText}
        assistantBubble={assistantBubble}
        onAssistantBubbleChange={setAssistantBubble}
        gradeUiVersion={GRADEUI_VERSION}
        studioVersion={STUDIO_VERSION}
      />

      {/* Super admin sheet — internal-only impersonation surface.
          Mounted at the page root so it overlays Studio. Only the
          shield button + keyboard shortcut can open it; rendering
          here doesn't expose it to non-admins. */}
      <SuperAdminSheet
        open={superAdminOpen}
        onOpenChange={setSuperAdminOpen}
        users={allUsers}
        orgs={allOrgs}
      />

      {/* New project dialog — proper form replacing the legacy
          window.prompt flow. ProjectsMenu's "+" affordance opens
          this; submit hits handleSubmitCreateProject which mints
          the project, refreshes the index, and switches to it. */}
      <NewProjectDialog
        open={newProjectOpen}
        onOpenChange={setNewProjectOpen}
        onCreate={handleSubmitCreateProject}
      />
      <InvitePeopleDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        projectId={activeProjectId ?? undefined}
        projectName={activeProject?.name}
        onInvite={handleInvite}
      />
    </ThemeBuilderProvider>
    </UserSessionProvider>
  );
}

/**
 * CommentsTabHost — mounted inside UserSessionProvider so it can
 * read the impersonation-aware current user + permission state.
 * Forwards everything else to the pure CommentsTab component.
 *
 * Lives in this file (rather than its own module) so it can pull
 * the shared Project/Membership/User types without a circular
 * import path. Pure pass-through of page state — the actual
 * mutation handlers live on the page above.
 */
function CommentsTabHost({
  threads,
  appSource,
  selection,
  allUsers,
  memberships,
  project,
  composerOpenTrigger,
  onCreateThread,
  onReply,
  onResolve,
  onReopen,
  onDeleteThread,
  onDeleteComment,
}: {
  threads: CommentThreadWithMessages[];
  appSource: string | null;
  selection: StudioSelection | null;
  allUsers: StoredUser[];
  memberships: Membership[];
  project: Project | null;
  composerOpenTrigger: number;
  onCreateThread: (input: {
    anchorId: string;
    anchorKind: "source" | "instance";
    elementLabel: string;
    componentName?: string;
    body: string;
  }) => Promise<void>;
  onReply: (
    threadId: string,
    parentCommentId: string | undefined,
    body: string,
  ) => Promise<void>;
  onResolve: (threadId: string) => void;
  onReopen: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  onDeleteComment: (commentId: string) => void;
}) {
  const currentUser = useCurrentUser();
  // canWrite = the current effective user has write access to the
  // active project. Viewers see threads but no composer; null
  // project (loading) also reads as no-access until data lands.
  const canWrite = useCanAccess(
    memberships,
    project?.owner,
    project?.access,
    "write",
  );

  // Build the id→user lookup the thread cards need for author
  // avatars. Cheap; rebuilt only when the user list changes.
  const getUser = React.useCallback(
    (id: string) => allUsers.find((u) => u.id === id),
    [allUsers],
  );

  return (
    <CommentsTab
      threads={threads}
      appSource={appSource}
      selection={selection}
      getUser={getUser}
      currentUser={currentUser}
      canWrite={canWrite}
      composerOpenTrigger={composerOpenTrigger}
      onCreateThread={onCreateThread}
      onReply={onReply}
      onResolve={onResolve}
      onReopen={onReopen}
      onDeleteThread={onDeleteThread}
      onDeleteComment={onDeleteComment}
    />
  );
}

/**
 * Right-cluster of the Studio topbar. Lives inside
 * UserSessionProvider so it can read the impersonation state and
 * surface it. Renders, in order:
 *
 *   - Impersonating pill (only when impersonation is active)
 *   - Shield button (only when current user is super admin)
 *   - User avatar + display name
 *   - Settings gear
 */
/**
 * StudioRail — the slim app rail down the left edge. Replaces the old
 * top header: Grade mark at the top (links home), a transient
 * generating spinner, and the chrome actions (impersonation indicator,
 * super-admin shield, settings gear, account menu) stacked at the
 * bottom. Everything is icon-sized with a title tooltip; the account
 * dropdown opens to the right of the rail.
 */
function StudioRail({
  streaming,
  elapsedMs,
  users,
  orgs,
  orgMemberships,
  onOpenSettings,
  onOpenSuperAdmin,
}: {
  streaming: boolean;
  elapsedMs: number;
  users: StoredUser[];
  orgs: Organisation[];
  orgMemberships: OrgMembership[];
  onOpenSettings: () => void;
  onOpenSuperAdmin: () => void;
}) {
  const user = useCurrentUser();
  const org = useCurrentOrg();
  const {
    isImpersonating,
    stopImpersonation,
    startImpersonation,
    realUser,
  } = useImpersonation();
  // Supabase auth client — only present when the deploy has auth
  // configured. Used to drive the Sign out menu item (which is only
  // meaningful when the user actually has a session to sign out of).
  const supabaseAuth = useSupabaseAuth();
  const canSignOut = Boolean(supabaseAuth.supabase && supabaseAuth.user);
  // Two-letter initials for the Avatar fallback. Take the first
  // letter of the first two whitespace-separated words; fall back
  // to a single letter for one-word names.
  const initials = React.useMemo(() => {
    const parts = user.name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
  }, [user.name]);

  // Org switcher items — orgs the REAL user is a member of, so a
  // non-super-admin still gets to switch between their own orgs.
  // Super admins additionally have the SuperAdminSheet for picking
  // arbitrary orgs.
  const myOrgs = React.useMemo(() => {
    const myOrgIds = new Set(
      orgMemberships
        .filter((m) => m.userId === realUser.id)
        .map((m) => m.orgId),
    );
    return orgs.filter((o) => myOrgIds.has(o.id));
  }, [orgs, orgMemberships, realUser.id]);

  return (
    <aside
      className="flex h-full w-12 shrink-0 flex-col items-center gap-2 border-r border-border/60 bg-muted/30 py-3"
      aria-label="Studio rail"
    >
      {/* Brand mark — links back to the docs home. */}
      <a
        href="/"
        title="gradeui.com"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-muted transition-colors"
      >
        <GradeMark className="h-5 w-5" label="Grade" />
      </a>

      <div className="flex-1" />

      {/* Transient generating indicator — spinner only (the rail is
          48px wide); the elapsed time rides the tooltip. The chat's
          loading dots + per-turn duration carry the detail. */}
      {streaming && (
        <span
          className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground"
          title={`Generating… ${(elapsedMs / 1000).toFixed(1)}s`}
          aria-live="polite"
          aria-label="Generating"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
        </span>
      )}

      {isImpersonating && (
        <button
          type="button"
          onClick={stopImpersonation}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
          title={`Impersonating ${user.name}${org ? ` · ${org.name}` : ""} — click to stop`}
          aria-label="Stop impersonating"
        >
          <ShieldCheck className="h-4 w-4" aria-hidden />
        </button>
      )}
      {user.superAdmin && (
        <button
          type="button"
          onClick={onOpenSuperAdmin}
          aria-label="Open super admin"
          title="Super admin (⌘⇧⌥A)"
          className={cn(
            "h-8 w-8 inline-flex items-center justify-center rounded-md transition-colors",
            "[&_svg]:size-4 [&_svg]:shrink-0",
            "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
        >
          <ShieldCheck />
        </button>
      )}

      <StudioSettingsTrigger onClick={onOpenSettings} />

      {/* Account menu — avatar-only trigger; the menu opens to the
          right of the rail and carries the identity block, org
          switcher, and sign-out. */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Open account menu"
            title={`${user.name}${org ? ` · ${org.name}` : ""}`}
            className={cn(
              "inline-flex rounded-full transition-shadow",
              "hover:ring-2 hover:ring-ring/40 focus-visible:ring-2 focus-visible:ring-ring",
              "focus-visible:outline-none data-[state=open]:ring-2 data-[state=open]:ring-ring/60",
            )}
          >
            <Avatar className="h-7 w-7">
              {user.avatarUrl && (
                <AvatarImage src={user.avatarUrl} alt={user.name} />
              )}
              <AvatarFallback className="text-[11px]">
                {initials || "?"}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="end" className="w-64">
          {/* Identity block — read-only header showing who's
              currently effective. When impersonating, a Badge
              flags the override so the developer can't miss it. */}
          <div className="flex items-center gap-2 px-2 py-2">
            <Avatar className="h-9 w-9">
              {user.avatarUrl && (
                <AvatarImage src={user.avatarUrl} alt={user.name} />
              )}
              <AvatarFallback className="text-xs">
                {initials || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="text-sm font-medium text-foreground truncate">
                {user.name}
              </span>
              <span className="text-[11px] text-muted-foreground truncate">
                {user.email ?? "local"}
              </span>
            </div>
            {isImpersonating && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                Acting
              </Badge>
            )}
          </div>

          <DropdownMenuSeparator />

          {/* Org switcher — quick pick across orgs the real user is
              a member of. Picking another org uses the impersonation
              override for now (which sessionStorage-persists);
              swap to a proper active-org pointer when the auth
              layer lands. The "current" radio bullet reflects the
              EFFECTIVE org (impersonation-aware). */}
          {myOrgs.length > 1 && (
            <>
              <DropdownMenuLabel className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Switch organisation
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={org?.id ?? ""}
                onValueChange={(value) =>
                  startImpersonation({ orgId: value || null })
                }
              >
                {myOrgs.map((o) => (
                  <DropdownMenuRadioItem key={o.id} value={o.id}>
                    <span className="flex-1 truncate">{o.name}</span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 capitalize"
                    >
                      {o.plan}
                    </Badge>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Identity controls. Super admin gets the full sheet
              entry; everyone gets the "stop impersonating" reset
              when an override is active. */}
          {isImpersonating && (
            <DropdownMenuItem onClick={stopImpersonation}>
              <X />
              Stop impersonating
            </DropdownMenuItem>
          )}
          {user.superAdmin && (
            <DropdownMenuItem onClick={onOpenSuperAdmin}>
              <UsersIcon />
              Switch identity…
              <DropdownMenuShortcut>⌘⇧⌥A</DropdownMenuShortcut>
            </DropdownMenuItem>
          )}
          {(isImpersonating || user.superAdmin) && <DropdownMenuSeparator />}

          <DropdownMenuItem onClick={onOpenSettings}>
            <SettingsIcon />
            Settings
          </DropdownMenuItem>
          {canSignOut ? (
            // Two-phase sign-out:
            //   1. supabase.auth.signOut() clears the SDK's in-memory
            //      session + localStorage token on the client. The UI
            //      flips to signed-out state immediately.
            //   2. POSTing to /auth/signout runs the server route,
            //      which calls signOut() again with the request
            //      cookies — that's the only way to reliably clear
            //      the HttpOnly refresh-token cookie across browsers.
            //      The route then 303-redirects to `/` so the user
            //      lands on the marketing home with a clean session.
            <DropdownMenuItem
              onClick={async () => {
                if (supabaseAuth.supabase) {
                  await supabaseAuth.supabase.auth.signOut();
                }
                const form = document.createElement("form");
                form.method = "POST";
                form.action = "/auth/signout";
                document.body.appendChild(form);
                form.submit();
              }}
            >
              <LogOut />
              Sign out
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled>
              <LogOut />
              Sign out
              <DropdownMenuShortcut>Local</DropdownMenuShortcut>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </aside>
  );
}

/**
 * Small helper that reads the SCREEN draft theme + mode off the
 * ThemeBuilderProvider and forwards them into StudioCanvas. The draft
 * is independent of the chrome theme — the Theme tab in the right
 * column drives this exclusively, so the canvas re-skins on slider
 * drag, mode flip, and theme-picker rebase but the docs chrome stays
 * untouched.
 *
 * Unlike its StudioThemedPreview predecessor we do NOT key on activeId
 * here: the canvas spans every design and only shifts its focus when
 * activeId changes, so remounting would thrash every mounted iframe.
 */
function StudioThemedCanvas({
  designs,
  focusedId,
  onFocus,
  view,
  onViewChange,
  isStreaming,
  draftSource,
  selection,
  onSelect,
  onClearSelection,
  onCommentSelect,
  onAddDesign,
  gridAddTile,
  onCloseDesign,
  onRenameDesign,
  onDuplicateDesign,
  onShareScreen,
  onInviteToProject,
  canAddMore,
  onSourceMutation,
  rendererMode,
  canUndo,
  canRedo,
  undoLabel,
  redoLabel,
  onUndo,
  onRedo,
  leftPanelOpen,
  rightPanelOpen,
  onToggleLeftPanel,
  onToggleRightPanel,
  zoom,
  onZoomChange,
  viewportWidth,
  onViewportChange,
  onZoomStateChange,
  onZoomApiReady,
  projectName,
  sectionLabel,
  saveStatus,
  commentThreads,
  onCommentPinClick,
  getCommentUser,
  onCanvasModeChange,
}: {
  designs: Design[];
  focusedId: string;
  onFocus: (id: string) => void;
  view: "preview" | "code" | "timeline";
  onViewChange: (v: "preview" | "code" | "timeline") => void;
  isStreaming: boolean;
  /** Speculative mid-stream draft for the focused design — see
   *  StudioCanvasProps.draftSource. */
  draftSource?: string | null;
  selection: StudioSelection | null;
  onSelect: (selection: StudioSelection) => void;
  onClearSelection: () => void;
  onCommentSelect?: (selection: StudioSelection) => void;
  onAddDesign: (seed?: { source: string; name?: string }) => void;
  /** Dashed create-tile for the All grid (Motion Studio's landing/new
   *  affordance). Forwarded to StudioCanvas → TileGrid. */
  gridAddTile?: { title: string; description: string; onClick: () => void };
  onCloseDesign: (id: string) => void;
  onRenameDesign: (id: string, name: string) => void;
  onDuplicateDesign?: (id: string) => void;
  onShareScreen?: (id: string) => void;
  onInviteToProject?: () => void;
  canAddMore: boolean;
  onSourceMutation: (next: string) => void;
  rendererMode: "sandpack" | "fast";
  canUndo: boolean;
  canRedo: boolean;
  undoLabel: string | null;
  redoLabel: string | null;
  onUndo: () => void;
  onRedo: () => void;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  zoom: "fit" | "all";
  onZoomChange: (zoom: "fit" | "all") => void;
  viewportWidth: ViewportWidth;
  onViewportChange: (v: ViewportWidth) => void;
  onZoomStateChange: (s: { effectiveZoom: number; fitMode: boolean }) => void;
  onZoomApiReady: (api: {
    pickZoom: (z: number) => void;
    stepZoom: (dir: number) => void;
    fit: () => void;
  }) => void;
  projectName?: string;
  /** Grid-mode crumb label ("All screens" / "Motion Studio"). */
  sectionLabel?: string;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  commentThreads?: CommentThreadWithMessages[];
  onCommentPinClick?: (threadId: string) => void;
  getCommentUser?: (id: string) => StoredUser | undefined;
  /** Forwarded to StudioCanvas — fires when the user chooses a canvas
   *  mode (select/comment/null) so the page can auto-switch the right
   *  panel tab. */
  onCanvasModeChange?: (mode: "select" | "comment" | null) => void;
}) {
  const theme: GeneratedTheme = useGeneratedTheme();
  const [mode] = useThemeBuilderMode();
  return (
    <StudioCanvas
      designs={designs}
      focusedId={focusedId}
      onFocus={onFocus}
      theme={theme}
      mode={mode}
      view={view}
      onViewChange={onViewChange}
      isStreaming={isStreaming}
      draftSource={draftSource}
      selection={selection}
      onSelect={onSelect}
      onClearSelection={onClearSelection}
      onCommentSelect={onCommentSelect}
      onAddDesign={onAddDesign}
      gridAddTile={gridAddTile}
      onCloseDesign={onCloseDesign}
      onRenameDesign={onRenameDesign}
      onDuplicateDesign={onDuplicateDesign}
      onShareScreen={onShareScreen}
      onInviteToProject={onInviteToProject}
      canAddMore={canAddMore}
      onSourceMutation={onSourceMutation}
      rendererMode={rendererMode}
      canUndo={canUndo}
      canRedo={canRedo}
      undoLabel={undoLabel}
      redoLabel={redoLabel}
      onUndo={onUndo}
      onRedo={onRedo}
      leftPanelOpen={leftPanelOpen}
      rightPanelOpen={rightPanelOpen}
      onToggleLeftPanel={onToggleLeftPanel}
      onToggleRightPanel={onToggleRightPanel}
      zoom={zoom}
      onZoomChange={onZoomChange}
      viewportWidth={viewportWidth}
      onViewportChange={onViewportChange}
      onZoomStateChange={onZoomStateChange}
      onZoomApiReady={onZoomApiReady}
      projectName={projectName}
      sectionLabel={sectionLabel}
      saveStatus={saveStatus}
      commentThreads={commentThreads}
      onCommentPinClick={onCommentPinClick}
      getCommentUser={getCommentUser}
      onCanvasModeChange={onCanvasModeChange}
    />
  );
}
