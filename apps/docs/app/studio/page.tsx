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
 *   - Notes — per-design free-form text, owned by `notesByDesign`
 *     here and threaded down.
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
  ChevronDown,
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
  AppShellHeader,
  AppShellMain,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
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
import { StudioRightTabs } from "@/components/studio/studio-right-tabs";
import {
  StudioSettings,
  StudioSettingsTrigger,
  type RendererMode,
  type StorageBackend,
  type UserTier,
} from "@/components/studio/studio-settings";
import { useGradeTheme } from "@/components/grade-theme-provider";
import {
  ThemeBuilderProvider,
  useGeneratedTheme,
  useThemeBuilderMode,
} from "@/components/theme-builder";
import {
  studioInput,
  type GeneratedTheme,
  type ThemeInput,
} from "@/lib/themes";
import { cloneInput } from "@/lib/studio-state";
import {
  type StudioSelection,
} from "@/lib/chat-sandpack";
import { buildSystemPrompt } from "@gradeui/studio/playbook";
import {
  createDesign,
  initialDesigns,
  type Design,
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
  type Team,
  type User as StoredUser,
} from "@/lib/studio-storage";
import { ProjectsMenu } from "@/components/studio/projects-menu";
import { NewProjectDialog } from "@/components/studio/new-project-dialog";
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
  const systemPrompt = useMemo(() => buildSystemPrompt(), []);

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
  const [notesByDesign, setNotesByDesign] = useState<Record<string, string>>(
    {},
  );

  const handleNotesChange = useCallback(
    (next: string) => {
      setNotesByDesign((m) => ({ ...m, [activeId]: next }));
    },
    [activeId],
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
        authorId: LOCAL_USER_ID,
      });
      await refreshCommentThreads();
    },
    [storage, activeProjectId, activeId, refreshCommentThreads],
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
        authorId: LOCAL_USER_ID,
        body,
      });
      await refreshCommentThreads();
    },
    [storage, activeProjectId, activeId, refreshCommentThreads],
  );

  const handleResolveThread = useCallback(
    async (threadId: string) => {
      if (!activeProjectId || !activeId) return;
      await storage.resolveThread({
        projectId: activeProjectId,
        designId: activeId,
        threadId,
        userId: LOCAL_USER_ID,
      });
      await refreshCommentThreads();
    },
    [storage, activeProjectId, activeId, refreshCommentThreads],
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
    designs: { id: string; name: string }[];
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
      const targetId =
        (urlProject && list.some((p) => p.id === urlProject) && urlProject) ||
        (stored && list.some((p) => p.id === stored) && stored) ||
        list[0].id;
      setActiveProjectId(targetId);
      const snap = await storage.loadProject(targetId);
      if (cancelled || !snap) return;
      // Override the loaded project's persisted activeDesignId with
      // the URL's screen param when it resolves to a real design —
      // same precedence rule applies one level down.
      const initialDesignId =
        urlScreen && snap.designs.some((d) => d.id === urlScreen)
          ? urlScreen
          : snap.activeDesignId;
      applySnapshot({ ...snap, activeDesignId: initialDesignId });
      setLoadedProjectId(targetId);
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
      list.forEach((p, i) => {
        const s = allSnaps[i];
        if (s) {
          summaries[p.id] = computeSummary(s);
          // Pre-seed every project's theme draft from its
          // persisted snapshot. The active project's entry feeds
          // the ThemeBuilderProvider on its first mount; inactive
          // entries hang here until the user switches into them.
          if (s.themeDraftJson) themeDrafts[p.id] = s.themeDraftJson;
        }
      });
      setProjectSummaries(summaries);
      setThemeDraftJsonByProject(themeDrafts);

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
        designs: snap.designs.map((d) => ({ id: d.id, name: d.name })),
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
    if (loadedProjectId !== activeProjectId) return;
    const project = projects.find((p) => p.id === activeProjectId);
    if (!project) return;
    const snapshot: ProjectSnapshot = {
      project,
      designs,
      activeDesignId: activeId,
      messagesByDesign,
      notesByDesign,
      themeDraftJson: themeDraftJsonByProject[activeProjectId],
    };
    storage.saveProject(snapshot).catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("[studio] saveProject failed:", err);
    });
  }, [
    activeProjectId,
    loadedProjectId,
    projects,
    designs,
    activeId,
    messagesByDesign,
    notesByDesign,
    themeDraftJsonByProject,
    storage,
  ]);

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
        designs: designs.map((d) => ({ id: d.id, name: d.name })),
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
    url.searchParams.set("screen", activeId);
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
  }, [activeProjectId, loadedProjectId, activeId]);

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
      patch: { name?: string; description?: string },
    ) => {
      await storage.updateProject(id, patch);
      const list = await storage.listProjects();
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
      if (p && p !== cur.activeProjectId) {
        cur.handleSwitchProject(p).then(() => {
          if (s) setActiveId(s);
        });
      } else if (s && s !== cur.activeId) {
        setActiveId(s);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const handleDeleteProject = useCallback(
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

  const [view, setView] = useState<"preview" | "code">("preview");

  // Dev toggles in the header chrome. Scaffolding for the upcoming
  // renderer split + tier gating — surfaced now so the controls exist
  // before the features they drive.
  //
  // rendererMode: currently forwarded to StudioCanvas but only acted on
  // once the fast renderer lands (step 5 of the renderer rollout). Until
  // then both values render Sandpack — the toggle is visible but
  // effectively a no-op. Default stays "sandpack" to preserve today's
  // behavior; it flips to "fast" the day FocusedFastMount ships.
  //
  // userTier: placeholder for visibility-gated UI. No consumer yet —
  // when pro/enterprise-only chrome lands (e.g. exporting to a per-
  // client starter, hiding the npm path for free), read this state.
  const [rendererMode, setRendererMode] = useState<RendererMode>("fast");
  // Storage backend pick — defaults to localstorage so a fresh
  // clone runs without setup. The factory in lib/studio-storage
  // doesn't read this yet (always returns LocalStorage); it'll
  // start branching once the Supabase adapter lands.
  const [storageBackend, setStorageBackend] =
    useState<StorageBackend>("localstorage");
  const [userTier, setUserTier] = useState<UserTier>("free");

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
  }, [toggleLeftPanel, toggleRightPanel]);

  // Canvas zoom — lifted out of StudioCanvas so the page can route
  // the left panel based on view: "fit" → StudioChat for the focused
  // screen, "all" → ProjectsMenu for the workspace. Default "fit"
  // matches the pre-projects behaviour (user lands on their focused
  // screen). Studio's "Eat your own dogfood" target: the chrome
  // reacts to canvas state without the canvas reaching up.
  const [zoom, setZoom] = useState<"fit" | "all">("fit");

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

  const handleLatestCode = useCallback(
    (code: string | null) => {
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
    },
    [activeId]
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
    },
    [activeId, undoHistory]
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
    "layout" | "theme" | "comments" | "notes"
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
  const MAX_DESIGNS = 8;
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
    (seed?: { source: string; name?: string }) => {
      if (designs.length >= MAX_DESIGNS) return;
      const fresh = createDesign(designs.length, seed?.name);
      const next: Design = seed?.source
        ? { ...fresh, appSource: seed.source }
        : fresh;
      setDesigns((ds) => (ds.length >= MAX_DESIGNS ? ds : [...ds, next]));
      setActiveId(next.id);
    },
    [designs.length]
  );

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
    },
    [designs]
  );

  const handleCloseDesign = useCallback(
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
    },
    [activeId, designs]
  );

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
  // The left pane is context-aware: ProjectsMenu when the canvas is
  // in "all screens" mode (chat is screen-scoped — it makes no sense
  // at the grid view); StudioChat when zoomed into a focused screen.
  // The page owns `zoom` (lifted from StudioCanvas), so the swap is
  // controlled here.
  const leftPane = zoom === "all" && activeProjectId ? (
    <ProjectsMenu
      projects={projects}
      teams={teams}
      activeProjectId={activeProjectId}
      activeDesignId={activeId}
      summaries={projectSummaries}
      onSelectProject={handleSwitchProject}
      onSelectScreen={handleSelectScreenInProject}
      onCreateProject={handleOpenCreateProject}
      onUpdateProject={handleUpdateProject}
      onRenameProject={handleRenameProject}
      onDeleteProject={handleDeleteProject}
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

  const rightTabsPane = (
    <StudioRightTabs
      appSource={activeDesign.appSource}
      selection={selectionByDesign[activeId] ?? null}
      onSourceChange={handleSourceMutation}
      notes={notesByDesign[activeId] ?? ""}
      onNotesChange={handleNotesChange}
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
      {/* AppShell takes over from the hand-rolled flex column.
          `nav="none"` gives us Header + Main + (unused) Footer stacked
          vertically — exactly the Studio shape. Studio is a tool that
          fills the viewport, so we constrain to `h-screen` here
          rather than the marketing-flavoured `min-h-screen` default
          AppShell ships with. */}
      <AppShell nav="none" className="h-screen min-h-0 overflow-hidden">
        <AppShellHeader className="border-b bg-muted/30 shrink-0">
          {/* Full-bleed — no max-width wrapper. Studio is a tool, not
              a marketing page, so the chrome stretches edge-to-edge.
              The header is deliberately near-empty — product title +
              Settings gear. Every chrome control that used to live up
              here (model picker, theme switcher, light/dark mode, dev
              toggles) now lives inside the <StudioSettings> Sheet
              that the gear opens. Eventually the gear migrates out of
              the header entirely into a left app rail. */}
          <div className="px-4 md:px-6 py-2.5 flex items-center justify-between gap-4">
            <div className="min-w-0 flex items-center gap-3">
              <h1 className="text-base font-semibold leading-tight">
                Grade Studio
              </h1>
              {/* Transient streaming indicator — only renders while
                  the active design is mid-turn. Counts up live (every
                  100ms) so the user has a quick read on how long the
                  turn is taking; the final per-message duration sits
                  in the chat message itself. */}
              {activeStreaming && (
                <span
                  className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums"
                  aria-live="polite"
                >
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>
                    Generating… {(liveElapsedMs / 1000).toFixed(1)}s
                  </span>
                </span>
              )}
            </div>
            <TopBarRight
              users={allUsers}
              orgs={allOrgs}
              orgMemberships={orgMemberships}
              onOpenSettings={() => setSettingsOpen(true)}
              onOpenSuperAdmin={() => setSuperAdminOpen(true)}
            />
          </div>
        </AppShellHeader>

        <AppShellMain className="min-h-0 overflow-hidden p-3 md:p-4">
          {/* Body row — three siblings (chat | canvas | settings) on
              desktop, canvas-only on mobile. Side panes use flex-basis
              from CSS vars so a downstream theme can tweak widths
              without touching this file. Toggle closes a pane by
              animating basis → 0 + adding `hidden` on the inner div
              so its content is fully removed from layout (otherwise
              padding/border would still occupy ~1px). */}
          <div className="flex h-full min-h-0 gap-3 md:gap-4">
            {!isMobile && (
              <div
                className="min-w-0 shrink-0 overflow-hidden transition-[flex-basis] duration-150 ease-out"
                style={inlineLeftStyle}
                aria-hidden={!leftPanelOpen}
              >
                <div className={leftPanelOpen ? "h-full" : "hidden"}>
                  {leftPane}
                </div>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <StudioThemedCanvas
                designs={designs}
                focusedId={activeId}
                onFocus={setActiveId}
                view={view}
                onViewChange={setView}
                isStreaming={Boolean(streamingByDesign[activeId])}
                selection={selectionByDesign[activeId] ?? null}
                onSelect={handleSelect}
                onClearSelection={handleClearSelection}
                onCommentSelect={handleCommentSelect}
                onAddDesign={handleAddDesign}
                onCloseDesign={handleCloseDesign}
                onRenameDesign={handleRenameDesign}
                onDuplicateDesign={handleDuplicateDesign}
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
                projectName={
                  projects.find((p) => p.id === activeProjectId)?.name
                }
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
            {!isMobile && (
              <div
                className="min-w-0 shrink-0 overflow-hidden transition-[flex-basis] duration-150 ease-out"
                style={inlineRightStyle}
                aria-hidden={!rightPanelOpen}
              >
                <div className={rightPanelOpen ? "h-full" : "hidden"}>
                  {rightTabsPane}
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
                {rightTabsPane}
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
        rendererMode={rendererMode}
        onRendererModeChange={setRendererMode}
        storageBackend={storageBackend}
        onStorageBackendChange={setStorageBackend}
        userTier={userTier}
        onUserTierChange={setUserTier}
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
function TopBarRight({
  users,
  orgs,
  orgMemberships,
  onOpenSettings,
  onOpenSuperAdmin,
}: {
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
    <div className="flex items-center gap-2">
      {isImpersonating && (
        <button
          type="button"
          onClick={stopImpersonation}
          className="flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/15 transition-colors"
          title="Stop impersonating (resets to your real identity)"
        >
          <ShieldCheck className="h-3 w-3" aria-hidden />
          <span className="truncate max-w-[14rem]">
            Impersonating {user.name}
            {org ? ` · ${org.name}` : ""}
          </span>
          <X className="h-3 w-3" aria-hidden />
        </button>
      )}
      {user.superAdmin && (
        <button
          type="button"
          onClick={onOpenSuperAdmin}
          aria-label="Open super admin"
          title="Super admin (⌘⇧⌥A)"
          className={cn(
            "h-7 w-7 inline-flex items-center justify-center rounded-md transition-colors",
            "[&_svg]:size-3.5 [&_svg]:shrink-0",
            "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
        >
          <ShieldCheck />
        </button>
      )}

      {/* User trigger — Avatar + identity → opens the account menu.
          The whole pill is one clickable target with hover + focus
          states so it reads as a button (per pattern the
          Linear/Notion/Figma "click your avatar" surface follows). */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Open account menu"
            className={cn(
              "flex items-center gap-2 rounded-md px-1.5 py-1 text-xs transition-colors",
              "hover:bg-muted focus-visible:bg-muted",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              "data-[state=open]:bg-muted",
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
            <span className="hidden sm:flex flex-col leading-tight text-left">
              <span className="font-medium text-foreground truncate max-w-[10rem]">
                {user.name}
              </span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[10rem]">
                {org?.name ?? "no org"}
              </span>
            </span>
            <ChevronDown
              className="h-3 w-3 text-muted-foreground shrink-0"
              aria-hidden
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
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

      <StudioSettingsTrigger onClick={onOpenSettings} />
    </div>
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
  selection,
  onSelect,
  onClearSelection,
  onCommentSelect,
  onAddDesign,
  onCloseDesign,
  onRenameDesign,
  onDuplicateDesign,
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
  projectName,
  commentThreads,
  onCommentPinClick,
  getCommentUser,
}: {
  designs: Design[];
  focusedId: string;
  onFocus: (id: string) => void;
  view: "preview" | "code";
  onViewChange: (v: "preview" | "code") => void;
  isStreaming: boolean;
  selection: StudioSelection | null;
  onSelect: (selection: StudioSelection) => void;
  onClearSelection: () => void;
  onCommentSelect?: (selection: StudioSelection) => void;
  onAddDesign: (seed?: { source: string; name?: string }) => void;
  onCloseDesign: (id: string) => void;
  onRenameDesign: (id: string, name: string) => void;
  onDuplicateDesign?: (id: string) => void;
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
  projectName?: string;
  commentThreads?: CommentThreadWithMessages[];
  onCommentPinClick?: (threadId: string) => void;
  getCommentUser?: (id: string) => StoredUser | undefined;
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
      selection={selection}
      onSelect={onSelect}
      onClearSelection={onClearSelection}
      onCommentSelect={onCommentSelect}
      onAddDesign={onAddDesign}
      onCloseDesign={onCloseDesign}
      onRenameDesign={onRenameDesign}
      onDuplicateDesign={onDuplicateDesign}
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
      projectName={projectName}
      commentThreads={commentThreads}
      onCommentPinClick={onCommentPinClick}
      getCommentUser={getCommentUser}
    />
  );
}
