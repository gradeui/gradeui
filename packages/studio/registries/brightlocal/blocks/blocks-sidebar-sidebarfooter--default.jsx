// Blocks/Sidebar/SidebarFooter — Default
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-sidebar-sidebarfooter--default
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  render: function Render(args) {
    return <SidebarProvider dataHook="provider" defaultOpen>
        <Sidebar dataHook="sidebar">
          <SidebarHeader>
            <Logo className="h-6" dataHook="sidebar-logo" />
          </SidebarHeader>
          <SidebarContent>
            <MenuItems items={topItems} />
            <Separator spacing="md" dataHook="sidebar-separator" />
            <MenuItems items={mainItems} />
          </SidebarContent>
          <SidebarFooter {...args}>
            <div className="flex items-center gap-2 rounded-md p-2 text-sm">
              <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                JD
              </div>
              <div className="flex flex-col">
                <span className="font-medium">John Doe</span>
                <span className="text-muted-foreground text-xs">
                  john@example.com
                </span>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>;
  },
  args: {
    dataHook: "sidebar-footer"
  },
  parameters: {
    variants: [{
      storyDescription: "Default with separator"
    }, {
      separator: false,
      storyDescription: "Without separator"
    }]
  },
  play: async ({
    canvasElement,
    step,
    parameters
  }) => {
    if (!isMultiViewMode(canvasElement)) return;
    const variants = parameters.variants || [];
    await step("Test footer renders with separator by default", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const footer = variant.querySelector('[data-slot="sidebar-footer"]');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveAttribute("data-hook", "sidebar-footer");
      const separator = variant.querySelector('[data-slot="sidebar-footer-separator"]');
      expect(separator).toBeInTheDocument();
    });
    await step("Test footer has shrink-0 class to prevent compression", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const footer = variant.querySelector('[data-slot="sidebar-footer"]');
      expect(footer).toHaveClass("shrink-0");
    });
    await step("Test separator hidden when separator={false}", async () => {
      const variant = getVariant(canvasElement, variants, 1);
      if (!variant) return;
      const footer = variant.querySelector('[data-slot="sidebar-footer"]');
      expect(footer).toBeInTheDocument();
      const separator = variant.querySelector('[data-slot="sidebar-footer-separator"]');
      expect(separator).not.toBeInTheDocument();
    });
  }
}
