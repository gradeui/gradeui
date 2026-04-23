import {
  AppShell, AppShellMain,
  Stack, Row, Grid,
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Badge, Separator,
} from "@gradeui/ui";
import confetti from "canvas-confetti";
import { PartyPopper, Sparkles, Heart, Star } from "lucide-react";

// Build the custom SVG shapes ONCE at module scope. `shapeFromPath` has
// a non-trivial cost per call (it parses the path, rasterises it to a
// mask, and caches the bitmap for the particle renderer) so doing it
// inside an onClick would burn that work on every press. Paths live in
// a 100×100 viewbox; canvas-confetti normalises to the `scalar` option.
const STAR = confetti.shapeFromPath({
  path: "M50 0 L61 35 L100 35 L68 57 L79 91 L50 70 L21 91 L32 57 L0 35 L39 35 Z",
});
const HEART = confetti.shapeFromPath({
  path: "M50 90 C25 70 0 50 0 28 C0 14 14 0 28 0 C38 0 46 6 50 14 C54 6 62 0 72 0 C86 0 100 14 100 28 C100 50 75 70 50 90 Z",
});
const BOLT = confetti.shapeFromPath({
  path: "M60 0 L10 60 L45 60 L35 100 L95 35 L55 35 L75 0 Z",
});

// Emoji-as-shape is the low-effort partner to SVG paths. Same `shapes`
// slot, just produced by `shapeFromText`. Scalar 2 reads legibly at the
// default particle size without dominating the mix.
const EMOJI = [
  confetti.shapeFromText({ text: "🎉", scalar: 2 }),
  confetti.shapeFromText({ text: "✨", scalar: 2 }),
];

// Theme-aware colour pulls. canvas-confetti accepts any CSS colour,
// including `hsl()` / `oklch()` — but at draw time it reads `colors` as
// literals, not as CSS vars the theme could swap mid-animation. Pulling
// them through `getComputedStyle` at fire time keeps the burst on-brand
// even after a theme change.
function readThemeColors() {
  if (typeof window === "undefined") return undefined;
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  // These vars ship as raw oklch triplets (e.g. "0.72 0.18 290"), so we
  // wrap them in oklch() to form valid CSS colours. Falls back to a
  // neutral trio if the doc doesn't have them yet.
  const pick = (v) => {
    const raw = cs.getPropertyValue(v).trim();
    return raw ? `oklch(${raw})` : null;
  };
  const colors = ["--primary", "--accent", "--secondary", "--chart-1", "--chart-2", "--chart-3"]
    .map(pick)
    .filter(Boolean);
  return colors.length ? colors : undefined;
}

export default function App() {
  const fireMix = () => {
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.7 },
      shapes: [STAR, HEART, BOLT, ...EMOJI],
      scalar: 1.1,
      ticks: 180,
      colors: readThemeColors(),
    });
  };

  const fireStars = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      shapes: [STAR],
      scalar: 1.3,
      ticks: 220,
      gravity: 0.8,
      colors: readThemeColors(),
    });
  };

  const fireHearts = () => {
    // Two angled shots from the bottom corners — reads more like a
    // wedding cannon than a straight overhead burst.
    const base = {
      particleCount: 50,
      startVelocity: 45,
      spread: 55,
      shapes: [HEART],
      scalar: 1.4,
      ticks: 200,
      colors: readThemeColors(),
    };
    confetti({ ...base, origin: { x: 0, y: 0.9 }, angle: 60 });
    confetti({ ...base, origin: { x: 1, y: 0.9 }, angle: 120 });
  };

  const fireRipple = () => {
    // Sustained low-intensity rain for ~1s — great for background
    // ambience while a "success" card animates in.
    const end = Date.now() + 1000;
    (function frame() {
      confetti({
        particleCount: 3,
        angle: 90,
        spread: 140,
        origin: { x: 0.5, y: 0 },
        startVelocity: 10,
        gravity: 0.5,
        shapes: EMOJI,
        scalar: 1.5,
        ticks: 200,
        colors: readThemeColors(),
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  };

  return (
    <AppShell nav="none" className="min-h-screen bg-background">
      <AppShellMain className="flex items-center justify-center p-6">
        <Stack gap="lg" className="w-full max-w-2xl">
          <Stack gap="sm" className="text-center">
            <Row gap="sm" justify="center">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                canvas-confetti demo
              </Badge>
            </Row>
            <h1 className="text-3xl font-semibold tracking-tight">
              Celebrate something
            </h1>
            <p className="text-sm text-muted-foreground">
              Custom SVG shapes, theme-aware colours, and a few preset recipes.
              Every burst is a single <code className="font-mono text-[11px] px-1 py-0.5 bg-muted rounded">confetti(...)</code> call.
            </p>
          </Stack>

          <Card>
            <CardHeader>
              <CardTitle>Try it</CardTitle>
              <CardDescription>
                Four recipes, same library. Each pulls brand colours from the
                active theme — flip themes and the confetti follows.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Grid cols="2" gap="md">
                <RecipeButton
                  icon={<PartyPopper className="h-4 w-4" />}
                  label="Mixed shapes"
                  sub="Stars · hearts · bolts · emoji"
                  onClick={fireMix}
                />
                <RecipeButton
                  icon={<Star className="h-4 w-4" />}
                  label="Stars only"
                  sub="Slow gravity, higher scalar"
                  onClick={fireStars}
                />
                <RecipeButton
                  icon={<Heart className="h-4 w-4" />}
                  label="Side cannons"
                  sub="Two angled bursts from the corners"
                  onClick={fireHearts}
                />
                <RecipeButton
                  icon={<Sparkles className="h-4 w-4" />}
                  label="Gentle rain"
                  sub="1-second sustained drift"
                  onClick={fireRipple}
                />
              </Grid>
            </CardContent>
            <Separator />
            <CardFooter>
              <Row gap="sm" justify="between" align="center" className="w-full">
                <span className="text-xs text-muted-foreground">
                  Shapes are built once at module scope — cheap to re-fire.
                </span>
                <Button onClick={fireMix}>
                  <PartyPopper className="h-4 w-4 mr-1" />
                  Celebrate
                </Button>
              </Row>
            </CardFooter>
          </Card>
        </Stack>
      </AppShellMain>
    </AppShell>
  );
}

function RecipeButton({ icon, label, sub, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-3 text-left hover:border-primary/60 hover:bg-muted/40 transition-colors"
    >
      <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </span>
      <Stack gap="none" className="min-w-0 flex-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground truncate">{sub}</span>
      </Stack>
    </button>
  );
}
