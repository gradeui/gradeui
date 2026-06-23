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
  Textarea,
} from "@gradeui/ui";

import type { Project, Team } from "@/lib/studio-storage";
import {
  roleLabel,
  useCurrentUser,
  type ResourceAccess,
  type Subject,
} from "@/lib/studio-users";
import { useMaybeThemeBuilder } from "@/components/theme-builder";
import { ThemePickerSection } from "@/components/studio/theme-picker-section";
import { ProjectVariablesPanel } from "@/components/style-panel/variables-panel";

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
  /** Patch a project's metadata in one call — name + description.
   *  Parent normalises + writes to storage; this component just
   *  emits the intent. Empty strings on `description` mean
   *  "clear it" and are passed through verbatim — the storage
   *  layer normalises to undefined. */
  onUpdate: (
    id: string,
    patch: {
      name?: string;
      description?: string;
      context?: string;
      dos?: string[];
      donts?: string[];
    },
  ) => void;
  /** Confirm + delete. Parent owns the confirmation UI — pass a
   *  handler that has already prompted for confirmation, OR show
   *  the inline confirm step inside the sheet (we do the latter). */
  onDelete: (id: string) => void;
  /** Whether the user can delete this project. Hidden when only one
   *  project exists (can't delete the last one). */
  canDelete?: boolean;
}

export function ProjectSettingsSheet({
  project,
  teams,
  onOpenChange,
  onUpdate,
  onDelete,
  canDelete = true,
}: ProjectSettingsSheetProps) {
  const [draftName, setDraftName] = React.useState("");
  const [draftDescription, setDraftDescription] = React.useState("");
  // Agent guidance. dos/donts edit as newline-separated text (one rule per
  // line); converted to/from string[] at the storage boundary.
  const [draftContext, setDraftContext] = React.useState("");
  const [draftDos, setDraftDos] = React.useState("");
  const [draftDonts, setDraftDonts] = React.useState("");
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const currentUser = useCurrentUser();

  // Reseed inputs whenever a different project is opened. Closing +
  // reopening on the SAME project also resets — we treat each open
  // as a fresh edit session.
  React.useEffect(() => {
    if (project) {
      setDraftName(project.name);
      setDraftDescription(project.description ?? "");
      setDraftContext(project.context ?? "");
      setDraftDos((project.dos ?? []).join("\n"));
      setDraftDonts((project.donts ?? []).join("\n"));
      setConfirmingDelete(false);
    }
  }, [project?.id]);

  // Dirty-state guards. Whitespace-only changes on either field
  // don't count as dirty (the storage layer normalises). Name is
  // required-when-present; we don't let the user clear it to empty
  // — they'd lose track of the project in the menu.
  const nameDirty =
    !!project && draftName.trim() !== project.name && draftName.trim().length > 0;
  const descriptionDirty =
    !!project &&
    (draftDescription.trim() || "") !== (project.description ?? "");
  const normLines = (s: string) =>
    s.split("\n").map((x) => x.trim()).filter(Boolean);
  const contextDirty =
    !!project && (draftContext.trim() || "") !== (project.context ?? "");
  const dosDirty =
    !!project && normLines(draftDos).join("\n") !== (project.dos ?? []).join("\n");
  const dontsDirty =
    !!project &&
    normLines(draftDonts).join("\n") !== (project.donts ?? []).join("\n");
  const canSave =
    nameDirty || descriptionDirty || contextDirty || dosDirty || dontsDirty;

  const handleSave = () => {
    if (!project || !canSave) return;
    const patch: {
      name?: string;
      description?: string;
      context?: string;
      dos?: string[];
      donts?: string[];
    } = {};
    if (nameDirty) patch.name = draftName.trim();
    if (descriptionDirty) patch.description = draftDescription.trim();
    if (contextDirty) patch.context = draftContext.trim();
    if (dosDirty) patch.dos = normLines(draftDos);
    if (dontsDirty) patch.donts = normLines(draftDonts);
    onUpdate(project.id, patch);
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
          {/* Name + description editor. Single Save button at the
              bottom commits both at once so the user can edit both
              without two round-trips. Enter inside the name input
              also commits. The save button stays disabled until at
              least one field is dirty (excludes whitespace-only
              changes, which are normalised away by the storage
              layer). */}
          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-name">Name</Label>
              <Input
                id="project-name"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSave();
                  }
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-description">
                Description{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="project-description"
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                placeholder="What this project is for"
                maxLength={240}
                rows={2}
                className="min-h-0"
              />
              <p className="text-[11px] text-muted-foreground">
                Shown in the Projects menu instead of the screen
                count. Leave empty to fall back to the count.
              </p>
            </div>

            {/* Agent guidance — context + do/don't. The harness injects these
                into every screen it builds for this project, so the model
                follows the project's steering over generic defaults. */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-context">
                Context{" "}
                <span className="text-muted-foreground font-normal">
                  (for the AI)
                </span>
              </Label>
              <Textarea
                id="project-context"
                value={draftContext}
                onChange={(e) => setDraftContext(e.target.value)}
                placeholder="What the AI should know — audience, brand, tone, the kind of thing you're building."
                rows={3}
                className="min-h-0"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="project-dos">Do</Label>
                <Textarea
                  id="project-dos"
                  value={draftDos}
                  onChange={(e) => setDraftDos(e.target.value)}
                  placeholder={"One per line:\nUse Section + Container\nOne primary CTA per band"}
                  rows={4}
                  className="min-h-0"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="project-donts">Don&rsquo;t</Label>
                <Textarea
                  id="project-donts"
                  value={draftDonts}
                  onChange={(e) => setDraftDonts(e.target.value)}
                  placeholder={"One per line:\nNo raw hex colours\nDon't nest cards"}
                  rows={4}
                  className="min-h-0"
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              One rule per line. The AI follows these over its defaults.
            </p>

            <div className="flex justify-end">
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={!canSave}
              >
                Save changes
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

          {/* Theme — quick selector + reset. Deep editing (hue
              sliders, typography, shape) stays in the right-panel
              Theme tab; this section is for "pick a different
              base" + "discard my custom edits". */}
          <ProjectThemeSection />

          <Separator />

          {/* Variables — the project's EFFECTIVE token values: the
              generated theme's primary/accent/neutral ramps (live as
              the style panel edits) over the locked core primitives.
              Read-only v1; ramp-step override editing lands here.
              Public sibling at /variables shows core defaults only. */}
          <ProjectVariablesSection />

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

/** Project theme section — embedded inside the settings sheet.
 *  Reads from `useMaybeThemeBuilder` so it gracefully no-ops when
 *  rendered outside a ThemeBuilderProvider (embed surfaces, tests).
 *
 *  Two affordances:
 *
 *    - Theme picker: reuses ThemePickerSection — switching swatches
 *      rebases the builder's history onto the picked theme. Combined
 *      with the per-project draft persister on the page, this means
 *      "pick a theme inside Project A" writes that pick to Project
 *      A's snapshot, not anywhere else.
 *
 *    - Reset: calls the builder's `reset()`, snapping back to the
 *      project's last-saved baseline (the one the provider seeded
 *      with on mount). Doesn't blow away the snapshot — just
 *      discards in-flight edits since the last seed.
 *
 *  The "deep editing" (sliders, typography, shape) lives in the
 *  right-panel Theme tab, not here, so the settings sheet stays
 *  scannable. */
/** Project variables section — collapsed by default so the sheet stays
 *  scannable; expands to the compact VariablesViewer with the project's
 *  effective ramps first. */
function ProjectVariablesSection() {
  const builder = useMaybeThemeBuilder();
  const [open, setOpen] = React.useState(false);
  if (!builder) return null;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Variables</Label>
        <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
          {open ? "Hide" : "Show"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        The project's effective token values — theme ramps first, core
        primitives below. Click any swatch to copy its variable.
      </p>
      {open ? (
        <div className="max-h-[360px] overflow-y-auto pr-1" data-lenis-prevent>
          <ProjectVariablesPanel />
        </div>
      ) : null}
    </section>
  );
}

function ProjectThemeSection() {
  const builder = useMaybeThemeBuilder();
  if (!builder) return null;
  return (
    <section className="flex flex-col gap-3">
      <Label className="text-sm font-medium">Theme</Label>
      <p className="text-xs text-muted-foreground">
        Each project has its own theme draft. Pick a base, then
        fine-tune in the Theme tab on the right.
      </p>
      <ThemePickerSection className="!p-0" />
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => builder.reset()}
          disabled={!builder.isDirty}
          title={
            builder.isDirty
              ? "Discard edits since this project last saved"
              : "No edits to discard"
          }
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset to saved
        </Button>
      </div>
    </section>
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
