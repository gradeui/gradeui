// Blocks/InputList — Default
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-inputlist--default
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  parameters: {
    docs: {
      description: {
        story: "InputList with items, an input field, and an add button."
      }
    },
    variants: [{
      storyDescription: "Default",
      value: ["Title", "Title", "Title"],
      description: "This is an input description."
    }, {
      storyDescription: "Loading",
      loading: true,
      skeletonCount: 3,
      value: []
    }, {
      storyDescription: "Disabled",
      disabled: true,
      value: ["Coffee beans", "Tea leaves", "Matcha powder"]
    }, {
      storyDescription: "Error",
      error: true,
      errorMessage: "Please add at least one keyword",
      value: []
    }, {
      storyDescription: "Custom labels (i18n)",
      value: ["Café", "Té"],
      removeAriaLabel: "Eliminar {item}"
    }, {
      storyDescription: "Reduced motion",
      forceReducedMotion: true,
      value: ["Title", "Title", "Title"]
    }]
  },
  play: async ({
    canvasElement,
    step,
    parameters
  }) => {
    if (!isMultiViewMode(canvasElement)) return;
    const variants = parameters.variants || [];
    await step("Default: renders input and items", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      const input = variant?.querySelector('[data-hook="input-list-input"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input).not.toBeDisabled();
      const items = variant?.querySelectorAll('[data-slot="item"]');
      expect(items?.length).toBe(3);
    });
    await step("Loading: renders skeleton rows", async () => {
      const variant = getVariant(canvasElement, variants, 1);
      const skeleton = variant?.querySelector('[data-slot="input-list-skeleton"]');
      expect(skeleton).toBeInTheDocument();
      const skeletonRows = skeleton?.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletonRows?.length).toBeGreaterThan(0);
    });
    await step("Disabled: input and remove buttons are disabled", async () => {
      const variant = getVariant(canvasElement, variants, 2);
      const input = variant?.querySelector('[data-hook="input-list-input"]') as HTMLInputElement;
      expect(input).toBeDisabled();
      const addButton = variant?.querySelector('[data-hook="input-list-add"]') as HTMLButtonElement;
      expect(addButton).toBeDisabled();
      const removeButton = variant?.querySelector('[data-hook="input-list-remove-0"]') as HTMLButtonElement;
      expect(removeButton).toBeDisabled();
    });
    await step("Error: shows error state and message", async () => {
      const variant = getVariant(canvasElement, variants, 3);
      const input = variant?.querySelector('[data-hook="input-list-input"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("aria-invalid", "true");
      const errorMessage = variant?.querySelector('[data-slot="field-error"]');
      expect(errorMessage).toBeInTheDocument();
    });
    await step("Test i18n - custom remove aria-label", async () => {
      const variant = getVariant(canvasElement, variants, 4);
      const removeButton = variant?.querySelector('[data-hook="input-list-remove-0"]') as HTMLButtonElement;
      expect(removeButton).toHaveAttribute("aria-label", "Eliminar Café");
    });
    await step("Reduced motion: items render at final state without flash", async () => {
      const variant = getVariant(canvasElement, variants, 5);
      // With reduced motion forced, motion.li uses initial={false}, so every
      // item is present and visible immediately (no enter animation).
      const items = variant?.querySelectorAll('[data-slot="item"]');
      expect(items?.length).toBe(3);
      items?.forEach(item => expect(item).toBeVisible());
    });
  }
}
