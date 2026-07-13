// Blocks/Sidebar/SidebarSwitcher — PopoverTrigger
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-sidebar-sidebarswitcher--popover-trigger
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  name: "PopoverTrigger",
  args: {
    dataHook: "popover-trigger"
  },
  render: function Render(args) {
    return <div className="bg-sidebar-background grid w-[260px] p-4">
        <SidebarPopoverTrigger className="min-w-0" dataHook={args.dataHook} icon={<Command size={12} />} triggerAriaLabel={(args as {
        triggerAriaLabel?: string;
      }).triggerAriaLabel}>
          {args.label || "Acme Inc"}
        </SidebarPopoverTrigger>
      </div>;
  },
  parameters: {
    docs: {
      description: {
        story: "Compact trigger button for workspace/team switcher. Shows an icon box, workspace name, and chevron-down indicator."
      }
    },
    variants: [{
      storyDescription: "Default"
    }, {
      label: "Very Long Workspace Name That Should Truncate",
      storyDescription: "Long text"
    }, {
      triggerAriaLabel: "Cambiar espacio de trabajo",
      storyDescription: "Custom label (i18n)"
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
    await step("Test default state renders correctly", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const trigger = variant.querySelector('[data-slot="sidebar-popover-trigger"]');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute("data-hook", "popover-trigger");
      expect(trigger).toHaveAttribute("aria-label", "Switch workspace");
    });
    await step("Test i18n custom label", async () => {
      const variant = getVariant(canvasElement, variants, 2);
      if (!variant) return;
      const trigger = variant.querySelector('[data-slot="sidebar-popover-trigger"]');
      expect(trigger).toHaveAttribute("aria-label", "Cambiar espacio de trabajo");
    });
  }
}
