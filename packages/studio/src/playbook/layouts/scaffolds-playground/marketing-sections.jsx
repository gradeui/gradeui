/**
 * @label       Marketing sections — scope kit
 * @description A stacked marketing page where every band wears a colour SCOPE (inverse hero, muted logos, default features, card split, brand testimonial, inverse CTA, card footer). Drop-in section patterns + a live tour of the scope system.
 * @tags        marketing sections hero features pricing testimonial cta footer scope theme bands landing
 * @notes       Each <section> applies a `scope-*` class (globals.css colour
 *              scopes) so the band re-tones its whole subtree — headings,
 *              cards, muted captions — while Buttons/Badges keep the vivid
 *              action colours. Built from allowlisted primitives only
 *              (SectionBlock isn't in the Studio allowlist), so the scope is
 *              applied as a class on the band wrapper, which is exactly how
 *              scopes work. Copy any single band out as a standalone section.
 */
import {
  Stack, Row, Grid,
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Badge, Separator, Avatar, AvatarFallback,
  MediaSurface,
} from "@gradeui/ui";
import {
  ArrowRight, Check, Sparkles, Boxes, Gauge, Palette, Plug, ShieldCheck,
  Github, Star,
} from "lucide-react";

const FEATURES = [
  { icon: Plug, title: "Bring your own model", body: "Anthropic, Google, OpenAI — your key, your bill. No inference markup, ever." },
  { icon: Palette, title: "Themeable to the core", body: "Every colour binds to a live token. Re-skin a whole product without touching a line of JSX." },
  { icon: Boxes, title: "Real components", body: "Output is real React from the same library that powers this page. Copy it straight into your app." },
  { icon: Gauge, title: "Studio or MCP", body: "Drive it from the browser canvas or wire the MCP into the agent you already use." },
  { icon: Sparkles, title: "Scopes, not forks", body: "Drop a section into a dark band and every caption re-tones. One class, whole subtree." },
  { icon: ShieldCheck, title: "No lock-in", body: "MIT components, your data formats. Self-host the lot, or walk away with the code." },
];

const TIERS = [
  { name: "Free", price: "$0", cadence: "forever", desc: "Enough to vibe a few screens and decide.", features: ["1 project, 5 screens", "Bring your own keys", "Solo workspace"], cta: "Start free", variant: "outline", highlight: false },
  { name: "Pro", price: "$24", cadence: "per month", desc: "For design engineers shipping a real product.", features: ["Unlimited projects", "Higher AI caps", "Prototype sharing", "@gradeui/pro library"], cta: "Start Pro", variant: "default", highlight: true },
  { name: "Team", price: "$48", cadence: "per seat / mo", desc: "The collaboration surface for product teams.", features: ["Everything in Pro", "Roles + permissions", "Team comments", "SSO add-on"], cta: "Start Team", variant: "outline", highlight: false },
];

/** Full-bleed band: a `scope-*` class paints the surface and re-tones the
 *  subtree; the inner container holds the rhythm + max width. */
function Band({ scope, className = "", children }) {
  return (
    <section className={scope ?? ""}>
      <div className={`mx-auto max-w-6xl px-6 py-20 md:py-28 ${className}`}>
        {children}
      </div>
    </section>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav (page surface) */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <Row justify="between" align="center" className="mx-auto max-w-6xl px-6 py-3">
          <Row gap="sm" align="center">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-background text-sm font-bold">G</div>
            <span className="font-semibold">Grade</span>
          </Row>
          <Row gap="md" align="center" className="hidden text-sm text-muted-foreground md:flex">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#docs">Docs</a>
          </Row>
          <Row gap="sm" align="center">
            <Button variant="ghost" size="sm"><Github className="h-4 w-4" /></Button>
            <Button size="sm">Open Studio</Button>
          </Row>
        </Row>
      </header>

      {/* HERO — scope-inverse (dark band, light text) */}
      <Band scope="scope-inverse">
        <Stack gap="lg" align="center" className="mx-auto max-w-3xl text-center">
          <Badge variant="outline">Design systems that make the grade</Badge>
          <h1 className="text-5xl font-semibold tracking-tight md:text-6xl">
            Use the agent you prefer. Own the components.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            A BYOK design system and AI-powered UI studio. Tweak, edit, and ship
            on your own subscription. No more lock-in.
          </p>
          <Row gap="sm" className="pt-2">
            <Button size="lg">Open Studio <ArrowRight className="ml-1 h-4 w-4" /></Button>
            <Button size="lg" variant="outline">Read the docs</Button>
          </Row>
          <span className="text-xs text-muted-foreground">No card needed · Bring your own model key</span>
        </Stack>
      </Band>

      {/* LOGOS — scope-muted (quiet band) */}
      <Band scope="scope-muted" className="py-12 md:py-16">
        <Stack gap="md" align="center">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Works with the stack you already run</span>
          <Row gap="lg" align="center" className="flex-wrap justify-center opacity-70">
            {["Anthropic", "Google", "OpenAI", "Vercel", "Supabase", "Tailwind"].map((n) => (
              <span key={n} className="text-lg font-semibold tracking-tight">{n}</span>
            ))}
          </Row>
        </Stack>
      </Band>

      {/* FEATURES — default (page surface) */}
      <Band>
        <Stack gap="xl">
          <Stack gap="sm" align="center" className="mx-auto max-w-2xl text-center">
            <Badge variant="outline">Why Grade</Badge>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Everything is real, and everything is yours.</h2>
            <p className="text-muted-foreground">Not throwaway markup. Not a black box. The same primitives, tokens, and themes from edit to ship.</p>
          </Stack>
          <Grid cols="3" gap="lg">
            {FEATURES.map((f) => (
              <Card key={f.title}>
                <CardHeader>
                  <div className="mb-2 grid h-9 w-9 place-items-center rounded-md bg-muted text-foreground">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                  <CardDescription>{f.body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </Grid>
        </Stack>
      </Band>

      {/* SPLIT SHOWCASE — scope-card (raised surface band) */}
      <Band scope="scope-card">
        <Grid cols="2" gap="xl" className="items-center">
          <Stack gap="md">
            <Badge variant="outline" className="w-fit">Live preview</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">Describe a screen. Watch it assemble.</h2>
            <p className="text-muted-foreground">Studio is a conversation. Ask for a section or a change and it builds from real Grade components — themeable, selectable, editable.</p>
            <Stack gap="xs">
              {["Real, themeable components", "Selection inspector for every node", "Copy straight into your app"].map((f) => (
                <Row key={f} gap="xs" align="start">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm">{f}</span>
                </Row>
              ))}
            </Stack>
            <Row gap="sm" className="pt-1">
              <Button>Try Studio <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </Row>
          </Stack>
          <MediaSurface
            hint="Studio canvas — a generated screen"
            alt="The Grade Studio canvas with a generated marketing page"
            className="aspect-[4/3] w-full rounded-xl border border-border"
          />
        </Grid>
      </Band>

      {/* PRICING — default */}
      <Band id="pricing">
        <Stack gap="xl">
          <Stack gap="sm" align="center" className="mx-auto max-w-2xl text-center">
            <Badge variant="outline">Pricing</Badge>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Pay for the studio, never for inference.</h2>
            <p className="text-muted-foreground">Bring your own provider key. Self-host the whole thing free, forever.</p>
          </Stack>
          <Grid cols="3" gap="lg">
            {TIERS.map((t) => (
              <Card key={t.name} className={t.highlight ? "ring-2 ring-primary/30" : ""}>
                <CardHeader>
                  <Row justify="between" align="center">
                    <CardTitle>{t.name}</CardTitle>
                    {t.highlight && <Badge>Popular</Badge>}
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
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
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
      </Band>

      {/* TESTIMONIAL — scope-brand (brand band) */}
      <Band scope="scope-brand">
        <Stack gap="lg" align="center" className="mx-auto max-w-3xl text-center">
          <Row gap="xs">
            {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-4 w-4 fill-current" />)}
          </Row>
          <p className="text-2xl font-medium leading-snug tracking-tight md:text-3xl">
            “It's the first tool where the output is the design system, not a screenshot of one.
            We shipped a re-skin in an afternoon.”
          </p>
          <Row gap="sm" align="center">
            <Avatar><AvatarFallback>JD</AvatarFallback></Avatar>
            <Stack gap="none" className="text-left">
              <span className="text-sm font-semibold">Jordan Diaz</span>
              <span className="text-sm text-muted-foreground">Head of Design, Northwind</span>
            </Stack>
          </Row>
        </Stack>
      </Band>

      {/* CTA — scope-inverse */}
      <Band scope="scope-inverse">
        <Stack gap="md" align="center" className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Make it yours.</h2>
          <p className="max-w-xl text-muted-foreground">Open the studio, bring your key, and ship something that looks like your product.</p>
          <Row gap="sm" className="pt-1">
            <Button size="lg">Open Studio <ArrowRight className="ml-1 h-4 w-4" /></Button>
            <Button size="lg" variant="outline">Join the waitlist</Button>
          </Row>
        </Stack>
      </Band>

      {/* FOOTER — scope-card */}
      <footer className="scope-card">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <Grid cols="4" gap="lg">
            <Stack gap="sm">
              <Row gap="sm" align="center">
                <div className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-background text-sm font-bold">G</div>
                <span className="font-semibold">Grade</span>
              </Row>
              <p className="text-sm text-muted-foreground">Designs that make the grade.</p>
            </Stack>
            {[
              { h: "Product", links: ["Studio", "Components", "Themes", "MCP"] },
              { h: "Resources", links: ["Docs", "Changelog", "GitHub", "Status"] },
              { h: "Company", links: ["About", "Pricing", "Contact", "Terms"] },
            ].map((col) => (
              <Stack key={col.h} gap="xs">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{col.h}</span>
                {col.links.map((l) => (
                  <a key={l} href="#" className="text-sm text-muted-foreground hover:text-foreground">{l}</a>
                ))}
              </Stack>
            ))}
          </Grid>
          <Separator className="my-8" />
          <Row justify="between" align="center" className="flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">© 2026 Grade · ali@gradeui.com</span>
            <Row gap="md" className="text-sm text-muted-foreground">
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
            </Row>
          </Row>
        </div>
      </footer>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// DS gaps surfaced by this scaffold
// ────────────────────────────────────────────────────────────────────
//
// • <Section> / <Band> — the full-bleed "scope class + max-w container +
//   vertical rhythm" wrapper is hand-rolled here because SectionBlock
//   isn't in the Studio allowlist. The marketing-section story (scope +
//   padding scale + container) wants a single allowlisted primitive.
//   Strongest candidate to graduate: surface SectionBlock (it already
//   takes `scope`) into the allowlist, or ship a thin <Band scope padding>.
//
// • <FeatureCard> — icon-tile + title + description card recurs in nearly
//   every marketing scaffold. Ready to graduate (icon, title, body props).
//
// • <PricingCard> — same tier-card shape as home-pricing/home-main; the
//   third use. Graduate: <PricingCard name price cadence features cta
//   highlight />.
//
// • <Stars> — the 5-star rating row is trivial but recurs on testimonial
//   and review surfaces; a tiny <Rating value max> would remove the map.
