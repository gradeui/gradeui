"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { ComponentPreview } from "@/components/component-preview";
import { Map, MapMarker } from "@/components/ui/map";
import { PropsTable } from "@/components/props-table";

const mapProps = [
  {
    name: "provider",
    type: '"maplibre" | "mapbox" | "google"',
    default: '"maplibre"',
    description:
      "Which map engine to load. Default MapLibre uses MapTiler tiles via a referrer-locked Grade demo key — works zero-config on gradeui.com / localhost.",
  },
  {
    name: "center",
    type: "[lng: number, lat: number]",
    default: "—",
    description:
      "Required. Map viewport center. Always [lng, lat] tuple — even Google's adapter normalises internally.",
  },
  {
    name: "zoom",
    type: "number",
    default: "—",
    description: "Required. 0 (whole world) — 22 (street level).",
  },
  {
    name: "bounds",
    type: "[Coords, Coords]",
    default: "-",
    description:
      "[southwest, northeast]. Takes precedence over center+zoom when set.",
  },
  {
    name: "appearance",
    type: '"light" | "dark" | "satellite" | "auto"',
    default: '"auto"',
    description:
      '"auto" follows GradeThemeProvider mode. Each provider ships curated default styles per appearance — token → style-spec generation is a v1 follow-up.',
  },
  {
    name: "interactive",
    type: "boolean",
    default: "true",
    description: "Set false to disable pan / zoom / rotate (static display).",
  },
  {
    name: "hoveredId",
    type: "string | null",
    default: "-",
    description:
      "Controlled. The matching MapMarker gets data-gds-state=\"hovered\" automatically. Pair with onHoveredIdChange for two-way list↔map sync.",
  },
  {
    name: "onHoveredIdChange",
    type: "(id: string | null) => void",
    default: "-",
    description: "Fires when the user hovers / unhovers a MapMarker.",
  },
  {
    name: "onLoad",
    type: "(handle: MapHandle) => void",
    default: "-",
    description:
      "Called once after the map and its first style have loaded. The handle exposes flyTo, panTo, fitBounds, getCenter, getZoom, getBounds, instance.",
  },
  {
    name: "onError",
    type: "(error: MapError) => void",
    default: "-",
    description:
      'Surfaces SDK-missing, api-key-missing, provider-init-failed, style-load-failed, tile-load-failed.',
  },
  {
    name: "tilerKey",
    type: "string",
    default: "Grade demo key",
    description:
      'provider="maplibre" only. Required off gradeui.com / localhost; the bundled demo key is referrer-locked.',
  },
  {
    name: "accessToken",
    type: "string",
    default: "—",
    description: 'provider="mapbox" only. Required.',
  },
  {
    name: "apiKey",
    type: "string",
    default: "—",
    description: 'provider="google" only. Required.',
  },
];

const mapMarkerProps = [
  {
    name: "id",
    type: "string",
    default: "—",
    description:
      "Required. Used by MapHandle.flyTo(id) and the Map's hoveredId controlled prop to match the marker.",
  },
  {
    name: "at",
    type: "[lng: number, lat: number]",
    default: "—",
    description: "Required. Marker position. Same [lng, lat] tuple as center.",
  },
  {
    name: "anchor",
    type: '"center" | "bottom"',
    default: '"bottom"',
    description: '"bottom" puts the pin tip at the coord (default). "center" places the visual midpoint at the coord.',
  },
  {
    name: "onClick",
    type: "(e: { id, coords, native: MouseEvent }) => void",
    default: "-",
    description: "Fires on marker click. Receives the id, current coords, and the native DOM event.",
  },
];

const SF: [number, number] = [-122.4194, 37.7749];

const LISTINGS = [
  { id: "l1", title: "SoMa loft", price: 220, coords: [-122.396, 37.78] as [number, number] },
  { id: "l2", title: "Mission flat", price: 165, coords: [-122.418, 37.7595] as [number, number] },
  { id: "l3", title: "Hayes Valley studio", price: 140, coords: [-122.426, 37.7765] as [number, number] },
  { id: "l4", title: "Marina view", price: 285, coords: [-122.437, 37.802] as [number, number] },
];

function ListingsDemo() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 w-full">
      <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
        {LISTINGS.map((l) => (
          <Card
            key={l.id}
            className={
              "cursor-pointer transition-shadow " +
              (hovered === l.id ? "shadow-lg ring-1 ring-primary/40" : "")
            }
            onMouseEnter={() => setHovered(l.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <CardHeader className="p-4">
              <CardTitle className="text-base">{l.title}</CardTitle>
              <CardDescription>${l.price} / night</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Map
        center={SF}
        zoom={11}
        hoveredId={hovered}
        onHoveredIdChange={setHovered}
        className="h-[420px] w-full"
      >
        {LISTINGS.map((l) => (
          <MapMarker key={l.id} id={l.id} at={l.coords}>
            <Badge>${l.price}</Badge>
          </MapMarker>
        ))}
      </Map>
    </div>
  );
}

export default function MapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Map</h1>
        <p className="text-lg text-muted-foreground mt-2">
          A provider-agnostic map primitive. Switch between MapLibre, Mapbox,
          and Google Maps with one prop. Markers are DOM-rendered so they
          inherit Grade tokens like every other component.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import { Map, MapMarker } from "@gradeui/ui"

// Then install ONE of these — only what you actually use.
// All three SDKs are optional peer deps:
pnpm add maplibre-gl                 // provider="maplibre" (default)
pnpm add mapbox-gl                   // provider="mapbox"
pnpm add @googlemaps/js-api-loader   // provider="google"`}</code>
          </pre>
        </div>
        <p className="text-sm text-muted-foreground">
          The default <code>provider=&quot;maplibre&quot;</code> works
          zero-config on <code>gradeui.com</code> and <code>localhost</code>{" "}
          via a referrer-locked Grade-owned MapTiler key. To use it on any
          other domain, register a free MapTiler key and pass it via{" "}
          <code>tilerKey</code>.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <ComponentPreview
          code={`<Map center={[-122.42, 37.78]} zoom={12}>
  <MapMarker id="hq" at={[-122.42, 37.78]}>
    <Badge>HQ</Badge>
  </MapMarker>
</Map>`}
        >
          <div className="w-full">
            <Map center={SF} zoom={12} className="h-[360px] w-full">
              <MapMarker id="hq" at={SF}>
                <Badge>HQ</Badge>
              </MapMarker>
            </Map>
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">List ↔ map two-way sync</h3>
        <p className="text-sm text-muted-foreground">
          The canonical pattern. Hovering a card highlights the marker;
          hovering a marker highlights the card. Wire it through the
          controlled <code>hoveredId</code> + <code>onHoveredIdChange</code>{" "}
          pair — do not reach for refs and imperative <code>flyTo</code> for
          simple hover sync.
        </p>
        <ComponentPreview
          code={`const [hovered, setHovered] = useState(null);

<Row>
  <Stack>
    {listings.map(l => (
      <Card
        key={l.id}
        onMouseEnter={() => setHovered(l.id)}
        onMouseLeave={() => setHovered(null)}
      >
        <CardHeader>
          <CardTitle>{l.title}</CardTitle>
          <CardDescription>\${l.price} / night</CardDescription>
        </CardHeader>
      </Card>
    ))}
  </Stack>

  <Map
    center={[-122.42, 37.78]}
    zoom={11}
    hoveredId={hovered}
    onHoveredIdChange={setHovered}
  >
    {listings.map(l => (
      <MapMarker key={l.id} id={l.id} at={l.coords}>
        <Badge>\${l.price}</Badge>
      </MapMarker>
    ))}
  </Map>
</Row>`}
        >
          <ListingsDemo />
        </ComponentPreview>

        <h3 className="text-lg font-medium">Static, non-interactive map</h3>
        <ComponentPreview
          code={`<Map
  center={[-0.1276, 51.5074]}
  zoom={10}
  interactive={false}
  appearance="dark"
/>`}
        >
          <Map
            center={[-0.1276, 51.5074]}
            zoom={10}
            interactive={false}
            appearance="dark"
            className="h-[280px] w-full"
          />
        </ComponentPreview>

        <h3 className="text-lg font-medium">Satellite</h3>
        <ComponentPreview
          code={`<Map
  center={[2.3522, 48.8566]}
  zoom={14}
  appearance="satellite"
/>`}
        >
          <Map
            center={[2.3522, 48.8566]}
            zoom={14}
            appearance="satellite"
            className="h-[280px] w-full"
          />
        </ComponentPreview>

        <h3 className="text-lg font-medium">Provider swap — one prop</h3>
        <p className="text-sm text-muted-foreground">
          The component lazy-loads the matching adapter based on{" "}
          <code>provider</code>. Mapbox and Google demos require keys, so
          they're shown as code only here.
        </p>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`// Mapbox — same engine as MapLibre, paid hosted styles + tiles
<Map
  provider="mapbox"
  accessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN!}
  center={[-0.1276, 51.5074]}
  zoom={11}
/>

// Google Maps — uses AdvancedMarkerElement under the hood
<Map
  provider="google"
  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!}
  center={[-0.1276, 51.5074]}
  zoom={11}
/>`}</code>
          </pre>
        </div>

        <h3 className="text-lg font-medium">Imperative ref — fly-to + escape hatch</h3>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`const mapRef = useRef<MapHandle>(null);

<Button onClick={() => mapRef.current?.flyTo("listing-3", { zoom: 15 })}>
  Focus listing 3
</Button>

<Map ref={mapRef} center={...} zoom={...}>
  ...
</Map>

// Escape hatch — reach for the provider-native instance for features
// the wrapper doesn't expose (3D extrusions, drawing tools, heatmaps).
const mapbox = mapRef.current?.instance as mapboxgl.Map;
mapbox.addLayer({ id: "3d-buildings", type: "fill-extrusion", ... });`}</code>
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Provider matrix
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 font-semibold">Provider</th>
                <th className="text-left py-2 pr-4 font-semibold">SDK (peer dep)</th>
                <th className="text-left py-2 pr-4 font-semibold">Requires</th>
                <th className="text-left py-2 font-semibold">Default?</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b">
                <td className="py-2 pr-4 text-foreground"><code>maplibre</code></td>
                <td className="py-2 pr-4"><code>maplibre-gl</code></td>
                <td className="py-2 pr-4">— (Grade demo key on gradeui.com)</td>
                <td className="py-2"><Badge variant="success-soft">Yes</Badge></td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 text-foreground"><code>mapbox</code></td>
                <td className="py-2 pr-4"><code>mapbox-gl</code></td>
                <td className="py-2 pr-4"><code>accessToken</code></td>
                <td className="py-2">No</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-foreground"><code>google</code></td>
                <td className="py-2 pr-4"><code>@googlemaps/js-api-loader</code></td>
                <td className="py-2 pr-4"><code>apiKey</code></td>
                <td className="py-2">No</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Map props
        </h2>
        <PropsTable props={mapProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          MapMarker props
        </h2>
        <PropsTable props={mapMarkerProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Accessibility
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Each provider includes its own ARIA roles and keyboard navigation; do not strip them.</li>
          <li>For static, decorative maps, pass <code>interactive={`{false}`}</code> to remove pan/zoom controls.</li>
          <li>Markers are DOM elements — give them meaningful content (text, an icon with a label, a Badge with a price) rather than empty divs.</li>
          <li>If you build a list ↔ map sync, ensure the list items are keyboard-focusable and dispatch hover state on focus too, not only on mouseenter.</li>
        </ul>
      </div>

      <SidecarBlock slug="map" />

      <ComponentNav currentHref="/components/map" />
    </div>
  );
}
