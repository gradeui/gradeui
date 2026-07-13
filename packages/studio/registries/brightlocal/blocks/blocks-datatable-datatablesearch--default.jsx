// Blocks/DataTable/DataTableSearch — Default
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-datatable-datatablesearch--default
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  parameters: {
    docs: {
      description: {
        story: "Client-side global filter. Type to filter rows across all columns in real time."
      },
      source: {
        code: `<DataTableSearch
  table={table}
  dataHook="search"
  placeholder="Search by name..."
  ariaLabel="Search locations"
  className="w-55"
/>`
      }
    },
    variants: [{
      storyDescription: "Default"
    }]
  },
  render: () => <SearchDemo dataHook="search-demo" />,
  play: async ({
    canvasElement,
    step,
    parameters
  }) => {
    if (!isMultiViewMode(canvasElement)) return;
    const variants = parameters.variants || [];
    await step("Test search input renders", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (variant) {
        const search = variant.querySelector('[data-hook="search-demo"]');
        expect(search).toBeInTheDocument();
        const input = variant.querySelector("input");
        expect(input).toBeInTheDocument();
      }
    });
  }
}
