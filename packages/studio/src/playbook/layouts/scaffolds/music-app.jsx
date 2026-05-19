import {
  AppShell, AppShellNav, AppShellMain,
  Stack, Row,
  Button, Card, CardContent, Separator, Input,
  MediaSurface, Avatar, AvatarFallback,
  Sidebar, SidebarHeader, SidebarContent, SidebarSection, SidebarItem,
} from "@gradeui/ui";
import {
  Home, Search, Library, Heart, PlusCircle,
  Play, ChevronRight, ListMusic,
} from "lucide-react";

export default function App() {
  // Each entry has a stable `id`. Studio's starter picker rewrites
  // these to fresh nanoids on every scaffold instantiation so two
  // music-apps don't share keys. The settings panel uses `id` to
  // find the right entry when the user clicks one of the rendered
  // cards and edits its alt / source / artist / title — per-item
  // mutation, not template-wide.
  const shelf1 = [
    { id: "alb-mm", title: "Midnight Memories", artist: "One Direction" },
    { id: "alb-cu", title: "Currents", artist: "Tame Impala" },
    { id: "alb-ir", title: "In Rainbows", artist: "Radiohead" },
    { id: "alb-am", title: "AM", artist: "Arctic Monkeys" },
    { id: "alb-ra", title: "Random Access Memories", artist: "Daft Punk" },
    { id: "alb-fu", title: "Funeral", artist: "Arcade Fire" },
  ];
  const shelf2 = [
    { id: "alb-d1", title: "Daily Mix 1", artist: "For you" },
    { id: "alb-dw", title: "Discover Weekly", artist: "Made for you" },
    { id: "alb-cf", title: "Chill Focus", artist: "Atmospheric" },
    { id: "alb-dh", title: "Deep House", artist: "Built for nights" },
    { id: "alb-mc", title: "Morning Coffee", artist: "Soft start" },
    { id: "alb-we", title: "Workout Energy", artist: "High BPM" },
  ];
  const shelf3 = [
    { id: "alb-ru", title: "Rumours", artist: "Fleetwood Mac" },
    { id: "alb-bl", title: "Blue", artist: "Joni Mitchell" },
    { id: "alb-ps", title: "Pet Sounds", artist: "The Beach Boys" },
    { id: "alb-sk", title: "Songs in the Key of Life", artist: "Stevie Wonder" },
    { id: "alb-tb", title: "To Pimp a Butterfly", artist: "Kendrick Lamar" },
    { id: "alb-bo", title: "Blonde", artist: "Frank Ocean" },
  ];
  return (
    <AppShell nav="side" className="min-h-screen bg-background">
      <AppShellNav placement="side">
        {/* Compound Sidebar — three sections: top-level nav, library
            actions, the playlist list. Each section is collapsible by
            default; the playlists section uses .map() over a string[]. */}
        <Sidebar collapsible={false}>
          <SidebarContent>
            <SidebarSection collapsible={false}>
              <SidebarItem asButton icon={<Home />} active>Home</SidebarItem>
              <SidebarItem asButton icon={<Search />}>Search</SidebarItem>
              <SidebarItem asButton icon={<Library />}>Your Library</SidebarItem>
            </SidebarSection>
            <SidebarSection collapsible={false}>
              <SidebarItem asButton icon={<PlusCircle />}>Create playlist</SidebarItem>
              <SidebarItem asButton icon={<Heart />}>Liked Songs</SidebarItem>
            </SidebarSection>
            <SidebarSection title="Playlists">
              {["Late Night Drive", "Rainy Sundays", "Workout Mix", "Jazz Essentials", "Indie Folk"].map((p) => (
                <SidebarItem key={p} asButton icon={<ListMusic />}>
                  {p}
                </SidebarItem>
              ))}
            </SidebarSection>
          </SidebarContent>
        </Sidebar>
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
                    <Card key={a.id} className="w-40 shrink-0 overflow-hidden group">
                      <MediaSurface
                        instanceId={a.id}
                        hint={a.hint ?? "album"}
                        alt={a.alt ?? `${a.title} — ${a.artist}`}
                        source={a.source ?? { kind: "album", artist: a.artist, title: a.title }}
                        // `a.src` is set by Studio's Fill button (writes the
                        // resolved URL into the data entry). When unset, the
                        // MediaSurface falls through to its size-tiered
                        // placeholder. The data array IS the storage — JSX
                        // is self-contained, no parallel URL map needed.
                        src={a.src ?? undefined}
                        radius={a.radius ?? "none"}
                        overlay={
                          <Button
                            size="icon"
                            className="absolute bottom-2 right-2 h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 shadow-lg"
                          >
                            <Play className="h-4 w-4 fill-current" />
                          </Button>
                        }
                      />
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
