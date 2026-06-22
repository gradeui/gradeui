import { Map, MapMarker } from "@gradeui/ui";

/* Self-contained map island so Astro can hydrate it with one `client:load`.
   Default provider is leaflet (raster CARTO tiles, no API key), so it renders
   out of the box once `leaflet` is installed. Pass a tilerKey + provider="maplibre"
   later for vector tiles. */
export default function LocationMap({
  lng,
  lat,
  zoom = 15,
  label,
}: {
  lng: number;
  lat: number;
  zoom?: number;
  label?: string;
}) {
  return (
    <Map center={[lng, lat]} zoom={zoom} className="h-[440px] w-full overflow-hidden rounded-xl border border-border">
      <MapMarker id="loc" at={[lng, lat]}>
        <div className="flex flex-col items-center">
          {label ? (
            <span className="whitespace-nowrap rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
              {label}
            </span>
          ) : null}
          <span className="-mt-0.5 h-2.5 w-2.5 rotate-45 bg-primary"></span>
        </div>
      </MapMarker>
    </Map>
  );
}
