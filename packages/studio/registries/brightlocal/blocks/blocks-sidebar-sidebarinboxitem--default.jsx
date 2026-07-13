// Blocks/Sidebar/SidebarInboxItem — Default
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-sidebar-sidebarinboxitem--default
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  args: {
    dataHook: "inbox-item",
    senderName: "William Smith",
    title: "Meeting Tomorrow",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit interdum hendrerit ex vitae sodales.",
    timestamp: "09:34 AM"
  },
  render: function Render(args) {
    return <div className="flex w-full flex-col">
        <SidebarInboxItem dataHook={args.dataHook} description={args.description} senderName={args.senderName} timestamp={args.timestamp} title={args.title} />
      </div>;
  },
  parameters: {
    variants: [{
      storyDescription: "Default"
    }, {
      senderName: "Alice Johnson",
      title: "Project Update",
      description: "The project deadline has been moved to next Friday. Please review the updated timeline.",
      timestamp: "Yesterday",
      storyDescription: "Different content"
    }, {
      senderName: "Bob Wilson",
      title: "Quick Note",
      storyDescription: "Without description"
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
    await step("Test default item renders", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const item = variant.querySelector('[data-slot="sidebar-inbox-item"]');
      expect(item).toBeInTheDocument();
      expect(item).toHaveAttribute("data-hook", "inbox-item");
      expect(item).toHaveTextContent("William Smith");
      expect(item).toHaveTextContent("Meeting Tomorrow");
      expect(item).toHaveTextContent("09:34 AM");
    });
    await step("Test item without description", async () => {
      const variant = getVariant(canvasElement, variants, 2);
      if (!variant) return;
      const item = variant.querySelector('[data-slot="sidebar-inbox-item"]');
      expect(item).toBeInTheDocument();
      expect(item).toHaveTextContent("Quick Note");
    });
  }
}
