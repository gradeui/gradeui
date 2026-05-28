/**
 * @label       Code component showcase
 * @description Comprehensive demo of every <Code> mode — plain, line highlight, diff hero, scroll-triggered reveal, typewriter, speed presets (slow/normal/fast), terminal prompt + cursor, scripted bash steps, looping demos.
 * @tags        code marketing showcase diff hero typewriter scroll reveal syntax highlighting terminal bash steps speed
 * @notes       Each section is a self-contained example: same Code primitive,
 *              different props. Trigger is inView throughout so scrolling
 *              the page plays the reveals one after another (hit the
 *              Replay button in the canvas toolbar to re-run). Keep this
 *              in sync with packages/ui/components/ui/code.md — if a new
 *              prop lands there, surface it here.
 */
import {
  AppShell, AppShellHeader, AppShellMain,
  Toolbar, ToolbarSlot,
  Stack, Row, Grid,
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Button, Badge, Separator, Code,
} from "@gradeui/ui";

// ─── Source samples ─────────────────────────────────────────────────

const PLAIN = `function greet(name) {
  return \`Hello, \${name}\`;
}

greet("world");`;

const HIGHLIGHT = `<Button>Save</Button>
<Button variant="raised">Ship it</Button>
<Button variant="raised" style={{ "--btn-glow": "var(--warning)" }}>
  Iterate
</Button>`;

const DIFF_BEFORE_AFTER = `<button className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Ship it
</button>
<Button variant="raised">
  Ship it
</Button>`;

const SCROLL_REVEAL = `<AppShell nav="three-pane">
  <AppShellHeader>...</AppShellHeader>
  <AppShellNav>
    <Sidebar>...</Sidebar>
  </AppShellNav>
  <AppShellAside>...</AppShellAside>
  <AppShellMain>
    <Stack gap="lg">
      <h1>Dashboard</h1>
      <Grid cols="3" gap="md">...</Grid>
    </Stack>
  </AppShellMain>
</AppShell>`;

const TYPEWRITER = `const theme = await ai.generate({
  brand: "Acme",
  mood: "calm",
  density: "comfortable",
});

await persist(theme);`;

const SPEED_SAMPLE = `<Code
  language="tsx"
  reveal="lines"
  trigger="inView"
  speed="normal"
/>`;

const CHANGELOG = `// v0.10 → v0.11
import { Button } from "@gradeui/ui";

<Button>Save</Button>
<Button variant="raised">Ship it</Button>
<Button variant="raised" data-state="on">
  Locked
</Button>`;

const PYTHON_SAMPLE = `def generate_theme(brand: str, mood: str = "calm"):
    """Return a Grade theme tuned for the brand."""
    palette = palette_for(brand)
    return Theme(
        primary=palette.primary,
        accent=palette.accent,
        mode=mood,
    )

theme = generate_theme("Acme", mood="calm")`;

// ─── Step scripts ──────────────────────────────────────────────────
//
// `output` is rendered in muted colour without a prompt; `wait` pauses
// before the next step; `type` simulates typing one character per tick.

const BASH_STEPS = [
  { type: "type", text: "pnpm add @gradeui/ui" },
  { type: "wait", ms: 600 },
  { type: "output", text: "added 47 packages in 2.3s" },
  { type: "wait", ms: 400 },
  { type: "type", text: "pnpm gradeui init" },
  { type: "wait", ms: 500 },
  { type: "output", text: "✓ Tokens written to gradeui.tokens.css\n✓ Theme applied\n✓ Tailwind preset registered" },
  { type: "wait", ms: 400 },
  { type: "type", text: "pnpm dev" },
];

const LOOPING_DEMO = [
  { type: "type", text: "grep -r 'TODO' .", speed: "fast" },
  { type: "wait", ms: 500 },
  { type: "output", text: "src/auth.ts:42: // TODO: refresh tokens\nsrc/db.ts:18: // TODO: connection pool" },
  { type: "wait", ms: 800 },
  { type: "clear" },
];

const PYTHON_REPL = [
  { type: "type", text: "from gradeui import Theme" },
  { type: "wait", ms: 350 },
  { type: "type", text: "theme = Theme(primary='teal', mood='calm')" },
  { type: "wait", ms: 400 },
  { type: "type", text: "theme.to_css()" },
  { type: "wait", ms: 500 },
  { type: "output", text: "':root { --primary: 0.61 0.17 175; ... }'" },
];

// ─── App ───────────────────────────────────────────────────────────

export default function App() {
  return (
    <AppShell nav="none" className="min-h-screen bg-background">
      <AppShellHeader className="border-b border-border bg-background/80 backdrop-blur">
        <Toolbar size="md" className="max-w-5xl mx-auto px-6">
          <ToolbarSlot slot="leading">
            <Row gap="sm" align="center">
              <div className="h-7 w-7 rounded-md bg-foreground text-background grid place-items-center font-bold text-sm">G</div>
              <span className="font-semibold">Code</span>
              <Badge variant="outline" className="ml-2 text-xs">@gradeui/ui</Badge>
            </Row>
          </ToolbarSlot>
          <ToolbarSlot slot="trailing">
            <Button size="sm" variant="outline">Read the sidecar</Button>
          </ToolbarSlot>
        </Toolbar>
      </AppShellHeader>

      <AppShellMain className="max-w-5xl mx-auto px-6">
        <Stack gap="xl" className="py-16">

          {/* Intro */}
          <Stack gap="md" className="max-w-3xl">
            <Badge variant="outline" className="w-fit">Marketing + docs + terminal primitive</Badge>
            <h1 className="text-4xl font-semibold tracking-tight">
              One Code component. Every flavour of code surface.
            </h1>
            <p className="text-lg text-muted-foreground">
              Syntax highlighting via prism, animation via motion, palette via <code className="font-mono text-sm">--gds-code-*</code> tokens, terminal sequences via the <code className="font-mono text-sm">steps</code> machine. Scroll through to play each reveal — hit Replay in the canvas toolbar to run them again.
            </p>
          </Stack>

          {/* ── Plain ─────────────────────────────────────────────── */}
          <Stack gap="sm">
            <Row gap="sm" align="center">
              <Badge variant="outline" className="text-xs">01 — Plain</Badge>
              <span className="text-sm text-muted-foreground">Token-coloured, no animation, chrome on.</span>
            </Row>
            <Code source={PLAIN} language="tsx" filename="greet.ts" showLineNumbers />
          </Stack>

          <Separator />

          {/* ── Line highlight ────────────────────────────────────── */}
          <Stack gap="sm">
            <Row gap="sm" align="center">
              <Badge variant="outline" className="text-xs">02 — Line highlight</Badge>
              <span className="text-sm text-muted-foreground">Emphasise specific lines without a full diff.</span>
            </Row>
            <Code
              source={HIGHLIGHT}
              language="tsx"
              highlight={[2, [3, 5]]}
              showLineNumbers
            />
          </Stack>

          <Separator />

          {/* ── Diff hero ─────────────────────────────────────────── */}
          <Stack gap="sm">
            <Row gap="sm" align="center">
              <Badge variant="outline" className="text-xs">03 — Diff hero</Badge>
              <span className="text-sm text-muted-foreground">Before / after as a single stacked block.</span>
            </Row>
            <Code
              source={DIFF_BEFORE_AFTER}
              language="tsx"
              filename="button.tsx"
              diff={{ removed: [1, 2, 3], added: [4, 5, 6] }}
              reveal="diff"
              trigger="inView"
              delay={400}
              speed="normal"
            />
          </Stack>

          <Separator />

          {/* ── Scroll reveal ─────────────────────────────────────── */}
          <Stack gap="sm">
            <Row gap="sm" align="center">
              <Badge variant="outline" className="text-xs">04 — Scroll-triggered reveal</Badge>
              <span className="text-sm text-muted-foreground">Lines stagger in once they enter view.</span>
            </Row>
            <Code
              source={SCROLL_REVEAL}
              language="tsx"
              reveal="lines"
              trigger="inView"
              speed="normal"
            />
          </Stack>

          <Separator />

          {/* ── Speed presets side-by-side ───────────────────────── */}
          <Stack gap="sm">
            <Row gap="sm" align="center">
              <Badge variant="outline" className="text-xs">05 — Speed presets</Badge>
              <span className="text-sm text-muted-foreground">Slow / normal / fast — pick a feel, don't tune numbers.</span>
            </Row>
            <Grid cols="3" gap="md">
              <Stack gap="xs">
                <Row gap="xs" align="center">
                  <Badge variant="success-soft" className="text-xs">slow</Badge>
                  <span className="text-xs text-muted-foreground">90 / 38 / 320ms</span>
                </Row>
                <Code
                  source={SPEED_SAMPLE}
                  language="tsx"
                  reveal="lines"
                  trigger="inView"
                  speed="slow"
                  bare
                  className="text-xs p-4 border border-border/60 rounded-md"
                />
              </Stack>
              <Stack gap="xs">
                <Row gap="xs" align="center">
                  <Badge className="text-xs">normal</Badge>
                  <span className="text-xs text-muted-foreground">50 / 22 / 180ms</span>
                </Row>
                <Code
                  source={SPEED_SAMPLE}
                  language="tsx"
                  reveal="lines"
                  trigger="inView"
                  speed="normal"
                  bare
                  className="text-xs p-4 border border-border/60 rounded-md"
                />
              </Stack>
              <Stack gap="xs">
                <Row gap="xs" align="center">
                  <Badge variant="warning-soft" className="text-xs">fast</Badge>
                  <span className="text-xs text-muted-foreground">24 / 10 / 80ms</span>
                </Row>
                <Code
                  source={SPEED_SAMPLE}
                  language="tsx"
                  reveal="lines"
                  trigger="inView"
                  speed="fast"
                  bare
                  className="text-xs p-4 border border-border/60 rounded-md"
                />
              </Stack>
            </Grid>
          </Stack>

          <Separator />

          {/* ── Typewriter ─────────────────────────────────────────── */}
          <Stack gap="sm">
            <Row gap="sm" align="center">
              <Badge variant="outline" className="text-xs">06 — Typewriter</Badge>
              <span className="text-sm text-muted-foreground">Token-by-token reveal with auto blinking cursor — good for AI output.</span>
            </Row>
            <Code
              source={TYPEWRITER}
              language="tsx"
              reveal="typewriter"
              trigger="inView"
              speed="normal"
            />
          </Stack>

          <Separator />

          {/* ── Terminal — prompt + typewriter ─────────────────────── */}
          <Stack gap="sm">
            <Row gap="sm" align="center">
              <Badge variant="outline" className="text-xs">07 — Terminal (prompt + cursor)</Badge>
              <span className="text-sm text-muted-foreground">`prompt="$ "` + `reveal="typewriter"` = scripted bash session.</span>
            </Row>
            <Code
              source={`pnpm add @gradeui/ui
pnpm gradeui init
pnpm dev`}
              language="bash"
              prompt="$ "
              reveal="typewriter"
              trigger="inView"
              speed="normal"
            />
          </Stack>

          <Separator />

          {/* ── Scripted steps — bash with output ──────────────────── */}
          <Stack gap="sm">
            <Row gap="sm" align="center">
              <Badge variant="outline" className="text-xs">08 — Scripted bash (steps)</Badge>
              <span className="text-sm text-muted-foreground">Type → wait → output → wait → type. Output lines render muted, no prompt.</span>
            </Row>
            <Code
              language="bash"
              prompt="$ "
              trigger="inView"
              steps={BASH_STEPS}
            />
          </Stack>

          <Separator />

          {/* ── Looping demo ───────────────────────────────────────── */}
          <Stack gap="sm">
            <Row gap="sm" align="center">
              <Badge variant="outline" className="text-xs">09 — Looping CLI demo</Badge>
              <span className="text-sm text-muted-foreground">`loop` + `clear` — for always-on hero animations.</span>
            </Row>
            <Code
              language="bash"
              prompt="$ "
              trigger="inView"
              loop
              steps={LOOPING_DEMO}
            />
          </Stack>

          <Separator />

          {/* ── Python REPL ────────────────────────────────────────── */}
          <Stack gap="sm">
            <Row gap="sm" align="center">
              <Badge variant="outline" className="text-xs">10 — Python REPL</Badge>
              <span className="text-sm text-muted-foreground">`prompt=">>> "` + Python language = interactive REPL feel.</span>
            </Row>
            <Code
              language="py"
              prompt=">>> "
              trigger="inView"
              steps={PYTHON_REPL}
            />
          </Stack>

          <Separator />

          {/* ── Static Python — language coverage ──────────────────── */}
          <Stack gap="sm">
            <Row gap="sm" align="center">
              <Badge variant="outline" className="text-xs">11 — Language coverage</Badge>
              <span className="text-sm text-muted-foreground">tsx, jsx, ts, js, html, css, json, bash, md, py, go, rust.</span>
            </Row>
            <Code
              source={PYTHON_SAMPLE}
              language="py"
              filename="generate_theme.py"
              showLineNumbers
            />
          </Stack>

          <Separator />

          {/* ── Changelog grid ─────────────────────────────────────── */}
          <Stack gap="sm">
            <Row gap="sm" align="center">
              <Badge variant="outline" className="text-xs">12 — Changelog block</Badge>
              <span className="text-sm text-muted-foreground">Same primitive, in a card grid.</span>
            </Row>
            <Grid cols="2" gap="md">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">v0.11 — Raised button</CardTitle>
                  <CardDescription>Tactile bevel + drop shadow + ambient hover glow.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Code
                    source={CHANGELOG}
                    language="tsx"
                    bare
                    highlight={[4, 5, 6, 7]}
                    className="px-4 pb-4 text-xs"
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tonal override</CardTitle>
                  <CardDescription>One-line override via <code className="font-mono text-xs">--btn-glow</code>.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Code
                    source={`<Button
  variant="raised"
  style={{ "--btn-glow": "var(--warning)" }}
>
  Iterate
</Button>`}
                    language="tsx"
                    bare
                    highlight={[3]}
                    className="px-4 pb-4 text-xs"
                  />
                </CardContent>
              </Card>
            </Grid>
          </Stack>

          {/* Footer CTA */}
          <Stack gap="sm" align="center" className="py-16 text-center">
            <h3 className="text-2xl font-semibold tracking-tight">One primitive. Every code surface in the app.</h3>
            <p className="text-muted-foreground max-w-xl">Marketing heroes, docs blocks, Studio source panels, changelog entries, AI output, scripted CLI demos — same component, same palette, same animation language.</p>
            <Row gap="sm" className="mt-2">
              <Button>Read the sidecar</Button>
              <Button variant="outline">Open Studio</Button>
            </Row>
          </Stack>
        </Stack>
      </AppShellMain>
    </AppShell>
  );
}
