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
import {
  Folder,
  FolderOpen,
  Plus,
  FileText,
  Settings,
} from "lucide-react";
import {
  Badge,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarSection,
  SidebarTreeItem,
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
  /** The id of the project currently loaded into the workbench. */
  activeProjectId: string;
  /** The active design id within the active project. */
  activeDesignId: string;
  /** Per-project summaries — design list + turn + revision counts.
   *  Owned by the page so cross-project counts stay accurate when
   *  the user switches projects. Missing entries render with empty
   *  children + zero counts. */
  summaries: Record<string, ProjectsMenuSummary>;
  /** Switch active project. Page handles the save-then-load dance. */
  onSelectProject: (id: string) => void;
  /** Click a screen inside any project — if it belongs to the
   *  inactive project, the page switches projects first. */
  onSelectScreen: (projectId: string, designId: string) => void;
  /** Create a new project. */
  onCreateProject: () => void;
  /** Optional — rename a project (surfaced inside the settings sheet). */
  onRenameProject?: (id: string, name: string) => void;
  /** Optional — delete a project (surfaced inside the settings sheet). */
  onDeleteProject?: (id: string) => void;
  /** Optional — reset a project's theme draft. */
  onResetTheme?: (id: string) => void;
}

/** "4 turns · 12 revisions". ALWAYS renders both counts even when
 *  zero — keeps every screen row at the same height so the tree
 *  reads as a uniform list. Single-vs-plural words are still
 *  picked correctly ("0 turns", "1 turn", "2 turns"). */
function formatScreenCounts(turns: number, revisions: number): string {
  const turnWord = turns === 1 ? "turn" : "turns";
  const revWord = revisions === 1 ? "revision" : "revisions";
  return `${turns} ${turnWord} · ${revisions} ${revWord}`;
}

export function ProjectsMenu({
  projects,
  teams,
  activeProjectId,
  activeDesignId,
  summaries,
  onSelectProject,
  onSelectScreen,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  onResetTheme,
}: ProjectsMenuProps) {
  // The settings sheet target — null when closed; project ref when
  // open. Tracking by Project (rather than id + a separate boolean)
  // lets us pop the sheet open from a different row without an
  // intermediate close+reopen.
  const [settingsTarget, setSettingsTarget] = React.useState<
    Project | null
  >(null);

  // Per-project expanded state. We control it so the icon (Folder vs
  // FolderOpen) can swap based on the same source of truth the
  // chevron reads from. The active project starts expanded; the
  // record is keyed by project id so the user's preference survives
  // across switches within a session.
  const [expandedProjects, setExpandedProjects] = React.useState<
    Record<string, boolean>
  >(() => ({ [activeProjectId]: true }));

  // When the active project changes (project switch), auto-expand
  // the new one. Don't COLLAPSE the previously-active project — the
  // user might want to keep peeking at it. Mirrors Notion / Linear
  // sidebar behavior.
  React.useEffect(() => {
    setExpandedProjects((cur) =>
      cur[activeProjectId] ? cur : { ...cur, [activeProjectId]: true },
    );
  }, [activeProjectId]);

  const toggleProjectExpand = React.useCallback(
    (id: string, next: boolean) => {
      setExpandedProjects((cur) => ({ ...cur, [id]: next }));
    },
    [],
  );

  // Sort: active first (so the expanded children stay at the top of
  // the column), then by updatedAt desc.
  const sortedProjects = React.useMemo(() => {
    const active = projects.filter((p) => p.id === activeProjectId);
    const rest = projects
      .filter((p) => p.id !== activeProjectId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    return [...active, ...rest];
  }, [projects, activeProjectId]);

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
          {sortedProjects.map((project) => {
            const isActive = project.id === activeProjectId;
            const expanded = !!expandedProjects[project.id];
            const summary = summaries[project.id];
            const designsForProject = summary?.designs ?? [];
            const screenCountLabel =
              designsForProject.length === 1
                ? "1 screen"
                : `${designsForProject.length} screens`;

            return (
              <SidebarTreeItem
                key={project.id}
                label={project.name}
                description={screenCountLabel}
                // Folder icon swaps based on controlled expand state
                // so visual + chevron + tree-state are all in sync.
                icon={expanded ? <FolderOpen /> : <Folder />}
                active={isActive}
                expanded={expanded}
                onExpandedChange={(next) =>
                  toggleProjectExpand(project.id, next)
                }
                trailing={renderSettingsButton(project)}
                // The branch button's own onClick toggles expand;
                // we'd also like clicking the row to switch active
                // project. The DS doesn't expose a separate
                // "primary action" prop today, so we layer:
                // - chevron toggle still works (button click)
                // - but if the user clicks the row of an INACTIVE
                //   project we ALSO want to switch to it. We catch
                //   this via the icon click below, plus the
                //   double-click affordance on the branch button.
                onDoubleClick={() => {
                  if (!isActive) onSelectProject(project.id);
                }}
              >
                {designsForProject.length === 0 ? (
                  // Empty state — a project with no screens yet.
                  // Rendered as a non-interactive muted line so the
                  // empty tree doesn't look broken.
                  <div className="px-3 py-1 text-xs text-muted-foreground italic">
                    No screens yet
                  </div>
                ) : (
                  designsForProject.map((d) => {
                    const turns = summary?.turnsByDesign[d.id] ?? 0;
                    const revisions =
                      summary?.revisionsByDesign[d.id] ?? 0;
                    return (
                      <SidebarItem
                        key={d.id}
                        asButton
                        size="sm"
                        active={
                          isActive && d.id === activeDesignId
                        }
                        icon={<FileText />}
                        // Description is always non-null so every
                        // screen row is the same height as its
                        // siblings; the formatter writes a "0
                        // turns · 0 revisions" stub for fresh
                        // screens.
                        description={formatScreenCounts(turns, revisions)}
                        onClick={() => onSelectScreen(project.id, d.id)}
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {d.name}
                        </span>
                      </SidebarItem>
                    );
                  })
                )}
              </SidebarTreeItem>
            );
          })}
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
        onRename={(id, name) => {
          onRenameProject?.(id, name);
          setSettingsTarget((cur) =>
            cur && cur.id === id ? { ...cur, name } : cur,
          );
        }}
        onDelete={(id) => {
          onDeleteProject?.(id);
        }}
        onResetTheme={onResetTheme}
        canDelete={canDelete}
      />
    </Sidebar>
  );
}
