"use client";

/**
 * InvitePeopleDialog — owner-side control for inviting someone to a
 * project and seeing who's outstanding. Collects an email + a role
 * (Editor = read/write, Viewer = read + comment) and hands them to the
 * parent, which POSTs to /api/invitations. The recipient gets a
 * tokenised /accept-invite link; accepting inserts a project_access
 * grant (see accept-invite/actions), after which the project shows up
 * under "Shared with you" in their Projects menu and both people can
 * comment on the same screens.
 *
 * Below the form sits the live invite list (GET /api/invitations) so the
 * owner can see who's accepted vs still pending, and revoke a pending
 * invite (DELETE) for someone who'll never respond.
 *
 * Role is a small segmented toggle rather than a Select — two options,
 * and it keeps the dialog dependency-light.
 */

import * as React from "react";
import { Loader2, X } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@gradeui/ui";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type InviteRole = "editor" | "viewer";

interface InviteRow {
  token: string;
  email: string;
  role: string;
  accepted_at: number | null;
  expires_at: number;
  created_at: number;
}

interface InvitePeopleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Project the invite is scoped to. Used for the copy AND to fetch the
   *  invite list. */
  projectId?: string;
  projectName?: string;
  /** Submit handler — the parent POSTs to /api/invitations and surfaces
   *  the result (toast + copy the accept link when email isn't wired).
   *  Resolve = sent (form clears + list refreshes); throw = leave the
   *  typed values so the owner can retry. */
  onInvite: (input: { email: string; role: InviteRole }) => Promise<void>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function inviteStatus(inv: InviteRow): "accepted" | "expired" | "pending" {
  if (inv.accepted_at) return "accepted";
  if (inv.expires_at < Date.now()) return "expired";
  return "pending";
}

export function InvitePeopleDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  onInvite,
}: InvitePeopleDialogProps) {
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<InviteRole>("editor");
  const [submitting, setSubmitting] = React.useState(false);

  const [invites, setInvites] = React.useState<InviteRow[]>([]);
  const [loadingList, setLoadingList] = React.useState(false);
  const [revoking, setRevoking] = React.useState<string | null>(null);

  const loadInvites = React.useCallback(async () => {
    if (!projectId) return;
    setLoadingList(true);
    try {
      const res = await fetch(
        `/api/invitations?projectId=${encodeURIComponent(projectId)}`,
      );
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; invitations?: InviteRow[] }
        | null;
      if (res.ok && data?.ok) setInvites(data.invitations ?? []);
    } finally {
      setLoadingList(false);
    }
  }, [projectId]);

  // Reset the form + (re)load the list whenever the dialog opens.
  React.useEffect(() => {
    if (open) {
      setEmail("");
      setRole("editor");
      setSubmitting(false);
      loadInvites();
    }
  }, [open, loadInvites]);

  const emailValid = EMAIL_RE.test(email.trim());
  const canSubmit = emailValid && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onInvite({ email: email.trim(), role });
      setEmail("");
      setSubmitting(false);
      loadInvites();
    } catch {
      // Parent has toasted the error; keep the dialog open with the
      // typed values so the owner can fix + retry.
      setSubmitting(false);
    }
  };

  const handleRevoke = async (token: string) => {
    setRevoking(token);
    try {
      const res = await fetch("/api/invitations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;
      if (!res.ok || !data?.ok) {
        toast.error("Couldn't revoke invite", {
          description: data?.error ?? `Failed (${res.status})`,
        });
        return;
      }
      setInvites((prev) => prev.filter((i) => i.token !== token));
    } finally {
      setRevoking(null);
    }
  };

  const roleBtn = (value: InviteRole, label: string, hint: string) => (
    <button
      type="button"
      onClick={() => setRole(value)}
      aria-pressed={role === value}
      className={cn(
        "flex flex-1 flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left transition",
        role === value
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-muted/60",
      )}
    >
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite people</DialogTitle>
          <DialogDescription>
            {projectName
              ? `Invite someone to “${projectName}”. They’ll get an email link to join.`
              : "Invite someone to this project. They’ll get an email link to join."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@example.com"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Role</Label>
            <div className="flex gap-2">
              {roleBtn("editor", "Editor", "Can edit + comment")}
              {roleBtn("viewer", "Viewer", "Can view + comment")}
            </div>
          </div>
        </form>

        {/* Outstanding invites — who's accepted, who hasn't. */}
        {(loadingList || invites.length > 0) && (
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Invites
              </span>
              {loadingList && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </div>
            <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto">
              {invites.map((inv) => {
                const status = inviteStatus(inv);
                return (
                  <li
                    key={inv.token}
                    className="flex items-center gap-2 rounded-md px-1 py-1"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {inv.email}
                    </span>
                    <span className="text-[11px] capitalize text-muted-foreground">
                      {inv.role}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                        status === "accepted" &&
                          "bg-primary/10 text-primary",
                        status === "pending" &&
                          "bg-muted text-muted-foreground",
                        status === "expired" &&
                          "bg-destructive/10 text-destructive",
                      )}
                    >
                      {status === "accepted"
                        ? "Accepted"
                        : status === "expired"
                          ? "Expired"
                          : "Pending"}
                    </span>
                    {status !== "accepted" && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(inv.token)}
                        disabled={revoking === inv.token}
                        aria-label={`Revoke invite for ${inv.email}`}
                        title="Revoke"
                        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-foreground/10 hover:text-foreground disabled:opacity-50"
                      >
                        {revoking === inv.token ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button type="button" disabled={!canSubmit} onClick={handleSubmit}>
            {submitting ? "Sending…" : "Send invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
