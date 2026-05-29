---
name: Code
import: "@gradeui/ui"
variants: []
props:
  - source: string — the code to render
  - language? (tsx | jsx | ts | js | html | css | json | bash | md | py | go | rust) — Prism language id; defaults to `tsx`
  - highlight? — 1-indexed line number, array of numbers, or array of `[start, end]` ranges to emphasise
  - diff? — `{ added?: number[]; removed?: number[] }` — 1-indexed lines for diff hero / changelog mode
  - reveal? (none | lines | typewriter | diff) — entrance animation; defaults to `none`
  - trigger? (mount | inView | manual) — what kicks the reveal off; defaults to `mount`
  - play?: boolean — for `trigger="manual"`, set true to play
  - speed? (slow | normal | fast) — animation feel preset. `normal` (default) maps to the canonical 50ms/22ms staggers + 180ms pre-delay. Pick a feel; don't tune individual numbers unless you have to.
  - delay?: number — explicit delay before reveal starts (ms) — overrides the `speed` preset
  - stagger?: number — explicit per-line stagger for `lines`/`diff`, per-token for `typewriter` (ms) — overrides the `speed` preset
  - prompt?: string — string prepended to each line. Use for terminal emulation: `prompt="$ "` for bash, `prompt="> "` for PowerShell, `prompt=">>> "` for Python REPL. Prompt characters render in muted token colour, don't pick up the typewriter stagger, and are hidden from screen readers.
  - showLineNumbers?: boolean
  - filename?: string — optional label rendered in the header chrome
  - wrap?: boolean — wrap long lines instead of horizontal scroll
  - bare?: boolean — drop chrome (border, header, padding) — for inline use
  - size? (xs | sm | md) — type-scale preset. `xs` (12px) for dense changelog cards / inline blocks; `sm` (14px, default) for marketing heroes and docs; `md` (16px) for focal-point displays.
  - height? (auto | number | string) — container sizing. `auto` (default) grows with content. Number = pixels (`300` → `300px`). String passes through as CSS (`"20rem"`, `"50vh"`).
  - maxLines?: number — cap the visible line count at exactly N line-heights. Wins over `height`. Inherits the current size's line-height automatically.
when_to_use: Read-only code surface for marketing heroes, docs, changelog entries, AI-output displays. Use `diff` for the "diff hero" pattern (before/after side-by-side or stacked). Use `reveal="lines"` with `trigger="inView"` for scroll-driven marketing pages. Use `reveal="typewriter"` for AI-output / chat-style displays. Use `bare` for inline code inside prose. NOT a code editor — for editable code, reach for an external editor primitive (CodeMirror / Monaco).
composes_with: [SectionBlock, Card, Tabs (for multi-file examples), Carousel (slide-to-slide code progression)]
aliases: [code block, code, code snippet, code surface, syntax highlighted code, diff hero, diff view, diff block, changelog code, before after code, scroll-triggered code, typewriter code]
---

Token palette is driven by `--gds-code-*` CSS variables in `styles/globals.css`. The component itself is presentation-agnostic: prism renders tokens, the variables colour them, motion handles the reveal. Override per-instance via inline `style` to retune one block without touching the theme.

The engine is `prism-react-renderer` (already used by Studio's CodeView). Sync, ~6kb, render-prop API — no async hydration flash, no bundle bloat from lang files.

```jsx
// Plain block.
<Code language="tsx" source={`function greet(name) {
  return \`Hello, \${name}\`;
}`} />
```

```jsx
// Line highlight — emphasis lines accept a number, an array, or
// [start, end] ranges. Composes cleanly with diff (diff colours win).
<Code
  language="tsx"
  highlight={[2, [4, 6]]}
  source={`<Button>Save</Button>
<Button variant="raised">Ship it</Button>
<Button variant="raised" style={{ "--btn-glow": "var(--warning)" }}>
  Iterate
</Button>`}
/>
```

```jsx
// Diff hero — the marketing "before / after" pattern. Added lines get
// the success-tinted bg + `+` gutter; removed lines get destructive-
// tinted bg + `-` gutter. `showLineNumbers` is opt-in.
<Code
  language="tsx"
  filename="button.tsx"
  diff={{ removed: [1], added: [2, 3, 4] }}
  source={`<button className="px-4 py-2 rounded-md bg-blue-600 text-white shadow-md">
<Button variant="raised">
  Ship it
</Button>`}
/>
```

```jsx
// Scroll-triggered reveal — marketing hero. The block waits until the
// reader scrolls it into view, then staggers each line in. `once: true`
// is baked in: the reveal doesn't replay when the user scrolls away
// and back.
<Code
  language="tsx"
  reveal="lines"
  trigger="inView"
  stagger={50}
  source={`<AppShell nav="three-pane">
  <AppShellHeader>...</AppShellHeader>
  <AppShellNav>...</AppShellNav>
  <AppShellAside>...</AppShellAside>
  <AppShellMain>...</AppShellMain>
</AppShell>`}
/>
```

```jsx
// Typewriter — token-by-token reveal. Good for AI-output displays
// and "watch it generate" demos. Whitespace tokens are free (no
// delay) so leading indent doesn't feel like dead time. `speed`
// keeps it ergonomic — pick "slow" / "normal" / "fast" instead of
// tuning stagger by hand.
<Code
  language="tsx"
  reveal="typewriter"
  trigger="inView"
  speed="normal"
  source={`const theme = await ai.generate({
  brand: "Acme",
  mood: "calm",
});`}
/>
```

```jsx
// Terminal emulation — `prompt` prepends a static prompt string to
// each line. Combine with `reveal="typewriter"` for a scripted CLI
// session feel. Prompt chars are chrome (muted, aria-hidden, no
// animation), so the typewriter only stages the actual command.
<Code
  language="bash"
  prompt="$ "
  reveal="typewriter"
  trigger="inView"
  speed="slow"
  source={`pnpm add @gradeui/ui
pnpm gradeui init
pnpm dev`}
/>
```

### Anti-patterns

DO NOT use `<Code>` as a code editor. It's read-only by design — the prism renderer doesn't take input. For editable code, compose your own surface around CodeMirror or Monaco.

DO NOT reach for a separate library to render code elsewhere in the app — Studio's CodeView, docs blocks, and marketing heroes should all share this primitive so the token palette stays single-source.

DO NOT pass `highlight` AND `diff` for the same line — diff wins, and the highlight emphasis is silently dropped. Use one signal per line.

DO NOT use `reveal="typewriter"` for long blocks (50+ lines). It works but feels laboured; use `reveal="lines"` instead.

DO NOT override the prism `theme` prop — the component intentionally hides it. Restyle via the `--gds-code-*` CSS variables so every Code block in the app shifts together with the active theme.
