// Blocks/Sidebar/SidebarSwitcher — Default
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-sidebar-sidebarswitcher--default
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  args: {
    dataHook: "team-switcher",
    label: "Acme Inc"
  },
  render: function Render(args) {
    return <SidebarProvider className="min-h-0" dataHook="story-sidebar-provider" defaultOpen>
        <div className="bg-sidebar-background p-4">
          <SidebarSwitcher dataHook={args.dataHook} icon={<Command size={12} />} label={args.label} triggerAriaLabel={args.triggerAriaLabel}>
            <SidebarPopoverMenu groupTitle="Teams" items={sampleItems} onAddAction={() => {}} />
          </SidebarSwitcher>
        </div>
      </SidebarProvider>;
  },
  parameters: {
    variants: [{
      storyDescription: "Closed (trigger visible)"
    }, {
      label: "Very Long Company Name That Truncates",
      storyDescription: "Long label"
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
    await step("Test trigger renders correctly", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const trigger = variant.querySelector('[data-hook="team-switcher-trigger"]');
      if (!trigger) return;
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent("Acme Inc");
    });
    await step("Test popover opens on click", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const trigger = variant.querySelector('[data-hook="team-switcher-trigger"]');
      if (!trigger) return;
      await userEvent.click(trigger);
      await waitFor(() => {
        const popoverContent = document.querySelector('[data-slot="popover-content"]');
        expect(popoverContent).toBeInTheDocument();
      });
      const menu = document.querySelector('[data-slot="sidebar-popover-menu"]');
      expect(menu).toBeInTheDocument();
      await userEvent.keyboard("{Escape}");
      await waitFor(() => {
        expect(document.querySelector('[data-slot="popover-content"]')).toBeNull();
      });
    });
  }
}
