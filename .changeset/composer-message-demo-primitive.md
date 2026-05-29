---
"@gradeui/ui": minor
"@gradeui/studio": minor
---

Composer, Message, ComposerReply, and lib/demo scripted-demo primitive.

**New components**

- `<Composer>` — Lexical-backed text composition surface. Plain text or rich (bold / italic / underline / strike / code / h1-h3 / blockquote / pullquote / lists), mentions and slash commands via `lexical-beautiful-mentions`, image attachments via paperclip + clipboard paste, scripted demo playback for marketing surfaces. Replaces hand-rolled `<textarea>` + toolbar + send-button patterns wherever a user composes text. CSS-variable themed (`--gds-composer-*`).
- `<Message>` — canonical "avatar + author + timestamp + body" row for chat, comments, post replies, activity logs. Slot-based avatar, optional `edited` / `pinned` / `reactions` / `threadCount` / `badge` / `actions` props, `align="end"` for "your messages" in DM threads.
- `<ComposerReply>` — preset wrapping Composer for reply boxes (placeholder, no toolbar, no attachments, Cmd+Enter submit).
- `<DemoStage>` + `<Reveal>` — context-driven staging for whole-interface scripted reveals (marketing heroes, tutorial overlays, onboarding flows).
- `<BlinkingCursor>` — shared caret primitive used by scripted-typing demos.

**New primitive layer**

- `packages/ui/lib/demo/` — shared step-machine spine behind every scripted-demo surface in the design system. Exposes `useScriptedDemo` hook, `sleep`, `typeText`, `DEMO_SPEED_PRESETS`, `DemoStage`, `Reveal`, `BlinkingCursor`. Re-exported from the `@gradeui/ui` barrel.

**Enhanced**

- `<Avatar>` gains a `size` prop (xs / sm / md / lg / xl).
- `<AvatarFallback>` gains a `tone` prop (muted / primary / violet / amber / emerald / sky / rose / plum / lime) for stable per-author colour mapping.
- `<Code>` refactored onto `lib/demo` — same behaviour, shares the step machine + blinking cursor with Composer.
- `<AIChatComposer>` refactored onto Composer — same API, ~125-line shim that wraps Composer with chat-input defaults (formats=false, attachments, Press Enter hint).

**Studio playbook**

- `Composer`, `ComposerReply`, `Message`, `DemoStage`, `Reveal` added to the allowlist.
- Sidecar anti-patterns added to `composer.md` and `message.md` to steer the model away from inline `<textarea>` + toolbar and inline avatar+row patterns.
- `linear-clone` and `notion-clone` reference scaffolds refactored to use the new primitives (Message for comment threads, Composer for input surfaces); Tiptap dependency removed from both.
- Four new playground scaffolds: `hero-staged-reveal`, `composer-chat-demo`, `composer-comments-demo`, `composer-document-demo`.

**Docs**

- New `/components/composer` and `/components/message` pages.
- `gradeui/CLAUDE.md` gained a 12-step "Creating a new component" ship checklist.

**Dependencies**

Adds `lexical`, `@lexical/react`, `@lexical/rich-text`, `@lexical/list`, `@lexical/link`, `@lexical/code`, `@lexical/markdown`, `@lexical/selection`, `@lexical/utils`, `lexical-beautiful-mentions` to `@gradeui/ui`.
