"use client";

/**
 * CommentThreadCard — one anchored conversation, header + comments
 * (one level of replies) + composer.
 *
 * Composed from gradeui primitives (Card, Avatar, Badge,
 * DropdownMenu, Button). One pure component; no storage / hook
 * dependencies — the parent (CommentsTab) injects the user
 * lookup, permission state, and handlers.
 *
 * One-level reply enforcement happens at render time: top-level
 * comments (parentCommentId === undefined) form the main flow;
 * children render once underneath their parent, indented; any
 * deeper nesting in storage is rendered flat under the nearest
 * top-level (defensive — shouldn't happen with the current
 * composer flow).
 */

import * as React from "react";
import { CheckCircle2, MoreHorizontal, RotateCcw, Trash2 } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@gradeui/ui";

import type {
  Comment,
  CommentThread,
  CommentThreadWithMessages,
} from "@/lib/studio-storage";
import type { User } from "@/lib/studio-users";

import { CommentComposer } from "./comment-composer";

interface CommentThreadCardProps {
  /** Thread + its comments, oldest-first. */
  data: CommentThreadWithMessages;
  /** Lookup user metadata by id — usually the page's allUsers map
   *  funnelled through. Returns undefined for unknown ids; the
   *  card renders a fallback (id-as-initials) so a missing user
   *  doesn't break the row. */
  getUser: (id: string) => User | undefined;
  /** The current user (for the reply composer's avatar + name). */
  currentUser: User;
  /** Whether the current user can post (replies, resolve). Read
   *  from `useCanAccess(...,'write')` upstream. Viewers can
   *  still see threads — composer + status actions just hide. */
  canWrite: boolean;
  // Mutations — parent owns the storage write.
  onReply: (threadId: string, parentCommentId: string | undefined, body: string) => Promise<void>;
  onResolve: (threadId: string) => void;
  onReopen: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  onDeleteComment: (commentId: string) => void;
  /** Optional — focus the anchored element in the canvas. Wires
   *  to the same select-bus the canvas already uses. Hidden when
   *  the element isn't present. */
  onFocusElement?: (instanceId: string) => void;
}

export function CommentThreadCard({
  data,
  getUser,
  currentUser,
  canWrite,
  onReply,
  onResolve,
  onReopen,
  onDeleteThread,
  onDeleteComment,
  onFocusElement,
}: CommentThreadCardProps) {
  const { thread, comments } = data;
  const [replying, setReplying] = React.useState(false);

  // Split into top-level + replies. Replies render under their
  // parent; any orphan reply (parent missing) renders as a
  // top-level for resilience.
  const topLevel = React.useMemo(
    () => comments.filter((c) => !c.parentCommentId),
    [comments],
  );
  const repliesByParent = React.useMemo(() => {
    const map: Record<string, Comment[]> = {};
    for (const c of comments) {
      if (!c.parentCommentId) continue;
      (map[c.parentCommentId] ??= []).push(c);
    }
    return map;
  }, [comments]);

  const author = getUser(thread.createdBy);
  const resolved = thread.status === "resolved";

  return (
    <Card
      className={
        resolved
          ? "border-border/50 bg-muted/30"
          : "border-border bg-background"
      }
    >
      {/* Header — element label, status, overflow. The element
          label is the primary anchor — click it to focus the
          element in the canvas. */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <button
          type="button"
          onClick={() => onFocusElement?.(thread.anchorId)}
          disabled={!onFocusElement}
          className="min-w-0 flex-1 text-left text-[11px] font-medium text-foreground hover:underline disabled:no-underline disabled:cursor-default"
          title="Focus this element in the canvas"
        >
          <span className="truncate">{thread.elementLabel}</span>
          {thread.componentName && (
            <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">
              &lt;{thread.componentName}&gt;
            </span>
          )}
        </button>
        {resolved && (
          <Badge
            variant="success-soft"
            className="text-[10px] px-1.5 py-0"
          >
            Resolved
          </Badge>
        )}
        {canWrite && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Thread actions"
                className="h-5 w-5 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 [&_svg]:size-3"
              >
                <MoreHorizontal />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {resolved ? (
                <DropdownMenuItem onClick={() => onReopen(thread.id)}>
                  <RotateCcw />
                  Reopen thread
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onResolve(thread.id)}>
                  <CheckCircle2 />
                  Mark resolved
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => onDeleteThread(thread.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 />
                Delete thread
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <CardContent className="flex flex-col gap-2 px-3 pb-3 pt-0">
        {topLevel.map((c) => (
          <CommentRow
            key={c.id}
            comment={c}
            author={getUser(c.authorId)}
            currentUser={currentUser}
            canWrite={canWrite}
            replies={repliesByParent[c.id] ?? []}
            onDelete={onDeleteComment}
            getUser={getUser}
          />
        ))}
        {canWrite && !resolved && (
          replying ? (
            <CommentComposer
              user={currentUser}
              placeholder="Reply…"
              submitLabel="Reply"
              autoFocus
              onCancel={() => setReplying(false)}
              onSubmit={async (body) => {
                await onReply(thread.id, undefined, body);
                setReplying(false);
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setReplying(true)}
              className="self-start text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Reply
            </button>
          )
        )}
      </CardContent>
    </Card>
  );
}

/** Single comment row — avatar + author + body + replies (one
 *  level). Pulled into its own component so the styling stays
 *  consistent between the thread opener, follow-ups, and replies. */
function CommentRow({
  comment,
  author,
  currentUser,
  canWrite,
  replies,
  onDelete,
  getUser,
}: {
  comment: Comment;
  author: User | undefined;
  currentUser: User;
  canWrite: boolean;
  replies: Comment[];
  onDelete: (id: string) => void;
  getUser: (id: string) => User | undefined;
}) {
  const isYou = comment.authorId === currentUser.id;
  const displayName = author?.name ?? (isYou ? "You" : comment.authorId);
  const initials = React.useMemo(() => {
    const source = author?.name ?? displayName;
    const parts = source.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
  }, [author?.name, displayName]);

  return (
    <div className="flex gap-2">
      <Avatar className="h-6 w-6 shrink-0">
        {author?.avatarUrl && (
          <AvatarImage src={author.avatarUrl} alt={displayName} />
        )}
        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline gap-1.5 text-[11px]">
          <span className="font-medium text-foreground truncate">
            {displayName}
          </span>
          <span className="text-muted-foreground">
            {relativeTime(comment.createdAt)}
          </span>
          {comment.editedAt && (
            <span
              className="text-muted-foreground"
              title={`Edited ${relativeTime(comment.editedAt)}`}
            >
              · edited
            </span>
          )}
          {canWrite && isYou && (
            <button
              type="button"
              onClick={() => onDelete(comment.id)}
              className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
              title="Delete this comment"
              aria-label="Delete comment"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
        <p className="text-xs text-foreground whitespace-pre-wrap break-words">
          {comment.body}
        </p>
        {replies.length > 0 && (
          <div className="mt-1 flex flex-col gap-2 border-l border-border/60 pl-2">
            {replies.map((r) => (
              <CommentRow
                key={r.id}
                comment={r}
                author={getUser(r.authorId)}
                currentUser={currentUser}
                canWrite={canWrite}
                replies={[]} // v1: one level only
                onDelete={onDelete}
                getUser={getUser}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Compact relative-time helper — same shape as the design
 *  breadcrumb's tooltip formatter so labels stay consistent
 *  across the chrome. */
function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 0) return "just now";
  const sec = Math.floor(diff / 1000);
  if (sec < 30) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
