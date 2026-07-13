// Blocks/Map — MapControlButton
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-map--control-button
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  name: "MapControlButton",
  render: args => {
    const {
      disabled,
      iconOnly
    } = args as {
      disabled?: boolean;
      iconOnly?: boolean;
    };
    if (iconOnly === false) {
      return <div className="flex flex-col gap-2">
          <MapControlButton dataHook="ctrl-show-pin" disabled={disabled} iconOnly={false}>
            <MapPin size={16} />
            Show location pin
          </MapControlButton>
          <MapControlButton dataHook="ctrl-hide-pin" disabled={disabled} iconOnly={false}>
            <MapPinOff size={16} />
            Hide location pin
          </MapControlButton>
        </div>;
    }
    return <div className="flex gap-2">
        <MapControlButton aria-label="Zoom in" dataHook="ctrl-zoom-in" disabled={disabled}>
          <Plus />
        </MapControlButton>
        <MapControlButton aria-label="Zoom out" dataHook="ctrl-zoom-out" disabled={disabled}>
          <Minus />
        </MapControlButton>
        <MapControlButton aria-label="My location" dataHook="ctrl-locate" disabled={disabled}>
          <LocateFixed />
        </MapControlButton>
      </div>;
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
    disabled: {
      control: {
        type: "boolean"
      },
      description: "Disable the button",
      table: {
        type: {
          summary: "boolean"
        },
        defaultValue: {
          summary: "false"
        }
      }
    },
    iconOnly: {
      control: {
        type: "boolean"
      },
      description: "Render as compact icon-only button or with text",
      table: {
        type: {
          summary: "boolean"
        },
        defaultValue: {
          summary: "true"
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
      storyDescription: "Icon-only (default)"
    }, {
      disabled: true,
      storyDescription: "Disabled"
    }, {
      iconOnly: false,
      storyDescription: "With text (toggle)"
    }],
    docs: {
      description: {
        story: "Floating control buttons for map overlays. " + "Defaults to icon-only circular buttons. " + "Set `iconOnly={false}` for text-based toggles like show/hide location pin."
      },
      source: {
        code: `{/* Icon-only (default) */}
<MapControlButton aria-label="Zoom in" dataHook="zoom-in">
  <Plus />
</MapControlButton>

{/* With text */}
<MapControlButton dataHook="toggle-pin" iconOnly={false}>
  <MapPin size={16} />
  Show location pin
</MapControlButton>`
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
    await step("Icon-only control buttons render", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      const buttons = variant?.querySelectorAll('[data-slot="map-control-button"]');
      expect(buttons?.length).toBe(3);
    });
    await step("Disabled controls are non-interactive", async () => {
      const variant = getVariant(canvasElement, variants, 1);
      const button = variant?.querySelector('[data-hook="ctrl-zoom-in"]');
      expect(button).toBeDisabled();
    });
    await step("Text-mode toggle buttons render", async () => {
      const variant = getVariant(canvasElement, variants, 2);
      const buttons = variant?.querySelectorAll('[data-slot="map-control-button"]');
      expect(buttons?.length).toBe(2);
      expect(buttons?.[0]).toHaveAttribute("data-hook", "ctrl-show-pin");
      expect(buttons?.[1]).toHaveAttribute("data-hook", "ctrl-hide-pin");
    });
  }
}
