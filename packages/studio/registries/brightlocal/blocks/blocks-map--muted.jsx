// Blocks/Map — Muted
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-map--muted
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  render: () => <MutedMapDemo />,
  parameters: {
    layout: "fullscreen",
    fullscreen: true,
    variants: [{}],
    docs: {
      description: {
        story: '**Muted variant** — Desaturated map styling using `useMapStyles("muted")`. ' + "The muted preset softens map colours so overlay UI (pins, legends, popovers) stands out more clearly.\n\n" + "In **light mode**, applies desaturation (`saturation: -40`) and lightening (`lightness: +20`) across all feature types. " + "In **dark mode**, applies the same dark colour palette as the default variant.\n\n" + "> Uses JSON styling (raster maps, no `mapId`). Requires `VITE_GOOGLE_MAPS_API_KEY` in `apps/docs/.env`."
      },
      source: {
        code: `import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { useMapStyles } from "@brightlocal/ui-components/map";

function MyMap() {
  const styles = useMapStyles("muted");

  return (
    <APIProvider apiKey={YOUR_API_KEY}>
      <Map
        defaultCenter={{ lat: 35.094, lng: -106.67 }}
        defaultZoom={14}
        disableDefaultUI
        styles={styles}
      />
    </APIProvider>
  );
}`
      }
    }
  },
  play: async ({
    canvasElement,
    step
  }) => {
    if (!isMultiViewMode(canvasElement)) {
      return;
    }
    await step("Muted map surface renders", async () => {
      const surface = canvasElement.querySelector('[data-hook="muted-map-surface"]');
      expect(surface).toBeInTheDocument();
    });
    await step("Fallback or live map renders", async () => {
      await waitFor(() => {
        const errorState = canvasElement.querySelector('[data-hook="map-no-key"]');
        const controlBtn = canvasElement.querySelector('[data-hook="zoom-in"]');
        expect(errorState || controlBtn).toBeInTheDocument();
      });
    });
  }
}
