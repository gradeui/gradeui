# `lib/demo/` — scripted-demo primitive

The shared spine behind every "type this, wait, then reveal that" surface in the design system. If a component animates a scripted sequence on cue, it should be built on this primitive.

## Why it exists

Three (and counting) gradeui components script demos:

- `<Code>` types characters into a syntax-highlighted buffer
- `<Composer>` types rich text with mention / slash popovers
- `<DemoStage>` + `<Reveal>` stage the appearance of whole interface regions

These all need the same machinery: speed presets, mount / inView / manual triggers, looping, cancellation, an imperative `play()` handle, a blinking cursor where typing is involved. Without a shared primitive each component reinvents the same state machine slightly differently, and a tuning change to `slow` in one place doesn't carry to the others.

## What's in here

```
lib/demo/
├── types.ts                Speed + Trigger + DEMO_SPEED_PRESETS
├── sleep.ts                Cancellable sleep + typeText helpers
├── use-scripted-demo.ts    The step-machine hook
├── blinking-cursor.tsx     Shared caret primitive
├── stage.tsx               DemoStage + Reveal for interface staging
└── index.ts                Barrel
```

## Building a new scripted component

1. Define a `Step` union for your component's verbs.
2. Call `useScriptedDemo<MyStep>({ steps, interpret, speed, trigger, ... })`.
3. In `interpret(step, ctx)`, switch on `step.type` and run whichever side effects the step represents. Use `sleep(ms, ctx.signal)` for waits and `typeText(text, onTick, stagger, ctx.signal)` for character-by-character typing so `stop()` interrupts cleanly.
4. Forward `<BlinkingCursor />` to your output if the demo simulates typing.
5. Mirror the `speed`, `trigger`, `play`, `loop` props on your component's public API so authors get a consistent vocabulary.

## Tuning cadence globally

`DEMO_SPEED_PRESETS` in `types.ts` is the one place to retune cadence for the entire system. Three feels: slow, normal, fast. Each preset is a `{ tokenStagger, lineStagger, preDelay, fadeMs }` quad.
