"use client";

/**
 * Message docs page — interactive playground covering the three shapes:
 *
 *   1. Comment thread (default align="start")
 *   2. Chat with "your messages" right-aligned (align="end")
 *   3. With badge + actions slots
 *
 * Plus an Avatar tone reference so consumers can pick a stable
 * per-author colour.
 */

import * as React from "react";
import {
  Avatar,
  AvatarFallback,
  type AvatarTone,
} from "@/components/ui/avatar";
import { Message } from "@/components/ui/message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reply, MoreHorizontal, Heart } from "lucide-react";
import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { InstallBlock } from "@/components/install-block";

// Local short alias so the playground markup reads tight.
const Msg = Message;

const TONES: AvatarTone[] = [
  "muted",
  "primary",
  "violet",
  "amber",
  "emerald",
  "sky",
  "rose",
  "plum",
  "lime",
];

function SectionHeader({
  number,
  title,
  hint,
}: {
  number: string;
  title: string;
  hint: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-mono text-muted-foreground">{number}</span>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      <p className="text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

export default function MessagePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
          Message
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Canonical avatar + author + timestamp + body row. Use for chat
          messages, comments, post replies, activity log entries — anywhere
          the shape is people-and-text.
        </p>
      </div>

      {/* ── 01 Comment thread ────────────────────────────────────── */}
      <div className="space-y-4 rounded-lg border border-border p-5">
        <SectionHeader
          number="01"
          title="Comment thread"
          hint="Default align='start'. Stack multiple Messages with gap for spacing."
        />
        <div className="space-y-4">
          <Msg
            author="alice"
            timestamp="2 hours ago"
            avatar={
              <Avatar size="sm">
                <AvatarFallback tone="violet">A</AvatarFallback>
              </Avatar>
            }
          >
            Splitting this into two PRs makes the review tractable. The
            schema change is independent and reviewers can land it first.
          </Msg>
          <Msg
            author="ben"
            timestamp="1 hour ago"
            badge={
              <Badge variant="outline" className="text-[10px]">
                OP
              </Badge>
            }
            avatar={
              <Avatar size="sm">
                <AvatarFallback tone="amber">B</AvatarFallback>
              </Avatar>
            }
          >
            Agreed. I'll take the schema PR if no one's started.
          </Msg>
          <Msg
            author="carolina"
            timestamp="32 minutes ago"
            avatar={
              <Avatar size="sm">
                <AvatarFallback tone="emerald">C</AvatarFallback>
              </Avatar>
            }
          >
            Migration script is ready to go once the schema lands.
          </Msg>
        </div>
      </div>

      {/* ── 02 Chat with right-aligned "your" messages ──────────── */}
      <div className="space-y-4 rounded-lg border border-border p-5">
        <SectionHeader
          number="02"
          title="Chat (align='end' for your messages)"
          hint="DM-style alignment — your own messages mirror to the right."
        />
        <div className="space-y-3">
          <Msg
            author="alice"
            timestamp="11:24"
            avatar={
              <Avatar size="xs">
                <AvatarFallback tone="violet">A</AvatarFallback>
              </Avatar>
            }
          >
            Hey, how's the launch image coming along?
          </Msg>
          <Msg
            author="you"
            timestamp="11:26"
            align="end"
            avatar={
              <Avatar size="xs">
                <AvatarFallback tone="emerald">Y</AvatarFallback>
              </Avatar>
            }
          >
            Just finishing up. Will share in a minute.
          </Msg>
          <Msg
            author="alice"
            timestamp="11:27"
            avatar={
              <Avatar size="xs">
                <AvatarFallback tone="violet">A</AvatarFallback>
              </Avatar>
            }
          >
            Perfect, thanks!
          </Msg>
        </div>
      </div>

      {/* ── 03 With actions ──────────────────────────────────────── */}
      <div className="space-y-4 rounded-lg border border-border p-5">
        <SectionHeader
          number="03"
          title="With hover-revealed actions"
          hint="Pass an `actions` slot — typically a small Row of icon buttons revealed on hover via .group / group-hover."
        />
        <div className="space-y-4">
          <Msg
            author="dimitri"
            timestamp="20 minutes ago"
            avatar={
              <Avatar size="sm">
                <AvatarFallback tone="sky">D</AvatarFallback>
              </Avatar>
            }
            actions={
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button iconOnly variant="ghost" className="h-6 w-6">
                  <Heart className="h-3 w-3" />
                </Button>
                <Button iconOnly variant="ghost" className="h-6 w-6">
                  <Reply className="h-3 w-3" />
                </Button>
                <Button iconOnly variant="ghost" className="h-6 w-6">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </div>
            }
            className="group"
          >
            Hover to reveal reply / react / more actions. The actions slot
            renders inside the header row, pushed to the right via ml-auto.
          </Msg>
        </div>
      </div>

      {/* ── 04 Compact density ───────────────────────────────────── */}
      <div className="space-y-4 rounded-lg border border-border p-5">
        <SectionHeader
          number="04"
          title="Compact density"
          hint="density='compact' tightens text + gaps for narrow side panels (Studio Comments, activity feeds, notification rows). Pair with Avatar size='xs'."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-md border border-border bg-muted/20 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              default
            </div>
            <div className="space-y-3">
              <Msg
                author="alice"
                timestamp="2m ago"
                edited
                avatar={
                  <Avatar size="sm">
                    <AvatarFallback tone="violet">A</AvatarFallback>
                  </Avatar>
                }
              >
                Splitting this into two PRs makes the review tractable.
              </Msg>
              <Msg
                author="ben"
                timestamp="1m ago"
                avatar={
                  <Avatar size="sm">
                    <AvatarFallback tone="amber">B</AvatarFallback>
                  </Avatar>
                }
              >
                Agreed. I'll take the schema PR.
              </Msg>
            </div>
          </div>
          <div className="rounded-md border border-border bg-muted/20 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              compact
            </div>
            <div className="space-y-2">
              <Msg
                density="compact"
                author="alice"
                timestamp="2m ago"
                edited="· edited 1m ago"
                avatar={
                  <Avatar size="xs">
                    <AvatarFallback tone="violet">A</AvatarFallback>
                  </Avatar>
                }
              >
                Splitting this into two PRs makes the review tractable.
              </Msg>
              <Msg
                density="compact"
                author="ben"
                timestamp="1m ago"
                avatar={
                  <Avatar size="xs">
                    <AvatarFallback tone="amber">B</AvatarFallback>
                  </Avatar>
                }
              >
                Agreed. I'll take the schema PR.
              </Msg>
            </div>
          </div>
        </div>
      </div>

      {/* ── Avatar tones reference ───────────────────────────────── */}
      <div className="space-y-4 rounded-lg border border-border p-5">
        <SectionHeader
          number="—"
          title="Avatar tones"
          hint="AvatarFallback now supports a `tone` prop for stable per-author colour. Useful for chat / comment surfaces."
        />
        <div className="flex flex-wrap gap-3">
          {TONES.map((tone) => (
            <div key={tone} className="flex flex-col items-center gap-1">
              <Avatar size="md">
                <AvatarFallback tone={tone}>
                  {tone[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-mono text-muted-foreground">
                {tone}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Usage */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <InstallBlock>{`import { Message, Avatar, AvatarFallback } from "@gradeui/ui";

<Message
  author="alice"
  timestamp="2 hours ago"
  avatar={
    <Avatar size="sm">
      <AvatarFallback tone="violet">A</AvatarFallback>
    </Avatar>
  }
>
  Splitting this into two PRs makes the review tractable.
</Message>`}</InstallBlock>
      </div>

      <SidecarBlock slug="message" />

      <ComponentNav currentHref="/components/message" />
    </div>
  );
}
