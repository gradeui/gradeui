// Blocks/Map — MapLocationPin
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-map--location-pin
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  name: "MapLocationPin",
  render: args => {
    const {
      icon: iconName,
      animateIn
    } = args as {
      icon?: string;
      animateIn?: boolean;
    };
    const iconMap: Record<string, React.ReactNode> = {
      Store: <Store size={16} />,
      MapPin: <MapPin size={16} />,
      LocateFixed: <LocateFixed size={16} />
    };
    return <MapLocationPin animateIn={animateIn} dataHook="map-location-pin-demo" icon={iconName ? iconMap[iconName] : undefined} />;
  },
  argTypes: {
    icon: {
      control: {
        type: "select"
      },
      options: ["Store", "MapPin", "LocateFixed"],
      description: "Icon rendered inside the pin marker. Defaults to Store icon.",
      table: {
        type: {
          summary: "React.ReactNode"
        },
        defaultValue: {
          summary: "<Store />"
        }
      }
    },
    animateIn: {
      control: {
        type: "boolean"
      },
      description: "Play a one-time entrance — the pin springs into place from its anchor point when it mounts",
      table: {
        category: "State",
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
      storyDescription: "Default"
    }, {
      icon: "LocateFixed",
      storyDescription: "With LocateFixed icon"
    }, {
      animateIn: true,
      storyDescription: "Spring entrance"
    }],
    docs: {
      description: {
        story: "Teardrop-shaped location pin with a sky-blue circle and an icon inside, " + "rendered as a non-focusable div for AdvancedMarkerElement compatibility. " + "Pass any icon via the `icon` prop — defaults to a Store icon."
      },
      source: {
        code: `<MapLocationPin dataHook="my-location" />

{/* With custom icon */}
<MapLocationPin dataHook="my-location" icon={<Store size={16} />} />`
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
    await step("Pin renders as a div with teardrop SVG", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      const pin = variant?.querySelector('[data-hook="map-location-pin-demo"]');
      expect(pin).toBeInTheDocument();
      expect(pin?.tagName).toBe("DIV");
      expect(pin).toHaveAttribute("data-slot", "map-location-pin");
      const svg = pin?.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
    await step("All variants render with SVG pin", async () => {
      for (let i = 0; i < variants.length; i++) {
        const variant = getVariant(canvasElement, variants, i);
        const pin = variant?.querySelector('[data-hook="map-location-pin-demo"]');
        expect(pin).toBeInTheDocument();
        expect(pin?.querySelector("svg")).toBeInTheDocument();
      }
    });
    await step("SVG circle has fixed sky-500 fill", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      const pin = variant?.querySelector('[data-hook="map-location-pin-demo"]');
      const circle = pin?.querySelector("circle");
      expect(circle).toBeInTheDocument();
      expect(circle).toHaveClass("fill-sky-500");
    });
  }
}
