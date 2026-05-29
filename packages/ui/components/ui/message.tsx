"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Message — the canonical "avatar + author + timestamp + body" row.
 *
 * THE primitive for any chat message, comment, post-reply, activity-log
 * entry, or notification row that follows the people-and-text shape.
 * Surfaced after three scaffolds (chat, comments, hero preview) all
 * re-rolled the same flex layout inline — that was the signal.
 *
 * Slot-based composition for the avatar so consumers pass whatever
 * Avatar variant fits their surface (sized, toned, image, fallback).
 * Message doesn't pick an Avatar shape for you — it just hosts.
 *
 *   <Message
 *     author="alice"
 *     timestamp="11:24"
 *     avatar={
 *       <Avatar size="sm">
 *         <AvatarFallback tone="violet">A</AvatarFallback>
 *       </Avatar>
 *     }
 *   >
 *     Post copy is in the doc.
 *   </Message>
 *
 * For "your messages right-aligned" chat surfaces (iMessage / WhatsApp
 * / your own DM threads), pass `align="end"` and the row + content
 * mirror.
 *
 * Anti-patterns to avoid (caught from real scaffold use):
 *
 *   - Don't roll a custom "AuthorDot" inline — Avatar with
 *     <AvatarFallback tone="..."> covers the colored-initials case
 *     cleanly and stays themable.
 *   - Don't use Message for non-people activity (system events,
 *     log lines). Reach for Callout or a plain Row.
 */

export interface MessageProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Display name of the message author. */
  author: string;
  /**
   * Timestamp string ("11:24", "2 hours ago") OR any node for custom
   * formatting (tooltip-wrapped time, link to permalink, etc).
   */
  timestamp?: React.ReactNode;
  /**
   * Avatar slot. Pass any `<Avatar>` composition. When omitted, the
   * row renders without an avatar column — handy for grouped messages
   * from the same author where only the first row shows the avatar.
   */
  avatar?: React.ReactNode;
  /**
   * Small chip(s) next to the author name. Use for "OP", "Bot",
   * "Admin", or any role/state badge that belongs in the header
   * rhythm rather than the body.
   */
  badge?: React.ReactNode;
  /**
   * Editing state — renders an "(edited)" hint next to the timestamp.
   * Pass a string to customise the label (e.g. "(edited 2 minutes ago)").
   */
  edited?: boolean | string;
  /**
   * Pinned state — renders a small pin glyph at the top of the row.
   * Surfaces "this is a sticky / pinned message" in Slack-style feeds.
   */
  pinned?: boolean;
  /**
   * End-of-header slot. Common use: a hover-revealed Row of small
   * icon buttons (reply / react / pin / more). Pushed to the right
   * with `ml-auto`.
   */
  actions?: React.ReactNode;
  /**
   * Reactions slot — renders below the body. Typically a Row of
   * reaction chips (emoji + count). Hidden when no node is passed.
   */
  reactions?: React.ReactNode;
  /**
   * Thread / reply count — renders a "N replies" link affordance
   * below the body. Click handler is the consumer's responsibility.
   * Wire `onThreadClick` if you want the built-in button to fire.
   */
  threadCount?: number;
  /** Fires when the built-in "N replies" affordance is clicked. */
  onThreadClick?: () => void;
  /**
   * Visual alignment. `start` (default) puts the avatar on the left
   * — the standard chat / comment shape. `end` mirrors the row so the
   * avatar sits on the right and the content right-aligns — use for
   * "your messages" in DM threads.
   */
  align?: "start" | "end";
  /**
   * Body content (the message text). Accepts any node so consumers
   * can embed rich content — Markdown-rendered prose, images,
   * embedded cards, etc. Plain text is the common case.
   */
  children: React.ReactNode;
}

export const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  function Message(
    {
      author,
      timestamp,
      avatar,
      badge,
      edited,
      pinned,
      actions,
      reactions,
      threadCount,
      onThreadClick,
      align = "start",
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const isEnd = align === "end";
    const editedLabel = edited === true ? "(edited)" : edited || undefined;

    return (
      <div
        ref={ref}
        data-gds-part="message"
        data-gds-align={align}
        data-gds-pinned={pinned ? "true" : undefined}
        className={cn(
          "flex items-start gap-3",
          isEnd && "flex-row-reverse",
          className,
        )}
        {...rest}
      >
        {avatar && (
          <div
            data-gds-part="message-avatar"
            className="flex-shrink-0"
          >
            {avatar}
          </div>
        )}
        <div
          data-gds-part="message-content"
          className={cn(
            "flex-1 min-w-0 space-y-1",
            isEnd && "text-right",
          )}
        >
          {pinned && (
            <div
              data-gds-part="message-pinned"
              className={cn(
                "flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground",
                isEnd && "flex-row-reverse",
              )}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="h-3 w-3"
                fill="currentColor"
              >
                <path d="M9.828.722a.5.5 0 0 1 .707 0l4.743 4.743a.5.5 0 0 1 0 .707l-2.121 2.121a.5.5 0 0 1-.354.146h-1.792l-3.586 3.586v2.293a.5.5 0 0 1-.854.354L4.146 12.39 1 15.535V14.12l3.146-3.146-1.293-1.293a.5.5 0 0 1 .354-.854h2.293l3.586-3.586V3.45a.5.5 0 0 1 .146-.354L9.828.722Z" />
              </svg>
              Pinned
            </div>
          )}
          <div
            data-gds-part="message-header"
            className={cn(
              "flex items-baseline gap-2 flex-wrap",
              isEnd && "flex-row-reverse",
            )}
          >
            <span
              data-gds-part="message-author"
              className="text-sm font-semibold"
            >
              {author}
            </span>
            {badge && (
              <div data-gds-part="message-badge">{badge}</div>
            )}
            {timestamp && (
              <span
                data-gds-part="message-timestamp"
                className="text-xs text-muted-foreground"
              >
                {timestamp}
              </span>
            )}
            {editedLabel && (
              <span
                data-gds-part="message-edited"
                className="text-xs text-muted-foreground"
              >
                {editedLabel}
              </span>
            )}
            {actions && (
              <div
                data-gds-part="message-actions"
                className={cn(isEnd ? "mr-auto" : "ml-auto")}
              >
                {actions}
              </div>
            )}
          </div>
          <div
            data-gds-part="message-body"
            className="text-sm leading-relaxed"
          >
            {children}
          </div>
          {reactions && (
            <div
              data-gds-part="message-reactions"
              className={cn(
                "flex flex-wrap gap-1 pt-1",
                isEnd && "justify-end",
              )}
            >
              {reactions}
            </div>
          )}
          {typeof threadCount === "number" && threadCount > 0 && (
            <button
              type="button"
              data-gds-part="message-thread"
              onClick={onThreadClick}
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                "text-primary hover:underline",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded",
                isEnd && "flex-row-reverse",
              )}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="h-3 w-3"
                fill="currentColor"
              >
                <path d="M2 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H6.414l-2.707 2.707A1 1 0 0 1 2 12V3Z" />
              </svg>
              {threadCount} {threadCount === 1 ? "reply" : "replies"}
            </button>
          )}
        </div>
      </div>
    );
  },
);
