// Blocks/Sidebar/SidebarGroup — Default
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-sidebar-sidebargroup--default
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  render: function Render(args) {
    return <SidebarProvider dataHook="provider" defaultOpen>
        <Sidebar dataHook="sidebar">
          <SidebarHeader>
            <Logo className="h-6" dataHook="sidebar-logo" />
          </SidebarHeader>
          <SidebarContent dataHook="content">
            <SidebarGroup {...args}>
              <SidebarGroupLabel dataHook="group-label">
                Quick Access
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <MenuItems items={topItems} />
              </SidebarGroupContent>
            </SidebarGroup>
            <Separator spacing="md" dataHook="sidebar-separator" />
            <SidebarGroup dataHook="group-tools">
              <SidebarGroupLabel dataHook="tools-label">
                Tools
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <MenuItems items={mainItems} />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>;
  },
  args: {
    dataHook: "sidebar-group"
  },
  parameters: {
    variants: [{
      storyDescription: "Default groups with labels"
    }]
  },
  play: async ({
    canvasElement,
    step,
    parameters
  }) => {
    if (!isMultiViewMode(canvasElement)) return;
    const variants = parameters.variants || [];
    await step("Test groups render with labels", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const groups = variant.querySelectorAll('[data-slot="sidebar-group"]');
      expect(groups.length).toBe(2);
      const labels = variant.querySelectorAll('[data-slot="sidebar-group-label"]');
      expect(labels.length).toBe(2);
    });
  }
}
