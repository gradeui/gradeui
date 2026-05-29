import * as React from "react";
import { Highlight, type Language, type PrismTheme } from "prism-react-renderer";
import { motion, useInView } from "motion/react";
import { cn } from "@/lib/utils";
import {
  useScriptedDemo,
  sleep,
  DEMO_SPEED_PRESETS,
  BlinkingCursor,
} from "@/lib/demo";

/**
 * Code — syntax-highlighted code surface with diff, line-emphasis, and
 * reveal animation modes. Designed for marketing heroes ("diff hero"),
 * docs blocks, and changelog entries.
 *
 * Engine choice: prism-react-renderer. Sync, ~6kb, render-prop API hands
 * us `tokens` as data. Already in use in Studio's CodeView so the repo
 * has one highlighter, not two. Async highlighters (shiki) would either
 * flash unstyled on hydration or balloon the marketing bundle once you
 * include enough langs to matter. See gradeui/STUDIO.md for the Studio
 * variant.
 *
 * Theme is CSS-variable driven (`--gds-code-*`), so token palette
 * inverts with the theme without us re-rendering a different prism
 * theme. The prism `theme` prop just hands each token type a
 * `color: var(--gds-code-<thing>)` so the cascade does the work.
 *
 * Animation strategy: motion (already a dep). `reveal="lines"` staggers
 * each line in; `typewriter` reveals tokens one-at-a-time per line;
 * `diff` plays the removed → added swap. The `trigger` prop selects
 * what kicks it off — `inView` is the common case for scroll-driven
 * marketing surfaces; `mount` fires immediately; `manual` reads `play`.
 */

// ─── Types ───────────────────────────────────────────────────────────

export type CodeLanguage = Language;
export type CodeReveal = "none" | "lines" | "typewriter" | "diff";
export type CodeTrigger = "mount" | "inView" | "manual";
export type CodeSpeed = "slow" | "normal" | "fast";
export type CodeSize = "xs" | "sm" | "md";

const SIZE_CLASS: Record<CodeSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
};

/**
 * Step shape for scripted terminal / CLI sessions. Lives on `<Code>`
 * itself rather than a sibling `CodeSequence` so the theme bridge,
 * prompt prop, cursor, surface tokens, and prism highlighter aren't
 * duplicated. When `steps` is provided, it overrides `source` + `reveal`
 * and runs the machine below internally.
 *
 *   - `type`   — types text into the buffer as if a user were typing
 *   - `output` — appends text instantly as command output (no prompt,
 *                no per-char delay, often muted in render)
 *   - `wait`   — pauses for `ms` milliseconds before the next step
 *   - `clear`  — wipes the buffer (terminal `clear`)
 */
export type CodeStep =
  | { type: "type"; text: string; speed?: CodeSpeed }
  | { type: "output"; text: string }
  | { type: "wait"; ms: number }
  | { type: "clear" };

/**
 * Speed presets — pick a feel, not a number. The user wanted "sensible
 * defaults, I don't want to have to think." Speeds collapse to a
 * (per-line, per-token, pre-reveal-delay) triple. Authors that need
 * finer control can still pass explicit `stagger` + `delay`, which
 * override the preset.
 */
const SPEED_PRESETS: Record<
  CodeSpeed,
  { lineStagger: number; tokenStagger: number; preDelay: number; fadeMs: number }
> = {
  // Retuned May 2026: the previous `slow` (90/38/320) only differed
  // from `normal` by ~40%, which the user couldn't feel. Tripling the
  // line stagger + doubling the token stagger makes the three steps
  // unambiguously distinct — slow lands as "I am being shown", normal
  // as "I am being told", fast as "I am being briefed".
  slow:   { lineStagger: 200, tokenStagger: 70, preDelay: 500, fadeMs: 480 },
  normal: { lineStagger: 55,  tokenStagger: 22, preDelay: 200, fadeMs: 280 },
  fast:   { lineStagger: 18,  tokenStagger: 8,  preDelay: 60,  fadeMs: 160 },
};

export interface CodeDiff {
  /** 1-indexed line numbers marked as added (green bg + `+` gutter). */
  added?: number[];
  /** 1-indexed line numbers marked as removed (red bg + `-` gutter). */
  removed?: number[];
}

export interface CodeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * Source code to render. Optional when `steps` is provided — the
   * scripted machine builds its own buffer and ignores `source`. When
   * neither `source` nor `steps` is set, the block renders empty.
   */
  source?: string;
  /** Prism language id — `tsx` handles JSX too. Defaults to `tsx`. */
  language?: CodeLanguage;
  /**
   * 1-indexed lines (or `[start, end]` ranges) to emphasise with the
   * highlight background. Composes with `diff` — diff colours win.
   */
  highlight?: number | number[] | Array<number | [number, number]>;
  /** Diff mode — paints +added / -removed lines and renders a gutter. */
  diff?: CodeDiff;
  /** Reveal animation. Defaults to `none`. */
  reveal?: CodeReveal;
  /** What triggers the reveal. Defaults to `mount`. */
  trigger?: CodeTrigger;
  /** For `trigger="manual"` — set true to play. */
  play?: boolean;
  /**
   * Animation feel — slow / normal (default) / fast. Maps onto sensible
   * stagger + pre-reveal delay values so authors don't have to think.
   * Explicit `stagger` / `delay` override the preset if provided.
   */
  speed?: CodeSpeed;
  /** Delay before the reveal starts (ms). Overrides the `speed` preset. */
  delay?: number;
  /**
   * Per-line stagger for `lines`/`diff`, per-token for `typewriter`
   * (ms). Overrides the `speed` preset.
   */
  stagger?: number;
  /** Show 1-indexed line numbers in a gutter. */
  showLineNumbers?: boolean;
  /** Optional filename / label in the chrome header. */
  filename?: string;
  /** Wrap long lines instead of horizontal scroll. */
  wrap?: boolean;
  /** Hide the surrounding chrome (border, header, padding). */
  bare?: boolean;
  /**
   * String prepended to every line. Use for terminal emulation
   * (`prompt="$ "` for bash, `prompt="> "` for PowerShell, `prompt=">>> "`
   * for Python REPL). Prompt characters render in muted token colour,
   * don't pick up the typewriter stagger (they're chrome, not content),
   * and are aria-hidden so screen readers don't read them.
   */
  prompt?: string;
  /**
   * Show a blinking cursor at the tail of the reveal — implies the
   * "typing" gesture in marketing demos and terminal sessions.
   * Defaults to `true` when `reveal="typewriter"`, `false` otherwise.
   * Pass explicit `true` to keep the cursor up after a `lines` reveal
   * completes, or `false` to hide it on a typewriter run.
   */
  cursor?: boolean;
  /**
   * Scripted terminal session. When provided, takes precedence over
   * `source` + `reveal` — the component runs the step machine,
   * progressively appending characters per step. Pairs naturally with
   * `language="bash"` + `prompt="$ "` + `cursor` (all default-on).
   *
   * Output lines are rendered without a prompt prefix and at a muted
   * token colour so they read as command output rather than input.
   * Use `wait` between commands to let the user catch up.
   *
   * Example:
   *   <Code language="bash" prompt="$ " steps={[
   *     { type: "type", text: "pnpm add @gradeui/ui" },
   *     { type: "wait", ms: 500 },
   *     { type: "output", text: "added 47 packages in 2.3s" },
   *     { type: "type", text: "pnpm gradeui init" },
   *   ]} />
   */
  steps?: CodeStep[];
  /**
   * When `steps` is set: loops the sequence forever after completion
   * (with a 2s pause + clear between cycles). For "always-on" hero
   * demos that need to keep playing.
   */
  loop?: boolean;
  /**
   * Container sizing — `auto` (default) grows with the rendered lines.
   * A number is treated as pixels (`300` → `300px`); a string is passed
   * through as CSS (`"20rem"`, `"50vh"`, `"calc(100vh - 4rem)"`).
   *
   * Overflowing content scrolls. Pair with `wrap` to break long lines
   * instead of horizontal scroll.
   */
  /**
   * Type-scale preset. `xs` (12px) for dense changelog cards and inline
   * code in tables; `sm` (14px, default) for marketing heroes and most
   * docs blocks; `md` (16px) for "this is the focal point" displays
   * like AI-output demos and large screen-capture replacements.
   *
   * Composes with `maxLines` correctly because the container height
   * uses `1lh` which inherits whatever line-height the size class
   * produces — switching size resizes the container automatically.
   */
  size?: CodeSize;
  height?: number | string | "auto";
  /**
   * Cap the visible line count — the container is fixed at exactly
   * `maxLines * 1lh` and additional lines scroll. Use for terminal
   * windows ("show me the last 8 lines"), code-tour cards, and
   * marketing surfaces that need a stable vertical rhythm regardless
   * of how much content is in the snippet.
   *
   * Wins over `height` when both are set.
   */
  maxLines?: number;
}

// ─── Prism theme bridge → CSS variables ──────────────────────────────
//
// Map each prism token type to a `color: var(--gds-code-<role>)`. The
// defaults live in styles/globals.css; consumers can override per-theme
// or per-instance via inline style.

const cssVarTheme: PrismTheme = {
  plain: { color: "var(--gds-code-fg)", backgroundColor: "transparent" },
  styles: [
    { types: ["comment", "prolog", "doctype", "cdata"], style: { color: "var(--gds-code-comment)", fontStyle: "normal" } },
    { types: ["punctuation"], style: { color: "var(--gds-code-punctuation)" } },
    { types: ["property", "constant", "symbol", "deleted"], style: { color: "var(--gds-code-property)" } },
    { types: ["boolean", "number"], style: { color: "var(--gds-code-number)" } },
    { types: ["selector", "attr-name", "string", "char", "builtin", "inserted"], style: { color: "var(--gds-code-string)" } },
    { types: ["operator", "entity", "url"], style: { color: "var(--gds-code-operator)" } },
    { types: ["atrule", "keyword"], style: { color: "var(--gds-code-keyword)" } },
    { types: ["function", "class-name"], style: { color: "var(--gds-code-function)" } },
    { types: ["regex", "important", "variable"], style: { color: "var(--gds-code-variable)" } },
    { types: ["tag"], style: { color: "var(--gds-code-tag)" } },
    { types: ["attr-name"], style: { color: "var(--gds-code-attr-name)" } },
    { types: ["attr-value"], style: { color: "var(--gds-code-attr-value)" } },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────

function normaliseHighlight(input: CodeProps["highlight"]): Set<number> {
  const set = new Set<number>();
  if (input == null) return set;
  const items = Array.isArray(input) ? input : [input];
  for (const item of items) {
    if (typeof item === "number") {
      set.add(item);
    } else if (Array.isArray(item) && item.length === 2) {
      const [start, end] = item;
      for (let i = start; i <= end; i++) set.add(i);
    }
  }
  return set;
}

type LineKind = "default" | "added" | "removed" | "highlight";

function kindForLine(
  lineNumber: number,
  diff: CodeDiff | undefined,
  highlightSet: Set<number>,
): LineKind {
  // Diff wins. Marketing pages want the +/- semantic to read first.
  if (diff?.added?.includes(lineNumber)) return "added";
  if (diff?.removed?.includes(lineNumber)) return "removed";
  if (highlightSet.has(lineNumber)) return "highlight";
  return "default";
}

// ─── Component ───────────────────────────────────────────────────────

const Code = React.forwardRef<HTMLDivElement, CodeProps>(function Code(
  {
    source,
    language = "tsx" as CodeLanguage,
    highlight,
    diff,
    reveal = "none",
    trigger = "mount",
    play,
    speed = "normal",
    delay,
    stagger,
    showLineNumbers = false,
    filename,
    wrap = false,
    bare = false,
    prompt,
    cursor,
    steps,
    loop = false,
    size = "sm",
    height,
    maxLines,
    className,
    style,
    ...rest
  },
  ref,
) {
  const preset = SPEED_PRESETS[speed];
  // Explicit `delay` / `stagger` override the preset — single source of
  // resolved timing flows downstream.
  const resolvedDelay = delay ?? 0;
  const resolvedStagger =
    stagger ?? (reveal === "typewriter" ? preset.tokenStagger : preset.lineStagger);
  // ─── Step machine (terminal / scripted CLI) ──────────────────────
  //
  // When `steps` is provided we ignore `source` + `reveal` and run a
  // typing simulation: each `type` step appends one char per tick at
  // the speed preset's `tokenStagger`, each `output` step appends its
  // text instantly with a muted-token marker line, each `wait` step
  // pauses the timer for `ms`. The buffer (a plain string) becomes the
  // `code` value flowing into prism — so syntax highlighting + prompt
  // + cursor all keep working without duplication.
  //
  // Output lines are tracked separately (a Set of 1-indexed line
  // numbers) and rendered with the comment colour, no prompt.
  const stepsActive = Boolean(steps && steps.length);
  const [stepBuffer, setStepBuffer] = React.useState("");
  const [outputLineSet, setOutputLineSet] = React.useState<Set<number>>(
    () => new Set(),
  );

  // Strip a single trailing newline — prism otherwise emits an empty
  // final line which throws the staggered reveal off by one frame.
  // When the step machine is driving, the buffer it builds is the
  // source of truth instead.
  // `source` is optional now (it's ignored when `steps` is set, and the
  // empty-input case should render a no-op block rather than crash with
  // "Cannot read properties of undefined").
  const sourceForRender = stepsActive ? stepBuffer : (source ?? "");
  const code = React.useMemo(
    () => sourceForRender.replace(/\n$/, ""),
    [sourceForRender],
  );
  const highlightSet = React.useMemo(() => normaliseHighlight(highlight), [highlight]);
  const hasDiff = Boolean(diff?.added?.length || diff?.removed?.length);
  const showGutter = showLineNumbers || hasDiff;

  // Container ref is used both as the forwarded ref AND for `inView`
  // detection — motion's `useInView` needs a real ref to observe.
  const innerRef = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(ref, () => innerRef.current as HTMLDivElement);

  // Track reveal completion so the cursor can hide itself after the
  // last token / line lands. Default true (keeps cursor visible if
  // user passes `cursor` on a static block). The effect below flips
  // it false at the right moment.
  const [revealComplete, setRevealComplete] = React.useState(reveal === "none");

  // `once: true` matches the marketing-hero contract — once the user
  // has seen the reveal, scrolling away and back shouldn't replay it.
  //
  // `amount: 0.55` (was 0.3 pre-tune) means more than half the block
  // must be in view before triggering. At 0.3 the reveal kicked off
  // when only the top edge of long blocks scrolled past the threshold,
  // so the user often saw the animation finish before the block was
  // even fully visible. 0.55 keeps the static state visible long
  // enough that the reveal lands as "look, it's animating now".
  const inView = useInView(innerRef, { once: true, amount: 0.55 });

  // Small intrinsic settle delay on inView triggers: the block first
  // renders static at full opacity for a beat, THEN the per-line stagger
  // starts. Without this, the reveal happens the moment the threshold
  // flips and there's no anchor moment for the eye. Value comes from
  // the speed preset's `preDelay`.
  const intrinsicDelay = trigger === "inView" ? preset.preDelay : 0;

  const shouldPlay =
    trigger === "mount" ? true : trigger === "inView" ? inView : Boolean(play);

  // Resolved per-line stagger. Declared up here so totalRevealMs below
  // can reference it — TypeScript / V8 const declarations follow strict
  // temporal-dead-zone rules, and the steps machine refactor accidentally
  // moved the original `const perLineStagger = …` past its first use.
  // Surfaced as "Cannot access 'perLineStagger' before initialization"
  // whenever any docs page opened the Code tab.
  const perLineStagger = resolvedStagger;

  // Compute total reveal duration so the cursor can disappear when the
  // animation finishes. Per-line for `lines`/`diff`, per-token for
  // `typewriter` (we approximate token count from a whitespace-collapsed
  // count; close enough for cursor-disappear timing).
  const totalLines = code.split("\n").length;
  const tokenEstimate =
    reveal === "typewriter"
      ? code.replace(/\s+/g, " ").split(" ").length
      : totalLines;
  const totalRevealMs =
    intrinsicDelay + resolvedDelay + tokenEstimate * perLineStagger + 280;

  React.useEffect(() => {
    if (stepsActive) {
      // Step machine owns its own completion signal — the effect below
      // flips revealComplete when the steps drain.
      return;
    }
    if (!shouldPlay || reveal === "none") {
      setRevealComplete(reveal === "none");
      return;
    }
    setRevealComplete(false);
    const t = window.setTimeout(() => setRevealComplete(true), totalRevealMs);
    return () => window.clearTimeout(t);
    // Re-run when the consumer flips trigger / changes content.
  }, [shouldPlay, reveal, totalRevealMs, stepsActive]);

  // ─── Step runner ─────────────────────────────────────────────────
  //
  // Refactored 2026-05-29 onto `useScriptedDemo` from `lib/demo/`.
  // The runner / cancellation / loop logic now lives in the shared
  // hook (same one Composer and DemoStage use); Code only supplies
  // the per-step interpret callback that mutates its own buffer +
  // output-line state. trigger="manual" + `play={shouldPlay}` keeps
  // Code's existing scroll/inView/play-prop semantics intact — the
  // hook just runs the script when Code's outer shouldPlay flips true.
  //
  // The interpret callback uses a buffer ref (not the React state)
  // for sequential reads — otherwise a `type` step's per-char ticks
  // would read stale state and rewrite the same chunk repeatedly.
  // We mirror writes to both the ref (next tick reads it) and React
  // state (rendering picks it up).
  const stepBufferRef = React.useRef("");
  const outputLineSetRef = React.useRef<Set<number>>(new Set());
  const updateBuffer = React.useCallback((next: string) => {
    stepBufferRef.current = next;
    setStepBuffer(next);
  }, []);
  const updateOutputs = React.useCallback((next: Set<number>) => {
    outputLineSetRef.current = next;
    setOutputLineSet(next);
  }, []);

  const { isComplete: stepsComplete } = useScriptedDemo<CodeStep>({
    steps: stepsActive ? steps : undefined,
    speed,
    trigger: "manual",
    play: shouldPlay,
    loop,
    containerRef: innerRef,
    onLoopReset: () => {
      updateBuffer("");
      updateOutputs(new Set());
      setRevealComplete(false);
    },
    interpret: async (step, ctx) => {
      const signal = ctx.signal;
      if (step.type === "wait") return sleep(step.ms, signal);
      if (step.type === "clear") {
        updateBuffer("");
        updateOutputs(new Set());
        return;
      }
      if (step.type === "output") {
        // Output appends instantly. Each new line of the output is
        // marked as an output row (1-indexed, line number in the
        // final buffer including this insert).
        const buffer = stepBufferRef.current;
        const base = buffer.length > 0 && !buffer.endsWith("\n") ? buffer + "\n" : buffer;
        const next = base + step.text;
        const startLine = base.split("\n").length;
        const outputLineCount = step.text.split("\n").length;
        const nextOutputs = new Set(outputLineSetRef.current);
        for (let i = 0; i < outputLineCount; i++) nextOutputs.add(startLine + i);
        updateBuffer(next);
        updateOutputs(nextOutputs);
        // Append a trailing newline so the next type step starts on
        // its own row, matching the pre-refactor behaviour.
        updateBuffer(next + (next.endsWith("\n") ? "" : "\n"));
        // Brief beat after output before the next prompt.
        return sleep(240, signal);
      }
      // type — append one char per tick at the resolved token stagger
      // (or the step's per-step speed override).
      const stepStagger = step.speed
        ? DEMO_SPEED_PRESETS[step.speed].tokenStagger
        : ctx.speed.tokenStagger;
      const buffer = stepBufferRef.current;
      const base = buffer.length > 0 && !buffer.endsWith("\n") ? buffer + "\n" : buffer;
      // Small intra-step settle so the prompt renders before the
      // first key "press" (matches pre-refactor behaviour).
      await sleep(60, signal);
      for (let i = 0; i < step.text.length; i++) {
        if (signal.aborted) return;
        const partial = base + step.text.slice(0, i + 1);
        updateBuffer(partial);
        if (i < step.text.length - 1) await sleep(stepStagger, signal);
      }
    },
  });

  // When the step machine completes, flag revealComplete so the
  // cursor's "show only while in flight" logic fires. The existing
  // non-step reveal-complete effect (above) doesn't touch this when
  // stepsActive.
  React.useEffect(() => {
    if (stepsActive) setRevealComplete(stepsComplete);
  }, [stepsActive, stepsComplete]);

  // Cursor visibility — defaults on for typewriter AND for scripted
  // step sessions (terminal demos always want a caret). Static blocks
  // get no cursor unless the consumer opts in.
  const showCursor = cursor ?? (reveal === "typewriter" || stepsActive);

  return (
    <div
      ref={innerRef}
      data-gds-part="code"
      data-gds-reveal={reveal}
      data-gds-trigger={trigger}
      data-gds-size={size}
      className={cn(
        "gds-code relative w-full overflow-hidden",
        SIZE_CLASS[size],
        !bare && [
          "rounded-lg border bg-[var(--gds-code-bg)] text-[var(--gds-code-fg)]",
          "border-border/60",
        ],
        className,
      )}
      style={style}
      {...rest}
    >
      {filename && !bare ? (
        <div
          data-gds-part="code-header"
          className="flex items-center justify-between border-b border-border/60 px-4 py-2 text-xs text-muted-foreground"
        >
          <span className="font-mono">{filename}</span>
          {language ? (
            <span className="uppercase tracking-wider opacity-60">{language}</span>
          ) : null}
        </div>
      ) : null}

      <Highlight code={code} language={language} theme={cssVarTheme}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre
            data-gds-part="code-pre"
            className={cn(
              "font-mono leading-relaxed",
              bare ? "p-0" : "px-0 py-3",
              wrap ? "whitespace-pre-wrap break-words" : "overflow-x-auto whitespace-pre",
              // When a fixed height / maxLines is set the pre needs
              // vertical scroll too — otherwise overflowing lines just
              // get clipped invisibly.
              (height !== undefined || maxLines !== undefined) && "overflow-y-auto",
            )}
            style={{
              background: "transparent",
              margin: 0,
              // maxLines wins over height. `1lh` is the line-height of
              // the current font — supported in all evergreen browsers.
              // Add a small allowance for vertical padding so the last
              // line isn't clipped by the bare-mode `p-0`.
              ...(maxLines !== undefined
                ? { height: `calc(${maxLines} * 1lh + 0.5rem)` }
                : height !== undefined && height !== "auto"
                  ? {
                      height:
                        typeof height === "number" ? `${height}px` : height,
                    }
                  : null),
            }}
          >
            {tokens.map((line, lineIndex) => {
              const lineNumber = lineIndex + 1;
              const kind = kindForLine(lineNumber, diff, highlightSet);
              const lineProps = getLineProps({ line });
              const isLastLine = lineIndex === tokens.length - 1;
              const isOutputLine = stepsActive && outputLineSet.has(lineNumber);
              // Cursor renders only on the last visible line, and only
              // while the reveal is in flight (or always, if the
              // consumer opted in via `cursor={true}` on a static
              // block).
              const renderCursorHere =
                showCursor && isLastLine && (!revealComplete || cursor === true);

              const baseLineClass = cn(
                "flex w-full pr-4",
                bare ? "pl-0" : "pl-4",
                kind === "added" &&
                  "bg-[var(--gds-code-diff-added-bg)] text-[var(--gds-code-diff-added-fg)]",
                kind === "removed" &&
                  "bg-[var(--gds-code-diff-removed-bg)] text-[var(--gds-code-diff-removed-fg)]",
                kind === "highlight" &&
                  "bg-[var(--gds-code-line-highlight-bg)] shadow-[inset_2px_0_0_0_var(--gds-code-line-highlight-marker)]",
              );

              const lineContent = (
                <>
                  {showGutter ? (
                    <span
                      data-gds-part="code-gutter"
                      className={cn(
                        "select-none pr-3 text-right font-mono text-xs leading-relaxed opacity-60",
                        hasDiff ? "w-10" : "w-8",
                      )}
                      aria-hidden
                    >
                      {hasDiff ? (
                        <span className="inline-block w-3 text-center">
                          {kind === "added" ? "+" : kind === "removed" ? "-" : " "}
                        </span>
                      ) : null}
                      {showLineNumbers ? (
                        <span className="ml-1 tabular-nums">{lineNumber}</span>
                      ) : null}
                    </span>
                  ) : null}

                  <span
                    className="flex-1"
                    // Output lines (step machine) render in the muted
                    // comment colour so command output reads visually
                    // distinct from prompted input.
                    style={isOutputLine ? { color: "var(--gds-code-comment)" } : undefined}
                  >
                    {prompt && !isOutputLine ? (
                      // Prompt chars render as chrome — muted token
                      // colour, never animated, hidden from screen
                      // readers so they don't read `$ $ $` on a five-
                      // line bash session. Output lines suppress the
                      // prompt (they're not commands the user typed).
                      <span
                        data-gds-part="code-prompt"
                        aria-hidden
                        className="select-none opacity-60"
                        style={{ color: "var(--gds-code-comment)" }}
                      >
                        {prompt}
                      </span>
                    ) : null}
                    {reveal === "typewriter" && shouldPlay && !stepsActive ? (
                      <TypewriterLine
                        line={line}
                        getTokenProps={getTokenProps}
                        delay={intrinsicDelay + resolvedDelay + lineIndex * perLineStagger}
                        stagger={perLineStagger}
                      />
                    ) : (
                      line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))
                    )}
                    {renderCursorHere && !isOutputLine ? (
                      <BlinkingCursor data-gds-part="code-cursor" />
                    ) : null}
                  </span>
                </>
              );

              // `reveal="none"` (or `typewriter` — handled at the line
              // level) renders a plain row; `lines`/`diff` wrap each
              // row in motion.div for the staggered entry.
              if (
                reveal === "none" ||
                reveal === "typewriter" ||
                stepsActive ||
                !shouldPlay
              ) {
                return (
                  <div
                    key={lineIndex}
                    {...lineProps}
                    className={cn(lineProps.className, baseLineClass)}
                    // For inView trigger, keep lines hidden until the
                    // observer flips. Without this they pop in at 0
                    // opacity → 1 with a perceptible flash.
                    style={{
                      ...lineProps.style,
                      opacity:
                        trigger !== "mount" && !shouldPlay && reveal !== "none"
                          ? 0
                          : undefined,
                    }}
                  >
                    {lineContent}
                  </div>
                );
              }

              return (
                <motion.div
                  key={lineIndex}
                  {...lineProps}
                  className={cn(lineProps.className, baseLineClass)}
                  initial={{
                    opacity: 0,
                    y: reveal === "diff" ? (kind === "removed" ? -4 : 6) : 4,
                  }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: (intrinsicDelay + resolvedDelay + lineIndex * perLineStagger) / 1000,
                    // Per-line fade duration scales with the speed
                    // preset (slow = 480ms, normal = 280, fast = 160).
                    // Without this the line stagger could push 200ms
                    // apart while each line still resolved in 280ms —
                    // they bunched up because the tail of line N was
                    // still fading in when line N+1 started.
                    duration: preset.fadeMs / 1000,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={lineProps.style}
                >
                  {lineContent}
                </motion.div>
              );
            })}
          </pre>
        )}
      </Highlight>
    </div>
  );
});

Code.displayName = "Code";

// ─── Typewriter renderer ─────────────────────────────────────────────
//
// Walks the prism token stream for a single line and reveals tokens one
// at a time. Whitespace-only tokens come through "free" (no animation
// delay) so leading indentation doesn't feel like dead time. Animation
// is per-token rather than per-character — keeps the DOM count sane on
// long blocks and still reads as a typewriter at sensible cadences.

interface TypewriterLineProps {
  line: Array<{ types: string[]; content: string; empty?: boolean }>;
  getTokenProps: (args: { token: { types: string[]; content: string; empty?: boolean } }) => Record<string, unknown>;
  delay: number;
  stagger: number;
}

function TypewriterLine({ line, getTokenProps, delay, stagger }: TypewriterLineProps) {
  // Count the substantive tokens — whitespace doesn't get its own
  // animation slot. Otherwise indented blocks (2-4 spaces of leading
  // whitespace per line) double the perceived duration of the reveal.
  let tokenSlot = 0;
  return (
    <>
      {line.map((token, key) => {
        const isWhitespace = /^\s*$/.test(token.content);
        const props = getTokenProps({ token });
        if (isWhitespace) {
          return <span key={key} {...props} />;
        }
        const slot = tokenSlot++;
        return (
          <motion.span
            key={key}
            {...props}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: (delay + slot * stagger) / 1000,
              duration: 0.12,
            }}
          />
        );
      })}
    </>
  );
}

export { Code };
