"use client";

/**
 * ProjectSettingsSheet — per-project settings, opened from the
 * Projects menu's trailing cog button.
 *
 * Hosts the actions that used to live as hover buttons next to a
 * project row — Rename and Delete — plus a placeholder for Theme
 * reset that lights up once per-project theme persistence wires
 * through ThemeBuilderProvider. Moving these into a Sheet has two
 * wins: more room for explanation copy + future settings (sync
 * status, owner, integrations) without crowding the rail, and a
 * single tap-target on the row so the menu reads as a clean list.
 *
 * Composed entirely from gradeui primitives — Sheet, Input, Label,
 * Button, Separator, Badge — to keep the dogfood story consistent
 * with the rest of Studio's chrome.
 */

import * as React from "react";
import {
  Trash2,
  RotateCcw,
  UserPlus,
  Users as UsersIcon,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Input,
  Label,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@gradeui/ui";

import type { Project, Team } from "@/lib/studio-storage";
import {
  roleLabel,
  useCurrentUser,
  type ResourceAccess,
  type Subject,
} from "@/lib/studio-users";

interface ProjectSettingsSheetProps {
  /** The project whose settings are being edited. When null the
   *  sheet is closed; opening always passes a fresh project so the
   *  inputs reset to the current name. */
  project: Project | null;
  /** Every team the storage knows about — used to resolve the team
   *  name when an access entry or the project owner references a
   *  team subject. Pass an empty array for embed surfaces with no
   *  team concept; team rows then render with a generic label. */
  teams: Team[];
  /** Controlled open state — open === Boolean(project), close
   *  fires onClose so the parent can clear `project`. */
  onOpenChange: (open: boolean) => void;
  /** Persist a new name. Parent is responsible for trimming + the
   *  storage write; this component just emits the intent. */
  onRename: (id: string, name: string) => void;
  /** Confirm + delete. Parent owns the confirmation UI — pass a
   *  handler that has already prompted for confirmation, OR show
   *  the inline confirm step inside the sheet (we do the latter). */
  onDelete: (id: string) => void;
  /** Optional — reset this project's theme draft to defaults.
   *  When undefined, the Theme reset section renders disabled with
   *  a "Soon" hint. Wires up once per-project theme persistence
   *  lands in ThemeBuilderProvider. */
  onResetTheme?: (id: string) => void;
  /** Whether the user can delete this project. Hidden when only one
   *  project exists (can't delete the last one). */
  canDelete?: boolean;
}

export function ProjectSettingsSheet({
  project,
  teams,
  onOpenChange,
  onRename,
  onDelete,
  onResetTheme,
  canDelete = true,
}: ProjectSettingsSheetProps) {
  const [draftName, setDraftName] = React.useState("");
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const currentUser = useCurrentUser();

  // Reseed inputs whenever a different project is opened. Closing +
  // reopening on the SAME project also resets — we treat each open
  // as a fresh edit session.
  React.useEffect(() => {
    if (project) {
      setDraftName(project.name);
      setConfirmingDelete(false);
    }
  }, [project?.id]);

  const handleSaveName = () => {
    if (!project) return;
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== project.name) {
      onRename(project.id, trimmed);
    }
  };

  const handleDelete = () => {
    if (!project) return;
    onDelete(project.id);
    onOpenChange(false);
  };

  return (
    <Sheet open={project !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[88vw] max-w-md flex flex-col gap-0"
      >
        <SheetHeader>
          <SheetTitle>Project settings</SheetTitle>
          <SheetDescription>
            {project ? project.name : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto py-4 flex flex-col gap-6">
          {/* Rename — inline edit with explicit Save so the user
              doesn't accidentally rename on blur or on closing the
              Sheet without committing. */}
          <section className="flex flex-col gap-2">
            <Label htmlFor="project-name">Name</Label>
            <div className="flex items-center gap-2">
              <Input
                id="project-name"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveName();
                  }
                }}
                className="flex-1"
              />
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveName}
                disabled={
                  !project ||
                  draftName.trim().length === 0 ||
                  draftName.trim() === project.name
                }
              >
                Save
              </Button>
            </div>
          </section>

          <Separator />

          {/* Shared with — read-only access list for v1. Reserves
              the UI slot for the eventual invite + role-picker
              flow, and shows the local user as owner so the
              ownership story is visible end-to-end before real
              auth lands. The Invite button is disabled with a
              "Soon" badge — same pattern as Theme reset below. */}
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm font-medium">Shared with</Label>
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                Soon
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Invite teammates to view or edit this project. Real
              sharing arrives with sync.
            </p>
            <div className="flex flex-col gap-1.5">
              {/* Build a unified row list: project OWNER first (rendered
                  with the implicit owner role), then every explicit
                  access entry. Subjects are polymorphic — users get
                  an Avatar with initials, teams get a Users icon and
                  the team name from the index. */}
              {project &&
                buildSharedRows(project, teams, currentUser).map((row) => (
                  <div
                    key={`${row.subject.type}:${row.subject.id}`}
                    className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2 py-1.5"
                  >
                    {row.subject.type === "user" ? (
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {row.initials}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div
                        className="h-6 w-6 inline-flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary [&_svg]:size-3.5"
                        aria-hidden
                      >
                        <UsersIcon />
                      </div>
                    )}
                    <span className="flex-1 truncate text-xs text-foreground">
                      {row.displayName}
                      {row.isYou && (
                        <span className="ml-1.5 text-muted-foreground">
                          ({currentUser.email ?? "local"})
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {row.roleLabel}
                    </span>
                  </div>
                ))}
            </div>
            <div>
              <Button variant="outline" size="sm" disabled>
                <UserPlus className="h-3.5 w-3.5" />
                Invite people
              </Button>
            </div>
          </section>

          <Separator />

          {/* Theme reset — placeholder until per-project theme
              persistence is wired. The Sheet reserves the slot so
              the eventual feature lands without rearranging UI. */}
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm font-medium">Theme</Label>
              {!onResetTheme && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0"
                >
                  Soon
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Reset this project's theme draft back to the Studio default.
              Affects only this project.
            </p>
            <div>
              <Button
                variant="outline"
                size="sm"
                disabled={!onResetTheme}
                onClick={() => project && onResetTheme?.(project.id)}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset theme
              </Button>
            </div>
          </section>

          {canDelete && (
            <>
              <Separator />
              {/* Delete — destructive. Two-step inline confirm: the
                  first click reveals the confirmation row, the
                  second click commits. Keeps the destructive action
                  behind a deliberate confirm without bouncing
                  through a separate dialog. */}
              <section className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-destructive">
                  Danger zone
                </Label>
                <p className="text-xs text-muted-foreground">
                  Deleting a project removes its screens, chat history, notes,
                  and theme draft. This cannot be undone.
                </p>
                {confirmingDelete ? (
                  <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2">
                    <span className="flex-1 text-xs text-foreground">
                      Delete <b>{project?.name}</b>?
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmingDelete(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                    >
                      Delete
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setConfirmingDelete(true)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete project
                    </Button>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Shape of a row in the Shared-with section. Pulled out as a
 *  named type so the builder + renderer agree on the contract. */
interface SharedRow {
  subject: Subject;
  /** Human label — "You", a team name, a user id (until we have
   *  display names). */
  displayName: string;
  /** Two-letter initials for the Avatar fallback (user subjects). */
  initials: string;
  /** Pre-formatted role label ("Owner", "Editor", etc.). */
  roleLabel: string;
  /** True when this row references the local user — drives the
   *  "(local)" suffix and is a hook for future "you can't remove
   *  yourself" UI gating. */
  isYou: boolean;
}

/** Build the unified row list for the Shared-with section. Owner
 *  goes first (always rendered with Owner role regardless of whether
 *  there's a duplicate access-list entry); explicit access entries
 *  follow in their stored order. Deduplicates against the owner so
 *  the same subject doesn't show twice when the legacy migration
 *  emitted a redundant owner-role grant. */
function buildSharedRows(
  project: Project,
  teams: Team[],
  currentUser: { id: string; name: string },
): SharedRow[] {
  const rows: SharedRow[] = [];

  // Owner row.
  rows.push(buildRow(project.owner, "owner", teams, currentUser));

  // Access rows. Skip any entry whose subject matches the owner
  // (same type + id) so we don't render the same identity twice.
  for (const entry of project.access) {
    if (
      entry.subject.type === project.owner.type &&
      entry.subject.id === project.owner.id
    ) {
      continue;
    }
    rows.push(buildRow(entry.subject, entry.role, teams, currentUser));
  }

  return rows;
}

function buildRow(
  subject: Subject,
  role: ResourceAccess["role"],
  teams: Team[],
  currentUser: { id: string; name: string },
): SharedRow {
  if (subject.type === "team") {
    const team = teams.find((t) => t.id === subject.id);
    return {
      subject,
      displayName: team?.name ?? "Team",
      initials: "",
      roleLabel: roleLabel(role),
      isYou: false,
    };
  }
  // Subject is a user.
  const isYou = subject.id === currentUser.id;
  return {
    subject,
    displayName: isYou ? "You" : subject.id,
    initials: isYou
      ? currentUser.name.slice(0, 1).toUpperCase()
      : subject.id.slice(2, 3).toUpperCase(),
    roleLabel: roleLabel(role),
    isYou,
  };
}
