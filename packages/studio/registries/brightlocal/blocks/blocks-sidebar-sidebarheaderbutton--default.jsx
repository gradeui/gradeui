// Blocks/Sidebar/SidebarHeaderButton — Default
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-sidebar-sidebarheaderbutton--default
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  args: {
    dataHook: "header-button",
    "aria-label": "Toggle sidebar"
  },
  render: function Render(args) {
    return <div className="flex gap-2">
        <SidebarHeaderButton {...args}>
          <PanelLeft size={16} />
        </SidebarHeaderButton>
      </div>;
  },
  parameters: {
    variants: [{
      storyDescription: "Default"
    }, {
      disabled: true,
      storyDescription: "Disabled"
    }]
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
    await step("Test button renders", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const button = variant.querySelector('[data-slot="sidebar-header-button"]');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("data-hook", "header-button");
      expect(button).toHaveAttribute("aria-label", "Toggle sidebar");
    });
    await step("Test disabled state", async () => {
      const variant = getVariant(canvasElement, variants, 1);
      if (!variant) return;
      const button = variant.querySelector('[data-slot="sidebar-header-button"]');
      expect(button).toBeDisabled();
    });
    await step("Test focus state", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const button = variant.querySelector('[data-slot="sidebar-header-button"]') as HTMLElement;
      if (!button) return;
      await userEvent.click(button);
      expect(button).toHaveFocus();
    });
  }
}
