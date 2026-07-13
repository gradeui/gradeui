// Blocks/Map — MapErrorState
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-map--error-state
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  name: "MapErrorState",
  render: args => {
    const {
      title,
      message,
      retryLoading,
      retryLabel,
      hideRetry
    } = args as {
      title?: string;
      message?: string;
      retryLoading?: boolean;
      retryLabel?: string;
      hideRetry?: boolean;
    };
    return <MapErrorState className="w-full max-w-221.25" dataHook="map-error-demo" message={message} onRetry={hideRetry ? undefined : () => {}} retryLabel={retryLabel} retryLoading={retryLoading} style={{
      aspectRatio: "885/581"
    }} title={title} />;
  },
  argTypes: {
    title: {
      control: {
        type: "text"
      },
      description: "Error title",
      table: {
        category: "i18n",
        type: {
          summary: "string"
        },
        defaultValue: {
          summary: '"We couldn\'t load your map rankings."'
        }
      }
    },
    message: {
      control: {
        type: "text"
      },
      description: "Error description",
      table: {
        category: "i18n",
        type: {
          summary: "string"
        },
        defaultValue: {
          summary: '"Reloading usually fixes it, and it won\'t use any credits"'
        }
      }
    },
    retryLabel: {
      control: {
        type: "text"
      },
      description: "Label for the retry button",
      table: {
        category: "i18n",
        type: {
          summary: "string"
        },
        defaultValue: {
          summary: '"Reload"'
        }
      }
    },
    retryLoading: {
      control: {
        type: "boolean"
      },
      description: "Show the retry button in its loading state while the map reloads",
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
    onRetry: {
      control: false,
      description: "Retry callback. When provided, renders a retry button. Omit to hide the button entirely.",
      table: {
        type: {
          summary: "() => void"
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
      retryLoading: true,
      storyDescription: "Retry loading"
    }, {
      title: "API key invalid",
      message: "Check your Google Maps API key configuration.",
      retryLabel: "Try again",
      storyDescription: "Custom messaging"
    }],
    docs: {
      description: {
        story: "Error state for map containers. Displays the Globey fixing-fault illustration, title, message, and optional retry button. " + "Set `retryLoading` to show the button's loading spinner while the map reloads."
      },
      source: {
        code: `{/* With retry button */}
<MapErrorState dataHook="map-error" onRetry={() => refetch()} />

{/* Without retry button */}
<MapErrorState dataHook="map-error" title="Map unavailable" />

{/* Retry in loading state */}
<MapErrorState
  dataHook="map-error"
  onRetry={() => refetch()}
  retryLoading={isReloading}
/>

{/* Custom messaging */}
<MapErrorState
  dataHook="map-error"
  title="API key invalid"
  message="Check your Google Maps API key configuration."
  retryLabel="Try again"
  onRetry={() => refetch()}
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
    await step("Error state has alert role and illustration", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      const state = variant?.querySelector('[data-slot="map-error-state"]');
      expect(state).toBeInTheDocument();
      expect(state).toHaveAttribute("role", "alert");
      const illustration = variant?.querySelector('[data-slot="map-error-illustration"] [data-slot="globey-fixing-fault"]');
      expect(illustration).toBeInTheDocument();
    });
    await step("Retry button renders by default", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      const btn = variant?.querySelector('[data-hook="map-error-demo-retry"]');
      expect(btn).toBeInTheDocument();
    });
    await step("Retry button shows loading spinner", async () => {
      const variant = getVariant(canvasElement, variants, 1);
      const btn = variant?.querySelector('[data-hook="map-error-demo-retry"]');
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveAttribute("aria-busy", "true");
      expect(btn?.querySelector('[data-slot="button-loading-icon"]')).toBeInTheDocument();
    });
  }
}
