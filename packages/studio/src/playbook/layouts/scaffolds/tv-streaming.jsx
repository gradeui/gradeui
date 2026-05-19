import {
  AppShell, AppShellNav, AppShellMain,
  Stack, Row,
  Button, Card, CardContent,
  MediaSurface, Avatar, AvatarFallback, Badge,
  Carousel,
} from "@gradeui/ui";
import { Play, Plus, Search, Tv } from "lucide-react";

export default function App() {
  // Same data-driven shape as the music-app scaffold:
  //   - every entry has a stable `id` (Studio's starter picker rewrites
  //     these to fresh nanoids on every scaffold instantiation),
  //   - MediaSurfaces below read `instanceId={x.id}` so per-item edits
  //     and per-item Fill writes target the right row,
  //   - `src={x.src ?? undefined}` lets the Fill button cement resolved
  //     URLs directly into the data array. JSX is the source of truth.
  // Featured row — rotates through three hero slides on autoplay. The
  // first slide is a still (8s hold); the second is the same shape but
  // a different title (5s hold); the third demonstrates VideoSlide —
  // when it becomes the active slide the muted trailer plays. Each
  // entry has a stable `id` so Studio's per-instance editor (and the
  // Fill button) targets the right row.
  const featured = [
    {
      id: "feat-severance",
      title: "Severance",
      year: 2022,
      badge: "Apple Original",
      headline: "Severance",
      copy:
        "A team of office workers whose memories have been surgically divided between their work and personal lives discover a dangerous truth.",
      cta: "Play S2 · E4",
      duration: 8000,
    },
    {
      id: "feat-foundation",
      title: "Foundation",
      year: 2023,
      badge: "New season",
      headline: "Foundation · Season 3",
      copy:
        "Across the galaxy, a mathematician's prediction sets in motion a thousand-year plan to save civilisation from collapse.",
      cta: "Watch S3 · E1",
      duration: 6000,
    },
    {
      id: "feat-the-studio",
      title: "The Studio",
      year: 2025,
      badge: "Official trailer",
      headline: "The Studio",
      copy:
        "Inside Continental Studios, a newly-promoted exec navigates ego, art, commerce — and the slow death of the silver screen.",
      cta: "Play trailer",
      // VideoSlide — `videoSrc` triggers the VideoSlide branch below.
      // Poster is whatever the image-gen pipeline resolves into `src`.
      videoSrc: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    },
  ];
  const continueWatching = [
    { id: "cw-severance", title: "Severance", subtitle: "S2 · E4", badge: "Episode 4" },
    { id: "cw-foundation", title: "Foundation", subtitle: "S3 · E1", badge: "New" },
    { id: "cw-slow-horses", title: "Slow Horses", subtitle: "S3 · E6", badge: "Episode 6" },
    { id: "cw-silo", title: "Silo", subtitle: "S1 · E9", badge: "Episode 9" },
    { id: "cw-for-all-mankind", title: "For All Mankind", subtitle: "S4 · E2", badge: "Episode 2" },
    { id: "cw-ted-lasso", title: "Ted Lasso", subtitle: "S2 · E8", badge: "Episode 8" },
  ];
  const originals = [
    { id: "or-shrinking", title: "Shrinking", subtitle: "Comedy" },
    { id: "or-morning-show", title: "The Morning Show", subtitle: "Drama" },
    { id: "or-pachinko", title: "Pachinko", subtitle: "Epic" },
    { id: "or-bad-sisters", title: "Bad Sisters", subtitle: "Thriller" },
    { id: "or-afterparty", title: "The Afterparty", subtitle: "Mystery" },
    { id: "or-dickinson", title: "Dickinson", subtitle: "Period" },
  ];
  const films = [
    { id: "fl-coda", title: "CODA", subtitle: "2021" },
    { id: "fl-killers", title: "Killers of the Flower Moon", subtitle: "2023" },
    { id: "fl-napoleon", title: "Napoleon", subtitle: "2023" },
    { id: "fl-banker", title: "The Banker", subtitle: "2020" },
    { id: "fl-emancipation", title: "Emancipation", subtitle: "2022" },
    { id: "fl-greyhound", title: "Greyhound", subtitle: "2020" },
  ];
  return (
    <AppShell nav="top" className="min-h-screen bg-background">
      <AppShellNav placement="top" className="border-b">
        <Row justify="between" align="center" className="px-6 py-3">
          <Row gap="lg" align="center">
            <Row gap="xs" align="center">
              <Tv className="h-5 w-5 text-primary" />
              <span className="text-base font-semibold">Grade+</span>
            </Row>
            <Row gap="sm">
              {["Home", "Movies", "TV Shows", "Sports", "Kids", "Library"].map((n, i) => (
                <Button key={n} variant={i === 0 ? "secondary" : "ghost"} size="sm">
                  {n}
                </Button>
              ))}
            </Row>
          </Row>
          <Row gap="sm" align="center">
            <Button variant="ghost" size="icon"><Search className="h-4 w-4" /></Button>
            <Avatar><AvatarFallback>AL</AvatarFallback></Avatar>
          </Row>
        </Row>
      </AppShellNav>
      <AppShellMain>
        <Stack gap="xl" className="pb-10">
          {/* Featured carousel — full-bleed hero rotation. Mixes still
              slides (each with its own `duration` for autoplay timing)
              with VideoSlides that autoplay muted+loop when active.
              Dots overlay the bottom-left, arrows overlay the sides. */}
          <Carousel
            autoplay={{ delay: 7000, pauseOnHover: true, pauseWhenOffscreen: true }}
            loop
            align="start"
            data-tv-featured
          >
            {featured.map((hero) =>
              hero.videoSrc ? (
                <Carousel.VideoSlide
                  key={hero.id}
                  src={hero.videoSrc}
                  poster={hero.src}
                  alt={hero.alt ?? `${hero.title} — official trailer`}
                  fit="cover"
                  className="aspect-[21/9]"
                />
              ) : (
                <Carousel.Slide key={hero.id} duration={hero.duration}>
                  <MediaSurface
                    instanceId={hero.id}
                    hint={hero.hint ?? "tv-show"}
                    alt={hero.alt ?? `${hero.title} — featured hero`}
                    source={hero.source ?? { kind: "tv-show", title: hero.title, year: hero.year }}
                    src={hero.src ?? undefined}
                    aspect={hero.aspect ?? "wide"}
                    radius={hero.radius ?? "none"}
                    overlay={
                      <Stack justify="end" gap="md" className="absolute inset-0 p-10 max-w-2xl">
                        <Badge variant="outline" className="w-fit bg-background/40 backdrop-blur">{hero.badge}</Badge>
                        <h1 className="text-5xl font-semibold tracking-tight">{hero.headline}</h1>
                        <span className="text-sm text-muted-foreground">{hero.copy}</span>
                        <Row gap="sm" align="center">
                          <Button size="lg" className="gap-2">
                            <Play className="h-4 w-4 fill-current" /> {hero.cta}
                          </Button>
                          <Button variant="secondary" size="lg" className="gap-2">
                            <Plus className="h-4 w-4" /> Watchlist
                          </Button>
                        </Row>
                      </Stack>
                    }
                  />
                </Carousel.Slide>
              )
            )}
            <Carousel.Arrows />
            <Carousel.Dots position="overlay" />
          </Carousel>
          <Stack gap="xl" className="px-6">
            {[
              // Continue watching uses episode stills (wide) so `hint="landscape"`
              // matches the framing. TV shows and films get their concrete
              // hints (`tv-show`, `movie`) so the TMDb provider routes them
              // to real posters rather than falling through to Picsum.
              { title: "Continue watching", items: continueWatching, hint: "landscape", sourceKind: "tv-show" },
              { title: "Apple Originals", items: originals, hint: "tv-show", sourceKind: "tv-show" },
              { title: "Must-see films", items: films, hint: "movie", sourceKind: "movie" },
            ].map((shelf) => (
              <Stack key={shelf.title} gap="md">
                <h2 className="text-xl font-semibold">{shelf.title}</h2>
                <div className="overflow-x-auto -mx-6 px-6 pb-2">
                  <Row gap="md" align="start" className="min-w-min">
                    {shelf.items.map((item) => (
                      <Card
                        key={item.id}
                        className={`shrink-0 overflow-hidden group ${shelf.hint === "landscape" ? "w-72" : "w-44"}`}
                      >
                        <MediaSurface
                          instanceId={item.id}
                          hint={item.hint ?? shelf.hint}
                          alt={item.alt ?? `${item.title} — ${item.subtitle}`}
                          source={item.source ?? { kind: shelf.sourceKind, title: item.title }}
                          src={item.src ?? undefined}
                          radius={item.radius ?? "none"}
                          overlay={
                            <>
                              {"badge" in item && (
                                <Badge className="absolute top-2 left-2 bg-background/80 backdrop-blur text-foreground">
                                  {item.badge}
                                </Badge>
                              )}
                              <Button
                                size="icon"
                                className="absolute bottom-2 right-2 h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 shadow-lg"
                              >
                                <Play className="h-4 w-4 fill-current" />
                              </Button>
                            </>
                          }
                        />
                        <CardContent className="p-3">
                          <Stack gap="xs">
                            <span className="text-sm font-medium truncate">{item.title}</span>
                            <span className="text-xs text-muted-foreground truncate">{item.subtitle}</span>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Row>
                </div>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </AppShellMain>
    </AppShell>
  );
}
