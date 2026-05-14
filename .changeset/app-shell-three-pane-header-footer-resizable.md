---
"@gradeui/ui": minor
---

**AppShell**: add `Header`, `Aside`, `Footer` slots and a new `nav="three-pane"` variant.

The shell is now a CSS-grid template-areas layout keyed off `data-nav` on the
root, so slot order in JSX no longer matters — each slot has a fixed
`grid-area`. This unlocks marketing-page layouts (`<AppShellHeader>` + main
+ `<AppShellFooter>`) and the Slack/Mail/Notion 3-column shape (nav rail +
fixed Aside + flex Main).

The middle column width in `nav="three-pane"` is set by the
`--rds-app-shell-aside` CSS variable (default 320px) — override per-screen
without forking the component.

The existing `nav="none" | "top" | "side"` variants keep their previous
visual behaviour; only the implementation moved to template areas.

New exports: `AppShellHeader`, `AppShellAside`, `AppShellFooter` plus their
prop types.

**Resizable** (new): port of shadcn's `resizable`, built on
`react-resizable-panels`. Use when you want user-adjustable column widths
inside any layout — e.g. a 3-column app where the user can drag the divider
between list and detail. Static layouts should keep using
`<AppShell nav="three-pane">`.

New exports: `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`.
New runtime dep: `react-resizable-panels@^2.1.7`.
