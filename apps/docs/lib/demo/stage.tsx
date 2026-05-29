"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  type DemoSpeed,
  type DemoTrigger,
} from "./types";
import { sleep } from "./sleep";
import { useScriptedDemo } from "./use-scripted-demo";

/**
 * DemoStage + Reveal — staged appearance for whole-interface demos.
 *
 * Drop `<Reveal id="hero">…</Reveal>` around any subtree that should
 * appear on cue. Wrap a region in `<DemoStage steps={…}>` and the
 * script drives which targets become visible, in what order, with
 * what cadence. Same speed / trigger / loop / play semantics as
 * `<Code>` and `<Composer>`.
 *
 * Why a context-based pattern instead of one-component-per-region:
 *   - Authoring stays declarative — the script reads as a storyboard,
 *     not as a stack of imperative ref calls.
 *   - Reveals can live deep in a subtree without prop-drilling.
 *   - The same `<Reveal>` works whether or not a parent stage exists
 *     (it just renders visible if there's no context, so the same
 *     markup ships to production without the demo wrapper).
 *
 * Reduced motion: if the user has `prefers-reduced-motion`, every
 * Reveal renders immediately at its destination state — the stage's
 * script still walks, but the visual transitions are no-ops.
 */

export type RevealStep =
  | { type: "reveal"; target: string }
  | { type: "reveal-all" }
  | { type: "hide"; target: string }
  | { type: "wait"; ms: number }
  | { type: "reset" };

interface StageContextValue {
  /** Set of currently-visible reveal target ids. */
  visible: Set<string>;
  /** True when there's a stage above us (vs. naked Reveal rendering). */
  hasStage: boolean;
  /** Stage-level reduced-motion flag passed down to Reveals. */
  reducedMotion: boolean;
  /**
   * Default enter animation if a Reveal doesn't specify its own.
   * Stages can theme an entire region's reveal style at once.
   */
  defaultAnimation: RevealAnimation;
}

const StageContext = React.createContext<StageContextValue>({
  visible: new Set(),
  hasStage: false,
  reducedMotion: false,
  defaultAnimation: "fade-up",
});

export type RevealAnimation =
  | "fade"
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "scale"
  | "none";

export interface DemoStageProps {
  /** Steps that drive which Reveals are visible at what time. */
  steps?: RevealStep[];
  /** Speed preset. Same vocabulary as Code / Composer. */
  speed?: DemoSpeed;
  /** When the stage starts running. Defaults to `mount`. */
  trigger?: DemoTrigger;
  /** For trigger="manual" — flip true to play. */
  play?: boolean;
  /** Loop the script forever. */
  loop?: boolean;
  /** Default enter animation for child Reveals that don't override. */
  defaultAnimation?: RevealAnimation;
  /**
   * Render content visible by default (every target shown) when the
   * stage has no steps. Useful for sharing the same JSX between live
   * production use and demo playback.
   */
  visibleWhenIdle?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function DemoStage({
  steps,
  speed = "normal",
  trigger = "mount",
  play,
  loop = false,
  defaultAnimation = "fade-up",
  visibleWhenIdle = true,
  className,
  children,
}: DemoStageProps) {
  const reduced = useReducedMotion() ?? false;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState<Set<string>>(
    () => new Set(),
  );

  // If there are no steps, just render everything visible immediately
  // (when `visibleWhenIdle` is true) so the same markup is shippable.
  const hasSteps = Boolean(steps && steps.length);

  useScriptedDemo<RevealStep>({
    steps: hasSteps ? steps : undefined,
    speed,
    trigger,
    play,
    loop,
    containerRef,
    onLoopReset: () => setVisible(new Set()),
    interpret: async (step, ctx) => {
      if (step.type === "wait") {
        return sleep(step.ms, ctx.signal);
      }
      if (step.type === "reset") {
        setVisible(new Set());
        return sleep(ctx.speed.preDelay, ctx.signal);
      }
      if (step.type === "reveal") {
        setVisible((prev) => {
          if (prev.has(step.target)) return prev;
          const next = new Set(prev);
          next.add(step.target);
          return next;
        });
        // Default cadence between reveals lines up with the typing
        // tokenStagger so a fast stage feels fast and a slow one slow.
        return sleep(ctx.speed.lineStagger, ctx.signal);
      }
      if (step.type === "reveal-all") {
        // Defer; child Reveals read the wildcard from context flag.
        // Simpler to just mark a sentinel and let useMemo in the
        // provider expand it.
        setVisible((prev) => {
          const next = new Set(prev);
          next.add("__all__");
          return next;
        });
        return sleep(ctx.speed.lineStagger, ctx.signal);
      }
      if (step.type === "hide") {
        setVisible((prev) => {
          if (!prev.has(step.target)) return prev;
          const next = new Set(prev);
          next.delete(step.target);
          return next;
        });
        return sleep(ctx.speed.fadeMs, ctx.signal);
      }
    },
  });

  const value = React.useMemo<StageContextValue>(
    () => ({
      visible: hasSteps ? visible : new Set(["__all__"]),
      hasStage: true,
      reducedMotion: reduced,
      defaultAnimation,
    }),
    [hasSteps, visible, reduced, defaultAnimation],
  );

  // When there are no steps and visibleWhenIdle is false, render an
  // empty visible set so children stay hidden. Power-users only.
  const finalValue = !hasSteps && !visibleWhenIdle
    ? { ...value, visible: new Set<string>() }
    : value;

  return (
    <div
      ref={containerRef}
      data-gds-part="demo-stage"
      data-gds-stage-playing={hasSteps ? "true" : "false"}
      className={className}
    >
      <StageContext.Provider value={finalValue}>
        {children}
      </StageContext.Provider>
    </div>
  );
}

// ─── Reveal ──────────────────────────────────────────────────────────

const ANIMATION_VARIANTS: Record<
  RevealAnimation,
  { initial: Record<string, number>; animate: Record<string, number> }
> = {
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 } },
  "fade-up": { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } },
  "fade-down": { initial: { opacity: 0, y: -12 }, animate: { opacity: 1, y: 0 } },
  "fade-left": { initial: { opacity: 0, x: 12 }, animate: { opacity: 1, x: 0 } },
  "fade-right": { initial: { opacity: 0, x: -12 }, animate: { opacity: 1, x: 0 } },
  scale: { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 } },
  none: { initial: { opacity: 1 }, animate: { opacity: 1 } },
};

export interface RevealProps {
  /** Stage target id. The matching `{ type: "reveal", target: id }` step shows this. */
  id: string;
  /** Enter animation. Falls back to the parent stage's `defaultAnimation`. */
  animation?: RevealAnimation;
  /** Override transition duration (ms). Defaults to the stage speed's fadeMs. */
  durationMs?: number;
  /**
   * When true and there's no parent DemoStage, render hidden anyway.
   * Default false — naked usage renders visible so production markup
   * matches demo markup.
   */
  hideOutsideStage?: boolean;
  /**
   * Fires when this Reveal transitions from hidden to visible. Use to
   * kick off a nested scripted demo (Composer.restart(), Code.play(),
   * etc) at the moment the user actually sees the surface. Without
   * this hook, nested demos with `trigger="mount"` would run while
   * still hidden and the user would miss the animation entirely.
   */
  onReveal?: () => void;
  /**
   * Fires when this Reveal transitions from visible to hidden (e.g.
   * because the stage script ran a `hide` step or looped via `reset`).
   * Use to pause/reset nested state.
   */
  onHide?: () => void;
  className?: string;
  children: React.ReactNode;
}

export function Reveal({
  id,
  animation,
  durationMs,
  hideOutsideStage = false,
  onReveal,
  onHide,
  className,
  children,
}: RevealProps) {
  const stage = React.useContext(StageContext);
  const isVisible = !stage.hasStage
    ? !hideOutsideStage
    : stage.visible.has("__all__") || stage.visible.has(id);

  // Fire onReveal / onHide on the visibility transition. Tracked via
  // a ref so we don't fire on first paint when isVisible matches the
  // initial state.
  const prevVisibleRef = React.useRef(isVisible);
  const onRevealRef = React.useRef(onReveal);
  const onHideRef = React.useRef(onHide);
  onRevealRef.current = onReveal;
  onHideRef.current = onHide;
  React.useEffect(() => {
    if (isVisible === prevVisibleRef.current) return;
    prevVisibleRef.current = isVisible;
    if (isVisible) onRevealRef.current?.();
    else onHideRef.current?.();
  }, [isVisible]);

  const anim = animation ?? stage.defaultAnimation;
  const variant = ANIMATION_VARIANTS[anim];
  const duration = (durationMs ?? 280) / 1000;

  // Reduced motion: skip the transform / opacity dance, just snap to
  // the destination state. Stage flag wins so a single tester preference
  // applies everywhere.
  if (stage.reducedMotion) {
    return (
      <div
        data-gds-part="reveal"
        data-gds-reveal-id={id}
        data-gds-revealed={isVisible ? "true" : "false"}
        className={className}
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      data-gds-part="reveal"
      data-gds-reveal-id={id}
      data-gds-revealed={isVisible ? "true" : "false"}
      className={className}
      initial={variant.initial}
      animate={isVisible ? variant.animate : variant.initial}
      transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
