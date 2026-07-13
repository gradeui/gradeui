// Blocks/Map — MapLoadingState
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-map--loading-state
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  name: "MapLoadingState",
  render: args => {
    const {
      hideGrid
    } = args as {
      hideGrid?: boolean;
    };
    return <MapLoadingState className="w-full max-w-221.25" dataHook="map-loading-demo" style={{
      aspectRatio: "885/581"
    }}>
        {!hideGrid && <LoadingGridPins />}
      </MapLoadingState>;
  },
  argTypes: {
    dataHook: {
      control: {
        type: "text"
      },
      description: "Required test hook identifier",
      table: {
        type: {
          summary: "string"
        }
      }
    },
    trackingEl: {
      control: {
        type: "text"
      },
      description: "Analytics element identifier",
      table: {
        type: {
          summary: "string"
        }
      }
    },
    trackingLabel: {
      control: {
        type: "text"
      },
      description: "Analytics label",
      table: {
        type: {
          summary: "string"
        }
      }
    }
  },
  parameters: {
    variants: [{
      storyDescription: "With loading grid pins"
    }, {
      hideGrid: true,
      storyDescription: "Without grid pins"
    }],
    docs: {
      description: {
        story: "Loading placeholder for map containers. " + "Fills its parent with a map background image. Accepts `children` for consumer-provided content centered over the background. " + "Use as a Suspense fallback while the map provider is initialising.\n\n" + "Pass a grid of `<MapGridPin loading />` as children to show placeholder pins while the map loads."
      },
      source: {
        code: `<MapLoadingState dataHook="map-loading" className="w-full max-w-221.25" style={{ aspectRatio: "885/581" }} />

{/* With loading grid pins */}
<MapLoadingState dataHook="map-loading" className="w-full max-w-221.25" style={{ aspectRatio: "885/581" }}>
  <div className="grid grid-cols-7 gap-4">
    {Array.from({ length: 49 }, (_, i) => (
      <MapGridPin key={i} dataHook={\`pin-\${i}\`} loading value="" variant="strong" />
    ))}
  </div>
</MapLoadingState>`
      }
    }
  },
  play: async ({
    canvasElement,
    step,
    parameters
  }) => {
    if (!isMultiViewMode(canvasElement)) {
      return;
    }
    const variants = parameters.variants || [];
    await step("Default renders loading grid pins", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      const state = variant?.querySelector('[data-slot="map-loading-state"]');
      expect(state).toBeInTheDocument();
      expect(state).toHaveAttribute("role", "status");
      const pins = variant?.querySelectorAll('[data-slot="map-grid-pin"][data-state="loading"]');
      expect(pins?.length).toBe(49);
    });
    await step("Without grid pins variant has no pins", async () => {
      const variant = getVariant(canvasElement, variants, 1);
      const pins = variant?.querySelectorAll('[data-slot="map-grid-pin"]');
      expect(pins?.length).toBe(0);
    });
  }
}
