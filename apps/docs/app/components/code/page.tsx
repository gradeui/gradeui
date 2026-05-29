"use client";
import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { InstallBlock } from "@/components/install-block";

import { Code } from "@/components/ui/code";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

const codeProps = [
  {
    name: "source",
    type: "string",
    default: "-",
    description: "The code to render.",
  },
  {
    name: "language",
    type: '"tsx" | "jsx" | "ts" | "js" | "html" | "css" | "json" | "bash" | "md" | …',
    default: '"tsx"',
    description: "Prism language id. `tsx` handles JSX too.",
  },
  {
    name: "highlight",
    type: "number | number[] | Array<number | [number, number]>",
    default: "-",
    description: "1-indexed line(s) or [start, end] ranges to emphasise.",
  },
  {
    name: "diff",
    type: "{ added?: number[]; removed?: number[] }",
    default: "-",
    description: "Diff hero mode — paints +added / -removed lines and renders a gutter.",
  },
  {
    name: "reveal",
    type: '"none" | "lines" | "typewriter" | "diff"',
    default: '"none"',
    description: "Entrance animation.",
  },
  {
    name: "trigger",
    type: '"mount" | "inView" | "manual"',
    default: '"mount"',
    description: "What kicks the reveal off. `inView` uses motion's IntersectionObserver wrapper, fires once.",
  },
  {
    name: "play",
    type: "boolean",
    default: "-",
    description: 'Controls play state when `trigger="manual"`.',
  },
  {
    name: "speed",
    type: '"slow" | "normal" | "fast"',
    default: '"normal"',
    description:
      "Animation feel preset. Maps to sensible stagger + pre-delay values so you don't have to tune individual numbers.",
  },
  {
    name: "delay",
    type: "number (ms)",
    default: "preset",
    description:
      "Explicit delay before reveal starts (ms). Overrides the `speed` preset.",
  },
  {
    name: "stagger",
    type: "number (ms)",
    default: "preset",
    description:
      "Explicit per-line stagger for `lines`/`diff`, per-token for `typewriter` (ms). Overrides the `speed` preset.",
  },
  {
    name: "prompt",
    type: "string",
    default: "-",
    description:
      'String prepended to every line. Use for terminal emulation (`prompt="$ "` for bash, `prompt=">>> "` for Python REPL). Prompt chars render in muted token colour, never animate, aria-hidden.',
  },
  {
    name: "cursor",
    type: "boolean",
    default: "auto",
    description:
      "Blinking caret at the tail of the last line. Defaults to on for `reveal=\"typewriter\"` and `steps`; off otherwise. Disappears when the reveal completes.",
  },
  {
    name: "steps",
    type: "CodeStep[]",
    default: "-",
    description:
      "Scripted terminal session: `type` / `output` / `wait` / `clear`. When set, overrides `source` + `reveal`. Output lines render muted with no prompt.",
  },
  {
    name: "loop",
    type: "boolean",
    default: "false",
    description:
      "When `steps` is set, loop the sequence forever (with a 2s pause + clear between cycles). Always-on hero demos.",
  },
  {
    name: "showLineNumbers",
    type: "boolean",
    default: "false",
    description: "Render a 1-indexed line-number gutter.",
  },
  {
    name: "filename",
    type: "string",
    default: "-",
    description: "Optional label rendered in the chrome header.",
  },
  {
    name: "wrap",
    type: "boolean",
    default: "false",
    description: "Wrap long lines instead of horizontal scroll.",
  },
  {
    name: "bare",
    type: "boolean",
    default: "false",
    description: "Drop chrome (border, header, padding) — for inline use.",
  },
  {
    name: "size",
    type: '"xs" | "sm" | "md"',
    default: '"sm"',
    description:
      "Type-scale preset. xs (12px) for dense changelog cards and inline blocks; sm (14px, default) for marketing heroes and docs; md (16px) for focal-point displays. Composes with maxLines via 1lh.",
  },
  {
    name: "height",
    type: '"auto" | number | string',
    default: '"auto"',
    description:
      'Container sizing. Number = pixels (300 → "300px"). String passes through as CSS ("20rem", "50vh").',
  },
  {
    name: "maxLines",
    type: "number",
    default: "-",
    description:
      "Cap visible line count at exactly N line-heights. Wins over `height`. Inherits the current `size`'s line-height so switching size resizes the container automatically.",
  },
];

const PLAIN = `function greet(name) {
  return \`Hello, \${name}\`;
}`;

const HIGHLIGHT = `<Button>Save</Button>
<Button variant="raised">Ship it</Button>
<Button variant="raised" style={{ "--btn-glow": "var(--warning)" }}>
  Iterate
</Button>`;

const DIFF_BEFORE_AFTER = `<button className="px-4 py-2 rounded-md bg-blue-600 text-white shadow-md">
<Button variant="raised">
  Ship it
</Button>`;

const SCROLL_REVEAL = `<AppShell nav="three-pane">
  <AppShellHeader>...</AppShellHeader>
  <AppShellNav>...</AppShellNav>
  <AppShellAside>...</AppShellAside>
  <AppShellMain>...</AppShellMain>
</AppShell>`;

const TYPEWRITER = `const theme = await ai.generate({
  brand: "Acme",
  mood: "calm",
});`;

const TERMINAL_TYPEWRITER = `pnpm add @gradeui/ui
pnpm gradeui init
pnpm dev`;

const BASH_STEPS = [
  { type: "type" as const, text: "pnpm add @gradeui/ui" },
  { type: "wait" as const, ms: 500 },
  { type: "output" as const, text: "added 47 packages in 2.3s" },
  { type: "wait" as const, ms: 400 },
  { type: "type" as const, text: "pnpm gradeui init" },
  { type: "wait" as const, ms: 500 },
  { type: "output" as const, text: "✓ Tokens written\n✓ Theme applied" },
];

const LOOPING_DEMO = [
  { type: "type" as const, text: "grep -r 'TODO' .", speed: "fast" as const },
  { type: "wait" as const, ms: 500 },
  { type: "output" as const, text: "src/auth.ts:42: // TODO: refresh tokens" },
  { type: "wait" as const, ms: 1000 },
  { type: "clear" as const },
];

export default function CodePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Code</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Syntax-highlighted code surface for marketing heroes, docs, changelog entries, and AI-output displays.
        </p>
        <p className="text-sm text-muted-foreground mt-3 max-w-3xl">
          Built on <code className="font-mono">prism-react-renderer</code> (shared with Studio&rsquo;s
          CodeView so the repo runs one highlighter). Token palette is driven by{" "}
          <code className="font-mono">--gds-code-*</code> CSS variables, so the colours invert with
          the active theme without swapping prism themes at runtime. Animation uses{" "}
          <code className="font-mono">motion</code>, already in the stack for selection rings + panel
          reveals.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <InstallBlock>{`import { Code } from "@gradeui/ui"`}</InstallBlock>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <ComponentPreview
          code={`<Code
  language="tsx"
  source={\`function greet(name) {
  return \\\`Hello, \\\${name}\\\`;
}\`}
/>`}
        >
          <Code language="tsx" source={PLAIN} className="w-full max-w-2xl" />
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">Line highlight</h3>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Pass a line number, an array, or <code className="font-mono">[start, end]</code> ranges. Emphasis lines pick up a
          tinted background and a left marker keyed to <code className="font-mono">--selected-glow</code>.
        </p>
        <ComponentPreview
          code={`<Code
  language="tsx"
  highlight={[2, [4, 6]]}
  source={...}
/>`}
        >
          <Code
            language="tsx"
            highlight={[2, [4, 6]]}
            source={HIGHLIGHT}
            className="w-full max-w-2xl"
          />
        </ComponentPreview>

        <h3 className="text-lg font-medium">Diff hero</h3>
        <p className="text-sm text-muted-foreground max-w-3xl">
          The &ldquo;before / after&rdquo; marketing pattern. Added lines pick up the success-tinted bg + <code className="font-mono">+</code> gutter; removed lines pick
          up the destructive-tinted bg + <code className="font-mono">-</code> gutter. <code className="font-mono">filename</code> renders the chrome header.
        </p>
        <ComponentPreview
          code={`<Code
  language="tsx"
  filename="button.tsx"
  diff={{ removed: [1], added: [2, 3, 4] }}
  source={...}
/>`}
        >
          <Code
            language="tsx"
            filename="button.tsx"
            diff={{ removed: [1], added: [2, 3, 4] }}
            source={DIFF_BEFORE_AFTER}
            className="w-full max-w-2xl"
          />
        </ComponentPreview>

        <h3 className="text-lg font-medium">Scroll-triggered reveal</h3>
        <p className="text-sm text-muted-foreground max-w-3xl">
          With <code className="font-mono">trigger=&quot;inView&quot;</code> the block waits until the reader scrolls it into view, then staggers each line in.
          The reveal plays once: scrolling away and back doesn&rsquo;t replay it.
        </p>
        <ComponentPreview
          code={`<Code
  language="tsx"
  reveal="lines"
  trigger="inView"
  stagger={50}
  source={...}
/>`}
        >
          <Code
            language="tsx"
            reveal="lines"
            trigger="inView"
            stagger={50}
            maxLines={8}
            source={SCROLL_REVEAL}
            className="w-full max-w-2xl"
          />
        </ComponentPreview>

        <h3 className="text-lg font-medium">Typewriter (with auto cursor)</h3>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Token-by-token reveal with a blinking caret at the tail. Whitespace is free (no delay) so leading indent doesn&rsquo;t feel like dead time. Good for AI-output displays and &ldquo;watch it generate&rdquo; demos. Keep blocks short — for 50+ lines, use <code className="font-mono">reveal=&quot;lines&quot;</code>.
        </p>
        <ComponentPreview
          code={`<Code
  language="tsx"
  reveal="typewriter"
  trigger="inView"
  source={...}
/>`}
        >
          <Code
            language="tsx"
            reveal="typewriter"
            trigger="inView"
            maxLines={5}
            source={TYPEWRITER}
            className="w-full max-w-2xl"
          />
        </ComponentPreview>

        <h3 className="text-lg font-medium">Speed presets</h3>
        <p className="text-sm text-muted-foreground max-w-3xl">
          <code className="font-mono">speed=&quot;slow&quot;</code> /{" "}
          <code className="font-mono">&quot;normal&quot;</code> /{" "}
          <code className="font-mono">&quot;fast&quot;</code> map to sensible per-line stagger + pre-reveal delay triples. Pick a feel, not a number. Explicit <code className="font-mono">delay</code> / <code className="font-mono">stagger</code> props still override when you need them.
        </p>
        <ComponentPreview
          code={`<Code language="tsx" reveal="lines" trigger="inView" speed="slow" source={...} />`}
        >
          <div className="w-full max-w-2xl space-y-4">
            <Code language="tsx" reveal="lines" trigger="inView" speed="slow" maxLines={8} source={SCROLL_REVEAL} filename="speed=slow" />
            <Code language="tsx" reveal="lines" trigger="inView" speed="normal" maxLines={8} source={SCROLL_REVEAL} filename="speed=normal" />
            <Code language="tsx" reveal="lines" trigger="inView" speed="fast" maxLines={8} source={SCROLL_REVEAL} filename="speed=fast" />
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Terminal — prompt + typewriter</h3>
        <p className="text-sm text-muted-foreground max-w-3xl">
          <code className="font-mono">prompt</code> prepends a static string to each line ( <code className="font-mono">&quot;$ &quot;</code> for bash, <code className="font-mono">&quot;&gt; &quot;</code> for PowerShell, <code className="font-mono">&quot;&gt;&gt;&gt; &quot;</code> for Python REPL ). Prompt chars render as chrome — muted colour, no typewriter stagger, aria-hidden so screen readers don&rsquo;t read <code className="font-mono">&quot;$ $ $&quot;</code>.
        </p>
        <ComponentPreview
          code={`<Code
  language="bash"
  prompt="$ "
  reveal="typewriter"
  trigger="inView"
  source={...}
/>`}
        >
          <Code
            language="bash"
            prompt="$ "
            reveal="typewriter"
            trigger="inView"
            maxLines={3}
            source={TERMINAL_TYPEWRITER}
            className="w-full max-w-2xl"
          />
        </ComponentPreview>

        <h3 className="text-lg font-medium">Scripted bash session (steps)</h3>
        <p className="text-sm text-muted-foreground max-w-3xl">
          The <code className="font-mono">steps</code> prop drives a small state machine: <code className="font-mono">type</code> (per-char typing), <code className="font-mono">wait</code> (pause ms), <code className="font-mono">output</code> (instant, muted, no prompt), <code className="font-mono">clear</code> (wipe). Lives on <code className="font-mono">Code</code> itself rather than a separate <code className="font-mono">CodeSequence</code> — same theme, same prompt, same cursor, no duplication.
        </p>
        <ComponentPreview
          code={`<Code
  language="bash"
  prompt="$ "
  trigger="inView"
  steps={[
    { type: "type", text: "pnpm add @gradeui/ui" },
    { type: "wait", ms: 500 },
    { type: "output", text: "added 47 packages in 2.3s" },
    { type: "type", text: "pnpm gradeui init" },
    { type: "output", text: "✓ Tokens written" },
  ]}
/>`}
        >
          <Code
            language="bash"
            prompt="$ "
            trigger="inView"
            maxLines={6}
            steps={BASH_STEPS}
            className="w-full max-w-2xl"
          />
        </ComponentPreview>

        <h3 className="text-lg font-medium">Looping CLI demo</h3>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Add <code className="font-mono">loop</code> + a <code className="font-mono">clear</code> step at the end of the sequence for always-on hero animations. The sequence restarts 2 seconds after the last step completes.
        </p>
        <ComponentPreview
          code={`<Code
  language="bash"
  prompt="$ "
  trigger="inView"
  loop
  steps={[
    { type: "type", text: "grep -r 'TODO' .", speed: "fast" },
    { type: "wait", ms: 500 },
    { type: "output", text: "src/auth.ts:42: // TODO: refresh tokens" },
    { type: "wait", ms: 1000 },
    { type: "clear" },
  ]}
/>`}
        >
          <Code
            language="bash"
            prompt="$ "
            trigger="inView"
            loop
            maxLines={4}
            steps={LOOPING_DEMO}
            className="w-full max-w-2xl"
          />
        </ComponentPreview>

        <h3 className="text-lg font-medium">Sizes</h3>
        <p className="text-sm text-muted-foreground max-w-3xl">
          <code className="font-mono">size=&quot;xs&quot;</code> /{" "}
          <code className="font-mono">&quot;sm&quot;</code> (default) /{" "}
          <code className="font-mono">&quot;md&quot;</code>. The block&rsquo;s line-height tracks the size, so <code className="font-mono">maxLines</code> stays correct across all three.
        </p>
        <ComponentPreview
          code={`<Code language="tsx" size="xs" source={...} />
<Code language="tsx" size="sm" source={...} />
<Code language="tsx" size="md" source={...} />`}
        >
          <div className="w-full max-w-2xl space-y-4">
            <Code language="tsx" size="xs" source={PLAIN} filename="size=xs (12px)" />
            <Code language="tsx" size="sm" source={PLAIN} filename="size=sm (14px, default)" />
            <Code language="tsx" size="md" source={PLAIN} filename="size=md (16px)" />
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Stable height (maxLines)</h3>
        <p className="text-sm text-muted-foreground max-w-3xl">
          <code className="font-mono">maxLines</code> fixes the container at exactly N line-heights so the page never shifts during animated reveals or scripted sessions. Pair with <code className="font-mono">size</code> and the container resizes automatically.
        </p>
        <ComponentPreview
          code={`<Code language="tsx" maxLines={5} source={...} />`}
        >
          <Code
            language="tsx"
            maxLines={5}
            source={SCROLL_REVEAL}
            className="w-full max-w-2xl"
          />
        </ComponentPreview>

        <h3 className="text-lg font-medium">Line numbers + filename</h3>
        <ComponentPreview
          code={`<Code
  language="tsx"
  filename="greet.ts"
  showLineNumbers
  source={...}
/>`}
        >
          <Code
            language="tsx"
            filename="greet.ts"
            showLineNumbers
            source={PLAIN}
            className="w-full max-w-2xl"
          />
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <PropsTable props={codeProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Theming
        </h2>
        <p className="text-muted-foreground max-w-3xl">
          Every token role maps to a <code className="font-mono">--gds-code-*</code> CSS variable. Restyle by overriding
          the variables in your theme, or per-instance via inline <code className="font-mono">style</code>:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground max-w-3xl">
          <li><code className="font-mono">--gds-code-bg</code>, <code className="font-mono">--gds-code-fg</code> — surface + base text</li>
          <li><code className="font-mono">--gds-code-keyword</code>, <code className="font-mono">--gds-code-string</code>, <code className="font-mono">--gds-code-function</code>, <code className="font-mono">--gds-code-comment</code>, <code className="font-mono">--gds-code-number</code> — syntax roles</li>
          <li><code className="font-mono">--gds-code-tag</code>, <code className="font-mono">--gds-code-attr-name</code>, <code className="font-mono">--gds-code-attr-value</code> — JSX / HTML</li>
          <li><code className="font-mono">--gds-code-line-highlight-bg</code>, <code className="font-mono">--gds-code-line-highlight-marker</code> — emphasis</li>
          <li><code className="font-mono">--gds-code-diff-added-bg</code>, <code className="font-mono">--gds-code-diff-added-fg</code>, <code className="font-mono">--gds-code-diff-removed-bg</code>, <code className="font-mono">--gds-code-diff-removed-fg</code> — diff pairs</li>
        </ul>
      </div>

      <SidecarBlock slug="code" />

      <ComponentNav currentHref="/components/code" />
    </div>
  );
}
