---
"@gradeui/ui": minor
---

`lib/demo` (the declarative scripted-motion layer behind `<Code>`, `<Composer>`, `<DemoStage>`) now honours reduced motion.

`useScriptedDemo` reads `useReducedMotion()`, so when the OS reports `prefers-reduced-motion: reduce` (or the global `data-motion="off"` toggle is set) the runner settles on the final frame instead of animating: every step completes instantly, the sequence never loops, and `typeText` emits whole strings in one tick. Previously the typing/reveal loop ran regardless, which meant a screen built with `<Code>` kept animating under reduced motion.

This closes the accessibility gap for the declarative-motion surfaces and brings them in line with ThreeScene, the CSS reset, and the rest of the motion control. `ScriptedDemoContext` also gains a `reduced` flag for interpreters that do non-timing-based work (confetti, sound) and want to opt out under reduced motion.
