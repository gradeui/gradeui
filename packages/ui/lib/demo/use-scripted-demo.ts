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
 * Authoring guide for `interpret`:
 *   - `await sleep(ms, ctx.signal)` for any pause so stop() can short
 *     a long wait cleanly.
 *   - `await typeText(text, onTick, stagger, ctx.signal)` for typing
 *     loops, again so stop() interrupts mid-character.
 *   - Read `ctx.speed` to grab the resolved DEMO_SPEED_PRESETS entry
 *     when a step doesn't pin its own cadence.
 *   - Throw nothing on cancel — the helpers do it for you. Anything
 *     else thrown is treated as a real bug and bubbles to the console.
 */

export interface ScriptedDemoContext {
  /** Resolved speed preset for the current run. */
  speed: (typeof DEMO_SPEED_PRESETS)[DemoSpeed];
  /** AbortSignal that fires on stop() / unmount / steps change. */
  signal: AbortSignal;
  /** Live cancellation check for code paths that can't take a signal. */
  cancelled: () => boolean;
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
    containerRef,
    onComplete,
    onLoopReset,
  } = opts;

  const preset = DEMO_SPEED_PRESETS[speed];

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
    if (!steps || steps.length === 0 || !shouldPlay) return;

    const controller = new AbortController();
    controllerRef.current = controller;
    const { signal } = controller;
    const cancelled = () => signal.aborted;

    const ctx: ScriptedDemoContext = { speed: preset, signal, cancelled };

    let active = true;

    const run = async () => {
      do {
        setIsPlaying(true);
        setIsComplete(false);
        setCurrentIndex(-1);

        try {
          // Initial pre-delay so the static state is visible for a
          // beat before the first step fires. Mostly matters for
          // `trigger="inView"` (the eye needs an anchor) but it's
          // cheap to apply universally.
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

          if (!loop) {
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
      } while (active && loop && !signal.aborted);
    };

    void run();

    return () => {
      active = false;
      controller.abort();
      if (controllerRef.current === controller) controllerRef.current = null;
    };
    // `interpret` is intentionally NOT in the dep list — we read it
    // through interpretRef so the effect doesn't restart on every
    // render. Same for the completion callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, shouldPlay, loop, loopDelay, preset, trigger, manualPlayTick]);

  return { isPlaying, isComplete, currentIndex, play, stop, restart };
}
