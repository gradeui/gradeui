// Blocks/Sidebar/SidebarSwitcher — PopoverMenu
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-sidebar-sidebarswitcher--popover-menu
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  name: "PopoverMenu",
  args: {
    dataHook: "popover-menu"
  },
  render: function Render(args) {
    return <div className="bg-popover w-[316px] rounded-md border shadow-md">
        <SidebarPopoverMenu addActionLabel={(args as {
        addActionLabel?: string;
      }).addActionLabel} dataHook={args.dataHook} groupTitle={(args as {
        groupTitle?: string;
      }).groupTitle || "Teams"} items={sampleItems} onAddAction={() => {}} />
      </div>;
  },
  parameters: {
    docs: {
      description: {
        story: "Dropdown panel for the workspace/team switcher. Contains a group title, list of items with icon + text + shortcut, a separator, and an add action."
      }
    },
    variants: [{
      storyDescription: "Default with items"
    }, {
      groupTitle: "Equipos",
      addActionLabel: "Agregar equipo",
      storyDescription: "Custom labels (i18n)"
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
    await step("Test menu renders with items", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const menu = variant.querySelector('[data-slot="sidebar-popover-menu"]');
      expect(menu).toBeInTheDocument();
      const items = variant.querySelectorAll('[data-slot="sidebar-popover-menu-item"]');
      expect(items.length).toBe(4);
    });
    await step("Test group title present", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const menu = variant.querySelector('[data-slot="sidebar-popover-menu"]');
      expect(menu).toHaveTextContent("Teams");
    });
  }
}
