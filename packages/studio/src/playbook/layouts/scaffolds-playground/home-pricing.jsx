/**
 * @label       Home — pricing first (hosted + self-host clarity)
 * @description Pricing tiers as hero. Two paths surfaced: hosted gradeui.com (free/paid tiers) and self-host (MIT/BYOT/free forever). Consultancy and Pro library called out.
 * @tags        home landing marketing pricing hosted selfhost tiers wireframe
 * @notes       Generated 2026-05-28. Reflects the two-path model: hosted
 *              SaaS on gradeui.com with deliberately locked-down free
 *              tier (storage and Resend email costs drive the limits)
 *              plus self-host as the no-lock-in alternative. Pricing
 *              numbers are placeholders — lock them before going live.
 *              Consultancy is a separate column near the bottom.
 */
import {
  AppShell, AppShellHeader, AppShellMain, AppShellFooter,
  Toolbar, ToolbarSlot,
  Stack, Row, Grid,
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Badge,
} from "@gradeui/ui";
import {
  ArrowRight, Github, Check, ShieldCheck, Boxes, Layers, Mail,
} from "lucide-react";

const TIERS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    tag: "Trying gradeui",
    desc: "On gradeui.com. Enough to vibe a few screens and decide.",
    features: [
      "1 project, 5 screens",
      "Bring your own provider keys",
      "Limited AI usage per month",
      "Limited emails per month (Resend)",
      "Solo only, no team features",
    ],
    cta: "Try on gradeui.com",
    variant: "outline",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$24",
    cadence: "per month",
    tag: "Shipping with gradeui",
    desc: "On gradeui.com. Built for design engineers and solo founders shipping a real product.",
    features: [
      "Unlimited projects and screens",
      "Bring your own provider keys",
      "Higher AI usage caps",
      "Standard email quota",
      "Solo workspace, prototype sharing",
      "Access to @gradeui/pro library",
    ],
    cta: "Start Pro",
    variant: "default",
    highlight: true,
  },
  {
    name: "Team",
    price: "$48",
    cadence: "per seat / month",
    tag: "For product teams",
    desc: "On gradeui.com. The collaboration surface, the grid view, comments, permissions.",
    features: [
      "Everything in Pro",
      "Multiple workspaces and teams",
      "Permissions and roles",
      "Team comments and prototype review",
      "Higher email and AI caps",
      "SAML SSO (Enterprise add-on)",
    ],
    cta: "Start Team",
    variant: "outline",
    highlight: false,
  },
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
                <a href="#pricing">Pricing</a>
                <a href="#self-host">Self-host</a>
                <a href="#consultancy">Consultancy</a>
                <a href="#docs">Docs</a>
              </Row>
            </Row>
          </ToolbarSlot>
          <ToolbarSlot slot="trailing">
            <Row gap="sm" align="center">
              <Button variant="ghost" size="sm"><Github className="h-4 w-4" /></Button>
              <Button size="sm">Open Studio</Button>
            </Row>
          </ToolbarSlot>
        </Toolbar>
      </AppShellHeader>

      <AppShellMain className="max-w-6xl mx-auto px-6">
        <Stack gap="xl" className="py-20">
          <Stack gap="md" align="center" className="text-center max-w-3xl mx-auto">
            <Badge variant="outline">Pricing</Badge>
            <h1 className="text-5xl font-semibold tracking-tight">
              Two ways to use gradeui.
            </h1>
            <p className="text-lg text-muted-foreground">
              Try the hosted SaaS on gradeui.com (free tier or paid). Or self-host the whole thing under MIT, free forever, your infrastructure. Same components, same Studio, same MCP. Pick whichever matches your team.
            </p>
          </Stack>

          {/* Hosted tiers */}
          <Stack gap="md">
            <Row justify="between" align="center" className="border-b border-border pb-2">
              <Stack gap="xs">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Hosted on gradeui.com</span>
                <h2 className="text-xl font-semibold">For PMs, designers, founders</h2>
              </Stack>
              <Row gap="xs" align="center" className="text-xs text-muted-foreground">
                <ShieldCheck className="h-3 w-3" />
                <span>BYOT — your own provider keys</span>
              </Row>
            </Row>
            <Grid cols="3" gap="md">
              {TIERS.map((t) => (
                <Card key={t.name} className={t.highlight ? "ring-2 ring-foreground/10" : ""}>
                  <CardHeader>
                    <Row gap="sm" align="center" justify="between">
                      <CardTitle>{t.name}</CardTitle>
                      {t.highlight && <Badge>Most popular</Badge>}
                    </Row>
                    <Row gap="xs" align="baseline">
                      <span className="text-3xl font-semibold tracking-tight">{t.price}</span>
                      <span className="text-sm text-muted-foreground">{t.cadence}</span>
                    </Row>
                    <CardDescription>{t.desc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Stack gap="xs">
                      {t.features.map((f) => (
                        <Row key={f} gap="xs" align="start">
                          <Check className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <span className="text-sm">{f}</span>
                        </Row>
                      ))}
                    </Stack>
                  </CardContent>
                  <CardFooter>
                    <Button variant={t.variant} className="w-full">{t.cta}</Button>
                  </CardFooter>
                </Card>
              ))}
            </Grid>
          </Stack>

          {/* Self-host */}
          <Stack gap="md">
            <Row justify="between" align="center" className="border-b border-border pb-2">
              <Stack gap="xs">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Self-host</span>
                <h2 className="text-xl font-semibold">For engineering-led teams</h2>
              </Stack>
              <Row gap="xs" align="center" className="text-xs text-muted-foreground">
                <ShieldCheck className="h-3 w-3" />
                <span>MIT licensed, you own the code</span>
              </Row>
            </Row>
            <Card>
              <CardContent className="p-6">
                <Grid cols="2" gap="xl" className="items-start">
                  <Stack gap="sm">
                    <Row gap="xs" align="baseline">
                      <span className="text-3xl font-semibold tracking-tight">$0</span>
                      <span className="text-sm text-muted-foreground">forever</span>
                    </Row>
                    <p className="text-muted-foreground">Install Studio yourself. Run it on your own infrastructure. Bring your own keys. No payment to gradeui, no usage limits, no email quotas. The MIT-licensed component library underneath means you own the code and can walk away anytime.</p>
                    <Row gap="sm" className="mt-2">
                      <Button>Install <ArrowRight className="h-4 w-4 ml-1" /></Button>
                      <Button variant="outline">Read self-host docs</Button>
                    </Row>
                  </Stack>
                  <Stack gap="xs">
                    {[
                      "Full Studio canvas, no limits",
                      "@gradeui/ui MIT licensed",
                      "Bring your own provider keys",
                      "Your own database, your own storage",
                      "No telemetry, no account required",
                      "Optional: add @gradeui/pro library",
                    ].map((f) => (
                      <Row key={f} gap="xs" align="start">
                        <Check className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <span className="text-sm">{f}</span>
                      </Row>
                    ))}
                  </Stack>
                </Grid>
              </CardContent>
            </Card>
          </Stack>

          {/* Pro library */}
          <Stack gap="md">
            <Row justify="between" align="center" className="border-b border-border pb-2">
              <Stack gap="xs">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Add-on libraries</span>
                <h2 className="text-xl font-semibold">@gradeui/pro and per-client</h2>
              </Stack>
            </Row>
            <Grid cols="2" gap="md">
              <Card>
                <CardHeader>
                  <Row gap="sm" align="center">
                    <Boxes className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>@gradeui/pro</CardTitle>
                  </Row>
                  <Row gap="xs" align="baseline">
                    <span className="text-2xl font-semibold">$199</span>
                    <span className="text-sm text-muted-foreground">per developer / year</span>
                  </Row>
                  <CardDescription>Complex composites and category-specific patterns beyond the free library. Same tokens, same primitives. Adopting Pro never breaks an existing build.</CardDescription>
                </CardHeader>
                <CardFooter><Button variant="outline" className="w-full">Buy Pro</Button></CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <Row gap="sm" align="center">
                    <Layers className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Per-client</CardTitle>
                  </Row>
                  <Row gap="xs" align="baseline">
                    <span className="text-2xl font-semibold">Custom</span>
                  </Row>
                  <CardDescription>Bespoke components and tokens for a single team or product. Delivered as a private package, maintained alongside your roadmap.</CardDescription>
                </CardHeader>
                <CardFooter><Button variant="outline" className="w-full">Talk to us</Button></CardFooter>
              </Card>
            </Grid>
          </Stack>

          {/* Consultancy */}
          <Card>
            <CardContent className="p-8">
              <Grid cols="2" gap="xl" className="items-center">
                <Stack gap="sm">
                  <Badge variant="outline" className="w-fit">Consultancy</Badge>
                  <h2 className="text-3xl font-semibold tracking-tight">When you want help shipping.</h2>
                  <p className="text-muted-foreground">Engagement-based, not retainer-based. We work with a small number of teams each quarter on design system strategy, AI builder integration, and piecemeal legacy migration plans. The work ends when the work is done.</p>
                </Stack>
                <Stack gap="sm">
                  <Row gap="sm" align="start"><Layers className="h-4 w-4 text-muted-foreground mt-0.5" /><span className="text-sm">Design system strategy</span></Row>
                  <Row gap="sm" align="start"><Boxes className="h-4 w-4 text-muted-foreground mt-0.5" /><span className="text-sm">AI builder integration</span></Row>
                  <Row gap="sm" align="start"><Mail className="h-4 w-4 text-muted-foreground mt-0.5" /><span className="text-sm">Migration plans</span></Row>
                  <Row gap="sm" className="mt-2">
                    <Button>Email <ArrowRight className="h-4 w-4 ml-1" /></Button>
                    <Button variant="outline">Book a call</Button>
                  </Row>
                </Stack>
              </Grid>
            </CardContent>
          </Card>
        </Stack>

        {/* FAQs */}
        <Stack gap="xl" className="py-20 border-t border-border">
          <Stack gap="sm" className="max-w-2xl">
            <Badge variant="outline" className="w-fit">FAQ</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">Common questions about pricing.</h2>
          </Stack>
          <Grid cols="2" gap="md">
            {[
              { q: "Why is the free tier locked down?", a: "Hosting has real costs: storage scales with users, Resend charges per email, and we want gradeui.com to stay sustainable. Free is for trying, not for shipping. Self-host is the unrestricted alternative." },
              { q: "What does BYOT mean?", a: "Bring your own token. Inference is never paid by gradeui. You drop in your own provider key (Anthropic, Google, OpenAI). Google's API has a free tier so a Google key costs nothing." },
              { q: "Can I switch from hosted to self-host later?", a: "Yes. The components are MIT licensed and the data formats are the same. Export your screens and run the same Studio on your own infrastructure." },
              { q: "Do you offer Enterprise?", a: "Yes. SAML SSO, custom contracts, higher caps, per-client component library, and dedicated support. Talk to us." },
            ].map((f) => (
              <Card key={f.q}>
                <CardHeader>
                  <CardTitle className="text-base">{f.q}</CardTitle>
                  <CardDescription>{f.a}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </Grid>
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
// • <PricingCard> — every tier card has the same shape: title +
//   price + cadence + description + feature checklist + CTA.
//   Three uses in this scaffold; the moment a second pricing page
//   shows up, this should graduate. Proposed:
//   <PricingCard name price cadence features cta highlight />.
//
// • <FeatureChecklist> — third scaffold to use this (after home-main
//   and home-free-any-ai). Definitely ready to graduate. Icon prop,
//   compact and roomy variants.
//
// • <SectionHeader> — the "label / heading / right-side note" row
//   above each pricing section (Hosted on gradeui.com / Self-host /
//   Add-on libraries) recurs. Could be a Toolbar variant or a
//   dedicated primitive.
//
// • <FAQGrid> — the 2-col FAQ pattern recurs on most pricing and
//   product pages. Could compose Card with a question prop.
