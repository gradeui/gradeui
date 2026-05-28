/**
 * @label       Home — one free platform any AI (bold statement)
 * @description Bold-statement home page led by "One free platform. Any AI." Trust bar prominent under hero. Bring-your-key narrative, model-agnostic story. Wireframe foundation.
 * @tags        home landing marketing free model agnostic byot trust wireframe
 * @notes       Generated 2026-05-28 from POSITIONING.md + COPY.md. Hero is
 *              the user's draft headline, lightly sharpened. Trust bar gets
 *              the most visual weight of any concept here. Bring-your-key
 *              card is a featured product surface, not a side note.
 */
import {
  AppShell, AppShellHeader, AppShellMain, AppShellFooter,
  Toolbar, ToolbarSlot,
  Stack, Row, Grid,
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Badge, Input,
} from "@gradeui/ui";
import {
  ArrowRight, Github, Key, Check, Shield, Zap, Lock,
} from "lucide-react";

const PROVIDERS = [
  { tier: "Models", items: ["Anthropic", "Google", "OpenAI", "Nano Banana", "Imagen"] },
  { tier: "Libraries", items: ["TanStack", "MapLibre", "dnd-kit", "TipTap", "three.js"] },
  { tier: "Content", items: ["Unsplash", "Spotify", "Generated"] },
  { tier: "Standards", items: ["MCP", "React", "Tailwind", "Figma"] },
];

export default function App() {
  return (
    <AppShell nav="none" className="min-h-screen bg-background">
      <AppShellHeader className="border-b border-border bg-background/80 backdrop-blur">
        <Toolbar size="md" className="max-w-6xl mx-auto px-6">
          <ToolbarSlot slot="leading">
            <Row gap="md" align="center">
              <Row gap="xs" align="center">
                <div className="h-7 w-7 rounded-md bg-foreground text-background grid place-items-center font-bold text-sm">G</div>
                <span className="font-semibold">GradeUI</span>
              </Row>
              <Row gap="md" align="center" className="ml-6 text-sm text-muted-foreground">
                <a href="#models">Models</a>
                <a href="#components">Components</a>
                <a href="#studio">Studio</a>
                <a href="#pricing">Pricing</a>
              </Row>
            </Row>
          </ToolbarSlot>
          <ToolbarSlot slot="trailing">
            <Row gap="sm" align="center">
              <Button variant="ghost" size="sm"><Github className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm">Sign in</Button>
              <Button size="sm">Open Studio</Button>
            </Row>
          </ToolbarSlot>
        </Toolbar>
      </AppShellHeader>

      <AppShellMain className="max-w-6xl mx-auto px-6">
        {/* Hero — bold statement */}
        <Stack gap="xl" className="py-24">
          <Stack gap="md" align="center" className="text-center max-w-3xl mx-auto">
            <Badge variant="outline">AI-first, no lock-in</Badge>
            <h1 className="text-6xl font-semibold tracking-tight leading-tight">
              One free platform.<br />Any AI.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              GradeUI ships with rock-solid components, skills, and context out of the box. Extend to taste. Bring your key. Unlock the box.
            </p>
            <Row gap="sm" className="mt-2">
              <Button size="lg">Open Studio <ArrowRight className="h-4 w-4 ml-1" /></Button>
              <Button size="lg" variant="outline">Install the library</Button>
            </Row>
            <Row gap="md" align="center" className="mt-2 text-xs text-muted-foreground">
              <Row gap="xs" align="center"><Check className="h-3 w-3" /><span>MIT licensed</span></Row>
              <Row gap="xs" align="center"><Check className="h-3 w-3" /><span>BYOT — Google's API is free</span></Row>
              <Row gap="xs" align="center"><Check className="h-3 w-3" /><span>You own the code</span></Row>
            </Row>
          </Stack>
        </Stack>

        {/* Trust bar — given heavy weight in this concept */}
        <Stack gap="lg" className="py-12 border-y border-border">
          <Stack gap="xs" align="center">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Plugs into everything you already use</span>
            <span className="text-sm text-muted-foreground max-w-xl text-center">Model agnostic by design. Bring your own key for every provider. A Google key runs on their free tier at zero cost; use your paid bill anywhere else.</span>
          </Stack>
          <Stack gap="md">
            {PROVIDERS.map((row) => (
              <Row key={row.tier} gap="xl" align="center" justify="center" className="flex-wrap">
                <span className="text-xs uppercase tracking-wider text-muted-foreground w-24 text-right">{row.tier}</span>
                <Row gap="lg" align="center" className="flex-wrap">
                  {row.items.map((item) => (
                    <span key={item} className="text-sm font-medium text-muted-foreground/80">{item}</span>
                  ))}
                </Row>
              </Row>
            ))}
          </Stack>
        </Stack>

        {/* Bring your own key — feature */}
        <Stack gap="xl" className="py-20">
          <Grid cols="2" gap="xl" className="items-center">
            <Stack gap="sm">
              <Badge variant="outline" className="w-fit">Bring your own key</Badge>
              <h2 className="text-3xl font-semibold tracking-tight">Drop a key in. Point at any model.</h2>
              <p className="text-muted-foreground">Bring your own key for every model from the first prompt. A Google API key runs on their free tier, so Gemini, Nano Banana, and Imagen cost nothing. Add Anthropic or OpenAI keys when you want the paid providers.</p>
              <Stack gap="xs" className="mt-2">
                <Row gap="sm" align="center"><Shield className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Keys stored locally, never on our servers</span></Row>
                <Row gap="sm" align="center"><Zap className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Swap providers per generation, not per app</span></Row>
                <Row gap="sm" align="center"><Lock className="h-4 w-4 text-muted-foreground" /><span className="text-sm">No model lock-in, ever</span></Row>
              </Stack>
            </Stack>
            <Card>
              <CardHeader>
                <Row gap="sm" align="center">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Provider keys</CardTitle>
                </Row>
                <CardDescription>Wireframe of the BYOT panel. Real UI lives in Studio settings.</CardDescription>
              </CardHeader>
              <CardContent>
                <Stack gap="sm">
                  {["Anthropic (Claude)", "Google (Gemini, Nano Banana, Imagen)", "OpenAI"].map((p) => (
                    <Row key={p} gap="sm" align="center" justify="between" className="p-3 border border-border rounded-md">
                      <span className="text-sm">{p}</span>
                      <Input placeholder="sk-..." className="max-w-[200px]" />
                    </Row>
                  ))}
                </Stack>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Save keys</Button>
              </CardFooter>
            </Card>
          </Grid>
        </Stack>

        {/* The principle */}
        <Stack gap="xl" className="py-20 border-t border-border">
          <Stack gap="sm" align="center" className="text-center max-w-2xl mx-auto">
            <Badge variant="outline">Model lock-in is the next strategic risk</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">Treat models as commodities. Treat the system as the asset.</h2>
            <p className="text-muted-foreground">Most AI tools are built on a single model. If the provider raises prices, shifts the model behaviour, or ships a competing product, your tooling absorbs the impact. We learned this from cloud lock-in. GradeUI is designed for portability from day one.</p>
          </Stack>
        </Stack>

        {/* CTA close */}
        <Stack gap="md" align="center" className="py-20 border-t border-border text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Bring your key. Unlock the box.</h2>
          <Row gap="sm" className="mt-2">
            <Button size="lg">Open Studio <ArrowRight className="h-4 w-4 ml-1" /></Button>
            <Button size="lg" variant="outline">See the components</Button>
          </Row>
        </Stack>
      </AppShellMain>

      <AppShellFooter className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Row justify="between" align="center">
            <span className="text-sm text-muted-foreground">GradeUI by Ali Driver — ali@gradeui.com</span>
            <Row gap="md" className="text-sm text-muted-foreground">
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
              <a href="#github">GitHub</a>
            </Row>
          </Row>
        </div>
      </AppShellFooter>
    </AppShell>
  );
}

// ────────────────────────────────────────────────────────────────────
// DS gaps surfaced by this scaffold
// ────────────────────────────────────────────────────────────────────
//
// • <LogoStripe variant="multi-tier"> — the trust bar here has a row
//   label ("Models", "Libraries", "Content", "Standards") with a
//   horizontal list of items. The single-row LogoStripe gap noted in
//   home-diff-hero needs a multi-tier sibling.
//
// • <KeyRow> — the BYOT card lists providers as label-on-left,
//   key-input-on-right rows. This is exactly the shape Studio's
//   settings panel needs too. Proposed:
//   <KeyRow provider label placeholder masked onChange />.
//
// • <FeatureChecklist> — the inline checklist under the hero
//   (Check icon + small text) and the "Keys stored locally" /
//   "Swap providers per generation" / "No lock-in" stack are the same
//   shape. Could be a tight primitive: <FeatureChecklist items />
//   with icon variant prop.
