"use client";

/**
 * ProjectsMenu — left-panel content when the canvas is in "All screens" mode.
 *
 * Structure (June 2026 restructure):
 *   - Header = the PROJECT SWITCHER: active project name + a dropdown
 *     of all projects (names only — descriptions live in settings) +
 *     "New project". The settings cog targets the active project.
 *   - Body = the active project's SECTIONS as the primary nav:
 *     Screens / Flows (soon) / Motion Studio / Styles / Assets.
 *   - Assets is its own panel page (back-arrow returns to the nav),
 *     not an always-on tail below the list.
 *
 * Built on @gradeui/ui's Sidebar compound:
 *   - SidebarHeader: Studio brand + Beta badge.
 *   - SidebarSection title="Projects" trailing={+}: collapsible
 *     section with the "+ new project" affordance in the canonical
 *     trailing slot.
 *   - Every project → SidebarTreeItem: native chevron + native
 *     depth-indented children + Folder/FolderOpen icon swap based on
 *     the controlled expand state. The active project starts
 *     expanded; others start collapsed and remember the user's
 *     choice for the session. Trailing slot hosts a Settings cog
 *     that opens ProjectSettingsSheet.
 *   - Each project's screens render as size="sm" SidebarItems with a
 *     "N turns · M revisions" description — the canonical
 *     title+subtitle layout the DS supports natively.
 *
 * Every project is a TreeItem (not a mix of TreeItem + SidebarItem)
 * so the chevron column and Folder icon align across active + inactive
 * rows. To make this possible the page eager-loads every project's
 * summary on bootstrap — see `projectSummaries`.
 */

import * as React from "react";
import {
  Check,
  ChevronsUpDown,
  Clapperboard,
  Folder,
  GitBranch,
  Images,
  Monitor,
  Palette,
  Plus,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarSection,
} from "@gradeui/ui";

import type { Project, Team } from "@/lib/studio-storage";
import type { DesignKind } from "@/lib/studio-designs";
import { ProjectSettingsSheet } from "@/components/studio/project-settings-sheet";

/** The active project's nav sections. "motions" renders as "Motion
 *  Studio" (the id stays stable for storage/URLs); "flows" is reserved
 *  (FlowCanvas, D8) and renders disabled; "styles" routes to the theme
 *  panel; "assets" takes over the CANVAS with the full-screen asset
 *  library. */
export type ProjectSection =
  | "screens"
  | "flows"
  | "motions"
  | "styles"
  | "assets";

/** Ambient counts the menu shows next to each project + screen.
 *  Owned by the page; the menu just reads. */
export interface ProjectsMenuSummary {
  designs: { id: string; name: string; kind?: DesignKind }[];
  /** User-message count per design id. */
  turnsByDesign: Record<string, number>;
  /** Undo-history snapshot count per design id. */
  revisionsByDesign: Record<string, number>;
}

interface ProjectsMenuProps {
  /** Every known project. Active is hoisted to the top by this
   *  component; caller order is otherwise preserved. */
  projects: Project[];
  /** Every team the user belongs to (or has access to via a
   *  team-share). Forwarded to ProjectSettingsSheet so the
   *  Shared-with section can resolve team-subject names. */
  teams: Team[];
  /** The signed-in user's id. Used to split the list into the user's
   *  own/team projects and ones shared with them as a guest. When
   *  omitted (or in local-only mode), everything renders under the one
   *  "Projects" section. */
  currentUserId?: string;
  /** The id of the project currently loaded into the workbench. */
  activeProjectId: string;
  /** Per-project summaries — design list + turn + revision counts.
   *  Owned by the page so cross-project counts stay accurate when
   *  the user switches projects. Missing entries render with empty
   *  children + zero counts. */
  summaries: Record<string, ProjectsMenuSummary>;
  /** Switch active project. Page handles the save-then-load dance. */
  onSelectProject: (id: string) => void;
  /** Open the create-project dialog. (Renamed for clarity — the
   *  page owns the dialog state; this callback just asks for it
   *  to open.) */
  onCreateProject: () => void;
  /** Optional — rename a project (surfaced inside the settings sheet). */
  onRenameProject?: (id: string, name: string) => void;
  /** Optional — patch a project's metadata (name + description) in
   *  one call. Used by ProjectSettingsSheet for the description
   *  editor; falls back to onRenameProject when only name changes. */
  onUpdateProject?: (
    id: string,
    patch: { name?: string; description?: string },
  ) => void;
  /** Optional — delete a project (surfaced inside the settings sheet). */
  onDeleteProject?: (id: string) => void;
  /** @deprecated Assets render as a full-screen canvas page now (the
   *  Assets nav row drives `onSelectSection("assets")`); this slot is
   *  no longer rendered. Kept so older callers don't break. */
  assetsSlot?: React.ReactNode;
  /** Which section of the ACTIVE project the canvas is showing.
   *  Undefined → "screens". */
  activeSection?: ProjectSection;
  /** Switch the active project's section (Screens / Motions / Styles —
   *  Flows is disabled until FlowCanvas lands). When omitted, the
   *  section rows don't render at all (back-compat). */
  onSelectSection?: (section: ProjectSection) => void;
  /** Create a new Motion in the active project (the + on the Motions
   *  row). */
  onAddMotion?: () => void;
}

/** "4 turns · 12 revisions". ALWAYS renders both counts even when
 *  zero — keeps every screen row at the same height so the tree
 *  reads as a uniform list. Single-vs-plural words are still
 *  picked correctly ("0 turns", "1 turn", "2 turns"). */
export function ProjectsMenu({
  projects,
  teams,
  currentUserId,
  activeProjectId,
  summaries,
  onSelectProject,
  onCreateProject,
  onRenameProject,
  onUpdateProject,
  onDeleteProject,
  assetsSlot: _assetsSlot,
  activeSection = "screens",
  onSelectSection,
  onAddMotion,
}: ProjectsMenuProps) {
  // The settings sheet target — null when closed; project ref when
  // open. Tracking by Project (rather than id + a separate boolean)
  // lets us pop the sheet open from a different row without an
  // intermediate close+reopen.
  const [settingsTarget, setSettingsTarget] = React.useState<
    Project | null
  >(null);

  // Sort: active first, then by updatedAt desc.
  const sortedProjects = React.useMemo(() => {
    const active = projects.filter((p) => p.id === activeProjectId);
    const rest = projects
      .filter((p) => p.id !== activeProjectId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    return [...active, ...rest];
  }, [projects, activeProjectId]);

  // Split into "mine" (owned by me, or by a team I'm in) and "shared
  // with me" (I only have it via a guest grant). A project is mine when
  // it's user-owned by me, or team-owned by a team in my list. Anything
  // else I can see, I can only see because someone shared it → guest.
  // Without a currentUserId (local-only) we can't tell, so treat all as
  // mine and skip the second section entirely.
  const teamIds = React.useMemo(() => new Set(teams.map((t) => t.id)), [teams]);
  const isMine = React.useCallback(
    (project: Project) => {
      if (!currentUserId) return true;
      if (project.owner.type === "user") return project.owner.id === currentUserId;
      if (project.owner.type === "team") return teamIds.has(project.owner.id);
      return true;
    },
    [currentUserId, teamIds],
  );
  const ownedProjects = sortedProjects.filter(isMine);
  const sharedProjects = currentUserId
    ? sortedProjects.filter((p) => !isMine(p))
    : [];

  const canDelete = projects.length > 1 && !!onDeleteProject;

  const activeProject =
    projects.find((p) => p.id === activeProjectId) ?? null;
  const allDesigns = summaries[activeProjectId]?.designs ?? [];
  const screenCount = allDesigns.filter(
    (d) => (d.kind ?? "screen") === "screen",
  ).length;
  const motionCount = allDesigns.filter((d) => d.kind === "motion").length;

  const projectRow = (project: Project) => (
    <DropdownMenuItem
      key={project.id}
      onSelect={() => {
        if (project.id !== activeProjectId) onSelectProject(project.id);
      }}
    >
      <Folder className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{project.name}</span>
      {project.id === activeProjectId && (
        <Check className="h-3.5 w-3.5 text-primary" />
      )}
    </DropdownMenuItem>
  );

  return (
    <Sidebar
      variant="panel"
      collapsible={false}
      aria-label="Studio"
      className="h-full"
    >
      {/* Header — the PROJECT SWITCHER. The active project is the
          working context, so it owns the header; everything below is
          inside it. (The old "Studio · Beta" brand row is gone — the
          rail already brands the app.) */}
      <SidebarHeader className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-muted transition-colors"
            >
              <Folder className="h-4 w-4 shrink-0 text-foreground" />
              <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                {activeProject?.name ?? "Project"}
              </span>
              <ChevronsUpDown className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {ownedProjects.map(projectRow)}
            {sharedProjects.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Shared with you
                </DropdownMenuLabel>
                {sharedProjects.map(projectRow)}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onCreateProject()}>
              <Plus className="h-3.5 w-3.5" />
              New project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {activeProject && (
          <button
            type="button"
            onClick={() => setSettingsTarget(activeProject)}
            aria-label={`Settings for ${activeProject.name}`}
            title="Project settings"
            className="h-6 w-6 shrink-0 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors [&_svg]:size-3.5"
          >
            <Settings />
          </button>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarSection>
            {/* The active project's sections — the primary nav. */}
            <SidebarItem
              asButton
              active={activeSection === "screens" && !!onSelectSection}
              icon={<Monitor />}
              onClick={() => onSelectSection?.("screens")}
            >
              <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                <span className="truncate">Screens</span>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {screenCount}
                </span>
              </span>
            </SidebarItem>
            <SidebarItem
              asButton
              icon={<GitBranch />}
              className="pointer-events-none opacity-50"
              aria-disabled
            >
              <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                <span className="truncate">Flows</span>
                <span className="text-[10px] text-muted-foreground">soon</span>
              </span>
            </SidebarItem>
            <div className="group/motions relative">
              <SidebarItem
                asButton
                active={activeSection === "motions"}
                icon={<Clapperboard />}
                onClick={() => onSelectSection?.("motions")}
              >
                <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span className="truncate">Motion Studio</span>
                  <span className="pr-5 text-[10px] tabular-nums text-muted-foreground">
                    {motionCount}
                  </span>
                </span>
              </SidebarItem>
              {onAddMotion && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddMotion();
                  }}
                  aria-label="New motion"
                  title="New motion"
                  className="absolute right-1 top-1/2 h-5 w-5 -translate-y-1/2 inline-flex items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover/motions:opacity-100 [&_svg]:size-3"
                >
                  <Plus />
                </button>
              )}
            </div>
            <SidebarItem
              asButton
              active={activeSection === "styles"}
              icon={<Palette />}
              onClick={() => onSelectSection?.("styles")}
            >
              {/* Label only — the section id stays "styles" (persisted in
                  URLs/storage). Matches the right panel's renamed Design
                  System tab. */}
              Design System
            </SidebarItem>
            {/* Assets — a full-screen CANVAS page, not a panel tail. */}
            <SidebarItem
              asButton
              active={activeSection === "assets"}
              icon={<Images />}
              onClick={() => onSelectSection?.("assets")}
            >
              Assets
            </SidebarItem>
          </SidebarSection>
      </SidebarContent>

      <SidebarFooter className="text-[10px] text-muted-foreground">
        Stored locally — sync coming later
      </SidebarFooter>

      <ProjectSettingsSheet
        project={settingsTarget}
        teams={teams}
        onOpenChange={(open) => {
          if (!open) setSettingsTarget(null);
        }}
        onUpdate={(id, patch) => {
          // Prefer the general update handler when the consumer
          // wires it; fall back to the rename-only handler for
          // back-compat (older parents that haven't migrated yet).
          if (onUpdateProject) {
            onUpdateProject(id, patch);
          } else if (patch.name !== undefined && onRenameProject) {
            onRenameProject(id, patch.name);
          }
          setSettingsTarget((cur) =>
            cur && cur.id === id ? { ...cur, ...patch } : cur,
          );
        }}
        onDelete={(id) => {
          onDeleteProject?.(id);
        }}
        canDelete={canDelete}
      />
    </Sidebar>
  );
}
