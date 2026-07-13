// Blocks/Map — MapClusterPin
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-map--cluster-pin
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  name: "MapClusterPin",
  render: args => {
    const {
      variant: variantName
    } = args as {
      variant?: string;
    };
    type Preset = {
      segments: {
        variant: GridPinVariant;
        count: number;
      }[];
      count: number;
    };
    const mixed: Preset = {
      segments: [{
        variant: "strong",
        count: 3
      }, {
        variant: "moderate",
        count: 4
      }, {
        variant: "weak",
        count: 2
      }],
      count: 9
    };
    const segmentPresets: Record<string, Preset> = {
      mixed,
      "all-strong": {
        segments: [{
          variant: "strong",
          count: 2
        }],
        count: 2
      },
      "all-unranked": {
        segments: [{
          variant: "unranked",
          count: 9
        }],
        count: 9
      },
      "even-split": {
        segments: [{
          variant: "strong",
          count: 3
        }, {
          variant: "moderate",
          count: 3
        }, {
          variant: "weak",
          count: 3
        }, {
          variant: "unranked",
          count: 3
        }],
        count: 5
      }
    };
    const preset = segmentPresets[variantName ?? "mixed"] ?? mixed;
    return <MapClusterPin count={preset.count} dataHook="map-cluster-pin-demo" segments={preset.segments} />;
  },
  args: {
    variant: "mixed"
  },
  argTypes: {
    variant: {
      control: {
        type: "select"
      },
      options: ["mixed", "all-strong", "all-unranked", "even-split"],
      description: "Preset segment distribution to display",
      table: {
        type: {
          summary: "string"
        },
        defaultValue: {
          summary: '"mixed"'
        }
      }
    },
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
      variant: "mixed",
      storyDescription: "Mixed variants"
    }, {
      variant: "all-strong",
      storyDescription: "Single variant"
    }, {
      variant: "even-split",
      storyDescription: "Even split (4 variants)"
    }],
    docs: {
      description: {
        story: "Cluster pin that visualises the ranking distribution of grouped map pins as a pie chart. " + "Each colored sector is proportional to the number of pins with that ranking variant; " + "the total count is displayed in the center.\n\n" + "Use `MapClusterPin` as a React component in stories or UI. " + "For Google Maps integration with `@googlemaps/markerclusterer`, use `createClusterPinElement()` instead."
      },
      source: {
        code: `<MapClusterPin
  dataHook="cluster"
  count={9}
  segments={[
    { variant: "strong", count: 3 },
    { variant: "moderate", count: 4 },
    { variant: "weak", count: 2 },
  ]}
/>`
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
    await step("Cluster pin renders with SVG pie chart", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      const pin = variant?.querySelector('[data-hook="map-cluster-pin-demo"]');
      expect(pin).toBeInTheDocument();
      expect(pin).toHaveAttribute("data-slot", "map-cluster-pin");
      const svg = pin?.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
    await step("Mixed variant has multiple pie sectors", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      const pin = variant?.querySelector('[data-hook="map-cluster-pin-demo"]');
      const paths = pin?.querySelectorAll("svg path");
      expect(paths?.length).toBeGreaterThan(1);
    });
    await step("Single variant renders as a full circle", async () => {
      const variant = getVariant(canvasElement, variants, 1);
      const pin = variant?.querySelector('[data-hook="map-cluster-pin-demo"]');
      const paths = pin?.querySelectorAll("svg path");
      expect(paths?.length ?? 0).toBe(0);
    });
    await step("Even split has four sectors", async () => {
      const variant = getVariant(canvasElement, variants, 2);
      const pin = variant?.querySelector('[data-hook="map-cluster-pin-demo"]');
      const paths = pin?.querySelectorAll("svg path");
      expect(paths?.length).toBe(4);
    });
  }
}
