// Blocks/Sidebar/SidebarGroup — Collapsible Label
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-sidebar-sidebargroup--collapsible-label
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  render: function Render() {
    const [isOpen, setIsOpen] = React.useState(true);
    return <SidebarProvider dataHook="provider" defaultOpen>
        <Sidebar dataHook="sidebar">
          <SidebarHeader>
            <Logo className="h-6" dataHook="sidebar-logo" />
          </SidebarHeader>
          <SidebarContent dataHook="content">
            <SidebarGroup dataHook="group-collapsible">
              <SidebarGroupLabel dataHook="label-collapsible" isOpen={isOpen} variant={SidebarGroupLabelVariant.COLLAPSIBLE} onToggle={() => setIsOpen(prev => !prev)}>
                Tools
              </SidebarGroupLabel>
              {isOpen && <SidebarGroupContent>
                  <MenuItems items={mainItems} />
                </SidebarGroupContent>}
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>;
  },
  parameters: {
    variants: [{
      storyDescription: "Collapsible group label"
    }]
  },
  play: async ({
    canvasElement,
    step,
    parameters
  }) => {
    if (!isMultiViewMode(canvasElement)) return;
    const variants = parameters.variants || [];
    await step("Test collapsible label toggles", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const label = variant.querySelector('[data-slot="sidebar-group-label"]') as HTMLElement;
      expect(label).toBeInTheDocument();
      expect(label).toHaveAttribute("data-variant", "collapsible");
      await userEvent.click(label);
    });
  }
}
