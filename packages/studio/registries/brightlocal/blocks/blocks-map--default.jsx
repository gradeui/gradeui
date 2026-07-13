// Blocks/Map — Default
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-map--default
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  render: () => <MapExampleDemo />,
  parameters: {
    layout: "fullscreen",
    fullscreen: true,
    variants: [{}],
    docs: {
      description: {
        story: "**Default variant** — Full Google Maps integration using `@vis.gl/react-google-maps` with standard Google Maps styling. " + "Uses a vector map (`mapId` + `colorScheme`) for the default appearance. " + "Grid pins use `useMapPopoverClick` + `MapPopoverContent` for click-activated popovers. " + "Click is registered on `AdvancedMarker` (via `addListener`) to avoid the " + '"Focusable child elements in AdvancedMarkerElement" warning. ' + "Requires `VITE_GOOGLE_MAPS_API_KEY` and `VITE_GOOGLE_MAPS_MAP_ID` in `apps/docs/.env`.\n\n" + "For a desaturated map that draws less attention from overlay UI, see the **Muted** story."
      },
      source: {
        code: `const { activeItem, anchorItem, showItem, close } = useMapPopoverClick<Pin>();

<APIProvider apiKey={API_KEY}>
  <Map mapId={MAP_ID} defaultCenter={center} defaultZoom={14} onClick={close}>
    <MapPopover open={!!activeItem}>
      {pins.map((pin) => {
        const isAnchor = anchorItem?.id === pin.id;
        const gridPin = (
          <MapGridPin
            dataHook={\`pin-\${pin.id}\`}
            value={rankDisplay(pin.rank)}
            variant={rankVariant(pin.rank)}
          />
        );
        return (
          <AdvancedMarker
            key={pin.id}
            position={pin.position}
            onClick={() => showItem(pin)}
          >
            {isAnchor ? (
              <MapPopoverAnchor asChild>{gridPin}</MapPopoverAnchor>
            ) : (
              gridPin
            )}
          </AdvancedMarker>
        );
      })}

      <MapPopoverContent
        dataHook="grid-popover"
        onEscapeKeyDown={close}
      >
        {activeItem && <p>Rank: {activeItem.rank}</p>}
      </MapPopoverContent>
    </MapPopover>
  </Map>
</APIProvider>`
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
    await step("Map surface container renders", async () => {
      const surface = canvasElement.querySelector('[data-slot="map-surface"]');
      expect(surface).toBeInTheDocument();
    });
    await step("Fallback or live map renders", async () => {
      await waitFor(() => {
        const errorState = canvasElement.querySelector('[data-hook="map-no-key"]');
        const controlBtn = canvasElement.querySelector('[data-hook="zoom-in"]');
        expect(errorState || controlBtn).toBeInTheDocument();
      });
    });
    await step("Location pin toggle button renders", async () => {
      const toggle = canvasElement.querySelector('[data-hook="location-pin-toggle"]');
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveAttribute("data-slot", "map-control-button");
    });
  }
}
