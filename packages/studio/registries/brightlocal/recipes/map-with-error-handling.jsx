// MapWithErrorHandling — Lazy-loaded Google Map with loading and error states using React.Suspense and an error boundary.
// keywords: map error handling, map loading state, lazy load map, map error boundary, map suspense, map fallback
// components: map
// Harvested from BrightLocal's DS MCP (get_composition_recipe "MapWithErrorHandling") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

import { MapLoadingState, MapErrorState } from "@brightlocal/ui-components/map";

const GoogleMap = React.lazy(() => import("./GoogleMap"));

function MapContainer({ dataHook }: { dataHook: string }) {
  const [error, setError] = React.useState<string | null>(null);

  if (error) {
    return (
      <MapErrorState
        dataHook={`${dataHook}-error`}
        title="Map unavailable"
        message={error}
        onRetry={() => setError(null)}
      />
    );
  }

  return (
    <React.Suspense fallback={<MapLoadingState dataHook={`${dataHook}-loading`} />}>
      <GoogleMap
        dataHook={dataHook}
        onError={(err) => setError(err.message)}
      />
    </React.Suspense>
  );
}
