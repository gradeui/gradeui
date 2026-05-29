/**
 * Shared types + presets for scripted component demos.
 *
 * Lives at the bottom of the demo primitive stack so the hook, the
 * cursor, and any component that opts in (`<Code>`, `<Composer>`,
 * `<DemoStage>`) all read from one definition of "what slow / normal /
 * fast feels like" and one definition of "when do we start playing".
 *
 * If you ever want to retune the cadence of every demo on the marketing
 * site at once, this is the file to edit.
 */

/**
 * Animation feel. Maps onto a triple of timing values so authors can
 * pick a vibe (slow / normal / fast) instead of hand-tuning ms.
 * Components that need finer control can still override the resolved
 * values per-instance.
 */
export type DemoSpeed = "slow" | "normal" | "fast";

/**
 * What kicks the demo off:
 *   - `mount`   plays immediately on first paint
 *   - `inView`  waits for the container to cross the viewport threshold
 *   - `manual`  driven by the `play` prop or imperative ref
 */
export type DemoTrigger = "mount" | "inView" | "manual";

/**
 * Speed presets shared across every scripted-demo surface. Three
 * unambiguously distinct feels: `slow` is "I am being shown", `normal`
 * is "I am being told", `fast` is "I am being briefed".
 *
 *   - `tokenStagger`  per-character cadence for typing-style steps
 *   - `lineStagger`   per-line cadence for reveal-style demos
 *   - `preDelay`      pause after the trigger fires before the first tick
 *   - `fadeMs`        default enter-transition duration for revealed parts
 */
export const DEMO_SPEED_PRESETS: Record<
  DemoSpeed,
  {
    tokenStagger: number;
    lineStagger: number;
    preDelay: number;
    fadeMs: number;
  }
> = {
  slow: { tokenStagger: 70, lineStagger: 200, preDelay: 500, fadeMs: 480 },
  normal: { tokenStagger: 22, lineStagger: 55, preDelay: 200, fadeMs: 280 },
  fast: { tokenStagger: 8, lineStagger: 18, preDelay: 60, fadeMs: 160 },
};

/**
 * `inView` threshold + `once` semantics applied by the hook. Marketing
 * surfaces want the reveal to fire once, after enough of the block is
 * visible that the user actually sees it animate.
 */
export const DEMO_IN_VIEW_AMOUNT = 0.55;
