// Blocks/DataTable/DataTablePagination — Default
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-datatable-datatablepagination--default
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  parameters: {
    docs: {
      description: {
        story: "Client-side pagination driven by the table instance. 340 rows with a page size of 10."
      },
      source: {
        code: `<DataTablePagination table={table} dataHook="pagination" />`
      }
    },
    singleColumn: true,
    variants: [{
      storyDescription: "Default (page 1)",
      ariaLabel: "Default pagination"
    }, {
      showRowCount: false,
      storyDescription: "Without row count",
      ariaLabel: "Compact pagination"
    }]
  },
  args: {
    dataHook: "pagination",
    showRowCount: true
  },
  render: args => <PaginationDemo ariaLabel={args.ariaLabel as string} dataHook={args.dataHook as string} pageSize={10} rowCount={340} showRowCount={args.showRowCount as boolean} />,
  play: async ({
    canvasElement,
    step,
    parameters
  }) => {
    if (!isMultiViewMode(canvasElement)) return;
    const variants = parameters.variants || [];
    await step("Test default renders pagination controls", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (variant) {
        const pagination = variant.querySelector('[data-slot="data-table-pagination"]');
        expect(pagination).toBeInTheDocument();
        expect(pagination).toHaveAttribute("data-hook", "pagination");
        const nav = variant.querySelector("nav");
        expect(nav).toBeInTheDocument();
      }
    });
    await step("Test row count text is hidden", async () => {
      const variant = getVariant(canvasElement, variants, 1);
      if (variant) {
        const pagination = variant.querySelector('[data-slot="data-table-pagination"]');
        expect(pagination).toBeInTheDocument();
        const rowCountText = pagination?.querySelector("span.text-muted-foreground");
        expect(rowCountText).not.toBeInTheDocument();
        const nav = variant.querySelector("nav");
        expect(nav).toBeInTheDocument();
      }
    });
  }
}
