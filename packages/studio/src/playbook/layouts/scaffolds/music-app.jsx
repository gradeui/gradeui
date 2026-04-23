import {
  AppShell, AppShellNav, AppShellMain,
  Stack, Row,
  Button, Card, CardContent, Separator, Input,
  MediaSurface, Avatar, AvatarFallback,
} from "@gradeui/ui";
import {
  Home, Search, Library, Heart, PlusCircle,
  Play, ChevronRight,
} from "lucide-react";

export default function App() {
  const shelf1 = [
    { title: "Midnight Memories", artist: "One Direction" },
    { title: "Currents", artist: "Tame Impala" },
    { title: "In Rainbows", artist: "Radiohead" },
    { title: "AM", artist: "Arctic Monkeys" },
    { title: "Random Access Memories", artist: "Daft Punk" },
    { title: "Funeral", artist: "Arcade Fire" },
  ];
  const shelf2 = [
    { title: "Daily Mix 1", artist: "For you" },
    { title: "Discover Weekly", artist: "Made for you" },
    { title: "Chill Focus", artist: "Atmospheric" },
    { title: "Deep House", artist: "Built for nights" },
    { title: "Morning Coffee", artist: "Soft start" },
    { title: "Workout Energy", artist: "High BPM" },
  ];
  const shelf3 = [
    { title: "Rumours", artist: "Fleetwood Mac" },
    { title: "Blue", artist: "Joni Mitchell" },
    { title: "Pet Sounds", artist: "The Beach Boys" },
    { title: "Songs in the Key of Life", artist: "Stevie Wonder" },
    { title: "To Pimp a Butterfly", artist: "Kendrick Lamar" },
    { title: "Blonde", artist: "Frank Ocean" },
  ];
  return (
    <AppShell nav="side" className="min-h-screen bg-background">
      <AppShellNav placement="side" className="w-60 border-r bg-muted/20">
        <Stack gap="md" className="p-4">
          <Stack gap="xs">
            <Button variant="secondary" size="sm" className="justify-start gap-2">
              <Home className="h-4 w-4" /> Home
            </Button>
            <Button variant="ghost" size="sm" className="justify-start gap-2">
              <Search className="h-4 w-4" /> Search
            </Button>
            <Button variant="ghost" size="sm" className="justify-start gap-2">
              <Library className="h-4 w-4" /> Your Library
            </Button>
          </Stack>
          <Separator />
          <Stack gap="xs">
            <Button variant="ghost" size="sm" className="justify-start gap-2">
              <PlusCircle className="h-4 w-4" /> Create playlist
            </Button>
            <Button variant="ghost" size="sm" className="justify-start gap-2">
              <Heart className="h-4 w-4" /> Liked Songs
            </Button>
          </Stack>
          <Separator />
          <Stack gap="xs">
            {["Late Night Drive", "Rainy Sundays", "Workout Mix", "Jazz Essentials", "Indie Folk"].map((p) => (
              <Button key={p} variant="ghost" size="sm" className="justify-start text-muted-foreground font-normal">
                {p}
              </Button>
            ))}
          </Stack>
        </Stack>
      </AppShellNav>
      <AppShellMain className="p-6">
        <Stack gap="xl">
          <Row justify="between" align="center">
            <Stack gap="xs">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Good evening</span>
              <h1 className="text-3xl font-semibold">Welcome back</h1>
            </Stack>
            <Avatar><AvatarFallback>AL</AvatarFallback></Avatar>
          </Row>
          {[
            { title: "Recently played", items: shelf1 },
            { title: "Made for you", items: shelf2 },
            { title: "Your top albums", items: shelf3 },
          ].map((s) => (
            <Stack key={s.title} gap="md">
              <Row justify="between" align="end">
                <h2 className="text-xl font-semibold">{s.title}</h2>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  See all <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </Row>
              <div className="overflow-x-auto -mx-6 px-6 pb-2">
                <Row gap="md" align="start" className="min-w-min">
                  {s.items.map((a) => (
                    <Card key={a.title} className="w-40 shrink-0 overflow-hidden group">
                      <MediaSurface
                        aspect="square"
                        radius="none"
                        className="relative bg-gradient-to-br from-primary/40 via-accent/20 to-muted"
                      >
                        <Button
                          size="icon"
                          className="absolute bottom-2 right-2 h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 shadow-lg"
                        >
                          <Play className="h-4 w-4 fill-current" />
                        </Button>
                      </MediaSurface>
                      <CardContent className="p-3">
                        <Stack gap="xs">
                          <span className="text-sm font-medium truncate">{a.title}</span>
                          <span className="text-xs text-muted-foreground truncate">{a.artist}</span>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Row>
              </div>
            </Stack>
          ))}
        </Stack>
      </AppShellMain>
    </AppShell>
  );
}
