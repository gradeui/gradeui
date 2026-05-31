"use client";

/**
 * ProjectsMenu — left-panel content when the canvas is in "All screens" mode.
 *
 * Replaces StudioChat in the left column when the user is at the grid
 * view (no focused screen). The chat is screen-scoped — it makes no
 * sense without a target — so we use that real estate for project
 * navigation instead. Click a screen here to enter Fit mode on it
 * (which swaps the panel back to Chat for that screen).
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
import { Folder, Plus, Settings } from "lucide-react";
import {
  Badge,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarSection,
} from "@gradeui/ui";

import type { Project, Team } from "@/lib/studio-storage";
import { ProjectSettingsSheet } from "@/components/studio/project-settings-sheet";

/** Ambient counts the menu shows next to each project + screen.
 *  Owned by the page; the menu just reads. */
export interface ProjectsMenuSummary {
  designs: { id: string; name: string }[];
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
  /** Optional content rendered below the project sections — the asset
   *  browser lives here so the user's library sits in the left panel
   *  alongside their projects. */
  assetsSlot?: React.ReactNode;
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
  assetsSlot,
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

  const renderSettingsButton = (project: Project) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setSettingsTarget(project);
      }}
      aria-label={`Settings for ${project.name}`}
      title="Project settings"
      className="h-6 w-6 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors [&_svg]:size-3.5"
    >
      <Settings />
    </button>
  );

  // One project → a flat switcher row. Screens are NOT nested here any
  // more — the screen grid (middle) + the project home (right) are the
  // canonical "pick a screen" surfaces; this list is purely for
  // switching between projects. Clicking selects the project (and lands
  // on its home); the cog opens settings.
  const renderProjectRow = (project: Project) => {
    const isActive = project.id === activeProjectId;
    const count = summaries[project.id]?.designs.length ?? 0;
    const description =
      project.description?.trim() ||
      (count === 1 ? "1 screen" : `${count} screens`);

    return (
      // Settings cog is a sibling (not nested in the row button — that'd
      // be invalid HTML), absolutely positioned + hover-revealed.
      <div key={project.id} className="group/proj relative">
        <SidebarItem
          asButton
          active={isActive}
          icon={<Folder />}
          description={description}
          onClick={() => onSelectProject(project.id)}
        >
          <span className="min-w-0 flex-1 truncate pr-7">{project.name}</span>
        </SidebarItem>
        <span className="absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover/proj:opacity-100">
          {renderSettingsButton(project)}
        </span>
      </div>
    );
  };

  return (
    <Sidebar
      variant="panel"
      collapsible={false}
      aria-label="Studio"
      className="h-full"
    >
      {/* Header — Studio brand + Beta badge. */}
      <SidebarHeader className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            Studio
          </span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            Beta
          </Badge>
        </span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarSection
          title="Projects"
          trailing={
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCreateProject();
              }}
              aria-label="New project"
              title="New project"
              className="h-6 w-6 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors [&_svg]:size-3.5"
            >
              <Plus />
            </button>
          }
        >
          {ownedProjects.map(renderProjectRow)}
        </SidebarSection>

        {/* Guest grants — projects another user shared with me. Only
            shows when there are any, so solo / local users never see an
            empty section. */}
        {sharedProjects.length > 0 && (
          <SidebarSection title="Shared with you">
            {sharedProjects.map(renderProjectRow)}
          </SidebarSection>
        )}

        {assetsSlot}
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
