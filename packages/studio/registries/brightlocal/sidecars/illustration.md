---
name: Illustration
import: "@brightlocal/illustrations"
props:
  - size?: number | string — Width AND height. (default 250 — almost always pass something smaller, 64–120 for card/banner use)
  - variant? (dark | light | bright | white) — Surface-type palette. Default suits light surfaces; "dark"/"white" for dark bands.
  - (spreads to the root SVG — className, aria-hidden, etc.)
when_to_use: Spot illustrations + the Globey mascot from the official @brightlocal/illustrations package — empty states, status banners (StatusBanner uses RobotAiA), celebratory moments, onboarding. NAMED PascalCase exports, one per illustration. Decorative by default — pass aria-hidden unless the illustration carries meaning.
composes_with: [StatusBanner, Card, Callout]
aliases: [illustration, spot art, mascot, globey, robot, empty state art]
---

```jsx
import { RobotAiA, MapPinLocation, SpeechBubbleReviewsStarsComment } from "@brightlocal/illustrations";

<RobotAiA size={88} aria-hidden />
<MapPinLocation size={120} />
```

73 spot illustrations — kebab-case file → PascalCase export. The ones
that fit this proposal: RobotAiA / RobotAiB (AI moments),
BusinessLocation, AgencyLocationBuilding, MapPinLocation,
MapMagnifyingGlassSearchLocation, SpeechBubbleReviewsStarsComment
(reviews), BinocularsSearchSeeingIdentify, CompassSearchFindExplore,
GlobeEarthWorld, RocketShipSpace, HeadsetSupportHelp,
ComputerChipAiBrainHead, LightBulb, CalendarSchedule,
EnvelopeMessage, NotesWritingPencil. Celebration/seasonal sets exist
too (CelebrationConfettiPartyPopper, …). Plus the Globey mascot family
via "@brightlocal/illustrations/globey/*" (36 gaze/mouth variants).

Fixed brand palette (ink #111412, brand green #2AE855, paper #FFFEFD)
— they do NOT tint via currentColor; pick the `variant` that suits the
surface instead.
