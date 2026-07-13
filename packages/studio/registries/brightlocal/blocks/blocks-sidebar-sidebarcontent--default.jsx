// Blocks/Sidebar/SidebarContent — Default
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-sidebar-sidebarcontent--default
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  render: function Render(args) {
    return <SidebarProvider dataHook="provider" defaultOpen>
        <Sidebar dataHook="sidebar">
          <SidebarHeader>
            <Logo className="h-6" dataHook="sidebar-logo" />
          </SidebarHeader>
          <SidebarContent {...args}>
            <MenuItems items={topItems} />
            <Separator spacing="md" dataHook="sidebar-separator" />
            <MenuItems items={mainItems} />
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>;
  },
  args: {
    dataHook: "sidebar-content"
  },
  parameters: {
    variants: [{
      storyDescription: "Default with menu items and sub-items"
    }, {
      ariaLabel: "Custom navigation",
      storyDescription: "Custom aria-label"
    }]
  },
  play: async ({
    canvasElement,
    step,
    parameters
  }) => {
    if (!isMultiViewMode(canvasElement)) return;
    const variants = parameters.variants || [];
    await step("Test content renders with nav landmark", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const nav = variant.querySelector('[data-slot="sidebar-content"]');
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveAttribute("aria-label", "Sidebar");
    });
  }
}
