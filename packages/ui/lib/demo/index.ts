/**
 * lib/demo/ — shared scripted-demo primitive.
 *
 * The spine behind every "type this, wait, then reveal that" surface
 * in gradeui. Three building blocks:
 *
 *   useScriptedDemo  — generic step machine (timing, trigger, loop,
 *                      cancellation, play / stop). Components supply
 *                      an `interpret(step, ctx)` callback that knows
 *                      how to apply their own step verbs.
 *
 *   BlinkingCursor   — the shared caret used wherever the demo
 *                      simulates typing.
 *
 *   DemoStage / Reveal — context-driven staging for whole-interface
 *                      reveals (hero appears, then subhead, then CTA).
 *
 * Current consumers:
 *   `<Code>`     — terminal / source typing
 *   `<Composer>` — rich text typing with mentions / slash
 *   marketing surfaces wrap regions in `<DemoStage>` + `<Reveal>` to
 *   stage section appearance.
 *
 * Adding a new scripted component:
 *   1. Define your own Step union.
 *   2. Call useScriptedDemo with an interpret callback that switches
 *      on step.type. Use `sleep(ms, ctx.signal)` and `typeText(...)`
 *      for any timing so stop() cancels cleanly.
 *   3. Forward `<BlinkingCursor>` if your surface simulates typing.
 *   4. Document the new consumer in the README in this directory.
 */

export {
  DEMO_SPEED_PRESETS,
  DEMO_IN_VIEW_AMOUNT,
  type DemoSpeed,
  type DemoTrigger,
} from "./types";

export { sleep, typeText, isAbortError } from "./sleep";

export {
  useScriptedDemo,
  type UseScriptedDemoOptions,
  type ScriptedDemoState,
  type ScriptedDemoContext,
} from "./use-scripted-demo";

export {
  BlinkingCursor,
  type BlinkingCursorProps,
} from "./blinking-cursor";

export {
  DemoStage,
  Reveal,
  type DemoStageProps,
  type RevealProps,
  type RevealStep,
  type RevealAnimation,
} from "./stage";
