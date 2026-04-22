---
"@gradeui/docs": patch
---

Studio chat: raise input limit to 1000 chars and dress the messages list in the DS ScrollArea.

- **`INPUT_CHAR_LIMIT` bumped from 500 → 1000.** The textarea counter,
  the `<textarea maxLength>`, and the paste-slice guard all share the
  same constant, so the single bump covers all three enforcement sites.
  500 was tight once the studio grew multi-section layouts — "hero with
  shader background, pricing table below, testimonials, footer" can
  easily exceed 500 chars before the user has finished describing it.
  1000 chars is ~200 words, roughly the length of a full design brief.
- **Messages list now uses `<ScrollArea>` from the DS** instead of a
  bare `overflow-y-auto` div. The scrollbar now reads against the same
  tokens as the rest of the app, so it's a consistent visual affordance
  — on macOS overlay-scrollbar mode the native scrollbar is invisible
  until first wheel, which made the chat feel like a dead surface on
  initial load. Radix ScrollArea renders an internal viewport element
  that actually scrolls; `scrollToBottom()` now queries for it via
  `[data-radix-scroll-area-viewport]` and falls back to the Root ref if
  the component tree ever changes. `data-lenis-prevent` stays on the
  Root so the global Lenis smooth-scroll doesn't hijack wheel events
  inside the messages list.
