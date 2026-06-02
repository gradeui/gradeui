"use client";

import * as React from "react";
import { useInView } from "motion/react";
import {
  DEMO_IN_VIEW_AMOUNT,
  DEMO_SPEED_PRESETS,
  type DemoSpeed,
  type DemoTrigger,
} from "./types";
import { isAbortError, sleep } from "./sleep";
import { useReducedMotion, usePageActive } from "../motion";

/**
 * useScriptedDemo — the shared step-machine hook behind every
 * scripted-demo surface in gradeui (`<Code>`, `<Composer>`,
 * `<DemoStage>`, anything else that wants the same play / stop / speed
 * semantics).
 *
 * Generic over the Step type. Each consumer defines its own verbs
 * (Code has `output`, Composer has `mention`, DemoStage has `reveal`)
 * and passes an `interpret(step, ctx)` callback that executes one
 * step. The hook owns: sequencing, cancellation, trigger detection
 * (mount / inView / manual), loop, pre-delay, completion signal, and
 * the imperative play() / stop() API.
 *
 * Reduced motion: this hook is the declarative-motion layer's accessibility
 * boundary. When the OS reports `prefers-reduced-motion: reduce` OR the
 * global `data-motion="off"` toggle is set (both via `useReducedMotion`),
 * the runner settles on the FINAL frame instead of animating — zeroed
 * timings run every step instantly and the sequence never loops, so the
 * end state shows and holds. That keeps lib/demo honouring the same motion
 * control as ThreeScene and the CSS reset; without it, a screen built with
 * <Code> would keep typing under reduced motion and would not be accessible.
 *
 * Authoring guide for `interpret`:
 *   - `await sleep(ms, ctx.signal)` for any pause so stop() can short
 *     a long wait cleanly.
 *   - `await typeText(text, onTick, stagger, ctx.signal)` for typing
 *     loops, again so stop() interrupts mid-character. A non-positive
 *     stagger (what the reduced-motion preset supplies) emits the whole
 *     string in one tick, so the final state shows with no animation.
 *   - Read `ctx.speed` to grab the resolved DEMO_SPEED_PRESETS entry
 *     when a step doesn't pin its own cadence.
 *   - Throw nothing on cancel — the helpers do it for you. Anything
 *     else thrown is treated as a real bug and bubbles to the console.
 */

export interface ScriptedDemoContext {
  /** Resolved speed preset for the current run. Zeroed under reduced motion. */
  speed: (typeof DEMO_SPEED_PRESETS)[DemoSpeed];
  /** AbortSignal that fires on stop() / unmount / steps change. */
  signal: AbortSignal;
  /** Live cancellation check for code paths that can't take a signal. */
  cancelled: () => boolean;
  /** True when the run is in reduced-motion mode (settling, not animating).
   *  Most interpreters don't need this — zeroed timings handle it — but a
   *  step that does something non-timing-based (confetti, sound) can skip it. */
  reduced: boolean;
}

export interface UseScriptedDemoOptions<TStep> {
  /** The steps to run. Undefined or empty means "no script". */
  steps?: TStep[];
  /**
   * Per-step interpreter. Receives one step + a context with timing
   * helpers, runs whatever the step means, and returns when done.
   * Synchronous or async — the runner awaits either.
   */
  interpret: (step: TStep, ctx: ScriptedDemoContext) => Promise<void> | void;
  /** Animation feel. Defaults to `normal`. */
  speed?: DemoSpeed;
  /** What kicks the script off. Defaults to `mount`. */
  trigger?: DemoTrigger;
  /** For `trigger="manual"` — flip true to play. */
  play?: boolean;
  /** Loop the sequence forever after completion. Pause length controlled by `loopDelay`. */
  loop?: boolean;
  /** Cap the number of loop cycles, then settle and stop. A demo is a movie —
   *  it shouldn't spin forever. Default Infinity. Grid/embed surfaces set a
   *  small number so the loop ends instead of running unattended. */
  maxLoops?: number;
  /**
   * Milliseconds to pause between loop cycles. Only applies when
   * `loop` is true. Defaults to 2000. Marketing surfaces that want
   * the demo to breathe between repeats bump this to 4000-6000; tight
   * inline demos drop it to 800.
   */
  loopDelay?: number;
  /** Container ref for inView detection. Required when `trigger="inView"`. */
  containerRef?: React.RefObject<HTMLElement | null>;
  /**
   * Fires when one loop iteration completes (or the whole run, when
   * `loop` is false). Consumers can use this to reset their buffer or
   * fire a parent callback.
   */
  onComplete?: () => void;
  /**
   * Fires before each loop iteration starts (after the 2s pause).
   * Use to reset per-iteration state in the consumer.
   */
  onLoopReset?: () => void;
}

export interface ScriptedDemoState {
  /** True while the runner is actively walking steps. */
  isPlaying: boolean;
  /** True after the last step has run (and stays true until reset). */
  isComplete: boolean;
  /** 0-indexed pointer to the currently executing step, or -1 idle. */
  currentIndex: number;
  /** Imperative trigger. Mostly for `trigger="manual"` ref handles. */
  play: () => void;
  /** Cancel the in-flight script. Idempotent. */
  stop: () => void;
  /**
   * One-shot replay. Cancels any in-flight run, then re-plays from
   * step 0. Pass a delay in ms to schedule the replay (useful for
   * "play, finish, breathe, play once more" cadences without the
   * commitment of `loop`).
   */
  restart: (delayMs?: number) => void;
}

const DEFAULT_LOOP_DELAY_MS = 2000;

// Reduced-motion timings — everything instant. `typeText` treats a
// non-positive stagger as "emit the whole string in one tick", so steps
// complete without the typing animation (or the flicker a 0ms loop causes)
// and the surface lands on its final frame.
const INSTANT_PRESET: (typeof DEMO_SPEED_PRESETS)[DemoSpeed] = {
  tokenStagger: 0,
  lineStagger: 0,
  preDelay: 0,
  fadeMs: 0,
};

export function useScriptedDemo<TStep>(
  opts: UseScriptedDemoOptions<TStep>,
): ScriptedDemoState {
  const {
    steps,
    interpret,
    speed = "normal",
    trigger = "mount",
    play: playProp,
    loop = false,
    loopDelay = DEFAULT_LOOP_DELAY_MS,
    maxLoops = Infinity,
    containerRef,
    onComplete,
    onLoopReset,
  } = opts;

  // Reduced motion (OS preference OR the global data-motion toggle): settle
  // on the final frame instead of animating. Zeroed timings + no loop.
  const reduced = useReducedMotion();
  const preset = reduced ? INSTANT_PRESET : DEMO_SPEED_PRESETS[speed];
  const effectiveLoop = reduced ? false : loop;

  // Playback gate part 1 of 2: is the page even being watched? Pauses every
  // loop when the tab is hidden/unfocused — a movie stops when you tab away.
  // (Part 2, element-in-view, is wired below once we have the container ref.)
  const pageActive = usePageActive();

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isComplete, setIsComplete] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(-1);

  // inView wiring — only active when trigger="inView" AND a container
  // ref was supplied. amount + once mirror the marketing-hero contract.
  // `useInView` accepts a nullable ref so we always pass the ref, but
  // it only fires when actually observable.
  // motion's typing requires a non-null element ref. We assert via cast
  // because passing { current: null } is legal at runtime and behaves
  // as "never in view".
  const noopRef = React.useRef<HTMLElement>(null);
  const inView = useInView(
    (containerRef ?? noopRef) as React.RefObject<Element>,
    {
      once: true,
      amount: DEMO_IN_VIEW_AMOUNT,
    },
  );

  // Playback gate part 2 of 2: a LIVE in-view (re-fires on leave, unlike the
  // once-only trigger above). Only meaningful when a container ref is being
  // observed; with no ref we can't see the element, so we don't gate on it
  // (tab visibility still applies). Together: pause when nobody's watching.
  const liveInView = useInView(
    (containerRef ?? noopRef) as React.RefObject<Element>,
    { amount: DEMO_IN_VIEW_AMOUNT },
  );
  const playbackActive = pageActive && (containerRef ? liveInView : true);

  // Manual play trigger — a counter we bump from the imperative play()
  // method. The runner effect depends on it so a second play() call
  // (after stop() or after completion) cleanly re-runs the script.
  const [manualPlayTick, setManualPlayTick] = React.useState(0);

  const shouldPlay = React.useMemo(() => {
    if (trigger === "mount") return true;
    if (trigger === "inView") return inView;
    // manual: explicit prop OR imperative play() call (tick > 0)
    return Boolean(playProp) || manualPlayTick > 0;
  }, [trigger, inView, playProp, manualPlayTick]);

  // Stable interpret ref so the runner effect doesn't restart on every
  // render just because the consumer passes an inline function.
  const interpretRef = React.useRef(interpret);
  interpretRef.current = interpret;

  const completeRef = React.useRef(onComplete);
  completeRef.current = onComplete;
  const loopResetRef = React.useRef(onLoopReset);
  loopResetRef.current = onLoopReset;

  // Active AbortController so stop() can fire from outside the effect.
  const controllerRef = React.useRef<AbortController | null>(null);
  // Pending restart timeout id so a second restart() call supersedes
  // the first (and unmount cleans up before it fires).
  const restartTimerRef = React.useRef<number | null>(null);

  const stop = React.useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const play = React.useCallback(() => {
    // For mount/inView triggers, calling play() manually still works
    // (treated as a manual re-run): we bump the tick and rely on the
    // effect dependency to restart.
    setManualPlayTick((n) => n + 1);
  }, []);

  const restart = React.useCallback((delayMs = 0) => {
    // Cancel any in-flight run and any pending restart so the new
    // call is the source of truth.
    controllerRef.current?.abort();
    controllerRef.current = null;
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (delayMs > 0) {
      restartTimerRef.current = window.setTimeout(() => {
        restartTimerRef.current = null;
        setManualPlayTick((n) => n + 1);
      }, delayMs);
      return;
    }
    setManualPlayTick((n) => n + 1);
  }, []);

  // Unmount cleanup for any orphaned restart timeout.
  React.useEffect(() => {
    return () => {
      if (restartTimerRef.current !== null) {
        window.clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    if (!steps || steps.length === 0) return;
    // Under reduced motion, run once to settle on the final frame even if
    // the normal trigger (inView / manual) hasn't fired — the content
    // should be present, just not animated.
    if (!reduced && (!shouldPlay || !playbackActive)) return;

    const controller = new AbortController();
    controllerRef.current = controller;
    const { signal } = controller;
    const cancelled = () => signal.aborted;

    const ctx: ScriptedDemoContext = { speed: preset, signal, cancelled, reduced };

    let active = true;
    let cycles = 0;

    const run = async () => {
      do {
        setIsPlaying(true);
        setIsComplete(false);
        setCurrentIndex(-1);

        try {
          // Initial pre-delay so the static state is visible for a
          // beat before the first step fires. Mostly matters for
          // `trigger="inView"` (the eye needs an anchor) but it's
          // cheap to apply universally. Zero under reduced motion.
          await sleep(trigger === "inView" ? preset.preDelay : 0, signal);

          for (let i = 0; i < steps.length; i++) {
            if (signal.aborted) return;
            setCurrentIndex(i);
            await interpretRef.current(steps[i], ctx);
          }

          if (signal.aborted) return;
          setCurrentIndex(-1);
          setIsComplete(true);
          completeRef.current?.();

          cycles += 1;
          // Stop when not looping, or once we've hit the loop cap — settle on
          // the final frame and don't spin unattended.
          if (!effectiveLoop || cycles >= maxLoops) {
            setIsPlaying(false);
            return;
          }

          // Loop: pause (`loopDelay`, default 2000ms) then reset and replay.
          await sleep(loopDelay, signal);
          if (signal.aborted) return;
          loopResetRef.current?.();
        } catch (err) {
          if (isAbortError(err)) return;
          // Re-throw real errors so authoring bugs surface in the
          // console rather than being swallowed silently.
          if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.error("[useScriptedDemo] step error:", err);
          }
          setIsPlaying(false);
          return;
        }
      } while (active && effectiveLoop && !signal.aborted);
    };

    void run();

    return () => {
      active = false;
      controller.abort();
      if (controllerRef.current === controller) controllerRef.current = null;
    };
    // `interpret` is intentionally NOT in the dep list — we read it
    // through interpretRef so the effect doesn't restart on every
    // render. Same for the completion callbacks. `reduced` IS a dep so
    // toggling motion re-runs (settles instantly when turned off,
    // re-animates when turned on).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    steps,
    shouldPlay,
    playbackActive,
    effectiveLoop,
    loopDelay,
    preset,
    trigger,
    manualPlayTick,
    reduced,
  ]);

  return { isPlaying, isComplete, currentIndex, play, stop, restart };
}
