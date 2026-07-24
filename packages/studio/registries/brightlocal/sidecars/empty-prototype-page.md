---
name: EmptyPrototypePage
import: "@brightlocal/proposal"
props:
  - title?: string — Header line above the description. (default "This feature isn't available yet")
  - description?: node — Body copy under the header. Defaults to THIS proposal's standard explainer — which pages ARE built (All Locations, Location Home, AI Insights, and one page deep for the Location Grid), with those screen names in bold. NO em dashes (proposal copy rule). Pass any node to override per page.
  - mascot? — The open-eye Globey frame — any Globey SVG from @brightlocal/illustrations (GlobeyCalmOpen1, GlobeyWinkOpen1, GlobeyDownOpen1, …). Overridable per page. (default GlobeyCalmOpen1)
  - mascotClosed? — The closed-eye frame used for the blink; pair it with a matching `mascot` face if you swap. (default GlobeyCalmClosed)
  - dataHook?: string — Instance name stamped on the root. (default "empty-prototype-page")
---

The standard blank-page state for pages this proposal doesn't
implement. NO dashed outline — an SVG Globey mascot in a 4:3 zone, a
header, and descriptive copy, centred in the content area. The mascot
is SVG (not the raster `GlobeyFixingFault` scene) so it stays crisp at
any size and flips itself in dark mode (the illustration ships a
light/dark twin). A gentle idle float + an occasional blink give it
life; both are suppressed under `prefers-reduced-motion`.

```jsx
import { AppLayoutShell, ProposalSidebar, PageHeader, EmptyPrototypePage } from "@brightlocal/proposal";

// Standard — inherits the project's default title + description:
<GlobalLayoutContentBody>
  <EmptyPrototypePage />
</GlobalLayoutContentBody>

// Bespoke copy / a different Globey face:
import { GlobeyWinkOpen1, GlobeyWinkClosed } from "@brightlocal/illustrations";
<EmptyPrototypePage
  title="Reports aren't in this prototype"
  mascot={GlobeyWinkOpen1}
  mascotClosed={GlobeyWinkClosed}
/>
```

The default `description` is project-level on purpose: every blank page
shares one explainer, so the copy lives in ONE place. Referenced screen
names render bold (not links — a live link mid-demo is a footgun; the
walkthrough teaches its interaction pattern by being clicked).

ROLL-OUT IS OWNER-GATED: promoted from the Set-up Tasks screen, which
still runs its own local copy. Do not swap another page's placeholder
for this component until explicitly told — the timing is the owner's.
