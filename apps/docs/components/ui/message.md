---
name: Message
import: "@gradeui/ui"
props:
  - author: string — display name of the message author
  - timestamp?: ReactNode — string ("11:24", "2 hours ago") or any node for custom formatting
  - avatar?: ReactNode — slot for any `<Avatar>` composition; omit for grouped messages from the same author
  - badge?: ReactNode — small chip(s) next to the author name (OP, Bot, Admin, role tag)
  - edited?: boolean | string — renders "(edited)" hint next to timestamp; pass a string to customise ("(edited 2 minutes ago)")
  - pinned?: boolean — renders a pin glyph + "Pinned" label above the header row for sticky / pinned messages
  - actions?: ReactNode — end-of-header slot, typically hover-revealed icon buttons (reply / react / more)
  - reactions?: ReactNode — slot below the body, typically a Row of reaction chips (emoji + count)
  - threadCount?: number — renders a "N replies" link affordance below the body
  - onThreadClick?: () => void — handler for the threadCount affordance
  - align?: "start" | "end" — `start` (default) puts the avatar on the left; `end` mirrors for "your messages" in DM threads
  - children: ReactNode — body content (plain text or rich nodes)
  - className?: string
when_to_use: |
  The canonical "avatar + author + timestamp + body" row. THE PRIMITIVE
  for any chat surface, comment thread, post-reply, activity log, or
  notification feed that follows the people-and-text shape.

  CONCRETE TEST — if you find yourself composing an `<Avatar>` followed
  by a `<Row>` of author name + timestamp, with a `<p>` or `<span>`
  body below, STOP. That is `<Message>`. Reach for it directly.

  Slack-style channel feed, Discord messages, Teams chat, Linear /
  GitHub / Jira comments, Reddit replies, Twitter/X posts in a thread,
  Notion comment sidebars, in-app activity logs, notification rows —
  every one of these IS `<Message>`. Do not roll the layout inline.

  For non-people activity (system events, log lines, status pings) use
  Callout or a plain Row instead — Message implies a human author.
composes_with: [Avatar (in the avatar slot — pair with AvatarFallback tone="..." for stable per-author colour), Badge (in the badge slot for role / OP / bot tags), Button (in actions, typically size="icon" + variant="ghost"), Stack (host multiple Messages in a thread), Card (wrap a Stack of Messages for a comment-thread block)]
aliases: [
  message, chat message, comment, post, reply, activity row, notification row,
  thread row, channel message, dm message, slack message, discord message,
  teams message, channel feed message, feed item, feed row, message row,
  user message, user post, conversation message, conversation row,
  inline comment, threaded reply, message bubble, chat bubble, talk bubble
]
---

```jsx
// Comment thread shape — avatar left, body below the author row.
<Stack gap="md">
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
  </Message>
  <Message
    author="ben"
    timestamp="1 hour ago"
    badge={<Badge variant="outline" className="text-[10px]">OP</Badge>}
    avatar={
      <Avatar size="sm">
        <AvatarFallback tone="amber">B</AvatarFallback>
      </Avatar>
    }
  >
    Agreed. I'll take the schema PR.
  </Message>
</Stack>
```

```jsx
// Chat shape — your messages right-aligned via align="end".
<Stack gap="md">
  <Message
    author="alice"
    timestamp="11:24"
    avatar={
      <Avatar size="xs">
        <AvatarFallback tone="violet">A</AvatarFallback>
      </Avatar>
    }
  >
    Hey, how's the launch going?
  </Message>
  <Message
    author="you"
    timestamp="11:26"
    align="end"
    avatar={
      <Avatar size="xs">
        <AvatarFallback tone="emerald">Y</AvatarFallback>
      </Avatar>
    }
  >
    Launch image is in, scheduling now.
  </Message>
</Stack>
```

```jsx
// Full Slack-style message — edited indicator, pinned flag, reactions
// row, threaded reply count, role badge, hover actions.
<Message
  author="alice"
  timestamp="11:24"
  edited
  pinned
  badge={<Badge variant="secondary" className="text-[10px]">Designer</Badge>}
  avatar={
    <Avatar size="md">
      <AvatarFallback tone="violet">A</AvatarFallback>
    </Avatar>
  }
  reactions={
    <>
      <Badge variant="outline" className="gap-1 cursor-pointer">👍 4</Badge>
      <Badge variant="outline" className="gap-1 cursor-pointer">🎉 2</Badge>
    </>
  }
  threadCount={3}
  onThreadClick={() => openThread(messageId)}
>
  Updated the token spec — review when you have a chance.
</Message>
```

```jsx
// Slack / Discord channel feed — with role badge + hover-revealed actions.
<Stack gap="lg">
  {messages.map((m) => (
    <Message
      key={m.id}
      author={m.user}
      timestamp={m.time}
      badge={<Badge variant="secondary" className="text-[10px]">{m.role}</Badge>}
      avatar={
        <Avatar size="md">
          <AvatarImage src={m.avatar} />
          <AvatarFallback tone="sky">{m.user.charAt(0)}</AvatarFallback>
        </Avatar>
      }
      actions={
        <Row gap="xs" className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="ghost" className="h-6 w-6"><Smile className="h-3 w-3" /></Button>
          <Button size="icon" variant="ghost" className="h-6 w-6"><Reply className="h-3 w-3" /></Button>
          <Button size="icon" variant="ghost" className="h-6 w-6"><MoreHorizontal className="h-3 w-3" /></Button>
        </Row>
      }
      className="group"
    >
      {m.text}
    </Message>
  ))}
</Stack>
```

## Anti-patterns

```jsx
// ❌ Rolling the message layout by hand from Avatar + Row + Badge + spans.
//    This is the EXACT shape Message exists to consolidate — caught in
//    the wild on a "Slack clone" prompt where the model assembled this
//    inline instead of reaching for Message. The result loses the
//    align="end" knob, the actions slot, the data-gds-part hooks, and
//    duplicates the same flex template across every consumer.
{messages.map((msg) => (
  <div className="group flex gap-4">
    <Avatar className="w-9 h-9 shrink-0">
      <AvatarImage src={msg.avatar} />
      <AvatarFallback>{msg.user.charAt(0)}</AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <Row gap="sm" align="baseline">
        <span className="font-semibold text-sm">{msg.user}</span>
        <Badge variant="secondary" className="text-[10px]">{msg.role}</Badge>
        <span className="text-[10px] text-muted-foreground">{msg.time}</span>
      </Row>
      <p className="text-sm mt-1">{msg.text}</p>
    </div>
  </div>
))}

// ✅ The Grade way.
{messages.map((msg) => (
  <Message
    key={msg.id}
    author={msg.user}
    timestamp={msg.time}
    badge={<Badge variant="secondary" className="text-[10px]">{msg.role}</Badge>}
    avatar={
      <Avatar size="md">
        <AvatarImage src={msg.avatar} />
        <AvatarFallback>{msg.user.charAt(0)}</AvatarFallback>
      </Avatar>
    }
  >
    {msg.text}
  </Message>
))}
```

```jsx
// ❌ Building a custom "AuthorDot" or "MessageRow" component inline as
//    a one-off helper inside a scaffold. Three scaffolds did this before
//    Message landed; the pattern is always identical.
function MessageRow({ user, body, time }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="h-7 w-7 rounded-full bg-violet-500/20 ...">{user[0]}</div>
      <div>
        <Row><strong>{user}</strong> <small>{time}</small></Row>
        <p>{body}</p>
      </div>
    </div>
  );
}

// ✅ Use Message. The colored-initials avatar pattern is covered by
//    Avatar + AvatarFallback tone="...".
<Message
  author={user}
  timestamp={time}
  avatar={<Avatar size="sm"><AvatarFallback tone="violet">{user[0]}</AvatarFallback></Avatar>}
>
  {body}
</Message>
```
