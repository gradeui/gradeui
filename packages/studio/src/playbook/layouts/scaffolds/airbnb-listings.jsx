import {
  AppShell, AppShellNav, AppShellMain,
  Stack, Row,
  Card, CardTitle, CardDescription, CardContent,
  Button, Badge, Input,
  Select, SelectTrigger, SelectContent, SelectValue, SelectItem,
  DateRangePicker,
  MediaSurface,
  Map, MapMarker,
} from "@gradeui/ui";
import { useRef, useState } from "react";
import { Star, Search, Sliders } from "lucide-react";

// SF listings. Coords are [lng, lat] — the @gradeui/ui Map convention.
// `hue` is a tinted-gradient stand-in for a real photo since the Sandpack
// sandbox has no asset pipeline; consumers swap MediaSurface for an <img>
// tag (or the future `<Image src>` slot) when wiring real data.
const LISTINGS = [
  { id: "soma",      title: "Sunlit SoMa loft",       price: 220, rating: 4.92, beds: "2 beds · 1 bath",  coords: [-122.396, 37.78],   tag: "Guest favorite" },
  { id: "mission",   title: "Mission garden flat",    price: 165, rating: 4.86, beds: "1 bed · 1 bath",   coords: [-122.418, 37.7595], tag: "20% off" },
  { id: "hayes",     title: "Hayes Valley studio",    price: 140, rating: 4.78, beds: "Studio",           coords: [-122.426, 37.7765] },
  { id: "marina",    title: "Marina bay-view 2BR",    price: 285, rating: 4.95, beds: "2 beds · 2 baths", coords: [-122.437, 37.802],  tag: "Rare find" },
  { id: "castro",    title: "Castro Victorian",       price: 198, rating: 4.81, beds: "2 beds · 1 bath",  coords: [-122.435, 37.762],  tag: "Superhost" },
  { id: "chinatown", title: "Chinatown corner suite", price: 175, rating: 4.74, beds: "1 bed · 1 bath",   coords: [-122.408, 37.794] },
];

export default function App() {
  // Two interactions, two responsibilities:
  //   - hovered (controlled, synced two-way via Map's `hoveredId` prop)
  //     drives the visual highlight on both sides — card ring + marker
  //     scale/variant change.
  //   - mapRef + onClick handler drives navigation. Clicking a card
  //     calls mapRef.current.flyTo(id, ...) — the imperative path is for
  //     deliberate "take me there", not for hover scrubbing.
  // This split avoids the trap where every list hover thrashes the map.
  const [hovered, setHovered] = useState(null);
  const [dates, setDates] = useState();
  const mapRef = useRef(null);

  const focusListing = (id) => {
    setHovered(id);
    mapRef.current?.flyTo(id, { zoom: 14, durationMs: 700 });
  };

  return (
    <AppShell nav="top" className="h-screen bg-background">
      <AppShellNav placement="top" className="border-b bg-card">
        <Row justify="between" align="center" className="px-6 py-3">
          <Row gap="lg" align="center">
            <span className="text-base font-semibold tracking-tight">stays.</span>
            <div className="relative w-72 hidden md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="San Francisco, CA" className="pl-8" />
            </div>
          </Row>
          <Row gap="sm" align="center">
            {/* Inline filters — date / guests / type — only visible at md+
                widths where they actually fit. On narrow viewports they
                collapse into the single Filters button (canonical mobile
                pattern: tap to open a sheet/dialog with the full set). */}
            <Row gap="sm" align="center" className="hidden md:flex">
              <DateRangePicker value={dates} onChange={setDates} numberOfMonths={2} />
              <Select defaultValue="any">
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any guests</SelectItem>
                  <SelectItem value="1">1 guest</SelectItem>
                  <SelectItem value="2">2 guests</SelectItem>
                  <SelectItem value="4">4+ guests</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="any-type">
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any-type">Any type</SelectItem>
                  <SelectItem value="entire">Entire place</SelectItem>
                  <SelectItem value="private">Private room</SelectItem>
                  <SelectItem value="shared">Shared room</SelectItem>
                </SelectContent>
              </Select>
            </Row>
            <Button variant="outline" size="sm">
              <Sliders className="h-4 w-4 mr-1" />Filters
            </Button>
          </Row>
        </Row>
      </AppShellNav>

      <AppShellMain className="overflow-hidden">
        <div className="h-full flex flex-col md:flex-row">
        <Stack gap="md" className="flex-1 md:flex-initial md:w-1/2 lg:w-2/5 md:shrink-0 min-h-0 overflow-y-auto p-6">
          <Row justify="between" align="center">
            <Stack gap="xs">
              <h1 className="text-xl font-semibold">{LISTINGS.length} stays in San Francisco</h1>
              <span className="text-sm text-muted-foreground">Hover a card to highlight it on the map</span>
            </Stack>
            <Badge variant="secondary" className="hidden md:inline-flex">Map view</Badge>
          </Row>
          <Stack gap="md">
            {LISTINGS.map((l) => (
              <Card
                key={l.id}
                onMouseEnter={() => setHovered(l.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => focusListing(l.id)}
                className={"cursor-pointer rounded-lg overflow-hidden transition-all " + (hovered === l.id ? "ring-2 ring-primary shadow-lg" : "")}
              >
                {/* Tight card layout — `align="start"` (not "stretch") so
                    the square MediaSurface keeps its 1:1 aspect instead
                    of being stretched to match the content column's
                    height. Fixed `w-N h-N` pair forces the square. */}
                <Row gap="sm" align="start" className="p-2">
                  <MediaSurface
                    instanceId={l.id}
                    hint={l.hint ?? "landscape"}
                    alt={l.alt ?? `${l.title} listing photo`}
                    source={l.source ?? { kind: "landscape", location: `${l.title}, San Francisco`, mood: "interior" }}
                    src={l.src ?? undefined}
                    aspect={l.aspect ?? "square"}
                    radius={l.radius ?? "sm"}
                    className="w-20 h-20 lg:w-24 lg:h-24 shrink-0"
                    overlay={
                      l.tag ? (
                        <Badge
                          variant="default"
                          className="absolute top-1 left-1 text-xs px-1.5 py-0 shadow-sm pointer-events-none"
                        >
                          {l.tag}
                        </Badge>
                      ) : null
                    }
                  />
                  <Stack gap="none" className="flex-1 min-w-0 py-1">
                    <Row justify="between" align="start" gap="sm">
                      <CardTitle className="text-sm font-semibold truncate">{l.title}</CardTitle>
                      <Row gap="xs" align="center" className="shrink-0">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-xs">{l.rating}</span>
                      </Row>
                    </Row>
                    <CardDescription className="text-xs">{l.beds}</CardDescription>
                    <Row gap="xs" align="baseline" className="mt-1">
                      <span className="text-sm font-semibold">${l.price}</span>
                      <span className="text-xs text-muted-foreground">/ night</span>
                    </Row>
                  </Stack>
                </Row>
              </Card>
            ))}
          </Stack>
        </Stack>

        <div className="flex-1 min-h-0 min-w-0">
        <Map
          ref={mapRef}
          center={[-122.42, 37.78]}
          zoom={12}
          hoveredId={hovered}
          onHoveredIdChange={setHovered}
          className="h-full w-full"
        >
          {LISTINGS.map((l) => {
            const isActive = hovered === l.id;
            return (
              <MapMarker key={l.id} id={l.id} at={l.coords}>
                <Badge
                  variant={isActive ? "default" : "secondary"}
                  className={
                    "shadow-lg cursor-pointer transition-transform " +
                    (isActive ? "scale-125 ring-2 ring-primary" : "")
                  }
                >
                  ${l.price}
                </Badge>
              </MapMarker>
            );
          })}
        </Map>
        </div>
        </div>
      </AppShellMain>
    </AppShell>
  );
}
