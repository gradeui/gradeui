// Blocks/Map — MapLegend
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-map--legend
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  name: "MapLegend",
  render: args => {
    const {
      variant
    } = args as {
      variant?: string;
    };
    if (variant === "minimal") {
      return <MapLegend dataHook="map-legend-demo">
          <MapLegendItem variant="strong" dataHook="legend-item-top">
            Top 3
          </MapLegendItem>
          <MapLegendItem variant="unranked" dataHook="legend-item-below">
            4+
          </MapLegendItem>
        </MapLegend>;
    }
    return <MapLegend dataHook="map-legend-demo">
        <MapLegendItem variant="strong" dataHook="legend-item-1">
          1–3
        </MapLegendItem>
        <MapLegendItem variant="moderate" dataHook="legend-item-2">
          4–10
        </MapLegendItem>
        <MapLegendItem variant="weak" dataHook="legend-item-3">
          11–20
        </MapLegendItem>
        <MapLegendItem variant="unranked" dataHook="legend-item-4">
          Over 20
        </MapLegendItem>
      </MapLegend>;
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
      storyDescription: "Grid rank legend"
    }, {
      variant: "minimal",
      storyDescription: "Minimal (two items)"
    }],
    docs: {
      description: {
        story: "Flexible pill-shaped legend container with `MapLegendItem` sub-components. " + "Pass `variant` to auto-match MapGridPin colors, or `color` for custom dots."
      },
      source: {
        code: `<MapLegend dataHook="rank-legend">
  <MapLegendItem variant="strong" dataHook="legend-1">1–3</MapLegendItem>
  <MapLegendItem variant="moderate" dataHook="legend-2">4–10</MapLegendItem>
  <MapLegendItem variant="weak" dataHook="legend-3">11–20</MapLegendItem>
  <MapLegendItem variant="unranked" dataHook="legend-4">Over 20</MapLegendItem>
</MapLegend>`
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
    await step("Legend container renders with data attributes", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      const legend = variant?.querySelector('[data-hook="map-legend-demo"]');
      expect(legend).toBeInTheDocument();
      expect(legend).toHaveAttribute("data-slot", "map-legend");
    });
    await step("Legend items render with dot and label", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      const items = variant?.querySelectorAll('[data-slot="map-legend-item"]');
      expect(items?.length).toBe(4);
    });
    await step("Minimal variant renders fewer items", async () => {
      const variant = getVariant(canvasElement, variants, 1);
      const legend = variant?.querySelector('[data-hook="map-legend-demo"]');
      expect(legend).toBeInTheDocument();
      const items = variant?.querySelectorAll('[data-slot="map-legend-item"]');
      expect(items?.length).toBe(2);
    });
  }
}
