---
name: RivePlayer
import: ./components/ui/rive-player
props:
  - src: string — URL or path to the .riv file
  - stateMachines?: string | string[] — state machine(s) to run
  - artboard?: string — artboard name; omit to use default
  - controls?: boolean (default false) — viewer mode by default; set true for play/pause overlay
  - autoPlay?: boolean (default true) — respects reduced-motion
  - loop?: boolean (default true)
  - pauseOffscreen?: boolean (default true)
  - fit?: "contain" | "cover" | "fill" | "fitWidth" | "fitHeight" | "none" (default "contain")
  - stateMachineInputs?: Record<string, number | boolean | string>
  - aspect?: "video" | "square" | "portrait" | "wide" | "auto" (default "square")
  - radius?: "none" | "sm" | "md" | "lg" | "xl" (default "lg")
  - poster?: string — image shown while the runtime loads
when_to_use: Rive runtime wrapped in the shared media surface. Reach for Rive when you need interactive state-machine animations driven by scroll/hover/input. For non-interactive looping video, use VideoPlayer; for shader-driven backgrounds, use ThreeScene.
composes_with: [MediaSurface (internal), Card, any container]
notes: The Rive runtime (`@rive-app/react-canvas`) is an optional dependency of `@gradeui/ui` — lazy-imported at mount. Consumers who don't use Rive can install with `--no-optional` and the dep is skipped; RivePlayer renders a friendly error if the runtime is missing.
---

```jsx
<RivePlayer src="/mascot.riv" aspect="square" />

// Player mode with state-machine inputs
<RivePlayer
  src="/button.riv"
  stateMachines="Hover"
  stateMachineInputs={{ isHovered: true }}
  controls
/>
```
