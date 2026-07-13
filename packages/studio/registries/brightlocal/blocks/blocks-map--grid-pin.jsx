// Blocks/Map — MapGridPin
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-map--grid-pin
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  name: "MapGridPin",
  render: args => {
    const {
      value,
      variant,
      loading
    } = args as {
      value?: number | string;
      variant?: "strong" | "moderate" | "weak" | "unranked" | "error";
      loading?: boolean;
    };
    return <MapGridPin dataHook="map-grid-pin-demo" loading={loading} variant={variant} value={value ?? 1} />;
  },
  args: {
    value: 1,
    variant: "strong"
  },
  argTypes: {
    value: {
      control: {
        type: "text"
      },
      description: "Value displayed inside the pin (number or short label)",
      table: {
        type: {
          summary: "number | string"
        }
      }
    },
    variant: {
      control: {
        type: "select"
      },
      options: ["strong", "moderate", "weak", "unranked", "error"],
      description: "Ranking strength variant — consumer controls this based on value thresholds",
      table: {
        type: {
          summary: '"strong" | "moderate" | "weak" | "unranked" | "error"'
        },
        defaultValue: {
          summary: '"strong"'
        }
      }
    },
    loading: {
      control: {
        type: "boolean"
      },
      description: "Show loading appearance (neutral styling, overrides variant colors)",
      table: {
        type: {
          summary: "boolean"
        },
        defaultValue: {
          summary: "false"
        }
      }
    },
    pulse: {
      control: {
        type: "boolean"
      },
      description: "@deprecated No longer rendered — kept for backward compatibility only",
      table: {
        type: {
          summary: "boolean"
        },
        defaultValue: {
          summary: "false"
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
      value: 1,
      variant: "strong",
      storyDescription: "Strong"
    }, {
      value: 5,
      variant: "moderate",
      storyDescription: "Moderate"
    }, {
      value: 15,
      variant: "weak",
      storyDescription: "Weak"
    }, {
      value: "-",
      variant: "unranked",
      storyDescription: "Unranked"
    }, {
      value: "!",
      variant: "error",
      storyDescription: "Error"
    }, {
      value: "",
      variant: "strong",
      loading: true,
      storyDescription: "Loading"
    }],
    docs: {
      description: {
        story: "Circular numbered pin with ranking strength variants. Accepts `variant` values: " + "strong, moderate, weak, unranked, error. Supports a `loading` state. " + "Legacy variant names (primary, secondary, destructive, outline, warning) are still accepted for backward compatibility."
      },
      source: {
        code: `<MapGridPin dataHook="rank-1" value={1} variant="strong" />
<MapGridPin dataHook="rank-5" value={5} variant="moderate" />
<MapGridPin dataHook="rank-15" value={15} variant="weak" />
<MapGridPin dataHook="rank-unranked" value="-" variant="unranked" />
<MapGridPin dataHook="rank-err" value="!" variant="error" />
<MapGridPin dataHook="rank-loading" value="" variant="strong" loading />`
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
    await step("Strong pin renders as a div with value", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      const pin = variant?.querySelector('[data-hook="map-grid-pin-demo"]');
      expect(pin).toBeInTheDocument();
      expect(pin?.tagName).toBe("DIV");
      expect(pin).toHaveClass("bg-primary");
    });
    await step("Moderate variant renders", async () => {
      const variant = getVariant(canvasElement, variants, 1);
      const pin = variant?.querySelector('[data-hook="map-grid-pin-demo"]');
      expect(pin).toBeInTheDocument();
      expect(pin).toHaveClass("bg-chart-4");
    });
    await step("Unranked variant renders", async () => {
      const variant = getVariant(canvasElement, variants, 3);
      const pin = variant?.querySelector('[data-hook="map-grid-pin-demo"]');
      expect(pin).toBeInTheDocument();
      expect(pin).toHaveClass("bg-red-600");
    });
    await step("Error variant renders", async () => {
      const variant = getVariant(canvasElement, variants, 4);
      const pin = variant?.querySelector('[data-hook="map-grid-pin-demo"]');
      expect(pin).toBeInTheDocument();
      expect(pin).toHaveClass("bg-warning-background");
    });
    await step("Loading state renders neutral styling", async () => {
      const variant = getVariant(canvasElement, variants, 5);
      const pin = variant?.querySelector('[data-hook="map-grid-pin-demo"]');
      expect(pin).toBeInTheDocument();
      expect(pin).toHaveAttribute("data-state", "loading");
      expect(pin).toHaveClass("bg-accent");
    });
  }
}
