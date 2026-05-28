/**
 * @label       Home — founder voice (manifesto-led)
 * @description Long-form manifesto. Founder bio, photo, narrative blocks. Personal voice, no marketing chrome. For PMs arriving from LinkedIn who want the human story before they evaluate.
 * @tags        home landing marketing founder voice manifesto bio wireframe
 * @notes       Generated 2026-05-28. Targets the LinkedIn-referral PM
 *              who saw a sharp post, wants to know who the person is,
 *              and decides whether to trust the product based on the
 *              author. The page reads like a personal essay with the
 *              product surfaced at the end as evidence of conviction.
 */
import {
  AppShell, AppShellHeader, AppShellMain, AppShellFooter,
  Toolbar, ToolbarSlot,
  Stack, Row, Grid,
  Card, CardContent,
  Button, Badge,
  Avatar, AvatarImage, AvatarFallback,
  MediaSurface,
} from "@gradeui/ui";
import {
  ArrowRight, Github, Mail, Linkedin, Quote,
} from "lucide-react";

export default function App() {
  return (
    <AppShell nav="none" className="min-h-screen bg-background">
      <AppShellHeader className="border-b border-border bg-background/80 backdrop-blur">
        <Toolbar size="md" className="max-w-3xl mx-auto px-6">
          <ToolbarSlot slot="leading">
            <Row gap="xs" align="center">
              <div className="h-7 w-7 rounded-md bg-foreground text-background grid place-items-center font-bold text-sm">G</div>
              <span className="font-semibold">GradeUI</span>
            </Row>
          </ToolbarSlot>
          <ToolbarSlot slot="trailing">
            <Row gap="sm" align="center">
              <Button variant="ghost" size="sm"><Github className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm"><Linkedin className="h-4 w-4" /></Button>
              <Button size="sm">Open Studio</Button>
            </Row>
          </ToolbarSlot>
        </Toolbar>
      </AppShellHeader>

      <AppShellMain className="max-w-3xl mx-auto px-6">

        {/* Bio hero */}
        <Stack gap="lg" className="py-20">
          <Row gap="md" align="center">
            <Avatar className="h-16 w-16">
              <AvatarImage src="" alt="Ali Driver" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <Stack gap="xs">
              <span className="text-sm text-muted-foreground">Hi, I am Ali.</span>
              <h1 className="text-2xl font-semibold tracking-tight">I build design systems. I built gradeui.</h1>
            </Stack>
          </Row>
          <p className="text-lg text-foreground leading-relaxed">
            For fifteen years I have watched product teams ship faster than their design systems can keep up. The system rots, the engineering team rewrites the same components four times, the brand designer asks for a colour change and gets a quote in story points. The pattern has not changed since I was building component libraries at startups in 2014.
          </p>
          <p className="text-lg text-foreground leading-relaxed">
            AI builders made the pattern worse. v0, Lovable, Bolt, all of them generate output faster than any human-curated system can absorb. The faster the AI gets, the further the design system drifts from the product. I built gradeui to close that gap.
          </p>
        </Stack>

        {/* Manifesto */}
        <Stack gap="xl" className="py-16 border-t border-border">
          <Stack gap="sm">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">A position</span>
            <h2 className="text-3xl font-semibold tracking-tight">What I think AI builders should be.</h2>
          </Stack>

          <Stack gap="md">
            <p className="text-base text-foreground leading-relaxed">
              The discipline is no longer "build the design system." It is build the design system that can metabolise AI output without compounding drift. Tokens as the contract. Real components in the output. A Figma file that matches the code. Get those right and AI becomes a multiplier. Get them wrong and AI becomes its accelerated death.
            </p>
            <p className="text-base text-foreground leading-relaxed">
              Every AI builder I have evaluated this year ships output that demos well and rots on contact with a real application. The screenshots travel; the markup is throwaway; the engineering team rewrites everything. The work that looked like progress was actually debt with a polished veneer.
            </p>
            <p className="text-base text-foreground leading-relaxed">
              gradeui is built the other way. Real components. Real tokens. A Figma file that matches the code. Hard primitives curated and shipped (TanStack tables, MapLibre maps, dnd-kit, TipTap, three.js) so your team is not gluing libraries together over six months. Model agnostic so you are not one provider decision away from being broken. MIT licensed so you can walk away anytime.
            </p>
            <p className="text-base text-foreground leading-relaxed">
              It is the system I have wanted for a decade.
            </p>
          </Stack>
        </Stack>

        {/* Pull quote */}
        <Stack gap="md" className="py-16 border-t border-border">
          <Quote className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-2xl font-medium leading-snug">
            The strategic mistake is not using AI builders. It is treating the prototype as the foundation.
          </p>
          <span className="text-sm text-muted-foreground">From a LinkedIn post earlier this year.</span>
        </Stack>

        {/* What I do */}
        <Stack gap="xl" className="py-16 border-t border-border">
          <Stack gap="sm">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">What I do</span>
            <h2 className="text-3xl font-semibold tracking-tight">Two things, mostly.</h2>
          </Stack>

          <Grid cols="2" gap="md">
            <Card>
              <CardContent className="p-6">
                <Stack gap="sm">
                  <Badge variant="outline" className="w-fit">The product</Badge>
                  <h3 className="text-lg font-semibold">I build gradeui.</h3>
                  <p className="text-sm text-muted-foreground">The component library, Studio, the MCP server, the skill atoms. Open source where it matters, paid where the work earns it. The product exists because I needed it to exist for my own consulting clients.</p>
                  <Button variant="outline" className="w-fit mt-2">See the components</Button>
                </Stack>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Stack gap="sm">
                  <Badge variant="outline" className="w-fit">The consultancy</Badge>
                  <h3 className="text-lg font-semibold">I help teams ship.</h3>
                  <p className="text-sm text-muted-foreground">Design system strategy. AI builder integration. Piecemeal migration plans. Engagement-based, not retainer-based. I work with a small number of teams each quarter and the work ends when the work is done.</p>
                  <Button variant="outline" className="w-fit mt-2">Get in touch</Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Stack>

        {/* Recent thinking */}
        <Stack gap="xl" className="py-16 border-t border-border">
          <Stack gap="sm">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Recent thinking</span>
            <h2 className="text-3xl font-semibold tracking-tight">Posts and essays.</h2>
          </Stack>

          <Stack gap="md">
            {[
              { date: "May 2026", title: "AI is the fastest way to break a design system", excerpt: "Most design systems being shipped today are quietly rotting. The accelerant is AI builders. Here is how to make AI output land on the system rather than next to it." },
              { date: "May 2026", title: "Model lock-in is the next strategic risk", excerpt: "A note for anyone evaluating AI builders this quarter. Most are built on a single model. Familiar shape from cloud lock-in a decade ago." },
              { date: "April 2026", title: "The opinionated piece of any tool is the default", excerpt: "Designers picked the infinite canvas. Product teams need something else. Defaults are positioning." },
              { date: "April 2026", title: "The rewrite that kills teams", excerpt: "Every product team has seen at least one UI rewrite project that took eighteen months, shipped nothing, and ended with the lead engineer leaving." },
            ].map((post) => (
              <Card key={post.title}>
                <CardContent className="p-4">
                  <Stack gap="xs">
                    <span className="text-xs text-muted-foreground">{post.date}</span>
                    <h3 className="text-base font-semibold">{post.title}</h3>
                    <p className="text-sm text-muted-foreground">{post.excerpt}</p>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
          <Row justify="center">
            <Button variant="outline">Read on LinkedIn <ArrowRight className="h-4 w-4 ml-1" /></Button>
          </Row>
        </Stack>

        {/* Contact */}
        <Stack gap="md" className="py-20 border-t border-border">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Get in touch</span>
          <h2 className="text-3xl font-semibold tracking-tight">Email or LinkedIn, either is fine.</h2>
          <p className="text-base text-foreground leading-relaxed">
            If your team is wrestling with the AI-and-design-system pattern, I would be glad to talk. If you want to try the product, gradeui.com has a free tier (locked down, but enough to vibe a few screens). If you want to self-host, it is MIT licensed.
          </p>
          <Row gap="sm" className="mt-2">
            <Button><Mail className="h-4 w-4 mr-1" /> ali@gradeui.com</Button>
            <Button variant="outline"><Linkedin className="h-4 w-4 mr-1" /> LinkedIn</Button>
            <Button variant="outline">Open Studio</Button>
          </Row>
        </Stack>
      </AppShellMain>

      <AppShellFooter className="border-t border-border">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <Row justify="between" align="center">
            <span className="text-xs text-muted-foreground">Built and maintained by Ali Driver.</span>
            <Row gap="md" className="text-xs text-muted-foreground">
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
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
// • <AuthorHeader> — the bio row at the top (Avatar + name + tagline)
//   recurs anywhere a person is the surface (founder bio, author
//   byline, profile card). Tight primitive worth having. Proposed:
//   <AuthorHeader avatar name tagline />.
//
// • <ArticleCard> — the recent-thinking post cards (date eyebrow,
//   title, excerpt) are the standard blog/article card shape.
//   Should fold into <Card variant="article"> or its own primitive.
//
// • <PullQuote attribution> — third use across scaffolds. Definitely
//   graduate.
//
// • <ProseSection> — the long-form text blocks with consistent
//   paragraph rhythm (text-base, leading-relaxed, max-width) are a
//   common pattern on editorial pages. Could be a thin wrapper
//   around Stack that enforces typographic discipline.
