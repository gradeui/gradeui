"use client";

/**
 * ProjectHome — the project-level "settings + overview" pane, shown in
 * the right panel when the canvas is at the all-screens (grid) view, the
 * way StudioRightTabs shows per-screen settings when a screen is focused.
 *
 * Surfaces the things a project owner wants at a glance — name, when it
 * was created, who's on it, its screens, and (the bit traditional design
 * tools hide) the activity trail. The screens stay in the middle panel;
 * clicking one here drills into it. Reads the trail via
 * StudioStorage.listEvents — the cross-cutting audit log (STUDIO-AUDIT).
 */

import * as React from "react";
import { Users, FileText, Activity, UserPlus, Clock } from "lucide-react";
import { getStudioStorage } from "@/lib/studio-storage";
import type { StudioEvent } from "@/lib/studio-storage";

interface ProjectHomeProps {
  projectId: string;
  projectName: string;
  createdAt?: number;
  /** Screens in the project, in order. */
  screens: { id: string; name: string }[];
  activeScreenId?: string;
  /** Drill into a screen (middle panel keeps the grid; this focuses one). */
  onSelectScreen: (designId: string) => void;
  /** Open the invite dialog. */
  onInvite?: () => void;
  /** Count of access grants beyond the owner (guests + team shares). */
  memberCount: number;
  /** The signed-in user's id, to render "You" in the trail. */
  currentUserId?: string;
}

// Transitive verbs for screen.* events — the target IS the screen, so
// these render "{verb} {screen name}" ("created Pricing v2"), not
// "{verb} a screen on {name}".
const SCREEN_VERB: Record<string, string> = {
  "screen.create": "created",
  "screen.rename": "renamed",
  "screen.duplicate": "duplicated",
  "screen.delete": "deleted",
  "screen.restore": "restored",
};
const VERB: Record<string, string> = {
  "asset.upload": "uploaded an image",
  "asset.generate": "generated an image",
  "asset.fill": "filled an image",
  "asset.delete": "deleted an image",
  "image.set": "set an image",
  "comment.add": "left a comment",
  "comment.resolve": "resolved a comment",
  "theme.save": "saved a theme",
  "share.create": "created a share link",
  "share.revoke": "revoked a share link",
  "share.view": "viewed the share",
  "project.delete": "deleted the project",
  "project.restore": "restored the project",
};

function relTime(ms: number): string {
  const diff = Date.now() - ms;
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="flex items-center gap-2 text-xs text-muted-foreground [&_svg]:size-3.5">
        {icon}
        {label}
      </span>
      <span className="truncate text-sm text-foreground">{value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-1 mt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  );
}

export function ProjectHome({
  projectId,
  projectName,
  createdAt,
  screens,
  onInvite,
  memberCount,
  currentUserId,
}: ProjectHomeProps) {
  const [events, setEvents] = React.useState<StudioEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = React.useState(false);
  // Show a short recent slice by default; the full trail lives behind
  // "Show all" (and, later, a dedicated activity surface).
  const ACTIVITY_PREVIEW = 3;
  const [showAllActivity, setShowAllActivity] = React.useState(false);

  const loadEvents = React.useCallback(async () => {
    setLoadingEvents(true);
    try {
      const e = await getStudioStorage().listEvents({ projectId, limit: 40 });
      setEvents(e);
    } catch {
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, [projectId]);

  // Fetch on mount + refetch whenever any action logs an event for this
  // project (logEvent broadcasts `grade:event-logged`), so the feed stays
  // live without a manual refresh.
  React.useEffect(() => {
    loadEvents();
    const onLogged = (ev: Event) => {
      const detail = (ev as CustomEvent).detail as
        | { projectId?: string }
        | undefined;
      if (!detail?.projectId || detail.projectId === projectId) loadEvents();
    };
    window.addEventListener("grade:event-logged", onLogged);
    return () => window.removeEventListener("grade:event-logged", onLogged);
  }, [projectId, loadEvents]);

  const screenName = React.useCallback(
    (id?: string) => screens.find((s) => s.id === id)?.name,
    [screens],
  );

  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 py-3">
      <h2 className="truncate text-base font-semibold text-foreground">
        {projectName}
      </h2>

      {/* Theme dropdown removed (July 2026): the project home is
          overview + people + activity — theme lives in the Design
          System section, and screens live in the middle grid. */}
      <SectionTitle>Overview</SectionTitle>
      <div className="rounded-lg border border-border/60 px-3 py-1.5">
        {createdAt && (
          <Row
            icon={<Clock />}
            label="Created"
            value={new Date(createdAt).toLocaleDateString()}
          />
        )}
        <Row icon={<FileText />} label="Screens" value={screens.length} />
        <Row
          icon={<Users />}
          label="People"
          value={memberCount + 1 /* + owner */}
        />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <SectionTitle>People</SectionTitle>
        {onInvite && (
          <button
            type="button"
            onClick={onInvite}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground [&_svg]:size-3.5"
          >
            <UserPlus />
            Invite
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Owner{memberCount > 0 ? ` + ${memberCount} invited` : ""}.
      </p>

      {/* Screens list removed (July 2026): duplicated the middle grid —
          the canvas is the screens surface. `screens` stays a prop for
          the activity trail's name resolution. */}
      <SectionTitle>
        <span className="inline-flex items-center gap-1">
          <Activity className="size-3.5" />
          Activity
        </span>
      </SectionTitle>
      {loadingEvents ? (
        <p className="py-2 text-xs text-muted-foreground">Loading…</p>
      ) : events.length === 0 ? (
        <p className="py-2 text-xs text-muted-foreground">
          No activity yet. Actions on this project — generating images,
          comments, shares, edits — will show here.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5 pb-2">
          {(showAllActivity ? events : events.slice(0, ACTIVITY_PREVIEW)).map((e) => {
            const who =
              e.actorId === currentUserId ? "You" : "A collaborator";
            // Prefer the name captured on the event (survives deletion);
            // fall back to resolving the live screen.
            const metaName =
              typeof e.metadata?.name === "string" ? e.metadata.name : undefined;
            const name = metaName ?? screenName(e.designId);
            const screenVerb = SCREEN_VERB[e.action];
            return (
              <li key={e.id} className="text-xs leading-snug text-foreground">
                <span className="font-medium">{who}</span>{" "}
                {screenVerb ? (
                  // Screen target. For a duplicate, show the source → new:
                  // "duplicated Screen 1 → Screen 1 copy". Otherwise just
                  // "created Pricing v2".
                  e.action === "screen.duplicate" &&
                  typeof e.metadata?.fromName === "string" ? (
                    <>
                      <span className="text-muted-foreground">duplicated</span>{" "}
                      <span className="text-foreground">
                        {e.metadata.fromName as string}
                      </span>
                      <span className="text-muted-foreground"> → </span>
                      <span className="text-foreground">
                        {name ?? "a screen"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-muted-foreground">{screenVerb}</span>{" "}
                      <span className="text-foreground">
                        {name ?? "a screen"}
                      </span>
                    </>
                  )
                ) : (
                  // Everything else: "generated an image" (+ on {screen})
                  <>
                    <span className="text-muted-foreground">
                      {VERB[e.action] ?? e.action}
                    </span>
                    {name && (
                      <span className="text-muted-foreground">
                        {" "}
                        on <span className="text-foreground">{name}</span>
                      </span>
                    )}
                  </>
                )}
                <span className="text-muted-foreground">
                  {" · "}
                  {relTime(e.createdAt)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {events.length > ACTIVITY_PREVIEW && (
        <button
          type="button"
          onClick={() => setShowAllActivity((v) => !v)}
          className="self-start pb-4 text-xs font-medium text-muted-foreground transition hover:text-foreground"
        >
          {showAllActivity
            ? "Show less"
            : `Show all activity (${events.length})`}
        </button>
      )}
    </div>
  );
}
