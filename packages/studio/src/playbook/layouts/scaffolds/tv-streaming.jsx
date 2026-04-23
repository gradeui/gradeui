import {
  AppShell, AppShellNav, AppShellMain,
  Stack, Row,
  Button, Card, CardContent,
  MediaSurface, Avatar, AvatarFallback, Badge,
} from "@gradeui/ui";
import { Play, Plus, Search, Tv } from "lucide-react";

export default function App() {
  const continueWatching = [
    { title: "Severance", subtitle: "S2 · E4", badge: "Episode 4" },
    { title: "Foundation", subtitle: "S3 · E1", badge: "New" },
    { title: "Slow Horses", subtitle: "S3 · E6", badge: "Episode 6" },
    { title: "Silo", subtitle: "S1 · E9", badge: "Episode 9" },
    { title: "For All Mankind", subtitle: "S4 · E2", badge: "Episode 2" },
    { title: "Ted Lasso", subtitle: "S2 · E8", badge: "Episode 8" },
  ];
  const originals = [
    { title: "Shrinking", subtitle: "Comedy" },
    { title: "The Morning Show", subtitle: "Drama" },
    { title: "Pachinko", subtitle: "Epic" },
    { title: "Bad Sisters", subtitle: "Thriller" },
    { title: "The Afterparty", subtitle: "Mystery" },
    { title: "Dickinson", subtitle: "Period" },
  ];
  const films = [
    { title: "CODA", subtitle: "2021" },
    { title: "Killers of the Flower Moon", subtitle: "2023" },
    { title: "Napoleon", subtitle: "2023" },
    { title: "The Banker", subtitle: "2020" },
    { title: "Emancipation", subtitle: "2022" },
    { title: "Greyhound", subtitle: "2020" },
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
          <MediaSurface
            aspect="wide"
            radius="none"
            className="relative bg-gradient-to-br from-primary/60 via-accent/30 to-background"
          >
            <Stack gap="md" className="absolute inset-0 flex flex-col justify-end p-10 max-w-2xl">
              <Badge variant="outline" className="w-fit bg-background/40 backdrop-blur">Apple Original</Badge>
              <h1 className="text-5xl font-semibold tracking-tight">Severance</h1>
              <span className="text-sm text-muted-foreground">
                A team of office workers whose memories have been surgically divided
                between their work and personal lives discover a dangerous truth.
              </span>
              <Row gap="sm" align="center">
                <Button size="lg" className="gap-2">
                  <Play className="h-4 w-4 fill-current" /> Play S2 · E4
                </Button>
                <Button variant="secondary" size="lg" className="gap-2">
                  <Plus className="h-4 w-4" /> Watchlist
                </Button>
              </Row>
            </Stack>
          </MediaSurface>
          <Stack gap="xl" className="px-6">
            {[
              { title: "Continue watching", items: continueWatching, aspect: "wide" },
              { title: "Apple Originals", items: originals, aspect: "portrait" },
              { title: "Must-see films", items: films, aspect: "portrait" },
            ].map((shelf) => (
              <Stack key={shelf.title} gap="md">
                <h2 className="text-xl font-semibold">{shelf.title}</h2>
                <div className="overflow-x-auto -mx-6 px-6 pb-2">
                  <Row gap="md" align="start" className="min-w-min">
                    {shelf.items.map((item) => (
                      <Card
                        key={item.title}
                        className={`shrink-0 overflow-hidden group ${shelf.aspect === "wide" ? "w-72" : "w-44"}`}
                      >
                        <MediaSurface
                          aspect={shelf.aspect}
                          radius="none"
                          className="relative bg-gradient-to-br from-primary/40 via-muted to-accent/20"
                        >
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
                        </MediaSurface>
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
